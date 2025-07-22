import HeaderNav from "@/components/header-nav";
import { BackgroundProcessor } from "@/components/background-processor";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header Navigation */}
      <HeaderNav />
      
      {/* Main Content */}
      <main className="w-full">
        <div className="container mx-auto px-4 py-6">
          {children}
        </div>
      </main>
      
      <BackgroundProcessor />
    </div>
  );
}