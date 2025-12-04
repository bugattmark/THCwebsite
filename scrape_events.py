#!/usr/bin/env python3
"""
The Hack Collective - Luma Events Scraper

Automated scraper that uses Firecrawl MCP to scrape Luma calendar events.
This script is designed to be called by Convex scheduled functions or run manually.
The actual Firecrawl scraping happens via MCP tools in the Convex environment.

For manual testing, this script can parse Firecrawl markdown output.
"""

import json
import re
import os
import sys
from datetime import datetime
from typing import List, Dict, Optional


def parse_firecrawl_markdown(markdown_text: str) -> List[Dict]:
    """Parse events from Firecrawl markdown output."""
    events = []
    lines = markdown_text.split('\n')
    
    current_date = None
    current_time = None
    
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        
        # Check for date headers (Dec 5, Jan 6, 2026, etc.)
        date_match = re.match(r'(Dec|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov) (\d+)(?:, (\d{4}))?', line)
        if date_match:
            month_abbr = date_match.group(1)
            day = date_match.group(2)
            year = date_match.group(3) or "2025"
            
            month_map = {
                'Dec': 'December', 'Jan': 'January', 'Feb': 'February',
                'Mar': 'March', 'Apr': 'April', 'May': 'May', 'Jun': 'June',
                'Jul': 'July', 'Aug': 'August', 'Sep': 'September',
                'Oct': 'October', 'Nov': 'November'
            }
            current_date = f"{month_map[month_abbr]} {day}, {year}"
            i += 1
            continue
        
        # Check for event links
        link_match = re.search(r'\[([^\]]+)\]\(https://luma\.com/([^\)]+)\)', line)
        if link_match:
            event_name = link_match.group(1).strip()
            event_slug = link_match.group(2).strip()
            
            # Skip non-event links
            if 'map' in event_slug.lower() or len(event_name) < 3:
                i += 1
                continue
            
            event_url = f"https://luma.com/{event_slug}"
            
            # Look for image URL in nearby lines
            image_url = None
            for j in range(max(0, i-2), min(i+5, len(lines))):
                img_match = re.search(r'!\[.*?\]\((https://images\.lumacdn\.com[^\)]+)\)', lines[j])
                if img_match:
                    image_url = img_match.group(1)
                    break
            
            # Look ahead for time, location, and category
            time = None
            location = None
            category = None
            
            # Check next few lines for details
            for j in range(i+1, min(i+15, len(lines))):
                next_line = lines[j].strip()
                
                # Time pattern
                time_match = re.search(r'(\d{1,2}):(\d{2})\s*(AM|PM)', next_line)
                if time_match and not time:
                    time = time_match.group(0)
                
                # Location patterns - check multiple lines
                if not location:
                    location_lines = ' '.join([lines[k].strip() for k in range(max(i, j-2), min(j+3, len(lines)))])
                    
                    if 'Encode Hub' in location_lines:
                        location = 'Encode Hub'
                    elif 'City & Guilds Building' in location_lines:
                        location = 'City & Guilds Building'
                    elif 'UCL BaseKX' in location_lines:
                        location = 'UCL BaseKX'
                    elif 'London, England' in location_lines or ('London' in location_lines and 'England' in location_lines):
                        location = 'London, England'
                    elif 'Hammersmith International Centre' in location_lines:
                        location = 'Hammersmith International Centre'
                    elif 'Techspace Goswell Road' in location_lines:
                        location = 'Techspace Goswell Road'
                    elif 'The Ministry' in location_lines:
                        location = 'The Ministry, Borough | Workspace & Members\' Club | South London'
                    elif 'Manchester, England' in location_lines:
                        location = 'Manchester, England'
                    elif 'London (Register' in location_lines:
                        location = 'London (Register to see actual location)'
                
                # Category
                if 'Hackathon' in next_line and not category:
                    category = 'hackathon'
                elif 'Non-Hackathon' in next_line or ('Non' in next_line and 'Hackathon' in next_line):
                    category = 'non-hackathon'
            
            # Default category based on name
            if not category:
                category = 'hackathon' if 'hackathon' in event_name.lower() else 'non-hackathon'
            
            events.append({
                "name": event_name,
                "date": current_date,
                "time": time,
                "location": location,
                "url": event_url,
                "imageUrl": image_url,
                "category": category,
                "source": "luma"
            })
        
        i += 1
    
    return events


def main():
    """
    Main function - parses Firecrawl markdown output.
    
    Note: In production, this parsing logic is used by the Convex scheduled function
    which calls Firecrawl MCP to get the scraped data.
    """
    # This is a utility function for parsing Firecrawl output
    # The actual scraping and database operations happen in Convex
    print("Event parser utility - use Convex scheduled function for full automation")


if __name__ == "__main__":
    main()

