
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Save, FastForward } from 'lucide-react';
import { format, startOfDay, addDays, endOfWeek, startOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { cn } from '@/lib/utils';
import type { PullForwardOptions } from './types';

// Re-export the type for external use
export type { PullForwardOptions };

interface PullForwardDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (options: PullForwardOptions) => void;
  initialStartDate: Date; // To help set defaults for date pickers
}

const pullForwardFormSchema = z.object({
  rangeType: z.enum(['currentDay', 'currentWeek', 'currentMonth', 'entirePlan', 'dateRange']),
  fromDate: z.date().optional(),
  toDate: z.date().optional(),
}).refine(data => {
  if (data.rangeType === 'dateRange') {
    return !!data.fromDate && !!data.toDate && data.toDate >= data.fromDate;
  }
  return true;
}, {
  message: 'If "Specify Date Range" is selected, "To Date" must be after or same as "From Date".',
  path: ['toDate'], // Apply error to 'toDate' field for better UX
});

type PullForwardFormValues = z.infer<typeof pullForwardFormSchema>;

export function PullForwardDialog({
  isOpen,
  onOpenChange,
  onSubmit,
  initialStartDate,
}: PullForwardDialogProps) {
  const form = useForm<PullForwardFormValues>({
    resolver: zodResolver(pullForwardFormSchema),
    defaultValues: {
      rangeType: 'currentWeek',
      fromDate: startOfWeek(initialStartDate, { weekStartsOn: 0 }),
      toDate: endOfWeek(initialStartDate, { weekStartsOn: 0 }),
    },
  });

  const watchedRangeType = form.watch('rangeType');

  React.useEffect(() => {
    if (isOpen) {
      let from: Date | undefined = startOfWeek(initialStartDate, { weekStartsOn: 0 });
      let to: Date | undefined = endOfWeek(initialStartDate, { weekStartsOn: 0 });

      switch (form.getValues('rangeType')) {
        case 'currentDay':
          from = startOfDay(initialStartDate);
          to = startOfDay(initialStartDate); // or endOfDay if range means whole day
          break;
        case 'currentMonth':
          from = startOfMonth(initialStartDate);
          to = endOfMonth(initialStartDate);
          break;
        case 'entirePlan': // For 'entirePlan', dates might be irrelevant or handled by parent
          from = undefined;
          to = undefined;
          break;
        // case 'dateRange' and 'currentWeek' will use their existing or newly set values.
      }
      form.reset({
        rangeType: form.getValues('rangeType') || 'currentWeek',
        fromDate: from,
        toDate: to,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialStartDate, form.reset]); // form.getValues might cause loop if not careful, so only form.reset

  const handleSubmit = (data: PullForwardFormValues) => {
    onSubmit(data);
    onOpenChange(false); // Close dialog on submit
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <FastForward className="mr-2 h-5 w-5 text-primary" />
            Pull Forward Strips
          </DialogTitle>
          <DialogDescription>
            Select the range to pull forward scheduled orders and fill gaps.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="rangeType"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Select Pull Forward Range</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl><RadioGroupItem value="currentDay" /></FormControl>
                        <FormLabel className="font-normal">Current Day</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl><RadioGroupItem value="currentWeek" /></FormControl>
                        <FormLabel className="font-normal">Current Week</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl><RadioGroupItem value="currentMonth" /></FormControl>
                        <FormLabel className="font-normal">Current Month</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl><RadioGroupItem value="entirePlan" /></FormControl>
                        <FormLabel className="font-normal">Entire Plan</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl><RadioGroupItem value="dateRange" /></FormControl>
                        <FormLabel className="font-normal">Specify Date Range</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {watchedRangeType === 'dateRange' && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="fromDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>From Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                            >
                              {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="toDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>To Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                            >
                              {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit">
                <Save className="mr-2 h-4 w-4" /> Apply Pull Forward
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
