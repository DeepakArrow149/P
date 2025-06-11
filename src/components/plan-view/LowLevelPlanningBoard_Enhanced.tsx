"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { 
  Users,
  Clock,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  TrendingUp,
  TrendingDown,
  Minus,
  Settings,
  RefreshCw,
  Plus,
  Filter,
  Download,
  Play,
  Pause,
  RotateCcw,
  Zap,
  Target,
  Factory,
  Calendar,
  Timer,
  Activity,
  Wrench,
  Package,
  ArrowRight,
  ChevronRight,
  Edit,
  Save,
  X,
  Split,
  Move,
  Shuffle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, addHours, startOfDay, addDays, setHours, setMinutes, isWithinInterval, parseISO } from 'date-fns';

// Enhanced types for Low-Level Planning Board (LLPB)
interface DailyOrder {
  id: string;
  orderNo: string;
  styleNo: string;
  buyer: string;
  orderQty: number;
  styleSAM: number;
  allocatedLine: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  requiredHours: number;
  priority: 'high' | 'medium' | 'low';
  status: 'assigned' | 'in_progress' | 'paused' | 'completed' | 'delayed';
  efficiency: number;
  completedQty: number;
  changeoverTime: number; // minutes for line changeover
  color?: string;
  autoSplit: boolean;
  splitOrders?: DailyOrder[];
}

interface LineSchedule {
  lineId: string;
  lineName: string;
  factory: string;
  unit: string;
  date: string;
  shifts: DailyShift[];
  orders: DailyOrder[];
  totalCapacity: number;
  allocatedCapacity: number;
  utilizationPercent: number;
  changeoverBuffer: number; // minutes
  realTimeTracking: boolean;
}

interface DailyShift {
  id: string;
  shiftName: string;
  startTime: string;
  endTime: string;
  breakTime: number; // minutes
  plannedOutput: number;
  actualOutput: number;
  efficiency: number;
  operators: OperatorAssignment[];
  bottlenecks: Bottleneck[];
  status: 'planned' | 'active' | 'completed' | 'delayed';
  changeoverTime: number;
}

interface HourlyTarget {
  hour: string;
  timeSlot: string;
  target: number;
  actual: number;
  efficiency: number;
  cumulative: number;
  cumulativeTarget: number;
  variance: number;
  status: 'on_track' | 'behind' | 'ahead';
  orderId?: string;
  operation: string;
}

interface Bottleneck {
  id: string;
  location: string;
  lineId: string;
  type: 'operator' | 'machine' | 'material' | 'quality' | 'changeover';
  severity: 'critical' | 'warning' | 'minor';
  description: string;
  impactedOutput: number;
  estimatedResolution: string;
  startTime: string;
  resolutionTime?: string;
  assignedTo: string;
  cost: number;
  rootCause: string;
  preventiveAction: string;
}

interface DelayReason {
  id: string;
  lineId: string;
  type: 'maintenance' | 'late_input' | 'quality_issue' | 'absenteeism' | 'material_shortage' | 'changeover_delay';
  description: string;
  startTime: string;
  duration: number; // in minutes
  impact: number; // pieces lost
  rootCause: string;
  preventiveAction: string;
  responsible: string;
  cost: number;
}

interface OperatorAssignment {
  operatorId: string;
  operatorName: string;
  position: string;
  efficiency: number;
  present: boolean;
  shiftId: string;
  lineId: string;
  skills: string[];
  trainingLevel: 'basic' | 'intermediate' | 'advanced' | 'expert';
  hourlyRate: number;
  productivityScore: number;
}

interface GanttTimeSlot {
  date: string;
  hour: string;
  timeSlot: string;
  lines: {
    [lineId: string]: {
      orderId?: string;
      orderNo?: string;
      progress: number;
      status: string;
      efficiency: number;
      operation: string;
      changeoverActive: boolean;
    };
  };
}

interface PerformanceMetrics {
  lineId: string;
  date: string;
  shift: string;
  plannedVsActual: {
    planned: number;
    actual: number;
    variance: number;
    variancePercent: number;
  };
  efficiency: {
    hourly: number[];
    average: number;
    trend: 'improving' | 'declining' | 'stable';
  };
  quality: {
    defectRate: number;
    reworkRate: number;
    firstPassYield: number;
  };
  changeover: {
    plannedTime: number;
    actualTime: number;
    variance: number;
    efficiency: number;
  };
}

