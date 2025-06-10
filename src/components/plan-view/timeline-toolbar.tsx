// Use client directive for event handling and state
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  ChevronDown,
  ListChecks,
  Save,
  Filter as FilterIcon, // Renamed to avoid conflict with native filter
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  ArrowLeft,
  ArrowRight,
  Home,
  UploadCloud,
  DownloadCloud,
  Settings2,
  HelpCircle,
  MoreVertical,
  Edit3,
  CalendarIcon,
  LayoutPanelTop,
  LayoutPanelLeft,
  FileEdit,
  SaveAll,
  Trash2,
  Clock,
  CalendarDays,
  View,
  CalendarRange,
  Palette,
  ArrowBigUpDash,
  ArrowBigDownDash,
  FastForward,
  ListTree,
  Layers, 
  ClipboardList,
  Search,
  Target,
  Zap
} from 'lucide-react';
import { format, addWeeks, subWeeks, addDays, subDays, addMonths, subMonths, addHours, subHours, startOfWeek, startOfMonth, endOfWeek, endOfMonth } from 'date-fns';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import {
  getAvailablePlans,
  loadPlan,
  savePlan,
  renamePlanInStore,
  deletePlanFromStore,
  generatePlanId,
  DEFAULT_PLAN_ID,
  DEFAULT_PLAN_NAME,
  type PlanInfo,
  type PlanData,
  BUCKET_DEFAULT_PLAN_ID,
} from '@/lib/planStore';
import type { Task, VerticalTask, TimelineViewMode, RotationMode, RowHeightLevel, SubProcessViewMode } from './types';
import { Input } from '@/components/ui/input';
import { useLayout } from '@/contexts/LayoutContext';

interface TimelineToolbarProps {
  currentStartDate: Date;
  onDateChange: (date: Date) => void;
  zoomLevel: number;
  onZoomChange: (newZoomLevel: number) => void;
  minZoom?: number;
  maxZoom?: number;
  viewMode: 'horizontal' | 'vertical';
  onViewModeChange: (mode: 'horizontal' | 'vertical') => void;
  timelineViewMode: TimelineViewMode;
  onTimelineViewModeChange: (mode: TimelineViewMode) => void;
  rotationMode: RotationMode;
  onRotationModeChange: (mode: RotationMode) => void;
  rowHeightLevel: RowHeightLevel;
  onRowHeightLevelChange: (level: RowHeightLevel) => void;
  currentHorizontalTasks: Task[];
  currentVerticalTasks: VerticalTask[];
  onLoadPlan: (planData: PlanData, planName: string) => void;
  activePlanId: string;
  onActivePlanChange: (planId: string, planName: string) => void;
  onOpenPullForwardDialog: () => void;
  subProcessViewMode: SubProcessViewMode | null;
  onSetSubProcessViewMode: (mode: SubProcessViewMode) => void;
  onOpenConsolidateStripsDialog: () => void;
  onOpenUnplannedListDialog: () => void; 
  onOpenSearchToolDialog: () => void;
}

