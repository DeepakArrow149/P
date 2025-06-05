
// src/app/masters/mtna-timetable/page.tsx
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { ListChecks, Edit, Trash2, PlusCircle, Save, Copy, Settings, CalendarRange, Users as UsersIcon, ClockIcon, AlertTriangle, CheckCircle2, InfoIcon, AlertCircle, Eye, MoreVertical } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { MasterDataLogDialog } from '@/components/masters/MasterDataLogDialog';

// Data Structures
type TimetableEventType = 'Critical' | 'Reminder' | 'Required' | 'Skipped';

interface TimetableEvent {
  id: string; 
  eventName: string;
  relativeTo?: string;
  assignedUser?: string;
  offsetDays: number;
  durationDays: number;
  eventType: TimetableEventType;
  isActive: boolean;
  remarks?: string;
}

interface Timetable {
  id: string;
  name: string;
  type: 'Production' | 'Development';
  description?: string;
  calendarId?: string;
  isDefault: boolean;
  events: TimetableEvent[];
}

// Zod Schemas
const timetableEventSchema = z.object({
  id: z.string().optional(), 
  eventName: z.string().min(1, "Event name is required.").max(100, "Max 100 chars."),
  relativeTo: z.string().max(50, "Max 50 chars.").optional().default(''),
  assignedUser: z.string().max(50, "Max 50 chars.").optional().default(''),
  offsetDays: z.coerce.number().int("Offset must be an integer."),
  durationDays: z.coerce.number().min(0, "Duration must be non-negative.").int("Duration must be an integer."),
  eventType: z.enum(['Critical', 'Reminder', 'Required', 'Skipped']),
  isActive: z.boolean().default(true),
  remarks: z.string().max(250, "Max 250 chars").optional().default(''),
});

const timetableFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Timetable name is required.").max(50, "Max 50 chars."),
  type: z.enum(['Production', 'Development']),
  description: z.string().max(250, "Max 250 chars.").optional().default(''),
  calendarId: z.string().optional().default(''),
  isDefault: z.boolean().default(false),
  events: z.array(timetableEventSchema).optional().default([]),
});

type TimetableFormValues = z.infer<typeof timetableFormSchema>;
type TimetableEventFormValues = z.infer<typeof timetableEventSchema>;

// Mock Data for Selects
const calendarOptions = [
  { value: 'main_calendar', label: 'Main Factory Calendar' },
  { value: 'subcon_a_cal', label: 'Subcontractor A Calendar' },
  { value: 'dev_calendar', label: 'Development Team Calendar' },
];
const userOptions = [
  { value: 'user_merch_1', label: 'Merchandiser A' },
  { value: 'user_prod_mgr', label: 'Production Manager' },
  { value: 'user_qa_lead', label: 'QA Lead' },
];
const relativeToOptions = [
  { value: 'order_confirmation', label: 'Order Confirmation Date' },
  { value: 'ship_date', label: 'Planned Ship Date' },
  { value: 'prev_event_end', label: 'Previous Event End Date' },
];

const defaultEventFormValues: TimetableEventFormValues = { 
  eventName: '', 
  relativeTo: '', 
  assignedUser: '', 
  offsetDays: 0, 
  durationDays: 1, 
  eventType: 'Required', 
  isActive: true, 
  remarks: '' 
};

