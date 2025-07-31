"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  LayoutTemplate,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useTemplates } from "@/lib/hooks/useTemplates";

// Interface for a single template object
interface Template {
  id: string;
  name: string;
  description: string;
  thumbnail_url?: string; // Optional property
}

// Interface for the component's props
interface TemplateSelectionProps {
  selectedTemplate: string | null;
  onApplyTemplate: (templateId: string) => void;
  onSkipSelection: () => void;
}

const TemplateSelection = ({
  selectedTemplate,
  onApplyTemplate,
  onSkipSelection,
}: TemplateSelectionProps) => {
  const { fetchTemplates } = useTemplates();
  const [isOpen, setIsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const templatesPerPage = 6;

  // Mock templates if real ones aren't available, typed with the Template interface
  const [availableTemplates, setAvailableTemplates] = useState<Template[]>([
    {
      id: "modern",
      name: "Modern",
      description: "Clean and contemporary layout",
    },
    {
      id: "traditional",
      name: "Traditional",
      description: "Classic and formal style",
    },
    {
      id: "creative",
      name: "Creative",
      description: "Unique design for creative roles",
    },
    {
      id: "simple",
      name: "Simple",
      description: "Minimalist and straightforward",
    },
    {
      id: "executive",
      name: "Executive",
      description: "Professional style for senior positions",
    },
    {
      id: "academic",
      name: "Academic",
      description: "Structured format for educational contexts",
    },
    {
      id: "technical",
      name: "Technical",
      description: "Focused on technical skills and experience",
    },
    {
      id: "startup",
      name: "Startup",
      description: "Dynamic style for innovative companies",
    },
    {
      id: "corporate",
      name: "Corporate",
      description: "Polished look for large organizations",
    },
    {
      id: "minimal",
      name: "Minimal",
      description: "Ultra-simplified design emphasizing content",
    },
    {
      id: "bold",
      name: "Bold",
      description: "Strong visual impact with prominent elements",
    },
    {
      id: "elegant",
      name: "Elegant",
      description: "Refined style with sophisticated typography",
    },
  ]);

  useEffect(() => {
    const loadTemplates = async () => {
      const fetchedTemplates = await fetchTemplates();
      if (fetchedTemplates && fetchedTemplates.length > 0) {
        setAvailableTemplates(fetchedTemplates);
      }
    };

    loadTemplates();
  }, [fetchTemplates]);

  const totalPages = Math.ceil(availableTemplates.length / templatesPerPage);

  const paginatedTemplates = availableTemplates.slice(
    currentPage * templatesPerPage,
    (currentPage + 1) * templatesPerPage
  );

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(0, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1));
  };

  const handleTemplateSelection = (templateId: string) => {
    // Emit the selected template to the parent component
    onApplyTemplate(templateId);
    // Close the modal after selection
    setIsOpen(false);
  };

  const handleSkip = () => {
    onSkipSelection();
    setIsOpen(false);
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        className="flex items-center gap-2"
      >
        <LayoutTemplate className="h-4 w-4" />
        Choose Template
        {selectedTemplate && (
          <CheckCircle2 className="h-4 w-4 text-green-500 ml-2" />
        )}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="px-1">
            <DialogTitle className="flex items-center text-lg">
              <LayoutTemplate className="h-4 w-4 mr-2 text-primary" />
              Choose a Template
            </DialogTitle>
            <DialogDescription className="text-sm">
              Select a visual style for your cover letter
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3  gap-4 py-2">
            {paginatedTemplates.map((template) => (
              <div
                key={template.id}
                className={`w-full border rounded-md p-3 cursor-pointer transition-all hover:border-primary hover:bg-primary/5 ${
                  selectedTemplate === template.id
                    ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                    : ""
                }`}
                onClick={() => handleTemplateSelection(template.id)}
              >
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium text-sm">{template.name}</h3>
                  {selectedTemplate === template.id && (
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  )}
                </div>
                {template.thumbnail_url ? (
                  <Image
                    src={template.thumbnail_url}
                    width={300}
                    height={424}
                    className="w-full h-auto rounded-sm"
                    alt={template.name}
                  />
                ) : (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {template.description}
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between border-t pt-3 px-1">
            <Button variant="outline" size="sm" onClick={handleSkip}>
              Skip Selection
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePreviousPage}
                disabled={currentPage === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <span className="text-sm text-muted-foreground">
                Page {currentPage + 1} of {totalPages}
              </span>

              <Button
                variant="outline"
                size="icon"
                onClick={handleNextPage}
                disabled={currentPage >= totalPages - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TemplateSelection;