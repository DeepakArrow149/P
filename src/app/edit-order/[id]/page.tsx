'use client';

import * as React from 'react';
import { useForm, useFieldArray, Controller, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useParams, useRouter } from 'next/navigation';
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
import { CalendarIcon, Save, PlusCircle, Trash2, Palette, HelpCircle, Package, Users, ListChecks, Clock, Edit, GripVertical, PackagePlus, BarChartHorizontalBig, FileText, Layers, ActivityIcon, ArrowLeft } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { getOrder, updateOrder, type StoredOrder } from '@/lib/orderService';
import { getAllLearningCurvesFromFirebase } from '@/lib/firebaseService';
import type { LearningCurveMaster } from '@/lib/learningCurveTypes';
import { PoSizeTable } from '@/components/order-form/PoSizeTable';

// Import schemas and types from new-order page
import { 
  newOrderFormSchema, 
  type NewOrderFormValues, 
  type DeliveryDetail, 
  type PoSizeItem, 
  type PoLine, 
  deliveryDetailSchema, 
  poSizeItemSchema, 
  poLineSchema 
} from '@/app/new-order/page';

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
  sizeQuantities: activeSizeNames.map(sizeName => ({
    id: crypto.randomUUID(),
    sizeName,
    quantity: 0,
  })),
});

