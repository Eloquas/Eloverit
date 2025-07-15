import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Zap, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  X,
  Minimize2,
  Maximize2,
  Activity
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Background Processor Component - PLACEHOLDER
// Ready for implementation - seamless background processing

interface BackgroundTask {
  id: string;
  name: string;
  type: 'research' | 'content_generation' | 'intent_monitoring' | 'sync';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  message: string;
  startTime: Date;
  estimatedTime?: number;
}

export function BackgroundProcessor() {
  const [tasks, setTasks] = useState<BackgroundTask[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Mock background tasks - would come from workflow orchestrator
  useEffect(() => {
    const mockTasks: BackgroundTask[] = [
      {
        id: '1',
        name: 'Account Research - TechCorp',
        type: 'research',
        status: 'processing',
        progress: 67,
        message: 'Analyzing intent signals and company data...',
        startTime: new Date(Date.now() - 120000),
        estimatedTime: 180
      },
      {
        id: '2',
        name: 'Email Sequence Generation',
        type: 'content_generation',
        status: 'pending',
        progress: 0,
        message: 'Waiting for research completion...',
        startTime: new Date(),
        estimatedTime: 60
      },
      {
        id: '3',
        name: 'Intent Monitoring - DataFlow',
        type: 'intent_monitoring',
        status: 'completed',
        progress: 100,
        message: 'Intent signals analyzed successfully',
        startTime: new Date(Date.now() - 300000)
      }
    ];

    setTasks(mockTasks);
    setIsVisible(mockTasks.length > 0);

    // Simulate task progress
    const interval = setInterval(() => {
      setTasks(prev => prev.map(task => {
        if (task.status === 'processing' && task.progress < 100) {
          const newProgress = Math.min(task.progress + Math.random() * 10, 100);
          return {
            ...task,
            progress: newProgress,
            status: newProgress >= 100 ? 'completed' : 'processing',
            message: newProgress >= 100 ? 'Processing completed' : task.message
          };
        }
        return task;
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const activeTasks = tasks.filter(t => t.status === 'processing' || t.status === 'pending');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  if (!isVisible || tasks.length === 0) return null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing': return <Activity className="w-4 h-4 text-blue-600 animate-spin" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'pending': return <Clock className="w-4 h-4 text-gray-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      case 'pending': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="fixed bottom-4 right-4 z-50 w-80"
      >
        <Card className="shadow-lg border-2 border-blue-200">
          <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-white" />
                <h3 className="font-semibold text-white">Background Processing</h3>
              </div>
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="text-white hover:bg-white/20 h-8 w-8 p-0"
                >
                  {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsVisible(false)}
                  className="text-white hover:bg-white/20 h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {!isMinimized && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: "auto" }}
                exit={{ height: 0 }}
                className="overflow-hidden"
              >
                <CardContent className="p-4 space-y-4">
                  {activeTasks.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900">Active Tasks</h4>
                      {activeTasks.map((task) => (
                        <div key={task.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(task.status)}
                              <span className="text-sm font-medium">{task.name}</span>
                            </div>
                            <Badge className={getStatusColor(task.status)}>
                              {task.status}
                            </Badge>
                          </div>
                          <div className="space-y-1">
                            <Progress value={task.progress} className="h-2" />
                            <p className="text-xs text-gray-600">{task.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {completedTasks.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900">Recently Completed</h4>
                      {completedTasks.slice(-2).map((task) => (
                        <div key={task.id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(task.status)}
                            <span className="text-sm">{task.name}</span>
                          </div>
                          <Badge className={getStatusColor(task.status)}>
                            {task.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{activeTasks.length} active, {completedTasks.length} completed</span>
                      <Button variant="ghost" size="sm" className="h-6 text-xs">
                        View All
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}