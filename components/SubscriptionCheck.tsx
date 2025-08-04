//C:\Users\mukas\Downloads\project-bolt-sb1-guerg2d9\project\components\SubscriptionCheck.tsx

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { SubscriptionTier } from '@/types/subscription';
import { SUBSCRIPTION_PLANS } from "@/lib/subscription-client"
import { useAuth } from '@/lib/hooks/useAuth';
import { Lock, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface SubscriptionCheckProps {
  requiredTier: SubscriptionTier;
  children: React.ReactNode;
  showUpgradeCard?: boolean;
  featureInfo?: {
    title: string;
    description: string;
  };
}

export default function SubscriptionCheck({
  requiredTier,
  children,
  showUpgradeCard = true,
  featureInfo
}: SubscriptionCheckProps) {
  const { user, loading } = useAuth();
  const [userTier, setUserTier] = useState<SubscriptionTier | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  
  // Fetch the user's subscription tier
  useEffect(() => {
    const fetchSubscriptionTier = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      
      try {
        const response = await fetch('/api/user/subscription');
        
        if (!response.ok) {
          throw new Error('Failed to fetch subscription status');
        }
        
        const data = await response.json();
        setUserTier(data.tier);
      } catch (error) {
        console.error('Error fetching subscription tier:', error);
        // Default to FREE tier on error
        setUserTier('FREE');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (!loading) {
      fetchSubscriptionTier();
    }
  }, [user, loading]);
  
  // While loading, show a spinner
  if (loading || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }
  
  // If not logged in, prompt to sign in
  if (!user) {
    return (
      <Card className="border-amber-200 bg-amber-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center">
            <Lock className="h-5 w-5 mr-2 text-amber-600" />
            Sign in Required
          </CardTitle>
          <CardDescription>
            You need to sign in to access this feature
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild className="bg-teal-600 hover:bg-teal-700">
              <Link href="/auth/login">
                Sign In
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/auth/register">
                Create Account
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Map subscription tiers to their numeric value for comparison
  const tierValues: Record<SubscriptionTier, number> = {
    'FREE': 0,
    'PRO': 1,
    'BUSINESS': 2
  };
  
  // Check if user has required tier
  const hasAccess = userTier && tierValues[userTier] >= tierValues[requiredTier];
  
  // If has access, render the children
  if (hasAccess) {
    return <>{children}</>;
  }
  
  // Otherwise, show upgrade card
  if (showUpgradeCard) {
    const requiredPlan = SUBSCRIPTION_PLANS[requiredTier];
    
    return (
      <Card className="border-teal-200 shadow-sm">
        <CardHeader className="pb-3 bg-gradient-to-r from-teal-100 to-teal-50">
          <CardTitle className="text-lg flex items-center text-teal-800">
            <Sparkles className="h-5 w-5 mr-2 text-teal-600" />
            {featureInfo?.title || `${requiredPlan.name} Feature`}
          </CardTitle>
          <CardDescription className="text-teal-700">
            {featureInfo?.description || `This feature requires a ${requiredPlan.name} subscription or higher`}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex flex-col items-center text-center space-y-4">
            <p className="text-sm text-gray-600 max-w-md">
              Upgrade your plan to unlock this feature and many more premium benefits:
            </p>
            
            <ul className="text-sm space-y-2 text-left self-stretch max-w-sm mx-auto">
              {requiredPlan.features.map((feature, i) => (
                <li key={i} className="flex items-start">
                  <span className="text-teal-500 mr-2">✓</span>
                  {feature}
                </li>
              ))}
            </ul>
            
            <div className="pt-2">
              <Button asChild className="bg-teal-600 hover:bg-teal-700">
                <Link href="/pricing">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Upgrade to {requiredPlan.name}
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Simple alert if we don't want the full card
  return (
    <Alert className="bg-teal-50 border-teal-200">
      <Sparkles className="h-4 w-4 text-teal-600" />
      <AlertTitle>Subscription Required</AlertTitle>
      <AlertDescription>
        This feature requires a {SUBSCRIPTION_PLANS[requiredTier].name} subscription.{' '}
        <Link href="/pricing" className="font-medium text-teal-600 hover:underline">
          Upgrade your plan
        </Link>{' '}
        to access it.
      </AlertDescription>
    </Alert>
  );
}