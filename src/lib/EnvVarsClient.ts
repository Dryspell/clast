import { fetchAction } from "convex/nextjs";
import { FunctionArgs, FunctionReference } from "convex/server";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

if (process.env.CONVEX_ENV_VARS_SECRET === undefined) {
  throw new Error("Missing CONVEX_ENV_VARS_SECRET environment variable");
}

function addSecret(args: Record<string, any>) {
  return { ...args, secret: process.env.CONVEX_ENV_VARS_SECRET! };
}

function callAction<A extends FunctionReference<"action">>(
  actionRef: A,
  args: Omit<FunctionArgs<A>, "secret">
) {
  return fetchAction(actionRef, addSecret(args) as any);
}

// Public API ---------------------------------------------------------------

export function listEnvVars(ownerId: Id<"users">) {
  return callAction(api.envVars.listEnvVars, { ownerId });
}

export function setEnvVar(
  ownerId: Id<"users">,
  key: string,
  value: string
) {
  return callAction(api.envVars.setEnvVar, { ownerId, key, value });
}

export function deleteEnvVar(ownerId: Id<"users">, key: string) {
  return callAction(api.envVars.deleteEnvVar, { ownerId, key });
}

// NOTE: retrieving decrypted values should be done only from trusted server
// environments (e.g. in getServerSideProps, API routes, or server actions).
export function getEnvVar(ownerId: Id<"users">, key: string) {
  return callAction(api.envVars.getEnvVar, { ownerId, key });
} 