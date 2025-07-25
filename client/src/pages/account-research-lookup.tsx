import AccountResearchLookup from "@/components/account-research-lookup";

export default function AccountResearchLookupPage() {
  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Account Research Lookup</h1>
          <p className="text-gray-600 mt-1">
            Module 3 - Discover 5-10 companies with QA automation opportunities
          </p>
        </div>
      </div>

      <AccountResearchLookup />
    </div>
  );
}