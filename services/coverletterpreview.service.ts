import { createBrowserClient } from "@/lib/supabase";
import type { CoverLetter } from "@/types/cover-letter";

const supabase = createBrowserClient();

// Create a function that processes the template and returns the result
export async function getCoverLetterPreviewData(
  coverLetter: CoverLetter,
  templateId?: string,
  zoom: number = 100
) {
  // This is a simplified version of the template processing logic from CoverLetterPreview
  async function getTemplate() {
    if (!coverLetter) return getFallbackTemplate();

    try {
      const { data: templateData, error: templateError } = await supabase
        .from("templates")
        .select("*")
        .eq("id", templateId || coverLetter.templateId)
        .maybeSingle();

      if (!templateError && templateData) {
        return normalizeTemplate(templateData);
      }
      return getFallbackTemplate();
    } catch (error) {
      console.error("Error fetching template:", error);
      return getFallbackTemplate();
    }
  }

  const template = await getTemplate();
  if (!template) throw new Error("Failed to load template");

  // Process the template with cover letter data
  let html = template.htmlContent || "";
  const css = template.cssContent || "";

  // Process sender and recipient data
  const sender =
    typeof coverLetter.sender === "string"
      ? JSON.parse(coverLetter.sender)
      : coverLetter.sender || {};

  const recipient =
    typeof coverLetter.recipient === "string"
      ? JSON.parse(coverLetter.recipient)
      : coverLetter.recipient || {};

  // Create comprehensive variable mappings
  const variables = {
    // Header section
    header: generateHeaderHtml(sender, recipient),

    // Greeting
    greeting: `Dear ${recipient.name || "Hiring Manager"},`,

    // Introduction
    introduction: generateIntroduction(coverLetter),

    // Body content
    body: formatBodyContent(coverLetter.content || ""),

    // Conclusion
    conclusion: generateConclusion(coverLetter),

    // Signature
    signature: `
        <p>Sincerely,</p>
        <div style="margin: 40px 0 20px 0; height: 60px;"></div>
        <p>${sender.name || "[Your Name]"}</p>
      `,

    // Individual fields for fallback
    name: sender.name || "",
    email: sender.email || "",
    phone: sender.phone || "",
    address: sender.address || "",
    "job-title": coverLetter.jobTitle || "",
    "company-name": coverLetter.companyName || recipient.company || "",
    "recipient-name": recipient.name || "Hiring Manager",
    "recipient-title": recipient.title || "",
    "recipient-company": recipient.company || "",
    "recipient-address": recipient.address || "",
    content: coverLetter.content || "",
    date: new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
  };
  // Process template variables with comprehensive replacement
  html = processTemplateVariables(html, variables);

  // Create variable mappings (same as in the component)
  const variables3 = {
    // Sender info
    name: sender.name || "",
    email: sender.email || "",
    phone: sender.phone || "",
    address: sender.address || "",

    // Job and company info
    "JOB-TITLE": coverLetter.jobTitle || "",
    company_name: coverLetter.companyName || recipient.company || "",

    // Recipient info
    "recipient-name": recipient.name || "",
    recipient_title: recipient.title || "",
    recipient_company: recipient.company || "",
    recipient_address: recipient.address || "",

    // Content and date
    body: coverLetter.content || "",
    content: coverLetter.content || "",
    date: coverLetter.createdAt
      ? new Date(coverLetter.createdAt).toLocaleDateString()
      : new Date().toLocaleDateString(),
  };

  // Process template variables
  Object.entries(variables).forEach(([key, value]) => {
    if (value) {
      const patterns = [
        new RegExp(`\\{${key}\\}`, "g"),
        new RegExp(`\\{\\{${key}\\}\\}`, "g"),
        new RegExp(`\\{${key.replace("_", "-")}\\}`, "g"),
        new RegExp(`\\{\\{${key.replace("_", "-")}\\}\\}`, "g"),
      ];

      patterns.forEach((pattern) => {
        html = html.replace(pattern, value);
      });
    }
  });

  // Generate the final HTML with styles
  const fullHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${variables.name || "Cover Letter"}</title>
        <style>
          ${css}
          body {
            zoom: ${zoom / 100};
            -moz-transform: scale(${zoom / 100});
            -moz-transform-origin: 0 0;
          }
        </style>
      </head>
      <body>${html}</body>
      </html>
    `;

  return {
    html: fullHtml,
    variables,
    template: {
      id: template.id,
      name: template.name,
    },
    processedAt: new Date().toISOString(),
  };
}

// Helper function to process template variables
function processTemplateVariables(
  html: string,
  variables: Record<string, string>
): string {
  let processedHtml = html;

  Object.entries(variables).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      // Handle different placeholder patterns
      const patterns = [
        // Double curly braces (mustache style) - most common
        new RegExp(`\\{\\{${key}\\}\\}`, "gi"),
        new RegExp(`\\{\\{${key.replace(/-/g, "_")}\\}\\}`, "gi"),
        new RegExp(`\\{\\{${key.replace(/_/g, "-")}\\}\\}`, "gi"),

        // Single curly braces
        new RegExp(`\\{${key}\\}`, "gi"),
        new RegExp(`\\{${key.replace(/-/g, "_")}\\}`, "gi"),
        new RegExp(`\\{${key.replace(/_/g, "-")}\\}`, "gi"),
      ];

      patterns.forEach((pattern) => {
        processedHtml = processedHtml.replace(pattern, value);
      });
    }
  });
  // Clean up any remaining empty placeholders
  processedHtml = processedHtml.replace(/\{\{[^}]*\}\}/g, "");
  processedHtml = processedHtml.replace(/\{[^}]*\}/g, "");

  return processedHtml;
}

// Helper function to generate header HTML
function generateHeaderHtml(sender: any, recipient: any): string {
  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `
    <div style="text-align: right; margin-bottom: 40px;">
      ${
        sender.name
          ? `<div style="font-weight: bold; font-size: 16px; margin-bottom: 8px;">${sender.name}</div>`
          : ""
      }
      ${sender.address ? `<div>${sender.address}</div>` : ""}
      ${sender.email ? `<div>${sender.email}</div>` : ""}
      ${sender.phone ? `<div>${sender.phone}</div>` : ""}
    </div>
    
    <div style="margin-bottom: 40px; text-align: left;">
      ${currentDate}
    </div>
    
    ${
      recipient.name || recipient.company
        ? `
      <div style="margin-bottom: 30px;">
        ${
          recipient.name
            ? `<div style="font-weight: bold;">${recipient.name}</div>`
            : ""
        }
        ${recipient.title ? `<div>${recipient.title}</div>` : ""}
        ${recipient.company ? `<div>${recipient.company}</div>` : ""}
        ${recipient.address ? `<div>${recipient.address}</div>` : ""}
      </div>
    `
        : ""
    }
  `;
}

// Helper function to generate introduction
function generateIntroduction(coverLetter: CoverLetter): string {
  const jobTitle = coverLetter.jobTitle || "the position";
  const companyName = coverLetter.companyName || "your company";

  return `
    <p>I am writing to express my interest in ${jobTitle} at ${companyName}. ${
    coverLetter.content
      ? ""
      : "I am excited about the opportunity to contribute to your team with my skills and experience."
  }</p>
  `;
}

// Helper function to format body content
function formatBodyContent(content: string): string {
  if (!content) return "<p>Please add your cover letter content here.</p>";

  return content
    .split("\n\n")
    .filter((paragraph) => paragraph.trim())
    .map((paragraph) => `<p>${paragraph.trim()}</p>`)
    .join("");
}

// Helper function to generate conclusion
function generateConclusion(coverLetter: CoverLetter): string {
  const sender =
    typeof coverLetter.sender === "string"
      ? JSON.parse(coverLetter.sender)
      : coverLetter.sender || {};

  return `
    <p>I look forward to the opportunity to discuss how my skills and experience can contribute to your team's success. Thank you for considering my application.</p>
    <p style="margin-top: 30px;">Sincerely,</p>
    <div style="margin: 40px 0 20px 0; height: 60px;"></div>
    <p style="font-weight: bold;">${sender.name || "[Your Name]"}</p>
  `;
}

function getFallbackTemplate() {
  return normalizeTemplate({
    id: "fallback-template",
    name: "Professional Template",
    description: "Professional cover letter template with proper formatting",
    htmlContent: `
        <div class="letter-container">
          <!-- Sender Information -->
          <div class="header">
            <div class="sender-info">
              <div class="sender-name">{name}</div>
              <div>{address}</div>
              <div>{email}</div>
              <div>{phone}</div>
            </div>
          </div>
          
          <!-- Date -->
          <div class="date">
            {date}
          </div>
          
          <!-- Recipient Information -->
          <div class="recipient-info">
            <div class="recipient-name">{recipient-name}</div>
            <div>{recipient_title}</div>
            <div>{company_name}</div>
            <div>{recipient_address}</div>
          </div>
          
          <!-- Salutation -->
          <div class="salutation">
            Dear {recipient-name},
          </div>
          
          <!-- Letter Body -->
          <div class="letter-body">
            {content}
          </div>
          
          <!-- Closing -->
          <div class="closing">
            <p>Sincerely,</p>
            <div class="signature-space"></div>
            <div class="signature-name">{name}</div>
          </div>
        </div>
      `,
    cssContent: `
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Times New Roman', Times, serif;
          line-height: 1.6;
          color: #333;
          background: white;
          padding: 40px;
        }
        
        .letter-container {
          max-width: 8.5in;
          margin: 0 auto;
          background: white;
          min-height: 11in;
        }
        
        .header {
          margin-bottom: 30px;
        }
        
        .sender-info {
          text-align: right;
          margin-bottom: 40px;
        }
        
        .sender-info div {
          margin-bottom: 4px;
        }
        
        .sender-name {
          font-weight: bold;
          font-size: 16px;
          margin-bottom: 8px;
        }
        
        .date {
          margin-bottom: 40px;
          text-align: left;
        }
        
        .recipient-info {
          margin-bottom: 30px;
        }
        
        .recipient-info div {
          margin-bottom: 4px;
        }
        
        .recipient-name {
          font-weight: bold;
        }
        
        .salutation {
          margin-bottom: 20px;
        }
        
        .letter-body {
          margin-bottom: 30px;
          text-align: justify;
        }
        
        .letter-body p {
          margin-bottom: 16px;
          text-indent: 0;
        }
        
        .closing {
          margin-top: 30px;
        }
        
        .signature-space {
          margin: 40px 0 20px 0;
          height: 60px;
        }
        
        .signature-name {
          font-weight: bold;
        }
        
        @media print {
          body {
            padding: 0.5in;
          }
        }
      `,
  });
}

// Usage example:
// const result = await getCoverLetterPreviewData(coverLetter, templateId);
// result.html contains the processed HTML
// result.variables contains all the processed variables

function normalizeTemplate(template) {
  if (!template) return null;

  return {
    id: template.id || "fallback-template",
    name: template.name || "Fallback Template",
    description: template.description || "Basic cover letter template",
    htmlContent: template.htmlContent || template.html_content || "",
    cssContent: template.cssContent || template.css_content || "",
    metadata: template.metadata || {},
    // Add any additional template properties that need normalization
  };
}
