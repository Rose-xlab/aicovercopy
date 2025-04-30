import OpenAI from 'openai';

// Make sure the API key is available
if (!process.env.OPENAI_API_KEY) {
  console.error('Missing environment variable: OPENAI_API_KEY');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default openai;