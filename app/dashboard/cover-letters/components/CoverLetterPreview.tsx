"use client";

import React, { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import type { CoverLetter } from "@/types/cover-letter";
import { getCoverLetterPreviewData } from "@/services/coverletterpreview.service";

interface Props {
  coverLetter: CoverLetter;
  templateId?: string;
  height?: string | "800px";
  defaultZoom?: number;
  removeCard?: boolean;
}



export default function CoverLetterPreview({
  coverLetter,
  templateId,
  height = "800px",
  defaultZoom = 100,
  removeCard = false,
}: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(defaultZoom);

  useEffect(() => {
    setZoom(defaultZoom);
  }, [defaultZoom]);

  // Function to replace template placeholders with actual data
  const processTemplateContent = (
    content: string,
    coverLetter: CoverLetter
  ) => {
    if (!content) return "";

    const replacements: Record<string, string> = {
      "{first_name}": coverLetter.sender?.name?.split(" ")[0] || "",
      "{last_name}":
        coverLetter.sender?.name?.split(" ").slice(1).join(" ") || "",
      "{email}": coverLetter.sender?.email || "",
      "{phone}": coverLetter.sender?.phone || "",
      "{location}": coverLetter.sender?.address || "",
      "{recipient_name}": coverLetter.recipient?.name || "Hiring Manager",
      "{job_title}": coverLetter.jobTitle || "",
      "{company_name}":
        coverLetter.companyName || coverLetter.recipient?.company || "",
      "{company_address}": coverLetter.recipient?.address || "",
      "{date}": new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    };

    let processedContent = content;
    Object.entries(replacements).forEach(([placeholder, value]) => {
      const regex = new RegExp(placeholder.replace(/[{}]/g, "\\$&"), "g");
      processedContent = processedContent.replace(regex, value);
    });

    return processedContent;
  };

  // Generate styled HTML content
  const generateStyledHTML = (coverLetter: CoverLetter) => {
    const currentDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const senderName = coverLetter.sender?.name || "";
    const senderAddress = coverLetter.sender?.address || "";
    const senderEmail = coverLetter.sender?.email || "";
    const senderPhone = coverLetter.sender?.phone || "";

    const recipientName = coverLetter.recipient?.name || "";
    const recipientTitle = coverLetter.recipient?.title || "Hiring Manager";
    const recipientCompany =
      coverLetter.companyName || coverLetter.recipient?.company || "";
    const recipientAddress = coverLetter.recipient?.address || "";

    const jobTitle = coverLetter.jobTitle || "";

    // Process the main content to replace any remaining placeholders
    const processedContent = processTemplateContent(
      coverLetter.content || "",
      coverLetter
    );

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Cover Letter Preview</title>
        <style>
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
            transform: scale(${zoom / 100});
            transform-origin: top left;
            width: ${zoom === 100 ? "100%" : `${10000 / zoom}%`};
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
              transform: none !important;
              width: 100% !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="letter-container">
          <!-- Sender Information -->
          ${
            senderName || senderAddress || senderEmail || senderPhone
              ? `
            <div class="header">
              <div class="sender-info">
                ${
                  senderName
                    ? `<div class="sender-name">${senderName}</div>`
                    : ""
                }
                ${senderAddress ? `<div>${senderAddress}</div>` : ""}
                ${senderEmail ? `<div>${senderEmail}</div>` : ""}
                ${senderPhone ? `<div>${senderPhone}</div>` : ""}
              </div>
            </div>
          `
              : ""
          }
          
          <!-- Date -->
          <div class="date">
            ${currentDate}
          </div>
          
          <!-- Recipient Information -->
          ${
            recipientName ||
            recipientTitle ||
            recipientCompany ||
            recipientAddress
              ? `
            <div class="recipient-info">
              ${
                recipientName
                  ? `<div class="recipient-name">${recipientName}</div>`
                  : ""
              }
              ${recipientTitle ? `<div>${recipientTitle}</div>` : ""}
              ${recipientCompany ? `<div>${recipientCompany}</div>` : ""}
              ${recipientAddress ? `<div>${recipientAddress}</div>` : ""}
            </div>
          `
              : ""
          }
          
          <!-- Salutation -->
          <div class="salutation">
            Dear ${recipientName || recipientTitle || "Hiring Manager"},
          </div>
          
          <!-- Letter Body -->
          <div class="letter-body">
            ${
              processedContent
                ? processedContent
                    .split("\n\n")
                    .map((paragraph) =>
                      paragraph.trim() ? `<p>${paragraph.trim()}</p>` : ""
                    )
                    .join("")
                : "<p>No content available</p>"
            }
          </div>
          
          <!-- Closing -->
          <div class="closing">
            <p>Sincerely,</p>
            <div class="signature-space"></div>
            <div class="signature-name">${senderName || "[Your Name]"}</div>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  useEffect(() => {
    const loadAndRenderPreview = async () => {
      if (!coverLetter) {
        setLoading(true);
        return;
      }

      try {
        setLoading(true);
        let html;

          try {
           
            const result = await getCoverLetterPreviewData(
              coverLetter,
              templateId,
              zoom
            );
            html = result.html;
          } catch (error) {
            console.log(
              "Template service not available"
            );
            html = generateStyledHTML(coverLetter);
          }
        // } else {
          // html = generateStyledHTML(coverLetter);
        // }

        // Update iframe content
        const iframe = iframeRef.current;
        if (iframe) {
          const iframeDoc =
            iframe.contentDocument || iframe.contentWindow?.document;
          if (iframeDoc) {
            iframeDoc.open();
            iframeDoc.write(html);
            iframeDoc.close();
          }
        }
      } catch (error) {
        console.error("Error loading preview:", error);

        // Set error HTML
        const errorHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Error</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                padding: 20px;
                color: #dc2626;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
              }
              .error-message {
                text-align: center;
                padding: 20px;
                border: 1px solid #dc2626;
                border-radius: 8px;
                background-color: #fef2f2;
              }
            </style>
          </head>
          <body>
            <div class="error-message">
              <p>Error loading cover letter preview. Please try again.</p>
            </div>
          </body>
          </html>
        `;

        const iframe = iframeRef.current;
        if (iframe) {
          const iframeDoc =
            iframe.contentDocument || iframe.contentWindow?.document;
          if (iframeDoc) {
            iframeDoc.open();
            iframeDoc.write(errorHtml);
            iframeDoc.close();
          }
        }
      } finally {
        setLoading(false);
      }
    };

    loadAndRenderPreview();
  }, [coverLetter, templateId, zoom]);

  const CardWrapper = removeCard ? React.Fragment : Card;
  const CardContentWrapper = removeCard ? React.Fragment : CardContent;

  return (
    <CardWrapper>
      <CardContentWrapper className={removeCard ? "" : "p-0"}>
        <div className="relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <span className="text-sm text-muted-foreground">
                  Loading preview...
                </span>
              </div>
            </div>
          )}
          <iframe
            ref={iframeRef}
            title="Cover Letter Preview"
            className="w-full border-0 bg-white"
            style={{ height, minHeight: height }}
            sandbox="allow-same-origin"
          />
        </div>
      </CardContentWrapper>
    </CardWrapper>
  );
}

