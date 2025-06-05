
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
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building, Edit, Trash2, PlusCircle, Filter as FilterIcon, MoreVertical, Save, Eye } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { mockUnitsData as initialMockUnitsData, type MockUnit } from '@/lib/mockData';
import { MasterDataLogDialog } from '@/components/masters/MasterDataLogDialog';

interface UnitData extends MockUnit {}

const unitFormSchema = z.object({
  id: z.string().optional(),
  unitCode: z.string().min(1, 'Unit Code is required').max(20, 'Unit Code must be 20 characters or less'),
  unitName: z.string().min(1, 'Unit Name is required').max(100, 'Unit Name must be 100 characters or less'),
  location: z.string().max(100, 'Location must be 100 characters or less').optional().default(''),
  unitType: z.enum(['Factory', 'Warehouse', 'Office', 'Other']).optional(),
  contactPerson: z.string().max(50, 'Contact Person must be 50 characters or less').optional().default(''),
  contactNumber: z.string().max(20, 'Contact Number must be 20 characters or less').regex(/^$|^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/, "Invalid phone number format").optional().default(''),
});

type UnitFormValues = z.infer<typeof unitFormSchema>;

const defaultValues: UnitFormValues = {
  unitCode: '',
  unitName: '',
  location: '',
  unitType: undefined,
  contactPerson: '',
  contactNumber: '',
};

export default function UnitMasterPage() {
  const { toast } = useToast();
  const [units, setUnits] = React.useState<UnitData[]>(initialMockUnitsData);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingUnit, setEditingUnit] = React.useState<UnitData | null>(null);
  const [filterText, setFilterText] = React.useState('');
  
  const [isLogDialogOpen, setIsLogDialogOpen] = React.useState(false);
  const [selectedItemForLog, setSelectedItemForLog] = React.useState<UnitData | null>(null);

  const form = useForm<UnitFormValues>({
    resolver: zodResolver(unitFormSchema),
    defaultValues,
  });

  React.useEffect(() => {
    if (editingUnit) {
      form.reset({
        ...defaultValues, 
        ...editingUnit,
        unitType: editingUnit.unitType || undefined,
      });
    } else {
      form.reset(defaultValues);
    }
  }, [editingUnit, form, isFormOpen]);

  const onSubmit = (data: UnitFormValues) => {
    if (editingUnit) {
      const updatedUnits = units.map(u => u.id === editingUnit.id ? { ...editingUnit, ...data } : u)
      setUnits(updatedUnits);
      // In a real app, you'd call updateUnitInFirebase(editingUnit.id, data);
      toast({ title: 'Unit Updated', description: `Unit "${data.unitName}" has been updated.` });
    } else {
      const newUnitWithId: UnitData = { ...data, id: `U-${Date.now()}` };
      setUnits(prev => [newUnitWithId, ...prev]);
      // In a real app, you'd call addUnitToFirebase(data);
      toast({ title: 'Unit Added', description: `Unit "${data.unitName}" has been added.` });
    }
    setIsFormOpen(false);
    setEditingUnit(null);
  };

  const handleAddNew = () => {
    setEditingUnit(null);
    form.reset(defaultValues);
    setIsFormOpen(true);
  };

  const handleEdit = (unit: UnitData) => {
    setEditingUnit(unit);
    setIsFormOpen(true);
  };

  const handleDelete = (unitId: string) => {
    setUnits(prevUnits => prevUnits.filter(u => u.id !== unitId));
    // In a real app, you'd call deleteUnitFromFirebase(unitId);
    toast({ title: 'Unit Deleted', description: 'The unit has been deleted.', variant: 'destructive' });
  };

  const handleViewDetails = (unit: UnitData) => {
    setSelectedItemForLog(unit);
    setIsLogDialogOpen(true);
  };

  const unitsToDisplay = units.filter(unit =>
    unit.unitName.toLowerCase().includes(filterText.toLowerCase()) ||
    unit.unitCode.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <MasterPageTemplate
      title="Units"
      description="Manage production units or factories."
    >
      <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <Button onClick={handleAddNew} className="w-full sm:w-auto">
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Unit
        </Button>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Input
            placeholder="Filter by code or name..."
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
          <CardTitle className="text-lg font-semibold">Registered Units</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">List of all production units and facilities.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-4 py-3">Unit Code</TableHead>
                  <TableHead className="px-4 py-3">Unit Name</TableHead>
                  <TableHead className="px-4 py-3">Location</TableHead>
                  <TableHead className="px-4 py-3">Type</TableHead>
                  <TableHead className="px-4 py-3 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unitsToDisplay.length > 0 ? (
                  unitsToDisplay.map(unit => (
                    <TableRow key={unit.id} className="odd:bg-muted/50">
                      <TableCell className="px-4 py-3 font-medium">{unit.unitCode}</TableCell>
                      <TableCell className="px-4 py-3">{unit.unitName}</TableCell>
                      <TableCell className="px-4 py-3">{unit.location || '-'}</TableCell>
                      <TableCell className="px-4 py-3">{unit.unitType || '-'}</TableCell>
                      <TableCell className="px-4 py-3 text-right">
                         <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="shadow-lg rounded-md">
                             <DropdownMenuItem onClick={() => handleViewDetails(unit)} className="cursor-pointer">
                              <Eye className="mr-2 h-4 w-4" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleEdit(unit)} className="cursor-pointer">
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(unit.id)} className="text-destructive focus:text-destructive cursor-pointer">
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center px-4 py-3">
                      {filterText ? 'No units match your filter.' : 'No units found. Click "Add New Unit" to get started.'}
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
          if (!open) setEditingUnit(null);
      }}>
        <DialogContent className="sm:max-w-[500px] p-6 rounded-lg shadow-xl max-h-[70vh] overflow-y-auto">
          <DialogHeader className="mb-4">
            <DialogTitle className="flex items-center text-xl font-semibold">
                <Building className="mr-2 h-5 w-5 text-primary" />
                {editingUnit ? 'Edit Unit' : 'Add New Unit'}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {editingUnit ? 'Update the details of this unit.' : 'Enter the details for the new unit.'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pr-2">
              <FormField
                control={form.control}
                name="unitCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">Unit Code *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., FAC-01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="unitName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">Unit Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Main Factory Building A" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">Location</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Industrial Area, Sector 5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="unitType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">Unit Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select unit type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Factory">Factory</SelectItem>
                        <SelectItem value="Warehouse">Warehouse</SelectItem>
                        <SelectItem value="Office">Office</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contactPerson"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">Contact Person</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Mr. Sharma" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contactNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">Contact Number</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 123-456-7890" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="pt-6 flex flex-col sm:flex-row sm:justify-end gap-2">
                <DialogClose asChild>
                    <Button type="button" variant="outline" className="w-full sm:w-auto">Cancel</Button>
                </DialogClose>
                <Button type="submit" className="w-full sm:w-auto">
                    <Save className="mr-2 h-4 w-4" />
                    {editingUnit ? 'Update Unit' : 'Save Unit'}
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
          itemName={selectedItemForLog.unitName}
          itemType="Unit"
        />
      )}
    </MasterPageTemplate>
  );
}
