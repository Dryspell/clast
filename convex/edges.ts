import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

export const upsert = mutation({
  args: {
    id: v.optional(v.id("flow_edges")),
    flowId: v.id("flows"),
    source: v.id("flow_nodes"),
    sourceHandle: v.optional(v.string()),
    target: v.id("flow_nodes"),
    targetHandle: v.optional(v.string()),
    data: v.any(),
  },
  handler: async (ctx, { id, ...rest }): Promise<Id<"flow_edges">> => {
    if (id) {
      await ctx.db.patch(id, { ...rest, lastTouched: Date.now() });
      return id;
    }
    return await ctx.db.insert("flow_edges", { ...rest, lastTouched: Date.now() });
  },
});

export const remove = mutation({
  args: { id: v.id("flow_edges") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});

export const listByFlow = query({
  args: { flowId: v.id("flows") },
  handler: async (ctx, { flowId }) => {
    return ctx.db
      .query("flow_edges")
      .withIndex("by_flow", (q) => q.eq("flowId", flowId))
      .collect();
  },
}); 