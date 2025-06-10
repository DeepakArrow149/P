import { PageHeader } from '@/components/page-header';
import { DashboardKPICards } from '@/components/dashboard/dashboard-kpi-cards';
import { DashboardCharts } from '@/components/dashboard/dashboard-charts';
import { DashboardTimeline } from '@/components/dashboard/dashboard-timeline';
import { DashboardAlerts } from '@/components/dashboard/dashboard-alerts';
import { DashboardFilters } from '@/components/dashboard/dashboard-filters';

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Production Dashboard"
        description="Comprehensive overview of your production operations with real-time metrics and insights."
      />
      
      {/* Filters */}
      <DashboardFilters />
      
      {/* KPI Cards */}
      <DashboardKPICards />
      
      {/* Alerts & Bottlenecks */}
      <DashboardAlerts />
      
      {/* Charts and Analytics */}
      <DashboardCharts />
      
      {/* Timeline/Scheduler Snapshot */}
      <DashboardTimeline />
    </>
  );
}

