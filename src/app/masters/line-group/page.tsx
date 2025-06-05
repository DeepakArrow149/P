
// src/app/masters/line-group/page.tsx
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
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { Group, Edit, Trash2, PlusCircle, Filter as FilterIcon, MoreVertical, Save, Users, Eye } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { MasterDataLogDialog } from '@/components/masters/MasterDataLogDialog';
import { useLineGroupApi, type LineGroup } from '@/hooks/useLineGroupApi';
import { useLineApi, type Line } from '@/hooks/useLineApi';

const lineGroupFormSchema = z.object({
  id: z.number().optional(),
  groupName: z.string().min(1, 'Group Name is required').max(100, 'Group Name must be 100 characters or less'),
  lineIds: z.array(z.string()).min(1, 'At least one line must be assigned to the group.'),
  description: z.string().max(500, 'Description must be 500 characters or less').optional(),
});

type LineGroupFormValues = z.infer<typeof lineGroupFormSchema>;

const defaultValues: Omit<LineGroupFormValues, 'id'> = {
  groupName: '',
  lineIds: [],
  description: '',
};

export default function LineGroupMasterPage() {
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingGroup, setEditingGroup] = React.useState<LineGroup | null>(null);
  const [filterText, setFilterText] = React.useState('');
  const [isLogDialogOpen, setIsLogDialogOpen] = React.useState(false);
  const [selectedItemForLog, setSelectedItemForLog] = React.useState<LineGroup | null>(null);

  // API hooks
  const {
    lineGroups,
    loading: lineGroupsLoading,
    error: lineGroupsError,
    dataSource,
    searchLineGroups,
    createLineGroup,
    updateLineGroup,
    deleteLineGroup,
  } = useLineGroupApi();

  const {
    lines,
    loading: linesLoading,
    error: linesError,
    searchLines,
  } = useLineApi();

  const form = useForm<LineGroupFormValues>({
    resolver: zodResolver(lineGroupFormSchema),
    defaultValues,
  });

  // Load lines on component mount
  React.useEffect(() => {
    searchLines();
  }, [searchLines]);

  // Update form when editing a group
  React.useEffect(() => {
    if (editingGroup) {
      form.reset({
        id: editingGroup.id,
        groupName: editingGroup.groupName,
        lineIds: editingGroup.lineIds,
        description: editingGroup.description || '',
      });
    } else {
      form.reset(defaultValues);
    }
  }, [editingGroup, form, isFormOpen]);

  // Show error toast if there are API errors
  React.useEffect(() => {
    if (lineGroupsError) {
      toast({
        title: 'Error Loading Line Groups',
        description: lineGroupsError,
        variant: 'destructive',
      });
    }
  }, [lineGroupsError, toast]);

  React.useEffect(() => {
    if (linesError) {
      toast({
        title: 'Error Loading Lines',
        description: linesError,
        variant: 'destructive',
      });
    }
  }, [linesError, toast]);

  const onSubmit = async (data: LineGroupFormValues) => {
    // Check for duplicate group names
    const existingGroup = lineGroups.find(group => 
      group.groupName.toLowerCase() === data.groupName.toLowerCase() && 
      (!editingGroup || group.id !== editingGroup.id)
    );

    if (existingGroup) {
      toast({
        title: 'Duplicate Group Name',
        description: `Group name "${data.groupName}" already exists. Please use a different name.`,
        variant: 'destructive',
      });
      return;
    }

    // Check for conflicting line assignments
    const assignedLineIdsInOtherGroups = new Set<string>();
    lineGroups.forEach(group => {
      if (!editingGroup || group.id !== editingGroup.id) {
        group.lineIds.forEach(id => assignedLineIdsInOtherGroups.add(id));
      }
    });

    const conflictingLines = data.lineIds.filter(id => assignedLineIdsInOtherGroups.has(id));
    if (conflictingLines.length > 0) {
      const conflictingLineNames = conflictingLines.map(id => 
        lines.find(line => line.id === id)?.lineName || id
      ).join(', ');
      
      toast({
        title: 'Assignment Conflict',
        description: `The following lines are already assigned to other groups: ${conflictingLineNames}. A line can only belong to one group.`,
        variant: 'destructive',
      });
      return;
    }

    try {
      if (editingGroup) {
        const updatedGroup = await updateLineGroup(editingGroup.id!, {
          groupName: data.groupName,
          lineIds: data.lineIds,
          description: data.description,
        });
        
        if (updatedGroup) {
          toast({ 
            title: 'Line Group Updated', 
            description: `Group "${data.groupName}" updated successfully.` 
          });
        }
      } else {
        const newGroup = await createLineGroup({
          groupName: data.groupName,
          lineIds: data.lineIds,
          description: data.description,
        });
        
        if (newGroup) {
          toast({ 
            title: 'Line Group Created', 
            description: `Group "${data.groupName}" created successfully.` 
          });
        }
      }
      
      setIsFormOpen(false);
      setEditingGroup(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: editingGroup ? 'Failed to update line group.' : 'Failed to create line group.',
        variant: 'destructive',
      });
    }
  };

  const handleAddNew = () => {
    setEditingGroup(null);
    form.reset(defaultValues);
    setIsFormOpen(true);
  };

  const handleEdit = (group: LineGroup) => {
    setEditingGroup(group);
    setIsFormOpen(true);
  };

  const handleDelete = async (groupId: number) => {
    try {
      const success = await deleteLineGroup(groupId);
      if (success) {
        toast({ 
          title: 'Line Group Deleted', 
          description: 'The line group has been deleted successfully.',
          variant: 'destructive' 
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete line group.',
        variant: 'destructive',
      });
    }
  };

  const handleViewDetails = (group: LineGroup) => {
    setSelectedItemForLog(group);
    setIsLogDialogOpen(true);
  };

  const filteredGroups = lineGroups.filter(group =>
    group.groupName.toLowerCase().includes(filterText.toLowerCase())
  );

  const getLineNameById = (lineId: string): string => {
    return lines.find(line => line.id === lineId)?.lineName || lineId;
  };

  const isLoading = lineGroupsLoading || linesLoading;

  return (
    <MasterPageTemplate
      title="Line Groups"
      description="Manage groups of production lines for organizational purposes."
    >
      {/* Data Source Badge */}
      {dataSource === 'mock' && (
        <div className="mb-4">
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            Using Mock Data - Database Unavailable
          </Badge>
        </div>
      )}

      <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <Button onClick={handleAddNew} disabled={isLoading} className="w-full sm:w-auto">
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Line Group
        </Button>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Input
            placeholder="Filter by group name..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="h-10 max-w-full sm:max-w-xs"
            disabled={isLoading}
          />
          <Button variant="ghost" size="icon" disabled>
            <FilterIcon className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <Card className="shadow-lg rounded-lg">
        <CardHeader className="px-6 py-4 border-b">
          <CardTitle className="text-lg font-semibold">
            Defined Line Groups
            {isLoading && <span className="ml-2 text-sm font-normal text-muted-foreground">(Loading...)</span>}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-6 py-3">Group Name</TableHead>
                  <TableHead className="px-6 py-3">Assigned Lines ({filteredGroups.reduce((sum, g) => sum + g.lineIds.length, 0)})</TableHead>
                  <TableHead className="px-6 py-3">Description</TableHead>
                  <TableHead className="px-6 py-3 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center px-6 py-4">
                      Loading line groups...
                    </TableCell>
                  </TableRow>
                ) : filteredGroups.length > 0 ? (
                  filteredGroups.map(group => (
                    <TableRow key={group.id} className="odd:bg-muted/50">
                      <TableCell className="px-6 py-4 font-medium">{group.groupName}</TableCell>
                      <TableCell className="px-6 py-4 text-xs">
                        {group.lineIds.map(id => getLineNameById(id)).join(', ') || 'No lines assigned'}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-xs text-muted-foreground">
                        {group.description || '-'}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right">
                         <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isLoading}>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="shadow-lg rounded-md">
                             <DropdownMenuItem onClick={() => handleViewDetails(group)} className="cursor-pointer">
                              <Eye className="mr-2 h-4 w-4" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator/>
                            <DropdownMenuItem onClick={() => handleEdit(group)} className="cursor-pointer">
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(group.id!)} className="text-destructive focus:text-destructive cursor-pointer">
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center px-6 py-4">
                      {filterText ? 'No groups match your filter.' : 'No line groups found. Click "Add New Line Group" to get started.'}
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
          if (!open) setEditingGroup(null);
      }}>
        <DialogContent className="sm:max-w-lg p-6 rounded-lg shadow-xl max-h-[70vh] overflow-y-auto">
          <DialogHeader className="mb-4">
            <DialogTitle className="flex items-center text-xl font-semibold">
                <Users className="mr-2 h-5 w-5 text-primary" />
                {editingGroup ? 'Edit Line Group' : 'Add New Line Group'}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Define a group name and assign production lines to it. A line can only belong to one group.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pr-2">
              <FormField
                control={form.control}
                name="groupName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">Group Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Dongguan Factory Lines" {...field} className="h-10" disabled={isLoading}/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">Description</FormLabel>
                    <FormControl>
                      <Input placeholder="Optional description..." {...field} className="h-10" disabled={isLoading}/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lineIds"
                render={() => (
                  <FormItem>
                    <FormLabel className="font-medium">Assign Lines *</FormLabel>
                    <CardDescription className="text-xs">Select lines to include in this group. A line can only belong to one group.</CardDescription>
                    <ScrollArea className="h-48 rounded-md border p-3 mt-1">
                      <div className="space-y-2">
                        {linesLoading ? (
                          <p className="text-sm text-muted-foreground p-2">Loading lines...</p>
                        ) : lines.length > 0 ? (
                          lines.map((line) => {
                            const isAssignedToAnotherGroup = lineGroups.some(g => 
                              (!editingGroup || g.id !== editingGroup.id) && g.lineIds.includes(line.id)
                            );
                            return (
                              <FormField
                                key={line.id}
                                control={form.control}
                                name="lineIds"
                                render={({ field }) => {
                                  return (
                                    <FormItem
                                      className="flex flex-row items-center space-x-3 space-y-0 p-2 rounded-md hover:bg-muted/50 data-[disabled]:opacity-50"
                                      data-disabled={isAssignedToAnotherGroup}
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(line.id)}
                                          onCheckedChange={(checked) => {
                                            if (isAssignedToAnotherGroup && checked) {
                                              toast({
                                                title: "Line Already Assigned",
                                                description: `${line.lineName} is already in another group. Remove it first to assign here.`,
                                                variant: "destructive"
                                              });
                                              return;
                                            }
                                            return checked
                                              ? field.onChange([...(field.value || []), line.id])
                                              : field.onChange(
                                                  (field.value || []).filter(
                                                    (value) => value !== line.id
                                                  )
                                                );
                                          }}
                                          disabled={isLoading || (isAssignedToAnotherGroup && !(field.value?.includes(line.id)))}
                                        />
                                      </FormControl>
                                      <FormLabel className="font-normal text-sm cursor-pointer flex-1">
                                        {line.lineName} ({line.lineCode})
                                        {isAssignedToAnotherGroup && <span className="text-xs text-destructive ml-2">(In another group)</span>}
                                      </FormLabel>
                                    </FormItem>
                                  );
                                }}
                              />
                            );
                          })
                        ) : (
                          <p className="text-sm text-muted-foreground p-2">No lines available in master data.</p>
                        )}
                      </div>
                    </ScrollArea>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="pt-6 flex flex-col sm:flex-row sm:justify-end gap-2">
                <DialogClose asChild>
                    <Button type="button" variant="outline" className="w-full sm:w-auto" disabled={isLoading}>Cancel</Button>
                </DialogClose>
                <Button type="submit" className="w-full sm:w-auto" disabled={isLoading}>
                    <Save className="mr-2 h-4 w-4" />
                    {isLoading ? 'Saving...' : editingGroup ? 'Update Group' : 'Save Group'}
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
          itemName={selectedItemForLog.groupName}
          itemType="Line Group"
        />
      )}
    </MasterPageTemplate>
  );
}
