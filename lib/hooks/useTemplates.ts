"use client";

import { useState, useCallback } from 'react';
import { Template, ExportFormat } from '@/types/templates';
import { useToast } from '@/hooks/use-toast';
import { exportCoverLetter, downloadBlob } from '@/lib/export-utils';

export function useTemplates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  /**
   * Fetch all available templates
   */
  const fetchTemplates = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/templates');
      
      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }
      
      const data = await response.json();
      setTemplates(data);
      
      // Set first template as default if none selected
      if (data.length > 0 && !selectedTemplate) {
        setSelectedTemplate(data[0]);
      }
      
      return data;
    } catch (err: any) {
      console.error('Error fetching templates:', err);
      setError(err.message || 'Failed to load templates');
      toast({
        title: "Error",
        description: "Failed to load templates. Please try again.",
        variant: "destructive",
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [selectedTemplate, toast]);

  /**
   * Get a specific template by ID
   */
  const getTemplate = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/templates/${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch template');
      }
      
      const data = await response.json();
      return data;
    } catch (err: any) {
      console.error(`Error fetching template ${id}:`, err);
      setError(err.message || 'Failed to load template');
      toast({
        title: "Error",
        description: "Failed to load template. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  /**
   * Export and download cover letter with the selected template
   */
  const exportWithTemplate = useCallback(async (
    content: string,
    format: ExportFormat = 'pdf',
    templateId?: string, // Optional, uses selectedTemplate if not provided
  ) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get the template to use
      let template = selectedTemplate;
      
      if (templateId && (!template || template.id !== templateId)) {
        template = await getTemplate(templateId);
      }
      
      if (!template) {
        throw new Error('No template selected for export');
      }
      
      // Export the cover letter
      const { blob, filename } = await exportCoverLetter(content, template, format);
      
      if (!blob) {
        throw new Error('Failed to generate file for download.');
      }

      // Download the file
      downloadBlob(blob, filename);
      
      toast({
        title: "Export Successful",
        description: `Your cover letter has been exported as ${format.toUpperCase()}.`,
      });
      
      return true;
    } catch (err: any) {
      console.error('Error exporting cover letter:', err);
      setError(err.message || 'Failed to export cover letter');
      toast({
        title: "Export Failed",
        description: err.message || "Failed to export cover letter. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [selectedTemplate, getTemplate, toast]);

  return {
    templates,
    isLoading,
    error,
    selectedTemplate,
    setSelectedTemplate,
    fetchTemplates,
    getTemplate,
    exportWithTemplate,
  };
}