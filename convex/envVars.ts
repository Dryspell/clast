'use node';
import { action } from "./_generated/server";
import { v } from "convex/values";
import * as crypto from "crypto";

/*
  Node-runtime actions for secure environment variables. These are the only
  functions exported from this module, so the default-runtime code continues to
  live in `envVarsCore.ts`.
*/

function checkSecret(secret: string) {
  if (process.env.CONVEX_ENV_VARS_SECRET === undefined) {
    throw new Error("Missing CONVEX_ENV_VARS_SECRET Convex environment variable");
  }
  if (secret !== process.env.CONVEX_ENV_VARS_SECRET) {
    throw new Error("EnvVars API called without correct secret value");
  }
}

// ---------------------------------------------------------------------------
// Crypto helpers (AES-256-GCM)
// ---------------------------------------------------------------------------
if (process.env.ENV_VARS_ENCRYPTION_KEY === undefined) {
  throw new Error("Missing ENV_VARS_ENCRYPTION_KEY Convex environment variable");
}
const ENC_KEY = Buffer.from(process.env.ENV_VARS_ENCRYPTION_KEY!, "hex");
if (ENC_KEY.length !== 32) {
  throw new Error("ENV_VARS_ENCRYPTION_KEY must be 32 bytes (64 hex chars)");
}
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
function encrypt(plainText: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, ENC_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}
function decrypt(encoded: string): string {
  const buffer = Buffer.from(encoded, "base64");
  const iv = buffer.subarray(0, IV_LENGTH);
  const tag = buffer.subarray(IV_LENGTH, IV_LENGTH + 16);
  const encrypted = buffer.subarray(IV_LENGTH + 16);
  const decipher = crypto.createDecipheriv(ALGORITHM, ENC_KEY, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString("utf8");
}

// Helper to call core mutations/queries
function core(name: string) {
  return `envVarsCore:${name}` as const;
}

// ---------------------------------------------------------------------------
// Actions exposed to the client
// ---------------------------------------------------------------------------

export const setEnvVar = action({
  args: {
    secret: v.string(),
    ownerId: v.id("users"),
    key: v.string(),
    value: v.string(), // plaintext
  },
  handler: async (ctx, { secret, ownerId, key, value }) => {
    checkSecret(secret);
    const ciphertext = encrypt(value);
    return await ctx.runMutation(core("upsertEnvVar") as any, {
      ownerId,
      key,
      value: ciphertext,
    });
  },
});

export const deleteEnvVar = action({
  args: { secret: v.string(), ownerId: v.id("users"), key: v.string() },
  handler: async (ctx, { secret, ownerId, key }) => {
    checkSecret(secret);
    await ctx.runMutation(core("removeEnvVar") as any, { ownerId, key });
  },
});

export const listEnvVars = action({
  args: { secret: v.string(), ownerId: v.id("users") },
  handler: async (ctx, { secret, ownerId }) => {
    checkSecret(secret);
    return await ctx.runQuery(core("listEnvVars") as any, { ownerId });
  },
});

export const getEnvVar = action({
  args: { secret: v.string(), ownerId: v.id("users"), key: v.string() },
  handler: async (ctx, { secret, ownerId, key }) => {
    checkSecret(secret);
    const ciphertext = await ctx.runQuery(core("getEnvVarRaw") as any, { ownerId, key });
    if (ciphertext === null) return null;
    return decrypt(ciphertext);
  },
}); 