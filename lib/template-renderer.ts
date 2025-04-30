import { Template } from "@/types/templates";

/**
 * Parse the cover letter content into structured sections
 * @param content The raw cover letter content
 * @returns An object with structured sections
 */
export function parseLetterContent(content: string): {
  header: string[];
  greeting: string;
  introduction: string[];
  body: string[];
  conclusion: string[];
  signature: string[];
} {
  const lines = content.split('\n').filter(line => line.trim() !== '');
  
  // Simple parsing logic - this could be more sophisticated
  // Assuming a fairly standard cover letter format
  
  // First few lines are typically contact info
  const header = lines.slice(0, 4);
  
  // Find the greeting line (usually starts with "Dear")
  const greetingIndex = lines.findIndex(line => 
    line.toLowerCase().startsWith('dear') || 
    line.toLowerCase().startsWith('til') || 
    line.toLowerCase().startsWith('hei')
  );
  
  const greeting = greetingIndex > -1 ? lines[greetingIndex] : "Dear Hiring Manager,";
  
  // Introduction is typically the paragraph after greeting
  let currentIndex = greetingIndex + 1;
  const introduction = [];
  while (currentIndex < lines.length && lines[currentIndex].trim().length > 0) {
    introduction.push(lines[currentIndex]);
    currentIndex++;
  }
  
  // Skip empty lines
  while (currentIndex < lines.length && lines[currentIndex].trim().length === 0) {
    currentIndex++;
  }
  
  // Body paragraphs (typically 1-3 paragraphs)
  const body = [];
  let emptyLineCount = 0;
  
  while (currentIndex < lines.length && emptyLineCount < 2) {
    if (lines[currentIndex].trim().length === 0) {
      emptyLineCount++;
    } else {
      emptyLineCount = 0;
      body.push(lines[currentIndex]);
    }
    currentIndex++;
  }
  
  // Conclusion is typically the last paragraph
  const conclusion = [];
  while (currentIndex < lines.length && !lines[currentIndex].toLowerCase().includes('regards') && 
         !lines[currentIndex].toLowerCase().includes('hilsen')) {
    if (lines[currentIndex].trim().length > 0) {
      conclusion.push(lines[currentIndex]);
    }
    currentIndex++;
  }
  
  // Signature is the last few lines
  const signature = [];
  while (currentIndex < lines.length) {
    if (lines[currentIndex].trim().length > 0) {
      signature.push(lines[currentIndex]);
    }
    currentIndex++;
  }
  
  return {
    header,
    greeting,
    introduction,
    body,
    conclusion,
    signature
  };
}

/**
 * Render the cover letter content with the selected template
 * @param template The selected template
 * @param content The raw cover letter content
 * @returns HTML string of the rendered template
 */
export function renderTemplate(template: Template, content: string): string {
  try {
    const parsedContent = parseLetterContent(content);
    
    // Replace placeholders in the template HTML
    let html = template.html_content;
    
    // Replace header content
    html = html.replace('{{header}}', parsedContent.header.join('<br>'));
    
    // Replace greeting
    html = html.replace('{{greeting}}', parsedContent.greeting);
    
    // Replace introduction
    html = html.replace('{{introduction}}', parsedContent.introduction.map(line => 
      `<p>${line}</p>`
    ).join(''));
    
    // Replace body paragraphs
    html = html.replace('{{body}}', parsedContent.body.map(line => 
      `<p>${line}</p>`
    ).join(''));
    
    // Replace conclusion
    html = html.replace('{{conclusion}}', parsedContent.conclusion.map(line => 
      `<p>${line}</p>`
    ).join(''));
    
    // Replace signature
    html = html.replace('{{signature}}', parsedContent.signature.join('<br>'));
    
    // Add the template CSS
    const fullHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          ${template.css_content}
        </style>
      </head>
      <body>
        ${html}
      </body>
      </html>
    `;
    
    return fullHtml;
  } catch (error) {
    console.error("Error rendering template:", error);
    return `
      <!DOCTYPE html>
      <html>
      <body>
        <p>Error rendering template. Please try another template or contact support.</p>
        <pre>${error}</pre>
      </body>
      </html>
    `;
  }
}

/**
 * Apply the template and return just the HTML body content (no CSS)
 * Used for exporting to DOCX where we need just the content
 */
export function renderTemplateContent(template: Template, content: string): string {
  const parsedContent = parseLetterContent(content);
  
  // Replace placeholders in the template HTML
  let html = template.html_content;
  
  // Replace sections
  html = html.replace('{{header}}', parsedContent.header.join('<br>'));
  html = html.replace('{{greeting}}', parsedContent.greeting);
  html = html.replace('{{introduction}}', parsedContent.introduction.map(line => 
    `<p>${line}</p>`
  ).join(''));
  html = html.replace('{{body}}', parsedContent.body.map(line => 
    `<p>${line}</p>`
  ).join(''));
  html = html.replace('{{conclusion}}', parsedContent.conclusion.map(line => 
    `<p>${line}</p>`
  ).join(''));
  html = html.replace('{{signature}}', parsedContent.signature.join('<br>'));
  
  return html;
}