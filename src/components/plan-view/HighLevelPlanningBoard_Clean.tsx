"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar,
  Filter,
  TrendingUp,
  AlertTriangle,
  Users,
  Factory,
  Zap,
  Target,
  BarChart3,
  Settings,
  RefreshCw,
  Plus,
  Search,
  Download,
  Eye,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, addWeeks, startOfWeek, endOfWeek, eachWeekOfInterval } from 'date-fns';

// Types for High-Level Planning Board
interface UnscheduledOrder {
  id: string;
  orderCode: string;
  productCode: string;
  productType: string;
  customerCode: string;
  orderDate: string;
  deliveryDate: string;
  quantity: number;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'ready_to_schedule' | 'requires_material';
  estimatedHours: number;
  complexity: 'simple' | 'medium' | 'complex';
  requirements: string[];
  buyer: string;
  factory: string;
  samRange: string;
}

interface StyleOrder {
  id: string;
  styleCode: string;
  buyer: string;
  factory: string;
  quantity: number;
  samRange: string;
  deliveryDate: string;
  priority: 'high' | 'medium' | 'low';
  status: 'planning' | 'scheduled' | 'in_progress' | 'completed';
  milestones: Milestone[];
  alerts: Alert[];
  estimatedWeeks: number;
  capacityRequired: number;
}

interface Milestone {
  id: string;
  name: string;
  type: 'cutting_start' | 'sewing_start' | 'ex_factory';
  targetDate: string;
  actualDate?: string;
  status: 'pending' | 'on_track' | 'at_risk' | 'completed' | 'delayed';
}

interface Alert {
  id: string;
  type: 'fabric_shortage' | 'over_capacity' | 'line_idle' | 'delivery_risk';
  severity: 'critical' | 'warning' | 'info';
  message: string;
  orderId: string;
}

interface LineCapacityData {
  lineId: string;
  lineName: string;
  capacity: number;
  allocated: number;
  utilization: number;
  status: 'available' | 'tight' | 'overloaded';
  efficiency: number;
}

interface WeeklyTimelineData {
  weekStart: string;
  weekEnd: string;
  orders: StyleOrder[];
  totalCapacity: number;
  allocatedCapacity: number;
  utilizationPercent: number;
}

