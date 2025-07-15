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
  const enhancedCSS = `
  ${css}
  
  /* ... existing styles ... */

  /* Continuation page styles - hide header elements */
  .page.continuation .header,
  .page.continuation .sender-info,
  .page.continuation .date,
  .page.continuation .recipient-info,
  .page.continuation .salutation,
  .page.continuation .closing {
    display: none !important;
  }

  /* Continuation page body styles */
  .continuation-body {
    margin-top: 0 !important;
    padding-top: 0 !important;
  }

  .continuation-body p:first-child {
    margin-top: 0;
    text-indent: 0;
  }

  /* Ensure proper spacing between pages */
  .page + .page {
    margin-top: 20px;
  }

  /* Print styles for proper page breaks */
  @media print {
    .page {
      page-break-after: always;
      margin-bottom: 0;
    }
    
    .page:last-child {
      page-break-after: avoid;
    }
    
    .page.continuation {
      page-break-before: always;
    }
  }
`;
  const enhancedCSS2 = `
    ${css}
    
    /* Reset and Base Styles */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    html, body {
      width: 100%;
      height: auto;
      margin: 0;
      padding: 0;
      background: #f5f5f5;
      font-family: 'Times New Roman', Times, serif;
      line-height: 1.6;
      color: #333;
    }

    .document-container {
      width: 100%;
      background: #f5f5f5;
      padding: 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
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

    .page-content {
      flex: 1;
      overflow: hidden;
      position: relative;
      height: 9in; 
    }

    /* Content spacing and typography */
    .letter-container p {
      margin-bottom: 16px;
      text-align: justify;
      orphans: 2;
      widows: 2;
    }

    .letter-container .header {
      margin-bottom: 30px;
    }

    .letter-container .sender-info {
      text-align: right;
      margin-bottom: 40px;
    }

    .letter-container .date {
      margin-bottom: 40px;
    }

    .letter-container .recipient-info {
      margin-bottom: 30px;
    }

    .letter-container .salutation {
      margin-bottom: 20px;
    }

    .letter-container .letter-body {
      margin-bottom: 30px;
      flex: 1;
    }

    .letter-container .closing {
      margin-top: auto;
    }

    .signature-space {
      height: 60px;
      margin: 40px 0 20px 0;
    }

    /* Print styles */
    @media print {
      html, body {
        background: white;
      }
      
      .document-container {
        background: white;
        padding: 0;
      }
      
      .page {
        transform: none !important;
        margin-bottom: 0;
        box-shadow: none;
        page-break-after: always;
        height: auto;
        min-height: 11in;
      }
      
      .page:last-child {
        page-break-after: avoid;
      }
    }

    @page {
      size: 8.5in 11in;
      margin: 1in;
    }

    /* Continuation page styles */
    .page.continuation .header,
    .page.continuation .date,
    .page.continuation .recipient-info,
    .page.continuation .salutation {
      display: none;
    }

    .page.continuation .page-content {
      padding-top: 0;
    }
       /* Pagination helper classes */
    .paginated-content {
      position: relative;
    }

    .content-block {
      break-inside: avoid;
      page-break-inside: avoid;
    }
  `;

  // Wrap HTML in proper page structure
  const wrappedHtml = `
    <div class="document-container" id="documentContainer">
      <div class="page" id="page1">
        <div class="page-content">
          <div class="letter-container" id="letterContent">
            ${html}
          </div>
        </div>
      </div>
    </div>
  `;

  // Generate the final HTML with styles

  const fullHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${variables.name || "Cover Letter"}</title>
  <style>
    ${enhancedCSS}
  </style>
