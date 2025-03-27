"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { 
  Download, 
  FileText, 
  LayoutTemplate, 
  FileIcon, // Changed FilePdf to FileIcon 
  FileCode, 
  ChevronDown 
} from "lucide-react";
import { Template, ExportFormat } from "@/types/templates";
import { useTemplates } from "@/lib/hooks/useTemplates";
import { useToast } from "@/hooks/use-toast";
import CoverLetterTemplateSelector from "./CoverLetterTemplateSelector";

interface TemplateExportButtonProps {
  coverLetterContent: string;
  onPlainTextDownloadId: string; // Changed from function to string ID
}

export default function TemplateExportButton({
  coverLetterContent,
  onPlainTextDownloadId
}: TemplateExportButtonProps) {
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const { selectedTemplate, setSelectedTemplate, exportWithTemplate } = useTemplates();
  const { toast } = useToast();

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
    toast({
      title: "Template Selected",
      description: `"${template.name}" template will be used for exports.`
    });
  };

  const handleExport = async (format: ExportFormat) => {
    try {
      setIsExporting(true);
      
      if (!selectedTemplate) {
        // If no template selected, prompt to select one
        setIsTemplateDialogOpen(true);
        return;
      }
      
      // Export with the selected template
      const success = await exportWithTemplate(coverLetterContent, format);
      
      if (!success) {
        throw new Error(`Failed to export as ${format.toUpperCase()}`);
      }
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "There was an error exporting your cover letter. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Function to trigger the plain text download using the ID
  const triggerPlainTextDownload = () => {
    // Find the download function based on the ID and call it
    // This could be implemented in various ways depending on your app architecture
    // For example, you might dispatch a custom event:
    document.dispatchEvent(new CustomEvent('plainTextDownload', {
      detail: { id: onPlainTextDownloadId }
    }));
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className="flex gap-2 items-center" 
            disabled={isExporting}
          >
            {isExporting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
            ) : (
              <Download className="h-4 w-4" />
            )}
            Download
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={triggerPlainTextDownload}>
            <FileText className="h-4 w-4 mr-2" />
            <span>Plain Text</span>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => setIsTemplateDialogOpen(true)}>
            <LayoutTemplate className="h-4 w-4 mr-2" />
            <span>Choose Template...</span>
          </DropdownMenuItem>
          
          {selectedTemplate && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleExport('pdf')}>
                <FileIcon className="h-4 w-4 mr-2" />
                <span>Export as PDF</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('docx')}>
                <FileText className="h-4 w-4 mr-2" />
                <span>Export as DOCX</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('html')}>
                <FileCode className="h-4 w-4 mr-2" />
                <span>Export as HTML</span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      
      <CoverLetterTemplateSelector
        isOpen={isTemplateDialogOpen}
        onClose={() => setIsTemplateDialogOpen(false)}
        onSelectTemplate={handleTemplateSelect}
        coverLetterContent={coverLetterContent}
      />
    </>
  );
}