// Mock data for unscheduled orders based on the provided image
const mockUnscheduledOrders: UnscheduledOrder[] = [
  {
    id: 'UO-001',
    orderCode: 'ORD-240115-001',
    productCode: 'BT-WM-LST-001',
    productType: 'Basic T-Shirt',
    customerCode: 'NIKE-APP',
    orderDate: '2024-01-15',
    deliveryDate: '2024-03-15',
    quantity: 5000,
    priority: 'high',
    status: 'ready_to_schedule',
    estimatedHours: 220,
    complexity: 'simple',
    requirements: ['Cotton Fabric', 'Standard Stitching', 'Screen Printing'],
    buyer: 'Nike Apparel',
    factory: 'Factory A',
    samRange: '45-50 min'
  },
  {
    id: 'UO-002',
    orderCode: 'ORD-240115-002',
    productCode: 'CP-MN-PLO-002',
    productType: 'Polo Shirt',
    customerCode: 'HM-GLOB',
    orderDate: '2024-01-15',
    deliveryDate: '2024-03-20',
    quantity: 3500,
    priority: 'medium',
    status: 'requires_material',
    estimatedHours: 185,
    complexity: 'medium',
    requirements: ['Pique Fabric', 'Collar Attachment', 'Button Placement'],
    buyer: 'H&M Global',
    factory: 'Factory B',
    samRange: '55-60 min'
  },
  {
    id: 'UO-003',
    orderCode: 'ORD-240116-003',
    productCode: 'DJ-WM-DRS-003',
    productType: 'Casual Dress',
    customerCode: 'ZARA-INT',
    orderDate: '2024-01-16',
    deliveryDate: '2024-03-25',
    quantity: 2000,
    priority: 'high',
    status: 'ready_to_schedule',
    estimatedHours: 160,
    complexity: 'complex',
    requirements: ['Jersey Fabric', 'Zipper Installation', 'Pattern Matching'],
    buyer: 'Zara International',
    factory: 'Factory A',
    samRange: '65-70 min'
  },
  {
    id: 'UO-004',
    orderCode: 'ORD-240116-004',
    productCode: 'SW-MN-HDY-004',
    productType: 'Hoodie',
    customerCode: 'GAP-USA',
    orderDate: '2024-01-16',
    deliveryDate: '2024-04-10',
    quantity: 4200,
    priority: 'medium',
    status: 'pending',
    estimatedHours: 290,
    complexity: 'complex',
    requirements: ['Fleece Fabric', 'Hood Assembly', 'Kangaroo Pocket', 'Drawstring'],
    buyer: 'Gap USA',
    factory: 'Factory C',
    samRange: '75-80 min'
  },
  {
    id: 'UO-005',
    orderCode: 'ORD-240117-005',
    productCode: 'JN-WM-SKT-005',
    productType: 'Denim Skirt',
    customerCode: 'LEVI-STR',
    orderDate: '2024-01-17',
    deliveryDate: '2024-04-15',
    quantity: 1800,
    priority: 'low',
    status: 'requires_material',
    estimatedHours: 125,
    complexity: 'medium',
    requirements: ['Denim Fabric', 'Button & Rivets', 'Contrast Stitching'],
    buyer: 'Levi Strauss',
    factory: 'Factory B',
    samRange: '60-65 min'
  },
  {
    id: 'UO-006',
    orderCode: 'ORD-240117-006',
    productCode: 'SP-MN-SHT-006',
    productType: 'Sports Shorts',
    customerCode: 'ADID-SPT',
    orderDate: '2024-01-17',
    deliveryDate: '2024-03-30',
    quantity: 6000,
    priority: 'high',
    status: 'ready_to_schedule',
    estimatedHours: 180,
    complexity: 'simple',
    requirements: ['Moisture-Wicking Fabric', 'Elastic Waistband', 'Side Pockets'],
    buyer: 'Adidas Sports',
    factory: 'Factory A',
    samRange: '35-40 min'
  },
  {
    id: 'UO-007',
    orderCode: 'ORD-240118-007',
    productCode: 'BL-WM-SHT-007',
    productType: 'Blouse',
    customerCode: 'MANG-FAH',
    orderDate: '2024-01-18',
    deliveryDate: '2024-04-20',
    quantity: 2800,
    priority: 'medium',
    status: 'pending',
    estimatedHours: 210,
    complexity: 'complex',
    requirements: ['Silk Fabric', 'Button-down Front', 'French Seams', 'Pleated Details'],
    buyer: 'Mango Fashion',
    factory: 'Factory C',
    samRange: '70-75 min'
  },
  {
    id: 'UO-008',
    orderCode: 'ORD-240118-008',
    productCode: 'CG-MN-PNT-008',
    productType: 'Cargo Pants',
    customerCode: 'UNIQ-CLO',
    orderDate: '2024-01-18',
    deliveryDate: '2024-04-25',
    quantity: 3200,
    priority: 'low',
    status: 'requires_material',
    estimatedHours: 245,
    complexity: 'complex',
    requirements: ['Canvas Fabric', 'Multiple Pockets', 'Reinforced Stitching', 'Belt Loops'],
    buyer: 'Uniqlo Clothing',
    factory: 'Factory B',
    samRange: '80-85 min'
  }
];

