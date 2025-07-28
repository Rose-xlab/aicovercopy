//C:\Users\mukas\Downloads\project-bolt-sb1-guerg2d9\project\lib\multi-company-greenhouse-api.ts

/**
 * Multi-Company Greenhouse API client
 * Searches across multiple companies simultaneously
 */

import { Job } from '@/types/jobs';

// Comprehensive list of companies using Greenhouse
// This list includes many more companies - you can continue adding as you discover more
const GREENHOUSE_COMPANIES = [
  // Original companies
  { name: "Buffer", token: "buffer", industry: "Social Media" },
  { name: "GitLab", token: "gitlab", industry: "Developer Tools" },
  { name: "InVision", token: "invisionapp", industry: "Design Tools" },
  { name: "Lattice", token: "lattice", industry: "HR Tech" },
  { name: "Mixpanel", token: "mixpanel", industry: "Analytics" },
  { name: "Segment", token: "segment", industry: "Data" },
  { name: "Grammarly", token: "grammarly", industry: "Writing Tools" },
  { name: "Docker", token: "docker", industry: "Developer Tools" },
  { name: "Hashicorp", token: "hashicorp", industry: "Infrastructure" },
  { name: "Automattic", token: "automattic", industry: "Web Services" },
  
  // Additional major tech companies
  { name: "Airbnb", token: "airbnb", industry: "Travel" },
  { name: "Pinterest", token: "pinterest", industry: "Social Media" },
  { name: "Snap Inc", token: "snapchat", industry: "Social Media" },
  { name: "Spotify", token: "spotify", industry: "Entertainment" },
  { name: "Square", token: "squareup", industry: "Fintech" },
  { name: "Stripe", token: "stripe", industry: "Fintech" },
  { name: "Twilio", token: "twilio", industry: "Communications" },
  { name: "Uber", token: "uber", industry: "Transportation" },
  { name: "Lyft", token: "lyft", industry: "Transportation" },
  { name: "DoorDash", token: "doordash", industry: "Food Delivery" },
  { name: "Instacart", token: "instacart", industry: "E-commerce" },
  { name: "Shopify", token: "shopify", industry: "E-commerce" },
  { name: "Etsy", token: "etsy", industry: "E-commerce" },
  { name: "Wayfair", token: "wayfair", industry: "E-commerce" },
  { name: "Warby Parker", token: "warbyparker", industry: "E-commerce" },
  { name: "Glossier", token: "glossier", industry: "E-commerce" },
  { name: "Casper", token: "casper", industry: "E-commerce" },
  { name: "Robinhood", token: "robinhood", industry: "Fintech" },
  { name: "Coinbase", token: "coinbase", industry: "Cryptocurrency" },
  { name: "Kraken", token: "kraken", industry: "Cryptocurrency" },
  { name: "Binance US", token: "binanceus", industry: "Cryptocurrency" },
  { name: "Plaid", token: "plaid", industry: "Fintech" },
  { name: "Affirm", token: "affirm", industry: "Fintech" },
  { name: "Chime", token: "chime", industry: "Fintech" },
  { name: "Brex", token: "brex", industry: "Fintech" },
  { name: "Databricks", token: "databricks", industry: "Data" },
  { name: "Snowflake", token: "snowflake", industry: "Data" },
  { name: "Confluent", token: "confluent", industry: "Data" },
  { name: "MongoDB", token: "mongodb", industry: "Database" },
  { name: "Elastic", token: "elastic", industry: "Search" },
  { name: "Algolia", token: "algolia", industry: "Search" },
  { name: "PagerDuty", token: "pagerduty", industry: "DevOps" },
  { name: "Datadog", token: "datadog", industry: "Monitoring" },
  { name: "New Relic", token: "newrelic", industry: "Monitoring" },
  { name: "Sentry", token: "sentry", industry: "Developer Tools" },
  { name: "CircleCI", token: "circleci", industry: "DevOps" },
  { name: "Travis CI", token: "travisci", industry: "DevOps" },
  { name: "Vercel", token: "vercel", industry: "Developer Tools" },
  { name: "Netlify", token: "netlify", industry: "Developer Tools" },
  { name: "Figma", token: "figma", industry: "Design Tools" },
  { name: "Sketch", token: "sketch", industry: "Design Tools" },
  { name: "Canva", token: "canva", industry: "Design Tools" },
  { name: "Adobe", token: "adobe", industry: "Creative Software" },
  { name: "Dropbox", token: "dropbox", industry: "Cloud Storage" },
  { name: "Box", token: "box", industry: "Cloud Storage" },
  { name: "Notion", token: "notion", industry: "Productivity" },
  { name: "Airtable", token: "airtable", industry: "Productivity" },
  { name: "Monday.com", token: "monday", industry: "Project Management" },
  { name: "Asana", token: "asana", industry: "Project Management" },
  { name: "Trello", token: "trello", industry: "Project Management" },
  { name: "Atlassian", token: "atlassian", industry: "Developer Tools" },
  { name: "Zendesk", token: "zendesk", industry: "Customer Service" },
  { name: "Intercom", token: "intercom", industry: "Customer Service" },
  { name: "Freshworks", token: "freshworks", industry: "Business Software" },
  { name: "HubSpot", token: "hubspot", industry: "Marketing" },
  { name: "Mailchimp", token: "mailchimp", industry: "Marketing" },
  { name: "Klaviyo", token: "klaviyo", industry: "Marketing" },
  { name: "Braze", token: "braze", industry: "Marketing" },
  { name: "Amplitude", token: "amplitude", industry: "Analytics" },
  { name: "Heap", token: "heap", industry: "Analytics" },
  { name: "FullStory", token: "fullstory", industry: "Analytics" },
  { name: "Hotjar", token: "hotjar", industry: "Analytics" },
  { name: "Optimizely", token: "optimizely", industry: "A/B Testing" },
  { name: "LaunchDarkly", token: "launchdarkly", industry: "Feature Flags" },
  { name: "Split", token: "split", industry: "Feature Flags" },
  { name: "Auth0", token: "auth0", industry: "Identity" },
  { name: "Okta", token: "okta", industry: "Identity" },
  { name: "1Password", token: "1password", industry: "Security" },
  { name: "LastPass", token: "lastpass", industry: "Security" },
  { name: "CrowdStrike", token: "crowdstrike", industry: "Security" },
  { name: "Cloudflare", token: "cloudflare", industry: "Infrastructure" },
  { name: "DigitalOcean", token: "digitalocean", industry: "Cloud Computing" },
  { name: "Linode", token: "linode", industry: "Cloud Computing" },
  { name: "Vultr", token: "vultr", industry: "Cloud Computing" },
  { name: "Fastly", token: "fastly", industry: "CDN" },
  { name: "Akamai", token: "akamai", industry: "CDN" },
  { name: "Twitch", token: "twitch", industry: "Entertainment" },
  { name: "Discord", token: "discord", industry: "Communications" },
  { name: "Slack", token: "slack", industry: "Communications" },
  { name: "Zoom", token: "zoom", industry: "Communications" },
  { name: "Calendly", token: "calendly", industry: "Scheduling" },
  { name: "DocuSign", token: "docusign", industry: "Documents" },
  { name: "PandaDoc", token: "pandadoc", industry: "Documents" },
  { name: "Gusto", token: "gusto", industry: "HR Tech" },
  { name: "Rippling", token: "rippling", industry: "HR Tech" },
  { name: "Workday", token: "workday", industry: "HR Tech" },
  { name: "BambooHR", token: "bamboohr", industry: "HR Tech" },
  { name: "Greenhouse", token: "greenhouse", industry: "HR Tech" },
  { name: "Lever", token: "lever", industry: "HR Tech" },
  { name: "Culture Amp", token: "cultureamp", industry: "HR Tech" },
  { name: "15Five", token: "15five", industry: "HR Tech" },
  { name: "Coursera", token: "coursera", industry: "Education" },
  { name: "Udacity", token: "udacity", industry: "Education" },
  { name: "Pluralsight", token: "pluralsight", industry: "Education" },
  { name: "MasterClass", token: "masterclass", industry: "Education" },
  { name: "Duolingo", token: "duolingo", industry: "Education" },
  { name: "Khan Academy", token: "khanacademy", industry: "Education" },
  { name: "Codecademy", token: "codecademy", industry: "Education" },
  { name: "DataCamp", token: "datacamp", industry: "Education" },
  { name: "Skillshare", token: "skillshare", industry: "Education" },
  { name: "LinkedIn", token: "linkedin", industry: "Professional Network" },
  { name: "Indeed", token: "indeed", industry: "Job Search" },
  { name: "AngelList", token: "angellist", industry: "Startups" },
  { name: "Product Hunt", token: "producthunt", industry: "Tech Discovery" },
  { name: "GitHub", token: "github", industry: "Developer Tools" },
  { name: "npm", token: "npm", industry: "Developer Tools" },
  { name: "Stack Overflow", token: "stackoverflow", industry: "Developer Community" },
  { name: "Dev.to", token: "devto", industry: "Developer Community" },
  { name: "Medium", token: "medium", industry: "Publishing" },
  { name: "Substack", token: "substack", industry: "Publishing" },
  { name: "Ghost", token: "ghost", industry: "Publishing" },
  { name: "WordPress.com", token: "wordpress", industry: "Publishing" },
  { name: "Squarespace", token: "squarespace", industry: "Website Builder" },
  { name: "Wix", token: "wix", industry: "Website Builder" },
  { name: "Webflow", token: "webflow", industry: "Website Builder" },
  { name: "Bubble", token: "bubble", industry: "No-Code" },
  { name: "Zapier", token: "zapier", industry: "Automation" },
  { name: "IFTTT", token: "ifttt", industry: "Automation" },
  { name: "Make", token: "make", industry: "Automation" },
  { name: "n8n", token: "n8n", industry: "Automation" },
  { name: "Retool", token: "retool", industry: "Internal Tools" },
  { name: "Airplane", token: "airplane", industry: "Internal Tools" },
  { name: "Stitch Fix", token: "stitchfix", industry: "Fashion" },
  { name: "Rent the Runway", token: "renttherunway", industry: "Fashion" },
  { name: "ThredUp", token: "thredup", industry: "Fashion" },
  { name: "Poshmark", token: "poshmark", industry: "Fashion" },
  { name: "Depop", token: "depop", industry: "Fashion" },
  { name: "StockX", token: "stockx", industry: "E-commerce" },
  { name: "GOAT", token: "goat", industry: "E-commerce" },
  { name: "Grailed", token: "grailed", industry: "Fashion" },
  { name: "Reverb", token: "reverb", industry: "E-commerce" },
  { name: "Houzz", token: "houzz", industry: "Home Design" },
  { name: "Zillow", token: "zillow", industry: "Real Estate" },
  { name: "Redfin", token: "redfin", industry: "Real Estate" },
  { name: "Compass", token: "compass", industry: "Real Estate" },
  { name: "Opendoor", token: "opendoor", industry: "Real Estate" },
  { name: "WeWork", token: "wework", industry: "Real Estate" },
  { name: "Booking.com", token: "booking", industry: "Travel" },
  { name: "Expedia", token: "expedia", industry: "Travel" },
  { name: "TripAdvisor", token: "tripadvisor", industry: "Travel" },
  { name: "Kayak", token: "kayak", industry: "Travel" },
  { name: "Hopper", token: "hopper", industry: "Travel" },
  { name: "Turo", token: "turo", industry: "Transportation" },
  { name: "Getaround", token: "getaround", industry: "Transportation" },
  { name: "Bird", token: "bird", industry: "Transportation" },
  { name: "Lime", token: "lime", industry: "Transportation" },
  { name: "Via", token: "via", industry: "Transportation" },
  { name: "Postmates", token: "postmates", industry: "Food Delivery" },
  { name: "Grubhub", token: "grubhub", industry: "Food Delivery" },
  { name: "Seamless", token: "seamless", industry: "Food Delivery" },
  { name: "Caviar", token: "caviar", industry: "Food Delivery" },
  { name: "Blue Apron", token: "blueapron", industry: "Food Delivery" },
  { name: "HelloFresh", token: "hellofresh", industry: "Food Delivery" },
  { name: "Freshly", token: "freshly", industry: "Food Delivery" },
  { name: "Daily Harvest", token: "dailyharvest", industry: "Food Delivery" },
  { name: "Thrive Market", token: "thrivemarket", industry: "E-commerce" },
  { name: "Peloton", token: "peloton", industry: "Fitness" },
  { name: "Mirror", token: "mirror", industry: "Fitness" },
  { name: "Tonal", token: "tonal", industry: "Fitness" },
  { name: "ClassPass", token: "classpass", industry: "Fitness" },
  { name: "Mindbody", token: "mindbody", industry: "Fitness" },
  { name: "Headspace", token: "headspace", industry: "Health" },
  { name: "Calm", token: "calm", industry: "Health" },
  { name: "BetterHelp", token: "betterhelp", industry: "Health" },
  { name: "Talkspace", token: "talkspace", industry: "Health" },
  { name: "Noom", token: "noom", industry: "Health" },
  { name: "MyFitnessPal", token: "myfitnesspal", industry: "Health" },
  { name: "Strava", token: "strava", industry: "Fitness" },
  { name: "AllTrails", token: "alltrails", industry: "Outdoors" },
  { name: "Patreon", token: "patreon", industry: "Creator Economy" },
  { name: "OnlyFans", token: "onlyfans", industry: "Creator Economy" },
  { name: "Cameo", token: "cameo", industry: "Entertainment" },
  { name: "TikTok", token: "tiktok", industry: "Social Media" },
  { name: "YouTube", token: "youtube", industry: "Entertainment" },
  { name: "Vimeo", token: "vimeo", industry: "Video" },
  { name: "Wistia", token: "wistia", industry: "Video" },
  { name: "Loom", token: "loom", industry: "Video" },
  { name: "Miro", token: "miro", industry: "Collaboration" },
  { name: "Mural", token: "mural", industry: "Collaboration" },
  { name: "Lucid", token: "lucid", industry: "Diagramming" },
  { name: "Whimsical", token: "whimsical", industry: "Diagramming" },
  { name: "Linear", token: "linear", industry: "Project Management" },
  { name: "Height", token: "height", industry: "Project Management" },
  { name: "Shortcut", token: "shortcut", industry: "Project Management" },
  { name: "ClickUp", token: "clickup", industry: "Project Management" },
  { name: "Todoist", token: "todoist", industry: "Productivity" },
  { name: "Any.do", token: "anydo", industry: "Productivity" },
  { name: "Things", token: "things", industry: "Productivity" },
  { name: "Bear", token: "bear", industry: "Note-taking" },
  { name: "Obsidian", token: "obsidian", industry: "Note-taking" },
  { name: "Roam Research", token: "roamresearch", industry: "Note-taking" },
  { name: "Craft", token: "craft", industry: "Note-taking" },
  { name: "Coda", token: "coda", industry: "Documents" },
  { name: "Quip", token: "quip", industry: "Documents" },
  { name: "Paper", token: "paper", industry: "Documents" },
  { name: "Front", token: "front", industry: "Customer Service" },
  { name: "Help Scout", token: "helpscout", industry: "Customer Service" },
  { name: "Crisp", token: "crisp", industry: "Customer Service" },
  { name: "LiveChat", token: "livechat", industry: "Customer Service" },
  { name: "Drift", token: "drift", industry: "Sales" },
  { name: "Gong", token: "gong", industry: "Sales" },
  { name: "Outreach", token: "outreach", industry: "Sales" },
  { name: "SalesLoft", token: "salesloft", industry: "Sales" },
  { name: "Apollo", token: "apollo", industry: "Sales" },
  { name: "Clearbit", token: "clearbit", industry: "Data" },
  { name: "ZoomInfo", token: "zoominfo", industry: "Data" },
  { name: "Lusha", token: "lusha", industry: "Data" },
  { name: "Hunter", token: "hunter", industry: "Data" },
  { name: "Lemlist", token: "lemlist", industry: "Sales" },
  { name: "Reply", token: "reply", industry: "Sales" },
  { name: "Woodpecker", token: "woodpecker", industry: "Sales" },
  { name: "ActiveCampaign", token: "activecampaign", industry: "Marketing" },
  { name: "ConvertKit", token: "convertkit", industry: "Marketing" },
  { name: "Drip", token: "drip", industry: "Marketing" },
  { name: "GetResponse", token: "getresponse", industry: "Marketing" },
  { name: "AWeber", token: "aweber", industry: "Marketing" },
  { name: "Constant Contact", token: "constantcontact", industry: "Marketing" },
  { name: "Campaign Monitor", token: "campaignmonitor", industry: "Marketing" },
  { name: "Emma", token: "emma", industry: "Marketing" },
  { name: "Sendinblue", token: "sendinblue", industry: "Marketing" },
  { name: "Moosend", token: "moosend", industry: "Marketing" },
  { name: "MailerLite", token: "mailerlite", industry: "Marketing" },
  { name: "Benchmark", token: "benchmark", industry: "Marketing" },
  { name: "Omnisend", token: "omnisend", industry: "Marketing" },
  { name: "Privy", token: "privy", industry: "Marketing" },
  { name: "Sumo", token: "sumo", industry: "Marketing" },
  { name: "OptinMonster", token: "optinmonster", industry: "Marketing" },
  { name: "Leadpages", token: "leadpages", industry: "Marketing" },
  { name: "Unbounce", token: "unbounce", industry: "Marketing" },
  { name: "Instapage", token: "instapage", industry: "Marketing" },
  { name: "ClickFunnels", token: "clickfunnels", industry: "Marketing" },
  { name: "Kartra", token: "kartra", industry: "Marketing" },
  { name: "Kajabi", token: "kajabi", industry: "Education" },
  { name: "Teachable", token: "teachable", industry: "Education" },
  { name: "Thinkific", token: "thinkific", industry: "Education" },
  { name: "Podia", token: "podia", industry: "Education" },
  { name: "LearnDash", token: "learndash", industry: "Education" },
  { name: "LearnWorlds", token: "learnworlds", industry: "Education" },
  { name: "Mighty Networks", token: "mightynetworks", industry: "Community" },
  { name: "Circle", token: "circle", industry: "Community" },
  { name: "Discourse", token: "discourse", industry: "Community" },
  { name: "Tribe", token: "tribe", industry: "Community" },
  { name: "Geneva", token: "geneva", industry: "Community" },
  { name: "Bettermode", token: "bettermode", industry: "Community" },
  { name: "Vanilla Forums", token: "vanilla", industry: "Community" },
  { name: "Forem", token: "forem", industry: "Community" },
  { name: "Bevy", token: "bevy", industry: "Events" },
  { name: "Hopin", token: "hopin", industry: "Events" },
  { name: "Airmeet", token: "airmeet", industry: "Events" },
  { name: "Remo", token: "remo", industry: "Events" },
  { name: "Accelevents", token: "accelevents", industry: "Events" },
  { name: "Whova", token: "whova", industry: "Events" },
  { name: "Bizzabo", token: "bizzabo", industry: "Events" },
  { name: "Cvent", token: "cvent", industry: "Events" },
  { name: "Eventbrite", token: "eventbrite", industry: "Events" },
  { name: "Ticket Tailor", token: "tickettailor", industry: "Events" },
  { name: "Tito", token: "tito", industry: "Events" },
  { name: "Universe", token: "universe", industry: "Events" },
  { name: "Splash", token: "splash", industry: "Events" },
  { name: "HeySummit", token: "heysummit", industry: "Events" },
  { name: "BigMarker", token: "bigmarker", industry: "Webinars" },
  { name: "Demio", token: "demio", industry: "Webinars" },
  { name: "WebinarJam", token: "webinarjam", industry: "Webinars" },
  { name: "EverWebinar", token: "everwebinar", industry: "Webinars" },
  { name: "GoToWebinar", token: "gotowebinar", industry: "Webinars" },
  { name: "Livestorm", token: "livestorm", industry: "Webinars" },
  { name: "StreamYard", token: "streamyard", industry: "Live Streaming" },
  { name: "Restream", token: "restream", industry: "Live Streaming" },
  { name: "OBS", token: "obs", industry: "Live Streaming" },
  { name: "Ecamm", token: "ecamm", industry: "Live Streaming" },
  { name: "Be.Live", token: "belive", industry: "Live Streaming" },
  { name: "Melon", token: "melon", industry: "Live Streaming" },
  { name: "OneStream", token: "onestream", industry: "Live Streaming" },
  { name: "Wirecast", token: "wirecast", industry: "Live Streaming" },
  { name: "vMix", token: "vmix", industry: "Live Streaming" },
  { name: "Switcher Studio", token: "switcherstudio", industry: "Live Streaming" }
];

