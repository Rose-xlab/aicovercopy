// components/withSubscriptionGuard.tsx
import React, { ComponentType, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Lock, Sparkles, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useSubscription } from "@/hooks/useSubscription";
import { SubscriptionTier } from "@/types/subscription";
import { LoadingSpinner } from "@/components/LoadingSpinner";

interface WithSubscriptionGuardOptions {
  requiredTier: SubscriptionTier;
  fallbackUrl?: string;
  showUpgradePrompt?: boolean;
  featureName?: string;
  featureDescription?: string;
}

export function withSubscriptionGuard<P extends object>(
  Component: ComponentType<P>,
  options: WithSubscriptionGuardOptions
) {
  return function SubscriptionGuardedComponent(props: P) {
    const router = useRouter();
    const { tier, loading } = useSubscription();
    const [hasAccess, setHasAccess] = useState<boolean | null>(null);

    const {
      requiredTier,
      fallbackUrl = '/dashboard',
      showUpgradePrompt = true,
      featureName = 'This feature',
      featureDescription
    } = options;

    useEffect(() => {
      if (!loading) {
        const tierValues: Record<SubscriptionTier, number> = {
          'FREE': 0,
          'PRO': 1,
          'BUSINESS': 2
        };

        const userHasAccess = tierValues[tier] >= tierValues[requiredTier];
        setHasAccess(userHasAccess);

        if (!userHasAccess && !showUpgradePrompt) {
          router.push(fallbackUrl);
        }
      }
    }, [tier, loading, requiredTier, fallbackUrl, showUpgradePrompt, router]);

    if (loading || hasAccess === null) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner className="h-8 w-8" />
        </div>
      );
    }

    if (hasAccess) {
      return <Component {...props} />;
    }

    if (!showUpgradePrompt) {
      return null;
    }

    const defaultDescription = `${featureName} requires a ${requiredTier} subscription or higher. Upgrade your plan to access this and many more premium features.`;

    return (
      <div className="container max-w-2xl py-8">
        <Card className="border-teal-200">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-teal-100 flex items-center justify-center">
              <Lock className="h-8 w-8 text-teal-600" />
            </div>
            <CardTitle className="text-2xl">Subscription Required</CardTitle>
            <CardDescription className="text-base mt-2">
              {featureDescription || defaultDescription}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <Alert className="bg-teal-50 border-teal-200">
              <Sparkles className="h-4 w-4 text-teal-600" />
              <AlertTitle className="text-teal-800">Upgrade to {requiredTier}</AlertTitle>
              <AlertDescription className="text-teal-700">
                Unlock this feature and enjoy:
                <ul className="mt-2 space-y-1 list-disc list-inside">
                  <li>Unlimited cover letters and resumes</li>
                  <li>Advanced ATS optimization</li>
                  <li>Priority support</li>
                  <li>All premium templates</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="outline" asChild className="flex-1">
                <Link href={fallbackUrl}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Go Back
                </Link>
              </Button>
              <Button asChild className="flex-1 bg-teal-600 hover:bg-teal-700">
                <Link href="/pricing">
                  <Sparkles className="mr-2 h-4 w-4" />
                  View Pricing Plans
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };
}

// Example usage:
/*
// app/dashboard/premium-feature/page.tsx
import PremiumFeature from '@/components/PremiumFeature';
import { withSubscriptionGuard } from '@/components/withSubscriptionGuard';

const GuardedPremiumFeature = withSubscriptionGuard(PremiumFeature, {
  requiredTier: 'PRO',
  featureName: 'Premium Analytics',
  featureDescription: 'Access detailed analytics and insights about your job applications.'
});

export default function PremiumFeaturePage() {
  return <GuardedPremiumFeature />;
}
*/