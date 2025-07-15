import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  AlertTriangle, Users, Building2, Eye, Trash2, 
  RefreshCw, CheckCircle, ArrowLeft, Filter
} from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function DuplicatesManagement() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");

  const { data: duplicateSummary, isLoading } = useQuery({
    queryKey: ["/api/duplicates/summary"],
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-lg">Analyzing duplicates...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Link href="/prospects">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Prospects
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Duplicate Management</h1>
            <p className="text-gray-600 mt-1">
              Identify and manage duplicate leads and account research
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-orange-600 border-orange-300">
          <Filter className="w-4 h-4 mr-1" />
          Data Quality Check
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="prospect-duplicates">Duplicate Prospects</TabsTrigger>
          <TabsTrigger value="account-duplicates">Duplicate Accounts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Prospects</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{duplicateSummary?.summary?.totalProspects || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Duplicate Prospect Groups</CardTitle>
                <AlertTriangle className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {duplicateSummary?.summary?.duplicateProspectGroups || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Account Research</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{duplicateSummary?.summary?.totalAccountResearch || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Duplicate Account Groups</CardTitle>
                <AlertTriangle className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {duplicateSummary?.summary?.duplicateAccountGroups || 0}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                Deduplication Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg border border-green-200">
                  <div>
                    <h3 className="font-semibold text-green-800">CSV Upload Protection</h3>
                    <p className="text-sm text-green-600">Automatic duplicate detection during file uploads</p>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">Active</Badge>
                </div>
                
                <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div>
                    <h3 className="font-semibold text-blue-800">Account Research Protection</h3>
                    <p className="text-sm text-blue-600">Prevents duplicate research generation for same companies</p>
                  </div>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">Active</Badge>
                </div>
                
                <div className="flex justify-between items-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div>
                    <h3 className="font-semibold text-purple-800">7-Day Cache System</h3>
                    <p className="text-sm text-purple-600">Automatically returns existing research within 7 days</p>
                  </div>
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800">Active</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prospect-duplicates" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Duplicate Prospects ({duplicateSummary?.duplicateProspects?.length || 0} groups)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!duplicateSummary?.duplicateProspects?.length ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Duplicate Prospects Found</h3>
                  <p className="text-gray-600">All prospects are unique based on email and company combination.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {duplicateSummary.duplicateProspects.map((group: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4 bg-orange-50 border-orange-200">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-orange-800">
                            {group.email} at {group.company}
                          </h4>
                          <Badge variant="outline" className="text-orange-600 border-orange-300 mt-1">
                            {group.count} duplicates
                          </Badge>
                        </div>
                        <Button size="sm" variant="outline" className="text-orange-600 border-orange-300">
                          <Eye className="w-4 h-4 mr-2" />
                          Review
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {group.prospects.map((prospect: any, pIndex: number) => (
                          <div key={pIndex} className="flex justify-between items-center text-sm bg-white p-2 rounded border">
                            <span>
                              {prospect.name} - {prospect.position || 'No position'} 
                              <span className="text-gray-500 ml-2">
                                (ID: {prospect.id}, Created: {new Date(prospect.createdAt).toLocaleDateString()})
                              </span>
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account-duplicates" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building2 className="w-5 h-5 mr-2" />
                Duplicate Account Research ({duplicateSummary?.duplicateAccounts?.length || 0} groups)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!duplicateSummary?.duplicateAccounts?.length ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Duplicate Account Research Found</h3>
                  <p className="text-gray-600">All account research is unique and properly deduplicated.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {duplicateSummary.duplicateAccounts.map((group: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4 bg-orange-50 border-orange-200">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-orange-800">{group.companyName}</h4>
                          <Badge variant="outline" className="text-orange-600 border-orange-300 mt-1">
                            {group.count} research entries
                          </Badge>
                        </div>
                        <Button size="sm" variant="outline" className="text-orange-600 border-orange-300">
                          <Eye className="w-4 h-4 mr-2" />
                          Review
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {group.research.map((research: any, rIndex: number) => (
                          <div key={rIndex} className="flex justify-between items-center text-sm bg-white p-2 rounded border">
                            <span>
                              Research #{research.id} - Quality: {research.researchQuality}
                              <span className="text-gray-500 ml-2">
                                (Created: {new Date(research.researchDate).toLocaleDateString()})
                              </span>
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}