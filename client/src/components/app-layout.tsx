import { useState } from "react";
import Sidebar from "@/components/sidebar";
import MobileNav from "@/components/mobile-nav";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="flex">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <Sidebar 
            collapsed={sidebarCollapsed} 
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
          />
        </div>
        
        {/* Mobile Navigation */}
        <MobileNav />
        
        <main className={`flex-1 transition-all duration-300 ${
          sidebarCollapsed ? "md:ml-16" : "md:ml-64"
        } ml-0`}>
          <div className="p-6 pt-16 md:pt-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}