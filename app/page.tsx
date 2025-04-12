"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { FileText, Upload, ArrowRight, CheckCircle, Sparkles, ChevronRight } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/hooks/useAuth"
import { SUBSCRIPTION_PLANS } from "@/lib/subscription"
import DocumentExamples from "@/components/DocumentExamples"

export default function LandingPage() {
  const { user } = useAuth()

  return (
    <main className="min-h-screen bg-teal-50/20">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 border-b border-teal-100 bg-white shadow-sm backdrop_blur supports-[backdrop-filter]:bg-white/90">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center">
            <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-teal-600 mr-1 sm:mr-2" />
            <h1 className="text-lg sm:text-xl font-bold text-gray-800">AI Cover Letter</h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Navigation links */}
            <Link href="/pricing" className="text-sm font-medium text-gray-700 hover:text-teal-600 transition-colors">
              Pricing
            </Link>
            <Link href="/features" className="text-sm font-medium text-gray-700 hover:text-teal-600 transition-colors">
              Features
            </Link>

            {user ? (
              <Link href="/dashboard">
                <Button className="bg-teal-600 hover:bg-teal-700 text-white">
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/auth/login" className="hidden sm:block">
                  <Button
                    variant="outline"
                    className="border-teal-200 text-gray-700 hover:text-teal-700 hover:bg-teal-50 hover:border-teal-300"
                  >
                    Log In
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button className="bg-teal-600 hover:bg-teal-700 text-white">Sign Up</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-teal-50 to-white py-12 sm:py-16 md:py-24">
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
        <div className="container relative mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <span className="inline-block rounded-full bg-teal-100 px-3 py-1 text-sm font-medium text-teal-800 mb-6">
                AI-Powered Job Applications
              </span>
              <h1 className="text-3xl sm:text-4xl font-bold mb-4 tracking-tight text-gray-900 lg:text-5xl">
                Create professional, personalized cover letters
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Stand out from the crowd with tailored cover letters that highlight your strengths and match job
                requirements perfectly.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/auth/register">
                  <Button size="lg" className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white">
                    Get Started - It's Free
                  </Button>
                </Link>
                <Link href="/auth/login" className="sm:hidden">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full border-teal-200 text-gray-700 hover:text-teal-700 hover:bg-teal-50 hover:border-teal-300"
                  >
                    Log In
                  </Button>
                </Link>
              </div>
            </div>
            <div className="hidden md:block relative">
              <div className="relative mx-auto w-full max-w-lg rounded-lg bg-white p-4 shadow-xl ring-1 ring-gray-200/70">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div className="flex items-center space-x-2">
                    <div className="h-3 w-3 rounded-full bg-red-400"></div>
                    <div className="h-3 w-3 rounded-full bg-yellow-400"></div>
                    <div className="h-3 w-3 rounded-full bg-green-400"></div>
                  </div>
                  <div className="text-xs font-medium text-gray-500">Cover Letter Generator</div>
                </div>
                <div className="mt-4 space-y-3">
                  <div className="h-5 w-1/2 rounded bg-teal-100"></div>
                  <div className="h-4 w-full rounded bg-gray-100"></div>
                  <div className="h-4 w-full rounded bg-gray-100"></div>
                  <div className="h-4 w-3/4 rounded bg-gray-100"></div>
                  <div className="h-10 w-full rounded-md bg-teal-600"></div>
                </div>
              </div>
              <div className="absolute -right-10 -top-10 -z-10 h-64 w-64 rounded-full bg-teal-100/80 blur-3xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section with real content */}
      <section className="container mx-auto px-4 py-12 sm:py-16">
        <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">How It Works</h2>
        <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
          Our AI-powered platform makes creating tailored cover letters simple and efficient
        </p>

        <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-3">
          <Card className="p-4 sm:p-6 text-center border-0 bg-white shadow-md hover:shadow-lg transition-shadow">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-teal-100 mb-6">
              <FileText className="h-8 w-8 text-teal-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-800">Analyze Job Description</h3>
            <p className="text-gray-600">
              Paste the job listing text or URL. Our AI analyzes key requirements, skills, and qualifications needed for
              the position.
            </p>
            <ul className="mt-4 text-sm text-left space-y-2">
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-teal-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>Identifies important keywords</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-teal-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>Extracts job responsibilities</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-teal-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>Determines company values</span>
              </li>
            </ul>
          </Card>

          <Card className="p-4 sm:p-6 text-center border-0 bg-white shadow-md hover:shadow-lg transition-shadow">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-teal-100 mb-6">
              <Upload className="h-8 w-8 text-teal-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-800">Connect Your Experience</h3>
            <p className="text-gray-600">
              Upload your CV or connect your LinkedIn profile to provide our AI with your relevant skills and
              experience.
            </p>
            <ul className="mt-4 text-sm text-left space-y-2">
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-teal-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>Direct CV/resume upload</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-teal-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>LinkedIn profile integration</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-teal-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>Auto-extracts relevant experience</span>
              </li>
            </ul>
          </Card>

          <Card className="p-4 sm:p-6 text-center border-0 bg-white shadow-md hover:shadow-lg transition-shadow">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-teal-100 mb-6">
              <Sparkles className="h-8 w-8 text-teal-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-800">Generate & Customize</h3>
            <p className="text-gray-600">
              Our AI generates a tailored cover letter that matches your experience with job requirements. Edit, refine,
              and download.
            </p>
            <ul className="mt-4 text-sm text-left space-y-2">
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-teal-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>Multiple tone options</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-teal-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>Easy in-app editing</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-teal-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>Export in multiple formats</span>
              </li>
            </ul>
          </Card>
        </div>

        <div className="mt-12 text-center">
          <Link href="/features">
            <Button
              variant="outline"
              size="lg"
              className="border-teal-200 text-teal-700 hover:text-teal-800 hover:bg-teal-50 hover:border-teal-300"
            >
              Learn More About Our Features
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Document Examples Section */}
      <DocumentExamples />

      {/* NEW: Pricing Section with updated design */}
      <section className="py-16 bg-gradient-to-b from-white to-teal-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4 text-gray-800">Choose the Right Plan</h2>
          <p className="text-center text-lg text-gray-600 mb-12 max-w-2xl mx-auto">
            Select a plan that fits your needs, from our free tier to our feature-rich business option
          </p>

          <div className="grid grid-cols-1 gap-8 sm:gap-6 md:grid-cols-3 max-w-5xl mx-auto">
            {Object.entries(SUBSCRIPTION_PLANS).map(([tier, plan]) => (
              <Card
                key={tier}
                className={`overflow-hidden transition-all duration-200 bg-white border-0 shadow-md hover:shadow-lg ${
                  tier === "PRO" ? "relative ring-2 ring-teal-500 md:scale-105 z-10" : ""
                }`}
              >
                {tier === "PRO" && (
                  <div className="bg-teal-600 text-white text-center py-1.5 text-sm font-medium">MOST POPULAR</div>
                )}
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2 text-gray-800">{plan.name}</h3>
                  <div className="mb-3">
                    <span className="text-3xl font-bold text-gray-900">${plan.price.monthly}</span>
                    {plan.price.monthly > 0 && <span className="text-sm text-gray-500">/month</span>}
                  </div>
                  <p className="text-sm text-gray-600 mb-6">{plan.description}</p>

                  <ul className="space-y-3 mb-6">
                    {plan.features.slice(0, 4).map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle
                          className={`h-5 w-5 mr-2 flex-shrink-0 ${
                            tier === "FREE" ? "text-gray-500" : tier === "PRO" ? "text-teal-600" : "text-purple-600"
                          }`}
                        />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link href="/pricing" className="block w-full">
                    <Button
                      className={`w-full ${
                        tier === "FREE"
                          ? "bg-gray-800 hover:bg-gray-700"
                          : tier === "PRO"
                            ? "bg-teal-600 hover:bg-teal-700"
                            : "bg-purple-600 hover:bg-purple-700"
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
                className="bg-white border-teal-200 text-gray-700 hover:text-teal-700 hover:bg-teal-50 hover:border-teal-300"
              >
                See Full Pricing Details
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits Section with updated design */}
      <section className="container mx-auto px-4 py-12 sm:py-16">
        <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">Why Choose Us</h2>
        <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
          Our platform offers unique advantages to help you land your dream job
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 sm:gap-x-8 gap-y-8 sm:gap-y-10">
          <div className="flex items-start">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 mr-4 mt-1">
              <CheckCircle className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">AI-Powered Writing</h3>
              <p className="text-gray-600">
                Advanced AI algorithms generate professional content tailored to your specific job application
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 mr-4 mt-1">
              <CheckCircle className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">Job-Specific Content</h3>
              <p className="text-gray-600">
                Tailored to match the exact requirements in the job description to increase your chances
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 mr-4 mt-1">
              <CheckCircle className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">Time-Saving</h3>
              <p className="text-gray-600">
                Create professional cover letters in minutes instead of hours with our AI technology
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 mr-4 mt-1">
              <CheckCircle className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">Multiple Formats</h3>
              <p className="text-gray-600">
                Download in PDF, Word, or text formats to suit any application system requirement
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section with updated design */}
      <section className="py-12 sm:py-16 bg-gradient-to-br from-teal-600 to-teal-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">
              Ready to create your professional cover letter?
            </h2>
            <p className="text-lg sm:text-xl mb-6 sm:mb-8 text-teal-50">
              Join thousands of job seekers who have improved their application success rate with our AI-powered cover
              letters
            </p>
            <Link href="/auth/register">
              <Button size="lg" className="bg-white text-teal-700 hover:bg-teal-50">
                Get Started Today
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer with updated design */}
      <footer className="border-t border-teal-100 bg-white">
        <div className="container mx-auto px-4 py-6 sm:py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <FileText className="h-5 w-5 text-teal-600 mr-2" />
              <span className="font-semibold text-gray-800">AI Cover Letter</span>
            </div>
            <div className="flex flex-wrap justify-center md:justify-end gap-4 md:gap-8 text-sm text-gray-600">
              <Link href="#" className="hover:text-teal-600 transition">
                Terms of Service
              </Link>
              <Link href="#" className="hover:text-teal-600 transition">
                Privacy Policy
              </Link>
              <Link href="/pricing" className="hover:text-teal-600 transition">
                Pricing
              </Link>
              <Link href="/features" className="hover:text-teal-600 transition">
                Features
              </Link>
              <Link href="#" className="hover:text-teal-600 transition">
                Contact Us
              </Link>
            </div>
          </div>
          <div className="mt-8 text-center text-xs text-gray-500">
            © {new Date().getFullYear()} AI Cover Letter. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  )
}
