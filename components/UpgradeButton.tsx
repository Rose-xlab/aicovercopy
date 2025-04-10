import React from 'react';
import { Button, ButtonProps } from "@/components/ui/button";
import { Sparkles, ChevronRight } from "lucide-react";
import Link from 'next/link';
import { SubscriptionTier } from '@/types/subscription';
import { cn } from '@/lib/utils';

interface UpgradeButtonProps extends ButtonProps {
  currentTier?: SubscriptionTier;
  label?: string;
  showIcon?: boolean;
  size?: 'default' | 'sm' | 'lg';
  fullWidth?: boolean;
  href?: string;
}

export default function UpgradeButton({
  currentTier = 'FREE',
  label,
  showIcon = true,
  size = 'default',
  fullWidth = false,
  href = '/pricing',
  className,
  ...props
}: UpgradeButtonProps) {
  // Don't show upgrade button for BUSINESS tier (highest tier)
  if (currentTier === 'BUSINESS') {
    return null;
  }
  
  // Determine appropriate label based on current tier
  const buttonLabel = label || (currentTier === 'FREE' ? 'Upgrade to Pro' : 'Upgrade Plan');
  
  return (
    <Button
      asChild
      size={size}
      className={cn(
        "bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600",
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      <Link href={href}>
        {showIcon && <Sparkles className="mr-2 h-4 w-4" />}
        {buttonLabel}
        <ChevronRight className="ml-1 h-3 w-3 opacity-70" />
      </Link>
    </Button>
  );
}