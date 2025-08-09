import React from 'react';
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp,
  Clock
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface FeatureUsageIndicatorProps {
  feature: string;
  used: number;
  limit: number;
  unlimited?: boolean;
  showUpgradePrompt?: boolean;
  className?: string;
  variant?: 'default' | 'compact' | 'detailed';
}

export default function FeatureUsageIndicator({
  feature,
  used,
  limit,
  unlimited = false,
  showUpgradePrompt = true,
  className,
  variant = 'default'
}: FeatureUsageIndicatorProps) {
  const percentage = unlimited || !limit ? 0 : (used / limit) * 100;
  const remaining = unlimited ? Infinity : limit - used;
  const isExhausted = !unlimited && remaining <= 0;
  const isNearLimit = !unlimited && remaining > 0 && remaining <= Math.ceil(limit * 0.2);
  
  // Get status color
  const getStatusColor = () => {
    if (unlimited || percentage < 50) return 'text-green-600';
    if (percentage < 80) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  const getProgressColor = () => {
    if (unlimited || percentage < 50) return 'bg-green-500';
    if (percentage < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  if (variant === 'compact') {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <span className="text-sm font-medium">{feature}:</span>
        {unlimited ? (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Unlimited
          </Badge>
        ) : (
          <span className={cn("text-sm font-medium", getStatusColor())}>
            {used}/{limit}
          </span>
        )}
      </div>
    );
  }
  
  if (variant === 'detailed') {
    return (
      <Card className={cn("p-4", className)}>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              {feature}
            </h4>
            {unlimited ? (
              <Badge className="bg-green-100 text-green-800 border-green-200">
                Unlimited
              </Badge>
            ) : (
              <span className={cn("text-sm font-medium", getStatusColor())}>
                {used} / {limit} used
            	</span>
            )}
          </div>
          
          {!unlimited && (
            <>
              {/* Corrected: Removed invalid 'indicatorClassName' prop */}
              <Progress 
                value={percentage} 
                // The color class is applied to the root element's className
                className={cn("h-2", getProgressColor())}
              />
              
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{remaining} remaining</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Resets monthly
                </span>
              </div>
            </>
          )}
          
          {isExhausted && showUpgradePrompt && (
            <div className="pt-2 border-t">
              <Button size="sm" className="w-full" asChild>
                <Link href="/pricing">
                  <Sparkles className="mr-2 h-3 w-3" />
                  Upgrade for more
                </Link>
              </Button>
            </div>
          )}
          
          {isNearLimit && !isExhausted && (
            <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded-md">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="text-xs text-yellow-800">
                {/* Corrected: Escaped the apostrophe */}
                You&apos;re approaching your limit
            	</span>
            </div>
          )}
        </div>
      </Card>
    );
  }
  
  // Default variant
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{feature}</span>
        {unlimited ? (<Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Unlimited
          </Badge>
        ) : (
          <span className={cn("text-sm", getStatusColor())}>
            {used} / {limit}
          </span>
        )}
      </div>
      
      {!unlimited && (
        <>
          {/* Corrected: Removed invalid 'indicatorClassName' prop */}
          <Progress 
            value={percentage} 
            // The color class is applied to the root element's className
            className={cn("h-2", getProgressColor())}
          />
          
          {isExhausted && (
            <div className="flex items-center gap-2 p-2 bg-red-50 rounded-md mt-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-xs text-red-800">Limit reached</span>
              {showUpgradePrompt && (
                <Link href="/pricing" className="ml-auto">
                  <Button size="sm" variant="link" className="h-auto p-0 text-xs">
                    Upgrade
                  </Button>
                </Link>
            	)}
            </div>
          )}
          
          {isNearLimit && !isExhausted && (
            <p className="text-xs text-yellow-600 mt-1">
              Only {remaining} remaining
            </p>
          )}
        </>
    	)}
  	</div>
  );
}