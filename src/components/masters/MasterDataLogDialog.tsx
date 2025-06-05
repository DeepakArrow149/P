
'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { GitCommitVertical, UserCircle, Edit3, Trash2, PlusCircle as PlusCircleIcon, Settings2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogEntry {
  id: string;
  timestamp: Date;
  user: string;
  action: string; // e.g., "Created", "Field Updated", "Deleted"
  fieldName?: string;
  oldValue?: string;
  newValue?: string;
  icon?: LucideIcon;
  iconColor?: string; // Tailwind text color class
}

interface MasterDataLogDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  itemName: string | undefined; // Name or identifier of the master item
  itemType: string; // e.g., "Unit", "Buyer", "Style"
}

const generateMockMasterLogEntries = (itemName: string | undefined, itemType: string): LogEntry[] => {
  if (!itemName) return [];
  const now = new Date();
  const logEntries: LogEntry[] = [];

  logEntries.push({
    id: 'logM1',
    timestamp: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7, 9, 15),
    user: 'AdminUser',
    action: `${itemType} Created`,
    description: `${itemType} "${itemName}" was initially created.`,
    icon: PlusCircleIcon,
    iconColor: 'text-green-100',
  });

  logEntries.push({
    id: 'logM2',
    timestamp: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 5, 11, 45),
    user: 'EditorUser',
    action: `Field Updated`,
    fieldName: itemType === 'Unit' ? 'Location' : 'Contact Person',
    oldValue: itemType === 'Unit' ? 'Old Location A' : 'Mr. Old Contact',
    newValue: itemType === 'Unit' ? 'New Location B' : 'Ms. New Contact',
    description: `Updated ${itemType === 'Unit' ? 'Location' : 'Contact Person'} for "${itemName}".`,
    icon: Edit3,
    iconColor: 'text-blue-100',
  });
  
  logEntries.push({
    id: 'logM3',
    timestamp: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2, 16, 0),
    user: 'System',
    action: 'Settings Change',
    fieldName: 'Default Capacity',
    oldValue: '800',
    newValue: '1000',
    description: `System updated settings for "${itemName}".`,
    icon: Settings2,
    iconColor: 'text-gray-100',
  });


  return logEntries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()); // Sort descending
};

export function MasterDataLogDialog({ isOpen, onOpenChange, itemName, itemType }: MasterDataLogDialogProps) {
  const [logEntries, setLogEntries] = React.useState<LogEntry[]>([]);

  React.useEffect(() => {
    if (isOpen && itemName) {
      setLogEntries(generateMockMasterLogEntries(itemName, itemType));
    }
  }, [isOpen, itemName, itemType]);

  if (!itemName) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader className="border-b pb-4 px-6 pt-6">
          <DialogTitle className="text-xl">Log History for {itemType}: {itemName}</DialogTitle>
          <DialogDescription>
            Chronological view of changes made to this {itemType.toLowerCase()} record.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-grow px-6 py-4">
          {logEntries.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No log entries available for this {itemType.toLowerCase()}.</p>
          ) : (
            <div className="relative pl-2"> {/* Added padding for the line start */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border z-0"></div>

              {logEntries.map((entry) => {
                const IconComponent = entry.icon || Edit3;
                 const iconCircleBg = 
                    entry.action.includes('Created') ? 'bg-green-500' :
                    entry.action.includes('Updated') ? 'bg-blue-500' :
                    entry.action.includes('Deleted') ? 'bg-destructive' :
                    entry.action.includes('Settings') ? 'bg-gray-500' :
                    'bg-primary';

                return (
                  <div key={entry.id} className="flex items-start mb-6 relative z-10">
                    <div className="flex flex-col items-center mr-4 w-20 flex-shrink-0 text-right">
                       <div className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(entry.timestamp, 'dd MMM yyyy')}
                      </div>
                      <div className="text-[10px] text-muted-foreground/80 whitespace-nowrap">
                        {format(entry.timestamp, 'HH:mm a')}
                      </div>
                       <div className="mt-1 flex items-center text-xs text-muted-foreground" title={`User: ${entry.user}`}>
                         <UserCircle className="h-3 w-3 mr-1 opacity-70" /> 
                         <span className="truncate">{entry.user.split(' ')[0]}</span>
                       </div>
                    </div>

                    <div className="absolute left-6 top-1 transform -translate-x-1/2 bg-background p-0.5 rounded-full">
                      <div className={cn("w-3 h-3 rounded-full flex items-center justify-center", iconCircleBg)}>
                        <IconComponent className={cn("h-2 w-2", entry.iconColor || 'text-primary-foreground')} />
                      </div>
                    </div>
                    
                    <div className="ml-8 flex-1 bg-card p-3 rounded-md border border-border shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <h4 className="font-semibold text-sm text-foreground">{entry.action}</h4>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 mb-1.5">{entry.description}</p>
                      {entry.fieldName && (
                        <div className="mt-1.5 space-y-0.5">
                            <div className="text-xs">
                              <span className="font-medium text-muted-foreground">Field: </span>
                              <span className="text-foreground">{entry.fieldName}</span>
                            </div>
                          {entry.oldValue && (
                            <div className="text-xs">
                              <span className="font-medium text-muted-foreground">Old: </span>
                              <span className="line-through text-destructive/80">{entry.oldValue}</span>
                            </div>
                          )}
                          {entry.newValue && (
                            <div className="text-xs">
                              <span className="font-medium text-muted-foreground">New: </span>
                              <span className="text-green-600 font-medium">{entry.newValue}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="p-4 border-t flex-shrink-0">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
