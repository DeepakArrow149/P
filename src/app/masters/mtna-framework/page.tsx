
// src/app/masters/mtna-framework/page.tsx
'use client';

import * as React from 'react';
import { PageHeader } from '@/components/page-header';
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
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { ListChecks, Edit, Trash2, PlusCircle, Save, Settings, CheckCircle2, AlertTriangle, InfoIcon, Users as UsersIcon, CalendarRange, ClockIcon, X } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { cn } from '@/lib/utils';

// Data Structures
type FrameworkType = 'Production' | 'Development' | 'Analysis';

interface FrameworkEvent {
  id: string;
  eventName: string;
  offsetTime: number;
  processTime: number;
  minimumDuration: number;
  duration: number;
  priority: number;
  relativeTo?: string;
  section?: string;
  assignedUser?: string;
  userDepartmentOnly: boolean;
  allowedGroup?: string;
  statusColor?: string;
  color?: string;
  linkedUpdates?: string;
  updateWhenWorkPasses?: string;
  linkToMaterialGroup?: string;
  warnIfEventConflictsWith?: string;
  conflictCondition?: 'Not earlier' | 'Not later';
  externalReference?: string;
  isActive: boolean;
  usesProductionCalendar: boolean;
  isCritical: boolean;
  isReminderOnly: boolean;
  isAlwaysReported: boolean;
  completeDateNotExported: boolean;
  completeForCpPlanning: boolean;
  allowEarlyCompletion: boolean;
  allowLateCompletion: boolean;
}

// Zod Schemas
const frameworkEventFormSchema = z.object({
  id: z.string().optional(),
  eventName: z.string().min(1, "Event name is required.").max(100, "Max 100 chars."),
  offsetTime: z.coerce.number().int("Offset must be an integer.").default(0),
  processTime: z.coerce.number().min(0, "Process time must be non-negative.").default(0),
  minimumDuration: z.coerce.number().min(0, "Min duration must be non-negative.").default(1),
  duration: z.coerce.number().min(0, "Duration must be non-negative.").default(1),
  priority: z.coerce.number().int("Priority must be an integer.").default(0),
  relativeTo: z.string().optional().default(''),
  section: z.string().optional().default(''),
  assignedUser: z.string().optional().default(''),
  userDepartmentOnly: z.boolean().default(false),
  allowedGroup: z.string().optional().default(''),
  statusColor: z.string().optional().default('#FFFFFF'),
  color: z.string().optional().default('#11CF59'),
  linkedUpdates: z.string().optional().default(''),
  updateWhenWorkPasses: z.string().optional().default(''),
  linkToMaterialGroup: z.string().optional().default(''),
  warnIfEventConflictsWith: z.string().optional().default(''),
  conflictCondition: z.enum(['Not earlier', 'Not later']).optional(),
  externalReference: z.string().optional().default(''),
  isActive: z.boolean().default(true),
  usesProductionCalendar: z.boolean().default(true),
  isCritical: z.boolean().default(false),
  isReminderOnly: z.boolean().default(false),
  isAlwaysReported: z.boolean().default(false),
  completeDateNotExported: z.boolean().default(false),
  completeForCpPlanning: z.boolean().default(false),
  allowEarlyCompletion: z.boolean().default(false),
  allowLateCompletion: z.boolean().default(false),
});

type FrameworkEventFormValues = z.infer<typeof frameworkEventFormSchema>;

