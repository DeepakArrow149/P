
'use client';

import * as React from 'react';
import { MasterPageTemplate } from '@/components/masters/master-page-template';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { Package, Save, Upload, PlusCircle, Trash2, CalendarIcon, ListChecks, DollarSign, LinkIcon as PropertyMatchIcon, CalendarDays as EventsIcon, ShoppingBag } from 'lucide-react';
import Image from 'next/image';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { z } from 'zod';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';


const operationItemSchema = z.object({
  id: z.string().optional(),
  operation: z.string().min(1, "Operation name is required"),
  units: z.string().min(1, "Units are required"),
  value: z.coerce.number().min(0, "Value must be non-negative"),
});
type OperationItemValues = z.infer<typeof operationItemSchema>;

const eventItemSchema = z.object({
  id: z.string().optional(),
  eventName: z.string().min(1, "Event name is required"),
  targetDate: z.date().optional(),
  offsetDuration: z.string().optional().default(''),
  number: z.coerce.number().optional().default(0),
  skip: z.boolean().optional().default(false),
  completeForCp: z.boolean().optional().default(false),
});
type EventItemValues = z.infer<typeof eventItemSchema>;

const productFormSchema = z.object({
  // General Tab
  productCode: z.string().min(1, 'Product Code is required'),
  description: z.string().optional().default(''),
  productType: z.string().min(1, "Product Type is required."),
  sizesRequired: z.array(z.string()).optional().default([]),
  preProductionCustomer: z.string().optional().default(''),
  timetable: z.string().optional().default(''),
  launchDate: z.date().optional(),
  colorSelection: z.string().optional().default(''),
  productImage: z.any().optional(),

  // Operations and Routing (Now a separate tab)
  operations: z.array(operationItemSchema).optional().default([]),

  // Financial Tab
  sellingPrice: z.coerce.number().optional().default(0),
  materialCost: z.coerce.number().optional().default(0),
  labourCost: z.coerce.number().optional().default(0),
  otherDirectCost: z.coerce.number().optional().default(0),

  // Property Match Tab
  propertyMatchValues: z.string().optional().default(''),
  mirrorPropertyMatch: z.boolean().optional().default(false),

  // Events Tab
  events: z.array(eventItemSchema).optional().default([]),

  // Size Stock Tab
  sizeStockNotes: z.string().optional().default(''), // Placeholder

  // User Values Tab
  userValuesNotes: z.string().optional().default(''), // Placeholder
});

type ProductFormValues = z.infer<typeof productFormSchema>;

const allAvailableSizes = ["XS", "S", "M", "L", "XL", "XXL", "104", "106", "110", "112", "114", "116"];
const productTypeOptions = ["Apparel", "Footwear", "Accessories", "Home Goods", "Other"];
const customerOptions = ["Nike", "Adidas", "Puma", "Retail Partner A", "In-house Brand"];
const timetableOptions = ["SS25 Forecast", "AW24 Confirmed", "Core Collection", "Promotional Q3"];


const defaultValues: ProductFormValues = {
  productCode: '',
  description: '',
  productType: '',
  sizesRequired: [],
  preProductionCustomer: '',
  timetable: '',
  launchDate: undefined,
  colorSelection: '',
  productImage: null,
  operations: [{ id: crypto.randomUUID(), operation: '', units: '', value: 0 }],
  sellingPrice: 0,
  materialCost: 0,
  labourCost: 0,
  otherDirectCost: 0,
  propertyMatchValues: '',
  mirrorPropertyMatch: false,
  events: [{ id: crypto.randomUUID(), eventName: '', targetDate: undefined, offsetDuration: '', number:0, skip:false, completeForCp:false }],
  sizeStockNotes: '',
  userValuesNotes: '',
};

