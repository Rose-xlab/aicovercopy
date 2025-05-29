"use client";

import { Download, FileText, FileTextIcon, FileType2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/use-toast";
import type { CoverLetter } from "@/types/cover-letter";
import { handleCoverLetterExport } from "@/services/coverletter.service";
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

  const handleExport = async (format: "pdf" | "docx" | "txt") => {
    try {
      setIsExporting(true);
      
      // Use the service for all formats - it already handles DOCX correctly
      const success = await handleCoverLetterExport(coverLetter, format, {
        setIsExporting: () => {}, // We handle this locally
        onError: (error) => {
          console.error("Export error:", error);
        }
      });

      if (success) {
        toast({
          title: "Export Successful",
          description: `Your cover letter has been exported as ${format.toUpperCase()}.`,
        });
      }
    } catch (error) {
      console.error("Error exporting cover letter:", error);
      toast({
        title: "Export Failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to export cover letter",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Don't render the component during SSR
  if (!isClient) {
    return null;
  }

  return (
    <div className={className}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={isExporting}
          >
            <Download className="h-4 w-4" />
            {isExporting ? "Exporting..." : "Export"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => handleExport("pdf")}
            disabled={isExporting}
          >
            <FileText className="mr-2 h-4 w-4" />
            <span>PDF (.pdf)</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleExport("docx")}
            disabled={isExporting}
          >
            <FileType2 className="mr-2 h-4 w-4" />
            <span>Word (.docx)</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleExport("txt")}
            disabled={isExporting}
          >
            <FileTextIcon className="mr-2 h-4 w-4" />
            <span>Text (.txt)</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}