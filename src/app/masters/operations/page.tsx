
'use client';

import * as React from 'react';
import { MasterPageTemplate } from '@/components/masters/master-page-template';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { Wrench, Edit, Trash2, PlusCircle, Save, MoreVertical, Eye, Palette } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { MasterDataLogDialog } from '@/components/masters/MasterDataLogDialog';

const operationFormSchema = z.object({
  id: z.string().optional(),
  processName: z.string().min(1, 'Process Name is required').max(100, 'Name must be 100 chars or less'),
  uom: z.string().min(1, 'Unit of Measure (UOM) is required').max(20, 'UOM must be 20 chars or less'),
  notes: z.string().max(250, 'Notes must be 250 chars or less').optional().default(''),
  color: z.string().optional().default('#000000'), // Default to black
});

type OperationFormValues = z.infer<typeof operationFormSchema>;

interface OperationData extends OperationFormValues {
  id: string;
  sno: number;
}

const defaultValues: Omit<OperationData, 'id' | 'sno'> = {
  processName: '',
  uom: '',
  notes: '',
  color: '#000000',
};

const initialMockOperations: Omit<OperationData, 'id' | 'sno'>[] = [
  { processName: 'CUTTING', uom: 'PCS', notes: 'Standard cutting operation', color: '#FF5733' },
  { processName: 'SEWING', uom: 'PCS', notes: 'Garment assembly', color: '#33FF57' },
  { processName: 'FINISHING', uom: 'PCS', notes: 'Ironing, final checks', color: '#3357FF' },
  { processName: 'PACKING', uom: 'PCS', notes: 'Folding and packing', color: '#FFC300' },
  { processName: 'FABRIC INSPECTION', uom: 'MTR', notes: 'Incoming fabric quality check', color: '#8E44AD' },
];