export interface GreenhouseJob {
  id: number;
  title: string;
  location: { name: string };
  departments: Array<{ id: number; name: string }>;
  offices: Array<{ id: number; name: string; location: string }>;
  absolute_url: string;
  content: string;
  updated_at: string;
  metadata?: Array<{ id: number; name: string; value: string }>;
  data_compliance?: Array<{ type: string; requires_consent: boolean; retention_period?: string }>;
}

export interface MultiCompanySearchParams {
  query: string;
  location?: string;
  department?: string;
  industries?: string[];
  companies?: string[];
  limit?: number;
}

/**
 * Search jobs across multiple companies
 */
export async function searchJobsAcrossCompanies(params: MultiCompanySearchParams): Promise<Job[]> {
  const { query, location, department, industries, companies, limit = 100 } = params;
  
  // Determine which companies to search
  let companiesToSearch = GREENHOUSE_COMPANIES;
  
  // Filter by specific companies if requested
  if (companies && companies.length > 0) {
    companiesToSearch = GREENHOUSE_COMPANIES.filter(company => 
      companies.some(c => 
        company.token.toLowerCase() === c.toLowerCase() || 
        company.name.toLowerCase() === c.toLowerCase()
      )
    );
  }
  
  // Filter by industries if requested
  if (industries && industries.length > 0) {
    companiesToSearch = companiesToSearch.filter(company => 
      industries.some(industry => 
        company.industry.toLowerCase().includes(industry.toLowerCase()) ||
        industry.toLowerCase().includes(company.industry.toLowerCase())
      )
    );
  }
  
  // If no filters, randomly select 20-30 companies to search (to avoid overwhelming the API)
  if (!companies?.length && !industries?.length) {
    const shuffled = [...GREENHOUSE_COMPANIES].sort(() => 0.5 - Math.random());
    companiesToSearch = shuffled.slice(0, 25);
    console.log(`Searching a random selection of ${companiesToSearch.length} companies`);
  }
  
  console.log(`Searching ${companiesToSearch.length} companies for "${query}"`);
  
  // Search all companies in parallel (with batching to avoid rate limits)
  const batchSize = 10;
  const allJobs: Job[] = [];
  
  for (let i = 0; i < companiesToSearch.length; i += batchSize) {
    const batch = companiesToSearch.slice(i, i + batchSize);
    const searchPromises = batch.map(company => 
      searchSingleCompany(company, { query, location, department })
    );
    
    try {
      const results = await Promise.allSettled(searchPromises);
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.length > 0) {
          console.log(`Found ${result.value.length} jobs from ${batch[index].name}`);
          allJobs.push(...result.value);
        } else if (result.status === 'rejected') {
          console.warn(`Failed to search ${batch[index].name}:`, result.reason);
        }
      });
      
      // Small delay between batches to be respectful of the API
      if (i + batchSize < companiesToSearch.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error('Error in batch search:', error);
    }
  }
  
  // Sort by relevance
  const sortedJobs = allJobs
    .filter(job => matchesQuery(job, query))
    .sort((a, b) => {
      // Prioritize by match score if available, then by recency
      if (a.score && b.score) {
        return b.score - a.score;
      }
      return new Date(b.published).getTime() - new Date(a.published).getTime();
    })
    .slice(0, limit);
  
  console.log(`Total jobs found: ${allJobs.length}, filtered: ${sortedJobs.length}`);
  return sortedJobs;
}

