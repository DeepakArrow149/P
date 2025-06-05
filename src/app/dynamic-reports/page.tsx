
// src/app/dynamic-reports/page.tsx
'use client';

import * as React from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label'; 
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Columns,
  Filter as FilterIcon,
  FileText,
  Printer,
  Save,
  FolderOpen,
  Download,
  Settings2,
  Mail,
  ListChecks,
  FilePlus2,
  Sigma,
  CalendarIcon as ReportCalendarIcon, 
  Loader2,
  AlertTriangle,
  LayoutGrid,
  ListFilter,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const reportTypes = [
  { value: 'order_production_summary', label: 'Order-wise Production Summary' },
  { value: 'line_efficiency', label: 'Line-wise Efficiency Report' },
  { value: 'daily_production_output', label: 'Daily Production Output Report' },
  { value: 'tna_compliance', label: 'T&A Compliance Report' },
  { value: 'wip_report', label: 'WIP (Work-in-Progress) Report' },
  { value: 'operator_productivity', label: 'Operator-wise Productivity Report' },
  { value: 'style_costing_actual', label: 'Style-wise Costing vs Actual Report' },
  { value: 'style_target_achievement', label: 'Style Target vs Achievement Report' },
  { value: 'buyer_performance', label: 'Buyer Performance Report' },
  { value: 'rejection_defect_trend', label: 'Rejection & Defect Trend Report' },
  { value: 'generic_product_report', label: 'Generic Product Report' },
  { value: 'generic_planning_summary', label: 'Generic Planning Summary' },
];

