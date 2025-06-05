
// src/app/masters/learning-curve/page.tsx
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { Brain, Edit, Trash2, PlusCircle, Save, X, LineChart, MoreVertical, Eye } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import type { LearningCurveMaster, LearningCurvePoint } from '@/lib/learningCurveTypes';
import { addLearningCurveToFirebase, getAllLearningCurvesFromFirebase, updateLearningCurveInFirebase, deleteLearningCurveFromFirebase } from '@/lib/firebaseService';
import { MasterDataLogDialog } from '@/components/masters/MasterDataLogDialog';

const learningCurvePointSchema = z.object({
  day: z.coerce.number().min(1, "Day must be at least 1."),
  efficiency: z.coerce.number().min(0, "Efficiency must be non-negative.").max(200, "Efficiency cannot exceed 200%.") // Allow >100% for highly skilled
});

const learningCurveFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Curve Name is required.").max(100, "Name must be 100 chars or less."),
  curveType: z.enum(['Standard', 'Complex', 'Simple', 'Custom'], { required_error: "Curve Type is required." }),
  smv: z.coerce.number().min(0.01, "SMV must be greater than 0."),
  workingMinutesPerDay: z.coerce.number().min(1, "Working minutes must be at least 1."),
  operatorsCount: z.coerce.number().min(1, "Operator count must be at least 1."),
  points: z.array(learningCurvePointSchema)
    .min(1, "At least one learning curve point is required.")
    .refine(points => { 
      if (points.length <= 1) return true;
      const days = points.map(p => p.day);
      if (new Set(days).size !== days.length) return false; 
      for (let i = 0; i < days.length - 1; i++) {
        if (days[i] >= days[i+1]) return false; 
      }
      return true;
    }, { message: "Learning curve points must have unique, ascending day numbers." }),
  description: z.string().max(250, "Description must be 250 chars or less.").optional(),
});

type LearningCurveFormValues = z.infer<typeof learningCurveFormSchema>;

const defaultPoint: LearningCurvePoint = { day: 1, efficiency: 50 };
const defaultValues: Omit<LearningCurveFormValues, 'id'> = {
  name: '',
  curveType: 'Standard',
  smv: 10, 
  workingMinutesPerDay: 480, 
  operatorsCount: 1, 
  points: [defaultPoint],
  description: '',
};

