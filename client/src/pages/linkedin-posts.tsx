import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/dashboard-layout";
import {
  Sparkles,
  Edit3,
  Send,
  CheckCircle,
  Clock,
  TrendingUp,
  Users,
  Target,
  Award,
  Copy,
  ExternalLink,
  Calendar,
  Plus,
  AlertTriangle,
  Check
} from "lucide-react";

interface PostTrigger {
  type: 'high_replies' | 'high_trust' | 'score_improvement' | 'personal_best';
  metric: string;
  context: string;
}

interface PostInputs {
  industry: string;
  postFocus: string;
  targetAudience: string[];
  businessContext: string;
  keyMessage: string;
  desiredWordCount: number;
}

interface LinkedInPost {
  id: string;
  userId: number;
  repName: string;
  postContent: string;
  trigger: PostTrigger;
  status: 'draft' | 'approved' | 'published';
  createdAt: string;
  publishedAt?: string;
  includeBranding: boolean;
  inputs?: PostInputs;
  wordCount?: number;
  validationNotes?: string[];
}

const triggerIcons = {
  high_replies: TrendingUp,
  high_trust: Users,
  score_improvement: Target,
  personal_best: Award
};

const triggerColors = {
  high_replies: "bg-green-100 text-green-800",
  high_trust: "bg-blue-100 text-blue-800",
  score_improvement: "bg-purple-100 text-purple-800",
  personal_best: "bg-yellow-100 text-yellow-800"
};

