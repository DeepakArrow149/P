
'use client';

import * as React from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, PlusCircle, Download, Eye, Edit, Trash2, BarChartHorizontalBig, History } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent as UIDialogContent, 
  DialogHeader as UIDialogHeader,   
  DialogTitle as UIDialogTitleComponent, 
  DialogDescription as UIDialogDescriptionComponent, 
  DialogClose
} from "@/components/ui/dialog";
import type { LucideIcon } from 'lucide-react';
import { getAllOrders, updateOrderStatus, type StoredOrder } from '@/lib/orderService';
import { format, parseISO } from 'date-fns';
import { OperationProgressDialog } from '@/components/order-list/OperationProgressDialog';
import { OrderLogDialog } from '@/components/order-list/OrderLogDialog';

interface DisplayOrder {
  id: string;
  orderNo: string;
  buyer: string;
  styleName: string;
  quantity: number;
  shipDate: string;
  status: string;
  timelineEvents?: TimelineEvent[];
  product?: string; 
  customer?: string; 
}

interface TimelineEvent {
  id: string;
  title: string;
  date: string;
  description: string;
  icon: LucideIcon;
  iconClass?: string;
}

const getStatusBadgeVariant = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'completed': return 'default';
    case 'in_progress': return 'secondary';
    case 'unscheduled': return 'outline';
    case 'pending': return 'outline';
    case 'delayed': return 'destructive';
    case 'on_hold': return 'secondary'; 
    case 'on hold': return 'secondary'; 
    case 'cancelled': return 'destructive';
    case 'scheduled': return 'default';
    case 'provisional': return 'outline';
    case 'confirmed': return 'default';
    case 'speculative': return 'outline';
    case 'transit': return 'secondary';
    default: return 'outline';
  }
};


