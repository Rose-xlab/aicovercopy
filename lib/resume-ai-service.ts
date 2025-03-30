// lib/resume-ai-service.ts
import openai from '@/lib/openai';
import { 
  PersonalInformation, 
  WorkExperience, 
  ResumeGenerationParams, 
  Skill,
  ResumeData
} from '@/types/resume';

export async function generateSummary(
  personalInfo: PersonalInformation,
  workExperience: WorkExperience[],
  params?: ResumeGenerationParams
): Promise<string> {
  try {
    // Create a prompt for the summary generation
    const systemPrompt = `
      You are an expert resume writer with experience in HR and recruitment.
      Generate a professional summary for a resume/CV based on the provided information.
      The summary should be concise (2-4 sentences), highlight key strengths and experience,
      and be tailored to the target position and industry if specified.
      
      Make the summary impactful, using active language and quantifiable achievements.
      Avoid generic statements and focus on what makes this candidate unique.
      
      Return only the summary text, without any explanations or additional formatting.
    `;

    const userPrompt = `
      Personal Information:
      ${JSON.stringify(personalInfo, null, 2)}
      
      Work Experience:
      ${JSON.stringify(workExperience, null, 2)}
      
      ${params ? `Target Position: ${params.targetPosition || 'Not specified'}` : ''}
      ${params ? `Industry: ${params.industry || 'Not specified'}` : ''}
      ${params ? `Experience Level: ${params.experienceLevel || 'Not specified'}` : ''}
      ${params ? `Tone: ${params.tone || 'Professional'}` : 'Tone: Professional'}
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview", // Updated from "gpt-4"
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
    });

    return completion.choices[0].message.content?.trim() || '';
  } catch (error) {
    console.error('Error generating resume summary:', error);
    throw new Error('Failed to generate resume summary');
  }
}

export async function enhanceWorkExperience(
  experience: WorkExperience,
  params?: ResumeGenerationParams
): Promise<WorkExperience> {
  try {
    const systemPrompt = `
      You are an expert resume writer specializing in enhancing work experience descriptions.
      Your task is to improve the provided work experience by:
      1. Ensuring it uses strong action verbs and quantifiable achievements
      2. Highlighting relevant skills and accomplishments
      3. Tailoring it to the target position/industry if specified
      4. Maintaining professional language and correct tense (past tense for completed work, present for current)
      
      Return the enhanced work experience as a JSON object with the same structure as the input,
      but with improved description and achievements.
    `;

    const userPrompt = `
      Work Experience to Enhance:
      ${JSON.stringify(experience, null, 2)}
      
      ${params ? `Target Position: ${params.targetPosition || 'Not specified'}` : ''}
      ${params ? `Industry: ${params.industry || 'Not specified'}` : ''}
      ${params ? `Experience Level: ${params.experienceLevel || 'Not specified'}` : ''}
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview", // Updated from "gpt-4"
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const enhancedExperience = JSON.parse(completion.choices[0].message.content || '{}');
    
    // Ensure we maintain the original ID and other fields that shouldn't change
    return {
      ...experience,
      description: enhancedExperience.description || experience.description,
      achievements: enhancedExperience.achievements || experience.achievements
    };
  } catch (error) {
    console.error('Error enhancing work experience:', error);
    throw new Error('Failed to enhance work experience');
  }
}

export async function suggestSkills(
  personalInfo: PersonalInformation,
  workExperience: WorkExperience[],
  targetPosition?: string
): Promise<Skill[]> {
  try {
    const systemPrompt = `
      You are an expert in resume optimization and skills assessment.
      Based on the provided personal information, work experience, and target position,
      suggest relevant skills that should be included in the resume.
      
      For each skill, include:
      - Name: The name of the skill
      - Level: One of [Beginner, Intermediate, Advanced, Expert]
      - Category: A suitable category for grouping similar skills (e.g., Technical, Soft Skills, Languages)
      
      Focus on both hard and soft skills, and ensure they are relevant to the candidate's
      experience and the target position if specified.
      
      Return a JSON array of skill objects.
    `;

    const userPrompt = `
      Personal Information:
      ${JSON.stringify(personalInfo, null, 2)}
      
      Work Experience:
      ${JSON.stringify(workExperience, null, 2)}
      
      Target Position: ${targetPosition || 'Not specified'}
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview", // Updated from "gpt-4"
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    // Parse the suggested skills from the response
    const response = JSON.parse(completion.choices[0].message.content || '{"skills": []}');
    const suggestedSkills = Array.isArray(response) ? response : (response.skills || []);
    
    // Add unique IDs to skills
    return suggestedSkills.map((skill: Omit<Skill, 'id'>) => ({
      ...skill,
      id: crypto.randomUUID()
    }));
  } catch (error) {
    console.error('Error suggesting skills:', error);
    throw new Error('Failed to suggest skills');
  }
}

export async function generateAchievements(experience: WorkExperience): Promise<string[]> {
  try {
    const systemPrompt = `
      You are an expert resume writer specializing in highlighting achievements.
      Based on the provided work experience, generate 3-5 strong achievement statements
      that demonstrate impact and results.
      
      Each achievement should:
      1. Start with a strong action verb
      2. Include quantifiable results when possible (numbers, percentages, etc.)
      3. Highlight the value added or problems solved
      4. Be concise and specific
      
      Return an array of achievement statements as a JSON array of strings.
    `;

    const userPrompt = `
      Work Experience:
      ${JSON.stringify(experience, null, 2)}
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview", // Updated from "gpt-4"
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    // Parse the achievements from the response
    const response = JSON.parse(completion.choices[0].message.content || '{"achievements": []}');
    return Array.isArray(response) ? response : (response.achievements || []);
  } catch (error) {
    console.error('Error generating achievements:', error);
    throw new Error('Failed to generate achievements');
  }
}

