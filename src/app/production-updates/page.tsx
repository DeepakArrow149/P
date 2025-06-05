
'use client';

import * as React from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ClipboardEdit, Download, Edit, MoreHorizontal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
import { getAllOrders, type StoredOrder } from '@/lib/orderService';
import { ProductionUpdateDialog } from '@/components/production-updates/ProductionUpdateDialog'; // New Dialog
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface DisplayOrder {
  id: string;
  orderNo: string;
  buyer: string;
  styleName: string;
  quantity: number;
  shipDate: string;
  status: string;
  // Add other fields from StoredOrder that might be needed in the dialog
  product?: string;
  customer?: string;
  // ... any other relevant fields from StoredOrder
}

const getStatusBadgeVariant = (status: string) => {
  switch (status.toLowerCase()) {
    case 'completed': return 'default';
    case 'in_progress': return 'secondary';
    case 'unscheduled': return 'outline';
    case 'pending': return 'outline';
    case 'delayed': return 'destructive';
    case 'on hold': return 'secondary';
    case 'cancelled': return 'destructive';
    case 'scheduled': return 'default'; // Added scheduled as a possible status
    default: return 'outline';
  }
};

export default function ProductionUpdatesPage() {
  const { toast } = useToast();
  const [orders, setOrders] = React.useState<DisplayOrder[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = React.useState(false);
  const [selectedOrderForUpdate, setSelectedOrderForUpdate] = React.useState<DisplayOrder | null>(null);

  const fetchOrders = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedDBOrders: StoredOrder[] = await getAllOrders();
      const formattedOrders: DisplayOrder[] = fetchedDBOrders.map(o => {
        // Calculate total quantity from size quantities
        let totalQuantity = 0;
        if (o.poLines && Array.isArray(o.poLines)) {
          totalQuantity = o.poLines.reduce((sum, poLine) => {
            if (poLine.sizeQuantities && Array.isArray(poLine.sizeQuantities)) {
              return sum + poLine.sizeQuantities.reduce((itemSum, item) => itemSum + (item.quantity || 0), 0);
            }
            return sum;
          }, 0);
        }

        // Get ship date from delivery details or fallback to order ship date
        let shipDate = 'N/A';
        if (o.deliveryDetails && o.deliveryDetails.length > 0 && o.deliveryDetails[0].deliveryDate) {
          try {
            shipDate = format(parseISO(o.deliveryDetails[0].deliveryDate), 'MMM dd, yyyy');
          } catch (e) {
            console.warn(`Invalid delivery date for order ${o.id}`);
          }
        } else if (o.shipDate) {
          try {
            shipDate = format(parseISO(o.shipDate), 'MMM dd, yyyy');
          } catch (e) {
            console.warn(`Invalid ship date for order ${o.id}`);
          }
        }

        return {
          id: o.id,
          orderNo: o.orderReference,
          buyer: o.buyer || o.customer || 'Unknown',
          styleName: o.styleName || o.product || 'Unknown',
          quantity: totalQuantity,
          shipDate,
          status: o.status,
          product: o.product,
          customer: o.customer,
        };
      });
      setOrders(formattedOrders);
    } catch (error) {
      console.error("Error fetching orders for production updates:", error);
      toast({ title: "Error", description: "Could not fetch orders.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleOpenUpdateDialog = (order: DisplayOrder) => {
    setSelectedOrderForUpdate(order);
    setIsUpdateDialogOpen(true);
  };

  const handleSaveProductionUpdate = (updatedData: any) => {
    // Placeholder for actual save logic
    console.log("Saving production update:", updatedData, "for order:", selectedOrderForUpdate?.id);
    toast({ title: "Update Saved (Mock)", description: `Production update for order ${selectedOrderForUpdate?.orderNo} has been logged.` });
    setIsUpdateDialogOpen(false);
  };

  return (
    <>
      <PageHeader
        title="Production Updates"
        description="Track and update the progress of orders through various production stages."
        actions={
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" /> Export Updates
            </Button>
            {/* Add other relevant actions here, e.g., "Bulk Update" */}
          </div>
        }
      />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Orders Awaiting/In Production</CardTitle>
          <CardDescription>Select an order to update its production progress.</CardDescription>
        </CardHeader>
        <CardContent>
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
                      <Button variant="outline" size="sm" onClick={() => handleOpenUpdateDialog(order)}>
                        <ClipboardEdit className="mr-2 h-4 w-4" /> Update Progress
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              No orders found.
            </div>
          )}
        </CardContent>
      </Card>

      {selectedOrderForUpdate && (
        <ProductionUpdateDialog
          isOpen={isUpdateDialogOpen}
          onOpenChange={setIsUpdateDialogOpen}
          order={selectedOrderForUpdate}
          onSubmit={handleSaveProductionUpdate}
        />
      )}
    </>
  );
}