export default function ProductMasterPage() {
  const { toast } = useToast();
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues,
    mode: 'onChange',
  });

  const [imagePreview, setImagePreview] = React.useState<string | null>(null);

  const { fields: operationFields, append: appendOperation, remove: removeOperation } = useFieldArray({
    control: form.control,
    name: "operations",
  });

  const { fields: eventFields, append: appendEvent, remove: removeEvent } = useFieldArray({
    control: form.control,
    name: "events",
  });

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      form.setValue('productImage', file);
    } else {
      setImagePreview(null);
      form.setValue('productImage', null);
    }
  };

  function onSubmit(data: ProductFormValues) {
    console.log("Product Master Data:", data);
    toast({
      title: 'Product Saved!',
      description: `Product ${data.productCode} data has been (console) saved.`,
    });
    // form.reset(); // Optionally reset form
    // setImagePreview(null);
  }

  const totalEvents = eventFields.length;
  const completedEvents = eventFields.filter(event => form.watch(`events.${eventFields.indexOf(event)}.completeForCp`)).length;
  const allEventsComplete = totalEvents > 0 && completedEvents === totalEvents;


  return (
    <MasterPageTemplate
      title="Products"
      description="Manage comprehensive product master data including operations, financials, and events."
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-1 mb-6">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="operations">Ops & Routing</TabsTrigger>
              <TabsTrigger value="financial">Financial</TabsTrigger>
              <TabsTrigger value="propertyMatch">Property Match</TabsTrigger>
              <TabsTrigger value="events">Events</TabsTrigger>
              <TabsTrigger value="sizeStock">Size Stock</TabsTrigger>
              <TabsTrigger value="userValues">User Values</TabsTrigger>
            </TabsList>

            <TabsContent value="general">
              <Card>
                <CardHeader><CardTitle>General Information</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <FormField control={form.control} name="productCode" render={({ field }) => (<FormItem><FormLabel>Product Code *</FormLabel><FormControl><Input placeholder="e.g., TSHIRT-001" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="productType" render={({ field }) => (<FormItem><FormLabel>Product Type *</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl><SelectContent>{productTypeOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="preProductionCustomer" render={({ field }) => (<FormItem><FormLabel>Pre-production Customer</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger></FormControl><SelectContent>{customerOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="timetable" render={({ field }) => (<FormItem><FormLabel>Timetable</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select timetable" /></SelectTrigger></FormControl><SelectContent>{timetableOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="launchDate" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Launch Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant="outline" className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}</Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent></Popover><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="colorSelection" render={({ field }) => (<FormItem><FormLabel>Color</FormLabel><FormControl><Input placeholder="e.g., Navy Blue, #000080" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                  <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Detailed product description..." {...field} rows={3} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="sizesRequired" render={() => (
                    <FormItem>
                      <FormLabel>Sizes Required</FormLabel>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 p-3 border rounded-md">
                        {allAvailableSizes.map((size) => (
                          <FormField key={size} control={form.control} name="sizesRequired"
                            render={({ field }) => {
                              return (
                                <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                  <FormControl><Checkbox checked={field.value?.includes(size)} onCheckedChange={(checked) => { return checked ? field.onChange([...(field.value || []), size]) : field.onChange((field.value || []).filter(value => value !== size)); }} /></FormControl>
                                  <FormLabel className="font-normal text-sm">{size}</FormLabel>
                                </FormItem>
                              );
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="productImage" render={() => (
                    <FormItem>
                      <FormLabel>Product Image</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-4">
                          <Button type="button" variant="outline" asChild><label htmlFor="productImageFile" className="cursor-pointer flex items-center px-4"><Upload className="mr-2 h-4 w-4" /> Upload Image<input id="productImageFile" type="file" className="sr-only" accept="image/*" onChange={handleImageChange} /></label></Button>
                          {imagePreview && (<div className="w-24 h-24 rounded-md border overflow-hidden"><Image src={imagePreview} alt="Product preview" width={96} height={96} className="object-cover w-full h-full" data-ai-hint="product apparel"/></div>)}
                          {!imagePreview && (<div className="w-24 h-24 rounded-md border border-dashed bg-muted/50 flex items-center justify-center"><Package className="h-8 w-8 text-muted-foreground" /></div>)}
                        </div>
                      </FormControl>
                      <FormDescription className="text-xs">Upload an image for the product (optional).</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="operations">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Work content by operation and route</CardTitle>
                  <Button type="button" size="sm" variant="outline" onClick={() => appendOperation({ id: crypto.randomUUID(), operation: '', units: '', value: 0 })}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Operation
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {operationFields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-[1fr,1fr,1fr,auto] gap-3 items-end p-3 border rounded-md bg-muted/30 relative">
                       <FormField control={form.control} name={`operations.${index}.operation`} render={({ field: opField }) => (<FormItem><FormLabel>Operation *</FormLabel><FormControl><Input placeholder="e.g., CUT" {...opField} /></FormControl><FormMessage /></FormItem>)} />
                       <FormField control={form.control} name={`operations.${index}.units`} render={({ field: unitField }) => (<FormItem><FormLabel>Units *</FormLabel><FormControl><Input placeholder="e.g., SMV, Pcs" {...unitField} /></FormControl><FormMessage /></FormItem>)} />
                       <FormField control={form.control} name={`operations.${index}.value`} render={({ field: valField }) => (<FormItem><FormLabel>Value *</FormLabel><FormControl><Input type="number" placeholder="e.g., 12.5" {...valField} /></FormControl><FormMessage /></FormItem>)} />
                       <Button type="button" variant="ghost" size="icon" onClick={() => removeOperation(index)} disabled={operationFields.length <=1} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  ))}
                   {form.formState.errors.operations && !form.formState.errors.operations.root && operationFields.length > 0 && (<p className="text-sm font-medium text-destructive">Error in operations. Please check values.</p>)}
                   {form.formState.errors.operations?.root?.message && (<p className="text-sm font-medium text-destructive">{form.formState.errors.operations.root.message}</p>)}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="financial">
              <Card>
                <CardHeader><CardTitle className="flex items-center"><DollarSign className="mr-2 h-5 w-5 text-primary" />Financial Details</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField control={form.control} name="sellingPrice" render={({ field }) => (<FormItem><FormLabel>Selling Price</FormLabel><FormControl><Input type="number" placeholder="0.00" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="materialCost" render={({ field }) => (<FormItem><FormLabel>Material Cost</FormLabel><FormControl><Input type="number" placeholder="0.00" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="labourCost" render={({ field }) => (<FormItem><FormLabel>Labour Cost</FormLabel><FormControl><Input type="number" placeholder="0.00" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="otherDirectCost" render={({ field }) => (<FormItem><FormLabel>Other Direct Cost</FormLabel><FormControl><Input type="number" placeholder="0.00" {...field} /></FormControl><FormMessage /></FormItem>)} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="propertyMatch">
              <Card>
                <CardHeader><CardTitle className="flex items-center"><PropertyMatchIcon className="mr-2 h-5 w-5 text-primary" />Property Match</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <FormField control={form.control} name="propertyMatchValues" render={({ field }) => (<FormItem><FormLabel>Property Values (one per line)</FormLabel><FormControl><Textarea placeholder="e.g., FACTORY_1&#x0a;FACTORY_2" {...field} rows={5}/></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="mirrorPropertyMatch" render={({ field }) => (<FormItem className="flex flex-row items-center space-x-2"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="font-normal">Mirror this value on the general tab</FormLabel><FormMessage /></FormItem>)} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="events">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex flex-col">
                        <CardTitle className="flex items-center"><EventsIcon className="mr-2 h-5 w-5 text-primary" />Product Development Events</CardTitle>
                        {totalEvents > 0 && (
                            <div className={cn("mt-1 text-xs font-medium px-2 py-0.5 rounded-full w-fit", allEventsComplete ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700")}>
                                {allEventsComplete ? "All Events Complete" : `${completedEvents}/${totalEvents} Events Complete`}
                            </div>
                        )}
                    </div>
                  <Button type="button" size="sm" variant="outline" onClick={() => appendEvent({ id: crypto.randomUUID(), eventName: '', targetDate: undefined, offsetDuration: '', number:0, skip:false, completeForCp:false })}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Event
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {eventFields.map((field, index) => (
                    <Card key={field.id} className="p-3 bg-muted/30">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3 items-start">
                        <FormField control={form.control} name={`events.${index}.eventName`} render={({ field: nameField }) => (<FormItem><FormLabel>Event Name *</FormLabel><FormControl><Input placeholder="e.g., Design Brief" {...nameField} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name={`events.${index}.targetDate`} render={({ field: dateField }) => (<FormItem className="flex flex-col"><FormLabel>Target Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dateField.value && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{dateField.value ? format(dateField.value, "PPP") : <span>Pick a date</span>}</Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={dateField.value} onSelect={dateField.onChange} /></PopoverContent></Popover><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name={`events.${index}.offsetDuration`} render={({ field: odField }) => (<FormItem><FormLabel>Offset/Duration</FormLabel><FormControl><Input placeholder="e.g., 5 / 0" {...odField} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name={`events.${index}.number`} render={({ field: numField }) => (<FormItem><FormLabel>Number</FormLabel><FormControl><Input type="number" placeholder="0" {...numField} /></FormControl><FormMessage /></FormItem>)} />
                        <div className="flex flex-row items-center space-x-4 pt-6 col-span-full md:col-span-1">
                           <FormField control={form.control} name={`events.${index}.skip`} render={({ field: skipField }) => (<FormItem className="flex items-center space-x-2"><FormControl><Checkbox checked={skipField.value} onCheckedChange={skipField.onChange} /></FormControl><FormLabel className="font-normal text-sm">Skip</FormLabel></FormItem>)} />
                           <FormField control={form.control} name={`events.${index}.completeForCp`} render={({ field: cpField }) => (<FormItem className="flex items-center space-x-2"><FormControl><Checkbox checked={cpField.value} onCheckedChange={cpField.onChange} /></FormControl><FormLabel className="font-normal text-sm">Complete for CP</FormLabel></FormItem>)} />
                        </div>
                        <div className="flex justify-end md:col-start-3">
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeEvent(index)} disabled={eventFields.length <= 1} className="text-destructive hover:text-destructive self-start mt-5"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                  {form.formState.errors.events && !form.formState.errors.events.root && eventFields.length > 0 && (<p className="text-sm font-medium text-destructive">Error in events. Please check values.</p>)}
                  {form.formState.errors.events?.root?.message && (<p className="text-sm font-medium text-destructive">{form.formState.errors.events.root.message}</p>)}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sizeStock">
              <Card>
                <CardHeader><CardTitle className="flex items-center"><ShoppingBag className="mr-2 h-5 w-5 text-primary" />Size Stock Details</CardTitle></CardHeader>
                <CardContent>
                  <FormField control={form.control} name="sizeStockNotes" render={({ field }) => (<FormItem><FormLabel className="sr-only">Size Stock Notes</FormLabel><FormControl><Textarea placeholder="Enter size-specific stock levels, inventory notes, or related details..." {...field} rows={6}/></FormControl><FormMessage /></FormItem>)} />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="userValues">
              <Card>
                <CardHeader><CardTitle className="flex items-center"><ListChecks className="mr-2 h-5 w-5 text-primary" />User Defined Values</CardTitle></CardHeader>
                <CardContent>
                  <FormField control={form.control} name="userValuesNotes" render={({ field }) => (<FormItem><FormLabel className="sr-only">User Values Notes</FormLabel><FormControl><Textarea placeholder="Enter custom fields, user-specific data, or additional parameters..." {...field} rows={6}/></FormControl><FormMessage /></FormItem>)} />
                </CardContent>
              </Card>
            </TabsContent>

          </Tabs>

          <div className="flex justify-end pt-4">
            <Button type="submit" className="h-10 px-6">
              <Save className="mr-2 h-4 w-4" /> Save Product
            </Button>
          </div>
        </form>
      </Form>
    </MasterPageTemplate>
  );
}

    