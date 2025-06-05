
// src/app/masters/planning/page.tsx
'use client';

import * as React from 'react';
import { MasterPageTemplate } from '@/components/masters/master-page-template';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Edit, Trash2, ExternalLink, ListChecks, PlusCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  getAvailablePlans as getAvailablePlansFromStore,
  loadPlan as loadPlanFromStore,
  renamePlanInStore,
  deletePlanFromStore,
  savePlan, // Use savePlan directly
  generatePlanId,
  type PlanInfo,
  type PlanData,
  DEFAULT_PLAN_ID,
  BUCKET_DEFAULT_PLAN_ID,
} from '@/lib/planStore';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const LOCALSTORAGE_KEY_ACTIVE_PLAN_ID = 'trackTechActivePlanId_v2';
const LOCALSTORAGE_KEY_ACTIVE_BUCKET_PLAN_ID = 'trackTechActiveBucketPlanId_v1';

interface DisplayPlanInfo extends PlanInfo {
  type: 'Main Plan' | 'Bucket Plan' | 'Main & Bucket' | 'Empty' | 'Unknown';
}

export default function PlanningMasterPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [plans, setPlans] = React.useState<DisplayPlanInfo[]>([]);
  const [isMounted, setIsMounted] = React.useState(false);
  const [planToDelete, setPlanToDelete] = React.useState<PlanInfo | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);

  const fetchPlans = React.useCallback(() => {
    if (typeof window !== 'undefined') {
      const storedPlans = getAvailablePlansFromStore();
      const typedPlans: DisplayPlanInfo[] = storedPlans.map(p => {
        const data = loadPlanFromStore(p.id);
        let type: DisplayPlanInfo['type'] = 'Unknown';
        if (data) {
          const hasMainPlanTasks = (data.horizontalTasks && data.horizontalTasks.length > 0) || (data.verticalTasks && data.verticalTasks.length > 0);
          const hasBucketPlanTasks = (data.bucketScheduledTasks && data.bucketScheduledTasks.length > 0) || (data.bucketUnscheduledOrders && data.bucketUnscheduledOrders.length > 0);
          
          if (hasMainPlanTasks && hasBucketPlanTasks) type = 'Main & Bucket';
          else if (hasMainPlanTasks) type = 'Main Plan';
          else if (hasBucketPlanTasks) type = 'Bucket Plan';
          else type = 'Empty'; // If neither, it's an empty plan
        }
        return { ...p, type };
      });
      setPlans(typedPlans);
    }
  }, []);

  React.useEffect(() => {
    setIsMounted(true);
    fetchPlans();
  }, [fetchPlans]);

  const handleRename = (plan: PlanInfo) => {
    const newName = prompt(`Enter new name for plan: "${plan.name}"`, plan.name);
    if (newName && newName.trim() !== "" && newName.trim() !== plan.name) {
      if (renamePlanInStore(plan.id, newName.trim())) {
        toast({ title: 'Plan Renamed', description: `Plan "${plan.name}" renamed to "${newName.trim()}".` });
        fetchPlans();
      } else {
        toast({ title: 'Rename Failed', description: 'Could not rename the plan.', variant: 'destructive' });
      }
    }
  };

  const confirmDelete = (plan: PlanInfo) => {
    if (plan.id === DEFAULT_PLAN_ID || plan.id === BUCKET_DEFAULT_PLAN_ID) {
      toast({ title: "Cannot Delete", description: "Default plans cannot be deleted.", variant: "destructive" });
      return;
    }
    setPlanToDelete(plan);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (planToDelete) {
      if (deletePlanFromStore(planToDelete.id)) {
        toast({ title: 'Plan Deleted', description: `Plan "${planToDelete.name}" has been deleted.`, variant: 'destructive' });
        fetchPlans();
      } else {
        toast({ title: 'Delete Failed', description: 'Could not delete the plan.', variant: 'destructive' });
      }
      setPlanToDelete(null);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleOpenPlan = (planId: string, type: DisplayPlanInfo['type']) => {
    if (typeof window !== 'undefined') {
      const planData = loadPlanFromStore(planId);
      let openInBucket = false;

      if (planData) {
          const hasMainPlanTasks = (planData.horizontalTasks && planData.horizontalTasks.length > 0) || (planData.verticalTasks && planData.verticalTasks.length > 0);
          const hasBucketPlanTasks = (planData.bucketScheduledTasks && planData.bucketScheduledTasks.length > 0) || (planData.bucketUnscheduledOrders && planData.bucketUnscheduledOrders.length > 0);

          if (hasBucketPlanTasks && !hasMainPlanTasks) { // Primarily a bucket plan
              openInBucket = true;
          } else if (hasBucketPlanTasks && hasMainPlanTasks) { // Both, ask user
              openInBucket = confirm("This plan contains data for both Main and Bucket views. Open in Bucket Planning? (Cancel for Main Plan View)");
          }
          // If only main plan tasks, openInBucket remains false
      }


      if (openInBucket) {
        localStorage.setItem(LOCALSTORAGE_KEY_ACTIVE_BUCKET_PLAN_ID, planId);
        router.push('/bucket-planning');
      } else {
        localStorage.setItem(LOCALSTORAGE_KEY_ACTIVE_PLAN_ID, planId);
        router.push('/plan-view');
      }
    }
  };

  const handleCreateNewPlan = React.useCallback(() => {
    const newPlanName = prompt("Enter name for the new plan:");
    if (newPlanName && newPlanName.trim() !== "") {
      const newPlanId = generatePlanId();
      const emptyPlanData: PlanData = {
        horizontalTasks: [],
        verticalTasks: [],
        bucketScheduledTasks: [],
        bucketUnscheduledOrders: [],
      };
      
      const savedPlanInfo = savePlan(newPlanId, newPlanName.trim(), emptyPlanData);

      if (savedPlanInfo) {
        toast({ title: 'New Plan Created', description: `Plan "${newPlanName.trim()}" created. Opening in Main Plan View.` });
        fetchPlans(); 

        if (typeof window !== 'undefined') {
          localStorage.setItem(LOCALSTORAGE_KEY_ACTIVE_PLAN_ID, newPlanId);
          router.push('/plan-view');
        }
      } else {
         toast({ title: "Save Failed", description: "Could not save the new plan. Check console for errors.", variant: "destructive" });
      }
    } else if (newPlanName !== null) { 
      toast({ title: "Invalid Name", description: "Plan name cannot be empty.", variant: "destructive" });
    }
  }, [router, toast, fetchPlans]);


  if (!isMounted) {
    return (
        <MasterPageTemplate title="Planning Master" description="Manage your saved production plans.">
            <div className="text-center py-10 text-muted-foreground">Loading plans...</div>
        </MasterPageTemplate>
    );
  }

  return (
    <MasterPageTemplate
      title="Planning Master"
      description="View, create, rename, or delete your saved production plans."
      onAdd={handleCreateNewPlan}
      addLabel="Create New Plan"
    >
      <Card className="shadow-lg rounded-lg">
        <CardHeader className="px-6 py-4 border-b">
          <CardTitle className="text-lg font-semibold flex items-center">
            <ListChecks className="mr-2 h-5 w-5 text-primary" />
            Saved Plans
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            A list of all plans saved from the Plan View and Bucket Planning modules.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-6 py-3">Plan Name</TableHead>
                  <TableHead className="px-6 py-3">Plan Type</TableHead>
                  <TableHead className="px-6 py-3">Plan ID</TableHead>
                  <TableHead className="px-6 py-3 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.length > 0 ? (
                  plans.map(plan => (
                    <TableRow key={plan.id} className="odd:bg-muted/50">
                      <TableCell className="px-6 py-4 font-medium">{plan.name}</TableCell>
                      <TableCell className="px-6 py-4">
                        <Badge variant={
                          plan.type === 'Main Plan' ? 'default' : 
                          plan.type === 'Bucket Plan' ? 'secondary' : 
                          plan.type === 'Main & Bucket' ? 'outline' : // A different variant for combined
                          plan.type === 'Empty' ? 'outline' : 'outline'
                        }>
                          {plan.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-xs font-mono">{plan.id}</TableCell>
                      <TableCell className="px-6 py-4 text-right space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleOpenPlan(plan.id, plan.type)} title="Open Plan">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleRename(plan)} title="Rename Plan" disabled={plan.id === DEFAULT_PLAN_ID || plan.id === BUCKET_DEFAULT_PLAN_ID}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => confirmDelete(plan)} title="Delete Plan" disabled={plan.id === DEFAULT_PLAN_ID || plan.id === BUCKET_DEFAULT_PLAN_ID}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center px-6 py-4 text-muted-foreground">
                      No plans saved yet. Click "Create New Plan" to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete the plan: "{planToDelete?.name}". This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPlanToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              Delete Plan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MasterPageTemplate>
  );
}

