// app/checkout/success/page.tsx

import { Suspense } from 'react';
import CheckoutSuccessClient from './SuccessClient'; // Import the new component
import { LoadingSpinner } from '@/components/LoadingSpinner';

// A simple loading fallback to show while the client component loads
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary flex items-center justify-center p-4">
      <LoadingSpinner className="h-12 w-12 text-teal-600" />
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    // Wrap the client component in Suspense
    <Suspense fallback={<LoadingFallback />}>
      <CheckoutSuccessClient />
    </Suspense>
  );
}