"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function CheckoutCanceledPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center">
            <AlertCircle className="h-10 w-10 text-amber-600" />
          </div>
          <CardTitle className="text-2xl">Payment Canceled</CardTitle>
          <CardDescription className="text-base mt-2">
            Your subscription checkout was canceled.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md bg-amber-50 p-4 border border-amber-100">
            <p className="text-sm text-amber-800">
              No charges were made to your account. You can try again whenever you're ready.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-3">
          <Button asChild className="w-full bg-teal-600 hover:bg-teal-700">
            <Link href="/pricing">
              Try Again
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}