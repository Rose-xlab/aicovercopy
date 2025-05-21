// 5. Template Selection Component
// src/components/cover-letter/TemplateSelection.jsx
"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LayoutTemplate, CheckCircle2 } from "lucide-react";
import { useTemplates } from "@/lib/hooks/useTemplates";
import {useEffect, useState} from 'react'

const TemplateSelection = ({ selectedTemplate, onApplyTemplate, onSkipSelection }) => {
    const { fetchTemplates, templates } = useTemplates();
  // Mock templates if real ones are not available
  const [availableTemplates, setAvailableTemplates] = useState([
    { id: 'modern', name: 'Modern', description: 'Clean and contemporary layout' },
    { id: 'traditional', name: 'Traditional', description: 'Classic and formal style' },
    { id: 'creative', name: 'Creative', description: 'Unique design for creative roles' },
    { id: 'simple', name: 'Simple', description: 'Minimalist and straightforward' },
    { id: 'executive', name: 'Executive', description: 'Professional style for senior positions' }
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
  
  return (
    <Card className="border-primary/20 mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <LayoutTemplate className="h-5 w-5 mr-2 text-primary" />
              Choose a Template (Optional)
            </CardTitle>
            <CardDescription>
              Select a visual style for your cover letter
            </CardDescription>
          </div>
          <Button variant="ghost" onClick={onSkipSelection}>
            Skip
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {availableTemplates.map((template) => (
            <div 
              key={template.id}
              className={`border rounded-md p-4 cursor-pointer transition-all hover:border-primary hover:bg-primary/5 ${selectedTemplate === template.id ? 'border-primary bg-primary/10 ring-2 ring-primary/20' : ''}`}
              onClick={() => onApplyTemplate(template.id)}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium">{template.name}</h3>
                {selectedTemplate === template.id && (
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                )}
              </div>
              <p className="text-sm text-muted-foreground">{template.description}</p>
              <div className="mt-3 h-20 bg-muted/60 rounded flex items-center justify-center">
                <LayoutTemplate className="h-8 w-8 text-muted-foreground/40" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TemplateSelection;