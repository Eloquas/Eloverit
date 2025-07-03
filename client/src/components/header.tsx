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
      <header className="bg-white avo-shadow-soft border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 avo-gradient-blue rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">P</span>
                </div>
                <h1 className="text-2xl font-bold text-primary">ProspectCopy</h1>
              </div>
              <nav className="hidden md:ml-8 md:flex md:space-x-2">
                <a href="/" className="text-primary bg-avo-blue-50 hover:bg-avo-blue-100 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200">Dashboard</a>
                <a href="/generated-content" className="text-gray-600 hover:text-primary hover:bg-avo-blue-50 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200">Generated Content</a>
              </nav>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportProspects}
                className="inline-flex items-center border-gray-200 hover:border-primary hover:bg-avo-blue-50 transition-all duration-200"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Prospects
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportWorkflow}
                className="inline-flex items-center bg-accent text-white hover:bg-green-600 border-accent avo-shadow-soft"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Workflow
              </Button>
              <Button
                size="sm"
                onClick={() => setShowUploadDialog(true)}
                className="inline-flex items-center bg-primary hover:bg-primary-dark avo-shadow-soft transition-all duration-200 hover:transform hover:-translate-y-0.5"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Prospects
              </Button>
              <button className="text-gray-400 hover:text-primary p-2 rounded-lg hover:bg-avo-blue-50 transition-all duration-200">
                <Bell className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-3 pl-3 border-l border-gray-200">
                <div className="w-8 h-8 avo-gradient-blue rounded-full flex items-center justify-center avo-shadow-soft">
                  <span className="text-white text-sm font-medium">JD</span>
                </div>
                <span className="hidden md:block text-sm font-medium text-gray-700">John Doe</span>
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
