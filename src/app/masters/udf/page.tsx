
// src/app/masters/udf/page.tsx
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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { Settings2, Edit, Trash2, PlusCircle, Filter as FilterIcon, MoreVertical, Save, AlertTriangle, Eye } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { MasterDataLogDialog } from '@/components/masters/MasterDataLogDialog';

const applicableFormsOptions = ["ProductMaster", "NewOrderForm", "CustomerForm", "LineMaster"]; // Example form keys

const udfFormSchema = z.object({
  id: z.string().optional(),
  udfName: z.string().min(1, 'UDF Name (internal key) is required').max(50, 'Must be 50 chars or less')
    .regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers, and underscores allowed. No spaces.'),
  label: z.string().min(1, 'Display Label is required').max(100, 'Must be 100 chars or less'),
  dataType: z.enum(['Text', 'Number', 'Dropdown', 'Checkbox', 'Date'], {
    required_error: 'Data Type is required.',
  }),
  applicableForms: z.array(z.string()).min(1, 'At least one applicable form must be selected.'),
  options: z.string().optional(), 
  isRequired: z.boolean().default(false),
  defaultValue: z.string().max(255, 'Default value too long').optional(),
  tooltip: z.string().max(255, 'Tooltip text too long').optional(),
}).refine(data => {
  if (data.dataType === 'Dropdown' && (!data.options || data.options.trim() === '')) {
    return false;
  }
  return true;
}, {
  message: 'Options are required for Dropdown data type (one per line).',
  path: ['options'],
});

type UdfFormValues = z.infer<typeof udfFormSchema>;

export interface UdfFieldDefinition extends UdfFormValues {
  id: string;
}

const defaultValues: Omit<UdfFieldDefinition, 'id'> = {
  udfName: '',
  label: '',
  dataType: 'Text',
  applicableForms: [],
  options: '',
  isRequired: false,
  defaultValue: '',
  tooltip: '',
};