export function TimelineToolbar({
  currentStartDate,
  onDateChange,
  zoomLevel,
  onZoomChange,
  minZoom = 10,
  maxZoom = 100,
  viewMode,
  onViewModeChange,
  timelineViewMode,
  onTimelineViewModeChange,
  rotationMode,
  onRotationModeChange,
  rowHeightLevel,
  onRowHeightLevelChange,
  currentHorizontalTasks,
  currentVerticalTasks,
  onLoadPlan,
  activePlanId,
  onActivePlanChange,
  onOpenPullForwardDialog,
  subProcessViewMode,
  onSetSubProcessViewMode,
  onOpenConsolidateStripsDialog,
  onOpenUnplannedListDialog, 
  onOpenSearchToolDialog, 
}: TimelineToolbarProps) {
  const { toast } = useToast();
  const [availablePlans, setAvailablePlans] = React.useState<PlanInfo[]>([]);
  const { isMaximized, toggleMaximized } = useLayout();

  React.useEffect(() => {
    setAvailablePlans(getAvailablePlans());
  }, []);

  const refreshAvailablePlans = () => setAvailablePlans(getAvailablePlans());

  const handleRenamePlan = () => {
    if (!activePlanId) {
      toast({ title: "No Active Plan", description: "Please load or save a plan first.", variant: "destructive" });
      return;
    }
    const currentPlan = availablePlans.find(p => p.id === activePlanId);
    const newName = prompt("Enter new plan name:", currentPlan?.name || "");
    if (newName && newName.trim() !== "") {
      if (renamePlanInStore(activePlanId, newName.trim())) {
        onActivePlanChange(activePlanId, newName.trim());
        refreshAvailablePlans();
        toast({ title: "Plan Renamed", description: `Plan renamed to "${newName.trim()}".` });
      } else {
        toast({ title: "Rename Failed", description: "Could not find the plan to rename.", variant: "destructive" });
      }
    }
  };

  const handleSavePlan = () => {
    if (!activePlanId) {
      toast({ title: "Cannot Save", description: "No active plan selected. Use 'Save Plan As'.", variant: "destructive" });
      return;
    }
    const planInfo = availablePlans.find(p => p.id === activePlanId);
    if (!planInfo) {
       toast({ title: "Error", description: "Active plan info not found.", variant: "destructive"});
       return;
    }
    const currentPlanData = loadPlan(activePlanId);
    const planDataToSave: PlanData = {
      horizontalTasks: currentHorizontalTasks,
      verticalTasks: currentVerticalTasks,
      bucketScheduledTasks: currentPlanData?.bucketScheduledTasks || [],
      bucketUnscheduledOrders: currentPlanData?.bucketUnscheduledOrders || [],
    };
    savePlan(activePlanId, planInfo.name, planDataToSave);
    refreshAvailablePlans();
    toast({ title: "Plan Saved", description: `Plan "${planInfo.name}" saved successfully.` });
  };

  const handleSavePlanAs = () => {
    const newName = prompt("Enter name for the new plan:");
    if (newName && newName.trim() !== "") {
      const newPlanId = generatePlanId();
      const currentBucketPlanData = loadPlan(activePlanId); // Load existing plan to preserve bucket data if any
      const planDataToSave: PlanData = {
        horizontalTasks: currentHorizontalTasks,
        verticalTasks: currentVerticalTasks,
        bucketScheduledTasks: currentBucketPlanData?.bucketScheduledTasks || [], // Preserve or default
        bucketUnscheduledOrders: currentBucketPlanData?.bucketUnscheduledOrders || [], // Preserve or default
      };
      const savedInfo = savePlan(newPlanId, newName.trim(), planDataToSave);
      if (savedInfo) {
        onActivePlanChange(savedInfo.id, savedInfo.name);
        refreshAvailablePlans();
        toast({ title: "Plan Saved As", description: `Plan saved as "${newName.trim()}".` });
      } else {
        toast({ title: "Save Failed", description: "Could not save the new plan.", variant: "destructive" });
      }
    }
  };

  const handleLoadPlan = (planId: string) => {
    const planToLoad = loadPlan(planId);
    const planInfo = availablePlans.find(p => p.id === planId);
    if (planToLoad && planInfo) {
      onLoadPlan(planToLoad, planInfo.name);
      onActivePlanChange(planInfo.id, planInfo.name);
      toast({ title: "Plan Loaded", description: `Plan "${planInfo.name}" loaded.` });
    } else {
      toast({ title: "Load Failed", description: "Could not load the selected plan.", variant: "destructive" });
    }
  };

  const handleDeletePlan = () => {
    if (!activePlanId || activePlanId === DEFAULT_PLAN_ID || activePlanId === BUCKET_DEFAULT_PLAN_ID) {
      toast({ title: "Cannot Delete", description: "Default plans cannot be deleted or no plan is active.", variant: "destructive" });
      return;
    }
    if (confirm(`Are you sure you want to delete plan "${availablePlans.find(p=>p.id === activePlanId)?.name}"? This cannot be undone.`)) {
      if (deletePlanFromStore(activePlanId)) {
        toast({ title: "Plan Deleted", description: "The plan has been deleted." });
        const defaultPlanToLoad = loadPlan(DEFAULT_PLAN_ID) || { horizontalTasks: [], verticalTasks: [], bucketScheduledTasks: [], bucketUnscheduledOrders: []};
        onLoadPlan(defaultPlanToLoad, DEFAULT_PLAN_NAME);
        onActivePlanChange(DEFAULT_PLAN_ID, DEFAULT_PLAN_NAME);
        refreshAvailablePlans();
      } else {
        toast({ title: "Delete Failed", description: "Could not delete the plan.", variant: "destructive" });
      }
    }
  };

  const handlePreviousPeriod = () => {
    let newDate = currentStartDate;
    const step = timelineViewMode === 'hourly' ? 24 : (timelineViewMode === 'daily' ? 7 : 1);
    const unit = timelineViewMode === 'hourly' ? 'hours' : (timelineViewMode === 'daily' ? 'days' : (timelineViewMode === 'weekly' ? 'weeks' : 'months'));

    if (subProcessViewMode) newDate = subWeeks(currentStartDate, 1);
    else if (viewMode === 'horizontal') {
      if (unit === 'hours') newDate = subHours(currentStartDate, step);
      else if (unit === 'days') newDate = subDays(currentStartDate, step);
      else if (unit === 'weeks') newDate = subWeeks(currentStartDate, step);
      else if (unit === 'months') newDate = subMonths(currentStartDate, step);
    } else newDate = subDays(currentStartDate, 7);
    onDateChange(newDate);
  };

  const handleNextPeriod = () => {
    let newDate = currentStartDate;
    const step = timelineViewMode === 'hourly' ? 24 : (timelineViewMode === 'daily' ? 7 : 1);
    const unit = timelineViewMode === 'hourly' ? 'hours' : (timelineViewMode === 'daily' ? 'days' : (timelineViewMode === 'weekly' ? 'weeks' : 'months'));

    if (subProcessViewMode) newDate = addWeeks(currentStartDate, 1);
    else if (viewMode === 'horizontal') {
      if (unit === 'hours') newDate = addHours(currentStartDate, step);
      else if (unit === 'days') newDate = addDays(currentStartDate, step);
      else if (unit === 'weeks') newDate = addWeeks(currentStartDate, step);
      else if (unit === 'months') newDate = addMonths(currentStartDate, step);
    } else newDate = addDays(currentStartDate, 7);
    onDateChange(newDate);
  };
  
  const handlePreviousMonth = () => onDateChange(subMonths(currentStartDate, 1));
  const handleNextMonth = () => onDateChange(addMonths(currentStartDate, 1));

  const handleToday = () => onDateChange(new Date());
  const handleZoomSliderChange = (value: number[]) => onZoomChange(value[0]);

  const cycleRowHeight = (direction: 'increase' | 'decrease') => {
    const levels: RowHeightLevel[] = ['small', 'medium', 'large'];
    const currentIndex = levels.indexOf(rowHeightLevel);
    if (direction === 'increase') {
      onRowHeightLevelChange(levels[Math.min(levels.length - 1, currentIndex + 1)]);
    } else {
      onRowHeightLevelChange(levels[Math.max(0, currentIndex - 1)]);
    }
  };

  const cycleTimelineViewMode = (direction: 'in' | 'out') => {
    const modes: TimelineViewMode[] = ['monthly', 'weekly', 'daily', 'hourly'];
    const currentIndex = modes.indexOf(timelineViewMode);
    let nextIndex;
    if (direction === 'in') { 
      nextIndex = Math.min(modes.length -1, currentIndex + 1);
    } else { 
       nextIndex = Math.max(0, currentIndex - 1);
    }
     onTimelineViewModeChange(modes[nextIndex]);
  };

  const handleSubProcessViewChange = (mode: SubProcessViewMode) => {
    onSetSubProcessViewMode(mode);
  };

  return (
    <div className="flex items-center gap-2 p-2 border-b bg-card flex-shrink-0 shadow sticky top-0 z-30 h-14 overflow-x-auto">
      {/* Sequential Left-to-Right Layout - All controls in order */}
      
      {/* 1. Plan Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="default" size="sm" className="h-8 flex-shrink-0">
            <Edit3 className="mr-1 h-4 w-4" /> Plan Actions
            <ChevronDown className="ml-1 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onSelect={handleRenamePlan}>
            <FileEdit className="mr-2 h-4 w-4" /> Rename Plan
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={handleSavePlan}>
            <Save className="mr-2 h-4 w-4" /> Save Current Plan
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={handleSavePlanAs}>
            <SaveAll className="mr-2 h-4 w-4" /> Save Plan As...
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={handleDeletePlan} className="text-destructive focus:text-destructive">
            <Trash2 className="mr-2 h-4 w-4" /> Delete Current Plan
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 2. Plan Selector */}
      <Select value={activePlanId || ""} onValueChange={handleLoadPlan}>
        <SelectTrigger className="h-8 w-[130px] sm:w-[150px] text-xs flex-shrink-0">
          <ListChecks className="mr-1 h-3 w-3" />
          <SelectValue placeholder="Select Plan" />
        </SelectTrigger>
        <SelectContent>
          {availablePlans.length > 0 ? availablePlans.map(plan => (
            <SelectItem key={plan.id} value={plan.id}>{plan.name}</SelectItem>
          )) : (
            <SelectItem value="no-plans" disabled>No plans available</SelectItem>
          )}
        </SelectContent>
      </Select>

      {/* 3. Unplanned Button */}
      <Button variant="outline" size="sm" className="h-8 border-2 hover:border-orange-300 ui-hover-subtle ui-transition-normal ui-shadow-interactive flex-shrink-0" onClick={onOpenUnplannedListDialog}>
        <ClipboardList className="mr-1 h-4 w-4 text-orange-600" /> Unplanned
      </Button>

      {/* 4. Search Button */}
      <Button variant="outline" size="sm" className="h-8 border-2 hover:border-blue-300 ui-hover-subtle ui-transition-normal ui-shadow-interactive flex-shrink-0" onClick={onOpenSearchToolDialog}>
        <Search className="mr-1 h-4 w-4 text-blue-600" /> Search
      </Button>

      {/* 5. Quick Find Input */}
      <Input type="search" placeholder="Quick find..." className="h-8 text-xs w-32 sm:w-40 flex-shrink-0" />

      {/* 6. Navigation Arrows */}
      <Button variant="ghost" size="icon_sm" className="ui-hover-subtle ui-transition-normal ui-shadow-interactive flex-shrink-0" onClick={handlePreviousMonth} title="Previous Month">
        <ArrowLeft className="h-3 w-3 text-indigo-600" />
        <CalendarIcon className="h-3 w-3 text-indigo-600" />
      </Button>
      <Button variant="ghost" size="icon_sm" className="ui-hover-subtle ui-transition-normal ui-shadow-interactive flex-shrink-0" onClick={handlePreviousPeriod} title="Previous Period">
        <ArrowLeft className="h-4 w-4 text-blue-600" />
      </Button>

      {/* 7. Date Picker */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 text-xs w-[90px] sm:w-[100px] border-2 hover:border-gray-300 ui-hover-subtle ui-transition-normal ui-shadow-interactive flex-shrink-0">
            <CalendarIcon className="mr-1 h-3 w-3 text-gray-600" />
            {format(currentStartDate, 'MMM dd, yy')}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar mode="single" selected={currentStartDate} onSelect={(date) => date && onDateChange(date)} initialFocus />
        </PopoverContent>
      </Popover>

      <Button variant="ghost" size="icon_sm" className="ui-hover-subtle ui-transition-normal ui-shadow-interactive flex-shrink-0" onClick={handleNextPeriod} title="Next Period">
        <ArrowRight className="h-4 w-4 text-emerald-600" />
      </Button>
      <Button variant="ghost" size="icon_sm" className="ui-hover-subtle ui-transition-normal ui-shadow-interactive flex-shrink-0" onClick={handleNextMonth} title="Next Month">
        <CalendarIcon className="h-3 w-3 text-green-600" />
        <ArrowRight className="h-3 w-3 text-green-600" />
      </Button>
      <Button variant="ghost" size="icon_sm" className="ui-hover-subtle ui-transition-normal ui-shadow-interactive flex-shrink-0" onClick={handleToday} title="Today">
        <Home className="h-4 w-4 text-yellow-600" />
      </Button>

      {/* 8. View Controls */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 border-2 hover:border-violet-300 ui-hover-subtle ui-transition-normal ui-shadow-interactive flex-shrink-0">
            <ListTree className="mr-1 h-4 w-4 text-violet-600" />
            <span className="hidden sm:inline">Sub-Process</span>
            <ChevronDown className="ml-1 h-4 w-4 text-violet-600" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center">
          <DropdownMenuItem onSelect={() => handleSubProcessViewChange(null)} disabled={subProcessViewMode === null}>Main Planning View</DropdownMenuItem>
          <DropdownMenuSeparator/>
          <DropdownMenuItem onSelect={() => handleSubProcessViewChange('cutting')} disabled={subProcessViewMode === 'cutting'}>Cutting View</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => handleSubProcessViewChange('embroidery')} disabled={subProcessViewMode === 'embroidery'}>Embroidery View</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => handleSubProcessViewChange('finishing')} disabled={subProcessViewMode === 'finishing'}>Finishing View</DropdownMenuItem>
          <DropdownMenuSeparator/>
          <DropdownMenuItem onSelect={() => handleSubProcessViewChange('high-level-planning')} disabled={subProcessViewMode === 'high-level-planning'}>
            <Target className="mr-2 h-4 w-4" />
            High-Level Planning Board
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => handleSubProcessViewChange('low-level-planning')} disabled={subProcessViewMode === 'low-level-planning'}>
            <Zap className="mr-2 h-4 w-4" />
            Low-Level Planning Board
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {!subProcessViewMode && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon_sm" className="ui-hover-subtle ui-transition-normal ui-shadow-interactive flex-shrink-0" title="Settings">
              <Settings2 className="h-4 w-4 text-gray-600" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center">
            <DropdownMenuLabel>Main View Mode</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onViewModeChange('horizontal')} disabled={viewMode === 'horizontal'}>
              <LayoutPanelTop className="mr-2 h-4 w-4" />
              Horizontal View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onViewModeChange('vertical')} disabled={viewMode === 'vertical'}>
              <LayoutPanelLeft className="mr-2 h-4 w-4" />
              Vertical View
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* 9. Timeline Controls - Only show in horizontal mode and not in sub-process view */}
      {!subProcessViewMode && viewMode === 'horizontal' && (
        <>
          <Button variant="ghost" size="icon_sm" className="ui-hover-subtle ui-transition-normal ui-shadow-interactive flex-shrink-0" title="Zoom Out Scale" onClick={() => cycleTimelineViewMode('out')}>
            <ZoomOut className="h-4 w-4 text-red-600" />
          </Button>
          <Select value={timelineViewMode} onValueChange={(value) => onTimelineViewModeChange(value as TimelineViewMode)}>
            <SelectTrigger className="h-8 w-[75px] sm:w-[85px] text-xs border-2 hover:border-indigo-300 ui-hover-subtle ui-transition-normal flex-shrink-0" title="Timeline View">
              <SelectValue placeholder="View" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hourly"><Clock className="mr-2 h-3 w-3 inline-block" />Hourly</SelectItem>
              <SelectItem value="daily"><CalendarDays className="mr-2 h-3 w-3 inline-block" />Daily</SelectItem>
              <SelectItem value="weekly"><View className="mr-2 h-3 w-3 inline-block" />Weekly</SelectItem>
              <SelectItem value="monthly"><CalendarRange className="mr-2 h-3 w-3 inline-block" />Monthly</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon_sm" className="ui-hover-subtle ui-transition-normal ui-shadow-interactive flex-shrink-0" title="Zoom In Scale" onClick={() => cycleTimelineViewMode('in')}>
            <ZoomIn className="h-4 w-4 text-green-600" />
          </Button>

          <Select value={rotationMode} onValueChange={(value) => onRotationModeChange(value as RotationMode)}>
            <SelectTrigger className="h-8 w-[85px] sm:w-[95px] text-xs border-2 hover:border-pink-300 ui-hover-subtle ui-transition-normal flex-shrink-0" title="Rotational Display">
              <Palette className="mr-1 h-3 w-3 text-pink-600" />
              <SelectValue placeholder="Color By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="order">Order (Default)</SelectItem>
              <SelectItem value="product">Product</SelectItem>
              <SelectItem value="productType">Product Type</SelectItem>
              <SelectItem value="customer">Customer</SelectItem>
              <SelectItem value="delivery">Delivery Date</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="ghost" size="icon_sm" className="ui-hover-subtle ui-transition-normal ui-shadow-interactive flex-shrink-0" title="Decrease Row Height" onClick={() => cycleRowHeight('decrease')}>
            <ArrowBigDownDash className="h-4 w-4 text-amber-600" />
          </Button>
          <Button variant="ghost" size="icon_sm" className="ui-hover-subtle ui-transition-normal ui-shadow-interactive flex-shrink-0" title="Increase Row Height" onClick={() => cycleRowHeight('increase')}>
            <ArrowBigUpDash className="h-4 w-4 text-cyan-600" />
          </Button>
          <Slider
            value={[zoomLevel]} min={minZoom} max={maxZoom} step={1}
            className="w-[50px] sm:w-[60px] mx-1 flex-shrink-0" onValueChange={handleZoomSliderChange} aria-label="Zoom level"
          />
        </>
      )}

      {/* 10. Save */}
      <Button variant="ghost" size="icon_sm" className="ui-hover-subtle ui-transition-normal ui-shadow-interactive flex-shrink-0" title="Save Current Plan" onClick={handleSavePlan}>
        <Save className="h-4 w-4 text-emerald-600" />
      </Button>
      
      {/* 11. Filter */}
      <Button variant="ghost" size="icon_sm" className="ui-hover-subtle ui-transition-normal ui-shadow-interactive flex-shrink-0" title="Filter" onClick={onOpenSearchToolDialog}>
        <FilterIcon className="h-4 w-4 text-slate-600" />
      </Button>

      {/* 12. Pull Forward */}
      {!subProcessViewMode && (
        <Button variant="ghost" size="icon_sm" className="ui-hover-subtle ui-transition-normal ui-shadow-interactive flex-shrink-0" title="Pull Forward" onClick={onOpenPullForwardDialog}>
          <FastForward className="h-4 w-4 text-purple-600" />
        </Button>
      )}

      {/* 13. Consolidate */}
      {!subProcessViewMode && (
        <Button variant="ghost" size="icon_sm" className="ui-hover-subtle ui-transition-normal ui-shadow-interactive flex-shrink-0" title="Consolidate Strips" onClick={onOpenConsolidateStripsDialog}>
          <Layers className="h-4 w-4 text-teal-600" />
        </Button>
      )}

      {/* 14. Upload */}
      <Button variant="ghost" size="icon_sm" className="ui-hover-subtle ui-transition-normal ui-shadow-interactive flex-shrink-0" title="Upload" onClick={() => toast({ title: 'Action: Upload Plan', description: 'Open file dialog for upload.'})}>
        <UploadCloud className="h-4 w-4 text-sky-600" />
      </Button>

      {/* 15. Download */}
      <Button variant="ghost" size="icon_sm" className="ui-hover-subtle ui-transition-normal ui-shadow-interactive flex-shrink-0" title="Download" onClick={() => toast({ title: 'Action: Download Plan', description: 'Initiate plan download.'})}>
        <DownloadCloud className="h-4 w-4 text-orange-600" />
      </Button>

      {/* 16. Maximize Button */}
      <Button variant="ghost" size="icon_sm" className="ui-hover-subtle ui-transition-normal ui-shadow-interactive flex-shrink-0" title={isMaximized ? "Minimize View" : "Maximize View"} onClick={toggleMaximized}>
        {isMaximized ? <Minimize2 className="h-4 w-4 text-rose-600" /> : <Maximize2 className="h-4 w-4 text-rose-600" />}
      </Button>

    </div>
  );
}
