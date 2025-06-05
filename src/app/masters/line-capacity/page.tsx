
// src/app/masters/line-capacity/page.tsx
'use client';

import * as React from 'react';
import { MasterPageTemplate } from '@/components/masters/master-page-template';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Calculator, Edit, Trash2, PlusCircle, Save, MoreVertical, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { MasterDataLogDialog } from '@/components/masters/MasterDataLogDialog';
import { useLineCapacityApi } from '@/hooks/useLineCapacityApi';
import type { LineCapacity, CreateLineCapacityData } from '@/lib/lineCapacityRepository';
import { useLineApi } from '@/hooks/useLineApi';


const lineCapacityFormSchema = z.object({
  id: z.number().optional(),
  lineId: z.string().min(1, "Line is required"),
  orderNo: z.string().optional(),
  buyer: z.string().optional(),
  styleNo: z.string().optional(),
  garmentDescription: z.string().optional(),
  sam: z.coerce.number().min(0.01, "SAM must be positive"),
  operators: z.coerce.number().min(1, "Operators must be at least 1"),
  workingHours: z.coerce.number().min(0.1, "Working hours must be positive"),
  efficiency: z.coerce.number().min(1, "Efficiency must be at least 1%").max(200, "Efficiency cannot exceed 200%"),
  effectiveDate: z.string().min(1, "Effective date is required"),
  expiryDate: z.string().optional(),
});

type LineCapacityFormValues = z.infer<typeof lineCapacityFormSchema>;

const defaultValues: LineCapacityFormValues = {
  lineId: '',
  orderNo: '',
  buyer: '',
  styleNo: '',
  garmentDescription: '',
  sam: 0,
  operators: 0,
  workingHours: 8,
  efficiency: 85,
  effectiveDate: new Date().toISOString().split('T')[0],
  expiryDate: '',
};

