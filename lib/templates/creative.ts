import { Template } from '@/types/templates';

const creativeTemplate: Template = {
  // --- UPDATED WITH YOUR DATABASE UUID ---
  id: '7244822f-d3a0-45b5-bc88-e9b2c2362771', // <<< Your UUID here
  // --- END UPDATE ---
  name: 'Creative Premium',
  description: 'A vibrant, eye-catching design for creative professionals with ATS-friendly elements.',
  // tags: ['Creative', 'Design', 'Startup', 'ATS-Friendly', 'Modern'], // Removed: 'tags' column doesn't exist on resume_templates
  category: 'Creative', // Using a valid category based on check constraint
  is_public: true,
  created_at: new Date().toISOString(), // Keep to satisfy the Template type definition
  html_content: `
    <div class="cover-letter">
      <div class="design-elements">
        <div class="accent-bar"></div>
        <div class="accent-circles">
          <div class="circle circle-1"></div>
          <div class="circle circle-2"></div>
          <div class="circle circle-3"></div>
        </div>
        <div class="corner-accent top-right"></div>
        <div class="corner-accent bottom-left"></div>
      </div>

      <div class="content">
        <div class="header">
          <div class="name-highlight"></div>
          {{header}}
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

        <div class="key-skills">
          <div class="skill-dots">
            <span class="skill-dot"></span>
            <span class="skill-dot"></span>
            <span class="skill-dot"></span>
          </div>
        </div>

        <div class="conclusion">
          {{conclusion}}
        </div>

        <div class="signature">
          <div class="signature-line"></div>
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
      font-family: 'Calibri', 'Arial', sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #2d3436;
      margin: 0;
      padding: 0;
      background-color: #ffffff;
      max-width: 100%;
      overflow-x: hidden;
    }

    .cover-letter {
      position: relative;
      max-width: 100%;
      margin: 0 auto;
      padding: 1.2rem 1.5rem 1.5rem 2.8rem;
      background-color: #ffffff;
      overflow: hidden;
    }

    /* Creative design elements */
    .design-elements {
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      width: 100%;
      pointer-events: none;
    }

    .accent-bar {
      position: absolute;
      top: 0;
      left: 0;
      width: 0.85rem;
      height: 100%;
      background: linear-gradient(to bottom, #6c5ce7, #0984e3, #00cec9);
    }

    .accent-circles {
      position: absolute;
      left: 1.1rem;
      top: 2.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.2rem;
    }

    .circle {
      width: 0.4rem;
      height: 0.4rem;
      border-radius: 50%;
    }

    .circle-1 {
      background-color: #6c5ce7;
    }

    .circle-2 {
      background-color: #0984e3;
    }

    .circle-3 {
      background-color: #00cec9;
    }

    .corner-accent {
      position: absolute;
      width: 3rem;
      height: 3rem;
      opacity: 0.1;
      border-radius: 0.5rem;
    }

    .top-right {
      top: -1rem;
      right: -1rem;
      background-color: #0984e3;
      transform: rotate(45deg);
    }

    .bottom-left {
      bottom: -1rem;
      left: 3rem;
      background-color: #00cec9;
      transform: rotate(45deg);
    }

    /* Content styling */
    .content {
      position: relative;
      margin-left: 1rem;
      z-index: 1;
    }

    .header {
      position: relative;
      margin-bottom: 1.8rem;
      padding-bottom: 0.7rem;
      border-bottom: 1px solid #dfe6e9;
    }

    .name-highlight {
      position: absolute;
      height: 0.8rem;
      width: 40%;
      bottom: -0.4rem;
      left: 0;
      background-color: rgba(0, 206, 201, 0.1);
      z-index: -1;
    }

    .greeting {
      margin-bottom: 1.2rem;
      font-weight: 600;
      color: #0984e3;
      font-size: 1.1em;
    }

    .introduction p {
      margin-bottom: 1.2rem;
      font-weight: 500;
      color: #2d3436;
    }

    .body p {
      margin-bottom: 1.2rem;
      text-align: justify;
      color: #2d3436;
    }

    .key-skills {
      margin: 1.2rem 0;
      border-left: 2px solid #6c5ce7;
      padding-left: 1rem;
    }

    .skill-dots {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }

    .skill-dot {
      display: inline-block;
      width: 0.5rem;
      height: 0.5rem;
      border-radius: 50%;
      background-color: #0984e3;
    }

    .conclusion p {
      margin-bottom: 1.2rem;
      color: #2d3436;
      font-weight: 500;
    }

    .signature {
      position: relative;
      margin-top: 1.8rem;
      color: #0984e3;
      font-weight: 600;
    }

    .signature-line {
      position: absolute;
      bottom: -0.5rem;
      left: 0;
      width: 5rem;
      height: 2px;
      background: linear-gradient(to right, #6c5ce7, #0984e3, transparent);
    }

    /* Desktop styles */
    @media screen and (min-width: 768px) {
      .cover-letter {
        max-width: 8.5in;
        padding: 1in;
        padding-left: calc(1in + 0.6in);
      }

      .accent-circles {
        left: 1.3rem;
        top: 3.5rem;
        gap: 1.5rem;
      }

      .circle {
        width: 0.5rem;
        height: 0.5rem;
      }

      .content {
        margin-left: 0.6in;
      }

      .header {
        margin-bottom: 0.8in;
        padding-bottom: 0.3in;
      }

      .name-highlight {
        height: 1rem;
        bottom: -0.5rem;
      }

      .greeting {
        margin-bottom: 0.3in;
      }

      .introduction p, .body p, .conclusion p {
        margin-bottom: 0.3in;
      }

      .key-skills {
        margin: 0.4in 0;
        padding-left: 0.3in;
      }

      .signature {
        margin-top: 0.6in;
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
        padding-left: calc(0.5in + 0.6in);
      }

      /* Design elements remain visible but not distracting */
      .design-elements {
        opacity: 0.6;
      }

      /* Ensure consistent font for ATS readability */
      .content * {
        font-family: 'Calibri', 'Arial', sans-serif !important;
      }

      /* Make sure text is high contrast for better scanning */
      .header, .body p, .introduction p, .conclusion p {
        color: #000000;
      }

      /* Maintain structure while printing */
      .key-skills {
        border-left-color: #666666;
      }

      .skill-dot {
        background-color: #666666;
      }
    }
  `
};

export default creativeTemplate;

