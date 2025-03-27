/**
 * NAV Arbeidsplassen API client
 * 
 * This module provides functions to interact with the NAV job search API
 * Documentation: https://arbeidsplassen.nav.no/docs/api
 */

import { NavSearchParams, NavApiResponse, NavJobPosition, Job } from '@/types/jobs';

// Base URL for NAV API
const NAV_API_BASE_URL = 'https://arbeidsplassen.nav.no/public-feed/api/v1/ads';

/**
 * Search for jobs using the NAV API
 */
export async function searchJobs(params: NavSearchParams): Promise<NavApiResponse> {
  try {
    // Construct query parameters
    const queryParams = new URLSearchParams();
    
    if (params.q) queryParams.append('q', params.q);
    if (params.place) queryParams.append('place', params.place);
    if (params.extent) queryParams.append('extent', params.extent.toString());
    if (params.positions && params.positions.length > 0) {
      params.positions.forEach(position => {
        queryParams.append('positions', position);
      });
    }
    if (params.engagementTypes && params.engagementTypes.length > 0) {
      params.engagementTypes.forEach(type => {
        queryParams.append('engagementTypes', type);
      });
    }
    if (params.published) queryParams.append('published', params.published);
    if (params.size) queryParams.append('size', params.size.toString());
    if (params.from) queryParams.append('from', params.from.toString());
    if (params.sort) queryParams.append('sort', params.sort);
    
    // Make the API request
    const response = await fetch(`${NAV_API_BASE_URL}?${queryParams.toString()}`, {
      headers: {
        'Accept': 'application/json',
        // Add any required API keys or auth headers here
      },
    });
    
    if (!response.ok) {
      throw new Error(`NAV API error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error searching NAV jobs:', error);
    throw error;
  }
}

/**
 * Get a specific job listing by ID
 */
export async function getJob(id: string): Promise<NavJobPosition> {
  try {
    const response = await fetch(`${NAV_API_BASE_URL}/${id}`, {
      headers: {
        'Accept': 'application/json',
        // Add any required API keys or auth headers here
      },
    });
    
    if (!response.ok) {
      throw new Error(`NAV API error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching job with ID ${id}:`, error);
    throw error;
  }
}

/**
 * Convert a NAV job position to our internal Job format
 */
export function convertNavJobToJob(navJob: NavJobPosition): Job {
  return {
    id: navJob.uuid,
    title: navJob.title,
    employer: navJob.employer.name,
    location: `${navJob.location.city || ''}, ${navJob.location.county || ''}`.trim(),
    description: navJob.description || '',
    published: formatPublishedDate(navJob.publishedDate),
    deadline: navJob.applicationDue ? formatDate(navJob.applicationDue) : undefined,
    url: navJob.url,
    employmentType: navJob.engagementType,
    workplaceType: navJob.extent,
    source: navJob.source || 'NAV',
  };
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
  } else {
    return `${diffInDays} days ago`;
  }
}

/**
 * Format a date string to a human-readable format
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('no-NO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}