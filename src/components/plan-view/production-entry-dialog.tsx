
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Save } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Task, VerticalTask } from './types';

const productionEntrySchema = z.object({
  productionDate: z.date({ required_error: 'Production date is required.' }),
  quantityProduced: z.coerce.number().min(0, 'Quantity must be zero or positive.'),
  notes: z.string().optional(),
});

type ProductionEntryFormValues = z.infer<typeof productionEntrySchema>;

interface ProductionEntryDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | VerticalTask; // Can accept either Task or VerticalTask
  onSubmit: (data: ProductionEntryFormValues) => void;
}

export function ProductionEntryDialog({ isOpen, onOpenChange, task, onSubmit }: ProductionEntryDialogProps) {
  const form = useForm<ProductionEntryFormValues>({
    resolver: zodResolver(productionEntrySchema),
    defaultValues: {
      productionDate: new Date(),
      quantityProduced: 0,
      notes: '',
    },
  });

  const getDisplayInfo = () => {
    let orderIdentifier = task.id;
    let styleIdentifier = 'Unknown Style';

    if ('originalOrderDetails' in task && task.originalOrderDetails) {
      orderIdentifier = task.originalOrderDetails.id;
      styleIdentifier = task.originalOrderDetails.style;
    } else if ('label' in task) { // Horizontal Task
      styleIdentifier = task.label;
    } else if ('orderName' in task) { // Vertical Task
      styleIdentifier = task.orderName;
    }
    return { orderIdentifier, styleIdentifier };
  };


  React.useEffect(() => {
    if (isOpen) {
      const { orderIdentifier } = getDisplayInfo();
      form.reset({
        productionDate: new Date(),
        quantityProduced: 0,
        notes: `Production entry for order: ${orderIdentifier}`,
      });
    }
  }, [isOpen, form, task]);

  const handleSubmit = (data: ProductionEntryFormValues) => {
    onSubmit(data);
  };
  
  const { styleIdentifier } = getDisplayInfo();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Production Entry for: {styleIdentifier}</DialogTitle>
          <DialogDescription>
            Log the quantity produced for this order on a specific date.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="productionDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Production Date *</FormLabel>
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
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="quantityProduced"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity Produced *</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 100" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Add any relevant notes..." {...field} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit">
                <Save className="mr-2 h-4 w-4" /> Save Entry
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
