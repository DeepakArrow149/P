'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { TnaPlan } from './types';

interface TnaDetailDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  tnaPlan: TnaPlan | undefined;
}

export const TnaDetailDialog: React.FC<TnaDetailDialogProps> = ({
  isOpen,
  onOpenChange,
  tnaPlan,
}) => {
  const hasActivities = tnaPlan && tnaPlan.activities && tnaPlan.activities.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>{tnaPlan?.planName || 'TNA Plan Details'}</DialogTitle>
          <DialogDescription>
            Overview of the Time and Action activities for this order.
          </DialogDescription>
        </DialogHeader>
        {hasActivities ? (
          <div className="max-h-[60vh] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Activity</TableHead>
                  <TableHead>Responsible</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Remarks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tnaPlan.activities.map((activity, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{activity.activityName}</TableCell>
                    <TableCell>{activity.responsible}</TableCell>
                    <TableCell>{activity.startDate}</TableCell>
                    <TableCell>{activity.endDate}</TableCell>
                    <TableCell className="max-w-xs truncate">{activity.remarks || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="p-6 text-center text-muted-foreground">
            No TNA plan available or defined for this order.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TnaDetailDialog;