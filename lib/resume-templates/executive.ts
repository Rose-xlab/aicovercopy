// lib/resume-templates/executive.ts
import { ResumeTemplate } from '@/types/resume';

const executiveTemplate: ResumeTemplate = {
  id: 'executive-resume',
  name: 'Executive',
  description: 'A sophisticated, elegant template focused on leadership achievements for senior professionals and executives.',
  thumbnail: '/thumbnails/resume-executive.png',
  category: 'Professional',
  isPublic: true,
  htmlContent: `
    <div class="resume">
      <header class="header">
        <div class="name-title">
          <h1 class="name">{{name}}</h1>
          <div class="title-divider"></div>
          <h2 class="title">{{title}}</h2>
        </div>
        <div class="contact-info">
          <div class="contact-row">
            <div class="contact-item">{{email}}</div>
            <div class="contact-item">{{phone}}</div>
          </div>
          <div class="contact-row">
            <div class="contact-item">{{address}}</div>
            <div class="contact-item">{{linkedin}}</div>
          </div>
        </div>
      </header>
      
      <div class="executive-summary">
        {{professional-summary}}
      </div>
      
      <section class="core-competencies">
        <h3 class="section-heading">Core Competencies</h3>
        {{skills}}
      </section>
      
      <section class="experience">
        <h3 class="section-heading">Professional Experience</h3>
        {{work-experience}}
      </section>
      
      <section class="education">
        <h3 class="section-heading">Education</h3>
        {{education}}
      </section>
      
      <section class="additional-sections">
        <div class="two-column">
          <div class="column">
            <h3 class="section-heading">Certifications</h3>
            {{certifications}}
          </div>
          <div class="column">
            <h3 class="section-heading">Languages</h3>
            {{languages}}
          </div>
        </div>
      </section>
      
      <footer class="footer">
        <div class="footer-line"></div>
        <div class="footer-text">References available upon request</div>
      </footer>
    </div>
  `,
  cssContent: `
    /* Executive Template with sophisticated styling for senior professionals */
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Roboto:wght@300;400;500&display=swap');
    
    :root {
      --primary: #0d2036; /* Deep navy blue */
      --secondary: #b8860b; /* Gold */
      --text: #1a1a1a;
      --text-light: #666666;
      --background: #ffffff;
      --divider: #e0e0e0;
      --accent: #f5f5f5;
    }
    
    body {
      font-family: 'Roboto', 'Helvetica Neue', Arial, sans-serif;
      font-size: 10.5pt;
      line-height: 1.6;
      color: var(--text);
      margin: 0;
      padding: 0;
      background-color: var(--background);
      font-weight: 300;
    }
    
    .resume {
      max-width: 8.5in;
      margin: 0 auto;
      padding: 0.75in;
      background-color: var(--background);
    }
    
    /* Header styling */
    .header {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 0.5in;
      text-align: center;
    }
    
    .name {
      font-family: 'Cormorant Garamond', serif;
      font-size: 28pt;
      font-weight: 700;
      color: var(--primary);
      margin: 0;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
    
    .title-divider {
      width: 2in;
      height: 1px;
      background-color: var(--secondary);
      margin: 0.1in auto 0.1in;
    }
    
    .title {
      font-family: 'Cormorant Garamond', serif;
      font-size: 16pt;
      font-weight: 500;
      color: var(--text-light);
      margin: 0;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }
    
    .contact-info {
      margin-top: 0.25in;
      font-size: 10pt;
      color: var(--text-light);
      text-align: center;
    }
    
    .contact-row {
      display: flex;
      justify-content: center;
      gap: 0.5in;
      margin-bottom: 0.1in;
    }
    
    /* Executive Summary */
    .executive-summary {
      font-size: 11pt;
      line-height: 1.7;
      margin-bottom: 0.5in;
      text-align: justify;
      border-left: 1px solid var(--secondary);
      border-right: 1px solid var(--secondary);
      padding: 0 0.25in;
      font-weight: 300;
    }
    
    /* Section styling */
    .section-heading {
      font-family: 'Cormorant Garamond', serif;
      font-size: 14pt;
      font-weight: 600;
      color: var(--primary);
      margin: 0 0 0.2in 0;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      border-bottom: 1px solid var(--divider);
      padding-bottom: 0.05in;
      position: relative;
    }
    
    .section-heading::after {
      content: "";
      position: absolute;
      bottom: -1px;
      left: 0;
      width: 1in;
      height: 1px;
      background-color: var(--secondary);
    }
    
    /* Core Competencies */
    .core-competencies {
      margin-bottom: 0.5in;
    }
    
    .skills-list {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 0.2in;
      margin-top: 0.25in;
    }
    
    .skill-category {
      margin-bottom: 0.25in;
    }
    
    .category-heading {
      font-weight: 500;
      font-size: 11pt;
      color: var(--primary);
      margin: 0 0 0.1in 0;
      border-bottom: 1px solid var(--divider);
      padding-bottom: 0.05in;
    }
    
    .skill-item {
      font-size: 10pt;
      background-color: var(--accent);
      padding: 0.05in 0.15in;
      border-radius: 3px;
      border-left: 2px solid var(--secondary);
    }
    
    /* Experience section */
    .experience {
      margin-bottom: 0.5in;
    }
    
    .experience-item {
      margin-bottom: 0.3in;
      page-break-inside: avoid;
    }
    
    .experience-header {
      display: flex;
      flex-direction: column;
      margin-bottom: 0.1in;
    }
    
    @media (min-width: 600px) {
      .experience-header {
        flex-direction: row;
        justify-content: space-between;
        align-items: baseline;
      }
    }
    
    .job-title-company {
      flex: 1;
    }
    
    .job-title {
      font-family: 'Cormorant Garamond', serif;
      font-size: 13pt;
      font-weight: 600;
      color: var(--primary);
      margin: 0;
    }
    
    .company {
      font-size: 11pt;
      font-weight: 500;
      color: var(--text);
      margin: 0.05in 0 0 0;
    }
    
    .experience-date {
      font-size: 10pt;
      color: var(--text-light);
      font-style: italic;
    }
    
    .job-location {
      font-size: 10pt;
      color: var(--text-light);
      margin-bottom: 0.1in;
    }
    
    .job-description {
      font-size: 10pt;
      margin-bottom: 0.1in;
      text-align: justify;
    }
    
    /* Education section */
    .education {
      margin-bottom: 0.5in;
    }
    
    .education-item {
      margin-bottom: 0.25in;
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
      font-family: 'Cormorant Garamond', serif;
      font-size: 12pt;
      font-weight: 600;
      color: var(--primary);
      margin: 0;
    }
    
    .institution {
      font-size: 11pt;
      font-weight: 500;
      color: var(--text);
      margin: 0.05in 0 0 0;
    }
    
    .education-date {
      font-size: 10pt;
      color: var(--text-light);
      font-style: italic;
    }
    
    .education-description {
      font-size: 10pt;
    }
    
    /* Additional sections */
    .additional-sections {
      margin-bottom: 0.3in;
    }
    
    .two-column {
      display: grid;
      grid-template-columns: 1fr;
      gap: 0.3in;
    }
    
    @media (min-width: 768px) {
      .two-column {
        grid-template-columns: 1fr 1fr;
      }
    }
    
    /* Certifications */
    .certification-item {
      margin-bottom: 0.15in;
    }
    
    .certification-name {
      font-weight: 500;
      font-size: 11pt;
      color: var(--primary);
      margin: 0;
    }
    
    .certification-details {
      font-size: 10pt;
      color: var(--text-light);
      margin-top: 0.05in;
    }
    
    /* Languages */
    .language-item {
      margin-bottom: 0.1in;
      display: flex;
      justify-content: space-between;
    }
    
    .language-name {
      font-weight: 500;
      font-size: 11pt;
      color: var(--primary);
    }
    
    .language-proficiency {
      font-size: 10pt;
      color: var(--text-light);
      font-style: italic;
    }
    
    /* Achievements lists */
    .achievements-list {
      margin: 0.1in 0;
      padding-left: 0.15in;
    }
    
    .achievements-list li {
      font-size: 10pt;
      margin-bottom: 0.08in;
      position: relative;
      list-style-type: none;
      text-align: justify;
    }
    
    .achievements-list li::before {
      content: "■";
      font-size: 7pt;
      position: absolute;
      left: -0.15in;
      top: 0.05in;
      color: var(--secondary);
    }
    
    /* Footer */
    .footer {
      margin-top: 0.5in;
      text-align: center;
    }
    
    .footer-line {
      height: 1px;
      background-color: var(--divider);
      margin-bottom: 0.1in;
      position: relative;
    }
    
    .footer-line::after {
      content: "";
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 2in;
      height: 1px;
      background-color: var(--secondary);
    }
    
    .footer-text {
      font-size: 9pt;
      color: var(--text-light);
      font-style: italic;
    }
    
    /* Print styles */
    @media print {
      body {
        font-size: 10.5pt;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      
      .resume {
        padding: 0.5in;
        max-width: none;
      }
      
      /* Ensure content doesn't get cut off between pages */
      .experience-item, .education-item, .skill-category {
        page-break-inside: avoid;
      }
      
      /* Ensure section headers don't appear at the bottom of a page */
      .section-heading {
        page-break-after: avoid;
      }
      
      /* Make sure text is dark enough for printing */
      .name, .title, .job-title, .company,
      .degree, .institution, .certification-name,
      .language-name, .skill-item, .category-heading {
        color: black !important;
      }
      
      /* Make sure accent colors print */
      .section-heading::after, .title-divider, .skill-item,
      .footer-line::after, .achievements-list li::before {
        color: black !important;
        background-color: black !important;
      }
    }
  `
};

export default executiveTemplate;