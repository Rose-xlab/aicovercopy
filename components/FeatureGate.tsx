import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Lock, Sparkles, AlertTriangle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useSubscription } from "@/hooks/useSubscription";
import { LimitedFeature } from "@/lib/subscription-enforcement";
import { LoadingSpinner } from "@/components/LoadingSpinner";

interface FeatureGateProps {
  feature: LimitedFeature;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgradeCard?: boolean;
  featureName?: string;
  featureDescription?: string;
}

export default function FeatureGate({
  feature,
  children,
  fallback,
  showUpgradeCard = true,
  featureName,
  featureDescription
}: FeatureGateProps) {
  const { canAccess, getUsage, loading, tier } = useSubscription();

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  const hasAccess = canAccess(feature);
  const usage = getUsage(feature);

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (!showUpgradeCard) {
    return null;
  }

  const displayName = featureName || feature.replace(/([A-Z])/g, ' $1').trim();
  const description = featureDescription || `You've reached your ${displayName.toLowerCase()} limit for this month.`;

  return (
    <Card className="border-amber-200 bg-amber-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center">
          <Lock className="h-5 w-5 mr-2 text-amber-600" />
          {displayName} Limit Reached
        </CardTitle>
        <CardDescription>
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {usage && (
            <div className="p-3 bg-white rounded-md border border-amber-100">
              <p className="text-sm">
                <span className="font-medium">Current usage:</span> {usage.used} / {usage.limit}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Resets at the beginning of your next billing period
              </p>
            </div>
          )}
          
          {tier === 'FREE' ? (
            <>
              <Alert>
                <Sparkles className="h-4 w-4" />
                <AlertTitle>Upgrade to Pro</AlertTitle>
                <AlertDescription>
                  Get unlimited {displayName.toLowerCase()} and all premium features
                </AlertDescription>
              </Alert>
              
              <Button asChild className="w-full bg-teal-600 hover:bg-teal-700">
                <Link href="/pricing">
                  Upgrade to Pro
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </>
          ) : (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Contact Support</AlertTitle>
              <AlertDescription>
                If you believe this is an error, please contact our support team.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Example usage:
/*
<FeatureGate 
  feature="coverLetters" 
  featureName="Cover Letters"
  featureDescription="Upgrade to create unlimited cover letters"
>
  <CoverLetterForm />
</FeatureGate>
*/