const defaultValues: NewOrderFormValues = {
  orderReference: '',
  description: '',
  product: '',
  customer: '',
  timetable: '',
  orderSet: '',
  salesYear: new Date().getFullYear(),
  season: '',
  efficiency: 0,
  userStatus: '',
  learningCurveId: '',
  tnaTemplate: '',
  status: 'provisional',
  color: '#3b82f6',
  isCompleted: false,
  orderDate: new Date(),
  receivedDate: new Date(),
  contractQuantity: 0,
  distributeFrom: '',
  deliverTo: '',
  method: '',
  planInGroup: '',
  useRoute: '',
  deliveredQuantity: 0,
  reservation: '',
  scheduleOffset: '',
  deliveryDetails: [createDefaultDeliveryDetail()],
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

function convertStoredOrderToFormValues(order: StoredOrder): NewOrderFormValues {
  // Map status values from StoredOrder to NewOrderFormValues schema
  const getValidStatus = (status: string | undefined): "confirmed" | "provisional" | "speculative" | "transit" => {
    if (!status) return 'provisional';
    switch (status) {
      case 'confirmed':
      case 'provisional':
      case 'speculative':
      case 'transit':
        return status;
      default:
        return 'provisional';
    }
  };

  return {
    orderReference: order.orderReference || '',
    description: order.description || '',
    product: order.product || '',
    customer: order.customer || '',
    timetable: order.timetable || '',
    orderSet: order.orderSet || '',
    salesYear: order.salesYear || new Date().getFullYear(),
    season: order.season || '',
    efficiency: order.efficiency || 0,
    userStatus: order.userStatus || '',
    learningCurveId: order.learningCurveId || '',
    tnaTemplate: order.tnaTemplate || '',
    status: getValidStatus(order.status),
    color: order.color || '#3b82f6',
    isCompleted: order.isCompleted || false,
    orderDate: order.orderDate ? new Date(order.orderDate) : new Date(),
    receivedDate: order.receivedDate ? new Date(order.receivedDate) : new Date(),
    contractQuantity: order.contractQuantity || 0,
    distributeFrom: order.distributeFrom || '',
    deliverTo: order.deliverTo || '',
    method: order.method || '',
    planInGroup: order.planInGroup || '',
    useRoute: order.useRoute || '',
    deliveredQuantity: order.deliveredQuantity || 0,
    reservation: order.reservation || '',
    scheduleOffset: order.scheduleOffset || '',
    deliveryDetails: order.deliveryDetails?.length 
      ? order.deliveryDetails.map(dd => ({
          id: dd.id || crypto.randomUUID(),
          deliveryDate: dd.deliveryDate ? new Date(dd.deliveryDate) : new Date(),
          quantity: dd.quantity || 0,
          reference: dd.reference || '',
        }))
      : [createDefaultDeliveryDetail()],
    poLines: order.poLines?.length
      ? order.poLines.map(pl => ({
          id: pl.id || crypto.randomUUID(),
          soNo: pl.soNo || '',
          poName: pl.poName || '',
          deliveryDate: pl.deliveryDate ? new Date(pl.deliveryDate) : new Date(),
          country: pl.country || '',
          extraPercentage: pl.extraPercentage || 0,
          sizeQuantities: pl.sizeQuantities?.length
            ? pl.sizeQuantities.map(sq => ({
                id: sq.id || crypto.randomUUID(),
                sizeName: sq.sizeName || '',
                quantity: sq.quantity || 0,
              }))
            : [{ id: crypto.randomUUID(), sizeName: 'S', quantity: 0 }],
        }))
      : [createDefaultPoLine(['S', 'M', 'L', 'XL'])],
    activeSizeNames: ['S', 'M', 'L', 'XL'], // Default size names since StoredOrder doesn't have this field
    generalNotes: order.generalNotes || '',
    financialNotes: order.financialNotes || '',
    sizesNotes: order.sizesNotes || '',
    planningNotes: order.planningNotes || '',
    materialsNotes: order.materialsNotes || '',
    eventsNotes: order.eventsNotes || '',
    userValuesNotes: order.userValuesNotes || '',
    consolidatedViewNotes: order.consolidatedViewNotes || '',
    progressViewNotes: order.progressViewNotes || '',
  };
}

export default function EditOrderPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);
  const [learningCurves, setLearningCurves] = React.useState<LearningCurveMaster[]>([]);
  const [activeTab, setActiveTab] = React.useState("general");
  const [isClient, setIsClient] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [order, setOrder] = React.useState<StoredOrder | null>(null);

  const orderId = params.id as string;

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const form = useForm<NewOrderFormValues>({
    resolver: zodResolver(newOrderFormSchema),
    defaultValues,
    mode: 'onSubmit', 
  });

  // Load order data
  React.useEffect(() => {
    async function loadOrder() {
      if (!orderId || !isClient) return;
      
      try {
        setIsLoading(true);
        const orderData = await getOrder(orderId);
        
        if (!orderData) {
          toast({
            title: 'Order Not Found',
            description: 'The requested order could not be found.',
            variant: 'destructive',
          });
          router.push('/order-list');
          return;
        }

        setOrder(orderData);
        const formValues = convertStoredOrderToFormValues(orderData);
        form.reset(formValues);
      } catch (error) {
        console.error('Error loading order:', error);
        toast({
          title: 'Error Loading Order',
          description: 'Failed to load order data. Please try again.',
          variant: 'destructive',
        });
        router.push('/order-list');
      } finally {
        setIsLoading(false);
      }
    }

    loadOrder();
  }, [orderId, isClient, form, toast, router]);

  const { fields: deliveryFields, append: appendDelivery, remove: removeDelivery } = useFieldArray({
    control: form.control,
    name: "deliveryDetails",
  });

  React.useEffect(() => {
    async function fetchLcData() {
      try {
        const lcData = await getAllLearningCurvesFromFirebase();
        setLearningCurves(lcData);
      } catch (error) {
        console.error("Failed to fetch learning curves for Edit Order form:", error);
        toast({ title: "Error", description: "Could not load learning curves.", variant: "destructive" });
      }
    }
    if (isClient) { 
        fetchLcData();
    }  }, [toast, isClient]);
  // Convert form values to StoredOrder format (dates as strings)
  function convertFormDataToStoredOrder(data: NewOrderFormValues): Partial<StoredOrder> {
    return {
      ...data,
      orderDate: data.orderDate?.toISOString(),
      receivedDate: data.receivedDate?.toISOString(),
      deliveryDetails: data.deliveryDetails?.map(dd => ({
        ...dd,
        deliveryDate: dd.deliveryDate?.toISOString(),
      })),
      poLines: data.poLines?.map(pl => ({
        ...pl,
        deliveryDate: pl.deliveryDate?.toISOString(),        sizeQuantities: pl.sizeQuantities?.map(sq => ({
          id: crypto.randomUUID(),
          sizeName: sq.sizeName,
          quantity: sq.quantity,
        })),
      })),
    };
  }

  async function onSubmit(data: NewOrderFormValues) {
    console.log('Updating Order Data:', data);
    try {
      const updateData = convertFormDataToStoredOrder(data);
      await updateOrder(orderId, updateData);
      toast({
        title: 'Order Updated!',
        description: `Order ${data.orderReference} has been successfully updated.`,
      });
      router.push('/order-list');
    } catch (error) {
      console.error("Failed to update order: ", error);
      toast({
        title: 'Error Updating Order',
        description: 'There was a problem updating the order. Please try again.',
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
    router.push('/order-list');
    setIsDeleteAlertOpen(false);
  };
  
  if (!isClient || isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/order-list')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Button>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading order data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center space-x-2 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/order-list')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Orders
        </Button>
      </div>        <PageHeader 
        title={`Edit Order: ${order?.orderReference || orderId}`}
        description="Update order information and details."
      />
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit, onFormError)} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-6">
              <TabsTrigger value="general" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                General
              </TabsTrigger>
              <TabsTrigger value="financial" className="flex items-center gap-2">
                <BarChartHorizontalBig className="h-4 w-4" />
                Financial
              </TabsTrigger>
              <TabsTrigger value="sizes" className="flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Sizes
              </TabsTrigger>
              <TabsTrigger value="planning" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Planning
              </TabsTrigger>
              <TabsTrigger value="notes" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Notes
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-6">
              {/* General tab content - copy from new-order page */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Order Information
                  </CardTitle>
                  <CardDescription>
                    Basic order details and identification.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="orderReference"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Order Reference *</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., ORD-2024-001" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="confirmed">Confirmed</SelectItem>
                              <SelectItem value="provisional">Provisional</SelectItem>
                              <SelectItem value="speculative">Speculative</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Brief description of the order..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Add other tab contents as needed - copying from new-order page */}
            <TabsContent value="financial">
              <Card>
                <CardHeader>
                  <CardTitle>Financial Information</CardTitle>
                  <CardDescription>Order financial details and quantities.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="contractQuantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contract Quantity</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="deliveredQuantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Delivered Quantity</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sizes">
              <Card>
                <CardHeader>
                  <CardTitle>Size Information</CardTitle>
                  <CardDescription>Product sizes and quantities.</CardDescription>
                </CardHeader>                <CardContent>
                  <PoSizeTable 
                    formControl={form.control}
                    formSetValue={form.setValue}
                    formGetValues={form.getValues}
                    formWatch={form.watch}
                    countryOptions={countryOptions}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="planning">
              <Card>
                <CardHeader>
                  <CardTitle>Planning Information</CardTitle>
                  <CardDescription>Order timeline and planning details.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="orderDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Order Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                  date > new Date() || date < new Date("1900-01-01")
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />                    <FormField
                      control={form.control}
                      name="receivedDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Received Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                  date < new Date("1900-01-01")
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notes">
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                  <CardDescription>Additional notes and comments.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="generalNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>General Notes</FormLabel>
                        <FormControl>
                          <Textarea placeholder="General notes about the order..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-between pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteAlertOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Cancel Changes
            </Button>
            
            <Button type="submit">
              <Save className="mr-2 h-4 w-4" />
              Update Order
            </Button>
          </div>
        </form>
      </Form>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Changes?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel your changes? This will return you to the order list without saving.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Editing</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteOrder}>
              Cancel Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