// Mock data for dropdowns
const relativeToOptions = [{value: "PCD", label: "PCD (Planned Cut Date)"}, {value: "OrderConfirm", label:"Order Confirmation"}, {value: "ShipDate", label:"Ship Date"}];
const sectionOptions = ["MERCH", "SOURCING", "SAMPLING", "PRODUCTION", "QA", "LOGISTICS", "CAD", "IE"];
const userOptions = [{value:"merch_jane", label:"Jane Doe (Merch)"}, {value:"prod_john", label:"John Smith (Prod)"}, {value:"qa_alex", label:"Alex Lee (QA)"}];
const groupOptions = [{value: "merch_team", label: "Merchandising Team"}, {value:"prod_team", label: "Production Supervisors"}];
const linkedUpdatesOptions = [{value: "fabric_eta", label:"Update Fabric ETA"}, {value:"sample_status", label:"Update Sample Status"}];
const updateWhenWorkPassesOptions = [{value: "cutting_comp", label:"Cutting Complete"}, {value:"sewing_input", label:"Sewing Input"}];
const materialGroupOptions = [{value:"main_fabric", label:"Main Fabric"}, {value:"lining_fabric", label:"Lining Fabric"}, {value: "trims_buttons", label:"Buttons/Zippers"}];
const eventConflictOptions = [{value:"pp_sample_approval", label:"PP Sample Approval"}, {value:"bulk_fabric_inhouse", label:"Bulk Fabric In-house"}];


const defaultEventValues: FrameworkEventFormValues = {
  eventName: '', offsetTime: 0, processTime: 0, minimumDuration: 1, duration: 1, priority: 0,
  relativeTo: '', section: '', assignedUser: '', userDepartmentOnly: false, allowedGroup: '',
  statusColor: '#FFFFFF', color: '#11CF59', linkedUpdates: '', updateWhenWorkPasses: '', linkToMaterialGroup: '',
  warnIfEventConflictsWith: '', conflictCondition: undefined, externalReference: '',
  isActive: true, usesProductionCalendar: true, isCritical: false, isReminderOnly: false,
  isAlwaysReported: false, completeDateNotExported: false, completeForCpPlanning: false,
  allowEarlyCompletion: false, allowLateCompletion: false,
};

