// Updated 2024-12-19: ExportModal component for CSV/PDF report generation

"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Download, 
  FileText, 
  FileSpreadsheet, 
  Calendar,
  Users,
  FolderOpen,
  CheckCircle,
  AlertCircle,
  Loader2
} from "lucide-react";

interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  company_name: string;
  currency_preference: string;
  financial_year_end: string;
  tax_rate: number;
  subscription_tier: string;
}

interface ReportFilters {
  dateRange: {
    start: Date;
    end: Date;
  };
  clientId?: string;
  category?: string;
  projectId?: string;
}

interface ExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportType: string;
  userProfile: UserProfile;
  filters: ReportFilters;
}

const EXPORT_FORMATS = [
  {
    id: "csv",
    name: "CSV",
    description: "Spreadsheet format for accounting software",
    icon: FileSpreadsheet,
    color: "bg-green-500",
    features: [
      "Compatible with Excel, Google Sheets",
      "Import into QuickBooks, Xero",
      "Machine-readable format",
      "All data included"
    ]
  },
  {
    id: "pdf",
    name: "PDF",
    description: "Professional report for sharing",
    icon: FileText,
    color: "bg-red-500",
    features: [
      "Professional formatting",
      "Ready for client sharing",
      "Print-friendly layout",
      "Includes charts and graphs"
    ]
  }
];

const REPORT_TYPE_INFO = {
  overview: {
    title: "Complete Business Report",
    description: "Comprehensive overview of all business expenses and metrics",
    icon: Calendar,
    color: "bg-blue-500"
  },
  monthly: {
    title: "Monthly Expense Report",
    description: "Detailed monthly breakdown with tax categorization",
    icon: Calendar,
    color: "bg-blue-500"
  },
  tax: {
    title: "Tax Year Summary",
    description: "Annual tax summary for accountant submission",
    icon: FileText,
    color: "bg-green-500"
  },
  client: {
    title: "Client Cost Allocation",
    description: "Client-wise cost breakdown for billing transparency",
    icon: Users,
    color: "bg-purple-500"
  },
  category: {
    title: "Category Breakdown",
    description: "Expense analysis by business categories",
    icon: FolderOpen,
    color: "bg-orange-500"
  }
};

export function ExportModal({ 
  open, 
  onOpenChange, 
  reportType, 
  userProfile, 
  filters 
}: ExportModalProps) {
  const [selectedFormat, setSelectedFormat] = useState<string>("csv");
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<"idle" | "success" | "error">("idle");

  const reportInfo = REPORT_TYPE_INFO[reportType as keyof typeof REPORT_TYPE_INFO] || REPORT_TYPE_INFO.overview;
  const ReportIcon = reportInfo.icon;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: userProfile.currency_preference,
    }).format(amount);
  };

  const formatDateRange = () => {
    const start = filters.dateRange.start.toLocaleDateString();
    const end = filters.dateRange.end.toLocaleDateString();
    return `${start} - ${end}`;
  };

  const handleExport = async () => {
    setIsExporting(true);
    setExportStatus("idle");

    try {
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real implementation, this would:
      // 1. Generate the report data
      // 2. Format it according to the selected format
      // 3. Create a download link
      // 4. Trigger the download
      
      setExportStatus("success");
      
      // Simulate download
      const filename = `${reportType}_report_${new Date().toISOString().split('T')[0]}.${selectedFormat}`;
      console.log(`Exporting ${filename}...`);
      
    } catch (error) {
      console.error('Export failed:', error);
      setExportStatus("error");
    } finally {
      setIsExporting(false);
    }
  };

  const handleClose = () => {
    if (!isExporting) {
      setExportStatus("idle");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Report
          </DialogTitle>
          <DialogDescription>
            Choose your export format and download your business report
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Report Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className={`p-2 rounded-lg ${reportInfo.color} text-white`}>
                  <ReportIcon className="h-4 w-4" />
                </div>
                {reportInfo.title}
              </CardTitle>
              <CardDescription>{reportInfo.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Date Range:</span>
                  <div className="font-medium">{formatDateRange()}</div>
                </div>
                <div>
                  <span className="text-gray-600">Currency:</span>
                  <div className="font-medium">{userProfile.currency_preference}</div>
                </div>
                <div>
                  <span className="text-gray-600">Tax Rate:</span>
                  <div className="font-medium">{userProfile.tax_rate}%</div>
                </div>
                <div>
                  <span className="text-gray-600">Financial Year:</span>
                  <div className="font-medium">{userProfile.financial_year_end}</div>
                </div>
              </div>
              
              {/* Active Filters */}
              {(filters.clientId || filters.category || filters.projectId) && (
                <div className="mt-4 pt-4 border-t">
                  <div className="text-sm text-gray-600 mb-2">Active Filters:</div>
                  <div className="flex flex-wrap gap-2">
                    {filters.clientId && (
                      <Badge variant="secondary">Client: {filters.clientId}</Badge>
                    )}
                    {filters.category && (
                      <Badge variant="secondary">Category: {filters.category}</Badge>
                    )}
                    {filters.projectId && (
                      <Badge variant="secondary">Project: {filters.projectId}</Badge>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Format Selection */}
          <div>
            <h3 className="text-lg font-medium mb-4">Choose Export Format</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {EXPORT_FORMATS.map((format) => {
                const FormatIcon = format.icon;
                return (
                  <Card 
                    key={format.id}
                    className={`cursor-pointer transition-all duration-200 ${
                      selectedFormat === format.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => setSelectedFormat(format.id)}
                  >
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <div className={`p-2 rounded-lg ${format.color} text-white`}>
                          <FormatIcon className="h-4 w-4" />
                        </div>
                        {format.name}
                      </CardTitle>
                      <CardDescription>{format.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1 text-sm">
                        {format.features.map((feature, index) => (
                          <li key={index} className="flex items-center gap-2 text-gray-600">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Export Status */}
          {exportStatus === "success" && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-green-800">Report exported successfully!</span>
            </div>
          )}

          {exportStatus === "error" && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="text-red-800">Export failed. Please try again.</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={handleClose}
              disabled={isExporting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center gap-2"
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Export {selectedFormat.toUpperCase()}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
