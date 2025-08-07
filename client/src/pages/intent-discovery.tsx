import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { 
  Search, 
  Target, 
  Users, 
  Brain,
  Building,
  ChevronRight,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Eye,
  UserPlus
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/apiRequest";
import type { Account, Contact } from "@shared/schema";

export default function IntentDiscovery() {
  const [isAutoMode, setIsAutoMode] = useState(false);
  const [selectedSystems, setSelectedSystems] = useState<string[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [showContacts, setShowContacts] = useState(false);
  const [currentResearchResults, setCurrentResearchResults] = useState<Account[]>([]);
  const [lastResearchRun, setLastResearchRun] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const targetSystems = [
    { id: "dynamics", name: "MS Dynamics 365", color: "bg-blue-100 text-blue-800" },
    { id: "oracle", name: "Oracle", color: "bg-red-100 text-red-800" },
    { id: "sap", name: "SAP", color: "bg-green-100 text-green-800" },
    { id: "salesforce", name: "Salesforce", color: "bg-cyan-100 text-cyan-800" }
  ];

  // Fetch discovered accounts
  const { data: accounts, isLoading: accountsLoading } = useQuery({
    queryKey: ['/api/accounts'],
    enabled: true,
  });

  // Fetch contacts for selected account
  const { data: contacts, isLoading: contactsLoading } = useQuery({
    queryKey: ['/api/contacts', selectedAccount?.id],
    enabled: !!selectedAccount?.id,
    queryFn: async () => {
      if (!selectedAccount?.id) return [];
      const response = await fetch(`/api/contacts/${selectedAccount.id}`);
      if (!response.ok) throw new Error('Failed to fetch contacts');
      return response.json();
    }
  });

  // Intent discovery mutation
  const discoverMutation = useMutation({
    mutationFn: async (data: { query: string; systems: string[]; isAuto: boolean }) => {
      const response = await fetch('/api/discover-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Discovery failed');
      }
      return response.json();
    },
    onSuccess: (data) => {
      // CRITICAL: Use fresh results immediately instead of relying on stale DB query
      console.log(`Fresh research completed: ${data.accounts.length} accounts with ${data.researchSummary.modelUsed}`);
      setCurrentResearchResults(data.accounts || []);
      setLastResearchRun(data.researchSummary.timestamp);
      
      // Invalidate cache as secondary action
      queryClient.invalidateQueries({ queryKey: ['/api/accounts'] });
    },
    onError: (error) => {
      console.error('Discovery failed:', error);
      setCurrentResearchResults([]);
      setLastResearchRun(null);
    }
  });

  // Contact identification mutation
  const identifyContactsMutation = useMutation({
    mutationFn: async (accountId: number) => {
      const response = await fetch(`/api/accounts/${accountId}/identify-contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Contact identification failed');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contacts', selectedAccount?.id] });
    },
  });

  const handleSystemToggle = (systemId: string) => {
    setSelectedSystems(prev => 
      prev.includes(systemId) 
        ? prev.filter(s => s !== systemId)
        : [...prev, systemId]
    );
  };

  const handleDiscover = () => {
    if (selectedSystems.length === 0) return;
    
    discoverMutation.mutate({
      query: selectedSystems.join(', '), // Use selected systems as the query
      systems: selectedSystems,
      isAuto: isAutoMode,
    });
  };

  const handleIdentifyContacts = (account: Account) => {
    setSelectedAccount(account);
    setShowContacts(true);
    identifyContactsMutation.mutate(account.id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            Intent Discovery + Contact Identification
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            GPT o3-pro research for high-intent accounts → Account SCIPABs → Manager+ contact identification → Role SCIPABs
          </p>
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Discovery Panel */}
        <div className="lg:col-span-1">
          <Card className="avo-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Brain className="h-5 w-5 mr-2 text-indigo-600" />
                Intent Discovery
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Target Systems Selection */}
              <div>
                <Label className="text-sm font-medium mb-3 block">Select Target Systems for Research</Label>
                <div className="grid grid-cols-1 gap-2">
                  {targetSystems.map((system) => (
                    <Badge
                      key={system.id}
                      className={`cursor-pointer transition-all p-3 text-center ${
                        selectedSystems.includes(system.id)
                          ? system.color + ' border-2 border-current'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      onClick={() => handleSystemToggle(system.id)}
                    >
                      {system.name}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  GPT o3-pro will research job boards, 10-K filings, and recent news for high-intent accounts
                </p>
              </div>

              {/* Auto Mode */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <Label className="text-sm font-medium">Auto Discovery</Label>
                  <p className="text-xs text-gray-500">Daily automated research</p>
                </div>
                <Switch
                  checked={isAutoMode}
                  onCheckedChange={setIsAutoMode}
                />
              </div>

              {/* Discover Button */}
              <Button
                className="w-full bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-600 hover:to-indigo-700"
                onClick={handleDiscover}
                disabled={selectedSystems.length === 0 || discoverMutation.isPending}
              >
                {discoverMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Search className="h-4 w-4 mr-2" />
                )}
                Start Deep Research
              </Button>
              
              {selectedSystems.length === 0 && (
                <p className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
                  Select at least one target system to begin research
                </p>
              )}

              {/* Status */}
              {discoverMutation.isPending && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-700 font-medium">
                    🔍 GPT o3-pro researching high-intent accounts...
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Analyzing job boards, 10-K filings, recent news for {selectedSystems.join(', ')} implementations
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Accounts Panel */}
        <div className="lg:col-span-1">
          <Card className="avo-card h-full">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Building className="h-5 w-5 mr-2 text-green-600" />
                  High-Intent Accounts
                </div>
                <Badge className="bg-green-100 text-green-800">
                  {currentResearchResults.length} Found
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {discoverMutation.isPending ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-4" />
                  <p className="text-sm font-medium text-gray-700">Deep research in progress...</p>
                  <p className="text-xs text-gray-500 mt-1">Using {process.env.INTENT_MODEL || 'o1-pro'} for advanced reasoning</p>
                </div>
              ) : currentResearchResults.length > 0 ? (
                <div className="space-y-3">
                  {currentResearchResults.map((account: Account) => (
                    <motion.div
                      key={account.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">{account.companyName}</h4>
                        <Badge className={account.isHighIntent ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-600"}>
                          {account.intentScore}% Intent
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{account.industry}</p>
                      
                      {/* Target Systems */}
                      <div className="flex flex-wrap gap-1 mb-3">
                        {account.targetSystems?.map((system) => (
                          <Badge key={system} className="text-xs bg-blue-50 text-blue-700">
                            {system}
                          </Badge>
                        ))}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedAccount(account)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View SCIPAB
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleIdentifyContacts(account)}
                          disabled={identifyContactsMutation.isPending || !account.domain}
                        >
                          <UserPlus className="h-3 w-3 mr-1" />
                          {!account.domain ? 'No Domain' : 'Find Contacts (PDL)'}
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : discoverMutation.error ? (
                <div className="text-center py-8 text-red-600">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-300" />
                  <p className="font-medium">Research Failed</p>
                  <p className="text-sm">{discoverMutation.error.message}</p>
                  <p className="text-xs text-gray-500 mt-2">Check API keys and try again</p>
                </div>
              ) : accountsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : Array.isArray(accounts) && accounts.length > 0 ? (
                <div className="space-y-3">
                  <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded mb-3">
                    ⚠️ Showing historical results - Run fresh research for current data
                  </div>
                  {accounts.map((account: Account) => (
                    <motion.div
                      key={account.id}
                      initial={{ opacity: 0.6 }}
                      animate={{ opacity: 0.8 }}
                      className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-700">{account.companyName}</h4>
                        <Badge className="bg-gray-100 text-gray-600">
                          Historical
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500">Run new research to see fresh results</p>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No research completed yet</p>
                  <p className="text-sm">Select target systems and start research</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Contacts Panel */}
        <div className="lg:col-span-1">
          <Card className="avo-card h-full">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-purple-600" />
                  Manager+ Contacts
                </div>
                {Array.isArray(contacts) && contacts.length > 0 && (
                  <Badge className="bg-purple-100 text-purple-800">
                    {contacts.length}/20 Max
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedAccount ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Select an account to view contacts</p>
                </div>
              ) : contactsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  <span className="ml-2 text-gray-600">Identifying contacts...</span>
                </div>
              ) : Array.isArray(contacts) && contacts.length > 0 ? (
                <div className="space-y-3">
                  {contacts.map((contact: Contact) => (
                    <motion.div
                      key={contact.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-white rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-gray-900">
                          {contact.firstName} {contact.lastName}
                        </h5>
                        <Badge className="text-xs bg-green-50 text-green-700">
                          {contact.seniority}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{contact.title}</p>
                      <p className="text-xs text-gray-500 mb-2">{contact.department}</p>
                      
                      {/* Focus Areas */}
                      <div className="flex flex-wrap gap-1">
                        {contact.focusAreas?.map((area) => (
                          <Badge key={area} className="text-xs bg-purple-50 text-purple-700">
                            {area}
                          </Badge>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No contacts found</p>
                  <p className="text-sm">Try identifying contacts for this account</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* SCIPAB Modal/Panel - Coming next */}
      {selectedAccount && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Account SCIPAB - {selectedAccount.companyName}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {selectedAccount.scipab ? (
                  <>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Situation</h4>
                      <p className="text-gray-700">{selectedAccount.scipab.situation || "Not available"}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Complication</h4>
                      <p className="text-gray-700">{selectedAccount.scipab.complication || "Not available"}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Implication</h4>
                      <p className="text-gray-700">{selectedAccount.scipab.implication || "Not available"}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Position</h4>
                      <p className="text-gray-700">{selectedAccount.scipab.position || "Not available"}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Ask</h4>
                      <p className="text-gray-700">{selectedAccount.scipab.ask || "Not available"}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Benefit</h4>
                      <p className="text-gray-700">{selectedAccount.scipab.benefit || "Not available"}</p>
                    </div>
                  </>
                ) : (
                  <p className="text-gray-500">SCIPAB not yet generated for this account.</p>
                )}
                <Button onClick={() => setSelectedAccount(null)} className="w-full">
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}