"use client"

import React, { useState, useEffect } from 'react'
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { FileText, Upload, ArrowRight, CheckCircle, Sparkles, ChevronRight, Star, Zap, Shield, Globe, Users, TrendingUp, Award, Clock, Target, Briefcase, Menu, X } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/hooks/useAuth"
import { SUBSCRIPTION_PLANS } from "@/lib/subscription-client"
import DocumentExamples from "@/components/DocumentExamples"

// Company logos data with actual image paths
const companyLogos = [
  { name: "Google", logo: "/logos/google.png" },
  { name: "Tesla", logo: "/logos/tesla.png" },
  { name: "Microsoft", logo: "/logos/microsoft.png" },
  { name: "Apple", logo: "/logos/apple.png" },
  { name: "Amazon", logo: "/logos/amazon.png" },
  { name: "Meta", logo: "/logos/meta.png" },
  { name: "Netflix", logo: "/logos/netflix.png" },
  { name: "Spotify", logo: "/logos/spotify.png" },
  { name: "Adobe", logo: "/logos/adobe.png" },
  { name: "Salesforce", logo: "/logos/salesforce.png" }
]

export default function LandingPage() {
  const { user } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrollPosition, setScrollPosition] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setScrollPosition((prev) => (prev + 1) % (companyLogos.length * 200))
    }, 30)
    return () => clearInterval(interval)
  }, [])

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-teal-50/20">
      {/* Enhanced Navigation Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-gray-100 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-8">
              <Link href="/" className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-lg flex items-center justify-center">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Resume Mate AI
                </span>
              </Link>
              
              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center space-x-6">
                <Link href="/features" className="text-sm font-medium text-gray-600 hover:text-teal-600 transition-colors">
                  Features
                </Link>
                <Link href="/pricing" className="text-sm font-medium text-gray-600 hover:text-teal-600 transition-colors">
                  Pricing
                </Link>
                <Link href="/templates" className="text-sm font-medium text-gray-600 hover:text-teal-600 transition-colors">
                  Templates
                </Link>
                <Link href="/blog" className="text-sm font-medium text-gray-600 hover:text-teal-600 transition-colors">
                  Resources
                </Link>
              </nav>
            </div>

            <div className="flex items-center gap-4">
              {user ? (
                <Link href="/dashboard">
                  <Button className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-lg shadow-teal-500/25">
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/auth/login" className="hidden sm:block">
                    <Button variant="ghost" className="text-gray-700 hover:text-teal-700">
                      Log In
                    </Button>
                  </Link>
                  <Link href="/auth/register">
                    <Button className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-lg shadow-teal-500/25">
                      Start Free Trial
                    </Button>
                  </Link>
                </>
              )}
              
              {/* Mobile menu button */}
              <button
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white">
            <nav className="container mx-auto px-4 py-4 space-y-2">
              <Link href="/features" className="block py-2 text-sm font-medium text-gray-600 hover:text-teal-600">
                Features
              </Link>
              <Link href="/pricing" className="block py-2 text-sm font-medium text-gray-600 hover:text-teal-600">
                Pricing
              </Link>
              <Link href="/templates" className="block py-2 text-sm font-medium text-gray-600 hover:text-teal-600">
                Templates
              </Link>
              <Link href="/blog" className="block py-2 text-sm font-medium text-gray-600 hover:text-teal-600">
                Resources
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* Enhanced Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 md:pt-24 md:pb-28">
        {/* Background decorations */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-10 h-72 w-72 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute top-40 right-10 h-72 w-72 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 h-72 w-72 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>
        
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            {/* Trust badge */}
            <div className="inline-flex items-center gap-2 bg-teal-50 border border-teal-200 rounded-full px-4 py-2 mb-6">
              <Star className="h-4 w-4 text-yellow-500 fill-current" />
              <span className="text-sm font-medium text-teal-800">Rated 4.9/5 by 10,000+ professionals</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                Land Your Dream Job with
              </span>
              <br />
              <span className="bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                AI-Powered Applications
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Create tailored resumes and cover letters in minutes. Join over 100,000 professionals who've successfully landed jobs at top companies.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link href="/auth/register">
                <Button size="lg" className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-xl shadow-teal-500/25 px-8">
                  <Zap className="mr-2 h-5 w-5" />
                  Start Free - No Card Required
                </Button>
              </Link>
              <Link href="/demo">
                <Button size="lg" variant="outline" className="border-gray-300 hover:border-teal-300 hover:bg-teal-50">
                  Watch 2-min Demo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            
            <div className="flex items-center justify-center gap-8 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Free forever plan</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>No credit card needed</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Company Logos Section - Animated Slider */}
      <section className="py-12 bg-white border-y border-gray-100">
        <div className="container mx-auto px-4">
          <p className="text-center text-sm text-gray-500 mb-6 font-medium">
            OVER 100,000 USERS LANDED JOBS AT LEADING COMPANIES
          </p>
          <div className="relative overflow-hidden">
            <div className="flex items-center gap-12 animate-scroll" style={{ transform: `translateX(-${scrollPosition}px)` }}>
              {/* Duplicate logos for seamless scrolling */}
              {[...companyLogos, ...companyLogos, ...companyLogos].map((company, index) => (
                // The parent div is styled to just hold the logo
                <div key={index} className="flex items-center justify-center px-5 py-3 bg-gray-50 rounded-lg">
                  <Image
                    src={company.logo}
                    alt={`${company.name} logo`} // Keep alt text for accessibility
                    width={32}                   // Increased size for better visibility
                    height={32}
                    className="h-8 w-8 object-contain"
                  />
                  {/* The company name <span> element has been removed from here */}
                </div>
              ))}
            </div>
            {/* Gradient overlays for fade effect */}
            <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white to-transparent pointer-events-none"></div>
            <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white to-transparent pointer-events-none"></div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-r from-teal-600 to-emerald-600 text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold mb-2">100K+</div>
              <div className="text-teal-100">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold mb-2">2.5M+</div>
              <div className="text-teal-100">Documents Created</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold mb-2">85%</div>
              <div className="text-teal-100">Interview Success Rate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold mb-2">4.9/5</div>
              <div className="text-teal-100">User Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced How It Works Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-block rounded-full bg-teal-100 px-4 py-2 text-sm font-semibold text-teal-800 mb-4">
              HOW IT WORKS
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Three Simple Steps to Your Dream Job
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our AI technology makes creating professional applications faster than ever before
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connection lines for desktop */}
            <div className="hidden md:block absolute top-20 left-1/3 right-1/3 h-0.5 bg-gradient-to-r from-teal-200 via-teal-300 to-teal-200"></div>
            
            <div className="relative">
              <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100 hover:shadow-2xl transition-shadow">
                <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                  <FileText className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -top-4 -right-4 bg-teal-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                  1
                </div>
                <h3 className="text-xl font-bold mb-3 text-center">Paste Job Description</h3>
                <p className="text-gray-600 text-center mb-4">
                  Simply paste the job posting URL or text. Our AI instantly analyzes requirements and keywords.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-teal-500 mr-2 flex-shrink-0" />
                    <span className="text-sm text-gray-700">Auto-extracts key requirements</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-teal-500 mr-2 flex-shrink-0" />
                    <span className="text-sm text-gray-700">Identifies important keywords</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-teal-500 mr-2 flex-shrink-0" />
                    <span className="text-sm text-gray-700">Understands company culture</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="relative">
              <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100 hover:shadow-2xl transition-shadow">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                  <Upload className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -top-4 -right-4 bg-emerald-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                  2
                </div>
                <h3 className="text-xl font-bold mb-3 text-center">Upload Your Experience</h3>
                <p className="text-gray-600 text-center mb-4">
                  Upload your existing resume or connect LinkedIn. We'll extract and optimize your experience.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-emerald-500 mr-2 flex-shrink-0" />
                    <span className="text-sm text-gray-700">LinkedIn one-click import</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-emerald-500 mr-2 flex-shrink-0" />
                    <span className="text-sm text-gray-700">PDF/Word resume upload</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-emerald-500 mr-2 flex-shrink-0" />
                    <span className="text-sm text-gray-700">Smart experience matching</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="relative">
              <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100 hover:shadow-2xl transition-shadow">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -top-4 -right-4 bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                  3
                </div>
                <h3 className="text-xl font-bold mb-3 text-center">Get Tailored Documents</h3>
                <p className="text-gray-600 text-center mb-4">
                  Receive perfectly tailored resume & cover letter. Edit, customize, and download instantly.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-purple-500 mr-2 flex-shrink-0" />
                    <span className="text-sm text-gray-700">ATS-optimized formatting</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-purple-500 mr-2 flex-shrink-0" />
                    <span className="text-sm text-gray-700">Multiple export formats</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-purple-500 mr-2 flex-shrink-0" />
                    <span className="text-sm text-gray-700">Real-time editing</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link href="/auth/register">
              <Button size="lg" className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-xl shadow-teal-500/25 px-8">
                Try It Now - Free Forever Plan
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Document Examples Section */}
      <DocumentExamples />

      {/* Enhanced Features Grid */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-block rounded-full bg-purple-100 px-4 py-2 text-sm font-semibold text-purple-800 mb-4">
              POWERFUL FEATURES
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Advanced AI technology combined with industry best practices
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="p-6 border-0 shadow-lg hover:shadow-xl transition-shadow bg-white">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-4">
                <Target className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">ATS Optimization</h3>
              <p className="text-gray-600 text-sm">
                Beat applicant tracking systems with optimized keywords and formatting that gets you noticed.
              </p>
            </Card>

            <Card className="p-6 border-0 shadow-lg hover:shadow-xl transition-shadow bg-white">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl flex items-center justify-center mb-4">
                <Globe className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Multi-Language Support</h3>
              <p className="text-gray-600 text-sm">
                Create documents in 25+ languages with native-level writing quality and cultural adaptation.
              </p>
            </Card>

            <Card className="p-6 border-0 shadow-lg hover:shadow-xl transition-shadow bg-white">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">60-Second Generation</h3>
              <p className="text-gray-600 text-sm">
                From job posting to tailored documents in under a minute. Save hours on each application.
              </p>
            </Card>

            <Card className="p-6 border-0 shadow-lg hover:shadow-xl transition-shadow bg-white">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Privacy First</h3>
              <p className="text-gray-600 text-sm">
                Your data is encrypted and never shared. Full GDPR compliance with data deletion options.
              </p>
            </Card>

            <Card className="p-6 border-0 shadow-lg hover:shadow-xl transition-shadow bg-white">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Success Analytics</h3>
              <p className="text-gray-600 text-sm">
                Track application performance with insights on views, downloads, and interview conversion rates.
              </p>
            </Card>

            <Card className="p-6 border-0 shadow-lg hover:shadow-xl transition-shadow bg-white">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center mb-4">
                <Award className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Industry Templates</h3>
              <p className="text-gray-600 text-sm">
                500+ professionally designed templates for every industry, from tech to healthcare to finance.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-block rounded-full bg-yellow-100 px-4 py-2 text-sm font-semibold text-yellow-800 mb-4">
              SUCCESS STORIES
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Join Thousands Who've Landed Their Dream Jobs
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="p-6 border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-500 fill-current" />
                ))}
              </div>
              <p className="text-gray-700 mb-4 italic">
                "Landed my dream job at Google within 2 weeks of using Resume Mate AI. The ATS optimization was a game-changer!"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                  S
                </div>
                <div>
                  <div className="font-semibold">Sarah Chen</div>
                  <div className="text-sm text-gray-500">Software Engineer at Google</div>
                </div>
              </div>
            </Card>

            <Card className="p-6 border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-500 fill-current" />
                ))}
              </div>
              <p className="text-gray-700 mb-4 italic">
                "The AI understood exactly what Tesla was looking for. My tailored resume got me an interview on the first try!"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold">
                  M
                </div>
                <div>
                  <div className="font-semibold">Michael Rodriguez</div>
                  <div className="text-sm text-gray-500">Product Manager at Tesla</div>
                </div>
              </div>
            </Card>

            <Card className="p-6 border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-500 fill-current" />
                ))}
              </div>
              <p className="text-gray-700 mb-4 italic">
                "From 50+ rejections to 5 interviews in a month. This tool completely transformed my job search strategy!"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center text-white font-bold">
                  A
                </div>
                <div>
                  <div className="font-semibold">Amanda Foster</div>
                  <div className="text-sm text-gray-500">Marketing Director at Meta</div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Enhanced Pricing Section */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
         <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-block rounded-full bg-gradient-to-r from-teal-100 to-emerald-100 px-4 py-2 text-sm font-semibold text-teal-800 mb-4">
              SIMPLE PRICING
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Choose Your Path to Success
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Start free and upgrade as you grow. No hidden fees, cancel anytime.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {Object.entries(SUBSCRIPTION_PLANS).map(([tier, plan], index) => (
              <div
                key={tier}
                className={`relative ${tier === "PRO" ? "md:-mt-4" : ""}`}
              >
                {tier === "PRO" && (
                  <div className="absolute -top-5 left-0 right-0 flex justify-center">
                    <span className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider">
                      Most Popular
                    </span>
                  </div>
                )}
                <Card
                  className={`h-full ${
                    tier === "PRO"
                      ? "border-2 border-teal-500 shadow-2xl scale-105"
                      : "border border-gray-200 shadow-lg"
                  } hover:shadow-xl transition-all duration-300 bg-white rounded-2xl overflow-hidden`}
                >
                  <div className={`p-8 ${
                    tier === "FREE" 
                      ? "bg-gradient-to-br from-gray-50 to-white"
                      : tier === "PRO"
                      ? "bg-gradient-to-br from-teal-50 to-white"
                      : "bg-gradient-to-br from-purple-50 to-white"
                  }`}>
                    <div className="mb-4">
                      <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                      <p className="text-gray-600 text-sm">{plan.description}</p>
                    </div>
                    
                    <div className="mb-6">
                      <div className="flex items-baseline">
                        <span className="text-4xl font-bold">
                          ${plan.price.monthly}
                        </span>
                        {plan.price.monthly > 0 && (
                          <span className="text-gray-500 ml-2">/month</span>
                        )}
                      </div>
                      {tier === "PRO" && (
                        <p className="text-sm text-teal-600 mt-2">
                          Save 20% with annual billing
                        </p>
                      )}
                    </div>

                    <ul className="space-y-3 mb-8">
                      {plan.features.slice(0, 6).map((feature, idx) => (
                        <li key={idx} className="flex items-start">
                          <CheckCircle className={`h-5 w-5 mr-3 mt-0.5 flex-shrink-0 ${
                            tier === "FREE" 
                              ? "text-gray-400"
                              : tier === "PRO"
                              ? "text-teal-500"
                              : "text-purple-500"
                          }`} />
                          <span className="text-sm text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Link href="/auth/register" className="block">
                      <Button
                        className={`w-full py-6 text-base font-semibold ${
                          tier === "FREE"
                            ? "bg-gray-900 hover:bg-gray-800"
                            : tier === "PRO"
                            ? "bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 shadow-lg shadow-teal-500/25"
                            : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                        }`}
                      >
                        {tier === "FREE" ? "Start Free" : tier === "PRO" ? "Get Pro Access" : "Contact Sales"}
                      </Button>
                    </Link>
                  </div>
                </Card>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-gray-600 mb-4">
              All plans include: Unlimited downloads • 24/7 support • SSL encryption
            </p>
            <Link href="/pricing" className="text-teal-600 hover:text-teal-700 font-medium">
              View detailed feature comparison →
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <span className="inline-block rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-800 mb-4">
              FAQ
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-6">
            <Card className="p-6 border border-gray-200 hover:border-teal-300 transition-colors">
              <h3 className="text-lg font-semibold mb-3">
                How does the AI personalization work?
              </h3>
              <p className="text-gray-600">
                Our AI analyzes the job description and your experience to create perfectly matched content. It identifies key requirements, extracts relevant keywords, and tailors your achievements to align with what employers are looking for.
              </p>
            </Card>

            <Card className="p-6 border border-gray-200 hover:border-teal-300 transition-colors">
              <h3 className="text-lg font-semibold mb-3">
                Is my data safe and private?
              </h3>
              <p className="text-gray-600">
                Absolutely. We use bank-level encryption for all data. Your information is never shared with third parties, and you can delete your data anytime. We're fully GDPR and CCPA compliant.
              </p>
            </Card>

            <Card className="p-6 border border-gray-200 hover:border-teal-300 transition-colors">
              <h3 className="text-lg font-semibold mb-3">
                Can I use Resume Mate AI for multiple job applications?
              </h3>
              <p className="text-gray-600">
                Yes! You can create unlimited tailored resumes and cover letters for different positions. Our system saves your base profile and creates new versions optimized for each specific job.
              </p>
            </Card>

            <Card className="p-6 border border-gray-200 hover:border-teal-300 transition-colors">
              <h3 className="text-lg font-semibold mb-3">
                What makes this better than other resume builders?
              </h3>
              <p className="text-gray-600">
                Unlike template-based builders, we use advanced AI to create truly personalized content. Each document is uniquely tailored to the specific job, not just filled with generic text. Plus, our ATS optimization ensures your resume gets seen.
              </p>
            </Card>

            <Card className="p-6 border border-gray-200 hover:border-teal-300 transition-colors">
              <h3 className="text-lg font-semibold mb-3">
                Do you offer refunds?
              </h3>
              <p className="text-gray-600">
                Yes, we offer a 30-day money-back guarantee. If you're not satisfied with our service, contact support for a full refund. No questions asked.
              </p>
            </Card>
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">Still have questions?</p>
            <Link href="/support">
              <Button variant="outline" className="border-teal-300 text-teal-700 hover:bg-teal-50">
                Contact Support Team
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-br from-teal-600 via-emerald-600 to-teal-700 text-white relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 bg-grid-white/10"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-400/20 rounded-full blur-3xl"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur rounded-full px-4 py-2 mb-6">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-semibold">Limited Time: 50% OFF Pro Plans</span>
            </div>
            
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Ready to 10x Your Job Search Success?
            </h2>
            <p className="text-xl mb-8 text-teal-50 max-w-2xl mx-auto">
              Join over 100,000 professionals who've landed their dream jobs. Start creating winning applications in minutes.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link href="/auth/register">
                <Button size="lg" className="bg-white text-teal-700 hover:bg-gray-100 shadow-2xl px-8 py-6 text-lg font-semibold">
                  <Zap className="mr-2 h-5 w-5" />
                  Start Free Trial Now
                </Button>
              </Link>
              <Link href="/demo">
                <Button size="lg" variant="outline" className="border-white/50 text-white hover:bg-white/10 backdrop-blur px-8 py-6 text-lg">
                  Schedule Live Demo
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
            
            <div className="flex items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                <span>Setup in 30 seconds</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <span>Join 100,000+ users</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer className="bg-gray-900 text-gray-300">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Company Info */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="h-8 w-8 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-lg flex items-center justify-center">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">Resume Mate AI</span>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                AI-powered resume and cover letter builder helping professionals land their dream jobs.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="hover:text-teal-400 transition-colors">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a href="#" className="hover:text-teal-400 transition-colors">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </a>
                <a href="#" className="hover:text-teal-400 transition-colors">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Product Links */}
            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/features" className="hover:text-teal-400 transition-colors">Features</Link></li>
                <li><Link href="/templates" className="hover:text-teal-400 transition-colors">Templates</Link></li>
                <li><Link href="/pricing" className="hover:text-teal-400 transition-colors">Pricing</Link></li>
                <li><Link href="/demo" className="hover:text-teal-400 transition-colors">Live Demo</Link></li>
                <li><Link href="/api" className="hover:text-teal-400 transition-colors">API</Link></li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 className="text-white font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/blog" className="hover:text-teal-400 transition-colors">Blog</Link></li>
                <li><Link href="/guides" className="hover:text-teal-400 transition-colors">Career Guides</Link></li>
                <li><Link href="/examples" className="hover:text-teal-400 transition-colors">Resume Examples</Link></li>
                <li><Link href="/cover-letter-examples" className="hover:text-teal-400 transition-colors">Cover Letter Examples</Link></li>
                <li><Link href="/help" className="hover:text-teal-400 transition-colors">Help Center</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="text-white font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/about" className="hover:text-teal-400 transition-colors">About Us</Link></li>
                <li><Link href="/careers" className="hover:text-teal-400 transition-colors">Careers</Link></li>
                <li><Link href="/contact" className="hover:text-teal-400 transition-colors">Contact</Link></li>
                <li><Link href="/partners" className="hover:text-teal-400 transition-colors">Partners</Link></li>
                <li><Link href="/affiliates" className="hover:text-teal-400 transition-colors">Affiliates</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom Footer */}
          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-sm text-gray-400 mb-4 md:mb-0">
                © {new Date().getFullYear()} Resume Mate AI. All rights reserved.
              </p>
              <div className="flex flex-wrap gap-6 text-sm">
                <Link href="/privacy" className="hover:text-teal-400 transition-colors">Privacy Policy</Link>
                <Link href="/terms" className="hover:text-teal-400 transition-colors">Terms of Service</Link>
                <Link href="/cookies" className="hover:text-teal-400 transition-colors">Cookie Policy</Link>
                <Link href="/sitemap" className="hover:text-teal-400 transition-colors">Sitemap</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .bg-grid-white\\/10 {
          background-image: url("data:image/svg+xml,%3csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3e%3cg fill='none' fill-rule='evenodd'%3e%3cg fill='%23ffffff' fill-opacity='0.1'%3e%3cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3e%3c/g%3e%3c/g%3e%3c/svg%3e");
        }
      `}</style>
    </main>
  )
}