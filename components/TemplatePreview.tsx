"use client";

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Template } from "@/types/templates";
import { renderTemplate } from "@/lib/template-renderer";
import { useState, useEffect, useRef, useCallback } from "react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useToast } from "@/hooks/use-toast";
import { CoverLetter } from "@/types/cover-letter"; // Import the type

interface TemplatePreviewProps {
  isOpen: boolean;
  onClose: () => void;
  template: Template;
  coverLetterContent: string;
  onSelect: () => void;
  showSelectButton?: boolean;
}

export default function TemplatePreview({
  isOpen,
  onClose,
  template,
  coverLetterContent,
  onSelect,
  showSelectButton = true
}: TemplatePreviewProps) {
  const [renderedTemplate, setRenderedTemplate] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [scale, setScale] = useState(0.85);

  // Check for small screens
  const isSmallScreen = typeof window !== 'undefined' ? window.innerWidth < 640 : false;

  // Function to calculate the optimal scale factor
  const calculateOptimalScale = useCallback(() => {
    if (!iframeRef.current || !containerRef.current) return;

    try {
      const containerWidth = containerRef.current.offsetWidth || 0;

      // Letter width (in pixels at 96 DPI)
      const letterWidth = 8.5 * 96; // 8.5 inches

      // Calculate ratio needed to fit the width with more margin
      const widthRatio = (containerWidth - 60) / letterWidth;

      // Use a more conservative scale to ensure visibility and scrollability
      const newScale = Math.min(widthRatio, 0.85);

      // Apply minimum scale for readability, but not too large to prevent scrolling issues
      setScale(Math.max(newScale, isSmallScreen ? 0.5 : 0.6));
    } catch (e) {
      console.warn('Error calculating scale:', e);
      setScale(isSmallScreen ? 0.5 : 0.7);
    }
  }, [isSmallScreen]);

  // Calculate scale on resize
  useEffect(() => {
    const handleResize = () => {
      calculateOptimalScale();
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [calculateOptimalScale]);

  // Calculate initial scale after loading
  useEffect(() => {
    if (!isLoading) {
      setTimeout(() => {
        calculateOptimalScale();
      }, 200);
    }
  }, [isLoading, calculateOptimalScale]);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      try {
        // Create a mock CoverLetter object to satisfy the type requirements for the preview
        const mockCoverLetterForPreview: CoverLetter = {
            content: coverLetterContent,
            userId: '', // Default value for required field
            jobDescription: '', // Default value for required field
            tone: 'professional', // Default value for required field
            jobTitle: '', // Default value for required field
            companyName: '', // Default value for required field
            created_at: new Date(), // Default value for required field
            data_source: 'none', // Default value for required field
        };

        // Pass the valid mock object to the renderer
        const html = renderTemplate(template, mockCoverLetterForPreview);

        // Add additional meta and style elements to ensure proper display
        const additionalStyles = `
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { 
              margin: 0; 
              padding: 0;
              overflow-x: hidden;
              max-width: 100%;
              background-color: white;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
              min-height: 100%;
            }
            
            /* Force all styles to display */
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }

            /* Ensure full content visibility with extra bottom padding */
            .content-wrapper {
              padding-bottom: 150px; /* Increased from 50px to ensure bottom visibility */
              position: relative;
              min-height: 100%;
            }

            /* Add a marker at the bottom for visibility testing */
            .content-wrapper::after {
              content: '';
              display: block;
              height: 50px;
              width: 100%;
              clear: both;
            }
          </style>
        `;

        // Script to ensure styles are properly applied
        const styleFixScript = `
          <script>
            document.addEventListener('DOMContentLoaded', function() {
              // Force a repaint to apply all styles
              document.body.offsetHeight;
              
              // Ensure color properties are preserved
              const allElements = document.querySelectorAll('*');
              for (let i = 0; i < allElements.length; i++) {
                const el = allElements[i];
                if (el.nodeType === 1) { // Element node
                  const style = window.getComputedStyle(el);
                  
                  // Preserve important style properties by converting to inline styles when necessary
                  const props = ['color', 'background-color', 'border-color', 'background-image'];
                  for (let j = 0; j < props.length; j++) {
                    const prop = props[j];
                    const value = style.getPropertyValue(prop);
                    if (value && value !== 'rgba(0, 0, 0, 0)' && value !== 'transparent' && value !== 'none') {
                      // Convert kebab-case to camelCase
                      const camelProp = prop.replace(/-([a-z])/g, function(g) { return g[1].toUpperCase(); });
                      el.style[camelProp] = value;
                    }
                  }
                }
              }

              // Notify parent about content size
              try {
                window.parent.postMessage({
                  type: 'contentSize',
                  height: document.body.scrollHeight
                }, '*');
              } catch(e) {
                console.error("Failed to send message to parent:", e);
              }
            });
          </script>
        `;

        // If the HTML already has a head tag, add our additional styles
        let enhancedHtml = html;
        if (enhancedHtml.includes('<head>')) {
          // Insert additional styles before the first closing head tag
          enhancedHtml = enhancedHtml.replace('</head>', additionalStyles + '</head>');

          // Only wrap with body tags if needed, wrap content with wrapper div for padding
          if (!enhancedHtml.includes('<body>')) {
            enhancedHtml = enhancedHtml.replace(/<html([^>]*)>/, '<html$1><body>');
            enhancedHtml = enhancedHtml.replace(/<\/html>/, '<div class="content-wrapper"></div></body></html>');
            // Add content before the wrapper div closing tag
            enhancedHtml = enhancedHtml.replace('<div class="content-wrapper"></div>',
              `<div class="content-wrapper">${enhancedHtml.substring(
                enhancedHtml.indexOf('<body>') + 6,
                enhancedHtml.indexOf('</body>')
              )}</div>${styleFixScript}`);
            // Remove original content
            enhancedHtml = enhancedHtml.replace(
              enhancedHtml.substring(
                enhancedHtml.indexOf('<body>') + 6,
                enhancedHtml.indexOf('</body>')
              ),
              ''
            );
          } else {
            // Add wrapper to body content and script
            enhancedHtml = enhancedHtml.replace('<body>', '<body>');
            enhancedHtml = enhancedHtml.replace('</body>', `<div class="content-wrapper">${
              enhancedHtml.substring(
                enhancedHtml.indexOf('<body>') + 6,
                enhancedHtml.indexOf('</body>')
              )
            }</div>${styleFixScript}</body>`);
            // Remove original content
            enhancedHtml = enhancedHtml.replace(
              enhancedHtml.substring(
                enhancedHtml.indexOf('<body>') + 6,
                enhancedHtml.indexOf('<div class="content-wrapper">')
              ),
              ''
            );
          }
        } else {
          // Create a complete HTML document with necessary styles
          enhancedHtml = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>${template.css_content || ''}</style>
              ${additionalStyles}
            </head>
            <body>
              <div class="content-wrapper">
                ${html}
              </div>
              ${styleFixScript}
            </body>
            </html>
          `;
        }

        setRenderedTemplate(enhancedHtml);
      } catch (error) {
        console.error("Error rendering template:", error);
        setRenderedTemplate(`<div class="text-red-500">Error rendering template.</div>`);
        toast({
          title: "Error",
          description: "There was a problem rendering the template preview.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
  }, [isOpen, template, coverLetterContent, toast]);

  // Listen for iframe content size
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'contentSize') {
        // Adjust iframe container if needed based on content height
        if (iframeRef.current && event.data.height) {
          // Ensure iframe is tall enough for content
          const heightNeeded = event.data.height + 100; // Add padding
          if (iframeRef.current.height !== `${heightNeeded}px`) {
            iframeRef.current.height = `${heightNeeded}px`;
          }
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleSelectTemplate = () => {
    onSelect();
    onClose();
  };

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
    // Recalculate scale after toggling with sufficient delay to allow transition
    setTimeout(calculateOptimalScale, 300);
  };

  // Fixed height for the preview container to ensure scroll works properly
  const scrollAreaHeight = isFullScreen
    ? "calc(95vh - 140px)"
    : isSmallScreen
      ? "calc(85vh - 180px)"
      : "calc(85vh - 160px)"; // Increased height percentage

  const dialogClasses = isFullScreen
    ? "sm:max-w-[95vw] w-[95vw] max-h-[95vh] h-[95vh]"
    : "sm:max-w-[90vw] md:max-w-[850px] w-[95vw] max-h-[90vh]";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${dialogClasses} overflow-hidden flex flex-col`}>
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-base sm:text-lg">
            {template.name}
          </DialogTitle>
          <div className="flex items-center gap-2">
            <div className="text-sm text-muted-foreground hidden sm:block">
              {template.description}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullScreen}
              className="h-8 px-2 ml-2"
              title={isFullScreen ? "Exit Full Screen" : "Full Screen"}
            >
              {isFullScreen ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"></path>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"></path>
                </svg>
              )}
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0 flex flex-col">
          {isLoading ? (
            <div className="flex items-center justify-center flex-1">
              <LoadingSpinner />
              <span className="ml-2">Preparing your document...</span>
            </div>
          ) : (
            <div className="flex flex-col flex-1">
              <div className="flex justify-center items-center space-x-2 mb-2">
                <div className="zoom-controls flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setScale(prev => Math.max(prev - 0.1, 0.3))}
                    title="Zoom out"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                  </Button>
                  <span className="text-sm">
                    {Math.round(scale * 100)}%
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setScale(prev => Math.min(prev + 0.1, 1.5))}
                    title="Zoom in"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-2 text-xs"
                    onClick={calculateOptimalScale}
                    title="Fit to screen"
                  >
                    Fit
                  </Button>
                </div>
              </div>

              {/* Fixed height ScrollArea to ensure proper scrolling */}
              <div
                className="bg-gray-100 rounded-md flex-1 overflow-auto relative"
                style={{ height: scrollAreaHeight }}
                id="cover-letter-container"
              >
                <div className="p-4 w-full flex justify-center min-h-full" ref={containerRef}>
                  <div
                    className="relative bg-white shadow-md"
                    style={{
                      transform: `scale(${scale})`,
                      transformOrigin: 'top center',
                      margin: '0 auto',
                      width: '8.5in',
                      transition: 'transform 0.2s ease-out'
                    }}
                  >
                    <iframe
                      ref={iframeRef}
                      srcDoc={renderedTemplate}
                      title="Cover Letter Preview"
                      className="w-full"
                      style={{
                        minHeight: "11in",
                        border: "none",
                        backgroundColor: "white",
                      }}
                      sandbox="allow-same-origin allow-scripts"
                      onLoad={() => {
                        try {
                          if (iframeRef.current && iframeRef.current.contentDocument) {
                            // Force height to be substantial initially
                            iframeRef.current.height = '1500px';

                            // Ensure document can be scrolled
                            const doc = iframeRef.current.contentDocument;
                            const height = doc.body.scrollHeight;
                            iframeRef.current.height = `${height + 200}px`; // Added more padding

                            // Force a recalculation of scaling
                            setTimeout(calculateOptimalScale, 100);
                          }
                        } catch (e) {
                          console.warn('Error adjusting iframe height:', e);
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Scroll buttons */}
                <div className="absolute right-4 bottom-20 flex flex-col gap-2">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-10 w-10 rounded-full bg-white shadow-md hover:bg-gray-100"
                    onClick={() => {
                      const container = document.getElementById('cover-letter-container');
                      if (container) {
                        container.scrollBy({ top: -200, behavior: 'smooth' });
                      }
                    }}
                    title="Scroll Up"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="18 15 12 9 6 15"></polyline>
                    </svg>
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-10 w-10 rounded-full bg-white shadow-md hover:bg-gray-100"
                    onClick={() => {
                      const container = document.getElementById('cover-letter-container');
                      if (container) {
                        container.scrollBy({ top: 200, behavior: 'smooth' });
                      }
                    }}
                    title="Scroll Down"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </Button>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0 mt-4">
            <div className="flex gap-2 w-full sm:w-auto order-2 sm:order-1">
              <Button variant="outline" onClick={onClose} className="flex-1 sm:flex-auto">
                Close
              </Button>
            </div>
            {showSelectButton && (
              <Button
                onClick={handleSelectTemplate}
                className="w-full sm:w-auto order-1 sm:order-2"
              >
                Use This Template
              </Button>
            )}
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}