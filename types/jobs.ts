// Job search related types

// Main Job type representing a job listing
export interface Job {
    id: string;
    title: string;
    employer: string;
    location: string;
    description: string;
    requirements?: string;
    duties?: string;
    published: string; // Date the job was published
    deadline?: string; // Application deadline
    url: string; // Original job listing URL
    employmentType?: string; // Full-time, part-time, etc.
    workplaceType?: string; // On-site, remote, hybrid
    score?: number; // Match score from 0.0 to 1.0
    skills?: string[]; // Required skills
    salary?: {
      min?: number;
      max?: number;
      currency?: string;
    };
    sector?: string; // Industry sector
    source?: string; // Source of the job listing (NAV, etc.)
    matchReason?: string; // AI-generated reason for match
    highlights?: string[]; // Key highlights of the job
  }
  
  // Filter options for job search
  export interface JobFilters {
    location?: string;
    employmentTypes?: string[];
    postedWithin?: Date;
    experienceLevel?: number;
    onlyMatchingSkills?: boolean;
    salary?: number;
    sectors?: string[];
    keywords?: string[];
  }
  
  // Search parameters for NAV API
  export interface NavSearchParams {
    q?: string; // Query string
    place?: string; // Location
    extent?: number; // Search radius
    positions?: string[]; // Job positions/titles
    engagementTypes?: string[]; // Employment types
    published?: string; // Published after date
    size?: number; // Number of results
    from?: number; // Pagination start
    sort?: string; // Sort order
  }
  
  // Response structure from NAV API
  export interface NavApiResponse {
    hits: number; // Total number of results
    took: number; // Time taken for the search
    positions: NavJobPosition[]; // Job results
  }
  
  // NAV job position structure
  export interface NavJobPosition {
    uuid: string;
    title: string;
    employer: {
      name: string;
      orgnr?: string;
      location?: {
        address?: string;
        postalCode?: string;
        city?: string;
        municipal?: string;
        county?: string;
      };
    };
    location: {
      address?: string;
      postalCode?: string;
      city?: string;
      municipal?: string;
      county?: string;
      country?: string;
    };
    applicationDue?: string;
    publishedDate: string;
    engagementType: string;
    extent: string;
    url: string;
    description?: string;
    sourceId?: string;
    source?: string;
  }
  
  // Structured output from OpenAI for job search
  export interface JobSearchAnalysis {
    query: string;
    parsedQuery: {
      jobTitles: string[];
      skills: string[];
      locations: string[];
      industries: string[];
      keywords: string[];
      experienceLevel?: string;
      employmentTypes?: string[];
    };
    navSearchParams: NavSearchParams;
  }