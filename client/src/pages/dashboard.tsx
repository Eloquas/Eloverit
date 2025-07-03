import Header from "@/components/header";
import StatsGrid from "@/components/stats-grid";
import AccountGroupedProspects from "@/components/account-grouped-prospects";
import SCIPABGeneratorCard from "@/components/scipab-generator-card";
import { useState } from "react";

export default function Dashboard() {
  const [selectedProspects, setSelectedProspects] = useState<number[]>([]);

  return (
    <div className="min-h-screen avo-gradient-soft">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="sm:flex sm:items-center sm:justify-between">
            <div>
              <h2 className="text-3xl font-bold text-primary">Dashboard</h2>
              <p className="mt-2 text-gray-600">Manage your prospects and generate personalized sales copy</p>
            </div>
          </div>
        </div>

        <StatsGrid />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <AccountGroupedProspects 
              selectedProspects={selectedProspects}
              onSelectedProspectsChange={setSelectedProspects}
            />
          </div>
          <div className="lg:col-span-1">
            <SCIPABGeneratorCard selectedProspects={selectedProspects} />
          </div>
        </div>
      </div>
    </div>
  );
}