// Mock data for LLPB
const mockDailyOrders: DailyOrder[] = [
  {
    id: 'DO-001',
    orderNo: 'ORD-2024-001',
    styleNo: 'ST-001-POLO',
    buyer: 'Nike',
    orderQty: 1200,
    styleSAM: 25.5,
    allocatedLine: 'L1',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
    startTime: '08:00',
    endTime: '16:00',
    requiredHours: 8,
    priority: 'high',
    status: 'in_progress',
    efficiency: 92,
    completedQty: 480,
    changeoverTime: 30,
    color: '#10B981',
    autoSplit: true,
    splitOrders: []
  },
  {
    id: 'DO-002',
    orderNo: 'ORD-2024-002',
    styleNo: 'ST-002-SHIRT',
    buyer: 'Adidas',
    orderQty: 800,
    styleSAM: 18.2,
    allocatedLine: 'L2',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    startTime: '08:00',
    endTime: '14:00',
    requiredHours: 6,
    priority: 'medium',
    status: 'assigned',
    efficiency: 85,
    completedQty: 0,
    changeoverTime: 20,
    color: '#F59E0B',
    autoSplit: false
  },
  {
    id: 'DO-003',
    orderNo: 'ORD-2024-003',
    styleNo: 'ST-003-JACKET',
    buyer: 'Puma',
    orderQty: 400,
    styleSAM: 45.8,
    allocatedLine: 'L3',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(addDays(new Date(), 2), 'yyyy-MM-dd'),
    startTime: '08:00',
    endTime: '18:00',
    requiredHours: 10,
    priority: 'low',
    status: 'delayed',
    efficiency: 68,
    completedQty: 85,
    changeoverTime: 45,
    color: '#EF4444',
    autoSplit: true
  }
];

const mockLineSchedules: LineSchedule[] = [
  {
    lineId: 'L1',
    lineName: 'Line 1 - Sewing',
    factory: 'Factory A',
    unit: 'Unit 1',
    date: format(new Date(), 'yyyy-MM-dd'),
    shifts: [],
    orders: mockDailyOrders.filter(order => order.allocatedLine === 'L1'),
    totalCapacity: 8,
    allocatedCapacity: 8,
    utilizationPercent: 100,
    changeoverBuffer: 30,
    realTimeTracking: true
  },
  {
    lineId: 'L2',
    lineName: 'Line 2 - Sewing',
    factory: 'Factory A',
    unit: 'Unit 1',
    date: format(new Date(), 'yyyy-MM-dd'),
    shifts: [],
    orders: mockDailyOrders.filter(order => order.allocatedLine === 'L2'),
    totalCapacity: 8,
    allocatedCapacity: 6,
    utilizationPercent: 75,
    changeoverBuffer: 20,
    realTimeTracking: true
  },
  {
    lineId: 'L3',
    lineName: 'Line 3 - Cutting',
    factory: 'Factory B',
    unit: 'Unit 2',
    date: format(new Date(), 'yyyy-MM-dd'),
    shifts: [],
    orders: mockDailyOrders.filter(order => order.allocatedLine === 'L3'),
    totalCapacity: 10,
    allocatedCapacity: 10,
    utilizationPercent: 100,
    changeoverBuffer: 45,
    realTimeTracking: true
  }
];

