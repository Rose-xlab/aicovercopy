"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/hooks/useAuth";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { createBrowserClient } from "@/lib/supabase";
import { ImportGuide } from '@/components/ImportGuide';
import { useCVResumeIntegration } from '@/lib/hooks/useCVResumeIntegration';
import { uploadFile } from '@/lib/file-upload';
import { 
  FileText, 
  Plus, 
  MoreVertical, 
  Download, 
  Copy, 
  Edit, 
  Trash2, 
  Clock, 
  Search, 
  Filter, 
  Upload,
  FileBadge,
  Eye,
  CheckCircle2,
  AlertTriangle,
  FileSearch,
  X,
  FileUp,
  Target
} from 'lucide-react';
import Link from 'next/link';
import { formatDistance } from 'date-fns';
import { ensureDualFormatFields } from '@/lib/resume-mappers'; // Import the mapper function
import type { CvFile } from '@/lib/cv-helpers'; // Import the CvFile type
import { Json } from '@/types/supabase'; // Import Json type from Supabase types

// Define a type for our Resume data structure - using Supabase compatible types
interface Resume {
  id: string;
  user_id: string;
  title: string;
  personal_info: any;
  work_experience: any[] | Json;
  education: any[] | Json;
  skills: any[] | Json;
  certifications?: any[] | Json | null;
  custom_sections?: any[] | Json | null;
  interests?: string[] | null;
  internships?: any[] | Json | null;
  is_imported?: boolean | null;
  is_public?: boolean | null;
  languages?: any[] | Json | null;
  projects?: any[] | Json | null;
  reference_text?: string | null;
  references?: any[] | Json | null;
  template_id?: string | null;
  created_at: string | null;
  updated_at: string | null;
  source_cv?: string | null;
  // Add camelCase versions for compatibility
  sourceCV?: string | null;
  personalInfo?: any;
  workExperience?: any[];
}

