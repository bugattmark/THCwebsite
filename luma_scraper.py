#!/usr/bin/env python3
"""
Luma Event Scraper

Scrapes events from lu.ma / luma.com pages using Playwright for JS rendering.
"""

import asyncio
import json
import re
from dataclasses import dataclass
from datetime import datetime
from typing import Optional


@dataclass
class LumaEvent:
    name: str
    date: Optional[str]
    time: Optional[str]
    location: Optional[str]
    url: str

    def __str__(self):
        parts = [f"📅 {self.name}"]
        if self.date:
            parts.append(f"   Date: {self.date}")
        if self.time:
            parts.append(f"   Time: {self.time}")
        if self.location:
            parts.append(f"   Location: {self.location}")
        parts.append(f"   URL: {self.url}")
        return "\n".join(parts)


class LumaScraper:
    BASE_URL = "https://lu.ma"

    async def scrape_discover_page(self, path: str) -> list[str]:
        """Scrape a discover page to find calendar links."""
        from playwright.async_api import async_playwright

        calendars = []
        url = f"{self.BASE_URL}/{path}"

        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()

            try:
                await page.goto(url, wait_until="networkidle", timeout=30000)
                await page.wait_for_timeout(2000)

                # Scroll to load more
                for _ in range(3):
                    await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
                    await page.wait_for_timeout(1000)

                # Extract calendar links
                calendars = await page.evaluate("""
                    () => {
                        const links = [];
                        document.querySelectorAll('a[href]').forEach(a => {
                            const href = a.getAttribute('href');
                            // Look for calendar links (not event links which have evt-)
                            if (href && href.startsWith('/') &&
                                !href.includes('evt-') &&
                                !href.includes('signin') &&
                                !href.includes('pricing') &&
                                !href.includes('create') &&
                                !href.includes('discover') &&
                                !href.includes('?') &&
                                href.length > 2 && href.length < 50) {
                                links.push(href.substring(1));  // Remove leading /
                            }
                        });
                        return [...new Set(links)];
                    }
                """)

            except Exception as e:
                print(f"Error: {e}")
            finally:
                await browser.close()

        return calendars

    async def scrape_page(self, path: str, scroll_count: int = 5) -> list[LumaEvent]:
        """Scrape events from a Luma page using Playwright."""
        from playwright.async_api import async_playwright

        events = []
        url = f"{self.BASE_URL}/{path}"

        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()

            try:
                print(f"Loading {url}...")
                await page.goto(url, wait_until="networkidle", timeout=30000)

                # Wait for content to load
                await page.wait_for_timeout(2000)

                # Scroll down to load more events (for infinite scroll pages)
                for i in range(scroll_count):
                    await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
                    await page.wait_for_timeout(1000)

                # Extract events from the page
                events = await self._extract_events(page)

            except Exception as e:
                print(f"Error: {e}")
            finally:
                await browser.close()

        return events

    async def _extract_events(self, page) -> list[LumaEvent]:
        """Extract events from the loaded page."""
        events = []

        # Try to get data from Next.js data script first
        try:
            next_data = await page.evaluate("""
                () => {
                    const script = document.getElementById('__NEXT_DATA__');
                    if (script) return JSON.parse(script.textContent);
                    return null;
                }
            """)
            if next_data:
                events.extend(self._parse_next_data(next_data))
        except Exception:
            pass

        # Also try to extract from DOM
        dom_events = await page.evaluate("""
            () => {
                const events = [];

                // Find event cards - Luma uses various class patterns
                const cards = document.querySelectorAll('[class*="event"], [class*="card"], a[href^="/"]');

                cards.forEach(card => {
                    // Skip navigation links
                    const href = card.getAttribute('href') || '';
                    if (href.includes('signin') || href.includes('pricing') ||
                        href.includes('create') || href.includes('discover') ||
                        href === '/' || !href.startsWith('/')) return;

                    // Look for event info
                    const titleEl = card.querySelector('h1, h2, h3, h4, [class*="title"], [class*="name"]');
                    const dateEl = card.querySelector('[class*="date"], [class*="time"], time');
                    const locationEl = card.querySelector('[class*="location"], [class*="address"], [class*="venue"]');

                    // Get text content
                    let title = titleEl ? titleEl.textContent.trim() : card.textContent.trim().split('\\n')[0];

                    // Skip if no meaningful title
                    if (!title || title.length < 3 || title.length > 200) return;

                    events.push({
                        name: title,
                        date: dateEl ? dateEl.textContent.trim() : null,
                        location: locationEl ? locationEl.textContent.trim() : null,
                        url: href
                    });
                });

                // Dedupe by URL
                const seen = new Set();
                return events.filter(e => {
                    if (seen.has(e.url)) return false;
                    seen.add(e.url);
                    return true;
                });
            }
        """)

        for e in dom_events:
            events.append(LumaEvent(
                name=e["name"],
                date=e.get("date"),
                time=None,
                location=e.get("location"),
                url=f"https://lu.ma{e['url']}"
            ))

        return events

    def _parse_next_data(self, data: dict) -> list[LumaEvent]:
        """Parse Next.js page data for events."""
        events = []

        def find_events(obj, depth=0):
            if depth > 15:
                return

            if isinstance(obj, dict):
                # Check if this looks like an event
                if "name" in obj and any(k in obj for k in ["start_at", "event_start", "start_time", "date"]):
                    event = self._json_to_event(obj)
                    if event.name and len(event.name) > 3:
                        events.append(event)

                # Check for events array
                if "events" in obj and isinstance(obj["events"], list):
                    for event in obj["events"]:
                        if isinstance(event, dict):
                            if "event" in event:
                                events.append(self._json_to_event(event["event"]))
                            else:
                                events.append(self._json_to_event(event))

                # Check for featured_items or similar
                for key in ["featured_items", "items", "data", "results"]:
                    if key in obj and isinstance(obj[key], list):
                        for item in obj[key]:
                            find_events(item, depth + 1)

                # Recurse into dict values
                for value in obj.values():
                    find_events(value, depth + 1)

            elif isinstance(obj, list):
                for item in obj:
                    find_events(item, depth + 1)

        find_events(data)
        return events

    def _json_to_event(self, data: dict) -> LumaEvent:
        """Convert JSON event data to LumaEvent."""
        name = data.get("name", "Unknown Event")

        # Parse date/time
        date_str = None
        time_str = None
        start_at = data.get("start_at") or data.get("event_start") or data.get("start_time")

        if start_at:
            try:
                if isinstance(start_at, str):
                    dt = datetime.fromisoformat(start_at.replace("Z", "+00:00"))
                    date_str = dt.strftime("%B %d, %Y")
                    time_str = dt.strftime("%I:%M %p")
            except (ValueError, TypeError):
                date_str = str(start_at)

        # Get location
        location = None
        if "geo_address_info" in data:
            geo = data["geo_address_info"]
            if isinstance(geo, dict):
                location = geo.get("full_address") or geo.get("address")
        elif "location" in data:
            location = data["location"]
        elif "address" in data:
            location = data["address"]

        # Build URL
        api_id = data.get("api_id") or data.get("id") or data.get("slug") or data.get("url")
        if api_id and not api_id.startswith("http"):
            url = f"https://lu.ma/{api_id}"
        elif api_id:
            url = api_id
        else:
            url = ""

        return LumaEvent(
            name=name,
            date=date_str,
            time=time_str,
            location=location,
            url=url
        )


