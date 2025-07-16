import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/app-layout";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import { Loader2 } from "lucide-react";
import Dashboard from "@/pages/dashboard";
import GeneratedContent from "@/pages/generated-content";
import AccountResearch from "@/pages/account-research";
import EnhancedAccountResearch from "@/pages/enhanced-account-research";
import ProspectIdentification from "@/pages/prospect-identification";
import DuplicatesManagement from "@/pages/duplicates-management";
import Onboarding from "@/pages/onboarding";
import { EloquasAI } from "@/pages/eloquas-ai";
import LinkedInPosts from "@/pages/linkedin-posts";
import EloquasLinkedInPosts from "@/pages/eloquas-linkedin-posts";
import Achievements from "@/pages/achievements";
import OutreachMVP from "@/pages/outreach-mvp";
import CallAssessment from "@/pages/call-assessment";
import MicrolearningPage from "@/pages/microlearning";
import ResearchInsights from "@/pages/research-insights";
import EmailCadences from "@/pages/email-cadences";
import OrchestratorDashboard from "@/pages/orchestrator-dashboard";
import Integrations from "@/pages/integrations";
import IntentDiscovery from "@/pages/intent-discovery";
import ProspectValidation from "@/pages/prospect-validation";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600 dark:text-gray-300">Loading Eloquas AI...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, show auth routes
  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/register" component={Register} />
        <Route path="/*" component={Login} />
      </Switch>
    );
  }

  // If authenticated, show protected app routes
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/prospect-identification" component={ProspectIdentification} />
        <Route path="/generated-content" component={GeneratedContent} />
        <Route path="/account-research" component={AccountResearch} />
        <Route path="/enhanced-account-research" component={EnhancedAccountResearch} />
        <Route path="/duplicates-management" component={DuplicatesManagement} />
        <Route path="/onboarding" component={Onboarding} />
        <Route path="/eloquas-ai" component={EloquasAI} />
        <Route path="/linkedin-posts" component={LinkedInPosts} />
        <Route path="/eloquas-linkedin-posts" component={EloquasLinkedInPosts} />
        <Route path="/achievements" component={Achievements} />
        <Route path="/outreach-mvp" component={OutreachMVP} />
        <Route path="/call-assessment" component={CallAssessment} />
        <Route path="/microlearning" component={MicrolearningPage} />
        <Route path="/research-insights" component={ResearchInsights} />
        <Route path="/email-cadences" component={EmailCadences} />
        <Route path="/orchestrator" component={OrchestratorDashboard} />
        <Route path="/integrations" component={Integrations} />
        <Route path="/intent-discovery" component={IntentDiscovery} />
        <Route path="/prospect-validation/:id" component={ProspectValidation} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
