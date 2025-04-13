"use client";

import { useState, useEffect, useTransition } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  Linkedin, 
  FileSpreadsheet, 
  ArrowRightCircle,
  AlertCircle,
  Loader2,
  BadgeCheck
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CvFile } from '@/components/CVManager';
import { LinkedInProfile } from "@/components/LinkedInManager";
import { LinkedInResumeSelector } from "./LinkedInResumeSelector";
import { useToast } from "@/hooks/use-toast";
import { createBrowserClient } from "@/lib/supabase";
import { useLinkedInIntegration } from "@/lib/hooks/useLinkedInIntegration";

interface DataSource {
  id: string;
  type: 'cv' | 'linkedin' | 'custom';
  name: string;
  description?: string;
  selected?: boolean;
  metadata?: any;
}

export interface EnhancedDataSourceSelectorProps {
  cvFiles: CvFile[];
  linkedInProfile: LinkedInProfile | null;
  // Using string literals for action names instead of function props
  actionType?: string;
}

export function EnhancedDataSourceSelector({
  cvFiles,
  linkedInProfile,
  actionType = 'default'
}: EnhancedDataSourceSelectorProps) {
  const [activeTab, setActiveTab] = useState("cv");
  const [selectedSource, setSelectedSource] = useState<DataSource | null>(null);
  const [cvSources, setCvSources] = useState<DataSource[]>([]);
  const [linkedinSources, setLinkedinSources] = useState<DataSource[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showLinkedInSelector, setShowLinkedInSelector] = useState(false);
  const [selectedResumeData, setSelectedResumeData] = useState<any>(null);
  const [selectedDataSource, setSelectedDataSource] = useState<'cv' | 'linkedin' | 'both' | 'none'>('none');
  const [isPending, startTransition] = useTransition();
  
  const { toast } = useToast();
  const supabase = createBrowserClient();
  const { isConnected } = useLinkedInIntegration();

  // Event handler for data source change - dispatches a custom event instead of using props
  const handleDataSourceChange = (source: 'cv' | 'linkedin' | 'both' | 'none', resumeData?: any) => {
    setSelectedDataSource(source);
    
    // Dispatch a custom event that can be listened to by parent components
    const event = new CustomEvent('dataSourceSelected', {
      detail: {
        source,
        resumeData
      },
      bubbles: true
    });
    document.dispatchEvent(event);
  };

  // Event handler for creating cover letter - dispatches a custom event
  const handleCreateCoverLetter = () => {
    if (!selectedSource) {
      toast({
        title: "No data source selected",
        description: "Please select a CV or LinkedIn profile to continue.",
        variant: "destructive",
      });
      return;
    }
    
    // If LinkedIn is selected but we don't have resume data
    if (selectedSource.type === 'linkedin' && !selectedResumeData) {
      setShowLinkedInSelector(true);
      return;
    }

    setIsLoading(true);
    
    // Dispatch a custom event that can be listened to by parent components
    const event = new CustomEvent('createCoverLetter', {
      detail: {
        source: selectedDataSource,
        data: selectedSource.type === 'linkedin' ? selectedResumeData : selectedSource.metadata
      },
      bubbles: true
    });
    document.dispatchEvent(event);
    
    // In a real component, we might want to reset loading state after some time
    // or wait for another event to know the operation completed
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  // Prepare CV sources
  useEffect(() => {
    const sources: DataSource[] = cvFiles
      .filter(cv => cv.isSelected)
      .map(cv => ({
        id: cv.id,
        type: 'cv',
        name: cv.name,
        description: `Uploaded ${new Date(cv.uploadDate).toLocaleDateString()}`,
        selected: false,
        metadata: cv
      }));
    
    setCvSources(sources);
    
    // Auto-select the first CV if available and no source is selected
    if (sources.length > 0 && !selectedSource) {
      setSelectedSource(sources[0]);
      sources[0].selected = true;
    }
  }, [cvFiles, selectedSource]);

  // Prepare LinkedIn sources
  useEffect(() => {
    const sources: DataSource[] = [];
    
    if (linkedInProfile && linkedInProfile.status === 'connected') {
      sources.push({
        id: linkedInProfile.id,
        type: 'linkedin',
        name: linkedInProfile.name || 'LinkedIn Profile',
        description: linkedInProfile.headline || 'Connected LinkedIn Profile',
        selected: false,
        metadata: linkedInProfile
      });
    }
    
    setLinkedinSources(sources);
    
    // Auto-select LinkedIn if it's the only option and no CV is selected
    if (sources.length > 0 && cvSources.length === 0 && !selectedSource) {
      setSelectedSource(sources[0]);
      sources[0].selected = true;
    }
  }, [linkedInProfile, cvSources.length, selectedSource]);

  // Handle source selection
  const handleSelectSource = (source: DataSource) => {
    startTransition(() => {
      setSelectedSource(source);
      
      if (source.type === 'cv') {
        handleDataSourceChange('cv', source.metadata);
      } else if (source.type === 'linkedin') {
        if (selectedResumeData) {
          handleDataSourceChange('linkedin', selectedResumeData);
        } else {
          // Show LinkedIn resume selector if we don't have resume data yet
          setShowLinkedInSelector(true);
        }
      }
    });
  };

  // Handle LinkedIn resume selection
  const handleLinkedInResumeSelected = (resumeId: string, resumeData: any) => {
    setShowLinkedInSelector(false);
    setSelectedResumeData(resumeData);
    
    // Update the selected source with resume data
    if (selectedSource && selectedSource.type === 'linkedin') {
      const updatedSource = {
        ...selectedSource,
        description: `Resume from LinkedIn profile`,
        metadata: {
          ...selectedSource.metadata,
          resumeId: resumeId,
          resumeData: resumeData
        }
      };
      setSelectedSource(updatedSource);
      handleDataSourceChange('linkedin', resumeData);
    }
  };

  return (
    <>
      {showLinkedInSelector ? (
        <LinkedInResumeSelector 
          onSelect={handleLinkedInResumeSelected}
          onCancel={() => setShowLinkedInSelector(false)}
        />
      ) : (
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-xl flex items-center">
              <FileSpreadsheet className="mr-2 h-5 w-5 text-primary" />
              Select Resume Information Source
            </CardTitle>
            <CardDescription>
              Choose which source to use for your cover letter
            </CardDescription>
          </CardHeader>
          <CardContent>
            {cvSources.length === 0 && linkedinSources.length === 0 ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4 mr-2" />
                <AlertDescription>
                  No data sources available. Please upload a CV or connect your LinkedIn profile first.
                </AlertDescription>
              </Alert>
            ) : (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="cv" className="flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    Resume/CV
                    {cvSources.length > 0 && (
                      <span className="ml-2 bg-primary/10 text-primary text-xs font-medium rounded-full px-2 py-0.5">
                        {cvSources.length}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="linkedin" className="flex items-center">
                    <Linkedin className="h-4 w-4 mr-2" />
                    LinkedIn
                    {linkedinSources.length > 0 && (
                      <span className="ml-2 bg-blue-100 text-blue-700 text-xs font-medium rounded-full px-2 py-0.5">
                        {linkedinSources.length}
                      </span>
                    )}
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="cv" className="mt-6">
                  {cvSources.length > 0 ? (
                    <RadioGroup defaultValue={selectedSource?.id}>
                      <div className="space-y-4">
                        {cvSources.map((source) => (
                          <div 
                            key={source.id} 
                            className={`border p-4 rounded-lg flex items-start cursor-pointer transition-colors ${selectedSource?.id === source.id ? 'border-primary bg-primary/5' : 'hover:border-primary/50'}`}
                            onClick={() => handleSelectSource(source)}
                          >
                            <RadioGroupItem value={source.id} id={`cv-${source.id}`} className="mt-1" />
                            <div className="ml-3">
                              <Label htmlFor={`cv-${source.id}`} className="text-base font-medium cursor-pointer">
                                {source.name}
                              </Label>
                              <p className="text-sm text-muted-foreground">{source.description}</p>
                              {selectedSource?.id === source.id && (
                                <div className="bg-primary/10 text-primary text-xs px-2 py-1 rounded flex items-center mt-2 w-fit">
                                  <BadgeCheck className="h-3 w-3 mr-1" />
                                  Selected for cover letter
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </RadioGroup>
                  ) : (
                    <div className="text-center py-12">
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                      <h3 className="font-medium text-lg mb-2">No CV or resume uploaded</h3>
                      <p className="text-muted-foreground mb-4">
                        Please upload a CV to use as a source for your cover letter.
                      </p>
                      <Button variant="outline" onClick={() => setActiveTab("linkedin")}>
                        Use LinkedIn Instead
                      </Button>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="linkedin" className="mt-6">
                  {linkedinSources.length > 0 ? (
                    <>
                      <RadioGroup defaultValue={selectedSource?.id}>
                        <div className="space-y-4">
                          {linkedinSources.map((source) => (
                            <div 
                              key={source.id} 
                              className={`border p-4 rounded-lg flex items-start cursor-pointer transition-colors ${selectedSource?.id === source.id ? 'border-blue-500 bg-blue-50/50' : 'hover:border-blue-300'}`}
                              onClick={() => handleSelectSource(source)}
                            >
                              <RadioGroupItem value={source.id} id={`linkedin-${source.id}`} className="mt-1" />
                              <div className="ml-3">
                                <Label htmlFor={`linkedin-${source.id}`} className="text-base font-medium cursor-pointer">
                                  {source.name}
                                </Label>
                                <p className="text-sm text-muted-foreground">{source.description}</p>
                                {source.metadata?.resumeId && (
                                  <div className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded flex items-center mt-2 w-fit">
                                    <BadgeCheck className="h-3 w-3 mr-1" />
                                    Resume from LinkedIn already created
                                  </div>
                                )}
                                {selectedSource?.id === source.id && !selectedResumeData && (
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="mt-3 text-xs border-blue-200 text-blue-600"
                                    onClick={() => setShowLinkedInSelector(true)}
                                  >
                                    Select LinkedIn Resume
                                  </Button>
                                )}
                                {selectedSource?.id === source.id && selectedResumeData && (
                                  <div className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded flex items-center mt-2 w-fit">
                                    <BadgeCheck className="h-3 w-3 mr-1" />
                                    LinkedIn resume selected
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </RadioGroup>
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <Linkedin className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                      <h3 className="font-medium text-lg mb-2">LinkedIn not connected</h3>
                      <p className="text-muted-foreground mb-4">
                        Connect your LinkedIn profile to use it as a source for your cover letter.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Button 
                          variant="default" 
                          className="bg-blue-600 hover:bg-blue-700"
                          onClick={() => setShowLinkedInSelector(true)}
                        >
                          <Linkedin className="mr-2 h-4 w-4" />
                          Connect LinkedIn
                        </Button>
                        {cvSources.length > 0 && (
                          <Button variant="outline" onClick={() => setActiveTab("cv")}>
                            Use CV Instead
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              disabled={!selectedSource || isPending}
              onClick={handleCreateCoverLetter}
              className="ml-auto"
            >
              {isLoading || isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  Create Cover Letter
                  <ArrowRightCircle className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      )}
    </>
  );
}