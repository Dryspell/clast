// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore – Convex http router types not yet in *.d.ts but runtime export exists
import { httpRouter } from "convex/server";
import { jwks } from "./jwks";

// Create HTTP router and expose well-known JWKS endpoint used by Convex to
// validate AuthJS-signed JWTs.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const http = httpRouter();

http.route({
  path: "/.well-known/jwks.json",
  method: "GET",
  handler: jwks,
});

export default http; 