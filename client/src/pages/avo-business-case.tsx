import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function AvoBusinessCase() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Avo Business Case Generator</h1>
            <p className="text-gray-600">Generate compelling business cases for QA automation with Avo</p>
          </div>
        </div>
        <Button variant="outline" size="sm" asChild>
          <a href="https://replit.com/@JohnWhite26/AutomationBizCase" target="_blank" rel="noopener noreferrer">
            <ExternalLink className="w-4 h-4 mr-2" />
            Open in New Tab
          </a>
        </Button>
      </div>

      {/* Iframe Container */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-0">
          <div className="relative w-full bg-white rounded-lg overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
            <iframe
              src="https://automationbizcase--johnwhite26.replit.app/"
              title="Avo Business Case Generator"
              className="w-full h-full border-0"
              style={{ minHeight: '600px' }}
              allowFullScreen
              loading="lazy"
            />
          </div>
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900 text-lg">About Avo Business Case Generator</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-blue-700 mb-4">
            This tool helps you create compelling business cases for QA automation investments using Avo's platform. 
            Generate ROI calculations, cost-benefit analyses, and executive-ready presentations.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-white p-3 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-1">ROI Calculator</h4>
              <p className="text-blue-700">Calculate return on investment for automation initiatives</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-1">Cost Analysis</h4>
              <p className="text-blue-700">Compare manual testing costs vs automation savings</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-1">Executive Reports</h4>
              <p className="text-blue-700">Generate professional presentations for stakeholders</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}