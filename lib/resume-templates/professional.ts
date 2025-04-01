// lib/resume-templates/professional.ts
import { ResumeTemplate } from '@/types/resume';

const professionalTemplate: ResumeTemplate = {
  id: 'professional-resume',
  name: 'Professional',
  description: 'A clean, professional resume template with traditional formatting optimized for corporate positions and ATS systems.',
  thumbnail: '/thumbnails/resume-professional.png',
  category: 'Professional',
  isPublic: true,
  htmlContent: `
    <div class="resume">
      <header class="header">
        <div class="name-title">
          <h1 class="name">{{name}}</h1>
          <h2 class="title">{{title}}</h2>
        </div>
        <div class="contact">
          <div class="contact-row">
            <div class="contact-item">
              <span class="contact-label">Email:</span>
              <span class="contact-value">{{email}}</span>
            </div>
            <div class="contact-item">
              <span class="contact-label">Phone:</span>
              <span class="contact-value">{{phone}}</span>
            </div>
          </div>
          <div class="contact-row">
            <div class="contact-item">
              <span class="contact-label">Location:</span>
              <span class="contact-value">{{address}}</span>
            </div>
            <div class="contact-item">
              <span class="contact-label">LinkedIn:</span>
              <span class="contact-value">{{linkedin}}</span>
            </div>
          </div>
        </div>
      </header>
      
      <section class="summary-section">
        <h3 class="section-heading">Professional Summary</h3>
        <div class="section-content">
          {{professional-summary}}
        </div>
      </section>
      
      <section class="experience-section">
        <h3 class="section-heading">Work Experience</h3>
        <div class="section-content">
          {{work-experience}}
        </div>
      </section>
      
      <section class="internships-section">
        <h3 class="section-heading">Internships</h3>
        <div class="section-content">
          {{internships}}
        </div>
      </section>
      
      <section class="education-section">
        <h3 class="section-heading">Education</h3>
        <div class="section-content">
          {{education}}
        </div>
      </section>
      
      <section class="skills-section">
        <h3 class="section-heading">Skills</h3>
        <div class="section-content">
          {{skills}}
        </div>
      </section>
      
      <section class="projects-section">
        <h3 class="section-heading">Projects</h3>
        <div class="section-content">
          {{projects}}
        </div>
      </section>
      
      <section class="additional-info">
        <div class="two-column">
          <div class="column certifications-section">
            <h3 class="section-heading">Certifications</h3>
            <div class="section-content">
              {{certifications}}
            </div>
          </div>
          <div class="column languages-section">
            <h3 class="section-heading">Languages</h3>
            <div class="section-content">
              {{languages}}
            </div>
          </div>
        </div>
      </section>
      
      <section class="hobbies-section">
        <h3 class="section-heading">Hobbies & Interests</h3>
        <div class="section-content">
          {{interests}}
        </div>
      </section>
      
      <section class="references-section">
        <h3 class="section-heading">References</h3>
        <div class="section-content">
          {{references}}
          <div class="reference-text">{{reference-text}}</div>
        </div>
      </section>
      
      <section class="custom-sections">
        {{custom-sections}}
      </section>
    </div>
  `,
  cssContent: `
    /* Base styles with ATS compatibility */
    @import url('https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&family=Merriweather:wght@700&display=swap');
    
    /* Variables for consistent theming */
    :root {
      --primary: #2c3e50;
      --secondary: #3498db;
      --text-dark: #333333;
      --text-muted: #6c757d;
      --text-light: #ffffff;
      --background: #ffffff;
      --border: #dee2e6;
      --section-padding: 0.2in;
      --heading-family: 'Merriweather', Georgia, serif;
      --body-family: 'Lato', Arial, sans-serif;
    }
    
    body {
      font-family: var(--body-family);
      font-size: 11pt;
      line-height: 1.5;
      color: var(--text-dark);
      margin: 0;
      padding: 0;
      background-color: var(--background);
      -webkit-font-smoothing: antialiased;
    }
    
    .resume {
      max-width: 8.5in;
      margin: 0 auto;
      padding: 0.5in;
      background-color: var(--background);
    }
    
    /* Header styling */
    .header {
      display: flex;
      flex-direction: column;
      margin-bottom: 0.4in;
      border-bottom: 2px solid var(--primary);
      padding-bottom: 0.2in;
    }
    
    @media (min-width: 600px) {
      .header {
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
      }
    }
    
    .name {
      font-family: var(--heading-family);
      font-size: 24pt;
      font-weight: 700;
      margin: 0;
      color: var(--primary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    .title {
      font-family: var(--body-family);
      font-size: 14pt;
      font-weight: normal;
      margin: 0.1in 0 0 0;
      color: var(--secondary);
    }
    
    .contact {
      margin-top: 0.2in;
    }
    
    @media (min-width: 600px) {
      .contact {
        margin-top: 0;
        text-align: right;
      }
    }
    
    .contact-row {
      display: flex;
      flex-direction: column;
      gap: 0.1in;
      margin-bottom: 0.05in;
    }
    
    @media (min-width: 600px) {
      .contact-row {
        flex-direction: row;
        justify-content: flex-end;
        gap: 0.3in;
      }
    }
    
    .contact-item {
      white-space: nowrap;
    }
    
    .contact-label {
      font-weight: 700;
      color: var(--primary);
      margin-right: 0.05in;
    }
    
    .contact-value {
      color: var(--text-dark);
    }
    
    /* Section styling */
    section {
      margin-bottom: 0.3in;
    }
    
    .section-heading {
      font-family: var(--heading-family);
      font-size: 14pt;
      font-weight: 700;
      color: var(--primary);
      margin: 0 0 0.15in 0;
      border-bottom: 1px solid var(--border);
      padding-bottom: 0.05in;
      text-transform: uppercase;
    }
    
    .section-content {
      padding: 0.1in 0;
    }
    
    /* Summary section */
    .summary-content {
      font-size: 11pt;
      line-height: 1.6;
      text-align: justify;
    }
    
    /* Experience and Internship sections */
    .experience-item, .internship-item {
      margin-bottom: 0.2in;
      page-break-inside: avoid;
    }
    
    .experience-header, .internship-header {
      display: flex;
      flex-direction: column;
      margin-bottom: 0.1in;
    }
    
    @media (min-width: 600px) {
      .experience-header, .internship-header {
        flex-direction: row;
        justify-content: space-between;
        align-items: baseline;
      }
    }
    
    .job-title-company {
      flex: 1;
    }
    
    .job-title, .internship-position {
      font-weight: 700;
      font-size: 12pt;
      color: var(--primary);
      margin: 0;
    }
    
    .company, .internship-company {
      font-weight: 400;
      font-size: 11pt;
      color: var(--text-dark);
      margin: 0.05in 0 0 0;
    }
    
    .experience-date, .internship-date {
      font-style: italic;
      color: var(--text-muted);
      margin-top: 0.05in;
    }
    
    @media (min-width: 600px) {
      .experience-date, .internship-date {
        margin-top: 0;
      }
    }
    
    .job-location, .internship-location {
      color: var(--text-muted);
      font-size: 10pt;
      margin-bottom: 0.1in;
    }
    
    .job-description, .internship-description {
      margin-top: 0.05in;
      margin-bottom: 0.1in;
    }
    
    /* Education section */
    .education-item {
      margin-bottom: 0.2in;
      page-break-inside: avoid;
    }
    
    .education-header {
      display: flex;
      flex-direction: column;
      margin-bottom: 0.1in;
    }
    
    @media (min-width: 600px) {
      .education-header {
        flex-direction: row;
        justify-content: space-between;
        align-items: baseline;
      }
    }
    
    .degree-institution {
      flex: 1;
    }
    
    .degree {
      font-weight: 700;
      font-size: 12pt;
      color: var(--primary);
      margin: 0;
    }
    
    .institution {
      font-weight: 400;
      font-size: 11pt;
      color: var(--text-dark);
      margin: 0.05in 0 0 0;
    }
    
    .education-date {
      font-style: italic;
      color: var(--text-muted);
      margin-top: 0.05in;
    }
    
    @media (min-width: 600px) {
      .education-date {
        margin-top: 0;
      }
    }
    
    /* Skills section */
    .skill-category {
      margin-bottom: 0.2in;
    }
    
    .category-heading {
      font-weight: 700;
      font-size: 11pt;
      color: var(--primary);
      margin: 0 0 0.1in 0;
      border-bottom: 1px solid var(--border);
      padding-bottom: 0.05in;
    }
    
    .skills-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.1in;
    }
    
    .skill-item {
      background-color: #f8f9fa;
      padding: 0.05in 0.1in;
      border-radius: 4px;
      font-size: 10pt;
      border: 1px solid var(--border);
      display: flex;
      align-items: center;
    }
    
    .skill-name {
      margin-right: 0.05in;
    }
    
    .skill-level {
      color: var(--text-muted);
      font-size: 9pt;
      font-style: italic;
    }
    
    /* Projects section */
    .project-item {
      margin-bottom: 0.2in;
      page-break-inside: avoid;
    }
    
    .project-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 0.1in;
    }
    
    .project-name {
      font-weight: 700;
      font-size: 12pt;
      color: var(--primary);
      margin: 0;
    }
    
    .project-date {
      font-style: italic;
      color: var(--text-muted);
      font-size: 10pt;
    }
    
    .project-description {
      margin-bottom: 0.1in;
    }
    
    .project-technologies {
      font-size: 10pt;
      color: var(--text-muted);
    }
    
    .technologies-label {
      font-weight: 700;
    }
    
    /* Two-column layout for certifications and languages */
    .two-column {
      display: grid;
      grid-template-columns: 1fr;
      gap: 0.2in;
    }
    
    @media (min-width: 768px) {
      .two-column {
        grid-template-columns: 1fr 1fr;
      }
    }
    
    /* Certifications section */
    .certification-item {
      margin-bottom: 0.1in;
    }
    
    .certification-name {
      font-weight: 700;
      font-size: 11pt;
      color: var(--primary);
      margin: 0;
    }
    
    .certification-details {
      display: flex;
      flex-wrap: wrap;
      gap: 0.1in;
      font-size: 10pt;
      color: var(--text-muted);
      margin-top: 0.05in;
    }
    
    /* Languages section */
    .language-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.1in;
    }
    
    .language-name {
      font-weight: 700;
      color: var(--primary);
    }
    
    .language-proficiency {
      color: var(--text-muted);
      font-style: italic;
    }
    
    /* Hobbies & Interests section */
    .hobbies-section .section-content {
      display: flex;
      flex-wrap: wrap;
      gap: 0.1in;
    }
    
    .hobby-item {
      background-color: #f8f9fa;
      padding: 0.05in 0.1in;
      border-radius: 4px;
      font-size: 10pt;
      border: 1px solid var(--border);
    }
    
    .hobby-name {
      font-weight: 700;
      color: var(--primary);
    }
    
    .hobby-description {
      font-size: 10pt;
      color: var(--text-muted);
      margin-top: 0.05in;
    }
    
    /* References section */
    .reference-item {
      margin-bottom: 0.2in;
      page-break-inside: avoid;
      border-left: 2px solid var(--secondary);
      padding-left: 0.1in;
    }
    
    .reference-name {
      font-weight: 700;
      font-size: 12pt;
      color: var(--primary);
      margin: 0;
    }
    
    .reference-position {
      font-style: italic;
      font-size: 11pt;
      color: var(--text-dark);
      margin: 0.05in 0;
    }
    
    .reference-company {
      font-size: 11pt;
      color: var(--text-dark);
      margin: 0 0 0.05in 0;
    }
    
    .reference-contact {
      font-size: 10pt;
      color: var(--text-muted);
    }
    
    .reference-text {
      font-style: italic;
      color: var(--text-muted);
      margin-top: 0.1in;
      text-align: center;
    }
    
    /* Custom sections */
    .custom-section {
      margin-bottom: 0.3in;
      page-break-inside: avoid;
    }
    
    .custom-title {
      font-family: var(--heading-family);
      font-size: 14pt;
      font-weight: 700;
      color: var(--primary);
      margin: 0 0 0.15in 0;
      border-bottom: 1px solid var(--border);
      padding-bottom: 0.05in;
      text-transform: uppercase;
    }
    
    .custom-date {
      font-style: italic;
      color: var(--text-muted);
      margin: 0.05in 0;
    }
    
    .custom-location {
      color: var(--text-muted);
      font-size: 10pt;
      margin-bottom: 0.1in;
    }
    
    /* Achievements lists */
    .achievements-list {
      margin: 0.1in 0;
      padding-left: 0.2in;
    }
    
    .achievements-list li {
      margin-bottom: 0.08in;
      position: relative;
    }
    
    .achievements-list li::before {
      content: "•";
      position: absolute;
      left: -0.12in;
      color: var(--secondary);
    }
    
    /* Print styles for ATS compatibility */
    @media print {
      body {
        font-size: 11pt;
        line-height: 1.5;
        color: black;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      
      .resume {
        padding: 0.25in;
        max-width: none;
      }
      
      /* Ensure content doesn't get cut off between pages */
      .experience-item, .education-item, .project-item, .internship-item, .reference-item, .custom-section {
        page-break-inside: avoid;
      }
      
      /* Ensure section headers don't appear at the bottom of a page */
      .section-heading, .custom-title {
        page-break-after: avoid;
      }
      
      /* Increase contrast for better scanning */
      .name, .title, .job-title, .company, .degree, .institution, 
      .skill-item, .project-name, .certification-name, .language-name,
      .hobby-name, .reference-name, .internship-position, .internship-company, .custom-title {
        color: black !important;
      }
      
      .contact-label, .category-heading, .technologies-label {
        color: #333 !important;
      }
      
      .header {
        border-bottom-color: black !important;
      }
      
      .skill-item, .hobby-item {
        border: 1px solid #ccc !important;
      }
      
      .reference-item {
        border-left-color: #333 !important;
      }
    }
  `
};

export default professionalTemplate;