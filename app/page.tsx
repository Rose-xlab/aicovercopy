"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  FileText,
  Upload,
  ArrowRight,
  CheckCircle,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
// NOTE: I've assumed these components and constants are available.
// If not, you'll need to define them.
import DocumentExamples from "@/components/DocumentExamples";
import { SUBSCRIPTION_PLANS } from "@/lib/subscription-client";

export default function LandingPage() {
  // NOTE: useAuth hook and conditional rendering for 'user' is removed
  // from the landing page to keep it consistent for all visitors.

  return (
    <main className="min-h-screen bg-white text-gray-800">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center">
            {/* Using an Image for the logo to match the design */}
            <Image
              src="/rm-logo.png" // Assuming you have a logo file named rm-logo.png
              alt="Resume Mate AI Logo"
              width={60}
              height={24}
              className="h-6 w-6 mr-2"
            />
            <h1 className="text-xl font-bold text-gray-800">Resume Mate AI</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/pricing"
              className="text-sm font-medium text-gray-700 hover:text-orange-600 transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="/features"
              className="text-sm font-medium text-gray-700 hover:text-orange-600 transition-colors"
            >
              Features
            </Link>
            <Link href="/auth/register" className="text-sm font-medium text-gray-700 hover:text-orange-600 transition-colors">
              Sign Up
            </Link>
            <Link href="/auth/register">
              <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                Sign Up
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white py-12 sm:py-16 md:py-24">
        <div className="container relative mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="flex flex-col justify-center">
              <h1 className="text-3xl sm:text-4xl font-bold mb-4 tracking-tight text-gray-900 lg:text-5xl">
                Create professional, personalized resumes & cover letters{" "}
                <span className="text-orange-500">in minutes</span>
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 mb-8">
                Stand out from the crowd with tailored cover letters that
                highlight your strength and match job requirements perfectly.
              </p>
              <Link href="/auth/register">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 text-white"
                >
                  Get Started - It's Free
                </Button>
              </Link>
            </div>
            <div className="hidden relative w-full h-[400px] md:flex justify-end items-center">
              <Image
                alt="Resume Mate AI App Screenshot"
                src="/hero_image.png"
                width={600}
                height={500}
                className="rounded-xl shadow-2xl ring-1 ring-black/5"
              />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="container mx-auto px-4 py-12 sm:py-20">
        <h2 className="text-3xl font-bold text-center mb-4 text-gray-900">
          How It Works
        </h2>
        <p className="text-center text-lg text-gray-600 mb-12 max-w-2xl mx-auto">
          Our AI-powered platform makes creating tailored cover letters simple and efficient.
        </p>
        <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-3">
          <Card className="p-6 text-center border-0 bg-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 mb-6">
              <FileText className="h-8 w-8 text-orange-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900">
              Analyze Job Description
            </h3>
            <p className="text-gray-600">
              Paste the job listing text or URL. Our AI analyzes key
              requirements, skills, and qualifications.
            </p>
          </Card>
          <Card className="p-6 text-center border-0 bg-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 mb-6">
              <Upload className="h-8 w-8 text-orange-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900">
              Connect Your Experience
            </h3>
            <p className="text-gray-600">
              Upload your CV or connect your LinkedIn profile to provide our AI
              with your relevant skills.
            </p>
          </Card>
          <Card className="p-6 text-center border-0 bg-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 mb-6">
              <Sparkles className="h-8 w-8 text-orange-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900">
              Generate & Customize
            </h3>
            <p className="text-gray-600">
              Our AI generates a tailored cover letter that matches your
              experience. Edit, refine, and download.
            </p>
          </Card>
        </div>
        <div className="mt-12 text-center">
          <Link href="/features">
            <Button
              variant="outline"
              size="lg"
              className="border-gray-200 text-gray-700 hover:text-orange-700 hover:bg-orange-50"
            >
              Learn More About Our Features
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Document Examples Section (Container for your component) */}
      <section className="py-12 sm:py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <DocumentExamples />
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-12 sm:py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4 text-gray-900">
            Choose the Right Plan
          </h2>
          <p className="text-center text-lg text-gray-600 mb-12 max-w-2xl mx-auto">
            Select a plan that fits your needs, from our free tier to our
            feature-rich business option.
          </p>
          <div className="grid grid-cols-1 gap-8 sm:gap-6 md:grid-cols-3 max-w-5xl mx-auto">
            {Object.entries(SUBSCRIPTION_PLANS).map(([tier, plan]) => (
              <Card
                key={tier}
                className={`overflow-hidden transition-all duration-200 bg-white shadow-lg hover:shadow-xl ${
                  tier === "PRO"
                    ? "relative ring-2 ring-orange-500 md:scale-105 z-10"
                    : ""
                }`}
              >
                {tier === "PRO" && (
                  <div className="bg-orange-600 text-white text-center py-1.5 text-sm font-medium">
                    MOST POPULAR
                  </div>
                )}
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2 text-gray-900">
                    {plan.name}
                  </h3>
                  <div className="mb-3">
                    <span className="text-3xl font-bold text-gray-900">
                      ${plan.price.monthly}
                    </span>
                    {plan.price.monthly > 0 && (
                      <span className="text-sm text-gray-500">/month</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-6">
                    {plan.description}
                  </p>
                  <ul className="space-y-3 mb-6">
                    {plan.features.slice(0, 4).map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0 text-orange-600" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/pricing" className="block w-full">
                    <Button
                      className={`w-full ${
                        tier === "PRO" ? "bg-orange-600 hover:bg-orange-700" : "bg-gray-800 hover:bg-gray-700"
                      }`}
                    >
                      {tier === "FREE" ? (
                        "Get Started"
                      ) : tier === "PRO" ? (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Get Pro
                        </>
                      ) : (
                        "Upgrade to Business"
                      )}
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/pricing">
              <Button
                variant="outline"
                size="lg"
                className="bg-white border-gray-200 text-gray-700 hover:text-orange-700 hover:bg-orange-50"
              >
                See Full Pricing Details
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-4 py-12 sm:py-20">
        <h2 className="text-3xl font-bold text-center mb-4 text-gray-900">
          Why Choose Us
        </h2>
        <p className="text-center text-lg text-gray-600 mb-12 max-w-2xl mx-auto">
          Our platform offers unique advantages to help you land your dream job.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
          <div className="flex items-start">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100 mr-4 flex-shrink-0">
              <CheckCircle className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">
                AI-Powered Writing
              </h3>
              <p className="text-gray-600">
                Advanced AI algorithms generate professional content tailored to
                your specific job application.
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100 mr-4 flex-shrink-0">
              <CheckCircle className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">
                Job-Specific Content
              </h3>
              <p className="text-gray-600">
                Tailored to match the exact requirements in the job description
                to increase your chances.
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100 mr-4 flex-shrink-0">
              <CheckCircle className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">
                Time-Saving
              </h3>
              <p className="text-gray-600">
                Create professional cover letters in minutes instead of hours
                with our AI technology.
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100 mr-4 flex-shrink-0">
              <CheckCircle className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">
                Multiple Formats
              </h3>
              <p className="text-gray-600">
                Download in PDF, Word, or text formats to suit any application
                system requirement.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 bg-orange-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">
              Ready to create your professional cover letter?
            </h2>
            <p className="text-lg sm:text-xl mb-6 sm:mb-8 text-orange-50">
              Join thousands of job seekers who have improved their application
              success rate with our AI-powered cover letters.
            </p>
            <Link href="/auth/register">
              <Button
                size="lg"
                className="bg-white text-orange-700 hover:bg-orange-50"
              >
                Get Started Today
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white">
        <div className="container mx-auto px-4 py-6 sm:py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <Image
                src="/rm-logo.png"
                alt="Resume Mate AI Logo"
                width={20}
                height={20}
                className="h-5 w-5 mr-2"
              />
              <span className="font-semibold text-gray-800">
                Resume Mate AI
              </span>
            </div>
            <div className="flex flex-wrap justify-center md:justify-end gap-4 md:gap-8 text-sm text-gray-600">
              <Link href="#" className="hover:text-orange-600 transition">
                Terms of Service
              </Link>
              <Link href="#" className="hover:text-orange-600 transition">
                Privacy Policy
              </Link>
              <Link
                href="/pricing"
                className="hover:text-orange-600 transition"
              >
                Pricing
              </Link>
              <Link
                href="/features"
                className="hover:text-orange-600 transition"
              >
                Features
              </Link>
              <Link href="#" className="hover:text-orange-600 transition">
                Contact Us
              </Link>
            </div>
          </div>
          <div className="mt-8 text-center text-xs text-gray-500">
            © {new Date().getFullYear()} Resume Mate AI. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  );
}