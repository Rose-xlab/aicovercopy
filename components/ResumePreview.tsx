"use client";

import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ResumeData, ResumeTemplate } from "@/types/resume";
import { renderResumeTemplate } from '@/lib/resume-template-renderer';
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { RefreshCw, AlertCircle, Maximize2, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from "lucide-react";

interface ResumePreviewProps {
  resume: ResumeData;
  template: ResumeTemplate | null;
  height?: string;
  responsiveHeight?: boolean;
  defaultZoom?: number;
  removeCard?: boolean;  // Prop to remove card styling
}

const ResumePreview: React.FC<ResumePreviewProps> = ({ 
  resume,
  template,
  height = '510px',
  responsiveHeight = false,
  defaultZoom = 65,
  removeCard = false
}) => {
  const [renderedHtml, setRenderedHtml] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [zoomLevel, setZoomLevel] = useState<number>(defaultZoom);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Update zoom level when defaultZoom prop changes
  useEffect(() => {
    setZoomLevel(defaultZoom);
  }, [defaultZoom]);
  
  // Generate HTML preview
  useEffect(() => {
    const generatePreview = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        if (!template) {
          setError('Choose Template to preview');
          return;
        }
        
        // Check for required template fields
        if (!template.htmlContent || !template.cssContent) {
          console.error('Invalid template:', template);
          setError('Invalid template format');
          return;
        }
        
        // Validate resume data has minimum required fields
        if (!resume.personalInfo?.firstName) {
          setError('Please add your personal information to see a preview');
          return;
        }
        
        // Render the resume with the selected template
        const renderedHtml = renderResumeTemplate(template, resume);
        setRenderedHtml(renderedHtml);
        
        // Reset current page
        setCurrentPage(1);
        
        // Estimate number of pages based on content length
        const contentLength = renderedHtml.length;
        const estimatedPages = Math.max(1, Math.ceil(contentLength / 15000));
        setTotalPages(estimatedPages);
      } catch (err: any) {
        console.error('Error generating preview:', err);
        setError(err.message || 'Failed to generate preview');
      } finally {
        setIsLoading(false);
      }
    };
    
    generatePreview();
  }, [resume, template, retryCount]);
  
  // After iframe loads, process the document to remove empty sections and add pagination
  useEffect(() => {
    const handleIframeLoad = () => {
      if (!iframeRef.current) return;
      
      const iframe = iframeRef.current;
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      
      if (!iframeDoc) return;
      
      // Add custom CSS for pagination
      const style = iframeDoc.createElement('style');
      style.textContent = `
        @page {
          size: letter;
          margin: 0.5in;
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
            margin-top: 1in;
          }
        }
        
        /* Force letter size for the main container */
        body {
          position: relative;
          box-sizing: border-box;
          overflow-x: hidden;
          min-height: 100vh;
        }
      `;
      iframeDoc.head.appendChild(style);
      
      // Remove empty sections and placeholder content
      removeEmptySections(iframeDoc);
      
      // Create natural page breaks based on content
      addPageBreaks(iframeDoc);
    };
    
    const iframe = iframeRef.current;
    if (iframe) {
      iframe.addEventListener('load', handleIframeLoad);
    }
    
    return () => {
      if (iframe) {
        iframe.removeEventListener('load', handleIframeLoad);
      }
    };
  }, [renderedHtml]);
  
  // Function to completely remove empty sections and placeholder content
  const removeEmptySections = (doc: Document) => {
    // First, specifically target and remove empty skills sections
    const skillsSectionHeaders = Array.from(doc.querySelectorAll('*')).filter(el => {
      const text = el.textContent?.trim();
      return text === 'Hard Skills' || text === 'Soft Skills';
    });
    
    // For each skills header, find its parent container and remove it
    skillsSectionHeaders.forEach(header => {
      // Try to find the containing section (could be div, section, or sidebar container)
      let parentSection = header;
      let foundContainer = false;
      
      // Navigate up to 3 levels to find a proper container
      for (let i = 0; i < 3 && !foundContainer; i++) {
        if (parentSection.parentElement) {
          const parent = parentSection.parentElement;
          
          // Check if this is a sidebar element or a section container
          if (parent.classList.contains('sidebar') || 
              parent.tagName === 'ASIDE' ||
              parent.classList.contains('section') ||
              parent.tagName === 'SECTION' ||
              (parent.className && 
              (parent.className.includes('sidebar') || 
                parent.className.includes('skills') ||
                parent.className.includes('column')))) {
            foundContainer = true;
            parentSection = parent;
          } else {
            parentSection = parent; // Keep moving up
          }
        } else {
          break;
        }
      }
      
      // Remove the section or at least the header itself
      parentSection.remove();
    });
    
    // Step 1: Identify all potential section containers
    const sectionContainers = [
      ...Array.from(doc.querySelectorAll('section')),
      ...Array.from(doc.querySelectorAll('.section')),
      ...Array.from(doc.querySelectorAll('div[class*="section"]')),
      ...Array.from(doc.querySelectorAll('div[class*="skills"]')),
      ...Array.from(doc.querySelectorAll('div[class*="experience"]')),
      ...Array.from(doc.querySelectorAll('div[class*="skill"]')),
    ];
    
    // Step 2: Check each section for placeholders or empty content
    sectionContainers.forEach(section => {
      // Check for placeholder pattern in textContent
      const placeholderPattern = /\{\{.*?\}\}/;
      const textContent = section.textContent || '';
      
      // Check if the section only contains placeholder or is empty
      const hasOnlyPlaceholder = placeholderPattern.test(textContent) && 
                                textContent.replace(placeholderPattern, '').trim() === '';
      
      const isEmpty = textContent.trim() === '';
      
      // If section is empty or only has placeholder, remove it completely
      if (hasOnlyPlaceholder || isEmpty) {
        // Try to find and remove the section title/header as well
        const sectionHeader = findSectionHeader(section);
        if (sectionHeader) {
          sectionHeader.remove();
        }
        
        // Remove the section itself
        section.remove();
      }
    });
    
    // Step 3: Handle special case for specific placeholder patterns
    // Find any standalone placeholder text like {{hard-skills}} or {{soft-skills}}
    const allTextNodes = [];
    const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
    let node;
    while (node = walker.nextNode()) {
      allTextNodes.push(node);
    }
    
    // Check each text node for placeholder pattern
    allTextNodes.forEach(textNode => {
      const content = textNode.textContent || '';
      if (/\{\{.*?\}\}/.test(content)) {
        // Find the parent element and remove if it's a section title or label
        const parent = textNode.parentElement;
        if (parent) {
          // Check if parent is a heading or has title-like class
          const isHeading = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(parent.tagName);
          const isTitleLike = parent.className && (
            parent.className.includes('title') || 
            parent.className.includes('header') || 
            parent.className.includes('heading')
          );
          
          if (isHeading || isTitleLike) {
            // Find parent section and remove it
            const section = findParentSection(parent);
            if (section) {
              section.remove();
            } else {
              // If no section found, remove at least the title element
              parent.remove();
            }
          } else {
            // Just remove the text node if not in a title
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
      if (parent.tagName === 'SECTION' || 
          parent.classList.contains('section') || 
          (parent.className && (
            parent.className.includes('section') ||
            parent.className.includes('skills') ||
            parent.className.includes('experience'))
          )) {
        return parent;
      }
      parent = parent.parentElement;
    }
    return null;
  };
  
  // Helper to find section header/title
  const findSectionHeader = (section: Element): Element | null => {
    // Look for heading elements inside the section
    const headings = section.querySelectorAll('h1, h2, h3, h4, h5, h6');
    if (headings.length > 0) {
      return headings[0];
    }
    
    // Look for elements with title-like classes
    const titleElements = section.querySelectorAll('.title, .heading, .header, [class*="title"], [class*="heading"], [class*="header"]');
    if (titleElements.length > 0) {
      return titleElements[0];
    }
    
    // Look for first child if it's a div with only text content
    const firstChild = section.firstElementChild;
    if (firstChild && 
        firstChild.tagName === 'DIV' && 
        firstChild.childElementCount === 0 && 
        firstChild.textContent?.trim()) {
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
    const sections = Array.from(container.querySelectorAll('section, .section, div[class*="section"], h1, h2'));
    
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
        const pageBreak = doc.createElement('div');
        pageBreak.className = 'page-break';
        pageBreak.setAttribute('data-page', (pageCount + 1).toString());
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
    const pageBreak = iframeDoc.querySelector(`.page-break[data-page="${pageNum}"]`);
    
    // If page 1, scroll to top, otherwise scroll to the page break
    if (pageNum === 1) {
      iframe.contentWindow?.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    } else if (pageBreak) {
      pageBreak.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
    setRetryCount(prev => prev + 1);
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
      console.error('Error entering fullscreen:', err);
    }
  };

  // Handle zoom controls
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 10, 150));
  };
  
  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 10, 40));
  };
  
  const handleZoomReset = () => {
    setZoomLevel(65);
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div 
        className={`flex justify-center items-center ${!removeCard ? 'border rounded-md bg-muted/20' : ''}`}
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
        className={`flex justify-center items-center ${!removeCard ? 'border rounded-md bg-muted/20' : ''}`}
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
    <div className={removeCard ? '' : 'space-y-1'}>
      <div 
        className={!removeCard ? 'border rounded-md overflow-hidden' : ''}
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
              transformOrigin: 'top center',
              width: '8.5in', // Standard US Letter width
              minHeight: '11in', // Standard US Letter height
            }}
          >
            {/* Use iframe for isolated CSS rendering */}
            <iframe
              ref={iframeRef}
              srcDoc={renderedHtml}
              title="Resume Preview"
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                minHeight: '11in',
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
          <Button variant="outline" size="sm" onClick={handleFullscreenPreview} className="h-7">
            <Maximize2 className="h-3 w-3 mr-1" />
            <span className="text-xs">Expand</span>
          </Button>
        )}
      </div>
    </div>
  );
};

export default ResumePreview;