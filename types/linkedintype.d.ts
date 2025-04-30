// types/linkedintype.ts

// Define a generic JSON type if needed elsewhere and not imported globally
// type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

/**
 * Interface for LinkedIn data optimized specifically for cover letter generation prompt context.
 * This structure is created by the linkedInCoverLetterTransformer.
 */
export interface LinkedInCoverLetterData {
  name: string;
  title: string; // Headline or Current Role
  summary: string;
  currentRole: string;
  currentCompany: string;
  yearsOfExperience: number;
  topSkills: string[];
  relevantExperience: { // Typically top 3 recent experiences
      role: string;
      company: string;
      highlights: string[]; // Key achievements from that role
  }[];
  education: { // Simplified education structure
      degree: string;
      school: string;
      fieldOfStudy?: string;
  }[];
  certifications: string[]; // List of certification names
  accomplishments: string[]; // Top overall accomplishments extracted
  languages: string[]; // Fluent/Native languages
  profileUrl: string;
}

// REMOVED: LinkedInExperience (use type derived from DB schema if needed)
// REMOVED: LinkedInEducation (use type derived from DB schema if needed)
// REMOVED: LinkedInProfile (use type derived from DB schema)
// REMOVED: EnhancedLinkedInProfile (use type derived from DB schema)
// REMOVED: RawLinkedInProfile (likely obsolete)