</head>
<body>   
  ${wrappedHtml}
  <script>
    function handlePagination() {
      const container = document.getElementById('documentContainer');
      const firstPage = document.getElementById('page1');
      const letterContent = document.getElementById('letterContent');
      
      if (!container || !firstPage || !letterContent) return;

      const pageContentElement = firstPage.querySelector('.page-content');
      if (!pageContentElement) return;
      
      const availableHeight = pageContentElement.clientHeight;
      
      // Check if content overflows
      if (letterContent.scrollHeight <= availableHeight) {
        return; // No pagination needed
      }

      console.log('Starting pagination...');
      console.log('Available height per page:', availableHeight);
      console.log('Total content height:', letterContent.scrollHeight);

      // Identify sections
      const headerSection = letterContent.querySelector('.header');
      const dateSection = letterContent.querySelector('.date');
      const recipientSection = letterContent.querySelector('.recipient-info');
      const salutationSection = letterContent.querySelector('.salutation');
      const bodySection = letterContent.querySelector('.letter-body');
      const closingSection = letterContent.querySelector('.closing');

      // Calculate fixed sections height (header, date, recipient, salutation, closing)
      let fixedHeight = 0;
      
      [headerSection, dateSection, recipientSection, salutationSection, closingSection].forEach(section => {
        if (section) {
          fixedHeight += section.offsetHeight + 20; // Add some margin
        }
      });

      console.log('Fixed sections height:', fixedHeight);
      
      // Available space for body content on first page
      const firstPageBodySpace = availableHeight - fixedHeight;
      console.log('Available space for body on first page:', firstPageBodySpace);

      if (!bodySection) {
        console.log('No body section found');
        return;
      }

      // Get all paragraphs from the body
      const bodyParagraphs = Array.from(bodySection.querySelectorAll('p'));
      
      if (bodyParagraphs.length === 0) {
        console.log('No paragraphs found in body');
        return;
      }

      console.log('Found', bodyParagraphs.length, 'paragraphs to paginate');

      // Create measuring container
      const measuringContainer = document.createElement('div');
      measuringContainer.style.cssText = \`
        position: absolute;
        top: -9999px;
        left: -9999px;
        width: \${bodySection.clientWidth}px;
        font-family: inherit;
        font-size: inherit;
        line-height: inherit;
        visibility: hidden;
        padding: 0;
        margin: 0;
      \`;
      document.body.appendChild(measuringContainer);

      // Distribute paragraphs across pages
      let currentPageParagraphs = [];
      let currentHeight = 0;
      let pageNumber = 1;
      const continuationPages = [];

      bodyParagraphs.forEach((paragraph, index) => {
        // Measure paragraph height
        const clonedParagraph = paragraph.cloneNode(true);
        measuringContainer.appendChild(clonedParagraph);
        const paragraphHeight = clonedParagraph.offsetHeight + 16; // Add margin
        
        // Determine space limit for current page
        const spaceLimit = pageNumber === 1 ? firstPageBodySpace : availableHeight - 40;
        
        console.log(\`Paragraph \${index + 1}: height=\${paragraphHeight}px, currentTotal=\${currentHeight}px, limit=\${spaceLimit}px\`);
        
        // Check if paragraph fits on current page
        if (currentHeight + paragraphHeight > spaceLimit && currentPageParagraphs.length > 0) {
          // Save current page paragraphs
          if (pageNumber === 1) {
            // Store first page paragraphs
            updateFirstPageBody(bodySection, currentPageParagraphs);
          } else {
            // Store continuation page paragraphs
            continuationPages.push({
              pageNumber: pageNumber,
              paragraphs: [...currentPageParagraphs]
            });
          }
          
          // Start new page
          pageNumber++;
          currentPageParagraphs = [paragraph];
          currentHeight = paragraphHeight;
        } else {
          // Add to current page
          currentPageParagraphs.push(paragraph);
          currentHeight += paragraphHeight;
        }
        
        measuringContainer.removeChild(clonedParagraph);
      });

      // Handle remaining paragraphs
      if (currentPageParagraphs.length > 0) {
        if (pageNumber === 1) {
          updateFirstPageBody(bodySection, currentPageParagraphs);
        } else {
          continuationPages.push({
            pageNumber: pageNumber,
            paragraphs: [...currentPageParagraphs]
          });
        }
      }

      // Create continuation pages
      continuationPages.forEach(pageData => {
        createContinuationPage(container, pageData.pageNumber, pageData.paragraphs);
      });

      // Clean up
      document.body.removeChild(measuringContainer);
      
      console.log(\`Pagination complete. Created \${pageNumber} pages.\`);
    }

    function updateFirstPageBody(bodyElement, paragraphs) {
      bodyElement.innerHTML = '';
      paragraphs.forEach(p => {
        bodyElement.appendChild(p.cloneNode(true));
      });
      console.log(\`Updated first page with \${paragraphs.length} paragraphs\`);
    }

    function createContinuationPage(container, pageNumber, paragraphs) {
      const newPage = document.createElement('div');
      newPage.className = 'page continuation';
      newPage.id = \`page\${pageNumber}\`;
      
      const bodyContent = paragraphs.map(p => p.outerHTML).join('');
      
      newPage.innerHTML = \`
        <div class="page-content">
          <div class="letter-container">
            <div class="letter-body continuation-body">
              \${bodyContent}
            </div>
          </div>
        </div>
      \`;
      
      container.appendChild(newPage);
      console.log(\`Created continuation page \${pageNumber} with \${paragraphs.length} paragraphs\`);
    }

    function resetPagination() {
      const container = document.getElementById('documentContainer');
      if (!container) return;
      
      // Remove all continuation pages
      const continuationPages = container.querySelectorAll('.page.continuation');
      continuationPages.forEach(page => page.remove());
      
      // Reset first page content to original
      window.location.reload();
    }

    function notifyParentHeight() {
      const container = document.getElementById('documentContainer');
      if (container && window.parent) {
        const height = container.scrollHeight;
        window.parent.postMessage({ type: 'contentHeight', height }, '*');
      }
    }

    // Initialize pagination when page loads
    window.addEventListener('load', () => {
      console.log('Page loaded, starting pagination...');
      setTimeout(() => {
        handlePagination();
        notifyParentHeight();
      }, 200);
    });

    // Re-paginate on resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        console.log('Window resized, re-paginating...');
        resetPagination();
      }, 300);
    });
  </script>
</body>
</html>
`;

  const fullHtml2 = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${variables.name || "Cover Letter"}</title>
        <style>
           <style>
          ${enhancedCSS}
        </style>
        </style>
      </head>
      <body>   
       
${wrappedHtml}
    <script>
        function handlePagination() {
          const container = document.getElementById('documentContainer');
          const firstPage = document.getElementById('page1');
          const letterContent = document.getElementById('letterContent');
          
          if (!container || !firstPage || !letterContent) return;

          // Get actual page content dimensions
          const pageContentElement = firstPage.querySelector('.page-content');
          
          if (!pageContentElement) return;
          
          // Calculate available height more accurately
          const availableHeight = pageContentElement.clientHeight;
          
          // Check if content overflows
          if (letterContent.scrollHeight <= availableHeight) {
            return; // No pagination needed
          }

          console.log('Content overflows, starting pagination...');
          console.log('Available height:', availableHeight);
          console.log('Content height:', letterContent.scrollHeight);

          // Create a measuring container
          const measuringContainer = document.createElement('div');
          measuringContainer.style.cssText = \`
            position: absolute;
            top: -9999px;
            left: -9999px;
            width: \${letterContent.clientWidth}px;
            font-family: inherit;
            font-size: inherit;
            line-height: inherit;
            visibility: hidden;
            padding: 0;
            margin: 0;
          \`;
          document.body.appendChild(measuringContainer);

          // Get all elements recursively (including nested elements like paragraphs)
          const allElements = getAllPaginatableElements(letterContent);
          console.log(\`Found \${allElements.length} paginatable elements\`);
          
          let currentPageElements = [];
          let currentHeight = 0;
          let pageNumber = 1;

          // Clear the original content
          letterContent.innerHTML = '';

          // Process each element
          allElements.forEach((element, index) => {
            // Clone and measure the element
            const clonedElement = element.cloneNode(true);
            measuringContainer.appendChild(clonedElement);
            const elementHeight = clonedElement.offsetHeight;
            
            console.log(\`Element \${index} (\${element.tagName}): height = \${elementHeight}, current total = \${currentHeight}\`);
            
            // Check if adding this element would exceed page height
            if (currentHeight + elementHeight > availableHeight && currentPageElements.length > 0) {
              console.log(\`Creating page \${pageNumber} with \${currentPageElements.length} elements\`);
              
              // Add current elements to the current page
              addElementsToPage(pageNumber, currentPageElements, container);
              
              // Start new page
              pageNumber++;
              currentPageElements = [element];
              currentHeight = elementHeight;
            } else {
              // Add to current page
              currentPageElements.push(element);
              currentHeight += elementHeight;
            }
            
            measuringContainer.removeChild(clonedElement);
          });

          // Add remaining elements to the last page
          if (currentPageElements.length > 0) {
            console.log(\`Creating final page \${pageNumber} with \${currentPageElements.length} elements\`);
            addElementsToPage(pageNumber, currentPageElements, container);
          }

          // Clean up
          document.body.removeChild(measuringContainer);
          
          console.log(\`Pagination complete. Total pages: \${pageNumber}\`);
        }

        function getAllPaginatableElements(container) {
          const elements = [];
          
          // Function to recursively collect elements
          function collectElements(parent) {
            for (let child of parent.children) {
              // If it's a container div, go deeper
              if (child.tagName === 'DIV' && child.children.length > 0) {
                collectElements(child);
              } else {
                // It's a leaf element (p, h1, etc.) - add it
                elements.push(child);
              }
            }
          }
          
          collectElements(container);
          return elements;
        }

        function addElementsToPage(pageNumber, elements, container) {
          let targetPage;
          
          if (pageNumber === 1) {
            // Use existing first page
            targetPage = document.getElementById('page1');
            const letterContainer = targetPage.querySelector('.letter-container');
            if (letterContainer) {
              // Create the structure that the elements expect
              reconstructLetterStructure(letterContainer, elements);
            }
          } else {
            // Create new page
            targetPage = createNewPage(pageNumber, container);
            const letterContainer = targetPage.querySelector('.letter-container');
            if (letterContainer) {
              reconstructLetterStructure(letterContainer, elements);
            }
          }
        }

        function reconstructLetterStructure(container, elements) {
          // Group elements by their parent structure
          const headerElements = [];
          const bodyElements = [];
          const closingElements = [];
          
          elements.forEach(element => {
            // Determine where this element belongs based on its classes or content
            const elementText = element.textContent.toLowerCase();
            const elementClass = element.className;
            
            if (elementClass.includes('header') || 
                elementClass.includes('sender') || 
                elementClass.includes('date') || 
                elementClass.includes('recipient')) {
              headerElements.push(element);
            } else if (elementText.includes('sincerely') || 
                      elementText.includes('regards') || 
                      elementClass.includes('closing') || 
                      elementClass.includes('signature')) {
              closingElements.push(element);
            } else {
              bodyElements.push(element);
            }
          });
          
          // Create header section if we have header elements
          if (headerElements.length > 0) {
            const headerDiv = document.createElement('div');
            headerDiv.className = 'header';
            headerElements.forEach(el => headerDiv.appendChild(el));
            container.appendChild(headerDiv);
          }
          
          // Create body section
          if (bodyElements.length > 0) {
            const bodyDiv = document.createElement('div');
            bodyDiv.className = 'letter-body';
            bodyElements.forEach(el => bodyDiv.appendChild(el));
            container.appendChild(bodyDiv);
          }
          
          // Create closing section
          if (closingElements.length > 0) {
            const closingDiv = document.createElement('div');
            closingDiv.className = 'closing';
            closingElements.forEach(el => closingDiv.appendChild(el));
            container.appendChild(closingDiv);
          }
          
          // If we don't have proper categorization, just append all elements
          if (headerElements.length === 0 && bodyElements.length === 0 && closingElements.length === 0) {
            elements.forEach(el => container.appendChild(el));
          }
        }

        function createNewPage(pageNumber, container) {
          const newPage = document.createElement('div');
          newPage.className = 'page continuation';
          newPage.id = \`page\${pageNumber}\`;
          
          newPage.innerHTML = \`
            <div class="page-content">
              <div class="letter-container">
                <!-- Content will be added here -->
              </div>
            </div>
          \`;
          
          container.appendChild(newPage);
          console.log(\`Created new page: page\${pageNumber}\`);
          return newPage;
        }

        function notifyParentHeight() {
          const container = document.getElementById('documentContainer');
          if (container && window.parent) {
            const height = container.scrollHeight;
            window.parent.postMessage({ type: 'contentHeight', height }, '*');
          }
        }

        // Initialize pagination when page loads
        window.addEventListener('load', () => {
          console.log('Page loaded, initializing pagination...');
          setTimeout(() => {
            handlePagination();
            notifyParentHeight();
          }, 100);
        });

        // Re-paginate on resize
        window.addEventListener('resize', () => {
          console.log('Window resized, re-paginating...');
          setTimeout(() => {
            // Reset to single page first
            const container = document.getElementById('documentContainer');
            const allPages = container.querySelectorAll('.page');
            
            // Remove all pages except the first one
            for (let i = 1; i < allPages.length; i++) {
              allPages[i].remove();
            }
            
            // Re-run pagination
            handlePagination();
            notifyParentHeight();
          }, 100);
        });
        </script>
      
</body>
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
// Replace the formatBodyContent function with this improved version:
function formatBodyContent(content: string): string {
  if (!content || content.trim() === "") {
    return "<p>No content available.</p>";
  }

  // Handle different content formats
  let processedContent = content.trim();

  // If content is already HTML, return as-is
  if (processedContent.includes("<p>") || processedContent.includes("<div>")) {
    return processedContent;
  }

  // If content has JSON structure, extract the text
  if (processedContent.startsWith("{") || processedContent.startsWith("[")) {
    try {
      const parsed = JSON.parse(processedContent);
      if (typeof parsed === "string") {
        processedContent = parsed;
      } else if (parsed.content) {
        processedContent = parsed.content;
      } else if (parsed.text) {
        processedContent = parsed.text;
      } else {
        // Convert JSON to readable text
        processedContent = JSON.stringify(parsed, null, 2);
      }
    } catch (e) {
      // If parsing fails, use the original content
    }
  }

  // Split by double newlines first, then single newlines as fallback
  let paragraphs = processedContent.split("\n\n");

  // If no double newlines found, try single newlines
  if (paragraphs.length === 1) {
    paragraphs = processedContent.split("\n");
  }

  // If still just one paragraph, split by sentences for better formatting
  if (paragraphs.length === 1 && processedContent.length > 200) {
    paragraphs = processedContent
      .split(". ")
      .map((sentence) => sentence.trim() + (sentence.endsWith(".") ? "" : "."));
  }

  return paragraphs
    .filter((paragraph) => paragraph.trim())
    .map((paragraph) => `<p>${paragraph.trim()}</p>`)
    .join("");
}
function formatBodyContent2(content: string): string {
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