export default function UdfMasterPage() {
  const { toast } = useToast();
  const [udfFields, setUdfFields] = React.useState<UdfFieldDefinition[]>([]);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingUdf, setEditingUdf] = React.useState<UdfFieldDefinition | null>(null);
  const [filterText, setFilterText] = React.useState('');

  const [isLogDialogOpen, setIsLogDialogOpen] = React.useState(false);
  const [selectedItemForLog, setSelectedItemForLog] = React.useState<UdfFieldDefinition | null>(null);

  const form = useForm<UdfFormValues>({
    resolver: zodResolver(udfFormSchema),
    defaultValues,
  });

  const watchedDataType = form.watch('dataType');

  React.useEffect(() => {
    if (editingUdf) {
      form.reset(editingUdf);
    } else {
      form.reset(defaultValues);
    }
  }, [editingUdf, form, isFormOpen]);

  const onSubmit = (data: UdfFormValues) => {
    if (!editingUdf || editingUdf.udfName !== data.udfName) {
      if (udfFields.some(field => field.udfName === data.udfName)) {
        form.setError('udfName', { type: 'manual', message: 'This UDF Name (internal key) already exists.' });
        return;
      }
    }

    if (editingUdf) {
      setUdfFields(prevUdfs =>
        prevUdfs.map(udf => (udf.id === editingUdf.id ? { ...editingUdf, ...data } : udf))
      );
      toast({ title: 'UDF Updated', description: `UDF "${data.label}" has been updated.` });
    } else {
      const newId = `UDF-${Date.now()}`;
      const newUdf: UdfFieldDefinition = { ...data, id: newId };
      setUdfFields(prevUdfs => [newUdf, ...prevUdfs]);
      toast({ title: 'UDF Added', description: `UDF "${data.label}" has been added.` });
    }
    setIsFormOpen(false);
    setEditingUdf(null);
  };

  const handleAddNew = () => {
    setEditingUdf(null);
    form.reset(defaultValues);
    setIsFormOpen(true);
  };

  const handleEdit = (udf: UdfFieldDefinition) => {
    setEditingUdf(udf);
    setIsFormOpen(true);
  };

  const handleDelete = (udfId: string) => {
    setUdfFields(prevUdfs => prevUdfs.filter(udf => udf.id !== udfId));
    toast({ title: 'UDF Deleted', description: 'The UDF definition has been deleted.', variant: 'destructive' });
  };

  const handleViewDetails = (udf: UdfFieldDefinition) => {
    setSelectedItemForLog(udf);
    setIsLogDialogOpen(true);
  };

  const filteredUdfs = udfFields.filter(udf =>
    udf.label.toLowerCase().includes(filterText.toLowerCase()) ||
    udf.udfName.toLowerCase().includes(filterText.toLowerCase()) ||
    udf.dataType.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <MasterPageTemplate
      title="User Defined Fields (UDF)"
      description="Define custom fields to extend forms like Product Master, New Order, etc."
    >
      <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <Button onClick={handleAddNew} className="w-full sm:w-auto">
          <PlusCircle className="mr-2 h-4 w-4" /> Add New UDF
        </Button>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Input
            placeholder="Filter by label, name, type..."
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
          <CardTitle className="text-lg font-semibold">Defined UDFs</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-4 py-3">Display Label</TableHead>
                  <TableHead className="px-4 py-3">Internal Name (Key)</TableHead>
                  <TableHead className="px-4 py-3">Data Type</TableHead>
                  <TableHead className="px-4 py-3">Applicable Forms</TableHead>
                  <TableHead className="px-4 py-3 text-center">Required?</TableHead>
                  <TableHead className="px-4 py-3 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUdfs.length > 0 ? (
                  filteredUdfs.map(udf => (
                    <TableRow key={udf.id} className="odd:bg-muted/50">
                      <TableCell className="px-4 py-3 font-medium">{udf.label}</TableCell>
                      <TableCell className="px-4 py-3 text-xs font-mono">{udf.udfName}</TableCell>
                      <TableCell className="px-4 py-3">{udf.dataType}</TableCell>
                      <TableCell className="px-4 py-3 text-xs">
                        {udf.applicableForms.map(form => <Badge key={form} variant="secondary" className="mr-1 mb-1">{form}</Badge>)}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-center">{udf.isRequired ? 'Yes' : 'No'}</TableCell>
                      <TableCell className="px-4 py-3 text-right">
                         <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="shadow-lg rounded-md">
                            <DropdownMenuItem onClick={() => handleViewDetails(udf)} className="cursor-pointer">
                              <Eye className="mr-2 h-4 w-4" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator/>
                            <DropdownMenuItem onClick={() => handleEdit(udf)} className="cursor-pointer">
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(udf.id)} className="text-destructive focus:text-destructive cursor-pointer">
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
                      {filterText ? 'No UDFs match your filter.' : 'No UDFs defined. Click "Add New UDF" to get started.'}
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
          if (!open) setEditingUdf(null);
      }}>
        <DialogContent className="sm:max-w-2xl p-6 rounded-lg shadow-xl max-h-[80vh] flex flex-col">
          <DialogHeader className="mb-4">
            <DialogTitle className="flex items-center text-xl font-semibold">
                <Settings2 className="mr-2 h-5 w-5 text-primary" />
                {editingUdf ? 'Edit UDF Definition' : 'Add New UDF Definition'}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Configure the properties of the User Defined Field.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 flex-grow overflow-y-auto pr-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <FormField
                    control={form.control}
                    name="label"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel className="font-medium">Display Label *</FormLabel>
                        <FormControl><Input placeholder="e.g., Garment Fit" {...field} className="h-10"/></FormControl>
                        <FormDescription className="text-xs">This is what users will see on the form.</FormDescription>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="udfName"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel className="font-medium">Internal Name (Key) *</FormLabel>
                        <FormControl><Input placeholder="e.g., garment_fit_std" {...field} className="h-10 font-mono"/></FormControl>
                        <FormDescription className="text-xs">Unique key, no spaces. E.g., 'custom_style_attr'.</FormDescription>
                        <FormMessage />
                    </FormItem>
                    )}
                />
              </div>

              <FormField
                control={form.control}
                name="dataType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">Data Type *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger className="h-10"><SelectValue placeholder="Select data type" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="Text">Text (Single Line)</SelectItem>
                        <SelectItem value="Number">Number</SelectItem>
                        <SelectItem value="Dropdown">Dropdown (Select from list)</SelectItem>
                        <SelectItem value="Checkbox">Checkbox (Yes/No)</SelectItem>
                        <SelectItem value="Date">Date</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {watchedDataType === 'Dropdown' && (
                <FormField
                  control={form.control}
                  name="options"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">Dropdown Options *</FormLabel>
                      <FormControl><Textarea placeholder="Enter one option per line, e.g.,&#x0a;Option A&#x0a;Option B&#x0a;Option C" {...field} rows={4} className="min-h-[100px]"/></FormControl>
                      <FormDescription className="text-xs">Required if Data Type is Dropdown. Each line becomes an option.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="applicableForms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">Applicable Forms *</FormLabel>
                     <FormDescription className="text-xs pb-1">Select which forms this UDF will appear on.</FormDescription>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 border rounded-md max-h-40 overflow-y-auto">
                        {applicableFormsOptions.map((formKey) => (
                           <FormField
                            key={formKey}
                            control={form.control}
                            name="applicableForms"
                            render={({ field: checkboxField }) => (
                              <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={checkboxField.value?.includes(formKey)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? checkboxField.onChange([...(checkboxField.value || []), formKey])
                                        : checkboxField.onChange(
                                            (checkboxField.value || []).filter(
                                              (value) => value !== formKey
                                            )
                                          );
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal text-sm cursor-pointer">{formKey.replace(/([A-Z])/g, ' $1').trim()}</FormLabel>
                              </FormItem>
                            )}
                          />
                        ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
                <FormField
                  control={form.control}
                  name="tooltip"
                  render={({ field }) => (
                  <FormItem>
                      <FormLabel className="font-medium">Tooltip / Help Text</FormLabel>
                      <FormControl><Input placeholder="Optional help text for users" {...field} className="h-10"/></FormControl>
                      <FormDescription className="text-xs">This text will appear when users hover over a help icon next to the UDF label.</FormDescription>
                      <FormMessage />
                  </FormItem>
                  )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 items-center">
                <FormField
                    control={form.control}
                    name="defaultValue"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel className="font-medium">Default Value</FormLabel>
                        <FormControl><Input placeholder="Optional default value" {...field} className="h-10"/></FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="isRequired"
                    render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-2 pt-6">
                        <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} id="isUdfRequired" /></FormControl>
                        <FormLabel htmlFor="isUdfRequired" className="font-normal text-sm cursor-pointer">This UDF is Required</FormLabel>
                        <FormMessage />
                    </FormItem>
                    )}
                />
              </div>

              <DialogFooter className="pt-6 flex flex-col sm:flex-row sm:justify-end gap-2 sticky bottom-0 bg-background pb-0 -mb-6">
                <DialogClose asChild>
                    <Button type="button" variant="outline" className="w-full sm:w-auto">Cancel</Button>
                </DialogClose>
                <Button type="submit" className="w-full sm:w-auto">
                    <Save className="mr-2 h-4 w-4" />
                    {editingUdf ? 'Update UDF' : 'Save UDF'}
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
          itemName={selectedItemForLog.label}
          itemType="UDF Definition"
        />
      )}
    </MasterPageTemplate>
  );
}
    
