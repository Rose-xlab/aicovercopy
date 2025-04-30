// app/api/resumes/parser/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import openai from '@/lib/openai';
import * as XLSX from 'xlsx';
import * as mammoth from 'mammoth';
import axios from 'axios';
import FormData from 'form-data';
// Note: You'll need to install this package with: npm install pdf-parse
// Dynamically import pdf-parse only when needed
import pdfParse from 'pdf-parse';

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

// New interfaces for additional sections
interface Reference {
  id: string;
  name: string;
  company: string;
  position: string;
  relationship: string;
  email: string;
  phone?: string;
  includeInResume: boolean;
}

interface Internship {
  id: string;
  company: string;
  position: string;
  location?: string;
  startDate: string;
  endDate?: string;
  isOngoing: boolean;
  description?: string;
  achievements: string[];
}

interface Hobby {
  id: string;
  name: string;
  description?: string;
}

interface CustomContent {
  id: string;
  title: string;
  content: string;
  city: string;
  startDate: string;
  endDate: string;
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
  // New sections
  references?: Reference[];
  internships?: Internship[];
  interests?: Hobby[] | string[]; // Changed from hobbies to interests
  customSections?: CustomContent[];
  // Metadata
  referenceStatement?: string;
  sourceFileName?: string;
  sourceFileType?: string;
  importedAt?: string;
  sourceCV?: string; // Reference to source CV
  source?: string; // Source type (cv_upload, manual, etc.)
}

/**
 * Helper function to convert Buffer to ArrayBuffer
 */
function bufferToArrayBuffer(buffer: Buffer): ArrayBuffer {
  const arrayBuffer = new ArrayBuffer(buffer.length);
  const view = new Uint8Array(arrayBuffer);
  for (let i = 0; i < buffer.length; ++i) {
    view[i] = buffer[i];
  }
  return arrayBuffer;
}

/**
 * Ensures the parsed resume data has consistent field naming to be compatible
 * with both database storage (snake_case) and UI components (camelCase)
 */
function ensureCorrectFieldNames(parsedData: any) {
  // Create a deep copy to avoid modifying the original
  const formattedData = JSON.parse(JSON.stringify(parsedData));
  
  // Ensure both camelCase and snake_case versions of fields exist
  if (formattedData.personalInfo) {
    formattedData.personal_info = formattedData.personalInfo;
  } else if (formattedData.personal_info) {
    formattedData.personalInfo = formattedData.personal_info;
  }
  
  if (formattedData.workExperience) {
    formattedData.work_experience = formattedData.workExperience;
  } else if (formattedData.work_experience) {
    formattedData.workExperience = formattedData.work_experience;
  }
  
  if (formattedData.customSections) {
    formattedData.custom_sections = formattedData.customSections;
  } else if (formattedData.custom_sections) {
    formattedData.customSections = formattedData.custom_sections;
  }
  
  // Handle other fields that might need the same treatment
  const fieldMappings = [
    { camel: 'referenceText', snake: 'reference_text' },
    { camel: 'templateId', snake: 'template_id' },
    { camel: 'isPublic', snake: 'is_public' },
    { camel: 'createdAt', snake: 'created_at' },
    { camel: 'updatedAt', snake: 'updated_at' },
    { camel: 'sourceCV', snake: 'source_cv' },
  ];
  
  fieldMappings.forEach(mapping => {
    if (formattedData[mapping.camel] && !formattedData[mapping.snake]) {
      formattedData[mapping.snake] = formattedData[mapping.camel];
    } else if (formattedData[mapping.snake] && !formattedData[mapping.camel]) {
      formattedData[mapping.camel] = formattedData[mapping.snake];
    }
  });
  
  return formattedData;
}

/**
 * Converts DOCX files to PDF using Adobe PDF Services API
 * @param buffer The DOCX file buffer
 * @returns Buffer containing the converted PDF
 */
