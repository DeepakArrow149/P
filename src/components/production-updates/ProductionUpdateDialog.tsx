
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Save, ClipboardEdit, Printer, Combine, XSquare, CheckSquare, Trash2, PlusCircle, Package, Users, Clock, Edit, GripVertical, PackagePlus, BarChartHorizontalBig, FileText, Layers, ActivityIcon, BadgeInfo } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';


interface DisplayOrderForDialog {
  id: string;
  orderNo?: string;
  buyer?: string;
  styleName?: string;
  quantity?: number;
  product?: string; // Could be style code
  customer?: string; // Could be buyer code
  // Add other relevant fields from the Order type used in ProductionUpdatesPage
}

interface ProductionUpdateDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  order: DisplayOrderForDialog | null;
  onSubmit: (updatedData: any) => void; // Replace 'any' with a specific update data type
}

interface OperationStage {
  name: string;
  balanceQty: number;
  allocatedQty: number;
  updatedQty: number;
  group: string;
  row: string;
  rejects: number;
  isComplete: boolean;
  comments: string;
  targetDate: Date | null;
  actualDate: Date | null;
}

const initialOperationStages: Omit<OperationStage, 'targetDate' | 'actualDate'>[] = [
  { name: 'CUT', balanceQty: 0, allocatedQty: 0, updatedQty: 0, group: '', row: '', rejects: 0, isComplete: false, comments: '' },
  { name: 'INPUT', balanceQty: 0, allocatedQty: 0, updatedQty: 0, group: '', row: '', rejects: 0, isComplete: false, comments: '' },
  { name: 'SEW', balanceQty: 0, allocatedQty: 0, updatedQty: 0, group: '', row: '', rejects: 0, isComplete: false, comments: '' },
  { name: 'FINISH', balanceQty: 0, allocatedQty: 0, updatedQty: 0, group: '', row: '', rejects: 0, isComplete: false, comments: '' },
  { name: 'PACK', balanceQty: 0, allocatedQty: 0, updatedQty: 0, group: '', row: '', rejects: 0, isComplete: false, comments: '' },
  { name: 'SHIP', balanceQty: 0, allocatedQty: 0, updatedQty: 0, group: '', row: '', rejects: 0, isComplete: false, comments: '' },
];

