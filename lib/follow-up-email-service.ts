// lib/follow-up-email-service.ts
import openai from '@/lib/openai';

export interface FollowUpEmailParams {
  // Original application details
  jobTitle: string;
  companyName: string;
  applicationDate: string; // ISO string or human-readable date
  contactName?: string; // Hiring manager or recruiter name (if known)
  
  // User details
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string;
  
  // Original cover letter and resume highlights
  originalCoverLetterContent?: string;
  resumeHighlights?: string[]; // Key qualifications or achievements
  
  // Follow-up specifics
  followUpStyle: 'gentle' | 'direct' | 'value-add'; // Style of follow-up
  additionalInfo?: string; // Any updates since applying
  
  // Optional parameters
  tone?: 'formal' | 'conversational' | 'enthusiastic';
  intentToCall?: boolean; // Whether the candidate plans to follow up with a call
}

export interface FollowUpEmailResult {
  subject: string;
  body: string;
  greeting: string;
  signature: string;
  suggestions?: string[]; // Optional suggestions for customization
}

/**
 * Generate a follow-up email based on the provided parameters
 */
export async function generateFollowUpEmail(
  params: FollowUpEmailParams
): Promise<FollowUpEmailResult> {
  try {
    // Create a prompt for the follow-up email generation
    const systemPrompt = `
      You are an expert career coach specializing in professional communication for job seekers.
      Generate a follow-up email for a job application based on the provided details.
      
      The email should:
      1. Be concise and professional (3-4 short paragraphs maximum)
      2. Reference the original application without repeating the entire cover letter
      3. Express continued interest in the position
      4. Briefly highlight 1-2 key qualifications relevant to the role
      5. Include a polite inquiry about the application status
      6. Have a professional closing
      
      Adapt the tone and style based on:
      - How much time has passed since the application
      - The specified follow-up style (gentle, direct, or value-add)
      - The industry context and job type
      
      Return JSON with the following structure:
      {
        "subject": "Follow-up on [Position] Application at [Company]",
        "greeting": "Dear [Name]," or an appropriate greeting,
        "body": "The main content of the email, with paragraphs separated by newlines",
        "signature": "The closing signature line(s)",
        "suggestions": [Array of 2-3 optional customization suggestions]
      }
    `;

    // Prepare application timeline context
    let timeContext = '';
    try {
      const applicationDate = new Date(params.applicationDate);
      const currentDate = new Date();
      const daysSinceApplication = Math.floor((currentDate.getTime() - applicationDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSinceApplication <= 7) {
        timeContext = 'This follow-up is being sent about a week after application, which is relatively soon. The tone should be curious and gentle.';
      } else if (daysSinceApplication <= 14) {
        timeContext = 'This follow-up is being sent about two weeks after application, which is an appropriate time to check in.';
      } else {
        timeContext = `This follow-up is being sent ${daysSinceApplication} days after application, which is a significant time. The applicant may be concerned about their status but should maintain professionalism.`;
      }
    } catch (e) {
      // If date parsing fails, use a generic context
      timeContext = 'The exact application date is unclear, so maintain a balanced professional tone.';
    }

    // Create the user prompt with all details
    const userPrompt = `
      Generate a professional follow-up email for a job application with these details:
      
      Application Details:
      - Position: ${params.jobTitle}
      - Company: ${params.companyName}
      - Applied on: ${params.applicationDate}
      - Addressed to: ${params.contactName || 'Hiring Manager'}
      
      Candidate Information:
      - Name: ${params.candidateName}
      - Email: ${params.candidateEmail}
      ${params.candidatePhone ? `- Phone: ${params.candidatePhone}` : ''}
      
      Application Timeline Context:
      ${timeContext}
      
      Follow-up Style: ${params.followUpStyle === 'gentle' ? 'Gentle reminder - polite and patient approach' : 
                         params.followUpStyle === 'direct' ? 'Direct inquiry - clearly asking about application status' : 
                         'Value-add - providing additional information or ideas'}
                         
      Tone: ${params.tone || 'professional'}
      
      ${params.intentToCall ? 'Include a mention that the candidate plans to follow up with a phone call in the coming days.' : ''}
      
      ${params.originalCoverLetterContent ? `
      Original Cover Letter Excerpt (for reference only - do not repeat verbatim):
      ${params.originalCoverLetterContent.substring(0, 300)}...
      ` : ''}
      
      ${params.resumeHighlights && params.resumeHighlights.length > 0 ? `
      Key Qualifications (select 1-2 most relevant to mention briefly):
      ${params.resumeHighlights.join('\n')}
      ` : ''}
      
      ${params.additionalInfo ? `
      Updates Since Applying:
      ${params.additionalInfo}
      ` : ''}
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const responseContent = completion.choices[0].message.content || '{}';
    const result = JSON.parse(responseContent) as FollowUpEmailResult;
    
    return result;
  } catch (error) {
    console.error('Error generating follow-up email:', error);
    throw new Error('Failed to generate follow-up email');
  }
}

/**
 * Generate a quick follow-up email template with minimal information
 */
export async function generateQuickFollowUp(
  jobTitle: string,
  companyName: string,
  candidateName: string,
  applicationDate?: string
): Promise<FollowUpEmailResult> {
  // Create a simplified parameter object with essential fields
  const params: FollowUpEmailParams = {
    jobTitle,
    companyName,
    candidateName,
    candidateEmail: '', // Will be filled in by the user
    applicationDate: applicationDate || new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // Default to 2 weeks ago
    followUpStyle: 'gentle'
  };
  
  return generateFollowUpEmail(params);
}

// Export the main functions
const followUpEmailService = {
  generateFollowUpEmail,
  generateQuickFollowUp
};

export default followUpEmailService;