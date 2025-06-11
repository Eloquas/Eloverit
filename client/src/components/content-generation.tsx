import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Mail, MessageSquare, Users, Sparkles, Eye, Copy, Download } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contentGenerationSchema, type ContentGenerationRequest } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import LoadingModal from "./loading-modal";
import ContentPreviewModal from "./content-preview-modal";

interface ContentGenerationProps {
  selectedProspects: number[];
}

export default function ContentGeneration({ selectedProspects }: ContentGenerationProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewContent, setPreviewContent] = useState<any>(null);

  const { data: recentContent = [] } = useQuery({
    queryKey: ["/api/generated-content"],
  });

  const form = useForm<ContentGenerationRequest>({
    resolver: zodResolver(contentGenerationSchema),
    defaultValues: {
      type: "email",
      tone: "professional",
      cta: "",
      context: "",
      prospectIds: [],
    },
  });

  const generateContentMutation = useMutation({
    mutationFn: async (data: ContentGenerationRequest) => {
      const response = await apiRequest("POST", "/api/generate-content", data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/generated-content"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setIsGenerating(false);
      toast({
        title: "Success!",
        description: data.message,
      });
      form.reset();
    },
    onError: (error: any) => {
      setIsGenerating(false);
      toast({
        title: "Error",
        description: error.message || "Failed to generate content",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: ContentGenerationRequest) => {
    console.log("Form submitted:", data, "Selected prospects:", selectedProspects);
    
    if (selectedProspects.length === 0) {
      toast({
        title: "No prospects selected",
        description: "Please select prospects from the table above first, then try generating content",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    generateContentMutation.mutate({
      ...data,
      prospectIds: selectedProspects,
    });
  };

  const handleQuickGenerate = (type: "email" | "linkedin") => {
    console.log("Quick generate clicked:", type, "Selected prospects:", selectedProspects);
    
    if (selectedProspects.length === 0) {
      toast({
        title: "No prospects selected",
        description: "Please select prospects from the table above first, then try generating content",
        variant: "destructive",
      });
      return;
    }

    form.setValue("type", type);
    form.setValue("cta", type === "email" ? "Schedule a 15-minute call" : "Let's connect and discuss");
    form.setValue("tone", "professional");
    form.handleSubmit(onSubmit)();
  };

  const handlePreviewContent = (content: any) => {
    setPreviewContent(content);
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

  return (
    <>
      {/* Enhanced Loading Overlay */}
      {generateContentMutation.isPending && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md mx-4 text-center">
            <div className="w-16 h-16 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Generating Content...</h3>
            <p className="text-gray-600">
              Creating personalized content for {selectedProspects.length} prospect{selectedProspects.length !== 1 ? 's' : ''}
            </p>
            <div className="mt-4 text-sm text-gray-500">
              This usually takes 3-5 seconds per prospect
            </div>
          </div>
        </div>
      )}
      
      <div className="space-y-6">
        {/* Quick Actions Card */}
        <Card className="border-gray-100">
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
            {selectedProspects.length === 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-2">
                <p className="text-sm text-amber-800">
                  <strong>Step 1:</strong> Select prospects from the table on the left first
                </p>
              </div>
            )}
            {selectedProspects.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-2">
                <p className="text-sm text-green-800">
                  <strong>Ready!</strong> {selectedProspects.length} prospect{selectedProspects.length !== 1 ? 's' : ''} selected
                </p>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              className="w-full bg-primary hover:bg-primary-dark"
              onClick={() => handleQuickGenerate("email")}
              disabled={selectedProspects.length === 0 || generateContentMutation.isPending}
            >
              {generateContentMutation.isPending ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating Email...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Generate Email Copy
                </>
              )}
            </Button>
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700"
              onClick={() => handleQuickGenerate("linkedin")}
              disabled={selectedProspects.length === 0 || generateContentMutation.isPending}
            >
              {generateContentMutation.isPending ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating LinkedIn...
                </>
              ) : (
                <>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Generate LinkedIn Messages
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              disabled={selectedProspects.length === 0}
            >
              <Users className="w-4 h-4 mr-2" />
              Bulk Generate ({selectedProspects.length})
            </Button>
          </CardContent>
        </Card>

        {/* Content Generation Form */}
        <Card className="border-gray-100">
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Content Customization</h3>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select content type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="email">Email Copy</SelectItem>
                          <SelectItem value="linkedin">LinkedIn Message</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tone</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select tone" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="professional">Professional</SelectItem>
                          <SelectItem value="friendly">Friendly</SelectItem>
                          <SelectItem value="casual">Casual</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cta"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Call to Action</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Schedule a 15-minute call" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="context"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Context</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Any specific details to include..."
                          rows={3}
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full bg-accent hover:bg-green-700"
                  disabled={generateContentMutation.isPending || selectedProspects.length === 0}
                >
                  {generateContentMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Generating Content...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Content ({selectedProspects.length} prospects)
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Recent Generated Content */}
        <Card className="border-gray-100">
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Recent Generated Content</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentContent.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No content generated yet. Select prospects and generate some content to get started.
                </div>
              ) : (
                recentContent.slice(0, 5).map((content: any) => (
                  <div key={content.id} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 cursor-pointer">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900 capitalize">
                        {content.type} - {content.prospectName}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatRelativeTime(content.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 truncate">
                      {content.subject && `${content.subject} - `}
                      {content.content.substring(0, 80)}...
                    </p>
                    <div className="flex items-center mt-2 space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-xs text-primary hover:text-primary-dark p-0 h-auto"
                        onClick={() => handlePreviewContent(content)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Preview
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-xs text-accent hover:text-green-700 p-0 h-auto"
                        onClick={() => {
                          navigator.clipboard.writeText(content.content);
                          toast({ title: "Copied to clipboard!" });
                        }}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copy
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
            {recentContent.length > 5 && (
              <Button variant="ghost" className="w-full mt-4 text-sm text-primary hover:text-primary-dark font-medium">
                View All Generated Content →
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <LoadingModal open={isGenerating} />
      <ContentPreviewModal 
        content={previewContent} 
        open={!!previewContent} 
        onClose={() => setPreviewContent(null)} 
      />
    </>
  );
}
