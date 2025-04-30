import { Template } from '@/types/templates';

const classicUxDesignerTemplate: Template = {
  id: 'classic-ux-designer',
  name: 'Classic UX Designer',
  description: 'A modern, professional layout perfect for UX/UI designers and creative professionals.',
  tags: ['Creative', 'UX/UI', 'Design', 'Modern'],
  category: 'creative',
  is_public: true,
  created_at: new Date().toISOString(),
  html_content: `
    <div class="cover-letter">
      <div class="header-grid">
        <div class="name-section">
          <h1 class="name">{{name}}</h1>
          <h2 class="title">UI/UX Designer</h2>
          <p class="tagline">I am passionate about designing digital experiences that are both visually stunning and intuitive, and always strive to create designs that delight and engage users.</p>
        </div>
        <div class="contact-section">
          <h3>Contact</h3>
          {{header}}
        </div>
      </div>
      
      <div class="recipient-section">
        <p class="job-title">UX Manager</p>
        <p class="company">LIFEDREAMER GAMING</p>
        <p class="address-line">333 3rd Avenue</p>
        <p class="address-line">Seattle, WA 98765</p>
      </div>
      
      <div class="letter-content">
        <div class="greeting">
          {{greeting}}
        </div>
        
        <div class="introduction">
          {{introduction}}
        </div>
        
        <div class="body">
          {{body}}
        </div>
        
        <div class="conclusion">
          {{conclusion}}
        </div>
        
        <div class="signature">
          {{signature}}
          <p class="enclosure">Enclosure</p>
        </div>
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
      font-family: 'Helvetica Neue', Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.5;
      color: #333;
      margin: 0;
      padding: 0;
      max-width: 100%;
      overflow-x: hidden;
    }
    
    .cover-letter {
      max-width: 100%;
      margin: 0 auto;
      padding: 1rem;
    }
    
    .header-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1rem;
      margin-bottom: 1.5rem;
      border-bottom: 1px solid #ddd;
      padding-bottom: 1rem;
    }
    
    .name-section {
      padding-right: 0;
    }
    
    .name {
      font-size: 20pt;
      font-weight: bold;
      margin: 0;
      color: #333;
    }
    
    .title {
      font-size: 14pt;
      font-weight: 500;
      margin: 0.3em 0 0.8em;
      color: #555;
    }
    
    .tagline {
      font-size: 10pt;
      line-height: 1.4;
      color: #666;
      margin: 0;
    }
    
    .contact-section {
      text-align: left;
      font-size: 10pt;
      margin-top: 1rem;
    }
    
    .contact-section h3 {
      font-size: 12pt;
      margin-top: 0;
      margin-bottom: 0.5rem;
      color: #444;
    }
    
    .recipient-section {
      margin-bottom: 1.5rem;
      font-size: 10pt;
      line-height: 1.3;
    }
    
    .job-title {
      font-weight: bold;
      margin: 0 0 0.3em;
    }
    
    .company {
      font-weight: bold;
      margin: 0 0 0.3em;
    }
    
    .address-line {
      margin: 0;
    }
    
    .letter-content {
      clear: both;
    }
    
    .greeting {
      margin-bottom: 1rem;
      font-weight: 500;
    }
    
    .introduction p, .body p, .conclusion p {
      margin-bottom: 1rem;
      text-align: justify;
    }
    
    .body ul {
      margin: 0.5em 0 1em;
      padding-left: 1.5em;
    }
    
    .body li {
      margin-bottom: 0.3em;
    }
    
    .signature {
      margin-top: 1.5rem;
    }
    
    .enclosure {
      font-style: italic;
      margin-top: 1rem;
      font-size: 10pt;
      color: #666;
    }
    
    /* Desktop styles */
    @media screen and (min-width: 768px) {
      .cover-letter {
        max-width: 8.5in;
        padding: 1in;
      }
      
      .header-grid {
        grid-template-columns: 2fr 1fr;
        gap: 2em;
        margin-bottom: 2em;
        padding-bottom: 1em;
      }
      
      .name-section {
        padding-right: 1em;
      }
      
      .name {
        font-size: 24pt;
      }
      
      .contact-section {
        text-align: right;
        margin-top: 0;
      }
      
      .recipient-section {
        float: left;
        margin-bottom: 2em;
      }
      
      .greeting {
        margin-bottom: 1em;
      }
      
      .introduction p, .body p, .conclusion p {
        margin-bottom: 1em;
      }
      
      .signature {
        margin-top: 1.5em;
      }
    }
    
    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  `
};

export default classicUxDesignerTemplate;