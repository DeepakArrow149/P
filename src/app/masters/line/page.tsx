
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { Spline, Edit, Trash2, PlusCircle, Filter as FilterIcon, MoreVertical, Save, Eye } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { MasterDataLogDialog } from '@/components/masters/MasterDataLogDialog';
import { useLineApi } from '@/hooks/useLineApi';
import { useLineGroupApi } from '@/hooks/useLineGroupApi';
import type { Line } from '@/lib/lineRepository';
import type { LineGroup } from '@/lib/lineGroupRepository';

interface LineData extends Line {}

const lineFormSchema = z.object({
  id: z.string().optional(),
  lineCode: z.string().min(1, 'Line Code is required').max(20, 'Line Code must be 20 characters or less'),
  lineName: z.string().min(1, 'Line Name is required').max(100, 'Line Name must be 100 characters or less'),
  unitId: z.string().min(1, 'Unit is required'),
  lineType: z.enum(['Sewing', 'Cutting', 'Finishing', 'Assembly', 'Packing', 'Other']).optional(),
  defaultCapacity: z.coerce.number().min(0, 'Capacity must be a non-negative number').optional().default(0),
  notes: z.string().max(250, 'Notes must be 250 characters or less').optional().default(''),
});

type LineFormValues = z.infer<typeof lineFormSchema>;

const defaultValues: LineFormValues = {
  lineCode: '',
  lineName: '',
  unitId: '',
  lineType: undefined,
  defaultCapacity: 0,
  notes: '',
};