def dedupe_events(events: list[LumaEvent]) -> list[LumaEvent]:
    """Remove duplicate events based on URL."""
    seen = set()
    unique = []
    for event in events:
        # Extract the event ID from URL
        url_key = event.url.split("?")[0]  # Remove query params
        if url_key not in seen and not any(x in url_key for x in ["signin", "pricing", "create", "?k=t", "?k=c"]):
            # Skip if it's just a calendar link, not an actual event
            if "/evt-" in url_key or (event.date and event.time):
                seen.add(url_key)
                unique.append(event)
    return unique


async def main():
    import sys

    scraper = LumaScraper()

    # Get targets from command line or default
    targets = sys.argv[1:] if len(sys.argv) > 1 else ["london"]

    # Known discover/category pages that need special handling
    DISCOVER_PAGES = {"tech", "crypto", "ai", "design", "music", "sports", "food", "wellness"}

    print("=" * 60)
    print("LUMA EVENT SCRAPER")
    print("=" * 60)

    all_events = []
    calendars_to_scrape = []

    for target in targets:
        if target.lower() in DISCOVER_PAGES:
            print(f"\n[{target}] is a discover page, finding calendars...")
            calendars = await scraper.scrape_discover_page(target)
            # Filter out map/category pages
            calendars = [c for c in calendars if not c.startswith("category/") and "/" not in c]
            print(f"  Found {len(calendars)} calendars: {calendars[:5]}...")
            # Take first 5 calendars to scrape
            calendars_to_scrape.extend(calendars[:5])
        else:
            calendars_to_scrape.append(target)

    # Scrape all calendars
    for cal in calendars_to_scrape:
        print(f"\nScraping luma.com/{cal}...")
        print("-" * 40)

        events = await scraper.scrape_page(cal)
        print(f"  Found {len(events)} raw events")
        all_events.extend(events)

    # Dedupe all events
    all_events = dedupe_events(all_events)

    # Sort by date
    def sort_key(e):
        if e.date:
            try:
                return datetime.strptime(e.date, "%B %d, %Y")
            except ValueError:
                pass
        return datetime.max

    all_events.sort(key=sort_key)

    print("\n" + "=" * 60)
    print(f"TOTAL: {len(all_events)} unique events")
    print("=" * 60 + "\n")

    for i, event in enumerate(all_events, 1):
        print(f"{i}. {event}")
        print()

    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
