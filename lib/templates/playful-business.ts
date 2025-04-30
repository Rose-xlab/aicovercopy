import { Template } from '@/types/templates';

const playfulBusinessTemplate: Template = {
  id: 'playful-business',
  name: 'Playful Business',
  description: 'A creative and playful layout with visual elements, perfect for design and marketing roles.',
  tags: ['Creative', 'Modern', 'Playful', 'Visual'],
  category: 'creative',
  is_public: true,
  created_at: new Date().toISOString(),
  html_content: `
    <div class="cover-letter">
      <div class="letter-content">
        <div class="recipient">
          <p>{{recipient-name}}</p>
          <p>{{recipient-title}}</p>
          <p>{{recipient-company}}</p>
          <p>{{recipient-address}}</p>
          <p>{{recipient-city}}</p>
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
        
        <div class="conclusion">
          {{conclusion}}
        </div>
        
        <div class="signature">
          {{signature}}
          <p class="enclosure">Enclosure</p>
        </div>
      </div>
      
      <div class="sidebar">
        <div class="applicant-info">
          <div class="profile-image">
            <!-- Profile image placeholder -->
            <div class="image-placeholder"></div>
          </div>
          <h1 class="name">{{name}}</h1>
        </div>
        
        <div class="contact-details">
          <div class="contact-item">
            <div class="icon location-icon"></div>
            <p>{{address}}</p>
          </div>
          
          <div class="contact-item">
            <div class="icon phone-icon"></div>
            <p>{{phone}}</p>
          </div>
          
          <div class="contact-item">
            <div class="icon email-icon"></div>
            <p>{{email}}</p>
          </div>
          
          <div class="contact-item">
            <div class="icon website-icon"></div>
            <p>{{website}}</p>
          </div>
        </div>
      </div>
    </div>
  `,
  css_content: `
    /* Import fonts */
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap');
    
    /* Base responsive styles */
    @media screen {
      html {
        font-size: 100%;
      }
    }
    
    body {
      font-family: 'Poppins', sans-serif;
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
      display: grid;
      grid-template-columns: 1fr;
      grid-template-areas: "sidebar" "letter-content";
      max-width: 100%;
      margin: 0 auto;
    }
    
    .letter-content {
      grid-area: letter-content;
      padding: 1.5rem 1rem;
      order: 2;
    }
    
    .sidebar {
      grid-area: sidebar;
      background-color: #f5f5f5;
      padding: 1.5rem 1rem;
      order: 1;
    }
    
    .recipient {
      margin-bottom: 1.5rem;
      line-height: 1.4;
    }
    
    .recipient p {
      margin: 0 0 0.2em;
    }
    
    .greeting {
      margin-bottom: 1rem;
      font-weight: 500;
    }
    
    .introduction p, .body p, .conclusion p {
      margin-bottom: 1rem;
    }
    
    .body ul {
      margin: 0.5em 0 1em;
      padding-left: 1.5em;
    }
    
    .signature {
      margin-top: 1.5rem;
    }
    
    .enclosure {
      margin-top: 1rem;
      font-size: 10pt;
      color: #666;
    }
    
    .applicant-info {
      text-align: center;
      margin-bottom: 1.5rem;
    }
    
    .profile-image {
      width: 100px;
      height: 100px;
      margin: 0 auto 1em;
    }
    
    .image-placeholder {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background-color: #ddd;
    }
    
    .name {
      font-size: 16pt;
      font-weight: 600;
      margin: 0.5em 0;
      color: #444;
    }
    
    .contact-details {
      margin-top: 1.5rem;
    }
    
    .contact-item {
      display: flex;
      align-items: center;
      margin-bottom: 1em;
    }
    
    .icon {
      width: 24px;
      height: 24px;
      margin-right: 0.5em;
      background-color: #3498db;
      border-radius: 50%;
      flex-shrink: 0;
    }
    
    .contact-item p {
      margin: 0;
      font-size: 10pt;
      word-break: break-word;
    }
    
    /* Desktop styles */
    @media screen and (min-width: 768px) {
      .cover-letter {
        grid-template-columns: 3fr 1fr;
        grid-template-areas: "letter-content sidebar";
        max-width: 8.5in;
        min-height: 11in;
      }
      
      .letter-content {
        padding: 1.25in 1in 1in 1in;
        order: 1;
      }
      
      .sidebar {
        padding: 1.25in 0.75in 1in 0.75in;
        border-left: 1px solid #eee;
        order: 2;
      }
      
      .recipient {
        margin-bottom: 2em;
      }
      
      .greeting {
        margin-bottom: 1.5em;
      }
      
      .introduction p, .body p, .conclusion p {
        margin-bottom: 1em;
      }
      
      .signature {
        margin-top: 2em;
      }
      
      .profile-image {
        width: 120px;
        height: 120px;
      }
      
      .name {
        font-size: 18pt;
      }
      
      .icon {
        width: 30px;
        height: 30px;
      }
    }
    
    @media print {
      .cover-letter {
        grid-template-columns: 3fr 1fr;
        min-height: 11in;
      }
      
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      
      .sidebar {
        background-color: #f5f5f5 !important;
      }
      
      .icon {
        background-color: #3498db !important;
      }
    }
  `
};

export default playfulBusinessTemplate;