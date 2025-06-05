
// src/app/masters/shift/page.tsx
'use client';

import * as React from 'react';
import { MasterPageTemplate } from '@/components/masters/master-page-template';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { Clock, Edit, Trash2, PlusCircle, Filter as FilterIcon, MoreVertical, Save, Minus, Briefcase, Coffee, Eye } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { MasterDataLogDialog } from '@/components/masters/MasterDataLogDialog';

const shiftHourStatusSchema = z.enum(['working', 'break', 'off']);
type ShiftHourStatusType = z.infer<typeof shiftHourStatusSchema>;

const shiftHourSchema = z.object({
  hour: z.number().min(0).max(23),
  status: shiftHourStatusSchema,
});
type ShiftHour = z.infer<typeof shiftHourSchema>;

const shiftFormSchema = z.object({
  id: z.string().optional(),
  shiftCode: z.string().min(1, 'Shift Code is required').max(20, 'Code must be 20 chars or less'),
  shiftName: z.string().min(1, 'Shift Name is required').max(50, 'Name must be 50 chars or less'),
  hourlyBreakup: z.array(shiftHourSchema).length(24, "Must define status for all 24 hours"),
  notes: z.string().max(250, 'Notes must be 250 chars or less').optional(),
});

type ShiftFormValues = z.infer<typeof shiftFormSchema>;

interface ShiftDisplayData extends ShiftFormValues {
  id: string;
  derivedStartTime: string;
  derivedEndTime: string;
  derivedBreakDuration: number; // in minutes
  derivedWorkDuration: number; // in hours
}

const calculateDerivedShiftDetails = (hourlyBreakup: ShiftHour[]) => {
  let firstWorkingHour: number | null = null;
  let lastActiveHour: number | null = null; 
  let breakMinutes = 0;
  let workingMinutes = 0;

  hourlyBreakup.forEach(entry => {
    if (entry.status === 'working') {
      workingMinutes += 60;
      if (firstWorkingHour === null) {
        firstWorkingHour = entry.hour;
      }
      lastActiveHour = entry.hour;
    } else if (entry.status === 'break') {
      breakMinutes += 60;
      if (firstWorkingHour === null) {
         const nextHourIsWorking = hourlyBreakup.slice(entry.hour + 1).some(h => h.status === 'working');
         if (nextHourIsWorking) {
            firstWorkingHour = entry.hour;
         }
      }
      if (firstWorkingHour !== null) {
        lastActiveHour = entry.hour;
      }
    }
  });
  
  const derivedStartTime = firstWorkingHour !== null ? `${String(firstWorkingHour).padStart(2, '0')}:00` : '--:--';
  const derivedEndTime = lastActiveHour !== null ? `${String((lastActiveHour + 1) % 24).padStart(2, '0')}:00` : '--:--';

  const isActiveAllDay = hourlyBreakup.every(h => h.status === 'working' || h.status === 'break');
  if (isActiveAllDay && firstWorkingHour === 0 && lastActiveHour === 23) {
    // No specific startTime/endTime, it's a full 24h shift
  }

  return {
    derivedStartTime,
    derivedEndTime,
    derivedWorkDuration: workingMinutes / 60,
    derivedBreakDuration: breakMinutes,
  };
};

const initialHourlyBreakup = (): ShiftHour[] =>
  Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    status: (i >= 9 && i < 12) || (i >= 13 && i < 17) ? 'working' : (i === 12 ? 'break' : 'off'), 
  }));

const defaultValues: Omit<ShiftFormValues, 'id'> = {
  shiftCode: '',
  shiftName: '',
  hourlyBreakup: initialHourlyBreakup(),
  notes: '',
};