export default function OperationsMasterPage() {
  const { toast } = useToast();
  const [operations, setOperations] = React.useState<OperationData[]>(
    initialMockOperations.map((op, index) => ({
      ...op,
      id: `OP-${Date.now() + index}`,
      sno: index + 1,
    }))
  );
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingOperation, setEditingOperation] = React.useState<OperationData | null>(null);
  const [filterText, setFilterText] = React.useState('');

  const [isLogDialogOpen, setIsLogDialogOpen] = React.useState(false);
  const [selectedItemForLog, setSelectedItemForLog] = React.useState<OperationData | null>(null);

  const form = useForm<OperationFormValues>({
    resolver: zodResolver(operationFormSchema),
    defaultValues,
  });

  React.useEffect(() => {
    if (editingOperation) {
      form.reset(editingOperation);
    } else {
      form.reset(defaultValues);
    }
  }, [editingOperation, form, isFormOpen]);

  const onSubmit = (data: OperationFormValues) => {
    if (editingOperation) {
      setOperations(prevOps =>
        prevOps.map(op => (op.id === editingOperation.id ? { ...editingOperation, ...data } : op))
      );
      toast({ title: 'Operation Updated', description: `Operation "${data.processName}" has been updated.` });
    } else {
      const newSno = operations.length > 0 ? Math.max(...operations.map(op => op.sno)) + 1 : 1;
      const newOperation: OperationData = { ...data, id: `OP-${Date.now()}`, sno: newSno };
      setOperations(prevOps => [...prevOps, newOperation]);
      toast({ title: 'Operation Added', description: `Operation "${data.processName}" has been added.` });
    }
    setIsFormOpen(false);
    setEditingOperation(null);
  };

  const handleAddNew = () => {
    setEditingOperation(null);
    form.reset(defaultValues);
    setIsFormOpen(true);
  };

  const handleEdit = (operation: OperationData) => {
    setEditingOperation(operation);
    setIsFormOpen(true);
  };

  const handleDelete = (operationId: string) => {
    setOperations(prevOps => prevOps.filter(op => op.id !== operationId).map((op, index) => ({ ...op, sno: index + 1 })));
    toast({ title: 'Operation Deleted', description: 'The operation has been deleted.', variant: 'destructive' });
  };

  const handleViewDetails = (operation: OperationData) => {
    setSelectedItemForLog(operation);
    setIsLogDialogOpen(true);
  };

  const filteredOperations = operations.filter(op =>
    op.processName.toLowerCase().includes(filterText.toLowerCase()) ||
    op.uom.toLowerCase().includes(filterText.toLowerCase()) ||
    (op.notes && op.notes.toLowerCase().includes(filterText.toLowerCase()))
  );

  return (
    <MasterPageTemplate
      title="Operations"
      description="Manage production operations and processes."
      addLabel="Add New Operation"
      onAdd={handleAddNew}
    >
      <div className="mb-6 flex items-center justify-between gap-4">
        <Input
          placeholder="Filter by process, UOM, or notes..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          className="h-10 max-w-sm"
        />
      </div>

      <Card className="shadow-lg rounded-lg">
        <CardHeader className="px-6 py-4 border-b">
          <CardTitle className="text-lg font-semibold">Defined Operations</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-4 py-3 w-16">S.No</TableHead>
                  <TableHead className="px-4 py-3">Process Name</TableHead>
                  <TableHead className="px-4 py-3">UOM</TableHead>
                  <TableHead className="px-4 py-3">Color</TableHead>
                  <TableHead className="px-4 py-3">Notes</TableHead>
                  <TableHead className="px-4 py-3 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOperations.length > 0 ? (
                  filteredOperations.map(op => (
                    <TableRow key={op.id} className="odd:bg-muted/50">
                      <TableCell className="px-4 py-3">{op.sno}</TableCell>
                      <TableCell className="px-4 py-3 font-medium">{op.processName}</TableCell>
                      <TableCell className="px-4 py-3">{op.uom}</TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="w-6 h-6 rounded-full border" style={{ backgroundColor: op.color || '#000000' }} title={op.color}></div>
                      </TableCell>
                      <TableCell className="px-4 py-3 max-w-xs truncate">{op.notes || '-'}</TableCell>
                      <TableCell className="px-4 py-3 text-right">
                         <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetails(op)} className="cursor-pointer">
                              <Eye className="mr-2 h-4 w-4" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator/>
                            <DropdownMenuItem onClick={() => handleEdit(op)} className="cursor-pointer"><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(op.id)} className="text-destructive focus:text-destructive cursor-pointer"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={6} className="h-24 text-center px-4 py-3 text-muted-foreground">No operations found.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={(open) => { setIsFormOpen(open); if (!open) setEditingOperation(null); }}>
        <DialogContent className="sm:max-w-lg p-6 rounded-lg shadow-xl max-h-[70vh] overflow-y-auto">
          <DialogHeader className="mb-4">
            <DialogTitle className="flex items-center text-xl font-semibold">
                <Wrench className="mr-2 h-5 w-5 text-primary" />
                {editingOperation ? 'Edit Operation' : 'Add New Operation'}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {editingOperation ? 'Update the details of this operation.' : 'Enter new operation details.'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pr-2">
              <FormField control={form.control} name="processName" render={({ field }) => (<FormItem><FormLabel className="font-medium">Process Name *</FormLabel><FormControl><Input placeholder="e.g., CUTTING" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="uom" render={({ field }) => (<FormItem><FormLabel className="font-medium">Unit of Measure (UOM) *</FormLabel><FormControl><Input placeholder="e.g., PCS, MINS" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="color" render={({ field }) => (<FormItem><FormLabel className="font-medium">Color</FormLabel><FormControl><Input type="color" {...field} className="h-10 w-full p-1" /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="notes" render={({ field }) => (<FormItem><FormLabel className="font-medium">Notes</FormLabel><FormControl><Textarea placeholder="Brief description or notes..." {...field} rows={3} /></FormControl><FormMessage /></FormItem>)} />
              <DialogFooter className="pt-6 flex flex-col sm:flex-row sm:justify-end gap-2">
                <DialogClose asChild><Button type="button" variant="outline" className="w-full sm:w-auto">Cancel</Button></DialogClose>
                <Button type="submit" className="w-full sm:w-auto"><Save className="mr-2 h-4 w-4"/>{editingOperation ? 'Update Operation' : 'Add Operation'}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {selectedItemForLog && (
        <MasterDataLogDialog
          isOpen={isLogDialogOpen}
          onOpenChange={setIsLogDialogOpen}
          itemName={selectedItemForLog.processName}
          itemType="Operation"
        />
      )}
    </MasterPageTemplate>
  );
}
    