"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ResumeTemplate, ResumeData } from "@/types/resume";
import ResumeTemplateBrowser from './ResumeTemplateBrowser';
import { useToast } from "@/components/ui/use-toast";

// Option 1: Move the component definition to a separate file without "use client"
// and import it here. In this case, we're creating a wrapper component instead.

type TemplateSelectionModalProps = {
  resume: ResumeData;
  templates: ResumeTemplate[];
  selectedTemplate: ResumeTemplate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate: (template: ResumeTemplate) => void;
  onSaveWithTemplate: (template: ResumeTemplate) => void;
  isPreviewMode?: boolean;
}

// This is the actual component implementation, which doesn't have "use client" directive directly on it
function TemplateSelectionModalImpl({
  resume,
  templates,
  selectedTemplate,
  open,
  onOpenChange,
  onSelectTemplate,
  onSaveWithTemplate,
  isPreviewMode = false
}: TemplateSelectionModalProps) {
  const { toast } = useToast();
  const [isSelecting, setIsSelecting] = useState(false);

  // Handle template selection and auto-save
  const handleTemplateSelect = async (template: ResumeTemplate) => {
    if (isSelecting) return; // Prevent multiple rapid selections
    
    setIsSelecting(true);
    
    try {
      // Update the selected template
      onSelectTemplate(template);
      
      // Show a brief toast notification
      toast({
        title: "Template selected",
        description: `"${template.name}" template has been applied to your resume.`,
        duration: 2000,
      });
      
      // Apply the template after a brief delay to allow the user to see feedback
      setTimeout(() => {
        onSaveWithTemplate(template);
        onOpenChange(false); // Close the modal
      }, 500);
    } catch (error) {
      toast({
        title: "Error applying template",
        description: "There was a problem applying the template. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSelecting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl md:max-w-4xl lg:max-w-5xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-lg sm:text-xl font-bold">
            {isPreviewMode ? "Choose a Template" : "Select a Template for Your Resume"}
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            Click on any template to apply it immediately to your resume
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col">
          <div>
            <ResumeTemplateBrowser
              templates={templates}
              selectedTemplate={selectedTemplate}
              onSelectTemplate={handleTemplateSelect}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// This is the client component that exposes the component
export default function TemplateSelectionModal(props: TemplateSelectionModalProps) {
  return <TemplateSelectionModalImpl {...props} />;
}