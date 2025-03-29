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
  X
} from 'lucide-react';
import Link from 'next/link';
import { formatDistance } from 'date-fns';

export default function ResumeDashboardPage() {
  const [resumes, setResumes] = useState<any[]>([]);
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
        
        setResumes(data || []);
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
      const newResume = {
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
        setResumes([data[0], ...resumes]);
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
  
  // Handle file selection for import
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    try {
      setImportLoading(true);
      
      const file = files[0];
      const formData = new FormData();
      formData.append('file', file);
      
      // Parse the resume
      const response = await fetch('/api/resumes/parser', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Import failed');
      }
      
      const parsedData = await response.json();
      
      // Create a new resume with the parsed data
      const newResume = {
        ...parsedData,
        id: crypto.randomUUID(),
        user_id: user!.id,
        title: parsedData.title || `Imported Resume - ${new Date().toLocaleDateString()}`,
        templateId: parsedData.templateId || (await getDefaultTemplateId()),
        isPublic: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Save to database
      const { data, error } = await supabase
        .from('resumes')
        .insert({
          id: newResume.id,
          user_id: newResume.user_id,
          title: newResume.title,
          personal_info: newResume.personalInfo,
          work_experience: newResume.workExperience || [],
          education: newResume.education || [],
          skills: newResume.skills || [],
          projects: newResume.projects || [],
          languages: newResume.languages || [],
          certifications: newResume.certifications || [],
          template_id: newResume.templateId,
          is_public: newResume.isPublic,
          created_at: newResume.created_at,
          updated_at: newResume.updated_at,
          is_imported: true // Mark as imported
        })
        .select();
      
      if (error) throw error;
      
      // Update the local state
      if (data && data[0]) {
        setResumes([data[0], ...resumes]);
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
    } catch (err: any) {
      console.error('Error importing resume:', err);
      toast({
        title: "Import Failed",
        description: err.message || "Failed to import resume. Please try again.",
        variant: "destructive",
      });
    } finally {
      setImportLoading(false);
    }
  };
  
  // Get default template ID
  const getDefaultTemplateId = async (): Promise<string> => {
    try {
      const { data } = await supabase
        .from('resume_templates')
        .select('id')
        .eq('is_public', true)
        .limit(1);
      
      return data && data[0] ? data[0].id : '';
    } catch (error) {
      console.error('Error getting default template:', error);
      return '';
    }
  };
  
  // Handle import guide close
  const handleImportGuideClose = () => {
    setShowImportGuide(false);
  };
  
  // Filter and search resumes
  const filteredResumes = resumes.filter(resume => {
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
      return matchesSearch && new Date(resume.updated_at) >= sevenDaysAgo;
    }
    
    // Imported filter
    if (activeFilter === 'imported') {
      return matchesSearch && resume.is_imported === true;
    }
    
    return matchesSearch;
  });
  
  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="container py-8">
        <Alert>
          <AlertDescription>
            You need to be logged in to view and manage your resumes.
          </AlertDescription>
        </Alert>
        <div className="flex justify-center mt-6">
          <Button asChild>
            <Link href="/auth/login">Log In</Link>
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container py-8 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">My Resumes</h1>
          <p className="text-muted-foreground">Manage and create professional resumes</p>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <Button onClick={() => router.push('/dashboard/resumes/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Create New Resume
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => importFileRef.current?.click()}
            disabled={importLoading}
          >
            {importLoading ? (
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
          </Button>
          <input
            ref={importFileRef}
            type="file"
            accept=".pdf,.docx,.txt"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Tabs value={activeFilter} onValueChange={setActiveFilter}>
          <TabsList>
            <TabsTrigger value="all">All Resumes</TabsTrigger>
            <TabsTrigger value="recent">Recent</TabsTrigger>
            <TabsTrigger value="imported">Imported</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="w-full sm:w-auto relative">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search resumes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 w-full sm:w-[250px]"
          />
        </div>
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {filteredResumes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResumes.map(resume => (
            <Card 
              key={resume.id} 
              className={`overflow-hidden ${resume.id === importedResumeId ? 'border-green-500 shadow-md ring-1 ring-green-500' : ''}`}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {resume.title}
                      {resume.is_imported && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          <Upload className="h-3 w-3 mr-1" />
                          Imported
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {resume.personal_info?.firstName 
                        ? `${resume.personal_info.firstName} ${resume.personal_info.lastName || ''}`
                        : "No name provided"
                      }
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => router.push(`/dashboard/resumes/${resume.id}`)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push(`/dashboard/resumes/${resume.id}/preview`)}>
                        <FileText className="h-4 w-4 mr-2" />
                        Preview
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push(`/dashboard/resumes/${resume.id}/ats-scanner`)}>
                        <FileSearch className="h-4 w-4 mr-2" />
                        ATS Scanner
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicate(resume.id)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
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
              
              <CardContent className="pb-2">
                <div className="flex items-center text-sm text-muted-foreground mb-4">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>
                    Last updated {formatDistance(new Date(resume.updated_at), new Date(), { addSuffix: true })}
                  </span>
                </div>
                <div className="text-sm">
                  <p className="line-clamp-2">
                    {resume.personal_info?.title || "No job title provided"}
                  </p>
                </div>
              </CardContent>
              
              <CardFooter className="pt-2 flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => router.push(`/dashboard/resumes/${resume.id}`)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button 
                  size="sm" 
                  className="flex-1"
                  onClick={() => router.push(`/dashboard/resumes/${resume.id}/preview`)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center p-8">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          
          {searchTerm || activeFilter !== 'all' ? (
            <>
              <h3 className="text-lg font-medium mb-2">No matching resumes found</h3>
              <p className="text-muted-foreground mb-6">
                Try adjusting your search or filters to find what you are looking for.
              </p>
              <Button variant="outline" onClick={() => { setSearchTerm(''); setActiveFilter('all'); }}>
                Clear search & filters
              </Button>
            </>
          ) : (
            <>
              <h3 className="text-lg font-medium mb-2">You do not have any resumes yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first resume to get started on your job search journey.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button onClick={() => router.push('/dashboard/resumes/new')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Resume
                </Button>
                <Button variant="outline" onClick={() => importFileRef.current?.click()}>
                  <Upload className="h-4 w-4 mr-2" />
                  Import Resume
                </Button>
              </div>
            </>
          )}
        </Card>
      )}

      {/* Import Guide Component */}
      {importedResumeId && (
        <ImportGuide 
          resumeId={importedResumeId} 
          isOpen={showImportGuide} 
          onClose={handleImportGuideClose} 
        />
      )}
    </div>
  );
}