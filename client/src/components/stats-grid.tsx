import { Card, CardContent } from "@/components/ui/card";
import { Users, Mail, MessageSquare, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function StatsGrid() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/stats"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                <div className="ml-4">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statItems = [
    {
      label: "Total Prospects",
      value: stats?.totalProspects || 0,
      icon: Users,
      iconBg: "bg-blue-100",
      iconColor: "text-primary",
    },
    {
      label: "Emails Generated",
      value: stats?.emailsGenerated || 0,
      icon: Mail,
      iconBg: "bg-green-100",
      iconColor: "text-accent",
    },
    {
      label: "LinkedIn Messages",
      value: stats?.linkedinMessages || 0,
      icon: MessageSquare,
      iconBg: "bg-blue-100",
      iconColor: "text-primary",
    },
    {
      label: "Success Rate",
      value: `${stats?.successRate || 0}%`,
      icon: TrendingUp,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statItems.map((item) => (
        <Card key={item.label} className="border-gray-100">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className={`flex-shrink-0 w-10 h-10 ${item.iconBg} rounded-lg flex items-center justify-center`}>
                <item.icon className={`w-5 h-5 ${item.iconColor}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{item.label}</p>
                <p className="text-2xl font-bold text-gray-900">{item.value}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
