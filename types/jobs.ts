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
  source?: string; // Source of the job listing (Greenhouse, etc.)
  matchReason?: string; // AI-generated reason for match
  highlights?: string[]; // Key highlights of the job
  
  // Greenhouse-specific fields
  departments?: string[]; // For Greenhouse departments
  offices?: string[]; // For Greenhouse offices
}

// Filter options for job search
export interface JobFilters {
  location?: string;
  employmentTypes?: string[];
  workplaceTypes?: string[]; // Added missing property
  postedWithin?: Date;
  experienceLevel?: number;
  onlyMatchingSkills?: boolean;
  salary?: number;
  sectors?: string[];
  keywords?: string[];
  departments?: string[]; // For Greenhouse departments
}

// Search parameters for Greenhouse API
export interface GreenhouseSearchParams {
  company: string; // Board token (required)
  department?: string;
  location?: string;
  search?: string;
}

// Response structure from Greenhouse API
export interface GreenhouseApiResponse {
  jobs: GreenhouseJob[];
}

// Greenhouse job position structure
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

// Structured output from OpenAI for job search
export interface JobSearchAnalysis {
  originalQuery: string;
  enhancedQuery?: string;
  parsedQuery: {
    jobTitles: string[];
    skills: string[];
    locations: string[];
    industries: string[];
    keywords: string[];
    experienceLevel?: string;
    employmentTypes?: string[];
    departments?: string[]; // For Greenhouse departments
  };
  searchStrategy?: {
    primaryTerms: string[];
    alternativeTerms: string[];
    filters: {
      departments: string[];
      industries: string[];
      locations: string[];
    };
  };
}