export default function LinkedInPosts() {
  const { toast } = useToast();
  const [selectedPost, setSelectedPost] = useState<LinkedInPost | null>(null);
  const [editedContent, setEditedContent] = useState("");
  const [includeBranding, setIncludeBranding] = useState(true);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customInputs, setCustomInputs] = useState<PostInputs>({
    industry: 'SaaS',
    postFocus: 'milestone',
    targetAudience: ['Sales Manager', 'VP of Sales'],
    businessContext: 'Quarter performance',
    keyMessage: '',
    desiredWordCount: 100
  });

  // Fetch posts
  const { data: posts = [], isLoading } = useQuery<LinkedInPost[]>({
    queryKey: ['/api/linkedin-posts'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Generate new posts
  const generatePosts = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/linkedin-posts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to generate posts');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/linkedin-posts'] });
      toast({
        title: "Posts Generated",
        description: "New LinkedIn posts have been created based on your recent activity.",
      });
    },
  });

  // Generate custom post
  const generateCustomPost = useMutation({
    mutationFn: async ({ trigger, inputs }: { trigger: PostTrigger; inputs: PostInputs }) => {
      const response = await fetch('/api/linkedin-posts/generate-custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trigger, inputs }),
      });
      if (!response.ok) throw new Error('Failed to generate custom post');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/linkedin-posts'] });
      setShowCustomModal(false);
      toast({
        title: "Custom Post Generated",
        description: `Generated ${data.wordCount}-word post with ${data.validationNotes?.length || 0} validation notes.`,
      });
    },
  });

  // Update post
  const updatePost = useMutation({
    mutationFn: async ({ postId, updates }: { postId: string; updates: Partial<LinkedInPost> }) => {
      const response = await fetch(`/api/linkedin-posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update post');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/linkedin-posts'] });
      toast({
        title: "Post Updated",
        description: "Your changes have been saved.",
      });
    },
  });

  // Approve post
  const approvePost = useMutation({
    mutationFn: async (postId: string) => {
      const response = await fetch(`/api/linkedin-posts/${postId}/approve`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to approve post');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/linkedin-posts'] });
      toast({
        title: "Post Approved",
        description: "This post is ready to be published.",
      });
    },
  });

  // Publish post
  const publishPost = useMutation({
    mutationFn: async (postId: string) => {
      const response = await fetch(`/api/linkedin-posts/${postId}/publish`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to publish post');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/linkedin-posts'] });
      toast({
        title: "Post Published",
        description: "Your post has been published to LinkedIn.",
      });
    },
  });

  useEffect(() => {
    if (selectedPost) {
      setEditedContent(selectedPost.postContent);
      setIncludeBranding(selectedPost.includeBranding);
    }
  }, [selectedPost]);

  const handleSavePost = () => {
    if (selectedPost) {
      updatePost.mutate({
        postId: selectedPost.id,
        updates: {
          postContent: editedContent,
          includeBranding: includeBranding,
        },
      });
      setSelectedPost(null);
    }
  };

  const handleCopyPost = (content: string) => {
    const finalContent = includeBranding 
      ? `${content}\n\n---\n💡 Powered by Eloquas AI`
      : content;
    
    navigator.clipboard.writeText(finalContent);
    toast({
      title: "Copied to Clipboard",
      description: "Post content has been copied and is ready to paste on LinkedIn.",
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)} days ago`;
    }
    return date.toLocaleDateString();
  };

  const drafts = posts.filter(p => p.status === 'draft');
  const approved = posts.filter(p => p.status === 'approved');
  const published = posts.filter(p => p.status === 'published');

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold avo-text-gradient mb-2">LinkedIn Posts</h1>
            <p className="text-gray-600">
              AI-generated posts based on your TrustScore & StoryScore achievements
            </p>
          </div>
          <div className="flex gap-3">
            <Dialog open={showCustomModal} onOpenChange={setShowCustomModal}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Custom Post
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Custom LinkedIn Post</DialogTitle>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                  {/* Industry */}
                  <div className="grid gap-2">
                    <Label htmlFor="industry">Industry</Label>
                    <Select
                      value={customInputs.industry}
                      onValueChange={(value) => setCustomInputs(prev => ({ ...prev, industry: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SaaS">SaaS</SelectItem>
                        <SelectItem value="Tech">Tech</SelectItem>
                        <SelectItem value="Finance">Finance</SelectItem>
                        <SelectItem value="Consulting">Consulting</SelectItem>
                        <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                        <SelectItem value="Logistics">Logistics</SelectItem>
                        <SelectItem value="Healthcare">Healthcare</SelectItem>
                        <SelectItem value="Pharma">Pharma</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Post Focus */}
                  <div className="grid gap-2">
                    <Label htmlFor="postFocus">Post Focus</Label>
                    <Select
                      value={customInputs.postFocus}
                      onValueChange={(value) => setCustomInputs(prev => ({ ...prev, postFocus: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select post focus" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="milestone">New Milestone</SelectItem>
                        <SelectItem value="insight">New Insight</SelectItem>
                        <SelectItem value="customer-story">Customer Story</SelectItem>
                        <SelectItem value="achievement">Personal Achievement</SelectItem>
                        <SelectItem value="learning">Key Learning</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Target Audience */}
                  <div className="grid gap-2">
                    <Label htmlFor="targetAudience">Target Audience Job Titles</Label>
                    <div className="space-y-2">
                      {customInputs.targetAudience.map((title, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            placeholder="e.g., VP of Sales, Sales Manager, Director of Revenue"
                            value={title}
                            onChange={(e) => {
                              const newTitles = [...customInputs.targetAudience];
                              newTitles[index] = e.target.value;
                              setCustomInputs(prev => ({ ...prev, targetAudience: newTitles }));
                            }}
                            className="flex-1"
                          />
                          {customInputs.targetAudience.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newTitles = customInputs.targetAudience.filter((_, i) => i !== index);
                                setCustomInputs(prev => ({ ...prev, targetAudience: newTitles }));
                              }}
                              className="px-3"
                            >
                              ×
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setCustomInputs(prev => ({ 
                            ...prev, 
                            targetAudience: [...prev.targetAudience, ''] 
                          }));
                        }}
                        className="w-full"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Another Job Title
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Add specific job titles you want to target (e.g., "VP of Sales", "Account Executive", "Sales Director")
                    </p>
                  </div>

                  {/* Business Context */}
                  <div className="grid gap-2">
                    <Label htmlFor="businessContext">Business Context</Label>
                    <Input
                      id="businessContext"
                      placeholder="e.g., Q2 pipeline push, product launch, hiring drive"
                      value={customInputs.businessContext}
                      onChange={(e) => setCustomInputs(prev => ({ ...prev, businessContext: e.target.value }))}
                    />
                  </div>

                  {/* Key Message */}
                  <div className="grid gap-2">
                    <Label htmlFor="keyMessage">Key Message</Label>
                    <Textarea
                      id="keyMessage"
                      placeholder="Core takeaway you want to share..."
                      value={customInputs.keyMessage}
                      onChange={(e) => setCustomInputs(prev => ({ ...prev, keyMessage: e.target.value }))}
                      rows={3}
                    />
                  </div>

                  {/* Word Count */}
                  <div className="grid gap-2">
                    <Label htmlFor="desiredWordCount">Desired Word Count</Label>
                    <div className="flex items-center gap-4">
                      <Input
                        id="desiredWordCount"
                        type="number"
                        min={50}
                        max={150}
                        value={customInputs.desiredWordCount}
                        onChange={(e) => setCustomInputs(prev => ({ ...prev, desiredWordCount: parseInt(e.target.value) }))}
                        className="w-32"
                      />
                      <div className="text-sm text-gray-500">
                        Optimal: 80-120 words | Hard limit: 150 words
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <Button variant="outline" onClick={() => setShowCustomModal(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={() => {
                        if (!customInputs.keyMessage.trim()) {
                          toast({
                            title: "Missing Key Message",
                            description: "Please enter a key message to generate your post.",
                            variant: "destructive"
                          });
                          return;
                        }
                        
                        const validTitles = customInputs.targetAudience.filter(title => title.trim());
                        if (validTitles.length === 0) {
                          toast({
                            title: "Missing Target Audience",
                            description: "Please enter at least one job title for your target audience.",
                            variant: "destructive"
                          });
                          return;
                        }
                        
                        const mockTrigger: PostTrigger = {
                          type: 'personal_best',
                          metric: 'Custom post generation',
                          context: customInputs.businessContext
                        };
                        
                        generateCustomPost.mutate({ trigger: mockTrigger, inputs: customInputs });
                      }}
                      disabled={generateCustomPost.isPending}
                      className="avo-gradient-blue text-white"
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      {generateCustomPost.isPending ? 'Generating...' : 'Generate Post'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            <Button
              onClick={() => generatePosts.mutate()}
              disabled={generatePosts.isPending}
              className="avo-gradient-blue text-white"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {generatePosts.isPending ? 'Generating...' : 'Auto-Generate Posts'}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Drafts</p>
                  <p className="text-2xl font-bold">{drafts.length}</p>
                </div>
                <Edit3 className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Approved</p>
                  <p className="text-2xl font-bold">{approved.length}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Published</p>
                  <p className="text-2xl font-bold">{published.length}</p>
                </div>
                <Send className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">This Week</p>
                  <p className="text-2xl font-bold">
                    {posts.filter(p => {
                      const postDate = new Date(p.createdAt);
                      const weekAgo = new Date();
                      weekAgo.setDate(weekAgo.getDate() - 7);
                      return postDate > weekAgo;
                    }).length}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="drafts" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="drafts">Drafts ({drafts.length})</TabsTrigger>
            <TabsTrigger value="approved">Approved ({approved.length})</TabsTrigger>
            <TabsTrigger value="published">Published ({published.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="drafts" className="mt-6">
            <div className="grid gap-4">
              {drafts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onEdit={() => setSelectedPost(post)}
                  onApprove={() => approvePost.mutate(post.id)}
                  onCopy={() => handleCopyPost(post.postContent)}
                />
              ))}
              {drafts.length === 0 && (
                <Card>
                  <CardContent className="p-12 text-center">
                    <p className="text-gray-500">No draft posts available. Generate new posts based on your recent achievements!</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="approved" className="mt-6">
            <div className="grid gap-4">
              {approved.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onPublish={() => publishPost.mutate(post.id)}
                  onCopy={() => handleCopyPost(post.postContent)}
                />
              ))}
              {approved.length === 0 && (
                <Card>
                  <CardContent className="p-12 text-center">
                    <p className="text-gray-500">No approved posts yet.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="published" className="mt-6">
            <div className="grid gap-4">
              {published.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onCopy={() => handleCopyPost(post.postContent)}
                />
              ))}
              {published.length === 0 && (
                <Card>
                  <CardContent className="p-12 text-center">
                    <p className="text-gray-500">No published posts yet.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Edit Modal */}
        {selectedPost && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-auto">
              <CardHeader>
                <CardTitle>Edit LinkedIn Post</CardTitle>
                <CardDescription>Customize your post before approval</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Post Content</Label>
                  <Textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="min-h-[300px] mt-2"
                    placeholder="Write your LinkedIn post here..."
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="branding"
                    checked={includeBranding}
                    onCheckedChange={setIncludeBranding}
                  />
                  <Label htmlFor="branding">Include "Powered by Eloquas AI" tag</Label>
                </div>
                <div className="flex justify-end space-x-3">
                  <Button variant="outline" onClick={() => setSelectedPost(null)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSavePost} className="avo-gradient-blue text-white">
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

interface PostCardProps {
  post: LinkedInPost;
  onEdit?: () => void;
  onApprove?: () => void;
  onPublish?: () => void;
  onCopy: () => void;
}

function PostCard({ post, onEdit, onApprove, onPublish, onCopy }: PostCardProps) {
  const TriggerIcon = triggerIcons[post.trigger.type];
  const triggerColor = triggerColors[post.trigger.type];
  
  return (
    <Card className="avo-card-hover">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge className={triggerColor}>
                <TriggerIcon className="mr-1 h-3 w-3" />
                {post.trigger.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Badge>
              {post.inputs && (
                <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                  Custom Post
                </Badge>
              )}
              <span className="text-sm text-gray-500">
                {formatDate(post.createdAt)}
              </span>
            </div>
            <p className="text-sm font-medium text-gray-700">{post.trigger.metric}</p>
            
            {/* Word Count and Validation */}
            {(post.wordCount || post.validationNotes) && (
              <div className="flex items-center gap-3 text-xs">
                {post.wordCount && (
                  <div className="flex items-center gap-1">
                    <span className="text-gray-500">Words:</span>
                    <span className={`font-medium ${
                      post.wordCount <= 120 ? 'text-green-600' : 
                      post.wordCount <= 150 ? 'text-amber-600' : 'text-red-600'
                    }`}>
                      {post.wordCount}
                    </span>
                  </div>
                )}
                {post.validationNotes && post.validationNotes.length > 0 && (
                  <div className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 text-amber-500" />
                    <span className="text-amber-600">{post.validationNotes.length} note{post.validationNotes.length > 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>
            )}
            
            {/* Custom Input Summary */}
            {post.inputs && (
              <div className="text-xs text-gray-500 space-y-1">
                <div className="flex gap-2">
                  <span className="font-medium">Industry:</span>
                  <span>{post.inputs.industry}</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-medium">Focus:</span>
                  <span>{post.inputs.postFocus}</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-medium">Targeting:</span>
                  <span>{Array.isArray(post.inputs.targetAudience) 
                    ? post.inputs.targetAudience.filter(title => title.trim()).join(', ')
                    : post.inputs.targetAudience}</span>
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            {post.status === 'draft' && onEdit && (
              <Button size="sm" variant="outline" onClick={onEdit}>
                <Edit3 className="h-4 w-4" />
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={onCopy}>
              <Copy className="h-4 w-4" />
            </Button>
            {post.status === 'published' && (
              <Button size="sm" variant="outline" asChild>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm max-w-none">
          <p className="whitespace-pre-wrap text-gray-700">{post.postContent}</p>
          
          {/* Validation Notes */}
          {post.validationNotes && post.validationNotes.length > 0 && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-800">Validation Notes</span>
              </div>
              <ul className="text-sm text-amber-700 space-y-1">
                {post.validationNotes.map((note, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="block w-1 h-1 bg-amber-500 rounded-full mt-2 flex-shrink-0"></span>
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {post.includeBranding && (
            <p className="text-sm text-gray-500 mt-4 pt-4 border-t">
              💡 Powered by Eloquas AI
            </p>
          )}
        </div>
        {post.status === 'draft' && onApprove && (
          <Button 
            onClick={onApprove} 
            className="mt-4 w-full avo-gradient-blue text-white"
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Approve for Publishing
          </Button>
        )}
        {post.status === 'approved' && onPublish && (
          <Button 
            onClick={onPublish} 
            className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white"
          >
            <Send className="mr-2 h-4 w-4" />
            Publish to LinkedIn
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
  
  if (diffInHours < 1) {
    return 'Just now';
  } else if (diffInHours < 24) {
    return `${Math.floor(diffInHours)} hours ago`;
  } else if (diffInHours < 168) {
    return `${Math.floor(diffInHours / 24)} days ago`;
  }
  return date.toLocaleDateString();
}