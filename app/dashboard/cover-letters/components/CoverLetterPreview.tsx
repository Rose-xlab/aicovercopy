"use client";

import React, { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { createBrowserClient } from "@/lib/supabase";
import type { CoverLetter} from '@/types/cover-letter'

const supabase = createBrowserClient();

interface props {
  coverLetter: CoverLetter,
  templateId?: string,
  height ?:string | "800px",
  defaultZoom : number,
  removeCard : boolean,
}

// This component handles rendering a cover letter with any template
export default function CoverLetterPreview({
  coverLetter,
  templateId,
  height = "800px",
  defaultZoom = 100,
  removeCard = false,
}: props) {
  const iframeRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(defaultZoom);

  const [template, setTemplate] = useState(getFallbackTemplate());

  useEffect(() => {
    setZoom(defaultZoom);
  }, [defaultZoom]);

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

  function getFallbackTemplate () {
    return normalizeTemplate({
      id: 'fallback-template',
      name: 'Fallback Template',
      description: 'Basic fallback template',
      htmlContent: `
        <div class="container">
          <header>
            <div class="sender-info">
              {first_name} {{last_name}}
              {{email}}
              {{phone}}
              {{location}}
            </div>
            
            <div class="date">
              {{date}}
            </div>
            
            <div class="recipient-info">
              {{recipient_name}}
              {{job_title}}
              {{company_name}}
              {{company_address}}
            </div>
          </header>
          
          <main>
            <div class="salutation">
              Dear {{recipient_name}},
            </div>
            
            <div class="content">
              <div class="opening">
                {content}
              </div>
            </div>
            
            <div class="signature">
              Sincerely,<br>
              {{first_name}} {{last_name}}
            </div>
          </main>
        </div>
      `,
      cssContent: `
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          color: #333;
          line-height: 1.6;
        }
        
        .container {
          max-width: 800px;
          margin: 0 auto;
          padding: 40px;
        }
        
        .sender-info {
          margin-bottom: 20px;
        }
        
        .date {
          margin-bottom: 20px;
        }
        
        .recipient-info {
          margin-bottom: 30px;
        }
        
        .salutation {
          margin-bottom: 20px;
        }
        
        .content {
          margin-bottom: 30px;
        }
        
        .signature {
          margin-top: 40px;
        }
      `
    });
  };

  // Fetch template when templateId changes
  useEffect(() => {
    async function fetchTemplate() {
      if (!coverLetter) return;

      try {
        const { data: templateData, error: templateError } = await supabase
          .from("templates")
          .select("*")
          .eq("id", coverLetter.templateId)
          .maybeSingle();

        if (!templateError && templateData) {
          setTemplate(normalizeTemplate(templateData));
        }
      } catch (error) {
        console.error("Error fetching template:", error);
      }
    }

    fetchTemplate();
  }, [coverLetter]);

  // Render template when coverLetter, template or zoom changes
  useEffect(() => {
    if (!coverLetter || !template) {
      setLoading(true);
      return;
    }

    const renderTemplate = () => {
      try {
        // Combine HTML and CSS from the template
        let html = template.htmlContent || "";
        const css = template.cssContent || "";

        // Extract sender and recipient from cover letter if they exist
        let sender = {};
        if (coverLetter.sender) {
          try {
            sender =
              typeof coverLetter.sender === "string"
                ? JSON.parse(coverLetter.sender)
                : coverLetter.sender;
          } catch (e) {
            console.error("Error parsing sender:", e);
          }
        }

        let recipient = {};
        if (coverLetter.recipient) {
          try {
            recipient =
              typeof coverLetter.recipient === "string"
                ? JSON.parse(coverLetter.recipient)
                : coverLetter.recipient;
          } catch (e) {
            console.error("Error parsing recipient:", e);
          }
        }

        // Create mappings for the specific variable formats in the template
        const specificVariables = {
          name: sender.name,
          "JOB-TITLE": coverLetter.jobTitle || "",
          "recipient-name": recipient.name ||  "",
          "sender-name": sender?.name || "" ,
          body: coverLetter.content || "",
        };

        // Create a general variable map for all other variables
        const generalVariables = {
          name: sender.name,
          email: sender.email || "",
          phone: sender.phone || "",
          address: sender.address || "",
          company_name: coverLetter.companyName || recipient.company || "",
          date: coverLetter.createdAt || new Date().toLocaleDateString(),
          content: coverLetter.content || "",

          // Add recipient fields
          recipient_name: recipient.name || coverLetter.recipient_name || "",
          recipient_title: recipient.title || coverLetter.recipient_title || "",
          recipient_company: recipient.company || "",
          recipient_address: recipient.address || "",
        };

        // Add all fields from coverLetter
        Object.entries(coverLetter).forEach(([key, value]) => {
          if (typeof value === "string" || typeof value === "number") {
            generalVariables[key] = value;
          }
        });

        // Add all sender fields
        Object.entries(sender).forEach(([key, value]) => {
          if (typeof value === "string" || typeof value === "number") {
            generalVariables[`sender_${key}`] = value;
            generalVariables[key] = generalVariables[key] || value; // Use as fallback
          }
        });

        // Add all recipient fields
        Object.entries(recipient).forEach(([key, value]) => {
          if (typeof value === "string" || typeof value === "number") {
            generalVariables[`recipient_${key}`] = value;
          }
        });

        // Replace the specific variable formats first
        Object.entries(specificVariables).forEach(([key, value]) => {
          if (value) {
            const regex = new RegExp(`\\{${key}\\}`, "g");
            html = html.replace(regex, value);
          }
        });

        // Special handling for the body tag
        html = html.replace(/\{body\}/g, coverLetter.content || "");

        // Replace general variables as a fallback
        Object.entries(generalVariables).forEach(([key, value]) => {
          if (value) {
            // Try different formats
            const formats = [
              new RegExp(`\\{${key}\\}`, "g"),
              new RegExp(`\\{\\{${key}\\}\\}`, "g"),
              new RegExp(`\\{${key.replace("_", "-")}\\}`, "g"),
              new RegExp(`\\{\\{${key.replace("_", "-")}\\}\\}`, "g"),
            ];

            formats.forEach((regex) => {
              html = html.replace(regex, value);
            });
          }
        });

        // Create complete HTML document with inline CSS
        const fullHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${specificVariables.name || "Cover Letter"}</title>
            <style>
              ${css}
              body {
                zoom: ${zoom / 100};
                -moz-transform: scale(${zoom / 100});
                -moz-transform-origin: 0 0;
              }
            </style>
          </head>
          <body>
            ${html}
          </body>
          </html>
        `;

        // Update the iframe content
        const iframe = iframeRef.current;
        if (iframe) {
          const iframeDoc =
            iframe.contentDocument || iframe.contentWindow.document;
          iframeDoc.open();
          iframeDoc.write(fullHtml);
          iframeDoc.close();
        }
      } catch (error) {
        console.error("Error rendering template:", error);
      } finally {
        setLoading(false);
      }
    };

    renderTemplate();
  }, [coverLetter, template, zoom]); // Include template in dependencies since we use it

  const CardWrapper = removeCard ? React.Fragment : Card;
  const CardContentWrapper = removeCard ? React.Fragment : CardContent;

  return (
    <CardWrapper>
      <CardContentWrapper className={removeCard ? "" : "p-0"}>
        <div className="relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80">
              <div className="animate-pulse">Loading preview...</div>
            </div>
          )}
          <iframe
            ref={iframeRef}
            title="Cover Letter Preview"
            className="w-full border-0"
            style={{ height, background: "white" }}
            sandbox="allow-same-origin"
          />
        </div>
      </CardContentWrapper>
    </CardWrapper>
  );
}