// components/DataSourceSelector.tsx
"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    FileText, Linkedin, FileSpreadsheet, ArrowRightCircle,
    AlertCircle, Loader2, BadgeCheck
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import type { CvFile } from '@/components/CVManager'; // Assuming type exported from CVManager or defined globally
import { LinkedInResumeSelector } from "./LinkedInResumeSelector"; // Keep this import
import { useToast } from "@/hooks/use-toast";
import { createBrowserClient } from "@/lib/supabase";
import { useLinkedInIntegration } from "@/lib/hooks/useLinkedInIntegration";
import { Database } from "@/types/supabase"; // Import Supabase types

// Define types based on Supabase schema
type DbLinkedInProfile = Database['public']['Tables']['linkedin_profiles']['Row'];
type DbResume = Database['public']['Tables']['resumes']['Row'];

// Internal type for managing selection state in the UI
interface DataSource {
    id: string;
    type: 'cv' | 'linkedin';
    name: string;
    description?: string;
    selected?: boolean; // Is this specific source selected in the UI?
    metadata?: CvFile | DbLinkedInProfile | null; // The actual base source object
}

// Define the expected type for the resume data selected via LinkedInResumeSelector
type SelectedLinkedInResumeType = DbResume;

export interface EnhancedDataSourceSelectorProps {
    cvFiles: CvFile[];
    linkedInProfile: DbLinkedInProfile | null;
    // Prop callback for when a final data source is selected
    // For Prop Serialization Warning (ts 71007): Ensure the function passed here
    // from the parent component is wrapped in useCallback.
    onDataSourceSelected: (sourceType: 'cv' | 'linkedin' | 'none', data: CvFile | SelectedLinkedInResumeType | null) => void;
}

export function EnhancedDataSourceSelector({
    cvFiles,
    linkedInProfile,
    onDataSourceSelected
}: EnhancedDataSourceSelectorProps) {
    const [activeTab, setActiveTab] = useState<string>("cv");
    const [selectedSource, setSelectedSource] = useState<DataSource | null>(null); // Tracks the UI selection
    const [cvSources, setCvSources] = useState<DataSource[]>([]);
    const [linkedinSources, setLinkedinSources] = useState<DataSource[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showLinkedInSelector, setShowLinkedInSelector] = useState(false);
    const [selectedResumeData, setSelectedResumeData] = useState<SelectedLinkedInResumeType | null>(null);
    const [isPending, startTransition] = useTransition();

    const { toast } = useToast();
    const { isConnected } = useLinkedInIntegration(); // Only need connection status here

    // Set default active tab based on available sources
    useEffect(() => {
        const hasCv = cvFiles.some(cv => cv.isSelected);
        const hasLi = linkedInProfile?.status === 'connected';
        if (hasCv) setActiveTab("cv");
        else if (hasLi) setActiveTab("linkedin");
        else setActiveTab("cv");
    }, [cvFiles, linkedInProfile]);

    // Prepare CV sources
    useEffect(() => {
        const sources: DataSource[] = cvFiles.map(cv => ({
            id: cv.id, type: 'cv', name: cv.name,
            description: `Uploaded ${new Date(cv.uploadDate).toLocaleDateString()}`,
            selected: selectedSource?.id === cv.id && selectedSource?.type === 'cv',
            metadata: cv
        }));
        setCvSources(sources);
        // Auto-select logic (ensure it doesn't conflict with LinkedIn auto-select)
        if (!selectedSource && sources.length > 0 && linkedinSources.length === 0) {
            const defaultSelection = { ...sources[0], selected: true };
            setSelectedSource(defaultSelection);
            onDataSourceSelected('cv', defaultSelection.metadata as CvFile);
        } else if (sources.length === 0 && selectedSource?.type === 'cv') {
             setSelectedSource(null); onDataSourceSelected('none', null);
        }
    }, [cvFiles, selectedSource, onDataSourceSelected, linkedinSources.length]); // Added linkedinSources.length dependency

    // Prepare LinkedIn sources
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
        // Auto-select logic
        if (!selectedSource && sources.length > 0 && cvSources.length === 0) {
             const defaultSelection = { ...sources[0], selected: true };
             setSelectedSource(defaultSelection);
             // Don't call onDataSourceSelected yet, force resume selection
             setShowLinkedInSelector(true);
        } else if (sources.length === 0 && selectedSource?.type === 'linkedin') {
             setSelectedSource(null); setSelectedResumeData(null); onDataSourceSelected('none', null);
        }
    }, [linkedInProfile, cvSources.length, selectedSource, onDataSourceSelected]);

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
                onDataSourceSelected('none', null); // Clear parent state until resume selected
            }
        });
    }, [onDataSourceSelected]);

    // Handle LinkedIn resume selection FROM the LinkedInResumeSelector component
    const handleLinkedInResumeSelected = useCallback((resumeId: string, resumeData: SelectedLinkedInResumeType) => {
        setShowLinkedInSelector(false);
        setSelectedResumeData(resumeData);

        // FIXED: Only update description, keep original metadata (DbLinkedInProfile)
        if (selectedSource?.type === 'linkedin') {
             setSelectedSource(prev => prev ? {
                 ...prev, // Keep existing metadata (which should be DbLinkedInProfile)
                 description: `Using Resume: ${resumeData.title || `ID ${resumeId.substring(0,6)}...`}` // Just update description
             } : null);
        }

        // Notify the parent component that LinkedIn source + specific resume data is selected
        onDataSourceSelected('linkedin', resumeData);
    }, [onDataSourceSelected, selectedSource]); // Removed setSelectedSource dependency as it reads only

    // Cancel from LinkedInResumeSelector
    const handleLinkedInResumeCancel = useCallback(() => { setShowLinkedInSelector(false); }, []);

    // --- Render Logic ---
    if (showLinkedInSelector) {
        return (
            <LinkedInResumeSelector
                onSelect={handleLinkedInResumeSelected}
                onCancel={handleLinkedInResumeCancel}
            />
        );
    }

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="text-xl flex items-center">
                    <FileSpreadsheet className="mr-2 h-5 w-5 text-primary" /> Select Data Source for Cover Letter
                </CardTitle>
                <CardDescription>Choose the primary information source to tailor your letter.</CardDescription>
            </CardHeader>
            <CardContent>
                {(cvSources.length === 0 && linkedinSources.length === 0) ? (
                    <Alert variant="destructive">
                         <AlertCircle className="h-4 w-4 mr-2" />
                         <AlertDescription>No data sources found. Please connect LinkedIn or upload a CV first.</AlertDescription>
                     </Alert>
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
                             ) : (
                                 <div className="text-center py-6 text-muted-foreground">No CVs available. Please upload one.</div>
                             )}
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
                                                         {selectedSource?.id === source.id && selectedResumeData
                                                             ? `Using Resume: ${selectedResumeData.title || `ID ${selectedResumeData.id.substring(0,6)}...`}`
                                                             : source.description
                                                         }
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
                                 <div className="text-center py-6 text-muted-foreground">LinkedIn profile not connected.</div>
                             )}
                         </TabsContent>
                     </Tabs>
                 )}
            </CardContent>
            {/* Footer removed as parent (`CoverLetterGenerator`) should handle the final action button */}
        </Card>
    );
}