const allReportableFields: ReportField[] = [
  // Order Details
  { id: 'order_id', label: 'Order ID', group: 'Order Details', type: 'text' },
  { id: 'order_style', label: 'Order Style', group: 'Order Details', type: 'text' },
  { id: 'order_buyer', label: 'Order Buyer', group: 'Order Details', type: 'text' },
  { id: 'order_quantity', label: 'Order Quantity', group: 'Order Details', type: 'number' },
  { id: 'order_cut_qty', label: 'Cut Quantity', group: 'Order Details', type: 'number' },
  { id: 'order_sewing_input_qty', label: 'Input to Sewing', group: 'Order Details', type: 'number' },
  { id: 'order_sewing_output_qty', label: 'Output from Sewing', group: 'Order Details', type: 'number' },
  { id: 'order_balance_qty', label: 'Balance Quantity (Order - Output)', group: 'Order Details', type: 'number', isCalculated: true },
  { id: 'order_status_prod', label: 'Production Status', group: 'Order Details', type: 'dropdown', options: ['Completed', 'In Progress', 'Pending'] },
  { id: 'order_delivery_date', label: 'Order Delivery Date', group: 'Order Details', type: 'date' },

  // Line Performance
  { id: 'line_name', label: 'Line Name', group: 'Line Performance', type: 'text' },
  { id: 'line_order_id', label: 'Line Order ID', group: 'Line Performance', type: 'text' },
  { id: 'line_style', label: 'Line Style', group: 'Line Performance', type: 'text' },
  { id: 'line_sam', label: 'Line SAM', group: 'Line Performance', type: 'number' },
  { id: 'line_output_qty', label: 'Line Output Qty', group: 'Line Performance', type: 'number' },
  { id: 'line_manpower', label: 'Line Manpower', group: 'Line Performance', type: 'number' },
  { id: 'line_working_hours', label: 'Line Working Hours', group: 'Line Performance', type: 'number' },
  { id: 'line_efficiency_percent', label: 'Line Efficiency (%)', group: 'Line Performance', type: 'number', isCalculated: true },
  { id: 'line_target_qty', label: 'Line Target Qty', group: 'Line Performance', type: 'number' },
  { id: 'line_actual_qty', label: 'Line Actual Qty', group: 'Line Performance', type: 'number' },

  // Daily Production Output
  { id: 'daily_prod_date', label: 'Production Date', group: 'Daily Production Output', type: 'date' },
  { id: 'daily_prod_shift', label: 'Shift', group: 'Daily Production Output', type: 'text' },
  { id: 'daily_prod_line', label: 'Production Line', group: 'Daily Production Output', type: 'text' },
  { id: 'daily_prod_style', label: 'Production Style', group: 'Daily Production Output', type: 'text' },
  { id: 'daily_prod_operator', label: 'Operator', group: 'Daily Production Output', type: 'text' },
  { id: 'daily_prod_output_qty', label: 'Daily Output Quantity', group: 'Daily Production Output', type: 'number' },
  { id: 'daily_prod_defects_qty', label: 'Defects Quantity', group: 'Daily Production Output', type: 'number' },
  { id: 'daily_prod_remarks', label: 'Remarks', group: 'Daily Production Output', type: 'textarea' },
  { id: 'daily_prod_dhu_percent', label: 'DHU (%)', group: 'Daily Production Output', type: 'number', isCalculated: true },

  // T&A Compliance
  { id: 'tna_order_id', label: 'T&A Order ID', group: 'T&A Compliance', type: 'text' },
  { id: 'tna_style', label: 'T&A Style', group: 'T&A Compliance', type: 'text' },
  { id: 'tna_buyer', label: 'T&A Buyer', group: 'T&A Compliance', type: 'text' },
  { id: 'tna_milestone', label: 'Milestone', group: 'T&A Compliance', type: 'text' },
  { id: 'tna_target_date', label: 'Target Date', group: 'T&A Compliance', type: 'date' },
  { id: 'tna_actual_date', label: 'Actual Date', group: 'T&A Compliance', type: 'date' },
  { id: 'tna_delay_days', label: 'Delay (Days)', group: 'T&A Compliance', type: 'number', isCalculated: true },
  { id: 'tna_compliance_status', label: 'Compliance Status', group: 'T&A Compliance', type: 'dropdown', options: ['On Time', 'Delayed'] },

  // WIP Report
  { id: 'wip_order_id', label: 'WIP Order ID', group: 'WIP Report', type: 'text' },
  { id: 'wip_style', label: 'WIP Style', group: 'WIP Report', type: 'text' },
  { id: 'wip_stage', label: 'Stage', group: 'WIP Report', type: 'dropdown', options: ['Cutting', 'Sewing', 'Washing', 'Finishing'] },
  { id: 'wip_received_qty', label: 'Received Qty', group: 'WIP Report', type: 'number' },
  { id: 'wip_completed_qty', label: 'Completed Qty', group: 'WIP Report', type: 'number' },
  { id: 'wip_balance_qty', label: 'WIP Balance Qty', group: 'WIP Report', type: 'number', isCalculated: true },

  // Operator Performance
  { id: 'op_name', label: 'Operator Name', group: 'Operator Performance', type: 'text' },
  { id: 'op_line', label: 'Operator Line', group: 'Operator Performance', type: 'text' },
  { id: 'op_style', label: 'Operator Style', group: 'Operator Performance', type: 'text' },
  { id: 'op_output_qty', label: 'Operator Output Qty', group: 'Operator Performance', type: 'number' },
  { id: 'op_minutes_worked', label: 'Minutes Worked', group: 'Operator Performance', type: 'number' },
  { id: 'op_smv_used', label: 'SMV Used', group: 'Operator Performance', type: 'number', isCalculated: true },
  { id: 'op_efficiency_percent', label: 'Operator Efficiency (%)', group: 'Operator Performance', type: 'number', isCalculated: true },
  
  // Style Costing
  { id: 'cost_style', label: 'Style (Costing)', group: 'Style Costing', type: 'text' },
  { id: 'cost_order_qty', label: 'Order Qty (Costing)', group: 'Style Costing', type: 'number' },
  { id: 'cost_material', label: 'Material Cost', group: 'Style Costing', type: 'number' },
  { id: 'cost_labour', label: 'Labour Cost', group: 'Style Costing', type: 'number' },
  { id: 'cost_overhead', label: 'Overhead Cost', group: 'Style Costing', type: 'number' },
  { id: 'cost_planned', label: 'Planned Cost', group: 'Style Costing', type: 'number', isCalculated: true },
  { id: 'cost_actual', label: 'Actual Cost', group: 'Style Costing', type: 'number' },
  { id: 'cost_variance', label: 'Cost Variance', group: 'Style Costing', type: 'number', isCalculated: true },

  // Style Target Achievement
  { id: 'target_style', label: 'Style (Target)', group: 'Style Target Achievement', type: 'text' },
  { id: 'target_order_qty', label: 'Order Qty (Target)', group: 'Style Target Achievement', type: 'number' },
  { id: 'target_target_qty', label: 'Target Qty', group: 'Style Target Achievement', type: 'number' },
  { id: 'target_actual_output', label: 'Actual Output (Target)', group: 'Style Target Achievement', type: 'number' },
  { id: 'target_achievement_percent', label: 'Achievement (%)', group: 'Style Target Achievement', type: 'number', isCalculated: true },

  // Buyer Performance
  { id: 'buyer_name_perf', label: 'Buyer Name', group: 'Buyer Performance', type: 'text' },
  { id: 'buyer_total_orders', label: 'Total Orders (Buyer)', group: 'Buyer Performance', type: 'number' },
  { id: 'buyer_total_qty_ordered', label: 'Total Qty Ordered (Buyer)', group: 'Buyer Performance', type: 'number' },
  { id: 'buyer_total_delivered', label: 'Total Delivered (Buyer)', group: 'Buyer Performance', type: 'number' },
  { id: 'buyer_ontime_delivery_count', label: 'On-time Delivery Count', group: 'Buyer Performance', type: 'number' },
  { id: 'buyer_ontime_percent', label: 'On-Time Delivery (%)', group: 'Buyer Performance', type: 'number', isCalculated: true },

  // Quality & Rejection
  { id: 'quality_date', label: 'Date (Quality)', group: 'Quality & Rejection', type: 'date' },
  { id: 'quality_line', label: 'Line (Quality)', group: 'Quality & Rejection', type: 'text' },
  { id: 'quality_style', label: 'Style (Quality)', group: 'Quality & Rejection', type: 'text' },
  { id: 'quality_defect_type', label: 'Defect Type', group: 'Quality & Rejection', type: 'text' },
  { id: 'quality_defect_qty', label: 'Defect Quantity', group: 'Quality & Rejection', type: 'number' },
  { id: 'quality_defect_reason', label: 'Defect Reason', group: 'Quality & Rejection', type: 'text' },
  { id: 'quality_rejection_rate', label: 'Rejection Rate (%)', group: 'Quality & Rejection', type: 'number', isCalculated: true },

  // User Defined Fields (Example)
  { id: 'udf_style_fit', label: 'UDF: Style Fit', group: 'User Defined Fields', type: 'dropdown', options: ['Slim', 'Regular', 'Loose'] },
  { id: 'udf_season_code', label: 'UDF: Season Code', group: 'User Defined Fields', type: 'text' },
];


