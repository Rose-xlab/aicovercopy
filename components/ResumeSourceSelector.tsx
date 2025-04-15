// components/ResumeSourceSelector.tsx
"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    FileText, Linkedin, FileSpreadsheet, ArrowRightCircle,
    AlertCircle, Loader2, BadgeCheck, Calendar, Eye // Added Eye
} from "lucide-react";
// FIXED: Import Alert and AlertTitle
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import type { CvFile } from '@/components/CVManager';
import { LinkedInResumeSelector } from "./LinkedInResumeSelector";
import { useToast } from "@/hooks/use-toast";
import { createBrowserClient } from "@/lib/supabase";
// FIXED: Import useAuth
import { useAuth } from "@/lib/hooks/useAuth";
import { useLinkedInIntegration } from "@/lib/hooks/useLinkedInIntegration";
import { Database } from "@/types/supabase";
import { formatDistance } from "date-fns"; // Import if used, like in previous version
import { format } from "date-fns"; // Import if used
import { Badge } from "@/components/ui/badge"; // Import if used
import { Separator } from "@/components/ui/separator"; // Import if used
import { Skeleton } from "@/components/ui/skeleton";
// FIXED: Import LoadingSpinner
import { LoadingSpinner } from "@/components/LoadingSpinner";
// FIXED: Import useRouter
import { useRouter } from "next/navigation";


// Define types based on Supabase schema
type DbLinkedInProfile = Database['public']['Tables']['linkedin_profiles']['Row'];
type DbResume = Database['public']['Tables']['resumes']['Row'];

// Internal type for managing selection state in the UI
interface DataSource {
    id: string;
    type: 'cv' | 'linkedin';
    name: string;
    description?: string;
    selected?: boolean;
    metadata?: CvFile | DbLinkedInProfile | null;
}

// Define the expected type for the resume data selected via LinkedInResumeSelector
type SelectedLinkedInResumeType = DbResume;

export interface ResumeSourceSelectorProps { // Renamed interface for clarity
    cvFiles: CvFile[];
    linkedInProfile: DbLinkedInProfile | null;
    // Prop callback for when a final data source is selected
    // For Prop Serialization Warning (ts 71007): Ensure the function passed here
    // from the parent component is wrapped in useCallback.
    onDataSourceSelected: (sourceType: 'cv' | 'linkedin' | 'none', data: CvFile | SelectedLinkedInResumeType | null) => void;
}

