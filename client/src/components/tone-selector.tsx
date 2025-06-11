import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Brain, Zap, Users, Target, Heart, Lightbulb, BarChart, MessageCircle, Clock, Award } from "lucide-react";
import { useState } from "react";

interface ToneOption {
  value: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  useCase: string;
  example: string;
  recommendedFor: string[];
  color: string;
}

const toneOptions: ToneOption[] = [
  {
    value: "professional",
    label: "Professional",
    description: "Formal, respectful, and business-focused communication",
    icon: Award,
    useCase: "Enterprise sales, C-level executives, formal business relationships",
    example: "I hope this message finds you well. I would like to discuss...",
    recommendedFor: ["CEO", "Director", "VP", "Manager"],
    color: "bg-blue-50 border-blue-200 text-blue-800"
  },
  {
    value: "friendly",
    label: "Friendly",
    description: "Warm, approachable, and relationship-building tone",
    icon: Heart,
    useCase: "Building rapport, mid-level contacts, relationship nurturing",
    example: "Hi there! I came across your work and was really impressed...",
    recommendedFor: ["Manager", "Specialist", "Coordinator"],
    color: "bg-green-50 border-green-200 text-green-800"
  },
  {
    value: "consultative",
    label: "Consultative",
    description: "Advisory approach focusing on problem-solving and expertise",
    icon: Brain,
    useCase: "Complex sales cycles, technical buyers, solution selling",
    example: "Based on industry trends, I've identified a potential opportunity...",
    recommendedFor: ["Technical Lead", "Architect", "Engineer"],
    color: "bg-purple-50 border-purple-200 text-purple-800"
  },
  {
    value: "confident",
    label: "Confident",
    description: "Assertive and value-focused without being aggressive",
    icon: Target,
    useCase: "Competitive situations, decision makers, ROI-focused prospects",
    example: "Our solution has helped companies like yours achieve 30% growth...",
    recommendedFor: ["CEO", "Founder", "President"],
    color: "bg-orange-50 border-orange-200 text-orange-800"
  },
  {
    value: "empathetic",
    label: "Empathetic",
    description: "Understanding and addressing pain points with compassion",
    icon: Users,
    useCase: "Change management, stressed teams, transformation projects",
    example: "I understand the challenges you're facing with...",
    recommendedFor: ["HR", "Operations", "Customer Success"],
    color: "bg-pink-50 border-pink-200 text-pink-800"
  },
  {
    value: "data-driven",
    label: "Data-Driven",
    description: "Fact-based approach with metrics, statistics, and proof points",
    icon: BarChart,
    useCase: "Analytics teams, finance, performance-focused roles",
    example: "Recent data shows that 73% of companies in your sector...",
    recommendedFor: ["Analyst", "Finance", "Data Scientist"],
    color: "bg-indigo-50 border-indigo-200 text-indigo-800"
  },
  {
    value: "storytelling",
    label: "Storytelling",
    description: "Narrative-driven approach with case studies and examples",
    icon: Lightbulb,
    useCase: "Creative industries, marketing teams, vision-driven leaders",
    example: "Let me share how a company similar to yours transformed...",
    recommendedFor: ["Marketing", "Creative", "Product"],
    color: "bg-yellow-50 border-yellow-200 text-yellow-800"
  },
  {
    value: "direct",
    label: "Direct",
    description: "Straight to the point, time-efficient communication",
    icon: Zap,
    useCase: "Busy executives, operational roles, quick decisions",
    example: "I have a 5-minute solution that could save your team 20 hours weekly.",
    recommendedFor: ["Operations", "Logistics", "Admin"],
    color: "bg-red-50 border-red-200 text-red-800"
  },
  {
    value: "urgent",
    label: "Urgent",
    description: "Time-sensitive communication for immediate action",
    icon: Clock,
    useCase: "Limited-time offers, critical deadlines, competitive situations",
    example: "This opportunity expires Friday, and I wanted to ensure...",
    recommendedFor: ["Sales", "Procurement", "Project Manager"],
    color: "bg-red-50 border-red-200 text-red-800"
  },
  {
    value: "casual",
    label: "Casual",
    description: "Relaxed and conversational, like talking to a colleague",
    icon: MessageCircle,
    useCase: "Startups, tech companies, informal business cultures",
    example: "Hey! I saw your recent post about scaling challenges...",
    recommendedFor: ["Developer", "Designer", "Startup"],
    color: "bg-gray-50 border-gray-200 text-gray-800"
  }
];

