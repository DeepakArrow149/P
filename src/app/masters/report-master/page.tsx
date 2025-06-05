
// src/app/masters/report-master/page.tsx
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select as UiSelect, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Renamed to avoid conflict
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation'; // For the close button
import { FileText, Settings, Printer, LayoutGrid, X, Sigma, Bold, Italic, Underline, PaletteIcon as ColorIcon, Filter as FilterIcon, Table2, ChevronDown, ChevronUp, Save } from 'lucide-react'; // Added Save
import { cn } from '@/lib/utils';

// Mock data (can be expanded significantly)
const mockAvailableFields = [
  { id: 'order_code', label: 'Order Code', group: 'Order Details' },
  { id: 'order_product', label: 'Product', group: 'Order Details' },
  { id: 'order_qty', label: 'Order Quantity', group: 'Order Details' },
  { id: 'customer_name', label: 'Customer Name', group: 'Customer Details' },
  { id: 'style_name', label: 'Style Name', group: 'Product Master' },
  { id: 'line_name', label: 'Line Name', group: 'Planning Board' },
  { id: 'udf_season', label: 'Season (UDF)', group: 'User Defined Fields' },
  { id: 'delivery_date', label: 'Delivery Date', group: 'Order Details' },
  { id: 'prod_start_date', label: 'Production Start', group: 'Planning Board' },
  { id: 'material_cost', label: 'Material Cost', group: 'Financials' },
  { id: 'selling_price', label: 'Selling Price', group: 'Financials' },
];

const mockReportGroups = ["Customer Tracking", "Capacity Management", "Critical Path", "Forecast", "KPI", "Materials", "Planning", "Production"];

const mockCellProperties = [
  "Lock cell", "Wrap text", "Subtotal value", "In subtotal only", "Repeating cell",
  "Repeat first data only", "Cumulative values", "Include 'Earlier' values",
  "Whole/complete values", "Table cell", "Negative in red", "Format row text",
  "Colour filled cells", "Colour empty cells", "Show cell border", "Show Yes or No",
  "Show percentage", "Apply exception", "Rotate header"
];

interface CellConfig {
  type: 'Free label' | 'Data field' | 'Formula' | 'Reference label' | 'Table label';
  value: string; 
  dataFieldId?: string; // Store the ID of the data field if type is 'Data field'
  alignment: 'Left' | 'Centre' | 'Right';
  columnHeaderText: string; 
  widthMm: number;
  precisionDp: number;
  properties: Record<string, boolean>; 
}

const defaultCellConfig: CellConfig = {
  type: 'Free label',
  value: '',
  alignment: 'Left',
  columnHeaderText: '',
  widthMm: 25,
  precisionDp: 0,
  properties: {},
};

