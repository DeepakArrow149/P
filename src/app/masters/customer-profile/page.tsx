
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
import { Users, Edit, Trash2, PlusCircle, Save, MoreVertical, X, Eye } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { MasterDataLogDialog } from '@/components/masters/MasterDataLogDialog';


const userDefinedFieldSchema = z.object({
  id: z.string().optional(),
  fieldName: z.string().min(1, "Field Name is required.").max(50, "Max 50 chars."),
  fieldValue: z.string().max(255, "Max 255 chars.").optional().default(''),
});
type UserDefinedFieldValues = z.infer<typeof userDefinedFieldSchema>;

const customerFormSchema = z.object({
  id: z.string().optional(),
  customerName: z.string().min(1, 'Customer Name is required').max(100, 'Max 100 chars'),
  description: z.string().max(250, 'Max 250 chars').optional().default(''),
  deliveryLocation: z.string().optional().default(''),
  distributionCentre: z.string().optional().default(''),
  seriouslyLateAfterDays: z.coerce.number().int().min(0, "Must be 0 or positive").optional().default(0),
  planningColor: z.string().optional().default('#FFFFFF'),
  upliftPercent: z.coerce.number().min(0, "Must be 0 or positive").max(100, "Cannot exceed 100").optional().default(0),
  userDefinedFields: z.array(userDefinedFieldSchema).optional().default([]),
  eventsNotes: z.string().optional().default(''),
});

type CustomerFormValues = z.infer<typeof customerFormSchema>;

interface CustomerData extends CustomerFormValues {
  id: string;
}

const defaultUdfItem: UserDefinedFieldValues = { fieldName: '', fieldValue: '' };
const defaultValues: Omit<CustomerData, 'id'> = {
  customerName: '',
  description: '',
  deliveryLocation: '',
  distributionCentre: '',
  seriouslyLateAfterDays: 0,
  planningColor: '#FFFFFF',
  upliftPercent: 0,
  userDefinedFields: [],
  eventsNotes: '',
};

const mockDeliveryLocations = ["Factory A", "Warehouse B", "Port C", "Customer DC"];
const mockDistributionCentres = ["DC North", "DC South", "DC Central", "International Hub"];

