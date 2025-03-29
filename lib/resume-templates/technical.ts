// lib/resume-templates/technical.ts
import { ResumeTemplate } from '@/types/resume';

const technicalTemplate: ResumeTemplate = {
  id: 'technical-resume',
  name: 'Technical',
  description: 'A focused template optimized for technical positions with skills visualization and code-like elements.',
  thumbnail: '/thumbnails/resume-technical.png',
  category: 'Professional',
  isPublic: true,
  htmlContent: `
    <div class="resume">
      <header class="header">
        <div class="header-main">
          <h1 class="name">{{name}}</h1>
          <h2 class="title">{{title}}</h2>
        </div>
        
        <div class="header-contact">
          <div class="contact-grid">
            <div class="contact-item">
              <span class="contact-icon">@</span>
              <span class="contact-text">{{email}}</span>
            </div>
            <div class="contact-item">
              <span class="contact-icon">#</span>
              <span class="contact-text">{{phone}}</span>
            </div>
            <div class="contact-item">
              <span class="contact-icon">≈</span>
              <span class="contact-text">{{address}}</span>
            </div>
            <div class="contact-item">
              <span class="contact-icon">→</span>
              <span class="contact-text">{{website}}</span>
            </div>
          </div>
        </div>
      </header>
      
      <div class="content-grid">
        <main class="main-content">
          <section class="section summary">
            <div class="section-header">
              <div class="section-title-wrapper">
                <h3 class="section-title">Professional Summary</h3>
                <div class="section-line"></div>
              </div>
            </div>
            <div class="section-content">
              {{professional-summary}}
            </div>
          </section>
          
          <section class="section experience">
            <div class="section-header">
              <div class="section-title-wrapper">
                <h3 class="section-title">Work Experience</h3>
                <div class="section-line"></div>
              </div>
            </div>
            <div class="section-content">
              {{work-experience}}
            </div>
          </section>
          
          <section class="section education">
            <div class="section-header">
              <div class="section-title-wrapper">
                <h3 class="section-title">Education</h3>
                <div class="section-line"></div>
              </div>
            </div>
            <div class="section-content">
              {{education}}
            </div>
          </section>
          
          <section class="section projects">
            <div class="section-header">
              <div class="section-title-wrapper">
                <h3 class="section-title">Projects</h3>
                <div class="section-line"></div>
              </div>
            </div>
            <div class="section-content">
              {{projects}}
            </div>
          </section>
        </main>
        
        <aside class="sidebar">
          <section class="section skills">
            <div class="section-header">
              <div class="section-title-wrapper">
                <h3 class="section-title">Technical Skills</h3>
                <div class="section-line"></div>
              </div>
            </div>
            <div class="section-content">
              {{skills}}
            </div>
          </section>
          
          <section class="section certifications">
            <div class="section-header">
              <div class="section-title-wrapper">
                <h3 class="section-title">Certifications</h3>
                <div class="section-line"></div>
              </div>
            </div>
            <div class="section-content">
              {{certifications}}
            </div>
          </section>
          
          <section class="section languages">
            <div class="section-header">
              <div class="section-title-wrapper">
                <h3 class="section-title">Languages</h3>
                <div class="section-line"></div>
              </div>
            </div>
            <div class="section-content">
              {{languages}}
            </div>
          </section>
        </aside>
      </div>
    </div>
  `,
  cssContent: `
    /* Technical Template with coding-inspired elements */
    @import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600&family=Source+Sans+Pro:wght@400;600;700&display=swap');
    
    :root {
      --primary: #2d3748; /* Dark blue-gray */
      --secondary: #4299e1; /* Blue */
      --accent: #48bb78; /* Green */
      --background: #ffffff;
      --text: #1a202c;
      --text-muted: #718096;
      --border: #e2e8f0;
      --hover: #ebf8ff;
      --code-bg: #f1f3f5;
    }
    
    body {
      font-family: 'Source Sans Pro', sans-serif;
      font-size: 10pt;
      line-height: 1.5;
      color: var(--text);
      margin: 0;
      padding: 0;
      background-color: var(--background);
    }
    
    .resume {
      max-width: 8.5in;
      margin: 0 auto;
      padding: 0.5in;
      background-color: var(--background);
    }
    
    /* Header */
    .header {
      display: flex;
      flex-direction: column;
      margin-bottom: 0.4in;
      padding-bottom: 0.2in;
      border-bottom: 1px solid var(--border);
    }
    
    @media (min-width: 600px) {
      .header {
        flex-direction: row;
        justify-content: space-between;
        align-items: flex-end;
      }
    }
    
    .name {
      font-family: 'Fira Code', monospace;
      font-size: 20pt;
      font-weight: 600;
      color: var(--primary);
      margin: 0;
      position: relative;
    }
    
    .name::before {
      content: "const ";
      color: var(--secondary);
      font-size: 16pt;
      font-weight: 400;
    }
    
    .name::after {
      content: " = {";
      color: var(--text);
      font-size: 16pt;
      font-weight: 400;
    }
    
    .title {
      font-family: 'Fira Code', monospace;
      font-size: 12pt;
      font-weight: 400;
      color: var(--text-muted);
      margin: 0.1in 0 0 0.3in;
      position: relative;
    }
    
    .title::before {
      content: "role: ";
      color: var(--accent);
      font-weight: 500;
    }
    
    .title::after {
      content: ",";
      color: var(--text-muted);
    }
    
    .header-contact {
      margin-top: 0.2in;
    }
    
    .contact-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(1.5in, 1fr));
      gap: 0.1in;
    }
    
    .contact-item {
      display: flex;
      align-items: center;
      font-family: 'Fira Code', monospace;
      font-size: 9pt;
    }
    
    .contact-icon {
      display: inline-block;
      width: 0.2in;
      height: 0.2in;
      text-align: center;
      line-height: 0.2in;
      margin-right: 0.1in;
      color: var(--secondary);
      font-weight: bold;
    }
    
    .contact-text {
      color: var(--text-muted);
    }
    
    /* Content Grid */
    .content-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 0.3in;
    }
    
    @media (min-width: 768px) {
      .content-grid {
        grid-template-columns: 2fr 1fr;
      }
    }
    
    /* Sections */
    .section {
      margin-bottom: 0.4in;
    }
    
    .section-header {
      margin-bottom: 0.2in;
    }
    
    .section-title-wrapper {
      display: flex;
      align-items: center;
      margin-bottom: 0.1in;
    }
    
    .section-title {
      font-family: 'Fira Code', monospace;
      font-size: 12pt;
      font-weight: 600;
      color: var(--secondary);
      margin: 0;
      position: relative;
      text-transform: uppercase;
    }
    
    .section-title::before {
      content: "// ";
      color: var(--accent);
      font-size: 10pt;
    }
    
    .section-line {
      flex: 1;
      height: 1px;
      background-color: var(--border);
      margin-left: 0.1in;
    }
    
    /* Experience section */
    .experience-item {
      margin-bottom: 0.3in;
      position: relative;
    }
    
    .job-title {
      font-weight: 600;
      font-size: 11pt;
      color: var(--primary);
      margin: 0;
    }
    
    .company {
      font-weight: 600;
      font-size: 10pt;
      color: var(--secondary);
      margin: 0.05in 0;
    }
    
    .experience-details {
      display: flex;
      justify-content: space-between;
      font-size: 9pt;
      color: var(--text-muted);
      margin-bottom: 0.1in;
    }
    
    /* Skills section */
    .skills-list {
      display: flex;
      flex-direction: column;
      gap: 0.1in;
    }
    
    .skill-category {
      margin-bottom: 0.2in;
    }
    
    .category-heading {
      font-family: 'Fira Code', monospace;
      font-size: 10pt;
      font-weight: 600;
      color: var(--primary);
      margin: 0 0 0.1in 0;
      padding-left: 0.1in;
      border-left: 2px solid var(--accent);
    }
    
    .skill-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.05in 0.1in;
      background-color: var(--code-bg);
      margin-bottom: 0.05in;
      border-radius: 3px;
    }
    
    .skill-name {
      font-family: 'Fira Code', monospace;
      font-size: 9pt;
      color: var(--primary);
    }
    
    .skill-level-wrapper {
      display: flex;
      align-items: center;
      width: 0.8in;
    }
    
    .skill-level {
      height: 0.1in;
      background-color: var(--border);
      flex: 1;
      border-radius: 2px;
      overflow: hidden;
      position: relative;
    }
    
    .skill-level-fill {
      position: absolute;
      left: 0;
      top: 0;
      height: 100%;
      background-color: var(--secondary);
    }
    
    .skill-level-text {
      font-family: 'Fira Code', monospace;
      font-size: 8pt;
      margin-left: 0.05in;
      color: var(--text-muted);
    }
    
    /* Education section */
    .education-item {
      margin-bottom: 0.3in;
    }
    
    .degree {
      font-weight: 600;
      font-size: 11pt;
      color: var(--primary);
      margin: 0;
    }
    
    .institution {
      font-weight: 600;
      font-size: 10pt;
      color: var(--secondary);
      margin: 0.05in 0;
    }
    
    .education-details {
      display: flex;
      justify-content: space-between;
      font-size: 9pt;
      color: var(--text-muted);
      margin-bottom: 0.1in;
    }
    
    /* Projects section */
    .project-item {
      margin-bottom: 0.25in;
      padding: 0.1in;
      border: 1px solid var(--border);
      border-radius: 3px;
      transition: background-color 0.2s;
    }
    
    .project-item:hover {
      background-color: var(--hover);
    }
    
    .project-name {
      font-weight: 600;
      font-size: 11pt;
      color: var(--primary);
      margin: 0 0 0.05in 0;
    }
    
    .project-description {
      font-size: 9pt;
      margin: 0.05in 0;
    }
    
    .project-technologies {
      display: flex;
      flex-wrap: wrap;
      gap: 0.05in;
      margin-top: 0.1in;
    }
    
    .technology-tag {
      font-family: 'Fira Code', monospace;
      font-size: 8pt;
      padding: 0.02in 0.06in;
      background-color: var(--code-bg);
      color: var(--secondary);
      border-radius: 2px;
    }
    
    /* Certifications section */
    .certification-item {
      margin-bottom: 0.15in;
      padding-left: 0.1in;
      position: relative;
    }
    
    .certification-item::before {
      content: "✓";
      position: absolute;
      left: 0;
      color: var(--accent);
      font-weight: bold;
    }
    
    .certification-name {
      font-weight: 600;
      font-size: 10pt;
      color: var(--primary);
      margin: 0;
    }
    
    .certification-issuer {
      font-size: 9pt;
      color: var(--text-muted);
    }
    
    .certification-date {
      font-size: 8pt;
      color: var(--text-muted);
    }
    
    /* Languages section */
    .language-item {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.1in;
    }
    
    .language-name {
      font-weight: 600;
      font-size: 10pt;
      color: var(--primary);
    }
    
    .language-proficiency {
      font-family: 'Fira Code', monospace;
      font-size: 9pt;
      color: var(--secondary);
    }
    
    /* Achievements lists */
    .achievements-list {
      margin: 0.1in 0;
      padding-left: 0.15in;
    }
    
    .achievements-list li {
      font-size: 9pt;
      margin-bottom: 0.08in;
      position: relative;
      list-style-type: none;
    }
    
    .achievements-list li::before {
      content: ">";
      font-family: 'Fira Code', monospace;
      position: absolute;
      left: -0.15in;
      color: var(--accent);
    }
    
    /* Summary section */
    .summary-content {
      font-size: 10pt;
      line-height: 1.5;
      border-left: 2px solid var(--secondary);
      padding-left: 0.1in;
    }
    
    /* Print styles */
    @media print {
      body {
        font-size: 10pt;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      
      .resume {
        padding: 0.25in;
        max-width: none;
      }
      
      /* Ensure content doesn't get cut off between pages */
      .experience-item, .education-item, .project-item {
        page-break-inside: avoid;
      }
      
      /* Ensure section headers don't appear at the bottom of a page */
      .section-header {
        page-break-after: avoid;
      }
      
      /* Colors need to be explicitly marked for printing */
      .name::before, .name::after,
      .title::before, .title::after,
      .section-title::before,
      .section-title, .company, .institution,
      .contact-icon, .skill-level-fill, 
      .technology-tag, .language-proficiency,
      .certification-item::before, 
      .achievements-list li::before {
        color: currentColor !important;
      }
    }
  `
};

export default technicalTemplate;