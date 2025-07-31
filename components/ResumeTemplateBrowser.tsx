"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, FileText } from "lucide-react";
import { ResumeTemplate } from '@/types/resume';
import Image from "next/image";

// Define template placeholders with colors instead of using images
const TEMPLATE_COLORS = {
  'Professional': 'bg-blue-50',
  'Modern': 'bg-emerald-50',
  'Creative': 'bg-purple-50',
  'Simple': 'bg-amber-50',
  'Academic': 'bg-cyan-50',
  'default': 'bg-gray-100'
};

export interface ResumeTemplateBrowserProps {
  templates?: ResumeTemplate[];
  selectedTemplate?: ResumeTemplate | null;
  onSelectTemplate?: (template: ResumeTemplate) => void;
  onSelect?: (template: ResumeTemplate) => void;
  selectedId?: string;
}

export default function ResumeTemplateBrowser({ 
  templates: providedTemplates, 
  selectedTemplate, 
  onSelectTemplate,
  onSelect, 
  selectedId 
}: ResumeTemplateBrowserProps) {
  const [templates, setTemplates] = useState<ResumeTemplate[]>(providedTemplates || []);
  const [activeCategory, setActiveCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(!providedTemplates);
  const [imageErrors, setImageErrors] = useState<{[key: string]: boolean}>({});

  // Determine the selected template ID
  const selectedTemplateId = selectedTemplate?.id || selectedId;

  // Handle template selection
  const handleSelectTemplate = (template: ResumeTemplate) => {
    if (onSelectTemplate) {
      onSelectTemplate(template);
    }
    if (onSelect) {
      onSelect(template);
    }
  };

  // Fetch templates on component mount if not provided
  useEffect(() => {
    const fetchTemplates = async () => {
      if (providedTemplates && providedTemplates.length > 0) {
        setTemplates(providedTemplates);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        
        // Fetch templates from API
        const response = await fetch('/api/resumes/templates');
        if (!response.ok) {
          throw new Error('Failed to fetch resume templates');
        }
        
        const data = await response.json();
        setTemplates(data);
      } catch (error) {
        console.error('Error fetching resume templates:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTemplates();
  }, [providedTemplates]);

  // Get unique categories from templates
  const getUniqueCategories = () => {
    const categories = new Set<string>();
    templates.forEach(template => {
      if (template.category) {
        categories.add(template.category.toLowerCase());
      } else {
        categories.add('other');
      }
    });
    return ['all', ...Array.from(categories)];
  };

  const categories = getUniqueCategories();

  // Filter templates by category
  const filteredTemplates = activeCategory === 'all' 
    ? templates 
    : templates.filter(template => 
        template.category?.toLowerCase() === activeCategory
      );

  // Handle image error
  const handleImageError = (templateId: string) => {
    setImageErrors(prev => ({
      ...prev,
      [templateId]: true
    }));
  };

  // Get color for template placeholder
  const getTemplateColor = (category?: string | null) => {
    if (!category) return TEMPLATE_COLORS.default;
    return TEMPLATE_COLORS[category as keyof typeof TEMPLATE_COLORS] || TEMPLATE_COLORS.default;
  };

  return (
    <div className="space-y-6 px-1 sm:px-0">
      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="mb-4 flex overflow-x-auto no-scrollbar px-1">
          {categories.map(category => (
            <TabsTrigger 
              key={category} 
              value={category}
              className="capitalize text-xs sm:text-sm whitespace-nowrap"
            >
              {category}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeCategory} className="mt-0 px-1 sm:px-2">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {[1, 2, 3, 4].map(i => (
                <Card key={i} className="overflow-hidden mx-auto w-[95%] sm:w-full">
                  <div className="aspect-[8.5/11] bg-muted animate-pulse"></div>
                  <CardContent className="p-2 sm:p-4">
                    <div className="h-4 sm:h-6 w-2/3 bg-muted animate-pulse mb-1 sm:mb-2"></div>
                    <div className="h-3 sm:h-4 w-full bg-muted animate-pulse"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
              {filteredTemplates.map(template => (
                <Card 
                  key={template.id}
                  className={`overflow-hidden transition-all hover:shadow-md cursor-pointer ${
                    selectedTemplateId === template.id ? 'ring-2 ring-primary' : ''
                  } mx-auto w-[95%] sm:w-full`}
                  onClick={() => handleSelectTemplate(template)}
                >
                  <div className="relative">
                    <div className="aspect-[8.5/11] w-full border rounded-sm overflow-hidden mx-auto max-w-[95%]">
                      {/* Show placeholder with template name if image fails to load or doesn't exist */}
                      {imageErrors[template.id] || !template.thumbnail ? (
                        <div className={`w-full h-full flex flex-col items-center justify-center ${getTemplateColor(template.category)}`}>
                          <FileText className="h-6 w-6 sm:h-8 sm:w-8 mb-1 sm:mb-2 opacity-70" />
                          <h3 className="font-medium text-center text-xs sm:text-sm px-2 sm:px-4">{template.name}</h3>
                          <p className="text-xs hidden sm:block text-center text-muted-foreground mt-1 px-2 sm:px-4">{template.description}</p>
                        </div>
                      ) : (
                        <div className="relative w-full h-full">
                          <Image 
                            src={template.thumbnail}
                            alt={template.name}
                            fill
                            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                            className="object-contain"
                            onError={() => handleImageError(template.id)}
                          />
                        </div>
                      )}
                    </div>
                    {selectedTemplateId === template.id && (
                      <div className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-primary text-white rounded-full p-0.5 sm:p-1">
                        <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-2 sm:p-3">
                    <h3 className="font-medium text-xs sm:text-sm truncate">{template.name}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {template.category}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!isLoading && filteredTemplates.length === 0 && (
            <div className="text-center py-6 sm:py-12">
              <h3 className="font-medium text-sm sm:text-base mb-2">No templates found</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mb-4">
                No templates available in this category.
              </p>
              <Button variant="outline" size="sm" onClick={() => setActiveCategory('all')}>
                View All Templates
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}