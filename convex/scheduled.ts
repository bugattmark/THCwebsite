import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

/**
 * Scheduled cron jobs for automatic event scraping
 * 
 * This runs daily at 00:00 GMT (midnight UTC) to scrape events from Luma
 * 
 * Setup:
 * 1. Make sure FIRECRAWL_API_KEY is set in Convex Dashboard:
 *    - Go to https://dashboard.convex.dev
 *    - Navigate to Settings > Environment Variables
 *    - Add: FIRECRAWL_API_KEY = your-api-key-here
 * 
 * 2. The cron job is automatically registered when you deploy Convex
 * 
 * 3. To test manually, you can call the action directly:
 *    npx convex run actions/scrapeWithFirecrawl:scrapeWithFirecrawl
 */
const crons = cronJobs();

// Schedule daily scraping at 00:00 GMT (midnight UTC)
crons.daily(
  "scrapeEvents",
  {
    hourUTC: 0, // Midnight UTC (00:00 GMT)
    minuteUTC: 0,
  },
  internal.actions.scrapeWithFirecrawl.scrapeWithFirecrawl
);

export default crons;