export default function LineCapacityMasterPage() {
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingCapacity, setEditingCapacity] = React.useState<LineCapacity | null>(null);
  const [isLogDialogOpen, setIsLogDialogOpen] = React.useState(false);
  const [selectedItemForLog, setSelectedItemForLog] = React.useState<LineCapacity | null>(null);

  // API hooks
  const {
    lineCapacities,
    loading: capacitiesLoading,
    error: capacitiesError,
    dataSource,
    createLineCapacity,
    updateLineCapacity,
    deleteLineCapacity,
    searchLineCapacities,
  } = useLineCapacityApi();

  const {
    lines,
    loading: linesLoading,
    error: linesError,
    searchLines,
  } = useLineApi();

  const form = useForm<LineCapacityFormValues>({
    resolver: zodResolver(lineCapacityFormSchema),
    defaultValues
  });

  // Fetch data on component mount
  React.useEffect(() => {
    searchLines();
    searchLineCapacities();
  }, [searchLines, searchLineCapacities]);

  React.useEffect(() => {
    if (editingCapacity) {
      form.reset({
        ...editingCapacity,
        effectiveDate: editingCapacity.effectiveFrom ? new Date(editingCapacity.effectiveFrom).toISOString().split('T')[0] : '',
        expiryDate: editingCapacity.effectiveTo ? new Date(editingCapacity.effectiveTo).toISOString().split('T')[0] : '',
      });
    } else {
      form.reset(defaultValues);
    }
  }, [editingCapacity, form, isFormOpen]);

  const onSubmit = async (data: LineCapacityFormValues) => {
    try {
      // Transform form data to repository format
      const capacityData: CreateLineCapacityData = {
        lineId: data.lineId,
        orderNo: data.orderNo || undefined,
        buyer: data.buyer || undefined,
        styleNo: data.styleNo || undefined,
        garmentDescription: data.garmentDescription || undefined,
        sam: data.sam,
        operators: data.operators,
        workingHours: data.workingHours,
        efficiency: data.efficiency,
        effectiveFrom: data.effectiveDate ? new Date(data.effectiveDate) : undefined,
        effectiveTo: data.expiryDate ? new Date(data.expiryDate) : undefined,
      };

      if (editingCapacity) {
        await updateLineCapacity(editingCapacity.id!, capacityData);
        toast({ 
          title: 'Capacity Rule Updated', 
          description: `Rule for ${getLineName(data.lineId)} updated successfully.` 
        });
      } else {
        await createLineCapacity(capacityData);
        toast({ 
          title: 'Capacity Rule Added', 
          description: `New rule for ${getLineName(data.lineId)} added successfully.` 
        });
      }
      setIsFormOpen(false);
      setEditingCapacity(null);
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: editingCapacity ? 'Failed to update capacity rule.' : 'Failed to add capacity rule.', 
        variant: 'destructive' 
      });
    }
  };
  
  const handleAddNewRule = () => {
    setEditingCapacity(null);
    form.reset(defaultValues);
    setIsFormOpen(true);
  };

  const handleEditRule = (capacity: LineCapacity) => {
    setEditingCapacity(capacity);
    setIsFormOpen(true);
  };

  const handleDeleteRule = async (capacityId: number) => {
    try {
      await deleteLineCapacity(capacityId);
      toast({ 
        title: 'Capacity Rule Deleted', 
        description: 'Rule deleted successfully.',
        variant: 'destructive' 
      });
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: 'Failed to delete capacity rule.', 
        variant: 'destructive' 
      });
    }
  };

  const handleViewDetails = (capacity: LineCapacity) => {
    setSelectedItemForLog(capacity);
    setIsLogDialogOpen(true);
  };

  const getLineName = (lineId: string) => {
    const line = lines.find(line => line.id === lineId);
    return line ? line.lineName : lineId;
  };

  return (
    <MasterPageTemplate
      title="Line Capacity Master"
      description="Manage line capacity definitions and parameters. This data feeds into planning views."
    >
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button onClick={handleAddNewRule} className="w-full sm:w-auto" disabled={capacitiesLoading}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Capacity Rule
          </Button>
          {capacitiesError && (
            <Badge variant="destructive" className="text-xs">
              Error loading data
            </Badge>
          )}
          <Badge variant={dataSource === 'database' ? 'default' : 'secondary'} className="text-xs">
            {dataSource === 'database' ? 'Database' : 'Mock Data'}
          </Badge>
        </div>
      </div>
      
      <div className="space-y-6">
        <Card className="shadow-lg rounded-lg">
          <CardHeader className="px-6 py-4 border-b">
            <CardTitle className="flex items-center text-lg font-semibold">
              <Activity className="mr-2 h-5 w-5 text-primary" />
              Line Capacity Rules
              {capacitiesLoading && (
                <div className="ml-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              )}
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Define standard capacities for lines or specific capacities for order/style combinations.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              {capacitiesLoading ? (
                <div className="flex items-center justify-center h-40">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <span className="ml-2 text-muted-foreground">Loading capacity rules...</span>
                </div>
              ) : lineCapacities.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px] px-4 py-3">Sl.</TableHead>
                      <TableHead className="px-4 py-3">Line</TableHead>
                      <TableHead className="px-4 py-3">Order No.</TableHead>
                      <TableHead className="px-4 py-3">Style No.</TableHead>
                      <TableHead className="px-4 py-3 text-right">SAM</TableHead>
                      <TableHead className="px-4 py-3 text-right">Operators</TableHead>
                      <TableHead className="px-4 py-3 text-right">Hours</TableHead>
                      <TableHead className="px-4 py-3 text-right">Efficiency</TableHead>
                      <TableHead className="px-4 py-3 text-right">Daily Cap. (pcs)</TableHead>
                      <TableHead className="px-4 py-3 text-right">Effective Date</TableHead>
                      <TableHead className="px-4 py-3 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>                  {lineCapacities.map((item, index) => (
                    <TableRow key={item.id} className="odd:bg-muted/50">
                      <TableCell className="px-4 py-3">{index + 1}</TableCell>
                      <TableCell className="px-4 py-3 font-medium">{getLineName(item.lineId)}</TableCell>
                      <TableCell className="px-4 py-3">{item.orderNo || '-'}</TableCell>
                      <TableCell className="px-4 py-3">{item.styleNo || '-'}</TableCell>
                      <TableCell className="px-4 py-3 text-right">{item.sam.toFixed(2)}</TableCell>
                      <TableCell className="px-4 py-3 text-right">{item.operators}</TableCell>
                      <TableCell className="px-4 py-3 text-right">{item.workingHours}</TableCell>
                      <TableCell className="px-4 py-3 text-right">{item.efficiency}%</TableCell>
                      <TableCell className="px-4 py-3 text-right font-semibold">{item.dailyCapacity?.toLocaleString() || 'N/A'}</TableCell>
                      <TableCell className="px-4 py-3 text-right">
                        {item.effectiveFrom ? new Date(item.effectiveFrom).toLocaleDateString() : '-'}
                      </TableCell>
                        <TableCell className="px-4 py-3 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewDetails(item)} className="cursor-pointer">
                                <Eye className="mr-2 h-4 w-4" /> View Details
                              </DropdownMenuItem>
                              <DropdownMenuSeparator/>
                              <DropdownMenuItem onClick={() => handleEditRule(item)} className="cursor-pointer">
                                <Edit className="mr-2 h-4 w-4" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteRule(item.id!)} 
                                className="text-destructive focus:text-destructive cursor-pointer"
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-border rounded-md p-6 text-center">
                  <Activity className="h-12 w-12 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No capacity rules defined yet.</p>
                  <p className="text-sm text-muted-foreground">Click "Add New Capacity Rule" to define parameters.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg rounded-lg">
          <CardHeader  className="px-6 py-4">
            <CardTitle className="flex items-center text-lg font-semibold">
                <Calculator className="mr-2 h-5 w-5 text-primary" />
                Capacity Calculation Formula
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="bg-muted/50 p-4 rounded-md text-center">
              <p className="text-lg font-medium text-foreground">
                Daily Capacity (pcs) = 
                <span className="block sm:inline text-center">
                  (Operators &times; Working Hours &times; 60 &times; (Efficiency / 100)) / SAM
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isFormOpen} onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditingCapacity(null);
      }}>
        <DialogContent className="sm:max-w-2xl p-6 rounded-lg shadow-xl max-h-[80vh] flex flex-col">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-semibold">
              {editingCapacity ? 'Edit' : 'Add New'} Capacity Rule
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {editingCapacity ? 'Update the details for this capacity rule.' : 'Define parameters for a new capacity rule.'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 flex-grow overflow-y-auto pr-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <FormField 
                  control={form.control} 
                  name="lineId" 
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">Line *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a line" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {lines.map((line) => (
                            <SelectItem key={line.id} value={line.id}>
                              {line.lineName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} 
                />
                <FormField 
                  control={form.control} 
                  name="sam" 
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">SAM (min) *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="e.g., 12.50" 
                          {...field} 
                          onChange={e => field.onChange(e.target.value === '' ? 0 : +e.target.value)} 
                          value={field.value ?? ''} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} 
                />
                <FormField 
                  control={form.control} 
                  name="operators" 
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">Operators *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="e.g., 25" 
                          {...field} 
                          onChange={e => field.onChange(e.target.value === '' ? 0 : +e.target.value)} 
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} 
                />
                <FormField 
                  control={form.control} 
                  name="workingHours" 
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">Working Hours *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.1"
                          placeholder="e.g., 8" 
                          {...field} 
                          onChange={e => field.onChange(e.target.value === '' ? 0 : +e.target.value)} 
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} 
                />
                <FormField 
                  control={form.control} 
                  name="efficiency" 
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">Efficiency (%) *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="e.g., 85" 
                          {...field} 
                          onChange={e => field.onChange(e.target.value === '' ? 0 : +e.target.value)} 
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} 
                />
                <FormField 
                  control={form.control} 
                  name="effectiveDate" 
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">Effective Date *</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} 
                />
                <FormField 
                  control={form.control} 
                  name="orderNo" 
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">Order No. (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Specific Order ID" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} 
                />
                <FormField 
                  control={form.control} 
                  name="buyer" 
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">Buyer (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Specific Buyer" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} 
                />
                <FormField 
                  control={form.control} 
                  name="styleNo" 
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">Style No. (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Specific Style No." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} 
                />
                <FormField 
                  control={form.control} 
                  name="expiryDate" 
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">Expiry Date (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} 
                />
                <FormField 
                  control={form.control} 
                  name="garmentDescription" 
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel className="font-medium">Garment Description (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Brief description" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} 
                />
              </div>
              <DialogFooter className="pt-6 sticky bottom-0 bg-background pb-0 -mb-6 flex-shrink-0">
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={capacitiesLoading}>
                  <Save className="mr-2 h-4 w-4" /> 
                  {editingCapacity ? 'Update Rule' : 'Save Rule'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {selectedItemForLog && (
        <MasterDataLogDialog
          isOpen={isLogDialogOpen}
          onOpenChange={setIsLogDialogOpen}
          itemName={`Rule for ${getLineName(selectedItemForLog.lineId)} (SAM: ${selectedItemForLog.sam})`}
          itemType="Line Capacity Rule"
        />
      )}
    </MasterPageTemplate>
  );
}
