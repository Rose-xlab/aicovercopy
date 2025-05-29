"use client";

import React, { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import type { CoverLetter} from '@/types/cover-letter'
import { getCoverLetterPreviewData } from "@/services/coverletterpreview.service";


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
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(defaultZoom);
  const [processedHtml, setProcessedHtml] = useState('');

  useEffect(() => {
    setZoom(defaultZoom);
  }, [defaultZoom]);

  useEffect(() => {
    const loadAndRenderPreview = async () => {
      if (!coverLetter) {
        setLoading(true);
        return;
      }

      try {
        setLoading(true);
        const result = await getCoverLetterPreviewData(coverLetter, templateId, zoom);
        setProcessedHtml(result.html);
      } catch (error) {
        console.error("Error loading preview:", error);
        // Set a simple error message in the iframe
        setProcessedHtml(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Error</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                padding: 20px; 
                color: #dc2626;
              }
            </style>
          </head>
          <body>
            <p>Error loading cover letter preview. Please try again.</p>
          </body>
          </html>
        `);
      } finally {
        setLoading(false);
      }
    };

    loadAndRenderPreview();
  }, [coverLetter, templateId, zoom]);

  // Update iframe content when processedHtml changes
  useEffect(() => {
    const iframe = iframeRef.current;
    if (iframe && processedHtml) {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(processedHtml);
        iframeDoc.close();
      }
    }
  }, [processedHtml]);

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