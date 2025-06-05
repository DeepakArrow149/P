
// Use client directive for drag-and-drop event handling and context menu state
'use client';

import { TnaDetailDialog } from './TnaDetailDialog';
import * as React from 'react';
import type { Task, TaskDailyProductionData, VerticalTask } from './types'; // Added VerticalTask
import {
  DropdownMenuTrigger, 
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal
} from '@/components/ui/dropdown-menu';
import { DropdownMenu } from '@/components/ui/dropdown-menu'; 
import {
  Undo2,
  Sparkles,
  AlertTriangle,
  Info,
  Loader2,
  Edit,
  CalendarCheck2,
  Boxes,
  Move,
  LogOut,
  ChevronsUpDown,
  ClipboardEdit,
  FileText,
  BadgeInfo,
  Combine,
  Brain,
  Clock,
  GitCompareArrows,
  ListOrdered,
  ArrowLeftRight,
  Merge,
  MousePointerClick,
  Settings2,
  Link as LinkIcon,
  PlayCircle,
  Hourglass,
  Package as PackageIcon,
  CalendarClock as DeliveryDateIcon,
  BarChartHorizontalBig,
} from 'lucide-react';
import { suggestPlanActions, type SuggestPlanActionsInput, type SuggestedAction } from '@/ai/flows/suggest-plan-actions-flow';
import { differenceInDays, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import type { LearningCurveMaster } from '@/lib/learningCurveTypes';
import { mockLearningCurves } from '@/lib/learningCurveTypes';
import { ProductionEntryDialog } from './production-entry-dialog';
import { calculateDailyProduction } from '@/lib/learningCurve';
import { cn } from '@/lib/utils';

interface TimelineTaskProps {
  task: Task;
  left: number;
  width: number;
  height: number;
  topMargin: number;
  onUndoAllocation: (taskId: string) => void;
  resourceCapacityPerDay?: number;
  onOpenSplitDialog: (task: Task) => void;
  onOpenMergeDialog: (task: Task) => void;
  onStartPushPullMode: (taskId: string, scope: 'orderOnly' | 'linkedOrders') => void;
  onOpenOrderStatusDialog: (task: Task | VerticalTask) => void;
  onOpenEqualiseOrderDialog: (task: Task | VerticalTask) => void; 
}

export function TimelineTask({
  task,
  left,
  width,
  height,
  topMargin,
  onUndoAllocation,
  resourceCapacityPerDay,
  onOpenSplitDialog,
  onOpenMergeDialog,
  onStartPushPullMode,
  onOpenOrderStatusDialog,
  onOpenEqualiseOrderDialog, 
}: TimelineTaskProps) {
  const { toast } = useToast();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [aiSuggestions, setAiSuggestions] = React.useState<SuggestedAction[]>([]);
  const [isLoadingAiSuggestions, setIsLoadingAiSuggestions] = React.useState(false);
  const [isProductionEntryDialogOpen, setIsProductionEntryDialogOpen] = React.useState(false);
  const [isTnaDialogOpen, setIsTnaDialogOpen] = React.useState(false);
  const [dailyProductionPlan, setDailyProductionPlan] = React.useState<TaskDailyProductionData[] | null>(null);
  const [learningCurveDetails, setLearningCurveDetails] = React.useState<LearningCurveMaster | null>(null);

  React.useEffect(() => {
    if (task.originalOrderDetails?.learningCurveId) {
      const curve = mockLearningCurves.find(lc => lc.id === task.originalOrderDetails!.learningCurveId);
      setLearningCurveDetails(curve || null);
    } else {
      setLearningCurveDetails(null);
    }
  }, [task.originalOrderDetails?.learningCurveId]);

  React.useEffect(() => {
    if (learningCurveDetails && learningCurveDetails.points && task.startDate && task.endDate) {
      const startDateObj = parseISO(task.startDate);
      const endDateObj = parseISO(task.endDate);
      const duration = differenceInDays(endDateObj, startDateObj) + 1;
      if (duration > 0 && learningCurveDetails.smv > 0) {
        const plan = calculateDailyProduction(
          learningCurveDetails.points,
          learningCurveDetails.smv,
          learningCurveDetails.workingMinutesPerDay,
          learningCurveDetails.operatorsCount,
          duration,
          startDateObj
        );
        setDailyProductionPlan(plan);
      } else {
        setDailyProductionPlan(null);
      }
    } else {
      setDailyProductionPlan(null);
    }
  }, [learningCurveDetails, task.startDate, task.endDate]);

  const displayLabel = task.label;

  let titleText = task.originalOrderDetails
    ? `Order: ${task.originalOrderDetails.id}\nStyle: ${task.originalOrderDetails.style}\nQty: ${task.originalOrderDetails.quantity}\nDates: ${task.startDate} to ${task.endDate}\nReq. Ship: ${task.originalOrderDetails.requestedShipDate}`
    : task.label;

  if (learningCurveDetails) {
    titleText += `\n\nLearning Curve: ${learningCurveDetails.name}`;
  }

  if (dailyProductionPlan && dailyProductionPlan.length > 0) {
    titleText += '\n\nDaily Plan:';
    dailyProductionPlan.slice(0, 5).forEach((dayPlan) => {
      titleText += `\n${dayPlan.date}: Output ${Math.round(dayPlan.capacity)}, Eff ${Math.round(dayPlan.efficiency)}%`;
    });
    if (dailyProductionPlan.length > 5) {
        titleText += '\n... (more days)';
    }
  } else if (learningCurveDetails) {
     titleText += '\n(Calculating daily plan...)';
  }

  if (task.tnaPlan?.planName) {
    titleText += `\n\nTNA Plan: ${task.tnaPlan.planName}`;
  }

  if (task.mergedOrderIds && task.mergedOrderIds.length > 0) {
    titleText += `\n\nMerged from: ${task.mergedOrderIds.join(', ')}`;
  }


  const handleDragStart = (event: React.DragEvent<HTMLDivElement>) => {
    const dragData = {
        type: 'EXISTING_TASK',
        taskId: task.id,
        originalOrderDetails: task.originalOrderDetails,
        learningCurveId: learningCurveDetails?.id
    };
    event.dataTransfer.setData('application/json', JSON.stringify(dragData));
    event.dataTransfer.setData('text/plain', task.id);
    event.dataTransfer.effectAllowed = 'move';
    if (isMenuOpen) {
      setIsMenuOpen(false); 
    }
  };

  const fetchAiSuggestions = async () => {
    try {
      if (!task.originalOrderDetails) {
        setIsLoadingAiSuggestions(false);
        setAiSuggestions([]);
        return;
      }
      setIsLoadingAiSuggestions(true);
      setAiSuggestions([]);

      const daysInProduction = differenceInDays(parseISO(task.endDate), parseISO(task.startDate)) + 1;
      const firstDayCapacity = dailyProductionPlan?.[0]?.capacity;
      const capacityToUse = firstDayCapacity !== undefined && firstDayCapacity > 0
                              ? firstDayCapacity
                              : resourceCapacityPerDay;

      const input: SuggestPlanActionsInput = {
        taskId: task.id,
        orderId: task.originalOrderDetails.id,
        styleName: task.originalOrderDetails.style,
        quantity: task.originalOrderDetails.quantity,
        currentStartDate: task.startDate,
        currentEndDate: task.endDate,
        requestedShipDate: task.originalOrderDetails.requestedShipDate,
        resourceId: task.resourceId,
        daysInProduction: daysInProduction,
        resourceCapacityPerDay: capacityToUse,
        isNewStyle: learningCurveDetails?.curveType === 'Complex' || Math.random() > 0.7,
      };

      const result = await suggestPlanActions(input);
      setAiSuggestions(result.suggestions || []);
    } catch (error) {
      console.error("Error in TimelineTask fetchAiSuggestions:", error);
      toast({
        title: "AI Error",
        description: "Could not fetch AI suggestions at this time.",
        variant: "destructive",
      });
      setAiSuggestions([{
        actionLabel: "AI Assistant Error",
        actionType: "ERROR_COMPONENT_LEVEL",
        reasoning: "Failed to load suggestions from AI.",
        severity: "critical"
      }]);
    } finally {
      setIsLoadingAiSuggestions(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsMenuOpen(open);
    if (open) {
      fetchAiSuggestions();
    } else {
      setAiSuggestions([]);
    }
  };

  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    handleOpenChange(true);
  };

  const handleGenericAction = (actionName: string) => {
    toast({ title: 'Action Selected', description: `${actionName} for task: ${displayLabel}` });
  };

  const handleSplitOrder = () => {
    if (task.originalOrderDetails && task.originalOrderDetails.quantity > 1) {
      onOpenSplitDialog(task);
    } else {
      toast({
        title: "Cannot Split Task",
        description: "Task quantity must be greater than 1 to split.",
        variant: "destructive",
      });
    }
  };

  const handleMergeOrders = () => {
    if (task.originalOrderDetails) {
      onOpenMergeDialog(task);
    } else {
      toast({ title: "Cannot Merge", description: "Task is missing original order details.", variant: "destructive" });
    }
  };

  const handleUndo = () => {
    onUndoAllocation(task.id);
  };

  const handleAiActionSelect = (suggestion: SuggestedAction) => {
    toast({
      title: `AI Suggestion: ${suggestion.actionLabel}`,
      description: `Type: ${suggestion.actionType}\nReason: ${suggestion.reasoning || 'N/A'}`,
      variant: suggestion.severity === 'critical' ? 'destructive' : 'default',
    });
  }

  const getSeverityIcon = (severity?: 'info' | 'warning' | 'critical') => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="mr-2 h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="mr-2 h-4 w-4 text-yellow-500" />;
      case 'info':
      default:
        return <Info className="mr-2 h-4 w-4 text-blue-500" />;
    }
  }

  return (
    <>
      <DropdownMenu open={isMenuOpen} onOpenChange={handleOpenChange}>
        <DropdownMenuTrigger asChild>
          <div
            draggable
            onDragStart={handleDragStart}
            onContextMenu={handleContextMenu} 
            className={cn(
              "absolute rounded overflow-hidden border border-black/20 shadow-sm flex items-center justify-center p-1 cursor-grab hover:opacity-80 active:cursor-grabbing",
              task.displayColor || task.color || 'bg-slate-700 text-white'
            )}
            style={{
              left: `${left}px`,
              width: `${width}px`,
              height: `${height}px`,
              top: `${topMargin}px`,
              zIndex: 10,
            }}
            title={titleText.replace(/\\n/g, '\n')}
          >
            <span
              className={`truncate text-[10px] px-1 py-0.5 rounded-sm select-none`}
            >
              {displayLabel}
            </span>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64">
          <DropdownMenuLabel>Order Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onSelect={() => handleGenericAction('Style')}>
              <Edit className="mr-2 h-4 w-4" />
              <span>Style</span>
            </DropdownMenuItem>
             <DropdownMenuItem onSelect={() => { setIsTnaDialogOpen(true); setIsMenuOpen(false); }}>
              <CalendarCheck2 className="mr-2 h-4 w-4" />
              <span>T&amp;A</span>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => handleGenericAction('Materials')}>
              <Boxes className="mr-2 h-4 w-4" />
              <span>Materials</span>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => handleGenericAction('Product Details')}>
                <PackageIcon className="mr-2 h-4 w-4" />
                <span>Product Details</span>
            </DropdownMenuItem>
             <DropdownMenuItem onSelect={() => handleGenericAction('Order Details')}>
                <BadgeInfo className="mr-2 h-4 w-4" />
                <span>Order Details</span>
            </DropdownMenuItem>
             <DropdownMenuItem onSelect={() => handleGenericAction('Delivery Date')}>
                <DeliveryDateIcon className="mr-2 h-4 w-4" />
                <span>Delivery Date</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onSelect={() => handleGenericAction('Move Adjacent Strips')}>
              <Move className="mr-2 h-4 w-4" />
              <span>Move Adjacent Strips</span>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={handleUndo} disabled={!task.originalOrderDetails}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Unload Strip</span>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={handleSplitOrder}>
              <ChevronsUpDown className="mr-2 h-4 w-4" />
              <span>Split Strip</span>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={handleMergeOrders} disabled={!task.originalOrderDetails}>
              <Merge className="mr-2 h-4 w-4" />
              <span>Merge Orders</span>
            </DropdownMenuItem>
             <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <ArrowLeftRight className="mr-2 h-4 w-4" />
                <span>Pull/Push Order</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onSelect={() => onStartPushPullMode(task.id, 'orderOnly')}>
                    <MousePointerClick className="mr-2 h-4 w-4" />
                    <span>Shift This Order Only</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => onStartPushPullMode(task.id, 'linkedOrders')}>
                    <MousePointerClick className="mr-2 h-4 w-4" />
                    <span>Shift Linked Orders</span>
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
            <DropdownMenuItem onSelect={() => handleGenericAction('Linked Order Relationships')}>
                <LinkIcon className="mr-2 h-4 w-4" />
                <span>Linked Order Relationships</span>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onOpenEqualiseOrderDialog(task)} disabled={!task.originalOrderDetails || task.originalOrderDetails.quantity <= 1}>
                <GitCompareArrows className="mr-2 h-4 w-4" />
                <span>Equalise Order</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onSelect={() => handleGenericAction('Planned Schedule')}>
              <CalendarCheck2 className="mr-2 h-4 w-4" />
              <span>Planned Schedule</span>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => { setIsProductionEntryDialogOpen(true); setIsMenuOpen(false); }}>
              <ClipboardEdit className="mr-2 h-4 w-4" />
              <span>Production Entry</span>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => handleGenericAction('Edit Capacity Options')}>
                <Settings2 className="mr-2 h-4 w-4" />
                <span>Edit Capacity Options</span>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => handleGenericAction('Notes')}>
              <FileText className="mr-2 h-4 w-4" />
              <span>Notes</span>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onOpenOrderStatusDialog(task)}>
              <BarChartHorizontalBig className="mr-2 h-4 w-4" />
              <span>Order Status</span>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => handleGenericAction('Consolidate Progress')}>
              <Combine className="mr-2 h-4 w-4" />
              <span>Consolidate Progress</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onSelect={() => handleGenericAction('Change Learning Curve')}>
              <Brain className="mr-2 h-4 w-4" />
              <span>Change Learning Curve</span>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => handleGenericAction('Change Start-Up')}>
                <PlayCircle className="mr-2 h-4 w-4" />
                <span>Change Start-Up</span>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => handleGenericAction('Change Standing Time')}>
              <Hourglass className="mr-2 h-4 w-4" />
              <span>Change Standing Time</span>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => handleGenericAction('Change Working Hours')}>
              <Clock className="mr-2 h-4 w-4" />
              <span>Change Working Hours</span>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => handleGenericAction('Multiple Strip Options')} disabled>
              <ListOrdered className="mr-2 h-4 w-4" />
              <span>Multiple Strip Options</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>

          {(isLoadingAiSuggestions || aiSuggestions.length > 0) && <DropdownMenuSeparator />}

          {isLoadingAiSuggestions && (
            <DropdownMenuItem disabled>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading AI suggestions...
            </DropdownMenuItem>
          )}

          {!isLoadingAiSuggestions && aiSuggestions.length > 0 && (
              <DropdownMenuLabel className="text-purple-600 flex items-center">
                  <Sparkles className="mr-2 h-4 w-4 text-purple-500" />
                  AI Suggestions
              </DropdownMenuLabel>
          )}
          {!isLoadingAiSuggestions && aiSuggestions.map((suggestion, index) => (
            <DropdownMenuItem key={index} onSelect={() => handleAiActionSelect(suggestion)} title={suggestion.reasoning || undefined}>
              {getSeverityIcon(suggestion.severity)}
              <span className="flex-1 truncate">{suggestion.actionLabel}</span>
            </DropdownMenuItem>
          ))}
          {!isLoadingAiSuggestions && aiSuggestions.length === 0 && task.originalOrderDetails && (
              <DropdownMenuItem disabled>
                  <Info className="mr-2 h-4 w-4" />
                  No specific AI suggestions.
              </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setIsMenuOpen(false)}>
              <span>Exit</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ProductionEntryDialog
        isOpen={isProductionEntryDialogOpen}
        onOpenChange={setIsProductionEntryDialogOpen}
        task={task}
        onSubmit={(data) => {
          console.log('Production Entry Data:', data);
          toast({ title: 'Production Entry Saved', description: `Data saved for ${displayLabel}` });
          setIsProductionEntryDialogOpen(false);
        }}
      />

      <TnaDetailDialog
        isOpen={isTnaDialogOpen}
        onOpenChange={setIsTnaDialogOpen}
        tnaPlan={task.tnaPlan}
      />
    </>
  );
}
