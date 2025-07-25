//C:\Users\mukas\Downloads\project-bolt-sb1-guerg2d9\project\lib\greenhouse-api.ts

/**
 * Greenhouse API client
 * 
 * This module provides functions to interact with the Greenhouse job board API
 * Documentation: https://developers.greenhouse.io/job-board.html
 */

import { Job } from '@/types/jobs';

// Base URL for Greenhouse API
const GREENHOUSE_API_BASE_URL = 'https://boards-api.greenhouse.io/v1/boards';

export interface GreenhouseSearchParams {
  company: string; // Board token (required)
  department?: string;
  location?: string;
  search?: string;
}

export interface GreenhouseJob {
  id: number;
  title: string;
  location: { name: string };
  departments: Array<{ id: number; name: string }>;
  offices: Array<{ id: number; name: string; location: string }>;
  absolute_url: string;
  content: string;
  updated_at: string;
  metadata?: Array<{ id: number; name: string; value: string }>;
  data_compliance?: Array<{ type: string; requires_consent: boolean; retention_period?: string }>;
}

export interface GreenhouseApiResponse {
  jobs: GreenhouseJob[];
}

/**
 * Search for jobs using the Greenhouse API
 */
export async function searchJobs(params: GreenhouseSearchParams): Promise<GreenhouseApiResponse> {
  try {
    if (!params.company) {
      throw new Error('Company board token is required');
    }

    // Make the API request
    const response = await fetch(`${GREENHOUSE_API_BASE_URL}/${params.company}/jobs`, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 3600 } // Cache for 1 hour
    });
    
    if (!response.ok) {
      throw new Error(`Greenhouse API error: ${response.status} ${response.statusText}`);
    }
    
    const data: GreenhouseApiResponse = await response.json();

    // Apply client-side filters
    let filteredJobs = data.jobs;

    if (params.department) {
      filteredJobs = filteredJobs.filter(job => 
        job.departments.some(dept => 
          dept.name.toLowerCase().includes(params.department!.toLowerCase())
        )
      );
    }

    if (params.location) {
      filteredJobs = filteredJobs.filter(job => 
        job.location.name.toLowerCase().includes(params.location!.toLowerCase())
      );
    }

    if (params.search) {
      const searchTerm = params.search.toLowerCase();
      filteredJobs = filteredJobs.filter(job => 
        job.title.toLowerCase().includes(searchTerm) ||
        job.content.toLowerCase().includes(searchTerm)
      );
    }

    return { jobs: filteredJobs };
  } catch (error) {
    console.error('Error searching Greenhouse jobs:', error);
    throw error;
  }
}

/**
 * Get a specific job listing by ID
 */
export async function getJob(id: string, company: string): Promise<GreenhouseJob> {
  try {
    // First get all jobs, then find the specific one
    // Greenhouse doesn't have a single job endpoint in their public API
    const response = await searchJobs({ company });
    const job = response.jobs.find(job => job.id.toString() === id);
    
    if (!job) {
      throw new Error(`Job with ID ${id} not found`);
    }
    
    return job;
  } catch (error) {
    console.error(`Error fetching job with ID ${id}:`, error);
    throw error;
  }
}

/**
 * Convert a Greenhouse job position to our internal Job format
 */
export function convertGreenhouseJobToJob(greenhouseJob: GreenhouseJob): Job {
  return {
    id: greenhouseJob.id.toString(),
    title: greenhouseJob.title,
    employer: greenhouseJob.departments[0]?.name || 'Company', // Use department as employer fallback
    location: greenhouseJob.location.name,
    description: greenhouseJob.content || '',
    published: formatPublishedDate(greenhouseJob.updated_at),
    deadline: undefined, // Greenhouse doesn't provide application deadlines in public API
    url: greenhouseJob.absolute_url,
    employmentType: extractEmploymentType(greenhouseJob.content),
    workplaceType: extractWorkplaceType(greenhouseJob.content),
    source: 'Greenhouse',
    departments: greenhouseJob.departments.map(dept => dept.name),
    offices: greenhouseJob.offices.map(office => office.name),
  };
}

/**
 * Extract employment type from job content (since Greenhouse doesn't provide it directly)
 */
function extractEmploymentType(content: string): string {
  const fullTimeRegex = /full.time|full time/i;
  const partTimeRegex = /part.time|part time/i;
  const contractRegex = /contract|contractor|freelance/i;
  const internshipRegex = /intern|internship/i;

  if (internshipRegex.test(content)) return 'Internship';
  if (contractRegex.test(content)) return 'Contract';
  if (partTimeRegex.test(content)) return 'Part-time';
  if (fullTimeRegex.test(content)) return 'Full-time';
  
  return 'Full-time'; // Default
}

/**
 * Extract workplace type from job content
 */
function extractWorkplaceType(content: string): string {
  const remoteRegex = /remote|work from home|wfh/i;
  const hybridRegex = /hybrid|flexible/i;
  const onsiteRegex = /on.site|onsite|office/i;

  if (remoteRegex.test(content)) return 'Remote';
  if (hybridRegex.test(content)) return 'Hybrid';
  if (onsiteRegex.test(content)) return 'On-site';
  
  return 'On-site'; // Default
}

/**
 * Format a date string to relative time (e.g., "2 days ago")
 */
function formatPublishedDate(dateString: string): string {
  const publishedDate = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - publishedDate.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) {
    return 'Today';
  } else if (diffInDays === 1) {
    return 'Yesterday';
  } else if (diffInDays < 7) {
    return `${diffInDays} days ago`;
  } else if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7);
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  } else {
    const months = Math.floor(diffInDays / 30);
    return `${months} month${months > 1 ? 's' : ''} ago`;
  }
}