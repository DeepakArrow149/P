
'use client';

import * as React from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { KeyRound, ShieldAlert, Users, LayoutGrid, PieChart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";


interface Permission {
  view: boolean;
  add: boolean;
  edit: boolean;
  delete: boolean;
  maintain?: boolean; // Specific to some modules
}

interface ModulePermissions {
  [moduleKey: string]: Permission; // e.g., products: { view: true, ... }
}

interface PlanningPermissions {
  [planningSectionKey: string]: { view: boolean; edit: boolean; }; // e.g., "SEW/China": { view: true, edit: false }
}

interface GroupRights {
  modulePermissions: ModulePermissions;
  planningPermissions: PlanningPermissions;
}

const mockSecurityGroups = [
  { id: 'group_admin', name: 'Administrators' },
  { id: 'group_merch', name: 'Merchandisers' },
  { id: 'group_plan', name: 'Planning Team' },
];

const modulesConfig = [
  { key: 'products', label: 'Products', actions: ['view', 'add', 'edit', 'delete', 'maintain'] },
  { key: 'orders', label: 'Orders', actions: ['view', 'add', 'edit', 'delete'] },
  { key: 'customers', label: 'Customers', actions: ['view', 'add', 'edit', 'delete'] },
  { key: 'planningBoard', label: 'Planning Board', actions: ['view', 'edit'] }, // Simplified for example
  { key: 'reportsMenu', label: 'Reports Menu', actions: ['view'] },
  { key: 'updateMenu', label: 'Update Menu (Masters)', actions: ['view', 'maintain'] },
];

const planningSectionsMock = ["SEW/China", "SEW/India", "CUT/Overall", "FINISH/HQ"];

const initialRights: GroupRights = {
  modulePermissions: modulesConfig.reduce((acc, module) => {
    acc[module.key] = module.actions.reduce((actAcc, action) => {
      actAcc[action as keyof Permission] = false;
      return actAcc;
    }, {} as Permission);
    return acc;
  }, {} as ModulePermissions),
  planningPermissions: planningSectionsMock.reduce((acc, section) => {
    acc[section] = { view: false, edit: false };
    return acc;
  }, {} as PlanningPermissions),
};


export default function SecurityGroupRightsPage() {
  const { toast } = useToast();
  const [selectedGroupId, setSelectedGroupId] = React.useState<string | null>(null);
  const [currentRights, setCurrentRights] = React.useState<GroupRights>(initialRights);

  const handleGroupChange = (groupId: string) => {
    setSelectedGroupId(groupId);
    // In a real app, fetch rights for this group from backend/localStorage
    // For now, we reset to initialRights or load mocked rights
    const loadedRights = localStorage.getItem(`group_rights_${groupId}`);
    if (loadedRights) {
      setCurrentRights(JSON.parse(loadedRights));
    } else {
      setCurrentRights(JSON.parse(JSON.stringify(initialRights))); // Deep copy
    }
  };

  const handleModulePermissionChange = (moduleKey: string, action: keyof Permission, value: boolean) => {
    setCurrentRights(prev => ({
      ...prev,
      modulePermissions: {
        ...prev.modulePermissions,
        [moduleKey]: {
          ...prev.modulePermissions[moduleKey],
          [action]: value,
        },
      },
    }));
  };
  
  const handlePlanningPermissionChange = (sectionKey: string, action: 'view' | 'edit', value: boolean) => {
    setCurrentRights(prev => ({
      ...prev,
      planningPermissions: {
        ...prev.planningPermissions,
        [sectionKey]: {
          ...prev.planningPermissions[sectionKey],
          [action]: value,
        },
      },
    }));
  };

  const handleSaveChanges = () => {
    if (selectedGroupId) {
      localStorage.setItem(`group_rights_${selectedGroupId}`, JSON.stringify(currentRights));
      toast({ title: 'Rights Saved', description: `Permissions for group updated successfully.` });
    } else {
      toast({ title: 'No Group Selected', description: 'Please select a group first.', variant: 'destructive' });
    }
  };

  return (
    <>
      <PageHeader title="Security Group Rights" description="Configure module and feature access for each security group." />
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center">
        <Select onValueChange={handleGroupChange} value={selectedGroupId || undefined}>
          <SelectTrigger className="w-full sm:w-[280px] h-10">
            <SelectValue placeholder="Select a Security Group..." />
          </SelectTrigger>
          <SelectContent>
            {mockSecurityGroups.map(group => (
              <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={handleSaveChanges} disabled={!selectedGroupId} className="w-full sm:w-auto h-10">
          Update Rights
        </Button>
      </div>

      {!selectedGroupId && (
        <Card className="mt-6">
          <CardContent className="pt-6 text-center text-muted-foreground">
            <ShieldAlert className="mx-auto h-12 w-12 mb-4" />
            Please select a security group to view or edit its permissions.
          </CardContent>
        </Card>
      )}

      {selectedGroupId && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center"><LayoutGrid className="mr-2 h-5 w-5 text-primary"/>Module Permissions</CardTitle>
              <CardDescription>Set access rights for core application modules.</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" className="w-full">
                {modulesConfig.map(module => (
                  <AccordionItem value={module.key} key={module.key}>
                    <AccordionTrigger className="text-sm font-medium hover:no-underline">{module.label}</AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-3 p-2">
                        {module.actions.map(action => (
                          <div key={action} className="flex items-center space-x-2">
                            <Checkbox
                              id={`${module.key}-${action}`}
                              checked={currentRights.modulePermissions[module.key]?.[action as keyof Permission] || false}
                              onCheckedChange={(checked) => handleModulePermissionChange(module.key, action as keyof Permission, !!checked)}
                            />
                            <Label htmlFor={`${module.key}-${action}`} className="text-xs font-normal capitalize">{action}</Label>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center"><PieChart className="mr-2 h-5 w-5 text-primary"/>Planning Section Rights</CardTitle>
                <CardDescription>Configure access to specific planning board sections.</CardDescription>
              </CardHeader>
              <CardContent className="max-h-60 overflow-y-auto">
                <div className="space-y-3">
                {planningSectionsMock.map(section => (
                  <div key={section} className="p-2 border rounded-md">
                    <p className="text-sm font-medium mb-1">{section}</p>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                            id={`plan-${section}-view`} 
                            checked={currentRights.planningPermissions[section]?.view || false}
                            onCheckedChange={(checked) => handlePlanningPermissionChange(section, 'view', !!checked)}
                        />
                        <Label htmlFor={`plan-${section}-view`} className="text-xs">View</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                         <Checkbox 
                            id={`plan-${section}-edit`} 
                            checked={currentRights.planningPermissions[section]?.edit || false}
                            onCheckedChange={(checked) => handlePlanningPermissionChange(section, 'edit', !!checked)}
                         />
                        <Label htmlFor={`plan-${section}-edit`} className="text-xs">Edit</Label>
                      </div>
                    </div>
                  </div>
                ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center"><Users className="mr-2 h-5 w-5 text-primary"/>Users Logon</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Viewing currently logged-in users by group will be available here.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </>
  );
}
