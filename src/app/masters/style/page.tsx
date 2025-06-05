
// src/app/masters/style/page.tsx
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
import { Palette, Edit, Trash2, PlusCircle, Filter as FilterIcon, MoreVertical, Save, Eye } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { MasterDataLogDialog } from '@/components/masters/MasterDataLogDialog';

const styleFormSchema = z.object({
  id: z.string().optional(),
  styleCode: z.string().min(1, 'Style Code is required').max(30, 'Style Code must be 30 characters or less'),
  styleName: z.string().min(1, 'Style Name is required').max(100, 'Style Name must be 100 characters or less'),
  description: z.string().max(250, 'Description must be 250 characters or less').optional(),
  productCategory: z.enum(['Tops', 'Bottoms', 'Dresses', 'Outerwear', 'Accessories', 'Other'], {
    required_error: 'Product Category is required',
  }),
  smv: z.coerce.number().min(0, 'SMV must be a non-negative number').optional(),
});

type StyleFormValues = z.infer<typeof styleFormSchema>;

interface StyleData extends StyleFormValues {
  id: string;
}

const defaultValues: Omit<StyleFormValues, 'id'> = {
  styleCode: '',
  styleName: '',
  description: '',
  productCategory: 'Other' as const,
  smv: undefined,
};

const initialMockStyles: StyleData[] = [
  { id: 'STYLE-001', styleCode: 'TSHIRT-BASIC-M', styleName: 'Men\'s Basic Crew Neck T-Shirt', productCategory: 'Tops', smv: 8.5, description: 'Standard cotton crew neck t-shirt for men.' },
  { id: 'STYLE-002', styleCode: 'JKT-WX-W', styleName: 'Women\'s Waxed Cotton Jacket', productCategory: 'Outerwear', smv: 42.0, description: 'Durable waxed cotton jacket with multiple pockets.' },
  { id: 'STYLE-003', styleCode: 'POLO-PIQUE-M', styleName: 'Men\'s Pique Polo Shirt', productCategory: 'Tops', smv: 15.2, description: 'Classic pique polo with ribbed collar and cuffs.' },
  { id: 'STYLE-004', styleCode: 'DRESS-MAXI-W', styleName: 'Women\'s Floral Maxi Dress', productCategory: 'Dresses', smv: 28.75, description: 'Long flowing maxi dress with floral print.' },
  { id: 'STYLE-005', styleCode: 'CAP-BB-U', styleName: 'Unisex Baseball Cap', productCategory: 'Accessories', smv: 5.0, description: 'Standard adjustable baseball cap.' },
];

