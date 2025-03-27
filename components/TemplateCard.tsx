"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Eye } from "lucide-react";
import { Template } from "@/types/templates";
import TemplatePreview from "@/components/TemplatePreview";
import { renderTemplate } from "@/lib/template-renderer";

interface TemplateCardProps {
  template: Template;
  isSelected: boolean;
  onSelect: () => void;
  coverLetterContent: string;
  showPreviewOnly?: boolean;
}

export default function TemplateCard({
  template,
  isSelected,
  onSelect,
  coverLetterContent,
  showPreviewOnly = false
}: TemplateCardProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [thumbnailSrc, setThumbnailSrc] = useState<string>("");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const generateThumbnail = async () => {
      try {
        const html = `
          <html>
            <head>
              <style>
                body {
                  margin: 0;
                  padding: 16px;
                  box-sizing: border-box;
                  background: white;
                  font-family: system-ui, -apple-system, sans-serif;
                  min-height: 100vh;
                  display: flex;
                  align-items: flex-start;
                  justify-content: center;
                  overflow: hidden;
                }
                .template-wrapper {
                  width: 100%;
                  max-width: 800px;
                  margin: 0 auto;
                  padding: 10px;
                  overflow: hidden;
                }
                .template-content {
                  width: 100%;
                  font-size: 8px;
                  line-height: 1.4;
                  transform: scale(0.9);
                  transform-origin: top center;
                  margin: 0 auto;
                  max-height: 100%;
                  overflow: hidden;
                }
                @media (max-width: 768px) {
                  body {
                    padding: 10px;
                  }
                  .template-wrapper {
                    padding: 8px;
                  }
                  .template-content {
                    font-size: 7px;
                    transform: scale(0.85);
                  }
                }
              </style>
            </head>
            <body>
              <div class="template-wrapper">
                <div class="template-content">
                  ${renderTemplate(template, coverLetterContent)}
                </div>
              </div>
            </body>
          </html>
        `;
        const blob = new Blob([html], { type: "text/html" });
        const blobUrl = URL.createObjectURL(blob);
        setThumbnailSrc(blobUrl);
      } catch (error) {
        console.error("Error generating template preview:", error);
      }
    };

    generateThumbnail();
    
    return () => {
      if (thumbnailSrc) {
        URL.revokeObjectURL(thumbnailSrc);
      }
    };
  }, [template, coverLetterContent]);

  const handlePreviewClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowPreview(true);
  };

  return (
    <>
      <Card 
        className={`group relative transition-all duration-200 hover:shadow-lg cursor-pointer
          ${isSelected ? "ring-2 ring-primary" : "hover:border-primary/50"}
          w-full sm:w-[320px] md:w-[360px] lg:w-[400px] overflow-hidden
        `}
        onClick={showPreviewOnly ? () => setShowPreview(true) : onSelect}
      >
        {/* Template Container */}
        <div className="relative w-full h-[560px] sm:h-[600px] md:h-[650px] bg-white overflow-hidden">
          <div className="absolute inset-0 w-full h-full overflow-hidden">
            {thumbnailSrc && (
              <iframe
                ref={iframeRef}
                src={thumbnailSrc}
                title={`${template.name} Preview`}
                className="w-full h-full border-none"
                sandbox="allow-same-origin"
                style={{
                  pointerEvents: 'none',
                  backgroundColor: 'white',
                  overflow: 'hidden'
                }}
              />
            )}
          </div>
          
          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-all duration-200" />
          
          {/* Preview Button Overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button 
              className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg 
                flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
              onClick={handlePreviewClick}
            >
              <Eye className="h-4 w-4" />
              <span className="font-medium">Preview</span>
            </button>
          </div>
        </div>

        {/* Template Info */}
        <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm p-3 border-t border-gray-100">
          <h3 className="font-medium text-sm text-gray-800 truncate">
            {template.name}
          </h3>
        </div>
      </Card>

      {/* Full Preview Modal */}
      <TemplatePreview
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        template={template}
        coverLetterContent={coverLetterContent}
        onSelect={onSelect}
        showSelectButton={!showPreviewOnly}
      />
    </>
  );
}