const initialMockShifts: ShiftDisplayData[] = [
    {
        id: 'SHIFT-MORNING',
        shiftCode: 'MORN',
        shiftName: 'Morning Shift (9AM-5PM)',
        hourlyBreakup: Array.from({ length: 24 }, (_, i) => ({
            hour: i,
            status: (i >= 9 && i < 12) || (i >= 13 && i < 17) ? 'working' : (i === 12 ? 'break' : 'off'),
        })),
        notes: 'Standard morning shift with a 1-hour lunch break.',
        ...calculateDerivedShiftDetails(Array.from({ length: 24 }, (_, i) => ({
            hour: i,
            status: (i >= 9 && i < 12) || (i >= 13 && i < 17) ? 'working' : (i === 12 ? 'break' : 'off'),
        }))),
    },
    {
        id: 'SHIFT-EVENING',
        shiftCode: 'EVE',
        shiftName: 'Evening Shift (2PM-10PM)',
        hourlyBreakup: Array.from({ length: 24 }, (_, i) => ({
            hour: i,
            status: (i >= 14 && i < 18) || (i >= 18.5 && i < 22) ? 'working' : (i === 18 ? 'break' : 'off'), 
        })),
        notes: 'Evening shift with a 30-minute dinner break.',
         ...calculateDerivedShiftDetails(Array.from({ length: 24 }, (_, i) => ({
            hour: i,
            status: (i >= 14 && i < 18) || (i >= 18.5 && i < 22) ? 'working' : (i === 18 ? 'break' : 'off'),
        }))),
    },
];

