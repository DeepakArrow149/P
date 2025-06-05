
'use client';

import * as React from 'react';
import { PageHeader } from '@/components/page-header';
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { Users as UsersIcon, Edit, Trash2, PlusCircle, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';

const userFormSchema = z.object({
  id: z.string().optional(),
  userName: z.string().min(1, 'User Name is required').max(50, 'Max 50 chars'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(50, 'Max 50 chars').optional(),
  confirmPassword: z.string().optional(),
  proxy: z.string().max(50, 'Max 50 chars').optional().default(''),
  manager: z.string().max(50, 'Max 50 chars').optional().default(''),
  department: z.string().max(50, 'Max 50 chars').optional().default(''),
  emailAddress: z.string().email({ message: "Invalid email address" }).max(100, 'Max 100 chars').optional().default(''),
  assignedGroupIds: z.array(z.string()).optional().default([]),
}).refine(data => {
  // If password is provided, confirmPassword must match
  if (data.password && data.password.length > 0) {
    return data.password === data.confirmPassword;
  }
  return true; // No password provided, so no need to confirm
}, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
}).refine(data => {
  // If creating a new user (no id), password is required
  if (!data.id && (!data.password || data.password.length === 0)) {
    return false;
  }
  return true;
}, {
  message: "Password is required for new users",
  path: ['password'],
});


type UserFormValues = z.infer<typeof userFormSchema>;

interface UserData extends Omit<UserFormValues, 'password' | 'confirmPassword'> {
  id: string;
}

// Mock security groups for assignment
const mockSecurityGroups = [
  { id: 'group_admin', name: 'Administrators' },
  { id: 'group_merch', name: 'Merchandisers' },
  { id: 'group_plan', name: 'Planning Team' },
  { id: 'group_source', name: 'Sourcing Team' },
];

const defaultUserValues: UserFormValues = {
  userName: '',
  password: '', // Initialize with empty string
  confirmPassword: '', // Initialize with empty string
  proxy: '',
  manager: '',
  department: '',
  emailAddress: '',
  assignedGroupIds: [],
};

export default function UsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = React.useState<UserData[]>([]);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<UserData | null>(null);

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: defaultUserValues,
  });

  React.useEffect(() => {
    if (editingUser) {
      form.reset({
        ...editingUser,
        password: '', // Clear password fields for edit
        confirmPassword: '',
        assignedGroupIds: editingUser.assignedGroupIds || [],
      });
    } else {
      form.reset(defaultUserValues);
    }
  }, [editingUser, form, isFormOpen]);

  const onSubmit = (data: UserFormValues) => {
    if (editingUser) {
      // For edit, don't include password fields if they are empty (means user doesn't want to change it)
      const updateData: Partial<UserData> = { ...data };
      if (!data.password) {
        delete updateData.password;
        delete updateData.confirmPassword;
      }
      setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...editingUser, ...updateData } as UserData : u));
      toast({ title: 'User Updated', description: `User "${data.userName}" updated.` });
    } else {
      const newUser: UserData = { 
        id: `user-${Date.now()}`, 
        userName: data.userName,
        proxy: data.proxy,
        manager: data.manager,
        department: data.department,
        emailAddress: data.emailAddress,
        assignedGroupIds: data.assignedGroupIds,
      };
      setUsers(prev => [newUser, ...prev]);
      toast({ title: 'User Added', description: `User "${data.userName}" added.` });
    }
    setIsFormOpen(false);
    setEditingUser(null);
    form.reset(defaultUserValues);
  };

  const handleAddNew = () => {
    setEditingUser(null);
    form.reset(defaultUserValues);
    setIsFormOpen(true);
  };

  const handleEdit = (user: UserData) => {
    setEditingUser(user);
    setIsFormOpen(true);
  };

  const handleDelete = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
    toast({ title: 'User Deleted', variant: 'destructive' });
  };
  
  const getGroupNames = (groupIds: string[] | undefined) => {
    if (!groupIds || groupIds.length === 0) return 'N/A';
    return groupIds.map(id => mockSecurityGroups.find(g => g.id === id)?.name || id).join(', ');
  };


  return (
    <>
      <PageHeader title="User Management" description="Add, edit, and manage application users and their basic details." />
      <div className="mb-4 flex justify-end">
        <Button onClick={handleAddNew}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New User
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Registered Users</CardTitle>
          <CardDescription>List of all users in the system.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Security Groups</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length > 0 ? users.map(user => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.userName}</TableCell>
                  <TableCell>{user.department || '-'}</TableCell>
                  <TableCell>{user.emailAddress || '-'}</TableCell>
                  <TableCell className="text-xs">{getGroupNames(user.assignedGroupIds)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon_sm" onClick={() => handleEdit(user)} className="mr-1"><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon_sm" onClick={() => handleDelete(user.id)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={5} className="text-center h-24">No users found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={(open) => { setIsFormOpen(open); if(!open) setEditingUser(null); }}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center"><UsersIcon className="mr-2 h-5 w-5 text-primary"/>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
            <DialogDescription>Fill in the user details below.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[calc(80vh-150px)] pr-6"> {/* Adjusted max-h for dialog content scroll */}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="userName" render={({ field }) => (<FormItem><FormLabel>User Name *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="emailAddress" render={({ field }) => (<FormItem><FormLabel>Email Address</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="password" render={({ field }) => (<FormItem><FormLabel>{editingUser ? 'New Password (leave blank to keep current)' : 'Password *'}</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="confirmPassword" render={({ field }) => (<FormItem><FormLabel>{editingUser ? 'Confirm New Password' : 'Confirm Password *'}</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="proxy" render={({ field }) => (<FormItem><FormLabel>Proxy User</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="manager" render={({ field }) => (<FormItem><FormLabel>Manager</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="department" render={({ field }) => (<FormItem><FormLabel>Department</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <FormField
                  control={form.control}
                  name="assignedGroupIds"
                  render={() => ( // No 'field' needed here if managing checkboxes manually or through separate state
                    <FormItem>
                      <FormLabel className="font-medium">Assign to Security Groups</FormLabel>
                      <div className="grid grid-cols-2 gap-2 p-3 border rounded-md max-h-40 overflow-y-auto">
                          {mockSecurityGroups.map((group) => (
                            <FormField
                              key={group.id}
                              control={form.control}
                              name="assignedGroupIds"
                              render={({ field: checkboxField }) => ( // Use 'checkboxField' to avoid conflict with outer 'field'
                                <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={checkboxField.value?.includes(group.id)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? checkboxField.onChange([...(checkboxField.value || []), group.id])
                                          : checkboxField.onChange((checkboxField.value || []).filter(value => value !== group.id));
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal text-sm">{group.name}</FormLabel>
                                </FormItem>
                              )}
                            />
                          ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter className="pt-4 sticky bottom-0 bg-background pb-0 -mb-2 z-10"> {/* Make footer sticky within scrollable dialog */}
                  <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                  <Button type="submit"><Save className="mr-2 h-4 w-4" />{editingUser ? 'Update User' : 'Save User'}</Button>
                </DialogFooter>
              </form>
            </Form>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}

