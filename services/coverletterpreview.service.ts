import { createBrowserClient } from "@/lib/supabase";
import type { CoverLetter} from '@/types/cover-letter'


const supabase = createBrowserClient();

// Create a function that processes the template and returns the result
export async function getCoverLetterPreviewData(coverLetter: CoverLetter, templateId?: string, zoom: number = 100) {
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
    const sender = typeof coverLetter.sender === "string" 
      ? JSON.parse(coverLetter.sender) 
      : coverLetter.sender || {};
  
    const recipient = typeof coverLetter.recipient === "string"
      ? JSON.parse(coverLetter.recipient)
      : coverLetter.recipient || {};
  
    // Create variable mappings (same as in the component)
    const variables = {
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
      date: coverLetter.createdAt ? new Date(coverLetter.createdAt).toLocaleDateString() : new Date().toLocaleDateString(),
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
  
        patterns.forEach(pattern => {
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
        name: template.name
      },
      processedAt: new Date().toISOString()
    };
  }

  function getFallbackTemplate () {

    return normalizeTemplate({
      id: 'fallback-template',
      name: 'Professional Template',
      description: 'Professional cover letter template with proper formatting',
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
      `
    });

    // return normalizeTemplate({
    //   id: 'fallback-template',
    //   name: 'Fallback Template',
    //   description: 'Basic fallback template',
    //   htmlContent: `
    //     <div class="container">
    //       <header>
    //         <div class="sender-info">
    //           {first_name} {{last_name}}
    //           {{email}}
    //           {{phone}}
    //           {{location}}
    //         </div>
            
    //         <div class="date">
    //           {{date}}
    //         </div>
            
    //         <div class="recipient-info">
    //           {{recipient_name}}
    //           {{job_title}}
    //           {{company_name}}
    //           {{company_address}}
    //         </div>
    //       </header>
          
    //       <main>
    //         <div class="salutation">
    //           Dear {{recipient_name}},
    //         </div>
            
    //         <div class="content">
    //           <div class="opening">
    //             {content}
    //           </div>
    //         </div>
            
    //         <div class="signature">
    //           Sincerely,<br>
    //           {{first_name}} {{last_name}}
    //         </div>
    //       </main>
    //     </div>
    //   `,
    //   cssContent: `
    //     body {
    //       font-family: Arial, sans-serif;
    //       margin: 0;
    //       padding: 20px;
    //       color: #333;
    //       line-height: 1.6;
    //     }
        
    //     .container {
    //       max-width: 800px;
    //       margin: 0 auto;
    //       padding: 40px;
    //     }
        
    //     .sender-info {
    //       margin-bottom: 20px;
    //     }
        
    //     .date {
    //       margin-bottom: 20px;
    //     }
        
    //     .recipient-info {
    //       margin-bottom: 30px;
    //     }
        
    //     .salutation {
    //       margin-bottom: 20px;
    //     }
        
    //     .content {
    //       margin-bottom: 30px;
    //     }
        
    //     .signature {
    //       margin-top: 40px;
    //     }
    //   `
    // });
  };
  
  // Usage example:
  // const result = await getCoverLetterPreviewData(coverLetter, templateId);
  // result.html contains the processed HTML
  // result.variables contains all the processed variables


  function normalizeTemplate (template)  {
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
  };