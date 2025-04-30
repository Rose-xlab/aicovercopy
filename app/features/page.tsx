"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { 
  FileText, 
  Upload, 
  Download, 
  Sparkles, 
  Briefcase, 
  Search, 
  MessagesSquare, 
  ScanSearch, 
  CheckCircle2,
  FileSpreadsheet,
  ArrowRight,
  MailCheck
} from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";

const FeaturesPage = () => {
  const { user } = useAuth();
  return (
    <main className="min-h-screen bg-gradient-to-b from-teal-50/20 to-white">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 border-b border-teal-100 bg-white shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/90">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center">
            <FileText className="h-6 w-6 text-teal-600 mr-2" />
            <h1 className="text-xl font-bold text-gray-800">AI Cover Letter</h1>
          </div>
          
          <div className="flex items-center gap-4">
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
                  <Button variant="outline" className="border-teal-200 text-gray-700 hover:text-teal-700 hover:bg-teal-50 hover:border-teal-300">
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
      <section className="relative overflow-hidden bg-gradient-to-b from-teal-50 to-white py-16 md:py-24">
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
        <div className="container relative mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-4 tracking-tight text-gray-900 lg:text-5xl">
              Powerful Features for Your Job Applications
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Our AI-powered tools help you create professional applications, prepare for interviews, and improve your chances of landing your dream job.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/register">
                <Button size="lg" className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white">
                  Get Started - It's Free
                </Button>
              </Link>
              <Link href="#features">
                <Button variant="outline" size="lg" className="w-full sm:w-auto border-teal-200 text-gray-700 hover:text-teal-700 hover:bg-teal-50 hover:border-teal-300">
                  Explore Features
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Main Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Comprehensive Job Application Tools</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our platform provides everything you need to create standout job applications and prepare for interviews.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {/* Cover Letter Generator */}
            <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow group">
              <div className="h-3 bg-teal-600 w-full"></div>
              <div className="p-6">
                <div className="bg-teal-100 rounded-full p-3 w-16 h-16 flex items-center justify-center mb-6 group-hover:bg-teal-200 transition-colors">
                  <FileText className="h-8 w-8 text-teal-600" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-800">AI Cover Letter Generator</h3>
                <p className="text-gray-600 mb-6">
                  Generate tailored cover letters that match job descriptions. Our AI analyzes job requirements and your experience to create compelling applications.
                </p>
                <ul className="space-y-2 mb-6">
                  {["Perfect keyword matching", "Multiple tone options", "Instant generation", "Perfectly formatted"].map((item, i) => (
                    <li key={i} className="flex items-center">
                      <CheckCircle2 className="h-5 w-5 text-teal-500 mr-2 flex-shrink-0" />
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
                <Button className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white">
                  Try Cover Letter Generator
                </Button>
              </div>
            </Card>

            {/* Resume Builder */}
            <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow group">
              <div className="h-3 bg-blue-600 w-full"></div>
              <div className="p-6">
                <div className="bg-blue-100 rounded-full p-3 w-16 h-16 flex items-center justify-center mb-6 group-hover:bg-blue-200 transition-colors">
                  <FileSpreadsheet className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-800">Smart Resume Builder</h3>
                <p className="text-gray-600 mb-6">
                  Create professional resumes with our intuitive builder. Import existing CVs, customize templates, and export in multiple formats.
                </p>
                <ul className="space-y-2 mb-6">
                  {["ATS-optimized templates", "PDF & DOCX export", "LinkedIn integration", "One-click tailoring"].map((item, i) => (
                    <li key={i} className="flex items-center">
                      <CheckCircle2 className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" />
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
                <Button className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white">
                  Build Your Resume
                </Button>
              </div>
            </Card>

            {/* ATS Scanner */}
            <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow group">
              <div className="h-3 bg-purple-600 w-full"></div>
              <div className="p-6">
                <div className="bg-purple-100 rounded-full p-3 w-16 h-16 flex items-center justify-center mb-6 group-hover:bg-purple-200 transition-colors">
                  <ScanSearch className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-800">ATS Scanner</h3>
                <p className="text-gray-600 mb-6">
                  Get your resume past applicant tracking systems with our scanner. Analyze compatibility and get suggestions for improvements.
                </p>
                <ul className="space-y-2 mb-6">
                  {["Keyword analysis", "Formatting check", "Compatibility score", "Detailed feedback"].map((item, i) => (
                    <li key={i} className="flex items-center">
                      <CheckCircle2 className="h-5 w-5 text-purple-500 mr-2 flex-shrink-0" />
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
                <Button className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white">
                  Scan Your Resume
                </Button>
              </div>
            </Card>
          </div>

          {/* Secondary Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Interview Buddy */}
            <Card className="overflow-hidden border border-gray-200 hover:border-indigo-200 hover:shadow-md transition-all p-6">
              <div className="flex items-start mb-4">
                <div className="bg-indigo-100 rounded-lg p-3 mr-4">
                  <MessagesSquare className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-1">Interview Buddy</h3>
                  <p className="text-gray-600 text-sm">
                    Practice for interviews with AI-generated questions based on your resume and job description.
                  </p>
                </div>
              </div>
              <Button variant="outline" className="w-full border-indigo-200 text-indigo-700 hover:bg-indigo-50" size="sm">
                Learn More
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Card>

            {/* Job Search */}
            <Card className="overflow-hidden border border-gray-200 hover:border-amber-200 hover:shadow-md transition-all p-6">
              <div className="flex items-start mb-4">
                <div className="bg-amber-100 rounded-lg p-3 mr-4">
                  <Briefcase className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-1">Smart Job Search</h3>
                  <p className="text-gray-600 text-sm">
                    Find relevant job opportunities and get suggestions based on your skills and preferences.
                  </p>
                </div>
              </div>
              <Button variant="outline" className="w-full border-amber-200 text-amber-700 hover:bg-amber-50" size="sm">
                Learn More
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Card>

            {/* Follow-Up Emails */}
            <Card className="overflow-hidden border border-gray-200 hover:border-green-200 hover:shadow-md transition-all p-6">
              <div className="flex items-start mb-4">
                <div className="bg-green-100 rounded-lg p-3 mr-4">
                  <MailCheck className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-1">Follow-Up Emails</h3>
                  <p className="text-gray-600 text-sm">
                    Create professional follow-up emails to increase your chances of getting a response.
                  </p>
                </div>
              </div>
              <Button variant="outline" className="w-full border-green-200 text-green-700 hover:bg-green-50" size="sm">
                Learn More
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our platform makes it easy to create professional job application materials in just a few steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="relative">
                <div className="bg-teal-100 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload className="h-8 w-8 text-teal-600" />
                </div>
                <div className="hidden md:block absolute top-10 left-full w-full h-0.5 bg-gradient-to-r from-teal-500 to-transparent -z-10"></div>
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-800">1. Upload your resume</h3>
              <p className="text-gray-600">
                Import your existing resume or create a new one using our builder
              </p>
            </div>

            <div className="text-center">
              <div className="relative">
                <div className="bg-teal-100 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="h-8 w-8 text-teal-600" />
                </div>
                <div className="hidden md:block absolute top-10 left-full w-full h-0.5 bg-gradient-to-r from-teal-500 to-transparent -z-10"></div>
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-800">2. Paste job description</h3>
              <p className="text-gray-600">
                Our AI analyzes requirements and matches them to your experience
              </p>
            </div>

            <div className="text-center">
              <div className="bg-teal-100 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Download className="h-8 w-8 text-teal-600" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-800">3. Get your documents</h3>
              <p className="text-gray-600">
                Download perfectly tailored cover letters and resumes ready to submit
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Advanced Features Highlight */}
      <section className="py-20 bg-gradient-to-r from-teal-900 to-teal-800 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Advanced AI-Powered Features</h2>
              <p className="text-xl text-teal-100 max-w-3xl mx-auto">
                Our platform uses cutting-edge AI to analyze job listings and optimize your applications.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="flex">
                <div className="mr-6">
                  <div className="bg-teal-700 p-4 rounded-lg">
                    <Sparkles className="h-8 w-8 text-teal-300" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Keyword Optimization</h3>
                  <p className="text-teal-100">
                    Our AI identifies key skills and requirements from job descriptions and seamlessly incorporates them into your cover letters and resumes.
                  </p>
                </div>
              </div>

              <div className="flex">
                <div className="mr-6">
                  <div className="bg-teal-700 p-4 rounded-lg">
                    <ScanSearch className="h-8 w-8 text-teal-300" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">ATS Compatibility Analysis</h3>
                  <p className="text-teal-100">
                    Get detailed feedback on how well your resume will perform with applicant tracking systems and suggestions for improvements.
                  </p>
                </div>
              </div>

              <div className="flex">
                <div className="mr-6">
                  <div className="bg-teal-700 p-4 rounded-lg">
                    <MessagesSquare className="h-8 w-8 text-teal-300" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Interview Question Prediction</h3>
                  <p className="text-teal-100">
                    Our system analyzes job descriptions to predict likely interview questions and helps you prepare compelling answers.
                  </p>
                </div>
              </div>

              <div className="flex">
                <div className="mr-6">
                  <div className="bg-teal-700 p-4 rounded-lg">
                    <MailCheck className="h-8 w-8 text-teal-300" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Follow-Up Email Generation</h3>
                  <p className="text-teal-100">
                    Create professional follow-up emails at the perfect time to increase your chances of getting a response.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-12 text-center">
              <Button size="lg" className="bg-white text-teal-700 hover:bg-teal-50">
                Explore All Features
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-teal-600 to-teal-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-6">Ready to elevate your job applications?</h2>
            <p className="text-xl mb-8 text-teal-50">
              Join thousands of job seekers who have improved their application success rate with our AI-powered tools
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/register">
                <Button size="lg" className="bg-white text-teal-700 hover:bg-teal-50">
                  Get Started - It's Free
                </Button>
              </Link>
              <Link href="/pricing">
                <Button variant="outline" size="lg" className="border-white text-white hover:bg-teal-600">
                  View Pricing
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-teal-100 bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <FileText className="h-5 w-5 text-teal-600 mr-2" />
              <span className="font-semibold text-gray-800">AI Cover Letter</span>
            </div>
            <div className="flex flex-wrap justify-center md:justify-end gap-4 md:gap-8 text-sm text-gray-600">
              <Link href="#" className="hover:text-teal-600 transition">Terms of Service</Link>
              <Link href="#" className="hover:text-teal-600 transition">Privacy Policy</Link>
              <Link href="/pricing" className="hover:text-teal-600 transition">Pricing</Link>
              <Link href="#" className="hover:text-teal-600 transition">Contact Us</Link>
            </div>
          </div>
          <div className="mt-8 text-center text-xs text-gray-500">
            © {new Date().getFullYear()} AI Cover Letter. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  );
};

export default FeaturesPage;