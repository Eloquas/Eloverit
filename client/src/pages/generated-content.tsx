import DashboardLayout from "@/components/dashboard-layout";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, Copy, Download, Mail, MessageSquare, Search, Filter, ArrowLeft } from "lucide-react";
import { useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import ContentPreviewModal from "@/components/content-preview-modal";

export default function GeneratedContent() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterTone, setFilterTone] = useState("all");
  const [previewContent, setPreviewContent] = useState<any>(null);

  const { data: generatedContent = [], isLoading } = useQuery({
    queryKey: ["/api/generated-content"],
  });

  const filteredContent = useMemo(() => {
    return generatedContent.filter((content: any) => {
      const matchesSearch = !searchQuery || 
        content.prospectName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        content.prospectCompany?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        content.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        content.subject?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = filterType === "all" || content.type === filterType;
      const matchesTone = filterTone === "all" || content.tone === filterTone;
      
      return matchesSearch && matchesType && matchesTone;
    });
  }, [generatedContent, searchQuery, filterType, filterTone]);

  const handlePreviewContent = (content: any) => {
    setPreviewContent(content);
  };

  const handleCopyContent = (content: any) => {
    navigator.clipboard.writeText(content.content);
    toast({ 
      title: "Copied to clipboard!",
      description: `${content.type} content copied successfully`
    });
  };

  const handleExportContent = () => {
    const csvContent = filteredContent.map((content: any) => ({
      Date: new Date(content.createdAt).toLocaleDateString(),
      Type: content.type,
      Prospect: content.prospectName,
      Company: content.prospectCompany,
      Tone: content.tone,
      Subject: content.subject || "",
      Content: content.content.replace(/\n/g, " "),
      CTA: content.cta || ""
    }));

    const headers = Object.keys(csvContent[0] || {});
    const csvString = [
      headers.join(","),
      ...csvContent.map(row => 
        headers.map(header => `"${(row as any)[header] || ""}"`).join(",")
      )
    ].join("\n");

    const blob = new Blob([csvString], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `generated-content-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Export successful!",
      description: `Exported ${filteredContent.length} content items to CSV`
    });
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInHours < 48) return "1 day ago";
    return `${Math.floor(diffInHours / 24)} days ago`;
  };

  const getTypeIcon = (type: string) => {
    return type === "email" ? Mail : MessageSquare;
  };

  const getTypeColor = (type: string) => {
    return type === "email" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800";
  };

  const getToneColor = (tone: string) => {
    const colors: Record<string, string> = {
      professional: "bg-gray-100 text-gray-800",
      casual: "bg-orange-100 text-orange-800",
      urgent: "bg-red-100 text-red-800",
      friendly: "bg-yellow-100 text-yellow-800",
      consultative: "bg-purple-100 text-purple-800",
      storytelling: "bg-indigo-100 text-indigo-800",
      data_driven: "bg-cyan-100 text-cyan-800",
      personalized: "bg-pink-100 text-pink-800",
      solution_focused: "bg-emerald-100 text-emerald-800",
      executive: "bg-slate-100 text-slate-800"
    };
    return colors[tone] || "bg-gray-100 text-gray-800";
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading generated content...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary">Generated Content</h1>
            <p className="mt-2 text-gray-600">
              {filteredContent.length} of {generatedContent.length} content items available
            </p>
          </div>
          
          <Button 
            onClick={handleExportContent} 
            disabled={filteredContent.length === 0}
            className="bg-primary hover:bg-primary-dark avo-shadow-soft"
          >
            <Download className="w-4 h-4 mr-2" />
            Export to CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by prospect, company, or content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Content Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="linkedin">LinkedIn</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterTone} onValueChange={setFilterTone}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Tone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tones</SelectItem>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="casual">Casual</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="friendly">Friendly</SelectItem>
                <SelectItem value="consultative">Consultative</SelectItem>
                <SelectItem value="storytelling">Storytelling</SelectItem>
                <SelectItem value="data_driven">Data-Driven</SelectItem>
                <SelectItem value="personalized">Personalized</SelectItem>
                <SelectItem value="solution_focused">Solution-Focused</SelectItem>
                <SelectItem value="executive">Executive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Content Grid */}
      {filteredContent.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-gray-400 mb-4">
              {generatedContent.length === 0 ? (
                <Mail className="w-16 h-16 mx-auto" />
              ) : (
                <Filter className="w-16 h-16 mx-auto" />
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {generatedContent.length === 0 ? "No content generated yet" : "No content matches your filters"}
            </h3>
            <p className="text-gray-600 mb-4">
              {generatedContent.length === 0 
                ? "Generate some content from the dashboard to see it here."
                : "Try adjusting your search or filter criteria."
              }
            </p>
            {generatedContent.length === 0 && (
              <Link href="/">
                <Button>
                  Go to Dashboard
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredContent.map((content: any) => {
            const TypeIcon = getTypeIcon(content.type);
            return (
              <Card key={content.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <TypeIcon className="w-4 h-4 text-gray-600" />
                      <Badge className={getTypeColor(content.type)} variant="secondary">
                        {content.type}
                      </Badge>
                      <Badge className={getToneColor(content.tone)} variant="secondary">
                        {content.tone}
                      </Badge>
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatRelativeTime(content.createdAt)}
                    </span>
                  </div>
                  
                  <CardTitle className="text-sm font-medium text-gray-900">
                    {content.prospectName}
                  </CardTitle>
                  <p className="text-xs text-gray-600">
                    {content.prospectCompany}
                  </p>
                  
                  {content.subject && (
                    <p className="text-sm font-medium text-gray-800 mt-2">
                      {content.subject}
                    </p>
                  )}
                </CardHeader>
                
                <CardContent className="pt-0">
                  <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                    {content.content}
                  </p>
                  
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handlePreviewContent(content)}
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      View
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleCopyContent(content)}
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Copy
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <ContentPreviewModal 
        content={previewContent} 
        open={!!previewContent} 
        onClose={() => setPreviewContent(null)} 
      />
    </DashboardLayout>
  );
}