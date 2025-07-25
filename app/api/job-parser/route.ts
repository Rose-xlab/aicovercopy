//C:\Users\mukas\Downloads\project-bolt-sb1-guerg2d9\project\app\api\job-parser\route.ts

import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import openai from '@/lib/openai';

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
        
    const { data: { session } } = await supabase.auth.getSession();
        
    // Allow access without authentication, but track session if available
    const userId = session?.user?.id || null;

    const { url, content } = await request.json();

    let textToAnalyze = content;

    if (url && !content) {
      const response = await fetch(url);
      const html = await response.text();
      // Extract main content from HTML using OpenAI
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "Extract the job description content from this HTML. Remove any irrelevant content like navigation, footer, etc."
          },
          {
            role: "user",
            content: html
          }
        ],
        temperature: 0.3,
      });
      textToAnalyze = completion.choices[0].message.content || '';
    }

    // Analyze the job description
    const analysis = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "Analyze this job description and extract key information in JSON format including: title, company, required_skills, responsibilities, qualifications, and nice_to_have"
        },
        {
          role: "user",
          content: textToAnalyze
        }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    // If user is authenticated, store the analysis in their history
    if (userId) {
      try {
        const { error: insertError } = await supabase.from('job_analyses').insert({
          user_id: userId,
          content: textToAnalyze,
          analysis: analysis.choices[0].message.content,
          created_at: new Date().toISOString(),
        });
        
        if (insertError) {
          console.error('Error saving analysis:', insertError);
        }
      } catch (error) {
        console.error('Error saving analysis:', error);
        // Non-critical error, don't throw
      }
    }

    return NextResponse.json(JSON.parse(analysis.choices[0].message.content || '{}'));
  } catch (error) {
    console.error('Error parsing job description:', error);
    return NextResponse.json(
      { error: 'Failed to parse job description' },
      { status: 500 }
    );
  }
}