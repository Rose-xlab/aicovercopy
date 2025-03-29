// lib/resume-templates/creative.ts
import { ResumeTemplate } from '@/types/resume';

const creativeTemplate: ResumeTemplate = {
  id: 'creative-resume',
  name: 'Creative',
  description: 'A modern, visually striking template with bold elements for creative professionals.',
  thumbnail: '/thumbnails/resume-creative.png',
  category: 'Creative',
  isPublic: true,
  htmlContent: `
    <div class="resume">
      <div class="sidebar">
        <div class="profile">
          <div class="profile-circle"></div>
          <h1 class="name">{{name}}</h1>
          <p class="title">{{title}}</p>
        </div>
        
        <div class="section contact">
          <h3 class="section-title">
            <span class="section-icon">📱</span>
            Contact
          </h3>
          <div class="contact-details">
            <div class="contact-item">
              <span class="contact-value">{{email}}</span>
            </div>
            <div class="contact-item">
              <span class="contact-value">{{phone}}</span>
            </div>
            <div class="contact-item">
              <span class="contact-value">{{address}}</span>
            </div>
            <div class="contact-item">
              <span class="contact-value">{{website}}</span>
            </div>
          </div>
        </div>
        
        <div class="section skills">
          <h3 class="section-title">
            <span class="section-icon">🔧</span>
            Skills
          </h3>
          {{skills}}
        </div>
        
        <div class="section languages">
          <h3 class="section-title">
            <span class="section-icon">🌐</span>
            Languages
          </h3>
          {{languages}}
        </div>
      </div>
      
      <div class="main-content">
        <div class="section summary">
          <h3 class="section-title">
            <span class="accent-line"></span>
            About Me
          </h3>
          {{professional-summary}}
        </div>
        
        <div class="section experience">
          <h3 class="section-title">
            <span class="accent-line"></span>
            Work Experience
          </h3>
          {{work-experience}}
        </div>
        
        <div class="section education">
          <h3 class="section-title">
            <span class="accent-line"></span>
            Education
          </h3>
          {{education}}
        </div>
        
        <div class="section projects">
          <h3 class="section-title">
            <span class="accent-line"></span>
            Projects
          </h3>
          {{projects}}
        </div>
        
        <div class="section certifications">
          <h3 class="section-title">
            <span class="accent-line"></span>
            Certifications
          </h3>
          {{certifications}}
        </div>
      </div>
    </div>
  `,
  cssContent: `
    /* Creative Template with visual elements and bold colors */
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&family=Open+Sans:wght@300;400;600&display=swap');
    
    :root {
      --primary-color: #ff5252; /* Vibrant red */
      --secondary-color: #5c6bc0; /* Indigo */
      --text-dark: #333333;
      --text-light: #ffffff;
      --text-muted: #6c757d;
      --background-light: #ffffff;
      --background-sidebar: #f8f9fa;
      --accent-color: #ffca28; /* Amber */
    }
    
    body {
      font-family: 'Open Sans', Arial, sans-serif;
      font-size: 10pt;
      line-height: 1.5;
      color: var(--text-dark);
      margin: 0;
      padding: 0;
      background-color: var(--background-light);
    }
    
    .resume {
      display: grid;
      grid-template-columns: 1fr 2.5fr;
      max-width: 8.5in;
      min-height: 11in;
      margin: 0 auto;
      background-color: var(--background-light);
    }
    
    /* Sidebar */
    .sidebar {
      padding: 1.5in 0.6in 1in 0.6in;
      background-color: var(--background-sidebar);
      position: relative;
    }
    
    .sidebar::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 0.3in;
      background-color: var(--primary-color);
    }
    
    .profile {
      text-align: center;
      margin-bottom: 1.2in;
      position: relative;
    }
    
    .profile-circle {
      width: 1.8in;
      height: 1.8in;
      border-radius: 50%;
      background-color: var(--primary-color);
      margin: 0 auto 0.5in;
      position: relative;
      overflow: hidden;
    }
    
    .profile-circle::after {
      content: "";
      position: absolute;
      bottom: 0;
      right: 0;
      width: 0.6in;
      height: 0.6in;
      border-radius: 50%;
      background-color: var(--accent-color);
      transform: translate(30%, 30%);
    }
    
    .name {
      font-family: 'Montserrat', sans-serif;
      font-size: 16pt;
      font-weight: 700;
      color: var(--primary-color);
      margin: 0 0 0.1in 0;
      text-transform: uppercase;
      letter-spacing: 0.05in;
    }
    
    .title {
      font-family: 'Montserrat', sans-serif;
      font-size: 12pt;
      font-weight: 500;
      color: var(--text-muted);
      margin: 0;
      letter-spacing: 0.03in;
    }
    
    /* Contact section */
    .contact .section-title {
      color: var(--primary-color);
    }
    
    .contact-details {
      margin-top: 0.2in;
    }
    
    .contact-item {
      margin-bottom: 0.15in;
      position: relative;
    }
    
    .contact-value {
      display: block;
      font-size: 9pt;
      word-wrap: break-word;
      padding-left: 0.1in;
      border-left: 2px solid var(--accent-color);
    }
    
    /* Main Content */
    .main-content {
      padding: 1.5in 0.8in 1in 0.8in;
    }
    
    /* Section styling */
    .section {
      margin-bottom: 0.8in;
      position: relative;
    }
    
    .section-title {
      font-family: 'Montserrat', sans-serif;
      font-size: 14pt;
      font-weight: 600;
      color: var(--primary-color);
      margin: 0 0 0.3in 0;
      position: relative;
      text-transform: uppercase;
      letter-spacing: 0.05in;
    }
    
    .section-icon {
      margin-right: 0.1in;
      font-size: 12pt;
    }
    
    .accent-line {
      display: inline-block;
      width: 0.4in;
      height: 3px;
      background-color: var(--accent-color);
      margin-right: 0.15in;
      position: relative;
      top: -0.1in;
    }
    
    /* Skills section */
    .skills-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.2in;
      margin-top: 0.2in;
    }
    
    .skill-item {
      background-color: rgba(255, 82, 82, 0.1);
      border-radius: 100px;
      padding: 0.05in 0.15in;
      font-size: 9pt;
      color: var(--primary-color);
      display: inline-flex;
      align-items: center;
    }
    
    .skill-level {
      display: inline-block;
      width: 0.3in;
      height: 3px;
      background-color: var(--accent-color);
      margin-left: 0.08in;
    }
    
    /* Experience and Education sections */
    .experience-item,
    .education-item {
      margin-bottom: 0.4in;
      position: relative;
    }
    
    .experience-item::before,
    .education-item::before {
      content: "";
      position: absolute;
      left: -0.3in;
      top: 0.1in;
      width: 0.1in;
      height: 0.1in;
      background-color: var(--accent-color);
      border-radius: 50%;
    }
    
    .job-title,
    .degree {
      font-family: 'Montserrat', sans-serif;
      font-size: 12pt;
      font-weight: 600;
      color: var(--text-dark);
      margin: 0;
    }
    
    .company,
    .institution {
      font-size: 11pt;
      font-weight: 600;
      color: var(--primary-color);
      margin: 0.05in 0;
    }
    
    .experience-date,
    .education-date {
      font-size: 9pt;
      color: var(--text-muted);
      font-style: italic;
      margin-bottom: 0.1in;
    }
    
    .job-location,
    .institution-location {
      font-size: 9pt;
      color: var(--text-muted);
    }
    
    .job-description,
    .education-description {
      font-size: 10pt;
      margin-top: 0.1in;
    }
    
    /* Projects section */
    .project-item {
      margin-bottom: 0.3in;
      padding-left: 0.1in;
      border-left: 2px solid var(--accent-color);
    }
    
    .project-name {
      font-family: 'Montserrat', sans-serif;
      font-size: 11pt;
      font-weight: 600;
      color: var(--text-dark);
      margin: 0;
    }
    
    .project-description {
      font-size: 10pt;
      margin: 0.05in 0;
    }
    
    .project-technologies {
      font-size: 9pt;
      color: var(--text-muted);
      margin-top: 0.05in;
    }
    
    /* Languages section */
    .language-item {
      margin-bottom: 0.15in;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .language-name {
      font-size: 10pt;
      font-weight: 600;
    }
    
    .language-proficiency {
      font-size: 9pt;
      color: var(--accent-color);
      font-weight: 600;
    }
    
    /* Achievements lists */
    .achievements-list {
      margin: 0.1in 0;
      padding-left: 0.2in;
    }
    
    .achievements-list li {
      font-size: 10pt;
      margin-bottom: 0.05in;
      position: relative;
    }
    
    .achievements-list li::before {
      content: "▹";
      position: absolute;
      left: -0.15in;
      color: var(--primary-color);
    }
    
    /* Responsive and print styles */
    @media screen and (max-width: 768px) {
      .resume {
        grid-template-columns: 1fr;
      }
      
      .sidebar,
      .main-content {
        padding: 1in 0.6in;
      }
      
      .profile {
        margin-bottom: 0.8in;
      }
    }
    
    @media print {
      body {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      .resume {
        box-shadow: none;
        margin: 0;
        width: 100%;
        height: 100%;
      }
      
      .sidebar {
        background-color: var(--background-sidebar) !important;
      }
      
      .sidebar::before {
        background-color: var(--primary-color) !important;
      }
      
      .profile-circle {
        background-color: var(--primary-color) !important;
      }
      
      .profile-circle::after {
        background-color: var(--accent-color) !important;
      }
      
      /* Ensure page breaks don't occur at awkward places */
      .experience-item, 
      .education-item, 
      .project-item,
      .section-title {
        page-break-inside: avoid;
      }
    }
  `
};

export default creativeTemplate;