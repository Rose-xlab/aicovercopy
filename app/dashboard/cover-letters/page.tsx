"use client";

import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import {
 Card,
 CardHeader,
 CardTitle,
 CardDescription,
 CardContent,
 CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { createBrowserClient } from "@/lib/supabase";
import { useTemplates } from "@/lib/hooks/useTemplates";
import {
 FileText,
 Sparkles,
 History,
 Clock,
 ExternalLink,
 ArrowLeft,
 ArrowRight,
 CheckCircle2,
 LayoutTemplate,
 Info,
 Linkedin,
 Loader2,
 MailCheck,
} from "lucide-react";
import { CVManager } from "@/components/CVManager";
import { LinkedInManager } from "@/components/LinkedInManager";
import JobDescriptionInput from "@/components/JobDescriptionInput";
import { FollowUpEmailGenerator } from "@/components/FollowUpEmailGenerator";
import Link from "next/link";
import {
 Collapsible,
 CollapsibleContent,
 CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ResumeSourceSelector } from "@/components/ResumeSourceSelector";
import {
 generateCoverLetter,
 saveCoverLetter,
} from "@/lib/coverLetterGenerator";
import { Database } from "@/types/supabase";
import RecentCoverLettersTab from "./components/RecentCoverLettersTab";
import CoverLetterEditor from './components/CoverLetterEditor';
import type { CoverLetter, SenderInfo, RecipientInfo } from '@/types/cover-letter';

export interface CvFile {
 id: string;
 name: string;
 size: number;
 type: string;
 uploadDate: string;
 isSelected: boolean | undefined;
}

type LinkedInProfile =
 | Database["public"]["Tables"]["linkedin_profiles"]["Row"]
 | null;

type SelectedResumeDataType = any;

export interface RecentLetter {
 id: string;
 title: string;
 date: string;
 timeAgo: string;
 job_title: string;
 company_name: string;
 content: string;
}

// Extend the CoverLetter type to include dataSource for compatibility with CoverLetterEditor
type ExtendedCoverLetter = CoverLetter & { dataSource: "cv" | "linkedin" | "both" | "none" };

export default function CoverLetterGenerator() {
 const router = useRouter();
 const searchParams = useSearchParams();
 const { user } = useAuth();
 const { toast } = useToast();
 const supabase = createBrowserClient();
 const { fetchTemplates, templates } = useTemplates();

 const [activeTab, setActiveTab] = useState("create");
 const [step, setStep] = useState(1);

 const [jobDescription, setJobDescription] = useState("");
 const [selectedTone, setSelectedTone] = useState("professional");
 const [generatingLetter, setGeneratingLetter] = useState(false);
 const [generationProgress, setGenerationProgress] = useState(0);
 const [isRegenerating, setIsRegenerating] = useState(false);

 const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
 const [showTemplateSelection, setShowTemplateSelection] = useState(false);

 const [cvFiles, setCvFiles] = useState<CvFile[]>([]);
 const [linkedInProfile, setLinkedInProfile] = useState<LinkedInProfile>(null);
 const [dataSource, setDataSource] = useState<"cv" | "linkedin" | "both" | "none">("none");
 const [resumeData, setResumeData] = useState<SelectedResumeDataType | null>(null);
 const [activeCoverLetter, setActiveCoverLetter] = useState<ExtendedCoverLetter | null>(null);
 const [recentFollowUpEmails, setRecentFollowupEmails] = useState<any[]>([]);
 const [isDataSourcesOpen, setIsDataSourcesOpen] = useState(false);
 
 const [recentLetters, setRecentLetters] = useState<RecentLetter[]>([
   { id: "1", title: "Marketing Manager at Company A", date: "2023-05-10", timeAgo: "2 hours ago", job_title: "Marketing Manager", company_name: "Company A", content: "Cover letter content here..." },
   { id: "2", title: "Software Developer at Company B", date: "2023-05-08", timeAgo: "2 days ago", job_title: "Software Developer", company_name: "Company B", content: "Cover letter content here..." },
   { id: "3", title: "Project Coordinator at Company C", date: "2023-05-05", timeAgo: "5 days ago", job_title: "Project Coordinator", company_name: "Company C", content: "Cover letter content here..." },
 ]);

 useEffect(() => {
   const tabParam = searchParams.get("tab");
   const editParam = searchParams.get("edit");
   
   // Handle edit parameter
   if (editParam && user) {
     // Fetch the cover letter to edit
     const fetchCoverLetterForEdit = async () => {
       try {
         const { data, error } = await supabase
           .from('cover_letters')
           .select('*')
           .eq('id', editParam)
           .eq('user_id', user.id)
           .single();
         
         if (error) throw error;
         
         if (data) {
           // Convert database format to ExtendedCoverLetter type
           const coverLetter: ExtendedCoverLetter = {
             id: data.id,
             userId: data.user_id,
             jobTitle: data.job_title,
             companyName: data.company_name,
             jobDescription: data.job_description || "",
             tone: data.tone || "professional",
             data_source: (data.data_source || "none") as "cv" | "linkedin" | "both" | "none",
             dataSource: (data.data_source || "none") as "cv" | "linkedin" | "both" | "none", // For compatibility
             sender: data.sender as SenderInfo || {},
             recipient: (data.recipient as RecipientInfo) || {},
             content: data.content || "",
             created_at: data.created_at ? new Date(data.created_at) : null,
             templateId: data.template_id || undefined,
           };
           
           // Set the states for editing
           setActiveCoverLetter(coverLetter);
           setJobDescription(data.job_description || "");
           setSelectedTone(data.tone || "professional");
           setDataSource((data.data_source || "none") as "cv" | "linkedin" | "both" | "none");
           setSelectedTemplate(data.template_id || null);
           setActiveTab("create");
           setStep(3); // Go directly to editor
         }
       } catch (error) {
         console.error('Error fetching cover letter for edit:', error);
         toast({
           title: "Error loading cover letter",
           description: "Could not load the cover letter for editing.",
           variant: "destructive",
         });
       }
     };
     
     fetchCoverLetterForEdit();
   } else if (tabParam && ["create", "recent", "follow-up"].includes(tabParam)) {
     setActiveTab(tabParam);
   }
   
   fetchTemplates();
 }, [searchParams, fetchTemplates, user, supabase, toast]);

 useEffect(() => {
   if (templates.length > 0 && !selectedTemplate) {
     setSelectedTemplate(templates[0].id);
   }
 }, [templates, selectedTemplate]);
 
 const handleDownloadCoverLetter = useCallback(async () => {
   if (!activeCoverLetter?.content) return;
   try {
     const blob = new Blob([activeCoverLetter.content], { type: "text/plain" });
     const url = URL.createObjectURL(blob);
     const a = document.createElement("a");
     a.href = url;
     a.download = `Cover Letter - ${activeCoverLetter.jobTitle || "Position"} at ${activeCoverLetter.companyName || "Company"}.txt`;
     document.body.appendChild(a);
     a.click();
     document.body.removeChild(a);
     URL.revokeObjectURL(url);
     toast({ title: "Download Started", description: "Your cover letter is being downloaded as a text file." });
   } catch (error) {
     console.error("Error downloading cover letter:", error);
     toast({ title: "Download Failed", description: "There was an error downloading your cover letter. Please try again.", variant: "destructive" });
   }
 }, [activeCoverLetter, toast]);

 const handlePlainTextDownload = useCallback(() => {
   if (!activeCoverLetter?.content) return;
   try {
     const blob = new Blob([activeCoverLetter.content], { type: "text/plain" });
     const url = URL.createObjectURL(blob);
     const a = document.createElement("a");
     a.href = url;
     a.download = `Cover Letter - ${activeCoverLetter.jobTitle || "Position"} at ${activeCoverLetter.companyName || "Company"}.txt`;
     document.body.appendChild(a);
     a.click();
     document.body.removeChild(a);
     URL.revokeObjectURL(url);
     toast({ title: "Download Started", description: "Your cover letter is being downloaded as a text file." });
   } catch (error) {
     console.error("Error downloading cover letter:", error);
     toast({ title: "Download Failed", description: "There was an error downloading your cover letter. Please try again.", variant: "destructive" });
   }
 }, [activeCoverLetter, toast]);

 useEffect(() => {
   const downloadHandler = (event: CustomEvent) => {
     if (event.detail && event.detail.id === "download-cover-letter") {
       handlePlainTextDownload();
     }
   };
   document.addEventListener("plainTextDownload", downloadHandler as EventListener);
   return () => {
     document.removeEventListener("plainTextDownload", downloadHandler as EventListener);
   };
 }, [handlePlainTextDownload]);

 const loadCvFiles = useCallback(async () => {
   if (!user) return;
   try {
     const { data, error } = await supabase.from("user_cvs").select("*").eq("user_id", user.id).order("uploaded_at", { ascending: false });
     if (error) throw error;
     if (data) {
       const formattedCvs: CvFile[] = data.map((cv) => ({
         id: cv.id, name: cv.filename, size: cv.filesize, type: cv.filetype, uploadDate: cv.uploaded_at, isSelected: cv.is_selected || false,
       }));
       setCvFiles(formattedCvs);
     }
   } catch (error) {
     console.error("Error loading CV files:", error);
   }
 }, [user, supabase]);

 const loadLinkedInProfile = useCallback(async () => {
   if (!user) return;
   try {
     const { data, error } = await supabase.from("linkedin_profiles").select("*").eq("user_id", user.id).eq("status", "connected").single();
     if (error && error.code !== "PGRST116") throw error;
     if (data) {
       setLinkedInProfile(data as LinkedInProfile);
     }
   } catch (error) {
     console.error("Error loading LinkedIn profile:", error);
   }
 }, [user, supabase]);

 useEffect(() => {
   loadCvFiles();
   loadLinkedInProfile();
 }, [user, loadCvFiles, loadLinkedInProfile]);

 const handleTabChange = (value: string) => {
   setActiveTab(value);
   router.push(`/dashboard/cover-letters?tab=${value}`, { scroll: false });
 };

 const handleJobDescriptionSubmit = (description: string, tone: string) => {
   setJobDescription(description);
   setSelectedTone(tone);
   setStep(2);
 };

 const handleDataSourceChange = (source: "cv" | "linkedin" | "both" | "none") => {
   setDataSource(source);
 };
 
 const handleGenerateAndProceed = useCallback(
   async (selectedData: SelectedResumeDataType | CvFile | null, selectedDataSource: "cv" | "linkedin" | "both" | "none") => {
     if (!user || !selectedData || selectedDataSource === "none") {
       toast({ title: "Data Source Error", description: "Please log in and select a data source.", variant: "destructive" });
       return;
     }
     if (!selectedTemplate) {
       toast({ title: "No Template Selected", description: "A default template is loading. Please wait a moment and try again.", variant: "destructive" });
       return;
     }
     setGeneratingLetter(true);
     try {
       const generationResult = await generateCoverLetter({
         jobDescription,
         tone: selectedTone,
         resumeData: selectedData,
         dataSource: selectedDataSource,
       });

       // Use the correct property name `coverLetter`
       if (!generationResult || !generationResult.coverLetter) {
         console.error("Incomplete generation result:", generationResult);
         throw new Error("Failed to get complete data from the generation service.");
       }
       
       const senderInfo: SenderInfo = {
         name: user.user_metadata?.full_name || user.user_metadata?.name || "",
         email: user.email || "",
         phone: user.phone || "",
         address: user.user_metadata?.location || "",
       };
       const newCoverLetter: ExtendedCoverLetter = {
         userId: user.id,
         jobTitle: generationResult.jobTitle,
         companyName: generationResult.companyName,
         jobDescription,
         tone: selectedTone,
         data_source: selectedDataSource,
         dataSource: selectedDataSource, // For compatibility with CoverLetterEditor
         sender: senderInfo,
         recipient: { title: "Hiring Manager", company: generationResult.companyName },
         content: generationResult.coverLetter,
         created_at: new Date(),
         templateId: selectedTemplate,
       };
       setActiveCoverLetter(newCoverLetter);
       setStep(3);
     } catch (error: any) {
       console.error("Error generating cover letter:", error);
       toast({ title: "Generation Failed", description: error.message || "An unexpected error occurred during generation.", variant: "destructive" });
     } finally {
       setGeneratingLetter(false);
     }
   },
   [user, jobDescription, selectedTone, toast, selectedTemplate]
 );
 
 const handleRegenerateCoverLetter = useCallback(async () => {
   if (!activeCoverLetter) return;
   
   setGeneratingLetter(true);
   setIsRegenerating(true);
   setGenerationProgress(0);

   try {
     const generatedResult = await generateCoverLetter({
       jobDescription,
       jobTitle: activeCoverLetter.jobTitle ?? undefined,
       companyName: activeCoverLetter.companyName ?? undefined,
       tone: selectedTone,
       resumeData,
       dataSource,
       regenerate: true,
       sender: activeCoverLetter.sender,
       recipient: activeCoverLetter.recipient,
     });

     if (generatedResult && generatedResult.coverLetter) {
       setActiveCoverLetter(prev => {
         if (!prev) return null;
         return {
           ...prev,
           content: generatedResult.coverLetter,
           jobTitle: generatedResult.jobTitle,
           companyName: generatedResult.companyName,
         };
       });
     } else {
        throw new Error("Regeneration failed to return valid content.");
     }

   } catch (error: any) {
     console.error("Error regenerating cover letter:", error);
     toast({
       title: "Regeneration Failed",
       description: error.message || "Error regenerating cover letter.",
       variant: "destructive",
     });
   } finally {
     setGeneratingLetter(false);
     setIsRegenerating(false);
   }
 }, [
   activeCoverLetter,
   jobDescription,
   selectedTone,
   dataSource,
   resumeData,
   toast,
 ]);

 const handleDataSourceSelected = useCallback((sourceType: "cv" | "linkedin" | "both" | "none", data: SelectedResumeDataType | CvFile | null) => {
   console.log("Data source selected in parent:", sourceType, data);
   setDataSource(sourceType);
   setResumeData(data);
 }, []);

 const applyTemplate = (templateId: string) => {
   setSelectedTemplate(templateId);
   toast({ title: "Template Applied", description: "Your cover letter has been formatted with the selected template." });
   setShowTemplateSelection(false);
 };

 const skipTemplateSelection = () => {
   setShowTemplateSelection(false);
   toast({ title: "No Template Selected", description: "Your cover letter will use the default format." });
 };
 
 const handleSaveCoverLetter = async () => {
   if (!activeCoverLetter || !activeCoverLetter.dataSource) return;
   try {
     // Convert back to the format expected by saveCoverLetter
     const letterToSave = {
       ...activeCoverLetter,
       content: activeCoverLetter.content || undefined, // Convert null to undefined
       dataSource: activeCoverLetter.dataSource,
       template_id: activeCoverLetter.templateId,
     };
     await saveCoverLetter(letterToSave); 
     toast({ title: "Cover Letter Saved", description: "Your cover letter has been saved successfully." });
   } catch (error) {
     console.error("Error saving cover letter:", error);
     toast({ title: "Save Failed", description: "There was an error saving your cover letter. Please try again.", variant: "destructive" });
   }
 };

 const handleCopyCoverLetter = async () => {
   if (!activeCoverLetter?.content) return;
   try {
     await navigator.clipboard.writeText(activeCoverLetter.content);
     toast({ title: "Copied to Clipboard", description: "Your cover letter has been copied to your clipboard." });
   } catch (error) {
     console.error("Error copying to clipboard:", error);
     toast({ title: "Copy Failed", description: "There was an error copying to your clipboard.", variant: "destructive" });
   }
 };
 
 useEffect(() => {
   let interval: NodeJS.Timeout;
   if (generatingLetter) {
     setGenerationProgress(0);
     interval = setInterval(() => {
       setGenerationProgress((prev) => {
         const newProgress = prev + Math.random() * 10 + 5;
         return newProgress > 95 ? 95 : newProgress;
       });
     }, 300);
   } else if (activeCoverLetter) {
     setGenerationProgress(100);
   }
   return () => {
     if (interval) clearInterval(interval);
   };
 }, [generatingLetter, activeCoverLetter]);

 const hasCV = cvFiles.some((cv) => cv.isSelected);
 const hasLinkedIn = linkedInProfile?.status === "connected";

 const LoadingSpinner = ({ className }: { className?: string }) => (
   <Loader2 className={`h-4 w-4 animate-spin ${className || ""}`} />
 );

 const TemplateSelectionComponent = () => {
   const availableTemplates =
     templates?.length > 0
       ? templates
       : [];

   return (
     <Card className="border-primary/20 mb-6">
       <CardHeader className="pb-3">
         <div className="flex items-center justify-between">
           <div>
             <CardTitle className="flex items-center">
             <LayoutTemplate className="h-5 w-5 mr-2 text-primary" />
               Choose a Template (Optional)
             </CardTitle>
             <CardDescription>
               Select a visual style for your cover letter
             </CardDescription>
           </div>
           <Button variant="ghost" onClick={skipTemplateSelection}>
             Skip
           </Button>
         </div>
       </CardHeader>
       <CardContent>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           {availableTemplates.map((template: any) => (
             <div
               key={template.id}
               className={`border rounded-md p-4 cursor-pointer transition-all hover:border-primary hover:bg-primary/5 ${
                 selectedTemplate === template.id
                   ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                   : ""
               }`}
               onClick={() => applyTemplate(template.id)}
             >
               <div className="flex justify-between items-start mb-2">
                 <h3 className="font-medium">{template.name}</h3>
                 {selectedTemplate === template.id && (
                   <CheckCircle2 className="h-4 w-4 text-primary" />
                 )}
               </div>
               <p className="text-sm text-muted-foreground">
                 {template.description}
               </p>
               <div className="mt-3 h-20 bg-muted/60 rounded flex items-center justify-center overflow-hidden relative">
                 {template.thumbnail_url ? (
                   <Image
                     src={template.thumbnail_url}
                     alt={`${template.name} template preview`}
                     fill
                     className="object-cover object-top"
                     onError={(e: any) => {
                       const target = e.target as HTMLElement;
                       target.style.display = "none";
                       const parent = target.parentElement;
                       if (parent) {
                         const fallback = parent.querySelector('.fallback-icon');
                         if (fallback) {
                           (fallback as HTMLElement).style.display = "flex";
                         }
                       }
                     }}
                   />
                 ) : null}
                 <div
                   className={`fallback-icon w-full h-full flex items-center justify-center ${
                     template.thumbnail_url ? "hidden" : "flex"
                   }`}
                 >
                   <LayoutTemplate className="h-8 w-8 text-muted-foreground/40" />
                 </div>
               </div>
             </div>
           ))}
         </div>
       </CardContent>
     </Card>
   );
 };

 const LoadingGeneration = () => (
   <div className="py-16 flex flex-col items-center justify-center">
     <div className="relative mb-8">
       <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
         <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center z-10 shadow-lg">
           <Sparkles className="h-10 w-10 text-primary animate-pulse" />
         </div>
       </div>
       <div
         className="absolute top-0 left-0 w-32 h-32 rounded-full"
         style={{
           background: `conic-gradient(from 0deg, #6366f1 0%, #8b5cf6 ${generationProgress}%, transparent ${generationProgress}%, transparent 100%)`,
           transform: "rotate(-90deg)",
           transition: "all 0.3s ease",
         }}
       />
       <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-bold rounded-full w-10 h-10 flex items-center justify-center shadow-md">
         {Math.round(generationProgress)}%
       </div>
     </div>
     <div className="text-xl font-medium bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
       {isRegenerating
         ? "Regenerating your cover letter..."
         : "Generating your cover letter..."}
     </div>
     <p className="text-sm text-muted-foreground text-center max-w-md">
       {dataSource === "both"
         ? "Analyzing job description and matching with your CV and LinkedIn profile"
         : dataSource === "cv"
         ? "Analyzing job description and matching with your CV"
         : "Analyzing job description and matching with your LinkedIn profile"}
     </p>
   </div>
 );

 return (
   <div className="w-full h-full bg-white p-10">
     <header className="mb-8">
       <h1 className="text-3xl font-bold">Cover Letters</h1>
       <p className="text-muted-foreground">
         Create and manage your personalized cover letters
       </p>
     </header>

     <Tabs
       value={activeTab}
       onValueChange={handleTabChange}
       className="w-full"
     >
       <TabsList className="mb-6 w-[40%] flex bg-muted/50 rounded-lg p-1 gap-2">
        <TabsTrigger
          value="create"
          className="flex items-center px-4 py-2 rounded-md font-medium transition-colors data-[state=active]:bg-orange-600 data-[state=active]:text-white data-[state=active]:shadow data-[state=inactive]:text-orange-900 data-[state=inactive]:bg-muted/50 focus-visible:ring-2 focus-visible:ring-orange-400"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Create New
        </TabsTrigger>
        <TabsTrigger
          value="recent"
          className="flex items-center px-4 py-2 rounded-md font-medium transition-colors data-[state=active]:bg-orange-600 data-[state=active]:text-white data-[state=active]:shadow data-[state=inactive]:text-orange-900 data-[state=inactive]:bg-muted/50 focus-visible:ring-2 focus-visible:ring-orange-400"
        >
          <History className="h-4 w-4 mr-2" />
          Recent
        </TabsTrigger>
        <TabsTrigger
          value="follow-up"
          className="flex items-center px-4 py-2 rounded-md font-medium transition-colors data-[state=active]:bg-orange-600 data-[state=active]:text-white data-[state=active]:shadow data-[state=inactive]:text-orange-900 data-[state=inactive]:bg-muted/50 focus-visible:ring-2 focus-visible:ring-orange-400"
        >
          <MailCheck className="h-4 w-4 mr-2" />
          Follow-Up
        </TabsTrigger>
      </TabsList>

       <TabsContent value="create">
         {step === 1 && (
           <div>
             <Card className="mb-6 bg-muted/10 border-gray-100 shadow-none">
               <CardHeader className="pb-3">
                 <div className="flex justify-between items-center">
                   <div>
                     <CardTitle>Your Data Sources</CardTitle>
                   </div>
                   <Collapsible
                     open={isDataSourcesOpen}
                     onOpenChange={setIsDataSourcesOpen}
                   >
                     <CollapsibleTrigger asChild>
                       <Button  size="sm" className="bg-orange-600 hover:bg-orange-300" >
                         {isDataSourcesOpen ? "Hide" : "Manage"}
                       </Button>
                     </CollapsibleTrigger>
                   </Collapsible>
                 </div>
               </CardHeader>
               <CardContent>
                 <div className="flex flex-wrap gap-4 mb-4">
                   <div
                     className={`flex items-center rounded-md border p-3 ${
                       hasCV
                         ? "border-green-500/50 bg-green-500/10"
                         : "border-orange-100 bg-muted/50"
                     } cursor-pointer`}
                     onClick={() => setIsDataSourcesOpen(true)}
                   >
                     <div
                       className={`mr-3 rounded-full p-1 ${
                         hasCV ? "bg-green-500/20" : "bg-muted"
                       }`}
                     >
                       <FileText
                         className={`h-4 w-4 ${
                           hasCV ? "text-green-500" : "text-muted-foreground"
                         }`}
                       />
                     </div>
                     <div>
                       <p className="text-sm font-medium">Resume/CV</p>
                       {hasCV && cvFiles.find((cv) => cv.isSelected)?.name ? (
                         <p className="text-xs text-green-600">
                           {cvFiles?.find((cv) => cv.isSelected)?.name?.substring(0,15)}...
                         </p>
                       ) : (
                         <p className="text-xs text-blue-600 font-medium hover:underline">
                           Connect
                         </p>
                       )}
                     </div>
                   </div>

                   <div
                     className={`flex items-center rounded-md border p-3 ${
                       hasLinkedIn
                         ? "border-green-500/50 bg-green-500/10"
                         : "border-orange-100 bg-muted/50"
                     } cursor-pointer`}
                     onClick={() => setIsDataSourcesOpen(true)}
                   >
                     <div
                       className={`mr-3 rounded-full p-1 ${
                         hasLinkedIn ? "bg-green-500/20" : "bg-muted"
                       }`}
                     >
                       <Linkedin
                         className={`h-4 w-4 ${
                           hasLinkedIn
                             ? "text-green-500"
                             : "text-muted-foreground"
                         }`}
                       />
                     </div>
                     <div>
                       <p className="text-sm font-medium">LinkedIn</p>
                       {hasLinkedIn && linkedInProfile?.name ? (
                         <p className="text-xs text-green-600">
                           {linkedInProfile.name.length > 15
                             ? linkedInProfile.name.substring(0, 15) + "..."
                             : linkedInProfile.name}
                         </p>
                       ) : (
                         <p className="text-xs text-blue-600 font-medium hover:underline">
                           Connect
                         </p>
                       )}
                     </div>
                   </div>
                 </div>

                 <Collapsible open={isDataSourcesOpen}>
                   <CollapsibleContent>
                     <div className="pt-4 border-t">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <CVManager />
                         <LinkedInManager />
                       </div>
                     </div>
                   </CollapsibleContent>
                 </Collapsible>
               </CardContent>
             </Card>

             <Card className="bg-muted/10 border-gray-100">
               <CardHeader className="pb-3">
                 <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                   <div>
                     <CardTitle className="text-2xl flex items-center">
                       <Sparkles className="h-5 w-5 mr-2 text-primary" />
                       Create a Cover Letter
                     </CardTitle>
                   </div>
                   <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                     <div className={`flex items-center rounded-full px-2 py-1 ${ hasCV ? "bg-green-500/10 text-green-600" : "bg-orange-50" }`} >
                       <FileText className="h-3 w-3 mr-1" />
                      <span>CV {hasCV ? "✓" : ""}</span>
                     </div>
                     <div className={`flex items-center rounded-full px-2 py-1 ${ hasLinkedIn ? "bg-green-500/10 text-green-600" : "bg-orange-50" }`} >
                       <Linkedin className="h-3 w-3 mr-1" />
                       <span>LinkedIn {hasLinkedIn ? "✓" : ""}</span>
                     </div>
                   </div>
                 </div>
               </CardHeader>
               <CardContent>
                 <div className="p-1">
                   <JobDescriptionInput
                     onSubmit={handleJobDescriptionSubmit}
                     cvUploaded={hasCV}
                     linkedInConnected={hasLinkedIn}
                   />
                 </div>
               </CardContent>
             </Card>
           </div>
         )}

         {step === 2 && !generatingLetter && (
           <div>
             <Button
               variant="outline"
               onClick={() => setStep(1)}
               className="mb-6"
             >
               <ArrowLeft className="h-4 w-4 mr-2" />
               Back to Job Description
             </Button>

             <ResumeSourceSelector
               cvFiles={cvFiles}
               linkedInProfile={linkedInProfile}
               onDataSourceSelected={handleDataSourceSelected}
             />

             <div className="mt-6 flex justify-end">
               <Button
                 className="bg-orange-600"
                 onClick={() => {
                   if (dataSource !== "none" && resumeData) {
                     handleGenerateAndProceed(resumeData, dataSource);
                   } else {
                     toast({
                       title: "Please select a data source",
                       variant: "destructive",
                     });
                   }
                 }}
                 disabled={
                   dataSource === "none" || !resumeData || generatingLetter
                 }
               >
                 {generatingLetter ? (
                   <>
                     <LoadingSpinner className="mr-2" />
                     Generating...
                   </>
                 ) : (
                   "Generate Cover Letter"
                 )}
                 <ArrowRight className="ml-2 h-4 w-4" />
               </Button>
             </div>
           </div>
         )}

         {step === 2 && generatingLetter && (
           <Card className="border border-primary/20">
             <CardContent className="pt-6">
               <LoadingGeneration />
             </CardContent>
           </Card>
         )}

         {step === 3 && activeCoverLetter && (
           <CoverLetterEditor
             coverLetter={activeCoverLetter}
             onBack={() => setStep(2)}
             onTabChange={handleTabChange}
             onRegenerateLetter={handleRegenerateCoverLetter}
           />
         )}
       </TabsContent>

       <TabsContent value="recent">
         <RecentCoverLettersTab user={user} onTabChange={handleTabChange} />
       </TabsContent>

       <TabsContent value="follow-up">
         <Card>
           <CardHeader>
             <CardTitle>Follow-Up Emails</CardTitle>
             <CardDescription>
               Create professional follow-up emails for your job applications
             </CardDescription>
           </CardHeader>
           <CardContent>
             <div className="space-y-6">
               {recentLetters.length > 0 ? (
                 <>
                   <Alert className="bg-blue-50 border-blue-200">
                     <Info className="h-4 w-4 text-blue-500" />
                     <AlertDescription className="text-blue-700">
                       Select one of your recent cover letters to create a
                       targeted follow-up email
                     </AlertDescription>
                   </Alert>

                   <div className="grid gap-4">
                     {recentLetters.map((letter) => (
                       <div
                         key={letter.id}
                         className="border rounded-lg p-4 hover:bg-slate-50 transition-colors"
                       >
                         <div className="flex flex-col sm:flex-row justify-between">
                           <div>
                             <h3 className="font-medium">{letter.title}</h3>
                             <p className="text-sm text-muted-foreground">
                               Created{" "}
                               {letter.date
                                 ? new Date(letter.date).toLocaleDateString()
                                 : "Recently"}
                             </p>
                           </div>
                           <div className="mt-3 sm:mt-0">
                             <FollowUpEmailGenerator
                               variant="modal"
                               initialJobTitle={letter.job_title || ""}
                               initialCompanyName={letter.company_name || ""}
                               initialCoverLetterId={letter.id}
                               initialCoverLetterContent={letter.content || ""}
                               candidateName={"John Doe"}
                               candidateEmail={user?.email || ""}
                               triggerText="Create Follow-Up Email"
                             />
                           </div>
                         </div>
                       </div>
                     ))}
                   </div>
                 </>
               ) : (
                 <div className="text-center py-8">
                   <MailCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-60" />
                   <h3 className="text-lg font-medium mb-2">
                     No cover letters yet
                   </h3>
                   <p className="text-muted-foreground mb-4">
                     Create a cover letter first, then come back to write a
                     follow-up email
                   </p>
                   <Button
                     onClick={() => {
                       setActiveTab("create");
                       handleTabChange("create");
                     }}
                   >
                     Create a Cover Letter
                   </Button>
                 </div>
               )}

               <div className="border-t pt-6">
                 <h3 className="text-lg font-medium mb-4">
                   Create a Stand-Alone Follow-Up Email
                 </h3>
                 <p className="text-muted-foreground mb-4">
                   Don&apos;t see the cover letter you need or want to create a
                   follow-up from scratch?
                 </p>
                 <FollowUpEmailGenerator
                   variant="modal"
                   candidateName={"John Doe"}
                   candidateEmail={user?.email || ""}
                   triggerText="Create New Follow-Up Email"
                 />
               </div>
             </div>
           </CardContent>
         </Card>
       </TabsContent>
     </Tabs>
   </div>
 );
}