"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileText, Upload, Download, ArrowRight, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/hooks/useAuth";

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-secondary">
      {/* Navigation Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center">
            <FileText className="h-6 w-6 text-primary mr-2" />
            <h1 className="text-xl font-bold">AI Cover Letter Assistant</h1>
          </div>
          
          <div className="flex items-center gap-4">
            {user ? (
              <Link href="/dashboard">
                <Button>
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="outline">Log In</Button>
                </Link>
                <Link href="/auth/register">
                  <Button>Sign Up</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="text-4xl font-bold mb-4 tracking-tight">
              Create professional, personalized cover letters in Norwegian with AI
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Stand out from the crowd with tailored cover letters that highlight your strengths and match job requirements perfectly.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              {user ? (
                <Link href="/dashboard">
                  <Button size="lg" className="w-full sm:w-auto">
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/auth/register">
                    <Button size="lg" className="w-full sm:w-auto">
                      Get Started - It's Free
                    </Button>
                  </Link>
                  <Link href="/dashboard/demo">
                    <Button variant="outline" size="lg" className="w-full sm:w-auto">
                      Try Demo
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="hidden md:block">
            <div className="relative rounded-lg border bg-card p-6 shadow-lg">
              <div className="space-y-4">
                <div className="h-8 w-3/4 rounded-md bg-muted"></div>
                <div className="space-y-2">
                  <div className="h-4 rounded-md bg-muted"></div>
                  <div className="h-4 rounded-md bg-muted"></div>
                  <div className="h-4 w-4/5 rounded-md bg-muted"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 rounded-md bg-muted"></div>
                  <div className="h-4 w-4/5 rounded-md bg-muted"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="p-6 text-center">
            <FileText className="mx-auto h-12 w-12 mb-4 text-primary" />
            <h3 className="text-xl font-semibold mb-2">Job Description Analysis</h3>
            <p className="text-muted-foreground">
              Paste job listing or URL for instant analysis of key requirements and skills needed
            </p>
          </Card>

          <Card className="p-6 text-center">
            <Upload className="mx-auto h-12 w-12 mb-4 text-primary" />
            <h3 className="text-xl font-semibold mb-2">CV Upload</h3>
            <p className="text-muted-foreground">
              Upload your CV or connect LinkedIn to highlight your relevant skills automatically
            </p>
          </Card>

          <Card className="p-6 text-center">
            <Download className="mx-auto h-12 w-12 mb-4 text-primary" />
            <h3 className="text-xl font-semibold mb-2">Export Options</h3>
            <p className="text-muted-foreground">
              Download your personalized cover letter in multiple formats ready to submit
            </p>
          </Card>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-4 py-16 bg-accent rounded-lg my-16">
        <h2 className="text-3xl font-bold text-center mb-12">Why Choose Us</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="flex items-start">
            <CheckCircle className="h-6 w-6 text-primary mr-3 mt-1" />
            <div>
              <h3 className="text-xl font-semibold mb-2">Norwegian Language Expertise</h3>
              <p className="text-muted-foreground">Professionally written in proper Norwegian Bokmål with appropriate business formatting</p>
            </div>
          </div>
          <div className="flex items-start">
            <CheckCircle className="h-6 w-6 text-primary mr-3 mt-1" />
            <div>
              <h3 className="text-xl font-semibold mb-2">Job-Specific Content</h3>
              <p className="text-muted-foreground">Tailored to match the exact requirements in the job description to increase your chances</p>
            </div>
          </div>
          <div className="flex items-start">
            <CheckCircle className="h-6 w-6 text-primary mr-3 mt-1" />
            <div>
              <h3 className="text-xl font-semibold mb-2">Time-Saving</h3>
              <p className="text-muted-foreground">Create professional cover letters in minutes instead of hours with our AI technology</p>
            </div>
          </div>
          <div className="flex items-start">
            <CheckCircle className="h-6 w-6 text-primary mr-3 mt-1" />
            <div>
              <h3 className="text-xl font-semibold mb-2">Multiple Formats</h3>
              <p className="text-muted-foreground">Download in PDF, Word, or text formats to suit any application system requirement</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl font-bold mb-6">Ready to create your professional cover letter?</h2>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Join thousands of job seekers who have improved their application success rate with our AI-powered cover letters
        </p>
        {user ? (
          <Link href="/dashboard">
            <Button size="lg">
              Go to Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        ) : (
          <Link href="/auth/register">
            <Button size="lg">Get Started Today</Button>
          </Link>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <FileText className="h-5 w-5 text-primary mr-2" />
              <span className="font-semibold">AI Cover Letter Assistant</span>
            </div>
            <div className="flex flex-col md:flex-row gap-4 md:gap-8 text-sm text-muted-foreground">
              <Link href="#" className="hover:text-foreground transition">Terms of Service</Link>
              <Link href="#" className="hover:text-foreground transition">Privacy Policy</Link>
              <Link href="#" className="hover:text-foreground transition">Contact Us</Link>
            </div>
          </div>
          <div className="mt-8 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} AI Cover Letter Assistant. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  );
}