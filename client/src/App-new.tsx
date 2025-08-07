import { Route, Switch, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { 
  Upload, 
  Target, 
  Users, 
  MessageSquare, 
  Heart, 
  Mic, 
  BarChart3, 
  Presentation,
  ArrowRight
} from "lucide-react";

// Module selection component
function ModuleSelector() {
  const modules = [
    {
      id: "upload",
      title: "Account Upload & Parsing",
      description: "CSV/manual entry with PDL autofill",
      icon: Upload,
      status: "ready",
      isPainkiller: true
    },
    {
      id: "intent",
      title: "Intent Discovery Agent", 
      description: "Scan 10-Ks, job boards, tech usage databases",
      icon: Target,
      status: "ready",
      isPainkiller: true
    },
    {
      id: "contacts",
      title: "Contact Identification",
      description: "PDL API integration with role categorization", 
      icon: Users,
      status: "ready",
      isPainkiller: true
    },
    {
      id: "messaging",
      title: "Messaging Generator",
      description: "SCIPAB frameworks, email sequences, LinkedIn DMs",
      icon: MessageSquare,
      status: "ready",
      isPainkiller: true
    },
    {
      id: "trust",
      title: "Trust/Story Builder",
      description: "GPT model selection with hallucination prevention",
      icon: Heart,
      status: "ready",
      isPainkiller: false
    },
    {
      id: "calls",
      title: "Call Reflection Engine",
      description: "Transcript processing for action items",
      icon: Mic,
      status: "ready",
      isPainkiller: false
    },
    {
      id: "dashboard",
      title: "Rep Dashboard",
      description: "Account tracking and meeting outcomes",
      icon: BarChart3,
      status: "ready",
      isPainkiller: true
    },
    {
      id: "slides",
      title: "Slide Deck Builder",
      description: "Template-based presentation generation",
      icon: Presentation,
      status: "ready",
      isPainkiller: false
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <Target className="h-6 w-6 text-white" />
              </div>
              <div className="ml-3">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-indigo-600 bg-clip-text text-transparent">
                  Eloverit.ai
                </h1>
                <p className="text-sm text-gray-600">Precision Sales Intent Engine</p>
              </div>
            </div>
            <Badge className="bg-amber-100 text-amber-800 border-amber-200">
              Platform Restart - Ready to Build
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Choose Your First Painkiller Module
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Complete platform restart focusing on essential features. 
              Select which core module to implement first for maximum impact.
            </p>
          </motion.div>
        </div>

        {/* Module Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {modules.map((module, index) => (
            <motion.div
              key={module.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card className={`h-full avo-card cursor-pointer transition-all duration-200 hover:scale-105 ${
                module.isPainkiller ? 'ring-2 ring-cyan-200 bg-gradient-to-br from-cyan-50 to-blue-50' : ''
              }`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      module.isPainkiller 
                        ? 'bg-gradient-to-br from-cyan-500 to-indigo-600' 
                        : 'bg-gradient-to-br from-gray-400 to-gray-600'
                    }`}>
                      <module.icon className="h-5 w-5 text-white" />
                    </div>
                    {module.isPainkiller && (
                      <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">
                        Painkiller
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    {module.title}
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    {module.description}
                  </p>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button 
                    variant={module.isPainkiller ? "default" : "outline"}
                    className="w-full group"
                    onClick={() => {
                      console.log(`Selected module: ${module.title}`);
                      alert(`Ready to build: ${module.title}`);
                    }}
                  >
                    Build First
                    <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Key Principles */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-16"
        >
          <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
            <CardHeader>
              <CardTitle className="text-center text-2xl text-gray-900">
                Platform Principles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Target className="h-6 w-6 text-red-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Painkillers First</h3>
                  <p className="text-sm text-gray-600">
                    Focus on essential features that solve immediate problems
                  </p>
                </div>
                <div>
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">No Fake Data</h3>
                  <p className="text-sm text-gray-600">
                    Display "Not available" instead of hallucinated information
                  </p>
                </div>
                <div>
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Heart className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Simple Access</h3>
                  <p className="text-sm text-gray-600">
                    No complex authentication - focus on core functionality
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Switch>
      <Route path="/" component={ModuleSelector} />
      <Route component={() => (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Page Not Found</h1>
            <Link href="/">
              <Button>Return Home</Button>
            </Link>
          </div>
        </div>
      )} />
    </Switch>
  );
}