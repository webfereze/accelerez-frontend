import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { api, getToken, isUnauthorized, setToken } from "@/utils/api";
import { useAppDispatch, useAppSelector } from "@/store/store";
import {
  login as loginAction,
  logout as logoutAction,
  type AuthUser,
} from "@/store/authSlice";

type Status = "checking" | "authenticated" | "anonymous";

/**
 * The portal's session guard — the same shape as `useAdminAuth`, and
 * deliberately a **separate** hook rather than a parameter on that one.
 *
 * The two differ in three ways that would each be an `if` inside a shared hook:
 * which roles are acceptable, where an unauthenticated visitor is sent, and
 * what happens when the role is valid but wrong for the screen. Three
 * conditionals in one guard is how a client ends up on a trainer's dashboard
 * because somebody passed the wrong flag.
 *
 * The result is cached at module scope for the same reason the admin's is: the
 * layout remounts on every client-side navigation, and verifying inside the
 * effect would mean a round trip and a flash of the loading state between every
 * screen.
 */
let cached: Status = "checking";
let inFlight: Promise<Status> | null = null;

/** Called on sign-in and sign-out so the next guard does not trust a stale result. */
export function resetPortalSession(status: Status = "checking") {
  cached = status;
  inFlight = null;
}

async function verify(onUser: (user: AuthUser) => void): Promise<Status> {
  if (cached !== "checking") return cached;
  if (inFlight) return inFlight;

  inFlight = (async () => {
    if (!getToken()) return "anonymous";

    try {
      const { data } = await api.get<AuthUser>("/auth/me");

      // An editor's token is valid and has no business here: they manage site
      // content and have no clients, so every screen would be empty in a way
      // that reads as a bug rather than as a refusal.
      if (data.role === "editor") {
        return "anonymous";
      }

      onUser(data);
      return "authenticated";
    } catch (error) {
      // Only a rejected token means "signed out". A network blip must not throw
      // somebody out of their account mid-session.
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

/**
 * Guards a portal screen.
 *
 * `role` narrows it further: a client who opens a trainer's URL is sent to
 * their own dashboard rather than shown an empty screen or a 403. Being in the
 * wrong place is not an error — it is a wrong turn, and the product should take
 * them where they belong.
 */
export function usePortalAuth(role?: "trainer" | "client") {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);

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

    // `next` brings them back to the screen they asked for after signing in.
    void router.replace({
      pathname: "/autentificare",
      query: router.asPath === "/cont" ? undefined : { next: router.asPath },
    });
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated" || !user || !role) return;
    if (user.role === role || user.role === "admin") return;

    void router.replace(user.role === "trainer" ? "/antrenor" : "/cont");
  }, [status, user, role, router]);

  return {
    user,
    ready: status === "authenticated" && (!role || !user || user.role === role || user.role === "admin"),
  };
}

/** Where an account belongs after signing in. */
export function homeFor(role: AuthUser["role"]): string {
  if (role === "trainer") return "/antrenor";
  if (role === "admin" || role === "editor") return "/admin";
  return "/cont";
}
