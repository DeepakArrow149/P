import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Boxes } from 'lucide-react';

export default function MaterialsPage() {
  return (
    <>
      <PageHeader
        title="Materials Management"
        description="Track inventory, procurement, and allocation of materials."
      />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Inventory & Procurement</CardTitle>
          <CardDescription>
            This module will provide tools for managing material inventory, purchase orders, and supplier relations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed border-border rounded-md">
            <Boxes className="h-20 w-20 text-muted-foreground mb-6" />
            <p className="text-xl font-semibold text-muted-foreground">Materials Module Under Development</p>
            <p className="text-muted-foreground mt-2">
              Features for inventory tracking, procurement, and material allocation will be available here.
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
