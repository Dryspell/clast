import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ---------------------------------------------------------------------------
// Core (default-runtime) DB operations for env vars. These contain no Node.js-
// specific code so they can run in Convex queries/mutations.
// ---------------------------------------------------------------------------

export const upsertEnvVar = mutation({
  args: {
    ownerId: v.id("users"),
    key: v.string(),
    value: v.string(), // already encrypted
  },
  handler: async (ctx, { ownerId, key, value }) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("env_vars")
      .withIndex("owner_key", (q) => q.eq("ownerId", ownerId).eq("key", key))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { value, updatedAt: now });
      return existing._id;
    }
    return await ctx.db.insert("env_vars", {
      ownerId,
      key,
      value,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const removeEnvVar = mutation({
  args: {
    ownerId: v.id("users"),
    key: v.string(),
  },
  handler: async (ctx, { ownerId, key }) => {
    const existing = await ctx.db
      .query("env_vars")
      .withIndex("owner_key", (q) => q.eq("ownerId", ownerId).eq("key", key))
      .unique();
    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});

export const listEnvVars = query({
  args: { ownerId: v.id("users") },
  handler: async (ctx, { ownerId }) => {
    const vars = await ctx.db
      .query("env_vars")
      .withIndex("by_owner", (q) => q.eq("ownerId", ownerId))
      .collect();
    return vars.map((v) => ({ key: v.key, updatedAt: v.updatedAt }));
  },
});

export const getEnvVarRaw = query({
  args: { ownerId: v.id("users"), key: v.string() },
  handler: async (ctx, { ownerId, key }) => {
    const row = await ctx.db
      .query("env_vars")
      .withIndex("owner_key", (q) => q.eq("ownerId", ownerId).eq("key", key))
      .unique();
    return row ? row.value : null;
  },
}); 