const mockHourlyTargets: HourlyTarget[] = [
  { hour: '08:00', timeSlot: '08:00-09:00', target: 150, actual: 142, efficiency: 95, cumulative: 142, cumulativeTarget: 150, variance: -8, status: 'behind', orderId: 'DO-001', operation: 'Front Panel' },
  { hour: '09:00', timeSlot: '09:00-10:00', target: 150, actual: 158, efficiency: 105, cumulative: 300, cumulativeTarget: 300, variance: 0, status: 'on_track', orderId: 'DO-001', operation: 'Back Panel' },
  { hour: '10:00', timeSlot: '10:00-11:00', target: 150, actual: 145, efficiency: 97, cumulative: 445, cumulativeTarget: 450, variance: -5, status: 'behind', orderId: 'DO-001', operation: 'Sleeve Attach' },
  { hour: '11:00', timeSlot: '11:00-12:00', target: 150, actual: 165, efficiency: 110, cumulative: 610, cumulativeTarget: 600, variance: 10, status: 'ahead', orderId: 'DO-001', operation: 'Side Seams' },
  { hour: '12:00', timeSlot: '12:00-13:00', target: 100, actual: 95, efficiency: 95, cumulative: 705, cumulativeTarget: 700, variance: 5, status: 'on_track', orderId: 'DO-001', operation: 'Lunch Break' },
  { hour: '13:00', timeSlot: '13:00-14:00', target: 150, actual: 155, efficiency: 103, cumulative: 860, cumulativeTarget: 850, variance: 10, status: 'ahead', orderId: 'DO-001', operation: 'Collar Attach' },
  { hour: '14:00', timeSlot: '14:00-15:00', target: 150, actual: 140, efficiency: 93, cumulative: 1000, cumulativeTarget: 1000, variance: 0, status: 'on_track', orderId: 'DO-001', operation: 'Button Holes' },
  { hour: '15:00', timeSlot: '15:00-16:00', target: 150, actual: 148, efficiency: 99, cumulative: 1148, cumulativeTarget: 1150, variance: -2, status: 'on_track', orderId: 'DO-001', operation: 'Final Check' }
];

const mockBottlenecks: Bottleneck[] = [
  {
    id: 'BN-001',
    location: 'Line 1 - Operation 5',
    lineId: 'L1',
    type: 'operator',
    severity: 'warning',
    description: 'Operator skill gap at button attach station',
    impactedOutput: 25,
    estimatedResolution: '2 hours',
    startTime: '11:30',
    assignedTo: 'Supervisor Maria',
    cost: 150,
    rootCause: 'New operator training required',
    preventiveAction: 'Schedule cross-training session'
  },
  {
    id: 'BN-002',
    location: 'Line 3 - Cutting Station',
    lineId: 'L3',
    type: 'machine',
    severity: 'critical',
    description: 'Cutting blade needs replacement',
    impactedOutput: 45,
    estimatedResolution: '1 hour',
    startTime: '14:15',
    assignedTo: 'Technician John',
    cost: 300,
    rootCause: 'Scheduled maintenance overdue',
    preventiveAction: 'Implement preventive maintenance schedule'
  }
];

const mockDelayReasons: DelayReason[] = [
  {
    id: 'DR-001',
    lineId: 'L1',
    type: 'changeover_delay',
    description: 'Extended changeover time for complex style',
    startTime: '08:00',
    duration: 15,
    impact: 35,
    rootCause: 'Insufficient changeover preparation',
    preventiveAction: 'Improve changeover procedures',
    responsible: 'Production Supervisor',
    cost: 85
  },
  {
    id: 'DR-002',
    lineId: 'L3',
    type: 'material_shortage',
    description: 'Fabric roll shortage causing delays',
    startTime: '10:30',
    duration: 45,
    impact: 120,
    rootCause: 'Late supplier delivery',
    preventiveAction: 'Implement supplier buffer stock',
    responsible: 'Material Planning',
    cost: 280
  }
];

interface LowLevelPlanningBoardProps {
  className?: string;
}

