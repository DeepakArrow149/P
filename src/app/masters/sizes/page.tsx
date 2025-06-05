
// src/app/masters/sizes/page.tsx
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
import { Ruler, Edit, Trash2, PlusCircle, Filter as FilterIcon, MoreVertical, Save, X, Eye } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { MasterDataLogDialog } from '@/components/masters/MasterDataLogDialog';

const sizeItemSchema = z.object({
  name: z.string().min(1, 'Size name is required').max(20, 'Size name must be 20 characters or less'),
});
type SizeItemFormValues = z.infer<typeof sizeItemSchema>;

const sizeRangeFormSchema = z.object({
  id: z.string().optional(),
  rangeName: z.string().min(1, 'Range Name is required').max(50, 'Range Name must be 50 chars or less'),
  description: z.string().max(100, 'Description must be 100 chars or less').optional(),
  sizes: z.array(sizeItemSchema).min(1, 'At least one size is required.')
          .refine(sizes => {
            if (sizes.length <= 1) return true;
            const names = sizes.map(s => s.name.trim().toUpperCase());
            return new Set(names).size === names.length;
          }, { message: "Size names must be unique within the range." }),
});

type SizeRangeFormValues = z.infer<typeof sizeRangeFormSchema>;

interface SizeRangeData extends Omit<SizeRangeFormValues, 'sizes'> {
  id: string;
  sizes: { name: string }[]; 
}

const defaultSizeItem: SizeItemFormValues = { name: '' };
const defaultValues: Omit<SizeRangeFormValues, 'id'> = {
  rangeName: '',
  description: '',
  sizes: [defaultSizeItem],
};

const initialMockSizeRanges: SizeRangeData[] = [
  { id: 'SR-STD-ALPHA', rangeName: 'Standard Alpha (S-XL)', description: 'Common S, M, L, XL sizes', sizes: [{ name: 'S' }, { name: 'M' }, { name: 'L' }, { name: 'XL' }] },
  { id: 'SR-NUM-EURO', rangeName: 'Numeric European (36-44)', description: 'European numeric sizing', sizes: [{ name: '36' }, { name: '38' }, { name: '40' }, { name: '42' }, { name: '44' }] },
  { id: 'SR-KIDS-AGE', rangeName: 'Kids Age Based (2Y-10Y)', description: 'Age-based sizing for children', sizes: [{ name: '2Y' }, { name: '4Y' }, { name: '6Y' }, { name: '8Y' }, { name: '10Y' }] },
];