export default function ReportMasterPage() {
  const { toast } = useToast();
  const router = useRouter();
  
  const [reportName, setReportName] = React.useState('New_Report_Layout');
  const [reportGroup, setReportGroup] = React.useState(mockReportGroups[0] || '');
  const [reportDescription, setReportDescription] = React.useState('');
  
  const [selectedCellId, setSelectedCellId] = React.useState<string | null>('1A');
  const [cellData, setCellData] = React.useState<Map<string, CellConfig>>(() => {
    const initialMap = new Map<string, CellConfig>();
    // Initialize with default column headers
    Array.from({ length: 12 }).forEach((_, colIndex) => {
      ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T'].forEach(rowLabel => {
        const cellId = `${colIndex + 1}${rowLabel}`;
        if (rowLabel === 'A') { // Set default header only for the first row of each column for simplicity
          initialMap.set(cellId, { ...defaultCellConfig, columnHeaderText: `Column ${colIndex + 1}` });
        }
      });
    });
    return initialMap;
  });

  const [selectedDataFieldId, setSelectedDataFieldId] = React.useState<string | null>(null);

  const gridColumns = 12;
  const gridRows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T'];

  const handleCellClick = (cellId: string) => {
    setSelectedCellId(cellId);
    const currentConfig = cellData.get(cellId);
    setSelectedDataFieldId(currentConfig?.type === 'Data field' ? currentConfig.dataFieldId || null : null);
  };
  
  const getCellConfig = (cellId: string | null): CellConfig => {
    if (!cellId) return defaultCellConfig;
    const colIndex = parseInt(cellId.substring(0, cellId.length - 1)) -1;
    const defaultColumnHeader = columnHeaders[colIndex] || `Column ${colIndex + 1}`;
    return cellData.get(cellId) || { ...defaultCellConfig, columnHeaderText: defaultColumnHeader };
  };
  
  const updateCellConfig = (cellId: string | null, newConfig: Partial<CellConfig>) => {
    if (!cellId) return;
    setCellData(prev => {
      const updated = new Map(prev);
      const current = getCellConfig(cellId); // Uses the refined getCellConfig
      const mergedConfig = { ...current, ...newConfig };
  
      // If type changes away from 'Data field', clear dataFieldId
      if (newConfig.type && newConfig.type !== 'Data field') {
        mergedConfig.dataFieldId = undefined;
      }
      updated.set(cellId, mergedConfig);
      return updated;
    });
  };
  
  const updateColumnHeaderForAllCellsInColumn = (colIndex: number, newHeaderText: string) => {
    setCellData(prev => {
      const updated = new Map(prev);
      gridRows.forEach(rowLabel => {
        const cellId = `${colIndex + 1}${rowLabel}`;
        const current = updated.get(cellId) || { ...defaultCellConfig, columnHeaderText: newHeaderText };
        updated.set(cellId, { ...current, columnHeaderText: newHeaderText });
      });
      return updated;
    });
  };
  
  const columnHeaders = React.useMemo(() => {
    return Array.from({ length: gridColumns }).map((_, colIndex) => {
      const firstCellInColId = `${colIndex + 1}${gridRows[0]}`;
      return cellData.get(firstCellInColId)?.columnHeaderText || `Column ${colIndex + 1}`;
    });
  }, [cellData, gridColumns, gridRows]);


  const handleSaveLayout = () => {
    const layoutToSave = {
      reportName,
      reportGroup,
      reportDescription,
      cells: Object.fromEntries(cellData.entries()) 
    };
    console.log("Saving Report Layout Definition:", JSON.stringify(layoutToSave, null, 2));
    toast({ title: "Layout Saved (Console)", description: "Current report layout definition has been logged to the console." });
  };

  const selectedCellConfig = getCellConfig(selectedCellId);

  const gridDisplayData = React.useMemo(() => {
    return gridRows.map(rowLabel => 
      Array.from({ length: gridColumns }).map((_, colIndex) => {
        const cellId = `${colIndex + 1}${rowLabel}`;
        const config = cellData.get(cellId);
        if (config?.type === 'Data field' && config.dataFieldId) {
          return mockAvailableFields.find(f => f.id === config.dataFieldId)?.label || `[${config.dataFieldId.substring(0,5)}]`;
        }
        return config?.value || ''; 
      })
    );
  }, [cellData, gridRows, gridColumns]);
  
  const handlePreviewPrint = () => {
    const currentLayout = {
      reportName,
      reportGroup,
      reportDescription,
      cells: Object.fromEntries(cellData.entries())
    };
    console.log("Preview/Print Triggered. Current Layout Definition:", JSON.stringify(currentLayout, null, 2));
    toast({ 
      title: "Preview/Print Report (Console)", 
      description: "Generating preview based on current configuration. Check console. (Actual print/PDF functionality pending)." 
    });
  };


  return (
    <div className="flex flex-col h-screen overflow-hidden bg-muted/30">
      {/* Toolbar */}
      <div className="bg-card border-b shadow-sm px-3 py-1.5 flex items-center justify-between sticky top-0 z-30 flex-shrink-0">
        <div className="flex items-center gap-1">
          <UiSelect value={reportGroup} onValueChange={setReportGroup}>
            <SelectTrigger className="h-8 text-xs w-auto min-w-[150px] max-w-[200px]">
                <SelectValue placeholder="Select Report Group"/>
            </SelectTrigger>
            <SelectContent>
                {mockReportGroups.map(group => <SelectItem key={group} value={group}>{group}</SelectItem>)}
            </SelectContent>
          </UiSelect>
          <Input value={reportName} onChange={(e) => setReportName(e.target.value)} placeholder="Report Name..." className="h-8 text-xs w-auto min-w-[150px] max-w-[200px]"/>
          <Input value={reportDescription} onChange={(e) => setReportDescription(e.target.value)} placeholder="Description..." className="h-8 text-xs flex-grow min-w-[150px] max-w-[250px]"/>
          
          <Button variant="outline" size="sm" className="h-8" onClick={() => toast({ title: "Select Report", description: "This will open a dialog to load a previously saved report layout."})}>
            <FileText className="mr-1.5 h-3.5 w-3.5" /> Select
          </Button>
          <Button variant="outline" size="sm" className="h-8" onClick={() => toast({ title: "Configure Report", description: "This will open advanced report configuration options (e.g., page setup, parameters)."})}>
            <Settings className="mr-1.5 h-3.5 w-3.5" /> Configure
          </Button>
          <Button variant="outline" size="sm" className="h-8" onClick={handlePreviewPrint}>
            <Printer className="mr-1.5 h-3.5 w-3.5" /> Preview/Print
          </Button>
          <Button variant="outline" size="sm" className="h-8" onClick={() => toast({ title: "Layout Options", description: "Report layout management options will be available here."})}>
            <LayoutGrid className="mr-1.5 h-3.5 w-3.5" /> Layout
          </Button>
        </div>
        <Button variant="ghost" size="sm" className="h-8 text-muted-foreground hover:text-destructive" onClick={() => router.back()}><X className="mr-1.5 h-4 w-4" /> Close</Button>
      </div>

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col overflow-hidden">
        {/* Spreadsheet-like Grid (Top Area) */}
        <ScrollArea className="p-2 border-b overflow-auto flex-shrink-0 bg-background shadow-inner h-1/2">
          <div className="inline-block min-w-full">
            <table className="min-w-full border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-100">
                  <th className="p-1 border border-slate-300 w-10 text-xs font-normal sticky left-0 z-10 bg-slate-100"></th>
                  {Array.from({ length: gridColumns }).map((_, colIndex) => (
                    <th key={colIndex} className="p-1 border border-slate-300 text-xs font-medium sticky top-0 bg-slate-100" style={{minWidth: `${getCellConfig(`${colIndex+1}A`).widthMm || 25}mm`}}>
                      <div className="flex items-center justify-between">
                        <span>{colIndex + 1}</span>
                        <ChevronDown className="h-3 w-3 text-muted-foreground cursor-pointer hover:text-foreground" />
                      </div>
                      <div className="text-[10px] text-blue-600 font-normal truncate" title={columnHeaders[colIndex]}>
                        {columnHeaders[colIndex]}
                      </div>
                      <div className="text-[9px] text-gray-400 flex justify-between">
                        <span>0</span><span>∑</span><span>0</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {gridRows.map((rowLabel) => (
                  <tr key={rowLabel}>
                    <td className="p-1 border border-slate-300 text-xs font-medium text-center bg-slate-100 sticky left-0 z-10">
                        <div className="flex items-center justify-between">
                            <span>{rowLabel}</span>
                            <ChevronUp className="h-3 w-3 text-muted-foreground cursor-pointer hover:text-foreground rotate-90" />
                        </div>
                    </td>
                    {Array.from({ length: gridColumns }).map((_, colIndex) => {
                      const cellId = `${colIndex + 1}${rowLabel}`;
                      const config = cellData.get(cellId);
                      return (
                        <td
                          key={cellId}
                          className={cn(
                            `p-1 border border-slate-300 h-10 text-xs cursor-pointer hover:bg-blue-50`, 
                            selectedCellId === cellId ? 'ring-2 ring-blue-500 ring-inset bg-yellow-100' : 'bg-white'
                          )}
                          onClick={() => handleCellClick(cellId)}
                          style={{
                            minWidth: `${config?.widthMm || 25}mm`,
                            textAlign: config?.alignment?.toLowerCase() as 'left' | 'center' | 'right' || 'left',
                          }}
                          title={`Cell: ${cellId} | Type: ${config?.type || 'Free label'} | Value: ${config?.value || ''}`}
                        >
                          <div className="truncate">{gridDisplayData[gridRows.indexOf(rowLabel)][colIndex]}</div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ScrollArea>

        {/* Configuration Panels (Bottom Area) */}
        <div className="flex-grow flex border-t overflow-hidden bg-background">
          {/* Cell Configuration (Bottom-Left) */}
          <Card className="w-1/4 min-w-[280px] rounded-none border-0 border-r flex flex-col">
            <CardHeader className="p-3 border-b flex-shrink-0">
              <CardTitle className="text-sm">Cell {selectedCellId || 'N/A'}</CardTitle>
            </CardHeader>
            <CardContent className="p-3 space-y-3 text-xs flex-grow overflow-y-auto">
              <RadioGroup value={selectedCellConfig.type} onValueChange={(val) => updateCellConfig(selectedCellId, { type: val as CellConfig['type'], value: val === 'Data field' ? '' : selectedCellConfig.value, dataFieldId: val === 'Data field' ? selectedCellConfig.dataFieldId : undefined })} className="space-y-1">
                {(['Free label', 'Reference label', 'Table label', 'Data field', 'Formula'] as CellConfig['type'][]).map(typeOpt => (
                    <div key={typeOpt} className="flex items-center space-x-2"><RadioGroupItem value={typeOpt} id={`cl-${typeOpt.replace(' ','-')}`} /><Label htmlFor={`cl-${typeOpt.replace(' ','-')}`}>{typeOpt}</Label></div>
                ))}
              </RadioGroup>
              {(selectedCellConfig.type === 'Free label' || selectedCellConfig.type === 'Reference label' || selectedCellConfig.type === 'Table label') && (
                <div className="space-y-1 pt-2">
                  <Label htmlFor="cell-value-text">Label Text</Label>
                  <Input id="cell-value-text" value={selectedCellConfig.value} onChange={e => updateCellConfig(selectedCellId, { value: e.target.value })} className="h-7 text-xs" />
                </div>
              )}
               {selectedCellConfig.type === 'Formula' && (
                <div className="space-y-1 pt-2">
                  <Label htmlFor="cell-value-formula">Formula</Label>
                  <Input id="cell-value-formula" value={selectedCellConfig.value} onChange={e => updateCellConfig(selectedCellId, { value: e.target.value })} className="h-7 text-xs" placeholder="e.g., SUM(A1:A5)" />
                </div>
              )}
              <div className="space-y-1 pt-2">
                <Label>Alignment</Label>
                <RadioGroup value={selectedCellConfig.alignment} onValueChange={(val) => updateCellConfig(selectedCellId, { alignment: val as CellConfig['alignment'] })} className="flex gap-2">
                  {(['Left', 'Centre', 'Right'] as CellConfig['alignment'][]).map(alignOpt => (
                     <div key={alignOpt} className="flex items-center space-x-2"><RadioGroupItem value={alignOpt} id={`align-${alignOpt.toLowerCase()}`} /><Label htmlFor={`align-${alignOpt.toLowerCase()}`}>{alignOpt}</Label></div>
                  ))}
                </RadioGroup>
              </div>
              <div className="space-y-1"><Label htmlFor="col-header">Column header text</Label>
                <Input id="col-header" value={selectedCellConfig.columnHeaderText} onChange={e => {
                    if (selectedCellId) {
                        const colIndex = parseInt(selectedCellId.substring(0, selectedCellId.length -1)) -1;
                        if (colIndex >= 0) {
                             updateColumnHeaderForAllCellsInColumn(colIndex, e.target.value);
                        }
                    }
                }} 
                className="h-7 text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1"><Label htmlFor="col-width">Width (mm)</Label><Input id="col-width" type="number" value={selectedCellConfig.widthMm} onChange={e => updateCellConfig(selectedCellId, { widthMm: parseInt(e.target.value) || 25 })} className="h-7 text-xs" /></div>
                <div className="space-y-1"><Label htmlFor="col-precision">Precision (dp)</Label><Input id="col-precision" type="number" value={selectedCellConfig.precisionDp} onChange={e => updateCellConfig(selectedCellId, { precisionDp: parseInt(e.target.value) || 0 })} className="h-7 text-xs" /></div>
              </div>
            </CardContent>
          </Card>

          <div className="flex-grow flex">
            <Card className="flex-1 min-w-[300px] rounded-none border-0 border-r flex flex-col">
              <CardHeader className="p-3 border-b flex-shrink-0">
                <CardTitle className="text-sm">Data Field Selected</CardTitle>
                <CardDescription className="text-xs truncate">{selectedCellConfig.type === 'Data field' ? (mockAvailableFields.find(f=>f.id === selectedCellConfig.dataFieldId)?.label || 'None selected') : 'N/A (Cell type is not Data Field)'}</CardDescription>
              </CardHeader>
              <ScrollArea className="flex-grow">
                <CardContent className="p-1 text-xs">
                  {mockAvailableFields.map(field => (
                    <div key={field.id}
                         className={`p-1 hover:bg-blue-50 cursor-pointer rounded ${selectedCellConfig.type === 'Data field' && selectedCellConfig.dataFieldId === field.id ? 'bg-blue-100 font-medium text-blue-700' : ''}`}
                         onClick={() => {
                            if (selectedCellConfig.type === 'Data field' && selectedCellId) {
                              updateCellConfig(selectedCellId, { value: field.label, dataFieldId: field.id }); // Update display value too
                              setSelectedDataFieldId(field.id);
                            } else if (selectedCellId) {
                              toast({variant: "destructive", title: "Change Cell Type", description: "Please change cell type to 'Data field' to select a data field."})
                            }
                         }}>
                      <span className="font-semibold text-muted-foreground">{field.group}:</span> {field.label}
                    </div>
                  ))}
                </CardContent>
              </ScrollArea>
            </Card>
            <Card className="w-1/3 min-w-[250px] rounded-none border-0 flex flex-col">
              <CardHeader className="p-3 border-b flex-shrink-0">
                <CardTitle className="text-sm">Cell Properties</CardTitle>
              </CardHeader>
              <ScrollArea className="flex-grow">
                <CardContent className="p-3 space-y-1 text-xs">
                  {mockCellProperties.map(prop => (
                    <div key={prop} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`prop-${prop.replace(/\s+/g, '-')}`} 
                        checked={selectedCellConfig.properties[prop] || false}
                        onCheckedChange={(checked) => {
                          if (selectedCellId) {
                            const newProps = { ...selectedCellConfig.properties, [prop]: !!checked };
                            updateCellConfig(selectedCellId, { properties: newProps });
                          }
                        }}
                      />
                      <Label htmlFor={`prop-${prop.replace(/\s+/g, '-')}`} className="font-normal">{prop}</Label>
                    </div>
                  ))}
                </CardContent>
              </ScrollArea>
            </Card>
          </div>
        </div>

        <div className="p-2 border-t flex items-center justify-between text-xs bg-card flex-shrink-0">
          <div className="flex items-center gap-3">
            <Label>Repeating Field Type</Label>
            <RadioGroup defaultValue="Text" className="flex gap-2">
              <div className="flex items-center space-x-1"><RadioGroupItem value="Text" id="db-text" /><Label htmlFor="db-text" className="font-normal">Text</Label></div>
              <div className="flex items-center space-x-1"><RadioGroupItem value="Number" id="db-number" /><Label htmlFor="db-number" className="font-normal">Number</Label></div>
              <div className="flex items-center space-x-1"><RadioGroupItem value="Date" id="db-date" /><Label htmlFor="db-date" className="font-normal">Date</Label></div>
            </RadioGroup>
             <div className="flex items-center space-x-1"><Checkbox id="primary-key" /><Label htmlFor="primary-key" className="font-normal">Primary Key</Label></div>
             <span className="text-muted-foreground text-[10px]">The combined values of primary keys must be unique.</span>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" className="h-7 px-2 py-1 text-xs" onClick={handleSaveLayout}><Save className="mr-1 h-3 w-3"/> Save layout</Button>
            <Button variant="outline" size="sm" className="h-7 px-2 py-1 text-xs" onClick={() => toast({title: "Example Action", description: "Example button clicked."})}><Sigma className="mr-1 h-3 w-3"/>Example</Button>
            <Button variant="outline" size="sm" className="h-7 px-2 py-1 text-xs" onClick={() => toast({title: "Font Action", description: "Font button clicked."})}><Bold className="mr-1 h-3 w-3"/>Font</Button>
            <Button variant="outline" size="sm" className="h-7 px-2 py-1 text-xs" onClick={() => toast({title: "Colour Action", description: "Colour button clicked."})}><ColorIcon className="mr-1 h-3 w-3"/>Colour</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

    