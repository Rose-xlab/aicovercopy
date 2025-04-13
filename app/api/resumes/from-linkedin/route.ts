// app/api/resumes/from-linkedin/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { v4 as uuidv4 } from 'uuid';
import openai from '@/lib/openai';

/**
 * Enhances LinkedIn data for better resume generation using AI
 * @param profileData The raw LinkedIn profile data
 * @returns Enhanced profile data with improved descriptions and achievements
 */
async function enhanceProfileWithAI(profileData: any) {
  try {
    // Only enhance if we have an OpenAI API key available
    if (!process.env.OPENAI_API_KEY) {
      console.log("No OpenAI API key, skipping profile enhancement");
      return profileData;
    }
    
    // Create a prompt for enhancing work experience and summary
    const prompt = `
    I have a LinkedIn profile that I'd like to enhance for a professional resume. Please help me improve the content by:
    
    1. Enhancing the professional summary to be more impactful and focused on achievements
    2. Improving each work experience description to highlight accomplishments and measurable results
    3. For each work experience, extract 3-5 specific accomplishments as bullet points
    4. Make sure all text is in professional, concise language appropriate for a resume
    
    Here's my LinkedIn data:
    ${JSON.stringify(profileData, null, 2)}
    
    Please return a JSON object in exactly the same format, but with enhanced content.
    `;
    
    // Call OpenAI API to enhance the profile
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "You are a professional resume writer and career coach specializing in transforming LinkedIn profiles into high-impact resumes. Your goal is to enhance profile content for resume use."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });
    
    const enhancedProfileData = JSON.parse(completion.choices[0].message.content || '{}');
    
    // Merge any enhanced content with the original data, preserving all original fields
    const mergedProfile = { ...profileData };
    
    // Update summary if enhanced
    if (enhancedProfileData.summary) {
      mergedProfile.summary = enhancedProfileData.summary;
    }
    
    // Update work experiences if enhanced
    if (enhancedProfileData.experience_json && Array.isArray(enhancedProfileData.experience_json)) {
      // Create a map of original experiences by id for easy lookup
      const originalExperiencesMap = new Map();
      if (profileData.experience_json) {
        profileData.experience_json.forEach((exp: any) => {
          if (exp.id) originalExperiencesMap.set(exp.id, exp);
        });
      }
      
      // Merge enhanced experiences with original data
      mergedProfile.experience_json = enhancedProfileData.experience_json.map((enhancedExp: any) => {
        const originalExp = enhancedExp.id ? originalExperiencesMap.get(enhancedExp.id) : null;
        
        // If we found a matching original experience, merge them
        if (originalExp) {
          return {
            ...originalExp,
            description: enhancedExp.description || originalExp.description,
            achievements: enhancedExp.achievements || originalExp.achievements
          };
        }
        
        // If no match found, use the enhanced one
        return enhancedExp;
      });
    }
    
    return mergedProfile;
  } catch (error) {
    console.error("Error enhancing profile with AI:", error);
    // Return original profile data if enhancement fails
    return profileData;
  }
}

/**
 * Get the default template ID to use for a new resume
 */
async function getDefaultTemplateId(supabase: any): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('resume_templates')
      .select('id')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (error) {
      console.error("Error fetching default template:", error);
      return null;
    }
    
    // Return the first template ID or null if none found
    return data && data.length > 0 ? data[0].id : null;
  } catch (error) {
    console.error("Error getting default template ID:", error);
    return null;
  }
}

/**
 * Generate achievement statements for work experiences that don't have any
 */
async function generateAchievements(experience: any) {
  if (!process.env.OPENAI_API_KEY || !experience || !experience.description) {
    return [];
  }
  
  try {
    // Create a prompt for generating achievements
    const prompt = `
    Based on the following job description for a ${experience.title} role at ${experience.company || 'a company'}, 
    generate 3-5 specific, quantifiable professional achievements that would be impressive on a resume.
    Focus on results, metrics, and specific accomplishments. Format as bullet points.
    
    Job Description: ${experience.description}
    `;
    
    // Call OpenAI API to generate achievements
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a professional resume writer specializing in extracting and articulating key achievements from job descriptions. Your task is to create impressive, specific, and quantifiable achievement statements."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
    });
    
    const response = completion.choices[0].message.content || '';
    
    // Parse the bulleted list into an array
    const achievements = response
      .split(/\n+/)
      .map(line => line.replace(/^[\s•\-–—*]+/, '').trim())
      .filter(line => line.length > 0);
    
    return achievements;
  } catch (error) {
    console.error("Error generating achievements:", error);
    return [];
  }
}