async function convertDocxToPdf(buffer: ArrayBuffer): Promise<Buffer> {
  try {
    console.log('Starting DOCX to PDF conversion with Adobe PDF Services API');
    
    // Convert file data to base64 for JSON request
    const base64Data = Buffer.from(buffer).toString('base64');
    
    // Create the request body for the CPF API
    const requestBody = {
      "ops": [
        {
          "input": "documentIn",
          "ops": [
            {
              "type": "export",
              "input": "documentIn",
              "params": {
                "outputType": "pdf"
              }
            }
          ]
        }
      ],
      "input": [
        {
          "storage": "embedded",
          "data": base64Data,
          "name": "documentIn"
        }
      ]
    };
    
    // Call Adobe PDF Services API (CPF API) for conversion
    const response = await axios.post(
      'https://cpf-ue1.adobe.io/ops/:create?respondWith=%7B%22reltype%22%3A%20%22http%3A%2F%2Fns.adobe.com%2Frel%2Fprimary%22%7D',
      requestBody,
      {
        headers: {
          'x-api-key': process.env.ADOBE_PDF_SERVICES_API_KEY || 'bead7e65ea7045328704daeae9279fda',
          'Authorization': `Bearer ${process.env.ADOBE_PDF_SERVICES_JWT_TOKEN || ''}`,
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer'
      }
    );

    console.log('Adobe PDF Services API response received:', response.status);
    return Buffer.from(response.data);
  } catch (error) {
    console.error('DOCX to PDF conversion error:', error);
    
    // Enhanced error reporting
    if (axios.isAxiosError(error)) {
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Headers:', JSON.stringify(error.response.headers));
        
        // Try to get readable error message
        if (error.response.data) {
          if (Buffer.isBuffer(error.response.data)) {
            try {
              const errorText = Buffer.from(error.response.data).toString('utf8');
              console.error('Error data:', errorText.substring(0, 500));
            } catch (e) {
              console.error('Error data is binary and could not be parsed');
            }
          } else {
            console.error('Error data:', error.response.data);
          }
        }
      } else if (error.request) {
        console.error('No response received from request:', error.request);
      } else {
        console.error('Error message:', error.message);
      }
    }
    
    throw new Error('Failed to convert DOCX to PDF');
  }
}

/**
 * Extracts text content from documents using Azure Form Recognizer
 * @param buffer Document buffer (PDF or image)
 * @param contentType MIME type of the document
 * @returns Extracted text content
 */
async function extractTextWithAzure(buffer: ArrayBuffer, contentType: string): Promise<string> {
  try {
    // Azure Form Recognizer Document Analysis API - FIX: Remove trailing slash before concatenation
    const endpoint = (process.env.AZURE_FORM_RECOGNIZER_ENDPOINT || '').replace(/\/$/, '');
    const apiKey = process.env.AZURE_FORM_RECOGNIZER_KEY || '';
    const apiVersion = '2023-07-31'; // Update with the latest version
    
    console.log(`Attempting Azure extraction with endpoint: ${endpoint}`);
    
    // Step 1: Submit the document for analysis - FIXED URL STRUCTURE
    const analyzeResponse = await axios.post(
      `${endpoint}/formrecognizer/documentModels/prebuilt-document:analyze?api-version=${apiVersion}`,
      buffer,
      {
        headers: {
          'Content-Type': contentType,
          'Ocp-Apim-Subscription-Key': apiKey
        }
      }
    );
    
    // Get the operation ID from the response headers
    const operationLocation = analyzeResponse.headers['operation-location'];
    if (!operationLocation) {
      throw new Error('No operation location returned from Azure');
    }
    
    console.log(`Azure operation location: ${operationLocation}`);
    
    // Step 2: Poll until the analysis is complete
    let result;
    let status = '';
    let retries = 0;
    const maxRetries = 30; // Maximum polling attempts
    
    while (status !== 'succeeded' && retries < maxRetries) {
      // Wait between polling attempts
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check the status of the operation
      const statusResponse = await axios.get(operationLocation, {
        headers: {
          'Ocp-Apim-Subscription-Key': apiKey
        }
      });
      
      result = statusResponse.data;
      status = result.status;
      retries++;
      
      console.log(`Azure polling attempt ${retries}: ${status}`);
    }
    
    if (status !== 'succeeded') {
      throw new Error('Document analysis timed out or failed');
    }
    
    // Step 3: Extract the text content from the analysis results
    let extractedText = '';
    
    // Process the content based on Azure's response structure
    if (result && result.analyzeResult && result.analyzeResult.pages) {
      // Extract text from each page
      for (const page of result.analyzeResult.pages) {
        if (page.lines) {
          for (const line of page.lines) {
            extractedText += line.content + ' ';
          }
          extractedText += '\n';
        }
      }
    }
    
    // Alternatively, use the content from paragraphs if available
    if (result && result.analyzeResult && result.analyzeResult.paragraphs) {
      for (const paragraph of result.analyzeResult.paragraphs) {
        extractedText += paragraph.content + '\n';
      }
    }
    
    console.log(`Successfully extracted ${extractedText.length} characters with Azure`);
    return extractedText;
  } catch (error) {
    console.error('Azure Form Recognizer extraction error:', error);
    throw new Error('Failed to extract text using Azure Form Recognizer');
  }
}