export async function optimizeResume(
  resume: ResumeData,
  params: ResumeGenerationParams
): Promise<ResumeData> {
  try {
    // Start with a deep copy of the resume
    const optimizedResume = JSON.parse(JSON.stringify(resume)) as ResumeData;
    
    // Generate optimized summary
    const summary = await generateSummary(
      optimizedResume.personalInfo,
      optimizedResume.workExperience,
      params
    );
    optimizedResume.personalInfo.summary = summary;
    
    // Enhance each work experience
    const enhancedExperiences = await Promise.all(
      optimizedResume.workExperience.map(exp => enhanceWorkExperience(exp, params))
    );
    optimizedResume.workExperience = enhancedExperiences;
    
    // Suggest additional skills
    const suggestedSkills = await suggestSkills(
      optimizedResume.personalInfo,
      optimizedResume.workExperience,
      params.targetPosition
    );
    
    // Merge suggested skills with existing skills (avoiding duplicates)
    const existingSkillNames = optimizedResume.skills.map(s => s.name.toLowerCase());
    const newSkills = suggestedSkills.filter(
      s => !existingSkillNames.includes(s.name.toLowerCase())
    );
    
    optimizedResume.skills = [...optimizedResume.skills, ...newSkills];
    
    // Update the timestamps - UPDATED to use snake_case
    optimizedResume.updated_at = new Date().toISOString();
    
    return optimizedResume;
  } catch (error) {
    console.error('Error optimizing resume:', error);
    throw new Error('Failed to optimize resume');
  }
}

export async function generateBasicResume(
  personalInfo: PersonalInformation, 
  targetPosition?: string,
  industry?: string
): Promise<ResumeData> {
  try {
    const systemPrompt = `
      You are an expert resume writer. A user has provided their basic personal information
      and needs a complete resume generated. Create a resume with:
      
      1. A professional summary
      2. 2-3 work experiences with job descriptions and achievements
      3. 1-2 education entries
      4. 8-12 relevant skills
      
      Make everything realistic and professional. If the target position and industry are specified,
      tailor the content accordingly. The generated data should be applicable for a real-world resume.
      
      Return the complete resume as a JSON object with the following structure:
      {
        "personalInfo": {...}, // Include the given personal info with an added professional summary
        "workExperience": [...], // Array of work experiences with descriptions and achievements
        "education": [...], // Array of education entries
        "skills": [...], // Array of skills with name, level, and category
        "projects": [...], // Optional: 1-2 relevant projects
        "languages": [...], // Optional: Any languages if mentioned in personal info
        "certifications": [...] // Optional: Any relevant certifications
      }
    `;

    const userPrompt = `
      Personal Information:
      ${JSON.stringify(personalInfo, null, 2)}
      
      Target Position: ${targetPosition || 'Not specified'}
      Industry: ${industry || 'Not specified'}
      
      I need a complete professional resume generated based on this information.
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview", // Updated from "gpt-4"
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const generatedData = JSON.parse(completion.choices[0].message.content || '{}');
    
    // Create a complete resume data structure
    const resumeData: ResumeData = {
      id: crypto.randomUUID(),
      userId: '', // Will be set by the API
      title: `${personalInfo.firstName}'s Resume - ${targetPosition || 'Professional'}`,
      personalInfo: {
        ...personalInfo,
        summary: generatedData.personalInfo?.summary || ''
      },
      workExperience: (generatedData.workExperience || []).map((exp: any) => ({
        id: crypto.randomUUID(),
        ...exp
      })),
      education: (generatedData.education || []).map((edu: any) => ({
        id: crypto.randomUUID(),
        ...edu
      })),
      skills: (generatedData.skills || []).map((skill: any) => ({
        id: crypto.randomUUID(),
        ...skill
      })),
      projects: (generatedData.projects || []).map((project: any) => ({
        id: crypto.randomUUID(),
        ...project
      })),
      languages: (generatedData.languages || []).map((lang: any) => ({
        id: crypto.randomUUID(),
        ...lang
      })),
      certifications: (generatedData.certifications || []).map((cert: any) => ({
        id: crypto.randomUUID(),
        ...cert
      })),
      interests: generatedData.interests || [],
      references: generatedData.references || '',
      templateId: '', // Will be set by the API
      isPublic: false,
      created_at: new Date().toISOString(), // Updated from createdAt
      updated_at: new Date().toISOString()  // Updated from updatedAt
    };
    
    return resumeData;
  } catch (error) {
    console.error('Error generating basic resume:', error);
    throw new Error('Failed to generate basic resume');
  }
}

// Export all functions as a service
const resumeAIService = {
  generateSummary,
  enhanceWorkExperience,
  suggestSkills,
  generateAchievements,
  optimizeResume,
  generateBasicResume
};

export default resumeAIService;