export function ResumeSourceSelector({ // Renamed component export
    cvFiles,
    linkedInProfile,
    onDataSourceSelected
}: ResumeSourceSelectorProps) {

    const [activeTab, setActiveTab] = useState<string>("cv");
    const [selectedSource, setSelectedSource] = useState<DataSource | null>(null);
    const [cvSources, setCvSources] = useState<DataSource[]>([]);
    const [linkedinSources, setLinkedinSources] = useState<DataSource[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showLinkedInSelector, setShowLinkedInSelector] = useState(false);
    const [selectedResumeData, setSelectedResumeData] = useState<SelectedLinkedInResumeType | null>(null);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const { toast } = useToast();
    const supabase = createBrowserClient();
    const { user } = useAuth(); // FIXED: Initialize useAuth
    const router = useRouter(); // FIXED: Initialize useRouter
    // FIXED: Destructure isConnecting
    const { isConnected, connectLinkedIn, generateResume, isLoading: isHookLoading, isGenerating: isHookGenerating, isConnecting } = useLinkedInIntegration();

    // Set default active tab based on available sources only once
     useEffect(() => {
         const hasAnyCv = cvFiles.length > 0; // Check if any CVs exist at all
         const hasConnectedLi = linkedInProfile?.status === 'connected';
         if (hasAnyCv) {
             setActiveTab("cv");
         } else if (hasConnectedLi) {
             setActiveTab("linkedin");
         } else {
             setActiveTab("cv"); // Default fallback
         }
     }, []); // Run only once on mount, don't depend on cvFiles/linkedInProfile changing later


    // Prepare CV sources from props
    useEffect(() => {
        // Map all CV files passed down, mark selection based on current selectedSource state
        const sources: DataSource[] = cvFiles.map(cv => ({
            id: cv.id, type: 'cv', name: cv.name,
            description: `Uploaded ${new Date(cv.uploadDate).toLocaleDateString()}`,
            selected: selectedSource?.id === cv.id && selectedSource?.type === 'cv',
            metadata: cv
        }));
        setCvSources(sources);

        // Auto-select logic removed from here, handled by parent or initial state if needed
        // Check if the currently selected source (if it's a CV) still exists in the updated cvFiles prop
        if (selectedSource?.type === 'cv' && !sources.some(s => s.id === selectedSource.id)) {
             setSelectedSource(null);
             onDataSourceSelected('none', null);
        }

    }, [cvFiles, selectedSource, onDataSourceSelected]); // Rerun when files or selection change


    // Prepare LinkedIn source from props
    useEffect(() => {
        const sources: DataSource[] = [];
        if (linkedInProfile?.status === 'connected') {
            sources.push({
                id: linkedInProfile.id, type: 'linkedin', name: linkedInProfile.name || 'LinkedIn Profile',
                description: linkedInProfile.headline || 'Connected LinkedIn Profile',
                selected: selectedSource?.id === linkedInProfile.id && selectedSource?.type === 'linkedin',
                metadata: linkedInProfile
            });
        }
        setLinkedinSources(sources);

         // Clear selection if LinkedIn source disappears
         if (sources.length === 0 && selectedSource?.type === 'linkedin') {
             setSelectedSource(null);
             setSelectedResumeData(null);
             onDataSourceSelected('none', null);
        }
        // Auto-select logic removed from here
    }, [linkedInProfile, selectedSource, onDataSourceSelected]);


    // Handle source selection from RadioGroup click
    const handleSelectSource = useCallback((source: DataSource) => {
        startTransition(() => {
            setSelectedSource({ ...source, selected: true });
            setSelectedResumeData(null);
            if (source.type === 'cv') {
                onDataSourceSelected('cv', source.metadata as CvFile);
                setShowLinkedInSelector(false);
            } else if (source.type === 'linkedin') {
                setShowLinkedInSelector(true);
                onDataSourceSelected('none', null);
            }
        });
    }, [onDataSourceSelected]);

    // Handle LinkedIn resume selection FROM the LinkedInResumeSelector component
    const handleLinkedInResumeSelected = useCallback((resumeId: string, resumeData: SelectedLinkedInResumeType) => {
        setShowLinkedInSelector(false);
        setSelectedResumeData(resumeData);
        if (selectedSource?.type === 'linkedin') {
             setSelectedSource(prev => prev ? { ...prev, description: `Using Resume: ${resumeData.title || `ID ${resumeId.substring(0,6)}...`}` } : null);
        }
        onDataSourceSelected('linkedin', resumeData);
    }, [onDataSourceSelected, selectedSource]);

    // Cancel from LinkedInResumeSelector
    const handleLinkedInResumeCancel = useCallback(() => { setShowLinkedInSelector(false); }, []);

    // --- Render Logic ---

    if (showLinkedInSelector) {
        return ( <LinkedInResumeSelector onSelect={handleLinkedInResumeSelected} onCancel={handleLinkedInResumeCancel} /> );
    }

    // Loading state while fetching initial list
    if (isLoading && cvSources.length === 0 && linkedinSources.length === 0) {
        return (
            <Card className="w-full">
                <CardContent className="flex justify-center items-center p-12">
                    {/* FIXED: Use imported LoadingSpinner */}
                    <LoadingSpinner className="mr-2" /><span>Loading data sources...</span>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="text-xl flex items-center">
                    <FileSpreadsheet className="mr-2 h-5 w-5 text-primary" /> Select Data Source
                </CardTitle>
                <CardDescription>Choose the information source for your cover letter.</CardDescription>
            </CardHeader>
            <CardContent>
                {(cvSources.length === 0 && linkedinSources.length === 0 && !isConnected) ? (
                     <div className="text-center py-8">
                        <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                         <h3 className="font-medium text-lg mb-2">No Data Sources Found</h3>
                         <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                             Please upload a CV or connect your LinkedIn profile to generate a cover letter.
                         </p>
                         <div className="flex flex-col sm:flex-row gap-3 justify-center">
                               {/* FIXED: Use router from useRouter hook */}
                               <Button onClick={() => router.push('/dashboard/resumes')}>Manage Resumes/CVs</Button>
                               {/* FIXED: Use isConnecting state from hook */}
                               <Button variant="outline" onClick={connectLinkedIn} disabled={isConnecting}>
                                   {/* FIXED: Use imported LoadingSpinner */}
                                   {isConnecting ? <LoadingSpinner/> : <Linkedin className="mr-2 h-4 w-4" /> }
                                   {/* FIXED: Use isConnecting state */}
                                   {isConnecting ? 'Connecting...' : 'Connect LinkedIn'}
                               </Button>
                          </div>
                     </div>
                ) : (
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                             <TabsTrigger value="cv" disabled={cvSources.length === 0}>
                                 <FileText className="h-4 w-4 mr-2" /> Resume/CV {cvSources.length > 0 && `(${cvSources.length})`}
                             </TabsTrigger>
                             <TabsTrigger value="linkedin" disabled={linkedinSources.length === 0}>
                                 <Linkedin className="h-4 w-4 mr-2" /> LinkedIn {linkedinSources.length > 0 && `(${linkedinSources.length})`}
                             </TabsTrigger>
                         </TabsList>

                         <TabsContent value="cv" className="mt-6">
                             {cvSources.length > 0 ? (
                                 <RadioGroup value={selectedSource?.id} onValueChange={(id) => { const source = cvSources.find(s => s.id === id); if (source) handleSelectSource(source); }}>
                                     <div className="space-y-4">
                                         {cvSources.map((source) => (
                                             <div key={source.id} className={`border p-4 rounded-lg flex items-start cursor-pointer transition-colors ${selectedSource?.id === source.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:border-gray-300'}`} onClick={() => handleSelectSource(source)}>
                                                 <RadioGroupItem value={source.id} id={`cv-${source.id}`} className="mt-1" />
                                                 <div className="ml-3 flex-1">
                                                     <Label htmlFor={`cv-${source.id}`} className="font-medium cursor-pointer">{source.name}</Label>
                                                     <p className="text-sm text-muted-foreground">{source.description}</p>
                                                     {selectedSource?.id === source.id && (<div className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded inline-flex items-center mt-2"><BadgeCheck className="h-3 w-3 mr-1" /> Selected</div>)}
                                                 </div>
                                             </div>
                                         ))}
                                     </div>
                                 </RadioGroup>
                             ) : ( <div className="text-center py-6 text-muted-foreground">No CVs found or selected.</div> )}
                         </TabsContent>

                         <TabsContent value="linkedin" className="mt-6">
                             {linkedinSources.length > 0 ? (
                                 <RadioGroup value={selectedSource?.id} onValueChange={(id) => { const source = linkedinSources.find(s => s.id === id); if (source) handleSelectSource(source); }}>
                                     <div className="space-y-4">
                                         {linkedinSources.map((source) => (
                                             <div key={source.id} className={`border p-4 rounded-lg flex items-start cursor-pointer transition-colors ${selectedSource?.id === source.id ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-500' : 'hover:border-gray-300'}`} onClick={() => handleSelectSource(source)}>
                                                 <RadioGroupItem value={source.id} id={`linkedin-${source.id}`} className="mt-1" />
                                                 <div className="ml-3 flex-1">
                                                     <Label htmlFor={`linkedin-${source.id}`} className="font-medium cursor-pointer">{source.name}</Label>
                                                     <p className="text-sm text-muted-foreground">
                                                         {selectedSource?.id === source.id && selectedResumeData ? `Using Resume: ${selectedResumeData.title || `ID ${selectedResumeData.id.substring(0,6)}...`}` : source.description }
                                                     </p>
                                                      {selectedSource?.id === source.id && (
                                                          <div className={`text-xs px-2 py-0.5 rounded inline-flex items-center mt-2 ${selectedResumeData ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                                                              <BadgeCheck className="h-3 w-3 mr-1" />
                                                              {selectedResumeData ? 'LinkedIn Resume Selected' : 'Source Selected (Choose Resume)'}
                                                          </div>
                                                      )}
                                                      {selectedSource?.id === source.id && (
                                                           <Button variant="link" size="sm" className="p-0 h-auto mt-1 text-blue-600 text-xs block text-left" onClick={(e) => {e.stopPropagation(); setShowLinkedInSelector(true);}}>
                                                             {selectedResumeData ? 'Change Linked Resume' : 'Select/Create Linked Resume'}
                                                            </Button>
                                                      )}
                                                 </div>
                                             </div>
                                         ))}
                                     </div>
                                 </RadioGroup>
                             ) : (
                                 <div className="text-center py-6 text-muted-foreground">
                                      <p className="mb-3">LinkedIn profile not connected.</p>
                                      {/* FIXED: Use isConnecting state from hook */}
                                      <Button variant="outline" onClick={connectLinkedIn} disabled={isConnecting}>
                                           {/* FIXED: Use imported LoadingSpinner */}
                                           {isConnecting ? <LoadingSpinner/> : <Linkedin className="mr-2 h-4 w-4" /> }
                                           {/* FIXED: Use isConnecting state */}
                                           {isConnecting ? 'Connecting...' : 'Connect LinkedIn'}
                                      </Button>
                                 </div>
                             )}
                         </TabsContent>
                    </Tabs>
                )}
            </CardContent>
             {/* Footer removed - Parent handles the 'Continue' action */}
        </Card>
    );
}