import { Template } from '@/types/templates';

const minimalTemplate: Template = {
  id: 'minimal-template',
  name: 'Minimal',
  description: 'A sleek, minimalist design that lets your content shine.',
  tags: ['Minimal', 'Clean', 'Elegant'],
  category: 'general',
  is_public: true,
  created_at: new Date().toISOString(),
  html_content: `
    <div class="cover-letter">
      <div class="header">
        {{header}}
      </div>
      
      <div class="content">
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
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.5;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #ffffff;
      max-width: 100%;
      overflow-x: hidden;
    }
    
    .cover-letter {
      max-width: 100%;
      margin: 0 auto;
      padding: 1rem;
    }
    
    .header {
      margin-bottom: 1.5rem;
      color: #555;
    }
    
    .greeting {
      margin-bottom: 1rem;
      font-weight: 500;
    }
    
    .introduction p, .body p, .conclusion p {
      margin-bottom: 1rem;
    }
    
    .signature {
      margin-top: 1.5rem;
    }
    
    /* Desktop styles */
    @media screen and (min-width: 768px) {
      .cover-letter {
        max-width: 8.5in;
        padding: 1in;
      }
      
      .header {
        margin-bottom: 1in;
      }
      
      .greeting {
        margin-bottom: 0.3in;
      }
      
      .introduction p, .body p, .conclusion p {
        margin-bottom: 0.25in;
      }
      
      .signature {
        margin-top: 0.5in;
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

export default minimalTemplate;