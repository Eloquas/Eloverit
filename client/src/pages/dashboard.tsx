import Header from "@/components/header";
import StatsGrid from "@/components/stats-grid";
import ProspectTable from "@/components/prospect-table";
import ContentGeneration from "@/components/content-generation";
import { useState } from "react";

export default function Dashboard() {
  const [selectedProspects, setSelectedProspects] = useState<number[]>([]);

  return (
    <div className="min-h-screen bg-surface">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="sm:flex sm:items-center sm:justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
              <p className="mt-2 text-gray-600">Manage your prospects and generate personalized sales copy</p>
            </div>
          </div>
        </div>

        <StatsGrid />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <ProspectTable 
              selectedProspects={selectedProspects}
              onSelectedProspectsChange={setSelectedProspects}
            />
          </div>
          <div>
            <ContentGeneration selectedProspects={selectedProspects} />
          </div>
        </div>
      </div>
    </div>
  );
}
