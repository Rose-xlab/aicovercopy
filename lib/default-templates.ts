import { Template } from '@/types/templates';

// Import individual template modules
import classicTemplate from './templates/classic';
import modernTemplate from './templates/modern';
import professionalTemplate from './templates/professional';
import creativeTemplate from './templates/creative';
import minimalTemplate from './templates/minimal';
import classicUxDesignerTemplate from './templates/classic-ux-designer';
import playfulBusinessTemplate from './templates/playful-business';
import projectManagementTemplate from './templates/project-management';
import simpleBoldTemplate from './templates/simple-bold';

/**
 * Default templates that are included with the application
 * These templates have been enhanced for responsive design and modern UI
 * Using modular import approach for better code organization
 */
export const DEFAULT_TEMPLATES: Template[] = [
  classicTemplate,
  modernTemplate,
  professionalTemplate,
  creativeTemplate,
  minimalTemplate,
  classicUxDesignerTemplate,
  playfulBusinessTemplate,
  projectManagementTemplate,
  simpleBoldTemplate
];