import { Template } from '@/types/templates';

const modernTemplate: Template = {
  id: 'modern-template',
  name: 'Modern',
  description: 'A clean, contemporary design with a touch of color for those seeking a fresh look.',
  tags: ['Modern', 'Clean', 'Creative'],
  category: 'general',
  is_public: true,
  created_at: new Date().toISOString(),
  html_content: `
    <div class="cover-letter">
      <div class="sidebar">
        <div class="header">
          {{header}}
        </div>
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
      font-family: 'Helvetica', 'Arial', sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #333333;
      margin: 0;
      padding: 0;
      background-color: #ffffff;
      max-width: 100%;
      overflow-x: hidden;
    }
    
    .cover-letter {
      display: flex;
      flex-direction: column;
      max-width: 100%;
      margin: 0 auto;
    }
    
    .sidebar {
      padding: 1.5rem 1rem;
      background-color: #f2f2f2;
    }
    
    .content {
      padding: 1.5rem 1rem;
    }
    
    .header {
      margin-bottom: 1rem;
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
        flex-direction: row;
        max-width: 8.5in;
      }
      
      .sidebar {
        width: 2.5in;
        padding: 1in 0.5in;
      }
      
      .content {
        flex: 1;
        padding: 1in 0.75in;
      }
      
      .header {
        margin-bottom: 0.5in;
      }
      
      .greeting {
        margin-bottom: 0.25in;
      }
      
      .introduction p, .body p, .conclusion p {
        margin-bottom: 0.25in;
      }
      
      .signature {
        margin-top: 0.5in;
      }
    }
    
    @media print {
      .cover-letter {
        flex-direction: row;
      }
      
      .sidebar {
        width: 2.5in;
      }
      
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  `
};

export default modernTemplate;