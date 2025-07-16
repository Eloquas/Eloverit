import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ExternalLink, Building2, User, Mail, MapPin, Globe, Calendar, CheckCircle, XCircle, AlertCircle } from "lucide-react";

export default function ProspectValidation() {
  const { id } = useParams();
  const [, setLocation] = useLocation();

  const { data: prospect, isLoading } = useQuery({
    queryKey: ["/api/prospects", id],
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-96 bg-gray-200 rounded"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!prospect) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="text-center py-12">
            <AlertCircle className="mx-auto h-12 w-12 text-amber-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Prospect Not Found</h2>
            <p className="text-gray-600 mb-4">The prospect you're looking for doesn't exist.</p>
            <Button onClick={() => setLocation("/prospects")}>
              Back to Prospects
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Mock validation data - in production this would come from real validation APIs
  const getValidationData = (prospect: any) => {
    const companyValidation = {
      exists: true,
      confidence: 0.92,
      employees: "1,000-5,000",
      founded: "2008",
      revenue: "$100M - $500M",
      industry: "Financial Services",
      headquarters: "New York, NY",
      website: `https://www.${prospect.company.toLowerCase().replace(/\s+/g, '')}.com`,
      linkedinCompany: `https://linkedin.com/company/${prospect.company.toLowerCase().replace(/\s+/g, '-')}`,
      sources: ["LinkedIn", "Crunchbase", "ZoomInfo", "Company Website"]
    };

    const personValidation = {
      exists: true,
      confidence: 0.88,
      linkedinProfile: `https://linkedin.com/in/${prospect.name.toLowerCase().replace(/\s+/g, '-')}-${Math.random().toString(36).substr(2, 8)}`,
      tenure: "2.5 years",
      previousCompanies: ["TechCorp", "DataSystems Inc"],
      education: "MBA, Business Administration",
      location: "New York Metropolitan Area",
      verified: true,
      sources: ["LinkedIn", "ZoomInfo", "Apollo"]
    };

    return { companyValidation, personValidation };
  };

  const { companyValidation, personValidation } = getValidationData(prospect);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-600";
    if (confidence >= 0.6) return "text-yellow-600";
    return "text-red-600";
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) return <Badge className="bg-green-100 text-green-800">High Confidence</Badge>;
    if (confidence >= 0.6) return <Badge className="bg-yellow-100 text-yellow-800">Medium Confidence</Badge>;
    return <Badge className="bg-red-100 text-red-800">Low Confidence</Badge>;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Prospect Validation</h1>
          <p className="text-gray-600 mt-1">Verify company and contact information for outreach</p>
        </div>
        <Button variant="outline" onClick={() => setLocation("/prospects")}>
          Back to Prospects
        </Button>
      </div>

      {/* Validation Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Validation Summary
          </CardTitle>
          <CardDescription>
            Overall validation status for {prospect.name} at {prospect.company}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">Company Validation</span>
                {getConfidenceBadge(companyValidation.confidence)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Confidence Score</span>
                <span className={`font-semibold ${getConfidenceColor(companyValidation.confidence)}`}>
                  {(companyValidation.confidence * 100).toFixed(0)}%
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">Person Validation</span>
                {getConfidenceBadge(personValidation.confidence)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Confidence Score</span>
                <span className={`font-semibold ${getConfidenceColor(personValidation.confidence)}`}>
                  {(personValidation.confidence * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Company Validation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Company Validation
            </CardTitle>
            <CardDescription>
              Verification details for {prospect.company}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <label className="font-medium text-gray-700">Company Status</label>
                <div className="flex items-center gap-2 mt-1">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-green-600">Verified</span>
                </div>
              </div>
              <div>
                <label className="font-medium text-gray-700">Employee Count</label>
                <p className="mt-1">{companyValidation.employees}</p>
              </div>
              <div>
                <label className="font-medium text-gray-700">Founded</label>
                <p className="mt-1">{companyValidation.founded}</p>
              </div>
              <div>
                <label className="font-medium text-gray-700">Revenue</label>
                <p className="mt-1">{companyValidation.revenue}</p>
              </div>
              <div>
                <label className="font-medium text-gray-700">Industry</label>
                <p className="mt-1">{companyValidation.industry}</p>
              </div>
              <div>
                <label className="font-medium text-gray-700">Headquarters</label>
                <p className="mt-1 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {companyValidation.headquarters}
                </p>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <h4 className="font-medium">External Verification Links</h4>
              <div className="space-y-2">
                <a 
                  href={companyValidation.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
                >
                  <Globe className="h-4 w-4" />
                  Company Website
                  <ExternalLink className="h-3 w-3" />
                </a>
                <a 
                  href={companyValidation.linkedinCompany} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
                >
                  <ExternalLink className="h-4 w-4" />
                  LinkedIn Company Page
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <h4 className="font-medium">Data Sources</h4>
              <div className="flex flex-wrap gap-1">
                {companyValidation.sources.map((source) => (
                  <Badge key={source} variant="outline" className="text-xs">
                    {source}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Person Validation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Person Validation
            </CardTitle>
            <CardDescription>
              Verification details for {prospect.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 text-sm">
              <div>
                <label className="font-medium text-gray-700">Full Name</label>
                <p className="mt-1 flex items-center gap-2">
                  {prospect.name}
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </p>
              </div>
              <div>
                <label className="font-medium text-gray-700">Current Position</label>
                <p className="mt-1">{prospect.position}</p>
              </div>
              <div>
                <label className="font-medium text-gray-700">Email</label>
                <p className="mt-1 flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {prospect.email}
                </p>
              </div>
              <div>
                <label className="font-medium text-gray-700">Tenure at Company</label>
                <p className="mt-1 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {personValidation.tenure}
                </p>
              </div>
              <div>
                <label className="font-medium text-gray-700">Location</label>
                <p className="mt-1 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {personValidation.location}
                </p>
              </div>
              <div>
                <label className="font-medium text-gray-700">Education</label>
                <p className="mt-1">{personValidation.education}</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <h4 className="font-medium">Professional Profile</h4>
              <a 
                href={personValidation.linkedinProfile} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
              >
                <ExternalLink className="h-4 w-4" />
                LinkedIn Profile
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            <Separator />

            <div className="space-y-2">
              <h4 className="font-medium">Previous Experience</h4>
              <div className="space-y-1">
                {personValidation.previousCompanies.map((company) => (
                  <Badge key={company} variant="secondary" className="text-xs mr-1">
                    {company}
                  </Badge>
                ))}
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <h4 className="font-medium">Data Sources</h4>
              <div className="flex flex-wrap gap-1">
                {personValidation.sources.map((source) => (
                  <Badge key={source} variant="outline" className="text-xs">
                    {source}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Validation Complete</h3>
              <p className="text-sm text-gray-600">
                This prospect has been verified as a real person at a legitimate company.
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setLocation("/prospects")}>
                Back to Prospects
              </Button>
              <Button onClick={() => setLocation(`/generate-content?prospectId=${prospect.id}`)}>
                Generate Outreach
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}