export default function StyleMasterPage() {
  const { toast } = useToast();
  const [styles, setStyles] = React.useState<StyleData[]>(initialMockStyles);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingStyle, setEditingStyle] = React.useState<StyleData | null>(null);
  const [filterText, setFilterText] = React.useState('');

  const [isLogDialogOpen, setIsLogDialogOpen] = React.useState(false);
  const [selectedItemForLog, setSelectedItemForLog] = React.useState<StyleData | null>(null);

  const form = useForm<StyleFormValues>({
    resolver: zodResolver(styleFormSchema),
    defaultValues,
  });

  React.useEffect(() => {
    if (editingStyle) {
      form.reset(editingStyle);
    } else {
      form.reset(defaultValues);
    }
  }, [editingStyle, form, isFormOpen]);

  const onSubmit = (data: StyleFormValues) => {
    if (editingStyle) {
      setStyles(prevStyles =>
        prevStyles.map(s => (s.id === editingStyle.id ? { ...editingStyle, ...data } : s))
      );
      toast({ title: 'Style Updated', description: `Style "${data.styleName}" has been updated.` });
    } else {
      const newId = `STYLE-${Date.now()}`;
      const newStyle: StyleData = { ...data, id: newId };
      setStyles(prevStyles => [newStyle, ...prevStyles]);
      toast({ title: 'Style Added', description: `Style "${data.styleName}" has been added.` });
    }
    setIsFormOpen(false);
    setEditingStyle(null);
  };

  const handleAddNew = () => {
    setEditingStyle(null);
    form.reset(defaultValues);
    setIsFormOpen(true);
  };

  const handleEdit = (style: StyleData) => {
    setEditingStyle(style);
    setIsFormOpen(true);
  };

  const handleDelete = (styleId: string) => {
    setStyles(prevStyles => prevStyles.filter(s => s.id !== styleId));
    toast({ title: 'Style Deleted', description: 'The style has been deleted.', variant: 'destructive' });
  };

  const handleViewDetails = (style: StyleData) => {
    setSelectedItemForLog(style);
    setIsLogDialogOpen(true);
  };

  const filteredStyles = styles.filter(style =>
    style.styleName.toLowerCase().includes(filterText.toLowerCase()) ||
    style.styleCode.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <MasterPageTemplate
      title="Styles"
      description="Manage product styles and variations."
    >
      <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <Button onClick={handleAddNew} className="w-full sm:w-auto">
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Style
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
          <CardTitle>Defined Styles</CardTitle>
          <CardDescription>List of all product styles and their details.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-4 py-3">Style Code</TableHead>
                  <TableHead className="px-4 py-3">Style Name</TableHead>
                  <TableHead className="px-4 py-3">Category</TableHead>
                  <TableHead className="px-4 py-3 text-right">SMV</TableHead>
                  <TableHead className="px-4 py-3">Description</TableHead>
                  <TableHead className="px-4 py-3 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStyles.length > 0 ? (
                  filteredStyles.map(style => (
                    <TableRow key={style.id} className="odd:bg-muted/50">
                      <TableCell className="px-4 py-3 font-medium">{style.styleCode}</TableCell>
                      <TableCell className="px-4 py-3">{style.styleName}</TableCell>
                      <TableCell className="px-4 py-3">{style.productCategory}</TableCell>
                      <TableCell className="px-4 py-3 text-right">{style.smv?.toFixed(2) || '-'}</TableCell>
                      <TableCell className="px-4 py-3 max-w-xs truncate">{style.description || '-'}</TableCell>
                      <TableCell className="px-4 py-3 text-right">
                         <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="shadow-lg rounded-md">
                            <DropdownMenuItem onClick={() => handleViewDetails(style)} className="cursor-pointer">
                              <Eye className="mr-2 h-4 w-4" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator/>
                            <DropdownMenuItem onClick={() => handleEdit(style)} className="cursor-pointer">
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(style.id)} className="text-destructive focus:text-destructive cursor-pointer">
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
                      {filterText ? 'No styles match your filter.' : 'No styles found. Click "Add New Style" to get started.'}
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
          if (!open) setEditingStyle(null);
      }}>
        <DialogContent className="sm:max-w-[600px] p-6 rounded-lg shadow-xl max-h-[70vh] overflow-y-auto">
          <DialogHeader className="mb-4">
            <DialogTitle className="flex items-center text-xl font-semibold">
                <Palette className="mr-2 h-5 w-5 text-primary" />
                {editingStyle ? 'Edit Style' : 'Add New Style'}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {editingStyle ? 'Update the details of this product style.' : 'Enter the details for the new product style.'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pr-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <FormField
                    control={form.control}
                    name="styleCode"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel className="font-medium">Style Code *</FormLabel>
                        <FormControl>
                        <Input placeholder="e.g., TSHIRT-NAVY-M" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="styleName"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel className="font-medium">Style Name *</FormLabel>
                        <FormControl>
                        <Input placeholder="e.g., Men's Navy Crew Neck T-Shirt" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
              </div>
              <FormField
                control={form.control}
                name="productCategory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">Product Category *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select product category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Tops">Tops</SelectItem>
                        <SelectItem value="Bottoms">Bottoms</SelectItem>
                        <SelectItem value="Dresses">Dresses</SelectItem>
                        <SelectItem value="Outerwear">Outerwear</SelectItem>
                        <SelectItem value="Accessories">Accessories</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                    control={form.control}
                    name="smv"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel className="font-medium">Standard Minute Value (SMV)</FormLabel>
                        <FormControl>
                        <Input type="number" step="0.01" placeholder="e.g., 15.75" {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : +e.target.value)} value={field.value ?? ''} />
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
                      <Textarea placeholder="Brief description of the style, materials, key features..." {...field} rows={3} className="min-h-[80px]" />
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
                    {editingStyle ? 'Update Style' : 'Save Style'}
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
          itemName={selectedItemForLog.styleName}
          itemType="Style"
        />
      )}
    </MasterPageTemplate>
  );
}