// Mock data for demonstration
const mockStyleOrders: StyleOrder[] = [
  {
    id: 'SO-001',
    styleCode: 'BT-2024-001',
    buyer: 'Nike Apparel',
    factory: 'Factory A',
    quantity: 5000,
    samRange: '45-55 min',
    deliveryDate: '2024-02-15',
    priority: 'high',
    status: 'planning',
    estimatedWeeks: 4,
    capacityRequired: 1250,
    milestones: [
      { id: 'M1', name: 'Cutting Start', type: 'cutting_start', targetDate: '2024-01-15', status: 'pending' },
      { id: 'M2', name: 'Sewing Start', type: 'sewing_start', targetDate: '2024-01-22', status: 'pending' },
      { id: 'M3', name: 'Ex-Factory', type: 'ex_factory', targetDate: '2024-02-15', status: 'pending' }
    ],
    alerts: [
      { id: 'A1', type: 'fabric_shortage', severity: 'warning', message: 'Fabric delivery delayed by 2 days', orderId: 'SO-001' }
    ]
  },
  {
    id: 'SO-002',
    styleCode: 'CP-2024-002',
    buyer: 'H&M Global',
    factory: 'Factory B',
    quantity: 3000,
    samRange: '35-40 min',
    deliveryDate: '2024-02-28',
    priority: 'medium',
    status: 'scheduled',
    estimatedWeeks: 3,
    capacityRequired: 1000,
    milestones: [
      { id: 'M4', name: 'Cutting Start', type: 'cutting_start', targetDate: '2024-01-20', status: 'on_track' },
      { id: 'M5', name: 'Sewing Start', type: 'sewing_start', targetDate: '2024-01-27', status: 'pending' },
      { id: 'M6', name: 'Ex-Factory', type: 'ex_factory', targetDate: '2024-02-28', status: 'pending' }
    ],
    alerts: []
  },
  {
    id: 'SO-003',
    styleCode: 'DJ-2024-003',
    buyer: 'Zara International',
    factory: 'Factory A',
    quantity: 2500,
    samRange: '50-60 min',
    deliveryDate: '2024-03-10',
    priority: 'high',
    status: 'in_progress',
    estimatedWeeks: 5,
    capacityRequired: 625,
    milestones: [
      { id: 'M7', name: 'Cutting Start', type: 'cutting_start', targetDate: '2024-01-10', status: 'completed', actualDate: '2024-01-10' },
      { id: 'M8', name: 'Sewing Start', type: 'sewing_start', targetDate: '2024-01-17', status: 'on_track' },
      { id: 'M9', name: 'Ex-Factory', type: 'ex_factory', targetDate: '2024-03-10', status: 'pending' }
    ],
    alerts: [
      { id: 'A2', type: 'over_capacity', severity: 'critical', message: 'Line allocation exceeds capacity by 15%', orderId: 'SO-003' }
    ]
  }
];

const mockLineCapacity: LineCapacityData[] = [
  { lineId: 'L1', lineName: 'Line 1 - Sewing', capacity: 1000, allocated: 750, utilization: 75, status: 'available', efficiency: 85 },
  { lineId: 'L2', lineName: 'Line 2 - Sewing', capacity: 1200, allocated: 1080, utilization: 90, status: 'tight', efficiency: 88 },
  { lineId: 'L3', lineName: 'Line 3 - Cutting', capacity: 800, allocated: 920, utilization: 115, status: 'overloaded', efficiency: 82 },
  { lineId: 'L4', lineName: 'Line 4 - Finishing', capacity: 600, allocated: 400, utilization: 67, status: 'available', efficiency: 90 },
  { lineId: 'L5', lineName: 'Line 5 - Assembly', capacity: 900, allocated: 810, utilization: 90, status: 'tight', efficiency: 87 }
];

interface HighLevelPlanningBoardProps {
  className?: string;
}