export default function CustomerMasterPage() {
  const { toast } = useToast();
  const [customers, setCustomers] = React.useState<CustomerData[]>([]);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingCustomer, setEditingCustomer] = React.useState<CustomerData | null>(null);
  const [filterText, setFilterText] = React.useState('');

  const [isLogDialogOpen, setIsLogDialogOpen] = React.useState(false);
  const [selectedItemForLog, setSelectedItemForLog] = React.useState<CustomerData | null>(null);

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues,
  });

  const { fields: udfFields, append: appendUdf, remove: removeUdf } = useFieldArray({
    control: form.control,
    name: "userDefinedFields",
  });

  React.useEffect(() => {
    if (editingCustomer) {
      form.reset(editingCustomer);
    } else {
      form.reset(defaultValues);
    }
  }, [editingCustomer, form, isFormOpen]);

  const onSubmit = (data: CustomerFormValues) => {
    if (editingCustomer) {
      setCustomers(prev =>
        prev.map(c => (c.id === editingCustomer.id ? { ...editingCustomer, ...data } : c))
      );
      toast({ title: 'Customer Updated', description: `Customer "${data.customerName}" updated.` });
    } else {
      const newId = `CUST-${Date.now()}`;
      const newCustomer: CustomerData = { ...data, id: newId };
      setCustomers(prev => [newCustomer, ...prev]);
      toast({ title: 'Customer Added', description: `Customer "${data.customerName}" added.` });
    }
    setIsFormOpen(false);
    setEditingCustomer(null);
  };

  const handleAddNew = () => {
    setEditingCustomer(null);
    form.reset(defaultValues);
    setIsFormOpen(true);
  };

  const handleEdit = (customer: CustomerData) => {
    setEditingCustomer(customer);
    setIsFormOpen(true);
  };

  const handleDelete = (customerId: string) => {
    setCustomers(prev => prev.filter(c => c.id !== customerId));
    toast({ title: 'Customer Deleted', variant: 'destructive' });
  };

  const handleViewDetails = (customer: CustomerData) => {
    setSelectedItemForLog(customer);
    setIsLogDialogOpen(true);
  };

  const filteredCustomers = customers.filter(customer =>
    customer.customerName.toLowerCase().includes(filterText.toLowerCase()) ||
    (customer.description && customer.description.toLowerCase().includes(filterText.toLowerCase()))
  );

  return (
    <MasterPageTemplate
      title="Customer Master"
      description="Manage customer information, preferences, and custom fields."
      addLabel="Add New Customer"
      onAdd={handleAddNew}
    >
      <div className="mb-6 flex items-center justify-between gap-4">
        <Input
          placeholder="Filter by name or description..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          className="h-10 max-w-sm"
        />
      </div>

      <Card className="shadow-lg rounded-lg">
        <CardHeader className="px-6 py-4 border-b">
          <CardTitle className="text-lg font-semibold">Customer List</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-4 py-3">Customer Name</TableHead>
                  <TableHead className="px-4 py-3">Delivery Location</TableHead>
                  <TableHead className="px-4 py-3 text-right">Uplift %</TableHead>
                  <TableHead className="px-4 py-3 text-center">Planning Color</TableHead>
                  <TableHead className="px-4 py-3 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map(customer => (
                    <TableRow key={customer.id} className="odd:bg-muted/50">
                      <TableCell className="px-4 py-3 font-medium">{customer.customerName}</TableCell>
                      <TableCell className="px-4 py-3">{customer.deliveryLocation || '-'}</TableCell>
                      <TableCell className="px-4 py-3 text-right">{customer.upliftPercent}%</TableCell>
                      <TableCell className="px-4 py-3 text-center">
                        <div className="inline-block w-6 h-6 rounded border" style={{ backgroundColor: customer.planningColor }}></div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetails(customer)} className="cursor-pointer">
                              <Eye className="mr-2 h-4 w-4" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator/>
                            <DropdownMenuItem onClick={() => handleEdit(customer)} className="cursor-pointer"><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(customer.id)} className="text-destructive focus:text-destructive cursor-pointer"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={5} className="h-24 text-center px-4 py-3 text-muted-foreground">No customers found.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={(open) => { setIsFormOpen(open); if (!open) setEditingCustomer(null); }}>
        <DialogContent className="sm:max-w-3xl max-h-[85vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-4 border-b">
            <DialogTitle className="flex items-center text-xl font-semibold">
              <Users className="mr-2 h-5 w-5 text-primary" />
              {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {editingCustomer ? 'Update details for this customer.' : 'Enter new customer information.'}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex-grow overflow-y-hidden flex flex-col">
              <ScrollArea className="flex-grow px-6 py-2"> 
                <Tabs defaultValue="general" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 mb-4">
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="udf">User Defined Fields</TabsTrigger>
                    <TabsTrigger value="events">Events</TabsTrigger>
                  </TabsList>

                  <TabsContent value="general" className="space-y-6">
                    <FormField control={form.control} name="customerName" render={({ field }) => (<FormItem><FormLabel>Customer Name *</FormLabel><FormControl><Input placeholder="e.g., Global Fashion Retail" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Brief description of the customer..." {...field} rows={3} /></FormControl><FormMessage /></FormItem>)} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField control={form.control} name="deliveryLocation" render={({ field }) => (<FormItem><FormLabel>Delivery Location</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger></FormControl><SelectContent>{mockDeliveryLocations.map(loc => <SelectItem key={loc} value={loc}>{loc}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="distributionCentre" render={({ field }) => (<FormItem><FormLabel>Distribution Centre</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select centre" /></SelectTrigger></FormControl><SelectContent>{mockDistributionCentres.map(dc => <SelectItem key={dc} value={dc}>{dc}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <FormField control={form.control} name="seriouslyLateAfterDays" render={({ field }) => (<FormItem><FormLabel>Seriously Late After (Days)</FormLabel><FormControl><Input type="number" placeholder="e.g., 5" {...field} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="planningColor" render={({ field }) => (<FormItem><FormLabel>Planning Color</FormLabel><FormControl><Input type="color" {...field} className="h-10 w-full p-1" /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="upliftPercent" render={({ field }) => (<FormItem><FormLabel>Uplift Percent (%)</FormLabel><FormControl><Input type="number" placeholder="e.g., 2.5" step="0.1" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                  </TabsContent>

                  <TabsContent value="udf" className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-md font-medium">User Defined Fields</h4>
                      <Button type="button" size="sm" variant="outline" onClick={() => appendUdf(defaultUdfItem)}><PlusCircle className="mr-2 h-4 w-4" /> Add Field</Button>
                    </div>
                    {udfFields.map((udfItem, index) => (
                      <div key={udfItem.id} className="grid grid-cols-[1fr,1fr,auto] gap-3 items-end p-3 border rounded-md bg-muted/30">
                        <FormField control={form.control} name={`userDefinedFields.${index}.fieldName`} render={({ field: nameField }) => (<FormItem><FormLabel>Field Name *</FormLabel><FormControl><Input placeholder="e.g., Account Manager" {...nameField} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name={`userDefinedFields.${index}.fieldValue`} render={({ field: valueField }) => (<FormItem><FormLabel>Field Value</FormLabel><FormControl><Input placeholder="Value" {...valueField} /></FormControl><FormMessage /></FormItem>)} />
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeUdf(index)} className="text-destructive hover:text-destructive"><X className="h-4 w-4" /></Button>
                      </div>
                    ))}
                    {form.formState.errors.userDefinedFields && !form.formState.errors.userDefinedFields.root && udfFields.length > 0 && (<p className="text-sm font-medium text-destructive">Error in UDFs. Please check values.</p>)}
                  </TabsContent>

                  <TabsContent value="events" className="space-y-4">
                     <FormField control={form.control} name="eventsNotes" render={({ field }) => (<FormItem><FormLabel>Event Notes</FormLabel><FormControl><Textarea placeholder="Log any customer-specific events or interactions here..." {...field} rows={5} /></FormControl><FormMessage /></FormItem>)} />
                  </TabsContent>
                </Tabs>
              </ScrollArea>
              <DialogFooter className="p-6 pt-4 border-t flex-shrink-0">
                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                <Button type="submit"><Save className="mr-2 h-4 w-4" />{editingCustomer ? 'Update Customer' : 'Save Customer'}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {selectedItemForLog && (
        <MasterDataLogDialog
          isOpen={isLogDialogOpen}
          onOpenChange={setIsLogDialogOpen}
          itemName={selectedItemForLog.customerName}
          itemType="Customer"
        />
      )}
    </MasterPageTemplate>
  );
}
