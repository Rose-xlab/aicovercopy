"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2 } from "lucide-react";
import { ResumeTemplate } from '@/types/resume';
import Image from "next/image";

// Import template previews
const defaultThumbnail = '/thumbnails/resume-template-default.png';

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

  return (
    <div className="space-y-6">
      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="mb-4">
          {categories.map(category => (
            <TabsTrigger 
              key={category} 
              value={category}
              className="capitalize"
            >
              {category}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeCategory} className="mt-0">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <Card key={i} className="overflow-hidden">
                  <div className="h-64 bg-muted animate-pulse"></div>
                  <CardContent className="p-4">
                    <div className="h-6 w-2/3 bg-muted animate-pulse mb-2"></div>
                    <div className="h-4 w-full bg-muted animate-pulse"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map(template => (
                <Card 
                  key={template.id}
                  className={`overflow-hidden transition-all hover:shadow-md cursor-pointer ${
                    selectedTemplateId === template.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => handleSelectTemplate(template)}
                >
                  <div className="relative">
                    <div className="w-full aspect-[4/3] relative">
                      <Image 
                        src={template.thumbnail || defaultThumbnail}
                        alt={template.name}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover"
                      />
                    </div>
                    {selectedTemplateId === template.id && (
                      <div className="absolute top-2 right-2 bg-primary text-white rounded-full p-1">
                        <CheckCircle2 className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-medium mb-1">{template.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {template.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!isLoading && filteredTemplates.length === 0 && (
            <div className="text-center py-12">
              <h3 className="font-medium mb-2">No templates found</h3>
              <p className="text-muted-foreground mb-4">
                No templates available in this category.
              </p>
              <Button variant="outline" onClick={() => setActiveCategory('all')}>
                View All Templates
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}