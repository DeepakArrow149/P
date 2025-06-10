import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Package, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Calendar,
  Factory,
  Users,
  TrendingUp,
  BarChart3,
  Filter,
  Eye
} from 'lucide-react';

// Simplified KPI Card Component
function KPICard({ title, value, change, changeType = 'neutral', icon, trend }: {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ReactNode;
  trend?: number;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-4 w-4 text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <p className={`text-xs mt-1 ${
            changeType === 'positive' ? 'text-green-600' : 
            changeType === 'negative' ? 'text-red-600' : 
            'text-muted-foreground'
          }`}>
            {change}
          </p>
        )}
        {trend !== undefined && (
          <div className="mt-2">
            <div className="flex items-center space-x-2">
              <div className="w-full bg-secondary rounded-full h-1.5">
                <div 
                  className={`h-1.5 rounded-full transition-all ${
                    trend >= 80 ? 'bg-green-500' : trend >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
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

export default function DashboardPage() {
  // Mock data
  const kpiData = {
    totalOrders: 152,
    ordersCompletedToday: 12,
    ordersInProgress: 38,
    delayedOrders: 5,
    upcomingOrders: 23,
    activeProductionLines: 8,
    totalOperators: 156,
    lineEfficiency: 87.5,
    totalOutput: 4250
  };

  return (
    <>
      <PageHeader
        title="Production Dashboard"
        description="Comprehensive overview of your production operations with real-time metrics and insights."
      />
      
      {/* Quick Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">View: Production Manager</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 mb-6">
        <KPICard
          title="Total Orders"
          value={kpiData.totalOrders}
          change="+12 since last week"
          changeType="positive"
          icon={<Package />}
        />
        
        <KPICard
          title="Completed Today"
          value={kpiData.ordersCompletedToday}
          change="On target"
          changeType="positive"
          icon={<CheckCircle />}
        />
        
        <KPICard
          title="In Progress"
          value={kpiData.ordersInProgress}
          change="3 ahead of schedule"
          changeType="positive"
          icon={<Clock />}
        />
        
        <KPICard
          title="Delayed Orders"
          value={kpiData.delayedOrders}
          change="-2 from yesterday"
          changeType="positive"
          icon={<AlertTriangle />}
        />
        
        <KPICard
          title="Upcoming Orders"
          value={kpiData.upcomingOrders}
          change="Next 7 days"
          changeType="neutral"
          icon={<Calendar />}
        />
        
        <KPICard
          title="Active Lines"
          value={`${kpiData.activeProductionLines}/10`}
          change="80% capacity"
          changeType="neutral"
          icon={<Factory />}
          trend={80}
        />
        
        <KPICard
          title="Total Operators"
          value={kpiData.totalOperators}
          change="+8 this month"
          changeType="positive"
          icon={<Users />}
        />
        
        <KPICard
          title="Line Efficiency"
          value={`${kpiData.lineEfficiency}%`}
          change="+2.3% from last week"
          changeType="positive"
          icon={<TrendingUp />}
          trend={kpiData.lineEfficiency}
        />
        
        <KPICard
          title="Total Output"
          value={`${kpiData.totalOutput.toLocaleString()}`}
          change="pieces today"
          changeType="neutral"
          icon={<BarChart3 />}
        />
      </div>

      {/* Alerts Section */}
      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Active Alerts
            </CardTitle>
            <Badge variant="destructive">3</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-4 rounded-lg border-l-4 border-red-500 bg-red-50">
              <div className="font-medium text-sm">Production Line Down</div>
              <p className="text-xs text-muted-foreground mt-1">
                Line 3 has been offline for 2 hours due to equipment failure.
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline">Line 3</Badge>
                <span className="text-xs text-muted-foreground">10:30 AM</span>
              </div>
            </div>
            
            <div className="p-4 rounded-lg border-l-4 border-yellow-500 bg-yellow-50">
              <div className="font-medium text-sm">Material Shortage</div>
              <p className="text-xs text-muted-foreground mt-1">
                Running low on blue fabric for Nike order. 2 days remaining.
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline">ORD-2025-001</Badge>
                <span className="text-xs text-muted-foreground">9:15 AM</span>
              </div>
            </div>
            
            <div className="p-4 rounded-lg border-l-4 border-yellow-500 bg-yellow-50">
              <div className="font-medium text-sm">Quality Issue Detected</div>
              <p className="text-xs text-muted-foreground mt-1">
                Higher than normal defect rate on Line 5 - 3.2% vs 1.5% target.
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline">Line 5</Badge>
                <span className="text-xs text-muted-foreground">8:45 AM</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Target vs Actual Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Daily Output</span>
                <span className="text-sm font-medium">4,250 / 3,500 pieces</span>
              </div>
              <Progress value={121} className="h-2" />
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Overall Efficiency</span>
                <span className="text-sm font-medium">87.5% / 85%</span>
              </div>
              <Progress value={87.5} className="h-2" />
              
              <div className="flex items-center justify-between">
                <span className="text-sm">On-Time Delivery</span>
                <span className="text-sm font-medium">92% / 95%</span>
              </div>
              <Progress value={92} className="h-2" />
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Quality Rate</span>
                <span className="text-sm font-medium">97.8% / 98.5%</span>
              </div>
              <Progress value={97.8} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Production Schedule Snapshot */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Production Schedule Snapshot
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground">
              <div className="col-span-3">Order Details</div>
              <div className="col-span-9 text-center">Timeline (Jan 7 - Jan 13, 2025)</div>
            </div>
            
            <div className="space-y-3">
              <div className="grid grid-cols-12 gap-2 p-3 rounded-lg border-l-4 border-red-500 bg-card">
                <div className="col-span-3">
                  <div className="font-medium text-sm">ORD-2025-001</div>
                  <div className="text-xs text-muted-foreground">Nike Apparel</div>
                  <div className="text-xs">Classic Crew Neck T-Shirt</div>
                  <Badge variant="secondary" className="text-xs mt-1">Line 1</Badge>
                </div>
                <div className="col-span-9 relative">
                  <div className="bg-blue-500 h-6 rounded mt-2 flex items-center justify-between px-2 text-white text-xs">
                    <span>65%</span>
                    <span>5,000 pcs</span>
                  </div>
                  <Progress value={65} className="h-1 mt-1" />
                </div>
              </div>
              
              <div className="grid grid-cols-12 gap-2 p-3 rounded-lg border-l-4 border-yellow-500 bg-card">
                <div className="col-span-3">
                  <div className="font-medium text-sm">ORD-2025-002</div>
                  <div className="text-xs text-muted-foreground">H&M Global</div>
                  <div className="text-xs">Pullover Hoodie</div>
                  <Badge variant="secondary" className="text-xs mt-1">Line 2</Badge>
                </div>
                <div className="col-span-9 relative">
                  <div className="bg-blue-500 h-6 rounded mt-2 flex items-center justify-between px-2 text-white text-xs">
                    <span>25%</span>
                    <span>3,000 pcs</span>
                  </div>
                  <Progress value={25} className="h-1 mt-1" />
                </div>
              </div>
              
              <div className="grid grid-cols-12 gap-2 p-3 rounded-lg border-l-4 border-green-500 bg-card">
                <div className="col-span-3">
                  <div className="font-medium text-sm">ORD-2025-003</div>
                  <div className="text-xs text-muted-foreground">Zara International</div>
                  <div className="text-xs">Business Polo Shirt</div>
                  <Badge variant="secondary" className="text-xs mt-1">Line 3</Badge>
                </div>
                <div className="col-span-9 relative">
                  <div className="bg-yellow-500 h-6 rounded mt-2 flex items-center justify-between px-2 text-white text-xs">
                    <span>Scheduled</span>
                    <span>2,500 pcs</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Work In Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Work In Progress (WIP) Snapshot</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="p-4 rounded-lg border bg-card">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-medium">ORD-2025-001</div>
                  <div className="text-sm text-muted-foreground">Classic Crew Neck T-Shirt</div>
                  <Badge variant="outline" className="mt-1 text-xs">Line 1</Badge>
                </div>
                <Badge className="text-xs bg-green-50 text-green-600">on-track</Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress:</span>
                  <span>3,250 / 5,000</span>
                </div>
                <Progress value={65} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>65% complete</span>
                  <span>Due: Jan 12</span>
                </div>
              </div>
            </div>
            
            <div className="p-4 rounded-lg border bg-card">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-medium">ORD-2025-002</div>
                  <div className="text-sm text-muted-foreground">Pullover Hoodie</div>
                  <Badge variant="outline" className="mt-1 text-xs">Line 2</Badge>
                </div>
                <Badge className="text-xs bg-yellow-50 text-yellow-600">at-risk</Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress:</span>
                  <span>750 / 3,000</span>
                </div>
                <Progress value={25} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>25% complete</span>
                  <span>Due: Jan 15</span>
                </div>
              </div>
            </div>
            
            <div className="p-4 rounded-lg border bg-card">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-medium">ORD-2025-005</div>
                  <div className="text-sm text-muted-foreground">Performance Sports Tee</div>
                  <Badge variant="outline" className="mt-1 text-xs">Line 5</Badge>
                </div>
                <Badge className="text-xs bg-red-50 text-red-600">delayed</Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress:</span>
                  <span>4,200 / 6,000</span>
                </div>
                <Progress value={70} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>70% complete</span>
                  <span>Due: Jan 9</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

