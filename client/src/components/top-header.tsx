import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  Download, 
  Bell, 
  Search,
  Plus,
  Command,
  User
} from "lucide-react";
import { Input } from "@/components/ui/input";
import UploadDialog from "./upload-dialog";
import { useState } from "react";

interface TopHeaderProps {
  sidebarCollapsed: boolean;
}

export default function TopHeader({ sidebarCollapsed }: TopHeaderProps) {
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  const handleExportProspects = async () => {
    try {
      const response = await fetch("/api/prospects");
      const prospects = await response.json();
      
      // Convert to CSV
      const csvContent = [
        ["Name", "Email", "Company", "Position", "Status", "Additional Info"].join(","),
        ...prospects.map((p: any) => [
          p.name,
          p.email,
          p.company,
          p.position,
          p.status,
          p.additionalInfo || ""
        ].map(field => `"${field}"`).join(","))
      ].join("\n");
      
      // Download file
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "prospects.csv";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  const handleExportWorkflow = async () => {
    try {
      const response = await fetch("/api/export/workflow");
      
      if (!response.ok) {
        throw new Error("Failed to export workflow data");
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "prospects-with-content.xlsx";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Workflow export failed:", error);
    }
  };

  return (
    <>
      <header className={`fixed top-0 right-0 h-16 avo-glass border-b border-gray-50 z-30 transition-all duration-300 avo-shadow-soft ${
        sidebarCollapsed ? 'left-16' : 'left-64'
      }`}>
        <div className="h-full px-6 flex items-center justify-between">
          {/* Search Bar */}
          <div className="flex items-center flex-1 max-w-lg">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search prospects, companies, or content..."
                className="pl-10 pr-16 bg-white/50 border-gray-100 focus:bg-white focus:border-primary rounded-xl avo-shadow-soft transition-all duration-200"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <kbd className="px-2 py-1 text-xs text-gray-500 bg-gray-50 rounded-md border border-gray-200 avo-nav-pill">
                  <Command className="h-3 w-3 inline mr-1" />
                  K
                </kbd>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3">
            {/* Quick Actions */}
            <Button
              size="sm"
              onClick={() => setShowUploadDialog(true)}
              className="bg-primary hover:bg-primary-dark avo-shadow-soft transition-all duration-200 avo-hover-scale rounded-xl"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Prospect
            </Button>

            <div className="hidden md:flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportProspects}
                className="border-gray-100 hover:border-primary hover:bg-avo-blue-50 transition-all duration-200 rounded-xl avo-hover-scale"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button
                size="sm"
                onClick={handleExportWorkflow}
                className="bg-accent text-white hover:bg-green-600 border-accent avo-shadow-soft rounded-xl avo-hover-scale"
              >
                <Download className="w-4 h-4 mr-2" />
                Workflow
              </Button>
            </div>

            {/* Notifications */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="relative p-2 text-gray-400 hover:text-primary hover:bg-avo-blue-50 rounded-xl transition-all duration-200"
              >
                <Bell className="h-5 w-5" />
                <div className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs rounded-full animate-pulse">
                  3
                </div>
              </Button>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-3 pl-3 border-l border-gray-100">
              <div className="hidden md:block text-right">
                <div className="text-sm font-medium text-gray-900">John Doe</div>
                <div className="text-xs text-gray-500">Sales Manager</div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="relative p-0 w-10 h-10 rounded-full avo-gradient-blue avo-shadow-soft avo-hover-scale"
              >
                <User className="h-5 w-5 text-white" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <UploadDialog 
        open={showUploadDialog} 
        onOpenChange={setShowUploadDialog}
      />
    </>
  );
}