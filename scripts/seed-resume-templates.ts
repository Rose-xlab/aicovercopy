import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase.js';

// Load environment variables
dotenv.config();

type ResumeTemplate = Database['public']['Tables']['resume_templates']['Row'];

// Use environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Script initialized');
console.log('Supabase URL available:', !!supabaseUrl);
console.log('Supabase Service Key available:', !!supabaseServiceKey);

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Supabase URL or service key is missing. Make sure these are set in your environment variables.');
  process.exit(1);
}

// Initialize Supabase client with service role key for admin access
const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

console.log('Supabase client initialized');

// Function to generate UUID v4
function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Default templates data
const defaultTemplates: Omit<ResumeTemplate, 'id'>[] = [
  {
    name: 'Professional',
    description: 'A clean, professional resume template',
    category: 'Professional',
    html_content: `<div class="resume">
      <header>
        <h1>{{name}}</h1>
        <p>{{title}}</p>
        <div class="contact">
          <p>{{email}} | {{phone}}</p>
          <p>{{address}}</p>
        </div>
      </header>
      {{professional-summary}}
      {{work-experience}}
      {{education}}
      {{skills}}
      {{projects}}
      {{certifications}}
      {{languages}}
      {{interests}}
      {{references}}
    </div>`,
    css_content: `
      .resume {
        font-family: Arial, sans-serif;
        line-height: 1.6;
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
      }
      header {
        text-align: center;
        margin-bottom: 20px;
      }
      h1 {
        margin: 0;
        font-size: 28px;
      }
      .section-heading {
        border-bottom: 2px solid #444;
        padding-bottom: 5px;
        margin-top: 20px;
      }
    `,
    thumbnail: '/thumbnails/resume-professional.png',
    is_public: true,
    user_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    name: 'Modern',
    description: 'A modern and sleek resume template',
    category: 'Modern',
    html_content: `<div class="resume modern">
      <header>
        <h1>{{name}}</h1>
        <p>{{title}}</p>
        <div class="contact">
          <p>{{email}} | {{phone}}</p>
          <p>{{address}}</p>
        </div>
      </header>
      {{professional-summary}}
      {{work-experience}}
      {{education}}
      {{skills}}
      {{projects}}
      {{certifications}}
      {{languages}}
      {{interests}}
      {{references}}
    </div>`,
    css_content: `
      .resume.modern {
        font-family: 'Helvetica', sans-serif;
        line-height: 1.6;
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
        color: #333;
      }
      header {
        text-align: center;
        margin-bottom: 30px;
      }
      h1 {
        margin: 0;
        font-size: 32px;
        color: #2563eb;
      }
      .section-heading {
        border-bottom: 2px solid #2563eb;
        padding-bottom: 5px;
        margin-top: 25px;
        color: #2563eb;
      }
    `,
    thumbnail: '/thumbnails/resume-modern.png',
    is_public: true,
    user_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

async function seedResumeTemplates(): Promise<void> {
  try {
    console.log('Starting template seeding process...');
    
    // Check if templates already exist
    const { data: existingTemplates, error: countError } = await supabase
      .from('resume_templates')
      .select('*');
    
    if (countError) {
      console.error('Error checking existing templates:', countError);
      throw countError;
    }
    
    if (existingTemplates && existingTemplates.length > 0) {
      console.log(`Found ${existingTemplates.length} existing templates, skipping seeding.`);
      return;
    }
    
    console.log('No templates found. Creating templates...');
    
    // Insert templates into the database
    const { data, error: insertError } = await supabase
      .from('resume_templates')
      .insert(defaultTemplates)
      .select();
    
    if (insertError) {
      console.error('Error inserting templates:', insertError);
      throw insertError;
    }
    
    console.log(`Successfully created ${data?.length || 0} resume templates`);
    console.log('Template IDs:', data?.map(t => t.id).join(', '));
    
  } catch (error) {
    console.error('Error seeding templates:', error);
    process.exit(1);
  }
}

// Run the seeder
seedResumeTemplates()
  .then(() => {
    console.log('Seeding completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  });