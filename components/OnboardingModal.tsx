import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useOnboarding } from '@/hooks/useOnboarding';
import { FileText, ArrowRight, User } from 'lucide-react';
import Link from 'next/link';

interface OnboardingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function OnboardingModal({ open, onOpenChange }: OnboardingModalProps) {
  const { redirectToOnboarding, skipOnboarding } = useOnboarding();
  
  const handleSkip = async () => {
    await skipOnboarding();
    onOpenChange(false);
  };
  
  const handleSetupProfile = () => {
    redirectToOnboarding();
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl">
            <User className="h-5 w-5 mr-2 text-teal-600" />
            Complete Your Profile
          </DialogTitle>
          <DialogDescription>
            Take a moment to set up your profile for better results
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="bg-teal-50 p-4 rounded-lg border border-teal-100">
            <h3 className="font-medium text-teal-800 mb-2">Why set up your profile?</h3>
            <ul className="space-y-2 text-sm text-teal-700">
              <li className="flex items-start">
                <span className="text-teal-500 mr-2">✓</span>
                <span>Get personalized cover letters tailored to your experience</span>
              </li>
              <li className="flex items-start">
                <span className="text-teal-500 mr-2">✓</span>
                <span>Save time when applying to jobs</span>
              </li>
              <li className="flex items-start">
                <span className="text-teal-500 mr-2">✓</span>
                <span>Receive better job suggestions and advice</span>
              </li>
            </ul>
          </div>
        </div>
        
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleSkip}
            className="sm:w-full"
          >
            Skip for Now
          </Button>
          <Button
            onClick={handleSetupProfile}
            className="sm:w-full bg-teal-600 hover:bg-teal-700"
          >
            Set Up Profile
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}