"use client";

import { useState } from "react";
import { Job } from "@/types/jobs";
import JobListingCard from "@/components/JobListingCard";
import JobFilters from "@/components/JobFilters";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, AlertCircle, ArrowUpDown, Clock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface JobSearchResultsProps {
  jobs: Job[];
  isLoading: boolean;
  query: string;
  onSort: (sortBy: string) => void;
  onFilter: (filters: any) => void;
}

export default function JobSearchResults({ 
  jobs, 
  isLoading, 
  query,
  onSort,
  onFilter
}: JobSearchResultsProps) {
  const [sortBy, setSortBy] = useState("relevance");
  const [view, setView] = useState("cards");
  
  const handleSort = (newSortBy: string) => {
    setSortBy(newSortBy);
    onSort(newSortBy);
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-lg font-medium">Searching for jobs...</p>
            <p className="text-sm text-muted-foreground mt-2">
              We're analyzing your query and finding the best matches
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (jobs.length === 0 && query) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No jobs found</p>
            <p className="text-sm text-muted-foreground mt-2 text-center max-w-md">
              We couldn't find any jobs matching your search. Try broadening your search terms or selecting a different company.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (jobs.length === 0 && !query) {
    return null; // Don't show empty results before search
  }
  
  return (
    <div className="space-y-6">
      <Tabs value={view} onValueChange={setView} className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold">Search Results</h2>
            <p className="text-muted-foreground">
              Found {jobs.length} job{jobs.length !== 1 ? 's' : ''} matching your search
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <TabsList className="h-8">
              <TabsTrigger value="cards" className="px-3 h-8">Cards</TabsTrigger>
              <TabsTrigger value="list" className="px-3 h-8">List</TabsTrigger>
            </TabsList>
            
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center h-8"
                onClick={() => {
                  const nextSort = sortBy === "relevance" ? "date" : "relevance";
                  handleSort(nextSort);
                }}
              >
                <ArrowUpDown className="h-3.5 w-3.5 mr-2" />
                <span>{sortBy === "relevance" ? "Most Relevant" : "Newest First"}</span>
              </Button>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1">
            <JobFilters onFilter={onFilter} />
          </div>
          
          <div className="md:col-span-3">
            <TabsContent value="cards" className="m-0">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {jobs.map((job) => (
                  <JobListingCard key={job.id} job={job} />
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="list" className="m-0">
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {jobs.map((job) => (
                      <div key={job.id} className="p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-medium">{job.title}</h3>
                            <div className="text-sm text-muted-foreground mt-1">
                              <span className="flex items-center">
                                <Briefcase className="h-3.5 w-3.5 mr-1" />
                                {job.employer}
                              </span>
                            </div>
                            <div className="flex items-center text-xs text-muted-foreground mt-2">
                              <Clock className="h-3 w-3 mr-1" />
                              <span>Posted {job.published}</span>
                              <span className="mx-2">•</span>
                              <span>{job.location}</span>
                            </div>
                            {job.score && (
                              <div className="flex items-center mt-2">
                                <div className="text-xs text-green-600 font-medium">
                                  {Math.round(job.score * 100)}% Match
                                </div>
                              </div>
                            )}
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="ml-4 flex-shrink-0"
                            onClick={() => window.location.href = `/dashboard/jobs/${job.id}?company=${job.source?.toLowerCase() || 'company'}`}
                          >
                            View Job
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  );
}