export function HighLevelPlanningBoard({ className }: HighLevelPlanningBoardProps) {
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [filterBuyer, setFilterBuyer] = useState('all');
  const [filterFactory, setFilterFactory] = useState('all');
  const [filterSamRange, setFilterSamRange] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('timeline');
  
  // Unscheduled orders state
  const [unscheduledSearchTerm, setUnscheduledSearchTerm] = useState('');
  const [unscheduledFilterStatus, setUnscheduledFilterStatus] = useState('all');
  const [unscheduledFilterPriority, setUnscheduledFilterPriority] = useState('all');
  const [unscheduledFilterBuyer, setUnscheduledFilterBuyer] = useState('all');
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [draggedOrder, setDraggedOrder] = useState<UnscheduledOrder | null>(null);

  // Generate weekly timeline data
  const weeklyTimelineData = useMemo(() => {
    const weeks: WeeklyTimelineData[] = [];
    const startDate = startOfWeek(selectedWeek);
    
    for (let i = 0; i < 12; i++) { // 12 weeks view
      const weekStart = addWeeks(startDate, i);
      const weekEnd = endOfWeek(weekStart);
      
      // Filter orders for this week
      const weekOrders = mockStyleOrders.filter(order => {
        const deliveryDate = new Date(order.deliveryDate);
        return deliveryDate >= weekStart && deliveryDate <= weekEnd;
      });
      
      const totalCapacity = mockLineCapacity.reduce((sum, line) => sum + line.capacity, 0);
      const allocatedCapacity = weekOrders.reduce((sum, order) => sum + order.capacityRequired, 0);
      
      weeks.push({
        weekStart: format(weekStart, 'yyyy-MM-dd'),
        weekEnd: format(weekEnd, 'yyyy-MM-dd'),
        orders: weekOrders,
        totalCapacity,
        allocatedCapacity,
        utilizationPercent: totalCapacity > 0 ? Math.round((allocatedCapacity / totalCapacity) * 100) : 0
      });
    }
    
    return weeks;
  }, [selectedWeek]);

  // Filter orders based on current filters
  const filteredOrders = useMemo(() => {
    return mockStyleOrders.filter(order => {
      const matchesBuyer = filterBuyer === 'all' || order.buyer === filterBuyer;
      const matchesFactory = filterFactory === 'all' || order.factory === filterFactory;
      const matchesSearch = searchTerm === '' || 
        order.styleCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.buyer.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesBuyer && matchesFactory && matchesSearch;
    });
  }, [filterBuyer, filterFactory, searchTerm]);

  // Filter unscheduled orders based on current filters
  const filteredUnscheduledOrders = useMemo(() => {
    return mockUnscheduledOrders.filter(order => {
      const matchesBuyer = unscheduledFilterBuyer === 'all' || order.buyer === unscheduledFilterBuyer;
      const matchesStatus = unscheduledFilterStatus === 'all' || order.status === unscheduledFilterStatus;
      const matchesPriority = unscheduledFilterPriority === 'all' || order.priority === unscheduledFilterPriority;
      const matchesSearch = unscheduledSearchTerm === '' || 
        order.orderCode.toLowerCase().includes(unscheduledSearchTerm.toLowerCase()) ||
        order.productCode.toLowerCase().includes(unscheduledSearchTerm.toLowerCase()) ||
        order.buyer.toLowerCase().includes(unscheduledSearchTerm.toLowerCase()) ||
        order.customerCode.toLowerCase().includes(unscheduledSearchTerm.toLowerCase());
      
      return matchesBuyer && matchesStatus && matchesPriority && matchesSearch;
    });
  }, [unscheduledFilterBuyer, unscheduledFilterStatus, unscheduledFilterPriority, unscheduledSearchTerm]);

  // Get unique values for filters
  const uniqueBuyers = useMemo(() => [...new Set(mockStyleOrders.map(o => o.buyer))], []);
  const uniqueFactories = useMemo(() => [...new Set(mockStyleOrders.map(o => o.factory))], []);
  const uniqueUnscheduledBuyers = useMemo(() => [...new Set(mockUnscheduledOrders.map(o => o.buyer))], []);

  // Utility color functions
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-blue-500 text-white';
      case 'scheduled': return 'bg-purple-500 text-white';
      case 'in_progress': return 'bg-orange-500 text-white';
      case 'completed': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getUnscheduledStatusColor = (status: string) => {
    switch (status) {
      case 'ready_to_schedule': return 'bg-green-500 text-white';
      case 'requires_material': return 'bg-yellow-500 text-black';
      case 'pending': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'simple': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'complex': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCapacityColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800 border-green-200';
      case 'tight': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'overloaded': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getMilestoneStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'on_track': return <Clock className="h-4 w-4 text-blue-600" />;
      case 'at_risk': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'delayed': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'fabric_shortage': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'over_capacity': return <BarChart3 className="h-4 w-4 text-red-500" />;
      case 'line_idle': return <Factory className="h-4 w-4 text-blue-500" />;
      case 'delivery_risk': return <Clock className="h-4 w-4 text-orange-500" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  // Event handlers
  const handleOrderDrop = useCallback((orderId: string, weekStart: string) => {
    console.log(`Order ${orderId} dropped to week ${weekStart}`);
  }, []);

  const handleOrderSelect = (orderId: string) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleBulkSchedule = () => {
    if (selectedOrders.length === 0) return;
    
    const bulkInfo = `
🔄 Bulk Schedule Orders

Selected Orders: ${selectedOrders.length}
${selectedOrders.map(id => {
  const order = mockUnscheduledOrders.find(o => o.id === id);
  return order ? `• ${order.orderCode} - ${order.productType}` : '';
}).join('\n')}

This will:
✓ Schedule all selected orders
✓ Allocate production capacity
✓ Set timeline milestones
✓ Update order statuses

Continue with bulk scheduling?
    `;
    
    const confirmed = confirm(bulkInfo);
    if (confirmed) {
      alert(`✅ Bulk Scheduling Complete!\n\n${selectedOrders.length} orders have been scheduled for production.\n\n📋 Next Steps:\n• Review production assignments\n• Confirm material availability\n• Set up quality checkpoints`);
      setSelectedOrders([]);
    }
  };

  const handleOrderDragStart = (order: UnscheduledOrder) => {
    setDraggedOrder(order);
  };

  const handleOrderDragEnd = () => {
    setDraggedOrder(null);
  };

  // Individual order actions
  const handleViewOrder = (order: UnscheduledOrder) => {
    const orderDetails = `
📋 Order Details: ${order.orderCode}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🏷️ Product Information:
• Product Code: ${order.productCode}
• Product Type: ${order.productType}
• Customer: ${order.customerCode} (${order.buyer})

📊 Production Details:
• Quantity: ${order.quantity.toLocaleString()} pieces
• Estimated Hours: ${order.estimatedHours}h
• SAM Range: ${order.samRange}
• Complexity: ${order.complexity.toUpperCase()}
• Factory: ${order.factory}

📅 Timeline:
• Order Date: ${format(new Date(order.orderDate), 'MMM dd, yyyy')}
• Delivery Date: ${format(new Date(order.deliveryDate), 'MMM dd, yyyy')}
• Days Remaining: ${Math.ceil((new Date(order.deliveryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}

🎯 Status & Priority:
• Priority: ${order.priority.toUpperCase()}
• Status: ${order.status.replace('_', ' ').toUpperCase()}

📋 Requirements:
${order.requirements.map(req => `• ${req}`).join('\n')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `;
    alert(orderDetails);
  };

  const handleScheduleOrder = (order: UnscheduledOrder) => {
    // Check if order can be scheduled
    if (order.status === 'requires_material') {
      alert(`❌ Cannot Schedule Order\n\nOrder ${order.orderCode} requires materials before scheduling.\n\nPlease ensure all materials are available and update the status.`);
      return;
    }

    if (order.status === 'pending') {
      alert(`⚠️ Order Pending Review\n\nOrder ${order.orderCode} is still pending review.\n\nPlease complete the review process before scheduling.`);
      return;
    }

    const scheduleDetails = `
🗓️ Schedule Order: ${order.orderCode}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 Order: ${order.orderCode}
🏷️ Product: ${order.productType}
👥 Customer: ${order.buyer}
📊 Quantity: ${order.quantity.toLocaleString()} pieces
⏱️ Estimated Time: ${order.estimatedHours} hours
📅 Delivery: ${format(new Date(order.deliveryDate), 'MMM dd, yyyy')}
🔥 Priority: ${order.priority.toUpperCase()}

This order will be:
✓ Added to production timeline
✓ Allocated to ${order.factory}
✓ Assigned production capacity
✓ Tracked with milestones

Continue with scheduling?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `;

    const confirmed = confirm(scheduleDetails);
    if (confirmed) {
      alert(`✅ Order Scheduled Successfully!\n\nOrder ${order.orderCode} has been scheduled for production.\n\n📅 Next Steps:\n1. Production line assignment\n2. Material allocation\n3. Operator scheduling\n4. Quality setup\n\n➡️ Order is now visible in Timeline tab.`);
    }
  };

  // Header action handlers
  const handleGlobalExport = () => {
    const exportInfo = `
📊 Export Planning Board Data
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 Export Options:
1️⃣ Complete Planning Data
2️⃣ Production Schedule
3️⃣ Capacity Analysis
4️⃣ Order Management

📄 Format: Excel (.xlsx)
📁 Includes:
• ${mockStyleOrders.length} scheduled orders
• ${mockUnscheduledOrders.length} unscheduled orders
• ${mockLineCapacity.length} production lines
• Capacity and milestone data

Continue with export?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `;
    
    const proceed = confirm(exportInfo);
    if (proceed) {
      alert(`📊 Export Complete!\n\nFile: PlanningBoard_${format(new Date(), 'yyyy-MM-dd_HHmm')}.xlsx\n📍 Location: Downloads folder\n\n✅ Data exported successfully!`);
    }
  };

  const handleGlobalRefresh = () => {
    const refreshInfo = `
🔄 Refresh All Planning Data
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This will refresh:
🗓️ Timeline Data
📊 Capacity Information
⚠️ Alerts & Milestones
📋 Unscheduled Orders

⏱️ Estimated time: 10-15 seconds
🌐 Server connection required

Continue with refresh?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `;
    
    const proceed = confirm(refreshInfo);
    if (proceed) {
      alert(`🔄 Refresh Complete!\n\n📊 Updated Data:\n• Timeline: ${mockStyleOrders.length} orders\n• Capacity: ${mockLineCapacity.length} lines\n• Alerts: ${mockStyleOrders.reduce((acc, order) => acc + order.alerts.length, 0)} active\n• Unscheduled: ${mockUnscheduledOrders.length} orders\n\n🕐 Last Update: ${new Date().toLocaleString()}`);
    }
  };

  const handleNewOrder = () => {
    const newOrderInfo = `
📝 Create New Order
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This will open the order creation workflow:

🔍 Step 1: Order Information
• Order code generation
• Customer selection
• Product specification

📊 Step 2: Production Details
• Quantity and measurements
• SAM calculation
• Complexity assessment

📅 Step 3: Timeline Planning
• Delivery date setting
• Priority assignment
• Factory allocation

Ready to proceed?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `;
    
    const proceed = confirm(newOrderInfo);
    if (proceed) {
      alert(`🚀 Opening Order Creation Form...\n\n📋 This would open a multi-step form for:\n• Order information entry\n• Product specifications\n• Timeline planning\n• Initial requirements setup`);
    }
  };

  const handleExportUnscheduled = () => {
    if (filteredUnscheduledOrders.length === 0) {
      alert('❌ No Orders to Export\n\nNo unscheduled orders match your current filters.');
      return;
    }

    alert(`📊 Export Complete!\n\nExported ${filteredUnscheduledOrders.length} unscheduled orders.\n\n📄 Data includes:\n• Order details and codes\n• Customer information\n• Production specifications\n• Timeline and requirements\n\n💡 Check browser console for data preview.`);
    
    // Log to console for demonstration
    console.table(filteredUnscheduledOrders.map(order => ({
      OrderCode: order.orderCode,
      ProductType: order.productType,
      Customer: order.buyer,
      Quantity: order.quantity,
      Priority: order.priority,
      Status: order.status,
      DeliveryDate: order.deliveryDate
    })));
  };

  const handleRefreshUnscheduled = () => {
    const refreshProcess = `
🔄 Refreshing Unscheduled Orders...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📡 Connecting to server...
📊 Fetching latest order data...
🔍 Checking for new orders...
✅ Updating order statuses...
📋 Refreshing material availability...

✅ Refresh Complete!

📊 Current Status:
• Total Orders: ${mockUnscheduledOrders.length}
• Ready to Schedule: ${mockUnscheduledOrders.filter(o => o.status === 'ready_to_schedule').length}
• Requires Material: ${mockUnscheduledOrders.filter(o => o.status === 'requires_material').length}
• Pending Review: ${mockUnscheduledOrders.filter(o => o.status === 'pending').length}

🕐 Last Updated: ${new Date().toLocaleString()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `;
    
    alert(refreshProcess);
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header with Title and Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Target className="h-6 w-6 text-blue-600" />
            High-Level Planning Board
          </h2>
          <p className="text-muted-foreground">Strategic view for order allocation and capacity planning</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleGlobalExport}>
            <Download className="h-4 w-4 mr-2" />
            Export Plan
          </Button>
          <Button variant="outline" size="sm" onClick={handleGlobalRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm" onClick={handleNewOrder}>
            <Plus className="h-4 w-4 mr-2" />
            New Order
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Style-Level Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Style code, buyer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Buyer</label>
              <Select value={filterBuyer} onValueChange={setFilterBuyer}>
                <SelectTrigger>
                  <SelectValue placeholder="All Buyers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Buyers</SelectItem>
                  {uniqueBuyers.map(buyer => (
                    <SelectItem key={buyer} value={buyer}>{buyer}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Factory</label>
              <Select value={filterFactory} onValueChange={setFilterFactory}>
                <SelectTrigger>
                  <SelectValue placeholder="All Factories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Factories</SelectItem>
                  {uniqueFactories.map(factory => (
                    <SelectItem key={factory} value={factory}>{factory}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">SAM Range</label>
              <Select value={filterSamRange} onValueChange={setFilterSamRange}>
                <SelectTrigger>
                  <SelectValue placeholder="All SAM Ranges" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All SAM Ranges</SelectItem>
                  <SelectItem value="low">Low (&lt; 40 min)</SelectItem>
                  <SelectItem value="medium">Medium (40-55 min)</SelectItem>
                  <SelectItem value="high">High (&gt; 55 min)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="timeline">Weekly Timeline</TabsTrigger>
          <TabsTrigger value="capacity">Line Capacity Heatmap</TabsTrigger>
          <TabsTrigger value="alerts">Alerts & Milestones</TabsTrigger>
          <TabsTrigger value="unscheduled">Unscheduled Orders</TabsTrigger>
        </TabsList>

        {/* Weekly Timeline Tab */}
        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Weekly Timeline View
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Week selector */}
                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium">Starting Week:</label>
                  <Input
                    type="date"
                    value={format(selectedWeek, 'yyyy-MM-dd')}
                    onChange={(e) => setSelectedWeek(new Date(e.target.value))}
                    className="w-auto"
                  />
                </div>

                {/* Weekly timeline grid */}
                <div className="overflow-x-auto">
                  <div className="min-w-full">
                    <div className="grid grid-cols-12 gap-2 mb-4">
                      {weeklyTimelineData.map((week, index) => (
                        <div key={index} className="text-center">
                          <div className="text-xs font-medium text-muted-foreground">
                            Week {index + 1}
                          </div>
                          <div className="text-sm font-medium">
                            {format(new Date(week.weekStart), 'MMM dd')}
                          </div>
                          <div className={cn(
                            "mt-2 p-2 rounded border text-xs",
                            week.utilizationPercent > 100 ? "bg-red-100 border-red-300" :
                            week.utilizationPercent > 85 ? "bg-yellow-100 border-yellow-300" :
                            "bg-green-100 border-green-300"
                          )}>
                            {week.utilizationPercent}% utilized
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Drag-and-drop order allocation area */}
                    <div className="space-y-2">
                      {filteredOrders.map(order => (
                        <div
                          key={order.id}
                          draggable
                          className="p-3 bg-card border rounded-lg cursor-grab hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Badge className={getPriorityColor(order.priority)}>
                                {order.priority.toUpperCase()}
                              </Badge>
                              <div>
                                <div className="font-medium">{order.styleCode}</div>
                                <div className="text-sm text-muted-foreground">
                                  {order.buyer} • {order.quantity.toLocaleString()} pcs
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge className={getStatusColor(order.status)}>
                                {order.status.replace('_', ' ')}
                              </Badge>
                              <div className="text-sm text-muted-foreground mt-1">
                                Due: {format(new Date(order.deliveryDate), 'MMM dd')}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Line Capacity Heatmap Tab */}
        <TabsContent value="capacity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Line Capacity Heatmap
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mockLineCapacity.map(line => (
                  <div
                    key={line.lineId}
                    className={cn(
                      "p-4 rounded-lg border-2",
                      getCapacityColor(line.status)
                    )}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">{line.lineName}</h4>
                      <Badge variant="outline">{line.status}</Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Capacity:</span>
                        <span className="font-medium">{line.capacity}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Allocated:</span>
                        <span className="font-medium">{line.allocated}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Utilization:</span>
                        <span className="font-medium">{line.utilization}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Efficiency:</span>
                        <span className="font-medium">{line.efficiency}%</span>
                      </div>
                      
                      {/* Utilization bar */}
                      <div className="mt-3">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={cn(
                              "h-2 rounded-full transition-all",
                              line.utilization > 100 ? "bg-red-500" :
                              line.utilization > 85 ? "bg-yellow-500" :
                              "bg-green-500"
                            )}
                            style={{ width: `${Math.min(line.utilization, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts & Milestones Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Alerts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Active Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockStyleOrders.flatMap(order => order.alerts).map(alert => (
                    <div key={alert.id} className="p-3 border rounded-lg">
                      <div className="flex items-start gap-3">
                        {getAlertIcon(alert.type)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">
                              {alert.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                            <Badge 
                              variant={alert.severity === 'critical' ? 'destructive' : 
                                     alert.severity === 'warning' ? 'secondary' : 'outline'}
                              className="text-xs"
                            >
                              {alert.severity}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{alert.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">Order: {alert.orderId}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Milestones */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-500" />
                  Milestone Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockStyleOrders.flatMap(order => 
                    order.milestones.map(milestone => ({
                      ...milestone,
                      orderCode: order.styleCode,
                      buyer: order.buyer
                    }))
                  ).map(milestone => (
                    <div key={milestone.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getMilestoneStatusIcon(milestone.status)}
                          <div>
                            <div className="font-medium text-sm">{milestone.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {milestone.orderCode} • {milestone.buyer}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {format(new Date(milestone.targetDate), 'MMM dd')}
                          </div>
                          {milestone.actualDate && (
                            <div className="text-xs text-muted-foreground">
                              Actual: {format(new Date(milestone.actualDate), 'MMM dd')}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Unscheduled Orders Tab */}
        <TabsContent value="unscheduled" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Filters Panel */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Order code, product..."
                      value={unscheduledSearchTerm}
                      onChange={(e) => setUnscheduledSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Status Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select value={unscheduledFilterStatus} onValueChange={setUnscheduledFilterStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="ready_to_schedule">Ready to Schedule</SelectItem>
                      <SelectItem value="requires_material">Requires Material</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Priority Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Priority</label>
                  <Select value={unscheduledFilterPriority} onValueChange={setUnscheduledFilterPriority}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Priorities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priorities</SelectItem>
                      <SelectItem value="high">High Priority</SelectItem>
                      <SelectItem value="medium">Medium Priority</SelectItem>
                      <SelectItem value="low">Low Priority</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Buyer Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Buyer</label>
                  <Select value={unscheduledFilterBuyer} onValueChange={setUnscheduledFilterBuyer}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Buyers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Buyers</SelectItem>
                      {uniqueUnscheduledBuyers.map(buyer => (
                        <SelectItem key={buyer} value={buyer}>{buyer}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Bulk Actions */}
                <div className="space-y-2 pt-4 border-t">
                  <label className="text-sm font-medium">Bulk Actions</label>
                  <Button 
                    onClick={handleBulkSchedule}
                    disabled={selectedOrders.length === 0}
                    className="w-full"
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Schedule Selected ({selectedOrders.length})
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Unscheduled Orders List */}
            <Card className="lg:col-span-3">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-orange-500" />
                    Unscheduled Orders ({filteredUnscheduledOrders.length})
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleExportUnscheduled}>
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleRefreshUnscheduled}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {filteredUnscheduledOrders.map(order => (
                    <div
                      key={order.id}
                      draggable
                      onDragStart={() => handleOrderDragStart(order)}
                      onDragEnd={handleOrderDragEnd}
                      className={cn(
                        "p-4 border rounded-lg cursor-grab hover:shadow-md transition-all",
                        selectedOrders.includes(order.id) ? "border-blue-500 bg-blue-50" : "border-gray-200",
                        "hover:border-gray-300"
                      )}
                    >
                      <div className="flex items-start justify-between">
                        {/* Order Header */}
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={selectedOrders.includes(order.id)}
                            onChange={() => handleOrderSelect(order.id)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold text-sm">{order.orderCode}</h4>
                              <Badge className={getPriorityColor(order.priority)}>
                                {order.priority.toUpperCase()}
                              </Badge>
                              <Badge className={getUnscheduledStatusColor(order.status)}>
                                {order.status.replace('_', ' ').toUpperCase()}
                              </Badge>
                            </div>
                            
                            {/* Order Details Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                              <div>
                                <span className="text-muted-foreground">Product:</span>
                                <div className="font-medium">{order.productCode}</div>
                                <div className="text-xs text-muted-foreground">{order.productType}</div>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Customer:</span>
                                <div className="font-medium">{order.customerCode}</div>
                                <div className="text-xs text-muted-foreground">{order.buyer}</div>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Quantity:</span>
                                <div className="font-medium">{order.quantity.toLocaleString()} pcs</div>
                                <div className="text-xs text-muted-foreground">{order.estimatedHours}h est.</div>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Delivery:</span>
                                <div className="font-medium">{format(new Date(order.deliveryDate), 'MMM dd, yyyy')}</div>
                                <div className="text-xs text-muted-foreground">
                                  {Math.ceil((new Date(order.deliveryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                                </div>
                              </div>
                            </div>

                            {/* SAM & Complexity */}
                            <div className="flex items-center gap-4 mt-3">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">SAM:</span>
                                <Badge variant="outline" className="text-xs">{order.samRange}</Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">Complexity:</span>
                                <Badge className={getComplexityColor(order.complexity)}>
                                  {order.complexity.toUpperCase()}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">Factory:</span>
                                <span className="text-xs font-medium">{order.factory}</span>
                              </div>
                            </div>

                            {/* Requirements */}
                            <div className="mt-3">
                              <span className="text-xs text-muted-foreground">Requirements:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {order.requirements.map((req, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {req}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleViewOrder(order)}>
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button size="sm" onClick={() => handleScheduleOrder(order)}>
                            <Plus className="h-4 w-4 mr-1" />
                            Schedule
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {filteredUnscheduledOrders.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-medium mb-2">No Unscheduled Orders</h3>
                      <p>All orders matching your filters have been scheduled.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default HighLevelPlanningBoard;