export default function SizesMasterPage() {
  const { toast } = useToast();
  const [sizeRanges, setSizeRanges] = React.useState<SizeRangeData[]>(initialMockSizeRanges);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingRange, setEditingRange] = React.useState<SizeRangeData | null>(null);
  const [filterText, setFilterText] = React.useState('');

  const [isLogDialogOpen, setIsLogDialogOpen] = React.useState(false);
  const [selectedItemForLog, setSelectedItemForLog] = React.useState<SizeRangeData | null>(null);

  const form = useForm<SizeRangeFormValues>({
    resolver: zodResolver(sizeRangeFormSchema),
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "sizes",
  });

  React.useEffect(() => {
    if (editingRange) {
      form.reset({
        ...editingRange,
        sizes: editingRange.sizes.map(s => ({ name: s.name })),
      });
    } else {
      form.reset(defaultValues);
    }
  }, [editingRange, form, isFormOpen]);

  const onSubmit = (data: SizeRangeFormValues) => {
    const processedData = {
      ...data,
      sizes: data.sizes.map(s => ({ name: s.name })),
    };

    if (editingRange) {
      setSizeRanges(prevRanges =>
        prevRanges.map(r => (r.id === editingRange.id ? { ...r, ...processedData, id: r.id } : r))
      );
      toast({ title: 'Size Range Updated', description: `Size range "${data.rangeName}" has been updated.` });
    } else {
      const newId = `SR-${Date.now()}`;
      const newRange: SizeRangeData = { ...processedData, id: newId };
      setSizeRanges(prevRanges => [newRange, ...prevRanges]);
      toast({ title: 'Size Range Added', description: `Size range "${data.rangeName}" has been added.` });
    }
    setIsFormOpen(false);
    setEditingRange(null);
  };

  const handleAddNew = () => {
    setEditingRange(null);
    form.reset(defaultValues);
    setIsFormOpen(true);
  };

  const handleEdit = (range: SizeRangeData) => {
    setEditingRange(range);
    setIsFormOpen(true);
  };

  const handleDelete = (rangeId: string) => {
    setSizeRanges(prevRanges => prevRanges.filter(r => r.id !== rangeId));
    toast({ title: 'Size Range Deleted', description: 'The size range has been deleted.', variant: 'destructive' });
  };

  const handleViewDetails = (range: SizeRangeData) => {
    setSelectedItemForLog(range);
    setIsLogDialogOpen(true);
  };

  const addSizeField = () => {
    append(defaultSizeItem);
  };

  const filteredRanges = sizeRanges.filter(range =>
    range.rangeName.toLowerCase().includes(filterText.toLowerCase()) ||
    (range.description && range.description.toLowerCase().includes(filterText.toLowerCase()))
  );

  return (
    <MasterPageTemplate
      title="Size Ranges"
      description="Manage product size ranges and individual sizes within them."
    >
      <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <Button onClick={handleAddNew} className="w-full sm:w-auto">
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Size Range
        </Button>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Input
            placeholder="Filter by name or description..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="h-10 max-w-full sm:max-w-xs"
          />
          <Button variant="ghost" size="icon" disabled>
            <FilterIcon className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <Card className="shadow-lg rounded-lg">
        <CardHeader className="px-6 py-4 border-b">
          <CardTitle className="text-lg font-semibold">Defined Size Ranges</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">List of all available size ranges.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-4 py-3">Range Name</TableHead>
                  <TableHead className="px-4 py-3">Description</TableHead>
                  <TableHead className="px-4 py-3">Sizes</TableHead>
                  <TableHead className="px-4 py-3 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRanges.length > 0 ? (
                  filteredRanges.map(range => (
                    <TableRow key={range.id} className="odd:bg-muted/50">
                      <TableCell className="px-4 py-3 font-medium">{range.rangeName}</TableCell>
                      <TableCell className="px-4 py-3">{range.description || '-'}</TableCell>
                      <TableCell className="px-4 py-3 text-xs">
                        {range.sizes.map(s => s.name).join(', ')}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right">
                         <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="shadow-lg rounded-md">
                            <DropdownMenuItem onClick={() => handleViewDetails(range)} className="cursor-pointer">
                              <Eye className="mr-2 h-4 w-4" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator/>
                            <DropdownMenuItem onClick={() => handleEdit(range)} className="cursor-pointer">
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(range.id)} className="text-destructive focus:text-destructive cursor-pointer">
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center px-4 py-3">
                      {filterText ? 'No size ranges match your filter.' : 'No size ranges found. Click "Add New Size Range" to get started.'}
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
          if (!open) setEditingRange(null);
      }}>
        <DialogContent className="sm:max-w-2xl p-6 rounded-lg shadow-xl max-h-[70vh] flex flex-col">
          <DialogHeader className="mb-4">
            <DialogTitle className="flex items-center text-xl font-semibold">
                <Ruler className="mr-2 h-5 w-5 text-primary" />
                {editingRange ? 'Edit Size Range' : 'Add New Size Range'}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {editingRange ? 'Update the details of this size range.' : 'Define a new size range and its individual sizes.'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 flex-grow overflow-y-auto pr-2">
              <FormField
                control={form.control}
                name="rangeName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">Range Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Standard Apparel (S-XL)" {...field} className="h-10"/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Brief description of the size range (optional)" {...field} rows={2} className="min-h-[60px]"/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4 py-3">
                    <CardTitle className="text-md">Individual Sizes</CardTitle>
                    <Button type="button" size="sm" variant="outline" onClick={addSizeField}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Size
                    </Button>
                </CardHeader>
                <CardContent className="pt-2 px-4 pb-4">
                    <div className="max-h-60 overflow-y-auto space-y-3 pr-1">
                        {fields.map((sizeField, index) => (
                            <div key={sizeField.id} className="flex items-center gap-2 p-2 border rounded-md bg-muted/30">
                                <FormField
                                control={form.control}
                                name={`sizes.${index}.name`}
                                render={({ field }) => (
                                    <FormItem className="flex-grow">
                                    <FormLabel className="sr-only">Size Name</FormLabel>
                                    <FormControl><Input placeholder={`e.g., ${index === 0 ? 'S' : index === 1 ? 'M' : 'L' }`} {...field} className="h-9" /></FormControl>
                                    <FormMessage className="text-xs" />
                                    </FormItem>
                                )}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon_sm"
                                    onClick={() => remove(index)}
                                    disabled={fields.length <= 1}
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                    <X className="h-4 w-4" />
                                    <span className="sr-only">Remove Size</span>
                                </Button>
                            </div>
                        ))}
                    </div>
                     {form.formState.errors.sizes && !form.formState.errors.sizes.root && fields.length > 0 && (
                        <p className="text-sm font-medium text-destructive mt-2">
                          Error in sizes. Please check values.
                        </p>
                     )}
                     {form.formState.errors.sizes?.root?.message && (
                        <p className="text-sm font-medium text-destructive mt-2">
                            {form.formState.errors.sizes.root.message}
                        </p>
                     )}
                </CardContent>
              </Card>

              <DialogFooter className="pt-6 flex flex-col sm:flex-row sm:justify-end gap-2 mt-auto sticky bottom-0 bg-background pb-0 -mb-6">
                <DialogClose asChild>
                    <Button type="button" variant="outline" className="w-full sm:w-auto">Cancel</Button>
                </DialogClose>
                <Button type="submit" className="w-full sm:w-auto">
                    <Save className="mr-2 h-4 w-4" />
                    {editingRange ? 'Update Range' : 'Save Range'}
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
          itemName={selectedItemForLog.rangeName}
          itemType="Size Range"
        />
      )}
    </MasterPageTemplate>
  );
}
