import { useEffect, useRef, useState } from "react";
import type { GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import { api, apiErrorMessage } from "@/utils/api";
import { translations } from "@/utils/i18n";
import { useAppDispatch } from "@/store/store";
import { login, type AuthUser } from "@/store/authSlice";
import { homeFor, resetPortalSession } from "@/hooks/usePortalAuth";
import { Field, PortalButton, TextInput } from "@/components/portal/Field";

type LoginResponse = { accessToken: string; user: AuthUser };

/**
 * One sign-in for trainers and clients.
 *
 * **Which dashboard they land on is decided by the role in the response**, not
 * by which address they signed in at. Two login pages would mean somebody who
 * bookmarked the wrong one is told their correct password is wrong, which is
 * the most expensive support ticket a product can generate.
 *
 * Staff sign in at `/admin/login` — a different endpoint with a different
 * guard, so a client's valid credentials cannot open the admin panel. An
 * administrator who signs in *here* is sent to `/admin`, because that is where
 * they belong and being in the wrong place is a wrong turn, not an error.
 */
export default function SignIn() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const next = typeof router.query.next === "string" ? router.query.next : null;
  const redirected = useRef(false);

  useEffect(() => {
    if (redirected.current || !error) return;
  }, [error]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const { data } = await api.post<LoginResponse>("/auth/login", {
        email: email.trim().toLowerCase(),
        password,
      });

      dispatch(login({ user: data.user, token: data.accessToken }));
      resetPortalSession("authenticated");
      redirected.current = true;

      await router.replace(next ?? homeFor(data.user.role));
    } catch (caught) {
      setError(apiErrorMessage(caught, t("auth.failed")));
      setSubmitting(false);
    }
  }

  return (
    <>
      <Head>
        <title>{`${t("auth.signIn")} — ${t("site.name")}`}</title>
        {/* A sign-in form has nothing to offer a search engine and every reason
            not to be a landing page for one. */}
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <main className="flex min-h-screen flex-col items-center justify-center bg-ink-950 px-4 py-16">
        <Link href="/" className="mb-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo-accelerez.png" alt={t("site.name")} className="h-9 w-auto" />
        </Link>

        <div className="w-full max-w-md rounded-panel border border-white/10 bg-ink-900 p-7 md:p-9">
          <h1 className="font-head text-2xl text-white">{t("auth.signIn")}</h1>
          <p className="mt-2 text-sm text-ink-400">{t("auth.signInLead")}</p>

          {error && (
            <p
              role="alert"
              className="mt-5 rounded-card border border-flare-500/30 bg-flare-500/10 px-4 py-3 text-sm text-flare-300"
            >
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <Field label={t("auth.email")} required>
              <TextInput
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
                autoFocus
              />
            </Field>

            <Field label={t("auth.password")} required>
              <TextInput
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
            </Field>

            <PortalButton type="submit" loading={submitting} className="w-full">
              {submitting ? t("auth.signingIn") : t("auth.signIn")}
            </PortalButton>
          </form>

          <p className="mt-6 text-sm text-ink-400">
            {t("auth.noAccount")}{" "}
            <Link href="/inregistrare" className="text-acid-400 underline-offset-4 hover:underline">
              {t("auth.register")}
            </Link>
          </p>
        </div>

        <p className="mt-6 max-w-md text-center text-xs leading-relaxed text-ink-500">
          {t("auth.trainerNote")}
        </p>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: { ...(await translations(locale, ["common"])) },
});
