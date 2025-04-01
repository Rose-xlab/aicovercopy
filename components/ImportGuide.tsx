"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Upload, ArrowRight, FileText, Edit, Eye, FileSearch, AlertTriangle, Info, FileUp } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useCVResumeIntegration } from '@/lib/hooks/useCVResumeIntegration';
import Link from 'next/link';

interface ImportGuideProps {
  resumeId: string;
  isOpen: boolean;
  onClose: () => void;
  fromCV?: boolean; // New prop to indicate if this was from a CV
  cvName?: string;  // Optional prop for the CV name
}

export default function ImportGuide({ 
  resumeId, 
  isOpen, 
  onClose, 
  fromCV = false,
  cvName
}: ImportGuideProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [hasSeenGuide, setHasSeenGuide] = useState(false);
  const [linkedCV, setLinkedCV] = useState<string | null>(null);
  const { toast } = useToast();
  const { getLinkedCV, isLoading: isCheckingCV } = useCVResumeIntegration();

  // Load preference from localStorage on component mount
  useEffect(() => {
    const guideSeen = localStorage.getItem('importGuideSeen');
    if (guideSeen === 'true') {
      setHasSeenGuide(true);
    }
  }, []);

  // Check if this resume has a linked CV
  useEffect(() => {
    const checkForLinkedCV = async () => {
      if (resumeId && isOpen) {
        const cv = await getLinkedCV(resumeId);
        if (cv) {
          setLinkedCV(cv.name);
        }
      }
    };
    
    checkForLinkedCV();
  }, [resumeId, isOpen, getLinkedCV]);

  // Mark guide as seen and close
  const completeGuide = () => {
    localStorage.setItem('importGuideSeen', 'true');
    setHasSeenGuide(true);
    onClose();
  };

  // Don't show if user has seen guide before
  if (hasSeenGuide && !isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="mb-2 text-center sm:text-left">
          <DialogTitle className="flex flex-col sm:flex-row items-center text-lg sm:text-xl">
            <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-green-500 mb-1 sm:mb-0 sm:mr-2" />
            <span>Resume Successfully Imported!</span>
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Your resume has been parsed using AI and is now ready to use
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="1" value={currentStep.toString()} onValueChange={(v) => setCurrentStep(parseInt(v))}>
          <TabsList className="grid grid-cols-3 mb-4 w-full h-auto">
            <TabsTrigger value="1" disabled={currentStep < 1} className="h-auto py-1 px-1 sm:py-2 sm:px-3 text-xs sm:text-sm flex flex-col sm:flex-row items-center">
              <Badge className="h-5 w-5 sm:h-6 sm:w-6 rounded-full mb-1 sm:mb-0 sm:mr-2 flex items-center justify-center text-xs">1</Badge> 
              <span className="hidden xs:inline">Import Complete</span>
              <span className="xs:hidden">Import</span>
            </TabsTrigger>
            <TabsTrigger value="2" disabled={currentStep < 2} className="h-auto py-1 px-1 sm:py-2 sm:px-3 text-xs sm:text-sm flex flex-col sm:flex-row items-center">
              <Badge className="h-5 w-5 sm:h-6 sm:w-6 rounded-full mb-1 sm:mb-0 sm:mr-2 flex items-center justify-center text-xs">2</Badge> 
              <span className="hidden xs:inline">Next Steps</span>
              <span className="xs:hidden">Steps</span>
            </TabsTrigger>
            <TabsTrigger value="3" disabled={currentStep < 3} className="h-auto py-1 px-1 sm:py-2 sm:px-3 text-xs sm:text-sm flex flex-col sm:flex-row items-center">
              <Badge className="h-5 w-5 sm:h-6 sm:w-6 rounded-full mb-1 sm:mb-0 sm:mr-2 flex items-center justify-center text-xs">3</Badge> 
              <span className="hidden xs:inline">Resume Tips</span>
              <span className="xs:hidden">Tips</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="1" className="space-y-3 sm:space-y-4 mt-0">
            <Alert className="bg-green-50 border-green-200 p-3 sm:p-4">
              <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
              <AlertTitle className="text-green-800 text-sm sm:text-base">Import Successful</AlertTitle>
              <AlertDescription className="text-green-700 text-xs sm:text-sm">
                {fromCV || linkedCV ? (
                  <>
                    Your CV{cvName || linkedCV ? ` "${cvName || linkedCV}"` : ""} has been converted to a resume and saved to your account
                  </>
                ) : (
                  <>
                    Your resume has been analyzed and saved to your account
                  </>
                )}
              </AlertDescription>
            </Alert>

            <div className="space-y-3 sm:space-y-4">
              <h3 className="font-medium text-sm sm:text-base">What happened?</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <Card>
                  <CardHeader className="p-3 sm:p-4 sm:pb-2">
                    <CardTitle className="text-sm sm:text-base flex items-center">
                      <Upload className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-blue-500" />
                      File Analyzed
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Your {fromCV || linkedCV ? "CV" : "resume"} file was uploaded and analyzed using AI to extract important information like your work history, education, and skills.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="p-3 sm:p-4 sm:pb-2">
                    <CardTitle className="text-sm sm:text-base flex items-center">
                      <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-blue-500" />
                      Resume Created
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      A new resume has been created and saved to your account with all the extracted information.
                    </p>
                  </CardContent>
                </Card>
                
                {/* Add the conditional CV integration card */}
                {(fromCV || linkedCV) && (
                  <Card className="sm:col-span-2">
                    <CardHeader className="p-3 sm:p-4 sm:pb-2">
                      <CardTitle className="text-sm sm:text-base flex items-center">
                        <FileUp className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-green-500" />
                        CV Integration
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Your CV has been linked to this resume. You can use this resume for applications, and it will be available in both your CV and resume sections.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
            
            <div className="flex justify-end pt-2">
              <Button onClick={() => setCurrentStep(2)} size="sm" className="h-8 sm:h-10 text-xs sm:text-sm">
                Next Step
                <ArrowRight className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="2" className="space-y-3 sm:space-y-4 mt-0">
            <h3 className="font-medium text-sm sm:text-base">What would you like to do with your resume?</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <Card className="hover:border-primary/50 hover:shadow-sm transition-all">
                <CardHeader className="p-3 sm:p-4 sm:pb-2">
                  <CardTitle className="text-sm sm:text-base flex items-center">
                    <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-purple-500" />
                    Edit Resume
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0 pb-2 sm:pb-4">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Review and edit your resume information to make sure everything was imported correctly.
                  </p>
                </CardContent>
                <CardFooter className="p-3 pt-0 sm:p-4 sm:pt-0">
                  <Button asChild variant="outline" className="w-full h-8 sm:h-10 text-xs sm:text-sm">
                    <Link href={`/dashboard/resumes/${resumeId}`}>Edit Resume</Link>
                  </Button>
                </CardFooter>
              </Card>

              <Card className="hover:border-primary/50 hover:shadow-sm transition-all">
                <CardHeader className="p-3 sm:p-4 sm:pb-2">
                  <CardTitle className="text-sm sm:text-base flex items-center">
                    <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-blue-500" />
                    Preview Resume
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0 pb-2 sm:pb-4">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    See how your resume looks with our formatting templates and download it in different formats.
                  </p>
                </CardContent>
                <CardFooter className="p-3 pt-0 sm:p-4 sm:pt-0">
                  <Button asChild variant="outline" className="w-full h-8 sm:h-10 text-xs sm:text-sm">
                    <Link href={`/dashboard/resumes/${resumeId}/preview`}>Preview</Link>
                  </Button>
                </CardFooter>
              </Card>

              <Card className="hover:border-primary/50 hover:shadow-sm transition-all sm:col-span-2 lg:col-span-1">
                <CardHeader className="p-3 sm:p-4 sm:pb-2">
                  <CardTitle className="text-sm sm:text-base flex items-center">
                    <FileSearch className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-amber-500" />
                    ATS Scanner
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0 pb-2 sm:pb-4">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Check how well your resume will perform with Applicant Tracking Systems and get improvement tips.
                  </p>
                </CardContent>
                <CardFooter className="p-3 pt-0 sm:p-4 sm:pt-0">
                  <Button asChild variant="outline" className="w-full h-8 sm:h-10 text-xs sm:text-sm">
                    <Link href={`/dashboard/resumes/${resumeId}/ats-scanner`}>ATS Scanner</Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>
            
            <div className="flex justify-end space-x-2 pt-2">
              <Button variant="outline" onClick={() => setCurrentStep(1)} size="sm" className="h-8 sm:h-10 text-xs sm:text-sm">
                Previous
              </Button>
              <Button onClick={() => setCurrentStep(3)} size="sm" className="h-8 sm:h-10 text-xs sm:text-sm">
                Next Step
                <ArrowRight className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="3" className="space-y-3 sm:space-y-4 mt-0">
            <Alert className="p-3 sm:p-4">
              <Info className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
              <AlertTitle className="text-sm sm:text-base">Resume Tips</AlertTitle>
              <AlertDescription className="text-xs sm:text-sm">
                Here are some tips to make your resume even better
              </AlertDescription>
            </Alert>
            
            <div className="space-y-3 sm:space-y-4">
              <h3 className="font-medium text-sm sm:text-base">Maximize your resume impact</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <Card>
                  <CardHeader className="p-3 sm:p-4 sm:pb-2">
                    <CardTitle className="text-sm sm:text-base">Tailor to Job Descriptions</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Customize your resume for each job by matching keywords from the job description. Use our ATS Scanner to check compatibility.
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="p-3 sm:p-4 sm:pb-2">
                    <CardTitle className="text-sm sm:text-base">Quantify Achievements</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Add numbers and metrics to your achievements. For example, "Increased sales by 20%" is stronger than "Increased sales."
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="p-3 sm:p-4 sm:pb-2">
                    <CardTitle className="text-sm sm:text-base">Use Action Verbs</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Start bullet points with strong action verbs like achieved, implemented, or reduced instead of using passive language.
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="p-3 sm:p-4 sm:pb-2">
                    <CardTitle className="text-sm sm:text-base">Keep it Concise</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Aim for a one or two-page resume focused on relevant experience. Remove outdated or irrelevant information.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 pt-2">
              <Button variant="outline" onClick={() => setCurrentStep(2)} size="sm" className="h-8 sm:h-10 text-xs sm:text-sm">
                Previous
              </Button>
              <Button onClick={completeGuide} size="sm" className="h-8 sm:h-10 text-xs sm:text-sm">
                Finish Guide
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// Export the component
export { ImportGuide };