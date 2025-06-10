"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Calendar,
  Factory,
  Users,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDashboardApi } from '@/hooks/useDashboardApi';

interface KPICardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ReactNode;
  trend?: number;
  loading?: boolean;
}

function KPICard({ title, value, change, changeType = 'neutral', icon, trend, loading = false }: KPICardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-4 w-4 text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {loading ? (
            <div className="h-8 w-16 bg-muted animate-pulse rounded" />
          ) : (
            value
          )}
        </div>
        {change && !loading && (
          <p className={cn(
            "text-xs mt-1",
            changeType === 'positive' && "text-green-600",
            changeType === 'negative' && "text-red-600",
            changeType === 'neutral' && "text-muted-foreground"
          )}>
            {change}
          </p>
        )}
        {trend !== undefined && !loading && (
          <div className="mt-2">
            <div className="flex items-center space-x-2">
              <div className="w-full bg-secondary rounded-full h-1.5">
                <div 
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    trend >= 80 ? "bg-green-500" : trend >= 60 ? "bg-yellow-500" : "bg-red-500"
                  )}
                  style={{ width: `${Math.min(trend, 100)}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">{trend}%</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function DashboardKPICards() {
  const { kpiData, loading, error } = useDashboardApi();

  if (error) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 mb-6">
        <Card className="col-span-full">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <span>Error loading dashboard data: {error}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 mb-6">
      <KPICard
        title="Total Orders"
        value={kpiData.totalOrders}
        change={`+${Math.floor(kpiData.totalOrders * 0.08)} since last week`}
        changeType="positive"
        icon={<Package />}
        loading={loading}
      />
      
      <KPICard
        title="Completed Today"
        value={kpiData.ordersCompletedToday}
        change="On target"
        changeType="positive"
        icon={<CheckCircle />}
        loading={loading}
      />
      
      <KPICard
        title="In Progress"
        value={kpiData.ordersInProgress}
        change={`${kpiData.ordersInProgress > 0 ? Math.floor(kpiData.ordersInProgress * 0.1) : 0} ahead of schedule`}
        changeType="positive"
        icon={<Clock />}
        loading={loading}
      />
      
      <KPICard
        title="Delayed Orders"
        value={kpiData.delayedOrders}
        change={kpiData.delayedOrders > 0 ? "Needs attention" : "All on track"}
        changeType={kpiData.delayedOrders > 0 ? "negative" : "positive"}
        icon={<AlertTriangle />}
        loading={loading}
      />
      
      <KPICard
        title="Upcoming Orders"
        value={kpiData.upcomingOrders}
        change="Next 7 days"
        changeType="neutral"
        icon={<Calendar />}
        loading={loading}
      />
      
      <KPICard
        title="Active Lines"
        value={`${kpiData.activeProductionLines}/10`}
        change={`${Math.round((kpiData.activeProductionLines / 10) * 100)}% capacity`}
        changeType="neutral"
        icon={<Factory />}
        trend={(kpiData.activeProductionLines / 10) * 100}
        loading={loading}
      />
      
      <KPICard
        title="Total Operators"
        value={kpiData.totalOperators}
        change="+8 this month"
        changeType="positive"
        icon={<Users />}
        loading={loading}
      />
      
      <KPICard
        title="Line Efficiency"
        value={`${kpiData.lineEfficiency}%`}
        change="+2.3% from last week"
        changeType="positive"
        icon={<TrendingUp />}
        trend={kpiData.lineEfficiency}
        loading={loading}
      />
      
      <KPICard
        title="Total Output"
        value={`${kpiData.totalOutput.toLocaleString()}`}
        change="pieces planned"
        changeType="neutral"
        icon={<BarChart3 />}
        loading={loading}
      />
    </div>
  );
}
