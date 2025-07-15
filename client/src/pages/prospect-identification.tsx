import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Upload, Users, Search, Download, FileSpreadsheet, Building2, Target, Zap, Filter, MapPin, Briefcase, ArrowRight, Star } from "lucide-react";

// Lead Discovery Engine Component
function LeadDiscoveryEngine() {
  const [filters, setFilters] = useState({
    roles: [] as string[],
    territories: [] as string[],
    companySizes: [] as string[],
    industries: [] as string[],
    priorities: 'qa-automation'
  });
  const [discoveryResults, setDiscoveryResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();

  const roleOptions = [
    { id: 'qa-engineer', label: 'QA Engineer', category: 'Quality Assurance' },
    { id: 'qa-manager', label: 'QA Manager', category: 'Quality Assurance' },
    { id: 'qa-director', label: 'Director of QA', category: 'Quality Assurance' },
    { id: 'test-automation', label: 'Test Automation Engineer', category: 'Quality Assurance' },
    { id: 'crm-admin', label: 'CRM Administrator', category: 'CRM Systems' },
    { id: 'crm-manager', label: 'CRM Manager', category: 'CRM Systems' },
    { id: 'salesforce-admin', label: 'Salesforce Administrator', category: 'CRM Systems' },
    { id: 'business-systems', label: 'Business Systems Analyst', category: 'Enterprise Systems' },
    { id: 'systems-manager', label: 'Enterprise Systems Manager', category: 'Enterprise Systems' },
    { id: 'erp-admin', label: 'ERP Administrator', category: 'ERP Systems' },
    { id: 'sap-admin', label: 'SAP Administrator', category: 'ERP Systems' },
    { id: 'oracle-admin', label: 'Oracle Administrator', category: 'ERP Systems' }
  ];

  const territoryOptions = [
    'California', 'Texas', 'New York', 'Florida', 'Illinois', 'Pennsylvania', 
    'Ohio', 'Georgia', 'North Carolina', 'Michigan', 'New Jersey', 'Virginia',
    'Washington', 'Arizona', 'Massachusetts', 'Tennessee', 'Indiana', 'Maryland',
    'Missouri', 'Wisconsin', 'Colorado', 'Minnesota', 'South Carolina', 'Alabama'
  ];

  const companySizeOptions = [
    { id: '50-200', label: '50-200 employees', priority: 'medium' },
    { id: '200-500', label: '200-500 employees', priority: 'high' },
    { id: '500-1000', label: '500-1,000 employees', priority: 'high' },
    { id: '1000-5000', label: '1,000-5,000 employees', priority: 'very-high' },
    { id: '5000+', label: '5,000+ employees', priority: 'enterprise' }
  ];

  const industryOptions = [
    'Technology', 'Financial Services', 'Healthcare', 'Manufacturing', 
    'Retail', 'Education', 'Government', 'Insurance', 'Real Estate', 
    'Transportation', 'Energy', 'Media & Entertainment'
  ];

  const priorityOptions = [
    { id: 'qa-automation', label: 'QA Automation Focus', description: 'Prioritize accounts with QA testing needs' },
    { id: 'crm-migration', label: 'CRM Migration', description: 'Focus on Salesforce/CRM implementation projects' },
    { id: 'erp-modernization', label: 'ERP Modernization', description: 'Target SAP, Oracle, D365 initiatives' },
    { id: 'enterprise-systems', label: 'Enterprise Systems', description: 'Broad enterprise technology focus' }
  ];

  const handleRoleToggle = (roleId: string) => {
    setFilters(prev => ({
      ...prev,
      roles: prev.roles.includes(roleId) 
        ? prev.roles.filter(r => r !== roleId)
        : [...prev.roles, roleId]
    }));
  };

  const handleTerritoryToggle = (territory: string) => {
    setFilters(prev => ({
      ...prev,
      territories: prev.territories.includes(territory) 
        ? prev.territories.filter(t => t !== territory)
        : [...prev.territories, territory]
    }));
  };

  const handleSearch = async () => {
    if (filters.roles.length === 0) {
      toast({
        title: "Select Target Roles",
        description: "Please select at least one role to search for prospects.",
        variant: "destructive",
      });
      return;
    }

    if (filters.territories.length === 0) {
      toast({
        title: "Select Territories",
        description: "Please select at least one state/territory to focus your search.",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Mock discovery results
    const mockResults = [
      {
        id: 1,
        name: "Sarah Chen",
        title: "Director of QA",
        company: "TechFlow Solutions",
        location: "San Francisco, CA",
        employees: "1,200",
        industry: "Technology",
        qaScore: 95,
        initiatives: ["Test Automation", "CI/CD Pipeline", "Quality Metrics"],
        linkedinUrl: "https://linkedin.com/in/sarahchen",
        priority: "very-high"
      },
      {
        id: 2,
        name: "Michael Rodriguez",
        title: "Salesforce Administrator",
        company: "Global Finance Corp",
        location: "Austin, TX",
        employees: "3,500",
        industry: "Financial Services",
        qaScore: 88,
        initiatives: ["CRM Integration", "Process Automation", "Data Quality"],
        linkedinUrl: "https://linkedin.com/in/mrodriguez",
        priority: "high"
      },
      {
        id: 3,
        name: "Jennifer Park",
        title: "Enterprise Systems Manager",
        company: "MedTech Innovations",
        location: "Boston, MA",
        employees: "850",
        industry: "Healthcare",
        qaScore: 92,
        initiatives: ["EHR Testing", "Compliance Automation", "System Integration"],
        linkedinUrl: "https://linkedin.com/in/jpark",
        priority: "high"
      }
    ];

    setDiscoveryResults(mockResults);
    setIsSearching(false);
    
    toast({
      title: "Search Complete",
      description: `Found ${mockResults.length} qualified prospects matching your criteria.`,
    });
  };

  const groupedRoles = roleOptions.reduce((acc, role) => {
    if (!acc[role.category]) {
      acc[role.category] = [];
    }
    acc[role.category].push(role);
    return acc;
  }, {} as Record<string, typeof roleOptions>);

  return (
    <div className="space-y-6">
      {/* Search Filters */}
      <Card className="avo-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Lead Discovery Filters
          </CardTitle>
          <p className="text-sm text-gray-600">
            Configure your search criteria to find qualified prospects in your target market
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Role Selection */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Target Roles</Label>
            <div className="space-y-4">
              {Object.entries(groupedRoles).map(([category, roles]) => (
                <div key={category}>
                  <h4 className="font-medium text-gray-700 mb-2">{category}</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {roles.map((role) => (
                      <div key={role.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={role.id}
                          checked={filters.roles.includes(role.id)}
                          onCheckedChange={() => handleRoleToggle(role.id)}
                        />
                        <Label htmlFor={role.id} className="text-sm font-normal">
                          {role.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Territory/Geography */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Territory Focus</Label>
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {territoryOptions.map((territory) => (
                <div key={territory} className="flex items-center space-x-2">
                  <Checkbox 
                    id={territory}
                    checked={filters.territories.includes(territory)}
                    onCheckedChange={() => handleTerritoryToggle(territory)}
                  />
                  <Label htmlFor={territory} className="text-sm font-normal">
                    {territory}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Company Size */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Company Size</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {companySizeOptions.map((size) => (
                <div key={size.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={size.id}
                    checked={filters.companySizes.includes(size.id)}
                    onCheckedChange={() => {
                      setFilters(prev => ({
                        ...prev,
                        companySizes: prev.companySizes.includes(size.id) 
                          ? prev.companySizes.filter(s => s !== size.id)
                          : [...prev.companySizes, size.id]
                      }));
                    }}
                  />
                  <Label htmlFor={size.id} className="text-sm font-normal">
                    {size.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Search Priority */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Search Priority</Label>
            <Select value={filters.priorities} onValueChange={(value) => setFilters(prev => ({...prev, priorities: value}))}>
              <SelectTrigger>
                <SelectValue placeholder="Select search focus..." />
              </SelectTrigger>
              <SelectContent>
                {priorityOptions.map((priority) => (
                  <SelectItem key={priority.id} value={priority.id}>
                    <div>
                      <div className="font-medium">{priority.label}</div>
                      <div className="text-sm text-gray-500">{priority.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Search Button */}
          <div className="pt-4 border-t">
            <Button 
              onClick={handleSearch}
              disabled={isSearching || filters.roles.length === 0 || filters.territories.length === 0}
              className="w-full bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              {isSearching ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Searching with AI...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Find Prospects ({filters.roles.length} roles, {filters.territories.length} territories)
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Discovery Results */}
      {discoveryResults.length > 0 && (
        <Card className="avo-card">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Discovery Results ({discoveryResults.length})
              </div>
              <Badge className="bg-green-100 text-green-700 border border-green-200">
                AI Prioritized
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {discoveryResults.map((prospect) => (
                <div key={prospect.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h3 className="font-semibold text-gray-900">{prospect.name}</h3>
                        <Badge 
                          className={`ml-2 ${
                            prospect.priority === 'very-high' ? 'bg-red-100 text-red-700 border-red-200' :
                            prospect.priority === 'high' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                            'bg-blue-100 text-blue-700 border-blue-200'
                          }`}
                        >
                          {prospect.priority === 'very-high' ? 'Very High Priority' : 
                           prospect.priority === 'high' ? 'High Priority' : 'Medium Priority'}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                        <div>
                          <p className="font-medium text-gray-700">{prospect.title}</p>
                          <p>{prospect.company}</p>
                        </div>
                        <div>
                          <p className="flex items-center"><MapPin className="w-3 h-3 mr-1" />{prospect.location}</p>
                          <p className="flex items-center"><Building2 className="w-3 h-3 mr-1" />{prospect.employees} employees</p>
                        </div>
                        <div>
                          <p className="flex items-center"><Briefcase className="w-3 h-3 mr-1" />{prospect.industry}</p>
                          <p className="flex items-center"><Star className="w-3 h-3 mr-1" />QA Score: {prospect.qaScore}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-700">Key Initiatives:</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {prospect.initiatives.slice(0, 2).map((initiative: string) => (
                              <Badge key={initiative} variant="secondary" className="text-xs">
                                {initiative}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      {/* QA-Focused SCIPAB Brief */}
                      <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                        <h4 className="text-sm font-semibold text-blue-800 mb-2 flex items-center">
                          <Target className="w-4 h-4 mr-1" />
                          QA Automation Value Brief
                        </h4>
                        <div className="space-y-1 text-xs text-blue-700">
                          <p><strong>Situation:</strong> {prospect.company} ({prospect.employees} employees) managing complex {prospect.industry.toLowerCase()} systems</p>
                          <p><strong>Challenge:</strong> Manual testing consuming 60-80% of QA cycles, delaying releases</p>
                          <p><strong>Value:</strong> 80% testing time reduction + 40% faster releases + $1.2M OPEX savings potential</p>
                          <p><strong>Next:</strong> {prospect.title} likely evaluating QA automation solutions for {new Date().getFullYear() + 1} initiatives</p>
                        </div>
                        <div className="mt-2 flex items-center text-xs text-blue-600">
                          <Badge variant="outline" className="text-blue-600 border-blue-300">
                            Data: PDL + AI Research
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2 ml-4">
                      <Button variant="outline" size="sm">
                        View Profile
                      </Button>
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                        Add to Pipeline
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 text-center">
              <Button variant="outline" className="mr-3">
                Export Results
              </Button>
              <Button className="bg-green-600 hover:bg-green-700">
                Add All to Account Research
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function ProspectIdentification() {
  const [file, setFile] = useState<File | null>(null);
  const [uploadStats, setUploadStats] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: prospects = [] } = useQuery({
    queryKey: ["/api/prospects"],
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/prospects/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setUploadStats(data);
      queryClient.invalidateQueries({ queryKey: ["/api/prospects"] });
      toast({
        title: "Upload Successful",
        description: `Added ${data.successful} prospects. ${data.skipped} duplicates skipped.`,
      });
      setFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleUpload = () => {
    if (file) {
      uploadMutation.mutate(file);
    }
  };

  const formatFileSize = (bytes: number) => {
    return (bytes / 1024).toFixed(1) + ' KB';
  };

  // Calculate stats
  const totalCompanies = [...new Set(prospects.map((p: any) => p.company))].length;
  const managerLevel = prospects.filter((p: any) => 
    p.position?.toLowerCase().includes('manager') ||
    p.position?.toLowerCase().includes('director') ||
    p.position?.toLowerCase().includes('vp') ||
    p.position?.toLowerCase().includes('head')
  ).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary">Prospect Identification</h1>
            <p className="mt-2 text-gray-600">Upload your prospect lists or discover new leads with AI-powered research</p>
          </div>
          <Badge className="bg-blue-100 text-blue-700 border border-blue-200">
            START HERE
          </Badge>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="avo-card">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 w-12 h-12 avo-badge-blue rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 mb-1">Total Prospects</p>
                <p className="text-2xl font-bold text-primary">{prospects.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="avo-card">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 w-12 h-12 avo-badge-purple rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 mb-1">Companies</p>
                <p className="text-2xl font-bold text-primary">{totalCompanies}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="avo-card">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 w-12 h-12 avo-badge-green rounded-xl flex items-center justify-center">
                <Target className="w-6 h-6 text-accent" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 mb-1">Manager+ Level</p>
                <p className="text-2xl font-bold text-primary">{managerLevel}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="upload" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">Upload Prospect Lists</TabsTrigger>
          <TabsTrigger value="discover">AI Lead Discovery</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upload Section */}
            <Card className="avo-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Upload className="w-5 h-5 mr-2" />
                  Upload CSV/Excel File
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="file-upload">Select File</Label>
                  <Input
                    id="file-upload"
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileChange}
                    className="mt-1"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Supports CSV, Excel (.xlsx, .xls) files
                  </p>
                </div>

                {file && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <FileSpreadsheet className="w-5 h-5 text-blue-600 mr-2" />
                        <div>
                          <p className="font-medium text-blue-800">{file.name}</p>
                          <p className="text-sm text-blue-600">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <Button 
                        onClick={handleUpload}
                        disabled={uploadMutation.isPending}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {uploadMutation.isPending ? (
                          <div className="flex items-center">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                            Uploading...
                          </div>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Upload
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {uploadStats && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-2">Upload Results</h4>
                    <div className="space-y-1 text-sm text-green-700">
                      <p>✓ {uploadStats.successful} prospects added successfully</p>
                      <p>• {uploadStats.skipped} duplicates skipped</p>
                      <p>• {uploadStats.total} total rows processed</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Format Guide */}
            <Card className="avo-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileSpreadsheet className="w-5 h-5 mr-2" />
                  Expected Format
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">Required Columns:</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center">
                        <Badge variant="secondary" className="mr-2">name</Badge>
                      </div>
                      <div className="flex items-center">
                        <Badge variant="secondary" className="mr-2">email</Badge>
                      </div>
                      <div className="flex items-center">
                        <Badge variant="secondary" className="mr-2">company</Badge>
                      </div>
                      <div className="flex items-center">
                        <Badge variant="secondary" className="mr-2">position</Badge>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">Optional Columns:</h4>
                    <div className="text-sm space-y-1">
                      <p>• phone, location, linkedin_url</p>
                      <p>• industry, company_size, website</p>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="font-medium text-gray-800 mb-2">Example CSV:</h4>
                    <pre className="text-xs text-gray-600 overflow-x-auto">
{`name,email,company,position
John Smith,john@acme.com,Acme Corp,VP Quality
Jane Doe,jane@techco.com,TechCo,QA Director`}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="discover" className="space-y-6">
          <LeadDiscoveryEngine />
        </TabsContent>
      </Tabs>

      {/* Next Steps */}
      {prospects.length > 0 && (
        <Card className="avo-card border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-800 mb-2">Next: Run Account Research</h3>
                <p className="text-blue-700 mb-4">
                  You have {prospects.length} prospects loaded. Generate AI-powered account research to understand their 
                  enterprise systems, pain points, and QA automation needs.
                </p>
                <Button asChild className="bg-blue-600 hover:bg-blue-700">
                  <a href="/account-research">
                    Start Account Research
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}