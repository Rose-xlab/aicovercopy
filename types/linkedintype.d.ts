// types/linkedintype.ts

export interface LinkedInExperience {
  title: string;
  company: string;
  dateRange?: string;
  description?: string;
  location?: string;
}

export interface LinkedInEducation {
  school: string;
  degree?: string;
  fieldOfStudy?: string;
  dateRange?: string;
  description?: string;
}

export interface LinkedInProfile {
  id: string;
  user_id: string;
  profile_url: string;
  status: "connected" | "disconnected";
  last_synced: string;
  headline?: string;
  name?: string;
}

export interface EnhancedLinkedInProfile extends LinkedInProfile {
  company?: string;
  position?: string;
  location?: string;
  summary?: string;
  experience_json?: LinkedInExperience[];
  education_json?: LinkedInEducation[];
  skills_json?: string[];
}

// Raw profile data from scraping/API
export interface RawLinkedInProfile {
  name: string;
  headline?: string;
  location?: string;
  summary?: string;
  currentCompany?: string;
  currentPosition?: string;
  experience?: LinkedInExperience[];
  education?: LinkedInEducation[];
  skills?: string[];
}