interface ReportField {
  id: string;
  label: string;
  group: string;
  type: 'text' | 'number' | 'date' | 'dropdown' | 'checkbox' | 'textarea'; 
  options?: string[]; 
  isCalculated?: boolean; 
}


const mockReportData = [
  { order_id: 'ORD-001', order_style: 'TSHIRT-001', order_buyer: 'Alpha Corp', order_quantity: 100, order_delivery_date: '2024-12-01', line_name: 'Line A', line_sam: 10, line_output_qty: 800, line_manpower: 10, line_working_hours: 8 },
  { order_id: 'ORD-002', order_style: 'JACKET-005', order_buyer: 'Beta Retail', order_quantity: 50, order_delivery_date: '2024-11-15', line_name: 'Line B', line_sam: 25, line_output_qty: 150, line_manpower: 8, line_working_hours: 8 },
  { order_id: 'ORD-003', order_style: 'PANTS-002', order_buyer: 'Gamma LLC', order_quantity: 200, order_delivery_date: '2025-01-10', line_name: 'Line A', line_sam: 15, line_output_qty: 900, line_manpower: 12, line_working_hours: 7.5 },
];

const staticReportFormSchema = z.object({
  staticReportName: z.string().optional(),
  autoGenerateName: z.boolean().optional().default(false),
  selectedStaticFields: z.array(z.string()).min(1, "Please select at least one field for the report."),
  filterStatus: z.string().optional(),
  filterGroupBy: z.string().optional().default('none'),
  filterDeliveryDateFrom: z.date().optional(),
  filterDeliveryDateTo: z.date().optional(),
  filterKeyword: z.string().optional(),
}).refine(data => !data.autoGenerateName ? !!data.staticReportName && data.staticReportName.trim() !== '' : true, {
  message: "Report Name is required if 'Auto-generate name' is not checked.",
  path: ['staticReportName'],
}).refine(data => {
  if (data.filterDeliveryDateFrom && data.filterDeliveryDateTo) {
    return data.filterDeliveryDateTo >= data.filterDeliveryDateFrom;
  }
  return true;
}, {
  message: "Delivery Date 'To' must be after or same as 'From'.",
  path: ['filterDeliveryDateTo'],
});

