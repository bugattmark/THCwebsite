# The Hack Collective Website

The fastest source of info for public hackathon + tech events in London, compiled by The Hack Collective.

## Overview

This website provides a centralized platform for discovering hackathons and tech events in London. It features:

- **Interactive 3D Lanyard**: A physics-based 3D lanyard card with The Hack Collective logo
- **Event Tracker**: Real-time event listings from Luma calendar
- **Calendar View**: Visual calendar showing days with events
- **Map View**: Geographic visualization of event locations in London
- **Automated Scraping**: Daily automated event updates via Firecrawl MCP

## Tech Stack

- **Frontend**: React + TypeScript + Vite, Tailwind CSS v4, React Three Fiber (3D graphics)
- **Backend**: Convex (database and serverless functions)
- **Scraping**: Firecrawl MCP (automated daily at 00:00 GMT)
- **Deployment**: Vercel (frontend)

## Project Structure

```
hackcollective-website/
├── src/                  # React frontend application
│   ├── components/       # React components (Lanyard, Calendar, Map)
│   ├── pages/            # Page components (Landing, Tracker)
│   └── convex.ts         # Convex client configuration
├── public/               # Static assets
├── convex/               # Convex backend functions
│   ├── schema.ts         # Database schema
│   ├── events.ts         # Event queries and mutations
│   └── scheduled.ts      # Scheduled scraping function
├── docs/                 # Documentation
│   └── thc-doc.md        # THC mission and vision
├── scrape_events.py      # Event scraper (uses Firecrawl MCP)
└── requirements.txt       # Python dependencies
```

## Setup

### Prerequisites

- Node.js 18+
- Python 3.8+
- Convex account (free tier available)
- Firecrawl API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd hackcollective-website
   ```

2. **Set up Convex**
   ```bash
   npm install -g convex
   npx convex dev
   ```
   Follow the prompts to create a new Convex project or link to an existing one.

3. **Install frontend dependencies**
   ```bash
   npm install
   ```

4. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

5. **Set up environment variables**
   
   Create `.env.local` in the root directory:
   ```env
   VITE_CONVEX_URL=your-convex-url-here
   ```
   
   Set Firecrawl API key:
   ```bash
   export FIRECRAWL_API_KEY=your-firecrawl-api-key
   ```

### Running Locally

1. **Start Convex dev server**
   ```bash
   npx convex dev
   ```

2. **Start frontend dev server**
   ```bash
   npm run dev
   ```

3. **Run scraper manually** (optional)
   ```bash
   python3 scrape_events.py
   ```

## Automated Scraping

Events are automatically scraped daily at 00:00 GMT using Firecrawl API:

1. **Firecrawl API**: Scrapes `https://luma.com/thehackcollective?k=c` to get all event data including:
   - Event names, dates, times, locations
   - Correct Luma URLs (short slugs like `l8umo7yr`)
   - Event cover images from Luma CDN
   - Categories (hackathon vs non-hackathon)

2. **Convex Scheduled Function**: Automatically runs the scraping and stores events in the database
   - Function: `actions/scrapeWithFirecrawl:scrapeWithFirecrawl`
   - Schedule: Daily at 00:00 GMT (midnight UTC)
   - Configured in `convex/scheduled.ts` using Convex cronJobs

3. **Real-time Updates**: Frontend automatically reflects new events via Convex subscriptions

### Setting up Automated Scraping

1. **Get Firecrawl API Key**:
   - Sign up at https://www.firecrawl.dev
   - Get your API key from the dashboard

2. **Set Environment Variable in Convex**:
   ```bash
   # Using Convex CLI
   npx convex env set FIRECRAWL_API_KEY your-api-key-here
   ```
   
   Or via Convex Dashboard:
   - Go to https://dashboard.convex.dev
   - Navigate to **Settings** > **Environment Variables**
   - Add: `FIRECRAWL_API_KEY` = `your-api-key-here`
   - Save

3. **Deploy Convex**:
   ```bash
   npx convex deploy
   ```
   
   The scheduled function is automatically registered when you deploy.

4. **Test Manually** (optional):
   ```bash
   npx convex run actions/scrapeWithFirecrawl:scrapeWithFirecrawl
   ```

The cron job will automatically run every day at 00:00 GMT and update your events database.

## Features

### Event Tracker Page
- Sticky 3D lanyard on the left (stays visible while scrolling)
- Scrollable events list on the right
- Calendar component showing days with events
- Map component showing event locations
- Search and filter functionality
- List/Grid view toggle
- Responsive design for iPad and iPhone

### Landing Page
- Animated dither background
- Navigation links to WhatsApp, Luma, LinkedIn
- Call-to-action to view event tracker

## Deployment

### Frontend (Vercel)

1. Connect your GitHub repository to Vercel
2. Set environment variable: `VITE_CONVEX_URL`
3. Deploy

### Convex

Convex automatically deploys when you push to your repository. Make sure to:
1. Set up the scheduled function in Convex Dashboard
2. Configure Firecrawl MCP in your Convex environment

## Links

- **Luma Calendar**: https://luma.com/thehackcollective
- **WhatsApp Group**: https://chat.whatsapp.com/EWCPnquUzXD9uppsSuQFVk
- **LinkedIn**: https://www.linkedin.com/company/the-hack-collective

## Contributing

This is a community project. For contributions, please contact the maintainers.

## License

ISC

