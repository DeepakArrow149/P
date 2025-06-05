
// src/app/masters/product-list/page.tsx
'use client';

import * as React from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, PlusCircle, Edit, Trash2, MoreVertical } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { MasterDataLogDialog } from '@/components/masters/MasterDataLogDialog';

interface ProductListData {
  id: string;
  productCode: string;
  description: string;
  productType: string;
  sizesRequired: string[];
  // Add other relevant fields you might want to display
}

const initialMockProducts: ProductListData[] = [
  { id: 'PROD-001', productCode: 'TSHIRT-NAVY-M', description: 'Men\'s Navy Crew Neck T-Shirt', productType: 'Apparel', sizesRequired: ['S', 'M', 'L', 'XL'] },
  { id: 'PROD-002', productCode: 'JKT-WX-W-BLK', description: 'Women\'s Waxed Cotton Jacket - Black', productType: 'Outerwear', sizesRequired: ['M', 'L'] },
  { id: 'PROD-003', productCode: 'POLO-PIQUE-RED', description: 'Men\'s Pique Polo Shirt - Red', productType: 'Apparel', sizesRequired: ['L', 'XL', 'XXL'] },
  { id: 'PROD-004', productCode: 'JEANS-SLIM-BLUE', description: 'Slim Fit Blue Jeans', productType: 'Apparel', sizesRequired: ['30W', '32W', '34W'] },
];

export default function ProductListPage() {
  const [products, setProducts] = React.useState<ProductListData[]>(initialMockProducts);
  const { toast } = useToast();
  const [isLogDialogOpen, setIsLogDialogOpen] = React.useState(false);
  const [selectedItemForLog, setSelectedItemForLog] = React.useState<ProductListData | null>(null);

  const handleDeleteProduct = (productId: string) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
    toast({ title: "Product Deleted (Mock)", description: `Product ${productId} removed from this list.`, variant: "destructive" });
  };

  const handleViewDetails = (product: ProductListData) => {
    setSelectedItemForLog(product);
    setIsLogDialogOpen(true);
  };

  return (
    <>
      <PageHeader
        title="Product List"
        description="View and manage all existing products."
        actions={
          <Link href="/masters/product">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Create New Product
            </Button>
          </Link>
        }
      />
      <Card className="shadow-lg rounded-lg">
        <CardHeader className="px-6 py-4 border-b">
          <CardTitle className="text-lg font-semibold">Registered Products</CardTitle>
          <CardDescription>A list of all products defined in the system.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-4 py-3">Product Code</TableHead>
                  <TableHead className="px-4 py-3">Description</TableHead>
                  <TableHead className="px-4 py-3">Product Type</TableHead>
                  <TableHead className="px-4 py-3">Sizes</TableHead>
                  <TableHead className="px-4 py-3 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.length > 0 ? (
                  products.map((product) => (
                    <TableRow key={product.id} className="odd:bg-muted/50">
                      <TableCell className="px-4 py-3 font-medium">{product.productCode}</TableCell>
                      <TableCell className="px-4 py-3">{product.description}</TableCell>
                      <TableCell className="px-4 py-3">{product.productType}</TableCell>
                      <TableCell className="px-4 py-3 text-xs">{product.sizesRequired.join(', ')}</TableCell>
                      <TableCell className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetails(product)} className="cursor-pointer">
                              <Eye className="mr-2 h-4 w-4" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <Link href={`/masters/product?edit=${product.id}`} passHref>
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" /> Edit
                              </DropdownMenuItem>
                            </Link>
                            <DropdownMenuItem onClick={() => handleDeleteProduct(product.id)} className="text-destructive focus:text-destructive cursor-pointer">
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      No products found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      {selectedItemForLog && (
        <MasterDataLogDialog
          isOpen={isLogDialogOpen}
          onOpenChange={setIsLogDialogOpen}
          itemName={selectedItemForLog.productCode}
          itemType="Product"
        />
      )}
    </>
  );
}
