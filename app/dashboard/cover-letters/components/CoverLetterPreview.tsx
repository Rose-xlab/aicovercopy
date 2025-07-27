"use client";

import React, { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import type { CoverLetter } from "@/types/cover-letter";
import { getCoverLetterPreviewData } from "@/services/coverletterpreview.service";
import { Loader2 } from "lucide-react"; // Make sure to have lucide-react installed

interface Props {
  coverLetter: CoverLetter;
  templateId?: string;
  height?: string;
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
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);

  // This is the main effect for rendering the preview
  useEffect(() => {
    const loadAndRenderPreview = async () => {
      // --- SAFETY CHECK ---
      // Ensure coverLetter object and its content are valid before proceeding.
      if (!coverLetter || typeof coverLetter.content !== 'string') {
        setLoading(false);
        setError("Cover letter content is missing or in an invalid format.");
        // Display an error in the iframe
        const iframe = iframeRef.current;
        if (iframe) {
            iframe.srcdoc = `<div style="padding: 2rem; font-family: sans-serif; color: #dc2626; text-align: center;"><h2>Preview Error</h2><p>Cover letter content is missing or invalid.</p></div>`;
        }
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await getCoverLetterPreviewData(
          coverLetter,
          templateId,
          defaultZoom
        );

        if (result && result.html) {
          const iframe = iframeRef.current;
          if (iframe) {
            // Use srcdoc for safer and more reliable content updates
            iframe.srcdoc = result.html;
          }
        } else {
          throw new Error("Preview service returned invalid or empty data.");
        }
      } catch (err: any) {
        console.error("Error loading preview:", err);
        const errorMessage = err.message || "An unknown error occurred while generating the preview.";
        setError(errorMessage);
        const iframe = iframeRef.current;
        if (iframe) {
            iframe.srcdoc = `<div style="padding: 2rem; font-family: sans-serif; color: #dc2626; text-align: center;"><h2>Preview Error</h2><p>${errorMessage}</p></div>`;
        }
      } finally {
        setLoading(false);
      }
    };

    loadAndRenderPreview();
  }, [coverLetter, templateId, defaultZoom]); // This dependency array is correct

  // This effect listens for messages (like page count) from the iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'contentHeight' && event.data.pages) {
        setTotalPages(event.data.pages);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const CardWrapper = removeCard ? React.Fragment : Card;
  const CardContentWrapper = removeCard ? React.Fragment : CardContent;

  return (
    <CardWrapper>
      <CardContentWrapper className={removeCard ? "" : "p-0"}>
        <div className="relative">
          {(loading || error) && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10 p-4">
              {loading && (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">
                    Loading preview...
                  </span>
                </div>
              )}
              {error && !loading && (
                 <div className="text-center text-destructive">
                   <p className="font-bold">Preview Error</p>
                   <p className="text-xs">{error}</p>
                 </div>
              )}
            </div>
          )}
          {totalPages > 1 && !loading && !error && (
            <div className="absolute top-2 right-2 bg-background/90 px-2 py-1 rounded text-xs text-muted-foreground z-20">
              {totalPages} page{totalPages > 1 ? 's' : ''}
            </div>
          )}
          <iframe
            ref={iframeRef}
            title="Cover Letter Preview"
            className="w-full border-0 bg-white"
            style={{ height: height }}
            sandbox="allow-same-origin allow-scripts"
          />
        </div>
      </CardContentWrapper>
    </CardWrapper>
  );
}