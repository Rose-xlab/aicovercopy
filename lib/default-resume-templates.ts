// lib/default-resume-templates.ts
import { ResumeTemplate } from '@/types/resume';

// Import individual template modules
import professionalTemplate from './resume-templates/professional';
import modernTemplate from './resume-templates/modern';
import minimalTemplate from './resume-templates/minimal';
import creativeTemplate from './resume-templates/creative';
import technicalTemplate from './resume-templates/technical';
import executiveTemplate from './resume-templates/executive';

/**
 * Default resume templates that are included with the application
 * These templates are optimized for ATS compatibility and professional design
 */
export const DEFAULT_RESUME_TEMPLATES: ResumeTemplate[] = [
  professionalTemplate,
  modernTemplate,
  minimalTemplate,
  creativeTemplate,
  technicalTemplate,
  executiveTemplate
];