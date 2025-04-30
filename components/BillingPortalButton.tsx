import React, { useState } from 'react';
import { Button, ButtonProps } from "@/components/ui/button";
import { CreditCard, Loader2 } from "lucide-react";
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface BillingPortalButtonProps extends ButtonProps {
  customerId?: string;
  label?: string;
  showIcon?: boolean;
  returnUrl?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}

export default function BillingPortalButton({
  customerId,
  label = 'Manage Billing',
  showIcon = true,
  returnUrl,
  variant = 'outline',
  className,
  ...props
}: BillingPortalButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // Redirect to Stripe Customer Portal
  const handleManageBilling = async () => {
    try {
      setIsLoading(true);
      
      // Call the API to create a portal session
      const response = await fetch('/api/stripe/create-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          returnUrl: returnUrl || window.location.href,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create portal session');
      }
      
      const { url } = await response.json();
      
      // Redirect to Stripe Customer Portal
      router.push(url);
    } catch (error: any) {
      console.error('Error creating portal session:', error);
      
      toast({
        title: 'Error',
        description: error.message || 'Failed to open billing portal. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      onClick={handleManageBilling}
      disabled={isLoading}
      className={cn(className)}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        showIcon && <CreditCard className="h-4 w-4 mr-2" />
      )}
      {label}
    </Button>
  );
}