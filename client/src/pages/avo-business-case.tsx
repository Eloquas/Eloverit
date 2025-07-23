import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ExternalLink, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function AvoBusinessCase() {
  const [iframeError, setIframeError] = useState(false);
  const [currentUrlIndex, setCurrentUrlIndex] = useState(0);
  
  // Multiple potential URLs for the Replit app - trying common deployment patterns
  const possibleUrls = [
    "https://automationbizcase.replit.app/",
    "https://automation-biz-case.replit.app/",
    "https://avo-business-case.replit.app/",
    "https://johnwhite26-automationbizcase.replit.app/",
    "https://automationbizcase--johnwhite26.replit.app/"
  ];

  const handleIframeError = () => {
    setIframeError(true);
  };

  const retryWithNextUrl = () => {
    if (currentUrlIndex < possibleUrls.length - 1) {
      setCurrentUrlIndex(currentUrlIndex + 1);
      setIframeError(false);
    }
  };

  const currentUrl = possibleUrls[currentUrlIndex];

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
        <div className="flex items-center space-x-2">
          {iframeError && currentUrlIndex < possibleUrls.length - 1 && (
            <Button variant="outline" size="sm" onClick={retryWithNextUrl}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Different URL
            </Button>
          )}
          <Button variant="outline" size="sm" asChild>
            <a href="https://replit.com/@JohnWhite26/AutomationBizCase" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-2" />
              Open in New Tab
            </a>
          </Button>
        </div>
      </div>

      {/* Iframe Container */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-0">
          {iframeError ? (
            <div className="relative w-full bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center" style={{ height: 'calc(100vh - 200px)', minHeight: '600px' }}>
              <div className="text-center p-8">
                <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Application</h3>
                <p className="text-gray-600 mb-4">
                  The Avo Business Case Generator app is currently unavailable. This could be because:
                </p>
                <ul className="text-left text-gray-600 mb-6 space-y-1">
                  <li>• The Replit deployment might not be active</li>
                  <li>• The app URL has changed</li>
                  <li>• Temporary network connectivity issues</li>
                </ul>
                <div className="flex items-center justify-center space-x-4">
                  <Button variant="outline" asChild>
                    <a href="https://replit.com/@JohnWhite26/AutomationBizCase" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open in Replit
                    </a>
                  </Button>
                  {currentUrlIndex < possibleUrls.length - 1 && (
                    <Button onClick={retryWithNextUrl}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Try Again
                    </Button>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-4">
                  Current URL attempt: {currentUrl}
                </p>
              </div>
            </div>
          ) : (
            <div className="relative w-full bg-white rounded-lg overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
              <iframe
                src={currentUrl}
                title="Avo Business Case Generator"
                className="w-full h-full border-0"
                style={{ minHeight: '600px' }}
                onError={handleIframeError}
                allowFullScreen
                loading="lazy"
              />
            </div>
          )}
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