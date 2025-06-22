"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode } from "react";

// Initialise the Convex client with the deployment URL supplied via environment variable.
// The NEXT_PUBLIC_CONVEX_URL should be defined in your .env.local (or equivalent) file
// e.g. NEXT_PUBLIC_CONVEX_URL="https://your-project-name.convex.site"
const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

interface ConvexClientProviderProps {
  children: ReactNode;
}

export function ConvexClientProvider({ children }: ConvexClientProviderProps) {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
} 