/**
 * Fallback method to try basic extraction when cloud services fail
 */
async function extractTextWithFallback(buffer: ArrayBuffer, fileType: string): Promise<string> {
  try {
    if (fileType === 'application/pdf') {
      // Use pdf-parse for PDF extraction (simpler and more reliable)
      try {
        // Dynamically import pdf-parse
        const pdfParse = (await import('pdf-parse')).default;
        const data = await pdfParse(Buffer.from(buffer));
        return data.text;
      } catch (pdfError) {
        console.error('PDF parse extraction failed:', pdfError);
        throw new Error('PDF extraction failed');
      }
    } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      // Try mammoth - IMPORTANT: Pass the buffer correctly
      try {
        // Create valid options object for mammoth
        const options = {
          buffer: Buffer.from(buffer)  // Convert ArrayBuffer to Buffer
        };
        
        console.log('Extracting text with Mammoth using buffer option');
        const result = await mammoth.extractRawText(options);
        return result.value;
      } catch (mammothError) {
        console.error('Mammoth extraction error:', mammothError);
        
        // Try alternative method with arrayBuffer
        try {
          console.log('Trying alternative Mammoth extraction with arrayBuffer option');
          const result = await mammoth.extractRawText({ arrayBuffer: buffer });
          return result.value;
        } catch (altError) {
          console.error('Alternative Mammoth extraction failed:', altError);
          throw new Error('All DOCX extraction methods failed');
        }
      }
    } else if (fileType === 'text/plain') {
      // Plain text
      const decoder = new TextDecoder('utf-8');
      return decoder.decode(buffer);
    } else {
      throw new Error(`Unsupported file type for fallback extraction: ${fileType}`);
    }
  } catch (error) {
    console.error('Fallback extraction error:', error);
    throw new Error('Failed to extract text with fallback method');
  }
}

