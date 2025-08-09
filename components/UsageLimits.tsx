import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, FileText, Scan, MessageSquare, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useSubscription } from "@/hooks/useSubscription";

interface FeatureUsageProps {
  feature: {
    name: string;
    icon: React.ReactNode;
    used: number;
    limit: number;
    unlimited?: boolean;
  };
  onUpgrade?: () => void;
}

function FeatureUsageItem({ feature, onUpgrade }: FeatureUsageProps) {
  const percentage = feature.unlimited ? 0 : (feature.used / feature.limit) * 100;
  const remaining = feature.unlimited ? Infinity : feature.limit - feature.used;
  const isExhausted = !feature.unlimited && remaining <= 0;
  const isLow = !feature.unlimited && remaining > 0 && remaining <= Math.ceil(feature.limit * 0.2);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {feature.icon}
          <span className="font-medium">{feature.name}</span>
        </div>
        <span className="text-sm text-muted-foreground">
          {feature.unlimited ? (
            <span className="text-green-600 font-medium flex items-center">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Unlimited
            </span>
          ) : (
            `${feature.used} / ${feature.limit}`
          )}
        </span>
      </div>
      
      {!feature.unlimited && (
        <>
          <Progress value={percentage} className={`h-2 ${isExhausted ? 'bg-red-100' : ''}`} />
          
          {isExhausted && (
            <Alert className="mt-2 py-2">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="ml-2">
                You've reached your limit. {onUpgrade && (
                  <Button
                    variant="link"
                    size="sm"
                    className="p-0 h-auto font-medium"
                    onClick={onUpgrade}
                  >
                    Upgrade to continue
                  </Button>
                )}
              </AlertDescription>
            </Alert>
          )}
          
          {isLow && !isExhausted && (
            <p className="text-xs text-amber-600">
              Only {remaining} remaining this month
            </p>
          )}
        </>
      )}
    </div>
  );
}

export default function UsageLimits({ showCard = true }: { showCard?: boolean }) {
  const { tier, getUsage, loading, error, refreshUsage } = useSubscription();
  const [features, setFeatures] = useState<FeatureUsageProps['feature'][]>([]);

  useEffect(() => {
    const coverLetters = getUsage('coverLetters');
    const resumes = getUsage('resumes');
    const atsScans = getUsage('atsScans');
    const interviews = getUsage('interviewSessions');

    if (coverLetters && resumes && atsScans && interviews) {
      setFeatures([
        {
          name: 'Cover Letters',
          icon: <FileText className="h-4 w-4 text-blue-600" />,
          used: coverLetters.used,
          limit: coverLetters.limit,
          unlimited: coverLetters.unlimited
        },
        {
          name: 'Resumes',
          icon: <FileText className="h-4 w-4 text-green-600" />,
          used: resumes.used,
          limit: resumes.limit,
          unlimited: resumes.unlimited
        },
        {
          name: 'ATS Scans',
          icon: <Scan className="h-4 w-4 text-purple-600" />,
          used: atsScans.used,
          limit: atsScans.limit,
          unlimited: atsScans.unlimited
        },
        {
          name: 'Interview Sessions',
          icon: <MessageSquare className="h-4 w-4 text-orange-600" />,
          used: interviews.used,
          limit: interviews.limit,
          unlimited: interviews.unlimited
        }
      ]);
    }
  }, [getUsage]);

  const handleUpgrade = () => {
    window.location.href = '/pricing';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load usage data. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  const content = (
    <div className="space-y-4">
      {features.map((feature, index) => (
        <FeatureUsageItem
          key={feature.name}
          feature={feature}
          onUpgrade={tier === 'FREE' ? handleUpgrade : undefined}
        />
      ))}
      
      {tier === 'FREE' && (
        <div className="mt-6 pt-4 border-t">
          <Button 
            className="w-full bg-teal-600 hover:bg-teal-700"
            asChild
          >
            <Link href="/pricing">
              <Sparkles className="mr-2 h-4 w-4" />
              Upgrade to Pro for Unlimited Access
            </Link>
          </Button>
        </div>
      )}
    </div>
  );

  if (!showCard) {
    return content;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Usage Limits</CardTitle>
            <CardDescription>
              Track your monthly feature usage
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshUsage}
            className="text-muted-foreground"
          >
            <Loader2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {content}
      </CardContent>
    </Card>
  );
}