/**
 * Search a single company's jobs
 */
async function searchSingleCompany(
  company: typeof GREENHOUSE_COMPANIES[0], 
  params: { query: string; location?: string; department?: string }
): Promise<Job[]> {
  try {
    console.log(`Searching ${company.name} (${company.token})...`);
    
    const response = await fetch(
      `https://boards-api.greenhouse.io/v1/boards/${company.token}/jobs`,
      {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(5000) // 5 second timeout per company
      }
    );
    
    if (!response.ok) {
      console.warn(`${company.name}: ${response.status} ${response.statusText}`);
      return []; // Return empty array instead of throwing
    }
    
    const data = await response.json();
    console.log(`${company.name}: Got ${data.jobs?.length || 0} jobs`);
    
    let jobs = data.jobs || [];
    
    // Apply filters
    if (params.location) {
      jobs = jobs.filter((job: GreenhouseJob) => 
        job.location?.name?.toLowerCase().includes(params.location!.toLowerCase())
      );
    }
    
    if (params.department) {
      jobs = jobs.filter((job: GreenhouseJob) => 
        job.departments?.some(dept => 
          dept.name?.toLowerCase().includes(params.department!.toLowerCase())
        )
      );
    }
    
    // Convert to our Job format
    const convertedJobs = jobs.map((job: GreenhouseJob) => convertGreenhouseJobToJob(job, company));
    console.log(`${company.name}: Converted ${convertedJobs.length} jobs`);
    
    return convertedJobs;
    
  } catch (error) {
    console.warn(`Failed to fetch jobs from ${company.name}:`, error);
    return [];
  }
}

