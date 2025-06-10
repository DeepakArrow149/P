"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  Clock, 
  TrendingDown, 
  TrendingUp,
  Zap,
  AlertCircle,
  ExternalLink,
  X,
  Package,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDashboardApi } from '@/hooks/useDashboardApi';
import { useMemo, useState } from 'react';

interface AlertItem {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  orderRef?: string;
  line?: string;
  impact: 'high' | 'medium' | 'low';
  timestamp: string;
  actionRequired: boolean;
}

interface BottleneckItem {
  id: string;
  location: string;
  type: 'capacity' | 'material' | 'quality' | 'maintenance';
  severity: 'critical' | 'warning';
  description: string;
  affectedOrders: number;
  estimatedDelay: string;
}

interface PerformanceComparison {
  metric: string;
  target: number;
  actual: number;
  unit: string;
  variance: number;
  trend: 'up' | 'down' | 'stable';
}

function AlertItem({ alert, onDismiss }: { alert: AlertItem; onDismiss: (id: string) => void }) {
  const getAlertIcon = () => {
    switch (alert.type) {
      case 'critical': return <AlertTriangle className="h-4 w-4" />;
      case 'warning': return <AlertCircle className="h-4 w-4" />;
      case 'info': return <Zap className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getAlertColor = () => {
    switch (alert.type) {
      case 'critical': return 'border-red-200 bg-red-50 text-red-800';
      case 'warning': return 'border-yellow-200 bg-yellow-50 text-yellow-800';
      case 'info': return 'border-blue-200 bg-blue-50 text-blue-800';
      default: return 'border-gray-200 bg-gray-50 text-gray-800';
    }
  };

  return (
    <Alert className={cn("relative", getAlertColor())}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-0.5">
          {getAlertIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">{alert.title}</h4>
            <div className="flex items-center space-x-2">
              {alert.actionRequired && (
                <Badge variant="outline" className="text-xs">
                  Action Required
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDismiss(alert.id)}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <AlertDescription className="mt-1 text-xs">
            {alert.description}
          </AlertDescription>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              {alert.orderRef && (
                <Badge variant="secondary">{alert.orderRef}</Badge>
              )}
              {alert.line && (
                <Badge variant="secondary">{alert.line}</Badge>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              {new Date(alert.timestamp).toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>
    </Alert>
  );
}

function BottleneckCard({ bottleneck }: { bottleneck: BottleneckItem }) {
  const getSeverityColor = () => {
    switch (bottleneck.severity) {
      case 'critical': return 'border-red-500 bg-red-50';
      case 'warning': return 'border-yellow-500 bg-yellow-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  const getTypeIcon = () => {
    switch (bottleneck.type) {
      case 'capacity': return <Clock className="h-4 w-4" />;
      case 'material': return <Package className="h-4 w-4" />;
      case 'quality': return <AlertTriangle className="h-4 w-4" />;
      case 'maintenance': return <Settings className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  return (
    <Card className={cn("border-l-4", getSeverityColor())}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            {getTypeIcon()}
            {bottleneck.location}
          </CardTitle>
          <Badge variant={bottleneck.severity === 'critical' ? 'destructive' : 'secondary'}>
            {bottleneck.severity}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-3">
          {bottleneck.description}
        </p>
        <div className="flex justify-between text-xs">
          <span>Affected Orders: <strong>{bottleneck.affectedOrders}</strong></span>
          <span>Est. Delay: <strong>{bottleneck.estimatedDelay}</strong></span>
        </div>
      </CardContent>
    </Card>
  );
}

function PerformanceCard({ performance }: { performance: PerformanceComparison }) {
  const getTrendIcon = () => {
    switch (performance.trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <div className="h-4 w-4" />;
    }
  };

  const getVarianceColor = () => {
    if (performance.variance > 0) return 'text-green-600';
    if (performance.variance < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-sm">{performance.metric}</h4>
          {getTrendIcon()}
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span>Target:</span>
            <span>{performance.target} {performance.unit}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span>Actual:</span>
            <span className="font-medium">{performance.actual} {performance.unit}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span>Variance:</span>
            <span className={cn("font-medium", getVarianceColor())}>
              {performance.variance > 0 ? '+' : ''}{performance.variance.toFixed(1)}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardAlerts() {
  const { orders, lines, kpiData, loading, error } = useDashboardApi();
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);

  // Generate real-time alerts from API data
  const alertsData = useMemo(() => {
    if (!orders.length) return [];

    const alerts: AlertItem[] = [];
    
    // Critical alerts for delayed orders
    const delayedOrders = orders.filter(order => {
      if (!order.ship_date) return false;
      return new Date(order.ship_date) < new Date() && order.status !== 'completed';
    });

    delayedOrders.slice(0, 2).forEach(order => {
      const alertId = `delayed-${order.id}`;
      if (!dismissedAlerts.includes(alertId)) {
        alerts.push({
          id: alertId,
          type: 'critical',
          title: 'Order Delayed',
          description: `Order ${order.order_reference} is past due date. Customer: ${order.customer}`,
          orderRef: order.order_reference,
          impact: 'high',
          timestamp: new Date().toISOString(),
          actionRequired: true
        });
      }
    });

    // Warning for low efficiency lines
    if (kpiData.lineEfficiency < 80) {
      const alertId = 'low-efficiency';
      if (!dismissedAlerts.includes(alertId)) {
        alerts.push({
          id: alertId,
          type: 'warning',
          title: 'Low Line Efficiency',
          description: `Overall line efficiency at ${kpiData.lineEfficiency}% - below 80% target`,
          impact: 'medium',
          timestamp: new Date().toISOString(),
          actionRequired: true
        });
      }
    }

    // Info for good performance
    if (kpiData.ordersCompletedToday > 0) {
      const alertId = 'completed-today';
      if (!dismissedAlerts.includes(alertId)) {
        alerts.push({
          id: alertId,
          type: 'info',
          title: 'Daily Target Met',
          description: `${kpiData.ordersCompletedToday} orders completed today`,
          impact: 'low',
          timestamp: new Date().toISOString(),
          actionRequired: false
        });
      }
    }

    // Warning for high capacity utilization
    if (kpiData.activeProductionLines >= 8) {
      const alertId = 'high-capacity';
      if (!dismissedAlerts.includes(alertId)) {
        alerts.push({
          id: alertId,
          type: 'warning',
          title: 'High Capacity Utilization',
          description: `${kpiData.activeProductionLines} production lines active. Consider capacity planning.`,
          impact: 'medium',
          timestamp: new Date().toISOString(),
          actionRequired: true
        });
      }
    }

    return alerts;
  }, [orders, kpiData, dismissedAlerts]);

  // Generate bottlenecks from API data
  const bottlenecksData = useMemo(() => {
    if (!orders.length || !lines.length) return [];

    const bottlenecks: BottleneckItem[] = [];

    // Capacity bottleneck
    if (kpiData.activeProductionLines / 10 > 0.8) {
      bottlenecks.push({
        id: 'capacity-bottleneck',
        location: 'Production Floor',
        type: 'capacity',
        severity: 'warning',
        description: `${kpiData.activeProductionLines}/10 lines active. Near capacity limit.`,
        affectedOrders: Math.min(orders.length, 8),
        estimatedDelay: '2-3 days'
      });
    }

    // Material shortage simulation based on orders
    if (orders.length > 20) {
      bottlenecks.push({
        id: 'material-shortage',
        location: 'Material Warehouse',
        type: 'material',
        severity: 'warning',
        description: 'High order volume may lead to material shortages',
        affectedOrders: 3,
        estimatedDelay: '1-2 days'
      });
    }

    return bottlenecks;
  }, [orders, lines, kpiData]);

  // Generate performance comparisons
  const performanceData = useMemo(() => {
    const dailyOutput = kpiData.totalOutput > 0 ? Math.min(kpiData.totalOutput / 30, 4000) : 3200;
    return [
      {
        metric: 'Daily Output',
        target: 3500,
        actual: Math.round(dailyOutput),
        unit: 'pieces',
        variance: Math.round(((dailyOutput - 3500) / 3500) * 100),
        trend: dailyOutput > 3500 ? 'up' as const : 'down' as const
      },
      {
        metric: 'Line Efficiency',
        target: 85,
        actual: kpiData.lineEfficiency,
        unit: '%',
        variance: Math.round(((kpiData.lineEfficiency - 85) / 85) * 100),
        trend: kpiData.lineEfficiency > 85 ? 'up' as const : 'down' as const
      },
      {
        metric: 'Order Completion',
        target: 12,
        actual: kpiData.ordersCompletedToday,
        unit: 'orders/day',
        variance: Math.round(((kpiData.ordersCompletedToday - 12) / 12) * 100),
        trend: kpiData.ordersCompletedToday >= 12 ? 'up' as const : 'down' as const
      },
      {
        metric: 'Active Lines',
        target: 8,
        actual: kpiData.activeProductionLines,
        unit: 'lines',
        variance: Math.round(((kpiData.activeProductionLines - 8) / 8) * 100),
        trend: 'stable' as const
      }
    ];
  }, [kpiData]);

  const handleDismissAlert = (alertId: string) => {
    setDismissedAlerts(prev => [...prev, alertId]);
  };

  if (loading) {
    return (
      <div className="grid gap-6 mb-6">
        <div className="grid gap-6 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 w-32 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div key={j} className="h-12 bg-muted animate-pulse rounded" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 text-red-600">
            <span>Error loading alerts data: {error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 mb-6">
      {/* Alerts & Bottlenecks */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Active Alerts
            </CardTitle>
            <Badge variant="destructive">
              {alertsData.filter(a => a.actionRequired).length}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {alertsData.length > 0 ? (
              alertsData.map((alert) => (
                <AlertItem 
                  key={alert.id} 
                  alert={alert} 
                  onDismiss={handleDismissAlert}
                />
              ))
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                No active alerts
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-red-500" />
              Bottlenecks
            </CardTitle>
            <Badge variant="outline">{bottlenecksData.length}</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {bottlenecksData.length > 0 ? (
              bottlenecksData.map((bottleneck) => (
                <BottleneckCard key={bottleneck.id} bottleneck={bottleneck} />
              ))
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                No bottlenecks detected
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Target vs Actual Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Target vs Actual Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {performanceData.map((item) => (
              <PerformanceCard key={item.metric} performance={item} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
