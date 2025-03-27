import { Template } from '@/types/templates';

const professionalTemplate: Template = {
  id: 'professional-template',
  name: 'Professional Elite',
  description: 'A refined, sophisticated layout with premium styling for corporate and executive roles.',
  tags: ['Corporate', 'Business', 'Formal', 'Executive', 'ATS-Friendly'],
  category: 'business',
  is_public: true,
  created_at: new Date().toISOString(),
  html_content: `
    <div class="cover-letter">
      <div class="letterhead">
        <div class="header-decoration">
          <div class="header-line"></div>
          <div class="header-dot"></div>
        </div>
        <div class="header">
          {{header}}
        </div>
      </div>
      
      <div class="content">
        <div class="date-section">
          <div class="date-line"></div>
          <div class="current-date" id="current-date"></div>
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
        
        <div class="highlight-box">
          <div class="highlight-marker"></div>
          <div class="highlight-content">
            Key qualifications that align with your requirements
          </div>
        </div>
        
        <div class="conclusion">
          {{conclusion}}
        </div>
        
        <div class="signature">
          <div class="sign-off">Sincerely,</div>
          {{signature}}
          <div class="signature-underline"></div>
        </div>
      </div>
      
      <div class="footer">
        <div class="footer-line"></div>
        <div class="contact-info">
          <span class="footer-dot"></span>
        </div>
      </div>
    </div>
    
    <script>
      document.addEventListener('DOMContentLoaded', function() {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        const today = new Date().toLocaleDateString(undefined, options);
        document.getElementById('current-date').textContent = today;
      });
    </script>
  `,
  css_content: `
    /* Base responsive styles */
    @media screen {
      html {
        font-size: 100%;
      }
    }
    
    body {
      font-family: 'Times New Roman', 'Georgia', serif;
      font-size: 12pt;
      line-height: 1.6;
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
    }
    
    /* Letterhead styling */
    .letterhead {
      position: relative;
      border-bottom: 1px solid #bdc3c7;
      padding-bottom: 1rem;
      margin-bottom: 1.5rem;
    }
    
    .header-decoration {
      position: absolute;
      top: 0;
      left: 0;
      display: flex;
      align-items: center;
    }
    
    .header-line {
      width: 2rem;
      height: 3px;
      background-color: #6c5ce7;
    }
    
    .header-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: #6c5ce7;
      margin-left: 4px;
    }
    
    .header {
      text-align: left;
      padding-top: 0.5rem;
      color: #2d3436;
    }
    
    .header h1 {
      font-size: 1.5rem;
      margin: 0;
      color: #2d3436;
    }
    
    /* Date section */
    .date-section {
      display: flex;
      align-items: center;
      margin-bottom: 1.2rem;
    }
    
    .date-line {
      width: 1.5rem;
      height: 2px;
      background-color: #6c5ce7;
      margin-right: 0.5rem;
    }
    
    .current-date {
      color: #574b90;
      font-style: italic;
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
    
    /* Highlight box */
    .highlight-box {
      display: flex;
      margin: 1.2rem 0;
      padding: 0.8rem;
      background-color: #f7f9fc;
      border-radius: 4px;
    }
    
    .highlight-marker {
      width: 4px;
      background-color: #6c5ce7;
      margin-right: 0.8rem;
      border-radius: 2px;
    }
    
    .highlight-content {
      font-weight: 600;
      color: #2d3436;
      font-style: italic;
    }
    
    .conclusion p {
      margin-bottom: 1.2rem;
      text-align: justify;
      color: #2d3436;
    }
    
    /* Signature styling */
    .signature {
      margin-top: 1.8rem;
    }
    
    .sign-off {
      margin-bottom: 0.8rem;
    }
    
    .signature-underline {
      margin-top: 0.5rem;
      width: 3rem;
      height: 1px;
      background-color: #6c5ce7;
    }
    
    /* Footer */
    .footer {
      margin-top: 2rem;
      position: relative;
      padding-top: 1rem;
    }
    
    .footer-line {
      width: 100%;
      height: 1px;
      background: linear-gradient(to right, #6c5ce7, #bdc3c7, transparent);
    }
    
    .contact-info {
      margin-top: 0.5rem;
      display: flex;
      align-items: center;
      opacity: 0.8;
      font-size: 0.9em;
    }
    
    .footer-dot {
      display: inline-block;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background-color: #6c5ce7;
      margin-right: 0.5rem;
    }
    
    /* Desktop styles */
    @media screen and (min-width: 768px) {
      .cover-letter {
        max-width: 8.5in;
        padding: 1in;
      }
      
      .letterhead {
        padding-bottom: 0.3in;
        margin-bottom: 0.5in;
      }
      
      .header-line {
        width: 3rem;
      }
      
      .header {
        text-align: left;
        padding-left: 3.5rem;
      }
      
      .greeting {
        margin-bottom: 0.3in;
      }
      
      .introduction p, .body p, .conclusion p {
        margin-bottom: 0.3in;
        line-height: 1.7;
      }
      
      .highlight-box {
        margin: 0.4in 0;
      }
      
      .signature {
        margin-top: 0.6in;
      }
      
      .footer {
        margin-top: 0.8in;
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
      .content * {
        font-family: 'Times New Roman', 'Georgia', serif !important;
      }
      
      /* Ensure high contrast for ATS */
      .header, .body p, .introduction p, .conclusion p, .greeting, .highlight-content {
        color: #000000 !important;
      }
      
      /* Maintain structure elements with darker colors for printing */
      .header-line, .header-dot, .date-line, .highlight-marker, .signature-underline, .footer-line, .footer-dot {
        background-color: #45397e !important;
      }
      
      .highlight-box {
        border: 1px solid #bdc3c7;
        background-color: #f8f9fa !important;
      }
    }
  `
};

export default professionalTemplate;