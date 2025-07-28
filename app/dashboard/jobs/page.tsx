//C:\Users\mukas\Downloads\project-bolt-sb1-guerg2d9\project\app\dashboard\jobs\page.tsx

"use client";

import { useState, useEffect } from "react";
import { Job, JobFilters } from "@/types/jobs";
import JobSearchInput from "@/components/JobSearchInput";
import JobSearchResults from "@/components/JobSearchResults";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, RefreshCw, TrendingUp, Building2, Users, Zap, Sparkles } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function JobsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLocation, setSearchLocation] = useState("");
  const [searchFilters, setSearchFilters] = useState<any>({});
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<any>(null);
  const [isShowingSearchResults, setIsShowingSearchResults] = useState(false);
  const { toast } = useToast();

  // Auto-load jobs on component mount
  useEffect(() => {
    loadInitialJobs();
  }, []);

  const loadInitialJobs = async () => {
    setIsLoadingInitial(true);
    setError(null);

    try {
      console.log('Loading initial trending jobs...');
      
      const response = await fetch('/api/jobs/initial', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load jobs');
      }

      const data = await response.json();
      setJobs(data.jobs || []);
      setSearchResults(data);
      setIsShowingSearchResults(false); // Mark as initial load, not search results
      
      console.log(`Loaded ${data.jobs?.length || 0} initial jobs from ${data.companiesSearched?.length || 0} companies`);
      
    } catch (error: any) {
      console.error("Error loading initial jobs:", error);
      setError("Failed to load jobs. Please try refreshing the page.");
      setJobs([]);
      setSearchResults(null);
    } finally {
      setIsLoadingInitial(false);
    }
  };

  const handleSearch = async (query: string, location?: string, filters?: any) => {
    setSearchQuery(query);
    setSearchLocation(location || "");
    setSearchFilters(filters || {});
    setIsSearching(true);
    setError(null);
    setIsShowingSearchResults(true); // Mark as search results

    try {
      console.log(`Searching for "${query}" across multiple companies...`);
      
      const response = await fetch('/api/jobs/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          location,
          industries: filters?.industries || [],
          companies: filters?.companies || []
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to search jobs');
      }

      const data = await response.json();
      setJobs(data.jobs || []);
      setSearchResults(data);
      
      console.log(`Found ${data.jobs?.length || 0} jobs from ${data.companiesSearched?.length || 0} companies`);
      
      toast({
        title: "Search completed",
        description: `Found ${data.jobs?.length || 0} jobs from ${data.companiesSearched?.length || 0} companies`,
      });
    } catch (error: any) {
      console.error("Search error:", error);
      setError(error.message || "There was an error processing your search. Please try again.");
      setJobs([]);
      setSearchResults(null);
      
      toast({
        title: "Search failed",
        description: error.message || "There was an error processing your search. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleFilter = (filters: JobFilters) => {
    // Apply filters to existing jobs
    let filteredJobs = [...jobs];
    
    if (filters.employmentTypes && filters.employmentTypes.length > 0) {
      filteredJobs = filteredJobs.filter(job => 
        filters.employmentTypes!.includes(job.employmentType || 'Full-time')
      );
    }
    
    if (filters.workplaceTypes && filters.workplaceTypes.length > 0) {
      filteredJobs = filteredJobs.filter(job => 
        filters.workplaceTypes!.includes(job.workplaceType || 'On-site')
      );
    }
    
    if (filters.departments && filters.departments.length > 0) {
      filteredJobs = filteredJobs.filter(job => 
        job.departments && job.departments.some(dept => 
          filters.departments!.includes(dept)
        )
      );
    }
    
    if (filters.sectors && filters.sectors.length > 0) {
      filteredJobs = filteredJobs.filter(job => 
        job.sector && filters.sectors!.includes(job.sector)
      );
    }
    
    console.log("Applying filters:", filters, "Filtered jobs:", filteredJobs.length);
    setJobs(filteredJobs);
  };

  const handleSort = (sortBy: string) => {
    const sortedJobs = [...jobs];
    
    switch (sortBy) {
      case 'relevance':
        sortedJobs.sort((a, b) => (b.score || 0) - (a.score || 0));
        break;
      case 'date':
        sortedJobs.sort((a, b) => new Date(b.published).getTime() - new Date(a.published).getTime());
        break;
      case 'company':
        sortedJobs.sort((a, b) => a.employer.localeCompare(b.employer));
        break;
      case 'salary':
        sortedJobs.sort((a, b) => {
          const aSalary = a.salary?.max || a.salary?.min || 0;
          const bSalary = b.salary?.max || b.salary?.min || 0;
          return bSalary - aSalary;
        });
        break;
      default:
        break;
    }
    
    setJobs(sortedJobs);
  };

  const handleRetry = () => {
    if (isShowingSearchResults && searchQuery) {
      handleSearch(searchQuery, searchLocation, searchFilters);
    } else {
      loadInitialJobs();
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchLocation("");
    setSearchFilters({});
    setIsShowingSearchResults(false);
    loadInitialJobs();
  };

  // Featured stats
  const totalCompanies = searchResults?.companiesSearched?.length || 200;
  const featuredCompanies = ["Buffer", "GitLab", "InVision", "Lattice", "Mixpanel"];

  return (
    <div className="space-y-6 px-4 sm:px-6 md:px-10 py-6 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      {/* Header */}
      <header className="text-center space-y-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-gray-800">Find Your Dream Job</h1>
          <p className="text-xl text-muted-foreground text-gray-600">
            Search across {totalCompanies}+ tech companies with AI-powered matching
          </p>
        </div>
        
        {/* Featured companies */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Featured companies:</span>
          {featuredCompanies.map((company, index) => (
            <Badge key={company} variant="outline" className="text-xs">
              {company}
            </Badge>
          ))}
          <Badge variant="secondary" className="text-xs">
            +{Math.max(0, totalCompanies - featuredCompanies.length)} more
          </Badge>
        </div>
      </header>

      {/* Stats Cards - Show when no search is active */}
      {!isShowingSearchResults && !isLoadingInitial && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6 text-center">
              <Building2 className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <h3 className="font-semibold text-lg">{totalCompanies}+ Companies</h3>
              <p className="text-sm text-muted-foreground">Top tech companies using Greenhouse</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <Zap className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <h3 className="font-semibold text-lg">AI-Powered</h3>
              <p className="text-sm text-muted-foreground">Smart matching & personalized results</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <h3 className="font-semibold text-lg">Real-Time</h3>
              <p className="text-sm text-muted-foreground">Live job postings updated hourly</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Error Alert */}
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

      {/* Search Input */}
      <div className="rounded-lg border border-teal-100 p-6 bg-white shadow-sm">
        <JobSearchInput
          onSearch={handleSearch}
          isSearching={isSearching}
        />
        
        {/* Quick search suggestions */}
        {!isShowingSearchResults && !isLoadingInitial && (
          <div className="mt-4 flex flex-wrap gap-2 justify-center">
            <span className="text-sm text-muted-foreground mr-2">Popular searches:</span>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleSearch("Frontend Developer")}
              className="text-xs"
            >
              Frontend Developer
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleSearch("Data Scientist")}
              className="text-xs"
            >
              Data Scientist
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleSearch("Product Manager")}
              className="text-xs"
            >
              Product Manager
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleSearch("Backend Engineer")}
              className="text-xs"
            >
              Backend Engineer
            </Button>
          </div>
        )}
      </div>

      {/* Results Summary */}
      {((isShowingSearchResults && searchResults && jobs.length > 0) || (!isShowingSearchResults && jobs.length > 0)) && (
        <div className="bg-white rounded-lg border p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div>
                {isShowingSearchResults ? (
                  <>
                    <h2 className="text-lg font-semibold">
                      {jobs.length} jobs found for &ldquo;{searchQuery}&rdquo;
                      {searchLocation && ` in ${searchLocation}`}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Searched across {searchResults.companiesSearched?.length || 0} companies
                    </p>
                  </>
                ) : (
                  <>
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-yellow-500" />
                      {jobs.length} trending jobs available
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Fresh opportunities from {searchResults?.companiesSearched?.length || 0} top companies
                    </p>
                  </>
                )}
              </div>
              
              {isShowingSearchResults && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearSearch}
                  className="text-xs"
                >
                  Clear Search
                </Button>
              )}
            </div>
            
            {searchResults?.companiesSearched && (
              <div className="flex flex-wrap gap-1">
                {searchResults.companiesSearched.slice(0, 5).map((company: string) => (
                  <Badge key={company} variant="outline" className="text-xs">
                    {company}
                  </Badge>
                ))}
                {searchResults.companiesSearched.length > 5 && (
                  <Badge variant="secondary" className="text-xs">
                    +{searchResults.companiesSearched.length - 5} more
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Job Results */}
      <JobSearchResults
        jobs={jobs}
        isLoading={isLoadingInitial || isSearching}
        query={isShowingSearchResults ? searchQuery : ""}
        onSort={handleSort}
        onFilter={handleFilter}
      />
    </div>
  );
}