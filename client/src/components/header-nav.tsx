import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Home,
  Building2,
  Users,
  MessageSquare,
  BarChart3,
  Target,
  Search,
  Settings,
  Trophy,
  Lightbulb,
  FileText,
  TrendingUp,
  Mail,
  ChevronDown,
  Menu,
  Calculator,
  ExternalLink
} from "lucide-react";

export default function HeaderNav() {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigationGroups = {
    main: [
      { label: "Dashboard", href: "/", icon: Home },
      { label: "Account Research", href: "/account-research", icon: Building2 },
      { label: "Intent Discovery", href: "/intent-discovery", icon: Search },
      { label: "Prospect Identification", href: "/prospect-identification", icon: Users },
    ],
    outbound: [
      { label: "Email Cadences", href: "/email-cadences", icon: Mail },
      { label: "LinkedIn Posts", href: "/eloquas-linkedin-posts", icon: MessageSquare },
      { label: "Outreach MVP", href: "/outreach-mvp", icon: Target, badge: "NEW" },
    ],
    intelligence: [
      { label: "Research Insights", href: "/research-insights", icon: Lightbulb },
      { label: "Call Assessment", href: "/call-assessment", icon: FileText },
      { label: "Generated Content", href: "/generated-content", icon: BarChart3 },
    ],
    tools: [
      { label: "Avo Business Case", href: "/avo-business-case", icon: Calculator, badge: "TOOL" },
      { label: "Orchestrator", href: "/orchestrator", icon: TrendingUp },
      { label: "Achievements", href: "/achievements", icon: Trophy },
      { label: "Integrations", href: "/integrations", icon: Settings },
    ],
  };

  const isActive = (href: string) => {
    if (href === "/") return location === "/";
    return location.startsWith(href);
  };

  const NavItem = ({ item, mobile = false }: { item: any; mobile?: boolean }) => (
    <Link href={item.href}>
      <Button
        variant={isActive(item.href) ? "default" : "ghost"}
        size="sm"
        className={`${mobile ? "w-full justify-start" : ""} ${
          isActive(item.href)
            ? "bg-primary text-white"
            : "text-gray-600 hover:text-primary hover:bg-blue-50"
        }`}
        onClick={() => mobile && setIsMobileMenuOpen(false)}
      >
        <item.icon className={`h-4 w-4 ${mobile ? "mr-2" : "mr-1"}`} />
        {item.label}
        {item.badge && (
          <Badge variant="secondary" className="ml-2 text-xs">
            {item.badge}
          </Badge>
        )}
      </Button>
    </Link>
  );

  const DropdownGroup = ({ title, items }: { title: string; items: any[] }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="text-gray-600 hover:text-primary hover:bg-blue-50">
          {title}
          <ChevronDown className="h-4 w-4 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {items.map((item, index) => (
          <DropdownMenuItem key={index} asChild>
            <Link href={item.href} className="flex items-center w-full">
              <item.icon className="h-4 w-4 mr-2" />
              {item.label}
              {item.badge && (
                <Badge variant="secondary" className="ml-auto text-xs">
                  {item.badge}
                </Badge>
              )}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-sm">E</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Eloquas AI
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navigationGroups.main.map((item, index) => (
              <NavItem key={index} item={item} />
            ))}
            <DropdownGroup title="Outbound" items={navigationGroups.outbound} />
            <DropdownGroup title="Intelligence" items={navigationGroups.intelligence} />
            <DropdownGroup title="Tools" items={navigationGroups.tools} />
          </nav>

          {/* Mobile Menu */}
          <div className="lg:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <SheetHeader>
                  <SheetTitle>Navigation</SheetTitle>
                  <SheetDescription>
                    Access all Eloquas AI features and tools
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Main</h4>
                    <div className="space-y-2">
                      {navigationGroups.main.map((item, index) => (
                        <NavItem key={index} item={item} mobile />
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Outbound Engine</h4>
                    <div className="space-y-2">
                      {navigationGroups.outbound.map((item, index) => (
                        <NavItem key={index} item={item} mobile />
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Intelligence</h4>
                    <div className="space-y-2">
                      {navigationGroups.intelligence.map((item, index) => (
                        <NavItem key={index} item={item} mobile />
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Tools & Integrations</h4>
                    <div className="space-y-2">
                      {navigationGroups.tools.map((item, index) => (
                        <NavItem key={index} item={item} mobile />
                      ))}
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}