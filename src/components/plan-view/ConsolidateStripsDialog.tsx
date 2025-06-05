
// src/components/plan-view/ConsolidateStripsDialog.tsx
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
import { Checkbox } from '@/components/ui/checkbox';
import { Layers, Save, SplitSquareHorizontal, RotateCcw } from 'lucide-react';
import type { ConsolidationOptions, ConsolidationCriteria } from './types';

// Re-export the types for external use
export type { ConsolidationOptions, ConsolidationCriteria };

interface ConsolidateStripsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (options: ConsolidationOptions) => void;
}

const consolidateFormSchema = z.object({
  criteria: z.enum([
    'customer',
    'orderSet',
    'poNo',
    'poAndColour',
    'soNo',
    'style',
    'none',
  ]) as z.ZodType<ConsolidationCriteria>, // Ensure correct type
  dropAtEnd: z.boolean().optional().default(false),
});

type ConsolidateFormValues = z.infer<typeof consolidateFormSchema>;

const criteriaOptions: { value: ConsolidationCriteria; label: string }[] = [
  { value: 'customer', label: 'Customer' },
  { value: 'orderSet', label: 'Order Set' },
  { value: 'poNo', label: 'PO No.' },
  { value: 'poAndColour', label: 'PO + Colour' },
  { value: 'soNo', label: 'SO No.' },
  { value: 'style', label: 'Style' },
  { value: 'none', label: '<None> (Reset/Clear Consolidation)' },
];

export function ConsolidateStripsDialog({
  isOpen,
  onOpenChange,
  onSubmit,
}: ConsolidateStripsDialogProps) {
  const form = useForm<ConsolidateFormValues>({
    resolver: zodResolver(consolidateFormSchema),
    defaultValues: {
      criteria: 'customer', // Default criteria
      dropAtEnd: false,
    },
  });

  React.useEffect(() => {
    if (isOpen) {
      form.reset({
        criteria: 'customer',
        dropAtEnd: false,
      });
    }
  }, [isOpen, form]);

  const handleSubmit = (data: ConsolidateFormValues) => {
    onSubmit(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Layers className="mr-2 h-5 w-5 text-primary" />
            Consolidate Strips
          </DialogTitle>
          <DialogDescription>
            Choose criteria to consolidate adjacent or related strips on the planning board.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="criteria"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Consolidate By</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex flex-col space-y-1"
                    >
                      {criteriaOptions.map((option) => (
                        <FormItem key={option.value} className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value={option.value} />
                          </FormControl>
                          <FormLabel className="font-normal">{option.label}</FormLabel>
                        </FormItem>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dropAtEnd"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3 shadow-sm">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-0.5">
                    <FormLabel>Drop consolidated strip at end of row</FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
            
            <Button type="button" variant="outline" className="w-full" disabled>
              <RotateCcw className="mr-2 h-4 w-4" />
              Split Back Consolidated Strips (Future Feature)
            </Button>

            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit">
                <Save className="mr-2 h-4 w-4" /> Apply Consolidation
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
