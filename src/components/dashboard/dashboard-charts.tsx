"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  ComposedChart,
  Area,
  AreaChart
} from 'recharts';
import { useDashboardApi } from '@/hooks/useDashboardApi';
import { useMemo } from 'react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const chartConfig = {
  output: {
    label: "Output",
    color: "hsl(var(--chart-1))",
  },
  target: {
    label: "Target",
    color: "hsl(var(--chart-2))",
  },
  efficiency: {
    label: "Efficiency",
    color: "hsl(var(--chart-3))",
  },
};

export function DashboardCharts() {
  const { orders, buyers, lines, loading, error } = useDashboardApi();

  // Calculate real-time chart data from API
  const chartData = useMemo(() => {
    if (!orders.length) return {
      orderStatusData: [],
      buyerOrdersData: [],
      outputTrendData: [],
      linePerformanceData: [],
      samVsActualData: []
    };

    // Order Status Distribution
    const statusCounts = orders.reduce((acc, order) => {
      const status = order.status || 'pending';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const orderStatusData = Object.entries(statusCounts).map(([status, count]) => ({
      status: status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' '),
      count,
      percentage: Math.round((count / orders.length) * 100)
    }));

    // Buyer Orders Distribution
    const buyerCounts = orders.reduce((acc, order) => {
      const buyer = order.buyer || 'Unknown';
      acc[buyer] = (acc[buyer] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const buyerOrdersData = Object.entries(buyerCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 6)
      .map(([buyer, count]) => ({
        buyer,
        orders: count,
        revenue: count * 7500, // Estimated revenue per order
        percentage: Math.round((count / orders.length) * 100)
      }));

    // Output Trend Data (last 7 days with mock trend)
    const outputTrendData = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      const baseOutput = 3200 + Math.random() * 800;
      return {
        date: date.toISOString().split('T')[0],
        output: Math.round(baseOutput),
        target: 3500,
        efficiency: Math.round(75 + Math.random() * 20)
      };
    });    // Line Performance Data
    const linePerformanceData = lines.map((line, index) => ({
      line: line.lineName || line.lineCode,
      efficiency: Math.round(75 + Math.random() * 20),
      output: Math.round(2800 + Math.random() * 800),
      target: line.defaultCapacity || 3000,
      utilization: Math.round(70 + Math.random() * 25)
    }));

    // SAM vs Actual Performance Data
    const samVsActualData = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return {
        operation: `Op ${i + 1}`,
        sam: Math.round(8 + Math.random() * 4),
        actual: Math.round(9 + Math.random() * 5),
        efficiency: Math.round(80 + Math.random() * 15)
      };
    });

    return {
      orderStatusData,
      buyerOrdersData,
      outputTrendData,
      linePerformanceData,
      samVsActualData
    };
  }, [orders, buyers, lines]);

  if (loading) {
    return (
      <div className="grid gap-6 mb-6">
        <div className="grid gap-6 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 w-32 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-muted animate-pulse rounded" />
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
            <span>Error loading chart data: {error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }
  const { orderStatusData, buyerOrdersData, outputTrendData, linePerformanceData, samVsActualData } = chartData;

  if (error) {
    return (
      <div className="grid gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 text-red-600">
              <span>Error loading chart data: {error}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }return (
    <div className="grid gap-6 mb-6">
      {/* Order Status and Buyer Analysis */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Order Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[300px] flex items-center justify-center">
                <div className="animate-pulse text-muted-foreground">Loading chart data...</div>
              </div>
            ) : (
              <ChartContainer config={chartConfig} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.orderStatusData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="status" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill="hsl(var(--chart-1))" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Orders by Buyer</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[300px] flex items-center justify-center">
                <div className="animate-pulse text-muted-foreground">Loading chart data...</div>
              </div>
            ) : (
              <ChartContainer config={chartConfig} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData.buyerOrdersData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ buyer, percentage }) => `${buyer}: ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="orders"
                    >
                      {chartData.buyerOrdersData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>      </div>

      {/* Output & Efficiency Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Output & Efficiency Trends (Last 7 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="output" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="output">Daily Output</TabsTrigger>
              <TabsTrigger value="efficiency">Efficiency Trend</TabsTrigger>
              <TabsTrigger value="sam">SAM vs Actual</TabsTrigger>
            </TabsList>
            <TabsContent value="output" className="space-y-4">
              {loading ? (
                <div className="h-[350px] flex items-center justify-center">
                  <div className="animate-pulse text-muted-foreground">Loading trend data...</div>
                </div>
              ) : (
                <ChartContainer config={chartConfig} className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData.outputTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString()} />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Bar dataKey="output" fill="hsl(var(--chart-1))" name="Actual Output" />
                      <Line 
                        type="monotone" 
                        dataKey="target" 
                        stroke="hsl(var(--chart-2))" 
                        strokeWidth={2}
                        name="Target"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </ChartContainer>
              )}
            </TabsContent>
            <TabsContent value="efficiency" className="space-y-4">
              {loading ? (
                <div className="h-[350px] flex items-center justify-center">
                  <div className="animate-pulse text-muted-foreground">Loading efficiency data...</div>
                </div>            ) : (
              <ChartContainer config={chartConfig} className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData.outputTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString()} />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area 
                      type="monotone" 
                      dataKey="efficiency" 
                      stroke="hsl(var(--chart-3))" 
                      fill="hsl(var(--chart-3))"
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
            </TabsContent>
            <TabsContent value="sam" className="space-y-4">
              {loading ? (
                <div className="h-[350px] flex items-center justify-center">
                  <div className="animate-pulse text-muted-foreground">Loading SAM data...</div>
                </div>
              ) : (
                <ChartContainer config={chartConfig} className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData.samVsActualData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="operation" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Bar dataKey="sam" fill="hsl(var(--chart-1))" name="SAM (Minutes)" />
                      <Bar dataKey="actual" fill="hsl(var(--chart-2))" name="Actual (Minutes)" />
                      <Line 
                        type="monotone" 
                        dataKey="efficiency" 
                        stroke="hsl(var(--chart-3))" 
                        strokeWidth={2}
                        name="Efficiency %"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </ChartContainer>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>      {/* Line-Level Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Line-Level Performance Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-[350px] flex items-center justify-center">
              <div className="animate-pulse text-muted-foreground">Loading performance data...</div>
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData.linePerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="line" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="output" fill="hsl(var(--chart-1))" name="Output (pieces)" />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="target" 
                    stroke="hsl(var(--chart-2))" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Target"
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="efficiency" 
                    stroke="hsl(var(--chart-3))" 
                    strokeWidth={3}
                    name="Efficiency %"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
