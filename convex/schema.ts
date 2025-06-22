import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Convex database schema for CLAST
// See https://docs.convex.dev/using/schemas for details.
// Any change here requires running `npx convex dev` (or redeploy) so the CLI
// can regenerate typed APIs for the client and server.
export default defineSchema({
  // Visitor or account records. A row is created the first time someone opens the app.
  users: defineTable({
    // If the user is logged in via 3rd-party auth, we store the provider subject.
    authId: v.optional(v.string()),

    // Anonymous browser identifier saved in localStorage.
    anonId: v.optional(v.string()),

    displayName: v.optional(v.string()),
    anonymous: v.boolean(),
    createdAt: v.number(),
  }).index("by_authId", ["authId"]).index("by_anonId", ["anonId"]),

  // A top-level visual flow (diagram).
  flows: defineTable({
    ownerId: v.id("users"),
    title: v.string(),
    lastEdited: v.number(),
    codePreview: v.optional(v.string()), // cached generated code
  }).index("by_owner", ["ownerId"]),

  // Individual nodes within a flow.
  flow_nodes: defineTable({
    flowId: v.id("flows"),
    type: v.string(),
    data: v.any(), // arbitrary JSON payload (parameters, etc.)
    x: v.float64(),
    y: v.float64(),
    lastTouched: v.number(),
  }).index("by_flow", ["flowId"]),

  // Edges between nodes.
  flow_edges: defineTable({
    flowId: v.id("flows"),
    source: v.id("flow_nodes"),
    sourceHandle: v.optional(v.string()),
    target: v.id("flow_nodes"),
    targetHandle: v.optional(v.string()),
    data: v.any(),
    lastTouched: v.number(),
  }).index("by_flow", ["flowId"]),
}); 