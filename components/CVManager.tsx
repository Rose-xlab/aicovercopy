"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  CheckCircle2, 
  Trash2, 
  FileText,
  Plus,
  Eye,
  Clock,
  Info,
  ExternalLink,
  Linkedin
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/lib/hooks/useAuth";
import { createBrowserClient } from "@/lib/supabase";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { mapDbCvToAppCv, formatFileSize, findResumeForCv } from "@/lib/cv-helpers";

// Export the interface for use by other components
export type { CvFile } from '@/lib/cv-helpers';

export function CVManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const supabase = createBrowserClient();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropAreaRef = useRef<HTMLDivElement>(null);
  
  // Import the CvFile type to satisfy TypeScript
  type CvFile = import('@/lib/cv-helpers').CvFile;
  
  // States
  const [cvFiles, setCvFiles] = useState<CvFile[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'parsing' | 'complete'>('idle');
  const [isLoading, setIsLoading] = useState(true);
  const [viewingCv, setViewingCv] = useState<CvFile | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [cvToResumeMap, setCvToResumeMap] = useState<Record<string, string>>({});
  const [isDragging, setIsDragging] = useState(false);
  
  // Keep track of the last fetched time for each CV
  const [lastRefreshTime, setLastRefreshTime] = useState<Record<string, number>>({});
  
  // Load saved CVs from Supabase on mount
  const fetchUserCvs = useCallback(async () => {
    setIsLoading(true);
    try {
      if (user) {
        const { data, error } = await supabase
          .from('user_cvs')
          .select('*')
          .eq('user_id', user.id)
          .order('uploaded_at', { ascending: false });

        if (error) {
          throw error;
        }

        if (data) {
          // Convert database format to component format
          const formattedCvs: CvFile[] = data.map(cv => mapDbCvToAppCv(cv));
          setCvFiles(formattedCvs);
          
          // Find linked resumes for each CV
          const resumeMap: Record<string, string> = {};
          const refreshTimeMap: Record<string, number> = {};
          const now = Date.now();
          
          for (const cv of data) {
            // First check if the CV has a direct resume_id reference
            if (cv.resume_id) {
              resumeMap[cv.id] = cv.resume_id;
            } else {
              // If not, try to find a resume that references this CV
              // Cast the supabase client to any to avoid type mismatch
              const resumeId = await findResumeForCv(supabase as any, cv.id, user.id);
              if (resumeId) {
                resumeMap[cv.id] = resumeId;
              }
            }
            refreshTimeMap[cv.id] = now;
          }
          
          setCvToResumeMap(resumeMap);
          setLastRefreshTime(refreshTimeMap);
        }
      } else {
        // Fallback to localStorage for non-logged in users
        const savedCVs = localStorage.getItem('userCVs');
        if (savedCVs) {
          try {
            setCvFiles(JSON.parse(savedCVs));
          } catch (e) {
            console.error('Error parsing saved CV data', e);
            setCvFiles([]);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching CVs:', error);
      toast({
        title: "Error loading CVs",
        description: "There was a problem loading your saved CVs.",
        variant: "destructive",
      });
      
      // Fallback to localStorage
      const savedCVs = localStorage.getItem('userCVs');
      if (savedCVs) {
        try {
          setCvFiles(JSON.parse(savedCVs));
        } catch (e) {
          console.error('Error parsing saved CV data', e);
          setCvFiles([]);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [user, supabase, toast]);
  
  useEffect(() => {
    fetchUserCvs();
  }, [fetchUserCvs]);
  
  // Periodically check for newly created resumes
  useEffect(() => {
    if (!user) return;
    
    const checkForNewResumes = async () => {
      try {
        // Get all CVs that don't have a linked resume yet
        const cvsWithoutResumes = cvFiles.filter(cv => !cvToResumeMap[cv.id]);
        
        if (cvsWithoutResumes.length === 0) return;
        
        const now = Date.now();
        const newResumeMap = { ...cvToResumeMap };
        const newRefreshTime = { ...lastRefreshTime };
        let updatedMap = false;
        
        for (const cv of cvsWithoutResumes) {
          // Only check if we haven't checked in the last 10 seconds
          if (now - (lastRefreshTime[cv.id] || 0) < 10000) continue;
          
          // Try to find a linked resume
          const resumeId = await findResumeForCv(supabase as any, cv.id, user.id);
          if (resumeId) {
            newResumeMap[cv.id] = resumeId;
            updatedMap = true;
          }
          
          // Update the last refresh time regardless of result
          newRefreshTime[cv.id] = now;
        }
        
        if (updatedMap) {
          setCvToResumeMap(newResumeMap);
        }
        setLastRefreshTime(newRefreshTime);
      } catch (error) {
        console.error('Error checking for new resumes:', error);
      }
    };
    
    // Check every 15 seconds
    const interval = setInterval(checkForNewResumes, 15000);
    
    // Run once on mount
    checkForNewResumes();
    
    return () => clearInterval(interval);
  }, [cvFiles, cvToResumeMap, lastRefreshTime, supabase, user]);

  // Drag and drop handlers
  useEffect(() => {
    const dropArea = dropAreaRef.current;
    if (!dropArea) return;

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
    };

    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.currentTarget === dropArea) {
        setIsDragging(false);
      }
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        processFile(e.dataTransfer.files[0]);
      }
    };

    dropArea.addEventListener('dragover', handleDragOver);
    dropArea.addEventListener('dragenter', handleDragEnter);
    dropArea.addEventListener('dragleave', handleDragLeave);
    dropArea.addEventListener('drop', handleDrop);

    return () => {
      dropArea.removeEventListener('dragover', handleDragOver);
      dropArea.removeEventListener('dragenter', handleDragEnter);
      dropArea.removeEventListener('dragleave', handleDragLeave);
      dropArea.removeEventListener('drop', handleDrop);
    };
  }, []);

  // Save CVs to both Supabase and localStorage
  const saveCvs = async (updatedCvs: CvFile[]) => {
    setCvFiles(updatedCvs);
    
    // Always update localStorage as a fallback
    localStorage.setItem('userCVs', JSON.stringify(updatedCvs));
    
    // If user is logged in, update Supabase
    if (user) {
      try {
        // Only update selection state in Supabase, actual file uploads are handled separately
        updatedCvs.forEach(async (cv) => {
          if (cv.id) {
            await supabase
              .from('user_cvs')
              .update({ is_selected: cv.isSelected })
              .eq('id', cv.id)
              .eq('user_id', user.id);
          }
        });
      } catch (error) {
        console.error('Error updating CV selection state:', error);
      }
    }
  };

  // Process the file (used by both drag&drop and file input)
  const processFile = async (selectedFile: File) => {
    // Validate file size (5MB max)
    if (selectedFile.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 5MB.",
        variant: "destructive",
      });
      return;
    }
    
    // Validate file type
    const fileExt = selectedFile.name.split('.').pop()?.toLowerCase();
    const allowedTypes = ['pdf', 'doc', 'docx', 'txt'];
    if (!fileExt || !allowedTypes.includes(fileExt)) {
      toast({
        title: "Invalid file type",
        description: "Please upload PDF, DOC, DOCX, or TXT files only.",
        variant: "destructive",
      });
      return;
    }
    
    // Start upload process
    setUploadStatus('uploading');
    setUploadProgress(0);
    
    // Simulated upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 95) {
          clearInterval(interval);
          return 95;
        }
        return prev + 5;
      });
    }, 100);
    
    let newCvId = null;
    
    if (user) {
      // For logged-in users, upload to Supabase Storage
      try {
        // Generate a unique filename
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;
        
        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from('cvs')
          .upload(filePath, selectedFile);
        
        if (error) throw error;
        
        // Get the public URL
        const { data: urlData } = supabase.storage
          .from('cvs')
          .getPublicUrl(filePath);
        
        // Complete upload, set progress to 100%
        setUploadProgress(100);
        
        // Save record to database
        const { data: cvRecord, error: dbError } = await supabase
          .from('user_cvs')
          .insert({
            user_id: user.id,
            filename: selectedFile.name,
            filesize: selectedFile.size,
            filetype: selectedFile.type,
            filepath: filePath,
            file_url: urlData.publicUrl,
            uploaded_at: new Date().toISOString(),
            is_selected: cvFiles.length === 0 // Select by default if it's the first CV
          })
          .select()
          .single();
        
        if (dbError) throw dbError;
        
        // Store the CV ID for use in resume creation
        newCvId = cvRecord.id;
        
        // Update UI to show the new CV
        const newCv = mapDbCvToAppCv(cvRecord);
        const updatedCvs = [...cvFiles];
        
        // If this is the first CV or it's set as selected, unselect all others
        if (newCv.isSelected) {
          updatedCvs.forEach(cv => cv.isSelected = false);
        }
        
        // Add the new CV to the list
        saveCvs([newCv, ...updatedCvs]);
        
        // Set upload to complete
        setUploadStatus('complete');
        
        toast({
          title: "CV Uploaded Successfully",
          description: `${selectedFile.name} has been uploaded to your account.`,
        });
        
        // Now parse the CV to create a resume (do this in the background)
        setUploadStatus('parsing');
        
        // Create a FormData object to send the file to the parser API
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('sourceType', 'cv_upload');
        formData.append('cvId', cvRecord.id);
        
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
        const newResumeResponse = await fetch('/api/resumes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            resumeData: {
              ...parsedData,
              sourceCV: cvRecord.id,  // This will be mapped to source_cv
              is_imported: true       // Flag as imported
            }
          }),
        });
        
        if (!newResumeResponse.ok) {
          throw new Error('Failed to create resume from CV');
        }
        
        const newResume = await newResumeResponse.json();
        
        // Update the CV-to-Resume mapping
        setCvToResumeMap(prev => ({
          ...prev,
          [cvRecord.id]: newResume.id
        }));
        
        // Record the time we last checked for this CV
        setLastRefreshTime(prev => ({
          ...prev,
          [cvRecord.id]: Date.now()
        }));
        
        setUploadStatus('complete');
        
        // Don't show a second toast message about the resume creation
        // This happens silently in the background
      } catch (error) {
        console.error('Error in CV processing:', error);
        
        // We don't show errors for the background processing to users
        // Just log them for debugging
      }
    } else {
      // For non-logged in users, simulate upload and store in localStorage
      setTimeout(() => {
        const newCv: CvFile = {
          id: Date.now().toString(),
          name: selectedFile.name,
          size: selectedFile.size,
          type: selectedFile.type,
          uploadDate: new Date().toISOString(),
          isSelected: cvFiles.length === 0 // Select by default if it's the first CV
        };
        
        const updatedCvs = [...cvFiles];
        
        // If this is the first CV or it's set as selected, unselect all others
        if (newCv.isSelected) {
          updatedCvs.forEach(cv => cv.isSelected = false);
        }
        
        saveCvs([newCv, ...updatedCvs]);
        
        toast({
          title: "CV saved",
          description: `${selectedFile.name} has been saved to your browser storage.`,
        });
        
        setUploadProgress(100);
        setUploadStatus('complete');
      }, 1500);
    }
    
    // Clear input and reset states after complete
    setTimeout(() => {
      clearInterval(interval);
      setUploadStatus('idle');
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }, 3000);
  };

  // Handle file selection from input
  const handleFileSelection = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await processFile(e.target.files[0]);
    }
  };

  // Handle selecting a CV
  const handleSelectCv = (id: string) => {
    const updatedCvs = cvFiles.map(cv => ({
      ...cv,
      isSelected: cv.id === id
    }));
    
    saveCvs(updatedCvs);
    
    toast({
      title: "CV selected",
      description: "This CV will be used for generating cover letters.",
    });
  };

  // Handle deleting a CV
  const handleDeleteCv = async (id: string) => {
    try {
      const cvToDelete = cvFiles.find(cv => cv.id === id);
      if (!cvToDelete) return;
      
      if (user) {
        // Delete from Supabase - get the filepath first
        const { data: cvData, error: fetchError } = await supabase
          .from('user_cvs')
          .select('filepath')
          .eq('id', id)
          .single();
        
        if (fetchError) {
          console.error('Error fetching CV filepath:', fetchError);
        } else if (cvData && cvData.filepath) {
          // Delete file from storage
          await supabase.storage
            .from('cvs')
            .remove([cvData.filepath]);
        }
        
        // Delete the CV record from database
        const { error: dbError } = await supabase
          .from('user_cvs')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);
        
        if (dbError) throw dbError;
        
        // Check if there's a linked resume to this CV
        if (cvToResumeMap[id]) {
          // Ask the user if they want to delete the resume too
          if (confirm('Do you want to delete the resume created from this CV as well?')) {
            await fetch(`/api/resumes/${cvToResumeMap[id]}`, {
              method: 'DELETE',
            });
            
            // Remove the mapping
            const updatedMap = { ...cvToResumeMap };
            delete updatedMap[id];
            setCvToResumeMap(updatedMap);
          }
        }
      }
      
      // Update local state
      const updatedCvs = cvFiles.filter(cv => cv.id !== id);
      
      // If we deleted the selected CV, select the first one if available
      if (cvToDelete.isSelected && updatedCvs.length > 0) {
        updatedCvs[0].isSelected = true;
      }
      
      saveCvs(updatedCvs);
      
      toast({
        title: "CV deleted",
        description: `${cvToDelete.name} has been removed.`,
      });
    } catch (error) {
      console.error('Error deleting CV:', error);
      toast({
        title: "Delete failed",
        description: "There was an error deleting your CV. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle viewing a CV
  const handleViewCv = async (id: string) => {
    const cv = cvFiles.find(cv => cv.id === id);
    if (!cv) return;
    
    setViewingCv(cv);
    
    if (cv.fileUrl) {
      // For CVs with a URL, open the file
      setPreviewUrl(cv.fileUrl);
      setViewDialogOpen(true);
    } else {
      toast({
        title: "Preview Unavailable",
        description: "Preview is not available for this CV.",
        variant: "destructive",
      });
    }
  };

  // Handle viewing the related resume
  const handleViewResume = (cvId: string) => {
    const resumeId = cvToResumeMap[cvId];
    if (!resumeId) {
      toast({
        title: "No resume found",
        description: "This CV hasn't been converted to a resume yet.",
      });
      return;
    }
    
    router.push(`/dashboard/resumes/${resumeId}`);
  };

  const getSelectedCv = (): CvFile | undefined => {
    return cvFiles.find(cv => cv.isSelected);
  };

  // Determine the upload status message and styling
  const getUploadStatusInfo = () => {
    switch (uploadStatus) {
      case 'uploading':
        return {
          message: "Uploading CV...",
          color: "bg-blue-100 border-blue-300 text-blue-800"
        };
      case 'parsing':
        return {
          message: "Converting CV to resume...",
          color: "bg-indigo-100 border-indigo-300 text-indigo-800"
        };
      case 'complete':
        return {
          message: "Upload complete!",
          color: "bg-green-100 border-green-300 text-green-800"
        };
      default:
        return {
          message: "",
          color: ""
        };
    }
  };

  const statusInfo = getUploadStatusInfo();

  return (
    <Card>
      <CardHeader>
        
      </CardHeader>
      <CardContent>
        <input
          type="file"
          id="cv-upload"
          className="hidden"
          ref={fileInputRef}
          accept=".pdf,.doc,.docx,.txt"
          onChange={handleFileSelection}
        />
        
        {/* Upload button or upload progress */}
        {uploadStatus !== 'idle' ? (
          <div className={`space-y-2 mb-6 p-4 rounded-md ${statusInfo.color}`}>
            <div className="flex items-center justify-between text-sm font-medium">
              <span className="flex items-center">
                {uploadStatus === 'complete' && <CheckCircle2 className="h-4 w-4 mr-2" />}
                {statusInfo.message}
              </span>
              <span>{Math.round(uploadProgress)}%</span>
            </div>
            <Progress 
              value={uploadProgress} 
              className={uploadStatus === 'parsing' ? 'bg-indigo-200' : uploadStatus === 'complete' ? 'bg-green-200' : ''}
            />
            {uploadStatus === 'parsing' && (
              <p className="text-xs text-indigo-600 mt-1">
                We are automatically creating a resume from your CV that you can edit later.
              </p>
            )}
          </div>
        ) : (
          // Drag and drop area
          <div
            ref={dropAreaRef}
            className={`mb-6 border-2 border-dashed rounded-lg p-6 transition-colors ${
              isDragging 
                ? 'bg-primary/5 border-primary' 
                : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50'
            }`}
          >
            <div className="flex flex-col items-center justify-center text-center">
              <Upload 
                className={`h-10 w-10 mb-3 ${isDragging ? 'text-primary animate-bounce' : 'text-gray-400'}`} 
              />
              <h3 className="text-lg font-medium mb-1">Upload Resume</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Drag and drop your resume file, or click to browse
              </p>
              <div className="flex flex-col sm:flex-row gap-2 w-full max-w-md">
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                  variant="outline"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Choose File
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Supports PDF, DOC, DOCX, and TXT (max 5MB)
              </p>
            </div>
          </div>
        )}

        {/* List of uploaded CVs */}
        {isLoading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : cvFiles.length > 0 ? (
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-muted-foreground mb-2">Your Resumes ({cvFiles.length})</h3>
            <ScrollArea className="h-[300px] rounded-md border p-4">
              <div className="space-y-4">
                {cvFiles.map((cv) => (
                  <div 
                    key={cv.id}
                    className={`p-4 rounded-lg border ${cv.isSelected ? 'bg-primary/5 border-primary' : 'bg-card hover:bg-accent/50'} transition-colors`}
                  >
                    <div className="flex flex-col sm:flex-row items-start justify-between">
                      <div className="flex items-start mb-3 sm:mb-0 w-full sm:w-auto">
                        <div className={`p-2 rounded ${cv.isSelected ? 'bg-primary/10' : 'bg-secondary'} mr-3`}>
                          <FileText className={`h-5 w-5 ${cv.isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{cv.name}</h4>
                          <div className="flex flex-wrap gap-2 mt-1">
                            <p className="text-xs text-muted-foreground flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {new Date(cv.uploadDate).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(cv.size)}
                            </p>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {cv.isSelected ? (
                              <Badge variant="default" className="px-2 py-0 text-xs">
                                Selected
                              </Badge>
                            ) : (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-7 px-2 text-xs"
                                onClick={() => handleSelectCv(cv.id)}
                              >
                                Use
                              </Button>
                            )}
                            
                            {cvToResumeMap[cv.id] && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs text-blue-500"
                                onClick={() => handleViewResume(cv.id)}
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                View Resume
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1 w-full sm:w-auto justify-end">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleViewCv(cv.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteCv(cv.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        ) : (
          <div className="py-8">
            {/* Empty state with no text or icon */}
          </div>
        )}

        {/* Show info about the currently selected CV */}
        {getSelectedCv() && (
          <Alert className="mt-4 bg-primary/5 border-primary/30">
            <div className="flex items-center">
              <CheckCircle2 className="h-4 w-4 text-primary mr-2" />
              <AlertDescription className="text-sm">
                <span className="font-medium">Selected Resume:</span> {getSelectedCv()?.name}
              </AlertDescription>
            </div>
          </Alert>
        )}


       {/* CV Preview Dialog */}
       <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] w-[95vw]">
            <DialogHeader>
              <DialogTitle>CV Preview</DialogTitle>
              <DialogDescription>
                {viewingCv?.name}
              </DialogDescription>
            </DialogHeader>
            {previewUrl ? (
              <div className="w-full h-[60vh] overflow-hidden rounded-md border">
                <iframe 
                  src={previewUrl} 
                  className="w-full h-full"
                  title="CV Preview"
                />
              </div>
            ) : (
              <div className="p-8 rounded-md bg-muted min-h-[200px] flex items-center justify-center">
                <p className="text-center text-muted-foreground">
                  Preview is not available for this CV. You might want to download it to view its contents.
                </p>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-2 justify-between">
              <Button variant="outline" onClick={() => setViewDialogOpen(false)} className="order-2 sm:order-1">
                Close
              </Button>
              {cvToResumeMap[viewingCv?.id || ''] && (
                <Button 
                  onClick={() => {
                    setViewDialogOpen(false);
                    handleViewResume(viewingCv?.id || '');
                  }}
                  className="order-1 sm:order-2"
                >
                  View as Resume
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}