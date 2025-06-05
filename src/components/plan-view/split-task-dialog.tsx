
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Save, DivideCircle } from 'lucide-react';
import type { Task, VerticalTask } from './types';

interface SplitTaskDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | VerticalTask;
  onSubmit: (splitValue: number, splitMode: 'retain' | 'remove') => void;
  maxQuantity: number;
}

export function SplitTaskDialog({
  isOpen,
  onOpenChange,
  task,
  onSubmit,
  maxQuantity,
}: SplitTaskDialogProps) {
  // Schema needs to be dynamic based on maxQuantity
  const SplitTaskFormSchema = z.object({
    splitQuantity: z.coerce
      .number()
      .min(1, 'Quantity must be at least 1.')
      .max(maxQuantity -1 , `Quantity must be less than ${maxQuantity} (to leave at least 1 for the other part).`),
    splitMode: z.enum(['retain', 'remove']),
  });
  
  type SplitTaskFormValues = z.infer<typeof SplitTaskFormSchema>;

  const form = useForm<SplitTaskFormValues>({
    resolver: zodResolver(SplitTaskFormSchema),
    defaultValues: {
      splitQuantity: Math.floor(maxQuantity / 2) || 1,
      splitMode: 'retain',
    },
  });

  React.useEffect(() => {
    if (isOpen) {
      form.reset({
        splitQuantity: Math.floor(maxQuantity / 2) || 1,
        splitMode: 'retain',
      });
    }
  }, [isOpen, form, maxQuantity]);

  const handleSubmit = (data: SplitTaskFormValues) => {
    onSubmit(data.splitQuantity, data.splitMode);
  };

  const taskDisplayName = 'originalOrderDetails' in task && task.originalOrderDetails?.style 
                          ? task.originalOrderDetails.style 
                          : ('label' in task ? task.label : task.id);
  
  const watchedSplitMode = form.watch('splitMode');
  const quantityLabel = watchedSplitMode === 'retain' 
    ? "Quantity to Retain in First Part *" 
    : "Quantity to Remove for New Part *";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <DivideCircle className="mr-2 h-5 w-5 text-primary" />
            Split Task: {taskDisplayName}
          </DialogTitle>
          <DialogDescription>
            Specify quantity to split. Original Quantity: {maxQuantity}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="splitMode"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Split Action</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="retain" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Retain this quantity in the original part
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="remove" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Remove this quantity to a new part
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="splitQuantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{quantityLabel}</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 50" {...field} />
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
                <Save className="mr-2 h-4 w-4" /> Confirm Split
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
