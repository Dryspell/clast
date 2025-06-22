import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

export const ensure = mutation({
  args: { anonId: v.optional(v.string()) },
  handler: async (ctx, { anonId }): Promise<Id<"users">> => {
    // 1. Check if we have an authenticated user
    const identity = await ctx.auth.getUserIdentity();
    if (identity) {
      // Lookup existing row by authId
      const existing = await ctx.db
        .query("users")
        .withIndex("by_authId", (q) => q.eq("authId", identity.subject))
        .unique();
      if (existing) return existing._id;

      return await ctx.db.insert("users", {
        authId: identity.subject,
        displayName: identity.name,
        anonymous: false,
        createdAt: Date.now(),
      });
    }

    // 2. Anonymous flow – ensure anonId present
    if (!anonId) throw new Error("anonId required for anonymous bootstrap");

    const existingAnon = await ctx.db
      .query("users")
      .withIndex("by_anonId", (q) => q.eq("anonId", anonId))
      .unique();
    if (existingAnon) return existingAnon._id;

    return await ctx.db.insert("users", {
      anonId,
      anonymous: true,
      createdAt: Date.now(),
    });
  },
}); 