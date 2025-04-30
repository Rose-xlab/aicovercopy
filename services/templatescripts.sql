INSERT INTO public.resume_templates (
    name,
    description,
    category, -- 'Professional' is a valid category
    is_public,
    html_content,
    css_content,
    thumbnail
    -- id will be auto-generated, created_at/updated_at have defaults
) VALUES (
    -- Values from professional.ts:
    'Professional', -- name
    'A clean, professional resume template with traditional formatting optimized for corporate positions and ATS systems.', -- description
    'Professional', -- category
    true, -- is_public
    $$ -- Start html_content
    <div class="resume">
      <header class="header">
        <div class="name-title">
          <h1 class="name">{{name}}</h1>
          <h2 class="title">{{title}}</h2>
        </div>
        <div class="contact">
          <div class="contact-row">
            <div class="contact-item">
              <span class="contact-label">Email:</span>
              <span class="contact-value">{{email}}</span>
            </div>
            <div class="contact-item">
              <span class="contact-label">Phone:</span>
              <span class="contact-value">{{phone}}</span>
            </div>
          </div>
          <div class="contact-row">
            <div class="contact-item">
              <span class="contact-label">Location:</span>
              <span class="contact-value">{{address}}</span>
            </div>
            <div class="contact-item">
              <span class="contact-label">LinkedIn:</span>
              <span class="contact-value">{{linkedin}}</span>
            </div>
          </div>
        </div>
      </header>

      <section class="summary-section">
        <h3 class="section-heading">Professional Summary</h3>
        <div class="section-content">
          {{professional-summary}}
        </div>
      </section>

      <section class="experience-section">
        <h3 class="section-heading">Work Experience</h3>
        <div class="section-content">
          {{work-experience}}
        </div>
      </section>

      <section class="internships-section">
        <h3 class="section-heading">Internships</h3>
        <div class="section-content">
          {{internships}}
        </div>
      </section>

      <section class="education-section">
        <h3 class="section-heading">Education</h3>
        <div class="section-content">
          {{education}}
        </div>
      </section>

      <section class="skills-section">
        <h3 class="section-heading">Skills</h3>
        <div class="section-content">
          {{skills}}
        </div>
      </section>

      <section class="projects-section">
        <h3 class="section-heading">Projects</h3>
        <div class="section-content">
          {{projects}}
        </div>
      </section>

      <section class="additional-info">
        <div class="two-column">
          <div class="column certifications-section">
            <h3 class="section-heading">Certifications</h3>
            <div class="section-content">
              {{certifications}}
            </div>
          </div>
          <div class="column languages-section">
            <h3 class="section-heading">Languages</h3>
            <div class="section-content">
              {{languages}}
            </div>
          </div>
        </div>
      </section>

      <section class="hobbies-section">
        <h3 class="section-heading">Hobbies & Interests</h3>
        <div class="section-content">
          {{interests}}
        </div>
      </section>

      <section class="references-section">
        <h3 class="section-heading">References</h3>
        <div class="section-content">
          {{references}}
          <div class="reference-text">{{reference-text}}</div>
        </div>
      </section>

      <section class="custom-sections">
        {{custom-sections}}
      </section>
    </div>
    $$, -- End html_content
    $$ -- Start css_content
    /* Base styles with ATS compatibility */
    @import url('https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&family=Merriweather:wght@700&display=swap');

    /* Variables for consistent theming */
    :root {
      --primary: #2c3e50;
      --secondary: #3498db;
      --text-dark: #333333;
      --text-muted: #6c757d;
      --text-light: #ffffff;
      --background: #ffffff;
      --border: #dee2e6;
      --section-padding: 0.2in;
      --heading-family: 'Merriweather', Georgia, serif;
      --body-family: 'Lato', Arial, sans-serif;
    }

    body {
      font-family: var(--body-family);
      font-size: 11pt;
      line-height: 1.5;
      color: var(--text-dark);
      margin: 0;
      padding: 0;
      background-color: var(--background);
      -webkit-font-smoothing: antialiased;
    }

    .resume {
      max-width: 8.5in;
      margin: 0 auto;
      padding: 0.5in;
      background-color: var(--background);
    }

    /* Header styling */
    .header {
      display: flex;
      flex-direction: column;
      margin-bottom: 0.4in;
      border-bottom: 2px solid var(--primary);
      padding-bottom: 0.2in;
    }

    @media (min-width: 600px) {
      .header {
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
      }
    }

    .name {
      font-family: var(--heading-family);
      font-size: 24pt;
      font-weight: 700;
      margin: 0;
      color: var(--primary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .title {
      font-family: var(--body-family);
      font-size: 14pt;
      font-weight: normal;
      margin: 0.1in 0 0 0;
      color: var(--secondary);
    }

    .contact {
      margin-top: 0.2in;
    }

    @media (min-width: 600px) {
      .contact {
        margin-top: 0;
        text-align: right;
      }
    }

    .contact-row {
      display: flex;
      flex-direction: column;
      gap: 0.1in;
      margin-bottom: 0.05in;
    }

    @media (min-width: 600px) {
      .contact-row {
        flex-direction: row;
        justify-content: flex-end;
        gap: 0.3in;
      }
    }

    .contact-item {
      white-space: nowrap;
    }

    .contact-label {
      font-weight: 700;
      color: var(--primary);
      margin-right: 0.05in;
    }

    .contact-value {
      color: var(--text-dark);
    }

    /* Section styling */
    section {
      margin-bottom: 0.3in;
    }

    .section-heading {
      font-family: var(--heading-family);
      font-size: 14pt;
      font-weight: 700;
      color: var(--primary);
      margin: 0 0 0.15in 0;
      border-bottom: 1px solid var(--border);
      padding-bottom: 0.05in;
      text-transform: uppercase;
    }

    .section-content {
      padding: 0.1in 0;
    }

    /* Summary section */
    .summary-section .section-content { /* Target specifically */
      font-size: 11pt;
      line-height: 1.6;
      text-align: justify;
    }

    /* Experience and Internship sections */
    .experience-item, .internship-item {
      margin-bottom: 0.2in;
      page-break-inside: avoid;
    }

    .experience-header, .internship-header {
      display: flex;
      flex-direction: column;
      margin-bottom: 0.1in;
    }

    @media (min-width: 600px) {
      .experience-header, .internship-header {
        flex-direction: row;
        justify-content: space-between;
        align-items: baseline;
      }
    }

    .job-title-company, .position-company { /* Added internship class */
      flex: 1;
    }

    .job-title, .internship-position { /* Renamed for internship */
      font-weight: 700;
      font-size: 12pt;
      color: var(--primary);
      margin: 0;
    }

    .company, .internship-company { /* Renamed for internship */
      font-weight: 400;
      font-size: 11pt;
      color: var(--text-dark);
      margin: 0.05in 0 0 0;
    }

    .experience-date, .internship-date {
      font-style: italic;
      color: var(--text-muted);
      margin-top: 0.05in;
    }

    @media (min-width: 600px) {
      .experience-date, .internship-date {
        margin-top: 0;
      }
    }

    .job-location, .internship-location {
      color: var(--text-muted);
      font-size: 10pt;
      margin-bottom: 0.1in;
    }

    .job-description, .internship-description {
      margin-top: 0.05in;
      margin-bottom: 0.1in;
    }

    /* Education section */
    .education-item {
      margin-bottom: 0.2in;
      page-break-inside: avoid;
    }

    .education-header {
      display: flex;
      flex-direction: column;
      margin-bottom: 0.1in;
    }

    @media (min-width: 600px) {
      .education-header {
        flex-direction: row;
        justify-content: space-between;
        align-items: baseline;
      }
    }

    .degree-institution {
      flex: 1;
    }

    .degree {
      font-weight: 700;
      font-size: 12pt;
      color: var(--primary);
      margin: 0;
    }

    .institution {
      font-weight: 400;
      font-size: 11pt;
      color: var(--text-dark);
      margin: 0.05in 0 0 0;
    }

    .education-date {
      font-style: italic;
      color: var(--text-muted);
      margin-top: 0.05in;
    }

    @media (min-width: 600px) {
      .education-date {
        margin-top: 0;
      }
    }

    /* Skills section */
    .skill-category {
      margin-bottom: 0.2in;
    }

    .category-heading {
      font-weight: 700;
      font-size: 11pt;
      color: var(--primary);
      margin: 0 0 0.1in 0;
      border-bottom: 1px solid var(--border);
      padding-bottom: 0.05in;
    }

    .skills-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.1in;
    }

    .skill-item {
      background-color: #f8f9fa;
      padding: 0.05in 0.1in;
      border-radius: 4px;
      font-size: 10pt;
      border: 1px solid var(--border);
      display: flex;
      align-items: center;
    }

    .skill-name {
      margin-right: 0.05in;
    }

    .skill-level {
      color: var(--text-muted);
      font-size: 9pt;
      font-style: italic;
    }

    /* Projects section */
    .project-item {
      margin-bottom: 0.2in;
      page-break-inside: avoid;
    }

    .project-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 0.1in;
    }

    .project-name {
      font-weight: 700;
      font-size: 12pt;
      color: var(--primary);
      margin: 0;
    }

    .project-date { /* Added for consistency, though not in HTML */
      font-style: italic;
      color: var(--text-muted);
      font-size: 10pt;
    }

    .project-description {
      margin-bottom: 0.1in;
    }

    .project-technologies {
      font-size: 10pt;
      color: var(--text-muted);
    }

    .technologies-label {
      font-weight: 700;
    }

    /* Two-column layout */
    .two-column {
      display: grid;
      grid-template-columns: 1fr;
      gap: 0.2in;
    }

    @media (min-width: 768px) {
      .two-column {
        grid-template-columns: 1fr 1fr;
      }
    }

    /* Certifications section */
    .certification-item {
      margin-bottom: 0.1in;
    }

    .certification-name {
      font-weight: 700;
      font-size: 11pt;
      color: var(--primary);
      margin: 0;
    }

    .certification-details {
      display: flex;
      flex-wrap: wrap;
      gap: 0.1in;
      font-size: 10pt;
      color: var(--text-muted);
      margin-top: 0.05in;
    }

    /* Languages section */
    .language-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.1in;
    }

    .language-name {
      font-weight: 700;
      color: var(--primary);
    }

    .language-proficiency {
      color: var(--text-muted);
      font-style: italic;
    }

    /* Hobbies & Interests section */
    .hobbies-section .section-content {
      display: flex;
      flex-wrap: wrap;
      gap: 0.1in;
    }

    .hobby-item {
      background-color: #f8f9fa;
      padding: 0.05in 0.1in;
      border-radius: 4px;
      font-size: 10pt;
      border: 1px solid var(--border);
    }

    .hobby-name { /* Added for structured hobbies */
      font-weight: 700;
      color: var(--primary);
    }

    .hobby-description { /* Added for structured hobbies */
      font-size: 10pt;
      color: var(--text-muted);
      margin-top: 0.05in;
    }

    /* References section */
    .reference-item {
      margin-bottom: 0.2in;
      page-break-inside: avoid;
      border-left: 2px solid var(--secondary);
      padding-left: 0.1in;
    }

    .reference-name {
      font-weight: 700;
      font-size: 12pt;
      color: var(--primary);
      margin: 0;
    }

    .reference-position {
      font-style: italic;
      font-size: 11pt;
      color: var(--text-dark);
      margin: 0.05in 0;
    }

    .reference-company { /* Added for consistency */
      font-size: 11pt;
      color: var(--text-dark);
      margin: 0 0 0.05in 0;
    }

    .reference-contact {
      font-size: 10pt;
      color: var(--text-muted);
    }

    .reference-text {
      font-style: italic;
      color: var(--text-muted);
      margin-top: 0.1in;
      text-align: center;
    }

    /* Custom sections */
    .custom-section {
      margin-bottom: 0.3in;
      page-break-inside: avoid;
    }

    .custom-title { /* Added for consistency */
      font-family: var(--heading-family);
      font-size: 14pt;
      font-weight: 700;
      color: var(--primary);
      margin: 0 0 0.15in 0;
      border-bottom: 1px solid var(--border);
      padding-bottom: 0.05in;
      text-transform: uppercase;
    }

     .custom-section-header { /* Added for date/location */
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        margin-bottom: 0.1in;
        font-size: 10pt;
        color: var(--text-muted);
     }

    .custom-content p { /* Style paragraphs */
        margin-bottom: 0.1in;
    }
    .custom-content ul { /* Style lists */
        margin: 0.1in 0;
        padding-left: 0.2in;
    }
    .custom-content li {
         margin-bottom: 0.08in;
    }


    /* Achievements lists */
    .achievements-list {
      margin: 0.1in 0;
      padding-left: 0.2in;
      list-style: none; /* Remove default bullets */
    }

    .achievements-list li {
      margin-bottom: 0.08in;
      position: relative;
      padding-left: 0.12in; /* Space for custom bullet */
    }

    .achievements-list li::before {
      content: "•";
      position: absolute;
      left: 0;
      top: 0.05in; /* Adjust vertical alignment */
      line-height: 1;
      color: var(--secondary);
    }

    /* Print styles for ATS compatibility */
    @media print {
      body {
        font-size: 11pt;
        line-height: 1.5;
        color: black !important;
        background-color: white !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .resume {
        padding: 0.25in;
        max-width: none;
        box-shadow: none;
        border: none;
      }

      /* Ensure content doesn't get cut off */
      .experience-item, .education-item, .project-item, .internship-item, .reference-item, .custom-section {
        page-break-inside: avoid;
      }
      .section-heading, .custom-title {
        page-break-after: avoid;
      }

      /* High contrast */
      .name, .title, .job-title, .company, .degree, .institution,
      .skill-item, .project-name, .certification-name, .language-name,
      .hobby-name, .reference-name, .internship-position, .internship-company, .custom-title,
      .contact-value, .contact-label, .category-heading, .technologies-label {
        color: black !important;
      }
      .header, .section-heading, .category-heading, .custom-title {
        border-bottom-color: black !important;
      }
      .skill-item, .hobby-item { border: 1px solid #ccc !important; background-color: white !important; }
      .reference-item { border-left-color: black !important; }
      .achievements-list li::before { color: black !important; }
      a { color: black !important; text-decoration: none !important; }
    }
    $$, -- End css_content
    '/thumbnails/resume-professional.png' -- thumbnail path
);



INSERT INTO public.templates (
    name,
    description,
    -- No 'tags' column
    category,
    is_public,
    html_content,
    css_content
    -- Assuming 'id', 'created_at', 'updated_at', 'user_id', 'thumbnail' have defaults or allow NULL
) VALUES (
    -- Values for the 'Creative Premium' template:
    'Creative Premium', -- name
    'A vibrant, eye-catching design for creative professionals with ATS-friendly elements.', -- description
    'Creative', -- category (This is one of the allowed values)
    true, -- is_public
    $$ -- Start dollar-quoting for html_content
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
    $$, -- End dollar-quoting for html_content
    $$ -- Start dollar-quoting for css_content
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
    $$ -- End dollar-quoting for css_content
);