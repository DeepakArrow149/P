
'use client';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, PlusCircle, Download, Edit3, Eye, ListChecks, CalendarClock } from 'lucide-react';
import type { VariantProps } from 'class-variance-authority';
import { badgeVariants } from '@/components/ui/badge'; 
import Link from 'next/link';
import React from 'react'; // Import React for useState

interface TnaActivity {
  id: string;
  activity: string;
  responsible: string;
  startDate: string;
  endDate: string;
  status: 'On Track' | 'At Risk' | 'Delayed' | 'Completed' | 'Pending';
  remarks?: string;
}

type BadgeVariant = VariantProps<typeof badgeVariants>['variant'];

const getStatusBadgeVariant = (status: TnaActivity['status']): BadgeVariant => {
  switch (status) {
    case 'Completed':
      return 'default'; 
    case 'On Track':
      return 'default'; 
    case 'At Risk':
      return 'secondary'; 
    case 'Delayed':
      return 'destructive'; 
    case 'Pending':
      return 'outline'; 
    default:
      return 'outline';
  }
};

const tnaTips = [
  "Always start from the shipment date and plan backward.",
  "Involve all departments to set realistic timelines.",
  "Keep buffer time for rework, holidays, or unexpected delays.",
  "Update TNA weekly or biweekly to reflect actual vs. planned status.",
  "Use color coding (e.g., Green = On Track, Yellow/Orange = At Risk, Red = Delayed).",
  "Clearly define responsibilities for each task.",
  "Regularly communicate TNA status to all stakeholders."
];

export default function TnaPage() {
  const [tnaActivities, setTnaActivities] = React.useState<TnaActivity[]>([]); // Initialize with empty array

  return (
    <>
      <PageHeader
        title="Time and Action (TNA) Calendar"
        description="Track and manage critical path activities for orders to ensure timely delivery."
        actions={
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" /> Export TNA
            </Button>
            <Link href="/tna/new" passHref>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> Create New TNA Plan
              </Button>
            </Link>
          </div>
        }
      />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <CalendarClock className="mr-2 h-6 w-6 text-primary" />
            Order TNA Overview
          </CardTitle>
          <CardDescription>
            Detailed breakdown of production tasks, responsibilities, and deadlines.
            {/* Display current plan name if available, or generic message */}
            {tnaActivities.length > 0 ? `Current TNA Plan: ORD-XYZ-TNA-001 (Example)` : `No TNA plan loaded.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Activity</TableHead>
                <TableHead>Responsible</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Remarks</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tnaActivities.map((activity) => (
                <TableRow key={activity.id}>
                  <TableCell className="font-medium">{activity.activity}</TableCell>
                  <TableCell>{activity.responsible}</TableCell>
                  <TableCell>{activity.startDate}</TableCell>
                  <TableCell>{activity.endDate}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(activity.status)}>{activity.status}</Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{activity.remarks || '-'}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Task Actions</DropdownMenuLabel>
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit3 className="mr-2 h-4 w-4" /> Edit Task
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>Update Status</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10">
                          Delete Task
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {tnaActivities.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
              No TNA activities defined for this plan.
              <Link href="/tna/new" passHref>
                 <Button variant="link" className="p-1">Create a new TNA plan</Button>
              </Link>
              to get started.
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6 shadow-md bg-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <ListChecks className="mr-2 h-6 w-6 text-primary" />
            Tips for Effective TNA Management
          </CardTitle>
          <CardDescription>
            Follow these best practices to optimize your Time and Action planning.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
            {tnaTips.map((tip, index) => (
              <li key={index}>{tip}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </>
  );
}
