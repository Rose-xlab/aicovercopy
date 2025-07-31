//C:\Users\mukas\Downloads\project-bolt-sb1-guerg2d9\project\lib\template-renderer.ts

import { Template } from "@/types/templates";
// Make sure the path to your CoverLetter type is correct
import type { CoverLetter } from '@/types/cover-letter';

/**
 * This function is kept for DOCX support.
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
  const header = lines.slice(0, 4);
  const greetingIndex = lines.findIndex(line => 
    line.toLowerCase().startsWith('dear') || 
    line.toLowerCase().startsWith('til') || 
    line.toLowerCase().startsWith('hei')
  );
  const greeting = greetingIndex > -1 ? lines[greetingIndex] : "Dear Hiring Manager,";
  let currentIndex = greetingIndex + 1;
  const introduction = [];
  while (currentIndex < lines.length && lines[currentIndex].trim().length > 0) {
    introduction.push(lines[currentIndex]);
    currentIndex++;
  }
  while (currentIndex < lines.length && lines[currentIndex].trim().length === 0) {
    currentIndex++;
  }
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
  const conclusion = [];
  while (currentIndex < lines.length && !lines[currentIndex].toLowerCase().includes('regards') && 
         !lines[currentIndex].toLowerCase().includes('hilsen')) {
    if (lines[currentIndex].trim().length > 0) {
      conclusion.push(lines[currentIndex]);
    }
    currentIndex++;
  }
  const signature = [];
  while (currentIndex < lines.length) {
    if (lines[currentIndex].trim().length > 0) {
      signature.push(lines[currentIndex]);
    }
    currentIndex++;
  }
  return { header, greeting, introduction, body, conclusion, signature };
}

/**
 * Renders the cover letter for PDF. THIS IS THE NEW, CORRECTED VERSION.
 * It now accepts the full CoverLetter object and safely handles potentially missing data.
 * @param template The template from the database
 * @param letterData The full, structured cover letter object from the client
 * @returns Complete HTML string for PDF generation
 */
export function renderTemplate(template: Template, letterData: CoverLetter): string {
  try {
    let html = template.html_content;

    // --- FIX START ---
    // Safely access nested properties using optional chaining (?.)
    // and provide fallback empty strings ('') to prevent errors if data is null/undefined.
    
    // Replace sender's info
    html = html.replace(/{{name}}/g, letterData.sender?.name || '');
    html = html.replace(/{{sender-name}}/g, letterData.sender?.name || '');
    html = html.replace(/{{job-title}}/g, letterData.jobTitle || '');
    html = html.replace(/{{address-line1}}/g, letterData.sender?.address?.split(',')[0] || '');
    html = html.replace(/{{address-line2}}/g, letterData.sender?.address?.split(',').slice(1).join(', ').trim() || '');
    html = html.replace(/{{email}}/g, letterData.sender?.email || '');
    html = html.replace(/{{phone}}/g, letterData.sender?.phone || '');

    // Replace recipient's info
    html = html.replace(/{{recipient-name}}/g, letterData.recipient?.name || letterData.recipient?.title || 'Hiring Manager');
    html = html.replace(/{{company-name}}/g, letterData.companyName || letterData.recipient?.company || '');
    html = html.replace(/{{recipient-title}}/g, letterData.recipient?.title || 'Hiring Manager');
    html = html.replace(/{{recipient-last-name}}/g, letterData.recipient?.name?.split(' ').pop() || '');

    // Replace the main letter body, safely handling if content is null.
    const formattedBody = (letterData.content || '').split('\n').filter(p => p.trim() !== '').map(p => `<p>${p}</p>`).join('');
    html = html.replace('{{body}}', formattedBody);

    // --- FIX END ---

    const fullHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>${template.css_content}</style>
      </head>
      <body>
        ${html}
      </body>
      </html>
    `;
    
    return fullHtml;
  } catch (error) {
    console.error("Error rendering template:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return `<html><body><h1>Error rendering template</h1><pre>${errorMessage}</pre></body></html>`;
  }
}

/**
 * This function is kept for DOCX support.
 */
export function renderTemplateContent(template: Template, content: string): string {
  const parsedContent = parseLetterContent(content);
  let html = template.html_content;
  html = html.replace('{{header}}', parsedContent.header.join('<br>'));
  html = html.replace('{{greeting}}', parsedContent.greeting);
  html = html.replace('{{introduction}}', parsedContent.introduction.map(line => `<p>${line}</p>`).join(''));
  html = html.replace('{{body}}', parsedContent.body.map(line => `<p>${line}</p>`).join(''));
  html = html.replace('{{conclusion}}', parsedContent.conclusion.map(line => `<p>${line}</p>`).join(''));
  html = html.replace('{{signature}}', parsedContent.signature.join('<br>'));
  return html;
}