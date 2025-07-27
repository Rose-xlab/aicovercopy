"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ResumeData, ResumeTemplate } from "@/types/resume";
import { renderResumeTemplate } from "@/lib/resume-template-renderer";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import {
  RefreshCw,
  AlertCircle,
  Maximize2,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface ResumePreviewProps {
  resume: ResumeData;
  template: ResumeTemplate | null;
  height?: string;
  responsiveHeight?: boolean;
  defaultZoom?: number;
  removeCard?: boolean; // Prop to remove card styling
}

// Utility function to compress and resize image
const compressImage = (
  file: File,
  maxWidth: number = 300,
  quality: number = 0.8
): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;

      // Draw and compress
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
      const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
      resolve(compressedDataUrl);
    };

    img.src = URL.createObjectURL(file);
  });
};

const ResumePreview: React.FC<ResumePreviewProps> = ({
  resume,
  template,
  height = "510px",
  responsiveHeight = false,
  defaultZoom = 65,
  removeCard = false,
}) => {
  const [renderedHtml, setRenderedHtml] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [zoomLevel, setZoomLevel] = useState<number>(defaultZoom);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [profileImageDataUrl, setProfileImageDataUrl] = useState<string | null>(
    null
  );
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(
    null
  );
  const [imageError, setImageError] = useState<string | null>(null);

  // Update zoom level when defaultZoom prop changes
  useEffect(() => {
    setZoomLevel(defaultZoom);
  }, [defaultZoom]);

  // Convert uploaded image to data URL for iframe use
  useEffect(() => {
    const processImage = async () => {
      if (!resume.personalInfo?.image) {
        setProcessedImageUrl(null);
        setImageError(null);
        return;
      }

      try {
        setImageError(null);
        const imageData = resume.personalInfo.image;

        // Handle different image input types
        if (typeof imageData === "string") {
          if (imageData.startsWith("data:")) {
            // If it's already a data URL, check if it's too large
            if (imageData.length > 50000) {
              // ~37KB base64 limit
              console.warn(
                "Image data URL is too large, consider using file upload with server storage"
              );
              setImageError(
                "Image is too large. Please use a smaller image or upload to server storage."
              );
              setProcessedImageUrl(null);
              return;
            }
            setProcessedImageUrl(imageData);
          } else if (imageData.startsWith("blob:")) {
            // Convert blob URL to compressed data URL
            const response = await fetch(imageData);
            const blob = await response.blob();
            const file = new File([blob], "image.jpg", { type: blob.type });
            const compressedUrl = await compressImage(file);
            setProcessedImageUrl(compressedUrl);
          } else if (imageData.startsWith("http")) {
            // For external URLs, use them directly (but warn about CORS)
            setProcessedImageUrl(imageData);
          } else {
            // Assume it's a server path/URL
            setProcessedImageUrl(imageData);
          }
        } else if (imageData instanceof File) {
          // Compress file before converting to data URL
          const compressedUrl = await compressImage(imageData);
          setProcessedImageUrl(compressedUrl);
        } else {
          console.warn("Unsupported image data type:", typeof imageData);
          setProcessedImageUrl(null);
        }
      } catch (error) {
        console.error("Error processing image:", error);
        setImageError("Failed to process image");
        setProcessedImageUrl(null);
      }
    };

    processImage();
  }, [resume.personalInfo?.image]);

  // Generate HTML preview
  useEffect(() => {
    const generatePreview = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (!template) {
          setError("Choose Template to preview");
          return;
        }

        // Check for required template fields
        if (!template.htmlContent || !template.cssContent) {
          console.error("Invalid template:", template);
          setError("Invalid template format");
          return;
        }

        // Validate resume data has minimum required fields
        if (!resume.personalInfo?.firstName) {
          setError("Please add your personal information to see a preview");
          return;
        }
        // Wait a bit for image conversion to complete if there's an image
        if (resume.personalInfo?.image && !profileImageDataUrl) {
          // Small delay to allow image conversion
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        const enhancedResumeData = {
          ...resume,
          personalInfo: {
            ...resume.personalInfo,
            image: processedImageUrl || resume.personalInfo?.image,
          },
        };
        console.log("Enhanced resume data:", enhancedResumeData); // Debug log
        console.log("Profile image data URL:", processedImageUrl); // Debug log

        // Render the resume with the selected template
        let renderedHtml = renderResumeTemplate(template, enhancedResumeData);

        // Additional image handling: Replace any remaining blob URLs or file references
        if (processedImageUrl) {
          const imagePatterns = [
            /\{\{image\}\}/g,
            /\{\{profileImage\}\}/g,
            /\{\{profile-image\}\}/g,
            /\{\{photo\}\}/g,
            /\{\{picture\}\}/g,
            /\{\{avatar\}\}/g,
          ];

          imagePatterns.forEach((pattern) => {
            renderedHtml = renderedHtml.replace(pattern, processedImageUrl);
          });

          // Fix img src attributes that might still have placeholders
          renderedHtml = renderedHtml.replace(
            /(<img[^>]+src=["']?)\{\{[^}]*image[^}]*\}\}(["']?[^>]*>)/gi,
            `$1${processedImageUrl}$2`
          );
        } else {
          // Remove image placeholders if no image
          const imagePatterns = [
            /\{\{image\}\}/g,
            /\{\{profileImage\}\}/g,
            /\{\{profile-image\}\}/g,
            /\{\{photo\}\}/g,
            /\{\{picture\}\}/g,
            /\{\{avatar\}\}/g,
          ];

          imagePatterns.forEach((pattern) => {
            renderedHtml = renderedHtml.replace(pattern, "");
          });

          // Hide img elements with placeholder sources
          renderedHtml = renderedHtml.replace(
            /<img[^>]+src=["']?\{\{[^}]*image[^}]*\}\}["']?[^>]*>/gi,
            ""
          );
        }
        console.log(
          "Final rendered HTML (first 1000 chars):",
          renderedHtml.substring(0, 1000)
        ); // Debug log

        setRenderedHtml(renderedHtml);

        // Reset current page
        setCurrentPage(1);

        // Estimate number of pages based on content length
        const contentLength = renderedHtml.length;
        const estimatedPages = Math.max(1, Math.ceil(contentLength / 15000));
        setTotalPages(estimatedPages);
      } catch (err: any) {
        console.error("Error generating preview:", err);
        setError(err.message || "Failed to generate preview");
      } finally {
        setIsLoading(false);
      }
    };

    generatePreview();
  }, [resume, template, retryCount, processedImageUrl]);

  // Detect if template is a sidebar template
  const isSidebarTemplate = template?.name?.toLowerCase().includes('sidebar') || 
                           renderedHtml?.includes('class="sidebar"');

  // After iframe loads, process the document to remove empty sections and add pagination
  useEffect(() => {
    const handleIframeLoad = () => {
      if (!iframeRef.current) return;

      const iframe = iframeRef.current;
      const iframeDoc =
        iframe.contentDocument || iframe.contentWindow?.document;

      if (!iframeDoc) return;

      // Add custom CSS for pagination and sidebar templates
      const style = iframeDoc.createElement("style");
      style.textContent = `
        @page {
          size: letter;
          margin: ${isSidebarTemplate ? '0' : '0.5in'};
        }
       
        @media print {
          body {
            width: 8.5in;
            height: 11in;
            margin: 0;
            padding: 0;
            overflow: hidden;
          }
         
          .page-break {
            page-break-before: always;
            margin-top: ${isSidebarTemplate ? '0' : '1in'};
          }
        }
       
        /* Force letter size for the main container */
        body {
          position: relative;
          box-sizing: border-box;
          overflow-x: hidden;
          min-height: 100vh;
          margin: 0;
          padding: 0;
        }
        
        /* Ensure sidebar templates have no extra margins in preview */
        ${isSidebarTemplate ? `
          .resume-container {
            margin: 0 !important;
            padding: 0 !important;
            width: 8.5in !important;
          }
        ` : ''}
        
        img {
          max-width: 150px;
          max-height: 150px;
          object-fit: cover;
          border-radius: 4px;
        }
       
        .image-placeholder {
          width: 150px;
          height: 150px;
          background-color: #f3f4f6;
          border: 2px dashed #d1d5db;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6b7280;
          font-size: 12px;
          border-radius: 4px;
        }
      `;
      iframeDoc.head.appendChild(style);
      
      // Ensure images are properly loaded in the iframe
      const images = iframeDoc.querySelectorAll("img");
      images.forEach((img) => {
        // Set up proper image loading
        if (
          processedImageUrl &&
          (img.src.includes("{{") ||
            img.src === "" ||
            img.src.includes("[object File]") ||
            img.src.includes("blob:"))
        ) {
          img.src = processedImageUrl;
        }

        // Add error handling
        img.onerror = () => {
          console.warn("Image failed to load:", img.src);
          // Replace with placeholder
          const placeholder = iframeDoc.createElement("div");
          placeholder.className = "image-placeholder";
          placeholder.textContent = "No Image";
          img.parentNode?.replaceChild(placeholder, img);
        };

        img.onload = () => {
          console.log("Image loaded successfully");
        };
      });
      
      // Remove empty sections and placeholder content
      removeEmptySections(iframeDoc);

      // Create natural page breaks based on content
      addPageBreaks(iframeDoc);
    };

    const iframe = iframeRef.current;
    if (iframe) {
      iframe.addEventListener("load", handleIframeLoad);
    }

    return () => {
      if (iframe) {
        iframe.removeEventListener("load", handleIframeLoad);
      }
    };
  }, [renderedHtml, profileImageDataUrl, isSidebarTemplate]);

  // Function to completely remove empty sections and placeholder content
  const removeEmptySections = (doc: Document) => {
    // Step 1: Specifically remove "Hard Skills" sections since you don't have that category
    const hardSkillsHeaders = Array.from(doc.querySelectorAll("*")).filter(
      (el) => {
        const text = el.textContent?.trim();
        return text === "Hard Skills";
      }
    );

    // Remove Hard Skills sections completely
    hardSkillsHeaders.forEach((header) => {
      let parentSection = header;
      let foundContainer = false;

      // Navigate up to 3 levels to find a proper container
      for (let i = 0; i < 3 && !foundContainer; i++) {
        if (parentSection.parentElement) {
          const parent = parentSection.parentElement;

          if (
            parent.classList.contains("sidebar") ||
            parent.tagName === "ASIDE" ||
            parent.classList.contains("section") ||
            parent.tagName === "SECTION" ||
            (parent.className &&
              (parent.className.includes("sidebar") ||
                parent.className.includes("skills") ||
                parent.className.includes("column")))
          ) {
            foundContainer = true;
            parentSection = parent;
          } else {
            parentSection = parent;
          }
        } else {
          break;
        }
      }
      parentSection.remove();
    });

    // Step 2: Find sections but be more careful about what we remove
    const sectionContainers = [
      ...Array.from(doc.querySelectorAll("section")),
      ...Array.from(doc.querySelectorAll(".section")),
      ...Array.from(doc.querySelectorAll('div[class*="section"]')),
      ...Array.from(doc.querySelectorAll('div[class*="experience"]')),
    ];

    // Step 3: Check each section for placeholders or empty content, but preserve skills sections
    sectionContainers.forEach((section) => {
      const textContent = section.textContent || "";
      const placeholderPattern = /\{\{.*?\}\}/g;
     
      // Check if this is a skills section - preserve ALL skills sections
      const isSkillsSection =
        textContent.includes("Soft Skills") ||
        textContent.includes("Skills") ||
        section.className.includes("skills") ||
        section.querySelector('.skills-section') ||
        section.querySelector('.skill-category') ||
        section.querySelector('.skills-list');
     
      if (isSkillsSection) {
        console.log("Preserving skills section:", textContent.substring(0, 100));
        return; // Don't remove any skills sections
      }
     
      // Only remove if section contains ONLY placeholder text or is completely empty
      const cleanedText = textContent.replace(placeholderPattern, "").trim();
      const hasOnlyPlaceholder = placeholderPattern.test(textContent) && cleanedText === "";
      const isEmpty = textContent.trim() === "";

      if (hasOnlyPlaceholder || isEmpty) {
        const sectionHeader = findSectionHeader(section);
        if (sectionHeader) {
          sectionHeader.remove();
        }
        section.remove();
      }
    });

    // Step 4: Handle standalone placeholder text nodes (but preserve skills content)
    const allTextNodes = [];
    const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      allTextNodes.push(node);
    }

    allTextNodes.forEach((textNode) => {
      const content = textNode.textContent || "";
      if (/\{\{.*?\}\}/.test(content)) {
        const parent = textNode.parentElement;
        if (parent) {
          // Check if this is within a skills section
          const isInSkillsSection = parent.closest('.skills-section') ||
                                   parent.closest('[class*="skills"]') ||
                                   parent.closest('.skill-category') ||
                                   parent.closest('.skills-list');
         
          if (isInSkillsSection) {
            return; // Don't remove placeholder text in skills sections
          }

          const isHeading = ["H1", "H2", "H3", "H4", "H5", "H6"].includes(
            parent.tagName
          );
          const isTitleLike =
            parent.className &&
            (parent.className.includes("title") ||
              parent.className.includes("header") ||
              parent.className.includes("heading"));

          if (isHeading || isTitleLike) {
            const section = findParentSection(parent);
            if (section) {
              section.remove();
            } else {
              parent.remove();
            }
          } else {
            textNode.remove();
          }
        }
      }
    });
  };

  // Helper to find parent section element
  const findParentSection = (element: Element): Element | null => {
    let parent = element.parentElement;
    while (parent) {
      if (
        parent.tagName === "SECTION" ||
        parent.classList.contains("section") ||
        (parent.className &&
          (parent.className.includes("section") ||
            parent.className.includes("skills") ||
            parent.className.includes("experience")))
      ) {
        return parent;
      }
      parent = parent.parentElement;
    }
    return null;
  };

  // Helper to find section header/title
  const findSectionHeader = (section: Element): Element | null => {
    // Look for heading elements inside the section
    const headings = section.querySelectorAll("h1, h2, h3, h4, h5, h6");
    if (headings.length > 0) {
      return headings[0];
    }

    // Look for elements with title-like classes
    const titleElements = section.querySelectorAll(
      '.title, .heading, .header, [class*="title"], [class*="heading"], [class*="header"]'
    );
    if (titleElements.length > 0) {
      return titleElements[0];
    }

    // Look for first child if it's a div with only text content
    const firstChild = section.firstElementChild;
    if (
      firstChild &&
      firstChild.tagName === "DIV" &&
      firstChild.childElementCount === 0 &&
      firstChild.textContent?.trim()
    ) {
      return firstChild;
    }

    return null;
  };

  // Function to add page breaks to the document
  const addPageBreaks = (doc: Document) => {
    // Get the main container - typically body or a main div
    const container = doc.body;
    if (!container) return;

    // Estimate a fixed height for an 11in page with margins
    const pageHeight = 10 * 96; // 10 inches in pixels (96 DPI), accounting for 0.5in margin top and bottom

    // Get all major section elements, excluding empty ones
    const sections = Array.from(
      container.querySelectorAll(
        'section, .section, div[class*="section"], h1, h2'
      )
    );

    if (sections.length <= 1) return; // Not enough content for pagination

    let currentHeight = 0;
    let pageCount = 1;

    // Measure actual height of sections and add page breaks
    sections.forEach((section, index) => {
      if (index === 0) return; // Skip first section

      const sectionHeight = (section as HTMLElement).offsetHeight;

      // If adding this section would exceed page height, insert a page break
      if (currentHeight + sectionHeight > pageHeight) {
        // Add page break before this section
        const pageBreak = doc.createElement("div");
        pageBreak.className = "page-break";
        pageBreak.setAttribute("data-page", (pageCount + 1).toString());
        section.parentNode?.insertBefore(pageBreak, section);

        currentHeight = sectionHeight;
        pageCount++;
      } else {
        currentHeight += sectionHeight;
      }
    });

    // Update page count if needed
    if (pageCount > 1) {
      setTotalPages(pageCount);
    }
  };

  // Handle scroll to specific page
  const scrollToPage = (pageNum: number) => {
    if (!iframeRef.current) return;

    const iframe = iframeRef.current;
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;

    if (!iframeDoc) return;

    // Find the page break element for this page
    const pageBreak = iframeDoc.querySelector(
      `.page-break[data-page="${pageNum}"]`
    );

    // If page 1, scroll to top, otherwise scroll to the page break
    if (pageNum === 1) {
      iframe.contentWindow?.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } else if (pageBreak) {
      pageBreak.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    setCurrentPage(pageNum);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      scrollToPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      scrollToPage(currentPage - 1);
    }
  };

  // Handle refresh button click
  const handleRefresh = () => {
    setRetryCount((prev) => prev + 1);
    setIsLoading(true);
  };

  // Handle fullscreen preview
  const handleFullscreenPreview = () => {
    try {
      const container = containerRef.current;
      if (container) {
        if (container.requestFullscreen) {
          container.requestFullscreen();
        } else if ((container as any).webkitRequestFullscreen) {
          (container as any).webkitRequestFullscreen();
        } else if ((container as any).msRequestFullscreen) {
          (container as any).msRequestFullscreen();
        }
      }
    } catch (err) {
      console.error("Error entering fullscreen:", err);
    }
  };

  // Handle zoom controls
  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 10, 150));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 10, 40));
  };

  const handleZoomReset = () => {
    setZoomLevel(65);
  };

  // Loading state
  if (isLoading) {
    return (
      <div
        className={`flex justify-center items-center ${
          !removeCard ? "border rounded-md bg-muted/20" : ""
        }`}
        style={{ height }}
      >
        <div className="text-center">
          <LoadingSpinner className="mx-auto mb-2" size={24} />
          <p className="text-xs text-muted-foreground">Loading preview...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        className={`flex justify-center items-center ${
          !removeCard ? "border rounded-md bg-muted/20" : ""
        }`}
        style={{ height }}
      >
        <div className="text-center p-4">
          <Alert className="mb-3">
            <AlertCircle className="h-3 w-3" />
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-3 w-3 mr-1" />
            <span className="text-xs">Retry</span>
          </Button>
        </div>
      </div>
    );
  }

  // Main render - with or without card based on prop
  return (
    <div className={removeCard ? "" : "space-y-1"}>
      <div
        className={!removeCard ? "border rounded-md overflow-hidden" : ""}
        style={{ height }}
      >
        <div
          ref={containerRef}
          id="resume-preview-container"
          className="w-full h-full overflow-auto flex justify-center bg-gray-100"
        >
          {/* Container for the resume with zoom scaling */}
          <div
            className="my-3 bg-white shadow-md"
            style={{
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: "top center",
              width: "8.5in", // Standard US Letter width
              minHeight: "11in", // Standard US Letter height
              // Remove padding for sidebar templates to match PDF output
              padding: isSidebarTemplate ? 0 : undefined,
            }}
          >
            {/* Use iframe for isolated CSS rendering */}
            <iframe
              ref={iframeRef}
              srcDoc={renderedHtml}
              title="Resume Preview"
              style={{
                width: "100%",
                height: "100%",
                border: "none",
                minHeight: "11in",
              }}
              className="block"
            />
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-between items-center mt-2">
        <div className="flex items-center space-x-3">
          {/* Zoom controls */}
          <div className="flex space-x-1">
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomOut}
              disabled={zoomLevel <= 40}
              className="h-8 w-8 p-0"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomReset}
              className="h-8 px-2"
            >
              <span className="text-xs">{zoomLevel}%</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomIn}
              disabled={zoomLevel >= 150}
              className="h-8 w-8 p-0"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>

          {/* Page navigation controls - only show if multiple pages */}
          {totalPages > 1 && (
            <div className="flex items-center space-x-1 ml-3 border-l pl-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevPage}
                disabled={currentPage <= 1}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs font-medium px-1">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={currentPage >= totalPages}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {!removeCard && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleFullscreenPreview}
            className="h-7"
          >
            <Maximize2 className="h-3 w-3 mr-1" />
            <span className="text-xs">Expand</span>
          </Button>
        )}
      </div>
    </div>
  );
};

export default ResumePreview;