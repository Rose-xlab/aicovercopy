//C:\Users\mukas\Downloads\project-bolt-sb1-guerg2d9\project\app\dashboard\cover-letters\components\CoverLetterPreview.tsx

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
  height = "900px",
  defaultZoom = 100,
  removeCard = false,
}: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(defaultZoom);
  const [contentHeight, setContentHeight] = useState("auto");
  const [totalPages, setTotalPages] = useState(1);

  console.log("1..........", totalPages)
  useEffect(() => {
    setZoom(defaultZoom);
  }, [defaultZoom]);

  // Function to replace template placeholders with actual data
  const processTemplateContent = (
    content: string,
    coverLetter: CoverLetter
  ) => {
    // --- FIX START ---
    // Add a safety check to ensure 'content' is a string before processing.
    // This prevents the "processedContent.replace is not a function" error.
    if (typeof content !== 'string' || !content) {
      return "";
    }
    // --- FIX END ---

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
            
            padding: 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
           .page {
            width: 8.5in;
            min-height: 11in;
            max-height: 11in;
            background: white;
            margin-bottom: 20px;
            padding: 1in;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            font-family: 'Times New Roman', Times, serif;
            line-height: 1.6;
            color: #333;
            transform: scale(${zoom / 100});
            transform-origin: top center;
            margin-bottom: ${20 * (zoom / 100)}px;
            overflow: hidden;
            page-break-after: always;
            position: relative;
          }
          
          .page-content {
            height: 100%;
            overflow: hidden;
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
            // margin-bottom: 30px;
            // text-align: justify;
             orphans: 2;
            widows: 2;
          }
          /* Pagination styles */
          .page-break {
            page-break-before: always;
            break-before: page;
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
             .letter-container {
              background: white;
              padding: 0;
            }
            
            .page {
              transform: none !important;
              margin-bottom: 0;
              box-shadow: none;
              page-break-after: always;
            }  
          }
              @page {
            size: 8.5in 11in;
            margin: 1in;
          }
        </style>
      </head>
      <body>
        <div class="letter-container">
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
          
          <div class="date">
            ${currentDate}
          </div>
          
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
          
          <div class="salutation">
            Dear ${recipientName || recipientTitle || "Hiring Manager"},
          </div>
          
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
          
          <div class="closing">
            <p>Sincerely,</p>
            <div class="signature-space"></div>
            <div class="signature-name">${senderName || "[Your Name]"}</div>
          </div>
        </div>

        <script>
          function handlePagination() {
            const pages = document.querySelectorAll('.page');
            const pageHeight = 11 * 96; 
            const contentPadding = 2 * 96; 
            const availableHeight = pageHeight - contentPadding;
            
            pages.forEach((page, index) => {
              const content = page.querySelector('.page-content');
              if (content && content.scrollHeight > availableHeight) {
               console.log('Page', index + 1, 'content overflows');
              }
            });
          }
          
          window.addEventListener('load', handlePagination);
          
          function notifyParentHeight() {
            const container = document.querySelector('.document-container');
            if (container && window.parent) {
              const height = container.scrollHeight;
              window.parent.postMessage({ type: 'contentHeight', height }, '*');
            }
          }
          
          window.addEventListener('load', notifyParentHeight);
          window.addEventListener('resize', notifyParentHeight);
        </script>

      </body>
      </html>
    `;
  };


 const generateStyledHTML2 = (coverLetter: CoverLetter) => {
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
    const recipientCompany = coverLetter.companyName || coverLetter.recipient?.company || "";
    const recipientAddress = coverLetter.recipient?.address || "";

    // Process the main content
    const processedContent = coverLetter.content || "";

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
            background: #f5f5f5;
            padding: 0;
            margin: 0;
        }

        .document-container {
            width: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 20px;
            min-height: 100vh;
        }

        .page {
            width: 8.5in;
            height: 11in;
            background: white;
            margin-bottom: 20px;
            padding: 1in;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            transform: scale(${zoom / 100});
            transform-origin: top center;
            position: relative;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }

        .page:last-child {
            margin-bottom: 0;
        }

        .page-content {
            height: 100%;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }

        /* Hide header elements on continuation pages */
        .page.continuation .header,
        .page.continuation .date,
        .page.continuation .recipient-info,
        .page.continuation .salutation {
            display: none;
        }
        
        /* Content styles */
        .header { 
            margin-bottom: 30px; 
            flex-shrink: 0;
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
            flex-shrink: 0;
        }
        
        .recipient-info { 
            margin-bottom: 30px; 
            flex-shrink: 0;
        }
        
        .recipient-info div { 
            margin-bottom: 4px; 
        }
        
        .recipient-name { 
            font-weight: bold; 
        }
        
        .salutation { 
            margin-bottom: 20px; 
            flex-shrink: 0;
        }
        
        .letter-body { 
            flex: 1;
            overflow: hidden;
        }
        
        .letter-body p, .paragraph { 
            margin-bottom: 16px; 
            text-indent: 0;
            orphans: 2;
            widows: 2;
        }
        
        .closing { 
            margin-top: 30px; 
            flex-shrink: 0;
        }
        
        .signature-space { 
            margin: 40px 0 20px 0; 
            height: 60px; 
        }
        
        .signature-name { 
            font-weight: bold; 
        }

        /* Page number indicator */
        .page-number {
            position: absolute;
            bottom: 0.5in;
            right: 0.5in;
            font-size: 12px;
            color: #666;
            display: none;
        }

        .page:not(:first-child) .page-number {
            display: block;
        }

        @media print {
            body {
                background: white;
                padding: 0;
            }
            
            .page {
                transform: none !important;
                margin: 0;
                box-shadow: none;
                page-break-after: always;
            }
            
            .page:last-child {
                page-break-after: avoid;
            }
            
            .page-number {
                display: none !important;
            }
        }
        
        @page {
            size: 8.5in 11in;
            margin: 1in;
        }
    </style>
</head>
<body>
    <div class="document-container" id="documentContainer">
        <div class="page" id="page-1">
            <div class="page-content">
                ${
                    senderName || senderAddress || senderEmail || senderPhone
                        ? `
                        <div class="header">
                            <div class="sender-info">
                                ${senderName ? `<div class="sender-name">${senderName}</div>` : ""}
                                ${senderAddress ? `<div>${senderAddress}</div>` : ""}
                                ${senderEmail ? `<div>${senderEmail}</div>` : ""}
                                ${senderPhone ? `<div>${senderPhone}</div>` : ""}
                            </div>
                        </div>`
                        : ""
                }
                
                <div class="date">
                    ${currentDate}
                </div>
                
                ${
                    recipientName || recipientTitle || recipientCompany || recipientAddress
                        ? `
                        <div class="recipient-info">
                            ${recipientName ? `<div class="recipient-name">${recipientName}</div>` : ""}
                            ${recipientTitle ? `<div>${recipientTitle}</div>` : ""}
                            ${recipientCompany ? `<div>${recipientCompany}</div>` : ""}
                            ${recipientAddress ? `<div>${recipientAddress}</div>` : ""}
                        </div>`
                        : ""
                }
                
                <div class="salutation">
                    Dear ${recipientName || recipientTitle || "Hiring Manager"},
                </div>
                
                <div class="letter-body" id="letterBody">
                    ${
                        processedContent
                            ? processedContent
                                .split("\n\n")
                                .filter((paragraph) => paragraph.trim())
                                .map((paragraph, index) => 
                                    `<p data-paragraph="${index}">${paragraph.trim()}</p>`
                                )
                                .join("")
                            : '<p>No content available</p>'
                    }
                </div>
                
                <div class="closing" id="closingSection">
                    <p>Sincerely,</p>
                    <div class="signature-space"></div>
                    <div class="signature-name">${senderName || "[Your Name]"}</div>
                </div>
            </div>
            <div class="page-number">Page 1</div>
        </div>
    </div>

    <script>
        let totalPages = 1;

        function createNewPage(pageNumber) {
            const container = document.getElementById('documentContainer');
            const newPage = document.createElement('div');
            newPage.className = 'page continuation';
            newPage.id = \`page-\${pageNumber}\`;
            
            newPage.innerHTML = \`
                <div class="page-content">
                    <div class="letter-body">
                        </div>
                    <div class="closing" style="display: none;">
                        <p>Sincerely,</p>
                        <div class="signature-space"></div>
                        <div class="signature-name">${senderName || "[Your Name]"}</div>
                    </div>
                </div>
                <div class="page-number">Page \${pageNumber}</div>
            \`;
            
            container.appendChild(newPage);
            return newPage;
        }

        function handlePagination() {
            const firstPage = document.getElementById('page-1');
            const letterBody = document.getElementById('letterBody');
            const closingSection = document.getElementById('closingSection');
            
            if (!firstPage || !letterBody) return;

            // Clear any existing additional pages
            const container = document.getElementById('documentContainer');
            const existingPages = container.querySelectorAll('.page:not(#page-1)');
            existingPages.forEach(page => page.remove());
            totalPages = 1;

            // Get the actual available height for content
            const pageContent = firstPage.querySelector('.page-content');
            const pageHeight = pageContent.offsetHeight;
            
            // Calculate used height by static elements
            const header = firstPage.querySelector('.header');
            const date = firstPage.querySelector('.date');
            const recipientInfo = firstPage.querySelector('.recipient-info');
            const salutation = firstPage.querySelector('.salutation');
            const closing = closingSection;
            
            let usedHeight = 0;
            if (header) usedHeight += header.offsetHeight + 30; // margin-bottom
            if (date) usedHeight += date.offsetHeight + 40; // margin-bottom
            if (recipientInfo) usedHeight += recipientInfo.offsetHeight + 30; // margin-bottom
            if (salutation) usedHeight += salutation.offsetHeight + 20; // margin-bottom
            if (closing) usedHeight += closing.offsetHeight + 30; // margin-top
            
            const availableHeight = pageHeight - usedHeight;
            
            // Get all paragraphs
            const paragraphs = Array.from(letterBody.querySelectorAll('p'));
            if (paragraphs.length === 0) {
                notifyParentDimensions();
                return;
            }
            
            // Measure paragraph heights
            let currentHeight = 0;
            let currentPageParagraphs = [];
            let pageNumber = 1;
            
            paragraphs.forEach((paragraph, index) => {
                const paragraphHeight = paragraph.offsetHeight;
                
                // Check if this paragraph would overflow the current page
                if (currentHeight + paragraphHeight > availableHeight && currentPageParagraphs.length > 0) {
                    // Create new page and move remaining content
                    pageNumber++;
                    totalPages = pageNumber;
                    
                    const newPage = createNewPage(pageNumber);
                    const newLetterBody = newPage.querySelector('.letter-body');
                    const newClosing = newPage.querySelector('.closing');
                    
                    // Move remaining paragraphs to new page
                    const remainingParagraphs = paragraphs.slice(index);
                    remainingParagraphs.forEach(p => {
                        newLetterBody.appendChild(p.cloneNode(true));
                        p.remove();
                    });
                    
                    // Show closing on the last page
                    if (newClosing) {
                        newClosing.style.display = 'block';
                    }
                    
                    // Hide closing on first page if there are multiple pages
                    if (closingSection) {
                        closingSection.style.display = 'none';
                    }
                    
                    return; // Exit the loop as we've handled the rest
                }
                
                currentHeight += paragraphHeight;
                currentPageParagraphs.push(paragraph);
            });
            
            // If all content fits on one page, ensure closing is visible
            if (totalPages === 1 && closingSection) {
                closingSection.style.display = 'block';
            }
            
            notifyParentDimensions();
        }

        function notifyParentDimensions() {
            if (window.parent) {
                const container = document.getElementById('documentContainer');
                const height = container ? container.scrollHeight : 0;
                
                window.parent.postMessage({ 
                    type: 'contentHeight', 
                    height: height,
                    pages: totalPages 
                }, '*');
            }
        }

        // Wait for content to be fully rendered before paginating
        function initializePagination() {
            // Use multiple methods to ensure content is ready
            if (document.readyState === 'complete') {
                setTimeout(handlePagination, 50);
            } else {
                window.addEventListener('load', () => {
                    setTimeout(handlePagination, 50);
                });
            }
            
            // Also handle font loading
            if (document.fonts && document.fonts.ready) {
                document.fonts.ready.then(() => {
                    setTimeout(handlePagination, 50);
                });
            }
        }

        // Initialize pagination
        initializePagination();

        // Handle resize
        var resizeTimeout; // Use 'var' to prevent re-declaration error
        window.addEventListener('resize', () => {
          clearTimeout(resizeTimeout);
          resizeTimeout = setTimeout(handlePagination, 100);
        });

        // Handle zoom changes by re-paginating
        let lastZoom = ${zoom};
        function checkZoomChange() {
            const currentZoom = ${zoom};
            if (currentZoom !== lastZoom) {
                lastZoom = currentZoom;
                setTimeout(handlePagination, 100);
            }
        }
        
        setInterval(checkZoomChange, 500);
    </script>
</body>
</html>`;
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
        //   html = generateStyledHTML(coverLetter);
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


   // Listen for height updates from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // if (event.data.type === 'contentHeight') {
      //   setContentHeight(`${event.data.height}px`);
      // }
        if (event.data.type === 'contentHeight') {
        const newHeight = event.data.height;
        const pages = event.data.pages || 1;
        
        setTotalPages(pages);
        console.log("..........2", totalPages)

        // Set content height to accommodate all pages
        if (height === "auto") {
          setContentHeight(`${newHeight}px`);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [height, totalPages]);

  const CardWrapper = removeCard ? React.Fragment : Card;
  const CardContentWrapper = removeCard ? React.Fragment : CardContent;
  const finalHeight = height === "auto" ? contentHeight : height;
console.log("..........3", totalPages)

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
          {totalPages > 1 && (
            <div className="absolute top-2 right-2 bg-background/90 px-2 py-1 rounded text-xs text-muted-foreground z-20">
              {totalPages} page{totalPages > 1 ? 's' : ''}
            </div>
          )}
          <iframe
            ref={iframeRef}
            title="Cover Letter Preview"
            className="w-full border-0 bg-white"
            style={{ 
              height: finalHeight, 
              minHeight: finalHeight === "auto" ? "600px" : finalHeight 
            }}
            sandbox="allow-same-origin allow-scripts"
          />
        </div>
      </CardContentWrapper>
      {/* <CardContentWrapper className={removeCard ? "" : "p-0"}>
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
            style={{ 
              height: finalHeight, 
              minHeight: finalHeight === "auto" ? "600px" : finalHeight 
            }}
            sandbox="allow-same-origin allow-scripts"
          />
        </div>
      </CardContentWrapper> */}
    </CardWrapper>
  );
}