interface ToneSelectorProps {
  selectedTone: string;
  onToneChange: (tone: string) => void;
  prospectPositions?: string[];
}

export default function ToneSelector({ selectedTone, onToneChange, prospectPositions = [] }: ToneSelectorProps) {
  const [showAll, setShowAll] = useState(false);

  // AI-powered recommendation based on prospect positions
  const getRecommendedTones = () => {
    if (prospectPositions.length === 0) return [];
    
    const positionKeywords = prospectPositions.join(" ").toLowerCase();
    const recommendations: { tone: ToneOption; score: number }[] = [];
    
    toneOptions.forEach(tone => {
      let score = 0;
      tone.recommendedFor.forEach(role => {
        if (positionKeywords.includes(role.toLowerCase())) {
          score += 3;
        }
      });
      
      // Additional scoring based on common patterns
      if (positionKeywords.includes("ceo") || positionKeywords.includes("director")) score += 2;
      if (positionKeywords.includes("manager")) score += 1;
      if (positionKeywords.includes("technical") || positionKeywords.includes("engineer")) score += 1;
      
      if (score > 0) {
        recommendations.push({ tone, score });
      }
    });
    
    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(r => r.tone.value);
  };

  const recommendedTones = getRecommendedTones();
  const displayTones = showAll ? toneOptions : toneOptions.slice(0, 6);

  return (
    <Card className="border-gray-100">
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Brain className="w-5 h-5 mr-2 text-purple-600" />
            AI-Powered Tone & Style
          </h3>
          {recommendedTones.length > 0 && (
            <Badge variant="secondary" className="bg-purple-100 text-purple-800">
              {recommendedTones.length} AI Recommendations
            </Badge>
          )}
        </div>
        {recommendedTones.length > 0 && (
          <p className="text-sm text-gray-600">
            Based on your selected prospects' positions, we recommend these tones
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {displayTones.map((tone) => {
            const isSelected = selectedTone === tone.value;
            const isRecommended = recommendedTones.includes(tone.value);
            const Icon = tone.icon;
            
            return (
              <div
                key={tone.value}
                className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                  isSelected 
                    ? "border-purple-300 bg-purple-50" 
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
                onClick={() => onToneChange(tone.value)}
              >
                {isRecommended && (
                  <div className="absolute -top-2 -right-2">
                    <Badge className="bg-purple-600 text-white text-xs">
                      AI Pick
                    </Badge>
                  </div>
                )}
                
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg ${tone.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 text-sm">
                      {tone.label}
                    </h4>
                    <p className="text-xs text-gray-600 mt-1">
                      {tone.description}
                    </p>
                    {isSelected && (
                      <div className="mt-2 space-y-2">
                        <div className="bg-gray-50 rounded p-2">
                          <p className="text-xs font-medium text-gray-700">Use Case:</p>
                          <p className="text-xs text-gray-600">{tone.useCase}</p>
                        </div>
                        <div className="bg-blue-50 rounded p-2">
                          <p className="text-xs font-medium text-blue-700">Example:</p>
                          <p className="text-xs text-blue-600 italic">"{tone.example}"</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {!showAll && toneOptions.length > 6 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAll(true)}
            className="w-full"
          >
            Show All {toneOptions.length} Tone Options
          </Button>
        )}
        
        {showAll && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAll(false)}
            className="w-full"
          >
            Show Less
          </Button>
        )}
      </CardContent>
    </Card>
  );
}