import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Building, Users, ChevronDown, ChevronRight, Mail, Phone } from "lucide-react";
import { getQueryFn } from "@/lib/queryClient";
import CompanyDetailModal from "./company-detail-modal";

interface Prospect {
  id: number;
  name: string;
  email: string;
  company: string;
  position: string;
  status: string;
  additionalInfo?: string;
}

interface GroupedAccount {
  company: string;
  prospects: Prospect[];
  totalContacts: number;
  managerPlusCount: number;
  targetRoles: string[];
}

interface AccountGroupedProspectsProps {
  selectedProspects: number[];
  onSelectedProspectsChange: (ids: number[]) => void;
}

export default function AccountGroupedProspects({ 
  selectedProspects, 
  onSelectedProspectsChange 
}: AccountGroupedProspectsProps) {
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set());
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [companyProspects, setCompanyProspects] = useState<any[]>([]);

  const { data: prospects = [], isLoading } = useQuery({
    queryKey: ["/api/prospects"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  // Group prospects by company and analyze roles
  const groupedAccounts: GroupedAccount[] = prospects.reduce((acc: GroupedAccount[], prospect: Prospect) => {
    const existingAccount = acc.find(group => group.company === prospect.company);
    
    if (existingAccount) {
      existingAccount.prospects.push(prospect);
      existingAccount.totalContacts += 1;
      
      // Check if manager+ level
      const position = prospect.position.toLowerCase();
      if (position.includes('manager') || position.includes('director') || 
          position.includes('vp') || position.includes('head') || 
          position.includes('lead') || position.includes('cxo')) {
        existingAccount.managerPlusCount += 1;
      }
      
      // Track target roles (exclude generic "Other")
      const role = categorizeRole(prospect.position);
      if (role !== 'Other' && !existingAccount.targetRoles.includes(role)) {
        existingAccount.targetRoles.push(role);
      }
    } else {
      const position = prospect.position.toLowerCase();
      const isManagerPlus = position.includes('manager') || position.includes('director') || 
                           position.includes('vp') || position.includes('head') || 
                           position.includes('lead') || position.includes('cxo');
      
      const role = categorizeRole(prospect.position);
      const targetRoles = role !== 'Other' ? [role] : [];
      
      acc.push({
        company: prospect.company,
        prospects: [prospect],
        totalContacts: 1,
        managerPlusCount: isManagerPlus ? 1 : 0,
        targetRoles: targetRoles
      });
    }
    
    return acc;
  }, []);

  // Sort by manager+ count descending
  groupedAccounts.sort((a, b) => b.managerPlusCount - a.managerPlusCount);

  function categorizeRole(position: string): string {
    const pos = position.toLowerCase();
    if (pos.includes('qa') || pos.includes('quality') || pos.includes('test')) return 'QA';
    if (pos.includes('d365') || pos.includes('dynamics')) return 'D365';
    if (pos.includes('sap')) return 'SAP';
    if (pos.includes('oracle')) return 'Oracle';
    if (pos.includes('erp')) return 'ERP';
    if (pos.includes('crm')) return 'CRM';
    if (pos.includes('workday') || pos.includes('hcm')) return 'HCM';
    if (pos.includes('salesforce')) return 'Salesforce';
    if (pos.includes('business analyst') || pos.includes('business systems')) return 'Business Systems';
    if (pos.includes('devops') || pos.includes('automation')) return 'DevOps';
    // Skip vague "Systems" category - only show specific roles
    return 'Other';
  }

  const toggleAccount = (company: string) => {
    const newExpanded = new Set(expandedAccounts);
    if (newExpanded.has(company)) {
      newExpanded.delete(company);
    } else {
      newExpanded.add(company);
    }
    setExpandedAccounts(newExpanded);
  };

  const toggleAccountSelection = (company: string, checked: boolean) => {
    const accountProspects = groupedAccounts.find(acc => acc.company === company)?.prospects || [];
    const prospectIds = accountProspects.map(p => p.id);
    
    if (checked) {
      const newSelected = [...new Set([...selectedProspects, ...prospectIds])];
      onSelectedProspectsChange(newSelected);
    } else {
      const newSelected = selectedProspects.filter(id => !prospectIds.includes(id));
      onSelectedProspectsChange(newSelected);
    }
  };

  const toggleProspectSelection = (prospectId: number, checked: boolean) => {
    if (checked) {
      onSelectedProspectsChange([...selectedProspects, prospectId]);
    } else {
      onSelectedProspectsChange(selectedProspects.filter(id => id !== prospectId));
    }
  };

  const openCompanyDetail = (company: string, prospects: any[]) => {
    setSelectedCompany(company);
    setCompanyProspects(prospects);
  };

  const closeCompanyDetail = () => {
    setSelectedCompany(null);
    setCompanyProspects([]);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading prospects...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Prospects by Account</h3>
          <p className="text-sm text-muted-foreground">
            {groupedAccounts.length} companies • {prospects.length} total contacts • {selectedProspects.length} selected
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setExpandedAccounts(new Set(groupedAccounts.map(acc => acc.company)))}
          >
            Expand All
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setExpandedAccounts(new Set())}
          >
            Collapse All
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {groupedAccounts.map((account) => {
          const isExpanded = expandedAccounts.has(account.company);
          const accountProspectIds = account.prospects.map(p => p.id);
          const isAccountSelected = accountProspectIds.every(id => selectedProspects.includes(id));
          const isPartiallySelected = accountProspectIds.some(id => selectedProspects.includes(id)) && !isAccountSelected;

          return (
            <Card key={account.company} className="border-l-4 border-l-blue-500">
              <Collapsible>
                <CollapsibleTrigger 
                  className="w-full"
                  onClick={() => toggleAccount(account.company)}
                >
                  <CardHeader className="hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        <Building className="h-5 w-5 text-blue-600" />
                        <div className="text-left">
                          <CardTitle 
                            className="text-lg cursor-pointer hover:text-blue-600 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              openCompanyDetail(account.company, account.prospects);
                            }}
                          >
                            {account.company}
                          </CardTitle>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {account.totalContacts} contacts
                            </span>
                            <span className="text-green-600 font-medium">
                              {account.managerPlusCount} Manager+
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1">
                          {account.targetRoles.map(role => (
                            <Badge key={role} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                              {role}
                            </Badge>
                          ))}
                        </div>
                        <Checkbox
                          checked={isAccountSelected}
                          ref={(el) => {
                            if (el) el.indeterminate = isPartiallySelected;
                          }}
                          onCheckedChange={(checked) => toggleAccountSelection(account.company, checked as boolean)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <div className="grid gap-2 pl-6">
                      {account.prospects.map((prospect) => {
                        const isSelected = selectedProspects.includes(prospect.id);
                        const isManagerPlus = prospect.position.toLowerCase().includes('manager') || 
                                             prospect.position.toLowerCase().includes('director') || 
                                             prospect.position.toLowerCase().includes('vp') ||
                                             prospect.position.toLowerCase().includes('head') ||
                                             prospect.position.toLowerCase().includes('lead');

                        return (
                          <div 
                            key={prospect.id}
                            className={`p-3 rounded-lg border transition-colors ${
                              isSelected ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={(checked) => toggleProspectSelection(prospect.id, checked as boolean)}
                                />
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{prospect.name}</span>
                                    {isManagerPlus && (
                                      <Badge className="bg-green-100 text-green-800 border-green-300">
                                        Manager+
                                      </Badge>
                                    )}
                                    <Badge variant="outline">
                                      {categorizeRole(prospect.position)}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground">{prospect.position}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Mail className="h-3 w-3" />
                                <span className="hidden sm:inline">{prospect.email}</span>
                                <Badge variant={prospect.status === 'active' ? 'default' : 'secondary'}>
                                  {prospect.status}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}
      </div>
      
      {/* Company Detail Modal */}
      {selectedCompany && (
        <CompanyDetailModal
          company={selectedCompany}
          prospects={companyProspects}
          isOpen={!!selectedCompany}
          onClose={closeCompanyDetail}
        />
      )}
    </div>
  );
}