export default function LearningCurveMasterPage() {
  const { toast } = useToast();
  const [curves, setCurves] = React.useState<LearningCurveMaster[]>([]);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingCurve, setEditingCurve] = React.useState<LearningCurveMaster | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const [isLogDialogOpen, setIsLogDialogOpen] = React.useState(false);
  const [selectedItemForLog, setSelectedItemForLog] = React.useState<LearningCurveMaster | null>(null);

  const form = useForm<LearningCurveFormValues>({
    resolver: zodResolver(learningCurveFormSchema),
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "points",
  });

  const fetchLearningCurves = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedCurves = await getAllLearningCurvesFromFirebase();
      setCurves(fetchedCurves);
    } catch (error) {
      console.error("Error fetching learning curves:", error);
      toast({ title: "Error", description: "Could not fetch learning curves.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchLearningCurves();
  }, [fetchLearningCurves]);

  React.useEffect(() => {
    if (editingCurve) {
      form.reset(editingCurve);
    } else {
      form.reset(defaultValues);
    }
  }, [editingCurve, form, isFormOpen]);

  const onSubmit = async (data: LearningCurveFormValues) => {
    try {
      if (editingCurve) {
        await updateLearningCurveInFirebase(editingCurve.id, data);
        toast({ title: 'Learning Curve Updated', description: `Curve "${data.name}" has been updated.` });
      } else {
        await addLearningCurveToFirebase(data);
        toast({ title: 'Learning Curve Added', description: `Curve "${data.name}" has been added.` });
      }
      fetchLearningCurves(); 
      setIsFormOpen(false);
      setEditingCurve(null);
    } catch (error) {
      console.error("Error saving learning curve:", error);
      toast({ title: "Save Failed", description: "Could not save the learning curve.", variant: "destructive" });
    }
  };

  const handleAddNew = () => {
    setEditingCurve(null);
    form.reset(defaultValues);
    setIsFormOpen(true);
  };

  const handleEdit = (curve: LearningCurveMaster) => {
    setEditingCurve(curve);
    setIsFormOpen(true);
  };

  const handleDelete = async (curveId: string) => {
    try {
      await deleteLearningCurveFromFirebase(curveId);
      toast({ title: 'Learning Curve Deleted', variant: 'destructive' });
      fetchLearningCurves(); 
    } catch (error) {
      console.error("Error deleting learning curve:", error);
      toast({ title: "Delete Failed", description: "Could not delete the learning curve.", variant: "destructive" });
    }
  };
  
  const handleViewDetails = (curve: LearningCurveMaster) => {
    setSelectedItemForLog(curve);
    setIsLogDialogOpen(true);
  };

  const addPointField = () => {
    const lastDay = fields.length > 0 ? fields[fields.length - 1].day : 0;
    const lastEfficiency = fields.length > 0 ? fields[fields.length - 1].efficiency : 50;
    append({ day: lastDay + 1, efficiency: Math.min(lastEfficiency + 10, 100) });
  };

  return (
    <MasterPageTemplate
      title="Learning Curves"
      description="Define and manage learning curves for production efficiency."
      addLabel="Add New Curve"
      onAdd={handleAddNew}
    >
      <Card className="shadow-lg rounded-lg">
        <CardHeader className="px-6 py-4 border-b">
          <CardTitle className="text-lg font-semibold">Defined Learning Curves</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-6 text-center text-muted-foreground">Loading curves...</div>
            ) : curves.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="px-4 py-3">Name</TableHead>
                    <TableHead className="px-4 py-3">Type</TableHead>
                    <TableHead className="px-4 py-3">SMV</TableHead>
                    <TableHead className="px-4 py-3">Points</TableHead>
                    <TableHead className="px-4 py-3 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {curves.map(curve => (
                    <TableRow key={curve.id} className="odd:bg-muted/50">
                      <TableCell className="px-4 py-3 font-medium">{curve.name}</TableCell>
                      <TableCell className="px-4 py-3">{curve.curveType}</TableCell>
                      <TableCell className="px-4 py-3">{curve.smv.toFixed(2)}</TableCell>
                      <TableCell className="px-4 py-3 text-xs max-w-xs truncate">{curve.points.map(p => `D${p.day}:${p.efficiency}%`).join(', ')}</TableCell>
                      <TableCell className="px-4 py-3 text-right">
                         <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetails(curve)} className="cursor-pointer">
                              <Eye className="mr-2 h-4 w-4" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator/>
                            <DropdownMenuItem onClick={() => handleEdit(curve)} className="cursor-pointer">
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(curve.id)} className="text-destructive focus:text-destructive cursor-pointer">
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="p-6 text-center text-muted-foreground">No learning curves defined yet.</div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={(open) => { setIsFormOpen(open); if (!open) setEditingCurve(null); }}>
        <DialogContent className="sm:max-w-3xl p-6 rounded-lg shadow-xl max-h-[80vh] flex flex-col">
          <DialogHeader className="mb-4">
            <DialogTitle className="flex items-center text-xl font-semibold">
                <Brain className="mr-2 h-5 w-5 text-primary" />
                {editingCurve ? 'Edit Learning Curve' : 'Add New Learning Curve'}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Define the parameters and daily efficiency points for the learning curve.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 flex-grow overflow-y-auto pr-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>Curve Name *</FormLabel><FormControl><Input placeholder="e.g., Basic T-Shirt Curve" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="curveType" render={({ field }) => (
                    <FormItem><FormLabel>Curve Type *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger>
                            <SelectValue placeholder="Select curve type" /></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="Standard">Standard</SelectItem>
                                <SelectItem value="Complex">Complex</SelectItem>
                                <SelectItem value="Simple">Simple</SelectItem>
                                <SelectItem value="Custom">Custom</SelectItem>
                            </SelectContent>
                        </Select><FormMessage />
                    </FormItem>
                )}/>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField control={form.control} name="smv" render={({ field }) => (
                    <FormItem><FormLabel>SMV (Minutes) *</FormLabel><FormControl><Input type="number" step="0.01" placeholder="e.g., 12.50" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="workingMinutesPerDay" render={({ field }) => (
                    <FormItem><FormLabel>Work Minutes/Day *</FormLabel><FormControl><Input type="number" placeholder="e.g., 450" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="operatorsCount" render={({ field }) => (
                    <FormItem><FormLabel>Operators Count *</FormLabel><FormControl><Input type="number" placeholder="e.g., 20" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
              </div>
              <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Brief description of the curve..." {...field} rows={2} /></FormControl><FormMessage /></FormItem>
              )}/>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4 py-3">
                    <CardTitle className="text-md">Efficiency Points</CardTitle>
                    <Button type="button" size="sm" variant="outline" onClick={addPointField}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Point
                    </Button>
                </CardHeader>
                <CardContent className="pt-2 px-4 pb-4">
                    <div className="max-h-60 overflow-y-auto space-y-3 pr-1">
                        {fields.map((pointField, index) => (
                            <div key={pointField.id} className="flex items-start gap-2 p-3 border rounded-md bg-muted/30 relative">
                                <LineChart className="h-5 w-5 text-muted-foreground mr-1 mt-1.5 flex-shrink-0" />
                                <div className="grid grid-cols-2 gap-x-3 gap-y-2 flex-grow">
                                    <FormField control={form.control} name={`points.${index}.day`} render={({ field }) => (
                                        <FormItem><FormLabel className="text-xs">Day *</FormLabel><FormControl><Input type="number" placeholder="Day No." {...field} className="h-9"/></FormControl><FormMessage className="text-xs" /></FormItem>
                                    )}/>
                                    <FormField control={form.control} name={`points.${index}.efficiency`} render={({ field }) => (
                                        <FormItem><FormLabel className="text-xs">Efficiency % *</FormLabel><FormControl><Input type="number" placeholder="e.g., 60" {...field} className="h-9"/></FormControl><FormMessage className="text-xs" /></FormItem>
                                    )}/>
                                </div>
                                <Button type="button" variant="ghost" size="icon_sm" onClick={() => remove(index)} disabled={fields.length <= 1} className="text-destructive hover:text-destructive hover:bg-destructive/10 absolute top-1 right-1">
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                     {form.formState.errors.points && !form.formState.errors.points.root && fields.length > 0 && (
                        <p className="text-sm font-medium text-destructive mt-2">
                          Error in points. Please check values.
                        </p>
                     )}
                     {form.formState.errors.points?.root?.message && (
                        <p className="text-sm font-medium text-destructive mt-2">
                            {form.formState.errors.points.root.message}
                        </p>
                     )}
                </CardContent>
              </Card>

              <DialogFooter className="pt-6 sticky bottom-0 bg-background pb-0 -mb-6">
                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                <Button type="submit"><Save className="mr-2 h-4 w-4" />{editingCurve ? 'Update Curve' : 'Save Curve'}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {selectedItemForLog && (
        <MasterDataLogDialog
          isOpen={isLogDialogOpen}
          onOpenChange={setIsLogDialogOpen}
          itemName={selectedItemForLog.name}
          itemType="Learning Curve"
        />
      )}
    </MasterPageTemplate>
  );
}
