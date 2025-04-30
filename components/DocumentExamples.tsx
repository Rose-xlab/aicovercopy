"use client"

import { useState } from "react"
import { Award } from "lucide-react"

const DocumentExamples = () => {
  const [activeTab, setActiveTab] = useState("all")

  // Color scheme for the redesign
  const colors = {
    primary: "bg-teal-600",
    secondary: "bg-teal-50",
    text: "text-teal-700",
    accent: "bg-teal-100",
    border: "border-teal-200",
    gradient: "from-teal-600 to-teal-700",
    button: "bg-teal-600 hover:bg-teal-700",
    skill: "bg-teal-50 text-teal-700",
  }

  return (
    <section className="py-8 md:py-16 bg-gradient-to-b from-slate-50 to-white overflow-x-hidden">
      <style jsx global>{`
        @media (min-width: 640px) {
          .scale-60 {
            transform: scale(0.6);
          }
        }
        
        .scale-65 {
          transform: scale(0.65);
        }
        
        .document-container {
          margin-bottom: -100px;
        }
        
        @media (min-width: 768px) {
          .document-container {
            margin-bottom: -120px;
          }
        }
      `}</style>
      <div className="container px-2 mx-auto">
        <div className="text-center mb-8 md:mb-12">
          <div className="inline-flex items-center justify-center px-4 py-1.5 mb-4 rounded-full bg-teal-100 text-teal-700 text-sm font-medium">
            <Award className="h-4 w-4 mr-2 text-teal-500" />
            AI-Powered Document Builder
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
            Job-specific documents that get results
          </h2>
          <p className="text-base md:text-lg text-slate-600 max-w-2xl mx-auto">
            Our AI creates tailored, professional documents that help you land interviews and stand out from the
            competition
          </p>
        </div>

        {/* Document showcase - 3 column layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 -mx-2 max-w-7xl mx-auto">
          {/* Cover Letter Column */}
          <div className="flex flex-col">
            <h3 className="text-xl md:text-2xl font-bold text-slate-800 mb-6">Job-specific cover letter</h3>
            
            {/* First Cover Letter */}
            <div className="relative flex-grow max-w-md mx-auto transform document-container scale-65 origin-top sm:scale-60">
              {/* Paper shadow effect */}
              <div className="absolute inset-0 bg-slate-200 rounded-lg transform rotate-1 translate-x-1 translate-y-1"></div>

              {/* Main document - wider */}
              <div className="relative bg-white rounded-lg shadow-md overflow-hidden border border-slate-200 transform transition-transform duration-300 hover:scale-[1.08] min-h-[500px] sm:min-h-[500px] w-full"
                style={{ transformOrigin: "center top" }}>
                {/* Document content - Professional letterhead style */}
                <div className="border-b-2 border-teal-600 pt-4 px-4">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <h4 className="font-bold text-slate-800 text-lg">Steve Jobs</h4>
                      <p className="text-sm text-slate-600">123 Innovation Drive</p>
                      <p className="text-sm text-slate-600">Los Altos, CA 94022</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-600">April 7, 2025</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 sm:p-5">
                  <div className="mb-3">
                    <p className="font-medium text-slate-800 mb-1">HR Manager</p>
                    <p className="text-xs text-slate-600">AtApply, San Francisco, CA</p>
                  </div>

                  <div>
                    <p className="font-medium text-slate-800 mb-2">Dear HR Manager,</p>

                    <p className="text-xs text-slate-600 mb-2 leading-relaxed">
                      I'm reaching out about the role at AtApply. You're looking for someone who challenges conventions
                      and builds products that redefine industries—that's been the foundation of my career.
                    </p>

                    <p className="text-xs text-slate-600 mb-2 leading-relaxed">
                      At Apple, I created technology that's intuitive and beautifully designed. The Macintosh, iPod, and iPhone 
                      each redefined their industries. At Pixar, we pioneered new ways to blend art with technology.
                    </p>

                    <p className="text-xs text-slate-600 mb-2 leading-relaxed">
                      I thrive at the intersection of technology and humanity. AtApply has the potential to reshape how people 
                      navigate careers, and I'd love to help shape that future. Let's talk.
                    </p>

                    <p className="text-xs text-slate-800 font-medium mt-4">Sincerely,</p>
                    <div className="mt-2">
                      <span className="font-medium italic text-slate-700">Steve Jobs</span>
                    </div>
                    <p className="text-xs text-slate-600">steve@apple.com | (555) 123-4567</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Second Cover Letter - Modern Style */}
            <div className="relative flex-grow max-w-md mx-auto transform document-container scale-65 origin-top sm:scale-60 mt-16 sm:mt-0">
              {/* Paper shadow effect */}
              <div className="absolute inset-0 bg-slate-200 rounded-lg transform rotate-1 translate-x-1 translate-y-1"></div>

              {/* Main document - wider */}
              <div className="relative bg-white rounded-lg shadow-md overflow-hidden border border-slate-200 transform transition-transform duration-300 hover:scale-[1.08] min-h-[500px] sm:min-h-[500px] w-full"
                style={{ transformOrigin: "center top" }}>
                {/* Document content - Modern style */}
                <div className="bg-slate-800 text-white px-4 py-3">
                  <div className="flex items-center">
                    <div className="h-6 w-6 rounded-full bg-teal-500 flex items-center justify-center text-xs font-bold mr-2">S</div>
                    <h4 className="font-bold text-md">STEVE JOBS</h4>
                  </div>
                </div>

                <div className="p-4 sm:p-5">
                  <div className="mb-4 border-b border-slate-100 pb-3">
                    <p className="text-xs text-slate-500 mb-1">TO:</p>
                    <p className="text-sm font-medium text-slate-800">Senior Product Manager Position</p>
                    <p className="text-xs text-slate-600">AtApply, Inc.</p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                      As someone who has consistently pushed the boundaries of what's possible in tech, I'm excited 
                      about the opportunity to join AtApply as Senior Product Manager.
                    </p>

                    <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                      My experience launching category-defining products at Apple demonstrates my ability to:
                    </p>

                    <ul className="text-xs text-slate-600 mb-3 pl-4 list-disc">
                      <li>Transform complex technical capabilities into intuitive user experiences</li>
                      <li>Lead cross-functional teams to deliver exceptional products</li>
                      <li>Identify unmet market needs and develop innovative solutions</li>
                    </ul>

                    <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                      AtApply's mission to revolutionize the job search process aligns perfectly with my passion for 
                      creating technology that meaningfully impacts people's lives.
                    </p>

                    <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                      I'd welcome the opportunity to discuss how my product vision could contribute to AtApply's future growth.
                    </p>

                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <p className="text-slate-800 font-medium text-xs">Steve Jobs</p>
                      <p className="text-xs text-slate-500">steve@apple.com • 555-123-4567</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-0 -mb-6 text-center">
              <button className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${colors.button} text-white`}>
                Create cover letter
              </button>
            </div>
          </div>

          {/* Resume Column */}
          <div className="flex flex-col">
            <h3 className="text-xl md:text-2xl font-bold text-slate-800 mb-6">Job-specific resume</h3>
            
            {/* First Resume - Professional Style */}
            <div className="relative flex-grow max-w-md mx-auto transform document-container scale-65 origin-top sm:scale-60">
              {/* Paper shadow effect */}
              <div className="absolute inset-0 bg-slate-200 rounded-lg transform -rotate-1 -translate-x-1 translate-y-1"></div>

              {/* Main document - wider */}
              <div className="relative bg-white rounded-lg shadow-md overflow-hidden border border-slate-200 transform transition-transform duration-300 hover:scale-[1.08] min-h-[500px] sm:min-h-[500px] w-full"
                style={{ transformOrigin: "center top" }}>
                {/* Resume header */}
                <div className="bg-teal-900 text-white p-4">
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2">
                    <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white flex-shrink-0 bg-white">
                      <img
                        src="/api/placeholder/200/200"
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="text-center sm:text-left">
                      <h4 className="text-lg font-bold tracking-wide">STEVE JOBS</h4>
                      <div className="h-0.5 w-12 bg-teal-400 my-1 mx-auto sm:mx-0"></div>
                      <p className="text-xs text-teal-100">VISIONARY ENTREPRENEUR & INNOVATOR</p>
                      <p className="text-xs text-teal-200 mt-1 max-w-xs">
                        Redefining industries through pioneering design and strategy
                      </p>
                    </div>
                  </div>
                </div>

                {/* Contact information */}
                <div className="bg-teal-800 text-white px-6 py-2 flex justify-between items-center text-xs">
                  <div className="flex space-x-4">
                    <span>steve@apple.com</span>
                    <span>(555) 123-4567</span>
                  </div>
                  <div>
                    <span>Los Altos, CA</span>
                  </div>
                </div>

                {/* Resume content */}
                <div className="p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Left column */}
                    <div className="sm:col-span-2">
                      {/* Experience section */}
                      <div className="mb-3">
                        <h5 className="text-xs font-bold text-teal-800 mb-2 uppercase border-b border-teal-200 pb-1 flex items-center">
                          <span className="w-1.5 h-1.5 bg-teal-500 mr-1"></span>Experience
                        </h5>
                        
                        <div className="mb-2">
                          <div className="flex justify-between items-center">
                            <p className="font-bold text-slate-800 text-xs">Co-Founder & CEO, Apple</p>
                            <p className="text-xs font-medium bg-teal-50 px-1 rounded text-teal-700">1976-Present</p>
                          </div>
                          <ul className="list-disc pl-4 text-slate-600 text-xs">
                            <li>Led development of Macintosh, iPod, iPhone, and iPad</li>
                            <li>Transformed Apple into one of the world's most valuable companies</li>
                          </ul>
                        </div>

                        <div>
                          <div className="flex justify-between items-center">
                            <p className="font-bold text-slate-800 text-xs">Founder & CEO, NeXT / Chairman, Pixar</p>
                            <p className="text-xs font-medium bg-teal-50 px-1 rounded text-teal-700">1985-2006</p>
                          </div>
                          <ul className="list-disc pl-4 text-slate-600 text-xs">
                            <li>Developed NeXTSTEP, later foundation for macOS</li>
                            <li>Led Pixar to create groundbreaking animated films</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Right column */}
                    <div className="space-y-3">
                      {/* Education section */}
                      <div>
                        <h5 className="text-xs font-bold text-teal-800 mb-1 uppercase border-b border-teal-200 pb-1 flex items-center">
                          <span className="w-1.5 h-1.5 bg-teal-500 mr-1"></span>Education
                        </h5>
                        <p className="font-bold text-slate-800 text-xs">Reed College (1972-1974)</p>
                      </div>

                      {/* Skills section */}
                      <div>
                        <h5 className="text-xs font-bold text-teal-800 mb-1 uppercase border-b border-teal-200 pb-1 flex items-center">
                          <span className="w-1.5 h-1.5 bg-teal-500 mr-1"></span>Skills
                        </h5>
                        <div className="flex flex-wrap gap-1">
                          <span className="bg-teal-50 px-1 py-0.5 rounded text-xs text-teal-700">Product Design</span>
                          <span className="bg-teal-50 px-1 py-0.5 rounded text-xs text-teal-700">Innovation</span>
                          <span className="bg-teal-50 px-1 py-0.5 rounded text-xs text-teal-700">Leadership</span>
                          <span className="bg-teal-50 px-1 py-0.5 rounded text-xs text-teal-700">UX Design</span>
                          <span className="bg-teal-50 px-1 py-0.5 rounded text-xs text-teal-700">Vision</span>
                        </div>
                      </div>

                      {/* Awards section */}
                      <div>
                        <h5 className="text-xs font-bold text-teal-800 mb-1 uppercase border-b border-teal-200 pb-1 flex items-center">
                          <span className="w-1.5 h-1.5 bg-teal-500 mr-1"></span>Awards
                        </h5>
                        <ul className="text-xs text-slate-600">
                          <li>
                            <span className="font-bold">National Medal of Technology, 1985</span>
                          </li>
                          <li>
                            <span className="font-bold">Academy Award, 2001</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Second Resume - Minimal Style */}
            <div className="relative flex-grow max-w-md mx-auto transform document-container scale-65 origin-top sm:scale-60 mt-16 sm:mt-0">
              {/* Paper shadow effect */}
              <div className="absolute inset-0 bg-slate-200 rounded-lg transform -rotate-1 -translate-x-1 translate-y-1"></div>

              {/* Main document - wider */}
              <div className="relative bg-white rounded-lg shadow-md overflow-hidden border border-slate-200 transform transition-transform duration-300 hover:scale-[1.08] min-h-[500px] sm:min-h-[500px] w-full"
                style={{ transformOrigin: "center top" }}>
                {/* Minimal header */}
                <div className="border-l-4 border-slate-800 pl-3 py-4 mx-4 mt-4">
                  <h4 className="text-xl font-bold text-slate-800">Steve Jobs</h4>
                  <p className="text-xs text-slate-500">Technology Innovator & Business Leader</p>
                  <div className="flex gap-3 text-xs text-slate-600 mt-1">
                    <span>steve@apple.com</span>
                    <span>•</span>
                    <span>(555) 123-4567</span>
                    <span>•</span>
                    <span>Los Altos, CA</span>
                  </div>
                </div>

                {/* Resume content - minimal style */}
                <div className="p-4">
                  {/* Experience */}
                  <div className="mb-4">
                    <h5 className="text-sm font-bold text-slate-800 mb-2 uppercase">Experience</h5>
                    
                    <div className="mb-3">
                      <div className="flex justify-between mb-1">
                        <p className="font-bold text-slate-800 text-xs">Apple Inc.</p>
                        <p className="text-xs text-slate-600">1976-Present</p>
                      </div>
                      <p className="text-xs italic text-slate-600 mb-1">Co-Founder & Chief Executive Officer</p>
                      <ul className="list-disc pl-4 text-slate-600 text-xs">
                        <li>Directed the development of groundbreaking products including the Macintosh, iPod, iPhone, and iPad</li>
                        <li>Led company growth from startup to Fortune 500 enterprise valued over $2 trillion</li>
                      </ul>
                    </div>
                    
                    <div className="mb-3">
                      <div className="flex justify-between mb-1">
                        <p className="font-bold text-slate-800 text-xs">NeXT Inc.</p>
                        <p className="text-xs text-slate-600">1985-1997</p>
                      </div>
                      <p className="text-xs italic text-slate-600 mb-1">Founder & Chief Executive Officer</p>
                      <ul className="list-disc pl-4 text-slate-600 text-xs">
                        <li>Created advanced computing platforms for education and business markets</li>
                        <li>Developed innovative operating system that later became foundation for modern macOS</li>
                      </ul>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <p className="font-bold text-slate-800 text-xs">Pixar Animation Studios</p>
                        <p className="text-xs text-slate-600">1986-2006</p>
                      </div>
                      <p className="text-xs italic text-slate-600 mb-1">Chairman & Chief Executive Officer</p>
                      <ul className="list-disc pl-4 text-slate-600 text-xs">
                        <li>Transformed computer graphics division into award-winning animation studio</li>
                        <li>Negotiated partnership with Disney leading to blockbuster successes</li>
                      </ul>
                    </div>
                  </div>
                  
                  {/* Bottom section: Skills and Education */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h5 className="text-sm font-bold text-slate-800 mb-2 uppercase">Education</h5>
                      <p className="text-xs font-medium text-slate-800">Reed College</p>
                      <p className="text-xs text-slate-600">Attended 1972-1974</p>
                      <p className="text-xs text-slate-600">Portland, Oregon</p>
                    </div>
                    
                    <div>
                      <h5 className="text-sm font-bold text-slate-800 mb-2 uppercase">Skills</h5>
                      <div className="flex flex-wrap gap-1">
                        <span className="bg-slate-100 px-1 py-0.5 rounded text-xs text-slate-700">Innovation</span>
                        <span className="bg-slate-100 px-1 py-0.5 rounded text-xs text-slate-700">Leadership</span>
                        <span className="bg-slate-100 px-1 py-0.5 rounded text-xs text-slate-700">Product Design</span>
                        <span className="bg-slate-100 px-1 py-0.5 rounded text-xs text-slate-700">Brand Building</span>
                        <span className="bg-slate-100 px-1 py-0.5 rounded text-xs text-slate-700">Public Speaking</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-0 -mb-6 text-center">
              <button className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${colors.button} text-white`}>
                Create resume
              </button>
            </div>
          </div>

          {/* Follow-up Email Column */}
          <div className="flex flex-col">
            <h3 className="text-xl md:text-2xl font-bold text-slate-800 mb-6">Job-specific followup email</h3>
            
            {/* First Follow-up Email */}
            <div className="relative flex-grow max-w-md mx-auto transform document-container scale-65 origin-top sm:scale-60">
              {/* Paper shadow effect */}
              <div className="absolute inset-0 bg-slate-200 rounded-lg transform rotate-1 translate-x-1 translate-y-1"></div>

              {/* Main document - wider */}
              <div className="relative bg-slate-100 rounded-lg shadow-md overflow-hidden border border-slate-300 transform transition-transform duration-300 hover:scale-[1.08] min-h-[500px] sm:min-h-[500px] w-full"
                style={{ transformOrigin: "center top" }}>
                {/* Email client header */}
                <div className="bg-slate-800 text-white px-4 py-2 flex justify-between items-center">
                  <div className="flex items-center space-x-4">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <div className="text-xs">Jobs - Mail</div>
                  <div className="text-xs">🔍</div>
                </div>

                {/* Email toolbar */}
                <div className="bg-slate-200 border-b border-slate-300 px-4 py-2 flex space-x-2 text-xs">
                  <span className="px-2 py-1 bg-slate-300 rounded-md text-slate-700">↩ Reply</span>
                  <span className="px-2 py-1 bg-slate-300 rounded-md text-slate-700">↪ Forward</span>
                  <span className="px-2 py-1 bg-slate-300 rounded-md text-slate-700">🗑 Delete</span>
                </div>

                {/* Email header with realistic metadata */}
                <div className="bg-white border-b border-slate-200 p-4">
                  <div className="flex items-start mb-4">
                    <div className="w-8 h-8 rounded-full bg-teal-700 text-white flex items-center justify-center text-xs font-bold mr-3">
                      SJ
                    </div>
                    <div className="flex-grow">
                      <div className="flex justify-between">
                        <p className="font-medium text-slate-800">Steve Jobs</p>
                        <p className="text-xs text-slate-500">Apr 7, 2025, 10:32 AM</p>
                      </div>
                      <p className="text-xs text-slate-500">From: steve@apple.com</p>
                      <p className="text-xs text-slate-500">To: hr@atapply.co</p>
                    </div>
                  </div>
                  <p className="font-medium text-slate-800">Steve Jobs: Checking in on AtApply Application</p>
                </div>

                {/* Email body with more realistic styling */}
                <div className="bg-white p-4 text-xs text-slate-700 space-y-2">
                  <p>Hi John,</p>

                  <p>
                    Hope you're doing well. Just following up on my application—I wanted to check if
                    there's an opportunity to chat about the role at AtApply.
                  </p>

                  <p>
                    I've spent my career building products that change how people live. AtApply has similar potential 
                    to redefine career navigation, and I'd love to help shape that future.
                  </p>
                  
                  <ul className="list-disc pl-4 space-y-0.5 text-xs">
                    <li>30+ years of product innovation leadership</li>
                    <li>Expertise in revolutionary user experiences</li>
                    <li>Vision for transforming industries</li>
                  </ul>

                  <p>Let me know if there's a good time to connect next week.</p>

                  <div className="pt-2 border-t border-slate-100 mt-2">
                    <p className="text-teal-700 font-medium">Steve Jobs</p>
                    <p className="text-xs text-slate-500">CEO, Apple Inc. | steve@apple.com | (555) 123-4567</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Second Follow-up Email - Modern Style */}
            <div className="relative flex-grow max-w-md mx-auto transform document-container scale-65 origin-top sm:scale-60 mt-16 sm:mt-0">
              {/* Paper shadow effect */}
              <div className="absolute inset-0 bg-slate-200 rounded-lg transform rotate-1 translate-x-1 translate-y-1"></div>

              {/* Main document - wider */}
              <div className="relative bg-white rounded-lg shadow-md overflow-hidden border border-slate-300 transform transition-transform duration-300 hover:scale-[1.08] min-h-[500px] sm:min-h-[500px] w-full"
                style={{ transformOrigin: "center top" }}>
                {/* Modern email client interface */}
                <div className="bg-teal-600 text-white px-4 py-3 flex items-center">
                  <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center mr-2">
                    <span className="text-teal-600 font-bold text-xs">S</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Follow-up: Senior PM Position</p>
                    <p className="text-xs text-teal-100">Sent to: HR Team @ AtApply</p>
                  </div>
                </div>

                {/* Modern email content */}
                <div className="p-5 bg-white">
                  <div className="border-l-3 border-teal-500 pl-3 py-1 mb-4">
                    <p className="text-sm text-slate-800 font-medium">Thank you for considering my application</p>
                  </div>
                  
                  <div className="space-y-3 text-xs text-slate-700">
                    <p>Hello AtApply Team,</p>
                    
                    <p>
                      I wanted to express my continued interest in the Senior Product Manager position. After our initial 
                      application process, I'm more convinced than ever that my experience aligns perfectly with what you're seeking.
                    </p>
                    
                    <p>
                      Having led product teams at Apple through multiple transformative launches, I understand the challenges 
                      of creating intuitive solutions that solve complex problems. The AtApply platform represents exactly the kind of 
                      innovative approach I'm passionate about.
                    </p>
                    
                    <p><strong>A few relevant achievements:</strong></p>
                    
                    <div className="bg-slate-50 p-2 rounded">
                      <div className="flex items-center mb-2">
                        <div className="w-3 h-3 rounded-full bg-teal-500 mr-2"></div>
                        <p className="font-medium">Led 3 major product launches with 75M+ users each</p>
                      </div>
                      <div className="flex items-center mb-2">
                        <div className="w-3 h-3 rounded-full bg-teal-500 mr-2"></div>
                        <p className="font-medium">Drove 250% revenue growth in core product line</p>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-teal-500 mr-2"></div>
                        <p className="font-medium">Pioneered UX innovations now industry standard</p>
                      </div>
                    </div>
                    
                    <p>
                      I'm available to discuss further any day next week. Would a 30-minute conversation be possible?
                    </p>
                    
                    <p>Thank you for your consideration.</p>
                    
                    <p>Best regards,</p>
                  </div>
                  
                  <div className="border-t border-slate-100 mt-4 pt-2 flex items-center">
                    <div className="w-8 h-8 bg-slate-800 rounded-full mr-2 flex items-center justify-center text-white text-xs font-bold">SJ</div>
                    <div>
                      <p className="text-xs font-medium text-slate-800">Steve Jobs</p>
                      <p className="text-xs text-slate-500">Apple Inc. | 555-123-4567</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-0 -mb-6 text-center">
              <button className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${colors.button} text-white`}>
                Create followup email
              </button>
            </div>
          </div>
        </div>

        {/* CTA section */}
        <div className="mt-12 text-center">
          <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white p-8 md:p-12 rounded-2xl max-w-4xl mx-auto">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">Ready to create standout job application documents?</h3>
            <p className="text-lg mb-6 text-teal-50">
              Join thousands of job seekers who've landed interviews with our AI-powered document builder
            </p>
            <button className="px-6 py-3 bg-white text-teal-700 rounded-lg font-medium hover:bg-teal-50 transition-colors">
              Get started for free
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default DocumentExamples