"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/hooks/useAuth";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ResumeData, ResumeTemplate } from "@/types/resume";
import { createBrowserClient } from "@/lib/supabase";
import { X } from 'lucide-react';

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

// Icons
import { Save, Download, Upload, FileText, CheckCircle2, Info, ExternalLink, AlertCircle, EyeIcon } from 'lucide-react';

interface ResumeBuilderProps {
  initialData?: ResumeData;
  resumeId?: string;
}

const ResumeBuilder: React.FC<ResumeBuilderProps> = ({ initialData, resumeId }) => {
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [activeTab, setActiveTab] = useState("personal-info");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<ResumeTemplate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [availableTemplates, setAvailableTemplates] = useState<ResumeTemplate[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importedSections, setImportedSections] = useState<string[]>([]);
  const [showImportAlert, setShowImportAlert] = useState(false);
  
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createBrowserClient();
  const importFileRef = useRef<HTMLInputElement>(null);
  
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
          setResumeData(data);
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
            hobbies: [],
            internships: [],
            references: [],
            referenceText: "References available upon request",
            customSections: [],
            templateId: '',
            isPublic: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
        
        // Load templates
        const { data: templates, error: templatesError } = await supabase
          .from('resume_templates')
          .select('*')
          .order('name');
        
        if (templatesError) throw templatesError;
        
        setAvailableTemplates(templates || []);
        
        // Set default template if none selected
        if (templates && templates.length > 0) {
          const templateId = initialData?.templateId || templates[0].id;
          const template = templates.find(t => t.id === templateId) || templates[0];
          setSelectedTemplate(template);
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
      updatedAt: new Date().toISOString()
    });
  };
  
  // Save resume to database
  const saveResume = async () => {
    if (!resumeData) return;
    
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
      
      // Ensure userId and templateId are set
      const dataToSave = {
        ...resumeData,
        userId: user.id,
        templateId: selectedTemplate?.id || resumeData.templateId,
        updatedAt: new Date().toISOString()
      };
      
      let result;
      
      if (resumeId) {
        // Update existing resume
        result = await supabase
          .from('resumes')
          .update(dataToSave)
          .eq('id', resumeId)
          .select();
      } else {
        // Insert new resume
        result = await supabase
          .from('resumes')
          .insert(dataToSave)
          .select();
      }
      
      if (result.error) throw result.error;
      
      // Clear the import alert after successful save
      setShowImportAlert(false);
      setImportedSections([]);
      
      toast({
        title: "Success",
        description: "Your resume has been saved successfully.",
      });
      
      // Update local state with any data returned from the server
      if (result.data && result.data[0]) {
        setResumeData(result.data[0]);
        
        // If this is a new resume, redirect to the edit page
        if (!resumeId) {
          router.push(`/dashboard/resumes/${result.data[0].id}`);
        }
      }
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
  
  // Export resume in selected format
  const exportResume = async (format: 'pdf' | 'docx' | 'txt') => {
    if (!resumeData || !selectedTemplate) return;
    
    try {
      setError(null);
      
      const response = await fetch('/api/resumes/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeId: resumeData.id,
          templateId: selectedTemplate.id,
          format,
          filename: `${resumeData.personalInfo.firstName}-${resumeData.personalInfo.lastName}-Resume`
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Export failed');
      }
      
      // Create a blob from the response
      const blob = await response.blob();
      
      // Create a link to download the file
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${resumeData.personalInfo.firstName}-${resumeData.personalInfo.lastName}-Resume.${format}`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Export Successful",
        description: `Your resume has been exported as ${format.toUpperCase()}.`,
      });
    } catch (err: any) {
      console.error('Error exporting resume:', err);
      toast({
        title: "Export Failed",
        description: err.message || "Failed to export resume. Please try again.",
        variant: "destructive",
      });
    }
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
        if (parsedData.hobbies?.length) importedSectionsArray.push('hobbies');
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
          hobbies: parsedData.hobbies || prev.hobbies,
          internships: parsedData.internships || prev.internships, 
          references: parsedData.references || prev.references,
          referenceText: parsedData.referenceText || prev.referenceText,
          customSections: updatedCustomSections,
          updatedAt: new Date().toISOString()
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
        else if (firstSection === 'hobbies') setActiveTab('hobbies');
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
    
    // Call save with this new data
    await saveResume();
  };
  
  // Function to preview imported resume
  const previewImportedResume = () => {
    // Use the document's fullscreen API to show the preview iframe in fullscreen
    document.getElementById('preview-iframe')?.requestFullscreen();
  };
  
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="flex justify-center items-center py-8">
          <LoadingSpinner />
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="py-8">
          <Alert variant="destructive">
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
          <div className="mt-4 flex justify-center">
            <Button onClick={() => router.back()}>Go Back</Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!resumeData) {
    return (
      <Card className="w-full">
        <CardContent className="py-8">
          <Alert>
            <AlertDescription>
              No resume data available. Please create a new resume.
            </AlertDescription>
          </Alert>
          <div className="mt-4 flex justify-center">
            <Button onClick={() => router.push('/dashboard/resumes/new')}>Create New Resume</Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold">{resumeId ? 'Edit Resume' : 'Create Resume'}</h2>
          <p className="text-muted-foreground">Build your professional resume with our easy-to-use editor</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => importFileRef.current?.click()}
            disabled={isImporting}
          >
            {isImporting ? (
              <>
                <LoadingSpinner className="mr-2" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Import
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
          
          <Button
            variant="outline"
            onClick={() => exportResume('pdf')}
            disabled={!resumeData.personalInfo.firstName}
          >
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          
          <Button
            onClick={saveResume}
            disabled={isSaving || !resumeData.personalInfo.firstName}
          >
            {isSaving ? <LoadingSpinner className="mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save Resume
          </Button>
        </div>
      </div>
      
      {/* Import Alert Banner */}
      {showImportAlert && importedSections.length > 0 && (
        <Alert className="bg-green-50 border-green-200 text-green-800">
          <AlertCircle className="h-5 w-5 text-green-500" />
          <AlertTitle className="text-green-800 font-medium">Resume Imported Successfully!</AlertTitle>
          <AlertDescription className="text-green-700">
            <p className="mt-1">The following sections were imported from your resume:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              {importedSections.includes('personalInfo') && <li>Personal Information</li>}
              {importedSections.includes('workExperience') && <li>Work Experience</li>}
              {importedSections.includes('education') && <li>Education</li>}
              {importedSections.includes('skills') && <li>Skills</li>}
              {importedSections.includes('projects') && <li>Projects</li>}
              {importedSections.includes('languages') && <li>Languages</li>}
              {importedSections.includes('certifications') && <li>Certifications</li>}
              {importedSections.includes('hobbies') && <li>Hobbies</li>}
              {importedSections.includes('internships') && <li>Internships</li>}
              {importedSections.includes('references') && <li>References</li>}
              {importedSections.includes('customSections') && <li>Custom Sections</li>}
            </ul>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button onClick={saveImportedResume} variant="outline" className="bg-white">
                <Save className="h-4 w-4 mr-2" />
                Save as New Resume
              </Button>
              <Button onClick={previewImportedResume} variant="outline" className="bg-white">
                <EyeIcon className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button onClick={() => setShowImportAlert(false)} variant="ghost" className="text-green-700">
                <X className="h-4 w-4 mr-2" />
                Dismiss
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Resume Details</CardTitle>
            </CardHeader>
            
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="px-6">
                <TabsList className="w-full overflow-x-auto flex-nowrap h-auto py-1 justify-start">
                  <TabsTrigger value="personal-info" className={`whitespace-nowrap ${importedSections.includes('personalInfo') ? 'ring-2 ring-green-500 bg-green-50' : ''}`}>
                    Personal Info
                    {importedSections.includes('personalInfo') && <CheckCircle2 className="h-3 w-3 ml-1 text-green-500" />}
                  </TabsTrigger>
                  <TabsTrigger value="work-experience" className={`whitespace-nowrap ${importedSections.includes('workExperience') ? 'ring-2 ring-green-500 bg-green-50' : ''}`}>
                    Work Experience
                    {importedSections.includes('workExperience') && <CheckCircle2 className="h-3 w-3 ml-1 text-green-500" />}
                  </TabsTrigger>
                  <TabsTrigger value="education" className={`whitespace-nowrap ${importedSections.includes('education') ? 'ring-2 ring-green-500 bg-green-50' : ''}`}>
                    Education
                    {importedSections.includes('education') && <CheckCircle2 className="h-3 w-3 ml-1 text-green-500" />}
                  </TabsTrigger>
                  <TabsTrigger value="skills" className={`whitespace-nowrap ${importedSections.includes('skills') ? 'ring-2 ring-green-500 bg-green-50' : ''}`}>
                    Skills
                    {importedSections.includes('skills') && <CheckCircle2 className="h-3 w-3 ml-1 text-green-500" />}
                  </TabsTrigger>
                  <TabsTrigger value="projects" className={`whitespace-nowrap ${importedSections.includes('projects') ? 'ring-2 ring-green-500 bg-green-50' : ''}`}>
                    Projects
                    {importedSections.includes('projects') && <CheckCircle2 className="h-3 w-3 ml-1 text-green-500" />}
                  </TabsTrigger>
                  <TabsTrigger value="certifications" className={`whitespace-nowrap ${importedSections.includes('certifications') ? 'ring-2 ring-green-500 bg-green-50' : ''}`}>
                    Certifications
                    {importedSections.includes('certifications') && <CheckCircle2 className="h-3 w-3 ml-1 text-green-500" />}
                  </TabsTrigger>
                  <TabsTrigger value="languages" className={`whitespace-nowrap ${importedSections.includes('languages') ? 'ring-2 ring-green-500 bg-green-50' : ''}`}>
                    Languages
                    {importedSections.includes('languages') && <CheckCircle2 className="h-3 w-3 ml-1 text-green-500" />}
                  </TabsTrigger>
                  <TabsTrigger value="hobbies" className={`whitespace-nowrap ${importedSections.includes('hobbies') ? 'ring-2 ring-green-500 bg-green-50' : ''}`}>
                    Hobbies
                    {importedSections.includes('hobbies') && <CheckCircle2 className="h-3 w-3 ml-1 text-green-500" />}
                  </TabsTrigger>
                  <TabsTrigger value="internships" className={`whitespace-nowrap ${importedSections.includes('internships') ? 'ring-2 ring-green-500 bg-green-50' : ''}`}>
                    Internships
                    {importedSections.includes('internships') && <CheckCircle2 className="h-3 w-3 ml-1 text-green-500" />}
                  </TabsTrigger>
                  <TabsTrigger value="references" className={`whitespace-nowrap ${importedSections.includes('references') ? 'ring-2 ring-green-500 bg-green-50' : ''}`}>
                    References
                    {importedSections.includes('references') && <CheckCircle2 className="h-3 w-3 ml-1 text-green-500" />}
                  </TabsTrigger>
                  <TabsTrigger value="custom" className={`whitespace-nowrap ${importedSections.includes('customSections') ? 'ring-2 ring-green-500 bg-green-50' : ''}`}>
                    Custom
                    {importedSections.includes('customSections') && <CheckCircle2 className="h-3 w-3 ml-1 text-green-500" />}
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <CardContent className="pt-6">
                <TabsContent value="personal-info">
                  <PersonalInfoSection 
                    data={resumeData.personalInfo} 
                    onChange={(data) => updateSection('personalInfo', data)} 
                    isHighlighted={importedSections.includes('personalInfo')}
                  />
                </TabsContent>
                
                <TabsContent value="work-experience">
                  <WorkExperienceSection 
                    data={resumeData.workExperience} 
                    onChange={(data) => updateSection('workExperience', data)}
                  />
                </TabsContent>
                
                <TabsContent value="education">
                  <EducationSection 
                    data={resumeData.education} 
                    onChange={(data) => updateSection('education', data)}
                  />
                </TabsContent>
                
                <TabsContent value="skills">
                  <SkillsSection 
                    data={resumeData.skills} 
                    onChange={(data) => updateSection('skills', data)}
                  />
                </TabsContent>
                
                <TabsContent value="projects">
                  <ProjectsSection 
                    data={resumeData.projects || []} 
                    onChange={(data) => updateSection('projects', data)}
                  />
                </TabsContent>
                
                <TabsContent value="certifications">
                  <CertificationsSection 
                    data={resumeData.certifications || []} 
                    onChange={(data) => updateSection('certifications', data)}
                  />
                </TabsContent>
                
                <TabsContent value="languages">
                  <LanguagesSection 
                    data={resumeData.languages || []} 
                    onChange={(data) => updateSection('languages', data)}
                  />
                </TabsContent>
                
                <TabsContent value="hobbies">
                  <HobbiesSection 
                    data={resumeData.hobbies || []} 
                    onChange={(data) => updateSection('hobbies', data)}
                    useStructured={false} // Set to true if you want to use structured hobby objects
                  />
                </TabsContent>
                
                <TabsContent value="internships">
                <InternshipsSection 
                  data={resumeData.internships as any} // Use type casting to bypass the type check
                  onChange={(data) => updateSection('internships', data)}
                />
                </TabsContent>
                
                <TabsContent value="references">
                  <ReferencesSection 
                    data={resumeData.references || []} 
                    onChange={(data) => updateSection('references', data)}
                    generalStatement={resumeData.referenceText || "References available upon request"}
                    onStatementChange={(statement) => {
                      if (resumeData) {
                        setResumeData({
                          ...resumeData,
                          referenceText: statement,
                          updatedAt: new Date().toISOString()
                        });
                      }
                    }}
                    enableStatement={true}
                  />
                </TabsContent>
                
                <TabsContent value="custom">
                  <CustomSection 
                    data={resumeData.customSections || []} 
                    onChange={(data) => updateSection('customSections', data)}
                  />
                </TabsContent>
              </CardContent>
            </Tabs>
            
            <CardFooter className="flex justify-between border-t p-6">
              <div className="flex items-center">
                <Info className="h-4 w-4 text-blue-500 mr-2" />
                <span className="text-sm text-muted-foreground">
                  Do not forget to save your changes
                </span>
              </div>
              
              <Button onClick={saveResume} disabled={isSaving}>
                {isSaving ? <LoadingSpinner className="mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Save
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        <div className="lg:col-span-1 space-y-6">
          {/* Preview Card */}
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <ResumePreview 
                resume={resumeData} 
                template={selectedTemplate}
              />
            </CardContent>
            <CardFooter className="border-t pt-4">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => document.getElementById('preview-iframe')?.requestFullscreen()}
              >
                <FileText className="h-4 w-4 mr-2" />
                Full Preview
              </Button>
            </CardFooter>
          </Card>
          
          {/* Templates Card */}
          <Card>
            <CardHeader>
              <CardTitle>Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <ResumeTemplateBrowser 
                templates={availableTemplates}
                selectedTemplate={selectedTemplate}
                onSelectTemplate={setSelectedTemplate}
              />
            </CardContent>
            <CardFooter className="border-t pt-4 flex justify-between">
              <Button 
                variant="link" 
                className="px-0"
                onClick={() => router.push('/dashboard/resumes/templates')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Browse more templates
              </Button>
            </CardFooter>
          </Card>
          
          {/* Export Options Card */}
          <Card>
            <CardHeader>
              <CardTitle>Export Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => exportResume('pdf')}
                disabled={!resumeData.personalInfo.firstName}
              >
                <Download className="h-4 w-4 mr-2" />
                Export as PDF
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => exportResume('docx')}
                disabled={!resumeData.personalInfo.firstName}
              >
                <Download className="h-4 w-4 mr-2" />
                Export as Word Document
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => exportResume('txt')}
                disabled={!resumeData.personalInfo.firstName}
              >
                <Download className="h-4 w-4 mr-2" />
                Export as Plain Text
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ResumeBuilder;