"use client";

import { useState, useCallback } from 'react';
import { Job, JobFilters } from '@/types/jobs';

/**
 * Hook for managing job search functionality
 */
export function useJobSearch() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [originalJobs, setOriginalJobs] = useState<Job[]>([]);

  /**
   * Perform a job search based on query and location
   */
  const search = useCallback(async (query: string, location?: string) => {
    setIsSearching(true);
    setError(null);
    
    try {
      // Call your API endpoint
      const response = await fetch('/api/jobs/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          query,
          location
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to search jobs');
      }
      
      const data = await response.json();
      
      // Store the original jobs for filtering
      setOriginalJobs(data.jobs);
      setJobs(data.jobs);
      
      return data.jobs;
    } catch (err: any) {
      console.error('Search error:', err);
      setError(err.message || 'Failed to search jobs');
      setJobs([]);
      setOriginalJobs([]);
      throw err;
    } finally {
      setIsSearching(false);
    }
  }, []);

  /**
   * Apply filters to the job results
   */
  const applyFilters = useCallback((filters: JobFilters) => {
    if (!originalJobs.length) return;
    
    let filteredJobs = [...originalJobs];
    
    // Apply location filter
    if (filters.location) {
      filteredJobs = filteredJobs.filter(job => 
        job.location.toLowerCase().includes(filters.location!.toLowerCase())
      );
    }
    
    // Apply employment type filter
    if (filters.employmentTypes && filters.employmentTypes.length > 0) {
      filteredJobs = filteredJobs.filter(job => {
        if (!job.employmentType) return false;
        return filters.employmentTypes!.some(type => 
          job.employmentType!.toLowerCase().includes(type.toLowerCase())
        );
      });
    }
    
    // Apply date filter
    if (filters.postedWithin) {
      const filterDate = filters.postedWithin.getTime();
      filteredJobs = filteredJobs.filter(job => {
        // Parse the published date string 
        // This assumes a simple "X days ago" format - adjust as needed
        const publishedDays = parseInt(job.published.split(' ')[0]);
        if (isNaN(publishedDays)) return true;
        
        const publishedDate = new Date();
        publishedDate.setDate(publishedDate.getDate() - publishedDays);
        return publishedDate.getTime() >= filterDate;
      });
    }
    
    // Apply sector filter
    if (filters.sectors && filters.sectors.length > 0) {
      filteredJobs = filteredJobs.filter(job => {
        if (!job.sector) return false;
        return filters.sectors!.some(sector => 
          job.sector!.toLowerCase().includes(sector.toLowerCase())
        );
      });
    }
    
    // Apply salary filter
    if (filters.salary) {
      filteredJobs = filteredJobs.filter(job => {
        if (!job.salary) return true; // Include jobs with no salary info
        
        // If min salary is available and it's below the filter
        if (job.salary.min && job.salary.min < filters.salary!) {
          return false;
        }
        
        // If only max salary is available and it's below the filter
        if (!job.salary.min && job.salary.max && job.salary.max < filters.salary!) {
          return false;
        }
        
        return true;
      });
    }
    
    // Apply skill match filter
    if (filters.onlyMatchingSkills) {
      filteredJobs = filteredJobs.filter(job => {
        // This would normally compare to the user's profile skills
        // For demo purposes, we'll just check if there's a high match score
        return job.score ? job.score > 0.6 : false;
      });
    }
    
    setJobs(filteredJobs);
  }, [originalJobs]);

  /**
   * Apply sorting to the job results
   */
  const applySort = useCallback((sortBy: string) => {
    if (!jobs.length) return;
    
    let sortedJobs = [...jobs];
    
    switch (sortBy) {
      case 'relevance':
        // Sort by score (highest first)
        sortedJobs.sort((a, b) => {
          const scoreA = a.score || 0;
          const scoreB = b.score || 0;
          return scoreB - scoreA;
        });
        break;
      case 'date':
        // Sort by published date (newest first)
        // This assumes a simple "X days ago" format - adjust as needed
        sortedJobs.sort((a, b) => {
          const getDays = (str: string) => {
            const match = str.match(/^(\d+)/);
            return match ? parseInt(match[1]) : 0;
          };
          
          const daysA = getDays(a.published);
          const daysB = getDays(b.published);
          return daysA - daysB;
        });
        break;
      case 'salary':
        // Sort by salary (highest first)
        sortedJobs.sort((a, b) => {
          const salaryA = a.salary?.max || a.salary?.min || 0;
          const salaryB = b.salary?.max || b.salary?.min || 0;
          return salaryB - salaryA;
        });
        break;
      default:
        // Default to relevance
        sortedJobs.sort((a, b) => {
          const scoreA = a.score || 0;
          const scoreB = b.score || 0;
          return scoreB - scoreA;
        });
    }
    
    setJobs(sortedJobs);
  }, [jobs]);

  /**
   * Get a specific job by ID
   */
  const getJob = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/jobs/${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch job details');
      }
      
      return await response.json();
    } catch (err: any) {
      console.error('Error fetching job:', err);
      throw err;
    }
  }, []);

  return {
    jobs,
    isSearching,
    error,
    search,
    applyFilters,
    applySort,
    getJob
  };
}