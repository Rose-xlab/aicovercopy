"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
import { Progress } from "@/components/ui/progress";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/hooks/useAuth";
import { createBrowserClient } from "@/lib/supabase";
import { useTemplates } from "@/lib/hooks/useTemplates";
import TemplateExportButton from "@/components/TemplateExportButton";
import { Textarea } from "@/components/ui/textarea";
import RecentCoverLetter from "./components/RecentCoverLetter";
import {
  FileText,
  Sparkles,
  History,
  Clock,
  ExternalLink,
  ArrowLeft,
  ArrowRight,
  Save,
  Download,
  Copy,
  CheckCircle2,
  LayoutTemplate,
  Info,
  Upload,
  Linkedin,
  Loader2,
  RefreshCw,
  Edit,
  Check,
  MailCheck,
  File,
} from "lucide-react";
import { CVManager } from "@/components/CVManager";
import { LinkedInManager } from "@/components/LinkedInManager";
import { EnhancedDataSourceSelector } from "@/components/DataSourceSelector";
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
import ExportProgressIndicator from "@/components/ExportProgressIndicator";
import { ExportResult } from "@/types/export";
import { Template, ExportFormat } from "@/types/templates";
import RecentCoverLettersTab from "./components/RecentCoverLettersTab";
import CoverLetterEditor from './components/CoverLetterEditor'
import type { CoverLetter } from '@/types/cover-letter'
export interface CvFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadDate: string;
  isSelected: boolean | undefined;
}

// Use the Database type for LinkedInProfile
type LinkedInProfile =
  | Database["public"]["Tables"]["linkedin_profiles"]["Row"]
  | null;

// Type for selected resume data
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

