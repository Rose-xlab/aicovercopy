"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/hooks/useAuth";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { createBrowserClient } from "@/lib/supabase";
import { ImportGuide } from '@/components/ImportGuide';
import ResumeTailoringModal from './ResumeTailoringModal';
import TemplateSelectionModal from './TemplateSelectionModal';
import { 
  FileText, 
  Plus, 
  Trash2, 
  Clock, 
  Search, 
  Filter, 
  Upload,
  Save, 
  Download, 
  Copy, 
  Eye,
  CheckCircle2,
  AlertTriangle,
  X,
  Info,
  MoveUp,
  MoveDown,
  Folder,
  FileBadge,
  Palette,
  ChevronDown,
  ZoomIn,
  ZoomOut,
  Maximize,
  LayoutSidebar,
  LayoutList,
  Loader2,
  RefreshCw
} from 'lucide-react';

// Import dropdown components
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Section components
import PersonalInfoSection from './resume-sections/PersonalInfoSection';
import WorkExperienceSection from './resume-sections/WorkExperienceSection';
import EducationSection from './resume-sections/EducationSection';
import SkillsSection from './resume-sections/SkillsSection';
import ProjectsSection from './resume-sections/ProjectsSection';
import CertificationsSection from './resume-sections/CertificationsSection';
import LanguagesSection from './resume-sections/LanguagesSection';
// New section imports
import HobbiesSection from './resume-sections/HobbiesSection';
import ReferencesSection from './resume-sections/ReferencesSection';
import InternshipsSection from './resume-sections/InternshipsSection';
import CustomSection from './resume-sections/CustomSection';

// Resume template browser and preview
import ResumeTemplateBrowser from './ResumeTemplateBrowser';
import ResumePreview from './ResumePreview';

// Export functionality
import { exportResumeWithProgress } from "@/lib/export-service";
import { ExportResult } from "@/types/export";
import ExportProgressIndicator from "./ExportProgressIndicator";

import { ResumeData, ResumeTemplate, DatabaseResumeTemplate, DatabaseResumeData, mapResumeToDatabase, mapDatabaseToResumeData } from "@/types/resume";
import { cn } from "@/lib/utils";

interface ResumeBuilderProps {
  initialData?: ResumeData;
  resumeId?: string;
}

