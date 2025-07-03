/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as authAdapter from "../authAdapter.js";
import type * as edges from "../edges.js";
import type * as envVars from "../envVars.js";
import type * as envVarsCore from "../envVarsCore.js";
import type * as flows from "../flows.js";
import type * as http from "../http.js";
import type * as jwks from "../jwks.js";
import type * as nodes from "../nodes.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  authAdapter: typeof authAdapter;
  edges: typeof edges;
  envVars: typeof envVars;
  envVarsCore: typeof envVarsCore;
  flows: typeof flows;
  http: typeof http;
  jwks: typeof jwks;
  nodes: typeof nodes;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
