
'use client';

import * as React from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon, PlusCircle, Save, Trash2, GripVertical } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const tnaActivityItemSchema = z.object({
  id: z.string().optional(), // For unique key in map
  activityName: z.string().min(1, "Activity name is required."),
  responsible: z.string().min(1, "Responsible party is required."),
  startDate: z.string().min(1, "Start date/offset is required (e.g., Day 0)."),
  endDate: z.string().min(1, "End date/offset is required (e.g., Day 15)."),
  remarks: z.string().optional(),
});

const newTnaPlanSchema = z.object({
  planName: z.string().min(1, "TNA Plan Name is required."),
  orderId: z.string().min(1, "Associated Order ID is required."),
  referenceDate: z.date({ required_error: "A reference date for Day 0 is required." }),
  activities: z.array(tnaActivityItemSchema).min(1, "At least one TNA activity is required."),
});

type NewTnaPlanFormValues = z.infer<typeof newTnaPlanSchema>;

const defaultActivityValues = {
  activityName: '',
  responsible: '',
  startDate: '',
  endDate: '',
  remarks: '',
};

export default function NewTnaPlanPage() {
  const { toast } = useToast();
  const form = useForm<NewTnaPlanFormValues>({
    resolver: zodResolver(newTnaPlanSchema),
    defaultValues: {
      planName: '',
      orderId: '',
      referenceDate: new Date(),
      activities: [defaultActivityValues],
    },
    mode: 'onChange',
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'activities',
  });

  function onSubmit(data: NewTnaPlanFormValues) {
    console.log('New TNA Plan Data:', data);
    toast({
      title: 'TNA Plan Saved!',
      description: `The TNA plan "${data.planName}" has been successfully created.`,
    });
    form.reset();
  }

  return (
    <>
      <PageHeader
        title="Create New TNA Plan"
        description="Define activities, responsibilities, and timelines for a new TNA plan."
        actions={
          <Button onClick={form.handleSubmit(onSubmit)}>
            <Save className="mr-2 h-4 w-4" /> Save TNA Plan
          </Button>
        }
      />
      <Card className="shadow-lg">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-2 lg:grid-cols-3">
                <FormField
                  control={form.control}
                  name="planName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plan Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Spring Collection TNA" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="orderId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Associated Order ID *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., ORD-2024-123" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="referenceDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Reference Date (Day 0) *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={'outline'}
                              className={cn(
                                'w-full pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>This date will be considered as Day 0 for activity offsets.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator className="my-8" />

              <div>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">TNA Activities</h3>
                    <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append(defaultActivityValues)}
                    >
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Activity
                    </Button>
                </div>
                
                {fields.length === 0 && (
                    <p className="text-sm text-muted-foreground">No activities added yet. Click "Add Activity" to get started.</p>
                )}

                <div className="space-y-6">
                  {fields.map((item, index) => (
                    <Card key={item.id} className="p-4 bg-muted/20 relative">
                       <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => remove(index)}
                          disabled={fields.length <= 1}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Remove Activity</span>
                        </Button>
                        <GripVertical className="absolute top-1/2 left-1 h-5 w-5 -translate-y-1/2 text-muted-foreground cursor-grab" />
                        <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2 lg:grid-cols-5 pl-6">
                        <FormField
                          control={form.control}
                          name={`activities.${index}.activityName`}
                          render={({ field }) => (
                            <FormItem className="lg:col-span-2">
                              <FormLabel>Activity Name *</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Fabric Sourcing" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`activities.${index}.responsible`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Responsible *</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Sourcing Dept." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`activities.${index}.startDate`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Start Date Offset *</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Day 0" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`activities.${index}.endDate`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>End Date Offset *</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Day 15" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`activities.${index}.remarks`}
                          render={({ field }) => (
                            <FormItem className="md:col-span-2 lg:col-span-5">
                              <FormLabel>Remarks</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Any specific notes for this activity..."
                                  className="resize-none"
                                  {...field}
                                  rows={2}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </Card>
                  ))}
                </div>
                 {form.formState.errors.activities && !form.formState.errors.activities.root && fields.length > 0 && (
                    <p className="text-sm font-medium text-destructive mt-2">
                       Please fill all required fields for each activity.
                    </p>
                 )}
                 {form.formState.errors.activities?.root?.message && (
                    <p className="text-sm font-medium text-destructive mt-2">
                        {form.formState.errors.activities.root.message}
                    </p>
                 )}


              </div>

              <div className="flex justify-end pt-8">
                <Button type="submit">
                  <Save className="mr-2 h-4 w-4" /> Save TNA Plan
                </Button>
              </div>
            </CardContent>
          </form>
        </Form>
      </Card>
    </>
  );
}