export const LowLevelPlanningBoardEnhanced = React.memo(({ className }: LowLevelPlanningBoardProps) => {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedShift, setSelectedShift] = useState('all');
  const [selectedLine, setSelectedLine] = useState('all');
  const [activeTab, setActiveTab] = useState('gantt');
  const [realTimeUpdates, setRealTimeUpdates] = useState(true);
  const [viewMode, setViewMode] = useState<'daily' | 'hourly'>('hourly');
  const [showChangeoverTimes, setShowChangeoverTimes] = useState(true);
  
  // Drag and drop state
  const [draggedOrder, setDraggedOrder] = useState<DailyOrder | null>(null);
  const [orders, setOrders] = useState(mockDailyOrders);
  const [lineSchedules, setLineSchedules] = useState(mockLineSchedules);

  // Filter data based on selections
  const filteredLineSchedules = useMemo(() => {
    return lineSchedules.filter(schedule => {
      const matchesDate = schedule.date === selectedDate;
      const matchesLine = selectedLine === 'all' || schedule.lineId === selectedLine;
      return matchesDate && matchesLine;
    });
  }, [lineSchedules, selectedDate, selectedLine]);

  // Generate Gantt chart time slots
  const timeSlots = useMemo(() => {
    const slots: GanttTimeSlot[] = [];
    const startHour = 8;
    const endHour = 18;
    
    for (let hour = startHour; hour < endHour; hour++) {
      const timeSlot: GanttTimeSlot = {
        date: selectedDate,
        hour: hour.toString().padStart(2, '0') + ':00',
        timeSlot: `${hour.toString().padStart(2, '0')}:00-${(hour + 1).toString().padStart(2, '0')}:00`,
        lines: {}
      };

      filteredLineSchedules.forEach(schedule => {
        const activeOrder = schedule.orders.find(order => {
          const orderStartHour = parseInt(order.startTime.split(':')[0]);
          const orderEndHour = parseInt(order.endTime.split(':')[0]);
          return hour >= orderStartHour && hour < orderEndHour;
        });

        timeSlot.lines[schedule.lineId] = activeOrder ? {
          orderId: activeOrder.id,
          orderNo: activeOrder.orderNo,
          progress: (activeOrder.completedQty / activeOrder.orderQty) * 100,
          status: activeOrder.status,
          efficiency: activeOrder.efficiency,
          operation: mockHourlyTargets.find(ht => ht.hour === timeSlot.hour)?.operation || 'Production',
          changeoverActive: hour === parseInt(activeOrder.startTime.split(':')[0]) && activeOrder.changeoverTime > 0
        } : {
          progress: 0,
          status: 'idle',
          efficiency: 0,
          operation: 'Idle',
          changeoverActive: false
        };
      });

      slots.push(timeSlot);
    }
    
    return slots;
  }, [filteredLineSchedules, selectedDate]);

  // Utility functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'delayed': return 'bg-red-100 text-red-800 border-red-200';
      case 'paused': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'assigned': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'in_progress': return <Play className="h-4 w-4 text-blue-600" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'delayed': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'paused': return <Pause className="h-4 w-4 text-yellow-600" />;
      case 'assigned': return <Clock className="h-4 w-4 text-gray-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 100) return 'text-green-600';
    if (efficiency >= 90) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getUtilizationColor = (utilization: number) => {
    if (utilization > 100) return 'bg-red-500';
    if (utilization > 85) return 'bg-yellow-500';
    if (utilization > 50) return 'bg-blue-500';
    return 'bg-green-500';
  };

  // Auto-split order functionality
  const handleAutoSplitOrder = useCallback((orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order || !order.autoSplit) return;

    const optimalBatchSize = Math.ceil(order.orderQty / 3); // Split into 3 batches
    const splitOrders: DailyOrder[] = [];

    for (let i = 0; i < 3; i++) {
      const splitQty = i === 2 ? order.orderQty - (optimalBatchSize * 2) : optimalBatchSize;
      const splitOrder: DailyOrder = {
        ...order,
        id: `${order.id}-SPLIT-${i + 1}`,
        orderQty: splitQty,
        requiredHours: (order.requiredHours / 3),
        completedQty: 0,
        status: 'assigned'
      };
      splitOrders.push(splitOrder);
    }

    setOrders(prev => prev.map(o => 
      o.id === orderId 
        ? { ...o, splitOrders, status: 'assigned' }
        : o
    ));
  }, [orders]);

  // Drag and drop handlers
  const handleDragEnd = useCallback((result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    // Handle order reallocation between lines
    const [, , lineId, timeSlot] = destination.droppableId.split('-');
    const draggedOrder = orders.find(o => o.id === draggableId);
    
    if (!draggedOrder) return;

    // Update order allocation
    setOrders(prev => prev.map(order => 
      order.id === draggableId 
        ? { ...order, allocatedLine: lineId }
        : order
    ));

    // Update line schedules
    setLineSchedules(prev => prev.map(schedule => ({
      ...schedule,
      orders: schedule.lineId === lineId 
        ? [...schedule.orders.filter(o => o.id !== draggableId), draggedOrder]
        : schedule.orders.filter(o => o.id !== draggableId)
    })));
  }, [orders]);

  // Performance tracking
  const calculatePerformanceMetrics = useCallback((lineId: string): PerformanceMetrics => {
    const schedule = lineSchedules.find(s => s.lineId === lineId);
    if (!schedule) {
      return {
        lineId,
        date: selectedDate,
        shift: 'Day',
        plannedVsActual: { planned: 0, actual: 0, variance: 0, variancePercent: 0 },
        efficiency: { hourly: [], average: 0, trend: 'stable' },
        quality: { defectRate: 0, reworkRate: 0, firstPassYield: 100 },
        changeover: { plannedTime: 0, actualTime: 0, variance: 0, efficiency: 100 }
      };
    }

    const plannedOutput = schedule.orders.reduce((sum, order) => sum + order.orderQty, 0);
    const actualOutput = schedule.orders.reduce((sum, order) => sum + order.completedQty, 0);
    const avgEfficiency = schedule.orders.reduce((sum, order) => sum + order.efficiency, 0) / schedule.orders.length || 0;

    return {
      lineId,
      date: selectedDate,
      shift: 'Day',
      plannedVsActual: {
        planned: plannedOutput,
        actual: actualOutput,
        variance: actualOutput - plannedOutput,
        variancePercent: plannedOutput > 0 ? ((actualOutput - plannedOutput) / plannedOutput) * 100 : 0
      },
      efficiency: {
        hourly: mockHourlyTargets.map(ht => ht.efficiency),
        average: avgEfficiency,
        trend: avgEfficiency > 95 ? 'improving' : avgEfficiency < 85 ? 'declining' : 'stable'
      },
      quality: {
        defectRate: 2.5,
        reworkRate: 1.2,
        firstPassYield: 96.3
      },
      changeover: {
        plannedTime: schedule.changeoverBuffer,
        actualTime: schedule.changeoverBuffer + 5,
        variance: 5,
        efficiency: 85
      }
    };
  }, [lineSchedules, selectedDate]);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Zap className="h-6 w-6 text-orange-600" />
            Low-Level Planning Board (Enhanced)
          </h2>
          <p className="text-muted-foreground">Daily Gantt-style timeline with line-specific assignment and real-time tracking</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant={realTimeUpdates ? "default" : "outline"} 
            size="sm"
            onClick={() => setRealTimeUpdates(!realTimeUpdates)}
          >
            {realTimeUpdates ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
            Real-time
          </Button>
          <Button 
            variant={showChangeoverTimes ? "default" : "outline"} 
            size="sm"
            onClick={() => setShowChangeoverTimes(!showChangeoverTimes)}
          >
            <Timer className="h-4 w-4 mr-2" />
            Changeover
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Daily Timeline Controls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Date</label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Line</label>
              <Select value={selectedLine} onValueChange={setSelectedLine}>
                <SelectTrigger>
                  <SelectValue placeholder="All Lines" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Lines</SelectItem>
                  {lineSchedules.map(schedule => (
                    <SelectItem key={schedule.lineId} value={schedule.lineId}>
                      {schedule.lineName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">View Mode</label>
              <Select value={viewMode} onValueChange={(value: 'daily' | 'hourly') => setViewMode(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Hourly View</SelectItem>
                  <SelectItem value="daily">Daily View</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Auto-Split</label>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => orders.forEach(order => {
                    if (order.autoSplit && order.orderQty > 500) {
                      handleAutoSplitOrder(order.id);
                    }
                  })}
                >
                  <Split className="h-4 w-4 mr-1" />
                  Split Large Orders
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Actions</label>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Shuffle className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="gantt">Daily Gantt Timeline</TabsTrigger>
          <TabsTrigger value="performance">Real-time Performance</TabsTrigger>
          <TabsTrigger value="changeover">Changeover Analysis</TabsTrigger>
          <TabsTrigger value="split">Auto-Split Orders</TabsTrigger>
        </TabsList>

        {/* Daily Gantt Timeline Tab */}
        <TabsContent value="gantt" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Line vs Time Gantt View - {format(new Date(selectedDate), 'MMM dd, yyyy')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DragDropContext onDragEnd={handleDragEnd}>
                <div className="overflow-x-auto">
                  <div className="min-w-[1200px]">
                    {/* Time Header */}
                    <div className="grid grid-cols-12 gap-1 mb-4 p-4 bg-muted/30 rounded-lg">
                      <div className="col-span-2 font-medium text-sm">Production Line</div>
                      {timeSlots.slice(0, 10).map((slot, index) => (
                        <div key={index} className="text-center font-medium text-xs">
                          {slot.hour}
                        </div>
                      ))}
                    </div>

                    {/* Line Rows */}
                    <div className="space-y-2">
                      {filteredLineSchedules.map(schedule => (
                        <div key={schedule.lineId} className="grid grid-cols-12 gap-1 items-center p-2 border rounded-lg hover:bg-muted/20">
                          {/* Line Info */}
                          <div className="col-span-2 space-y-1">
                            <div className="font-medium text-sm">{schedule.lineName}</div>
                            <div className="text-xs text-muted-foreground">
                              {schedule.factory} • {schedule.unit}
                            </div>
                            <div className="flex items-center gap-2">
                              <div className={cn("w-2 h-2 rounded-full", getUtilizationColor(schedule.utilizationPercent))} />
                              <span className="text-xs">{schedule.utilizationPercent}% utilized</span>
                            </div>
                          </div>

                          {/* Time Slots */}
                          {timeSlots.slice(0, 10).map((slot, index) => {
                            const lineData = slot.lines[schedule.lineId];
                            return (
                              <Droppable key={index} droppableId={`slot-${index}-${schedule.lineId}-${slot.hour}`}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className={cn(
                                      "h-16 border rounded p-1 text-xs transition-colors",
                                      snapshot.isDraggingOver ? "bg-blue-100 border-blue-300" : "bg-white border-gray-200",
                                      lineData?.orderId ? getStatusColor(lineData.status) : "bg-gray-50"
                                    )}
                                  >
                                    {lineData?.orderId ? (
                                      <Draggable draggableId={lineData.orderId} index={index}>
                                        {(provided, snapshot) => (
                                          <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                            className={cn(
                                              "h-full w-full rounded p-1 cursor-grab",
                                              snapshot.isDragging ? "shadow-lg opacity-90" : "",
                                              lineData.changeoverActive ? "border-2 border-orange-400" : ""
                                            )}
                                            style={{
                                              backgroundColor: orders.find(o => o.id === lineData.orderId)?.color || '#e5e5e5',
                                              ...provided.draggableProps.style
                                            }}
                                          >
                                            <div className="font-medium truncate">{lineData.orderNo}</div>
                                            <div className="text-xs truncate">{lineData.operation}</div>
                                            <div className="flex items-center justify-between mt-1">
                                              <span className={cn("text-xs font-medium", getEfficiencyColor(lineData.efficiency))}>
                                                {lineData.efficiency}%
                                              </span>
                                              {lineData.changeoverActive && (
                                                <Timer className="h-3 w-3 text-orange-500" />
                                              )}
                                            </div>
                                            <Progress value={lineData.progress} className="h-1 mt-1" />
                                          </div>
                                        )}
                                      </Draggable>
                                    ) : (
                                      <div className="h-full flex items-center justify-center text-muted-foreground">
                                        Idle
                                      </div>
                                    )}
                                    {provided.placeholder}
                                  </div>
                                )}
                              </Droppable>
                            );
                          })}
                        </div>
                      ))}
                    </div>

                    {/* Legend */}
                    <div className="mt-6 p-4 bg-muted/20 rounded-lg">
                      <h4 className="font-medium mb-2">Legend</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-blue-100 border border-blue-200 rounded" />
                          <span>In Progress</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-100 border border-green-200 rounded" />
                          <span>Completed</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-red-100 border border-red-200 rounded" />
                          <span>Delayed</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Timer className="h-3 w-3 text-orange-500" />
                          <span>Changeover Active</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </DragDropContext>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Real-time Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredLineSchedules.map(schedule => {
              const metrics = calculatePerformanceMetrics(schedule.lineId);
              return (
                <Card key={schedule.lineId}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{schedule.lineName}</span>
                      <Badge className={getStatusColor('in_progress')}>
                        Live Tracking
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Key Metrics */}
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center p-2 bg-muted/20 rounded">
                        <div className="font-bold text-lg">{metrics.plannedVsActual.actual}</div>
                        <div className="text-muted-foreground">Actual Output</div>
                      </div>
                      <div className="text-center p-2 bg-muted/20 rounded">
                        <div className={cn("font-bold text-lg", getEfficiencyColor(metrics.efficiency.average))}>
                          {metrics.efficiency.average.toFixed(1)}%
                        </div>
                        <div className="text-muted-foreground">Efficiency</div>
                      </div>
                      <div className="text-center p-2 bg-muted/20 rounded">
                        <div className="font-bold text-lg">{metrics.quality.firstPassYield}%</div>
                        <div className="text-muted-foreground">First Pass Yield</div>
                      </div>
                    </div>

                    {/* Hourly Performance Chart */}
                    <div>
                      <h4 className="font-medium mb-2">Hourly Performance</h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Time</TableHead>
                            <TableHead>Target</TableHead>
                            <TableHead>Actual</TableHead>
                            <TableHead>Efficiency</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {mockHourlyTargets.slice(0, 6).map((target, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{target.timeSlot}</TableCell>
                              <TableCell>{target.target}</TableCell>
                              <TableCell>{target.actual}</TableCell>
                              <TableCell>
                                <span className={getEfficiencyColor(target.efficiency)}>
                                  {target.efficiency}%
                                </span>
                              </TableCell>
                              <TableCell>
                                <Badge variant={target.status === 'on_track' ? 'default' : 
                                              target.status === 'ahead' ? 'secondary' : 'destructive'}>
                                  {target.status.replace('_', ' ')}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Changeover Analysis Tab */}
        <TabsContent value="changeover" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Timer className="h-5 w-5" />
                  Changeover Time Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orders.map(order => (
                    <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{order.orderNo}</div>
                        <div className="text-sm text-muted-foreground">{order.styleNo}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{order.changeoverTime} min</div>
                        <div className="text-xs text-muted-foreground">Changeover Time</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Changeover Buffer Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredLineSchedules.map(schedule => (
                    <div key={schedule.lineId} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{schedule.lineName}</span>
                        <Badge variant="outline">{schedule.changeoverBuffer} min buffer</Badge>
                      </div>
                      <Progress 
                        value={(schedule.changeoverBuffer / 60) * 100} 
                        className="h-2"
                      />
                      <div className="text-xs text-muted-foreground mt-1">
                        Buffer utilization: {Math.round((schedule.changeoverBuffer / 60) * 100)}%
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Auto-Split Orders Tab */}
        <TabsContent value="split" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Split className="h-5 w-5" />
                Auto-Split Order Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orders.filter(order => order.orderQty > 500).map(order => (
                  <div key={order.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="font-medium">{order.orderNo}</div>
                        <div className="text-sm text-muted-foreground">
                          {order.orderQty.toLocaleString()} pieces • {order.styleSAM} SAM • {order.requiredHours}h
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={order.autoSplit ? "default" : "outline"}>
                          {order.autoSplit ? "Auto-Split Enabled" : "Manual Split"}
                        </Badge>
                        <Button 
                          size="sm" 
                          onClick={() => handleAutoSplitOrder(order.id)}
                          disabled={!order.autoSplit}
                        >
                          <Split className="h-4 w-4 mr-1" />
                          Split Order
                        </Button>
                      </div>
                    </div>

                    {order.splitOrders && order.splitOrders.length > 0 && (
                      <div className="mt-4 p-3 bg-muted/20 rounded">
                        <h4 className="font-medium mb-2">Split Batches:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          {order.splitOrders.map((splitOrder, index) => (
                            <div key={splitOrder.id} className="p-2 bg-white border rounded text-sm">
                              <div className="font-medium">Batch {index + 1}</div>
                              <div className="text-muted-foreground">
                                {splitOrder.orderQty} pieces • {splitOrder.requiredHours}h
                              </div>
                              <Badge className={getStatusColor(splitOrder.status)} variant="outline">
                                {splitOrder.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* SAM and Efficiency recommendations */}
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                      <div className="text-sm">
                        <div className="font-medium text-blue-900 mb-1">Auto-Split Recommendations:</div>
                        <div className="text-blue-700">
                          • Optimal batch size: {Math.ceil(order.orderQty / 3).toLocaleString()} pieces
                        </div>
                        <div className="text-blue-700">
                          • Estimated efficiency gain: +8-12%
                        </div>
                        <div className="text-blue-700">
                          • Reduced changeover impact: {order.changeoverTime * 3} min total
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
});

LowLevelPlanningBoardEnhanced.displayName = 'LowLevelPlanningBoardEnhanced';

export default LowLevelPlanningBoardEnhanced;
