
// src/components/plan-view/EqualiseOrderDialog.tsx
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
import { Save, GitCompareArrows } from 'lucide-react';
import type { Task, VerticalTask } from './types';

interface EqualiseOrderDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | VerticalTask;
  onSubmit: (numberOfParts: number) => void;
}

const EqualiseOrderFormSchema = z.object({
  numberOfParts: z.coerce
    .number()
    .min(2, 'Must split into at least 2 parts.')
    .max(100, 'Cannot split into more than 100 parts.'), // Arbitrary practical limit
});

type EqualiseOrderFormValues = z.infer<typeof EqualiseOrderFormSchema>;

export function EqualiseOrderDialog({
  isOpen,
  onOpenChange,
  task,
  onSubmit,
}: EqualiseOrderDialogProps) {
  const form = useForm<EqualiseOrderFormValues>({
    resolver: zodResolver(EqualiseOrderFormSchema),
    defaultValues: {
      numberOfParts: 2,
    },
  });

  const originalQuantity = task.originalOrderDetails?.quantity || 0;
  const watchedNumberOfParts = form.watch('numberOfParts');
  const quantityPerPart = watchedNumberOfParts > 0 ? Math.floor(originalQuantity / watchedNumberOfParts) : 0;
  const remainder = watchedNumberOfParts > 0 ? originalQuantity % watchedNumberOfParts : 0;

  React.useEffect(() => {
    if (isOpen) {
      form.reset({
        numberOfParts: 2,
      });
    }
  }, [isOpen, form]);

  const handleSubmit = (data: EqualiseOrderFormValues) => {
    onSubmit(data.numberOfParts);
    onOpenChange(false); // Close dialog on submit
  };

  const taskDisplayName = 'originalOrderDetails' in task && task.originalOrderDetails?.style
                          ? task.originalOrderDetails.style
                          : ('label' in task ? task.label : task.id);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <GitCompareArrows className="mr-2 h-5 w-5 text-primary" />
            Equalise Order: {taskDisplayName}
          </DialogTitle>
          <DialogDescription>
            Split this order into multiple equal parts. Original Quantity: {originalQuantity.toLocaleString()}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="numberOfParts"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of Parts to Create *</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 3" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {watchedNumberOfParts > 0 && originalQuantity > 0 && (
              <div className="text-sm text-muted-foreground">
                This will create {watchedNumberOfParts} parts.
                Each part will have approx. {quantityPerPart.toLocaleString()} units.
                {remainder > 0 && ` The first ${remainder} part(s) will have 1 extra unit.`}
              </div>
            )}
            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={watchedNumberOfParts <= 1 || watchedNumberOfParts > originalQuantity}>
                <Save className="mr-2 h-4 w-4" /> Equalise Order
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
