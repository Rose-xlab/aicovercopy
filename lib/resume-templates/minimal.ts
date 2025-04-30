// lib/resume-templates/minimal.ts
import { ResumeTemplate } from '@/types/resume';

const minimalTemplate: ResumeTemplate = {
  id: 'minimal-resume',
  name: 'Minimal',
  description: 'A clean, minimalist design focusing on content with elegant typography and spacing.',
  thumbnail: '/thumbnails/resume-minimal.png',
  // Add the missing properties
  category: 'Simple',
  isPublic: true,
  htmlContent: `
    <div class="resume">
      <header class="header">
        <h1 class="name">{{name}}</h1>
        <p class="title">{{title}}</p>
        
        <div class="contact-info">
          <span class="contact-item">{{email}}</span>
          <span class="contact-separator">•</span>
          <span class="contact-item">{{phone}}</span>
          <span class="contact-separator">•</span>
          <span class="contact-item">{{address}}</span>
        </div>
      </header>
      
      <div class="section summary">
        {{professional-summary}}
      </div>
      
      <div class="section experience">
        <h2 class="section-title">Experience</h2>
        {{work-experience}}
      </div>
      
      <div class="section education">
        <h2 class="section-title">Education</h2>
        {{education}}
      </div>
      
      <div class="section skills">
        <h2 class="section-title">Skills</h2>
        {{skills}}
      </div>
      
      <div class="section projects">
        <h2 class="section-title">Projects</h2>
        {{projects}}
      </div>
      
      <div class="section certifications">
        <h2 class="section-title">Certifications</h2>
        {{certifications}}
      </div>
      
      <div class="section languages">
        <h2 class="section-title">Languages</h2>
        {{languages}}
      </div>
    </div>
  `,
  cssContent: `
    /* Minimal Template with clean typography */
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: 10pt;
      line-height: 1.4;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #fff;
    }
    
    .resume {
      max-width: 8.5in;
      margin: 0 auto;
      padding: 0.7in;
      background-color: #fff;
    }
    
    /* Header */
    .header {
      text-align: center;
      margin-bottom: 1.5em;
      padding-bottom: 1em;
      border-bottom: 1px solid #eee;
    }
    
    .name {
      font-size: 20pt;
      font-weight: 600;
      color: #111;
      margin: 0;
      letter-spacing: -0.02em;
    }
    
    .title {
      font-size: 12pt;
      font-weight: 400;
      color: #555;
      margin: 0.3em 0 1em;
    }
    
    .contact-info {
      font-size: 9pt;
      color: #555;
    }
    
    .contact-separator {
      margin: 0 0.5em;
      color: #ccc;
    }
    
    /* Section styling */
    .section {
      margin-bottom: 1.5em;
    }
    
    .section-title {
      font-size: 12pt;
      font-weight: 600;
      color: #111;
      margin: 0 0 0.7em;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
    
    /* Summary section */
    .summary-content {
      font-size: 10pt;
      line-height: 1.5;
      color: #333;
    }
    
    /* Experience section */
    .experience-item {
      margin-bottom: 1.2em;
    }
    
    .job-title {
      font-size: 11pt;
      font-weight: 600;
      color: #111;
      margin: 0;
    }
    
    .company {
      font-size: 11pt;
      font-weight: 500;
      color: #333;
      margin: 0;
    }
    
    .experience-details {
      display: flex;
      justify-content: space-between;
      margin: 0.2em 0 0.5em;
    }
    
    .job-location {
      font-size: 9pt;
      color: #555;
    }
    
    .experience-date {
      font-size: 9pt;
      color: #555;
    }
    
    .job-description {
      font-size: 10pt;
      margin: 0.5em 0;
      color: #444;
    }
    
    /* Education section */
    .education-item {
      margin-bottom: 1.2em;
    }
    
    .degree {
      font-size: 11pt;
      font-weight: 600;
      color: #111;
      margin: 0;
    }
    
    .institution {
      font-size: 11pt;
      font-weight: 500;
      color: #333;
      margin: 0;
    }
    
    .education-details {
      display: flex;
      justify-content: space-between;
      margin: 0.2em 0 0.5em;
    }
    
    .institution-location {
      font-size: 9pt;
      color: #555;
    }
    
    .education-date {
      font-size: 9pt;
      color: #555;
    }
    
    /* Skills section */
    .skills-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5em;
      margin-top: 0.5em;
    }
    
    .skill-item {
      font-size: 10pt;
      color: #333;
      padding: 0.2em 0.6em;
      background-color: #f5f5f5;
      border-radius: 3px;
    }
    
    /* Projects section */
    .project-item {
      margin-bottom: 1.2em;
    }
    
    .project-name {
      font-size: 11pt;
      font-weight: 600;
      color: #111;
      margin: 0;
    }
    
    .project-description {
      font-size: 10pt;
      margin: 0.5em 0;
      color: #444;
    }
    
    .project-technologies {
      font-size: 9pt;
      color: #555;
      font-style: italic;
    }
    
    /* Certifications section */
    .certification-item {
      margin-bottom: 0.8em;
    }
    
    .certification-name {
      font-size: 10pt;
      font-weight: 500;
      color: #111;
      margin: 0;
    }
    
    .certification-details {
      font-size: 9pt;
      color: #555;
      margin: 0.2em 0 0;
    }
    
    /* Languages section */
    .languages-list {
      display: flex;
      flex-wrap: wrap;
      gap: 1em;
    }
    
    .language-item {
      margin-bottom: 0.5em;
    }
    
    .language-name {
      font-weight: 500;
      margin-right: 0.5em;
    }
    
    .language-proficiency {
      font-size: 9pt;
      color: #555;
    }
    
    /* Achievements lists */
    .achievements-list {
      margin: 0.5em 0;
      padding-left: 1.2em;
    }
    
    .achievements-list li {
      font-size: 10pt;
      margin-bottom: 0.3em;
      color: #444;
    }
    
    /* Print styles */
    @media print {
      body {
        font-size: 10pt;
      }
      
      .resume {
        padding: 0;
        max-width: none;
      }
      
      /* Ensure content doesn't get cut off between pages */
      .experience-item, .education-item, .project-item {
        page-break-inside: avoid;
      }
      
      /* Ensure section headers don't appear at the bottom of a page */
      .section-title {
        page-break-after: avoid;
      }
    }
  `
};

export default minimalTemplate;