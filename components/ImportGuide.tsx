// C:\Users\mukas\Downloads\project-bolt-sb1-guerg2d9\project\components\ImportGuide.tsx

"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, Edit, Zap, FileCheck, LayoutTemplate } from 'lucide-react';
import { useCVResumeIntegration } from '@/lib/hooks/useCVResumeIntegration';
import Link from 'next/link';

interface ImportGuideProps {
  resumeId: string;
  isOpen: boolean;
  onClose: () => void;
  fromCV?: boolean;
  cvName?: string;
}

export default function ImportGuide({ 
  resumeId, 
  isOpen, 
  onClose, 
  fromCV = false,
  cvName
}: ImportGuideProps) {
  const [hasSeenGuide, setHasSeenGuide] = useState(false);
  const [linkedCV, setLinkedCV] = useState<string | null>(null);
  const { getLinkedCV } = useCVResumeIntegration();

  useEffect(() => {
    const guideSeen = localStorage.getItem('importGuideSeen');
    if (guideSeen === 'true') {
      setHasSeenGuide(true);
    }
  }, []);

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

  const completeGuide = () => {
    localStorage.setItem('importGuideSeen', 'true');
    setHasSeenGuide(true);
    onClose();
  };

  if (hasSeenGuide && !isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="mb-4 text-center sm:text-left">
          {/* UPDATED COPY */}
          <DialogTitle className="flex flex-col sm:flex-row items-center text-lg sm:text-xl">
            <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-green-500 mb-1 sm:mb-0 sm:mr-2" />
            <span>Success! Your Resume is Ready to Be Optimized.</span>
          </DialogTitle>
          {/* UPDATED COPY */}
          <DialogDescription className="text-xs sm:text-sm">
            We've analyzed your resume. Now, let's use our AI tools to make it stand out.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* UPDATED COPY */}
          <Alert className="bg-green-50 border-green-200 p-3 sm:p-4">
            <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
            <AlertTitle className="text-green-800 text-sm sm:text-base">Import Complete</AlertTitle>
            <AlertDescription className="text-green-700 text-xs sm:text-sm">
              {fromCV || linkedCV ? (
                <>
                  Your CV{cvName || linkedCV ? ` "${cvName || linkedCV}"` : ""} has been converted. All information is now ready for enhancement.
                </>
              ) : (
                <>
                  Our AI has successfully parsed your resume. Your information is now ready for enhancement.
                </>
              )}
            </AlertDescription>
          </Alert>

          {/* === "ENTICING WORDS" SECTION - UPDATED COPY === */}
          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle className="text-base">From Imported to Hired</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Here is how our platform helps you get the interview:</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start">
                <Zap className="h-4 w-4 mr-3 mt-1 flex-shrink-0 text-primary" />
                <span><span className="font-semibold">Rewrite with AI:</span> Instantly refine bullet points and summaries to impress hiring managers.</span>
              </div>
              <div className="flex items-start">
                <FileCheck className="h-4 w-4 mr-3 mt-1 flex-shrink-0 text-primary" />
                <span><span className="font-semibold">Beat the Bots:</span> Optimize your resume with an ATS score to ensure it gets seen by a human.</span>
              </div>
              <div className="flex items-start">
                <LayoutTemplate className="h-4 w-4 mr-3 mt-1 flex-shrink-0 text-primary" />
                <span><span className="font-semibold">Look the Part:</span> Choose from professional, recruiter-approved templates that command attention.</span>
              </div>
            </CardContent>
          </Card>
          
          {/* === FOCUSED CTA - UPDATED COPY === */}
          <Card className="border-primary/50 shadow-lg">
             <CardHeader>
               <CardTitle className="text-base flex items-center">
                 <Edit className="h-4 w-4 mr-2 text-purple-500" />
                 Your Next Step: Perfect Your Resume
               </CardTitle>
             </CardHeader>
             <CardContent>
               <p className="text-xs sm:text-sm text-muted-foreground">
                 Review the imported data, then use our AI Editor to tailor your content, match it to specific job descriptions, and create a job-winning resume.
               </p>
             </CardContent>
             <CardFooter>
               <Button asChild className="w-full text-sm font-bold">
                 <Link href={`/dashboard/resumes/${resumeId}`}>
                   Enhance My Resume
                 </Link>
               </Button>
             </CardFooter>
          </Card>
        </div>

        <DialogFooter className="mt-6">
          <Button variant="ghost" onClick={completeGuide} className="text-xs sm:text-sm">Maybe Later</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Export the component
export { ImportGuide };