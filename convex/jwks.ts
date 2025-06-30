import { httpAction } from "./_generated/server";

export const jwks = httpAction(async () => {
  if (process.env.JWKS === undefined) {
    throw new Error("Missing JWKS Convex environment variable");
  }
  return new Response(process.env.JWKS, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control":
        "public, max-age=15, stale-while-revalidate=15, stale-if-error=86400",
    },
  });
}); 