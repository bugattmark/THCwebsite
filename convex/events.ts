import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Query all events, sorted by date
export const list = query({
  args: {},
  handler: async (ctx) => {
    const events = await ctx.db
      .query("events")
      .collect();
    
    // Sort by date (most recent first, then by time)
    return events.sort((a, b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;
      
      // Try to parse dates
      try {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB.getTime() - dateA.getTime();
      } catch {
        return a.date.localeCompare(b.date);
      }
    });
  },
});

// Query events by category
export const listByCategory = query({
  args: { category: v.union(v.literal("hackathon"), v.literal("non-hackathon")) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("events")
      .withIndex("by_category", (q) => q.eq("category", args.category))
      .order("desc")
      .collect();
  },
});

// Upsert event (insert or update)
export const upsert = mutation({
  args: {
    name: v.string(),
    date: v.union(v.string(), v.null()),
    time: v.union(v.string(), v.null()),
    location: v.union(v.string(), v.null()),
    url: v.string(),
    imageUrl: v.union(v.string(), v.null()),
    category: v.union(v.literal("hackathon"), v.literal("non-hackathon")),
    source: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if event with this URL already exists
    const existing = await ctx.db
      .query("events")
      .withIndex("by_url", (q) => q.eq("url", args.url))
      .first();

    if (existing) {
      // Update existing event
      await ctx.db.patch(existing._id, {
        name: args.name,
        date: args.date,
        time: args.time,
        location: args.location,
        imageUrl: args.imageUrl,
        category: args.category,
        source: args.source,
        scrapedAt: Date.now(),
      });
      return existing._id;
    } else {
      // Insert new event
      return await ctx.db.insert("events", {
        name: args.name,
        date: args.date,
        time: args.time,
        location: args.location,
        url: args.url,
        imageUrl: args.imageUrl,
        category: args.category,
        source: args.source,
        scrapedAt: Date.now(),
      });
    }
  },
});

// Clear all events (for fresh scrape)
export const clearAll = mutation({
  args: {},
  handler: async (ctx) => {
    const events = await ctx.db.query("events").collect();
    for (const event of events) {
      await ctx.db.delete(event._id);
    }
    return events.length;
  },
});

