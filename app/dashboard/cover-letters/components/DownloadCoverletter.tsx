"use client";

import { Download, FileText, FileType2, FileTextIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/use-toast";
import type { CoverLetter } from "@/types/cover-letter";
import { useState, useEffect } from "react";

interface DownloadCoverletterProps {
  coverLetter: CoverLetter;
  className?: string;
}

export default function DownloadCoverletter({
  coverLetter,
  className = "",
}: DownloadCoverletterProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleExport = async (format: "pdf" | "docx" | "txt" | "html") => {
    if (!coverLetter) {
      toast({ title: "No cover letter to export", variant: "destructive" });
      return;
    }

    const templateId = coverLetter.templateId;

    if (!templateId) {
        toast({
            title: "Template Not Found",
            description: "A template ID is missing from this cover letter.",
            variant: "destructive",
        });
        return;
    }

    setIsExporting(true);

    try {
      const response = await fetch('/api/export/template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          letterData: coverLetter,
          template_id: templateId,
          format: format,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Export failed with status: ${response.status}`);
      }

      const blob = await response.blob();

      // --- FIX START ---
      // Construct a clean, reliable filename on the client-side instead of parsing it.
      const company = coverLetter.companyName || 'company';
      const title = coverLetter.jobTitle || 'cover-letter';
      
      // Remove any characters that are invalid in a filename
      const sanitizedCompany = company.replace(/[^a-z0-9]/gi, '-').toLowerCase();
      const sanitizedTitle = title.replace(/[^a-z0-9]/gi, '-').toLowerCase();

      const downloadFilename = `${sanitizedTitle}-at-${sanitizedCompany}.${format}`;
      // --- FIX END ---
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = downloadFilename; // Use the new, clean filename
      
      document.body.appendChild(a);
      a.click();
      
      window.URL.revokeObjectURL(url);
      a.remove();

      toast({
        title: "Export Successful",
        description: `Your cover letter is downloading as a ${format.toUpperCase()} file.`,
      });

    } catch (error) {
      console.error("Error exporting cover letter:", error);
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (!isClient) {
    return null;
  }

  return (
    <div className={className}>
      <DropdownMenu>
        <DropdownMenuTrigger
          disabled={isExporting}
          className={buttonVariants({ variant: "outline", size: "sm" }) + " gap-2"}
        >
          <Download className="h-4 w-4" />
          <span>{isExporting ? "Exporting..." : "Export"}</span>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleExport("pdf")} disabled={isExporting}>
            <FileText className="mr-2 h-4 w-4" />
            <span>PDF (.pdf)</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExport("docx")} disabled={isExporting}>
            <FileType2 className="mr-2 h-4 w-4" />
            <span>Word (.docx)</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExport("txt")} disabled={isExporting}>
            <FileTextIcon className="mr-2 h-4 w-4" />
            <span>Text (.txt)</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}