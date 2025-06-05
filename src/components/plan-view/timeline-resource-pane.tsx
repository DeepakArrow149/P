
// Use client directive for drag-and-drop event handling and state
'use client';
import * as React from 'react';
import type { Resource, UnscheduledOrder, RowHeightLevel } from './types';
import { ROW_HEIGHT_CONFIG, RESOURCE_PANE_WIDTH } from './types';
import { PlusCircle, MinusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils'; // Import cn for conditional classes

interface TimelineResourcePaneProps extends React.HTMLAttributes<HTMLDivElement> {
  resources: Resource[];
  unscheduledOrders: UnscheduledOrder[];
  expandedResourceId: string | null;
  onToggleExpandResource: (resourceId: string) => void;
  rowHeightLevel: RowHeightLevel;
  selectedResourceIds: string[];
  onToggleSelectedResource: (resourceId: string) => void;
}

const UNSCHEDULED_LIST_MAX_ITEMS_NO_SCROLL = 3;
const UNSCHEDULED_LIST_HEADER_HEIGHT = 20; // Approx height for "Unscheduled Orders:" text
const UNSCHEDULED_LIST_PADDING_VERTICAL = 8; // Top and bottom padding for the unscheduled list area

const TimelineResourcePane = React.forwardRef<
  HTMLDivElement,
  TimelineResourcePaneProps
>(({ resources, unscheduledOrders, expandedResourceId, onToggleExpandResource, rowHeightLevel, selectedResourceIds, onToggleSelectedResource, className, ...props }, ref) => {

  const currentHeights = ROW_HEIGHT_CONFIG[rowHeightLevel] || ROW_HEIGHT_CONFIG.medium;

  const getEffectiveRowHeight = (resource: Resource) => {
    let expansionHeight = 0;
    if (resource.type === 'unit' && resource.id === expandedResourceId) {
      if (unscheduledOrders.length > 0) {
        expansionHeight = UNSCHEDULED_LIST_HEADER_HEIGHT +
          Math.min(unscheduledOrders.length, UNSCHEDULED_LIST_MAX_ITEMS_NO_SCROLL) * currentHeights.unscheduledItem +
          UNSCHEDULED_LIST_PADDING_VERTICAL;
      } else {
        expansionHeight = UNSCHEDULED_LIST_HEADER_HEIGHT + 20 /* "None" text approx height */ + UNSCHEDULED_LIST_PADDING_VERTICAL;
      }
    }

    let baseHeight = currentHeights.mainUnit;
    if (resource.type === 'header') {
        baseHeight = currentHeights.headerUnit * 2; // Header takes two "unit" heights
    } else if (resource.type === 'groupHeader') {
        baseHeight = currentHeights.groupHeaderUnit;
    } else if (resource.type === 'subtotal') {
      baseHeight = currentHeights.mainUnit + ((resource.subRowsData?.length || 0) * currentHeights.subUnit);
    } else if (resource.type === 'unit' || resource.type === 'holding'){
      baseHeight = currentHeights.mainUnit + currentHeights.subUnit;
    }
    return baseHeight + expansionHeight;
  };

  return (
    // This component now just renders the list. Scrolling is handled by its parent ScrollArea.
    <div className={cn("divide-y divide-border", className)} {...props} ref={ref}>
      {resources.map((resource) => {
        const effectiveRowHeight = getEffectiveRowHeight(resource);
        const isSelected = selectedResourceIds.includes(resource.id) && (resource.type === 'unit' || resource.type === 'holding');
        
        if (resource.type === 'groupHeader') {
          return (
            <div
              key={resource.id}
              className="flex flex-col justify-center p-2 text-xs font-semibold bg-muted/30 text-muted-foreground cursor-default border-b" // Added border-b
              style={{ height: effectiveRowHeight, minHeight: effectiveRowHeight }}
            >
              {resource.name}
              {resource.details && <span className="text-[10px] font-normal">{resource.details}</span>}
            </div>
          );
        }
        
        const mainContentHeight = resource.type === 'unit' || resource.type === 'holding' ? currentHeights.mainUnit : effectiveRowHeight;
        const subContentHeight = resource.type === 'unit' || resource.type === 'holding' ? currentHeights.subUnit : 0;


        return (
          <div
            key={resource.id}
            className={cn(
              `flex flex-col p-2 text-xs hover:bg-accent/10 border-b`, // Added border-b
              resource.type === 'header' ? 'bg-muted/50 cursor-default' : 'cursor-pointer',
              resource.type === 'subtotal' ? 'bg-muted/20 cursor-default' : '',
              isSelected && 'bg-primary/10 ring-1 ring-inset ring-primary/60'
            )}
            style={{ height: effectiveRowHeight, minHeight: effectiveRowHeight }}
            onClick={() => (resource.type === 'unit' || resource.type === 'holding') && onToggleSelectedResource(resource.id)}
            title={ (resource.type === 'unit' || resource.type === 'holding') ? `Click to select/deselect ${resource.name}` : undefined}
          >
            {resource.type === 'header' ? (
              <div className="flex flex-col justify-center h-full">
                <span className="font-semibold text-sm text-foreground">{resource.name}</span>
                <span className="text-muted-foreground text-[10px]">{resource.details}</span>
              </div>
            ) : (
              <>
                <div className="flex-grow flex flex-col justify-center" style={{height: mainContentHeight}}>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                     <div className="flex items-center">
                        <span className="font-medium text-foreground">{resource.name}</span>
                        {resource.type === 'unit' && resource.isExpandable && (
                          <Button variant="ghost" size="icon_sm" className="h-5 w-5 ml-1 p-0 hover:bg-accent/20" onClick={(e) => { e.stopPropagation(); onToggleExpandResource(resource.id);}}>
                            {expandedResourceId === resource.id ? <MinusCircle className="h-3 w-3 text-muted-foreground" /> : <PlusCircle className="h-3 w-3 text-muted-foreground" />}
                          </Button>
                        )}
                     </div>
                      {resource.details && <span className="text-muted-foreground text-[10px]">{resource.details}</span>}
                    </div>
                    <div className="flex gap-2 text-right">
                      {resource.values?.map((val, i) => (
                        <span key={i} className="font-semibold w-6 text-center text-foreground">{val}</span>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Sub-content area for capacity/load text, always present for units/holdings to maintain height */}
                {(resource.type === 'unit' || resource.type === 'holding' || resource.type === 'subtotal') && (
                    <div style={{ height: subContentHeight }} className="mt-auto flex items-center">
                        {resource.type === 'subtotal' && resource.subRowsData && (
                            <div className="w-full text-[10px] text-muted-foreground">
                                {resource.subRowsData.map((sr, idx) => (
                                    <div key={idx} className="truncate leading-tight">{sr.type}</div>
                                ))}
                            </div>
                        )}
                         {/* Placeholder for capacity/load text if needed directly here - usually shown in schedule pane */}
                    </div>
                )}


                {resource.type === 'unit' && resource.id === expandedResourceId && (
                  <div className="pl-2 mt-1 border-t border-border/30 pt-1">
                    <p className="text-[10px] font-semibold mb-0.5 text-muted-foreground">Unscheduled Orders:</p>
                    {unscheduledOrders.length === 0 ? (
                      <p className="text-[10px] text-muted-foreground italic">None available</p>
                    ) : (
                        <ul className="space-y-0.5 pr-1 max-h-[${Math.min(unscheduledOrders.length, UNSCHEDULED_LIST_MAX_ITEMS_NO_SCROLL) * currentHeights.unscheduledItem}px] overflow-y-auto">
                          {unscheduledOrders.map(order => (
                            <li key={order.id}
                                draggable
                                onDragStart={(e) => {
                                  e.dataTransfer.setData('application/json', JSON.stringify({ type: 'NEW_TASK_FROM_UNSCHEDULED', orderId: order.id, originalOrderDetails: order }));
                                  e.dataTransfer.effectAllowed = 'move';
                                }}
                                className={cn(
                                  "p-1 bg-background border border-border rounded text-[10px] cursor-grab hover:bg-accent/50 shadow-sm",
                                  (order.reason?.toLowerCase().includes('unloaded') || order.reason?.toLowerCase().includes('returned')) && "italic text-slate-600 dark:text-slate-400"
                                )}
                                style={{ height: currentHeights.unscheduledItem - 4 }} // Adjust for padding/border
                                title={`Order: ${order.id}\nBuyer: ${order.buyer}\nStyle: ${order.style}\nQty: ${order.quantity}\nShip Date: ${order.requestedShipDate}\nReason: ${order.reason}`}
                            >
                              <div className="font-medium truncate text-foreground">{order.id} - {order.style}</div>
                              <div className="text-muted-foreground truncate">Qty: {order.quantity}, Req Ship: {order.requestedShipDate}</div>
                            </li>
                          ))}
                        </ul>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
});

TimelineResourcePane.displayName = "TimelineResourcePane";

export { TimelineResourcePane };
