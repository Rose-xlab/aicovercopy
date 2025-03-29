// app/api/resumes/parser/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import openai from '@/lib/openai';
import * as XLSX from 'xlsx';
import * as mammoth from 'mammoth';

// Define interfaces for our resume data structure
interface ContactInfo {
  email: string;
  phone: string;
  location: string;
  linkedIn?: string;
  website?: string;
}

interface PersonalInfo {
  firstName: string;
  lastName: string;
  title: string;
  summary: string;
  contact: ContactInfo;
}

interface WorkExperience {
  id: string;
  company: string;
  position: string;
  location?: string;
  startDate: string;
  endDate: string | null;
  isOngoing: boolean;
  description?: string;
  achievements: string[];
}

interface Education {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy?: string;
  startDate: string;
  endDate: string | null;
  isOngoing: boolean;
  description?: string;
  achievements?: string[];
}

interface Skill {
  id: string;
  name: string;
  level?: string;
  category?: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  url?: string;
  startDate?: string;
  endDate?: string;
  achievements?: string[];
}

interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: string;
  expiryDate?: string;
  url?: string;
}

interface Language {
  id: string;
  name: string;
  proficiency: string;
}

interface ResumeData {
  title?: string;
  personalInfo?: PersonalInfo;
  workExperience?: WorkExperience[];
  education?: Education[];
  skills?: Skill[];
  projects?: Project[];
  certifications?: Certification[];
  languages?: Language[];
  sourceFileName?: string;
  sourceFileType?: string;
  importedAt?: string;
}

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get user session
    const { data: { session } } = await supabase.auth.getSession();

    // Allow access without authentication, but track session if available
    const userId = session?.user?.id || null;

    // Get form data (uploaded file)
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }
    
    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 });
    }
    
    // Check file type
    const fileType = file.type;
    const buffer = await file.arrayBuffer();
    const fileName = file.name;
    
    // Log the file information - useful for debugging
    console.log(`Parsing resume file: ${fileName}, type: ${fileType}, size: ${file.size} bytes`);
    
    // Extract text content based on file type
    let textContent = '';
    let fileStructure = null;
    
    if (fileType === 'application/pdf') {
      // For PDF files, we would use a PDF parsing library in a real implementation
      // Since PDFs require more complex handling, we'll use AI to extract structured content
      textContent = "This is a placeholder for PDF content extraction. In production, this would use a PDF parsing library.";
      
      // In a real implementation, use pdf.js or a PDF parsing library
      // const pdf = await PDFLib.load(buffer);
      // textContent = await pdf.getText();
    } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      // For DOCX files, use mammoth
      try {
        // Create a blob from the buffer for mammoth
        const blob = new Blob([new Uint8Array(buffer)]);
        // Convert blob to array buffer again to ensure correct format
        const arrayBuffer = await blob.arrayBuffer();
        
        const result = await mammoth.extractRawText({ arrayBuffer });
        textContent = result.value;
        
        console.log(`Successfully extracted ${textContent.length} characters from DOCX file`);
      } catch (error) {
        console.error('Mammoth extraction error:', error);
        return NextResponse.json(
          { error: 'Failed to parse DOCX file. Please try another file format.' },
          { status: 400 }
        );
      }
    } else if (fileType.includes('spreadsheet') || fileType.includes('excel')) {
      // For Excel files, use SheetJS
      const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' });
      
      // Get first sheet
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Convert to JSON
      fileStructure = XLSX.utils.sheet_to_json(worksheet);
      
      // Also get text representation
      textContent = XLSX.utils.sheet_to_csv(worksheet);
      
      console.log(`Successfully extracted data from Excel file with ${fileStructure.length} rows`);
    } else if (fileType === 'text/plain') {
      // For plain text files
      const decoder = new TextDecoder('utf-8');
      textContent = decoder.decode(buffer);
      
      console.log(`Successfully extracted ${textContent.length} characters from text file`);
    } else {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload a PDF, DOCX, XLSX, or TXT file' },
        { status: 400 }
      );
    }
    
    // Use OpenAI to parse and extract structured resume data
    const parsedResume = await parseResumeWithAI(textContent, fileStructure, fileName);
    
    // Add import metadata
    parsedResume.sourceFileName = fileName;
    parsedResume.sourceFileType = fileType;
    parsedResume.importedAt = new Date().toISOString();
    
    // If user is authenticated, save this extraction to their history
    if (userId) {
      try {
        await supabase.from('resume_extractions').insert({
          user_id: userId,
          filename: file.name,
          file_type: fileType,
          extracted_data: parsedResume,
          created_at: new Date().toISOString()
        });
        
        console.log(`Saved extraction history for user ${userId}`);
      } catch (error: unknown) {
        console.error('Error saving extraction history:', error);
        // Non-critical error, continue
      }
    }
    
    return NextResponse.json(parsedResume);
  } catch (error: any) {
    console.error('Error parsing resume:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to parse resume' },
      { status: 500 }
    );
  }
}

/**
 * Parse resume text using OpenAI to extract structured information
 */
