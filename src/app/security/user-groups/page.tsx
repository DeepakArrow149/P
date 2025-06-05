
'use client';

import * as React from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { ShieldCheck, Edit, Trash2, PlusCircle, Save, Users, CheckSquare, UserPlus, UserMinus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';

const groupFormSchema = z.object({
  id: z.string().optional(),
  groupName: z.string().min(1, 'Group Name is required').max(50, 'Max 50 chars'),
});
type GroupFormValues = z.infer<typeof groupFormSchema>;

interface SecurityGroup {
  id: string;
  groupName: string;
  userIds: string[];
}

// Mock users for assignment
const mockUsers = [
  { id: 'user_john', name: 'John Doe' },
  { id: 'user_jane', name: 'Jane Smith' },
  { id: 'user_alex', name: 'Alex Lee' },
];

const defaultGroupValues: GroupFormValues = { groupName: '' };

export default function UserSecurityGroupsPage() {
  const { toast } = useToast();
  const [groups, setGroups] = React.useState<SecurityGroup[]>([]);
  const [isGroupFormOpen, setIsGroupFormOpen] = React.useState(false);
  const [editingGroup, setEditingGroup] = React.useState<SecurityGroup | null>(null);
  const [selectedGroupForUserManagement, setSelectedGroupForUserManagement] = React.useState<SecurityGroup | null>(null);
  const [isUserManagementDialogOpen, setIsUserManagementDialogOpen] = React.useState(false);
  const [usersToAssign, setUsersToAssign] = React.useState<string[]>([]);

  const groupForm = useForm<GroupFormValues>({
    resolver: zodResolver(groupFormSchema),
    defaultValues: defaultGroupValues,
  });

  React.useEffect(() => {
    if (editingGroup) {
      groupForm.reset(editingGroup);
    } else {
      groupForm.reset(defaultGroupValues);
    }
  }, [editingGroup, groupForm, isGroupFormOpen]);
  
  React.useEffect(() => {
    if (selectedGroupForUserManagement) {
      setUsersToAssign([...selectedGroupForUserManagement.userIds]);
    } else {
      setUsersToAssign([]);
    }
  }, [selectedGroupForUserManagement]);

  const onGroupSubmit = (data: GroupFormValues) => {
    if (editingGroup) {
      setGroups(prev => prev.map(g => g.id === editingGroup.id ? { ...g, groupName: data.groupName } : g));
      toast({ title: 'Group Updated' });
    } else {
      const newGroup: SecurityGroup = { id: `group-${Date.now()}`, groupName: data.groupName, userIds: [] };
      setGroups(prev => [newGroup, ...prev]);
      toast({ title: 'Group Added' });
    }
    setIsGroupFormOpen(false);
    setEditingGroup(null);
  };

  const handleManageUsers = (group: SecurityGroup) => {
    setSelectedGroupForUserManagement(group);
    setIsUserManagementDialogOpen(true);
  };

  const handleUserAssignmentChange = (userId: string, isAssigned: boolean) => {
    setUsersToAssign(prev => {
      if (isAssigned) {
        return [...prev, userId];
      } else {
        return prev.filter(id => id !== userId);
      }
    });
  };

  const handleSaveUserAssignments = () => {
    if (selectedGroupForUserManagement) {
      setGroups(prev => prev.map(g => g.id === selectedGroupForUserManagement.id ? { ...g, userIds: usersToAssign } : g));
      toast({ title: 'User Assignments Updated' });
      setIsUserManagementDialogOpen(false);
      setSelectedGroupForUserManagement(null);
    }
  };
  
  const getUserName = (userId: string) => mockUsers.find(u => u.id === userId)?.name || userId;

  return (
    <>
      <PageHeader title="User Security Groups" description="Define security groups and manage user assignments." />
      <div className="mb-4 flex justify-end">
        <Button onClick={() => { setEditingGroup(null); setIsGroupFormOpen(true); }}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Group
        </Button>
      </div>
      <Card>
        <CardHeader><CardTitle>Defined Security Groups</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Group Name</TableHead><TableHead>Members Count</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {groups.length > 0 ? groups.map(group => (
                <TableRow key={group.id}>
                  <TableCell className="font-medium">{group.groupName}</TableCell>
                  <TableCell>{group.userIds.length}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => handleManageUsers(group)} className="mr-2"><Users className="mr-1 h-3 w-3"/> Manage Users</Button>
                    <Button variant="ghost" size="icon_sm" onClick={() => { setEditingGroup(group); setIsGroupFormOpen(true);}} className="mr-1"><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon_sm" onClick={() => setGroups(prev => prev.filter(g => g.id !== group.id))} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              )) : <TableRow><TableCell colSpan={3} className="h-24 text-center">No groups defined.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isGroupFormOpen} onOpenChange={setIsGroupFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editingGroup ? 'Edit' : 'Add New'} Security Group</DialogTitle></DialogHeader>
          <Form {...groupForm}>
            <form onSubmit={groupForm.handleSubmit(onGroupSubmit)} className="space-y-4">
              <FormField control={groupForm.control} name="groupName" render={({ field }) => (<FormItem><FormLabel>Group Name *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                <Button type="submit"><Save className="mr-2 h-4 w-4"/>{editingGroup ? 'Update' : 'Save'}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isUserManagementDialogOpen} onOpenChange={setIsUserManagementDialogOpen}>
        <DialogContent className="sm:max-w-lg">
            <DialogHeader>
                <DialogTitle>Manage Users for: {selectedGroupForUserManagement?.groupName}</DialogTitle>
                <DialogDescription>Select users to assign to this group.</DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] my-4 pr-4">
                <div className="space-y-2">
                    {mockUsers.map(user => (
                        <div key={user.id} className="flex items-center space-x-2 p-2 border rounded-md">
                            <Checkbox
                                id={`user-assign-${user.id}`}
                                checked={usersToAssign.includes(user.id)}
                                onCheckedChange={(checked) => handleUserAssignmentChange(user.id, !!checked)}
                            />
                            <label htmlFor={`user-assign-${user.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                {user.name}
                            </label>
                        </div>
                    ))}
                </div>
            </ScrollArea>
            <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                <Button onClick={handleSaveUserAssignments}><Save className="mr-2 h-4 w-4"/>Save Assignments</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
