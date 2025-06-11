import { Button } from "@/components/ui/button";
import { Upload, Download, Bell } from "lucide-react";
import UploadDialog from "./upload-dialog";
import { useState } from "react";

export default function Header() {
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

  const handleExportGeneratedContent = async () => {
    try {
      const response = await fetch("/api/export/generated-content");
      
      if (!response.ok) {
        throw new Error("Failed to export generated content");
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "generated-content-export.csv";
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
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-primary">ProspectCopy</h1>
              </div>
              <nav className="hidden md:ml-8 md:flex md:space-x-8">
                <a href="/" className="text-primary border-b-2 border-primary px-1 pb-4 text-sm font-medium">Dashboard</a>
                <a href="/" className="text-gray-500 hover:text-secondary px-1 pb-4 text-sm font-medium">Prospects</a>
                <a href="/content" className="text-gray-500 hover:text-secondary px-1 pb-4 text-sm font-medium">Generated Content</a>
                <a href="#" className="text-gray-500 hover:text-secondary px-1 pb-4 text-sm font-medium">Settings</a>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportProspects}
                className="inline-flex items-center"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Prospects
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportWorkflow}
                className="inline-flex items-center bg-accent text-white hover:bg-green-700 border-accent"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Workflow Spreadsheet
              </Button>
              <Button
                size="sm"
                onClick={() => setShowUploadDialog(true)}
                className="inline-flex items-center bg-primary hover:bg-primary-dark"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Prospects
              </Button>
              <button className="text-gray-500 hover:text-secondary">
                <Bell className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">JD</span>
                </div>
                <span className="hidden md:block text-sm font-medium">John Doe</span>
              </div>
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
