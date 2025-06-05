
// src/components/plan-view/SearchToolDialog.tsx
'use client';

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
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
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CalendarIcon, Search, RefreshCw, FileText, XSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { SearchFormValues } from './types';

interface SearchToolDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: SearchFormValues) => void;
}

const searchFormSchema = z.object({
  general_order: z.string().optional(),
  general_orderSet: z.string().optional(),
  general_product: z.string().optional(),
  general_productType: z.string().optional(),
  general_customer: z.string().optional(),
  general_planGroup: z.string().optional(),
  general_rowName: z.string().optional(),
  general_operationWorkContent: z.string().optional(),
  general_orderDescription: z.string().optional(),
  general_productDescription: z.string().optional(),
  general_materialRequired: z.boolean().optional().default(false),
  general_inBillOfMaterial: z.boolean().optional().default(false),
  general_transportMethod: z.string().optional(),
  general_stage: z.string().optional(),
  general_timetable: z.string().optional(),
  general_prodStartDateFrom: z.date().optional(),
  general_prodStartDateTo: z.date().optional(),
  general_deliveryDateFrom: z.date().optional(),
  general_deliveryDateTo: z.date().optional(),
  general_statusConfirmed: z.boolean().optional().default(false),
  general_statusProvisional: z.boolean().optional().default(false),
  general_statusSpeculative: z.boolean().optional().default(false),
  general_statusTransit: z.boolean().optional().default(false),
  general_includeMadeStrips: z.boolean().optional().default(false),
  general_showAllSections: z.boolean().optional().default(false),
  general_showFindSummary: z.boolean().optional().default(false),
  general_prodHasStarted: z.boolean().optional().default(false),
  general_prodHasNotStarted: z.boolean().optional().default(false),
  general_parallelProcesses: z.boolean().optional().default(false),
  advanced_customField1: z.string().optional(), // Example for Advanced
  problems_preProduction: z.boolean().optional().default(false),
  problems_materials: z.boolean().optional().default(false),
  problems_lateDelivery: z.boolean().optional().default(false),
  problems_wip: z.boolean().optional().default(false),
  problems_condition: z.enum(['any', 'all']).optional().default('any'),
}).refine(data => {
    if (data.general_prodStartDateFrom && data.general_prodStartDateTo && data.general_prodStartDateTo < data.general_prodStartDateFrom) {
        return false;
    }
    return true;
}, { message: "Prod Start 'To' date must be after 'From' date", path: ['general_prodStartDateTo']})
.refine(data => {
    if (data.general_deliveryDateFrom && data.general_deliveryDateTo && data.general_deliveryDateTo < data.general_deliveryDateFrom) {
        return false;
    }
    return true;
}, { message: "Delivery 'To' date must be after 'From' date", path: ['general_deliveryDateTo']});


const defaultSearchValues: Partial<SearchFormValues> = {
  general_materialRequired: false,
  general_inBillOfMaterial: false,
  general_statusConfirmed: false,
  general_statusProvisional: false,
  general_statusSpeculative: false,
  general_statusTransit: false,
  general_includeMadeStrips: false,
  general_showAllSections: false,
  general_showFindSummary: false,
  general_prodHasStarted: false,
  general_prodHasNotStarted: false,
  general_parallelProcesses: false,
  problems_preProduction: false,
  problems_materials: false,
  problems_lateDelivery: false,
  problems_wip: false,
  problems_condition: 'any',
};

