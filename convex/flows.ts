import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

export const create = mutation({
  args: {
    ownerId: v.id("users"),
    title: v.string(),
  },
  handler: async (ctx, { ownerId, title }): Promise<Id<"flows">> => {
    return await ctx.db.insert("flows", {
      ownerId,
      title,
      lastEdited: Date.now(),
    });
  },
});

export const listMine = query({
  args: { ownerId: v.id("users") },
  handler: async (ctx, { ownerId }) => {
    return ctx.db
      .query("flows")
      .withIndex("by_owner", (q) => q.eq("ownerId", ownerId))
      .order("desc")
      .collect();
  },
});

export const rename = mutation({
  args: { flowId: v.id("flows"), title: v.string() },
  handler: async (ctx, { flowId, title }) => {
    await ctx.db.patch(flowId, { title, lastEdited: Date.now() });
  },
});

export const updatePreview = mutation({
  args: { flowId: v.id("flows"), code: v.string() },
  handler: async (ctx, { flowId, code }) => {
    await ctx.db.patch(flowId, { codePreview: code, lastEdited: Date.now() });
  },
});

export const remove = mutation({
  args: { flowId: v.id("flows") },
  handler: async (ctx, { flowId }) => {
    // Delete child nodes/edges first (no cascade yet)
    const nodes = await ctx.db
      .query("flow_nodes")
      .withIndex("by_flow", (q) => q.eq("flowId", flowId))
      .collect();
    for (const n of nodes) await ctx.db.delete(n._id);

    const edges = await ctx.db
      .query("flow_edges")
      .withIndex("by_flow", (q) => q.eq("flowId", flowId))
      .collect();
    for (const e of edges) await ctx.db.delete(e._id);

    await ctx.db.delete(flowId);
  },
}); 