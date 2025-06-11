import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, TrendingUp, Users, Target } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function ToneAnalytics() {
  const { data: generatedContent = [] } = useQuery({
    queryKey: ["/api/generated-content"],
  });

  // Calculate tone usage statistics
  const toneStats = (generatedContent as any[]).reduce((acc, content) => {
    const tone = content.tone || 'unknown';
    acc[tone] = (acc[tone] || 0) + 1;
    return acc;
  }, {});

  const totalContent = generatedContent.length;
  const sortedTones = Object.entries(toneStats)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 5);

  const getToneColor = (tone: string) => {
    const colors: Record<string, string> = {
      professional: "bg-blue-100 text-blue-800",
      friendly: "bg-green-100 text-green-800",
      consultative: "bg-purple-100 text-purple-800",
      confident: "bg-orange-100 text-orange-800",
      empathetic: "bg-pink-100 text-pink-800",
      "data-driven": "bg-indigo-100 text-indigo-800",
      storytelling: "bg-yellow-100 text-yellow-800",
      direct: "bg-red-100 text-red-800",
      urgent: "bg-red-100 text-red-800",
      casual: "bg-gray-100 text-gray-800"
    };
    return colors[tone] || "bg-gray-100 text-gray-800";
  };

  if (totalContent === 0) {
    return null;
  }

  return (
    <Card className="border-gray-100">
      <CardHeader>
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <BarChart className="w-5 h-5 mr-2 text-blue-600" />
          Tone Performance Analytics
        </h3>
        <p className="text-sm text-gray-600">
          Based on {totalContent} generated message{totalContent !== 1 ? 's' : ''}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <Users className="w-6 h-6 mx-auto text-blue-600 mb-1" />
            <div className="text-lg font-semibold text-gray-900">{totalContent}</div>
            <div className="text-xs text-gray-600">Total Generated</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <Target className="w-6 h-6 mx-auto text-green-600 mb-1" />
            <div className="text-lg font-semibold text-gray-900">{Object.keys(toneStats).length}</div>
            <div className="text-xs text-gray-600">Tones Used</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <TrendingUp className="w-6 h-6 mx-auto text-purple-600 mb-1" />
            <div className="text-lg font-semibold text-gray-900">
              {sortedTones[0] ? sortedTones[0][0] : 'N/A'}
            </div>
            <div className="text-xs text-gray-600">Most Popular</div>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium text-gray-900 text-sm">Tone Usage Breakdown</h4>
          {sortedTones.map(([tone, count]) => {
            const percentage = Math.round((count as number / totalContent) * 100);
            return (
              <div key={tone} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge className={`text-xs ${getToneColor(tone)}`}>
                    {tone.charAt(0).toUpperCase() + tone.slice(1)}
                  </Badge>
                  <span className="text-sm text-gray-600">{count} messages</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500 w-8">{percentage}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}