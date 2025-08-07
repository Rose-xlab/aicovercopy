import React, { useState } from 'react'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight, FileText, Sparkles, Award, Briefcase } from "lucide-react"
import Link from "next/link"

const DocumentExamples = () => {
  const [activeTab, setActiveTab] = useState('resumes')

  // Resume templates with Supabase URLs
  const resumeTemplates = [
    {
      id: 1,
      name: "Modern Green",
      description: "Clean and professional with green accents",
      image: "https://fweaogysitcigfzncvtu.supabase.co/storage/v1/object/public/resume-template-thumbnails/gren_accent.png",
      category: "Professional"
    },
    {
      id: 2,
      name: "Purple Executive",
      description: "Bold purple sidebar design for leaders",
      image: "https://fweaogysitcigfzncvtu.supabase.co/storage/v1/object/public/resume-template-thumbnails/purple%20sidebar.png",
      category: "Executive"
    },
    {
      id: 3,
      name: "Orange Creative",
      description: "Vibrant orange sidebar for creative roles",
      image: "https://fweaogysitcigfzncvtu.supabase.co/storage/v1/object/public/resume-template-thumbnails/orange_sidebar.png",
      category: "Creative"
    },
    {
      id: 4,
      name: "Sage Minimalist",
      description: "Elegant sage green minimalist design",
      image: "https://fweaogysitcigfzncvtu.supabase.co/storage/v1/object/public/resume-template-thumbnails/sage%20green.png",
      category: "Minimalist"
    }
  ]

  // Cover letter examples (keeping the gradient placeholders for now)
  const coverLetterExamples = [
    {
      id: 1,
      title: "Software Engineer",
      company: "Tech Startup",
      preview: "I am excited to apply for the Software Engineer position at your innovative startup...",
      matchRate: "95%"
    },
    {
      id: 2,
      title: "Marketing Manager",
      company: "Fortune 500",
      preview: "With over 5 years of experience in digital marketing and brand strategy...",
      matchRate: "92%"
    },
    {
      id: 3,
      title: "Data Scientist",
      company: "AI Company",
      preview: "As a passionate data scientist with expertise in machine learning and AI...",
      matchRate: "94%"
    },
    {
      id: 4,
      title: "Product Designer",
      company: "Design Agency",
      preview: "Your company's commitment to user-centered design aligns perfectly with my philosophy...",
      matchRate: "91%"
    }
  ]

  return (
    <section className="py-20 bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <span className="inline-block rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-800 mb-4">
            TEMPLATES & EXAMPLES
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Professional Templates That Get Results
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Choose from our collection of ATS-optimized templates designed by career experts
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-lg bg-gray-100 p-1">
            <button
              onClick={() => setActiveTab('resumes')}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'resumes'
                  ? 'bg-white text-teal-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FileText className="inline-block w-4 h-4 mr-2" />
              Resume Templates
            </button>
            <button
              onClick={() => setActiveTab('coverletters')}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'coverletters'
                  ? 'bg-white text-teal-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Sparkles className="inline-block w-4 h-4 mr-2" />
              Cover Letter Examples
            </button>
          </div>
        </div>

        {/* Resume Templates Grid */}
        {activeTab === 'resumes' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {resumeTemplates.map((template) => (
              <Card key={template.id} className="group overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-white">
                <div className="relative aspect-[8.5/11] overflow-hidden bg-gray-50">
                  <img
                    src={template.image}
                    alt={template.name}
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-4 left-4 right-4">
                      <Button className="w-full bg-white text-gray-900 hover:bg-gray-100">
                        Use This Template
                      </Button>
                    </div>
                  </div>
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur rounded-full px-3 py-1">
                    <span className="text-xs font-semibold text-gray-700">{template.category}</span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-1">{template.name}</h3>
                  <p className="text-sm text-gray-600">{template.description}</p>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Cover Letter Examples Grid */}
        {activeTab === 'coverletters' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {coverLetterExamples.map((example) => (
              <Card key={example.id} className="group overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-white">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center">
                      <Briefcase className="h-6 w-6 text-white" />
                    </div>
                    <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded-full">
                      {example.matchRate} Match
                    </span>
                  </div>
                  <h3 className="font-semibold text-lg mb-1">{example.title}</h3>
                  <p className="text-sm text-gray-500 mb-3">{example.company}</p>
                  <p className="text-sm text-gray-600 line-clamp-3 mb-4">{example.preview}</p>
                  <Button variant="outline" className="w-full group-hover:bg-teal-50 group-hover:border-teal-300 transition-colors">
                    View Example
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* CTA Section */}
        <div className="text-center bg-gradient-to-r from-teal-50 to-emerald-50 rounded-2xl p-8 border border-teal-200">
          <Award className="h-12 w-12 text-teal-600 mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-3">500+ Industry-Specific Templates</h3>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            From tech to healthcare, finance to creative fields - we have the perfect template for your industry
          </p>
          <Link href="/templates">
            <Button size="lg" className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-lg shadow-teal-500/25">
              Browse All Templates
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}

export default DocumentExamples