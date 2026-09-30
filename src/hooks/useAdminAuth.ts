import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { api, getToken, isUnauthorized, setToken } from "@/utils/api";
import { useAppDispatch, useAppSelector } from "@/store/store";
import { login as loginAction, logout as logoutAction, type AuthUser } from "@/store/authSlice";

type Status = "checking" | "authenticated" | "anonymous";

/**
 * The session is verified **once per page load**, not once per screen.
 *
 * `AdminLayout` remounts on every client-side navigation, so verifying inside
 * the effect meant a round-trip — and a flash of the loading state — between
 * every admin screen. The result is cached here, at module scope: the first
 * screen pays for the check, the rest read it synchronously and render on the
 * first frame. A full reload clears it, which is when re-checking is warranted.
 */
let cached: Status = "checking";
let inFlight: Promise<Status> | null = null;

/** Called on sign-in and sign-out so the next guard doesn't trust a stale result. */
export function resetAdminSession(status: Status = "checking") {
  cached = status;
  inFlight = null;
}

/**
 * The verified session status, for callers that must not act on the mere
 * presence of a token — the login screen decides whether to skip its form on
 * this, never on `getToken()`.
 */
export function adminSessionStatus(): Status {
  return cached;
}

async function verify(onUser: (user: AuthUser) => void): Promise<Status> {
  if (cached !== "checking") return cached;
  if (inFlight) return inFlight;

  inFlight = (async () => {
    if (!getToken()) return "anonymous";

    try {
      const { data } = await api.get<AuthUser>("/auth/me");

      // A valid token, but a portal account — not a back-office login.
      if (data.role === "trainer" || data.role === "client") {
        setToken(null);
        return "anonymous";
      }

      onUser(data);
      return "authenticated";
    } catch (error) {
      // Only a rejected token means "signed out". A network blip must not throw
      // the editor back to the login screen mid-edit.
      if (isUnauthorized(error)) {
        setToken(null);
        return "anonymous";
      }
      return "authenticated";
    }
  })();

  cached = await inFlight;
  inFlight = null;
  return cached;
}

/** Guards an admin screen. Returns the signed-in user once it is known good. */
export function useAdminAuth() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);

  // Already verified on this page load → render on the first frame, no flash.
  const [status, setStatus] = useState<Status>(cached);

  useEffect(() => {
    if (status !== "checking") return;

    let cancelled = false;
    void verify((verified) => {
      const token = getToken();
      if (token) dispatch(loginAction({ user: verified, token }));
    }).then((result) => {
      if (cancelled) return;
      if (result === "anonymous") dispatch(logoutAction());
      setStatus(result);
    });

    return () => {
      cancelled = true;
    };
  }, [status, dispatch]);

  useEffect(() => {
    if (status !== "anonymous") return;

    // `next` brings the editor back to the screen they asked for after login.
    void router.replace({
      pathname: "/admin/login",
      query: router.asPath === "/admin" ? undefined : { next: router.asPath },
    });
  }, [status, router]);

  return { user, ready: status === "authenticated" };
}