export default function CoverLetterGenerator() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const supabase = createBrowserClient();
  const { fetchTemplates, templates } = useTemplates();

  // State for tabs and creation flow
  const [activeTab, setActiveTab] = useState("create");
  const [step, setStep] = useState(1);

  // Job description and letter content
  const [jobDescription, setJobDescription] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [selectedTone, setSelectedTone] = useState("professional");
  const [generatingLetter, setGeneratingLetter] = useState(false);
  const [generatedLetter, setGeneratedLetter] = useState("");
  const [editedLetter, setEditedLetter] = useState(""); // For user edits
  const [isEditing, setIsEditing] = useState(false); // Track editing state
  const [generationProgress, setGenerationProgress] = useState(0);
  const [isRegenerating, setIsRegenerating] = useState(false); // Track regeneration state

  // Job auto-population state
  const [isLoadingJobDetails, setIsLoadingJobDetails] = useState(false);
  const [isJobPrePopulated, setIsJobPrePopulated] = useState(false);
  const [sourceJobId, setSourceJobId] = useState<string | null>(null);
  const [sourceCompany, setSourceCompany] = useState<string | null>(null);

  // Template selection state
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [showTemplateSelection, setShowTemplateSelection] = useState(false);

  // Data sources state
  const [cvFiles, setCvFiles] = useState<CvFile[]>([]);
  const [linkedInProfile, setLinkedInProfile] = useState<LinkedInProfile>(null);
  const [dataSource, setDataSource] = useState<
    "cv" | "linkedin" | "both" | "none"
  >("none");
  const [resumeData, setResumeData] = useState<SelectedResumeDataType | null>(
    null
  );

  const [sender, setSender] = useState(null);
  const [recipient, setRecipient] = useState(null);
  const [recentFollowUpEmails, setRecentFollowupEmails] = useState<string[]>(
    []
  );

  // State for collapsible sections
  const [isDataSourcesOpen, setIsDataSourcesOpen] = useState(false);

  // Recent letters (mock data for now)
  const [recentLetters, setRecentLetters] = useState<RecentLetter[]>([
    {
      id: "1",
      title: "Marketing Manager at Company A",
      date: "2023-05-10",
      timeAgo: "2 hours ago",
      job_title: "Marketing Manager",
      company_name: "Company A",
      content: "Cover letter content here...",
    },
    {
      id: "2",
      title: "Software Developer at Company B",
      date: "2023-05-08",
      timeAgo: "2 days ago",
      job_title: "Software Developer",
      company_name: "Company B",
      content: "Cover letter content here...",
    },
    {
      id: "3",
      title: "Project Coordinator at Company C",
      date: "2023-05-05",
      timeAgo: "5 days ago",
      job_title: "Project Coordinator",
      company_name: "Company C",
      content: "Cover letter content here...",
    },
  ]);

  const [editedCoverLetter, setEditedCoverLetter] = useState<CoverLetter>({
    userId: user?.id,
    jobDescription,
    jobTitle,
    content: generatedLetter,
    sender,
    recipient,
    templateId: selectedTemplate,
    companyName,
    tone: selectedTone,
    dataSource,
  });

  // Fetch job details function
  const fetchAndPopulateJobDetails = useCallback(async (jobId: string, company: string) => {
    setIsLoadingJobDetails(true);
    try {
      const response = await fetch(`/api/jobs?id=${jobId}&company=${company}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch job details');
      }
      
      const job = await response.json();

    

      
      // Pre-populate job information
      setJobDescription(job.description || '');
      setJobTitle(job.title || '');
      setCompanyName(job.employer || '');
      
      // Mark as pre-populated
      setIsJobPrePopulated(true);
      setSourceJobId(jobId);
      setSourceCompany(company);
      
      toast({
        title: "Job Details Loaded",
        description: `Job information for ${job.title} has been auto-populated.`,
      });
      
    } catch (error: any) {
      console.error('Error fetching job details:', error);
      toast({
        title: "Failed to Load Job Details",
        description: "Could not load job information. You can enter it manually.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingJobDetails(false);
    }
  }, [toast]);

  // Set initial tab from URL parameter if present
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (
      tabParam &&
      (tabParam === "create" ||
        tabParam === "recent" ||
        tabParam === "follow-up")
    ) {
      setActiveTab(tabParam);
    }

    // Check for job parameters and auto-populate
    const jobId = searchParams.get("jobId");
    const company = searchParams.get("company");
    
    if (jobId && company) {
      fetchAndPopulateJobDetails(jobId, company);
    }

    // Load templates when component mounts
    fetchTemplates();
  }, [searchParams, fetchTemplates, fetchAndPopulateJobDetails]);

  useEffect(() => {
    setEditedCoverLetter((prevState) => ({
      ...prevState,
      jobTitle,
      jobDescription,
      content: generatedLetter,
      sender,
      recipient,
      companyName,
      templateId: selectedTemplate,
    }));
  }, [
    jobTitle,
    jobDescription,
    companyName,
    generatedLetter,
    selectedTemplate,
  ]);

  // Handle download cover letter (memoized to avoid dependency warnings)
  const handleDownloadCoverLetter = useCallback(async () => {
    try {
      // Create a blob with the cover letter text
      const blob = new Blob([isEditing ? editedLetter : editedLetter], {
        type: "text/plain",
      });
      const url = URL.createObjectURL(blob);

      // Create a link and trigger download
      const a = document.createElement("a");
      a.href = url;
      a.download = `Cover Letter - ${jobTitle || "Position"} at ${
        companyName || "Company"
      }.txt`;
      document.body.appendChild(a);
      a.click();

      // Clean up
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Download Started",
        description: "Your cover letter is being downloaded as a text file.",
      });
    } catch (error) {
      console.error("Error downloading cover letter:", error);
      toast({
        title: "Download Failed",
        description:
          "There was an error downloading your cover letter. Please try again.",
        variant: "destructive",
      });
    }
  }, [isEditing, editedLetter, jobTitle, companyName, toast]);

  // Handle plain text download
  const handlePlainTextDownload = useCallback(() => {
    try {
      // Create a blob with the cover letter text
      const blob = new Blob([isEditing ? editedLetter : generatedLetter], {
        type: "text/plain",
      });
      const url = URL.createObjectURL(blob);

      // Create a link and trigger download
      const a = document.createElement("a");
      a.href = url;
      a.download = `Cover Letter - ${jobTitle || "Position"} at ${
        companyName || "Company"
      }.txt`;
      document.body.appendChild(a);
      a.click();

      // Clean up
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Download Started",
        description: "Your cover letter is being downloaded as a text file.",
      });
    } catch (error) {
      console.error("Error downloading cover letter:", error);
      toast({
        title: "Download Failed",
        description:
          "There was an error downloading your cover letter. Please try again.",
        variant: "destructive",
      });
    }
  }, [isEditing, editedLetter, generatedLetter, jobTitle, companyName, toast]);

  // Listen for the download event from TemplateExportButton
  useEffect(() => {
    const downloadHandler = (event: CustomEvent) => {
      if (event.detail && event.detail.id === "download-cover-letter") {
        handlePlainTextDownload();
      }
    };

    document.addEventListener(
      "plainTextDownload",
      downloadHandler as EventListener
    );

    return () => {
      document.removeEventListener(
        "plainTextDownload",
        downloadHandler as EventListener
      );
    };
  }, [handlePlainTextDownload]);

  // When generated letter updates, update the edited letter too
  useEffect(() => {
    if (generatedLetter) {
      setEditedLetter(generatedLetter);
    }
  }, [generatedLetter]);

  // Load CV files from localStorage or database (memoized)
  const loadCvFiles = useCallback(async () => {
    if (user) {
      try {
        const { data, error } = await supabase
          .from("user_cvs")
          .select("*")
          .eq("user_id", user.id)
          .order("uploaded_at", { ascending: false });

        if (error) throw error;

        if (data) {
          const formattedCvs: CvFile[] = data.map((cv) => ({
            id: cv.id,
            name: cv.filename,
            size: cv.filesize,
            type: cv.filetype,
            uploadDate: cv.uploaded_at,
            isSelected: cv.is_selected || false, // Convert null to false or undefined
          }));

          setCvFiles(formattedCvs);
        }
      } catch (error) {
        console.error("Error loading CV files:", error);
        // Fallback to localStorage
        const savedCVs = localStorage.getItem("userCVs");
        if (savedCVs) {
          try {
            setCvFiles(JSON.parse(savedCVs));
          } catch (e) {
            console.error("Error parsing saved CV data", e);
          }
        }
      }
    } else {
      // For non-logged in users, use localStorage
      const savedCVs = localStorage.getItem("userCVs");
      if (savedCVs) {
        try {
          setCvFiles(JSON.parse(savedCVs));
        } catch (e) {
          console.error("Error parsing saved CV data", e);
        }
      }
    }
  }, [user, supabase]);

  // Load LinkedIn profile from localStorage or database (memoized)
  const loadLinkedInProfile = useCallback(async () => {
    if (user) {
      try {
        const { data, error } = await supabase
          .from("linkedin_profiles")
          .select("*")
          .eq("user_id", user.id)
          .eq("status", "connected")
          .single();

        if (error && error.code !== "PGRST116") {
          // PGRST116 is "No rows found" which is expected
          throw error;
        }

        if (data) {
          // Cast the data to ensure it has the correct status
          const profileData = {
            ...data,
            status: data.status as "connected" | "disconnected",
          };
          setLinkedInProfile(profileData as LinkedInProfile);
        }
      } catch (error) {
        console.error("Error loading LinkedIn profile:", error);
        // Fallback to localStorage
        const savedProfile = localStorage.getItem("linkedInProfile");
        if (savedProfile) {
          try {
            setLinkedInProfile(JSON.parse(savedProfile));
          } catch (e) {
            console.error("Error parsing saved LinkedIn data", e);
          }
        }
      }
    } else {
      // For non-logged in users, use localStorage
      const savedProfile = localStorage.getItem("linkedInProfile");
      if (savedProfile) {
        try {
          setLinkedInProfile(JSON.parse(savedProfile));
        } catch (e) {
          console.error("Error parsing saved LinkedIn data", e);
        }
      }
    }
  }, [user, supabase]);

  // Load data on initial component mount
  useEffect(() => {
    loadCvFiles();
    loadLinkedInProfile();
  }, [user, loadCvFiles, loadLinkedInProfile]);

  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    router.push(`/dashboard/cover-letters?tab=${value}`, { scroll: false });
  };

  // Handle job description submit
  const handleJobDescriptionSubmit = (description: string, tone: string) => {
    setJobDescription(description);
    setSelectedTone(tone);

    // console.log("the description", description);
    console.log("the jobdescription", jobDescription);
    console.log("the tone", selectedTone);

    // Extract job title and company name from the description (simplified)
    const titleMatch = description.match(
      /(?:position|job|role|opening)[:\s]+([^.,\n]+)/i
    );
    const companyMatch = description.match(
      /(?:company|organization|firm)[:\s]+([^.,\n]+)/i
    );

    if (titleMatch && titleMatch[1]) {
      setJobTitle(titleMatch[1].trim());
    }

    if (companyMatch && companyMatch[1]) {
      setCompanyName(companyMatch[1].trim());
    }

    // Move to data source selection
    setStep(2);
  };

  // Handle data source change
  const handleDataSourceChange = (
    source: "cv" | "linkedin" | "both" | "none"
  ) => {
    setDataSource(source);
  };

  // Generate cover letter function
  const handleGenerateCoverLetter = useCallback(
    async (
      selectedData: SelectedResumeDataType | CvFile | null,
      selectedDataSource: "cv" | "linkedin" | "both" | "none"
    ) => {
      if (!selectedData || selectedDataSource === "none") {
        toast({
          title: "Data Source Error",
          description: "Cannot generate without selected data.",
          variant: "destructive",
        });
        return;
      }

      setGeneratingLetter(true);
      setIsRegenerating(false);
      setGenerationProgress(0);

      try {
        const generatedContent = await generateCoverLetter({
          jobDescription,
          jobTitle,
          companyName,
          tone: selectedTone,
          resumeData: selectedData, // Pass the selected data directly to the API
          dataSource: selectedDataSource,
        });

        setGeneratedLetter(generatedContent);

        // Move to cover letter editor
        setStep(3);

        // Show template selection after generating letter
        setShowTemplateSelection(true);
      } catch (error: any) {
        console.error("Error generating cover letter:", error);
        toast({
          title: "Generation Failed",
          description: error.message || "Error generating cover letter.",
          variant: "destructive",
        });
      } finally {
        setGeneratingLetter(false);
      }
    },
    [
      jobDescription,
      jobTitle,
      companyName,
      sender,
      recipient,
      selectedTone,
      toast,
    ]
  );

  // Handle cover letter regeneration
  const handleRegenerateCoverLetter = useCallback(async () => {
    setGeneratingLetter(true);
    setIsRegenerating(true);
    setGenerationProgress(0);

    try {
      const generatedContent = await generateCoverLetter({
        jobDescription,
        jobTitle,
        companyName,
        tone: selectedTone,
        resumeData, // Pass the current resumeData directly
        dataSource,
        regenerate: true,
      });

      setGeneratedLetter(generatedContent);

      // Reset editing state if user was editing
      setIsEditing(false);
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
    jobDescription,
    jobTitle,
    companyName,
    sender,
    recipient,
    selectedTone,
    dataSource,
    resumeData,
    toast,
  ]);

  // Data source selection callback
  const handleDataSourceSelected = useCallback(
    (
      sourceType: "cv" | "linkedin" | "both" | "none",
      data: SelectedResumeDataType | CvFile | null
    ) => {
      console.log("Data source selected in parent:", sourceType, data);
      setDataSource(sourceType);
      setResumeData(data);
    },
    []
  );

  // Toggle editing mode
  const handleToggleEditing = () => {
    setIsEditing(!isEditing);
  };

  // Handle changes to the edited letter
  const handleEditChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditedLetter(e.target.value);
  };

  // Save the edited version as the current letter
  const handleSaveEdits = () => {
    setIsEditing(false);
    toast({
      title: "Edits Saved",
      description: "Your edits to the cover letter have been saved.",
    });
  };

  // Apply selected template to the cover letter
  const applyTemplate = (templateId: string) => {
    setSelectedTemplate(templateId);

    // In a real application, you would format the letter based on the template
    // For this demo, we'll just show the template was selected
    toast({
      title: "Template Applied",
      description:
        "Your cover letter has been formatted with the selected template.",
    });

    // Hide template selection after applying
    setShowTemplateSelection(false);
  };

  // Skip template selection
  const skipTemplateSelection = () => {
    setShowTemplateSelection(false);
    toast({
      title: "No Template Selected",
      description: "Your cover letter will use the default format.",
    });
  };

  // Save cover letter with the right parameter structure
  const handleSaveCoverLetter = async () => {
    try {
      // Pass positional parameters as expected by the implementation
      const coverLetterId = await saveCoverLetter(
        editedCoverLetter // 1st parameter: content
      );

      toast({
        title: "Cover Letter Saved",
        description: "Your cover letter has been saved successfully.",
      });

      // Refresh recent letters
      // loadRecentLetters();
    } catch (error) {
      console.error("Error saving cover letter:", error);
      toast({
        title: "Save Failed",
        description:
          "There was an error saving your cover letter. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Copy cover letter to clipboard
  const handleCopyCoverLetter = async () => {
    try {
      await navigator.clipboard.writeText(
        isEditing ? editedLetter : editedLetter
      );

      toast({
        title: "Copied to Clipboard",
        description: "Your cover letter has been copied to your clipboard.",
      });
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      toast({
        title: "Copy Failed",
        description:
          "There was an error copying to your clipboard. Please try manually selecting and copying the text.",
        variant: "destructive",
      });
    }
  };

  // Progress simulation for demo purposes
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (generatingLetter) {
      setGenerationProgress(0);

      interval = setInterval(() => {
        setGenerationProgress((prev) => {
          // Increase by random amount between 5-15%
          const increment = Math.random() * 10 + 5;
          const newProgress = prev + increment;

          // Cap at 95% - the final 5% happens when generation completes
          return newProgress > 95 ? 95 : newProgress;
        });
      }, 300);
    } else if (generatedLetter) {
      // When generation completes, set to 100%
      setGenerationProgress(100);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [generatingLetter, generatedLetter]);

  // Get status of data sources
  const hasCV = cvFiles.some((cv) => cv.isSelected);
  const hasLinkedIn = linkedInProfile?.status === "connected";

  // Loading spinner component
  const LoadingSpinner = ({ className }: { className?: string }) => (
    <Loader2 className={`h-4 w-4 animate-spin ${className || ""}`} />
  );

  // Template Selection Component
  const TemplateSelectionComponent = () => {
    // Mock templates if real ones are not available
    const availableTemplates =
      templates?.length > 0
        ? templates
        : [
            {
              id: "modern",
              name: "Modern",
              description: "Clean and contemporary layout",
            },
            {
              id: "traditional",
              name: "Traditional",
              description: "Classic and formal style",
            },
            {
              id: "creative",
              name: "Creative",
              description: "Unique design for creative roles",
            },
            {
              id: "simple",
              name: "Simple",
              description: "Minimalist and straightforward",
            },
            {
              id: "executive",
              name: "Executive",
              description: "Professional style for senior positions",
            },
          ];

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
            {availableTemplates.map((template) => (
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
                <div className="mt-3 h-20 bg-muted/60 rounded flex items-center justify-center">
                  {/* <LayoutTemplate className="h-8 w-8 text-muted-foreground/40" /> */}
                  {template.thumbnail_url ? (
                    <img
                      src={template.thumbnail_url}
                      alt={`${template.name} template preview`}
                      className="w-full h-full object-cover object-top"
                      onError={(e) => {
                        // Fallback to icon if image fails to load
                        e.target.style.display = "none";
                        e.target.nextSibling.style.display = "flex";
                      }}
                    />
                  ) : null}

                  {/* Fallback icon (shown if no thumbnail or image fails) */}
                  <div
                    className={`w-full h-full flex items-center justify-center ${
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

  // Modern loading spinner with circular progress indicator
  const LoadingGeneration = () => (
    <div className="py-16 flex flex-col items-center justify-center">
      <div className="relative mb-8">
        {/* Circular background */}
        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
          {/* Inner spinner */}
          <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center z-10 shadow-lg">
            <Sparkles className="h-10 w-10 text-primary animate-pulse" />
          </div>
        </div>

        {/* Rotating progress indicator */}
        <div
          className="absolute top-0 left-0 w-32 h-32 rounded-full"
          style={{
            background: `conic-gradient(from 0deg, #6366f1 0%, #8b5cf6 ${generationProgress}%, transparent ${generationProgress}%, transparent 100%)`,
            transform: "rotate(-90deg)",
            transition: "all 0.3s ease",
          }}
        />

        {/* Progress percentage in the bottom right */}
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
    <div>
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
        <TabsList className="mb-6">
          <TabsTrigger value="create">
            <Sparkles className="h-4 w-4 mr-2" />
            Create New
          </TabsTrigger>
          <TabsTrigger value="recent">
            <History className="h-4 w-4 mr-2" />
            Recent
          </TabsTrigger>
          <TabsTrigger value="follow-up">
            <MailCheck className="h-4 w-4 mr-2" />
            Follow-Up
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create">
          {/* Show job loading state */}
          {isLoadingJobDetails && (
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner className="mr-3" />
                  <span className="text-muted-foreground">Loading job details...</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Show back to job link if coming from a job */}
          {isJobPrePopulated && sourceJobId && sourceCompany && (
            <Alert className="mb-6 bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-500" />
              <AlertDescription className="text-blue-700">
                Job details have been auto-populated from the selected position.{" "}
                <Link 
                  href={`/dashboard/jobs/${sourceJobId}?company=${sourceCompany}`}
                  className="underline hover:no-underline font-medium"
                >
                  View original job posting
                </Link>
              </AlertDescription>
            </Alert>
          )}

          {step === 1 && (
            <div>
              {/* Compact Data Sources Section */}
              <Card className="mb-6">
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
                        <Button variant="outline" size="sm">
                          {isDataSourcesOpen ? "Hide" : "Manage"}
                        </Button>
                      </CollapsibleTrigger>
                    </Collapsible>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4 mb-4">
                    {/* Updated CV Connection Display */}
                    <div
                      className={`flex items-center rounded-md border p-3 ${
                        hasCV
                          ? "border-green-500/50 bg-green-500/10"
                          : "border-muted bg-muted/50"
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
                            {cvFiles?.find((cv) => cv.isSelected)?.name
                              ?.length &&
                            cvFiles.find((cv) => cv.isSelected)?.name.length >
                              15
                              ? cvFiles
                                  .find((cv) => cv.isSelected)
                                  ?.name?.substring(0, 15) + "..."
                              : cvFiles.find((cv) => cv.isSelected)?.name}
                          </p>
                        ) : (
                          <p className="text-xs text-blue-600 font-medium hover:underline">
                            Connect
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Updated LinkedIn Connection Display with null safety */}
                    <div
                      className={`flex items-center rounded-md border p-3 ${
                        hasLinkedIn
                          ? "border-green-500/50 bg-green-500/10"
                          : "border-muted bg-muted/50"
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
                          {/* CV Manager */}
                          <CVManager />

                          {/* LinkedIn Manager */}
                          <LinkedInManager />
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </CardContent>
              </Card>

              {/* Redesigned Job Description Card */}
              <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <CardHeader className="pb-3">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div>
                      <CardTitle className="text-2xl flex items-center">
                        <Sparkles className="h-5 w-5 mr-2 text-primary" />
                        {isJobPrePopulated ? "Review Job Details" : "Create a Cover Letter"}
                      </CardTitle>
                      {isJobPrePopulated && (
                        <CardDescription className="text-blue-600 mt-1">
                          Job details have been automatically loaded for: <strong>{jobTitle}</strong> at <strong>{companyName}</strong>
                        </CardDescription>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      <div
                        className={`flex items-center rounded-full px-2 py-1 ${
                          hasCV ? "bg-green-500/10 text-green-600" : "bg-muted"
                        }`}
                      >
                        <FileText className="h-3 w-3 mr-1" />
                        <span>CV {hasCV ? "✓" : ""}</span>
                      </div>
                      <div
                        className={`flex items-center rounded-full px-2 py-1 ${
                          hasLinkedIn
                            ? "bg-green-500/10 text-green-600"
                            : "bg-muted"
                        }`}
                      >
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
      user={user}
      initialJobDescription={isJobPrePopulated ? jobDescription : ""}
      initialJobTitle={isJobPrePopulated ? jobTitle : ""}
      initialCompanyName={isJobPrePopulated ? companyName : ""}
      isPrePopulated={isJobPrePopulated}
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

              {/* ResumeSourceSelector with our callback */}
              <ResumeSourceSelector
                cvFiles={cvFiles}
                linkedInProfile={linkedInProfile}
                onDataSourceSelected={handleDataSourceSelected}
              />

              {/* Generate button for explicit generation after data source selection */}
              <div className="mt-6 flex justify-end">
                <Button
                  onClick={() => {
                    if (dataSource !== "none" && resumeData) {
                      handleGenerateCoverLetter(resumeData, dataSource);
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

          {step === 3 && (
            <div>
              {/* Template Selection Section (displayed when showTemplateSelection is true) */}
              {/* { showTemplateSelection && <TemplateSelectionComponent /> } */}

              <div className="w-full max-w-full overflow-hidden">
                <CoverLetterEditor
                  coverLetter={editedCoverLetter}
                />
              </div>
            </div>
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
                Quick access to your recently created follow-up emails
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentFollowUpEmails?.length > 0 ? (
                  <div className="divide-y">
                    {recentFollowUpEmails?.map((email) => (
                      <div
                        key={email.id}
                        className="py-4 flex flex-col sm:flex-row justify-between gap-4"
                      >
                        <div className="flex items-start">
                          <div className="bg-primary/10 p-2 rounded mr-3 mt-1">
                            <MailCheck className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{letter.title}</p>
                            <div className="flex items-center text-sm text-muted-foreground mt-1">
                              <Clock className="h-3.5 w-3.5 mr-1" />
                              <span>{letter.timeAgo}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-9 sm:ml-0">
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                          <Button variant="outline" size="sm">
                            Download
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-60" />
                    <h3 className="text-lg font-medium mb-2">
                      No cover letters yet
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      You haven&apos;t created any cover letters recently.
                    </p>
                    <Button
                      onClick={() => {
                        setActiveTab("create");
                        handleTabChange("create");
                      }}
                    >
                      Create a New Cover Letter
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-center pt-2">
              <Link href="/dashboard/history">
                <Button variant="link">
                  View your full history
                  <ExternalLink className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </CardFooter>
          </Card>
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