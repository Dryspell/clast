import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { SignJWT, importPKCS8 } from "jose";
import { ConvexAdapter } from "./lib/ConvexAdapter";

export const { handlers, signIn, signOut, auth } = NextAuth({
  experimental: { enableWebAuthn: false },
  debug: false,
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    // Add more providers here
  ],
  session: { strategy: "jwt" },
  adapter: ConvexAdapter,
  callbacks: {
    async session({ session }) {
      if (!session?.user?.id) return session;

      const privateKey = await importPKCS8(
        process.env.CONVEX_AUTH_PRIVATE_KEY!,
        "RS256",
      );

      const convexSiteUrl = process.env.NEXT_PUBLIC_CONVEX_URL!.replace(
        /.cloud$/, // Convex deployment URLs end in .cloud; transform → .site
        ".site",
      );

      const convexToken = await new SignJWT({ sub: session.user.id })
        .setProtectedHeader({ alg: "RS256" })
        .setIssuedAt()
        .setIssuer(convexSiteUrl)
        .setAudience("convex")
        .setExpirationTime("1h")
        .sign(privateKey);

      return { ...session, convexToken } as typeof session & {
        convexToken: string;
      };
    },
  },
});

// Augment session type to include convexToken
declare module "next-auth" {
  interface Session {
    convexToken: string;
  }
} 