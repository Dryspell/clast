import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

export const upsert = mutation({
  args: {
    id: v.optional(v.id("flow_nodes")),
    flowId: v.id("flows"),
    type: v.string(),
    data: v.any(),
    x: v.float64(),
    y: v.float64(),
  },
  handler: async (ctx, { id, flowId, type, data, x, y }): Promise<Id<"flow_nodes">> => {
    if (id) {
      await ctx.db.patch(id, { data, x, y, type, lastTouched: Date.now() });
      return id;
    }
    return await ctx.db.insert("flow_nodes", {
      flowId,
      type,
      data,
      x,
      y,
      lastTouched: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { id: v.id("flow_nodes") },
  handler: async (ctx, { id }) => {
    // First delete any edges that reference this node
    const edgesToDelete = await ctx.db
      .query("flow_edges")
      .withIndex("by_flow", (q) => q) // scan by index then filter (no composite index available)
      .collect();
    for (const e of edgesToDelete) {
      if (e.source === id || e.target === id) {
        await ctx.db.delete(e._id);
      }
    }

    // Then delete the node itself
    await ctx.db.delete(id);
  },
});

export const listByFlow = query({
  args: { flowId: v.id("flows") },
  handler: async (ctx, { flowId }) => {
    return ctx.db
      .query("flow_nodes")
      .withIndex("by_flow", (q) => q.eq("flowId", flowId))
      .collect();
  },
}); 