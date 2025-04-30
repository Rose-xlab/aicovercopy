import { Template } from '@/types/templates';

const classicTemplate: Template = {
  // --- UPDATED WITH YOUR DATABASE UUID ---
  id: '7a14a3af-93c3-49ad-bd76-8d8f75ff1a1b', // <<< Changed from 'classic-template'
  // --- END UPDATE ---
  name: 'Classic',
  description: 'A traditional and timeless template suitable for most industries and positions.',
  // tags: ['Formal', 'Traditional', 'Professional'], // 'tags' column doesn't exist on resume_templates
  category: 'Professional', // Using a valid category based on previous check constraint fix
  is_public: true,
  created_at: new Date().toISOString(), // <<< UNCOMMENTED THIS LINE to satisfy the Template type
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
    /* Responsive viewport meta tag */
    @media screen {
      html {
        font-size: 100%;
      }
    }

    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      line-height: 1.5;
      color: #000000;
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

    .header {
      margin-bottom: 1.5rem;
      font-weight: normal;
    }

    .greeting {
      margin-bottom: 1rem;
    }

    .introduction p, .body p, .conclusion p {
      margin-bottom: 1rem;
      text-align: justify;
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
        padding: 0;
      }

      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  `
};

export default classicTemplate;
