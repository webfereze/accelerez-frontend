import { useEffect, useRef, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import type { GetStaticProps } from "next";
import { translations } from "@/utils/i18n";
import { useTranslation } from "next-i18next/pages";
import { api, apiErrorMessage, setToken } from "@/utils/api";
import { useAppDispatch } from "@/store/store";
import { adminSessionStatus, resetAdminSession } from "@/hooks/useAdminAuth";
import { login, type AuthUser } from "@/store/authSlice";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Alert from "@/components/ui/Alert";

type LoginResponse = { accessToken: string; user: AuthUser };

export default function AdminLogin() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  /** Where to land after signing in — `?next=` when the guard sent us here. */
  const next =
    typeof router.query.next === "string" ? router.query.next : "/admin";

  const redirected = useRef(false);

  /**
   * Skip the form when the session is already known good.
   *
   * Deliberately keyed on the *verified* session, not on "a token exists in
   * localStorage". A stale token would otherwise bounce forever: the guard
   * rejects it and sends the browser here, this page sees the string and sends
   * it straight back. The ref makes it fire once — `router` changes identity on
   * every navigation, so an effect that depends on it and also navigates
   * re-triggers itself.
   */
  useEffect(() => {
    if (redirected.current) return;
    if (adminSessionStatus() !== "authenticated") return;

    redirected.current = true;
    void router.replace(next);
  }, [router, next]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const { data } = await api.post<LoginResponse>("/auth/admin/login", {
        email: email.trim().toLowerCase(),
        password,
      });

      // Written before the dispatch so the very next request is authenticated,
      // even if it fires before React has re-rendered.
      setToken(data.accessToken);
      dispatch(login({ user: data.user, token: data.accessToken }));

      // The credentials just came back verified — tell the guard, so the screen
      // we land on renders immediately instead of re-checking `/auth/me`.
      resetAdminSession("authenticated");
      redirected.current = true;
      await router.replace(next);
    } catch (err) {
      setError(apiErrorMessage(err, t("admin.login.failed")));
      setPassword("");
      setSubmitting(false);
    }
  }

  return (
    <>
      <Head>
        <title>{`${t("admin.login.title")} — ${t("site.name")}`}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
        <div className="w-full max-w-sm">
          <div className="mb-6 text-center">
            <p className="font-head text-3xl uppercase tracking-wide text-primary-800">
              {t("site.name")}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {t("admin.login.subtitle")}
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <h1 className="text-lg font-semibold text-gray-900">
              {t("admin.login.title")}
            </h1>

            {error && <Alert tone="error">{error}</Alert>}

            <Input
              type="email"
              label={t("admin.login.email")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
              autoFocus
            />

            <Input
              type="password"
              label={t("admin.login.password")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />

            <Button type="submit" fullWidth loading={submitting}>
              {t("admin.login.submit")}
            </Button>
          </form>
        </div>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: { ...(await translations(locale, ["common"])) },
});
