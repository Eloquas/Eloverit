import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Filter, Edit, Sparkles, Trash2 } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Prospect } from "@shared/schema";

interface ProspectTableProps {
  selectedProspects: number[];
  onSelectedProspectsChange: (ids: number[]) => void;
}

export default function ProspectTable({ selectedProspects, onSelectedProspectsChange }: ProspectTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const { data: prospects = [], isLoading } = useQuery({
    queryKey: ["/api/prospects", searchQuery],
    queryFn: async () => {
      const url = searchQuery 
        ? `/api/prospects?search=${encodeURIComponent(searchQuery)}`
        : "/api/prospects";
      const response = await fetch(url);
      return response.json();
    }
  });

  const deleteProspectMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/prospects/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prospects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Success",
        description: "Prospect deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete prospect",
        variant: "destructive",
      });
    }
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectedProspectsChange(prospects.map((p: Prospect) => p.id));
    } else {
      onSelectedProspectsChange([]);
    }
  };

  const handleSelectProspect = (prospectId: number, checked: boolean) => {
    if (checked) {
      onSelectedProspectsChange([...selectedProspects, prospectId]);
    } else {
      onSelectedProspectsChange(selectedProspects.filter(id => id !== prospectId));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "inactive": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (isLoading) {
    return (
      <Card className="border-gray-100">
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-gray-100">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Recent Prospects</h3>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Input
                placeholder="Search prospects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-64"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
            </div>
            <Button variant="ghost" size="sm">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <Checkbox
                    checked={prospects.length > 0 && selectedProspects.length === prospects.length}
                    onCheckedChange={handleSelectAll}
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {prospects.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No prospects found. Upload a CSV file to get started.
                  </td>
                </tr>
              ) : (
                prospects.map((prospect: Prospect) => (
                  <tr key={prospect.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Checkbox
                        checked={selectedProspects.includes(prospect.id)}
                        onCheckedChange={(checked) => handleSelectProspect(prospect.id, checked as boolean)}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="text-xs font-medium">
                            {getInitials(prospect.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{prospect.name}</div>
                          <div className="text-sm text-gray-500">{prospect.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{prospect.company}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{prospect.position}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={`${getStatusColor(prospect.status)} capitalize`}>
                        {prospect.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm" className="text-primary hover:text-primary-dark">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-accent hover:text-green-700">
                          <Sparkles className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-error hover:text-red-700"
                          onClick={() => deleteProspectMutation.mutate(prospect.id)}
                          disabled={deleteProspectMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {prospects.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing <span className="font-medium">1-{Math.min(prospects.length, 50)}</span> of <span className="font-medium">{prospects.length}</span> prospects
              </div>
              <div className="text-sm text-gray-500">
                {selectedProspects.length > 0 && (
                  <span className="font-medium text-primary">
                    {selectedProspects.length} selected
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
