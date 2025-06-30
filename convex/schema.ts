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

    // Auth.js fields
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    emailVerified: v.optional(v.number()),
    image: v.optional(v.string()),
  }).index("by_authId", ["authId"]).index("by_anonId", ["anonId"]).index("email", ["email"]),

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

  // Accounts table maps OAuth accounts to users
  accounts: defineTable({
    userId: v.id("users"),
    type: v.union(
      v.literal("email"),
      v.literal("oidc"),
      v.literal("oauth"),
      v.literal("webauthn")
    ),
    provider: v.string(),
    providerAccountId: v.string(),
    refresh_token: v.optional(v.string()),
    access_token: v.optional(v.string()),
    expires_at: v.optional(v.number()),
    token_type: v.optional(v.string()),
    scope: v.optional(v.string()),
    id_token: v.optional(v.string()),
    session_state: v.optional(v.string()),
  })
    .index("providerAndAccountId", ["provider", "providerAccountId"])
    .index("userId", ["userId"]),

  // Auth.js sessions (stateless or database stored)
  sessions: defineTable({
    userId: v.id("users"),
    expires: v.number(),
    sessionToken: v.string(),
  })
    .index("sessionToken", ["sessionToken"])
    .index("userId", ["userId"]),

  // Email / phone verification tokens
  verificationTokens: defineTable({
    identifier: v.string(),
    token: v.string(),
    expires: v.number(),
  }).index("identifierToken", ["identifier", "token"]),

  // FIDO/WebAuthn authenticators (optional, used for Passkeys)
  authenticators: defineTable({
    credentialID: v.string(),
    userId: v.id("users"),
    providerAccountId: v.string(),
    credentialPublicKey: v.string(),
    counter: v.number(),
    credentialDeviceType: v.string(),
    credentialBackedUp: v.boolean(),
    transports: v.optional(v.string()),
  })
    .index("userId", ["userId"])
    .index("credentialID", ["credentialID"]),
});

export const userSchema = {
  // CLAST user attributes
  authId: v.optional(v.string()),
  anonId: v.optional(v.string()),
  displayName: v.optional(v.string()),
  anonymous: v.boolean(),
  createdAt: v.number(),
  // Auth.js fields
  email: v.optional(v.string()),
  name: v.optional(v.string()),
  emailVerified: v.optional(v.number()),
  image: v.optional(v.string()),
};

export const sessionSchema = {
  userId: v.id("users"),
  expires: v.number(),
  sessionToken: v.string(),
};

export const accountSchema = {
  userId: v.id("users"),
  type: v.union(
    v.literal("email"),
    v.literal("oidc"),
    v.literal("oauth"),
    v.literal("webauthn")
  ),
  provider: v.string(),
  providerAccountId: v.string(),
  refresh_token: v.optional(v.string()),
  access_token: v.optional(v.string()),
  expires_at: v.optional(v.number()),
  token_type: v.optional(v.string()),
  scope: v.optional(v.string()),
  id_token: v.optional(v.string()),
  session_state: v.optional(v.string()),
};

export const verificationTokenSchema = {
  identifier: v.string(),
  token: v.string(),
  expires: v.number(),
};

export const authenticatorSchema = {
  credentialID: v.string(),
  userId: v.id("users"),
  providerAccountId: v.string(),
  credentialPublicKey: v.string(),
  counter: v.number(),
  credentialDeviceType: v.string(),
  credentialBackedUp: v.boolean(),
  transports: v.optional(v.string()),
}; 