/**
 * Create a resume from LinkedIn profile data
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get the current user session
    const { data: { session } } = await supabase.auth.getSession();
    
    // Check for server-side authorization (from the callback route)
    const serverAuthUserId = request.headers.get('X-Auth-User-Id');
    let userId: string;
    
    if (serverAuthUserId) {
      console.log("Using server-side authorization with user ID:", serverAuthUserId);
      userId = serverAuthUserId;
    } else if (session) {
      userId = session.user.id;
    } else {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    const { linkedInProfileId } = body;
    
    console.log("Request to create resume from LinkedIn profile:", {
      userId,
      linkedInProfileId: linkedInProfileId || 'Not provided'
    });
    
    // First, do a direct check to see all LinkedIn profiles for this user
    const { data: allProfiles } = await supabase
      .from('linkedin_profiles')
      .select('id, status, last_synced')
      .eq('user_id', userId);

    console.log(`Found ${allProfiles?.length || 0} LinkedIn profiles for user:`, allProfiles);

    // Now get the specific LinkedIn profile with a more robust query
    let profile;
    let profileError;

    // If a specific LinkedIn profile ID was provided, try to get it first
    if (linkedInProfileId) {
      console.log(`Querying by specific LinkedIn profile ID: ${linkedInProfileId}`);
      
      const { data, error } = await supabase
        .from('linkedin_profiles')
        .select('*')
        .eq('id', linkedInProfileId)
        .single();
      
      profile = data;
      profileError = error;
      
      if (error) {
        console.error('Error fetching LinkedIn profile by ID:', error);
      } else if (data) {
        console.log("Found LinkedIn profile by ID:", { 
          id: data.id,
          name: data.name,
          status: data.status 
        });
      }
    }

    // If no profile found by ID or no ID provided, try by user ID
    if (!profile) {
      console.log(`Querying by user ID: ${userId}`);
      
      const { data, error } = await supabase
        .from('linkedin_profiles')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'connected')
        .order('last_synced', { ascending: false })
        .limit(1)
        .single();
      
      profile = data;
      profileError = error;
      
      if (error) {
        console.error('Error fetching LinkedIn profile by user ID:', error);
      } else if (data) {
        console.log("Found LinkedIn profile by user ID:", { 
          id: data.id,
          name: data.name,
          status: data.status 
        });
      }
    }

    // Now check if we have a profile
    if (!profile) {
      console.error('Error fetching LinkedIn profile:', profileError);
      return NextResponse.json(
        { error: 'No connected LinkedIn profile found' },
        { status: 404 }
      );
    }

    // If the profile status is not "connected", update it
    if (profile.status !== "connected") {
      console.log(`LinkedIn profile status is "${profile.status}", updating to "connected"`);
      
      const { error: updateError } = await supabase
        .from('linkedin_profiles')
        .update({ status: "connected" })
        .eq('id', profile.id);
      
      if (updateError) {
        console.error('Error updating LinkedIn profile status:', updateError);
      } else {
        profile.status = "connected";
        console.log("LinkedIn profile status updated to 'connected'");
      }
    }

    console.log("LinkedIn profile found and ready for resume creation:", { 
      id: profile.id,
      name: profile.name,
      status: profile.status,
      linkedin_id: profile.linkedin_id 
    });
    
    // Enhance the profile data with AI if OpenAI API key is available
    const enhancedProfile = await enhanceProfileWithAI(profile);
    
    // Extract name parts
    let firstName = '';
    let lastName = '';
    
    if (profile.name) {
      const nameParts = profile.name.split(' ');
      firstName = nameParts[0] || '';
      lastName = nameParts.slice(1).join(' ') || '';
    }
    
    // Process work experience to ensure we have achievements for each role
    const processedExperience = await Promise.all((enhancedProfile.experience_json || []).map(async (exp: any) => {
      // If experience doesn't have achievements, generate them
      if (!exp.achievements || exp.achievements.length === 0) {
        const generatedAchievements = await generateAchievements(exp);
        return {
          ...exp,
          achievements: generatedAchievements
        };
      }
      return exp;
    }));
    
    // Process skills to ensure they have categories and proficiency levels
    const processedSkills = (enhancedProfile.skills_json || []).map((skill: any, index: number) => {
      // Assign default category and proficiency if not present
      return {
        id: skill.id || `skill-${index}`,
        name: skill.name || '',
        level: skill.proficiency || skill.level || 'Intermediate',
        category: skill.category || 'Professional'
      };
    });
    
    // Get a default template ID for the resume
    const defaultTemplateId = await getDefaultTemplateId(supabase);
    
    // Create resume object
    const resumeData = {
      id: uuidv4(),
      user_id: userId,
      title: `${firstName} ${lastName} Resume`,
      personal_info: {
        firstName: firstName,
        lastName: lastName,
        title: enhancedProfile.headline || enhancedProfile.position || '',
        summary: enhancedProfile.summary || '',
        contact: {
          email: session?.user?.email || enhancedProfile.email || '',
          phone: '',
          location: enhancedProfile.location || '',
          linkedIn: enhancedProfile.profile_url || '',
          website: ''
        }
      },
      work_experience: processedExperience,
      education: enhancedProfile.education_json || [],
      skills: processedSkills,
      projects: enhancedProfile.projects_json || [],
      languages: enhancedProfile.languages_json || [],
      certifications: enhancedProfile.certifications_json || [],
      interests: [],
      internships: [],
      references: [],
      reference_text: "References available upon request",
      template_id: defaultTemplateId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_imported: true,
      is_public: false
    };
    
    console.log("Creating resume with data:", {
      id: resumeData.id,
      title: resumeData.title,
      template_id: resumeData.template_id
    });
    
    // Insert the resume into the database
    const { data: resume, error: resumeError } = await supabase
      .from('resumes')
      .insert(resumeData)
      .select()
      .single();
    
    if (resumeError) {
      console.error('Error creating resume:', resumeError);
      return NextResponse.json(
        { error: 'Failed to create resume from LinkedIn data: ' + resumeError.message },
        { status: 500 }
      );
    }
    
    console.log("Resume created successfully with ID:", resume.id);
    
    // Log this activity
    try {
      await supabase.from('activity_logs').insert({
        user_id: userId,
        event_type: 'resume_created',
        entity_type: 'resume',
        entity_id: resume.id,
        details: {
          source: 'linkedin',
          profile_id: profile.id
        }
      });
      console.log("Activity logged successfully");
    } catch (logError) {
      console.error("Error logging activity:", logError);
      // Non-critical, continue
    }
    
    return NextResponse.json({
      success: true,
      resumeId: resume.id,
      message: 'Resume successfully created from LinkedIn profile'
    });
  } catch (error: any) {
    console.error('Error creating resume from LinkedIn:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred: ' + error.message },
      { status: 500 }
    );
  }
}