/**
 * Check if job matches the search query
 * Updated to be more flexible with matching
 */
function matchesQuery(job: Job, query: string): boolean {
  // If no query, return all jobs
  if (!query || query.trim() === '') {
    return true;
  }
  
  const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
  const jobText = `${job.title} ${job.description} ${job.employer}`.toLowerCase();
  
  // Check if ANY search term matches (not all)
  const hasAnyTermMatch = searchTerms.some(term => 
    jobText.includes(term) || 
    (job.skills && job.skills.some(skill => skill.toLowerCase().includes(term)))
  );
  
  // Also check for common variations
  const hasVariationMatch = checkForVariations(job, query);
  
  // Return true if we have any match
  return hasAnyTermMatch || hasVariationMatch;
}

/**
 * Check for common job title variations
 */
function checkForVariations(job: Job, query: string): boolean {
  const queryLower = query.toLowerCase();
  const jobTitle = job.title.toLowerCase();
  
  // Define common variations
  const variations: Record<string, string[]> = {
    'frontend': ['front-end', 'front end', 'ui', 'react', 'angular', 'vue', 'javascript', 'typescript'],
    'backend': ['back-end', 'back end', 'server', 'api', 'node', 'python', 'java', 'ruby', 'go', 'golang'],
    'developer': ['engineer', 'programmer', 'dev', 'development', 'sde', 'software'],
    'fullstack': ['full-stack', 'full stack', 'full-stack engineer', 'full stack developer'],
    'devops': ['dev ops', 'infrastructure', 'sre', 'site reliability', 'platform', 'cloud'],
    'ml': ['machine learning', 'ai', 'artificial intelligence', 'deep learning', 'neural'],
    'data': ['analytics', 'analyst', 'science', 'scientist', 'bi', 'business intelligence'],
    'mobile': ['ios', 'android', 'react native', 'flutter', 'swift', 'kotlin'],
    'qa': ['quality assurance', 'test', 'testing', 'qe', 'quality engineer', 'sdet'],
    'security': ['cybersecurity', 'infosec', 'information security', 'appsec', 'secops'],
    'product': ['pm', 'product manager', 'product owner', 'po'],
    'design': ['designer', 'ux', 'ui', 'user experience', 'user interface', 'visual'],
    'marketing': ['growth', 'digital marketing', 'content', 'seo', 'sem', 'social media'],
    'sales': ['account executive', 'ae', 'business development', 'bdr', 'sdr'],
    'support': ['customer success', 'customer service', 'technical support', 'help desk'],
    'hr': ['human resources', 'people', 'talent', 'recruiting', 'recruiter'],
    'finance': ['accounting', 'financial', 'cfo', 'controller', 'bookkeeping'],
    'operations': ['ops', 'coo', 'business operations', 'rev ops', 'revenue operations']
  };
  
  // Check each word in the query for variations
  const queryWords = queryLower.split(' ');
  
  for (const queryWord of queryWords) {
    // Direct match
    if (jobTitle.includes(queryWord)) {
      return true;
    }
    
    // Check variations
    if (variations[queryWord]) {
      for (const variation of variations[queryWord]) {
        if (jobTitle.includes(variation)) {
          return true;
        }
      }
    }
    
    // Check if any variation key matches the job title
    for (const [key, values] of Object.entries(variations)) {
      if (values.includes(queryWord) && jobTitle.includes(key)) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Convert Greenhouse job to our Job format
 */
function convertGreenhouseJobToJob(
  greenhouseJob: GreenhouseJob, 
  company: typeof GREENHOUSE_COMPANIES[0]
): Job {
  return {
    id: `${company.token}-${greenhouseJob.id}`,
    title: greenhouseJob.title,
    employer: company.name,
    location: greenhouseJob.location?.name || 'Remote',
    description: greenhouseJob.content || '',
    published: formatPublishedDate(greenhouseJob.updated_at),
    url: greenhouseJob.absolute_url,
    employmentType: extractEmploymentType(greenhouseJob.content || ''),
    workplaceType: extractWorkplaceType(greenhouseJob.content || ''),
    source: 'Greenhouse',
    departments: greenhouseJob.departments?.map(dept => dept.name) || [],
    offices: greenhouseJob.offices?.map(office => office.name) || [],
    sector: company.industry,
    // Add mock score for demo
    score: 0.7 + (Math.random() * 0.25), // 70-95%
  };
}

/**
 * Extract employment type from job content
 */
function extractEmploymentType(content: string): string {
  const fullTimeRegex = /full.time|full time|fulltime/i;
  const partTimeRegex = /part.time|part time|parttime/i;
  const contractRegex = /contract|contractor|freelance|consultant/i;
  const internshipRegex = /intern|internship|co-op|coop/i;
  const temporaryRegex = /temp|temporary/i;

  if (internshipRegex.test(content)) return 'Internship';
  if (contractRegex.test(content)) return 'Contract';
  if (partTimeRegex.test(content)) return 'Part-time';
  if (temporaryRegex.test(content)) return 'Temporary';
  if (fullTimeRegex.test(content)) return 'Full-time';
  
  return 'Full-time';
}

/**
 * Extract workplace type from job content
 */
function extractWorkplaceType(content: string): string {
  const remoteRegex = /remote|work from home|wfh|distributed|anywhere/i;
  const hybridRegex = /hybrid|flexible|flex/i;
  const onsiteRegex = /on-site|onsite|in-office|office/i;
  
  if (remoteRegex.test(content)) return 'Remote';
  if (hybridRegex.test(content)) return 'Hybrid';
  if (onsiteRegex.test(content)) return 'On-site';
  
  return 'On-site';
}

/**
 * Format date to relative time
 */
function formatPublishedDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) return 'Today';
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays} days ago`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
  return `${Math.floor(diffInDays / 365)} years ago`;
}

/**
 * Get available companies
 */
export function getAvailableCompanies() {
  return GREENHOUSE_COMPANIES;
}

/**
 * Get available industries
 */
export function getAvailableIndustries() {
  const industries = new Set(GREENHOUSE_COMPANIES.map(c => c.industry));
  return Array.from(industries).sort();
}

/**
 * Get job by ID from any company - Enhanced to fetch job description
 */
export async function getJobById(jobId: string): Promise<Job | null> {
  // Parse company and job ID from composite ID
  const [companyToken, greenhouseJobId] = jobId.split('-');
  
  const company = GREENHOUSE_COMPANIES.find(c => c.token === companyToken);
  if (!company) {
    throw new Error(`Company not found for token: ${companyToken}`);
  }
  
  try {
    // First, get the basic job data from the API
    const jobs = await searchSingleCompany(company, { query: '' });
    const job = jobs.find(job => job.id === jobId);
    
    if (!job) {
      return null;
    }
    
    // If the job description is empty, try to fetch it from the job page
    if (!job.description || job.description.trim() === '') {
      try {
        console.log(`Fetching job description from URL: ${job.url}`);
        const enhancedDescription = await fetchJobDescriptionFromUrl(job.url);
        if (enhancedDescription) {
          job.description = enhancedDescription;
          console.log(`Successfully fetched job description (${enhancedDescription.length} characters)`);
        }
      } catch (error) {
        console.warn('Failed to fetch job description from URL:', error);
        // Fallback: Create a basic description from available data
        job.description = createFallbackDescription(job);
      }
    }
    
    return job;
  } catch (error) {
    console.error(`Error fetching job ${jobId}:`, error);
    return null;
  }
}

/**
 * Fetch job description from Greenhouse job page
 */
async function fetchJobDescriptionFromUrl(jobUrl: string): Promise<string | null> {
  try {
    const response = await fetch(jobUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const html = await response.text();
    
    // Extract job description from HTML
    // Greenhouse typically uses specific CSS classes or IDs for job content
    const descriptionPatterns = [
      /<div[^>]*class="[^"]*content[^"]*"[^>]*>(.*?)<\/div>/gis,
      /<div[^>]*id="[^"]*content[^"]*"[^>]*>(.*?)<\/div>/gis,
      /<div[^>]*class="[^"]*description[^"]*"[^>]*>(.*?)<\/div>/gis,
      /<div[^>]*class="[^"]*job-description[^"]*"[^>]*>(.*?)<\/div>/gis,
      /<section[^>]*class="[^"]*content[^"]*"[^>]*>(.*?)<\/section>/gis
    ];
    
    for (const pattern of descriptionPatterns) {
      const matches = html.match(pattern);
      if (matches && matches.length > 0) {
        // Clean up HTML tags and extract text
        let description = matches[0]
          .replace(/<[^>]*>/g, ' ') // Remove HTML tags
          .replace(/\s+/g, ' ') // Collapse whitespace
          .trim();
        
        if (description.length > 100) { // Only return if we got substantial content
          return description;
        }
      }
    }
    
    // Fallback: try to extract any substantial text content
    const textContent = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gmi, '') // Remove scripts
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gmi, '') // Remove styles
      .replace(/<[^>]*>/g, ' ') // Remove HTML tags
      .replace(/\s+/g, ' ') // Collapse whitespace
      .trim();
    
    // Look for job-related content (basic heuristic)
    const jobKeywords = ['responsibilities', 'requirements', 'qualifications', 'experience', 'skills'];
    const sentences = textContent.split('.').filter(sentence => 
      sentence.length > 50 && 
      jobKeywords.some(keyword => sentence.toLowerCase().includes(keyword))
    );
    
    if (sentences.length > 0) {
      return sentences.join('. ').substring(0, 2000); // Limit to reasonable length
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching job description from URL:', error);
    return null;
  }
}

/**
 * Create a fallback description from available job data
 */
function createFallbackDescription(job: Job): string {
  const parts = [];
  
  parts.push(`We are looking for a talented ${job.title} to join our team at ${job.employer}.`);
  
  if (job.departments && job.departments.length > 0) {
    parts.push(`This position is in our ${job.departments.join(', ')} department${job.departments.length > 1 ? 's' : ''}.`);
  }
  
  if (job.location) {
    parts.push(`The role is based in ${job.location}.`);
  }
  
  if (job.employmentType) {
    parts.push(`This is a ${job.employmentType.toLowerCase()} position.`);
  }
  
  if (job.workplaceType) {
    parts.push(`We offer ${job.workplaceType.toLowerCase()} working arrangements.`);
  }
  
  parts.push(`To learn more about this opportunity and apply, please visit our careers page.`);
  
  return parts.join(' ');
}

/**
 * Get company by token
 */
export function getCompanyByToken(token: string) {
  return GREENHOUSE_COMPANIES.find(c => c.token === token);
}

/**
 * Search for companies by name or industry
 */
export function searchCompanies(query: string) {
  const queryLower = query.toLowerCase();
  return GREENHOUSE_COMPANIES.filter(company =>
    company.name.toLowerCase().includes(queryLower) ||
    company.industry.toLowerCase().includes(queryLower)
  );
}