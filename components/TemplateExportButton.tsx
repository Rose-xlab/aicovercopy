"use client";

import { useState, useRef } from "react";
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
  Loader2
} from "lucide-react";
import { Template, ExportFormat } from "@/types/templates";
import { useTemplates } from "@/lib/hooks/useTemplates";
import { useToast } from "@/hooks/use-toast";
import CoverLetterTemplateSelector from "./CoverLetterTemplateSelector";
import ExportProgressIndicator from "./ExportProgressIndicator";
import { exportCoverLetterWithProgress } from "@/lib/export-service";
import { ExportResult } from "@/types/export";

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
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState('');
  const [showProgress, setShowProgress] = useState(false);
  const [exportResult, setExportResult] = useState<ExportResult | null>(null);
  
  const { selectedTemplate, setSelectedTemplate, exportWithTemplate } = useTemplates();
  const { toast } = useToast();
  const dropdownRef = useRef<HTMLDivElement>(null);

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
      setExportProgress(0);
      setExportStatus('Preparing export...');
      setShowProgress(true);
      setExportResult(null);
      
      // Export with the selected template using the new service
      const result = await exportCoverLetterWithProgress(
        coverLetterContent,
        selectedTemplate,
        format,
        (progress, status) => {
          setExportProgress(progress);
          setExportStatus(status);
        },
        `cover-letter-${new Date().toISOString().split('T')[0]}`,
        {
          retry: { attempts: 2, delay: 1000 },
          timeout: 60000,
          quality: 'standard'
        }
      );
      
      setExportResult(result);
      
      if (!result.success) {
        throw new Error(result.error || `Failed to export as ${format.toUpperCase()}`);
      }
      
      // Success toast not needed here as progress indicator shows success
    } catch (error: any) {
      console.error('Export error:', error);
      
      // Error message handled by progress indicator
      setExportResult({
        success: false,
        filename: `cover-letter.${format}`,
        format,
        error: error.message || `Failed to export as ${format.toUpperCase()}`
      });
    } finally {
      setIsExporting(false);
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
  
  // Retry the last export
  const handleRetry = () => {
    if (exportFormat) {
      handleExport(exportFormat);
    }
  };
  
  // Dismiss the progress indicator
  const handleDismissProgress = () => {
    setShowProgress(false);
  };

  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className="flex gap-2 items-center" 
            disabled={isExporting}
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {isExporting ? `Exporting ${exportFormat?.toUpperCase()}...` : "Download"}
            {!isExporting && <ChevronDown className="h-3 w-3 opacity-50" />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56" ref={dropdownRef}>
          {/* Format Options */}
          <DropdownMenuItem
            onClick={triggerPlainTextDownload}
            disabled={isExporting}
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4 text-gray-600" />
            <div className="flex flex-col">
              <span className="text-sm">Plain Text (.txt)</span>
              <span className="text-xs text-muted-foreground">Simple text without formatting</span>
            </div>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => setIsTemplateDialogOpen(true)} disabled={isExporting}>
            <LayoutTemplate className="h-4 w-4 mr-2 text-indigo-500" />
            <span>Choose Template...</span>
          </DropdownMenuItem>
          
          {selectedTemplate && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => handleExport('pdf')} 
                disabled={isExporting}
                className="flex items-center gap-2"
              >
                <FileIcon className="h-4 w-4 text-blue-600" />
                <div className="flex flex-col">
                  <span className="text-sm">PDF Document</span>
                  <span className="text-xs text-muted-foreground">Professional print-ready format</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleExport('docx')} 
                disabled={isExporting}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4 text-green-600" />
                <div className="flex flex-col">
                  <span className="text-sm">Word Document (.docx)</span>
                  <span className="text-xs text-muted-foreground">Editable in Microsoft Word</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleExport('html')} 
                disabled={isExporting}
                className="flex items-center gap-2"
              >
                <FileCode className="h-4 w-4 text-orange-500" />
                <div className="flex flex-col">
                  <span className="text-sm">HTML Document</span>
                  <span className="text-xs text-muted-foreground">For web or email use</span>
                </div>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Export Progress Indicator */}
      {showProgress && (
        <div className="mt-4">
          <ExportProgressIndicator
            progress={exportProgress}
            status={exportStatus}
            isComplete={exportResult?.success || false}
            isError={exportResult?.success === false}
            errorMessage={exportResult?.error}
            format={exportFormat || ''}
            onRetry={handleRetry}
            onDismiss={handleDismissProgress}
            dismissable={true}
            autoDismissDelay={exportResult?.success ? 5000 : 0}
          />
        </div>
      )}
      
      <CoverLetterTemplateSelector
        isOpen={isTemplateDialogOpen}
        onClose={() => setIsTemplateDialogOpen(false)}
        onSelectTemplate={handleTemplateSelect}
        coverLetterContent={coverLetterContent}
      />
    </div>
  );
}