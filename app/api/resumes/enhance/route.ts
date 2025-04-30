// app/api/resumes/enhance/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import OpenAI from 'openai';
import resumeAIService from '@/lib/resume-ai-service';
import { 
  ResumeData, 
  PersonalInformation, 
  WorkExperience, 
  ResumeGenerationParams,
  mapResumeToDatabase,
  mapDatabaseToResumeData,
  DatabaseResumeData
} from '@/types/resume';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get user session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get the request body
    const { 
      resumeId, 
      enhanceType, 
      experienceId, 
      personalInfo, 
      workExperience,
      params,
      internshipId,
      internship,
      referenceId,
      reference,
      currentStatement,
      interests, // Changed from hobbies to interests
      useStructured,
      sectionId,
      section
    } = await request.json();
    
    // Handle different types of enhancements
    switch (enhanceType) {
      // ... (All other cases remain the same - omitted for brevity)
      
      case 'interests': { // Changed from 'hobbies' to 'interests' to match DB schema
        // Enhance interests section (hobbies in the UI)
        if (!interests || !Array.isArray(interests) || interests.length === 0) {
          return NextResponse.json(
            { error: 'Interests array is required and must not be empty' },
            { status: 400 }
          );
        }
        
        // Use GPT to enhance the interests
        const systemPrompt = `
          You are an expert resume writer specializing in crafting impactful hobbies and interests sections.
          Your task is to enhance the provided list of interests to be more relevant and professional.
          The interests should highlight transferable skills and positive personality traits.
          
          Return a JSON array of enhanced interests. If the input is structured objects with descriptions,
          maintain that structure but improve the content. If the input is simple strings, return improved strings.
        `;

        const userPrompt = `
          Current Interests:
          ${JSON.stringify(interests, null, 2)}
          
          Please enhance these interests to be more relevant and professional for a resume.
          ${useStructured ? 'Maintain the structured format with descriptions.' : 'Return simple string entries.'}
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

        let enhancedInterests;
        try {
          const responseObj = JSON.parse(completion.choices[0].message.content || '{}');
          enhancedInterests = responseObj.interests || responseObj;
          
          // Ensure IDs are preserved for structured interests
          if (useStructured) {
            enhancedInterests = enhancedInterests.map((interest: any, index: number) => ({
              ...interest,
              id: index < interests.length ? (interests[index] as any).id : crypto.randomUUID()
            }));
          }
        } catch (error) {
          console.error('Error parsing AI response:', error);
          return NextResponse.json(
            { error: 'Failed to parse AI response' },
            { status: 500 }
          );
        }
        
        // If resumeId is provided, update the resume
        if (resumeId) {
          // Check if the resume exists and belongs to the user
          const { data: resume, error: fetchError } = await supabase
            .from('resumes')
            .select('*')
            .eq('id', resumeId)
            .eq('user_id', session.user.id)
            .single();
          
          if (fetchError || !resume) {
            return NextResponse.json(
              { error: 'Resume not found or you do not have access' },
              { status: 404 }
            );
          }
          
          // Update the interests in the resume
          await supabase
            .from('resumes')
            .update({
              interests: enhancedInterests, // Changed from hobbies to interests
              updated_at: new Date().toISOString()
            })
            .eq('id', resumeId);
        }
        
        return NextResponse.json({ interests: enhancedInterests }); // Changed from hobbies to interests
      }

      // ... (All other cases remain the same - included for completeness)
      case 'summary': {
        // Generate a professional summary
        if (!personalInfo || !workExperience) {
          return NextResponse.json(
            { error: 'Personal information and work experience are required for summary generation' },
            { status: 400 }
          );
        }
        
        const summary = await resumeAIService.generateSummary(
          personalInfo as PersonalInformation, 
          Array.isArray(workExperience) ? workExperience : [workExperience],
          params as ResumeGenerationParams
        );
        
        // If resumeId is provided, update the resume
        if (resumeId) {
          // Check if the resume exists and belongs to the user
          const { data: resume, error: fetchError } = await supabase
            .from('resumes')
            .select('*')
            .eq('id', resumeId)
            .eq('user_id', session.user.id)
            .single();
          
          if (fetchError || !resume) {
            return NextResponse.json(
              { error: 'Resume not found or you do not have access' },
              { status: 404 }
            );
          }
          
          // Update the resume summary - use proper snake_case for database
          const personal_info = resume.personal_info;
          personal_info.summary = summary;
          
          await supabase
            .from('resumes')
            .update({
              personal_info: personal_info,
              updated_at: new Date().toISOString()
            })
            .eq('id', resumeId);
        }
        
        return NextResponse.json({ summary });
      }
      
      case 'experience': {
        // Enhance work experience
        if (!experienceId || !workExperience) {
          return NextResponse.json(
            { error: 'Experience ID and work experience data are required' },
            { status: 400 }
          );
        }
        
        const enhancedExperience = await resumeAIService.enhanceWorkExperience(
          workExperience as WorkExperience,
          params as ResumeGenerationParams
        );
        
        // If resumeId is provided, update the resume
        if (resumeId) {
          // Check if the resume exists and belongs to the user
          const { data: resume, error: fetchError } = await supabase
            .from('resumes')
            .select('*')
            .eq('id', resumeId)
            .eq('user_id', session.user.id)
            .single();
          
          if (fetchError || !resume) {
            return NextResponse.json(
              { error: 'Resume not found or you do not have access' },
              { status: 404 }
            );
          }
          
          // Update the specific work experience - use snake_case for database
          const work_experience = resume.work_experience;
          const index = work_experience.findIndex((exp: any) => exp.id === experienceId);
          
          if (index !== -1) {
            work_experience[index] = enhancedExperience;
            
            await supabase
              .from('resumes')
              .update({
                work_experience: work_experience,
                updated_at: new Date().toISOString()
              })
              .eq('id', resumeId);
          }
        }
        
        return NextResponse.json({ experience: enhancedExperience });
      }
      
      case 'skills': {
        // Suggest skills based on profile
        if (!personalInfo || !workExperience) {
          return NextResponse.json(
            { error: 'Personal information and work experience are required for skills suggestion' },
            { status: 400 }
          );
        }
        
        const targetPosition = params?.targetPosition || '';
        
        const suggestedSkills = await resumeAIService.suggestSkills(
          personalInfo as PersonalInformation,
          Array.isArray(workExperience) ? workExperience : [workExperience],
          targetPosition
        );
        
        return NextResponse.json({ skills: suggestedSkills });
      }
      
      case 'achievements': {
        // Generate achievements for work experience
        if (!experienceId || !workExperience) {
          return NextResponse.json(
            { error: 'Experience ID and work experience data are required' },
            { status: 400 }
          );
        }
        
        const achievements = await resumeAIService.generateAchievements(
          workExperience as WorkExperience
        );
        
        return NextResponse.json({ achievements });
      }
      
      case 'optimize': {
        // Optimize entire resume
        if (!resumeId) {
          return NextResponse.json(
            { error: 'Resume ID is required for optimization' },
            { status: 400 }
          );
        }
        
        // Check if the resume exists and belongs to the user
        const { data: dbResume, error: fetchError } = await supabase
          .from('resumes')
          .select('*')
          .eq('id', resumeId)
          .eq('user_id', session.user.id)
          .single();
        
        if (fetchError || !dbResume) {
          return NextResponse.json(
            { error: 'Resume not found or you do not have access' },
            { status: 404 }
          );
        }
        
        // Convert database format to application format
        const resumeData = mapDatabaseToResumeData(dbResume as DatabaseResumeData);
        
        // Apply AI optimization
        const optimizedResume = await resumeAIService.optimizeResume(
          resumeData,
          params as ResumeGenerationParams
        );
        
        // Convert back to database format for update
        const dbOptimizedResume = {
          personal_info: optimizedResume.personalInfo,
          work_experience: optimizedResume.workExperience,
          skills: optimizedResume.skills,
          updated_at: new Date().toISOString()
        };
        
        console.log('Updating resume with database format:', dbOptimizedResume);
        
        // Update the resume in the database
        const { data, error } = await supabase
          .from('resumes')
          .update(dbOptimizedResume)
          .eq('id', resumeId)
          .select()
          .single();
        
        if (error) {
          console.error('Error updating resume:', error);
          throw error;
        }
        
        // Convert result back to application format for response
        const result = mapDatabaseToResumeData(data as DatabaseResumeData);
        return NextResponse.json(result);
      }
      
      case 'internship': {
        // Enhance internship description
        if (!internshipId || !internship) {
          return NextResponse.json(
            { error: 'Internship ID and internship data are required' },
            { status: 400 }
          );
        }
        
        // Use GPT to enhance the internship description
        const systemPrompt = `
          You are an expert resume writer specializing in enhancing internship descriptions.
          Your task is to improve the provided internship description by:
          1. Highlighting the skills gained and practical experience
          2. Emphasizing the educational and professional value of the internship
          3. Using action-oriented, professional language
          4. Making it concise but comprehensive
          
          Return just the improved description without explanations.
        `;

        const userPrompt = `
          Internship Information:
          ${JSON.stringify(internship, null, 2)}
          
          Current Description: ${internship.description || 'No description provided'}
          
          Please enhance this internship description to be more impactful for a resume.
        `;

        const completion = await openai.chat.completions.create({
          model: "gpt-4-turbo-preview", // Updated from "gpt-4"
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.7,
        });

        const enhancedDescription = completion.choices[0].message.content?.trim() || '';
        
        // Update the internship with the enhanced description
        const enhancedInternship = {
          ...internship,
          description: enhancedDescription
        };
        
        // If resumeId is provided, update the resume
        if (resumeId) {
          // Check if the resume exists and belongs to the user
          const { data: resume, error: fetchError } = await supabase
            .from('resumes')
            .select('*')
            .eq('id', resumeId)
            .eq('user_id', session.user.id)
            .single();
          
          if (fetchError || !resume) {
            return NextResponse.json(
              { error: 'Resume not found or you do not have access' },
              { status: 404 }
            );
          }
          
          // Update the specific internship
          const internships = resume.internships || [];
          const index = internships.findIndex((intern: any) => intern.id === internshipId);
          
          if (index !== -1) {
            internships[index] = enhancedInternship;
            
            await supabase
              .from('resumes')
              .update({
                internships: internships,
                updated_at: new Date().toISOString()
              })
              .eq('id', resumeId);
          }
        }
        
        return NextResponse.json({ internship: enhancedInternship });
      }

      case 'reference': {
        // Enhance reference information (mostly relationship description)
        if (!referenceId || !reference) {
          return NextResponse.json(
            { error: 'Reference ID and reference data are required' },
            { status: 400 }
          );
        }
        
        // Use GPT to enhance the reference relationship description
        const systemPrompt = `
          You are an expert resume writer. Your task is to improve the description of the reference relationship.
          Make it professional, specific, and highlight the nature of the working relationship.
          Keep it concise but informative.
          
          Return just the improved relationship description without explanations.
        `;

        const userPrompt = `
          Reference Information:
          ${JSON.stringify(reference, null, 2)}
          
          Current Relationship Description: ${reference.relationship || 'No relationship provided'}
          
          Please enhance the relationship description to be more specific and professional.
        `;

        const completion = await openai.chat.completions.create({
          model: "gpt-4-turbo-preview", // Updated from "gpt-4"
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.7,
        });

        const enhancedRelationship = completion.choices[0].message.content?.trim() || '';
        
        // Update the reference with the enhanced relationship
        const enhancedReference = {
          ...reference,
          relationship: enhancedRelationship
        };
        
        // If resumeId is provided, update the resume
        if (resumeId) {
          // Check if the resume exists and belongs to the user
          const { data: resume, error: fetchError } = await supabase
            .from('resumes')
            .select('*')
            .eq('id', resumeId)
            .eq('user_id', session.user.id)
            .single();
          
          if (fetchError || !resume) {
            return NextResponse.json(
              { error: 'Resume not found or you do not have access' },
              { status: 404 }
            );
          }
          
          // Update the specific reference
          const references = resume.references || [];
          const index = references.findIndex((ref: any) => ref.id === referenceId);
          
          if (index !== -1) {
            references[index] = enhancedReference;
            
            await supabase
              .from('resumes')
              .update({
                references: references,
                updated_at: new Date().toISOString()
              })
              .eq('id', resumeId);
          }
        }
        
        return NextResponse.json({ reference: enhancedReference });
      }

      case 'referenceStatement': {
        // Enhance general reference statement
        if (!currentStatement) {
          return NextResponse.json(
            { error: 'Current statement is required' },
            { status: 400 }
          );
        }
        
        // Use GPT to enhance the reference statement
        const systemPrompt = `
          You are an expert resume writer. Your task is to improve the general references statement.
          Make it professional, concise, and appropriate for a resume.
          
          Return just the improved statement without explanations.
        `;

        const userPrompt = `
          Current Reference Statement: "${currentStatement}"
          
          Please enhance this statement to be more professional and effective.
        `;

        const completion = await openai.chat.completions.create({
          model: "gpt-4-turbo-preview", // Updated from "gpt-4"
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.7,
        });

        const enhancedStatement = completion.choices[0].message.content?.trim() || '';
        
        return NextResponse.json({ statement: enhancedStatement });
      }

      case 'customSection': {
        // Enhance custom section content
        if (!sectionId || !section) {
          return NextResponse.json(
            { error: 'Section ID and section data are required' },
            { status: 400 }
          );
        }
        
        // Use GPT to enhance the custom section content, incorporating new fields in the prompt
        const systemPrompt = `
          You are an expert resume writer specializing in enhancing custom content for resumes.
          Your task is to improve the provided section content to be more impactful and professional.
          Maintain the overall structure and purpose but enhance the language and presentation.
          
          Return just the improved content without explanations.
        `;

        // Include new fields in the prompt to provide more context to the AI
        const userPrompt = `
          Section Title: ${section.title}
          ${section.city ? `City: ${section.city}` : ''}
          ${section.startDate ? `Start Date: ${section.startDate}` : ''}
          ${section.endDate ? `End Date: ${section.endDate}` : ''}
          Current Content: ${section.content || 'No content provided'}
          
          Please enhance this content to be more professional and effective for a resume.
          Make it more relevant considering the additional context provided (location and dates, if available).
          Maintain any bullet points or structure in the original content.
        `;

        const completion = await openai.chat.completions.create({
          model: "gpt-4-turbo-preview", // Updated from "gpt-4"
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.7,
        });

        const enhancedContent = completion.choices[0].message.content?.trim() || '';
        
        // Update the section with enhanced content, preserving the new fields
        const enhancedSection = {
          ...section,
          content: enhancedContent
        };
        
        // If resumeId is provided, update the resume
        if (resumeId) {
          // Check if the resume exists and belongs to the user
          const { data: resume, error: fetchError } = await supabase
            .from('resumes')
            .select('*')
            .eq('id', resumeId)
            .eq('user_id', session.user.id)
            .single();
          
          if (fetchError || !resume) {
            return NextResponse.json(
              { error: 'Resume not found or you do not have access' },
              { status: 404 }
            );
          }
          
          // Update the custom sections in the resume
          const customSections = resume.custom_sections || [];
          const index = customSections.findIndex((s: any) => s.id === sectionId);
          
          if (index !== -1) {
            customSections[index] = enhancedSection;
            
            await supabase
              .from('resumes')
              .update({
                custom_sections: customSections,
                updated_at: new Date().toISOString()
              })
              .eq('id', resumeId);
          }
        }
        
        return NextResponse.json({ section: enhancedSection });
      }
      
      default:
        return NextResponse.json(
          { error: 'Invalid enhancement type' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Error enhancing resume:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to enhance resume' },
      { status: 500 }
    );
  }
}