
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
import { Users, Edit, Trash2, PlusCircle, Filter as FilterIcon, MoreVertical, Save, Eye, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { MasterDataLogDialog } from '@/components/masters/MasterDataLogDialog';
import { useBuyerApi } from '@/hooks/useBuyerApi';
import type { BuyerData } from '@/lib/buyerRepository';

const buyerFormSchema = z.object({
  id: z.string().optional(),
  buyerCode: z.string().min(1, 'Buyer Code is required').max(20, 'Code must be 20 chars or less'),
  buyerName: z.string().min(1, 'Buyer Name is required').max(100, 'Name must be 100 chars or less'),
  contactPerson: z.string().max(50, 'Contact must be 50 chars or less').optional().default(''),
  email: z.string().email('Invalid email address').max(100, 'Email must be 100 chars or less').optional().default(''),
  phone: z.string().max(20, 'Phone must be 20 chars or less').optional().default(''),
  address: z.string().max(250, 'Address must be 250 chars or less').optional().default(''),
  country: z.string().max(50, 'Country must be 50 chars or less').optional().default(''),
});

type BuyerFormValues = z.infer<typeof buyerFormSchema>;

const defaultValues: BuyerFormValues = {
  buyerCode: '',
  buyerName: '',
  contactPerson: '',
  email: '',
  phone: '',
  address: '',
  country: '',
};

export default function BuyerMasterPage() {
  const { toast } = useToast();
  const { 
    loading, 
    error: apiError, 
    fetchBuyers, 
    createBuyer, 
    updateBuyer, 
    deleteBuyer 
  } = useBuyerApi();

  const [buyers, setBuyers] = React.useState<BuyerData[]>([]);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingBuyer, setEditingBuyer] = React.useState<BuyerData | null>(null);
  const [filterText, setFilterText] = React.useState('');
  const [isLogDialogOpen, setIsLogDialogOpen] = React.useState(false);
  const [selectedItemForLog, setSelectedItemForLog] = React.useState<BuyerData | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<BuyerFormValues>({
    resolver: zodResolver(buyerFormSchema),
    defaultValues,
  });

  // Load buyers on component mount
  React.useEffect(() => {
    const loadBuyers = async () => {
      try {
        const data = await fetchBuyers();
        setBuyers(data);
      } catch (error) {
        toast({ 
          title: 'Error Loading Buyers', 
          description: 'Failed to load buyer data. Please try again.',
          variant: 'destructive' 
        });
      }
    };
    loadBuyers();
  }, [fetchBuyers, toast]);

  React.useEffect(() => {
    if (editingBuyer) {
      form.reset(editingBuyer);
    } else {
      form.reset(defaultValues);
    }
  }, [editingBuyer, form, isFormOpen]);

  const onSubmit = async (data: BuyerFormValues) => {
    setIsSubmitting(true);
    try {
      if (editingBuyer) {
        const updatedBuyer = await updateBuyer(editingBuyer.id, data);
        setBuyers(prevBuyers =>
          prevBuyers.map(b => (b.id === editingBuyer.id ? updatedBuyer : b))
        );
        toast({ title: 'Buyer Updated', description: `Buyer "${data.buyerName}" has been updated.` });
      } else {
        const newBuyer = await createBuyer(data);
        setBuyers(prevBuyers => [newBuyer, ...prevBuyers]);
        toast({ title: 'Buyer Added', description: `Buyer "${data.buyerName}" has been added.` });
      }
      setIsFormOpen(false);
      setEditingBuyer(null);
    } catch (error: any) {
      toast({ 
        title: editingBuyer ? 'Update Failed' : 'Creation Failed', 
        description: error.message || 'An error occurred. Please try again.',
        variant: 'destructive' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddNew = () => {
    setEditingBuyer(null);
    form.reset(defaultValues);
    setIsFormOpen(true);
  };

  const handleEdit = (buyer: BuyerData) => {
    setEditingBuyer(buyer);
    setIsFormOpen(true);
  };

  const handleDelete = async (buyerId: string) => {
    try {
      await deleteBuyer(buyerId);
      setBuyers(prevBuyers => prevBuyers.filter(b => b.id !== buyerId));
      toast({ title: 'Buyer Deleted', description: 'The buyer has been deleted.', variant: 'destructive' });
    } catch (error: any) {
      toast({ 
        title: 'Delete Failed', 
        description: error.message || 'Failed to delete buyer. Please try again.',
        variant: 'destructive' 
      });
    }
  };
  
  const handleViewDetails = (buyer: BuyerData) => {
    setSelectedItemForLog(buyer);
    setIsLogDialogOpen(true);
  };

  const filteredBuyers = buyers.filter(buyer =>
    buyer.buyerName.toLowerCase().includes(filterText.toLowerCase()) ||
    buyer.buyerCode.toLowerCase().includes(filterText.toLowerCase()) ||
    (buyer.contactPerson && buyer.contactPerson.toLowerCase().includes(filterText.toLowerCase())) ||
    (buyer.country && buyer.country.toLowerCase().includes(filterText.toLowerCase()))
  );

  return (
    <MasterPageTemplate
      title="Buyers"
      description="Manage buyer information and profiles."
    >
      <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <Button onClick={handleAddNew} className="w-full sm:w-auto">
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Buyer
        </Button>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Input
            placeholder="Filter by name, code, contact..."
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
          <CardTitle className="text-lg font-semibold">Buyer Records</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">List of all registered buyers.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-4 py-3">Buyer Code</TableHead>
                  <TableHead className="px-4 py-3">Buyer Name</TableHead>
                  <TableHead className="px-4 py-3">Contact Person</TableHead>
                  <TableHead className="px-4 py-3">Email</TableHead>
                  <TableHead className="px-4 py-3">Country</TableHead>
                  <TableHead className="px-4 py-3 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center px-4 py-3">
                      <div className="flex items-center justify-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading buyers...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : apiError ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center px-4 py-3 text-destructive">
                      Error loading buyers: {apiError}
                    </TableCell>
                  </TableRow>
                ) : filteredBuyers.length > 0 ? (
                  filteredBuyers.map(buyer => (
                    <TableRow key={buyer.id} className="odd:bg-muted/50">
                      <TableCell className="px-4 py-3 font-medium">{buyer.buyerCode}</TableCell>
                      <TableCell className="px-4 py-3">{buyer.buyerName}</TableCell>
                      <TableCell className="px-4 py-3">{buyer.contactPerson || '-'}</TableCell>
                      <TableCell className="px-4 py-3">{buyer.email || '-'}</TableCell>
                      <TableCell className="px-4 py-3">{buyer.country || '-'}</TableCell>
                      <TableCell className="px-4 py-3 text-right">
                         <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="shadow-lg rounded-md">
                            <DropdownMenuItem onClick={() => handleViewDetails(buyer)} className="cursor-pointer">
                              <Eye className="mr-2 h-4 w-4" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator/>
                            <DropdownMenuItem onClick={() => handleEdit(buyer)} className="cursor-pointer">
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(buyer.id)} className="text-destructive focus:text-destructive cursor-pointer">
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center px-4 py-3">
                      {filterText ? 'No buyers match your filter.' : 'No buyers found. Click "Add New Buyer" to get started.'}
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
          if (!open) setEditingBuyer(null);
      }}>
        <DialogContent className="sm:max-w-2xl p-6 rounded-lg shadow-xl max-h-[70vh] overflow-y-auto">
          <DialogHeader className="mb-4">
            <DialogTitle className="flex items-center text-xl font-semibold">
                <Users className="mr-2 h-5 w-5 text-primary" />
                {editingBuyer ? 'Edit Buyer' : 'Add New Buyer'}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {editingBuyer ? 'Update the details of this buyer.' : 'Enter the details for the new buyer.'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pr-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <FormField
                    control={form.control}
                    name="buyerCode"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel className="font-medium">Buyer Code *</FormLabel>
                        <FormControl>
                        <Input placeholder="e.g., BUYER-XYZ" {...field} className="h-10"/>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="buyerName"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel className="font-medium">Buyer Name *</FormLabel>
                        <FormControl>
                        <Input placeholder="e.g., Acme Apparel Co." {...field} className="h-10"/>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <FormField
                    control={form.control}
                    name="contactPerson"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel className="font-medium">Contact Person</FormLabel>
                        <FormControl>
                        <Input placeholder="e.g., Jane Doe" {...field} className="h-10"/>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel className="font-medium">Email</FormLabel>
                        <FormControl>
                        <Input type="email" placeholder="e.g., contact@example.com" {...field} className="h-10"/>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel className="font-medium">Phone</FormLabel>
                        <FormControl>
                        <Input placeholder="e.g., +1-555-123-4567" {...field} className="h-10"/>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel className="font-medium">Country</FormLabel>
                        <FormControl>
                        <Input placeholder="e.g., USA" {...field} className="h-10"/>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
              </div>
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">Address</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g., 123 Main St, Anytown, CA 90210" {...field} rows={3} className="min-h-[80px]"/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="pt-6 flex flex-col sm:flex-row sm:justify-end gap-2">
                <DialogClose asChild>
                    <Button type="button" variant="outline" className="w-full sm:w-auto">Cancel</Button>
                </DialogClose>
                <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    {isSubmitting ? 'Saving...' : (editingBuyer ? 'Update Buyer' : 'Save Buyer')}
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
          itemName={selectedItemForLog.buyerName}
          itemType="Buyer"
        />
      )}
    </MasterPageTemplate>
  );
}
