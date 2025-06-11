"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
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
  Factory
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, addHours, startOfDay, addDays } from 'date-fns';

// Types for Low-Level Planning Board
interface ShiftData {
  id: string;
  shiftName: string;
  startTime: string;
  endTime: string;
  date: string;
  lineId: string;
  lineName: string;
  plannedOperators: number;
  actualOperators: number;
  absentOperators: number;
  plannedOutput: number;
  actualOutput: number;
  hourlyTargets: HourlyTarget[];
  currentStage: string;
  bottlenecks: Bottleneck[];
  delayReasons: DelayReason[];
  status: 'on_track' | 'at_risk' | 'delayed' | 'completed';
  efficiency: number;
  wipCount: number;
}

interface HourlyTarget {
  hour: string;
  target: number;
  actual: number;
  efficiency: number;
  cumulative: number;
}

interface Bottleneck {
  id: string;
  location: string;
  type: 'operator' | 'machine' | 'material' | 'quality';
  severity: 'critical' | 'warning';
  description: string;
  impactedOutput: number;
  estimatedResolution: string;
}

interface DelayReason {
  id: string;
  type: 'maintenance' | 'late_input' | 'quality_issue' | 'absenteeism' | 'material_shortage';
  description: string;
  startTime: string;
  duration: number; // in minutes
  impact: number; // pieces lost
}

interface OperatorAssignment {
  operatorId: string;
  operatorName: string;
  position: string;
  efficiency: number;
  present: boolean;
  shiftId: string;
  lineId: string;
}

// Mock data for demonstration
const mockShiftData: ShiftData[] = [
  {
    id: 'S001',
    shiftName: 'Day Shift A',
    startTime: '08:00',
    endTime: '16:00',
    date: format(new Date(), 'yyyy-MM-dd'),
    lineId: 'L1',
    lineName: 'Line 1 - Sewing',
    plannedOperators: 25,
    actualOperators: 23,
    absentOperators: 2,
    plannedOutput: 800,
    actualOutput: 720,
    currentStage: 'Sewing - Operations 5-8',
    status: 'at_risk',
    efficiency: 90,
    wipCount: 150,
    hourlyTargets: [
      { hour: '08:00', target: 100, actual: 95, efficiency: 95, cumulative: 95 },
      { hour: '09:00', target: 100, actual: 98, efficiency: 98, cumulative: 193 },
      { hour: '10:00', target: 100, actual: 105, efficiency: 105, cumulative: 298 },
      { hour: '11:00', target: 100, actual: 92, efficiency: 92, cumulative: 390 },
      { hour: '12:00', target: 100, actual: 88, efficiency: 88, cumulative: 478 },
      { hour: '13:00', target: 100, actual: 95, efficiency: 95, cumulative: 573 },
      { hour: '14:00', target: 100, actual: 90, efficiency: 90, cumulative: 663 },
      { hour: '15:00', target: 100, actual: 87, efficiency: 87, cumulative: 750 }
    ],
    bottlenecks: [
      {
        id: 'B001',
        location: 'Operation 6 - Button Attach',
        type: 'operator',
        severity: 'warning',
        description: 'Operator skill gap causing slowdown',
        impactedOutput: 20,
        estimatedResolution: '2 hours'
      }
    ],
    delayReasons: [
      {
        id: 'D001',
        type: 'maintenance',
        description: 'Sewing machine maintenance',
        startTime: '11:30',
        duration: 45,
        impact: 15
      }
    ]
  },
  {
    id: 'S002',
    shiftName: 'Day Shift B',
    startTime: '08:00',
    endTime: '16:00',
    date: format(new Date(), 'yyyy-MM-dd'),
    lineId: 'L2',
    lineName: 'Line 2 - Sewing',
    plannedOperators: 30,
    actualOperators: 30,
    absentOperators: 0,
    plannedOutput: 1000,
    actualOutput: 980,
    currentStage: 'Sewing - Operations 10-12',
    status: 'on_track',
    efficiency: 98,
    wipCount: 85,
    hourlyTargets: [
      { hour: '08:00', target: 125, actual: 120, efficiency: 96, cumulative: 120 },
      { hour: '09:00', target: 125, actual: 128, efficiency: 102, cumulative: 248 },
      { hour: '10:00', target: 125, actual: 125, efficiency: 100, cumulative: 373 },
      { hour: '11:00', target: 125, actual: 122, efficiency: 98, cumulative: 495 },
      { hour: '12:00', target: 125, actual: 130, efficiency: 104, cumulative: 625 },
      { hour: '13:00', target: 125, actual: 125, efficiency: 100, cumulative: 750 },
      { hour: '14:00', target: 125, actual: 118, efficiency: 94, cumulative: 868 },
      { hour: '15:00', target: 125, actual: 125, efficiency: 100, cumulative: 993 }
    ],
    bottlenecks: [],
    delayReasons: []
  }
];

