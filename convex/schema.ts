import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  events: defineTable({
    name: v.string(),
    date: v.union(v.string(), v.null()),
    time: v.union(v.string(), v.null()),
    location: v.union(v.string(), v.null()),
    url: v.string(),
    imageUrl: v.union(v.string(), v.null()),
    category: v.union(v.literal("hackathon"), v.literal("non-hackathon")),
    source: v.string(),
    scrapedAt: v.number(),
  })
    .index("by_date", ["date"])
    .index("by_category", ["category"])
    .index("by_url", ["url"]),
});