export async function POST(request: Request) {
  // Generate a request ID for tracing
  const requestId = `req_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
  console.log(`[${requestId}] Resume parsing request started`);
  
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get user session
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id || null;

    // Get form data (uploaded file)
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const sourceType = formData.get('sourceType') as string || null;
    const cvId = formData.get('cvId') as string || null;
    
    console.log(`[${requestId}] Processing request with sourceType: ${sourceType}, cvId: ${cvId}`);
    
    if (!file) {
      console.log(`[${requestId}] Error: No file uploaded`);
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }
    
    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      console.log(`[${requestId}] Error: File too large (${file.size} bytes)`);
      return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 });
    }
    
    // Check file type
    const fileType = file.type;
    const buffer = await file.arrayBuffer();
    const fileName = file.name;
    
    // Log the file information
    console.log(`[${requestId}] Processing file: ${fileName}, type: ${fileType}, size: ${file.size} bytes`);
    
    // Extract text content based on file type
    let textContent = '';
    let fileStructure = null;
    let actualFileType = fileType; // Track the actual file type after potential conversion
    
    if (fileType === 'application/pdf') {
      try {
        console.log(`[${requestId}] Processing PDF file`);
        // Use Azure Form Recognizer for PDF text extraction
        textContent = await extractTextWithAzure(buffer, fileType);
        console.log(`[${requestId}] Successfully extracted ${textContent.length} characters from PDF`);
      } catch (pdfError) {
        console.error(`[${requestId}] PDF extraction error with Azure:`, pdfError);
        
        // Try fallback extraction
        try {
          console.log(`[${requestId}] Attempting fallback PDF extraction`);
          textContent = await extractTextWithFallback(buffer, fileType);
          console.log(`[${requestId}] Fallback extraction successful: ${textContent.length} chars`);
        } catch (fallbackError) {
          console.error(`[${requestId}] All PDF extraction methods failed`);
          return NextResponse.json({
            error: 'We could not extract content from this PDF file. It may be corrupted or password-protected.',
            requestId,
            suggestions: ['Try a different PDF file', 'Make sure your PDF is not encrypted']
          }, { status: 400 });
        }
      }
    } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      try {
        console.log(`[${requestId}] Processing DOCX file with optimized approach`);
        
        // First try direct extraction with mammoth
        try {
          console.log(`[${requestId}] Attempting direct DOCX extraction with mammoth`);
          textContent = await extractTextWithFallback(buffer, fileType);
          console.log(`[${requestId}] Mammoth extraction successful: ${textContent.length} chars`);
        } catch (mammothError) {
          console.error(`[${requestId}] Direct DOCX extraction failed:`, mammothError);
          
          // If direct extraction fails, try conversion through Adobe
          console.log(`[${requestId}] Converting DOCX to PDF before processing`);
          try {
            // Convert DOCX to PDF using Adobe PDF Services API with improved method
            const pdfBuffer = await convertDocxToPdf(buffer);
            
            // Now process the PDF with Azure Form Recognizer
            const pdfArrayBuffer = bufferToArrayBuffer(pdfBuffer);
            textContent = await extractTextWithAzure(pdfArrayBuffer, 'application/pdf');
            
            console.log(`[${requestId}] Successfully converted DOCX to PDF and extracted ${textContent.length} characters`);
            
            // Update the file type to PDF since we've converted it
            actualFileType = 'application/pdf';
          } catch (convertError) {
            console.error(`[${requestId}] DOCX to PDF conversion failed:`, convertError);
            throw new Error('All DOCX processing methods failed');
          }
        }
      } catch (allErrors) {
        console.error(`[${requestId}] All DOCX processing methods failed`);
        return NextResponse.json({
          error: 'Import Failed',
          message: 'Failed to parse DOCX file. Please try saving it as PDF and upload again.',
          requestId
        }, { status: 400 });
      }
    } else if (fileType.includes('spreadsheet') || fileType.includes('excel')) {
      // Keep your existing Excel handling
      const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' });
      
      // Get first sheet
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Convert to JSON
      fileStructure = XLSX.utils.sheet_to_json(worksheet);
      
      // Also get text representation
      textContent = XLSX.utils.sheet_to_csv(worksheet);
      
      console.log(`[${requestId}] Successfully extracted data from Excel file with ${fileStructure.length} rows`);
    } else if (fileType === 'text/plain') {
      // For plain text files
      const decoder = new TextDecoder('utf-8');
      textContent = decoder.decode(buffer);
      
      console.log(`[${requestId}] Successfully extracted ${textContent.length} characters from text file`);
    } else if (fileType.includes('image/')) {
      // For image-based resumes (JPG, PNG, etc.)
      try {
        console.log(`[${requestId}] Processing image-based resume`);
        // Use Azure Form Recognizer for OCR
        textContent = await extractTextWithAzure(buffer, fileType);
        console.log(`[${requestId}] Successfully extracted ${textContent.length} characters from image`);
      } catch (imageError) {
        console.error(`[${requestId}] Image OCR error:`, imageError);
        return NextResponse.json({
          error: 'We could not extract text from this image. Please try uploading a PDF version.',
          requestId
        }, { status: 400 });
      }
    } else {
      console.error(`[${requestId}] Unsupported file type: ${fileType}`);
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload a PDF, DOCX, XLSX, TXT, or image file' },
        { status: 400 }
      );
    }
    
    // Check if we have enough content to process
    if (!textContent || textContent.trim().length < 30) {
      console.error(`[${requestId}] Error: Insufficient content extracted (${textContent.length} chars)`);
      return NextResponse.json({
        error: 'We could not extract enough content from your file. Please try a different file.',
        requestId
      }, { status: 400 });
    }
    
    // Use OpenAI to parse and extract structured resume data with enhanced prompting
    console.log(`[${requestId}] Starting AI parsing of extracted content (${textContent.length} chars)`);
    const parsedResume = await parseResumeWithAI(textContent, fileStructure, fileName, requestId);
    
    // Add import metadata
    parsedResume.sourceFileName = fileName;
    parsedResume.sourceFileType = actualFileType; // Use the actual file type (may be different after conversion)
    parsedResume.importedAt = new Date().toISOString();
    
    // Set source information for CV integration
    if (sourceType) {
      parsedResume.source = sourceType;
    }
    
    // Handle CV integration
    if (userId) {
      try {
        // If this upload came from CVManager or we have a provided CV ID, link them
        if (cvId) {
          console.log(`[${requestId}] Linking resume to CV ${cvId}`);
          parsedResume.sourceCV = cvId;
        }
        // If this is a direct resume import (not from CV), check if we should create a CV record for it
        else if (!cvId && (fileType === 'application/pdf' || actualFileType === 'application/pdf')) {
          console.log(`[${requestId}] Creating CV record for directly imported resume`);
          
          try {
            // If we already have the file in storage (handle Supabase implementation here)
            // For now, just note that we'd create a CV record if this were a real implementation
            console.log(`[${requestId}] Would create CV record for this resume in a real implementation`);
            
            // In a real implementation, you would:
            // 1. Create a CV record in the database
            // 2. Set parsedResume.sourceCV to the new CV record ID
          } catch (cvError) {
            console.error(`[${requestId}] Error creating CV record:`, cvError);
            // Non-critical error, continue with resume parsing
          }
        }
      } catch (integrationError) {
        console.error(`[${requestId}] Error in CV integration:`, integrationError);
        // Non-critical error, continue with resume parsing
      }
    }
    
    // Ensure consistent field naming
    const formattedResume = ensureCorrectFieldNames(parsedResume);
    
    console.log(`[${requestId}] Resume parsing completed successfully`);
    
    // If user is authenticated, save this extraction to their history
    if (userId) {
      try {
        await supabase.from('resume_extractions').insert({
          user_id: userId,
          filename: file.name,
          file_type: actualFileType,
          extracted_data: formattedResume,
          created_at: new Date().toISOString(),
          source_type: sourceType || 'manual',
          source_cv: cvId || null
        });
        
        console.log(`[${requestId}] Saved extraction history for user ${userId}`);
      } catch (historyError) {
        console.error(`[${requestId}] Error saving extraction history:`, historyError);
        // Non-critical error, continue
      }
    }
    
    return NextResponse.json(formattedResume);
  } catch (error: any) {
    console.error(`[${requestId}] Unhandled error in resume parsing:`, error);
    return NextResponse.json(
      { 
        error: 'An unexpected error occurred while processing your resume.',
        requestId,
        suggestions: [
          'Try uploading the file again',
          'Use a different file format if possible',
          'Contact support if the problem persists'
        ]
      },
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
  fileName: string = 'resume',
  requestId: string = 'unknown'
): Promise<ResumeData> {
  try {
    // Enhanced system prompt with more guidance
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
        ],
        "internships": [
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
        "references": [
          {
            "id": "unique-id",
            "name": "string",
            "company": "string",
            "position": "string",
            "relationship": "string",
            "email": "string",
            "phone": "string (optional)",
            "includeInResume": true
          }
        ],
        "interests": [
          {
            "id": "unique-id",
            "name": "string",
            "description": "string (optional)"
          }
        ],
        "customSections": [
          {
            "id": "unique-id",
            "title": "string",
            "content": "string",
            "city": "string (optional)",
            "startDate": "string (optional)",
            "endDate": "string (optional)"
          }
        ],
        "referenceStatement": "string (e.g., 'References available upon request')"
      }
      
      IMPORTANT GUIDELINES:
      1. Assign a unique ID to each item in arrays (can be a random string)
      2. Extract dates in YYYY-MM format when possible, supporting various input formats (MM/YYYY, Month YYYY, etc.)
      3. Categorize skills into technical skills, soft skills, and other relevant categories
      4. Extract achievements as bullet points, preserving their specific accomplishments
      5. Leave fields blank rather than guessing when information is unclear
      6. Skip sections that don't exist in the resume
      7. Always respond in proper JSON format
      8. If the resume has a reference section, extract references properly; otherwise, set a generic reference statement
      9. Create custom sections for any information that doesn't fit into the standard categories
      10. For the interests section, extract hobbies, interests, and activities
      11. For emails, look for patterns like name@domain.com
      12. For phone numbers, look for patterns like XXX-XXX-XXXX, (XXX) XXX-XXXX, etc.
      13. Prioritize recent experience over older entries if text is truncated
      14. For OCR processed documents, be aware there might be formatting errors or misread text
    `;

    // Create input content, combining text and structure if available
    let userPrompt = `Resume Content:\n\n${textContent}`;
    
    if (fileStructure) {
      userPrompt += `\n\nFile Structure (in JSON format):\n${JSON.stringify(fileStructure, null, 2)}`;
    }
    
    userPrompt += `\n\nOriginal File Name: ${fileName}`;

    console.log(`[${requestId}] Sending ${textContent.length} chars to OpenAI for parsing`);
    
    // Call OpenAI to parse the resume
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview", // Updated from "gpt-4" to support JSON response format
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.3, // Lower temperature for more consistent extraction
      response_format: { type: "json_object" }
    });

    // Parse the JSON response
    const responseContent = completion.choices[0].message.content || '{}';
    console.log('the response content', responseContent)
    let parsedData: ResumeData = {};
    try {
      parsedData = JSON.parse(responseContent) as ResumeData;
      console.log(`[${requestId}] Successfully parsed resume data from AI response`);
    } catch (jsonError) {
      console.error(`[${requestId}] Error parsing JSON response from OpenAI:`, jsonError);
      console.log(`[${requestId}] Raw response:`, responseContent.substring(0, 500) + '...');
      
      // Attempt to extract JSON from the response if it contains markdown or other formatting
      const jsonMatch = responseContent.match(/```json\n([\s\S]*?)\n```/) || 
                         responseContent.match(/```\n([\s\S]*?)\n```/) ||
                         responseContent.match(/{[\s\S]*}/);
      
      if (jsonMatch) {
        try {
          parsedData = JSON.parse(jsonMatch[1] || jsonMatch[0]) as ResumeData;
          console.log(`[${requestId}] Successfully extracted JSON with fallback method`);
        } catch (fallbackError) {
          console.error(`[${requestId}] Failed to extract JSON with fallback method:`, fallbackError);
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
    
    // Apply defaults for new sections if they're missing
    if (!parsedData.references) {
      parsedData.references = [];
      parsedData.referenceStatement = "References available upon request";
    }
    
    if (!parsedData.internships) {
      parsedData.internships = [];
    }
    
    if (!parsedData.interests) {
      parsedData.interests = [];
    }
    
    if (!parsedData.customSections) {
      parsedData.customSections = [];
    }

    // Ensure all items in arrays have valid UUIDs
    if (parsedData.workExperience) {
      parsedData.workExperience = parsedData.workExperience.map((item: any) => ({
        ...item,
        id: item.id || crypto.randomUUID()
      }));
    }

    if (parsedData.education) {
      parsedData.education = parsedData.education.map((item: any) => ({
        ...item,
        id: item.id || crypto.randomUUID()
      }));
    }

    if (parsedData.skills) {
      parsedData.skills = parsedData.skills.map((item: any) => ({
        ...item,
        id: item.id || crypto.randomUUID()
      }));
    }

    if (parsedData.projects) {
      parsedData.projects = parsedData.projects.map((item: any) => ({
        ...item,
        id: item.id || crypto.randomUUID()
      }));
    }

    if (parsedData.certifications) {
      parsedData.certifications = parsedData.certifications.map((item: any) => ({
        ...item,
        id: item.id || crypto.randomUUID()
      }));
    }

    if (parsedData.languages) {
      parsedData.languages = parsedData.languages.map((item: any) => ({
        ...item,
        id: item.id || crypto.randomUUID()
      }));
    }

    if (parsedData.references) {
      parsedData.references = parsedData.references.map((item: any) => ({
        ...item,
        id: item.id || crypto.randomUUID()
      }));
    }

    if (parsedData.internships) {
      parsedData.internships = parsedData.internships.map((item: any) => ({
        ...item,
        id: item.id || crypto.randomUUID()
      }));
    }

    if (parsedData.interests && Array.isArray(parsedData.interests)) {
      // Handle interests which might be string array or object array
      parsedData.interests = parsedData.interests.map((item: any) => {
        if (typeof item === 'object') {
          return {
            ...item,
            id: item.id || crypto.randomUUID()
          };
        }
        return item; // If it's a string, leave it as is
      });
    }

    if (parsedData.customSections) {
      parsedData.customSections = parsedData.customSections.map((item: any) => ({
        ...item,
        id: item.id || crypto.randomUUID()
      }));
    }
    
    // Handle the case where hobbies might be present instead of interests (for backward compatibility)
    if ((parsedData as any).hobbies && !parsedData.interests) {
      parsedData.interests = (parsedData as any).hobbies;
      delete (parsedData as any).hobbies;
    }
    
    console.log(`[${requestId}] Resume data processing complete`);
    return parsedData;
  } catch (error) {
    console.error(`[${requestId}] Error parsing resume with AI:`, error);
    throw new Error('Failed to parse resume content');
  }
}