import { customMutation, customQuery } from "convex-helpers/server/customFunctions";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  userSchema,
  sessionSchema,
  accountSchema,
  verificationTokenSchema,
  authenticatorSchema,
} from "./schema";

/*
  ---------------------------------------------------------------------------
  Convex portion of the Auth.js Adapter.
  Each exported function below maps 1-to-1 to a required method on the
  Auth.js `Adapter` interface. These are invoked via the Next.js runtime
  through a thin client-side wrapper (see `src/lib/ConvexAdapter.ts`).

  All endpoints are wrapped with the `customMutation/customQuery` helpers that
  enforce a shared secret so *only* the Next.js server can call them.
  ---------------------------------------------------------------------------
*/

const adapterQuery = customQuery(query, {
  args: { secret: v.string() },
  input: async (_ctx, { secret }) => {
    checkSecret(secret);
    return { ctx: {}, args: {} };
  },
});

const adapterMutation = customMutation(mutation, {
  args: { secret: v.string() },
  input: async (_ctx, { secret }) => {
    checkSecret(secret);
    return { ctx: {}, args: {} };
  },
});

function checkSecret(secret: string) {
  if (process.env.CONVEX_AUTH_ADAPTER_SECRET === undefined) {
    throw new Error(
      "Missing CONVEX_AUTH_ADAPTER_SECRET Convex environment variable",
    );
  }
  if (secret !== process.env.CONVEX_AUTH_ADAPTER_SECRET) {
    throw new Error("Adapter API called without correct secret value");
  }
}

// ---------------- Users ----------------
export const createUser = adapterMutation({
  args: { user: v.any() },
  handler: async (ctx, { user }) => {
    const now = Date.now();
    const completeUser: any = { ...user };
    if (completeUser.anonymous === undefined) completeUser.anonymous = false;
    if (completeUser.createdAt === undefined) completeUser.createdAt = now;
    return await ctx.db.insert("users", completeUser);
  },
});

export const getUser = adapterQuery({
  args: { id: v.id("users") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

export const getUserByEmail = adapterQuery({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    return await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .unique();
  },
});

export const deleteUser = adapterMutation({
  args: { id: v.id("users") },
  handler: async (ctx, { id }) => {
    const user = await ctx.db.get(id);
    if (user === null) return null;

    await ctx.db.delete(id);

    // cascade delete sessions & accounts
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("userId", (q) => q.eq("userId", id))
      .collect();
    for (const s of sessions) await ctx.db.delete(s._id);

    const accounts = await ctx.db
      .query("accounts")
      .withIndex("userId", (q) => q.eq("userId", id))
      .collect();
    for (const a of accounts) await ctx.db.delete(a._id);

    return user;
  },
});

export const updateUser = adapterMutation({
  args: { id: v.id("users"), user: v.any() },
  handler: async (ctx, { id, user }) => {
    await ctx.db.patch(id, user);
    return await ctx.db.get(id);
  },
});

// ---------------- Accounts ----------------
export const linkAccount = adapterMutation({
  args: { account: v.any() },
  handler: async (ctx, { account }) => {
    return await ctx.db.insert("accounts", account);
  },
});

export const unlinkAccount = adapterMutation({
  args: { provider: v.string(), providerAccountId: v.string() },
  handler: async (ctx, { provider, providerAccountId }) => {
    const account = await ctx.db
      .query("accounts")
      .withIndex("providerAndAccountId", (q) =>
        q.eq("provider", provider).eq("providerAccountId", providerAccountId),
      )
      .unique();
    if (account) {
      await ctx.db.delete(account._id);
    }
    return account;
  },
});

export const getAccount = adapterQuery({
  args: { provider: v.string(), providerAccountId: v.string() },
  handler: async (ctx, { provider, providerAccountId }) => {
    return await ctx.db
      .query("accounts")
      .withIndex("providerAndAccountId", (q) =>
        q.eq("provider", provider).eq("providerAccountId", providerAccountId),
      )
      .unique();
  },
});

// ---------------- Sessions ----------------
export const createSession = adapterMutation({
  args: { session: v.any() },
  handler: async (ctx, { session }) => {
    return await ctx.db.insert("sessions", session);
  },
});

export const getSessionAndUser = adapterQuery({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("sessionToken", (q) => q.eq("sessionToken", sessionToken))
      .unique();
    if (session === null) return null;
    const user = await ctx.db.get(session.userId);
    if (user === null) return null;
    return { session, user };
  },
});

export const updateSession = adapterMutation({
  args: { sessionToken: v.string(), session: v.any() },
  handler: async (ctx, { sessionToken, session }) => {
    const existing = await ctx.db
      .query("sessions")
      .withIndex("sessionToken", (q) => q.eq("sessionToken", sessionToken))
      .unique();
    if (!existing) return null;
    await ctx.db.patch(existing._id, session);
    return await ctx.db.get(existing._id);
  },
});

export const deleteSession = adapterMutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("sessionToken", (q) => q.eq("sessionToken", sessionToken))
      .unique();
    if (session === null) return null;
    await ctx.db.delete(session._id);
    return session;
  },
});

// --------------- Verification Tokens ---------------
export const createVerificationToken = adapterMutation({
  args: { verificationToken: v.any() },
  handler: async (ctx, { verificationToken }) => {
    return await ctx.db.insert("verificationTokens", verificationToken);
  },
});

export const useVerificationToken = adapterMutation({
  args: { identifier: v.string(), token: v.string() },
  handler: async (ctx, { identifier, token }) => {
    const vt = await ctx.db
      .query("verificationTokens")
      .withIndex("identifierToken", (q) => q.eq("identifier", identifier).eq("token", token))
      .unique();
    if (vt === null) return null;
    await ctx.db.delete(vt._id);
    return vt;
  },
});

// --------------- Authenticators (WebAuthn) ---------------
export const createAuthenticator = adapterMutation({
  args: { authenticator: v.any() },
  handler: async (ctx, { authenticator }) => {
    return await ctx.db.insert("authenticators", authenticator);
  },
});

export const getAuthenticator = adapterQuery({
  args: { credentialID: v.string() },
  handler: async (ctx, { credentialID }) => {
    return await ctx.db
      .query("authenticators")
      .withIndex("credentialID", (q) => q.eq("credentialID", credentialID))
      .unique();
  },
});

// ---------------- Additional helpers (WebAuthn & account lookups) ----------------
export const getUserByAccount = adapterQuery({
  args: { provider: v.string(), providerAccountId: v.string() },
  handler: async (ctx, { provider, providerAccountId }) => {
    const account = await ctx.db
      .query("accounts")
      .withIndex("providerAndAccountId", (q) =>
        q.eq("provider", provider).eq("providerAccountId", providerAccountId),
      )
      .unique();
    if (account === null) return null;
    return await ctx.db.get(account.userId);
  },
});

export const listAuthenticatorsByUserId = adapterQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("authenticators")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const updateAuthenticatorCounter = adapterMutation({
  args: { credentialID: v.string(), newCounter: v.number() },
  handler: async (ctx, { credentialID, newCounter }) => {
    const authenticator = await ctx.db
      .query("authenticators")
      .withIndex("credentialID", (q) => q.eq("credentialID", credentialID))
      .unique();
    if (authenticator === null) return null;
    await ctx.db.patch(authenticator._id, { counter: newCounter });
    return { ...authenticator, counter: newCounter };
  },
}); 