export default function MtnaFrameworkPage() {
  const { toast } = useToast();
  const [activeFrameworkType, setActiveFrameworkType] = React.useState<FrameworkType>('Production');
  const [activeSubTab, setActiveSubTab] = React.useState<string>('Events');
  
  const [frameworksData, setFrameworksData] = React.useState<Record<FrameworkType, FrameworkEvent[]>>({
    Production: [],
    Development: [],
    Analysis: [],
  });
  
  const [selectedEvent, setSelectedEvent] = React.useState<FrameworkEvent | null>(null);
  const [newEventNameInput, setNewEventNameInput] = React.useState('');

  const eventForm = useForm<FrameworkEventFormValues>({
    resolver: zodResolver(frameworkEventFormSchema),
    defaultValues: defaultEventValues,
  });

  React.useEffect(() => {
    if (selectedEvent) {
      eventForm.reset(selectedEvent);
    } else {
      eventForm.reset(defaultEventValues);
    }
  }, [selectedEvent, eventForm]);

  const handleAddEventToList = () => {
    if (!newEventNameInput.trim()) {
      toast({ title: "Event Name Required", description: "Please enter a name for the new event.", variant: "destructive" });
      return;
    }
    const newEvent: FrameworkEvent = {
      ...defaultEventValues,
      id: crypto.randomUUID(),
      eventName: newEventNameInput.trim(),
    };
    setFrameworksData(prev => ({
      ...prev,
      [activeFrameworkType]: [...prev[activeFrameworkType], newEvent]
    }));
    setNewEventNameInput('');
    setSelectedEvent(newEvent); // Automatically select the new event for editing
    toast({ title: "Event Added", description: `"${newEvent.eventName}" added to ${activeFrameworkType} framework.` });
  };

  const handleEventFormSubmit = (data: FrameworkEventFormValues) => {
    if (!selectedEvent || !selectedEvent.id) {
      toast({ title: "No Event Selected", description: "Cannot update, no event is selected.", variant: "destructive" });
      return;
    }
    const updatedEvent = { ...selectedEvent, ...data };
    setFrameworksData(prev => ({
      ...prev,
      [activeFrameworkType]: prev[activeFrameworkType].map(e => e.id === selectedEvent.id ? updatedEvent : e)
    }));
    setSelectedEvent(updatedEvent); // Keep the updated event selected
    toast({ title: "Event Updated", description: `"${updatedEvent.eventName}" has been updated.` });
  };

  const handleDeleteEvent = () => {
    if (!selectedEvent) return;
    if (confirm(`Are you sure you want to delete event "${selectedEvent.eventName}"?`)) {
      setFrameworksData(prev => ({
        ...prev,
        [activeFrameworkType]: prev[activeFrameworkType].filter(e => e.id !== selectedEvent.id)
      }));
      setSelectedEvent(null);
      toast({ title: "Event Deleted", variant: "destructive" });
    }
  };

  const currentEvents = frameworksData[activeFrameworkType] || [];

  return (
    <>
      <PageHeader title="MTNA Event Framework Master" description="Define and manage event frameworks for Production, Development, and Analysis." />
      
      <Tabs value={activeFrameworkType} onValueChange={(value) => {
        setActiveFrameworkType(value as FrameworkType);
        setSelectedEvent(null); // Reset selected event when changing framework type
        setActiveSubTab("Events"); // Reset to events sub-tab
      }} className="mb-6">
        <TabsList>
          <TabsTrigger value="Production">Production</TabsTrigger>
          <TabsTrigger value="Development">Development</TabsTrigger>
          <TabsTrigger value="Analysis" disabled>Analysis (Coming Soon)</TabsTrigger>
        </TabsList>
      
        <TabsContent value="Production" className="mt-0">
          <Card className="shadow-lg rounded-lg">
            {/* INNER TABS for sub-sections */}
            <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
              <CardHeader className="p-4 border-b">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="Events">Events</TabsTrigger>
                  <TabsTrigger value="Dependant events" disabled>Dependant events</TabsTrigger>
                  <TabsTrigger value="Rename" disabled>Rename</TabsTrigger>
                  <TabsTrigger value="Report" disabled>Report</TabsTrigger>
                </TabsList>
              </CardHeader>
              <CardContent className="p-0"> {/* CardContent now directly wraps ALL sub-TabsContent */}
                <TabsContent value="Events" className="mt-0">
                  <div className="flex flex-col md:flex-row min-h-[calc(100vh-380px)]"> {/* Adjust height calc as needed */}
                    {/* Left Panel - Event List */}
                    <div className="w-full md:w-1/3 lg:w-1/4 border-r border-border">
                      <div className="p-3 border-b">
                        <Input 
                          placeholder="Enter event name..." 
                          value={newEventNameInput}
                          onChange={(e) => setNewEventNameInput(e.target.value)}
                          className="h-9 text-sm mb-2"
                          onKeyDown={(e) => { if (e.key === 'Enter' && newEventNameInput.trim()) { e.preventDefault(); handleAddEventToList();}}}
                        />
                        <Button onClick={handleAddEventToList} size="sm" className="w-full" disabled={!newEventNameInput.trim()}>
                          <PlusCircle className="mr-2 h-4 w-4"/> Add Event
                        </Button>
                      </div>
                      <ScrollArea className="h-[calc(100vh-500px)]"> {/* Adjust height calc */}
                        {currentEvents.length === 0 && <p className="p-3 text-sm text-muted-foreground text-center">No events in this framework yet.</p>}
                        {currentEvents.map(event => (
                          <div 
                            key={event.id} 
                            className={cn(
                              "p-3 text-sm border-b cursor-pointer hover:bg-muted/50 flex justify-between items-center",
                              selectedEvent?.id === event.id && "bg-primary/10 text-primary font-medium"
                            )}
                            onClick={() => setSelectedEvent(event)}
                          >
                            <span className="truncate">{event.eventName}</span>
                            <Checkbox checked={event.isActive} disabled className="ml-2 cursor-default" onClick={(e) => e.stopPropagation()}/>
                          </div>
                        ))}
                      </ScrollArea>
                    </div>

                    {/* Right Panel - Event Definition Form */}
                    <div className="flex-1 p-4">
                      {selectedEvent ? (
                        <Form {...eventForm}>
                          <form onSubmit={eventForm.handleSubmit(handleEventFormSubmit)} className="space-y-4">
                          <ScrollArea className="h-[calc(100vh-530px)] pr-3"> {/* Adjust height calc */}
                            <div className="space-y-4">
                              <FormField control={eventForm.control} name="eventName" render={({ field }) => (<FormItem><FormLabel className="text-xs">Event Name *</FormLabel><FormControl><Input {...field} className="h-9 text-sm"/></FormControl><FormMessage /></FormItem>)} />
                              
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                <FormField control={eventForm.control} name="offsetTime" render={({ field }) => (<FormItem><FormLabel className="text-xs">Offset (Days)</FormLabel><FormControl><Input type="number" {...field} className="h-9 text-sm"/></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={eventForm.control} name="processTime" render={({ field }) => (<FormItem><FormLabel className="text-xs">Process Time (Mins)</FormLabel><FormControl><Input type="number" {...field} className="h-9 text-sm"/></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={eventForm.control} name="minimumDuration" render={({ field }) => (<FormItem><FormLabel className="text-xs">Min Duration (Days)</FormLabel><FormControl><Input type="number" {...field} className="h-9 text-sm"/></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={eventForm.control} name="duration" render={({ field }) => (<FormItem><FormLabel className="text-xs">Duration (Days)</FormLabel><FormControl><Input type="number" {...field} className="h-9 text-sm"/></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={eventForm.control} name="priority" render={({ field }) => (<FormItem><FormLabel className="text-xs">Priority</FormLabel><FormControl><Input type="number" {...field} className="h-9 text-sm"/></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={eventForm.control} name="externalReference" render={({ field }) => (<FormItem><FormLabel className="text-xs">Ext. Reference</FormLabel><FormControl><Input {...field} className="h-9 text-sm"/></FormControl><FormMessage /></FormItem>)} />
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <FormField control={eventForm.control} name="relativeTo" render={({ field }) => (<FormItem><FormLabel className="text-xs">Relative To</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select..." /></SelectTrigger></FormControl><SelectContent>{relativeToOptions.map(o=><SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                                <FormField control={eventForm.control} name="section" render={({ field }) => (<FormItem><FormLabel className="text-xs">Section</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select..." /></SelectTrigger></FormControl><SelectContent>{sectionOptions.map(o=><SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
                                <FormField control={eventForm.control} name="assignedUser" render={({ field }) => (<FormItem><FormLabel className="text-xs">User Normally Responsible</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select user..." /></SelectTrigger></FormControl><SelectContent>{userOptions.map(o=><SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                                <FormField control={eventForm.control} name="userDepartmentOnly" render={({ field }) => (<FormItem className="flex items-center space-x-2 pt-5"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange}/></FormControl><FormLabel className="text-xs font-normal">or anyone in this user's department</FormLabel></FormItem>)} />
                              </div>
                              <FormField control={eventForm.control} name="allowedGroup" render={({ field }) => (<FormItem><FormLabel className="text-xs">Allow Update by User Group</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select group..." /></SelectTrigger></FormControl><SelectContent>{groupOptions.map(o=><SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <FormField control={eventForm.control} name="statusColor" render={({ field }) => (<FormItem><FormLabel className="text-xs">Status Colour</FormLabel><FormControl><Input type="color" {...field} className="h-9 w-full p-1"/></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={eventForm.control} name="color" render={({ field }) => (<FormItem><FormLabel className="text-xs">Colour</FormLabel><FormControl><Input type="color" {...field} className="h-9 w-full p-1"/></FormControl><FormMessage /></FormItem>)} />
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <FormField control={eventForm.control} name="linkedUpdates" render={({ field }) => (<FormItem><FormLabel className="text-xs">Linked Updates</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select..." /></SelectTrigger></FormControl><SelectContent>{linkedUpdatesOptions.map(o=><SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                                <FormField control={eventForm.control} name="updateWhenWorkPasses" render={({ field }) => (<FormItem><FormLabel className="text-xs">Update When Work Passes</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select..." /></SelectTrigger></FormControl><SelectContent>{updateWhenWorkPassesOptions.map(o=><SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                              </div>
                              <FormField control={eventForm.control} name="linkToMaterialGroup" render={({ field }) => (<FormItem><FormLabel className="text-xs">Link to Material Group</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select..." /></SelectTrigger></FormControl><SelectContent>{materialGroupOptions.map(o=><SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />

                              <div className="grid grid-cols-[1fr,auto] gap-3 items-end">
                                <FormField control={eventForm.control} name="warnIfEventConflictsWith" render={({ field }) => (<FormItem><FormLabel className="text-xs">Warn if Event Conflicts With</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select event..." /></SelectTrigger></FormControl><SelectContent>{eventConflictOptions.map(o=><SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                                <FormField control={eventForm.control} name="conflictCondition" render={({ field }) => (<FormItem className="pt-2"><FormControl><RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-3"><FormItem className="flex items-center space-x-1"><FormControl><RadioGroupItem value="Not earlier"/></FormControl><FormLabel className="text-xs font-normal">Not earlier</FormLabel></FormItem><FormItem className="flex items-center space-x-1"><FormControl><RadioGroupItem value="Not later"/></FormControl><FormLabel className="text-xs font-normal">Not later</FormLabel></FormItem></RadioGroup></FormControl></FormItem>)} />
                              </div>

                              <Card className="mt-4">
                                <CardHeader className="p-2"><CardTitle className="text-sm">Event Properties</CardTitle></CardHeader>
                                <CardContent className="p-3 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
                                  {(Object.keys(defaultEventValues) as Array<keyof FrameworkEventFormValues>)
                                    .filter(key => typeof defaultEventValues[key] === 'boolean' && key !== 'userDepartmentOnly')
                                    .map(key => (
                                      <FormField key={key} control={eventForm.control} name={key as any} render={({ field }) => (
                                        <FormItem className="flex items-center space-x-2">
                                          <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} id={`event-${key}`}/></FormControl>
                                          <FormLabel htmlFor={`event-${key}`} className="text-xs font-normal capitalize cursor-pointer">{(key as string).replace(/([A-Z])/g, ' $1').trim()}</FormLabel>
                                        </FormItem>
                                      )}/>
                                  ))}
                                </CardContent>
                              </Card>
                            </div>
                            </ScrollArea>
                            <div className="flex justify-end gap-2 pt-4 flex-shrink-0">
                              <Button type="button" variant="destructive" onClick={handleDeleteEvent} disabled={!selectedEvent}>Delete Event</Button>
                              <Button type="submit" disabled={!selectedEvent}>Update Event</Button>
                            </div>
                          </form>
                        </Form>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                          <ListChecks className="h-16 w-16 mb-4 opacity-50" />
                          <p>Select an event from the list to view or edit its details.</p>
                          <p>Or, add a new event to the "{activeFrameworkType}" framework.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="Dependant events" className="mt-0 p-4 text-muted-foreground text-center">
                  Dependant events configuration coming soon.
                </TabsContent>
                <TabsContent value="Rename" className="mt-0 p-4 text-muted-foreground text-center">
                  Rename framework functionality coming soon.
                </TabsContent>
                <TabsContent value="Report" className="mt-0 p-4 text-muted-foreground text-center">
                  Report generation for frameworks coming soon.
                </TabsContent>
              </CardContent>
            </Tabs> {/* End of inner Tabs for sub-sections */}
          </Card>
        </TabsContent> {/* End of "Production" framework tab content */}
        
        <TabsContent value="Development" className="mt-0">
             <Card className="shadow-lg rounded-lg">
                 <CardHeader className="p-4 border-b"><CardTitle className="text-lg">Development Framework</CardTitle></CardHeader>
                 <CardContent className="p-4 text-muted-foreground">Configuration for Development Framework events will appear here.</CardContent>
             </Card>
        </TabsContent>
        <TabsContent value="Analysis" className="mt-0">
             <Card className="shadow-lg rounded-lg">
                 <CardHeader className="p-4 border-b"><CardTitle className="text-lg">Analysis Framework</CardTitle></CardHeader>
                 <CardContent className="p-4 text-muted-foreground">Configuration for Analysis Framework events will appear here.</CardContent>
             </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