export function SearchToolDialog({
  isOpen,
  onOpenChange,
  onSubmit,
}: SearchToolDialogProps) {
  const form = useForm<SearchFormValues>({
    resolver: zodResolver(searchFormSchema),
    defaultValues: defaultSearchValues,
  });

  const handleFormSubmit = (data: SearchFormValues) => {
    onSubmit(data);
  };

  const handleClearSettings = () => {
    form.reset(defaultSearchValues);
  };

  const renderTextField = (name: keyof SearchFormValues, label: string, placeholder: string) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs">{label}</FormLabel>
          <FormControl>
            <Input placeholder={placeholder} {...field} value={field.value || ''} className="h-8 text-xs" />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  const renderDateField = (name: keyof SearchFormValues, label: string) => (
    <FormField
        control={form.control}
        name={name}
        render={({ field }) => (
        <FormItem className="flex flex-col">
            <FormLabel className="text-xs">{label}</FormLabel>
            <Popover>
            <PopoverTrigger asChild>
                <FormControl>
                <Button
                    variant="outline"
                    className={cn("h-8 text-xs pl-2 text-left font-normal", !field.value && "text-muted-foreground")}
                >
                    {field.value ? format(field.value as Date, "PPP") : <span>Pick a date</span>}
                    <CalendarIcon className="ml-auto h-3 w-3 opacity-50" />
                </Button>
                </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={field.value as Date | undefined} onSelect={field.onChange} initialFocus />
            </PopoverContent>
            </Popover>
            <FormMessage />
        </FormItem>
        )}
    />
  );

  const renderCheckboxField = (name: keyof SearchFormValues, label: string) => (
     <FormField
        control={form.control}
        name={name}
        render={({ field }) => (
          <FormItem className="flex flex-row items-center space-x-2 space-y-0">
            <FormControl>
              <Checkbox checked={field.value as boolean | undefined} onCheckedChange={field.onChange} />
            </FormControl>
            <FormLabel className="text-xs font-normal">{label}</FormLabel>
          </FormItem>
        )}
      />
  );


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl md:max-w-4xl lg:max-w-5xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b flex flex-row items-center justify-between">
          <div className="flex items-center">
            <Search className="mr-2 h-5 w-5 text-primary" />
            <DialogTitle>Advanced Search & Report Tool</DialogTitle>
          </div>
           <DialogClose asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
                <XSquare className="h-5 w-5" />
            </Button>
          </DialogClose>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="flex flex-col flex-grow overflow-hidden">
            <Tabs defaultValue="general" className="flex flex-col flex-grow p-4 overflow-hidden">
              <TabsList className="mb-4">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
                <TabsTrigger value="problems">Problems</TabsTrigger>
              </TabsList>

              <ScrollArea className="flex-grow pr-2">
                <TabsContent value="general" className="mt-0 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3">
                    {renderTextField('general_order', 'Order', 'e.g., ORD-123*')}
                    {renderTextField('general_orderSet', 'Order Set', 'e.g., Summer24')}
                    {renderTextField('general_product', 'Product', 'e.g., TSHIRT-*')}
                    {renderTextField('general_productType', 'Product Type', 'e.g., Knitwear')}
                    {renderTextField('general_customer', 'Customer', 'e.g., ACME*')}
                    {renderTextField('general_planGroup', 'Plan Group', 'e.g., GroupA')}
                    {renderTextField('general_rowName', 'Row Name (Line)', 'e.g., Line-01')}
                    {renderTextField('general_operationWorkContent', 'Operation Work Content', 'e.g., Sewing')}
                  </div>
                  
                  <div className="space-y-1">
                    <FormLabel className="text-xs">Order Description</FormLabel>
                    <FormField control={form.control} name="general_orderDescription" render={({ field }) => (<Input placeholder="Contains text..." {...field} value={field.value || ''} className="h-8 text-xs" /> )} />
                  </div>
                   <div className="space-y-1">
                    <FormLabel className="text-xs">Product Description</FormLabel>
                    <FormField control={form.control} name="general_productDescription" render={({ field }) => (<Input placeholder="Contains text..." {...field} value={field.value || ''} className="h-8 text-xs" /> )} />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-3 pt-2">
                    <div className="space-y-1 col-span-2 md:col-span-1">
                        <FormLabel className="text-xs block mb-1.5">Prod. Start Date</FormLabel>
                        {renderDateField('general_prodStartDateFrom', 'From')}
                    </div>
                     <div className="space-y-1 col-span-2 md:col-span-1 self-end">
                        {renderDateField('general_prodStartDateTo', 'To')}
                    </div>
                    <div className="space-y-1 col-span-2 md:col-span-1">
                        <FormLabel className="text-xs block mb-1.5">Delivery Date</FormLabel>
                        {renderDateField('general_deliveryDateFrom', 'From')}
                    </div>
                     <div className="space-y-1 col-span-2 md:col-span-1 self-end">
                        {renderDateField('general_deliveryDateTo', 'To')}
                    </div>
                  </div>
                 
                  <div>
                    <FormLabel className="text-xs font-medium mb-2 block">Status</FormLabel>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2">
                        {renderCheckboxField('general_statusConfirmed', 'Confirmed')}
                        {renderCheckboxField('general_statusProvisional', 'Provisional')}
                        {renderCheckboxField('general_statusSpeculative', 'Speculative')}
                        {renderCheckboxField('general_statusTransit', 'Transit')}
                    </div>
                  </div>
                  
                  <div>
                    <FormLabel className="text-xs font-medium mb-2 block">Additional Options</FormLabel>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2">
                        {renderCheckboxField('general_includeMadeStrips', 'Include Made Strips')}
                        {renderCheckboxField('general_showAllSections', 'Show All Sections')}
                        {renderCheckboxField('general_showFindSummary', 'Show Find Summary')}
                        {renderCheckboxField('general_prodHasStarted', 'Production Has Started')}
                        {renderCheckboxField('general_prodHasNotStarted', 'Production Not Started')}
                        {renderCheckboxField('general_parallelProcesses', 'Has Parallel Processes')}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="advanced" className="mt-0">
                  <p className="text-sm text-muted-foreground">Advanced filtering options (e.g., custom fields) will appear here.</p>
                  {renderTextField('advanced_customField1', 'Custom Field 1 Example', 'Value...')}
                </TabsContent>

                <TabsContent value="problems" className="mt-0">
                  <div className="space-y-4">
                    <div>
                        <FormLabel className="text-xs font-medium mb-2 block">Find Orders With Problems</FormLabel>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                            {renderCheckboxField('problems_preProduction', 'Pre-production problems')}
                            {renderCheckboxField('problems_materials', 'Materials problems')}
                            {renderCheckboxField('problems_lateDelivery', 'Late delivery problems')}
                            {renderCheckboxField('problems_wip', 'WIP issues')}
                        </div>
                    </div>
                     <FormField
                        control={form.control}
                        name="problems_condition"
                        render={({ field }) => (
                            <FormItem className="space-y-2">
                            <FormLabel className="text-xs">Condition</FormLabel>
                            <FormControl>
                                <div className="flex items-center space-x-4">
                                    <label className="flex items-center space-x-2 text-xs">
                                        <input type="radio" {...field} value="any" checked={field.value === 'any'} className="form-radio h-3 w-3"/>
                                        <span>Any of the selected problems</span>
                                    </label>
                                    <label className="flex items-center space-x-2 text-xs">
                                        <input type="radio" {...field} value="all" checked={field.value === 'all'} className="form-radio h-3 w-3"/>
                                        <span>All of the selected problems</span>
                                    </label>
                                </div>
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                  </div>
                </TabsContent>
              </ScrollArea>
            </Tabs>

            <DialogFooter className="p-4 border-t mt-auto flex-shrink-0">
              <Button type="button" variant="outline" onClick={handleClearSettings}>
                <RefreshCw className="mr-2 h-4 w-4" /> Clear All
              </Button>
              <Button type="button" variant="secondary" onClick={() => onSubmit(form.getValues())} >
                <FileText className="mr-2 h-4 w-4" /> Report
              </Button>
              <Button type="submit">
                <Search className="mr-2 h-4 w-4" /> Find
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
