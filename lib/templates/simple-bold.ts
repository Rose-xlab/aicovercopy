import { Template } from '@/types/templates';

const simpleBoldTemplate: Template = {
  id: 'simple-bold',
  name: 'Simple Bold',
  description: 'A bold distinctive layout with uppercase accents.',
  tags: ['Bold', 'Modern'],
  category: 'general',
  is_public: true,
  created_at: new Date().toISOString(),
  html_content: `
    <div class="letter">
      <div class="head">
        {{name}}
      </div>
      
      <div class="row">
        <div class="col">
          <p>{{job-title}}</p>
          <p>{{phone}}</p>
          <p>{{email}}</p>
          <p>{{location}}</p>
        </div>
        <div class="col">
          <p>HIRING MANAGER</p>
          <p>{{recipient-name}}</p>
          <p>{{recipient-company}}</p>
          <p>{{recipient-address}}</p>
        </div>
      </div>
      
      <div class="greeting">
        DEAR {{recipient-first-name}}:
      </div>
      
      <div class="intro">
        {{introduction}}
      </div>
      
      <div class="body">
        {{body}}
      </div>
      
      <div class="closing">
        {{conclusion}}
      </div>
      
      <div class="sign">
        Sincerely,
        <p>{{full-name}}</p>
        <p>{{date}}</p>
      </div>
    </div>
  `,
  css_content: `
    body {
      font: 11pt Arial;
      line-height: 1.5;
      color: #333;
      margin: 0;
    }
    
    .letter {
      margin: auto;
      padding: 1rem;
    }
    
    .head {
      margin: 1rem 0;
      font: bold 20pt Arial;
      text-transform: uppercase;
    }
    
    .row {
      display: grid;
      gap: 1rem;
      margin: 1rem 0;
      border-bottom: 1px solid #ddd;
      padding: 1rem 0;
    }
    
    .col p:first-child {
      font-weight: bold;
      text-transform: uppercase;
    }
    
    .col p {
      margin: 0.3em 0;
    }
    
    .greeting {
      font-weight: bold;
      margin-bottom: 1rem;
    }
    
    p {
      margin: 1rem 0;
    }
    
    .sign {
      margin-top: 1.5rem;
    }
    
    .sign p:first-child {
      font-weight: bold;
    }
    
    @media (min-width: 768px) {
      .letter {
        max-width: 8.5in;
        padding: 0.75in;
      }
      
      .row {
        grid-template-columns: 1fr 1fr;
      }
      
      .col:last-child {
        text-align: right;
      }
    }
    
    @media print {
      body {
        print-color-adjust: exact;
      }
    }
  `
};

export default simpleBoldTemplate;