export default function LineMasterPage() {
  const { toast } = useToast();
  const { 
    lines, 
    loading, 
    error: apiError, 
    dataSource,
    createLine, 
    updateLine, 
    deleteLine,
    searchLines 
  } = useLineApi();
  
  const { lineGroups, searchLineGroups } = useLineGroupApi();
  
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingLine, setEditingLine] = React.useState<LineData | null>(null);
  const [filterText, setFilterText] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [isLogDialogOpen, setIsLogDialogOpen] = React.useState(false);
  const [selectedItemForLog, setSelectedItemForLog] = React.useState<LineData | null>(null);

  const form = useForm<LineFormValues>({
    resolver: zodResolver(lineFormSchema),
    defaultValues,
  });

  const unitsForDropdown = React.useMemo(() => 
    lineGroups.map((group: LineGroup) => ({ id: group.id?.toString() || '', unitName: group.groupName })),
    [lineGroups] 
  );

  // Load line groups on component mount
  React.useEffect(() => {
    searchLineGroups({ isActive: true });
  }, [searchLineGroups]);

  React.useEffect(() => {
    if (editingLine) {
      form.reset({
        ...defaultValues, 
        ...editingLine,
        lineType: editingLine.lineType || undefined, 
        defaultCapacity: editingLine.defaultCapacity ?? 0,
        notes: editingLine.notes || undefined, // Convert null to undefined
      });
    } else {
      form.reset(defaultValues);
    }
  }, [editingLine, form, isFormOpen]);

  // Handle search with debouncing
  React.useEffect(() => {
    const timer = setTimeout(() => {
      searchLines({ search: filterText || undefined });
    }, 300);

    return () => clearTimeout(timer);
  }, [filterText, searchLines]);

  // Show API errors
  React.useEffect(() => {
    if (apiError) {
      toast({
        title: 'API Error',
        description: apiError,
        variant: 'destructive',
      });
    }
  }, [apiError, toast]);

  const onSubmit = async (data: LineFormValues) => {
    setIsSubmitting(true);
    try {
      if (editingLine) {
        const result = await updateLine(editingLine.id, data);
        if (result) {
          toast({ title: 'Line Updated', description: `Line "${data.lineName}" has been updated.` });
          setIsFormOpen(false);
          setEditingLine(null);
        }
      } else {
        const result = await createLine(data);
        if (result) {
          toast({ title: 'Line Added', description: `Line "${data.lineName}" has been added.` });
          setIsFormOpen(false);
        }
      }
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddNew = () => {
    setEditingLine(null);
    form.reset(defaultValues);
    setIsFormOpen(true);
  };

  const handleEdit = (line: LineData) => {
    setEditingLine(line);
    setIsFormOpen(true);
  };

  const handleDelete = async (lineId: string) => {
    const success = await deleteLine(lineId);
    if (success) {
      toast({ title: 'Line Deleted', description: 'The line has been deleted.', variant: 'destructive' });
    }
  };

  const handleViewDetails = (line: LineData) => {
    setSelectedItemForLog(line);
    setIsLogDialogOpen(true);
  };

  const getUnitNameById = (unitId: string | undefined): string => {
    if (!unitId) return '-';
    const group = lineGroups.find((g: LineGroup) => g.id?.toString() === unitId); 
    return group ? group.groupName : unitId; 
  };

  const linesToDisplay = React.useMemo(() =>
    lines.filter(line =>
      line.lineName.toLowerCase().includes(filterText.toLowerCase()) ||
      line.lineCode.toLowerCase().includes(filterText.toLowerCase())
    ), [lines, filterText]);

  return (
    <MasterPageTemplate
      title="Production Lines"
      description="Manage production lines within units."
    >
      {/* Data source indicator */}
      {dataSource && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-700">
            <strong>Data Source:</strong> {dataSource === 'database' ? 'MySQL Database' : 'Mock Data (Database Unavailable)'}
          </p>
        </div>
      )}

      <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <Button onClick={handleAddNew} className="w-full sm:w-auto" disabled={loading}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Line
        </Button>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Input
            placeholder="Filter by code or name..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="h-10 max-w-full sm:max-w-xs"
            disabled={loading}
          />
          <Button variant="ghost" size="icon" disabled>
            <FilterIcon className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <Card className="shadow-lg rounded-lg">
        <CardHeader className="px-6 py-4 border-b">
          <CardTitle>Configured Lines</CardTitle>
          <CardDescription>List of all production lines and their configurations.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-4 py-3">Line Code</TableHead>
                  <TableHead className="px-4 py-3">Line Name</TableHead>
                  <TableHead className="px-4 py-3">Unit</TableHead>
                  <TableHead className="px-4 py-3">Line Type</TableHead>
                  <TableHead className="px-4 py-3 text-right">Capacity (pcs/day)</TableHead>
                  <TableHead className="px-4 py-3 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center px-4 py-3">
                      Loading lines...
                    </TableCell>
                  </TableRow>
                ) : linesToDisplay.length > 0 ? (
                  linesToDisplay.map(line => (
                    <TableRow key={line.id} className="odd:bg-muted/50">
                      <TableCell className="px-4 py-3 font-medium">{line.lineCode}</TableCell>
                      <TableCell className="px-4 py-3">{line.lineName}</TableCell>
                      <TableCell className="px-4 py-3">{getUnitNameById(line.unitId)}</TableCell>
                      <TableCell className="px-4 py-3">{line.lineType || '-'}</TableCell>
                      <TableCell className="px-4 py-3 text-right">{line.defaultCapacity?.toLocaleString() || '-'}</TableCell>
                      <TableCell className="px-4 py-3 text-right">
                         <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="shadow-lg rounded-md">
                            <DropdownMenuItem onClick={() => handleViewDetails(line)} className="cursor-pointer">
                              <Eye className="mr-2 h-4 w-4" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator/>
                            <DropdownMenuItem onClick={() => handleEdit(line)} className="cursor-pointer">
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(line.id)} className="text-destructive focus:text-destructive cursor-pointer">
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center px-4 py-3">
                      {filterText ? 'No lines match your filter.' : 'No lines found. Click "Add New Line" to get started.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditingLine(null);
      }}>
        <DialogContent className="sm:max-w-[550px] p-6 rounded-lg shadow-xl max-h-[70vh] overflow-y-auto">
          <DialogHeader className="mb-4">
            <DialogTitle className="flex items-center text-xl font-semibold">
                <Spline className="mr-2 h-5 w-5 text-primary" />
                {editingLine ? 'Edit Line' : 'Add New Line'}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {editingLine ? 'Update the details of this production line.' : 'Enter the details for the new production line.'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pr-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <FormField
                    control={form.control}
                    name="lineCode"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel className="font-medium">Line Code *</FormLabel>
                        <FormControl>
                        <Input placeholder="e.g., SEW-01A" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="lineName"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel className="font-medium">Line Name *</FormLabel>
                        <FormControl>
                        <Input placeholder="e.g., Main Sewing Line Alpha" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
              </div>
              <FormField
                control={form.control}
                name="unitId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">Unit *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select the unit this line belongs to" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {unitsForDropdown.length > 0 ? (
                            unitsForDropdown.map((unit: { id: string; unitName: string }) => (
                               <SelectItem key={unit.id} value={unit.id}>{unit.unitName}</SelectItem>
                            ))
                        ) : (
                            <SelectItem value="no-units-placeholder" disabled>No units available. Create a unit first.</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <FormField
                    control={form.control}
                    name="lineType"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel className="font-medium">Line Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                        <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder="Select line type" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="Sewing">Sewing</SelectItem>
                            <SelectItem value="Cutting">Cutting</SelectItem>
                            <SelectItem value="Finishing">Finishing</SelectItem>
                            <SelectItem value="Assembly">Assembly</SelectItem>
                            <SelectItem value="Packing">Packing</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="defaultCapacity"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel className="font-medium">Default Capacity (pcs/day)</FormLabel>
                        <FormControl>
                        <Input type="number" placeholder="e.g., 1200" {...field} onChange={e => field.onChange(e.target.value === '' ? 0 : +e.target.value)} value={field.value ?? 0} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
              </div>
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">Notes</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Any specific notes about this line..." {...field} rows={3} className="min-h-[80px]" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="pt-6 flex flex-col sm:flex-row sm:justify-end gap-2">
                <DialogClose asChild>
                    <Button type="button" variant="outline" className="w-full sm:w-auto">Cancel</Button>
                </DialogClose>
                <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
                    <Save className="mr-2 h-4 w-4" />
                    {isSubmitting ? 'Saving...' : editingLine ? 'Update Line' : 'Save Line'}
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
          itemName={selectedItemForLog.lineName}
          itemType="Line"
        />
      )}
    </MasterPageTemplate>
  );
}
