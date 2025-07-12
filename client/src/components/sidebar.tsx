import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Home, 
  Users, 
  FileText, 
  Mail, 
  Building2, 
  Settings, 
  ChevronLeft,
  ChevronRight,
  Target,
  BarChart3,
  Zap,
  Sparkles,
  Send,
  Trophy
} from "lucide-react";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const [location] = useLocation();

  const navigationItems = [
    {
      label: "Dashboard",
      href: "/",
      icon: Home,
      active: location === "/",
      badge: null
    },
    {
      label: "Prospects",
      href: "/prospects",
      icon: Users,
      active: location === "/prospects",
      badge: "77"
    },
    {
      label: "Account Research",
      href: "/account-research",
      icon: Building2,
      active: location === "/account-research",
      badge: null
    },
    {
      label: "Email Cadences",
      href: "/email-cadences",
      icon: Mail,
      active: location === "/email-cadences",
      badge: "18"
    },
    {
      label: "Generated Content",
      href: "/generated-content",
      icon: FileText,
      active: location === "/generated-content",
      badge: null
    },
    {
      label: "Eloquas AI",
      href: "/eloquas-ai",
      icon: Sparkles,
      active: location === "/eloquas-ai",
      badge: "NEW"
    },
    {
      label: "LinkedIn Posts",
      href: "/linkedin-posts",
      icon: Send,
      active: location === "/linkedin-posts",
      badge: "AI"
    },
    {
      label: "Outreach MVP",
      href: "/outreach-mvp",
      icon: Mail,
      active: location === "/outreach-mvp",
      badge: "NEW"
    },
    {
      label: "Call Assessment",
      href: "/call-assessment",
      icon: FileText,
      active: location === "/call-assessment",
      badge: "AI"
    },
    {
      label: "Achievements",
      href: "/achievements",
      icon: Trophy,
      active: location === "/achievements",
      badge: "🏆"
    },
    {
      label: "Analytics",
      href: "/analytics",
      icon: BarChart3,
      active: location === "/analytics",
      badge: null
    }
  ];

  const quickActions = [
    {
      label: "SCIPAB Generator",
      href: "/scipab",
      icon: Target,
      color: "bg-primary"
    },
    {
      label: "Bulk Upload",
      href: "/upload",
      icon: Zap,
      color: "bg-accent"
    }
  ];

  return (
    <div className={`fixed left-0 top-0 h-full avo-glass border-r border-gray-100 transition-all duration-300 z-40 avo-shadow-soft ${
      collapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Header */}
      <div className="h-16 border-b border-gray-50 flex items-center justify-between px-4">
        {!collapsed && (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 avo-gradient-blue rounded-xl flex items-center justify-center avo-shadow-soft">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <span className="text-lg font-bold avo-text-gradient">ProspectCopy</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="p-2 hover:bg-avo-blue-50 rounded-lg transition-all duration-200"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <div className="flex flex-col h-full pt-6">
        <nav className="flex-1 px-3 space-y-2">
          {navigationItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <div className={`avo-sidebar-item ${item.active ? "active" : ""}`}>
                <Button
                  variant="ghost"
                  className={`w-full justify-start h-11 rounded-xl transition-all duration-200 ${
                    item.active 
                      ? "bg-primary text-white hover:bg-primary-dark avo-shadow-soft" 
                      : "text-gray-600 hover:text-primary hover:bg-avo-blue-50 avo-hover-scale"
                  } ${collapsed ? "px-2" : "px-4"}`}
                >
                  <item.icon className={`h-5 w-5 ${collapsed ? "" : "mr-3"}`} />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left font-medium">{item.label}</span>
                      {item.badge && (
                        <Badge className="ml-2 text-xs avo-badge-blue">
                          {item.badge}
                        </Badge>
                      )}
                    </>
                  )}
                </Button>
              </div>
            </Link>
          ))}
        </nav>

        {/* Quick Actions */}
        {!collapsed && (
          <div className="px-3 pb-4">
            <div className="mb-3">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3">
                Quick Actions
              </h3>
            </div>
            <div className="space-y-2">
              {quickActions.map((action) => (
                <Link key={action.href} href={action.href}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-gray-600 hover:text-primary hover:bg-avo-blue-50"
                  >
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center mr-3 ${action.color}`}>
                      <action.icon className="h-3 w-3 text-white" />
                    </div>
                    {action.label}
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Settings */}
        <div className="p-3 border-t border-gray-100">
          <Link href="/settings">
            <Button
              variant="ghost"
              className={`w-full justify-start text-gray-600 hover:text-primary hover:bg-avo-blue-50 ${
                collapsed ? "px-2" : "px-3"
              }`}
            >
              <Settings className={`h-5 w-5 ${collapsed ? "" : "mr-3"}`} />
              {!collapsed && "Settings"}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}