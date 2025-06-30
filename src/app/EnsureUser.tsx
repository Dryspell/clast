"use client";

import { useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useSession } from "next-auth/react";

/**
 * EnsureUser guarantees that there is a corresponding row in the `users` table
 * for this browser session. It attempts to use authenticated identity first
 * and falls back to a persisted anonymous ID stored in localStorage.
 */
export function EnsureUser() {
  const ensureUser = useMutation(api.users.ensure);
  const { data: session, status } = useSession();

  useEffect(() => {
    // If user is authenticated, no need for anonymous ensure
    if (session) return;

    // Skip in SSR / RSC environments – this runs only on the client
    const run = async () => {
      let anonId = localStorage.getItem("anonId");
      if (!anonId) {
        anonId = crypto.randomUUID();
        localStorage.setItem("anonId", anonId);
      }
      try {
        await ensureUser({ anonId });
      } catch (err) {
        console.error("Failed to ensure user", err);
      }
    };
    run();
    // calling ensureUser is fine to list as dependency – but we want it only once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ensureUser, session]);

  return null; // renders nothing
} 