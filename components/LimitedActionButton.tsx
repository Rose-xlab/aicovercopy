import React, { useState } from 'react';
import { Button, ButtonProps } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useSubscription } from "@/hooks/useSubscription";
import { LimitedFeature } from "@/lib/subscription-enforcement";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/LoadingSpinner";

interface LimitedActionButtonProps extends ButtonProps {
  feature: LimitedFeature;
  onAllowed: () => void | Promise<void>;
  featureName?: string;
  confirmationMessage?: string;
  children: React.ReactNode;
}

export default function LimitedActionButton({
  feature,
  onAllowed,
  featureName,
  confirmationMessage,
  children,
  ...buttonProps
}: LimitedActionButtonProps) {
  const { canAccess, getUsage, checkAndTrack, tier } = useSubscription();
  const { toast } = useToast();
  const [showLimitDialog, setShowLimitDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const displayName = featureName || feature.replace(/([A-Z])/g, ' $1').trim();
  const usage = getUsage(feature);

  const handleClick = async () => {
    // First check if user has access
    if (!canAccess(feature)) {
      setShowLimitDialog(true);
      return;
    }

    setIsProcessing(true);
    
    try {
      // Check and track usage with the backend
      const { allowed, reason } = await checkAndTrack(feature);
      
      if (!allowed) {
        toast({
          title: "Limit Reached",
          description: reason || `You've reached your ${displayName.toLowerCase()} limit.`,
          variant: "destructive",
        });
        setShowLimitDialog(true);
        return;
      }

      // Execute the allowed action
      await onAllowed();
      
    } catch (error) {
      console.error('Error in limited action:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Button
        {...buttonProps}
        onClick={handleClick}
        disabled={buttonProps.disabled || isProcessing}
      >
        {isProcessing ? <LoadingSpinner className="mr-2 h-4 w-4" /> : null}
        {children}
      </Button>

      <Dialog open={showLimitDialog} onOpenChange={setShowLimitDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-amber-600" />
              {displayName} Limit Reached
            </DialogTitle>
            <DialogDescription>
              {usage && (
                <div className="mt-3 space-y-2">
                  <p>You've used all your {displayName.toLowerCase()} for this period.</p>
                  <div className="p-3 bg-muted rounded-md">
                    <p className="text-sm font-medium">
                      Current usage: {usage.used} / {usage.limit}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Resets at the start of your next billing period
                    </p>
                  </div>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {tier === 'FREE' && (
            <Alert className="mt-4">
              <Sparkles className="h-4 w-4" />
              <AlertDescription>
                Upgrade to Pro for unlimited {displayName.toLowerCase()} and more!
              </AlertDescription>
            </Alert>
          )}
          
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowLimitDialog(false)}
            >
              Cancel
            </Button>
            {tier === 'FREE' && (
              <Button asChild className="bg-teal-600 hover:bg-teal-700">
                <Link href="/pricing">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Upgrade to Pro
                </Link>
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Example usage:
/*
<LimitedActionButton
  feature="coverLetters"
  featureName="Cover Letter"
  onAllowed={async () => {
    // Your cover letter generation logic
    await generateCoverLetter();
  }}
  className="bg-teal-600 hover:bg-teal-700"
>
  Generate Cover Letter
</LimitedActionButton>
*/