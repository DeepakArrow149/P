
import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  PlusCircle,
  List,
  ListX,
  Settings,
  GanttChartSquare,
  CalendarCheck,
  Boxes,
  Building,
  Spline,
  Package,
  Palette,
  Users,
  Clock,
  Wrench,
  Ruler,
  FileText,
  UserCircle as UserProfileIcon,
  NotebookText,
  Network,
  CalendarDays,
  Brain,
  Activity,
  Archive,
  Group as GroupIcon,
  Settings2 as UdfIcon,
  BarChartBig,
  ListChecks as PlanningMasterIcon,
  ShieldCheck,
  KeyRound,
  ClipboardEdit as ProductionUpdatesIcon,
  ListChecks as MtnaIcon,
  ClipboardList as MtnaFrameworkIcon,
  View as ProductListIcon,
  Table2 // Icon for Report Master
} from 'lucide-react';

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  disabled?: boolean;
  external?: boolean;
  label?: string;
  children?: NavItem[];
}

export const navConfig: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    title: 'Plan View',
    href: '/plan-view',
    icon: GanttChartSquare,
  },
  {
    title: 'New Order',
    href: '/new-order',
    icon: PlusCircle,
  },
  {
    title: 'Order List',
    href: '/order-list',
    icon: List,
  },
  {
    title: 'Production Updates',
    href: '/production-updates',
    icon: ProductionUpdatesIcon,
  },
  {
    title: 'Unscheduled Orders',
    href: '#',
    icon: ListX,
    children: [
      {
        title: 'View Unscheduled',
        href: '/unscheduled-orders',
        icon: ListX,
      },
      {
        title: 'Bucket Planning',
        href: '/bucket-planning',
        icon: Archive,
      },
    ]
  },
  {
    title: 'Masters',
    href: '#',
    icon: Settings,
    children: [
      { title: 'Unit', href: '/masters/unit', icon: Building },
      { title: 'Line', href: '/masters/line', icon: Spline },
      { title: 'Line Group', href: '/masters/line-group', icon: GroupIcon },
      { title: 'Product (Define)', href: '/masters/product', icon: Package },
      { title: 'Product List', href: '/masters/product-list', icon: ProductListIcon },
      { title: 'Style', href: '/masters/style', icon: Palette },
      { title: 'Buyer', href: '/masters/buyer', icon: Users },
      { title: 'Shift', href: '/masters/shift', icon: Clock },
      { title: 'Operations', href: '/masters/operations', icon: Wrench },
      { title: 'Sizes', href: '/masters/sizes', icon: Ruler },
      { title: 'MTNA Time Table', href: '/masters/mtna-timetable', icon: MtnaIcon },
      { title: 'MTNA Framework', href: '/masters/mtna-framework', icon: MtnaFrameworkIcon },
      { title: 'Notes Template', href: '/masters/notes-template', icon: NotebookText },
      { title: 'Customer Master', href: '/masters/customer-profile', icon: UserProfileIcon },
      { title: 'Calendar', href: '/masters/calendar', icon: CalendarDays },
      { title: 'Learning Curve', href: '/masters/learning-curve', icon: Brain },
      { title: 'Line Capacity', href: '/masters/line-capacity', icon: Activity },
      { title: 'Planning Master', href: '/masters/planning', icon: PlanningMasterIcon },
      { title: 'UDF Master', href: '/masters/udf', icon: UdfIcon },
      { title: 'Report Master', href: '/masters/report-master', icon: Table2 },
    ],
  },
  {
    title: 'Security',
    href: '#',
    icon: ShieldCheck,
    children: [
      { title: 'Users', href: '/security/users', icon: Users },
      { title: 'User Security Groups', href: '/security/user-groups', icon: GroupIcon },
      { title: 'Security Group Rights', href: '/security/group-rights', icon: KeyRound },
    ],
  },
  {
    title: 'Planning Module',
    href: '/planning',
    icon: Network,
  },
  {
    title: 'TNA',
    href: '/tna',
    icon: CalendarCheck,
  },
  {
    title: 'Materials',
    href: '/materials',
    icon: Boxes,
  },
  {
    title: 'Dynamic Reports',
    href: '/dynamic-reports',
    icon: BarChartBig,
  },
];
