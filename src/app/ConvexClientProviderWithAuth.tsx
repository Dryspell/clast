"use client";

import { ReactNode, useMemo } from "react";
import { ConvexProviderWithAuth, ConvexReactClient } from "convex/react";
import { SessionProvider, useSession } from "next-auth/react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

function useAuth() {
  const { data: session, update, status } = useSession();

  const convexToken: string | null = (session as any)?.convexToken ?? null;

  return useMemo(
    () => ({
      isLoading: status === "loading",
      isAuthenticated: !!session,
      fetchAccessToken: async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
        if (forceRefreshToken) {
          const fresh = await update();
          return (fresh as any)?.convexToken ?? null;
        }
        return convexToken;
      },
    }),
    // Only re-create when user identity changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [convexToken, status],
  );
}

export function ConvexClientProviderWithAuth({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ConvexProviderWithAuth client={convex} useAuth={useAuth}>
        {children}
      </ConvexProviderWithAuth>
    </SessionProvider>
  );
} 