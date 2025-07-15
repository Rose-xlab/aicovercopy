import { getCoverLetterPreviewData } from "./coverletterpreview.service";
import html2pdf from "html2pdf.js";
import { saveAs } from "file-saver";
import { Document, Packer, Paragraph, TextRun } from "docx";
import type { CoverLetter } from "@/types/cover-letter";

interface ExportOptions {
  setIsExporting?: (isExporting: boolean) => void;
  onError?: (error: Error) => void;
  templateId?: string;
  zoom?: number;
}
export async function handleCoverLetterExport(
  coverLetter: CoverLetter,
  format: "pdf" | "txt" | "docx",
  options: ExportOptions = {}
) {
  const { setIsExporting, onError, templateId, zoom = 100 } = options;
  const isClient = typeof window !== "undefined";

  if (!isClient) {
    throw new Error("Export is only available in the browser");
  }

  try {
    setIsExporting?.(true);

    console.log("🔍 EXPORT DEBUG START");
    console.log("📄 Cover letter object:", coverLetter);
    console.log("🎨 Template ID:", templateId);
    console.log("📏 Zoom level:", zoom);

    const result = await getCoverLetterPreviewData(
      coverLetter,
      templateId,
      zoom
    );

    console.log("✅ Preview data result:", result);
    console.log("📝 HTML length:", result.html?.length);

    if (format === "pdf") {
      console.log("🔄 Starting PDF generation with proper styling...");

      // Create iframe with proper document structure preservation
      const iframe = document.createElement("iframe");
      iframe.style.cssText = `
        position: absolute;
        left: -9999px;
        top: 0;
        width: 8.5in;
        height: 11in;
        border: none;
        background: white;
        zoom: 1;
      `;

      document.body.appendChild(iframe);

      // Wait for iframe to load
      await new Promise((resolve) => {
        iframe.onload = resolve;
        iframe.src = "about:blank";
      });

      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) {
        throw new Error("Cannot access iframe document");
      }

      // Write the complete HTML document to preserve all styling
      iframeDoc.open();
      iframeDoc.write(result.html);
      iframeDoc.close();

      // Wait for content and styles to fully load and render
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Ensure all images and fonts are loaded
      const images = iframeDoc.querySelectorAll('img');
      if (images.length > 0) {
        await Promise.all(
          Array.from(images).map(img => {
            return new Promise((resolve) => {
              if (img.complete) {
                resolve(null);
              } else {
                img.onload = () => resolve(null);
                img.onerror = () => resolve(null);
                // Timeout after 3 seconds
                setTimeout(() => resolve(null), 3000);
              }
            });
          })
        );
      }

      console.log("📋 Content loaded, checking styles...");
      
      // Debug: Log the rendered content to see if styles are applied
      const bodyContent = iframeDoc.body;
      if (bodyContent) {
        console.log("🎨 Iframe body classes:", bodyContent.className);
        console.log("🎨 Iframe computed styles sample:", window.getComputedStyle(bodyContent));
        
        // Check if our page elements exist
        const pageElements = iframeDoc.querySelectorAll('.page');
        console.log("📄 Found page elements:", pageElements.length);
        
        if (pageElements.length > 0) {
          const firstPage = pageElements[0];
          console.log("🎨 First page computed styles:", window.getComputedStyle(firstPage));
        }
      }

      const sender =
        typeof coverLetter.sender === "string"
          ? JSON.parse(coverLetter.sender)
          : coverLetter.sender || {};
      const firstName = sender.first_name || sender.name || "cover-letter";
      const lastName = sender.last_name || "";
      const fileName = `${firstName}${
        lastName ? `-${lastName}` : ""
      }-Cover-Letter`;

      try {
        // Generate PDF from iframe with enhanced settings
        await html2pdf()
          .set({
            margin: [10, 10, 10, 10],
            filename: `${fileName}.pdf`,
            image: { 
              type: "jpeg", 
              quality: 0.98 
            },
            html2canvas: {
              scale: 2, // Higher scale for better quality
              useCORS: true,
              allowTaint: true,
              scrollX: 0,
              scrollY: 0,
              backgroundColor: "#ffffff",
              windowWidth: 816, // 8.5in * 96dpi
              windowHeight: 1056, // 11in * 96dpi
              width: 816,
              height: 1056,
              letterRendering: true,
              logging: true, // Enable logging for debugging
              imageTimeout: 15000, // Wait longer for images
            },
            jsPDF: {
              unit: "mm",
              format: "a4",
              orientation: "portrait",
              compress: true,
            },
            pagebreak: {
              mode: ['avoid-all', 'css', 'legacy'],
              before: '.page-break, .page.continuation',
              after: '.page-break-after',
              avoid: '.avoid-break, .page-content, .letter-container'
            }
          })
          .from(iframeDoc.documentElement) // Use documentElement instead of body to capture full styling
          .save();

        console.log("✅ PDF generated successfully with full styling!");
      } finally {
        // Clean up iframe
        document.body.removeChild(iframe);
      }
    } else if (format === "txt") {
      // Extract text content properly
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = result.html;

      // Remove script and style tags
      const scripts = tempDiv.querySelectorAll("script, style");
      scripts.forEach((el) => el.remove());

      const textContent = tempDiv.textContent || tempDiv.innerText || "";

      if (!textContent.trim()) {
        throw new Error("No text content found to export");
      }

      const sender =
        typeof coverLetter.sender === "string"
          ? JSON.parse(coverLetter.sender)
          : coverLetter.sender || {};
      const firstName = sender.first_name || sender.name || "cover-letter";
      const lastName = sender.last_name || "";
      const fileName = `${firstName}${
        lastName ? `-${lastName}` : ""
      }-Cover-Letter`;

      const blob = new Blob([textContent], {
        type: "text/plain;charset=utf-8",
      });
      saveAs(blob, `${fileName}.txt`);
    } else if (format === "docx") {
      // Convert HTML to DOCX with proper formatting
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = result.html;

      // Remove script and style tags
      const scripts = tempDiv.querySelectorAll("script, style");
      scripts.forEach((el) => el.remove());

      const htmlContent = tempDiv.innerHTML;

      if (!htmlContent.trim()) {
        throw new Error("No content found to export");
      }

      const sender =
        typeof coverLetter.sender === "string"
          ? JSON.parse(coverLetter.sender)
          : coverLetter.sender || {};
      const firstName = sender.first_name || sender.name || "cover-letter";
      const lastName = sender.last_name || "";
      const fileName = `${firstName}${
        lastName ? `-${lastName}` : ""
      }-Cover-Letter`;

      // Convert HTML to paragraphs for DOCX
      const textContent = tempDiv.textContent || tempDiv.innerText || '';
      const paragraphs = textContent
        .split(/\n\s*\n/) // Split on double line breaks
        .filter(text => text.trim())
        .map(text => new Paragraph({
          children: [new TextRun(text.trim())],
          spacing: { after: 200 } // Add spacing between paragraphs
        }));

      const doc = new Document({
        sections: [
          {
            properties: {
              page: {
                margin: {
                  top: 720,    // 0.5 inch
                  right: 720,
                  bottom: 720,
                  left: 720,
                },
              },
            },
            children: paragraphs.length > 0 ? paragraphs : [
              new Paragraph({
                children: [new TextRun(tempDiv.textContent || tempDiv.innerText || 'No content available')],
              }),
            ],
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${fileName}.docx`);
    }

    return true;
  } catch (err) {
    console.error("❌ Export error:", err);
    if (err instanceof Error) {
      console.error("❌ Stack trace:", err.stack);
    }

    const errorMessage =
      err instanceof Error
        ? err.message
        : "Failed to export cover letter. Please try again.";
    onError?.(err instanceof Error ? err : new Error(errorMessage));
    return false;
  } finally {
    setIsExporting?.(false);
  }
}
