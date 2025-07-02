import Header from "@/components/header";
import StatsGrid from "@/components/stats-grid";
import ProspectTable from "@/components/prospect-table";
import ContentGeneration from "@/components/content-generation";
import SCIPABCadenceGenerator from "@/components/scipab-cadence-generator";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
        
        <div className="mb-8">
          <ProspectTable 
            selectedProspects={selectedProspects}
            onSelectedProspectsChange={setSelectedProspects}
          />
        </div>

        <Tabs defaultValue="scipab" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="scipab">SCIPAB Cadence Generator</TabsTrigger>
            <TabsTrigger value="simple">Simple Content Generation</TabsTrigger>
          </TabsList>
          <TabsContent value="scipab" className="mt-6">
            <SCIPABCadenceGenerator selectedProspects={selectedProspects} />
          </TabsContent>
          <TabsContent value="simple" className="mt-6">
            <ContentGeneration selectedProspects={selectedProspects} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
