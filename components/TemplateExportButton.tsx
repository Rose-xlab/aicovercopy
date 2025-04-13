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
  FileIcon,
  FileCode, 
  ChevronDown,
  AlertCircle
} from "lucide-react";
import { Template, ExportFormat } from "@/types/templates";
import { useTemplates } from "@/lib/hooks/useTemplates";
import { useToast } from "@/hooks/use-toast";
import CoverLetterTemplateSelector from "./CoverLetterTemplateSelector";

interface TemplateExportButtonProps {
  coverLetterContent: string;
  onPlainTextDownloadId: string; // ID for triggering plain text download
}

export default function TemplateExportButton({
  coverLetterContent,
  onPlainTextDownloadId
}: TemplateExportButtonProps) {
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat | null>(null);
  const { selectedTemplate, setSelectedTemplate, exportWithTemplate } = useTemplates();
  const { toast } = useToast();

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
    toast({
      title: "Template Selected",
      description: `"${template.name}" template will be used for exports.`,
      variant: "default"
    });
  };

  const handleExport = async (format: ExportFormat) => {
    try {
      if (!selectedTemplate) {
        // If no template selected, prompt to select one
        setIsTemplateDialogOpen(true);
        return;
      }
      
      setExportFormat(format);
      setIsExporting(true);
      
      // Show a toast to inform the user that export is in progress
      toast({
        title: `Preparing ${format.toUpperCase()} Export`,
        description: "This may take a few seconds...",
        variant: "default"
      });
      
      // Export with the selected template
      const success = await exportWithTemplate(coverLetterContent, format);
      
      if (!success) {
        throw new Error(`Failed to export as ${format.toUpperCase()}`);
      }
      
      toast({
        title: "Export Successful",
        description: `Your cover letter has been exported as ${format.toUpperCase()}.`,
        variant: "default"
      });
    } catch (error: any) {
      console.error('Export error:', error);
      
      // Provide more specific error messages based on the error
      if (error.message?.includes('timeout') || error.message?.includes('timed out')) {
        toast({
          title: "Export Timed Out",
          description: "The document generation took too long. Please try again or use a simpler template.",
          variant: "destructive",
        });
      } else if (error.message?.includes('network') || error.message?.includes('connection')) {
        toast({
          title: "Network Error",
          description: "There was a problem with your internet connection. Please check your connection and try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Export Failed",
          description: error.message || "There was an error exporting your cover letter. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsExporting(false);
      setExportFormat(null);
    }
  };

  // Function to trigger the plain text download using the ID
  const triggerPlainTextDownload = () => {
    // Dispatch a custom event with the ID
    document.dispatchEvent(new CustomEvent('plainTextDownload', {
      detail: { id: onPlainTextDownloadId }
    }));
    
    toast({
      title: "Download Started",
      description: "Your plain text file is being prepared.",
      variant: "default"
    });
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
            {isExporting ? `Exporting ${exportFormat?.toUpperCase()}...` : "Download"}
            {!isExporting && <ChevronDown className="h-3 w-3 opacity-50" />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={triggerPlainTextDownload} disabled={isExporting}>
            <FileText className="h-4 w-4 mr-2" />
            <span>Plain Text (.txt)</span>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => setIsTemplateDialogOpen(true)} disabled={isExporting}>
            <LayoutTemplate className="h-4 w-4 mr-2" />
            <span>Choose Template...</span>
          </DropdownMenuItem>
          
          {selectedTemplate && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => handleExport('pdf')} 
                disabled={isExporting}
                className="text-blue-600 dark:text-blue-400"
              >
                <FileIcon className="h-4 w-4 mr-2" />
                <span>Export as PDF</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleExport('docx')} 
                disabled={isExporting}
                className="text-green-600 dark:text-green-400"
              >
                <FileText className="h-4 w-4 mr-2" />
                <span>Export as DOCX</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleExport('html')} 
                disabled={isExporting}
              >
                <FileCode className="h-4 w-4 mr-2" />
                <span>Export as HTML</span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      
      {isExporting && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-background p-6 rounded-lg shadow-lg max-w-md">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <h3 className="text-xl font-semibold">Preparing Your Document</h3>
              <p className="text-center text-muted-foreground">
                Creating your {exportFormat?.toUpperCase()} file. This might take a few seconds...
              </p>
            </div>
          </div>
        </div>
      )}
      
      <CoverLetterTemplateSelector
        isOpen={isTemplateDialogOpen}
        onClose={() => setIsTemplateDialogOpen(false)}
        onSelectTemplate={handleTemplateSelect}
        coverLetterContent={coverLetterContent}
      />
    </>
  );
}