export default function MtnaTimetablePage() {
  const { toast } = useToast();
  const [timetables, setTimetables] = React.useState<Timetable[]>([]);
  const [selectedTimetableId, setSelectedTimetableId] = React.useState<string | null>(null);
  const [isTimetableDialogOpen, setIsTimetableDialogOpen] = React.useState(false);
  const [editingTimetable, setEditingTimetable] = React.useState<Timetable | null>(null);
  const [isEventDialogOpen, setIsEventDialogOpen] = React.useState(false);
  const [editingEvent, setEditingEvent] = React.useState<TimetableEvent | null>(null);
  const [eventDialogMode, setEventDialogMode] = React.useState<'add' | 'edit'>('add');
  const [filterText, setFilterText] = React.useState('');
  
  const [isLogDialogOpen, setIsLogDialogOpen] = React.useState(false);
  const [selectedItemForLog, setSelectedItemForLog] = React.useState<Timetable | null>(null);

  const timetableForm = useForm<TimetableFormValues>({
    resolver: zodResolver(timetableFormSchema),
    defaultValues: { name: '', type: 'Production', description: '', calendarId: '', isDefault: false, events: [] },
  });

  const eventForm = useForm<TimetableEventFormValues>({
    resolver: zodResolver(timetableEventSchema),
    defaultValues: defaultEventFormValues,
  });
  
  const { fields: eventFields, append: appendEvent, remove: removeEvent, update: updateEvent } = useFieldArray({
    control: timetableForm.control,
    name: "events"
  });

  const selectedTimetable = React.useMemo(() => {
    return timetables.find(t => t.id === selectedTimetableId) || null;
  }, [timetables, selectedTimetableId]);

  React.useEffect(() => {
    if (editingTimetable) {
      timetableForm.reset(editingTimetable);
    } else {
      timetableForm.reset({ name: '', type: 'Production', description: '', calendarId: '', isDefault: false, events: [] });
    }
  }, [editingTimetable, timetableForm, isTimetableDialogOpen]);

  React.useEffect(() => {
    if (selectedTimetable) {
      timetableForm.reset(selectedTimetable); 
    } else {
       timetableForm.reset({ name: '', type: 'Production', description: '', calendarId: '', isDefault: false, events: [] });
    }
  }, [selectedTimetable, timetableForm]);

  const handleAddTimetable = () => {
    setEditingTimetable(null);
    timetableForm.reset({ name: '', type: 'Production', description: '', calendarId: '', isDefault: false, events: [] });
    setIsTimetableDialogOpen(true);
  };

  const handleEditTimetableDetails = (timetable: Timetable) => {
    setEditingTimetable(timetable);
    timetableForm.reset(timetable); 
    setIsTimetableDialogOpen(true);
  };
  
  const handleTimetableFormSubmit = (data: TimetableFormValues) => {
    if (editingTimetable) {
      const updatedTimetable = { 
        ...editingTimetable, 
        ...data, 
        events: timetableForm.getValues('events').map(event => ({
          ...event,
          id: event.id || crypto.randomUUID(),
          relativeTo: event.relativeTo || '',
          assignedUser: event.assignedUser || '',
          remarks: event.remarks || ''
        }))
      }; 
      setTimetables(prev => prev.map(t => t.id === editingTimetable.id ? updatedTimetable : t));
      toast({ title: "Timetable Updated" });
    } else {
      const newTimetable: Timetable = { 
        ...data, 
        id: `tt-${crypto.randomUUID()}`, 
        events: (data.events || []).map(event => ({
          ...event,
          id: event.id || crypto.randomUUID(),
          relativeTo: event.relativeTo || '',
          assignedUser: event.assignedUser || '',
          remarks: event.remarks || ''
        }))
      };
      setTimetables(prev => [newTimetable, ...prev]);
      setSelectedTimetableId(newTimetable.id);
      toast({ title: "Timetable Added" });
    }
    setIsTimetableDialogOpen(false);
    setEditingTimetable(null);
  };

  const handleDeleteTimetable = (timetableId: string) => {
    if (confirm("Are you sure you want to delete this timetable and all its events?")) {
      setTimetables(prev => prev.filter(t => t.id !== timetableId));
      if (selectedTimetableId === timetableId) setSelectedTimetableId(null);
      toast({ title: "Timetable Deleted", variant: "destructive" });
    }
  };
  
  const handleViewDetails = (timetable: Timetable) => {
    setSelectedItemForLog(timetable);
    setIsLogDialogOpen(true);
  };

  const handleAddEvent = () => {
    if (!selectedTimetableId) {
      toast({ title: "No Timetable Selected", description: "Please select or create a timetable first.", variant: "destructive" });
      return;
    }
    setEditingEvent(null);
    setEventDialogMode('add');
    eventForm.reset(defaultEventFormValues);
    setIsEventDialogOpen(true);
  };

  const handleEditEvent = (event: TimetableEvent) => {
    setEditingEvent(event);
    setEventDialogMode('edit');
    eventForm.reset({
      ...event,
      relativeTo: event.relativeTo || '',
      assignedUser: event.assignedUser || '',
      remarks: event.remarks || ''
    });
    setIsEventDialogOpen(true);
  };

  const handleEventFormSubmit = (data: TimetableEventFormValues) => {
    if (!selectedTimetableId) return;

    // Convert form data to TimetableEvent format
    const eventData = {
      eventName: data.eventName,
      relativeTo: data.relativeTo || '',
      assignedUser: data.assignedUser || '',
      offsetDays: data.offsetDays,
      durationDays: data.durationDays,
      eventType: data.eventType,
      isActive: data.isActive,
      remarks: data.remarks || '',
      id: eventDialogMode === 'add' ? crypto.randomUUID() : (editingEvent?.id || crypto.randomUUID())
    };

    if (eventDialogMode === 'add') {
      appendEvent(eventData); 
      toast({ title: "Event Added" });
    } else if (editingEvent && editingEvent.id) {
      const eventIndex = timetableForm.getValues('events').findIndex(e => e.id === editingEvent.id);
      if (eventIndex > -1) {
        updateEvent(eventIndex, eventData); 
      }
      toast({ title: "Event Updated" });
    } else {
      toast({ title: "Error", description: "Could not save event.", variant: "destructive" });
      setIsEventDialogOpen(false);
      return;
    }
     
    setTimetables(prevTimetables => 
      prevTimetables.map(t => 
        t.id === selectedTimetableId 
          ? { ...t, events: timetableForm.getValues('events') as TimetableEvent[] } 
          : t
      )
    );
    setIsEventDialogOpen(false);
    setEditingEvent(null);
  };

  const handleDeleteEvent = (eventId: string) => {
     if (!selectedTimetableId) return;
    const eventIndex = timetableForm.getValues('events').findIndex(e => e.id === eventId);
    if (eventIndex > -1) {
        removeEvent(eventIndex);
        setTimetables(prevTimetables => 
            prevTimetables.map(t => 
                t.id === selectedTimetableId 
                ? { ...t, events: timetableForm.getValues('events').map(e => ({ 
                    ...e, 
                    id: e.id || crypto.randomUUID(),
                    relativeTo: e.relativeTo || '',
                    assignedUser: e.assignedUser || '',
                    remarks: e.remarks || ''
                  } as TimetableEvent)) } 
                : t
            )
        );
        toast({ title: "Event Deleted" });
    }
  };
  
  const getEventTypeBadge = (eventType: TimetableEventType) => {
    switch (eventType) {
      case 'Critical': return <Badge variant="destructive" className="text-xs">{eventType}</Badge>;
      case 'Reminder': return <Badge variant="secondary" className="text-xs bg-yellow-400 text-black hover:bg-yellow-500">{eventType}</Badge>;
      case 'Required': return <Badge variant="default" className="text-xs bg-green-500 text-white hover:bg-green-600">{eventType}</Badge>;
      case 'Skipped': return <Badge variant="outline" className="text-xs">{eventType}</Badge>;
      default: return <Badge variant="outline" className="text-xs">{eventType}</Badge>;
    }
  };

  const filteredTimetables = timetables.filter(tt => tt.name.toLowerCase().includes(filterText.toLowerCase()));

  return (
    <>
      <PageHeader title="MTNA Time Table Master" description="Define and manage style/order timetables and their events." />
      <div className="flex flex-col md:flex-row gap-6">
        <Card className="md:w-1/3 lg:w-1/4 shadow-lg rounded-lg">
          <CardHeader className="border-b p-4">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Timetables</CardTitle>
              <Button size="sm" variant="outline" onClick={handleAddTimetable}><PlusCircle className="mr-2 h-4 w-4" /> Add New</Button>
            </div>
             <Input placeholder="Filter timetables..." className="mt-2 h-9 text-xs" value={filterText} onChange={(e) => setFilterText(e.target.value)}/>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-300px)]"> 
              {filteredTimetables.length === 0 && <p className="p-4 text-sm text-muted-foreground">No timetables found.</p>}
              {filteredTimetables.map(tt => (
                <div
                  key={tt.id}
                  className={cn(
                    "p-3 border-b cursor-pointer hover:bg-muted/50",
                    selectedTimetableId === tt.id && "bg-primary/10 text-primary font-semibold"
                  )}
                  onClick={() => setSelectedTimetableId(tt.id)}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm truncate">{tt.name}</span>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon_sm" className="h-7 w-7" onClick={(e) => e.stopPropagation()}><MoreVertical className="h-4 w-4"/></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                           <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleViewDetails(tt); }}>
                             <Eye className="mr-2 h-4 w-4" /> View Details
                           </DropdownMenuItem>
                           <DropdownMenuSeparator />
                           <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEditTimetableDetails(tt); }}>
                             <Edit className="mr-2 h-4 w-4" /> Edit Details
                           </DropdownMenuItem>
                           <DropdownMenuItem onClick={(e) => { e.stopPropagation(); alert('Copy functionality to be implemented.'); }}>
                             <Copy className="mr-2 h-4 w-4" /> Copy
                           </DropdownMenuItem>
                           <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDeleteTimetable(tt.id); }} className="text-destructive focus:text-destructive">
                             <Trash2 className="mr-2 h-4 w-4" /> Delete
                           </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                   <p className="text-xs text-muted-foreground">{tt.type} - {tt.events.length} event(s)</p>
                </div>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>

        <div className="flex-1 space-y-6">
          {selectedTimetable ? (
            <>
              <Card className="shadow-lg rounded-lg">
                <CardHeader className="border-b p-4">
                  <CardTitle className="text-lg flex items-center justify-between">
                    Details: {selectedTimetable.name}
                     <Button size="sm" variant="outline" onClick={() => handleEditTimetableDetails(selectedTimetable)}> <Edit className="mr-2 h-4 w-4" /> Edit Details</Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 p-4 space-y-3 text-sm">
                    <p><strong>Type:</strong> {selectedTimetable.type}</p>
                    <p><strong>Description:</strong> {selectedTimetable.description || <span className="italic text-muted-foreground">N/A</span>}</p>
                    <p><strong>Calendar:</strong> {selectedTimetable.calendarId ? (calendarOptions.find(c => c.value === selectedTimetable.calendarId)?.label || selectedTimetable.calendarId) : <span className="italic text-muted-foreground">N/A</span>}</p>
                    <p><strong>Default:</strong> {selectedTimetable.isDefault ? "Yes" : "No"}</p>
                </CardContent>
              </Card>

              <Card className="shadow-lg rounded-lg">
                <CardHeader className="border-b p-4">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">Events for "{selectedTimetable.name}"</CardTitle>
                    <Button size="sm" variant="outline" onClick={handleAddEvent}><PlusCircle className="mr-2 h-4 w-4" /> Add Event</Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="max-h-[calc(100vh-500px)]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="px-3 py-2 text-xs">Event Name</TableHead>
                          <TableHead className="px-3 py-2 text-xs">Relative To</TableHead>
                          <TableHead className="px-3 py-2 text-xs">User</TableHead>
                          <TableHead className="px-3 py-2 text-xs">Offset</TableHead>
                          <TableHead className="px-3 py-2 text-xs">Duration</TableHead>
                          <TableHead className="px-3 py-2 text-xs">Type</TableHead>
                          <TableHead className="px-3 py-2 text-xs">Active</TableHead>
                          <TableHead className="px-3 py-2 text-xs text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {timetableForm.watch('events')?.map((event, index) => (
                          <TableRow key={event.id || `event-idx-${index}`} className="odd:bg-muted/50">
                            <TableCell className="font-medium text-xs px-3 py-2">{event.eventName}</TableCell>
                            <TableCell className="text-xs px-3 py-2">{event.relativeTo || '-'}</TableCell>
                            <TableCell className="text-xs px-3 py-2">{event.assignedUser || '-'}</TableCell>
                            <TableCell className="text-xs px-3 py-2">{event.offsetDays}</TableCell>
                            <TableCell className="text-xs px-3 py-2">{event.durationDays}</TableCell>
                            <TableCell className="px-3 py-2">{getEventTypeBadge(event.eventType)}</TableCell>
                            <TableCell className="px-3 py-2">
                              <Checkbox checked={event.isActive} disabled className="cursor-default"/>
                            </TableCell>
                            <TableCell className="text-right px-3 py-2">
                              <Button variant="ghost" size="icon_sm" onClick={() => handleEditEvent(event as TimetableEvent)} title="Edit Event"><Edit className="h-3 w-3"/></Button>
                              <Button variant="ghost" size="icon_sm" className="text-destructive hover:text-destructive" onClick={() => handleDeleteEvent(event.id!)} title="Delete Event"><Trash2 className="h-3 w-3"/></Button>
                            </TableCell>
                          </TableRow>
                        ))}
                         {timetableForm.watch('events')?.length === 0 && (
                            <TableRow><TableCell colSpan={8} className="h-20 text-center text-muted-foreground text-sm px-3 py-2">No events defined for this timetable.</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="shadow-lg rounded-lg h-full">
              <CardContent className="pt-6 text-center text-muted-foreground flex flex-col items-center justify-center h-full p-4">
                <ListChecks className="h-16 w-16 mb-4 opacity-50" />
                <p>Select a timetable from the list on the left to view or edit its details and events.</p>
                <p className="mt-2">Or, <Button variant="link" onClick={handleAddTimetable} className="p-0 h-auto">create a new timetable</Button>.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={isTimetableDialogOpen} onOpenChange={(open) => {setIsTimetableDialogOpen(open); if(!open) setEditingTimetable(null);}}>
        <DialogContent className="sm:max-w-lg p-0">
          <DialogHeader className="p-6 pb-4 border-b">
            <DialogTitle>{editingTimetable ? 'Edit Timetable Details' : 'Add New Timetable'}</DialogTitle>
          </DialogHeader>
          <Form {...timetableForm}>
            <form onSubmit={timetableForm.handleSubmit(handleTimetableFormSubmit)} className="space-y-4">
              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                <FormField control={timetableForm.control} name="name" render={({ field }) => (<FormItem><FormLabel>Name *</FormLabel><FormControl><Input placeholder="e.g., NIK 45 DAYS" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={timetableForm.control} name="type" render={({ field }) => (<FormItem><FormLabel>Type *</FormLabel><FormControl><RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-4"><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="Production" /></FormControl><FormLabel className="font-normal">Production</FormLabel></FormItem><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="Development" /></FormControl><FormLabel className="font-normal">Development</FormLabel></FormItem></RadioGroup></FormControl><FormMessage /></FormItem>)} />
                <FormField control={timetableForm.control} name="description" render={({ field }) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Brief description..." {...field} rows={2} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={timetableForm.control} name="calendarId" render={({ field }) => (<FormItem><FormLabel>Calendar</FormLabel><Select onValueChange={field.onChange} value={field.value || ''}><FormControl><SelectTrigger><SelectValue placeholder="Select calendar" /></SelectTrigger></FormControl><SelectContent>{calendarOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                <FormField control={timetableForm.control} name="isDefault" render={({ field }) => (<FormItem className="flex flex-row items-center space-x-2 pt-2"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="font-normal">Set as Default Timetable</FormLabel><FormMessage /></FormItem>)} />
              </div>
              <DialogFooter className="p-6 pt-4 border-t">
                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                <Button type="submit"><Save className="mr-2 h-4 w-4"/>{editingTimetable ? 'Update Details' : 'Create Timetable'}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEventDialogOpen} onOpenChange={(open) => {setIsEventDialogOpen(open); if(!open) setEditingEvent(null);}}>
        <DialogContent className="sm:max-w-xl p-0">
          <DialogHeader className="p-6 pb-4 border-b">
            <DialogTitle>{eventDialogMode === 'add' ? 'Add New Event' : 'Edit Event'} to "{selectedTimetable?.name}"</DialogTitle>
          </DialogHeader>
          <Form {...eventForm}>
            <form onSubmit={eventForm.handleSubmit(handleEventFormSubmit)} className="space-y-3">
              <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
                  <FormField control={eventForm.control} name="eventName" render={({ field }) => (<FormItem><FormLabel>Event Name *</FormLabel><FormControl><Input placeholder="e.g., Fabric Approval" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <div className="grid grid-cols-2 gap-4">
                      <FormField control={eventForm.control} name="relativeTo" render={({ field }) => (<FormItem><FormLabel>Relative To</FormLabel><Select onValueChange={field.onChange} value={field.value || ''}><FormControl><SelectTrigger><SelectValue placeholder="Select reference point" /></SelectTrigger></FormControl><SelectContent>{relativeToOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                      <FormField control={eventForm.control} name="assignedUser" render={({ field }) => (<FormItem><FormLabel>Assigned User</FormLabel><Select onValueChange={field.onChange} value={field.value || ''}><FormControl><SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger></FormControl><SelectContent>{userOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      <FormField control={eventForm.control} name="offsetDays" render={({ field }) => (<FormItem><FormLabel>Offset (Days) *</FormLabel><FormControl><Input type="number" placeholder="e.g., 5 or -3" {...field} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={eventForm.control} name="durationDays" render={({ field }) => (<FormItem><FormLabel>Duration (Days) *</FormLabel><FormControl><Input type="number" placeholder="e.g., 1" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                  <FormField control={eventForm.control} name="eventType" render={({ field }) => (<FormItem><FormLabel>Event Type *</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Critical">Critical</SelectItem><SelectItem value="Reminder">Reminder</SelectItem><SelectItem value="Required">Required</SelectItem><SelectItem value="Skipped">Skipped</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                  <FormField control={eventForm.control} name="remarks" render={({ field }) => (<FormItem><FormLabel>Remarks</FormLabel><FormControl><Textarea placeholder="Any specific notes for this activity..." {...field} rows={2} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={eventForm.control} name="isActive" render={({ field }) => (<FormItem className="flex flex-row items-center space-x-2 pt-2"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="font-normal">Event is Active</FormLabel><FormMessage /></FormItem>)} />
              </div>
              <DialogFooter className="p-6 pt-4 border-t">
                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                <Button type="submit"><Save className="mr-2 h-4 w-4"/>{eventDialogMode === 'add' ? 'Add Event' : 'Update Event'}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {selectedItemForLog && (
        <MasterDataLogDialog
          isOpen={isLogDialogOpen}
          onOpenChange={setIsLogDialogOpen}
          itemName={selectedItemForLog.name}
          itemType="MTNA Timetable"
        />
      )}
    </>
  );
}
