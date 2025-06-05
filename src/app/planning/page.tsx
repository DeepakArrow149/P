import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Network } from 'lucide-react';

export default function PlanningPage() {
  return (
    <>
      <PageHeader
        title="Planning Module"
        description="Overall production planning and resource allocation."
      />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Capacity Planning & Forecasting</CardTitle>
          <CardDescription>
            This module will provide tools for long-term planning, capacity analysis, and demand forecasting.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed border-border rounded-md">
            <Network className="h-20 w-20 text-muted-foreground mb-6" />
            <p className="text-xl font-semibold text-muted-foreground">Planning Module Under Development</p>
            <p className="text-muted-foreground mt-2">
              Features for capacity planning, resource allocation, and forecasting will be available here.
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
