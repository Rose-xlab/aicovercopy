import { Template } from '@/types/templates';

const projectManagementTemplate: Template = {
  id: 'project-management',
  name: 'Project Leadership',
  description: 'A premium, structured layout with modern accents for project leaders, managers, and business professionals.',
  tags: ['Professional', 'Business', 'Project Management', 'Leadership', 'ATS-Friendly'],
  category: 'business',
  is_public: true,
  created_at: new Date().toISOString(),
  html_content: `
    <div class="cover-letter">
      <div class="header">
        <div class="name-section">
          <div class="name-accent"></div>
          <h1 class="name">{{name}}</h1>
          <div class="title-text">Project Manager</div>
        </div>
        <div class="initials-section">
          <div class="initials-container">
            <div class="initials-accent"></div>
            <div class="initials">{{initials}}</div>
          </div>
        </div>
      </div>
      
      <div class="contact-info">
        <div class="contact-wrapper">
          <div class="contact-marker"></div>
          {{header}}
        </div>
      </div>
      
      <div class="letter-content">
        <div class="date-recipient">
          <div class="date-container">
            <div class="date-accent"></div>
            <p class="date">{{date}}</p>
          </div>
          <div class="recipient">
            <p class="recipient-name">{{recipient-name}}</p>
            <p class="recipient-title">{{recipient-title}}</p>
            <p class="recipient-company">{{recipient-company}}</p>
            <p class="recipient-address">{{recipient-address}}</p>
            <p class="recipient-city">{{recipient-city}}</p>
          </div>
        </div>
        
        <div class="greeting">
          {{greeting}}
        </div>
        
        <div class="introduction">
          {{introduction}}
        </div>
        
        <div class="body">
          {{body}}
        </div>
        
        <div class="project-highlights">
          <div class="project-accent"></div>
          <div class="project-title">Project Highlights & Qualifications</div>
        </div>
        
        <div class="conclusion">
          {{conclusion}}
        </div>
        
        <div class="signature-section">
          <div class="signature">
            {{signature}}
          </div>
          <div class="signature-line"></div>
        </div>
      </div>
      
      <div class="footer">
        <div class="footer-accent"></div>
        <div class="footer-text">Project Management Professional</div>
      </div>
    </div>
  `,
  css_content: `
    /* Base responsive styles */
    @media screen {
      html {
        font-size: 100%;
      }
    }
    
    body {
      font-family: 'Calibri', 'Segoe UI', 'Arial', sans-serif;
      font-size: 11pt;
      line-height: 1.5;
      color: #2d3436;
      margin: 0;
      padding: 0;
      max-width: 100%;
      overflow-x: hidden;
      background-color: #ffffff;
    }
    
    .cover-letter {
      max-width: 100%;
      margin: 0 auto;
      padding: 1.2rem;
      position: relative;
      color: #2d3436;
    }
    
    /* Header styling */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      position: relative;
    }
    
    .name-section {
      position: relative;
      padding-left: 0.8rem;
    }
    
    .name-accent {
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 4px;
      height: 70%;
      background-color: #8e44ad;
      border-radius: 2px;
    }
    
    .name {
      font-size: 20pt;
      font-weight: bold;
      margin: 0;
      color: #2d3436;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    .title-text {
      font-size: 11pt;
      color: #8e44ad;
      margin-top: 0.2rem;
      font-weight: 500;
    }
    
    .initials-section {
      padding-left: 0.5rem;
    }
    
    .initials-container {
      position: relative;
    }
    
    .initials-accent {
      position: absolute;
      width: 100%;
      height: 100%;
      background-color: #8e44ad;
      border-radius: 5px;
      transform: rotate(3deg) scale(1.05);
      z-index: 0;
    }
    
    .initials {
      position: relative;
      width: 40px;
      height: 40px;
      background-color: #9b59b6;
      color: white;
      border-radius: 5px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 16pt;
      z-index: 1;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    /* Contact info styling */
    .contact-info {
      margin-bottom: 1.8rem;
      border-bottom: 1px solid #e8e8e8;
      padding-bottom: 0.8rem;
      font-size: 0.95rem;
      position: relative;
    }
    
    .contact-wrapper {
      position: relative;
      padding-left: 0.8rem;
    }
    
    .contact-marker {
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 3px;
      height: 70%;
      background-color: #9b59b6;
      opacity: 0.4;
      border-radius: 1.5px;
    }
    
    /* Date and recipient styling */
    .date-recipient {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1rem;
      margin-bottom: 1.8rem;
    }
    
    .date-container {
      position: relative;
      padding-left: 0.6rem;
    }
    
    .date-accent {
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 3px;
      height: 80%;
      background-color: #9b59b6;
      opacity: 0.6;
      border-radius: 1.5px;
    }
    
    .date {
      margin: 0;
      color: #2d3436;
      font-weight: 500;
    }
    
    .recipient p {
      margin: 0 0 0.25rem;
      line-height: 1.3;
    }
    
    .recipient-name {
      font-weight: 600;
      color: #2d3436;
    }
    
    .recipient-title {
      color: #636e72;
    }
    
    .recipient-company {
      font-weight: 500;
    }
    
    /* Content styling */
    .greeting {
      margin-bottom: 1.2rem;
      font-weight: 600;
      color: #2d3436;
    }
    
    .introduction p {
      margin-bottom: 1.2rem;
      text-align: justify;
      color: #2d3436;
    }
    
    .body p {
      margin-bottom: 1.2rem;
      text-align: justify;
      color: #2d3436;
    }
    
    .project-highlights {
      margin: 1.5rem 0;
      padding: 0.8rem;
      background-color: #f8f9fa;
      border-radius: 4px;
      position: relative;
      padding-left: 1.2rem;
      display: flex;
      align-items: center;
    }
    
    .project-accent {
      position: absolute;
      left: 0;
      top: 0;
      width: 4px;
      height: 100%;
      background-color: #8e44ad;
      border-radius: 2px;
    }
    
    .project-title {
      font-weight: 600;
      color: #2d3436;
    }
    
    .conclusion p {
      margin-bottom: 1.2rem;
      text-align: justify;
      color: #2d3436;
    }
    
    /* Signature styling */
    .signature-section {
      margin-top: 2rem;
      position: relative;
    }
    
    .signature {
      margin-bottom: 0.5rem;
      font-weight: 600;
      color: #2d3436;
    }
    
    .signature-line {
      width: 3rem;
      height: 2px;
      background: linear-gradient(to right, #8e44ad, transparent);
    }
    
    /* Footer styling */
    .footer {
      margin-top: 2.5rem;
      position: relative;
      display: flex;
      align-items: center;
      opacity: 0.7;
    }
    
    .footer-accent {
      width: 2rem;
      height: 2px;
      background-color: #8e44ad;
      margin-right: 0.8rem;
    }
    
    .footer-text {
      font-size: 0.9rem;
      color: #636e72;
      font-style: italic;
    }
    
    /* Desktop styles */
    @media screen and (min-width: 768px) {
      .cover-letter {
        max-width: 8.5in;
        padding: 1in;
      }
      
      .header {
        margin-bottom: 1.5rem;
      }
      
      .name {
        font-size: 24pt;
      }
      
      .title-text {
        font-size: 12pt;
      }
      
      .initials {
        width: 45px;
        height: 45px;
        font-size: 18pt;
      }
      
      .contact-info {
        margin-bottom: 2rem;
        padding-bottom: 1rem;
        font-size: 1rem;
      }
      
      .date-recipient {
        grid-template-columns: 1fr 2fr;
        margin-bottom: 2rem;
        gap: 2rem;
      }
      
      .greeting {
        margin-bottom: 1.5rem;
      }
      
      .introduction p, .body p, .conclusion p {
        margin-bottom: 1.2rem;
        line-height: 1.6;
      }
      
      .project-highlights {
        margin: 1.8rem 0;
        padding: 1rem;
        padding-left: 1.5rem;
      }
      
      .signature-section {
        margin-top: 2.5rem;
      }
      
      .footer {
        margin-top: 3rem;
      }
    }
    
    /* ATS-Friendly Print Styles */
    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      
      .cover-letter {
        padding: 0.5in;
      }
      
      /* Ensure consistent font for ATS readability */
      * {
        font-family: 'Calibri', 'Arial', sans-serif !important;
      }
      
      /* Ensure high contrast for ATS */
      .name, .body p, .introduction p, .conclusion p, .greeting, .project-title, .signature {
        color: #000000 !important;
      }
      
      /* Maintain structure elements with darker colors for printing */
      .name-accent, .initials-accent, .initials, .contact-marker, .date-accent, 
      .project-accent, .signature-line, .footer-accent {
        background-color: #6a1b9a !important;
      }
      
      .title-text {
        color: #6a1b9a !important;
      }
      
      .project-highlights {
        border: 1px solid #e0e0e0;
        background-color: #f9f9f9 !important;
      }
      
      /* Ensure the initials remain visible */
      .initials {
        background-color: #6a1b9a !important;
        color: white !important;
        border: 1px solid #6a1b9a !important;
      }
    }
  `
};

export default projectManagementTemplate;