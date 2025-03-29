"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Upload, ArrowRight, FileText, Edit, Eye, FileSearch, AlertTriangle, Info } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import Link from 'next/link';

interface ImportGuideProps {
  resumeId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ImportGuide({ resumeId, isOpen, onClose }: ImportGuideProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [hasSeenGuide, setHasSeenGuide] = useState(false);
  const { toast } = useToast();

  // Load preference from localStorage on component mount
  useEffect(() => {
    const guideSeen = localStorage.getItem('importGuideSeen');
    if (guideSeen === 'true') {
      setHasSeenGuide(true);
    }
  }, []);

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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl">
            <CheckCircle2 className="h-6 w-6 text-green-500 mr-2" />
            Resume Successfully Imported!
          </DialogTitle>
          <DialogDescription>
            Your resume has been parsed using AI and is now ready to use
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="1" value={currentStep.toString()} onValueChange={(v) => setCurrentStep(parseInt(v))}>
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="1" disabled={currentStep < 1}>
              <Badge className="h-6 w-6 rounded-full mr-2">1</Badge> Import Complete
            </TabsTrigger>
            <TabsTrigger value="2" disabled={currentStep < 2}>
              <Badge className="h-6 w-6 rounded-full mr-2">2</Badge> Next Steps
            </TabsTrigger>
            <TabsTrigger value="3" disabled={currentStep < 3}>
              <Badge className="h-6 w-6 rounded-full mr-2">3</Badge> Resume Tips
            </TabsTrigger>
          </TabsList>

          <TabsContent value="1" className="space-y-4">
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <AlertTitle className="text-green-800">Import Successful</AlertTitle>
              <AlertDescription className="text-green-700">
                Your resume has been analyzed and saved to your account
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <h3 className="font-medium">What happened?</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center">
                      <Upload className="h-4 w-4 mr-2 text-blue-500" />
                      File Analyzed
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Your resume file was uploaded and analyzed using AI to extract important information like your work history, education, and skills.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center">
                      <FileText className="h-4 w-4 mr-2 text-blue-500" />
                      Resume Created
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      A new resume has been created and saved to your account with all the extracted information.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button onClick={() => setCurrentStep(2)}>
                Next Step
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="2" className="space-y-4">
            <h3 className="font-medium">What would you like to do with your resume?</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="hover:border-primary/50 hover:shadow-sm transition-all">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center">
                    <Edit className="h-4 w-4 mr-2 text-purple-500" />
                    Edit Resume
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <p className="text-sm text-muted-foreground">
                    Review and edit your resume information to make sure everything was imported correctly.
                  </p>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button asChild variant="outline" className="w-full">
                    <Link href={`/dashboard/resumes/${resumeId}`}>Edit Resume</Link>
                  </Button>
                </CardFooter>
              </Card>

              <Card className="hover:border-primary/50 hover:shadow-sm transition-all">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center">
                    <Eye className="h-4 w-4 mr-2 text-blue-500" />
                    Preview Resume
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <p className="text-sm text-muted-foreground">
                    See how your resume looks with our formatting templates and download it in different formats.
                  </p>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button asChild variant="outline" className="w-full">
                    <Link href={`/dashboard/resumes/${resumeId}/preview`}>Preview</Link>
                  </Button>
                </CardFooter>
              </Card>

              <Card className="hover:border-primary/50 hover:shadow-sm transition-all">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center">
                    <FileSearch className="h-4 w-4 mr-2 text-amber-500" />
                    ATS Scanner
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <p className="text-sm text-muted-foreground">
                    Check how well your resume will perform with Applicant Tracking Systems and get improvement tips.
                  </p>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button asChild variant="outline" className="w-full">
                    <Link href={`/dashboard/resumes/${resumeId}/ats-scanner`}>ATS Scanner</Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setCurrentStep(1)}>
                Previous
              </Button>
              <Button onClick={() => setCurrentStep(3)}>
                Next Step
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="3" className="space-y-4">
            <Alert>
              <Info className="h-5 w-5 text-blue-500" />
              <AlertTitle>Resume Tips</AlertTitle>
              <AlertDescription>
                Here are some tips to make your resume even better
              </AlertDescription>
            </Alert>
            
            <div className="space-y-4">
              <h3 className="font-medium">Maximize your resume impact</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Tailor to Job Descriptions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Customize your resume for each job by matching keywords from the job description. Use our ATS Scanner to check compatibility.
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Quantify Achievements</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Add numbers and metrics to your achievements. For example, "Increased sales by 20%" is stronger than "Increased sales."
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Use Action Verbs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Start bullet points with strong action verbs like achieved, implemented, or reduced instead of using passive language.
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Keep it Concise</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Aim for a one or two-page resume focused on relevant experience. Remove outdated or irrelevant information.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-4">
              <Button variant="outline" onClick={() => setCurrentStep(2)}>
                Previous
              </Button>
              <Button onClick={completeGuide}>
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