"use node";

import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { FirecrawlAppV1 } from "@mendable/firecrawl-js";

/**
 * Parse events from Firecrawl markdown output
 */
function parseFirecrawlMarkdown(markdown: string): Array<{
  name: string;
  date: string | null;
  time: string | null;
  location: string | null;
  url: string;
  imageUrl: string | null;
  category: "hackathon" | "non-hackathon";
  source: string;
}> {
  const events: Array<{
    name: string;
    date: string | null;
    time: string | null;
    location: string | null;
    url: string;
    imageUrl: string | null;
    category: "hackathon" | "non-hackathon";
    source: string;
  }> = [];
  
  const lines = markdown.split('\n');
  let currentDate: string | null = null;
  
  const monthMap: Record<string, string> = {
    'Dec': 'December', 'Jan': 'January', 'Feb': 'February',
    'Mar': 'March', 'Apr': 'April', 'May': 'May', 'Jun': 'June',
    'Jul': 'July', 'Aug': 'August', 'Sep': 'September',
    'Oct': 'October', 'Nov': 'November'
  };
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Check for date headers (Dec 5, Jan 6, 2026, etc.)
    const dateMatch = line.match(/^(Dec|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov) (\d+)(?:, (\d{4}))?/);
    if (dateMatch) {
      const monthAbbr = dateMatch[1];
      const day = dateMatch[2];
      const year = dateMatch[3] || "2025";
      currentDate = `${monthMap[monthAbbr]} ${day}, ${year}`;
      continue;
    }
    
    // Check for event links
    const linkMatch = line.match(/\[([^\]]+)\]\(https:\/\/luma\.com\/([^\)]+)\)/);
    if (linkMatch) {
      const eventName = linkMatch[1].trim();
      const eventSlug = linkMatch[2].trim();
      
      // Skip non-event links
      if (eventSlug.toLowerCase().includes('map') || eventName.length < 3) {
        continue;
      }
      
      const eventUrl = `https://luma.com/${eventSlug}`;
      
      // Look for image URL in nearby lines
      let imageUrl: string | null = null;
      for (let j = Math.max(0, i - 2); j < Math.min(i + 5, lines.length); j++) {
        const imgMatch = lines[j].match(/!\[.*?\]\((https:\/\/images\.lumacdn\.com[^\)]+)\)/);
        if (imgMatch) {
          imageUrl = imgMatch[1];
          break;
        }
      }
      
      // Look ahead for time, location, and category
      let time: string | null = null;
      let location: string | null = null;
      let category: "hackathon" | "non-hackathon" = "non-hackathon";
      
      for (let j = i + 1; j < Math.min(i + 15, lines.length); j++) {
        const nextLine = lines[j].trim();
        
        // Time pattern
        const timeMatch = nextLine.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        if (timeMatch && !time) {
          time = timeMatch[0];
        }
        
        // Location patterns
        if (!location) {
          const locationLines = lines.slice(Math.max(i, j - 2), Math.min(j + 3, lines.length))
            .map(l => l.trim()).join(' ');
          
          if (locationLines.includes('Encode Hub')) {
            location = 'Encode Hub';
          } else if (locationLines.includes('City & Guilds Building')) {
            location = 'City & Guilds Building';
          } else if (locationLines.includes('UCL BaseKX')) {
            location = 'UCL BaseKX';
          } else if (locationLines.includes('London, England') || 
                     (locationLines.includes('London') && locationLines.includes('England'))) {
            location = 'London, England';
          } else if (locationLines.includes('Hammersmith International Centre')) {
            location = 'Hammersmith International Centre';
          } else if (locationLines.includes('Techspace Goswell Road')) {
            location = 'Techspace Goswell Road';
          } else if (locationLines.includes('The Ministry')) {
            location = "The Ministry, Borough | Workspace & Members' Club | South London";
          } else if (locationLines.includes('Manchester, England')) {
            location = 'Manchester, England';
          } else if (locationLines.includes('London (Register')) {
            location = 'London (Register to see actual location)';
          }
        }
        
        // Category
        if (nextLine.includes('Hackathon') && !nextLine.includes('Non-Hackathon')) {
          category = 'hackathon';
        } else if (nextLine.includes('Non-Hackathon') || 
                   (nextLine.includes('Non') && nextLine.includes('Hackathon'))) {
          category = 'non-hackathon';
        }
      }
      
      // Default category based on name
      if (category === "non-hackathon" && eventName.toLowerCase().includes('hackathon')) {
        category = 'hackathon';
      }
      
      events.push({
        name: eventName,
        date: currentDate,
        time,
        location,
        url: eventUrl,
        imageUrl,
        category,
        source: "luma"
      });
    }
  }
  
  return events;
}

/**
 * Action that uses Firecrawl API to scrape Luma calendar and update Convex database
 * 
 * This should be called by the scheduled function daily at 00:00 GMT
 * 
 * Requires FIRECRAWL_API_KEY environment variable to be set in Convex dashboard
 */
export const scrapeWithFirecrawl = internalAction({
  args: {},
  handler: async (ctx) => {
    const lumaUrl = "https://luma.com/thehackcollective?k=c";
    
    console.log(`[${new Date().toISOString()}] Starting Firecrawl scrape for ${lumaUrl}`);
    
    // Get Firecrawl API key from environment
    const firecrawlApiKey = process.env.FIRECRAWL_API_KEY;
    if (!firecrawlApiKey) {
      console.error("FIRECRAWL_API_KEY is not set in Convex environment variables.");
      return { 
        success: false, 
        message: "FIRECRAWL_API_KEY missing. Set it in Convex dashboard under Settings > Environment Variables" 
      };
    }
    
    try {
      // Initialize Firecrawl client (using v1 API)
      const app = new FirecrawlAppV1({ apiKey: firecrawlApiKey });
      
      // Scrape the Luma calendar page
      const result = await app.scrapeUrl(lumaUrl, {
        formats: ["markdown"],
        onlyMainContent: true,
      });
      
      if (!result.markdown) {
        console.error("No markdown content returned from Firecrawl");
        return { success: false, message: "No content scraped" };
      }
      
      console.log(`Scraped ${result.markdown.length} characters of markdown`);
      
      // Parse events from markdown
      const events = parseFirecrawlMarkdown(result.markdown);
      console.log(`Parsed ${events.length} events from markdown`);
      
      // Clear old events
      await ctx.runMutation(internal.events.clearAll);
      console.log("Cleared old events");
      
      // Insert new events
      let inserted = 0;
      for (const event of events) {
        await ctx.runMutation(internal.events.upsert, {
          name: event.name,
          date: event.date,
          time: event.time,
          location: event.location,
          url: event.url,
          imageUrl: event.imageUrl,
          category: event.category,
          source: event.source,
        });
        inserted++;
      }
      
      console.log(`Successfully inserted ${inserted} events`);
      
      return { 
        success: true, 
        message: `Scraped and inserted ${inserted} events`, 
        timestamp: Date.now(),
        eventsCount: inserted
      };
    } catch (error: any) {
      console.error("Error during Firecrawl scrape:", error);
      return { 
        success: false, 
        message: `Scraping failed: ${error.message || String(error)}` 
      };
    }
  },
});

