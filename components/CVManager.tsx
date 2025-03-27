"use client";

import { useState, useEffect, useRef } from "react";
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
  ArrowRight
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/lib/hooks/useAuth";
import { createBrowserClient } from "@/lib/supabase";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";

// Types for CV data
export interface CvFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadDate: string;
  isSelected?: boolean; // For tracking which CV is selected
}

export function CVManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const supabase = createBrowserClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // States
  const [cvFiles, setCvFiles] = useState<CvFile[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [viewingCv, setViewingCv] = useState<CvFile | null>(null);
  
  // Load saved CVs from Supabase on mount
  useEffect(() => {
    if (user) {
      fetchUserCvs();
    } else {
      // Fallback to localStorage for demo mode or when user is not logged in
      const savedCVs = localStorage.getItem('userCVs');
      if (savedCVs) {
        try {
          setCvFiles(JSON.parse(savedCVs));
        } catch (e) {
          console.error('Error parsing saved CV data', e);
        }
      }
    }
  }, [user]);

  // Fetch user CVs from Supabase
  const fetchUserCvs = async () => {
    try {
      const { data, error } = await supabase
        .from('user_cvs')
        .select('*')
        .eq('user_id', user!.id)
        .order('uploaded_at', { ascending: false });

      if (error) {
        throw error;
      }

      if (data) {
        // Convert database format to component format
        const formattedCvs: CvFile[] = data.map(cv => ({
          id: cv.id,
          name: cv.filename,
          size: cv.filesize,
          type: cv.filetype,
          uploadDate: cv.uploaded_at,
          isSelected: cv.is_selected
        }));
        
        setCvFiles(formattedCvs);
      }
    } catch (error) {
      console.error('Error fetching CVs:', error);
      // Fallback to localStorage
      const savedCVs = localStorage.getItem('userCVs');
      if (savedCVs) {
        try {
          setCvFiles(JSON.parse(savedCVs));
        } catch (e) {
          console.error('Error parsing saved CV data', e);
        }
      }
    }
  };

  // Save CVs to both Supabase and localStorage
  const saveCvs = async (updatedCvs: CvFile[]) => {
    setCvFiles(updatedCvs);
    
    // Always update localStorage as a fallback
    localStorage.setItem('userCVs', JSON.stringify(updatedCvs));
    
    // If user is logged in, update Supabase
    if (user) {
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
    }
  };

  // Handle file selection from input
  const handleFileSelection = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Validate file size (5MB max)
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Maximum file size is 5MB.",
          variant: "destructive",
        });
        return;
      }
      
      // Start upload process
      setIsUploading(true);
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
          
          // Update local state
          const newCv: CvFile = {
            id: cvRecord.id,
            name: selectedFile.name,
            size: selectedFile.size,
            type: selectedFile.type,
            uploadDate: cvRecord.uploaded_at,
            isSelected: cvFiles.length === 0
          };
          
          const updatedCvs = [...cvFiles];
          
          // If this is the first CV or it's set as selected, unselect all others
          if (newCv.isSelected) {
            updatedCvs.forEach(cv => cv.isSelected = false);
          }
          
          saveCvs([newCv, ...updatedCvs]);
          
          toast({
            title: "CV uploaded successfully",
            description: `${selectedFile.name} has been uploaded and saved to your account.`,
          });
        } catch (error) {
          console.error('Error uploading CV:', error);
          toast({
            title: "Upload failed",
            description: "There was an error uploading your CV. Please try again.",
            variant: "destructive",
          });
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
            title: "CV uploaded successfully",
            description: `${selectedFile.name} has been saved to your browser storage.`,
          });
          
          setUploadProgress(100);
        }, 1500);
      }
      
      // Clear input and reset states after complete
      setTimeout(() => {
        clearInterval(interval);
        setIsUploading(false);
        setUploadProgress(0);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 2000);
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
        // Delete from Supabase
        const { error: dbError } = await supabase
          .from('user_cvs')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);
        
        if (dbError) throw dbError;
        
        // Find the file path from the database and delete from storage
        const { data: cvData } = await supabase
          .from('user_cvs')
          .select('filepath')
          .eq('id', id)
          .single();
        
        if (cvData?.filepath) {
          await supabase.storage
            .from('cvs')
            .remove([cvData.filepath]);
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

  // Handle viewing a CV (preview would require PDF.js or similar in real implementation)
  const handleViewCv = async (id: string) => {
    if (user) {
      try {
        // Get the file URL from Supabase
        const { data, error } = await supabase
          .from('user_cvs')
          .select('file_url')
          .eq('id', id)
          .single();
        
        if (error) throw error;
        
        if (data.file_url) {
          // For a real implementation, you'd use PDF.js or a similar library
          // For this demo, we'll just open the URL in a new tab
          window.open(data.file_url, '_blank');
        }
      } catch (error) {
        console.error('Error viewing CV:', error);
        toast({
          title: "Error",
          description: "Could not retrieve the CV file. Please try again later.",
          variant: "destructive",
        });
      }
    } else {
      // For demo mode, just show a message
      const cv = cvFiles.find(cv => cv.id === id);
      setViewingCv(cv || null);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' bytes';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getSelectedCv = (): CvFile | undefined => {
    return cvFiles.find(cv => cv.isSelected);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Upload className="mr-2 h-5 w-5" />
          Manage Your CVs
        </CardTitle>
        <CardDescription>
          Upload and select which CV to use for generating cover letters
        </CardDescription>
      </CardHeader>
      <CardContent>
        <input
          type="file"
          id="cv-upload"
          className="hidden"
          ref={fileInputRef}
          accept=".pdf,.doc,.docx"
          onChange={handleFileSelection}
        />
        
       {/* Upload button or upload progress */}
{isUploading ? (
  <div className="space-y-2 mb-6">
    <div className="flex items-center justify-between text-sm">
      <span>Uploading CV...</span>
      <span>{uploadProgress}%</span>
    </div>
    <Progress value={uploadProgress} />
  </div>
) : (
  <Button 
    onClick={() => fileInputRef.current?.click()}
    className="w-full mb-6"
    variant="outline"
  >
    <Plus className="mr-2 h-4 w-4" />
    Upload New CV
  </Button>
)}

{/* List of uploaded CVs */}
{cvFiles.length > 0 ? (
  <div className="space-y-4">
    <h3 className="font-medium text-sm text-muted-foreground mb-2">Your CVs ({cvFiles.length})</h3>
    <ScrollArea className="h-[300px] rounded-md border p-4">
      <div className="space-y-4">
        {cvFiles.map((cv) => (
          <div 
            key={cv.id}
            className={`p-4 rounded-lg border ${cv.isSelected ? 'bg-primary/5 border-primary' : 'bg-card hover:bg-accent/50'} transition-colors`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start">
                <div className={`p-2 rounded ${cv.isSelected ? 'bg-primary/10' : 'bg-secondary'} mr-3`}>
                  <FileText className={`h-5 w-5 ${cv.isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <div>
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
                  <div className="mt-2">
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
                        Select
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-1">
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
  <div className="text-center py-8">
    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-60" />
    <h3 className="text-lg font-medium mb-2">No CVs uploaded</h3>
    <p className="text-muted-foreground mb-4">
      Upload your CV to enhance your cover letter generation.
    </p>
    <Button 
      onClick={() => fileInputRef.current?.click()}
      className="flex items-center"
    >
      <Upload className="mr-2 h-4 w-4" />
      Upload CV
    </Button>
  </div>
)}

{/* Show info about the currently selected CV */}
{getSelectedCv() && (
  <Alert className="mt-4 bg-primary/5 border-primary/30">
    <div className="flex items-center">
      <CheckCircle2 className="h-4 w-4 text-primary mr-2" />
      <AlertDescription className="text-sm">
        <span className="font-medium">Selected CV:</span> {getSelectedCv()?.name}
      </AlertDescription>
    </div>
  </Alert>
)}

{/* CV Preview Dialog */}
<Dialog>
  <DialogContent className="max-w-xl">
    <DialogHeader>
      <DialogTitle>CV Preview</DialogTitle>
      <DialogDescription>
        {viewingCv?.name}
      </DialogDescription>
    </DialogHeader>
    <div className="p-4 rounded-md bg-muted min-h-[200px] flex items-center justify-center">
      <p className="text-center text-muted-foreground">
        In a production environment, this would display a preview of your CV using PDF.js or similar technology.
        <br /><br />
        For now, you can see the CV details:
        <br />
        Filename: {viewingCv?.name}
        <br />
        Size: {viewingCv ? formatFileSize(viewingCv.size) : ''}
        <br />
        Uploaded: {viewingCv ? new Date(viewingCv.uploadDate).toLocaleString() : ''}
      </p>
    </div>
  </DialogContent>
</Dialog>
</CardContent>
    </Card>
  );
}