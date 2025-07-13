import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Home, 
  Building2, 
  FileText, 
  Trophy, 
  BarChart3, 
  Menu,
  X,
  Send,
  Sparkles,
  Target,
  Layers,
  ChevronDown,
  ChevronUp
} from "lucide-react";

export default function MobileNav() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const navigationItems = [
    {
      label: "Dashboard",
      href: "/",
      icon: Home,
      active: location === "/",
      badge: null
    },
    {
      label: "Account Research",
      href: "/account-research",
      icon: Building2,
      active: location === "/account-research",
      badge: null
    },
    {
      label: "Generated Content",
      href: "/generated-content",
      icon: FileText,
      active: location === "/generated-content",
      badge: null
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

  const outboundEngine = {
    id: "outbound-engine",
    label: "Outbound Engine",
    icon: Layers,
    items: [
      {
        label: "LinkedIn Messaging",
        href: "/linkedin-posts",
        icon: Send,
        active: location === "/linkedin-posts",
        badge: "AI"
      },
      {
        label: "Email Messaging",
        href: "/eloquas-ai",
        icon: Sparkles,
        active: location === "/eloquas-ai",
        badge: "NEW"
      },
      {
        label: "Cadence and Delivery",
        href: "/outreach-mvp",
        icon: Target,
        active: location === "/outreach-mvp",
        badge: "NEW"
      }
    ]
  };

  const closeMenu = () => setIsOpen(false);

  return (
    <div className="md:hidden">
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 bg-white shadow-md"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50"
          onClick={closeMenu}
        />
      )}

      {/* Mobile Menu */}
      <div className={`
        fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-white shadow-lg transform transition-transform duration-300 z-50
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 pt-8">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                ProspectCopy
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-1">
            {navigationItems.map((item) => (
              <Link key={item.href} href={item.href} onClick={closeMenu}>
                <Button
                  variant="ghost"
                  className={`w-full justify-start h-11 rounded-lg transition-all duration-200 ${
                    item.active 
                      ? "bg-blue-500 text-white hover:bg-blue-600" 
                      : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                  }`}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  <span className="flex-1 text-left font-medium">{item.label}</span>
                  {item.badge && (
                    <Badge className="ml-2 text-xs bg-blue-100 text-blue-700 border border-blue-200">
                      {item.badge}
                    </Badge>
                  )}
                </Button>
              </Link>
            ))}

            {/* Outbound Engine Group */}
            <div className="mt-4">
              <Button
                variant="ghost"
                onClick={() => toggleGroup(outboundEngine.id)}
                className={`w-full justify-start h-11 rounded-lg transition-all duration-200 ${
                  expandedGroups.includes(outboundEngine.id) || outboundEngine.items.some(item => item.active)
                    ? "bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 border border-blue-200" 
                    : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                }`}
              >
                <outboundEngine.icon className="h-5 w-5 mr-3" />
                <span className="flex-1 text-left font-medium">{outboundEngine.label}</span>
                <div className="flex items-center space-x-1">
                  <Badge className="text-xs bg-blue-100 text-blue-700 border border-blue-200">
                    AI
                  </Badge>
                  {expandedGroups.includes(outboundEngine.id) ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </Button>
              
              {/* Nested Items */}
              {(expandedGroups.includes(outboundEngine.id) || outboundEngine.items.some(item => item.active)) && (
                <div className="ml-4 mt-2 space-y-1 border-l-2 border-blue-100 pl-4">
                  {outboundEngine.items.map((item) => (
                    <Link key={item.href} href={item.href} onClick={closeMenu}>
                      <Button
                        variant="ghost"
                        className={`w-full justify-start h-9 rounded-lg transition-all duration-200 ${
                          item.active 
                            ? "bg-blue-500 text-white hover:bg-blue-600" 
                            : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                        }`}
                      >
                        <item.icon className="h-4 w-4 mr-3" />
                        <span className="flex-1 text-left text-sm font-medium">{item.label}</span>
                        {item.badge && (
                          <Badge className="ml-2 text-xs bg-blue-100 text-blue-700 border border-blue-200">
                            {item.badge}
                          </Badge>
                        )}
                      </Button>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
}