export default function ResumeDashboardPage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [importLoading, setImportLoading] = useState<boolean>(false);
  const [showImportGuide, setShowImportGuide] = useState<boolean>(false);
  const [importedResumeId, setImportedResumeId] = useState<string | null>(null);
  const [importSourceCV, setImportSourceCV] = useState<string | null>(null);
  
  const importFileRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createBrowserClient();
  const { getLinkedCV } = useCVResumeIntegration();
  const [fileToSave, setFileToSave] = useState<File | null>(null);
  
  // Load resumes from database
  useEffect(() => {
    const fetchResumes = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        if (!user) {
          setResumes([]);
          return;
        }
        
        const { data, error } = await supabase
          .from('resumes')
          .select('*')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false });
        
        if (error) throw error;
        
        if (data) {
          // Process the data to ensure it has the right format
          const processedResumes: Resume[] = data.map(resume => ({
            ...resume,
            sourceCV: resume.source_cv || null,
            // Ensure we have arrays for UI component expectations
            workExperience: Array.isArray(resume.work_experience) ? resume.work_experience : [],
          }));
          
          setResumes(processedResumes);
        }
      } catch (err: any) {
        console.error('Error fetching resumes:', err);
        setError(err.message || 'Failed to load resumes');
        toast({
          title: "Error",
          description: "Failed to load your resumes. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user) {
      fetchResumes();
    } else {
      setIsLoading(false);
    }
  }, [user, supabase, toast]);
  
  // Delete a resume
  const handleDelete = async (id: string) => {
    try {
      setError(null);
      
      const { error } = await supabase
        .from('resumes')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Update the local state
      setResumes(resumes.filter(resume => resume.id !== id));
      
      toast({
        title: "Resume Deleted",
        description: "Your resume has been deleted successfully.",
      });
    } catch (err: any) {
      console.error('Error deleting resume:', err);
      toast({
        title: "Error",
        description: err.message || "Failed to delete resume. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Duplicate a resume
  const handleDuplicate = async (id: string) => {
    try {
      setError(null);
      
      // Find the resume to duplicate
      const resume = resumes.find(r => r.id === id);
      if (!resume) throw new Error('Resume not found');
      
      // Create a new ID and update timestamps
      const newResume: Resume = {
        ...resume,
        id: crypto.randomUUID(),
        title: `${resume.title} (Copy)`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      // Save to database
      const { data, error } = await supabase
        .from('resumes')
        .insert(newResume)
        .select();
      
      if (error) throw error;
      
      // Update the local state
      if (data && data[0]) {
        setResumes([data[0] as Resume, ...resumes]);
      }
      
      toast({
        title: "Resume Duplicated",
        description: "A copy of your resume has been created.",
      });
    } catch (err: any) {
      console.error('Error duplicating resume:', err);
      toast({
        title: "Error",
        description: err.message || "Failed to duplicate resume. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Get default template ID
  const getDefaultTemplateId = async (): Promise<string | null> => {
    try {
      const { data } = await supabase
        .from('resume_templates')
        .select('id')
        .eq('is_public', true)
        .limit(1);
      
      return data && data[0] && data[0].id ? data[0].id : null;
    } catch (error) {
      console.error('Error getting default template:', error);
      return null;
    }
  };

  useEffect(() => {

    const saveFileToResume = async () => {
      // Parse the resume
      const formData = new FormData();
      formData.append('file', fileTosave);
      
      // If we created a CV record, add it to the form data
      if (importSourceCV) {
        formData.append('sourceType', 'resume_import');
        formData.append('cvId', importSourceCV);
      }
      
      const response = await fetch('/api/resumes/parser', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Import failed');
      }
      
      const parsedData = await response.json();
      console.log("Received parsed data from parser API:", parsedData);
      
      // Get default template ID - ensure it's null if empty
      const defaultTemplateId = await getDefaultTemplateId();
      
      // Create a new resume with the parsed data, ensuring field names match expectations
      const newResume = {
        id: crypto.randomUUID(),
        user_id: user!.id,
        title: parsedData.title || `Imported Resume - ${new Date().toLocaleDateString()}`,
        // For database (snake_case)
        personal_info: parsedData.personalInfo || parsedData.personal_info || {},
        work_experience: parsedData.workExperience || parsedData.work_experience || [],
        education: parsedData.education || [],
        skills: parsedData.skills || [],
        projects: parsedData.projects || [],
        languages: parsedData.languages || [],
        certifications: parsedData.certifications || [],
        interests: parsedData.interests || [],
        references: parsedData.references || [],
        template_id: defaultTemplateId,
        is_public: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_imported: true,
        source_cv: importSourceCV || parsedData.sourceCV || null,
        // For UI components (camelCase)
        personalInfo: parsedData.personalInfo || parsedData.personal_info || {},
        workExperience: parsedData.workExperience || parsedData.work_experience || [],
      };
      
      // Double check that we have both formats consistently
      const finalResumeData = ensureDualFormatFields(newResume);
      
      // Ensure template_id is a valid UUID or null, not an empty string
      if (!finalResumeData.template_id || finalResumeData.template_id === '') {
        finalResumeData.template_id = null;
      }
      
      console.log("Prepared resume data for database insertion:", finalResumeData);
      
      // Save to database - make sure we're using a properly typed object
      const resumeForDb = {
        id: finalResumeData.id,
        user_id: finalResumeData.user_id,
        title: finalResumeData.title,
        personal_info: finalResumeData.personal_info,
        work_experience: finalResumeData.work_experience,
        education: finalResumeData.education || [],
        skills: finalResumeData.skills || [],
        projects: finalResumeData.projects || [],
        languages: finalResumeData.languages || [],
        certifications: finalResumeData.certifications || [],
        interests: finalResumeData.interests || [],
        references: finalResumeData.references || [],
        template_id: finalResumeData.template_id,
        is_public: finalResumeData.is_public,
        created_at: finalResumeData.created_at,
        updated_at: finalResumeData.updated_at,
        is_imported: finalResumeData.is_imported,
        source_cv: finalResumeData.source_cv
      };
      
      const { data, error } = await supabase
        .from('resumes')
        .insert(resumeForDb)
        .select();
      
      if (error) throw error;


      // If we have a sourceCV, try to link the CV with the resume
      if (data && data[0] && importSourceCV) {
        try {
          // Link the CV to the resume
          await supabase
            .from('user_cvs')
            .update({ resume_id: data[0].id })
            .eq('id', importSourceCV)
            .eq('user_id', user!.id);
            
          console.log(`Linked CV ${importSourceCV} to resume ${data[0].id}`);
        } catch (linkError) {
          console.error('Error linking CV to resume:', linkError);
          // Non-critical error, continue
        }
      }
      
      // Update the local state
      if (data && data[0]) {
        // Make sure the response data is properly typed
        const newResumeWithProps: Resume = {
          ...data[0] as Resume,
          sourceCV: data[0].source_cv,
          workExperience: Array.isArray(data[0].work_experience) ? data[0].work_experience : []
        };
        
        setResumes([newResumeWithProps, ...resumes]);
        setImportedResumeId(data[0].id);
        setShowImportGuide(true);
      }
      
      toast({
        title: "Resume Imported",
        description: "Your resume has been imported successfully!",
      });
      
      // Reset the file input
      if (importFileRef.current) {
        importFileRef.current.value = '';
      }
      
    }

    saveFileToResume()
  
  },[importSourceCV, fileTosave, getDefaultTemplateId, user, supabase, toast, resumes])
  
  // Handle file selection for import
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    try {
      setImportLoading(true);
      
      const file = files[0];
      setFileToSave(file);
      
      // First, upload the file to storage
      if (user) {
        // Upload file to storage
        const uploadResult = await uploadFile({
          file,
          userId: user.id,
          onProgress: (progress) => {
            // You can handle progress updates here
          },
          metadata: {
            source: 'resume_import'
          }
        });
        
        if (!uploadResult.success) {
          throw new Error(uploadResult.error || 'Upload failed');
        }
        
        // Create a CV record - using array syntax for insert
        const { data: cvRecord, error: cvError } = await supabase
          .from('user_cvs')
          .insert({
            user_id: user.id,
            filename: file.name,
            filesize: file.size,
            filetype: file.type,
            filepath: uploadResult.filePath,
            file_url: uploadResult.publicUrl,
            uploaded_at: new Date().toISOString(),
            is_selected: false // Don't select by default
          })
          .select()
          .single();
        
        if (cvError) {
          console.error('Error creating CV record:', cvError);
          // Continue with import even if CV record creation fails
        } else {
          // Store the CV ID to link with the resume later
          setImportSourceCV(cvRecord.id);
        }
      }
      
      
    } catch (err: any) {
      console.error('Error importing resume:', err);
      toast({
        title: "Error",
        description: err.message || "Failed to import resume. Please try again.",
        variant: "destructive",
      });
    } finally {
      setImportLoading(false);
      setImportSourceCV(null);
    }
  };
  
  // Handle import guide close
  const handleImportGuideClose = () => {
    setShowImportGuide(false);
  };
  
  // Handle viewing source CV
  const handleViewSourceCV = async (resumeId: string) => {
    try {
      // Get the linked CV
      const cv = await getLinkedCV(resumeId);
      
      if (!cv || !cv.fileUrl) {
        throw new Error('Source CV not found or not available for viewing');
      }
      
      // Open the CV in a new tab
      window.open(cv.fileUrl, '_blank');
    } catch (error) {
      console.error('Error viewing source CV:', error);
      toast({
        title: "Error",
        description: "Could not view the source CV. It may no longer be available.",
        variant: "destructive",
      });
    }
  };
  
  // Filter and search resumes
  const filteredResumes = resumes.filter((resume: Resume) => {
    // Search filter
    const matchesSearch = searchTerm === '' || 
      (resume.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (resume.personal_info?.firstName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (resume.personal_info?.lastName?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    // Date filter
    if (activeFilter === 'recent') {
      // Filter for resumes updated in the last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return matchesSearch && resume.updated_at && new Date(resume.updated_at) >= sevenDaysAgo;
    }
    
    // For "all" filter - show everything that matches the search
    return matchesSearch;
  });
  
  if (isLoading) {
    return (
      <div className="container py-4 px-4 sm:py-8 sm:px-6">
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="container py-4 px-4 sm:py-8 sm:px-6">
        <Alert>
          <AlertDescription>
            You need to be logged in to view and manage your resumes.
          </AlertDescription>
        </Alert>
        <div className="flex justify-center mt-6">
          <Button asChild className="bg-teal-600 hover:bg-teal-700">
            <Link href="/auth/login">Log In</Link>
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container py-4 px-4 sm:py-8 sm:px-6 space-y-6 sm:space-y-8">
      {/* Header section - made responsive with stacking on small screens */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="w-full sm:w-auto">
          <h1 className="text-2xl sm:text-3xl font-bold">My Resumes</h1>
        </div>
        
        {resumes.length > 0 && (
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <Button 
              onClick={() => router.push('/dashboard/resumes/new')}
              className="flex-1 sm:flex-none text-xs sm:text-sm bg-teal-600 hover:bg-teal-700"
              size="sm"
            >
              <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Create New Resume
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => importFileRef.current?.click()}
              disabled={importLoading}
              className="flex-1 sm:flex-none text-xs sm:text-sm border-teal-200 text-teal-700 hover:bg-teal-50"
              size="sm"
            >
              {importLoading ? (
                <>
                  <LoadingSpinner className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Import Resume
                </>
              )}
            </Button>
          </div>
        )}
      </div>
      
      {/* Filters section - made stackable and full width on mobile */}
      <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center gap-4">
        <div className="w-full xs:w-auto overflow-x-auto pb-1">
          <Tabs value={activeFilter} onValueChange={setActiveFilter} className="w-full">
            <TabsList className="w-full xs:w-auto grid grid-cols-2 xs:inline-flex bg-teal-100">
              <TabsTrigger value="all" className="text-xs sm:text-sm data-[state=active]:bg-teal-600 data-[state=active]:text-white">All Resumes</TabsTrigger>
              <TabsTrigger value="recent" className="text-xs sm:text-sm data-[state=active]:bg-teal-600 data-[state=active]:text-white">Recent</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        <div className="w-full xs:w-auto relative">
          <Search className="absolute left-2 top-1/2 h-3 w-3 sm:h-4 sm:w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search resumes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-7 sm:pl-8 w-full xs:w-[200px] sm:w-[250px] h-9 text-sm focus-visible:ring-teal-500"
          />
        </div>
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {/* Resume grid - responsive columns for different screens */}
      {filteredResumes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {filteredResumes.map((resume) => (
            <Card 
              key={resume.id} 
              className={`overflow-hidden hover:border-teal-300 transition-colors ${resume.id === importedResumeId ? 'border-teal-500 shadow-md ring-1 ring-teal-500' : ''}`}
            >
              <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-start">
                  <div className="max-w-[calc(100%-40px)]"> {/* Prevent title from overlapping dropdown */}
                    <CardTitle className="flex items-center gap-1 flex-wrap text-base sm:text-lg">
                      <span className="truncate max-w-full">{resume.title}</span>
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm truncate mt-1">
                      {resume.personal_info?.firstName 
                        ? `${resume.personal_info.firstName} ${resume.personal_info.lastName || ''}`
                        : "No name provided"
                      }
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-teal-50">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => router.push(`/dashboard/resumes/${resume.id}`)}>
                        <Edit className="h-4 w-4 mr-2 text-teal-600" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push(`/dashboard/resumes/${resume.id}/tailor`)}>
                        <Target className="h-4 w-4 mr-2 text-teal-600" />
                        Tailor for Job
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push(`/dashboard/resumes/${resume.id}/preview`)}>
                        <FileText className="h-4 w-4 mr-2 text-teal-600" />
                        Preview
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push(`/dashboard/resumes/${resume.id}/ats-scanner`)}>
                        <FileSearch className="h-4 w-4 mr-2 text-teal-600" />
                        ATS Scanner
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicate(resume.id)}>
                        <Copy className="h-4 w-4 mr-2 text-teal-600" />
                        Duplicate
                      </DropdownMenuItem>
                      {(resume.source_cv || resume.sourceCV) && (
                        <DropdownMenuItem onClick={() => handleViewSourceCV(resume.id)}>
                          <FileText className="h-4 w-4 mr-2 text-teal-600" />
                          View Original CV
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-destructive focus:text-destructive"
                        onClick={() => handleDelete(resume.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              
              <CardContent className="p-4 pt-0 pb-2">
                <div className="flex items-center text-xs sm:text-sm text-muted-foreground mb-2">
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                  <span className="truncate">
                    Updated {resume.updated_at ? formatDistance(new Date(resume.updated_at), new Date(), { addSuffix: true }) : 'recently'}
                  </span>
                </div>
                <div className="text-xs sm:text-sm">
                  <p className="line-clamp-2">
                    {resume.personal_info?.title || "No job title provided"}
                  </p>
                </div>
              </CardContent>
              
              <CardFooter className="p-4 pt-2 flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 text-xs h-8 px-2 sm:px-3 border-teal-200 text-teal-700 hover:bg-teal-50"
                  onClick={() => router.push(`/dashboard/resumes/${resume.id}`)}
                >
                  <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Edit
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 text-xs h-8 px-2 sm:px-3 border-teal-200 text-teal-700 hover:bg-teal-50"
                  onClick={() => router.push(`/dashboard/resumes/${resume.id}/tailor`)}
                >
                  <Target className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Tailor
                </Button>
                
                <Button 
                  size="sm" 
                  className="flex-1 text-xs h-8 px-2 sm:px-3 bg-teal-600 hover:bg-teal-700"
                  onClick={() => router.push(`/dashboard/resumes/${resume.id}/preview`)}
                >
                  <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Preview
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div>
          <Card className="text-center p-4 sm:p-8">
            <FileText className="h-10 w-10 sm:h-12 sm:w-12 text-teal-400 mx-auto mb-4" />
            
            {searchTerm || activeFilter !== 'all' ? (
              <>
                <h3 className="text-base sm:text-lg font-medium mb-2">No matching resumes found</h3>
                <p className="text-sm text-muted-foreground mb-4 sm:mb-6">
                  Try adjusting your search or filters to find what you are looking for.
                </p>
                <Button variant="outline" onClick={() => { setSearchTerm(''); setActiveFilter('all'); }} className="border-teal-200 text-teal-700 hover:bg-teal-50">
                  Clear search & filters
                </Button>
              </>
            ) : (
              <>
                <h3 className="text-base sm:text-lg font-medium mb-2">You do not have any resumes yet</h3>
                
                <div className="flex flex-col xs:flex-row gap-3 justify-center">
                  <Button 
                    onClick={() => router.push('/dashboard/resumes/new')}
                    className="text-xs sm:text-sm bg-teal-600 hover:bg-teal-700"
                    size="sm"
                    >
                    <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Create New Resume
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => importFileRef.current?.click()}
                    disabled={importLoading}
                    className="text-xs sm:text-sm border-teal-200 text-teal-700 hover:bg-teal-50"
                    size="sm"
                  >
                   {importLoading ? (
                      <>
                        <LoadingSpinner className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        Import Resume
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </Card>
        </div>
      )}
      
      {/* Hidden file input for importing resumes */}
      <input
        ref={importFileRef}
        type="file"
        accept=".pdf,.docx,.txt"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Import Guide Component */}
      {importedResumeId && (
        <ImportGuide 
          resumeId={importedResumeId} 
          isOpen={showImportGuide} 
          onClose={handleImportGuideClose}
          fromCV={!!importSourceCV}
          cvName={importSourceCV ? "Your uploaded CV" : undefined}
        />
      )}
    </div>
  );
}