type StaticReportFormValues = z.infer<typeof staticReportFormSchema>;

interface GeneratedReportInfo {
  name: string;
  fields: string[]; 
  timestamp: string;
  filtersApplied: Omit<StaticReportFormValues, 'selectedStaticFields' | 'staticReportName' | 'autoGenerateName'>;
}

export default function DynamicReportsPage() {
  const { toast } = useToast();
  const [selectedReportType, setSelectedReportType] = React.useState<string>(reportTypes[0].value);
  const [isFiltersPanelOpen, setIsFiltersPanelOpen] = React.useState(false);
  const [reportMode, setReportMode] = React.useState<'dynamic' | 'static'>('dynamic');
  
  const [selectedDynamicColumns, setSelectedDynamicColumns] = React.useState<string[]>(() => allReportableFields.slice(0, 6).map(f => f.id));
  const [dynamicColumnFilters, setDynamicColumnFilters] = React.useState<Record<string, string>>({});
  const [displayedDynamicData, setDisplayedDynamicData] = React.useState(mockReportData);

  const [isGeneratingStaticReport, setIsGeneratingStaticReport] = React.useState(false);
  const [staticReportGeneratedInfo, setStaticReportGeneratedInfo] = React.useState<GeneratedReportInfo | null>(null);

  const staticForm = useForm<StaticReportFormValues>({
    resolver: zodResolver(staticReportFormSchema),
    defaultValues: {
      staticReportName: '',
      autoGenerateName: false,
      selectedStaticFields: [],
      filterStatus: undefined,
      filterGroupBy: 'none',
      filterDeliveryDateFrom: undefined,
      filterDeliveryDateTo: undefined,
      filterKeyword: '',
    },
  });

  React.useEffect(() => {
    let filteredData = [...mockReportData];
    Object.entries(dynamicColumnFilters).forEach(([fieldId, filterValue]) => {
      if (filterValue) {
        const fieldType = allReportableFields.find(f => f.id === fieldId)?.type;
        filteredData = filteredData.filter(row => {
          const rowValue = (row as any)[fieldId];
          if (rowValue === undefined || rowValue === null) return false;
          if (fieldType === 'number') {
            return Number(rowValue) === Number(filterValue);
          }
          return String(rowValue).toLowerCase().includes(filterValue.toLowerCase());
        });
      }
    });
    setDisplayedDynamicData(filteredData);
  }, [dynamicColumnFilters]);
  
  const handleDynamicColumnSelection = (fieldId: string) => {
    setSelectedDynamicColumns(prev =>
      prev.includes(fieldId) ? prev.filter(id => id !== fieldId) : [...prev, fieldId]
    );
  };

  const handleDynamicFilterChange = (fieldId: string, value: string) => {
    setDynamicColumnFilters(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleConfigureFilters = () => {
    setIsFiltersPanelOpen(!isFiltersPanelOpen);
  };

  const handleExport = (format: 'Excel' | 'PDF' | 'Print') => {
    toast({ title: `Export Report`, description: `Exporting as ${format}. (Functionality to be implemented)` });
  };

  const handleSaveView = () => {
     toast({ title: `Save Report View`, description: `Current view configuration saved. (Functionality to be implemented)` });
  };

  const handleLoadView = () => {
     toast({ title: `Load Report View`, description: `Loading saved view. (Functionality to be implemented)` });
  };

  const handleGenerateStaticReport = async (data: StaticReportFormValues) => {
    const { selectedStaticFields, staticReportName, autoGenerateName, ...filters } = data;

    if (selectedStaticFields.length === 0) {
       staticForm.setError("selectedStaticFields", { type: "manual", message: "Please select at least one field." });
       toast({ title: "Fields Required", description: "Please select at least one field for the static report.", variant: "destructive" });
       return;
    }

    const reportNameToGenerate = autoGenerateName
      ? `StaticReport_${new Date().toISOString().slice(0,10).replace(/-/g,'')}_${Date.now()}`
      : staticReportName!;
    
    if (!reportNameToGenerate.trim() && !autoGenerateName) {
       staticForm.setError("staticReportName", { type: "manual", message: "Report name is required." });
       toast({ title: "Report Name Required", description: "Please enter a name for the static report or enable auto-generation.", variant: "destructive" });
      return;
    }

    setIsGeneratingStaticReport(true);
    setStaticReportGeneratedInfo(null); 

    await new Promise(resolve => setTimeout(resolve, 1500));

    const selectedFieldLabels = selectedStaticFields.map(id => allReportableFields.find(f => f.id === id)?.label || id);

    setStaticReportGeneratedInfo({
      name: reportNameToGenerate,
      fields: selectedFieldLabels,
      timestamp: new Date().toLocaleString(),
      filtersApplied: filters,
    });
    setIsGeneratingStaticReport(false);
    toast({ title: 'Static Report Generated!', description: `"${reportNameToGenerate}" is ready.` });
  };

  const groupedReportableFields = React.useMemo(() => {
    return allReportableFields.reduce((acc, field) => {
      (acc[field.group] = acc[field.group] || []).push(field);
      return acc;
    }, {} as Record<string, ReportField[]>);
  }, []);
  
  const handleStaticFieldSelection = (fieldId: string) => {
    const currentSelected = staticForm.getValues("selectedStaticFields") || [];
    const newSelected = currentSelected.includes(fieldId)
      ? currentSelected.filter(id => id !== fieldId)
      : [...currentSelected, fieldId];
    staticForm.setValue("selectedStaticFields", newSelected, { shouldValidate: true, shouldDirty: true });
  };

  const handleExportStatic = (type: string) => {
    if (!staticReportGeneratedInfo) return;
    toast({ title: `Exporting Static Report`, description: `Exporting "${staticReportGeneratedInfo.name}" as ${type}. (Actual export to be implemented)` });
  }

  return (
    <>
      <PageHeader
        title="Dynamic Reporting System"
        description="Generate customizable reports with advanced filtering and grouping."
        actions={
          <div className="flex items-center gap-2">
            {reportMode === 'dynamic' && (
              <>
                <Button variant="outline" onClick={handleSaveView}><Save className="mr-2 h-4 w-4" /> Save View</Button>
                <Button variant="outline" onClick={handleLoadView}><FolderOpen className="mr-2 h-4 w-4" /> Load View</Button>
              </>
            )}
          </div>
        }
      />

      <Card className="mb-6 shadow-md">
        <CardHeader>
          <CardTitle>Report Mode</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={reportMode}
            onValueChange={(value: 'dynamic' | 'static') => {
              setReportMode(value);
              setStaticReportGeneratedInfo(null); 
              setIsFiltersPanelOpen(false); 
            }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Label className="flex items-center space-x-2 border p-3 rounded-md hover:bg-accent has-[:checked]:bg-primary has-[:checked]:text-primary-foreground cursor-pointer flex-1">
              <RadioGroupItem value="dynamic" id="mode-dynamic" />
              <span>Dynamic Report (Interactive)</span>
            </Label>
            <Label className="flex items-center space-x-2 border p-3 rounded-md hover:bg-accent has-[:checked]:bg-primary has-[:checked]:text-primary-foreground cursor-pointer flex-1">
              <RadioGroupItem value="static" id="mode-static" />
              <span>Generate Static Report</span>
            </Label>
          </RadioGroup>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Form {...staticForm}> 
          <form onSubmit={staticForm.handleSubmit(handleGenerateStaticReport)} className="lg:col-span-3 contents"> 
            <Card className="lg:col-span-3 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings2 className="mr-2 h-5 w-5 text-primary"/> 
                  {reportMode === 'dynamic' ? 'Dynamic Report Configuration' : 'Static Report Setup'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {reportMode === 'dynamic' && (
                  <>
                    <div>
                      <Label htmlFor="reportType" className="text-sm font-medium">Report Type</Label>
                      <Select value={selectedReportType} onValueChange={setSelectedReportType}>
                        <SelectTrigger id="reportType" className="mt-1">
                          <SelectValue placeholder="Select report type" />
                        </SelectTrigger>
                        <SelectContent>
                          {reportTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button variant="outline" className="w-full justify-start" onClick={handleConfigureFilters}><LayoutGrid className="mr-2 h-4 w-4" /> Columns & Filters</Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="default" className="w-full justify-start"><Download className="mr-2 h-4 w-4" /> Export Dynamic Report<span className="ml-auto text-xs text-primary-foreground/70">▼</span></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-[--radix-dropdown-menu-trigger-width)]">
                        <DropdownMenuItem onSelect={() => handleExport('Excel')}><FileText className="mr-2 h-4 w-4" /> Export as Excel</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleExport('PDF')}><FileText className="mr-2 h-4 w-4" /> Export as PDF</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleExport('Print')}><Printer className="mr-2 h-4 w-4" /> Print View</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                )}

                {reportMode === 'static' && (
                  <>
                    <FormField control={staticForm.control} name="staticReportName" render={({ field }) => (
                        <FormItem><FormLabel className="text-sm font-medium">Report Name</FormLabel>
                            <FormControl><Input id="reportName" placeholder="e.g., Monthly_Sales_Summary" {...field} disabled={staticForm.watch('autoGenerateName')} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}/>
                    <FormField control={staticForm.control} name="autoGenerateName" render={({ field }) => (
                        <FormItem className="flex items-center space-x-2 pt-1">
                            <FormControl><Checkbox id="autoGenerateName" checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                            <Label htmlFor="autoGenerateName" className="text-xs font-normal cursor-pointer">Auto-generate name</Label>
                        </FormItem>
                    )}/>
                    <Separator />

                    <Card className="bg-muted/30">
                        <CardHeader className="pb-2 pt-3"><CardTitle className="text-sm font-medium flex items-center"><ListChecks className="mr-2 h-4 w-4"/>Select Fields for Static Report</CardTitle></CardHeader>
                        <CardContent className="pt-2">
                        <ScrollArea className="h-48 overflow-y-auto space-y-3 pr-2">
                            {Object.entries(groupedReportableFields).map(([groupName, fields]) => (
                            <div key={groupName} className="mb-3">
                                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">{groupName}</h4>
                                {fields.map(field => (
                                <FormItem key={field.id} className="flex items-center space-x-2 py-1">
                                    <Checkbox 
                                        id={`static-field-${field.id}`}
                                        checked={staticForm.watch("selectedStaticFields")?.includes(field.id)}
                                        onCheckedChange={() => handleStaticFieldSelection(field.id)}
                                    />
                                    <Label htmlFor={`static-field-${field.id}`} className="text-xs font-normal cursor-pointer">{field.label}</Label>
                                </FormItem>
                                ))}
                            </div>
                            ))}
                        </ScrollArea>
                         <FormMessage>{staticForm.formState.errors.selectedStaticFields?.message}</FormMessage>
                        </CardContent>
                    </Card>
                    
                    <Separator />
                    <Card className="bg-muted/30">
                      <CardHeader className="pb-2 pt-3"><CardTitle className="text-sm font-medium flex items-center"><ListFilter className="mr-2 h-4 w-4"/>Report Filters</CardTitle></CardHeader>
                      <CardContent className="pt-2 space-y-3">
                        <FormField control={staticForm.control} name="filterStatus" render={({ field }) => (
                          <FormItem><FormLabel className="text-xs">Status</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || undefined}><FormControl><SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Any Status" /></SelectTrigger></FormControl>
                              <SelectContent><SelectItem value="confirmed">Confirmed</SelectItem><SelectItem value="in_progress">In Progress</SelectItem><SelectItem value="pending">Pending</SelectItem></SelectContent>
                            </Select><FormMessage />
                          </FormItem>
                        )}/>
                        <FormField control={staticForm.control} name="filterGroupBy" render={({ field }) => (
                          <FormItem><FormLabel className="text-xs">Group By</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || 'none'}><FormControl><SelectTrigger className="h-9 text-xs"><SelectValue placeholder="None" /></SelectTrigger></FormControl>
                              <SelectContent><SelectItem value="none">None</SelectItem><SelectItem value="order_buyer">Customer</SelectItem><SelectItem value="order_status_prod">Status</SelectItem></SelectContent>
                            </Select><FormMessage />
                          </FormItem>
                        )}/>
                        <div className="grid grid-cols-2 gap-3">
                            <FormField control={staticForm.control} name="filterDeliveryDateFrom" render={({ field }) => (
                                <FormItem className="flex flex-col"><FormLabel className="text-xs">Delivery Date From</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant="outline" size="sm" className={cn("h-9 text-xs justify-start", !field.value && "text-muted-foreground")}><ReportCalendarIcon className="mr-1 h-3 w-3" />{field.value ? format(field.value, "MMM dd, yyyy") : <span>Pick date</span>}</Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent></Popover><FormMessage /></FormItem>
                            )}/>
                            <FormField control={staticForm.control} name="filterDeliveryDateTo" render={({ field }) => (
                                <FormItem className="flex flex-col"><FormLabel className="text-xs">Delivery Date To</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant="outline" size="sm" className={cn("h-9 text-xs justify-start", !field.value && "text-muted-foreground")}><ReportCalendarIcon className="mr-1 h-3 w-3" />{field.value ? format(field.value, "MMM dd, yyyy") : <span>Pick date</span>}</Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent></Popover><FormMessage /></FormItem>
                            )}/>
                        </div>
                        <FormField control={staticForm.control} name="filterKeyword" render={({ field }) => (
                            <FormItem><FormLabel className="text-xs">Keyword Search</FormLabel><FormControl><Input {...field} placeholder="Search across selected fields" className="h-9 text-xs"/></FormControl><FormMessage /></FormItem>
                        )}/>
                      </CardContent>
                    </Card>
                    
                    <Button type="submit" variant="default" className="w-full" disabled={isGeneratingStaticReport}>
                      {isGeneratingStaticReport ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FilePlus2 className="mr-2 h-4 w-4" />}
                      {isGeneratingStaticReport ? 'Generating...' : 'Generate Static Report'}
                    </Button>
                    <Separator />
                    <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Output Options:</Label>
                        <Button variant="outline" size="sm" className="w-full justify-start" disabled={!staticReportGeneratedInfo} onClick={() => handleExportStatic('PDF')}><Download className="mr-2 h-3 w-3" /> Download as PDF</Button>
                        <Button variant="outline" size="sm" className="w-full justify-start" disabled={!staticReportGeneratedInfo} onClick={() => handleExportStatic('Excel')}><Download className="mr-2 h-3 w-3" /> Export as Excel</Button>
                        <Button variant="outline" size="sm" className="w-full justify-start" disabled={!staticReportGeneratedInfo} onClick={() => handleExportStatic('CSV')}><Download className="mr-2 h-3 w-3" /> Export as CSV</Button>
                        <Button variant="outline" size="sm" className="w-full justify-start" disabled><FolderOpen className="mr-2 h-3 w-3" /> View All Static Reports</Button>
                        <Button variant="outline" size="sm" className="w-full justify-start" disabled><Mail className="mr-2 h-3 w-3" /> Email Report To Me</Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </form>
        </Form>

        <div className="lg:col-span-9 space-y-6">
          {reportMode === 'dynamic' && isFiltersPanelOpen && (
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle>Dynamic Report Filters & Columns</CardTitle>
                <CardDescription>Select columns to display and apply filters for the dynamic report.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Card className="bg-muted/30">
                  <CardHeader className="pb-2 pt-3">
                    <CardTitle className="text-sm font-medium flex items-center"><Columns className="mr-2 h-4 w-4"/>Select Columns for Dynamic Report</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <ScrollArea className="h-40 overflow-y-auto space-y-2 pr-2">
                      {Object.entries(groupedReportableFields).map(([groupName, fields]) => (
                        <div key={`dynamic-group-${groupName}`} className="mb-2">
                          <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{groupName}</h5>
                          {fields.map(field => (
                            <FormItem key={`dynamic-field-${field.id}`} className="flex items-center space-x-2 py-0.5">
                              <Checkbox
                                id={`dynamic-col-${field.id}`}
                                checked={selectedDynamicColumns.includes(field.id)}
                                onCheckedChange={() => handleDynamicColumnSelection(field.id)}
                              />
                              <Label htmlFor={`dynamic-col-${field.id}`} className="text-xs font-normal cursor-pointer">{field.label}</Label>
                            </FormItem>
                          ))}
                        </div>
                      ))}
                    </ScrollArea>
                  </CardContent>
                </Card>
                <Card className="bg-muted/30">
                  <CardHeader className="pb-2 pt-3">
                    <CardTitle className="text-sm font-medium flex items-center"><FilterIcon className="mr-2 h-4 w-4"/>Active Filters</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3">
                    {selectedDynamicColumns.map(fieldId => {
                       const fieldDef = allReportableFields.find(f => f.id === fieldId);
                       if (!fieldDef) return null;
                       return (
                         <FormItem key={`filter-${fieldId}`}>
                           <Label htmlFor={`filter-input-${fieldId}`} className="text-xs">{fieldDef.label}</Label>
                           <Input 
                             id={`filter-input-${fieldId}`}
                             placeholder={`Filter ${fieldDef.label}...`}
                             value={dynamicColumnFilters[fieldId] || ''}
                             onChange={(e) => handleDynamicFilterChange(fieldId, e.target.value)}
                             className="h-8 text-xs"
                           />
                         </FormItem>
                       );
                    })}
                    {selectedDynamicColumns.length === 0 && <p className="text-xs text-muted-foreground col-span-full">Select columns to apply filters.</p>}
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          )}

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Report Output</CardTitle>
              <CardDescription>
                {reportMode === 'dynamic' 
                  ? `Displaying: ${reportTypes.find(rt => rt.value === selectedReportType)?.label || 'Selected Report'}. This is mock data. Actual dynamic reporting requires backend integration.`
                  : staticReportGeneratedInfo ? `Generated: ${staticReportGeneratedInfo.name}` : `Static report preview/status.`
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reportMode === 'dynamic' ? (
                <div className="overflow-x-auto">
                  {selectedDynamicColumns.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>{selectedDynamicColumns.map(colId => {
                            const colDef = allReportableFields.find(f => f.id === colId);
                            return <TableHead key={colId}>{colDef?.label || colId}</TableHead>;
                        })}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {displayedDynamicData.length > 0 ? displayedDynamicData.map((row, index) => (
                          <TableRow key={index}>
                            {selectedDynamicColumns.map(colId => (
                              <TableCell key={`${index}-${colId}`}>{(row as any)[colId] !== undefined ? String((row as any)[colId]) : '-'}</TableCell>
                            ))}
                          </TableRow>
                        )) : (
                          <TableRow><TableCell colSpan={selectedDynamicColumns.length} className="h-24 text-center">No data matches your filters.</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  ) : (
                     <div className="min-h-[150px] border-2 border-dashed border-border rounded-md flex flex-col items-center justify-center text-center p-4">
                        <LayoutGrid className="h-10 w-10 text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">Please select columns to display in the report.</p>
                        <Button variant="link" size="sm" className="mt-1" onClick={() => setIsFiltersPanelOpen(true)}>Configure Columns & Filters</Button>
                    </div>
                  )}
                </div>
              ) : staticReportGeneratedInfo ? (
                <div className="space-y-3">
                  <h4 className="font-semibold">Report: {staticReportGeneratedInfo.name}</h4>
                  <p className="text-xs text-muted-foreground">Generated: {staticReportGeneratedInfo.timestamp}</p>
                  <p className="text-xs"><strong>Filters Applied:</strong> Status: {staticReportGeneratedInfo.filtersApplied.filterStatus || 'Any'}, Group By: {staticReportGeneratedInfo.filtersApplied.filterGroupBy || 'None'}, Keyword: "{staticReportGeneratedInfo.filtersApplied.filterKeyword || ''}"</p>
                   <p className="text-xs"><strong>Delivery Range:</strong> {staticReportGeneratedInfo.filtersApplied.filterDeliveryDateFrom ? format(staticReportGeneratedInfo.filtersApplied.filterDeliveryDateFrom, 'PPP') : 'N/A'} to {staticReportGeneratedInfo.filtersApplied.filterDeliveryDateTo ? format(staticReportGeneratedInfo.filtersApplied.filterDeliveryDateTo, 'PPP') : 'N/A'}</p>
                  <p className="text-xs"><strong>Selected Fields ({staticReportGeneratedInfo.fields.length}):</strong> {staticReportGeneratedInfo.fields.join(', ')}</p>
                  <div className="min-h-[150px] border-2 border-dashed border-border rounded-md flex flex-col items-center justify-center text-center p-4">
                    <Sigma className="h-10 w-10 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">Report data preview would appear here based on selected fields and filters.</p>
                  </div>
                </div>
              ) : (
                <div className="min-h-[200px] border-2 border-dashed border-border rounded-md flex flex-col items-center justify-center text-center">
                  <Sigma className="h-12 w-12 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">Configure and click "Generate Static Report".</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