export function ProductionUpdateDialog({
  isOpen,
  onOpenChange,
  order,
  onSubmit,
}: ProductionUpdateDialogProps) {
  const [operationStages, setOperationStages] = React.useState<OperationStage[]>([]);
  const [combineLinked, setCombineLinked] = React.useState(false);

  React.useEffect(() => {
    if (order) {
      // Initialize stages based on order quantity or fetched data
      const initialQty = order.quantity || 0;
      setOperationStages(
        initialOperationStages.map(stage => ({
          ...stage,
          balanceQty: initialQty, // Initial balance is total qty
          targetDate: new Date(), // Default to today, or fetch from TNA
          actualDate: null,
        }))
      );
    }
  }, [order]);

  if (!order) return null;

  const orderIdentifier = `${order.customer || order.buyer || 'N/A'}::${order.product || order.styleName || 'N/A'} (${order.quantity?.toLocaleString() || 0} Pcs)`;

  const handleStageChange = (index: number, field: keyof OperationStage, value: any) => {
    const newStages = [...operationStages];
    if (field === 'targetDate' || field === 'actualDate') {
      newStages[index] = { ...newStages[index], [field]: value instanceof Date ? value : null };
    } else if (typeof newStages[index][field] === 'number') {
      newStages[index] = { ...newStages[index], [field]: parseInt(value, 10) || 0 };
    } else if (typeof newStages[index][field] === 'boolean') {
      newStages[index] = { ...newStages[index], [field]: value as boolean };
    } else {
      newStages[index] = { ...newStages[index], [field]: value };
    }
    // Recalculate balance if updatedQty changes
    if (field === 'updatedQty') {
        const madeSoFar = newStages.slice(0, index).reduce((sum, s) => sum + s.updatedQty, 0);
        newStages[index].balanceQty = (order.quantity || 0) - madeSoFar - newStages[index].updatedQty;
        // Update subsequent stages' balance
        for(let i = index + 1; i < newStages.length; i++) {
            const prevStageMadeTotal = newStages.slice(0, i).reduce((sum, s) => sum + s.updatedQty, 0);
            newStages[i].balanceQty = (order.quantity || 0) - prevStageMadeTotal;
        }
    }
    setOperationStages(newStages);
  };

  const handleSubmit = () => {
    onSubmit({ orderId: order.id, stages: operationStages, combinedLinked: combineLinked });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b flex-shrink-0">
          <div className="flex justify-between items-center">
            <DialogTitle className="text-lg md:text-xl">Production Update: {orderIdentifier}</DialogTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm"><BadgeInfo className="mr-2 h-4 w-4" />Order Status</Button>
              <Button variant="outline" size="sm"><Printer className="mr-2 h-4 w-4" />Print</Button>
              <Button variant="outline" size="sm"><Combine className="mr-2 h-4 w-4" />Consolidated</Button>
              <DialogClose asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7"><XSquare className="h-5 w-5" /></Button>
              </DialogClose>
            </div>
          </div>
          <DialogDescription>Enter daily production updates for each operation.</DialogDescription>
        </DialogHeader>

        <div className="p-4 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <Checkbox id="combineLinked" checked={combineLinked} onCheckedChange={(checked) => setCombineLinked(!!checked)} />
            <Label htmlFor="combineLinked" className="text-sm">Combine linked orders in summary</Label>
          </div>
        </div>

        <ScrollArea className="flex-grow px-4 pb-4">
          <div className="space-y-4">
            {operationStages.map((stage, index) => (
              <Card key={stage.name} className="overflow-hidden">
                <CardHeader className="bg-muted/50 p-3">
                  <CardTitle className="text-base">{stage.name}</CardTitle>
                </CardHeader>
                <CardContent className="p-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div className="font-semibold">Balance: {stage.balanceQty.toLocaleString()}</div>
                  <div className="font-semibold">Allocated: {stage.allocatedQty.toLocaleString()}</div>
                  <div className="lg:col-span-2"></div> {/* Spacer */}
                  
                  <FormItem>
                    <FormLabel>Updated Qty</FormLabel>
                    <Input type="number" value={stage.updatedQty} onChange={(e) => handleStageChange(index, 'updatedQty', e.target.value)} className="h-8 text-xs" />
                  </FormItem>
                  <FormItem>
                    <FormLabel>Group</FormLabel>
                    <Input value={stage.group} onChange={(e) => handleStageChange(index, 'group', e.target.value)} className="h-8 text-xs" />
                  </FormItem>
                  <FormItem>
                    <FormLabel>Row/Line</FormLabel>
                    <Input value={stage.row} onChange={(e) => handleStageChange(index, 'row', e.target.value)} className="h-8 text-xs" />
                  </FormItem>
                  <FormItem>
                    <FormLabel>Rejects</FormLabel>
                    <Input type="number" value={stage.rejects} onChange={(e) => handleStageChange(index, 'rejects', e.target.value)} className="h-8 text-xs" />
                  </FormItem>
                  
                  <FormItem className="flex flex-col">
                    <FormLabel>Target Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant={'outline'} size="sm" className={cn("h-8 text-xs justify-start", !stage.targetDate && "text-muted-foreground")}>
                          <CalendarIcon className="mr-1 h-3 w-3" />
                          {stage.targetDate ? format(stage.targetDate, "PPP") : <span>Pick date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={stage.targetDate || undefined} onSelect={(date) => handleStageChange(index, 'targetDate', date)} /></PopoverContent>
                    </Popover>
                  </FormItem>
                  <FormItem className="flex flex-col">
                    <FormLabel>Actual Date</FormLabel>
                     <Popover>
                      <PopoverTrigger asChild>
                        <Button variant={'outline'} size="sm" className={cn("h-8 text-xs justify-start", !stage.actualDate && "text-muted-foreground")}>
                          <CalendarIcon className="mr-1 h-3 w-3" />
                          {stage.actualDate ? format(stage.actualDate, "PPP") : <span>Pick date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={stage.actualDate || undefined} onSelect={(date) => handleStageChange(index, 'actualDate', date)} /></PopoverContent>
                    </Popover>
                  </FormItem>
                   <FormItem className="flex items-center space-x-2 pt-5 lg:col-start-3">
                      <Checkbox id={`complete-${index}`} checked={stage.isComplete} onCheckedChange={(checked) => handleStageChange(index, 'isComplete', !!checked)} />
                      <Label htmlFor={`complete-${index}`} className="text-xs">Mark as Complete</Label>
                   </FormItem>
                  <FormItem className="lg:col-span-4">
                    <FormLabel>Comments</FormLabel>
                    <Textarea value={stage.comments} onChange={(e) => handleStageChange(index, 'comments', e.target.value)} className="text-xs min-h-[40px]" rows={1} />
                  </FormItem>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter className="p-4 border-t flex-shrink-0">
            <div className="text-xs text-muted-foreground">
                Total Updated: {operationStages.reduce((sum, s) => sum + s.updatedQty, 0).toLocaleString()} / {(order.quantity || 0).toLocaleString()}
            </div>
          <DialogClose asChild>
            <Button type="button" variant="outline">Cancel</Button>
          </DialogClose>
          <Button type="button" onClick={handleSubmit}>
            <Save className="mr-2 h-4 w-4" /> Save Updates
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