export default function OrderListPage() {
  const { toast } = useToast();
  const [orders, setOrders] = React.useState<DisplayOrder[]>([]);
  const [selectedOrderForCancel, setSelectedOrderForCancel] = React.useState<DisplayOrder | null>(null);
  const [isCancelAlertOpen, setIsCancelAlertOpen] = React.useState(false);
  const [selectedOrderForDetails, setSelectedOrderForDetails] = React.useState<DisplayOrder | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = React.useState(false);
  const [selectedOrderForProgress, setSelectedOrderForProgress] = React.useState<DisplayOrder | null>(null);
  const [isOperationProgressDialogOpen, setIsOperationProgressDialogOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedOrderForLog, setSelectedOrderForLog] = React.useState<DisplayOrder | null>(null);
  const [isLogDialogOpen, setIsLogDialogOpen] = React.useState(false);

  const fetchOrders = React.useCallback(async () => {
    setIsLoading(true);
    try {
      console.log('=== STARTING ORDER FETCH ===');
      const fetchedDBOrders: StoredOrder[] = await getAllOrders();
      console.log('Raw fetched orders count:', fetchedDBOrders.length);
      console.log('Raw sample orders:', fetchedDBOrders.slice(0, 2));
      
      if (fetchedDBOrders.length === 0) {
        console.warn('No orders returned from getAllOrders()');
        setOrders([]);
        return;
      }
      
      const formattedOrders: DisplayOrder[] = fetchedDBOrders.map(o => {
        let orderQuantity = 0;
        if (o.poLines && Array.isArray(o.poLines)) {
          orderQuantity = o.poLines.reduce((sum, poLine) => {
            if (poLine.sizeQuantities && Array.isArray(poLine.sizeQuantities)) {
              return sum + poLine.sizeQuantities.reduce((itemSum, item) => itemSum + (item.quantity || 0), 0);
            }
            return sum;
          }, 0);
        }

        let firstDeliveryDate = 'N/A';
        if (o.deliveryDetails && o.deliveryDetails.length > 0 && o.deliveryDetails[0].deliveryDate) {
          try {
            firstDeliveryDate = format(parseISO(o.deliveryDetails[0].deliveryDate), 'MMM dd, yyyy');
          } catch (e) {
            console.warn(`Invalid delivery date for order ${o.id}: ${o.deliveryDetails[0].deliveryDate}`);
          }
        } else if (o.poLines && o.poLines.length > 0 && o.poLines[0].deliveryDate) {
            try {
              firstDeliveryDate = format(parseISO(o.poLines[0].deliveryDate), 'MMM dd, yyyy');
            } catch(e) {
              console.warn(`Invalid PO line delivery date for order ${o.id}: ${o.poLines[0].deliveryDate}`);
            }
        }

        return {
          id: o.id!,
          orderNo: o.orderReference || 'N/A',
          buyer: o.customer || 'N/A', 
          styleName: o.product || 'N/A', 
          quantity: orderQuantity,
          shipDate: firstDeliveryDate,
          status: o.status || 'unknown',
          timelineEvents: [], 
          product: o.product,
          customer: o.customer,
        };
      });
      console.log('=== FORMATTED ORDERS ===');
      console.log('Formatted orders count:', formattedOrders.length);
      console.log('Sample formatted orders:', formattedOrders.slice(0, 2));
      console.log('=== SETTING ORDERS STATE ===');
      setOrders(formattedOrders);
      console.log('Orders state updated');
    } catch (error) {
      console.error("=== ERROR FETCHING ORDERS ===", error);
      toast({ title: "Error", description: "Could not fetch orders.", variant: "destructive" });
    } finally {
      setIsLoading(false);
      console.log('=== FETCH COMPLETE ===');
    }
  },[toast]);

  React.useEffect(() => {
    console.log('=== ORDER LIST COMPONENT MOUNTED ===');
    fetchOrders();
  }, [fetchOrders]);

  // Add effect to monitor orders state changes
  React.useEffect(() => {
    console.log('=== ORDERS STATE CHANGED ===');
    console.log('Current orders count:', orders.length);
    console.log('isLoading:', isLoading);
    if (orders.length > 0) {
      console.log('Sample orders in state:', orders.slice(0, 2).map(o => ({ 
        id: o.id, 
        orderNo: o.orderNo, 
        buyer: o.buyer, 
        status: o.status 
      })));
    }
  }, [orders, isLoading]);


  const handleViewDetails = (order: DisplayOrder) => {
    setSelectedOrderForDetails(order);
    setIsDetailsDialogOpen(true);
  };

  const handleEditOrder = (order: DisplayOrder) => {
    toast({
      title: `Editing Order: ${order.orderNo}`,
      description: `Placeholder for editing order functionality.`,
    });
  };

  const promptCancelOrder = (order: DisplayOrder) => {
    setSelectedOrderForCancel(order);
    setIsCancelAlertOpen(true);
  };

  const handleConfirmCancelOrder = async () => {
    if (selectedOrderForCancel && selectedOrderForCancel.id) {
      try {
        await updateOrderStatus(selectedOrderForCancel.id, 'cancelled');
        toast({
          title: 'Order Cancelled',
          description: `Order ${selectedOrderForCancel.orderNo} has been marked as cancelled.`,
        });
        fetchOrders(); 
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to cancel the order. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setSelectedOrderForCancel(null);
        setIsCancelAlertOpen(false);
      }
    }
  };

  const handleOpenOperationProgress = (order: DisplayOrder) => {
    setSelectedOrderForProgress(order);
    setIsOperationProgressDialogOpen(true);
  };

  const handleOpenLogDialog = (order: DisplayOrder) => {
    setSelectedOrderForLog(order);
    setIsLogDialogOpen(true);
  };

  return (
    <>
      <PageHeader
        title="All Orders"
        description="View and manage all production orders."
        actions={
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" /> Export List
            </Button>
            <Link href="/new-order">
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> Create New Order
              </Button>
            </Link>
          </div>
        }
      />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Order Overview</CardTitle>
          <CardDescription>A comprehensive list of all registered orders.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-2 bg-yellow-100 border border-yellow-300 rounded">
            <strong>Debug Info:</strong> Loading: {isLoading.toString()}, Orders Count: {orders.length}
          </div>
          {isLoading ? (
             <div className="text-center py-10 text-muted-foreground">Loading orders...</div>
          ) : orders.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order No.</TableHead>
                  <TableHead>Buyer</TableHead>
                  <TableHead>Style Name</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead>Ship Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.orderNo}</TableCell>
                    <TableCell>{order.buyer}</TableCell>
                    <TableCell>{order.styleName}</TableCell>
                    <TableCell className="text-right">{order.quantity.toLocaleString()}</TableCell>
                    <TableCell>{order.shipDate}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(order.status)}>{order.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleViewDetails(order)}>
                            <Eye className="mr-2 h-4 w-4" /> View Details
                          </DropdownMenuItem>
                           <DropdownMenuItem onClick={() => handleOpenOperationProgress(order)}>
                            <BarChartHorizontalBig className="mr-2 h-4 w-4" /> Operation Progress
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleOpenLogDialog(order)}>
                            <History className="mr-2 h-4 w-4" /> View Log
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditOrder(order)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit Order
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {order.status !== 'cancelled' && (
                            <DropdownMenuItem
                              onClick={() => promptCancelOrder(order)}
                              className="text-destructive focus:text-destructive focus:bg-destructive/10"
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Cancel Order
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              No orders found. <Link href="/new-order" className="text-primary hover:underline">Create a new order</Link> to get started.
            </div>
          )}
        </CardContent>
      </Card>

      {selectedOrderForCancel && (
        <AlertDialog open={isCancelAlertOpen} onOpenChange={setIsCancelAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to cancel this order?</AlertDialogTitle>
              <AlertDialogDescription>
                Order No: {selectedOrderForCancel.orderNo} <br />
                Style: {selectedOrderForCancel.styleName} <br />
                This action will mark the order as 'cancelled'.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setSelectedOrderForCancel(null)}>Close</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmCancelOrder} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                Confirm Cancel
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {selectedOrderForDetails && (
        <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
          <UIDialogContent className="sm:max-w-md md:max-w-lg lg:max-w-2xl">
            <UIDialogHeader>
              <UIDialogTitleComponent className="text-xl">Order Details: {selectedOrderForDetails.orderNo}</UIDialogTitleComponent>
              <UIDialogDescriptionComponent>
                Buyer: {selectedOrderForDetails.buyer} | Style: {selectedOrderForDetails.styleName} | Qty: {selectedOrderForDetails.quantity}
              </UIDialogDescriptionComponent>
            </UIDialogHeader>
            <div className="py-4 max-h-[60vh] overflow-y-auto">
              <h3 className="text-md font-semibold mb-4">Order Timeline</h3>
              {selectedOrderForDetails.timelineEvents && selectedOrderForDetails.timelineEvents.length > 0 ? (
                <div className="flex flex-col relative border-l-2 border-border ml-4 space-y-8 py-2 pr-2">
                  {selectedOrderForDetails.timelineEvents.map((event) => {
                    const IconComponent = event.icon;
                    return (
                      <div key={event.id} className="relative pl-8 transition-all duration-300 ease-in-out hover:scale-[1.02]">
                        <div className={`w-10 h-10 flex items-center justify-center rounded-full absolute -left-5 ring-4 ring-background ${event.iconClass || 'bg-primary text-primary-foreground'}`}>
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <div className="p-3 bg-card border border-border rounded-lg shadow-sm ml-3 hover:shadow-md">
                          <h4 className="font-semibold text-foreground">{event.title}</h4>
                          <p className="text-xs text-muted-foreground">{event.date}</p>
                          <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">No timeline events available for this order.</p>
              )}
            </div>
             <div className="sm:flex sm:flex-row-reverse pt-4 border-t">
                <DialogClose asChild>
                    <Button type="button" variant="outline">Close</Button>
                </DialogClose>
            </div>
          </UIDialogContent>
        </Dialog>
      )}
      {selectedOrderForProgress && (
        <OperationProgressDialog
          isOpen={isOperationProgressDialogOpen}
          onOpenChange={setIsOperationProgressDialogOpen}
          order={selectedOrderForProgress}
          // onSubmit={handleSaveProductionProgress} // Uncomment if actual save logic is needed
        />
      )}
      {selectedOrderForLog && (
        <OrderLogDialog
          isOpen={isLogDialogOpen}
          onOpenChange={setIsLogDialogOpen}
          order={selectedOrderForLog}
        />
      )}
    </>
  );
}