const mockOperatorAssignments: OperatorAssignment[] = [
  { operatorId: 'OP001', operatorName: 'Sarah Johnson', position: 'Front Part', efficiency: 105, present: true, shiftId: 'S001', lineId: 'L1' },
  { operatorId: 'OP002', operatorName: 'Mike Chen', position: 'Back Part', efficiency: 98, present: true, shiftId: 'S001', lineId: 'L1' },
  { operatorId: 'OP003', operatorName: 'Lisa Wang', position: 'Sleeve Attach', efficiency: 88, present: false, shiftId: 'S001', lineId: 'L1' },
  { operatorId: 'OP004', operatorName: 'John Davis', position: 'Button Attach', efficiency: 75, present: true, shiftId: 'S001', lineId: 'L1' },
  { operatorId: 'OP005', operatorName: 'Maria Garcia', position: 'Final Check', efficiency: 110, present: true, shiftId: 'S001', lineId: 'L1' },
];

interface LowLevelPlanningBoardProps {
  className?: string;
}

export const LowLevelPlanningBoard = React.memo(({ className }: LowLevelPlanningBoardProps) => {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedShift, setSelectedShift] = useState('all');
  const [selectedLine, setSelectedLine] = useState('all');
  const [activeTab, setActiveTab] = useState('dayview');
  const [realTimeUpdates, setRealTimeUpdates] = useState(true);

  // Filter shift data based on selections
  const filteredShifts = useMemo(() => {
    return mockShiftData.filter(shift => {
      const matchesDate = shift.date === selectedDate;
      const matchesShift = selectedShift === 'all' || shift.id === selectedShift;
      const matchesLine = selectedLine === 'all' || shift.lineId === selectedLine;
      return matchesDate && matchesShift && matchesLine;
    });
  }, [selectedDate, selectedShift, selectedLine]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on_track': return 'bg-green-100 text-green-800 border-green-200';
      case 'at_risk': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'delayed': return 'bg-red-100 text-red-800 border-red-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'on_track': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'at_risk': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'delayed': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-blue-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getBottleneckIcon = (type: string) => {
    switch (type) {
      case 'operator': return <Users className="h-4 w-4 text-blue-500" />;
      case 'machine': return <Settings className="h-4 w-4 text-red-500" />;
      case 'material': return <Factory className="h-4 w-4 text-yellow-500" />;
      case 'quality': return <Target className="h-4 w-4 text-purple-500" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getDelayReasonIcon = (type: string) => {
    switch (type) {
      case 'maintenance': return <Settings className="h-4 w-4 text-red-500" />;
      case 'late_input': return <Clock className="h-4 w-4 text-orange-500" />;
      case 'quality_issue': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'absenteeism': return <Users className="h-4 w-4 text-blue-500" />;
      case 'material_shortage': return <Factory className="h-4 w-4 text-purple-500" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendIcon = (current: number, target: number) => {
    if (current > target) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (current < target * 0.9) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-yellow-600" />;
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header with Title and Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Zap className="h-6 w-6 text-orange-600" />
            Low-Level Planning Board
          </h2>
          <p className="text-muted-foreground">Execution-level view for day-to-day production monitoring</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant={realTimeUpdates ? "default" : "outline"} 
            size="sm"
            onClick={() => setRealTimeUpdates(!realTimeUpdates)}
          >
            {realTimeUpdates ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
            Real-time Updates
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters and Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Day/Shift Controls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Date</label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Shift</label>
              <Select value={selectedShift} onValueChange={setSelectedShift}>
                <SelectTrigger>
                  <SelectValue placeholder="All Shifts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Shifts</SelectItem>
                  <SelectItem value="S001">Day Shift A</SelectItem>
                  <SelectItem value="S002">Day Shift B</SelectItem>
                  <SelectItem value="S003">Night Shift</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Line</label>
              <Select value={selectedLine} onValueChange={setSelectedLine}>
                <SelectTrigger>
                  <SelectValue placeholder="All Lines" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Lines</SelectItem>
                  <SelectItem value="L1">Line 1 - Sewing</SelectItem>
                  <SelectItem value="L2">Line 2 - Sewing</SelectItem>
                  <SelectItem value="L3">Line 3 - Cutting</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Actions</label>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dayview">Day/Shift View</TabsTrigger>
          <TabsTrigger value="operators">Operator Mapping</TabsTrigger>
          <TabsTrigger value="progress">Progress Tracking</TabsTrigger>
          <TabsTrigger value="bottlenecks">Bottlenecks & Issues</TabsTrigger>
        </TabsList>

        {/* Day/Shift View Tab */}
        <TabsContent value="dayview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredShifts.map(shift => (
              <Card key={shift.id} className="border-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      {shift.shiftName}
                    </CardTitle>
                    <Badge className={getStatusColor(shift.status)}>
                      {getStatusIcon(shift.status)}
                      <span className="ml-1">{shift.status.replace('_', ' ')}</span>
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {shift.lineName} • {shift.startTime} - {shift.endTime}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Operators</div>
                      <div className="font-medium flex items-center gap-1">
                        {shift.actualOperators}/{shift.plannedOperators}
                        {shift.absentOperators > 0 && (
                          <Badge variant="destructive" className="text-xs px-1">
                            -{shift.absentOperators}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Output</div>
                      <div className="font-medium flex items-center gap-1">
                        {shift.actualOutput.toLocaleString()}/{shift.plannedOutput.toLocaleString()}
                        {getTrendIcon(shift.actualOutput, shift.plannedOutput)}
                      </div>
                    </div>
                  </div>

                  {/* Efficiency Progress */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Line Efficiency</span>
                      <span className="font-medium">{shift.efficiency}%</span>
                    </div>
                    <Progress 
                      value={shift.efficiency} 
                      className={cn(
                        "h-2",
                        shift.efficiency >= 95 ? "text-green-600" :
                        shift.efficiency >= 85 ? "text-yellow-600" :
                        "text-red-600"
                      )}
                    />
                  </div>

                  {/* Current Stage */}
                  <div>
                    <div className="text-sm text-muted-foreground">Current Stage</div>
                    <div className="font-medium">{shift.currentStage}</div>
                    <div className="text-sm text-muted-foreground">WIP Count: {shift.wipCount}</div>
                  </div>

                  {/* Hourly Progress (mini chart) */}
                  <div>
                    <div className="text-sm font-medium mb-2">Hourly Performance</div>
                    <div className="flex gap-1 h-8">
                      {shift.hourlyTargets.map((hour, index) => (
                        <div
                          key={index}
                          className={cn(
                            "flex-1 rounded-sm",
                            hour.efficiency >= 100 ? "bg-green-400" :
                            hour.efficiency >= 90 ? "bg-yellow-400" :
                            "bg-red-400"
                          )}
                          style={{ height: `${Math.min(hour.efficiency, 120)}%` }}
                          title={`${hour.hour}: ${hour.actual}/${hour.target} (${hour.efficiency}%)`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="h-4 w-4 mr-1" />
                      Details
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Settings className="h-4 w-4 mr-1" />
                      Adjust
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Operator Mapping Tab */}
        <TabsContent value="operators" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Operator Assignment & Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockOperatorAssignments.map(operator => (
                  <div key={operator.operatorId} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-3 h-3 rounded-full",
                        operator.present ? "bg-green-500" : "bg-red-500"
                      )} />
                      <div>
                        <div className="font-medium">{operator.operatorName}</div>
                        <div className="text-sm text-muted-foreground">{operator.position}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-medium">{operator.efficiency}%</div>
                        <div className="text-xs text-muted-foreground">Efficiency</div>
                      </div>
                      <Badge variant={operator.present ? "default" : "destructive"}>
                        {operator.present ? "Present" : "Absent"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Progress Tracking Tab */}
        <TabsContent value="progress" className="space-y-4">
          {filteredShifts.map(shift => (
            <Card key={shift.id}>
              <CardHeader>
                <CardTitle>{shift.shiftName} - Real-time Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Hourly breakdown table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Hour</th>
                          <th className="text-right p-2">Target</th>
                          <th className="text-right p-2">Actual</th>
                          <th className="text-right p-2">Efficiency</th>
                          <th className="text-right p-2">Cumulative</th>
                          <th className="text-center p-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {shift.hourlyTargets.map((hour, index) => (
                          <tr key={index} className="border-b">
                            <td className="p-2 font-medium">{hour.hour}</td>
                            <td className="p-2 text-right">{hour.target}</td>
                            <td className="p-2 text-right font-medium">{hour.actual}</td>
                            <td className="p-2 text-right">
                              <span className={cn(
                                "font-medium",
                                hour.efficiency >= 100 ? "text-green-600" :
                                hour.efficiency >= 90 ? "text-yellow-600" :
                                "text-red-600"
                              )}>
                                {hour.efficiency}%
                              </span>
                            </td>
                            <td className="p-2 text-right">{hour.cumulative}</td>
                            <td className="p-2 text-center">
                              {hour.efficiency >= 100 ? 
                                <CheckCircle className="h-4 w-4 text-green-600 mx-auto" /> :
                                hour.efficiency >= 90 ?
                                <AlertTriangle className="h-4 w-4 text-yellow-600 mx-auto" /> :
                                <XCircle className="h-4 w-4 text-red-600 mx-auto" />
                              }
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Bottlenecks & Issues Tab */}
        <TabsContent value="bottlenecks" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Active Bottlenecks */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Active Bottlenecks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredShifts.flatMap(shift => shift.bottlenecks).map(bottleneck => (
                    <div key={bottleneck.id} className="p-3 border rounded-lg">
                      <div className="flex items-start gap-3">
                        {getBottleneckIcon(bottleneck.type)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{bottleneck.location}</span>
                            <Badge 
                              variant={bottleneck.severity === 'critical' ? 'destructive' : 'secondary'}
                              className="text-xs"
                            >
                              {bottleneck.severity}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{bottleneck.description}</p>
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Impact: {bottleneck.impactedOutput} pcs/hr</span>
                            <span>ETA: {bottleneck.estimatedResolution}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Delay Reasons */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-red-500" />
                  Delay Reasons
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredShifts.flatMap(shift => shift.delayReasons).map(delay => (
                    <div key={delay.id} className="p-3 border rounded-lg">
                      <div className="flex items-start gap-3">
                        {getDelayReasonIcon(delay.type)}
                        <div className="flex-1">
                          <div className="font-medium text-sm mb-1">
                            {delay.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{delay.description}</p>
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Start: {delay.startTime}</span>
                            <span>Duration: {delay.duration}min</span>
                            <span>Impact: {delay.impact} pcs</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>        </TabsContent>
      </Tabs>
    </div>
  );
});

LowLevelPlanningBoard.displayName = 'LowLevelPlanningBoard';
