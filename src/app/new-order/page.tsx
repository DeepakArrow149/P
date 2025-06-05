
// src/app/new-order/page.tsx
'use client';

import * as React from 'react';
import { useForm, useFieldArray, Controller, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { CalendarIcon, Save, PlusCircle, Trash2, Palette, HelpCircle, Package, Users, ListChecks, Clock, Edit, GripVertical, PackagePlus, BarChartHorizontalBig, FileText, Layers, ActivityIcon } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { addOrder, type StoredOrder } from '@/lib/orderService';
import { getAllLearningCurvesFromFirebase } from '@/lib/firebaseService';
import type { LearningCurveMaster } from '@/lib/learningCurveTypes';
import { PoSizeTable } from '@/components/order-form/PoSizeTable';

// Schemas for nested structures
const deliveryDetailSchema = z.object({
  id: z.string(),
  deliveryDate: z.date({ required_error: "Delivery date is required." }),
  quantity: z.coerce.number().min(0, "Quantity must be at least 0.").default(0),
  reference: z.string().optional().default(''),
});
export type DeliveryDetail = z.infer<typeof deliveryDetailSchema>;

export const poSizeItemSchema = z.object({
  sizeName: z.string().min(1, "Size name is required"),
  quantity: z.coerce.number().min(0, "Qty must be >= 0").default(0),
});
export type PoSizeItem = z.infer<typeof poSizeItemSchema>;

export const poLineSchema = z.object({
  id: z.string(),
  soNo: z.string().optional().default(''),
  poName: z.string().min(1, "PO Name is required"),
  deliveryDate: z.date({ required_error: "Delivery date is required" }),
  country: z.string().optional().default(''),
  extraPercentage: z.coerce.number().min(0, "Extra % must be >= 0").max(100, "Extra % must be <= 100").optional().default(0),
  sizeQuantities: z.array(poSizeItemSchema).min(1, "At least one size quantity entry is required"),
});
export type PoLine = z.infer<typeof poLineSchema>;


const newOrderFormSchema = z.object({
  // Top Level Date Fields
  orderDate: z.date().optional(),
  receivedDate: z.date().optional(),

  // General Tab - Order Details
  orderReference: z.string().min(1, "Order Reference is required.").default(''),
  description: z.string().optional().default(''),
  product: z.string().min(1, "Product selection is required.").default(''),
  customer: z.string().min(1, "Customer selection is required.").default(''),
  timetable: z.string().optional().default(''),
  orderSet: z.string().optional().default(''),
  salesYear: z.coerce.number().optional(),
  season: z.string().optional().default(''),
  efficiency: z.coerce.number().optional(),
  userStatus: z.string().optional().default(''),
  learningCurveId: z.string().min(1, "Learning Curve is required.").default(''),
  tnaTemplate: z.string().min(1, "T&A Template is required.").default(''),
  status: z.enum(["confirmed", "provisional", "speculative", "transit"]).default("provisional"),
  color: z.string().optional().default('#FFFFFF'),
  isCompleted: z.boolean().default(false),

  // General Tab - Delivery Details (Array)
  deliveryDetails: z.array(deliveryDetailSchema).min(1, "At least one delivery detail line is required."),

  // General Tab - Logistics
  contractQuantity: z.coerce.number().optional(),
  distributeFrom: z.string().optional().default(''),
  deliverTo: z.string().optional().default(''),
  method: z.string().optional().default(''),
  planInGroup: z.string().optional().default(''),
  useRoute: z.string().optional().default(''),
  deliveredQuantity: z.coerce.number().optional(),
  reservation: z.string().optional().default(''),
  scheduleOffset: z.string().optional().default(''),

  poLines: z.array(poLineSchema).min(1, "At least one PO/Size breakdown line is required."),
  activeSizeNames: z.array(z.string()).min(1, "At least one size column is required."),

  // Notes fields for tabs
  generalNotes: z.string().optional().default(''),
  financialNotes: z.string().optional().default(''),
  sizesNotes: z.string().optional().default(''),
  planningNotes: z.string().optional().default(''),
  materialsNotes: z.string().optional().default(''),
  eventsNotes: z.string().optional().default(''),
  userValuesNotes: z.string().optional().default(''),
  consolidatedViewNotes: z.string().optional().default(''),
  progressViewNotes: z.string().optional().default(''),
});

export type NewOrderFormValues = z.infer<typeof newOrderFormSchema>;

const createDefaultDeliveryDetail = (): DeliveryDetail => ({
  id: crypto.randomUUID(),
  deliveryDate: new Date(),
  quantity: 0,
  reference: '',
});

const createDefaultPoLine = (activeSizeNames: string[]): PoLine => ({
  id: crypto.randomUUID(),
  soNo: '',
  poName: '',
  deliveryDate: new Date(),
  country: '',
  extraPercentage: 0,
  sizeQuantities: activeSizeNames.map(sizeName => ({ sizeName, quantity: 0 })),
});


const defaultValues: NewOrderFormValues = {
  orderDate: undefined, 
  receivedDate: undefined, 
  orderReference: '',
  description: '',
  product: '',
  customer: '',
  timetable: '',
  orderSet: '',
  salesYear: new Date().getFullYear(),
  season: '',
  efficiency: 100,
  userStatus: '',
  learningCurveId: '',
  tnaTemplate: '',
  status: 'provisional',
  color: '#FFFFFF',
  isCompleted: false,
  deliveryDetails: [createDefaultDeliveryDetail()],
  contractQuantity: 0,
  distributeFrom: '',
  deliverTo: '',
  method: '',
  planInGroup: '',
  useRoute: '',
  deliveredQuantity: 0,
  reservation: '',
  scheduleOffset: '',
  poLines: [createDefaultPoLine(['S', 'M', 'L', 'XL'])],
  activeSizeNames: ['S', 'M', 'L', 'XL'],
  generalNotes: '',
  financialNotes: '',
  sizesNotes: '',
  planningNotes: '',
  materialsNotes: '',
  eventsNotes: '',
  userValuesNotes: '',
  consolidatedViewNotes: '',
  progressViewNotes: '',
};

const tnaTemplateOptions = [
  { value: 'standard_tna', label: 'Standard T&A' },
  { value: 'express_tna', label: 'Express T&A' },
  { value: 'custom_tna_basic', label: 'Custom Basic T&A' },
];

const productOptions = [
  { value: 't_shirt', label: 'T-Shirt' },
  { value: 'jeans', label: 'Jeans' },
  { value: 'jacket', label: 'Jacket' },
  { value: 'dress', label: 'Dress' },
  { value: 'accessories_new', label: 'New Accessory Product...' },
];

const customerOptions = [
  { value: 'alpha_corp', label: 'Alpha Corp' },
  { value: 'beta_retail', label: 'Beta Retail' },
  { value: 'gamma_fashion', label: 'Gamma Fashion House' },
  { value: 'new_customer_placeholder', label: 'Add New Customer...' },
];

const timetableOptions = [
  { value: 'forecast_q1', label: 'Forecast Q1' },
  { value: 'forecast_q2', label: 'Forecast Q2' },
  { value: 'confirmed_ss25', label: 'Confirmed SS25' },
];

const countryOptions = [
  { value: 'USA', label: 'USA' },
  { value: 'Canada', label: 'Canada' },
  { value: 'UK', label: 'United Kingdom' },
  { value: 'Germany', label: 'Germany' },
  { value: 'France', label: 'France' },
];


export default function NewOrderPage() {
  const { toast } = useToast();
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);
  const [learningCurves, setLearningCurves] = React.useState<LearningCurveMaster[]>([]);
  const [activeTab, setActiveTab] = React.useState("general");
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const form = useForm<NewOrderFormValues>({
    resolver: zodResolver(newOrderFormSchema),
    defaultValues,
    mode: 'onSubmit', 
  });

  React.useEffect(() => {
    if (isClient) {
      if (!form.getValues('orderDate')) {
        form.setValue('orderDate', new Date(), { shouldValidate: false, shouldDirty: false });
      }
      if (!form.getValues('receivedDate')) {
        form.setValue('receivedDate', new Date(), { shouldValidate: false, shouldDirty: false });
      }
    }
  }, [isClient, form]);


  const { fields: deliveryFields, append: appendDelivery, remove: removeDelivery } = useFieldArray({
    control: form.control,
    name: "deliveryDetails",
  });

  React.useEffect(() => {
    async function fetchLcData() {
      try {
        const lcData = await getAllLearningCurvesFromFirebase();
        setLearningCurves(lcData);

        // if (lcData.length > 0 && !form.getValues('learningCurveId')) {
        //   form.setValue('learningCurveId', lcData[0].id, { shouldValidate: true });
        // }
      } catch (error) {
        console.error("Failed to fetch learning curves for New Order form:", error);
        toast({ title: "Error", description: "Could not load learning curves.", variant: "destructive" });
      }
    }
    if (isClient) { 
        fetchLcData();
    }
  }, [toast, form, isClient]);


  async function onSubmit(data: NewOrderFormValues) {
    console.log('Submitting New Order Data:', data);
    try {
      const orderId = await addOrder(data);
      toast({
        title: 'Order Submitted!',
        description: `Order ${data.orderReference} (ID: ${orderId}) has been successfully created.`,
      });
      form.reset({
        ...defaultValues,
        orderDate: isClient ? new Date() : undefined, 
        receivedDate: isClient ? new Date() : undefined,
        activeSizeNames: [...(defaultValues.activeSizeNames || ['S', 'M', 'L', 'XL'])], 
        poLines: [createDefaultPoLine(defaultValues.activeSizeNames || ['S', 'M', 'L', 'XL'])], 
      });
      setActiveTab("general"); 
    } catch (error) {
      console.error("Failed to save order: ", error);
      toast({
        title: 'Error Saving Order',
        description: 'There was a problem saving the order. Please try again.',
        variant: 'destructive',
      });
    }
  }

  const onFormError = (errors: FieldErrors<NewOrderFormValues>) => {
    console.error("Form validation errors:", errors);
    let errorSummary = "Please check the form for errors.";
    const errorKeys = Object.keys(errors) as Array<keyof NewOrderFormValues>;
    if (errorKeys.length > 0) {
        const firstErrorFieldKey = errorKeys[0];
        const fieldError = errors[firstErrorFieldKey];
        let fieldMessage = "Unknown error";

        if (fieldError) {
            if (typeof fieldError.message === 'string') {
                fieldMessage = fieldError.message;
            } else if (Array.isArray(fieldError) && fieldError.length > 0 && fieldError[0] && typeof fieldError[0].message === 'string') {
                fieldMessage = fieldError[0].message;
            } else if (typeof fieldError === 'object' && fieldError !== null && (fieldError as any).root && typeof (fieldError as any).root.message === 'string') {
                fieldMessage = (fieldError as any).root.message;
            } else if (typeof fieldError === 'object' && fieldError !== null) {
                const nestedErrorKey = Object.keys(fieldError)[0];
                 if (nestedErrorKey && (fieldError as any)[nestedErrorKey] && typeof (fieldError as any)[nestedErrorKey].message === 'string') {
                     fieldMessage = (fieldError as any)[nestedErrorKey].message;
                }
            }
        }
        
        let errorTab = 'general'; 
        if (['financialNotes'].includes(firstErrorFieldKey)) errorTab = 'financial';
        else if (['sizesNotes'].includes(firstErrorFieldKey)) errorTab = 'sizes';
        else if (['planningNotes'].includes(firstErrorFieldKey)) errorTab = 'planning';
        else if (['materialsNotes'].includes(firstErrorFieldKey)) errorTab = 'materials';
        else if (['eventsNotes'].includes(firstErrorFieldKey)) errorTab = 'events';
        else if (['userValuesNotes'].includes(firstErrorFieldKey)) errorTab = 'user_values';
        else if (['generalNotes'].includes(firstErrorFieldKey)) errorTab = 'notes';
        else if (['consolidatedViewNotes'].includes(firstErrorFieldKey)) errorTab = 'consolidated_view';
        else if (['progressViewNotes'].includes(firstErrorFieldKey)) errorTab = 'progress_view';
        
        errorSummary = `Error in field "${String(firstErrorFieldKey)}": ${fieldMessage}. Please review the '${errorTab}' tab.`;
        setActiveTab(errorTab);
    }

    toast({
      title: "Validation Error",
      description: errorSummary,
      variant: "destructive",
    });
  };

  const handleDeleteOrder = () => {
    form.reset({
        ...defaultValues,
        orderDate: isClient ? new Date() : undefined, 
        receivedDate: isClient ? new Date() : undefined,
        activeSizeNames: [...(defaultValues.activeSizeNames || ['S', 'M', 'L', 'XL'])],
        poLines: [createDefaultPoLine(defaultValues.activeSizeNames || ['S', 'M', 'L', 'XL'])],
      });
    toast({
      title: "Order Draft Cleared",
      description: "The current new order form has been cleared.",
      variant: "destructive"
    });
    setIsDeleteAlertOpen(false);
    setActiveTab("general");
  };
  
  if (!isClient) {
    return (
      <div className="space-y-6">
        <PageHeader title="Create New Order" />
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Order Specification</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Loading form...</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <PageHeader title="Create New Order" />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit, onFormError)} className="space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Order Specification</CardTitle>
                <div className="flex space-x-2">
                  <FormField
                    control={form.control}
                    name="orderDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col w-48">
                        <FormLabel className="text-xs">Order Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button variant="outline" size="sm" className={cn("h-9", !field.value && "text-muted-foreground")}>
                                {field.value ? format(field.value, 'PPP') : <span>Pick date</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent>
                        </Popover>
                         <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="receivedDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col w-48">
                        <FormLabel className="text-xs">Received Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button variant="outline" size="sm" className={cn("h-9",!field.value && "text-muted-foreground")}>
                                {field.value ? format(field.value, 'PPP') : <span>Pick date</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent>
                        </Popover>
                         <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 sm:grid-cols-5 md:grid-cols-10 mb-6">
                  <TabsTrigger value="general">General</TabsTrigger>
                  <TabsTrigger value="financial">Financial</TabsTrigger>
                  <TabsTrigger value="sizes">Sizes</TabsTrigger>
                  <TabsTrigger value="planning">Planning</TabsTrigger>
                  <TabsTrigger value="materials">Materials</TabsTrigger>
                  <TabsTrigger value="events">Events</TabsTrigger>
                  <TabsTrigger value="user_values">User Values</TabsTrigger>
                  <TabsTrigger value="notes">Notes</TabsTrigger>
                  <TabsTrigger value="consolidated_view">Consolidated</TabsTrigger>
                  <TabsTrigger value="progress_view">Progress</TabsTrigger>
                </TabsList>

                <TabsContent value="general">
                  <Card>
                    <CardHeader><CardTitle className="text-lg">General Details</CardTitle></CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <FormField control={form.control} name="orderReference" render={({ field }) => (<FormItem><FormLabel>Order Reference *</FormLabel><FormControl><Input placeholder="e.g., PO-12345 / Style-ABC" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Input placeholder="Brief order description" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="product" render={({ field }) => (<FormItem><FormLabel>Product *</FormLabel><Select onValueChange={field.onChange} value={field.value || undefined}><FormControl><SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger></FormControl><SelectContent>{productOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="customer" render={({ field }) => (<FormItem><FormLabel>Customer *</FormLabel><Select onValueChange={field.onChange} value={field.value || undefined}><FormControl><SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger></FormControl><SelectContent>{customerOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="timetable" render={({ field }) => (<FormItem><FormLabel>Timetable</FormLabel><Select onValueChange={field.onChange} value={field.value || undefined}><FormControl><SelectTrigger><SelectValue placeholder="Select timetable" /></SelectTrigger></FormControl><SelectContent>{timetableOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="orderSet" render={({ field }) => (<FormItem><FormLabel>Order Set</FormLabel><FormControl><Input placeholder="e.g., Summer Collection" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="salesYear" render={({ field }) => (<FormItem><FormLabel>Sales Year</FormLabel><FormControl><Input type="number" placeholder="e.g., 2024" {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : +e.target.value)} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="season" render={({ field }) => (<FormItem><FormLabel>Season</FormLabel><FormControl><Input placeholder="e.g., SS25, AW24" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="efficiency" render={({ field }) => (<FormItem><FormLabel>Efficiency (%)</FormLabel><FormControl><Input type="number" placeholder="e.g., 85" {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : +e.target.value)} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="userStatus" render={({ field }) => (<FormItem><FormLabel>User Status</FormLabel><FormControl><Input placeholder="Custom status tag" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField
                          control={form.control}
                          name="learningCurveId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Learning Curve *</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value || undefined}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select learning curve" /></SelectTrigger></FormControl>
                                <SelectContent>
                                  {learningCurves.map(lc => (<SelectItem key={lc.id} value={lc.id}>{lc.name}</SelectItem>))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="tnaTemplate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>T&A Template *</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value || undefined}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select T&A template" /></SelectTrigger></FormControl>
                                <SelectContent>{tnaTemplateOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <Separator className="my-6" />
                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel>Order Status *</FormLabel>
                            <FormControl>
                              <RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-wrap gap-4">
                                <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="confirmed" /></FormControl><FormLabel className="font-normal">Confirmed</FormLabel></FormItem>
                                <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="provisional" /></FormControl><FormLabel className="font-normal">Provisional</FormLabel></FormItem>
                                <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="speculative" /></FormControl><FormLabel className="font-normal">Speculative</FormLabel></FormItem>
                                <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="transit" /></FormControl><FormLabel className="font-normal">Transit</FormLabel></FormItem>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex items-center space-x-4">
                        <FormField control={form.control} name="color" render={({ field }) => (<FormItem><FormLabel>Order Color</FormLabel><FormControl><Input type="color" {...field} className="h-10 w-20 p-1" /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="isCompleted" render={({ field }) => (<FormItem className="flex flex-row items-center space-x-2 pt-6"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="font-normal">Order is Completed</FormLabel><FormMessage /></FormItem>)} />
                      </div>

                      <Separator className="my-6" />
                      <CardTitle className="text-md">Delivery Details</CardTitle>
                      {deliveryFields.map((field, index) => (
                        <div key={field.id} className="grid grid-cols-1 md:grid-cols-[1fr,1fr,1fr,auto] gap-4 items-end p-3 border rounded-md bg-muted/30 relative">
                          <FormField control={form.control} name={`deliveryDetails.${index}.deliveryDate`} render={({ field: dateField }) => (
                            <FormItem className="flex flex-col"><FormLabel>Delivery Date *</FormLabel>
                              <Popover><PopoverTrigger asChild><FormControl>
                                <Button variant="outline" size="sm" className={cn("w-full justify-start text-left font-normal h-10", !dateField.value && "text-muted-foreground")}>
                                  {dateField.value ? format(dateField.value, "PPP") : <span>Pick date</span>} <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button></FormControl></PopoverTrigger>
                                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={dateField.value} onSelect={dateField.onChange} /></PopoverContent>
                              </Popover><FormMessage />
                            </FormItem>)}
                          />
                          <FormField control={form.control} name={`deliveryDetails.${index}.quantity`} render={({ field: qtyField }) => (<FormItem><FormLabel>Quantity *</FormLabel><FormControl><Input type="number" placeholder="Qty" {...qtyField} onChange={e => qtyField.onChange(e.target.value === '' ? 0 : +e.target.value)} value={qtyField.value ?? 0} className="h-10"/></FormControl><FormMessage /></FormItem>)} />
                          <FormField control={form.control} name={`deliveryDetails.${index}.reference`} render={({ field: refField }) => (<FormItem><FormLabel>Reference</FormLabel><FormControl><Input placeholder="Ref / Location" {...refField} className="h-10"/></FormControl><FormMessage /></FormItem>)} />
                          <Button type="button" variant="destructive" size="sm" onClick={() => removeDelivery(index)} disabled={deliveryFields.length <= 1} className="h-10">Remove</Button>
                        </div>
                      ))}
                      <Button type="button" variant="outline" size="sm" onClick={() => appendDelivery(createDefaultDeliveryDetail())}><PlusCircle className="mr-2 h-4 w-4" /> Add Delivery Line</Button>
                      {form.formState.errors.deliveryDetails && !form.formState.errors.deliveryDetails.root && deliveryFields.length > 0 && (<FormMessage>Error in delivery details.</FormMessage>)}
                      {form.formState.errors.deliveryDetails?.root?.message && (<FormMessage>{form.formState.errors.deliveryDetails.root.message}</FormMessage>)}

                      <Separator className="my-6" />
                      <CardTitle className="text-md">Logistics</CardTitle>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <FormField control={form.control} name="contractQuantity" render={({ field }) => (<FormItem><FormLabel>Contract Qty</FormLabel><FormControl><Input type="number" placeholder="e.g., 10000" {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : +e.target.value)} value={field.value ?? ''}/></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="distributeFrom" render={({ field }) => (<FormItem><FormLabel>Distribute From</FormLabel><FormControl><Input placeholder="Warehouse/Port" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="deliverTo" render={({ field }) => (<FormItem><FormLabel>Deliver To</FormLabel><FormControl><Input placeholder="Final Destination" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="method" render={({ field }) => (<FormItem><FormLabel>Method</FormLabel><FormControl><Input placeholder="e.g., Sea, Air" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="planInGroup" render={({ field }) => (<FormItem><FormLabel>Plan in Group</FormLabel><FormControl><Input placeholder="Group ID" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="useRoute" render={({ field }) => (<FormItem><FormLabel>Use Route</FormLabel><FormControl><Input placeholder="Route ID" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="deliveredQuantity" render={({ field }) => (<FormItem><FormLabel>Delivered Qty</FormLabel><FormControl><Input type="number" placeholder="e.g., 0" {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : +e.target.value)} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="reservation" render={({ field }) => (<FormItem><FormLabel>Reservation</FormLabel><FormControl><Input placeholder="Reservation ID" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="scheduleOffset" render={({ field }) => (<FormItem><FormLabel>Schedule Offset</FormLabel><FormControl><Input placeholder="e.g., +5 days" {...field} /></FormControl><FormMessage /></FormItem>)} />
                      </div>
                    </CardContent>
                  </Card>
                   <Separator className="my-8" />
                   <PoSizeTable formControl={form.control} formSetValue={form.setValue} formGetValues={form.getValues} formWatch={form.watch} countryOptions={countryOptions} />
                </TabsContent>

                <TabsContent value="financial">
                  <Card>
                    <CardHeader><CardTitle>Financial Details</CardTitle></CardHeader>
                    <CardContent>
                       <FormField
                        control={form.control}
                        name="financialNotes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="sr-only">Financial Notes</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Financial notes, payment terms, costing..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
                 <TabsContent value="sizes">
                  <Card>
                    <CardHeader><CardTitle>Size Specifications</CardTitle></CardHeader>
                    <CardContent>
                       <FormField
                        control={form.control}
                        name="sizesNotes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="sr-only">Sizes Notes</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Detailed size breakdown, grading rules..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="planning">
                  <Card>
                    <CardHeader><CardTitle>Planning Parameters</CardTitle></CardHeader>
                    <CardContent>
                      <FormField
                        control={form.control}
                        name="planningNotes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="sr-only">Planning Notes</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Specific planning constraints, line preferences..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="materials">
                  <Card>
                    <CardHeader><CardTitle>Material Requirements</CardTitle></CardHeader>
                    <CardContent>
                       <FormField
                        control={form.control}
                        name="materialsNotes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="sr-only">Materials Notes</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Bill of Materials (BOM), supplier details..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="events">
                  <Card>
                    <CardHeader><CardTitle>Key Events & Milestones</CardTitle></CardHeader>
                    <CardContent>
                      <FormField
                        control={form.control}
                        name="eventsNotes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="sr-only">Events Notes</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Critical dates, approval deadlines..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="user_values">
                  <Card>
                    <CardHeader><CardTitle>User Defined Values</CardTitle></CardHeader>
                    <CardContent>
                      <FormField
                        control={form.control}
                        name="userValuesNotes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="sr-only">User Values Notes</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Custom fields and values for this order..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="notes">
                  <Card>
                    <CardHeader><CardTitle>Order Notes</CardTitle></CardHeader>
                    <CardContent>
                       <FormField
                        control={form.control}
                        name="generalNotes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="sr-only">General Notes</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Enter general notes for this order..." {...field} rows={6}/>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="consolidated_view">
                  <Card>
                    <CardHeader><CardTitle>Consolidated View</CardTitle></CardHeader>
                    <CardContent>
                      <FormField
                        control={form.control}
                        name="consolidatedViewNotes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="sr-only">Consolidated View Notes</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Consolidated view details or notes..." {...field} rows={6}/>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <p className="text-muted-foreground mt-4">Consolidated order information will be displayed here.</p>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="progress_view">
                  <Card>
                    <CardHeader><CardTitle>Progress View</CardTitle></CardHeader>
                    <CardContent>
                      <FormField
                        control={form.control}
                        name="progressViewNotes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="sr-only">Progress View Notes</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Order progress notes or summary..." {...field} rows={6}/>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <p className="text-muted-foreground mt-4">Order progress tracking will be displayed here once the order is active.</p>
                    </CardContent>
                  </Card>
                </TabsContent>

              </Tabs>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-3 pt-2 pb-8">
            <Button type="button" variant="outline" onClick={() => setActiveTab("notes")}>
                <FileText className="mr-2 h-4 w-4" /> Notes
            </Button>
            <Button type="button" variant="outline" onClick={() => setActiveTab("consolidated_view")}>
                <Layers className="mr-2 h-4 w-4" /> Consolidated
            </Button>
            <Button type="button" variant="outline" onClick={() => setActiveTab("progress_view")}>
                <ActivityIcon className="mr-2 h-4 w-4" /> Progress
            </Button>
            <Button type="button" variant="destructive" onClick={() => setIsDeleteAlertOpen(true)}>Delete</Button>
            <Button type="submit">
              <Save className="mr-2 h-4 w-4" /> Update / Save Order
            </Button>
          </div>
        </form>
      </Form>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will clear the current order form. If this were a saved order, it would be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteOrder} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Delete Draft</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

    