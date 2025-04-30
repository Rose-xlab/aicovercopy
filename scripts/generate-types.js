#!/usr/bin/env node

/**
 * This script generates TypeScript types from your Supabase database schema.
 * It uses the Supabase CLI to generate the types.
 * 
 * Prerequisites:
 * 1. Install the Supabase CLI: https://supabase.com/docs/guides/cli
 * 2. Login to Supabase CLI: `supabase login`
 * 3. Link your project: `supabase link --project-ref your-project-ref`
 * 
 * Usage:
 * Run this script with: `node scripts/generate-types.js`
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Directory where the types will be generated
const OUTPUT_DIR = path.join(__dirname, '..', 'types');

// Ensure the output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// File where the types will be written
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'supabase.ts');

try {
  console.log('Generating Supabase types...');
  
  // Run the Supabase CLI command to generate types
  const output = execSync('npx supabase gen types typescript --local', { encoding: 'utf-8' });
  
  // Write the output to the file
  fs.writeFileSync(OUTPUT_FILE, output);
  
  console.log(`Types generated successfully at: ${OUTPUT_FILE}`);
} catch (error) {
  console.error('Error generating Supabase types:');
  console.error(error.message);
  console.error('\nTroubleshooting:');
  console.error('1. Make sure you have installed the Supabase CLI');
  console.error('2. Make sure you are logged in to Supabase CLI (`supabase login`)');
  console.error('3. Make sure your project is linked (`supabase link --project-ref your-project-ref`)');
  process.exit(1);
}