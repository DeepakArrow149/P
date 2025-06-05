
// src/components/order-form/PoSizeTable.tsx
'use client';

import * as React from 'react';
import { useFieldArray, type Control, type UseFormSetValue, type UseFormGetValues, type UseFormWatch } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { CalendarIcon, PlusCircle, Trash2, GripVertical } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import type { NewOrderFormValues, PoLine } from '@/app/new-order/page'; 

interface PoSizeTableProps {
  formControl: Control<NewOrderFormValues>;
  formSetValue: UseFormSetValue<NewOrderFormValues>;
  formGetValues: UseFormGetValues<NewOrderFormValues>;
  formWatch: UseFormWatch<NewOrderFormValues>;
  countryOptions: { value: string; label: string }[];
}

export function PoSizeTable({ formControl, formSetValue, formGetValues, formWatch, countryOptions }: PoSizeTableProps) {
  const { fields: poLineFields, append: appendPoLine, remove: removePoLine } = useFieldArray({
    control: formControl,
    name: 'poLines',
  });

  const activeSizeNames = formWatch('activeSizeNames');

  const handleAddPoLine = () => {
    appendPoLine({
      id: crypto.randomUUID(),
      soNo: '',
      poName: '',
      deliveryDate: new Date(),
      country: '',
      extraPercentage: 0,
      sizeQuantities: activeSizeNames.map(sizeName => ({ sizeName, quantity: 0 })),
    });
  };

  const handleAddSizeColumn = () => {
    const newSizeName = prompt('Enter new size name (e.g., XXL):');
    if (newSizeName && newSizeName.trim() !== '') {
      const trimmedNewSize = newSizeName.trim().toUpperCase();
      if (!activeSizeNames.includes(trimmedNewSize)) {
        const updatedSizeNames = [...activeSizeNames, trimmedNewSize];
        formSetValue('activeSizeNames', updatedSizeNames);

        const currentPoLines = formGetValues('poLines');
        currentPoLines.forEach((_poLine, index) => { 
          const existingSizeQuantities = formGetValues(`poLines.${index}.sizeQuantities`);
          formSetValue(`poLines.${index}.sizeQuantities`, [
            ...existingSizeQuantities,
            { sizeName: trimmedNewSize, quantity: 0 },
          ]);
        });
      } else {
        alert('Size name already exists.');
      }
    }
  };

  const calculateRowTotalQty = (poLineIndex: number): number => {
    const poLine = formWatch(`poLines.${poLineIndex}`);
    if (!poLine || !poLine.sizeQuantities) return 0;
    return poLine.sizeQuantities.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  };
  
  const calculateColumnTotalQty = (sizeName: string): number => {
     const poLines = formWatch('poLines');
     if (!poLines) return 0;
     return poLines.reduce((sum, line) => {
        if (!line || !line.sizeQuantities) return sum;
        const sizeItem = line.sizeQuantities.find(sq => sq.sizeName === sizeName);
        return sum + (Number(sizeItem?.quantity) || 0);
     }, 0);
  };

  const overallTotalQty = React.useMemo(() => {
    const poLines = formWatch('poLines');
    if (!poLines) return 0;
    return poLines.reduce((sum, _line, index) => sum + calculateRowTotalQty(index), 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formWatch('poLines')]); 
  
  const overallTotalExtraQty = React.useMemo(() => {
    const poLines = formWatch('poLines');
    if (!poLines) return 0;
    return poLines.reduce((sum, line, index) => {
        if (!line) return sum;
        const rowTotal = calculateRowTotalQty(index);
        const extraPercentage = Number(line.extraPercentage) || 0;
        return sum + (rowTotal * (extraPercentage / 100));
    }, 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formWatch('poLines')]);


  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">PO / Size Breakdown</h3>
        <Button type="button" variant="outline" size="sm" onClick={handleAddSizeColumn}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Size Column
        </Button>
      </div>

      <div className="overflow-x-auto border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px] sticky left-0 bg-card z-10 p-1"><span className="sr-only">Drag</span></TableHead>
              <TableHead className="min-w-[150px] sticky left-10 bg-card z-10">SO No.</TableHead>
              <TableHead className="min-w-[200px] sticky left-[190px] bg-card z-10">PO Name *</TableHead>
              <TableHead className="min-w-[180px]">Delivery Date *</TableHead>
              <TableHead className="min-w-[150px]">Country</TableHead>
              <TableHead className="min-w-[100px] text-right">Extra %</TableHead>
              {activeSizeNames.map(sizeName => (
                <TableHead key={sizeName} className="min-w-[80px] text-right">{sizeName} Qty *</TableHead>
              ))}
              <TableHead className="min-w-[100px] text-right">Total Qty</TableHead>
              <TableHead className="w-[50px] text-right sticky right-0 bg-card z-10 p-1">Del</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {poLineFields.map((poField, poIndex) => (
              <TableRow key={poField.id}>
                <TableCell className="sticky left-0 bg-card z-10 p-1">
                    <Button type="button" variant="ghost" size="icon_sm" className="cursor-grab h-8 w-8">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                    </Button>
                </TableCell>
                <TableCell className="sticky left-10 bg-card z-10">
                  <FormField
                    control={formControl}
                    name={`poLines.${poIndex}.soNo`}
                    render={({ field }) => <Input {...field} placeholder="SO Number" className="h-9 text-xs" />}
                  />
                </TableCell>
                <TableCell className="sticky left-[190px] bg-card z-10">
                  <FormField
                    control={formControl}
                    name={`poLines.${poIndex}.poName`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl><Input {...field} placeholder="PO Name/Reference" className="h-9 text-xs" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TableCell>
                <TableCell>
                  <FormField
                    control={formControl}
                    name={`poLines.${poIndex}.deliveryDate`}
                    render={({ field }) => (
                      <FormItem>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button variant="outline" size="sm" className={cn("w-full justify-start text-left font-normal h-9 text-xs", !field.value && "text-muted-foreground")}>
                                {field.value ? format(field.value instanceof Date ? field.value : parseISO(field.value as unknown as string), "PPP") : <span>Pick date</span>}
                                <CalendarIcon className="ml-auto h-3 w-3 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value instanceof Date ? field.value : undefined} onSelect={field.onChange} initialFocus /></PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TableCell>
                <TableCell>
                  <FormField
                    control={formControl}
                    name={`poLines.${poIndex}.country`}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value || undefined}>
                        <FormControl><SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Country" /></SelectTrigger></FormControl>
                        <SelectContent>{countryOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                      </Select>
                    )}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <FormField
                    control={formControl}
                    name={`poLines.${poIndex}.extraPercentage`}
                    render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? 0 : +e.target.value)} value={field.value ?? 0} placeholder="0.000" step="0.001" className="h-9 text-xs text-right" />}
                  />
                </TableCell>
                {activeSizeNames.map(sizeName => {
                  const currentPoLine = formWatch(`poLines.${poIndex}`);
                  const sizeQtyIndex = currentPoLine?.sizeQuantities?.findIndex(sq => sq.sizeName === sizeName) ?? -1;
                  
                  return (
                    <TableCell key={sizeName} className="text-right">
                      {sizeQtyIndex !== -1 ? (
                        <FormField
                          control={formControl}
                          name={`poLines.${poIndex}.sizeQuantities.${sizeQtyIndex}.quantity`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl><Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? 0 : +e.target.value)} value={field.value ?? 0} placeholder="0" className="h-9 text-xs text-right" /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      ) : (
                        <Input type="number" value={0} disabled className="h-9 text-xs text-right" />
                      )}
                    </TableCell>
                  );
                })}
                <TableCell className="text-right font-medium text-xs">
                  {calculateRowTotalQty(poIndex).toLocaleString()}
                </TableCell>
                <TableCell className="sticky right-0 bg-card z-10 p-1">
                  <Button type="button" variant="ghost" size="icon_sm" onClick={() => removePoLine(poIndex)} disabled={poLineFields.length <= 1} className="text-destructive hover:text-destructive h-8 w-8">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow className="bg-muted/50 font-semibold">
              <TableCell colSpan={6} className="text-right sticky left-0 bg-muted/50 z-10">Column Totals:</TableCell>
              {activeSizeNames.map(sizeName => (
                  <TableCell key={`total-${sizeName}`} className="text-right text-xs">
                      {calculateColumnTotalQty(sizeName).toLocaleString()}
                  </TableCell>
              ))}
              <TableCell className="text-right text-xs">
                  {overallTotalQty.toLocaleString()}
              </TableCell>
              <TableCell className="sticky right-0 bg-muted/50 z-10"></TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>

      <Button type="button" variant="outline" size="sm" onClick={handleAddPoLine} className="mt-2">
        <PlusCircle className="mr-2 h-4 w-4" /> Add PO Line
      </Button>
       {formGetValues('poLines')?.length === 0 && <p className="text-sm text-muted-foreground">No PO lines added yet. Click "Add PO Line" to start.</p>}
      
       {formControl.getFieldState('poLines')?.error && (
          <FormMessage>{formControl.getFieldState('poLines')?.error?.message || formControl.getFieldState('poLines')?.error?.root?.message}</FormMessage>
       )}


      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border rounded-md bg-muted/30">
        <div>
            <FormLabel className="text-xs text-muted-foreground">Overall Total Quantity</FormLabel>
            <p className="font-semibold text-lg">{overallTotalQty.toLocaleString()}</p>
        </div>
         <div>
            <FormLabel className="text-xs text-muted-foreground">Overall Total Extra Quantity</FormLabel>
            <p className="font-semibold text-lg">{overallTotalExtraQty.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 3})}</p>
        </div>
      </div>
    </div>
  );
}
