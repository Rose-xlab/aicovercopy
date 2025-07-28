//C:\Users\mukas\Downloads\project-bolt-sb1-guerg2d9\project\lib\resume-template-wrapper.ts

/**
 * This file provides a wrapper function to ensure all resume templates
 * have consistent margins and proper formatting.
 */

/**
 * Wraps any resume template HTML with a proper container to ensure margins
 * @param templateHtml The original template HTML
 * @returns Wrapped HTML with guaranteed margins
 */
export function wrapTemplateWithMargins(templateHtml: string): string {
    // Add a wrapper div with proper margins
    return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      /* Reset styles */
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      /* Force page margins */
      body {
        margin: 0;
        padding: 0;
        background-color: white;
        color: black;
        font-family: Arial, sans-serif;
        line-height: 1.5;
      }
      
      /* Main container for the resume */
      .resume-container {
        width: 100%;
        max-width: 8.5in;
        margin: 0 auto;
        padding: 0.5in;
        background-color: white;
        min-height: 11in;
        position: relative;
        overflow: visible;
      }
      
      /* Print styles */
      @media print {
        body {
          background-color: white;
          margin: 0;
          padding: 0;
        }
        
        .resume-container {
          width: 100%;
          max-width: none;
          margin: 0;
          padding: 0.5in;
          box-shadow: none;
        }
      }
    </style>
  </head>
  <body>
    <div class="resume-container">
      ${templateHtml}
    </div>
  </body>
  </html>
    `;
  }
  
  /**
   * Wraps the CSS for a resume template to ensure consistent base styles
   * @param templateCss The original template CSS
   * @returns Enhanced CSS with base styles
   */
  export function enhanceTemplateCss(templateCss: string): string {
    return `
  /* Base styles for all resumes */
  :root {
    --margin-size: 0.5in;
    --page-width: 8.5in;
    --page-height: 11in;
  }
  
  body {
    margin: 0;
    padding: 0;
    background-color: white;
    font-family: Arial, sans-serif;
    line-height: 1.5;
  }
  
  /* Ensure proper margin behavior */
  .resume-container {
    box-sizing: border-box;
    width: 100%;
    max-width: var(--page-width);
    min-height: var(--page-height);
    margin: 0 auto;
    padding: var(--margin-size);
    position: relative;
    background-color: white;
  }
  
  /* Template-specific styles */
  ${templateCss}
  
  /* Print styles override */
  @media print {
    body {
      margin: 0;
      padding: 0;
    }
    
    .resume-container {
      width: 100%;
      max-width: none;
      margin: 0;
      padding: var(--margin-size);
      box-shadow: none;
    }
  }
    `;
  }