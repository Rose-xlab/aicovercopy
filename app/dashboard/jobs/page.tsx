//C:\Users\mukas\Downloads\project-bolt-sb1-guerg2d9\project\app\dashboard\jobs\page.tsx

"use client";

import { useState } from "react";
import { Job, JobFilters } from "@/types/jobs";
import JobSearchInput from "@/components/JobSearchInput";
import JobSearchResults from "@/components/JobSearchResults";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useJobSearch } from "@/lib/hooks/useJobSearch";

export default function JobsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLocation, setSearchLocation] = useState("");
  const { toast } = useToast();

  const {
    jobs,
    isSearching,
    error,
    search,
    applyFilters,
    applySort
  } = useJobSearch();

  const handleSearch = async (query: string, location?: string) => {
    setSearchQuery(query);
    setSearchLocation(location || "");

    try {
      await search(query, location);
    } catch (error) {
      console.error("Search error:", error);
      toast({
        title: "Search failed",
        description: "There was an error processing your search. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleFilter = (filters: JobFilters) => {
    applyFilters(filters);
  };

  const handleSort = (sortBy: string) => {
    applySort(sortBy);
  };

  const handleRetry = () => {
    if (searchQuery) {
      search(searchQuery, searchLocation);
    }
  };

  return (
    <div className="space-y-8 px-4 sm:px-6 md:px-10 py-6 max-w-5xl mx-auto bg-gray-50 min-h-screen">
      <header>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Job Search</h1>
        <p className="text-muted-foreground text-gray-600">
          Find the perfect job match using AI-powered smart search
        </p>
      </header>

      {error && (
        <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-700">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 text-red-500" />
              <div>
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRetry}
              className="text-red-600 border-red-300 hover:bg-red-100"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          </div>
        </Alert>
      )}

      <div className="rounded-lg border border-teal-100 p-4 bg-white shadow-sm">
        <JobSearchInput 
          onSearch={handleSearch}
          isSearching={isSearching}
        />
      </div>

      {(jobs.length > 0 || isSearching || (searchQuery && !error)) && (
        <JobSearchResults 
          jobs={jobs}
          isLoading={isSearching}
          query={searchQuery}
          onSort={handleSort}
          onFilter={handleFilter}
        />
      )}
    </div>
  );
}