export default function ShiftMasterPage() {
  const { toast } = useToast();
  const [shifts, setShifts] = React.useState<ShiftDisplayData[]>(initialMockShifts);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingShift, setEditingShift] = React.useState<ShiftDisplayData | null>(null);
  const [filterText, setFilterText] = React.useState('');

  const [isLogDialogOpen, setIsLogDialogOpen] = React.useState(false);
  const [selectedItemForLog, setSelectedItemForLog] = React.useState<ShiftDisplayData | null>(null);

  const form = useForm<ShiftFormValues>({
    resolver: zodResolver(shiftFormSchema),
    defaultValues,
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: "hourlyBreakup",
  });

  const watchedHourlyBreakup = form.watch("hourlyBreakup");
  const derivedDetailsInForm = React.useMemo(() => calculateDerivedShiftDetails(watchedHourlyBreakup), [watchedHourlyBreakup]);

  React.useEffect(() => {
    if (editingShift) {
      form.reset({
        id: editingShift.id,
        shiftCode: editingShift.shiftCode,
        shiftName: editingShift.shiftName,
        hourlyBreakup: editingShift.hourlyBreakup,
        notes: editingShift.notes,
      });
    } else {
      form.reset(defaultValues);
    }
  }, [editingShift, form, isFormOpen]);

  const onSubmit = (data: ShiftFormValues) => {
    const derived = calculateDerivedShiftDetails(data.hourlyBreakup);
    if (editingShift) {
      const updatedShift = { ...editingShift, ...data, ...derived };
      setShifts(prevShifts =>
        prevShifts.map(s => (s.id === editingShift.id ? updatedShift : s))
      );
      toast({ title: 'Shift Updated', description: `Shift "${data.shiftName}" has been updated.` });
    } else {
      const newId = `SHIFT-${Date.now()}`;
      const newShift: ShiftDisplayData = { ...data, id: newId, ...derived };
      setShifts(prevShifts => [newShift, ...prevShifts]);
      toast({ title: 'Shift Added', description: `Shift "${data.shiftName}" has been added.` });
    }
    setIsFormOpen(false);
    setEditingShift(null);
  };

  const handleAddNew = () => {
    setEditingShift(null);
    form.reset(defaultValues); 
    setIsFormOpen(true);
  };

  const handleEdit = (shift: ShiftDisplayData) => {
    setEditingShift(shift);
    setIsFormOpen(true);
  };

  const handleDelete = (shiftId: string) => {
    setShifts(prevShifts => prevShifts.filter(s => s.id !== shiftId));
    toast({ title: 'Shift Deleted', description: 'The shift has been deleted.', variant: 'destructive' });
  };
  
  const handleViewDetails = (shift: ShiftDisplayData) => {
    setSelectedItemForLog(shift);
    setIsLogDialogOpen(true);
  };

  const filteredShifts = shifts.filter(shift =>
    shift.shiftName.toLowerCase().includes(filterText.toLowerCase()) ||
    shift.shiftCode.toLowerCase().includes(filterText.toLowerCase())
  );

  const cycleHourStatus = (index: number) => {
    const currentStatus = form.getValues(`hourlyBreakup.${index}.status`);
    const statuses: ShiftHourStatusType[] = ['working', 'break', 'off'];
    const nextStatusIndex = (statuses.indexOf(currentStatus) + 1) % statuses.length;
    form.setValue(`hourlyBreakup.${index}.status`, statuses[nextStatusIndex], { shouldValidate: true, shouldDirty: true });
  };
  
  return (
    <MasterPageTemplate
      title="Shifts"
      description="Manage work shifts and timings using an hourly breakup."
    >
      <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <Button onClick={handleAddNew} className="w-full sm:w-auto">
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Shift
        </Button>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Input
            placeholder="Filter by name or code..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="h-10 max-w-full sm:max-w-xs"
          />
          <Button variant="ghost" size="icon" disabled>
            <FilterIcon className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <Card className="shadow-lg rounded-lg">
        <CardHeader className="px-6 py-4 border-b">
          <CardTitle className="text-lg font-semibold">Shift Records</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">List of all defined work shifts with derived timings.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-4 py-3">Shift Code</TableHead>
                  <TableHead className="px-4 py-3">Shift Name</TableHead>
                  <TableHead className="px-4 py-3">Start Time</TableHead>
                  <TableHead className="px-4 py-3">End Time</TableHead>
                  <TableHead className="px-4 py-3 text-right">Work (hrs)</TableHead>
                  <TableHead className="px-4 py-3 text-right">Break (min)</TableHead>
                  <TableHead className="px-4 py-3 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredShifts.length > 0 ? (
                  filteredShifts.map(shift => (
                    <TableRow key={shift.id} className="odd:bg-muted/50">
                      <TableCell className="px-4 py-3 font-medium">{shift.shiftCode}</TableCell>
                      <TableCell className="px-4 py-3">{shift.shiftName}</TableCell>
                      <TableCell className="px-4 py-3">{shift.derivedStartTime}</TableCell>
                      <TableCell className="px-4 py-3">{shift.derivedEndTime}</TableCell>
                      <TableCell className="px-4 py-3 text-right">{shift.derivedWorkDuration.toFixed(1)}</TableCell>
                      <TableCell className="px-4 py-3 text-right">{shift.derivedBreakDuration}</TableCell>
                      <TableCell className="px-4 py-3 text-right">
                         <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="shadow-lg rounded-md">
                            <DropdownMenuItem onClick={() => handleViewDetails(shift)} className="cursor-pointer">
                              <Eye className="mr-2 h-4 w-4" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator/>
                            <DropdownMenuItem onClick={() => handleEdit(shift)} className="cursor-pointer">
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(shift.id)} className="text-destructive focus:text-destructive cursor-pointer">
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center px-4 py-3">
                      {filterText ? 'No shifts match your filter.' : 'No shifts found. Click "Add New Shift" to get started.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditingShift(null);
      }}>
        <DialogContent className="sm:max-w-3xl p-6 rounded-lg shadow-xl max-h-[80vh] flex flex-col">
          <DialogHeader className="mb-4">
            <DialogTitle className="flex items-center text-xl font-semibold">
                <Clock className="mr-2 h-5 w-5 text-primary" />
                {editingShift ? 'Edit Shift' : 'Add New Shift'}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {editingShift ? 'Update the details of this shift using the hourly editor.' : 'Define the new shift using the hourly editor.'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 flex-grow overflow-y-auto pr-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <FormField
                    control={form.control}
                    name="shiftCode"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel className="font-medium">Shift Code *</FormLabel>
                        <FormControl>
                        <Input placeholder="e.g., MORNING" {...field} className="h-10"/>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="shiftName"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel className="font-medium">Shift Name *</FormLabel>
                        <FormControl>
                        <Input placeholder="e.g., Morning Shift (8 AM - 4 PM)" {...field} className="h-10"/>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
              </div>
              
              <Card>
                <CardHeader className="py-3 px-4">
                    <CardTitle className="text-md">Hourly Breakup Editor</CardTitle>
                    <CardDescription className="text-xs">Click each hour to cycle status: Working → Break → Off. Green indicates working, Yellow break, Grey off.</CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                    <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-1">
                        {fields.map((field, index) => (
                        <div key={field.id} className="flex flex-col items-center">
                            <span className="text-xs font-mono text-muted-foreground">{String(index).padStart(2, '0')}</span>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className={cn(
                                    "w-full h-10 p-0 text-xs transition-all",
                                    watchedHourlyBreakup[index]?.status === 'working' && 'bg-green-500 hover:bg-green-600 text-white border-green-600',
                                    watchedHourlyBreakup[index]?.status === 'break' && 'bg-yellow-400 hover:bg-yellow-500 text-black border-yellow-500',
                                    watchedHourlyBreakup[index]?.status === 'off' && 'bg-muted hover:bg-muted/80 text-muted-foreground border-border'
                                )}
                                onClick={() => cycleHourStatus(index)}
                                title={`Hour ${index}:00 - Status: ${watchedHourlyBreakup[index]?.status}. Click to change.`}
                            >
                                {watchedHourlyBreakup[index]?.status === 'working' && <Briefcase className="h-3 w-3" />}
                                {watchedHourlyBreakup[index]?.status === 'break' && <Coffee className="h-3 w-3" />}
                                {watchedHourlyBreakup[index]?.status === 'off' && <Minus className="h-3 w-3" />}
                            </Button>
                        </div>
                        ))}
                    </div>
                    {form.formState.errors.hourlyBreakup && (
                        <FormMessage className="mt-2">{form.formState.errors.hourlyBreakup.message || form.formState.errors.hourlyBreakup.root?.message}</FormMessage>
                    )}
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-3 border rounded-md bg-muted/50 text-xs">
                <div>
                    <FormLabel className="font-medium text-muted-foreground block">Start Time</FormLabel>
                    <p className="font-semibold">{derivedDetailsInForm.derivedStartTime}</p>
                </div>
                <div>
                    <FormLabel className="font-medium text-muted-foreground block">End Time</FormLabel>
                    <p className="font-semibold">{derivedDetailsInForm.derivedEndTime}</p>
                </div>
                <div>
                    <FormLabel className="font-medium text-muted-foreground block">Break (min)</FormLabel>
                    <p className="font-semibold">{derivedDetailsInForm.derivedBreakDuration}</p>
                </div>
                 <div>
                    <FormLabel className="font-medium text-muted-foreground block">Work (hrs)</FormLabel>
                    <p className="font-semibold">{derivedDetailsInForm.derivedWorkDuration.toFixed(1)}</p>
                </div>
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">Notes</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Any specific notes about this shift..." {...field} rows={3} className="min-h-[80px]"/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
             <DialogFooter className="pt-6 flex flex-col sm:flex-row sm:justify-end gap-2 mt-auto sticky bottom-0 bg-background pb-0 -mb-6">
                <DialogClose asChild>
                    <Button type="button" variant="outline" className="w-full sm:w-auto">Cancel</Button>
                </DialogClose>
                <Button type="submit" className="w-full sm:w-auto">
                    <Save className="mr-2 h-4 w-4" />
                    {editingShift ? 'Update Shift' : 'Save Shift'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {selectedItemForLog && (
        <MasterDataLogDialog
          isOpen={isLogDialogOpen}
          onOpenChange={setIsLogDialogOpen}
          itemName={selectedItemForLog.shiftName}
          itemType="Shift"
        />
      )}
    </MasterPageTemplate>
  );
}