const ResumeBuilder: React.FC<ResumeBuilderProps> = ({ initialData, resumeId }) => {
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [activeTab, setActiveTab] = useState("personal-info");
  const [activeExperience, setActiveExperience] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'docx' | 'txt' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<ResumeTemplate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [availableTemplates, setAvailableTemplates] = useState<ResumeTemplate[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importedSections, setImportedSections] = useState<string[]>([]);
  const [showImportAlert, setShowImportAlert] = useState(false);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [saveInitiated, setSaveInitiated] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [recentlySaved, setRecentlySaved] = useState(false);
  const [showMobileActions, setShowMobileActions] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(65); // Changed from 100 to 65 for better visibility
  const [expandedPreview, setExpandedPreview] = useState(false);
  
  // Export progress tracking
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState('');
  const [showExportProgress, setShowExportProgress] = useState(false);
  const [exportResult, setExportResult] = useState<ExportResult | null>(null);
  
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createBrowserClient();
  const importFileRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Check if we're in a mobile view
  useEffect(() => {
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth < 1024); // lg breakpoint is 1024px
    };

    // Initial check
    checkMobileView();

    // Add event listener for resize
    window.addEventListener('resize', checkMobileView);

    // Cleanup
    return () => window.removeEventListener('resize', checkMobileView);
  }, []);
  
  // Initialize with empty data or load existing data if editing
  useEffect(() => {
    const initializeResume = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        if (initialData) {
          // Use the provided initial data
          setResumeData(initialData);
        } else if (resumeId) {
          // Load existing resume from database
          const { data, error } = await supabase
            .from('resumes')
            .select('*')
            .eq('id', resumeId)
            .single();
          
          if (error) throw error;
          // Transform database format to application format
          const transformedData = mapDatabaseToResumeData(data as unknown as DatabaseResumeData);
          setResumeData(transformedData);
        } else {
          // Create new empty resume
          setResumeData({
            id: crypto.randomUUID(),
            userId: user?.id || '',
            title: 'My Resume',
            personalInfo: {
              firstName: '',
              lastName: '',
              title: '',
              summary: '',
              contact: {
                email: '',
                phone: '',
                location: '',
                linkedIn: '',
                website: ''
              }
            },
            workExperience: [],
            education: [],
            skills: [],
            projects: [],
            languages: [],
            certifications: [],
            interests: [],  // Changed from hobbies to interests to match DB schema
            internships: [],
            references: [],
            referenceText: "References available upon request",
            customSections: [],
            templateId: null,
            isPublic: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
        
        // Load templates
        const { data: templatesData, error: templatesError } = await supabase
          .from('resume_templates')
          .select('*')
          .order('name');
        
        if (templatesError) throw templatesError;
        
        // Transform templates from database format to application format
        const templates = (templatesData || []).map(template => 
          mapDatabaseToResumeTemplate(template as unknown as DatabaseResumeTemplate)
        );
        
        setAvailableTemplates(templates);
        
        // Set default template if none selected
        if (templates && templates.length > 0) {
          // Always use the first template as default
          const defaultTemplate = templates[0];
          
          // If we have initialData with a valid UUID templateId, try to find that template
          if (initialData && initialData.templateId) {
            // Check if the templateId is a valid UUID and exists in our templates
            const foundTemplate = templates.find(t => t.id === initialData.templateId);
            if (foundTemplate) {
              setSelectedTemplate(foundTemplate);
            } else {
              // If template not found, use the default
              setSelectedTemplate(defaultTemplate);
            }
          } else {
            // No initial template ID, use the first template as default ONLY in edit mode
            if (resumeId) {
              setSelectedTemplate(defaultTemplate);
            }
          }
        }
      } catch (err: any) {
        console.error('Error initializing resume:', err);
        setError(err.message || 'Failed to initialize resume. Please try again.');
        toast({
          title: "Error",
          description: "Failed to load resume data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user || !resumeId) {
      initializeResume();
    }
  }, [user, initialData, resumeId, supabase, toast]);
  
  // Handle section updates
  const updateSection = <K extends keyof ResumeData>(
    section: K,
    data: ResumeData[K]
  ) => {
    if (!resumeData) return;
    
    setResumeData({
      ...resumeData,
      [section]: data,
      updated_at: new Date().toISOString()
    });
  };
  
  // Function to check if a string is a valid UUID
  const isValidUUID = (str: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };
  
  // Function to sanitize UUID fields - updated to handle non-UUID template IDs
  const sanitizeUUID = (value: string | null | undefined): string | null => {
    // If value is empty, return null
    if (!value || value.trim() === "") {
      return null;
    }
    
    // If value is already a valid UUID, return it
    if (isValidUUID(value)) {
      return value;
    }
    
    // If we have a non-UUID template ID (like "professional-resume"),
    // try to find a matching template by name and use its ID
    if (availableTemplates.length > 0) {
      // First try exact match
      const template = availableTemplates.find(t => 
        t.name.toLowerCase() === value.toLowerCase() ||
        t.name.toLowerCase().replace(/\s+/g, '-') === value.toLowerCase()
      );
      
      if (template) {
        return template.id;
      }
      
      // If no exact match, use the first available template
      return availableTemplates[0].id;
    }
    
    // If no templates available, return null
    return null;
  };
  
  // Prepare for saving resume
  const handleSaveClick = () => {
    if (!resumeData) return;
    
    // If no template is selected, open template modal before saving
    if (!selectedTemplate) {
      setSaveInitiated(true);
      setShowTemplateModal(true);
    } else {
      saveResume();
    }
  };
  
  // Save resume to database
  const saveResume = async () => {
    if (!resumeData || !selectedTemplate) return;
    
    try {
      setIsSaving(true);
      setError(null);
      
      if (!user) {
        toast({
          title: "Login Required",
          description: "Please login to save your resume.",
          variant: "destructive",
        });
        return;
      }
      
      // Use the selected template's UUID as the template ID
      const templateId = selectedTemplate?.id || null;
      
      // Make sure the resume has the correct user ID and template ID
      const updatedResumeData: ResumeData = {
        ...resumeData,
        userId: user.id,
        templateId: templateId, // Type is now compatible (string | null)
        updated_at: new Date().toISOString()
      };
      
      console.log('Resume data before mapping:', updatedResumeData);
      
      // Transform to match database column names using the mapper
      const dataToSave = mapResumeToDatabase(updatedResumeData);
      
      // Ensure template_id is a valid UUID or null
      if (dataToSave.template_id && !isValidUUID(dataToSave.template_id)) {
        dataToSave.template_id = sanitizeUUID(dataToSave.template_id);
      }
      
      console.log('Data being sent to Supabase:', dataToSave);
      
      let result;
      
      if (resumeId) {
        // Update existing resume
        result = await supabase
          .from('resumes')
          .update(dataToSave as any)
          .eq('id', resumeId)
          .select();
      } else {
        // Insert new resume
        result = await supabase
          .from('resumes')
          .insert(dataToSave as any)
          .select();
      }
      
      if (result.error) throw result.error;
      
      // Clear the import alert after successful save
      setShowImportAlert(false);
      setImportedSections([]);
      setSaveInitiated(false);
      
      // Set recently saved flag
      setRecentlySaved(true);
      
      // Clear recently saved flag after 3 seconds
      setTimeout(() => {
        setRecentlySaved(false);
      }, 3000);
      
      toast({
        title: "Resume Saved",
        description: "Your resume has been saved successfully.",
      });
      
      // Update local state with any data returned from the server
      if (result.data && result.data[0]) {
        // Transform database format to application format
        const updatedData = mapDatabaseToResumeData(result.data[0] as unknown as DatabaseResumeData);
        setResumeData(updatedData);
        
        // If this is a new resume, redirect to the edit page
        if (!resumeId) {
          router.push(`/dashboard/resumes/${result.data[0].id}`);
        }
      }
      
      // Show export options after saving
      setShowExportOptions(true);
      
    } catch (err: any) {
      console.error('Error saving resume:', err);
      setError(err.message || 'Failed to save resume. Please try again.');
      toast({
        title: "Error",
        description: "Failed to save resume. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Function to handle template selection and saving
  const handleSaveWithTemplate = (template: ResumeTemplate) => {
    setSelectedTemplate(template);
    
    // If save was initiated, proceed with saving
    if (saveInitiated) {
      setTimeout(() => {
        saveResume();
      }, 100);
    }
  };
  
  // Export resume in selected format
  const exportResume = async (format: 'pdf' | 'docx' | 'txt') => {
    if (!resumeData || !selectedTemplate) {
      // If no template is selected, prompt the user to select one
      setShowTemplateModal(true);
      return;
    }
    
    try {
      setExportFormat(format);
      setIsExporting(true);
      setExportProgress(0);
      setExportStatus('Preparing export...');
      setShowExportProgress(true);
      
      // Show export in progress toast
      toast({
        title: `Preparing ${format.toUpperCase()}`,
        description: "Your document is being generated...",
      });
      
      // Use the new export service with progress callback
      const result = await exportResumeWithProgress(
        resumeData,
        selectedTemplate,
        format,
        (progress, status) => {
          setExportProgress(progress);
          setExportStatus(status);
        },
        `${resumeData.personalInfo?.firstName || 'Resume'}-${resumeData.personalInfo?.lastName || ''}-Resume`,
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
      
      // Success message will be shown in the progress indicator
    } catch (error: any) {
      console.error('Error exporting resume:', error);
      
      // Set error in export result for the progress indicator
      setExportResult({
        success: false,
        filename: `resume.${format}`,
        format: format,
        error: error.message || "Failed to export resume. Please try again."
      });
      
      toast({
        title: "Export Failed",
        description: error.message || "There was an error exporting your resume. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
      setShowExportOptions(false);
    }
  };
  
  // Handle retry for failed exports
  const handleRetryExport = () => {
    if (exportFormat) {
      exportResume(exportFormat);
    }
  };
  
  // Dismiss export progress
  const handleDismissExportProgress = () => {
    setShowExportProgress(false);
  };
  
  // Handle export options
  const handleExportOption = (format: 'pdf' | 'docx' | 'txt') => {
    // Close dropdown
    setShowExportOptions(false);
    
    // Export in the selected format
    exportResume(format);
  };
  
  // Import resume from file
  const importResume = async (file: File) => {
    try {
      setIsImporting(true);
      setError(null);
      setImportedSections([]);
      
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/resumes/parser', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Import failed');
      }
      
      const parsedData = await response.json();
      
      // Track which sections were imported
      const importedSectionsArray: string[] = [];
      
      // Merge parsed data with current data structure to ensure all required fields exist
      setResumeData(prev => {
        if (!prev) return parsedData;
        
        // Check which sections were successfully imported
        if (parsedData.personalInfo) importedSectionsArray.push('personalInfo');
        if (parsedData.workExperience?.length) importedSectionsArray.push('workExperience');
        if (parsedData.education?.length) importedSectionsArray.push('education');
        if (parsedData.skills?.length) importedSectionsArray.push('skills');
        if (parsedData.projects?.length) importedSectionsArray.push('projects');
        if (parsedData.languages?.length) importedSectionsArray.push('languages');
        if (parsedData.certifications?.length) importedSectionsArray.push('certifications');
        if (parsedData.interests?.length) importedSectionsArray.push('interests'); // Changed from hobbies to interests
        if (parsedData.internships?.length) importedSectionsArray.push('internships');
        if (parsedData.references?.length) importedSectionsArray.push('references');
        if (parsedData.customSections?.length) importedSectionsArray.push('customSections');
        
        // Update custom sections to include new fields if they don't exist
        const updatedCustomSections = parsedData.customSections?.map((section: any) => ({
          ...section,
          city: section.city || '',
          startDate: section.startDate || '',
          endDate: section.endDate || ''
        })) || prev.customSections;
        
        return {
          ...prev,
          title: parsedData.title || prev.title,
          personalInfo: parsedData.personalInfo || prev.personalInfo,
          workExperience: parsedData.workExperience || prev.workExperience,
          education: parsedData.education || prev.education,
          skills: parsedData.skills || prev.skills,
          projects: parsedData.projects || prev.projects,
          languages: parsedData.languages || prev.languages,
          certifications: parsedData.certifications || prev.certifications,
          interests: parsedData.interests || prev.interests, // Changed from hobbies to interests
          internships: parsedData.internships || prev.internships, 
          references: parsedData.references || prev.references,
          referenceText: parsedData.referenceText || prev.referenceText,
          customSections: updatedCustomSections,
          updated_at: new Date().toISOString()
        };
      });
      
      // Update the list of imported sections 
      setImportedSections(importedSectionsArray);
      setShowImportAlert(true);
      
      // If personal info was imported, switch to that tab
      if (importedSectionsArray.includes('personalInfo')) {
        setActiveTab('personal-info');
      } else if (importedSectionsArray.length > 0) {
        // Otherwise, switch to the first tab that was populated
        const firstSection = importedSectionsArray[0];
        if (firstSection === 'workExperience') setActiveTab('work-experience');
        else if (firstSection === 'education') setActiveTab('education');
        else if (firstSection === 'skills') setActiveTab('skills');
        else if (firstSection === 'projects') setActiveTab('projects');
        else if (firstSection === 'certifications') setActiveTab('certifications');
        else if (firstSection === 'languages') setActiveTab('languages');
        else if (firstSection === 'interests') setActiveTab('hobbies'); // Tab name stays "hobbies" for UI consistency
        else if (firstSection === 'internships') setActiveTab('internships');
        else if (firstSection === 'references') setActiveTab('references');
        else if (firstSection === 'customSections') setActiveTab('custom');
      }
      
      toast({
        title: "Import Successful",
        description: "Your resume has been imported and parsed successfully. Please review and save to keep the changes.",
      });
    } catch (err: any) {
      console.error('Error importing resume:', err);
      toast({
        title: "Import Failed",
        description: err.message || "Failed to import resume. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };
  
  // Handle file selection for import
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      importResume(files[0]);
    }
  };
  
  // Function to save imported resume with a new name
  const saveImportedResume = async () => {
    if (!resumeData) return;
    
    // Generate a new ID for this resume
    const newResumeData = {
      ...resumeData,
      id: crypto.randomUUID(),
      title: resumeData.title ? `${resumeData.title} (Imported)` : 'Imported Resume',
    };
    
    setResumeData(newResumeData);
    
    // Verify a template is selected before saving
    if (!selectedTemplate) {
      setSaveInitiated(true);
      setShowTemplateModal(true);
      return;
    }
    
    // Call save with this new data
    await saveResume();
  };
  
  // Function to preview imported resume
  const previewImportedResume = () => {
    // If no template is selected, prompt to select one first
    if (!selectedTemplate) {
      setShowTemplateModal(true);
      return;
    }
    
    // Get the preview container and try to make it fullscreen
    const previewContainer = document.getElementById('resume-preview-container');
    if (previewContainer) {
      try {
        if (previewContainer.requestFullscreen) {
          previewContainer.requestFullscreen();
        } else if ((previewContainer as any).webkitRequestFullscreen) {
          (previewContainer as any).webkitRequestFullscreen();
        } else if ((previewContainer as any).msRequestFullscreen) {
          (previewContainer as any).msRequestFullscreen();
        }
      } catch (error) {
        console.error("Error entering fullscreen mode:", error);
        toast({
          title: "Preview Error",
          description: "Could not open preview in fullscreen mode. Please try again.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Preview Error",
        description: "Preview container not found. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Function to handle import guide close
  const handleImportGuideClose = () => {
    setShowImportAlert(false);
  };
  
  // Function to toggle mobile preview
  const toggleMobilePreview = () => {
    // If no template is selected, prompt to select one first
    if (!selectedTemplate && !showMobilePreview) {
      setShowTemplateModal(true);
      return;
    }
    
    setShowMobilePreview(!showMobilePreview);
  };
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowExportOptions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Toggle expanded preview mode
  const toggleExpandedPreview = () => {
    if (!selectedTemplate) {
      setShowTemplateModal(true);
      return;
    }
    setExpandedPreview(!expandedPreview);
  };
  
  // Handle zoom controls
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 10, 150));
  };
  
  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 10, 40));
  };
  
  // Reset zoom to default 65%
  const handleZoomReset = () => {
    setZoomLevel(65);
  };
  
  // Mobile Action Button component
  const MobileActionButton = () => {
    if (!isMobileView) return null;
    
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <DropdownMenu open={showMobileActions} onOpenChange={setShowMobileActions}>
          <DropdownMenuTrigger asChild>
            <Button 
              className="h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-teal-500 to-gray-700 text-white hover:from-teal-600 hover:to-gray-800 transition-all"
              aria-label="Resume Actions"
            >
              <FileText className="h-6 w-6" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 p-2 bg-white rounded-md shadow-xl border border-teal-100">
            <DropdownMenuItem 
              onClick={toggleMobilePreview}
              className="flex items-center p-3 cursor-pointer hover:bg-teal-50 rounded-md"
            >
              <Eye className="h-5 w-5 mr-3 text-teal-600" />
              <span>Preview Resume</span>
            </DropdownMenuItem>
            
            <DropdownMenuItem 
              onClick={() => setShowTemplateModal(true)}
              className="flex items-center p-3 cursor-pointer hover:bg-teal-50 rounded-md"
            >
              <Palette className="h-5 w-5 mr-3 text-teal-600" />
              <span>{selectedTemplate ? "Change Template" : "Choose Template"}</span>
            </DropdownMenuItem>
            
            <DropdownMenuItem 
              onClick={handleSaveClick}
              disabled={isSaving || !resumeData?.personalInfo?.firstName}
              className="flex items-center p-3 cursor-pointer hover:bg-teal-50 rounded-md"
            >
              <Save className="h-5 w-5 mr-3 text-teal-600" />
              <span>Save Resume</span>
            </DropdownMenuItem>
            
            <DropdownMenuItem 
              onClick={() => handleExportOption('pdf')}
              disabled={isExporting && exportFormat === 'pdf'}
              className="flex items-center p-3 cursor-pointer hover:bg-teal-50 rounded-md"
            >
              <Download className="h-5 w-5 mr-3 text-teal-600" />
              <span>{isExporting && exportFormat === 'pdf' ? "Exporting PDF..." : "Export as PDF"}</span>
            </DropdownMenuItem>
            
            <DropdownMenuItem 
              onClick={() => handleExportOption('docx')}
              disabled={isExporting && exportFormat === 'docx'}
              className="flex items-center p-3 cursor-pointer hover:bg-teal-50 rounded-md"
            >
              <Download className="h-5 w-5 mr-3 text-teal-600" />
              <span>{isExporting && exportFormat === 'docx' ? "Exporting DOCX..." : "Export as DOCX"}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };
  
  if (isLoading) {
    return (
      <Card className="w-full border-0 shadow-none rounded-none">
        <CardContent className="flex justify-center items-center py-8">
          <LoadingSpinner className="text-teal-600" />
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card className="w-full border-0 shadow-none rounded-none">
        <CardContent className="py-8">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="mt-4 flex justify-center">
          <Button onClick={() => router.back()} className="bg-teal-600 hover:bg-teal-700 text-white">Go Back</Button>
          </div>
          </CardContent>
      </Card>
    );
  }
  
  if (!resumeData) {
    return (
      <Card className="w-full border-0 shadow-none rounded-none">
        <CardContent className="py-8">
          <Alert>
            <AlertDescription>
              No resume data available. Please create a new resume.
            </AlertDescription>
          </Alert>
          <div className="mt-4 flex justify-center">
            <Button onClick={() => router.push('/dashboard/resumes/new')} className="bg-teal-600 hover:bg-teal-700 text-white">Create New Resume</Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="w-full m-0 p-0">
      {/* Template Selection Modal */}
      <TemplateSelectionModal
        resume={resumeData}
        templates={availableTemplates}
        selectedTemplate={selectedTemplate}
        open={showTemplateModal}
        onOpenChange={setShowTemplateModal}
        onSelectTemplate={setSelectedTemplate}
        onSaveWithTemplate={handleSaveWithTemplate}
        isPreviewMode={!saveInitiated}
      />
    
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">{resumeId ? 'Edit Resume' : 'Create Resume'}</h2>
          <p className="text-gray-600 mt-1">Complete the sections below to build your professional resume</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {resumeId && resumeData && (
            <ResumeTailoringModal 
              resume={resumeData} 
              onUpdateResume={(newData) => {
                setResumeData(newData);
                setActiveExperience(null); // Reset any active sections
                toast({
                  title: "Resume Tailored",
                  description: "Your resume has been optimized for the job description."
                });
              }} 
            />
          )}
          
          {/* Only show import button for new resumes */}
          {!resumeId && (
            <Button
              variant="outline"
              onClick={() => importFileRef.current?.click()}
              disabled={isImporting}
              className="bg-teal-50 border-teal-200 text-teal-700 hover:bg-teal-100 hover:text-teal-800 transition-colors"
            >
              {isImporting ? (
                <>
                  <LoadingSpinner className="mr-2" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Import Resume
                </>
              )}
              <input
                ref={importFileRef}
                id="resume-import"
                type="file"
                accept=".pdf,.docx,.txt"
                className="hidden"
                onChange={handleFileSelect}
              />
            </Button>
          )}
        </div>
      </div>
      
      {/* Display template info if selected */}
      {selectedTemplate && (
        <div className="bg-teal-50 border border-teal-200 rounded-md p-3 flex justify-between items-center">
          <div className="flex items-center">
            <Palette className="h-5 w-5 text-teal-600 mr-2" />
            <div>
              <p className="font-medium text-teal-800">Selected Template: <span className="font-semibold">{selectedTemplate.name}</span></p>
              {selectedTemplate.description && (
                <p className="text-sm text-teal-700 mt-0.5">{selectedTemplate.description}</p>
              )}
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowTemplateModal(true)}
            className="bg-white border-teal-300 text-teal-700 hover:bg-teal-100"
          >
            Change Template
          </Button>
        </div>
      )}
      
      {/* Import Alert Banner */}
      {showImportAlert && importedSections.length > 0 && (
        <Alert className="bg-teal-50 border-teal-200 text-teal-800">
          <CheckCircle2 className="h-5 w-5 text-teal-500" />
          <AlertTitle className="text-teal-800 font-medium">Resume Imported Successfully!</AlertTitle>
          <AlertDescription className="text-teal-700">
            <p className="mt-1">The following sections were imported from your resume:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              {importedSections.includes('personalInfo') && <li>Personal Information</li>}
              {importedSections.includes('workExperience') && <li>Work Experience</li>}
              {importedSections.includes('education') && <li>Education</li>}
              {importedSections.includes('skills') && <li>Skills</li>}
              {importedSections.includes('projects') && <li>Projects</li>}
              {importedSections.includes('languages') && <li>Languages</li>}
              {importedSections.includes('certifications') && <li>Certifications</li>}
              {importedSections.includes('interests') && <li>Hobbies</li>} {/* Name stays as Hobbies in UI */}
              {importedSections.includes('internships') && <li>Internships</li>}
              {importedSections.includes('references') && <li>References</li>}
              {importedSections.includes('customSections') && <li>Custom Sections</li>}
            </ul>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button onClick={saveImportedResume} variant="outline" className="bg-white border-teal-300 text-teal-700 hover:bg-teal-50">
                <Save className="h-4 w-4 mr-2" />
                Save as New Resume
              </Button>
              <Button onClick={previewImportedResume} variant="outline" className="bg-white border-teal-300 text-teal-700 hover:bg-teal-50">
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button onClick={() => setShowImportAlert(false)} variant="ghost" className="text-teal-700 hover:bg-teal-50">
                <X className="h-4 w-4 mr-2" />
                Dismiss
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Mobile Resume Preview - Only shown when preview is active */}
      {isMobileView && showMobilePreview && selectedTemplate && (
        <div className="fixed inset-0 z-50 bg-white overflow-auto">
          <div className="py-4 px-4 bg-teal-50 border-b border-teal-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-teal-800">Resume Preview</h3>
            <Button 
              onClick={toggleMobilePreview}
              variant="ghost" 
              className="text-teal-700 hover:bg-teal-100"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="p-0">
            <ResumePreview 
              resume={resumeData} 
              template={selectedTemplate}
              defaultZoom={65}
              removeCard={true}
            />
          </div>
        </div>
      )}
      
      {/* Layout toggle button - Show this in desktop view */}
      {!isMobileView && selectedTemplate && (
        <div className="flex justify-end mb-4">
          <Button
            variant="outline"
            onClick={toggleExpandedPreview}
            className="bg-white border-teal-200 text-teal-700 hover:bg-teal-50"
          >
            {expandedPreview ? (
              <>
                <LayoutList className="h-4 w-4 mr-2" />
                Edit Mode
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Focus on Preview
              </>
            )}
          </Button>
        </div>
      )}
      
      {/* Main content layout - Adjustable based on expanded preview */}
      <div className={`grid grid-cols-1 ${!isMobileView ? (expandedPreview ? 'lg:grid-cols-5' : 'lg:grid-cols-12') : ''} w-full gap-4`}>
        {/* Form section - Adjustable width based on expanded preview */}
        <div className={`${!isMobileView ? (expandedPreview ? 'lg:col-span-2 lg:order-2' : 'lg:col-span-5 lg:order-1') : ''}`}>
          {/* Only show the form if we're not in expanded preview mode on mobile */}
          {(!expandedPreview || !isMobileView) && (
            <Card className="border-0 shadow-none rounded-none">
              <CardHeader className="bg-white border-b">
                <CardTitle className="text-gray-800">Resume Details</CardTitle>
              </CardHeader>
              
              
             {/* Accordion-Style Tabs Implementation */}
            <div className="bg-white">
              <Accordion 
                type="single" 
                collapsible 
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <AccordionItem value="personal-info" className={cn(
                  importedSections.includes('personalInfo') ? 'ring-1 ring-teal-500 bg-teal-50 rounded-md mb-2' : 'mb-2 border rounded-md'
                )}>
                  <AccordionTrigger className="px-4 py-3 hover:bg-gray-50 hover:no-underline rounded-t-md">
                    <div className="flex items-center">
                      <span className="font-medium">Personal Info</span>
                      {importedSections.includes('personalInfo') && (
                        <CheckCircle2 className="h-4 w-4 ml-2 text-teal-500" />
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pt-2 pb-4">
                    <PersonalInfoSection 
                      data={resumeData.personalInfo} 
                      onChange={(data) => updateSection('personalInfo', data)} 
                      isHighlighted={importedSections.includes('personalInfo')}
                    />
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="work-experience" className={cn(
                  importedSections.includes('workExperience') ? 'ring-1 ring-teal-500 bg-teal-50 rounded-md mb-2' : 'mb-2 border rounded-md'
                )}>
                  <AccordionTrigger className="px-4 py-3 hover:bg-gray-50 hover:no-underline rounded-t-md">
                    <div className="flex items-center">
                      <span className="font-medium">Work Experience</span>
                      {importedSections.includes('workExperience') && (
                        <CheckCircle2 className="h-4 w-4 ml-2 text-teal-500" />
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pt-2 pb-4">
                    <WorkExperienceSection 
                      data={resumeData.workExperience || []} 
                      onChange={(data) => updateSection('workExperience', data)}
                    />
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="education" className={cn(
                  importedSections.includes('education') ? 'ring-1 ring-teal-500 bg-teal-50 rounded-md mb-2' : 'mb-2 border rounded-md'
                )}>
                  <AccordionTrigger className="px-4 py-3 hover:bg-gray-50 hover:no-underline rounded-t-md">
                    <div className="flex items-center">
                      <span className="font-medium">Education</span>
                      {importedSections.includes('education') && (
                        <CheckCircle2 className="h-4 w-4 ml-2 text-teal-500" />
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pt-2 pb-4">
                    <EducationSection 
                      data={resumeData.education || []} 
                      onChange={(data) => updateSection('education', data)}
                    />
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="skills" className={cn(
                  importedSections.includes('skills') ? 'ring-1 ring-teal-500 bg-teal-50 rounded-md mb-2' : 'mb-2 border rounded-md'
                )}>
                  <AccordionTrigger className="px-4 py-3 hover:bg-gray-50 hover:no-underline rounded-t-md">
                    <div className="flex items-center">
                      <span className="font-medium">Skills</span>
                      {importedSections.includes('skills') && (
                        <CheckCircle2 className="h-4 w-4 ml-2 text-teal-500" />
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pt-2 pb-4">
                    <SkillsSection 
                      data={resumeData.skills || []} 
                      onChange={(data) => updateSection('skills', data)}
                    />
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="projects" className={cn(
                  importedSections.includes('projects') ? 'ring-1 ring-teal-500 bg-teal-50 rounded-md mb-2' : 'mb-2 border rounded-md'
                )}>
                  <AccordionTrigger className="px-4 py-3 hover:bg-gray-50 hover:no-underline rounded-t-md">
                    <div className="flex items-center">
                      <span className="font-medium">Projects</span>
                      {importedSections.includes('projects') && (
                        <CheckCircle2 className="h-4 w-4 ml-2 text-teal-500" />
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pt-2 pb-4">
                    <ProjectsSection 
                      data={resumeData.projects || []} 
                      onChange={(data) => updateSection('projects', data)}
                    />
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="certifications" className={cn(
                  importedSections.includes('certifications') ? 'ring-1 ring-teal-500 bg-teal-50 rounded-md mb-2' : 'mb-2 border rounded-md'
                )}>
                  <AccordionTrigger className="px-4 py-3 hover:bg-gray-50 hover:no-underline rounded-t-md">
                    <div className="flex items-center">
                      <span className="font-medium">Certifications</span>
                      {importedSections.includes('certifications') && (
                        <CheckCircle2 className="h-4 w-4 ml-2 text-teal-500" />
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pt-2 pb-4">
                    <CertificationsSection 
                      data={resumeData.certifications || []} 
                      onChange={(data) => updateSection('certifications', data)}
                    />
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="languages" className={cn(
                  importedSections.includes('languages') ? 'ring-1 ring-teal-500 bg-teal-50 rounded-md mb-2' : 'mb-2 border rounded-md'
                )}>
                  <AccordionTrigger className="px-4 py-3 hover:bg-gray-50 hover:no-underline rounded-t-md">
                    <div className="flex items-center">
                      <span className="font-medium">Languages</span>
                      {importedSections.includes('languages') && (
                        <CheckCircle2 className="h-4 w-4 ml-2 text-teal-500" />
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pt-2 pb-4">
                    <LanguagesSection 
                      data={resumeData.languages || []} 
                      onChange={(data) => updateSection('languages', data)}
                    />
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="hobbies" className={cn(
                  importedSections.includes('interests') ? 'ring-1 ring-teal-500 bg-teal-50 rounded-md mb-2' : 'mb-2 border rounded-md'
                )}>
                  <AccordionTrigger className="px-4 py-3 hover:bg-gray-50 hover:no-underline rounded-t-md">
                    <div className="flex items-center">
                      <span className="font-medium">Hobbies</span>
                      {importedSections.includes('interests') && (
                        <CheckCircle2 className="h-4 w-4 ml-2 text-teal-500" />
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pt-2 pb-4">
                    <HobbiesSection 
                      data={resumeData.interests || []} 
                      onChange={(data) => updateSection('interests', data)}
                      useStructured={false}
                    />
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="internships" className={cn(
                  importedSections.includes('internships') ? 'ring-1 ring-teal-500 bg-teal-50 rounded-md mb-2' : 'mb-2 border rounded-md'
                )}>
                  <AccordionTrigger className="px-4 py-3 hover:bg-gray-50 hover:no-underline rounded-t-md">
                    <div className="flex items-center">
                      <span className="font-medium">Internships</span>
                      {importedSections.includes('internships') && (
                        <CheckCircle2 className="h-4 w-4 ml-2 text-teal-500" />
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pt-2 pb-4">
                    <InternshipsSection 
                      data={(resumeData.internships || []).map(internship => ({
                        ...internship,
                        isOngoing: internship.isOngoing || false
                      }))} 
                      onChange={(data) => updateSection('internships', data)}
                    />
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="references" className={cn(
                  importedSections.includes('references') ? 'ring-1 ring-teal-500 bg-teal-50 rounded-md mb-2' : 'mb-2 border rounded-md'
                )}>
                  <AccordionTrigger className="px-4 py-3 hover:bg-gray-50 hover:no-underline rounded-t-md">
                    <div className="flex items-center">
                      <span className="font-medium">References</span>
                      {importedSections.includes('references') && (
                        <CheckCircle2 className="h-4 w-4 ml-2 text-teal-500" />
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pt-2 pb-4">
                    <ReferencesSection 
                      data={resumeData.references || []} 
                      onChange={(data) => updateSection('references', data)}
                      generalStatement={resumeData.referenceText || "References available upon request"}
                      onStatementChange={(statement) => {
                        if (resumeData) {
                          setResumeData({
                            ...resumeData,
                            referenceText: statement,
                            updated_at: new Date().toISOString()
                          });
                        }
                      }}
                      enableStatement={true}
                    />
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="custom" className={cn(
                  importedSections.includes('customSections') ? 'ring-1 ring-teal-500 bg-teal-50 rounded-md mb-2' : 'mb-2 border rounded-md'
                )}>
                  <AccordionTrigger className="px-4 py-3 hover:bg-gray-50 hover:no-underline rounded-t-md">
                    <div className="flex items-center">
                      <span className="font-medium">Custom</span>
                      {importedSections.includes('customSections') && (
                        <CheckCircle2 className="h-4 w-4 ml-2 text-teal-500" />
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pt-2 pb-4">
                    <CustomSection 
                      data={resumeData.customSections || []} 
                      onChange={(data) => updateSection('customSections', data)}
                    />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
              
              <CardFooter className="flex flex-col sm:flex-row gap-3 justify-between border-t p-6 bg-gray-50">
                <div className="flex items-center">
                  <Info className="h-4 w-4 text-teal-500 mr-2" />
                  <span className="text-sm text-gray-600">
                    {recentlySaved ? (
                      <span className="flex items-center text-teal-600">
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Resume saved successfully!
                      </span>
                    ) : (
                      "Complete all sections and save your resume"
                    )}
                  </span>
                </div>
                
                {/* Combined Save/Export Button */}
                <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end">
                  {/* Template selection button - Only visible on desktop */}
                  {!isMobileView && (
                    <Button
                      variant="outline"
                      onClick={() => setShowTemplateModal(true)}
                      className="w-full sm:w-auto bg-white border-teal-200 text-teal-700 hover:bg-teal-50"
                    >
                      <Palette className="h-4 w-4 mr-2" />
                      {selectedTemplate ? "Change Template" : "Choose Template"}
                    </Button>
                  )}
                  
                  {/* Main Save/Export Actions - Only visible on desktop */}
                  {!isMobileView && (
                    <div ref={dropdownRef} className="relative">
                      {/* Primary Save Button */}
                      <div className="flex">
                        <Button 
                          onClick={handleSaveClick} 
                          disabled={isSaving || !resumeData?.personalInfo?.firstName}
                          className="rounded-r-none border-r-0 bg-teal-600 hover:bg-teal-700 text-white"
                        >
                          {isSaving ? <LoadingSpinner className="mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                          Save Resume
                        </Button>
                        
                        {/* Dropdown Trigger */}
                        <DropdownMenu open={showExportOptions} onOpenChange={setShowExportOptions}>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              className="rounded-l-none bg-teal-600 hover:bg-teal-700 text-white px-2" 
                              disabled={!resumeData?.personalInfo?.firstName}
                            >
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem 
                              onClick={() => handleExportOption('pdf')}
                              disabled={isExporting && exportFormat === 'pdf'}
                              className="cursor-pointer"
                            >
                              {isExporting && exportFormat === 'pdf' ? (
                                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Exporting...</>
                              ) : (
                                <><Download className="h-4 w-4 mr-2" /> Export as PDF</>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleExportOption('docx')}
                              disabled={isExporting && exportFormat === 'docx'}
                              className="cursor-pointer"
                            >
                              {isExporting && exportFormat === 'docx' ? (
                                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Exporting...</>
                              ) : (
                                <><Download className="h-4 w-4 mr-2" /> Export as DOCX</>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleExportOption('txt')}
                              disabled={isExporting && exportFormat === 'txt'}
                              className="cursor-pointer"
                            >
                              {isExporting && exportFormat === 'txt' ? (
                                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Exporting...</>
                              ) : (
                                <><Download className="h-4 w-4 mr-2" /> Export as TXT</>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Export Progress Indicator */}
                {showExportProgress && (
                  <div className="mt-4 w-full">
                    <ExportProgressIndicator
                      progress={exportProgress}
                      status={exportStatus}
                      isComplete={exportResult?.success || false}
                      isError={exportResult?.success === false}
                      errorMessage={exportResult?.error}
                      format={exportFormat || ''}
                      onRetry={handleRetryExport}
                      onDismiss={handleDismissExportProgress}
                      dismissable={true}
                      autoDismissDelay={exportResult?.success ? 5000 : 0}
                    />
                  </div>
                )}
              </CardFooter>
            </Card>
          )}
        </div>
        
        {/* Preview section with direct DOM rendering instead of iframe */}
        {!isMobileView && (
          <div className={`${expandedPreview ? 'lg:col-span-3 lg:order-1' : 'lg:col-span-7 lg:order-2'}`}>
            {/* Modified preview area - removed iframe */}
            <div className="h-full">
              {/* Header controls - kept but removed card styling */}
              <div className="bg-gray-100 border border-gray-200 rounded-t-md flex flex-row justify-between items-center py-2 px-4">
                <div className="text-gray-800 text-base font-medium">Resume Preview</div>
                
                {/* Preview controls with zoom functionality */}
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleZoomOut}
                    disabled={zoomLevel <= 40}
                    className="bg-white text-gray-700 border-gray-300 h-8 w-8 p-0"
                  >
                    <ZoomOut className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleZoomReset}
                    className="bg-white text-gray-700 border-gray-300 px-1 h-8"
                  >
                    <span className="text-xs">{zoomLevel}%</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleZoomIn}
                    disabled={zoomLevel >= 150}
                    className="bg-white text-gray-700 border-gray-300 h-8 w-8 p-0"
                  >
                    <ZoomIn className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (resumeData && selectedTemplate) {
                        window.open(`/dashboard/resumes/${resumeData.id}/preview`, '_blank');
                      }
                    }}
                    className="bg-white text-gray-700 border-gray-300 h-8 w-8 p-0"
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              {/* Content area directly on gray background */}
              <div className="bg-gray-100 flex justify-center overflow-auto border-l border-r border-gray-200" 
                  style={{ height: expandedPreview ? 'calc(100vh - 160px)' : '540px' }}>
                {!selectedTemplate ? (
                  <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-gray-200 rounded-md w-full m-4 bg-white">
                    <div className="text-center space-y-2 p-4">
                      <Palette className="h-8 w-8 text-teal-300 mx-auto" />
                      <h3 className="font-medium text-gray-700 text-sm">Choose a Template</h3>
                      <Button onClick={() => setShowTemplateModal(true)} size="sm" className="mx-auto">
                        Choose Template
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="w-full  py-3 flex justify-center">
                    {/* Resume directly on background - using updated ResumePreview component */}
                    <div className="transition-all relative">
                      {/* Pass current zoom level to ResumePreview */}
                      <ResumePreview 
                        resume={resumeData} 
                        template={selectedTemplate}
                        height="510px"
                        defaultZoom={zoomLevel}
                        removeCard={true}
                      />
                      
                      {/* Add expand button at bottom right of preview */}
                      <div className="absolute bottom-2 right-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            if (resumeData && selectedTemplate) {
                              window.open(`/dashboard/resumes/${resumeData.id}/preview`, '_blank');
                            }
                          }}
                          variant="outline"
                          className="bg-white text-gray-700 border-gray-300 h-7 shadow-sm"
                        >
                          <Maximize className="h-3 w-3 mr-1" />
                          <span className="text-xs">Expand</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Footer controls - kept but removed card styling */}
              {selectedTemplate && (
                <div className="border-t border-l border-r border-b border-gray-200 rounded-b-md py-2 px-4 bg-gray-50 flex justify-between">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-teal-700 border-teal-200 hover:bg-teal-50 h-8"
                    onClick={toggleExpandedPreview}
                  >
                    {expandedPreview ? (
                      <>
                        <LayoutList className="h-3 w-3 mr-1" />
                        <span className="text-xs">Edit Mode</span>
                      </>
                    ) : (
                      <>
                        <Eye className="h-3 w-3 mr-1" />
                        <span className="text-xs">Focus on Preview</span>
                      </>
                    )}
                  </Button>
                  
                  <div className="flex gap-2">
                    <Button 
                      size="sm"
                      onClick={() => window.open(`/dashboard/resumes/${resumeData.id}/preview`, '_blank')}
                      variant="outline"
                      className="text-teal-700 border-teal-200 hover:bg-teal-50 h-8"
                    >
                      <Maximize className="h-3 w-3 mr-1" />
                      <span className="text-xs">Open Full View</span>
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => handleExportOption('pdf')} 
                      className="bg-teal-600 hover:bg-teal-700 text-white h-8"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      <span className="text-xs">Download PDF</span>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mobile Action Button */}
      <MobileActionButton />
    </div>
  );
};

// Helper function to map database template to app template
function mapDatabaseToResumeTemplate(template: DatabaseResumeTemplate): ResumeTemplate {
  return {
    id: template.id,
    name: template.name,
    description: template.description || '',
    thumbnail: template.thumbnail || '',
    htmlContent: template.html_content || '', // Updated from htmlTemplate to htmlContent
    cssContent: template.css_content || '',   // Updated from cssTemplate to cssContent
    category: template.category || 'Professional',
    isPublic: template.is_public || false,    // Updated from isDefault to isPublic
    created_at: template.created_at || new Date().toISOString(),
    updated_at: template.updated_at || new Date().toISOString()
  };
}

export default ResumeBuilder;