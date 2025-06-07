
'use client';

import * as React from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckSquare, Clock, Package, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useLineApi } from '@/hooks/useLineApi';
import { useLineGroupApi } from '@/hooks/useLineGroupApi';
import { getUnscheduledOrders, updateOrderStatus, type StoredOrder } from '@/lib/orderService'; // Import MySQL-based services
import { format, parseISO } from 'date-fns';
import type { UnscheduledOrder as PlanViewUnscheduledOrder } from '@/components/plan-view/types';


const scheduleOrderFormSchema = z.object({
  unitId: z.string().min(1, 'Unit selection is required.'),
  lineId: z.string().min(1, 'Line selection is required.'),
});

type ScheduleOrderFormValues = z.infer<typeof scheduleOrderFormSchema>;

export default function UnscheduledOrdersPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { lines, searchLines } = useLineApi();
  const { lineGroups, searchLineGroups } = useLineGroupApi();
  const [isSchedulingDialogOpen, setIsSchedulingDialogOpen] = React.useState(false);
  const [selectedOrderForScheduling, setSelectedOrderForScheduling] = React.useState<PlanViewUnscheduledOrder | null>(null);
  const [currentUnscheduledOrders, setCurrentUnscheduledOrders] = React.useState<PlanViewUnscheduledOrder[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const unitsForSelect = React.useMemo(() => 
    lineGroups.map((group) => ({ id: group.id?.toString() || '', name: group.groupName })),
    [lineGroups] 
  );

  const linesForSelect = React.useMemo(() => 
    lines.map((line) => ({ id: line.id, unitId: line.unitId, name: line.lineName })),
    [lines] 
  );

  // Load data on mount
  React.useEffect(() => {
    searchLineGroups({ isActive: true });
    searchLines(); // Remove { active: true } as it's not supported in LineSearchParams
  }, [searchLineGroups, searchLines]);


  const form = useForm<ScheduleOrderFormValues>({
    resolver: zodResolver(scheduleOrderFormSchema),
    defaultValues: {
      unitId: '',
      lineId: '',
    },
  });

  const watchedUnitId = form.watch('unitId');
  const availableLines = React.useMemo(() => {
    if (!watchedUnitId) return [];
    return linesForSelect.filter((line: { id: string; unitId?: string; name: string }) => line.unitId === watchedUnitId);
  }, [watchedUnitId]);

  const fetchUnscheduled = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedDBOrders: StoredOrder[] = await getUnscheduledOrders();
      const formatted: PlanViewUnscheduledOrder[] = fetchedDBOrders.map(o => {
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

        return {
          id: o.id,
          buyer: o.buyer || 'Unknown',
          style: o.styleName || 'Unknown',
          quantity: totalQuantity,
          requestedShipDate: o.shipDate ? format(parseISO(o.shipDate), 'yyyy-MM-dd') : 'N/A',
          reason: o.status === 'unscheduled' ? 'Awaiting scheduling' : o.status,
          learningCurveId: o.learningCurveId,
        };
      });
      setCurrentUnscheduledOrders(formatted);
    } catch (error) {
      console.error("Error fetching unscheduled orders:", error);
      toast({ title: "Error", description: "Could not fetch unscheduled orders.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchUnscheduled();
  }, [fetchUnscheduled]);


  React.useEffect(() => {
    if (watchedUnitId) {
        const currentLineIsValid = availableLines.some((line: { id: string; unitId?: string; name: string }) => line.id === form.getValues('lineId'));
        if (!currentLineIsValid) {
            form.setValue('lineId', '');
        }
    }
  }, [watchedUnitId, availableLines, form]);


  const handleOpenScheduleDialog = (order: PlanViewUnscheduledOrder) => {
    setSelectedOrderForScheduling(order);
    form.reset(); 
    setIsSchedulingDialogOpen(true);
  };

  const onConfirmSchedule = async (data: ScheduleOrderFormValues) => {
    if (!selectedOrderForScheduling || !selectedOrderForScheduling.id) return;

    const unitName = unitsForSelect.find((u: { id: string; name: string }) => u.id === data.unitId)?.name || data.unitId;
    const lineName = linesForSelect.find((l: { id: string; unitId?: string; name: string }) => l.id === data.lineId)?.name || data.lineId;
    
    try {
      await updateOrderStatus(selectedOrderForScheduling.id, 'scheduled');
      toast({
        title: 'Order Scheduled',
        description: `Order ${selectedOrderForScheduling.id} assigned to Unit ${unitName} / Line ${lineName}. Redirecting to Plan View.`,
      });

      fetchUnscheduled(); 

      setIsSchedulingDialogOpen(false);
      
      const queryParams = new URLSearchParams({
        orderId: selectedOrderForScheduling.id,
        styleName: selectedOrderForScheduling.style,
        reqShipDate: selectedOrderForScheduling.requestedShipDate,
        lineId: data.lineId, 
        quantity: selectedOrderForScheduling.quantity.toString(),
        buyerName: selectedOrderForScheduling.buyer,
      });
      if (selectedOrderForScheduling.learningCurveId) {
        queryParams.append('learningCurveId', selectedOrderForScheduling.learningCurveId);
      }
      router.push(`/plan-view?${queryParams.toString()}`);
      
      setSelectedOrderForScheduling(null); 
    } catch (error) {
      console.error("Error scheduling order:", error);
      toast({ title: "Error", description: "Failed to schedule order. Please try again.", variant: "destructive" });
    }
  };

  return (
    <>
      <PageHeader
        title="Unscheduled Orders"
        description="Orders awaiting placement on the production timeline."
      />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Pending Scheduling</CardTitle>
          <CardDescription>
            These orders need to be scheduled. Click &quot;Schedule&quot; to assign an order to a unit and line.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <div className="text-center py-10 text-muted-foreground">Loading unscheduled orders...</div>
          ) : currentUnscheduledOrders.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Buyer</TableHead>
                  <TableHead>Style</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead>Req. Ship Date</TableHead>
                  <TableHead>Reason for Unscheduled</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentUnscheduledOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>{order.buyer}</TableCell>
                    <TableCell>{order.style}</TableCell>
                    <TableCell className="text-right">{order.quantity.toLocaleString()}</TableCell>
                    <TableCell>{order.requestedShipDate}</TableCell>
                    <TableCell>{order.reason}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenScheduleDialog(order)}
                      >
                        <CheckSquare className="mr-2 h-4 w-4" /> Schedule
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <Package className="h-16 w-16 mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">All Orders Scheduled!</h3>
              <p>There are currently no unscheduled orders. Great job staying on top of planning!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedOrderForScheduling && (
        <Dialog open={isSchedulingDialogOpen} onOpenChange={setIsSchedulingDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onConfirmSchedule)}>
                <DialogHeader>
                  <DialogTitle>Schedule Order: {selectedOrderForScheduling.id}</DialogTitle>
                  <DialogDescription>
                    Assign a production unit and line for order {selectedOrderForScheduling.style} from {selectedOrderForScheduling.buyer}.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <FormField
                    control={form.control}
                    name="unitId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select Unit</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose a unit" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {unitsForSelect.map((unit: { id: string; name: string }) => (
                              <SelectItem key={unit.id} value={unit.id}>
                                {unit.name}
                              </SelectItem>
                            ))}
                             {unitsForSelect.length === 0 && (
                              <SelectItem value="no-units-placeholder" disabled>No units available. Create a unit first.</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lineId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select Line</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''} disabled={!watchedUnitId || availableLines.length === 0}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={!watchedUnitId ? "Select a unit first" : (availableLines.length === 0 ? "No lines for this unit" : "Choose a line")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {availableLines.map((line: { id: string; unitId?: string; name: string }) => (
                              <SelectItem key={line.id} value={line.id}>
                                {line.name}
                              </SelectItem>
                            ))}
                             {watchedUnitId && availableLines.length === 0 && (
                              <SelectItem value="no-lines-placeholder" disabled>No lines available for selected unit.</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                     <Button type="button" variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button type="submit">
                    <Save className="mr-2 h-4 w-4" /> Confirm Schedule
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}

      {currentUnscheduledOrders.length > 0 && (
        <Card className="mt-6 bg-accent/20 border-accent/50 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center text-accent-foreground">
              <Clock className="mr-2 h-5 w-5" /> Scheduling Tips
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-accent-foreground/80">
            <ul className="list-disc pl-5 space-y-1">
              <li>Prioritize orders with earlier requested ship dates.</li>
              <li>Check line availability and efficiency before scheduling.</li>
              <li>Communicate with buyers if requested dates cannot be met.</li>
            </ul>
          </CardContent>
        </Card>
      )}
    </>
  );
}
