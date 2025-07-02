import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import GeneratedContent from "@/pages/generated-content";
import AccountResearch from "@/pages/account-research";
import EmailCadences from "@/pages/email-cadences";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/prospects" component={Dashboard} />
      <Route path="/content" component={GeneratedContent} />
      <Route path="/research" component={AccountResearch} />
      <Route path="/cadences" component={EmailCadences} />
      <Route component={NotFound} />
    </Switch>
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
