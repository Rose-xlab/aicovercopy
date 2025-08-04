// File: app/dashboard/resumes/page.tsx

"use client";

import { useState, useEffect, useRef, useCallback } from 'react'; // Added useCallback
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
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
// Import necessary mappers and types
import {
  mapDatabaseToResumeData,
  ensureDualFormatFields // Added import
} from '@/types/resume'; // Assuming ensureDualFormatFields is now here
import type { CvFile } from '@/lib/cv-helpers';
import { Json, type TablesInsert } from '@/types/supabase'; // Added TablesInsert
import { ResumeData, DatabaseResumeData, WorkExperience } from '@/types/resume';

export default function ResumeDashboardPage() {
  const [resumes, setResumes] = useState<ResumeData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [importLoading, setImportLoading] = useState<boolean>(false);
  const [showImportGuide, setShowImportGuide] = useState<boolean>(false);
  const [importedResumeId, setImportedResumeId] = useState<string | null>(null);

  const importFileRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createBrowserClient();
  const { getLinkedCV } = useCVResumeIntegration();
  const [fileToSave, setFileToSave] = useState<File | null>(null);
  const [importSourceCV, setImportSourceCV] = useState<string | null | undefined>(null)

  // Load resumes from database
  useEffect(() => {
    const fetchResumes = async () => {
      try {
        setIsLoading(true); setError(null);
        if (!user) { setResumes([]); return; }

        const { data, error: fetchError } = await supabase
          .from('resumes')
          .select('*')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false });

        if (fetchError) throw fetchError;

        if (data) {
          const processedResumes: ResumeData[] = data
            .map(dbResume => mapDatabaseToResumeData(dbResume as unknown as DatabaseResumeData))
            .filter((resume): resume is ResumeData => resume !== null);
          setResumes(processedResumes);
        } else {
          setResumes([]);
        }
      } catch (err: any) {
        console.error('Error fetching resumes:', err);
        setError(err.message || 'Failed to load resumes');
        toast({ title: "Error", description: "Failed to load resumes.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    if (user) { fetchResumes(); } else { setIsLoading(false); }
  }, [user, supabase, toast]);

  const handleDelete = async (id: string) => {
    const originalResumes = [...resumes];
    setResumes(prevResumes => prevResumes.filter(resume => resume.id !== id));

    try {
      setError(null);
      console.log(`Attempting to delete resume ${id} via API...`);
      const response = await fetch(`/api/resumes/${id}`, { method: 'DELETE' });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || `Failed to delete (Status: ${response.status})`);
      }

      console.log(`Successfully deleted resume ${id}`);
      toast({ title: "Resume Deleted", description: "Resume deleted successfully." });
    } catch (err: any) {
      console.error('Error deleting resume via API:', err);
      setResumes(originalResumes);
      toast({ title: "Error Deleting", description: err.message || "Failed to delete.", variant: "destructive" });
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      setError(null);
      const resumeToDuplicate = resumes.find(r => r.id === id);
      if (!resumeToDuplicate) throw new Error('Resume not found');

      const newResumeData = {
        ...resumeToDuplicate,
        id: crypto.randomUUID(),
        title: `${resumeToDuplicate.title || 'Untitled'} (Copy)`,
        templateId: resumeToDuplicate.templateId === null ? undefined : resumeToDuplicate.templateId,
        created_at: undefined,
        updated_at: undefined,
        userId: undefined, // userId should be user_id for DB if not mapped by API
      };
      // It's better if the API handles setting user_id from the authenticated user.
      // delete newResumeData.created_at; // already undefined
      // delete newResumeData.updated_at; // already undefined


      console.log("Duplicating resume via API. Data for POST:", newResumeData);

      const response = await fetch('/api/resumes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeData: newResumeData }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || `Failed to duplicate (Status: ${response.status})`);
      if (!result?.id) throw new Error('Failed to duplicate (API did not return created record).');

      const newlyCreatedResume = mapDatabaseToResumeData(result as unknown as DatabaseResumeData);
      if (!newlyCreatedResume) throw new Error("Failed to process duplicated resume data from server.");

      setResumes(prevResumes => [newlyCreatedResume, ...prevResumes]);
      toast({ title: "Resume Duplicated", description: "A copy has been created." });

    } catch (err: any) {
      console.error('Error duplicating resume via API:', err);
      toast({ title: "Error Duplicating", description: err.message || "Failed to duplicate.", variant: "destructive" });
    }
  };

  const getDefaultTemplateId = useCallback(async (): Promise<string | null> => {
    try {
      const { data } = await supabase
        .from('resume_templates')
        .select('id')
        .eq('is_public', true)
        .limit(1);
      return data?.[0]?.id || null;
    } catch (error) {
      console.error('Error getting default resume template:', error);
      return null;
    }
  }, [supabase]); // Added supabase to dependency array

  useEffect(() => {
    const saveFileToResume = async () => {
      try {
        console.log('file', fileToSave, 'cv', importSourceCV)
        if (!fileToSave || !user) return; // Added user check for safety, though parent effect might handle

        setImportLoading(true); // Moved here to show loading for this specific async operation

        const formData = new FormData();
        formData.append('file', fileToSave);

        if (importSourceCV) { // Check if importSourceCV has a value
          formData.append('sourceType', 'resume_import');
          formData.append('cvId', importSourceCV);
        }

        const response = await fetch('/api/resumes/parser', {
          method: 'POST',
          body: formData,
        });

        console.log('the response', response)

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Import failed');
        }

        const parsedData = await response.json();
        console.log("Received parsed data from parser API:", parsedData);

        const defaultTemplateId = await getDefaultTemplateId();

        const newResumePayload: Partial<ResumeData> = {
          // Use fileToSave here as 'file' is not in this scope
          title: parsedData.title || `Imported - ${fileToSave!.name.split('.')[0] || 'Resume'}`,
          personalInfo: parsedData.personalInfo || parsedData.personal_info || { firstName: '', lastName: '', title: '', summary: '', contact: { email: ''} },
          workExperience: parsedData.workExperience || parsedData.work_experience || [],
          education: parsedData.education || [],
          skills: parsedData.skills || [],
          projects: parsedData.projects || [],
          languages: parsedData.languages || [],
          certifications: parsedData.certifications || [],
          interests: parsedData.interests || [],
          internships: parsedData.internships || [],
          references: parsedData.references || [],
          referenceText: parsedData.referenceText,
          customSections: parsedData.customSections || [],
          templateId: defaultTemplateId === null ? '' : defaultTemplateId, // ResumeData expects string, ensure '' if null
          isPublic: false,
          is_imported: true, // Align with ResumeData's is_imported field
          sourceCV: importSourceCV || parsedData.sourceCV || undefined, // Changed source_cv to sourceCV, ensure undefined if null
          // Removed duplicate personalInfo and workExperience that were here
        };

        const finalResumeData = ensureDualFormatFields(newResumePayload); // Corrected variable name

        if (!finalResumeData.template_id || finalResumeData.template_id === '') {
          finalResumeData.template_id = null; // Supabase expects null for empty foreign keys
        }
        
        console.log("Prepared resume data for database insertion:", finalResumeData);

        // Prepare object for DB insertion, mapping to snake_case where necessary
        // This part heavily relies on finalResumeData having all necessary snake_case fields from ensureDualFormatFields
        // A cleaner way would be to use mapResumeToDatabase(newResumePayload as ResumeData) if newResumePayload was complete
        const resumeForDb: TablesInsert<'resumes'> = { // Use TablesInsert for stricter typing
          // id is generated by DB
          user_id: user.id, // Ensure user.id is available and correct
          title: finalResumeData.title,
          personal_info: finalResumeData.personal_info || finalResumeData.personalInfo,
          work_experience: finalResumeData.work_experience || finalResumeData.workExperience,
          education: finalResumeData.education || [],
          skills: finalResumeData.skills || [],
          projects: finalResumeData.projects || null,
          languages: finalResumeData.languages || null,
          certifications: finalResumeData.certifications || null,
          interests: finalResumeData.interests || null,
          references: finalResumeData.references || null,
          custom_sections: finalResumeData.custom_sections || finalResumeData.customSections || null,
          template_id: finalResumeData.template_id || null, // Ensure null if empty for DB
          is_public: finalResumeData.is_public ?? false,
          is_imported: finalResumeData.is_imported ?? finalResumeData.isImported ?? null,
          source_cv: finalResumeData.source_cv || finalResumeData.sourceCV || null,
          reference_text: finalResumeData.reference_text || finalResumeData.referenceText || null,
          // created_at and updated_at are handled by DB
        };

        const { data, error } = await supabase
          .from('resumes')
          .insert(resumeForDb as any) // Using 'as any' if strict typing with ensureDualFormatFields is complex
          .select()
          .single(); // Expecting a single record back

        if (error) throw error;

        if (data && importSourceCV) { // data here is an object, not data[0] after .single()
          try {
            await supabase
              .from('user_cvs')
              .update({ resume_id: data.id })
              .eq('id', importSourceCV)
              .eq('user_id', user!.id);
            console.log(`Linked CV ${importSourceCV} to resume ${data.id}`);
          } catch (linkError) {
            console.error('Error linking CV to resume:', linkError);
          }
        }

        if (data) { // data is the single inserted object
            const newDbResume = data as unknown as DatabaseResumeData; // Cast to your DB type
            const newUIRecord = mapDatabaseToResumeData(newDbResume); // Use your mapper
            if (newUIRecord) {
                setResumes(prevResumes => [newUIRecord, ...prevResumes]); // Prepend to keep order
                setImportedResumeId(newUIRecord.id);
                setShowImportGuide(true);
            } else {
                 console.error("Failed to map newly inserted resume to UI format after import.");
                 toast({ title: "Error", description: "Failed to update resume list after import.", variant: "destructive" });
            }
        }

        toast({
          title: "Resume Imported",
          description: "Your resume has been imported successfully!",
        });

        if (importFileRef.current) {
          importFileRef.current.value = '';
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
        setFileToSave(null); // Reset fileToSave after processing
        setImportSourceCV(null); // Reset importSourceCV
      }
    }

    if (fileToSave && user) { // ensure user is also checked before calling
        saveFileToResume();
    }

  }, [importSourceCV, fileToSave, getDefaultTemplateId, user, supabase, toast, router]); // Removed 'resumes' from dep array to avoid loop if setResumes causes re-trigger, add back if logic requires it and is safe. Usually adding to list doesn't require it as a dep.

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !user) return; // Added user check

    const file = files[0]; // file is correctly defined here for local use
    setImportLoading(true); // Set loading early

    try {
      // Set fileToSave to trigger the useEffect, or call parts of saveFileToResume directly
      // For this flow, we need to create CV record first to get importSourceCV
      // Then setFileToSave to trigger the main parsing and resume creation effect.

      if (user) {
        const uploadResult = await uploadFile({
          file,
          userId: user.id,
          onProgress: (progress) => { /* Handle progress if needed */ },
          metadata: { source: 'resume_import' }
        });

        if (!uploadResult.success || !uploadResult.filePath || !uploadResult.publicUrl) {
          throw new Error(uploadResult.error || 'Upload failed');
        }

        const cvDataToInsert: TablesInsert<'user_cvs'> = { // Using TablesInsert
          user_id: user.id,
          filename: file.name,
          filesize: file.size,
          filetype: file.type,
          filepath: uploadResult.filePath,
          file_url: uploadResult.publicUrl,
          uploaded_at: new Date().toISOString(),
          is_selected: false
        };

        const { data: cvRecord, error: cvError } = await supabase
          .from('user_cvs')
          .insert(cvDataToInsert)
          .select()
          .single();

        if (cvError) {
          console.error('Error creating CV record:', cvError);
          // Decide if you want to proceed without CV link or show error
          // For now, proceeding and setting importSourceCV to null if error
          setImportSourceCV(null);
        } else if (cvRecord) {
          setImportSourceCV(cvRecord.id);
        }
      }
      setFileToSave(file); // This will trigger the useEffect to process the file

    } catch (err: any) {
      console.error('Error during file selection/upload stage:', err);
      toast({
        title: "Upload Error",
        description: err.message || "Failed to upload file. Please try again.",
        variant: "destructive",
      });
      setImportLoading(false); // Reset loading on error
      if (importFileRef.current) { // Reset file input
        importFileRef.current.value = '';
      }
    }
    // Do not call setImportLoading(false) here if setFileToSave triggers an effect that handles it.
    // The useEffect for saveFileToResume will setImportLoading(false) in its finally block.
  };

  const handleImportGuideClose = () => setShowImportGuide(false);

  const handleViewSourceCV = async (resumeId: string) => {
    try {
      const resume = resumes.find(r => r.id === resumeId); // Get resume from local state
      if (!resume || !resume.sourceCV) throw new Error('Source CV ID not found for this resume.');

      const cv = await getLinkedCV(resume.sourceCV); // Pass CV ID
      if (!cv || !cv.fileUrl) throw new Error('Source CV not found or URL missing');
      window.open(cv.fileUrl, '_blank');
    } catch (error: any) {
      console.error('Error viewing source CV:', error);
      toast({ title: "Error", description: error.message || "Could not view the source CV.", variant: "destructive" });
    }
  };

  const filteredResumes = resumes.filter((resume: ResumeData) => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    const matchesSearch = searchTerm === '' ||
      (resume.title?.toLowerCase() || '').includes(lowerSearchTerm) ||
      (resume.personalInfo?.firstName?.toLowerCase() || '').includes(lowerSearchTerm) ||
      (resume.personalInfo?.lastName?.toLowerCase() || '').includes(lowerSearchTerm);

    if (activeFilter === 'recent') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return matchesSearch && resume.updated_at && new Date(resume.updated_at) >= sevenDaysAgo;
    }
    return matchesSearch;
  });

  if (isLoading) { return ( <div className="container py-4 px-4 sm:py-8 sm:px-6"><div className="flex justify-center py-12"><LoadingSpinner /></div></div> ); }
  if (!user) { return ( <div className="container py-4 px-4 sm:py-8 sm:px-6"><Alert><AlertDescription>You need to be logged in.</AlertDescription></Alert><div className="flex justify-center mt-6"><Button asChild className="bg-teal-600 hover:bg-teal-700"><Link href="/auth/login">Log In</Link></Button></div></div> ); }

  return (
    <div className="container py-4 px-4 sm:py-8 sm:px-6 space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="w-full sm:w-auto">
          <h1 className="text-2xl sm:text-3xl font-bold">My Resumes</h1>
        </div>
        {/* Conditional rendering of buttons based on whether resumes exist or not */}
        {(resumes.length > 0 || !isLoading) && ( // Show buttons if not loading OR if resumes exist
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <Button onClick={() => router.push('/dashboard/resumes/new')} className="flex-1 sm:flex-none text-xs sm:text-sm bg-teal-600 hover:bg-teal-700" size="sm">
                    <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" /> Create New Resume
                </Button>
                <Button variant="outline" onClick={() => importFileRef.current?.click()} disabled={importLoading} className="flex-1 sm:flex-none text-xs sm:text-sm border-teal-200 text-teal-700 hover:bg-teal-50" size="sm">
                    {importLoading ? <><LoadingSpinner className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" /> Importing...</> : <><Upload className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" /> Import Resume</>}
                </Button>
            </div>
        )}
      </div>

      {/* Filters */}
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
          <Input placeholder="Search resumes..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-7 sm:pl-8 w-full xs:w-[200px] sm:w-[250px] h-9 text-sm focus-visible:ring-teal-500" />
        </div>
      </div>

      {error && ( <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert> )}

      {filteredResumes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {filteredResumes.map((resume) => (
            <Card key={resume.id} className={`overflow-hidden hover:border-teal-300 transition-colors ${resume.id === importedResumeId ? 'border-teal-500 shadow-md ring-1 ring-teal-500' : ''}`}>
              <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-start">
                  <div className="max-w-[calc(100%-40px)]">
                    <CardTitle className="flex items-center gap-1 flex-wrap text-base sm:text-lg">
                      <span className="truncate max-w-full">{resume.title}</span>
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm truncate mt-1">
                      {resume.personalInfo?.firstName ? `${resume.personalInfo.firstName} ${resume.personalInfo.lastName || ''}` : "No name provided"}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-teal-50"> <MoreVertical className="h-4 w-4" /> </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => router.push(`/dashboard/resumes/${resume.id}`)}> <Edit className="h-4 w-4 mr-2 text-teal-600" /> Edit </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push(`/dashboard/resumes/${resume.id}/tailor`)}> <Target className="h-4 w-4 mr-2 text-teal-600" /> Tailor for Job </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push(`/dashboard/resumes/${resume.id}/preview`)}> <FileText className="h-4 w-4 mr-2 text-teal-600" /> Preview </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push(`/dashboard/resumes/${resume.id}/ats-scanner`)}> <FileSearch className="h-4 w-4 mr-2 text-teal-600" /> ATS Scanner </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicate(resume.id)}> <Copy className="h-4 w-4 mr-2 text-teal-600" /> Duplicate </DropdownMenuItem>
                      {resume.sourceCV && ( // Check camelCase sourceCV from ResumeData
                        <DropdownMenuItem onClick={() => handleViewSourceCV(resume.id)}>
                          <FileText className="h-4 w-4 mr-2 text-teal-600" /> View Original CV
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDelete(resume.id)}> <Trash2 className="h-4 w-4 mr-2" /> Delete </DropdownMenuItem>
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
                    {resume.personalInfo?.title || "No job title provided"}
                  </p>
                </div>
              </CardContent>
              <CardFooter className="p-4 pt-2 flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 text-xs h-8 px-2 sm:px-3 border-teal-200 text-teal-700 hover:bg-teal-50" onClick={() => router.push(`/dashboard/resumes/${resume.id}`)}> <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" /> Edit </Button>
                <Button variant="outline" size="sm" className="flex-1 text-xs h-8 px-2 sm:px-3 border-teal-200 text-teal-700 hover:bg-teal-50" onClick={() => router.push(`/dashboard/resumes/${resume.id}/tailor`)}> <Target className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" /> Tailor </Button>
                <Button size="sm" className="flex-1 text-xs h-8 px-2 sm:px-3 bg-teal-600 hover:bg-teal-700" onClick={() => router.push(`/dashboard/resumes/${resume.id}/preview`)}> <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" /> Preview </Button>
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
                <p className="text-sm text-muted-foreground mb-4 sm:mb-6"> Try adjusting your search or filters. </p>
                <Button variant="outline" onClick={() => { setSearchTerm(''); setActiveFilter('all'); }} className="border-teal-200 text-teal-700 hover:bg-teal-50"> Clear search & filters </Button>
              </>
            ) : (
              <>
                <h3 className="text-base sm:text-lg font-medium mb-2">You do not have any resumes yet</h3>
                <div className="flex flex-col xs:flex-row gap-3 justify-center">
                  <Button onClick={() => router.push('/dashboard/resumes/new')} className="text-xs sm:text-sm bg-teal-600 hover:bg-teal-700" size="sm"> <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" /> Create New Resume </Button>
                  <Button variant="outline" onClick={() => importFileRef.current?.click()} disabled={importLoading} className="text-xs sm:text-sm border-teal-200 text-teal-700 hover:bg-teal-50" size="sm">
                    {importLoading ? <><LoadingSpinner className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" /> Importing...</> : <><Upload className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" /> Import Resume</>}
                  </Button>
                </div>
              </>
            )}
          </Card>
        </div>
      )}

      <input ref={importFileRef} type="file" accept=".pdf,.docx,.txt,.xlsx,.xls" className="hidden" onChange={handleFileSelect} />

      {importedResumeId && ( <ImportGuide resumeId={importedResumeId} isOpen={showImportGuide} onClose={handleImportGuideClose} /> )}
    </div>
  );
}