async function parseResumeWithAI(
  textContent: string, 
  fileStructure: any = null,
  fileName: string = 'resume'
): Promise<ResumeData> {
  try {
    // Prepare the system prompt
    const systemPrompt = `
      You are an expert resume parser. Your task is to extract structured information from a resume.
      Parse the provided resume text and return a JSON object with the following structure:
      
      {
        "personalInfo": {
          "firstName": "string",
          "lastName": "string",
          "title": "string",
          "summary": "string",
          "contact": {
            "email": "string",
            "phone": "string",
            "location": "string",
            "linkedIn": "string (optional)",
            "website": "string (optional)"
          }
        },
        "workExperience": [
          {
            "id": "unique-id",
            "company": "string",
            "position": "string",
            "location": "string (optional)",
            "startDate": "string (YYYY-MM format)",
            "endDate": "string (YYYY-MM format, or null if current)",
            "isOngoing": "boolean",
            "description": "string (optional)",
            "achievements": ["string"]
          }
        ],
        "education": [
          {
            "id": "unique-id",
            "institution": "string",
            "degree": "string",
            "fieldOfStudy": "string (optional)",
            "startDate": "string (YYYY-MM format)",
            "endDate": "string (YYYY-MM format, or null if current)",
            "isOngoing": "boolean",
            "description": "string (optional)",
            "achievements": ["string (optional)"]
          }
        ],
        "skills": [
          {
            "id": "unique-id",
            "name": "string",
            "level": "string (Beginner|Intermediate|Advanced|Expert) (optional)",
            "category": "string (optional)"
          }
        ],
        "projects": [
          {
            "id": "unique-id",
            "name": "string",
            "description": "string",
            "technologies": ["string"],
            "url": "string (optional)",
            "startDate": "string (optional)",
            "endDate": "string (optional)",
            "achievements": ["string (optional)"]
          }
        ],
        "certifications": [
          {
            "id": "unique-id",
            "name": "string",
            "issuer": "string",
            "date": "string (YYYY-MM format)",
            "expiryDate": "string (optional)",
            "url": "string (optional)"
          }
        ],
        "languages": [
          {
            "id": "unique-id",
            "name": "string",
            "proficiency": "string (Basic|Conversational|Fluent|Native)"
          }
        ]
      }
      
      Make sure to:
      1. Assign a unique ID to each item in arrays (can be a random string)
      2. Extract dates in YYYY-MM format when possible
      3. Split skills into categories when possible
      4. Extract achievements as bullet points
      5. Make reasonable inferences when information is ambiguous
      6. Skip sections that don't exist in the resume
      7. Always respond in proper JSON format
    `;

    // Create input content, combining text and structure if available
    let userPrompt = `Resume Content:\n\n${textContent}`;
    
    if (fileStructure) {
      userPrompt += `\n\nFile Structure (in JSON format):\n${JSON.stringify(fileStructure, null, 2)}`;
    }
    
    userPrompt += `\n\nOriginal File Name: ${fileName}`;

    // Call OpenAI to parse the resume
    const completion = await openai.chat.completions.create({
      model: "gpt-4", // Using GPT-4 for better extraction accuracy
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.3, // Lower temperature for more consistent extraction
      response_format: { type: "json_object" }
    });

    // Parse the JSON response
    const responseContent = completion.choices[0].message.content || '{}';
    let parsedData: ResumeData = {};
    try {
      parsedData = JSON.parse(responseContent) as ResumeData;
    } catch (jsonError) {
      console.error('Error parsing JSON response from OpenAI:', jsonError);
      console.log('Raw response:', responseContent);
      // Attempt to extract JSON from the response if it contains markdown or other formatting
      const jsonMatch = responseContent.match(/```json\n([\s\S]*?)\n```/) || 
                         responseContent.match(/```\n([\s\S]*?)\n```/) ||
                         responseContent.match(/{[\s\S]*}/);
      
      if (jsonMatch) {
        try {
          parsedData = JSON.parse(jsonMatch[1] || jsonMatch[0]) as ResumeData;
        } catch (fallbackError) {
          console.error('Failed to extract JSON with fallback method:', fallbackError);
          throw new Error('Could not parse resume into structured data');
        }
      } else {
        throw new Error('Response from AI was not in valid JSON format');
      }
    }
    
    // Generate a title for the resume based on the extracted data
    const firstName = parsedData.personalInfo?.firstName || '';
    const lastName = parsedData.personalInfo?.lastName || '';
    const jobTitle = parsedData.personalInfo?.title || '';
    
    // Create a meaningful title for the resume
    if (firstName && lastName) {
      parsedData.title = `${firstName} ${lastName}${jobTitle ? ` - ${jobTitle}` : ''} Resume`;
    } else {
      // Extract name from the file name if personal info not available
      const fileBaseName = fileName.split('.')[0] || 'Imported';
      parsedData.title = `${fileBaseName} Resume`;
    }
    
    return parsedData;
  } catch (error) {
    console.error('Error parsing resume with AI:', error);
    throw new Error('Failed to parse resume content');
  }
}