import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle2, 
  User, 
  Briefcase, 
  FileUp, 
  FileText, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft,
  Upload
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/hooks/useAuth';
import { createBrowserClient } from '@/lib/supabase';
import Link from 'next/link';
import { hookstate, State } from '@hookstate/core';

// Define the form schemas
const personalInfoSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  title: z.string().optional(),
  industry: z.string().optional(),
  experienceLevel: z.enum(["entry", "mid", "senior", "executive"]).optional(),
});

const careerGoalsSchema = z.object({
  currentRole: z.string().optional(),
  desiredRole: z.string().optional(),
  jobSearchStatus: z.enum(["active", "passive", "planning"]),
  desiredIndustries: z.array(z.string()).optional(),
  priorities: z.array(z.string()).optional(),
});

export default function Onboarding() {
    const router = useRouter();
    const { toast } = useToast();
    const { user } = useAuth();
    const supabase = createBrowserClient();
  
  // Create onboardingState inside the component
  const onboardingState = hookstate({
    step: 1,
    totalSteps: 5,
    completed: false,
  });
  
  // Local state
  const [activeStep, setActiveStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [linkedInConnected, setLinkedInConnected] = useState(false);
  const [jobSearchPreferences, setJobSearchPreferences] = useState({
    location: '',
    remote: false,
    types: [] as string[],
    industries: [] as string[]
  });
  
  // Forms
  const personalInfoForm = useForm<z.infer<typeof personalInfoSchema>>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      title: "",
      industry: "",
      experienceLevel: undefined,
    },
  });
  
  const careerGoalsForm = useForm<z.infer<typeof careerGoalsSchema>>({
    resolver: zodResolver(careerGoalsSchema),
    defaultValues: {
      currentRole: "",
      desiredRole: "",
      jobSearchStatus: "planning",
      desiredIndustries: [],
      priorities: [],
    },
  });
  
  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCvFile(e.target.files[0]);
    }
  };
  
  // Handle LinkedIn connection
  const handleLinkedInConnect = () => {
    setLoading(true);
    // Simulate connection process
    setTimeout(() => {
      setLinkedInConnected(true);
      setLoading(false);
      toast({
        title: "LinkedIn Connected",
        description: "Your LinkedIn profile has been successfully connected.",
      });
    }, 1500);
  };
  
  // Submit personal info
  const onPersonalInfoSubmit = (data: z.infer<typeof personalInfoSchema>) => {
    setLoading(true);
    
    // Save to user profile in Supabase
    (async () => {
      try {
        if (!user) {
          throw new Error("User not authenticated");
        }
        
        const { error } = await supabase
          .from('profiles')
          .update({
            first_name: data.firstName,
            last_name: data.lastName,
            job_title: data.title,
            industry: data.industry,
            experience_level: data.experienceLevel,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);
        
        if (error) throw error;
        
        toast({
          title: "Profile Updated",
          description: "Your personal information has been saved successfully.",
        });
        
        // Proceed to next step
        setActiveStep(2);
      } catch (error) {
        console.error('Error updating profile:', error);
        toast({
          title: "Error",
          description: "Failed to save your profile. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    })();
  };
  
  // Submit career goals
  const onCareerGoalsSubmit = (data: z.infer<typeof careerGoalsSchema>) => {
    setLoading(true);
    
    // Save to user profile in Supabase
    (async () => {
      try {
        if (!user) {
          throw new Error("User not authenticated");
        }
        
        const { error } = await supabase
          .from('profiles')
          .update({
            current_role: data.currentRole,
            desired_role: data.desiredRole,
            job_search_status: data.jobSearchStatus,
            desired_industries: data.desiredIndustries,
            career_priorities: data.priorities,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);
        
        if (error) throw error;
        
        toast({
          title: "Career Goals Saved",
          description: "Your career goals have been updated successfully.",
        });
        
        // Proceed to next step
        setActiveStep(3);
      } catch (error) {
        console.error('Error updating career goals:', error);
        toast({
          title: "Error",
          description: "Failed to save your career goals. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    })();
  };
  
  // Upload CV file
  const uploadCV = async () => {
    if (!cvFile || !user) return;
    
    setLoading(true);
    
    try {
      // Prepare file path
      const fileExt = cvFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('cvs')
        .upload(filePath, cvFile, {
          upsert: false,
          contentType: cvFile.type,
        });
      
      if (error) throw error;
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('cvs')
        .getPublicUrl(filePath);
      
      // Create record in user_cvs table
      const { error: cvError } = await supabase
        .from('user_cvs')
        .insert({
          user_id: user.id,
          filename: cvFile.name,
          filesize: cvFile.size,
          filetype: cvFile.type,
          filepath: filePath,
          file_url: urlData.publicUrl,
          uploaded_at: new Date().toISOString(),
          is_selected: true,
        });
      
      if (cvError) throw cvError;
      
      toast({
        title: "CV Uploaded",
        description: "Your CV has been uploaded successfully.",
      });
      
      // Save to local storage for immediate use
      localStorage.setItem('userCV', JSON.stringify({
        name: cvFile.name,
        size: cvFile.size,
        type: cvFile.type,
        date: new Date().toISOString(),
        url: urlData.publicUrl,
      }));
      
      // Proceed to next step
      setActiveStep(4);
    } catch (error) {
      console.error('Error uploading CV:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload your CV. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Save job preferences
  const saveJobPreferences = async () => {
    setLoading(true);
    
    try {
      if (!user) {
        throw new Error("User not authenticated");
      }
      
      const { error } = await supabase
        .from('profiles')
        .update({
          job_location_preference: jobSearchPreferences.location,
          remote_preference: jobSearchPreferences.remote,
          job_types: jobSearchPreferences.types,
          preferred_industries: jobSearchPreferences.industries,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      toast({
        title: "Preferences Saved",
        description: "Your job search preferences have been saved.",
      });
      
      // Proceed to final step
      setActiveStep(5);
    } catch (error) {
      console.error('Error saving job preferences:', error);
      toast({
        title: "Error",
        description: "Failed to save your preferences. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Complete onboarding
  const completeOnboarding = () => {
    setLoading(true);
    
    // Save onboarding completion status
    (async () => {
      try {
        if (!user) {
          throw new Error("User not authenticated");
        }
        
        const { error } = await supabase
          .from('profiles')
          .update({
            onboarding_completed: true,
            onboarding_completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);
        
        if (error) throw error;
        
        // Update global state
        onboardingState.completed.set(true);
        
        toast({
          title: "Onboarding Complete",
          description: "Welcome to AI Cover Letter Assistant! You're all set up and ready to go.",
        });
        
        // Redirect to dashboard
        router.push('/dashboard');
      } catch (error) {
        console.error('Error completing onboarding:', error);
        toast({
          title: "Error",
          description: "There was an issue completing your onboarding. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    })();
  };
  
  // Skip onboarding
  const skipOnboarding = () => {
    // Update global state
    onboardingState.completed.set(true);
    
    // Redirect to dashboard
    router.push('/dashboard');
  };
  
  // Progress calculation
  const progress = (activeStep / 5) * 100;
  
  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-muted-foreground">Setup Progress</span>
          <span className="text-sm font-medium">{activeStep} of 5</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>
      
      {/* Step content */}
      <Card className="border-teal-100 shadow-sm">
        {activeStep === 1 && (
          <>
            <CardHeader>
              <CardTitle className="flex items-center text-2xl">
                <User className="mr-2 h-6 w-6 text-teal-600" />
                Personal Information
              </CardTitle>
              <CardDescription>
                Tell us a bit about yourself so we can personalize your experience
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...personalInfoForm}>
                <form onSubmit={personalInfoForm.handleSubmit(onPersonalInfoSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={personalInfoForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your first name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={personalInfoForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your last name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={personalInfoForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Professional Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Software Engineer, Marketing Manager" {...field} />
                        </FormControl>
                        <FormDescription>
                          Your current professional title or role
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={personalInfoForm.control}
                    name="industry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Industry</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Technology, Healthcare, Finance" {...field} />
                        </FormControl>
                        <FormDescription>
                          The industry you primarily work in
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={personalInfoForm.control}
                    name="experienceLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Experience Level</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="entry" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Entry-level (0-2 years)
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="mid" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Mid-level (3-5 years)
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="senior" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Senior (6+ years)
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="executive" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Executive/Leadership
                              </FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="pt-2 flex justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={skipOnboarding}
                    >
                      Skip Onboarding
                    </Button>
                    <Button 
                      type="submit"
                      disabled={loading}
                      className="bg-teal-600 hover:bg-teal-700"
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Saving...
                        </>
                      ) : (
                        <>
                          Continue
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </>
        )}
        
        {activeStep === 2 && (
          <>
            <CardHeader>
              <CardTitle className="flex items-center text-2xl">
                <Briefcase className="mr-2 h-6 w-6 text-teal-600" />
                Career Goals
              </CardTitle>
              <CardDescription>
                Let us know your career aspirations to optimize your job search
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...careerGoalsForm}>
                <form onSubmit={careerGoalsForm.handleSubmit(onCareerGoalsSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={careerGoalsForm.control}
                      name="currentRole"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Role</FormLabel>
                          <FormControl>
                            <Input placeholder="Your current job title" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={careerGoalsForm.control}
                      name="desiredRole"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Desired Role</FormLabel>
                          <FormControl>
                            <Input placeholder="Job title you're seeking" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={careerGoalsForm.control}
                    name="jobSearchStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Job Search Status</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="active" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Actively searching for a new job
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="passive" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Open to opportunities, but not actively searching
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="planning" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Planning to start a job search soon
                              </FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="pt-2 flex justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setActiveStep(1)}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                    <Button 
                      type="submit"
                      disabled={loading}
                      className="bg-teal-600 hover:bg-teal-700"
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Saving...
                        </>
                      ) : (
                        <>
                          Continue
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </>
        )}
        
        {activeStep === 3 && (
          <>
            <CardHeader>
              <CardTitle className="flex items-center text-2xl">
                <FileUp className="mr-2 h-6 w-6 text-teal-600" />
                Upload Your CV
              </CardTitle>
              <CardDescription>
                Upload your CV to help us create personalized cover letters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="mb-4">
                      <Label>Upload CV File</Label>
                      <div 
                        className={`mt-2 border-2 border-dashed rounded-lg p-6 text-center ${
                          cvFile ? 'border-teal-300 bg-teal-50' : 'border-gray-300 hover:border-teal-300'
                        } transition-colors cursor-pointer`}
                        onClick={() => document.getElementById('cv-upload')?.click()}
                      >
                        {cvFile ? (
                          <div className="space-y-2">
                            <CheckCircle2 className="h-8 w-8 mx-auto text-teal-500" />
                            <p className="text-sm font-medium">{cvFile.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(cvFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Upload className="h-8 w-8 mx-auto text-gray-400" />
                            <p className="text-sm font-medium">Click to upload or drag and drop</p>
                            <p className="text-xs text-muted-foreground">
                              PDF, DOCX or TXT (max. 5MB)
                            </p>
                          </div>
                        )}
                        <input
                          id="cv-upload"
                          type="file"
                          accept=".pdf,.docx,.doc,.txt"
                          className="hidden"
                          onChange={handleFileUpload}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label>Or Connect LinkedIn</Label>
                      <div className="mt-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          className="w-full" 
                          onClick={handleLinkedInConnect}
                          disabled={loading || linkedInConnected}
                        >
                          {linkedInConnected ? (
                            <>
                              <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                              LinkedIn Connected
                            </>
                          ) : loading ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Connecting...
                            </>
                          ) : (
                            <>
                              <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="#0A66C2">
                                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                              </svg>
                              Connect with LinkedIn
                            </>
                            )}
                            </Button>
                          </div>
                        </div>
                        
                        <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
                          <h4 className="text-sm font-medium text-blue-800 mb-1">Why upload your CV?</h4>
                          <ul className="text-xs text-blue-700 space-y-1">
                            <li className="flex items-start">
                              <CheckCircle2 className="h-3 w-3 text-blue-500 mr-1 mt-0.5 flex-shrink-0" />
                              <span>Automatically extract your skills and experience</span>
                            </li>
                            <li className="flex items-start">
                              <CheckCircle2 className="h-3 w-3 text-blue-500 mr-1 mt-0.5 flex-shrink-0" />
                              <span>Create tailored cover letters more quickly</span>
                            </li>
                            <li className="flex items-start">
                              <CheckCircle2 className="h-3 w-3 text-blue-500 mr-1 mt-0.5 flex-shrink-0" />
                              <span>Highlight your most relevant achievements</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-2 flex justify-between">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setActiveStep(2)}
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                      </Button>
                      <Button 
                        type="button"
                        onClick={uploadCV}
                        disabled={loading || (!cvFile && !linkedInConnected)}
                        className="bg-teal-600 hover:bg-teal-700"
                      >
                        {loading ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Uploading...
                          </>
                        ) : (
                          <>
                            Continue
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </>
            )}
            
            {activeStep === 4 && (
              <>
                <CardHeader>
                  <CardTitle className="flex items-center text-2xl">
                    <Briefcase className="mr-2 h-6 w-6 text-teal-600" />
                    Job Search Preferences
                  </CardTitle>
                  <CardDescription>
                    Tell us about the jobs you&apos;re looking for
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="location">Preferred Location</Label>
                      <Input 
                        id="location" 
                        placeholder="e.g. Oslo, Norway" 
                        value={jobSearchPreferences.location}
                        onChange={(e) => setJobSearchPreferences(prev => ({
                          ...prev,
                          location: e.target.value
                        }))}
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Enter the city or region where you want to work
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="remote" 
                        checked={jobSearchPreferences.remote}
                        onCheckedChange={(checked) => setJobSearchPreferences(prev => ({
                          ...prev,
                          remote: checked === true
                        }))}
                      />
                      <Label htmlFor="remote">Open to remote work</Label>
                    </div>
                    
                    <div>
                      <Label>Job Types</Label>
                      <div className="grid grid-cols-2 mt-2 gap-2">
                        {['Full-time', 'Part-time', 'Contract', 'Temporary', 'Internship', 'Freelance'].map((type) => (
                          <div key={type} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`type-${type}`}
                              checked={jobSearchPreferences.types.includes(type)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setJobSearchPreferences(prev => ({
                                    ...prev,
                                    types: [...prev.types, type]
                                  }));
                                } else {
                                  setJobSearchPreferences(prev => ({
                                    ...prev,
                                    types: prev.types.filter(t => t !== type)
                                  }));
                                }
                              }}
                            />
                            <Label htmlFor={`type-${type}`}>{type}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <Label>Industries</Label>
                      <div className="grid grid-cols-2 mt-2 gap-2">
                        {['Technology', 'Healthcare', 'Finance', 'Education', 'Marketing', 'Manufacturing', 'Retail', 'Creative'].map((industry) => (
                          <div key={industry} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`industry-${industry}`}
                              checked={jobSearchPreferences.industries.includes(industry)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setJobSearchPreferences(prev => ({
                                    ...prev,
                                    industries: [...prev.industries, industry]
                                  }));
                                } else {
                                  setJobSearchPreferences(prev => ({
                                    ...prev,
                                    industries: prev.industries.filter(i => i !== industry)
                                  }));
                                }
                              }}
                            />
                            <Label htmlFor={`industry-${industry}`}>{industry}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="pt-2 flex justify-between">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setActiveStep(3)}
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                      </Button>
                      <Button 
                        type="button"
                        onClick={saveJobPreferences}
                        disabled={loading}
                        className="bg-teal-600 hover:bg-teal-700"
                      >
                        {loading ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Saving...
                          </>
                        ) : (
                          <>
                            Continue
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </>
            )}
            
            {activeStep === 5 && (
              <>
                <CardHeader>
                  <CardTitle className="flex items-center text-2xl">
                    <Sparkles className="mr-2 h-6 w-6 text-teal-600" />
                    You&apos;re All Set!
                  </CardTitle>
                  <CardDescription>
                    Your profile is ready and you can start creating cover letters
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="bg-teal-50 p-6 rounded-lg border border-teal-100 text-center">
                      <CheckCircle2 className="h-12 w-12 mx-auto text-teal-600 mb-4" />
                      <h3 className="text-xl font-medium text-teal-900 mb-2">Profile Setup Complete</h3>
                      <p className="text-teal-700">
                        Thanks for taking the time to set up your profile! We&apos;ll use this information to create personalized cover letters that match your skills and experience.
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="border-teal-100">
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <FileText className="h-8 w-8 mx-auto text-teal-600 mb-3" />
                            <h4 className="font-medium mb-1">Create Cover Letter</h4>
                            <p className="text-xs text-muted-foreground mb-4">
                              Start creating a personalized cover letter
                            </p>
                            <Button 
                              asChild
                              size="sm" 
                              className="w-full bg-teal-600 hover:bg-teal-700"
                            >
                              <Link href="/dashboard/cover-letters?tab=create">
                                Get Started
                              </Link>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="border-teal-100">
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <FileUp className="h-8 w-8 mx-auto text-teal-600 mb-3" />
                            <h4 className="font-medium mb-1">Create Resume</h4>
                            <p className="text-xs text-muted-foreground mb-4">
                              Build a professional resume
                            </p>
                            <Button 
                              asChild
                              size="sm" 
                              variant="outline"
                            >
                              <Link href="/dashboard/resumes/new">
                                Create Resume
                              </Link>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="border-teal-100">
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <Sparkles className="h-8 w-8 mx-auto text-teal-600 mb-3" />
                            <h4 className="font-medium mb-1">Upgrade Plan</h4>
                            <p className="text-xs text-muted-foreground mb-4">
                              Get unlimited cover letters and more
                            </p>
                            <Button 
                              asChild
                              size="sm" 
                              variant="outline"
                            >
                              <Link href="/pricing">
                                View Plans
                              </Link>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <div className="pt-2 flex justify-between">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setActiveStep(4)}
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                      </Button>
                      <Button 
                        type="button"
                        onClick={completeOnboarding}
                        disabled={loading}
                        className="bg-teal-600 hover:bg-teal-700"
                      >
                        {loading ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Loading...
                          </>
                        ) : (
                          <>
                            Go to Dashboard
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </>
            )}
          </Card>
        </div>
      );
    }