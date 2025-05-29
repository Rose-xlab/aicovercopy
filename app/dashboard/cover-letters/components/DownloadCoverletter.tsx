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
import { useState } from "react";

interface DownloadCoverletterProps {
  coverLetter: CoverLetter;
  className?: string;
}

export default function DownloadCoverletter({
  coverLetter,
  className = "",
}: DownloadCoverletterProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: "pdf" | "docx" | "txt") => {
    try {
      setIsExporting(true);
      await handleCoverLetterExport(coverLetter, format);
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
