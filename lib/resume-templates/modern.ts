// lib/resume-templates/modern.ts
import { ResumeTemplate } from '@/types/resume';

const modernTemplate: ResumeTemplate = {
  id: 'modern-resume',
  name: 'Modern',
  description: 'A sleek, contemporary design with clean lines and a two-column layout.',
  thumbnail: '/thumbnails/resume-modern.png',
  category: 'Professional', // Added missing property with correct case
  isPublic: true, // Added missing property
  htmlContent: `
    <div class="resume">
      <div class="sidebar">
        <div class="profile">
          <h1 class="name">{{name}}</h1>
          <h2 class="title">{{title}}</h2>
        </div>
        
        <div class="section contact">
          <h3 class="section-title">Contact</h3>
          <div class="contact-details">
            <div class="contact-item">
              <span class="contact-icon">📧</span>
              <span class="contact-text">{{email}}</span>
            </div>
            <div class="contact-item">
              <span class="contact-icon">📱</span>
              <span class="contact-text">{{phone}}</span>
            </div>
            <div class="contact-item">
              <span class="contact-icon">🌍</span>
              <span class="contact-text">{{address}}</span>
            </div>
            <div class="contact-item">
              <span class="contact-icon">🔗</span>
              <span class="contact-text">{{linkedin}}</span>
            </div>
            <div class="contact-item">
              <span class="contact-icon">🌐</span>
              <span class="contact-text">{{website}}</span>
            </div>
          </div>
        </div>
        
        <div class="section skills">
          <h3 class="section-title">Skills</h3>
          {{skills}}
        </div>
        
        <div class="section languages">
          <h3 class="section-title">Languages</h3>
          {{languages}}
        </div>
      </div>
      
      <div class="main-content">
        <div class="section summary">
          {{professional-summary}}
        </div>
        
        <div class="section experience">
          <h3 class="section-title">Work Experience</h3>
          {{work-experience}}
        </div>
        
        <div class="section education">
          <h3 class="section-title">Education</h3>
          {{education}}
        </div>
        
        <div class="section projects">
          <h3 class="section-title">Projects</h3>
          {{projects}}
        </div>
        
        <div class="section certifications">
          <h3 class="section-title">Certifications</h3>
          {{certifications}}
        </div>
      </div>
    </div>
  `,
  cssContent: `
    /* Modern Template - Two-column layout with accent color */
    @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');
    
    body {
      font-family: 'Roboto', Arial, sans-serif;
      font-size: 10pt;
      line-height: 1.4;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #fff;
    }
    
    .resume {
      display: flex;
      max-width: 8.5in;
      margin: 0 auto;
      background-color: #fff;
    }
    
    /* Sidebar */
    .sidebar {
      width: 30%;
      padding: 0.8in 0.4in;
      background-color: #f7f9fa;
    }
    
    .profile {
      margin-bottom: 1.5em;
      text-align: center;
    }
    
    .name {
      font-size: 20pt;
      font-weight: 700;
      color: #2d3e50;
      margin: 0 0 0.2em 0;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .title {
      font-size: 12pt;
      font-weight: 400;
      color: #3498db;
      margin: 0;
    }
    
    /* Main Content */
    .main-content {
      width: 70%;
      padding: 0.8in 0.5in;
    }
    
    /* Section styling */
    .section {
      margin-bottom: 1.2em;
    }
    
    .section-title {
      font-size: 14pt;
      font-weight: 500;
      color: #2d3e50;
      margin: 0 0 0.6em 0;
      border-bottom: 1px solid #e0e0e0;
      padding-bottom: 0.2em;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    /* Contact section */
    .contact-details {
      display: flex;
      flex-direction: column;
      gap: 0.3em;
    }
    
    .contact-item {
      display: flex;
      align-items: center;
      gap: 0.5em;
      margin-bottom: 0.2em;
    }
    
    .contact-icon {
      font-size: 12pt;
      min-width: 20px;
    }
    
    .contact-text {
      font-size: 9pt;
      word-break: break-word;
    }
    
    /* Skills section */
    .skills-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.3em;
    }
    
    .skill-item {
      background-color: #eef2f5;
      border-radius: 100px;
      padding: 0.2em 0.6em;
      font-size: 9pt;
      color: #2d3e50;
    }
    
    .skill-level {
      font-size: 8pt;
      color: #677788;
      margin-left: 0.3em;
    }
    
    /* Experience and Education sections */
    .experience-item,
    .education-item {
      margin-bottom: 1em;
    }
    
    .job-title,
    .degree {
      font-size: 11pt;
      font-weight: 500;
      color: #2d3e50;
      margin: 0;
    }
    
    .company,
    .institution {
      font-size: 10pt;
      font-weight: 500;
      color: #3498db;
      margin: 0.2em 0;
    }
    
    .experience-date,
    .education-date {
      font-size: 9pt;
      color: #677788;
      font-style: italic;
    }
    
    .job-location,
    .institution-location {
      font-size: 9pt;
      color: #677788;
    }
    
    .job-description,
    .education-description {
      font-size: 9pt;
      margin: 0.5em 0;
    }
    
    /* Projects section */
    .project-item {
      margin-bottom: 1em;
    }
    
    .project-name {
      font-size: 11pt;
      font-weight: 500;
      color: #2d3e50;
      margin: 0;
    }
    
    .project-description {
      font-size: 9pt;
      margin: 0.5em 0;
    }
    
    .project-technologies {
      font-size: 9pt;
      color: #677788;
    }
    
    /* Certifications section */
    .certification-item {
      margin-bottom: 0.8em;
    }
    
    .certification-name {
      font-size: 10pt;
      font-weight: 500;
      color: #2d3e50;
      margin: 0;
    }
    
    .certification-issuer {
      font-size: 9pt;
      color: #677788;
    }
    
    .certification-date {
      font-size: 9pt;
      color: #677788;
      font-style: italic;
    }
    
    /* Languages section */
    .language-item {
      margin-bottom: 0.5em;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .language-name {
      font-size: 10pt;
      font-weight: 400;
    }
    
    .language-proficiency {
      font-size: 9pt;
      color: #3498db;
    }
    
    /* Achievements lists */
    .achievements-list {
      margin: 0.5em 0;
      padding-left: 1.2em;
    }
    
    .achievements-list li {
      font-size: 9pt;
      margin-bottom: 0.3em;
    }
    
    /* Media queries for responsive design */
    @media screen and (max-width: 768px) {
      .resume {
        flex-direction: column;
      }
      
      .sidebar,
      .main-content {
        width: 100%;
        padding: 0.5in 0.3in;
      }
    }
    
    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      
      .resume {
        box-shadow: none;
      }
      
      .sidebar {
        background-color: #f7f9fa !important;
      }
    }
  `
};

export default modernTemplate;