// File: components/ResumeBuilder.tsx

"use client";

import { useState, useEffect, useRef, Dispatch, SetStateAction } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/hooks/useAuth"; // Your auth hook
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { createBrowserClient } from "@/lib/supabase";
import { ImportGuide } from '@/components/ImportGuide';
import ResumeTailoringModal from './ResumeTailoringModal';
import TemplateSelectionModal from './TemplateSelectionModal';
import {
  FileText, Plus, Trash2, Clock, Search, Filter, Upload, Save, Download, Copy, Eye, CheckCircle2,
  AlertTriangle, X, Info, MoveUp, MoveDown, Folder, FileBadge, Palette, ChevronDown, ZoomIn, ZoomOut,
  Maximize, PanelLeft, LayoutList, Loader2, RefreshCw, Edit, ScanSearch, Share2, FileSpreadsheet,
  MoreVertical, Sparkles, ArrowLeft
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import PersonalInfoSection from './resume-sections/PersonalInfoSection';
import WorkExperienceSection from './resume-sections/WorkExperienceSection';
import EducationSection from './resume-sections/EducationSection';
import SkillsSection from './resume-sections/SkillsSection';
import ProjectsSection from './resume-sections/ProjectsSection';
import CertificationsSection from './resume-sections/CertificationsSection';
import LanguagesSection from './resume-sections/LanguagesSection';
import HobbiesSection from './resume-sections/HobbiesSection';
import ReferencesSection from './resume-sections/ReferencesSection';
import InternshipsSection from './resume-sections/InternshipsSection';
import CustomSection from './resume-sections/CustomSection';
import ResumeTemplateBrowser from './ResumeTemplateBrowser';
import ResumePreview from './ResumePreview';
import { exportResumeWithProgress } from "@/lib/export-service";
import { ExportResult } from "@/types/export";
import ExportProgressIndicator from "./ExportProgressIndicator";
import { ResumeData, ResumeTemplate, DatabaseResumeTemplate, DatabaseResumeData, mapResumeToDatabase, mapDatabaseToResumeData } from "@/types/resume";
import { cn } from "@/lib/utils";
import { Json } from '@/types/supabase';

interface ResumeBuilderProps {
  initialData?: ResumeData;
  resumeId?: string;
}

// Helper function to map database template to app template
function mapDatabaseToResumeTemplate(template: DatabaseResumeTemplate): ResumeTemplate {
  return {
    id: template.id,
    name: template.name,
    description: template.description || '',
    thumbnail: template.thumbnail || '',
    htmlContent: template.html_content || '',
    cssContent: template.css_content || '',
    category: template.category || 'Professional',
    isPublic: template.is_public || false,
    created_at: template.created_at || new Date().toISOString(),
    updated_at: template.updated_at || new Date().toISOString()
  };
}

const ResumeBuilder: React.FC<ResumeBuilderProps> = ({ initialData, resumeId: initialResumeId }) => {
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [activeTab, setActiveTab] = useState("personal-info");
  const [activeExperience, setActiveExperience] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'docx' | 'txt' | null>(null);
  const [isLoading, setIsLoading] = useState(true); // ResumeBuilder's own loading state
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
  const [zoomLevel, setZoomLevel] = useState(65);
  const [expandedPreview, setExpandedPreview] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState('');
  const [showExportProgress, setShowExportProgress] = useState(false);
  const [exportResult, setExportResult] = useState<ExportResult | null>(null);

  const { user, loading: authLoading } = useAuth();
  
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const supabase = createBrowserClient();
  const importFileRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const resumeId = initialResumeId || (params.id as string);

  useEffect(() => {
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth < 1024);
    };
    checkMobileView();
    window.addEventListener('resize', checkMobileView);
    return () => window.removeEventListener('resize', checkMobileView);
  }, []);

  useEffect(() => {
    const initializeResume = async () => {
      if (authLoading) {
        console.log("ResumeBuilder: Auth state is loading, waiting for it to resolve...");
        setIsLoading(true); 
        return;
      }
      
      console.log("ResumeBuilder: Auth state resolved. User object:", JSON.stringify(user, null, 2));

      try {
        setIsLoading(true); 
        setError(null);

        let currentResumeData: ResumeData | null = null;
        let fetchedTemplateId: string | null = null;

        if (initialData) {
          console.log("ResumeBuilder: Using initialData provided via props.");
          currentResumeData = initialData;
          fetchedTemplateId = initialData.templateId || null;
        } else if (resumeId) {
          console.log(`ResumeBuilder: Fetching existing resume with ID: ${resumeId}`);
          if (!user) { 
            console.error("ResumeBuilder: User is null after auth loading. Cannot fetch existing resume.");
            setError('Login required to load resume.');
            setIsLoading(false);
            return;
          }
          const { data, error: resumeError } = await supabase
            .from('resumes')
            .select('*')
            .eq('id', resumeId)
            .eq('user_id', user.id) 
            .single();

          if (resumeError) {
            if (resumeError.code === 'PGRST116') throw new Error('Resume not found or access denied.');
            throw resumeError;
          }
          currentResumeData = mapDatabaseToResumeData(data as unknown as DatabaseResumeData);
          fetchedTemplateId = currentResumeData?.templateId || null;
          console.log("ResumeBuilder: Loaded and mapped resume data:", currentResumeData);
        } else {
          console.log("ResumeBuilder: Creating new empty resume structure.");
          if (!user?.id) { 
            console.error("ResumeBuilder: Cannot create new resume: User ID is missing even after auth check. User object:", JSON.stringify(user, null, 2));
            setError("User session not found or ID is missing. Cannot create new resume.");
            setIsLoading(false);
            return; 
          }
          currentResumeData = {
            id: crypto.randomUUID(),
            userId: user.id, 
            title: 'Untitled Resume',
            personalInfo: { firstName: '', lastName: '', title: '', summary: '', contact: { email: '', phone: '', location: '', linkedIn: '', website: '' } },
            workExperience: [], education: [], skills: [], projects: [], languages: [],
            certifications: [], interests: [], internships: [], references: [],
            referenceText: "References available upon request", customSections: [],
            templateId: '', 
            isPublic: false,
            created_at: new Date().toISOString(), updated_at: new Date().toISOString()
          };
          console.log("ResumeBuilder: New resume structure created with userId:", user.id);
        }

        setResumeData(currentResumeData);

        console.log("ResumeBuilder: Fetching resume templates...");
        const { data: templatesData, error: templatesError } = await supabase
          .from('resume_templates')
          .select('*')
          .order('name');

        if (templatesError) throw templatesError;

        const templates = (templatesData || []).map(template =>
          mapDatabaseToResumeTemplate(template as unknown as DatabaseResumeTemplate)
        );
        setAvailableTemplates(templates);
        console.log(`ResumeBuilder: Loaded ${templates.length} resume templates.`);

        if (templates.length > 0) {
          const targetTemplateId = fetchedTemplateId || (currentResumeData?.templateId === '' ? null : currentResumeData?.templateId);
          const foundTemplate = templates.find(t => t.id === targetTemplateId);

          if (foundTemplate) {
            setSelectedTemplate(foundTemplate);
            console.log(`ResumeBuilder: Set selected template: ${foundTemplate.name}`);
            if (currentResumeData && currentResumeData.templateId !== foundTemplate.id) {
                 setResumeData(prev => prev ? { ...prev, templateId: foundTemplate.id } : null);
            }
          } else {
            setSelectedTemplate(templates[0]); 
            console.warn(`ResumeBuilder: Template ID '${targetTemplateId}' not found or invalid. Using default: ${templates[0].name}`);
            if (currentResumeData) { 
              setResumeData(prev => prev ? { ...prev, templateId: templates[0].id } : null);
            }
          }
        } else {
          console.warn("ResumeBuilder: No resume templates found in the database.");
          setSelectedTemplate(null);
          if (currentResumeData && currentResumeData.templateId) { 
             setResumeData(prev => prev ? { ...prev, templateId: '' } : null);
          }
        }
      } catch (err: any) {
        console.error('ResumeBuilder: Error initializing resume:', err);
        setError(err.message || 'Failed to initialize resume. Please try again.');
        toast({ title: "Error", description: "Failed to load resume data.", variant: "destructive" });
      } finally {
        setIsLoading(false); 
      }
    };

    initializeResume();
  }, [initialData, resumeId, user, authLoading, supabase, toast]); 

  const updateSection = <K extends keyof ResumeData>(
    section: K,
    data: ResumeData[K]
  ) => {
    if (!resumeData) return;
    console.log(`Updating section: ${section}`);
    setResumeData(prevData => {
      if (!prevData) return null;
      return {
        ...prevData,
        [section]: data,
        updated_at: new Date().toISOString()
      };
    });
  };

  const isValidUUID = (str: string | null | undefined): boolean => {
    if (!str) return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };

  const handleSaveClick = () => {
    if (!resumeData) return;
    if (!selectedTemplate || !selectedTemplate.id) {
      console.log("Save clicked but no template selected or template ID missing. Opening modal.");
      setSaveInitiated(true);
      setShowTemplateModal(true);
    } else {
      saveResume();
    }
  };

  const saveResume = async () => {
    if (!user || !user.id) {
      toast({ title: "Login Required", description: "Please login to save your resume.", variant: "destructive" });
      setError("User not authenticated.");
      setIsSaving(false); 
      return;
    }
    if (!resumeData) {
      toast({ title: "Error", description: "No resume data to save.", variant: "destructive" });
      setIsSaving(false);
      return;
    }
    if (!selectedTemplate || !selectedTemplate.id) {
      toast({ title: "Template Required", description: "Cannot save without a selected template.", variant: "destructive" });
      setSaveInitiated(true);
      setShowTemplateModal(true);
      setIsSaving(false);
      return;
    }

    const isUpdating = !!initialResumeId; 
    const currentResumeId = resumeData.id;

    try {
      setIsSaving(true);
      setError(null);

      const dataToSend: ResumeData = {
        ...resumeData,
        userId: user.id, 
        templateId: selectedTemplate.id, 
        updated_at: new Date().toISOString(),
        title: resumeData.title || 'Untitled Resume',
        personalInfo: resumeData.personalInfo || { firstName: '', lastName: '', title: '', summary: '', image: '', contact: { email: ''} }, 
        workExperience: resumeData.workExperience || [],
        education: resumeData.education || [],
        skills: resumeData.skills || [],
        projects: resumeData.projects || undefined,
        languages: resumeData.languages || undefined,
        certifications: resumeData.certifications || undefined,
        interests: resumeData.interests || undefined,
        internships: resumeData.internships || undefined,
        references: resumeData.references || undefined,
        referenceText: resumeData.referenceText || undefined,
        customSections: resumeData.customSections || undefined,
        is_imported: resumeData.is_imported ?? undefined,
        sourceCV: resumeData.sourceCV || undefined,
      };

      console.log(`Attempting to ${isUpdating ? 'update' : 'create'} resume via API. ID: ${currentResumeId}`);
      console.log('Data being sent to API (camelCase):', dataToSend);

      const apiUrl = isUpdating ? `/api/resumes/${currentResumeId}` : '/api/resumes';
      const apiMethod = isUpdating ? 'PUT' : 'POST';

      const requestBody = isUpdating
        ? JSON.stringify(dataToSend) 
        : JSON.stringify({ resumeData: dataToSend }); 

      const response = await fetch(apiUrl, {
        method: apiMethod,
        headers: { 'Content-Type': 'application/json' },
        body: requestBody,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Failed to ${isUpdating ? 'update' : 'create'} resume (Status: ${response.status})`);
      }

      console.log(`API ${isUpdating ? 'update' : 'create'} successful. Response:`, result);

      setShowImportAlert(false);
      setImportedSections([]);
      setSaveInitiated(false);
      setRecentlySaved(true);
      setTimeout(() => setRecentlySaved(false), 3000);

      toast({
        title: `Resume ${isUpdating ? 'Updated' : 'Created'}`,
        description: "Your resume has been saved successfully.",
      });

      if (result) {
        const updatedDataFromDb = mapDatabaseToResumeData(result as unknown as DatabaseResumeData);
        console.log("Updating local state with data from API:", updatedDataFromDb);
        setResumeData(updatedDataFromDb); 

        const newIdFromServer = result.id;
        if (!isUpdating && newIdFromServer && newIdFromServer !== currentResumeId) {
          console.log(`New resume created with ID ${newIdFromServer}, redirecting...`);
          router.replace(`/dashboard/resumes/${newIdFromServer}`);
        } else if (isUpdating && newIdFromServer && newIdFromServer !== currentResumeId) {
          console.warn(`Resume ID changed on update from ${currentResumeId} to ${newIdFromServer}. Redirecting...`);
          router.replace(`/dashboard/resumes/${newIdFromServer}`);
        }
      }
      setShowExportOptions(true);
    } catch (err: any) {
      console.error(`Error ${isUpdating ? 'updating' : 'creating'} resume via API:`, err);
      setError(err.message || `Failed to ${isUpdating ? 'update' : 'create'} resume. Please try again.`);
      toast({ title: "Save Error", description: `Failed to ${isUpdating ? 'update' : 'create'} resume. ${err.message}`, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveWithTemplate = (template: ResumeTemplate) => {
    setSelectedTemplate(template);
    setResumeData(prev => prev ? { ...prev, templateId: template.id } : null);
    setShowTemplateModal(false);

    if (saveInitiated) {
      console.log("Template selected after save initiated, proceeding to save...");
      setTimeout(() => saveResume(), 50); 
    } else {
      toast({ title: "Template Selected", description: `Template "${template.name}" applied.` });
    }
  };

  const exportResume = async (format: 'pdf' | 'docx' | 'txt') => {
    if (!resumeData) { toast({ title: "Error", description: "No resume data available.", variant: "destructive" }); return; }
    if (!selectedTemplate) { toast({ title: "Template Required", description: "Please select a template." }); setShowTemplateModal(true); return; }

    try {
      setExportFormat(format); setIsExporting(true); setExportProgress(0);
      setExportStatus('Preparing export...'); setShowExportProgress(true); setExportResult(null);
      toast({ title: `Preparing ${format.toUpperCase()}`, description: "Generating document..." });

      const result = await exportResumeWithProgress(
        resumeData, selectedTemplate, format,
        (progress, status) => { setExportProgress(progress); setExportStatus(status); },
        `${resumeData.personalInfo?.firstName || 'Resume'}-${resumeData.personalInfo?.lastName || ''}-Resume`.replace(/ /g, '_'),
        { retry: { attempts: 2, delay: 1000 }, timeout: 60000, quality: 'standard' }
      );

      setExportResult(result);
      if (!result.success) throw new Error(result.error || `Failed to export as ${format.toUpperCase()}`);

    } catch (error: any) {
      console.error('Error exporting resume:', error);
      setExportResult({ success: false, filename: `resume.${format}`, format: format, error: error.message || "Failed to export." });
      toast({ title: "Export Failed", description: error.message || "Error exporting resume.", variant: "destructive" });
    } finally {
      setIsExporting(false); setShowExportOptions(false);
    }
  };

  const handleRetryExport = () => { if (exportFormat) exportResume(exportFormat); };
  const handleDismissExportProgress = () => { setShowExportProgress(false); setExportResult(null); setExportProgress(0); setExportStatus(''); };
  const handleExportOption = (format: 'pdf' | 'docx' | 'txt') => { setShowExportOptions(false); exportResume(format); };

  const importResume = async (file: File) => {
    try {
      setIsImporting(true); setError(null); setImportedSections([]);
      const formData = new FormData(); formData.append('file', file);

      const response = await fetch('/api/resumes/parser', { method: 'POST', body: formData });
      if (!response.ok) { const e = await response.json(); throw new Error(e.error || 'Import failed'); }
      const parsedData = await response.json();

      const importedSectionsArray: string[] = [];
      const checkImport = (key: keyof ResumeData, name: string) => { if (parsedData[key] && ((Array.isArray(parsedData[key]) && parsedData[key].length > 0) || (typeof parsedData[key] === 'object' && Object.keys(parsedData[key]).length > 0))) { importedSectionsArray.push(name); } };

      setResumeData(prev => {
        if (!prev) { 
          console.warn("ResumeBuilder: prev state was null during import. Initializing with parsedData.");
          return {
              id: crypto.randomUUID(), 
              userId: user?.id || '', 
              title: parsedData.title || 'Imported Resume',
              personalInfo: parsedData.personalInfo || { firstName: '', lastName: '', title: '', summary: '', image: '', contact: { email: ''} },
              workExperience: parsedData.workExperience || [],
              education: parsedData.education || [],
              skills: parsedData.skills || [],
              projects: parsedData.projects || [],
              languages: parsedData.languages || [],
              certifications: parsedData.certifications || [],
              interests: parsedData.interests || [],
              internships: parsedData.internships || [],
              references: parsedData.references || [],
              referenceText: parsedData.referenceText || "References available upon request",
              customSections: parsedData.customSections?.map((s: any) => ({...s, city: s.city || '', startDate: s.startDate || '', endDate: s.endDate || ''})) || [],
              templateId: selectedTemplate?.id || '', // FIX: Use selectedTemplate?.id or default to '' if !prev
              isPublic: false,
              updated_at: new Date().toISOString(),
              created_at: new Date().toISOString(), 
              is_imported: true, 
          };
        }
        checkImport('personalInfo', 'personalInfo'); checkImport('workExperience', 'workExperience'); checkImport('education', 'education');
        checkImport('skills', 'skills'); checkImport('projects', 'projects'); checkImport('languages', 'languages');
        checkImport('certifications', 'certifications'); checkImport('interests', 'interests'); checkImport('internships', 'internships');
        checkImport('references', 'references'); checkImport('customSections', 'customSections');
        const updatedCustomSections = parsedData.customSections?.map((s: any) => ({ ...s, city: s.city || '', startDate: s.startDate || '', endDate: s.endDate || '' })) || prev.customSections;
        return { ...prev, title: parsedData.title || prev.title, personalInfo: parsedData.personalInfo || prev.personalInfo, workExperience: parsedData.workExperience || prev.workExperience, education: parsedData.education || prev.education, skills: parsedData.skills || prev.skills, projects: parsedData.projects || prev.projects, languages: parsedData.languages || prev.languages, certifications: parsedData.certifications || prev.certifications, interests: parsedData.interests || prev.interests, internships: parsedData.internships || prev.internships, references: parsedData.references || prev.references, referenceText: parsedData.referenceText || prev.referenceText, customSections: updatedCustomSections, updated_at: new Date().toISOString(), is_imported: true };
      });
      setImportedSections(importedSectionsArray); setShowImportAlert(true);
      if (importedSectionsArray.length > 0) {
        const firstSection = importedSectionsArray[0];
        if (firstSection === 'personalInfo') setActiveTab('personal-info');
        else if (firstSection === 'workExperience') setActiveTab('work-experience');
        else if (firstSection === 'education') setActiveTab('education');
        else if (firstSection === 'skills') setActiveTab('skills');
        else setActiveTab('personal-info');
      }
      toast({ title: "Import Successful", description: "Review imported sections and save your changes." });
    } catch (err: any) { console.error('Error importing resume:', err); toast({ title: "Import Failed", description: err.message || "Failed to import.", variant: "destructive" }); } finally { setIsImporting(false); }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) importResume(files[0]);
    e.target.value = '';
  };

  const saveImportedResume = async () => handleSaveClick();
  const previewImportedResume = () => { if (!selectedTemplate) setShowTemplateModal(true); else window.open(`/dashboard/resumes/${resumeData?.id}/preview`, '_blank'); };
  const handleImportGuideClose = () => setShowImportAlert(false);
  const toggleMobilePreview = () => { if (!selectedTemplate && !showMobilePreview) setShowTemplateModal(true); else setShowMobilePreview(!showMobilePreview); };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => { if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setShowExportOptions(false); };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleExpandedPreview = () => { if (!selectedTemplate) setShowTemplateModal(true); else setExpandedPreview(!expandedPreview); };
  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 10, 150));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 10, 40));
  const handleZoomReset = () => setZoomLevel(65);

  const MobileActionButton = () => {
    if (!isMobileView) return null;
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <DropdownMenu open={showMobileActions} onOpenChange={setShowMobileActions}>
          <DropdownMenuTrigger asChild>
            <Button className="h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-teal-500 to-gray-700 text-white hover:from-teal-600 hover:to-gray-800 transition-all" aria-label="Resume Actions">
              <FileText className="h-6 w-6" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 p-2 bg-white rounded-md shadow-xl border border-teal-100 mb-2">
            <DropdownMenuItem onClick={toggleMobilePreview} className="flex items-center p-3 cursor-pointer hover:bg-teal-50 rounded-md"> <Eye className="h-5 w-5 mr-3 text-teal-600" /> <span>Preview</span> </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowTemplateModal(true)} className="flex items-center p-3 cursor-pointer hover:bg-teal-50 rounded-md"> <Palette className="h-5 w-5 mr-3 text-teal-600" /> <span>Template</span> </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSaveClick} disabled={isSaving || !resumeData?.personalInfo?.firstName} className="flex items-center p-3 cursor-pointer hover:bg-teal-50 rounded-md"> <Save className="h-5 w-5 mr-3 text-teal-600" /> <span>Save</span> </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExportOption('pdf')} disabled={isExporting} className="flex items-center p-3 cursor-pointer hover:bg-teal-50 rounded-md"> <Download className="h-5 w-5 mr-3 text-teal-600" /> <span>Export PDF</span> </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExportOption('docx')} disabled={isExporting} className="flex items-center p-3 cursor-pointer hover:bg-teal-50 rounded-md"> <Download className="h-5 w-5 mr-3 text-teal-600" /> <span>Export DOCX</span> </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };

  if (isLoading) { return ( <div className="min-h-[80vh] flex items-center justify-center w-full"><div className="text-center"><LoadingSpinner className="h-8 w-8 mb-4 text-teal-600" /><p className="text-muted-foreground">Loading Resume Editor...</p></div></div> ); }
  if (error) { return ( <div className="w-full max-w-4xl mx-auto py-8 px-4"><Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Error Loading Resume</AlertTitle><AlertDescription>{error}</AlertDescription></Alert><div className="flex justify-center mt-6"><Button asChild variant="outline"><Link href="/dashboard/resumes"><ArrowLeft className="h-4 w-4 mr-2" /> Back to Resumes</Link></Button></div></div> ); }
  if (!resumeData) { return ( <div className="w-full max-w-4xl mx-auto py-8 px-4"><Alert><AlertDescription>Resume data could not be loaded or created.</AlertDescription></Alert><div className="flex justify-center mt-6"><Button asChild variant="outline"><Link href="/dashboard/resumes"><ArrowLeft className="h-4 w-4 mr-2" /> Back to Resumes</Link></Button></div></div> ); }

  return (
    <div className="w-full m-0 p-0">
      <TemplateSelectionModal
        resume={resumeData}
        templates={availableTemplates}
        selectedTemplate={selectedTemplate}
        open={showTemplateModal}
        onOpenChange={setShowTemplateModal}
        onSelectTemplate={handleSaveWithTemplate}
        onSaveWithTemplate={handleSaveWithTemplate}
        isPreviewMode={!saveInitiated}
      />
      <div className="bg-white border-b sticky top-0 z-40 w-full">
        <div className="container mx-auto py-3 px-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild className="-ml-2 h-8 text-gray-600 hover:bg-gray-100">
                <Link href="/dashboard/resumes">
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back
                </Link>
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <h1 className="text-lg font-semibold text-gray-800 truncate pr-2">
                {resumeData.title || 'Untitled Resume'}
              </h1>
              {resumeId && (
                <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/resumes/${resumeId}/ats-scanner`)} className="h-7 px-2 text-xs bg-gradient-to-r from-violet-50 to-purple-50 text-purple-700 border-purple-200 hover:border-purple-400 hover:bg-white">
                  <ScanSearch className="h-3.5 w-3.5 mr-1" /> ATS Scan
                </Button>
              )}
            </div>
            {!isMobileView && (
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowTemplateModal(true)} className="h-9 bg-white border-gray-300 text-gray-700 hover:bg-gray-50">
                  <Palette className="h-4 w-4 mr-2" /> {selectedTemplate ? selectedTemplate.name : "Choose Template"}
                </Button>
                <div ref={dropdownRef} className="relative">
                  <div className="flex">
                    <Button onClick={handleSaveClick} disabled={isSaving || !resumeData?.personalInfo?.firstName} className="rounded-r-none border-r-0 bg-teal-600 hover:bg-teal-700 text-white h-9 px-4">
                      {isSaving ? <LoadingSpinner className="mr-2" /> : <Save className="h-4 w-4 mr-2" />} {recentlySaved ? "Saved!" : (isSaving ? "Saving..." : "Save")}
                    </Button>
                    <DropdownMenu open={showExportOptions} onOpenChange={setShowExportOptions}>
                      <DropdownMenuTrigger asChild>
                        <Button className="rounded-l-none bg-teal-600 hover:bg-teal-700 text-white px-2 h-9" disabled={!resumeData?.personalInfo?.firstName || !selectedTemplate} aria-label="Export options">
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => handleExportOption('pdf')} disabled={isExporting} className="cursor-pointer"> {isExporting && exportFormat === 'pdf' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />} Export as PDF </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExportOption('docx')} disabled={isExporting} className="cursor-pointer"> {isExporting && exportFormat === 'docx' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />} Export as DOCX </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExportOption('txt')} disabled={isExporting} className="cursor-pointer"> {isExporting && exportFormat === 'txt' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />} Export as TXT </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showImportAlert && importedSections.length > 0 && (
        <div className="container mx-auto px-4 mt-4">
          <Alert className="bg-teal-50 border-teal-200 text-teal-800">
            <CheckCircle2 className="h-5 w-5 text-teal-500" />
            <AlertTitle className="text-teal-800 font-medium">Resume Imported Successfully!</AlertTitle>
            <AlertDescription className="text-teal-700">
              <p className="mt-1 text-sm">Review imported sections and save your changes.</p>
              <div className="mt-3">
                <Button onClick={() => setShowImportAlert(false)} variant="ghost" size="sm" className="text-teal-700 hover:bg-teal-100 h-7 px-2">
                  <X className="h-4 w-4 mr-1" /> Dismiss
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {showExportProgress && (
        <div className="container mx-auto px-4 mt-4 sticky top-[70px] z-30">
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

      <div className={`container mx-auto px-4 py-6 grid grid-cols-1 ${!isMobileView ? (expandedPreview ? 'lg:grid-cols-5' : 'lg:grid-cols-12') : ''} gap-6`}>
        <div className={` ${!isMobileView ? (expandedPreview ? 'lg:col-span-2 lg:order-2' : 'lg:col-span-5 lg:order-1') : 'col-span-1'} ${isMobileView && expandedPreview ? 'hidden' : ''}`}>
          <Card className="border shadow-sm">
            <CardHeader className="bg-gray-50 border-b p-4">
              <CardTitle className="text-base font-semibold text-gray-700">Resume Content</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Accordion type="single" collapsible value={activeTab} onValueChange={setActiveTab} className="w-full">
                <AccordionItem value="personal-info" className="border-b">
                  <AccordionTrigger className="px-4 py-3 hover:bg-gray-50 hover:no-underline text-sm font-medium">Personal Info</AccordionTrigger>
                  <AccordionContent className="px-4 pt-2 pb-4 bg-white">
                    <PersonalInfoSection data={resumeData.personalInfo} onChange={(data) => updateSection('personalInfo', data)} />
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="work-experience" className="border-b">
                  <AccordionTrigger className="px-4 py-3 hover:bg-gray-50 hover:no-underline text-sm font-medium">Work Experience</AccordionTrigger>
                  <AccordionContent className="px-4 pt-2 pb-4 bg-white">
                    <WorkExperienceSection data={resumeData.workExperience || []} onChange={(data) => updateSection('workExperience', data)} />
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="education" className="border-b">
                  <AccordionTrigger className="px-4 py-3 hover:bg-gray-50 hover:no-underline text-sm font-medium">Education</AccordionTrigger>
                  <AccordionContent className="px-4 pt-2 pb-4 bg-white">
                    <EducationSection data={resumeData.education || []} onChange={(data) => updateSection('education', data)} />
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="skills" className="border-b">
                  <AccordionTrigger className="px-4 py-3 hover:bg-gray-50 hover:no-underline text-sm font-medium">Skills</AccordionTrigger>
                  <AccordionContent className="px-4 pt-2 pb-4 bg-white">
                    <SkillsSection data={resumeData.skills || []} onChange={(data) => updateSection('skills', data)} displayStyle='stars' />
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="projects" className="border-b">
                  <AccordionTrigger className="px-4 py-3 hover:bg-gray-50 hover:no-underline text-sm font-medium">Projects</AccordionTrigger>
                  <AccordionContent className="px-4 pt-2 pb-4 bg-white">
                    <ProjectsSection data={resumeData.projects || []} onChange={(data) => updateSection('projects', data)} />
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="certifications" className="border-b">
                  <AccordionTrigger className="px-4 py-3 hover:bg-gray-50 hover:no-underline text-sm font-medium">Certifications</AccordionTrigger>
                  <AccordionContent className="px-4 pt-2 pb-4 bg-white">
                    <CertificationsSection data={resumeData.certifications || []} onChange={(data) => updateSection('certifications', data)} />
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="languages" className="border-b">
                  <AccordionTrigger className="px-4 py-3 hover:bg-gray-50 hover:no-underline text-sm font-medium">Languages</AccordionTrigger>
                  <AccordionContent className="px-4 pt-2 pb-4 bg-white">
                    <LanguagesSection data={resumeData.languages || []} onChange={(data) => updateSection('languages', data)} />
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="hobbies" className="border-b">
                  <AccordionTrigger className="px-4 py-3 hover:bg-gray-50 hover:no-underline text-sm font-medium">Interests / Hobbies</AccordionTrigger>
                  <AccordionContent className="px-4 pt-2 pb-4 bg-white">
                    <HobbiesSection data={resumeData.interests || []} onChange={(data) => updateSection('interests', data)} useStructured={false} />
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="internships" className="border-b">
                  <AccordionTrigger className="px-4 py-3 hover:bg-gray-50 hover:no-underline text-sm font-medium">Internships</AccordionTrigger>
                  <AccordionContent className="px-4 pt-2 pb-4 bg-white">
                    <InternshipsSection data={(resumeData.internships || []).map(i => ({ ...i, isOngoing: i.isOngoing ?? false }))} onChange={(data) => updateSection('internships', data)} />
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="references" className="border-b">
                  <AccordionTrigger className="px-4 py-3 hover:bg-gray-50 hover:no-underline text-sm font-medium">References</AccordionTrigger>
                  <AccordionContent className="px-4 pt-2 pb-4 bg-white">
                    <ReferencesSection
                      data={resumeData.references || []}
                      onChange={(data) => updateSection('references', data)}
                      generalStatement={resumeData.referenceText || "References available upon request"}
                      onStatementChange={(statement) => updateSection('referenceText', statement)}
                      enableStatement={true}
                    />
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="custom" className="border-b-0">
                  <AccordionTrigger className="px-4 py-3 hover:bg-gray-50 hover:no-underline text-sm font-medium">Custom Sections</AccordionTrigger>
                  <AccordionContent className="px-4 pt-2 pb-4 bg-white">
                    <CustomSection data={resumeData.customSections || []} onChange={(data) => updateSection('customSections', data)} />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </div>

        {!isMobileView && (
          <div className={`${expandedPreview ? 'lg:col-span-3 lg:order-1' : 'lg:col-span-7 lg:order-2'}`}>
            <div className="h-full">
              <div className="bg-gray-100 border border-gray-200 rounded-t-md flex flex-row justify-between items-center py-2 px-4">
                <div className="text-gray-800 text-base font-medium">Resume Preview</div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={handleZoomOut} disabled={zoomLevel <= 40} className="bg-white text-gray-700 border-gray-300 h-8 w-8 p-0"> <ZoomOut className="h-3 w-3" /> </Button>
                  <Button variant="outline" size="sm" onClick={handleZoomReset} className="bg-white text-gray-700 border-gray-300 px-1 h-8"> <span className="text-xs">{zoomLevel}%</span> </Button>
                  <Button variant="outline" size="sm" onClick={handleZoomIn} disabled={zoomLevel >= 150} className="bg-white text-gray-700 border-gray-300 h-8 w-8 p-0"> <ZoomIn className="h-3 w-3" /> </Button>
                  <Button variant="outline" size="sm" onClick={() => { if (resumeData && selectedTemplate) { window.open(`/dashboard/resumes/${resumeData.id}/preview`, '_blank'); } }} className="bg-white text-gray-700 border-gray-300 h-8 w-8 p-0"> <Eye className="h-3 w-3" /> </Button>
                </div>
              </div>
              <div className="bg-gray-100 flex justify-center overflow-auto border-l border-r border-gray-200" style={{ height: expandedPreview ? 'calc(100vh - 160px)' : '540px' }}>
                {!selectedTemplate ? (
                  <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-gray-200 rounded-md w-full m-4 bg-white">
                    <div className="text-center space-y-2 p-4">
                      <Palette className="h-8 w-8 text-teal-300 mx-auto" />
                      <h3 className="font-medium text-gray-700 text-sm">Choose a Template</h3>
                      <Button onClick={() => setShowTemplateModal(true)} size="sm" className="mx-auto"> Choose Template </Button>
                    </div>
                  </div>
                ) : (
                  <div className="w-full py-3 flex justify-center">
                    <div className="transition-all relative">
                      <ResumePreview
                        resume={resumeData}
                        template={selectedTemplate}
                        height="510px"
                        defaultZoom={zoomLevel}
                        removeCard={true}
                      />
                      <div className="absolute bottom-2 right-2">
                        <Button size="sm" onClick={() => { if (resumeData && selectedTemplate) { window.open(`/dashboard/resumes/${resumeData.id}/preview`, '_blank'); } }} variant="outline" className="bg-white text-gray-700 border-gray-300 h-7 shadow-sm" >
                          <Maximize className="h-3 w-3 mr-1" /> <span className="text-xs">Expand</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              {selectedTemplate && (
                <div className="border-t border-l border-r border-b border-gray-200 rounded-b-md py-2 px-4 bg-gray-50 flex justify-between">
                  <Button variant="outline" size="sm" className="text-teal-700 border-teal-200 hover:bg-teal-50 h-8" onClick={toggleExpandedPreview} >
                    {expandedPreview ? ( <><LayoutList className="h-3 w-3 mr-1" /> <span className="text-xs">Edit Mode</span></> ) : ( <><Eye className="h-3 w-3 mr-1" /> <span className="text-xs">Focus on Preview</span></> )}
                  </Button>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => window.open(`/dashboard/resumes/${resumeData.id}/preview`, '_blank')} variant="outline" className="text-teal-700 border-teal-200 hover:bg-teal-50 h-8" >
                      <Maximize className="h-3 w-3 mr-1" /> <span className="text-xs">Open Full View</span>
                    </Button>
                    <Button size="sm" onClick={() => handleExportOption('pdf')} className="bg-teal-600 hover:bg-teal-700 text-white h-8" >
                      <Download className="h-3 w-3 mr-1" /> <span className="text-xs">Download PDF</span>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <MobileActionButton />
      <input ref={importFileRef} type="file" accept=".pdf,.docx,.txt,.xlsx,.xls" className="hidden" onChange={handleFileSelect} />
    </div>
  );
};

export default ResumeBuilder;
