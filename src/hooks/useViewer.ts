import { useEffect, useState } from "react";
import { api, getToken, isUnauthorized, setToken } from "@/utils/api";
import type { AuthUser } from "@/store/authSlice";

/**
 * Who is signed in, for the parts of the **public** site that care.
 *
 * Deliberately not `usePortalAuth`: that one guards a screen and sends an
 * anonymous visitor to the login page, which is exactly wrong on a public page
 * where being signed out is the normal case. This one answers the question and
 * does nothing about the answer.
 *
 * The result is cached at module scope, so the header does not re-ask on every
 * client-side navigation, and `null` is cached too — a signed-out visitor
 * should cost one request per page load, not one per page.
 */
let cached: AuthUser | null | undefined;
let inFlight: Promise<AuthUser | null> | null = null;

/** Called after signing in or out, so the header stops showing the old state. */
export function resetViewer() {
  cached = undefined;
  inFlight = null;
}

export function useViewer(): { viewer: AuthUser | null; ready: boolean } {
  const [viewer, setViewer] = useState<AuthUser | null>(cached ?? null);
  const [ready, setReady] = useState(cached !== undefined);

  useEffect(() => {
    // Another consumer answered after this one rendered — the header and the
    // side panel mount together, and whichever effect runs second found the
    // cache filled and never became ready, so the header's account link never
    // appeared on a desktop.
    if (cached !== undefined) {
      setViewer(cached);
      setReady(true);
      return;
    }

    let cancelled = false;

    // No token is an answer, not a reason to ask the server.
    if (!getToken()) {
      cached = null;
      setReady(true);
      return;
    }

    inFlight ??= api
      .get<AuthUser>("/auth/me")
      .then(({ data }) => data)
      .catch((error) => {
        // Only a rejected token means signed out; a network blip must not
        // silently log somebody out of the header.
        if (isUnauthorized(error)) setToken(null);
        return null;
      });

    void inFlight.then((user) => {
      cached = user;
      inFlight = null;
      if (cancelled) return;
      setViewer(user);
      setReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return { viewer, ready };
}

/** Where this account's own area lives. */
export function areaFor(role: AuthUser["role"] | undefined): string {
  if (role === "trainer") return "/antrenor";
  if (role === "admin" || role === "editor") return "/admin";
  return "/cont";
}
