import DashboardLayout from "@/components/dashboard-layout";
import StatsGrid from "@/components/stats-grid";
import AccountGroupedProspects from "@/components/account-grouped-prospects";
import SCIPABGeneratorCard from "@/components/scipab-generator-card";
import CompanyInsightsDashboard from "@/components/company-insights-dashboard";
import { useState } from "react";

export default function Dashboard() {
  const [selectedProspects, setSelectedProspects] = useState<number[]>([]);

  return (
    <DashboardLayout>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary">Dashboard</h1>
            <p className="mt-2 text-gray-600">Manage your prospects and generate personalized sales copy</p>
          </div>
          <div className="hidden sm:block">
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>Last updated: 2 min ago</span>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="mb-8">
        <StatsGrid />
      </div>

      {/* Company Insights Dashboard */}
      <div className="mb-8">
        <CompanyInsightsDashboard />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Prospects Section */}
        <div className="xl:col-span-3">
          <div className="bg-white rounded-xl avo-shadow-card p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Prospects by Account</h2>
              <p className="text-gray-600 text-sm">Organize and manage your prospect pipeline by company</p>
            </div>
            <AccountGroupedProspects 
              selectedProspects={selectedProspects}
              onSelectedProspectsChange={setSelectedProspects}
            />
          </div>
        </div>

        {/* SCIPAB Generator Section */}
        <div className="xl:col-span-1">
          <div className="sticky top-24">
            <SCIPABGeneratorCard selectedProspects={selectedProspects} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
