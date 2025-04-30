import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import openai from '@/lib/openai';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get user session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' }, 
        { status: 401 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    console.log("Request body:", body);
    
    const { 
      resumeId, 
      jobTitle, 
      jobDescription, 
      interviewType, 
      difficulty,
      questionCount = 5
    } = body;
    
    // Validate required fields
    if (!resumeId) {
      return NextResponse.json(
        { error: 'Resume ID is required' }, 
        { status: 400 }
      );
    }
    
    if (!jobTitle && !jobDescription) {
      return NextResponse.json(
        { error: 'Either job title or job description is required' }, 
        { status: 400 }
      );
    }
    
    // Fetch the resume
    const { data: resume, error: resumeError } = await supabase
      .from('resumes')
      .select('*')
      .eq('id', resumeId)
      .single();
    
    if (resumeError) {
      console.error('Error fetching resume:', resumeError);
      return NextResponse.json(
        { error: 'Failed to fetch resume: ' + resumeError.message }, 
        { status: 500 }
      );
    }
    
    // Check if the resume belongs to the user
    if (resume.user_id !== session.user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to use this resume' }, 
        { status: 403 }
      );
    }
    
    console.log("Resume data retrieved successfully");
    
    // Build the prompt for OpenAI
    const systemPrompt = `
      You are an expert AI interview coach. Your task is to generate realistic interview questions 
      and suggested answers based on the candidate's resume and the job they're applying for.
      
      The questions should be tailored to the candidate's background and should be relevant to the job.
      The suggested answers should be based on the information in the candidate's resume and should
      highlight their strengths and experiences.
      
      For each question, provide:
      1. A well-formulated interview question
      2. A suggested answer that draws from the candidate's resume
      3. A category (Technical, Behavioral, Experience-Based, Background, etc.)
      4. A difficulty level (Basic, Intermediate, Advanced)
      
      Generate ${questionCount} questions based on the interview type (${interviewType}) 
      and the specified difficulty level (${difficulty}).
      
      Return a JSON array where each question is an object with these properties:
      - id: a unique identifier
      - question: the interview question
      - suggestedAnswer: a detailed answer based on the resume
      - category: the question category
      - difficulty: the question difficulty level
    `;
    
    const userPrompt = `
      ## Job Information
      
      Job Title: ${jobTitle}
      
      ${jobDescription ? `Job Description: ${jobDescription}` : ''}
      
      ## Candidate's Resume
      
      Personal Information:
      ${JSON.stringify(resume.personal_info, null, 2)}
      
      Work Experience:
      ${JSON.stringify(resume.work_experience, null, 2)}
      
      Education:
      ${JSON.stringify(resume.education, null, 2)}
      
      Skills:
      ${JSON.stringify(resume.skills, null, 2)}
      
      ${resume.projects ? `Projects: ${JSON.stringify(resume.projects, null, 2)}` : ''}
      
      ${resume.certifications ? `Certifications: ${JSON.stringify(resume.certifications, null, 2)}` : ''}
      
      ## Instructions
      
      - Interview Type: ${interviewType} (Technical, Behavioral, or Mixed)
      - Difficulty Level: ${difficulty} (Basic, Intermediate, or Advanced)
      - Number of Questions: ${questionCount}
      
      Please generate ${questionCount} realistic interview questions with suggested answers tailored to this candidate and job.
      Make sure to use the candidate's real experiences from their resume when suggesting answers.
    `;
    
    console.log("Sending request to OpenAI");
    
    // Make the API call to OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Changed from gpt-4-turbo-preview to a more reliable model
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });
    
    console.log("OpenAI response received");
    
    if (!completion.choices || completion.choices.length === 0) {
      console.error("No choices returned from OpenAI");
      return NextResponse.json(
        { error: 'No response from AI service' },
        { status: 500 }
      );
    }
    
    // Get the content from the response
    const content = completion.choices[0].message.content;
    
    console.log("Raw content from OpenAI:", content?.substring(0, 200) + "...");
    
    if (!content) {
      console.error("Empty content from OpenAI");
      return NextResponse.json(
        { error: 'Empty response from AI service' },
        { status: 500 }
      );
    }
    
    // Parse the response
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(content);
      console.log("Successfully parsed OpenAI response");
    } catch (parseError) {
      console.error("JSON parsing error:", parseError);
      
      // For debugging - log some of the content that failed to parse
      if (content) {
        console.error("Content snippet that failed to parse:", content.substring(0, 500));
      }
      
      return NextResponse.json(
        { error: 'Failed to parse AI response: ' + parseError.message },
        { status: 500 }
      );
    }
    
    // Ensure we have questions array
    const questions = parsedResponse.questions || [];
    
    if (!Array.isArray(questions)) {
      console.error("Questions is not an array:", questions);
      return NextResponse.json(
        { error: 'Invalid response format: questions is not an array' },
        { status: 500 }
      );
    }
    
    console.log(`Generated ${questions.length} interview questions`);
    
    // Ensure each question has an ID
    questions.forEach((question: any) => {
      if (!question.id) {
        question.id = uuidv4();
      }
    });
    
    // If no questions were generated despite a successful API call, provide fallback questions
    if (questions.length === 0) {
      console.warn("No questions generated, providing fallback questions");
      
      // Create fallback questions based on resume
      const fallbackQuestions = [
        {
          id: uuidv4(),
          question: `Can you tell me about your experience ${resume.work_experience && resume.work_experience.length > 0 ? 
            `at ${resume.work_experience[0].company || 'your previous role'}?` : 
            'in your previous roles?'}`,
          suggestedAnswer: "Based on your resume, you should highlight your key achievements and responsibilities in this role. Focus on projects that demonstrate skills relevant to this new position.",
          category: "Experience-Based",
          difficulty: "Basic"
        },
        {
          id: uuidv4(),
          question: `What made you interested in applying for this ${jobTitle} position?`,
          suggestedAnswer: "Explain how your skills and career goals align with this role. Mention specific aspects of the job description that match your experience and interests.",
          category: "Behavioral",
          difficulty: "Basic"
        },
        {
          id: uuidv4(),
          question: `Describe a technical challenge you've faced and how you overcame it.`,
          suggestedAnswer: "Select a relevant challenge from your experience that demonstrates problem-solving skills and technical expertise. Explain your approach, solution, and the outcome.",
          category: "Technical",
          difficulty: "Intermediate"
        }
      ];
      
      // Return the fallback questions
      return NextResponse.json({
        questions: fallbackQuestions,
        resumeTitle: resume.title,
        jobTitle
      });
    }
    
    // Return the generated questions
    return NextResponse.json({
      questions,
      resumeTitle: resume.title,
      jobTitle
    });
  } catch (error: any) {
    console.error('Error generating interview questions:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to generate interview questions',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}