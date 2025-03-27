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
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold mb-2">Job Search</h1>
        <p className="text-muted-foreground">
          Find the perfect job match using AI-powered smart search
        </p>
      </header>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRetry}
              className="ml-2"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <JobSearchInput 
        onSearch={handleSearch}
        isSearching={isSearching}
      />

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