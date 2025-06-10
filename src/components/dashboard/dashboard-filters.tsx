"use client";

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Filter, 
  Calendar as CalendarIcon, 
  Users, 
  Factory, 
  Package,
  X,
  RefreshCw,
  Eye
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useDashboardApi } from '@/hooks/useDashboardApi';

import { DateRange } from 'react-day-picker';

interface FilterState {
  dateRange: DateRange | undefined;
  buyers: string[];
  lines: string[];
  styleCodes: string[];
  orderStatus: string[];
  priority: string[];  userRole: string;
}

export function DashboardFilters() {
  const { orders, buyers, lines, loading, refreshDashboard, lastUpdated } = useDashboardApi();
  
  // Generate filter options from real API data
  const filterOptions = React.useMemo(() => {
    const uniqueBuyers = Array.from(new Set(buyers.map(b => b.name))).filter(Boolean);
    const uniqueLines = Array.from(new Set(lines.map(l => l.lineName || l.lineCode))).filter(Boolean);
    const uniqueStyleCodes = Array.from(new Set(orders.map(o => o.product).filter(Boolean)));
    const uniqueOrderStatus = Array.from(new Set(orders.map(o => o.status).filter(Boolean)));
    
    return {
      buyers: uniqueBuyers.length > 0 ? uniqueBuyers : [
        'Nike Apparel', 'H&M Global', 'Zara International', 'Gap Inc.', 'Uniqlo', 'Adidas Sports', 'Puma Athletic'
      ],
      lines: uniqueLines.length > 0 ? uniqueLines : [
        'Line 1 - Sewing', 'Line 2 - Sewing', 'Line 3 - Cutting', 'Line 4 - Finishing', 
        'Line 5 - Assembly', 'Line 6 - Packing', 'Line 7 - Quality', 'Line 8 - Pressing'
      ],
      styleCodes: uniqueStyleCodes.length > 0 ? uniqueStyleCodes : [
        'BT-2024-001', 'CP-2024-002', 'DJ-2024-003', 'CH-2024-004', 
        'SD-2024-005', 'SJ-2024-006', 'CRP-2024-007', 'BS-2024-008'
      ],
      orderStatus: uniqueOrderStatus.length > 0 ? uniqueOrderStatus.map(status => 
        status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')
      ) : [
        'Confirmed', 'In Progress', 'Scheduled', 'Completed', 'Delayed', 'Pending', 'On Hold'
      ],
      priority: ['High', 'Medium', 'Low'],
      userRoles: ['Line Supervisor', 'Production Manager', 'IE Team', 'Top Management']
    };
  }, [orders, buyers, lines]);const [filters, setFilters] = useState<FilterState>({
    dateRange: undefined,
    buyers: [],
    lines: [],
    styleCodes: [],
    orderStatus: [],
    priority: [],
    userRole: 'Production Manager'
  });

  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleArrayFilterToggle = (key: keyof FilterState, value: string) => {
    const currentArray = filters[key] as string[];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    
    handleFilterChange(key, newArray);
  };
  const clearAllFilters = () => {
    setFilters({
      dateRange: undefined,
      buyers: [],
      lines: [],
      styleCodes: [],
      orderStatus: [],
      priority: [],
      userRole: filters.userRole // Keep user role
    });
  };
  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.dateRange?.from || filters.dateRange?.to) count++;
    count += filters.buyers.length;
    count += filters.lines.length;
    count += filters.styleCodes.length;
    count += filters.orderStatus.length;
    count += filters.priority.length;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className="mb-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Role-Based View Selector */}
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm">View:</Label>
                <Select 
                  value={filters.userRole} 
                  onValueChange={(value) => handleFilterChange('userRole', value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {filterOptions.userRoles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Quick Date Range */}
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[240px] justify-start text-left font-normal">                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateRange?.from ? (
                        filters.dateRange?.to ? (
                          <>
                            {format(filters.dateRange.from, "LLL dd, y")} -{" "}
                            {format(filters.dateRange.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(filters.dateRange.from, "LLL dd, y")
                        )
                      ) : (
                        <span>Pick a date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={filters.dateRange?.from}
                      selected={filters.dateRange}
                      onSelect={(range) => handleFilterChange('dateRange', range)}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>            <div className="flex items-center gap-2">
              {/* Data Status and Refresh */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground mr-4">
                <span>Last updated: {new Date(lastUpdated).toLocaleTimeString()}</span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={refreshDashboard}
                  disabled={loading}
                  className="h-8 w-8 p-0"
                >
                  <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                </Button>
              </div>
              
              {/* Active Filters Count */}
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="mr-2">
                  {activeFiltersCount} filter{activeFiltersCount !== 1 ? 's' : ''} active
                </Badge>
              )}

              {/* Advanced Filters Toggle */}
              <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="mr-2 h-4 w-4" />
                    Filters
                    {activeFiltersCount > 0 && (
                      <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                        {activeFiltersCount}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[500px] p-0" align="end">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium">Advanced Filters</h4>
                      <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Clear All
                      </Button>
                    </div>

                    <Tabs defaultValue="general" className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="general">General</TabsTrigger>
                        <TabsTrigger value="production">Production</TabsTrigger>
                        <TabsTrigger value="advanced">Advanced</TabsTrigger>
                      </TabsList>

                      <TabsContent value="general" className="space-y-4 mt-4">
                        {/* Buyers Filter */}
                        <div>
                          <Label className="text-sm font-medium flex items-center gap-2 mb-2">
                            <Users className="h-4 w-4" />
                            Buyers
                          </Label>
                          <div className="flex flex-wrap gap-2 max-h-20 overflow-y-auto">
                            {filterOptions.buyers.map((buyer) => (
                              <Badge
                                key={buyer}
                                variant={filters.buyers.includes(buyer) ? "default" : "outline"}
                                className="cursor-pointer"
                                onClick={() => handleArrayFilterToggle('buyers', buyer)}
                              >
                                {buyer}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Order Status Filter */}
                        <div>
                          <Label className="text-sm font-medium flex items-center gap-2 mb-2">
                            <Package className="h-4 w-4" />
                            Order Status
                          </Label>
                          <div className="flex flex-wrap gap-2">
                            {filterOptions.orderStatus.map((status) => (
                              <Badge
                                key={status}
                                variant={filters.orderStatus.includes(status) ? "default" : "outline"}
                                className="cursor-pointer"
                                onClick={() => handleArrayFilterToggle('orderStatus', status)}
                              >
                                {status}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="production" className="space-y-4 mt-4">
                        {/* Production Lines Filter */}
                        <div>
                          <Label className="text-sm font-medium flex items-center gap-2 mb-2">
                            <Factory className="h-4 w-4" />
                            Production Lines
                          </Label>
                          <div className="flex flex-wrap gap-2 max-h-20 overflow-y-auto">
                            {filterOptions.lines.map((line) => (
                              <Badge
                                key={line}
                                variant={filters.lines.includes(line) ? "default" : "outline"}
                                className="cursor-pointer"
                                onClick={() => handleArrayFilterToggle('lines', line)}
                              >
                                {line}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Priority Filter */}
                        <div>
                          <Label className="text-sm font-medium mb-2">Priority</Label>
                          <div className="flex gap-2">
                            {filterOptions.priority.map((priority) => (
                              <Badge
                                key={priority}
                                variant={filters.priority.includes(priority) ? "default" : "outline"}
                                className="cursor-pointer"
                                onClick={() => handleArrayFilterToggle('priority', priority)}
                              >
                                {priority}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="advanced" className="space-y-4 mt-4">
                        {/* Style Codes Filter */}
                        <div>
                          <Label className="text-sm font-medium mb-2">Style Codes</Label>
                          <div className="flex flex-wrap gap-2 max-h-20 overflow-y-auto">
                            {filterOptions.styleCodes.map((style) => (
                              <Badge
                                key={style}
                                variant={filters.styleCodes.includes(style) ? "default" : "outline"}
                                className="cursor-pointer"
                                onClick={() => handleArrayFilterToggle('styleCodes', style)}
                              >
                                {style}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Custom Date Range */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-sm">From Date</Label>
                            <Input type="date" className="mt-1" />
                          </div>
                          <div>
                            <Label className="text-sm">To Date</Label>
                            <Input type="date" className="mt-1" />
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Active Filters Display */}
          {activeFiltersCount > 0 && (
            <div className="mt-3 pt-3 border-t">
              <div className="flex flex-wrap gap-2">
                {filters.buyers.map((buyer) => (
                  <Badge key={buyer} variant="secondary" className="text-xs">
                    {buyer}
                    <X 
                      className="ml-1 h-3 w-3 cursor-pointer" 
                      onClick={() => handleArrayFilterToggle('buyers', buyer)}
                    />
                  </Badge>
                ))}
                {filters.lines.map((line) => (
                  <Badge key={line} variant="secondary" className="text-xs">
                    {line}
                    <X 
                      className="ml-1 h-3 w-3 cursor-pointer" 
                      onClick={() => handleArrayFilterToggle('lines', line)}
                    />
                  </Badge>
                ))}
                {filters.orderStatus.map((status) => (
                  <Badge key={status} variant="secondary" className="text-xs">
                    {status}
                    <X 
                      className="ml-1 h-3 w-3 cursor-pointer" 
                      onClick={() => handleArrayFilterToggle('orderStatus', status)}
                    />
                  </Badge>
                ))}                {(filters.dateRange?.from || filters.dateRange?.to) && (
                  <Badge variant="secondary" className="text-xs">
                    Date Range
                    <X 
                      className="ml-1 h-3 w-3 cursor-pointer" 
                      onClick={() => handleFilterChange('dateRange', undefined)}
                    />
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
