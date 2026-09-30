import { useEffect, useState } from "react";
import type { GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import { api, apiErrorMessage } from "@/utils/api";
import { translations } from "@/utils/i18n";
import { useAppDispatch } from "@/store/store";
import { login, type AuthUser } from "@/store/authSlice";
import { resetPortalSession } from "@/hooks/usePortalAuth";
import { Field, PortalButton, TextArea, TextInput } from "@/components/portal/Field";
import type { Trainer } from "@/types/content";

type RegisterResponse = { accessToken: string; user: AuthUser };

/**
 * Registration — and it creates a **client**, always.
 *
 * There is no role to choose and no "sunt antrenor" box. Coaches are admitted
 * by an administrator after their certifications are seen, which is the whole
 * admission model of the product; a checkbox here would quietly undo it.
 *
 * **Arriving from a profile carries the trainer through.** `?antrenor=<id>`
 * turns this into one step instead of three: the account is created, and the
 * enrolment request is sent immediately afterwards with the goal typed on this
 * same form. Two calls rather than one endpoint that does both, because an
 * endpoint that creates an account *and* writes into a coach's inbox is the
 * most attackable route this product could have.
 *
 * The goal field is only shown when there is a trainer to send it to. Asking
 * somebody to write their goal into a form that will not deliver it anywhere is
 * how a sign-up gains a field nobody fills in.
 */
export default function Register() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const dispatch = useAppDispatch();

  /**
   * The trainer's slug, not their id — public addresses carry no ids.
   *
   * Only used to show whose name is on the form and to resolve the id for the
   * enrolment call; a tampered value simply finds nobody, and the enrolment is
   * skipped rather than sent somewhere else.
   */
  const trainerSlug =
    typeof router.query.antrenor === "string" ? router.query.antrenor : null;
  const [trainer, setTrainer] = useState<Trainer | null>(null);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    goal: "",
  });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Only to show whose name is on the form — the enrolment itself is sent by
  // id, so a tampered query gets a 404 from the API rather than a wrong signup.
  useEffect(() => {
    if (!trainerSlug) return;

    let cancelled = false;
    void api
      .get<Trainer>(`/trainers/${encodeURIComponent(trainerSlug)}`, {
        params: { locale: router.locale ?? "ro" },
      })
      .then(({ data }) => !cancelled && setTrainer(data))
      .catch(() => !cancelled && setTrainer(null));

    return () => {
      cancelled = true;
    };
  }, [trainerSlug, router.locale]);

  const patch = (changes: Partial<typeof form>) => setForm((value) => ({ ...value, ...changes }));

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const { data } = await api.post<RegisterResponse>("/auth/register", {
        email: form.email.trim().toLowerCase(),
        password: form.password,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim() || undefined,
        phone: form.phone.trim() || undefined,
        locale: router.locale ?? "ro",
        acceptTerms,
      });

      dispatch(login({ user: data.user, token: data.accessToken }));
      resetPortalSession("authenticated");

      // The enrolment, with the token we just received. A failure here must not
      // lose the account that was just created — they are signed in either way
      // and can enrol from the directory.
      if (trainer && form.goal.trim().length >= 10) {
        try {
          await api.post("/portal/client/enroll", {
            trainerId: trainer.id,
            goal: form.goal.trim(),
          });
        } catch {
          /* The dashboard will show no enrolment; the directory is one tap. */
        }
      }

      await router.replace("/cont");
    } catch (caught) {
      setError(apiErrorMessage(caught, t("auth.registerFailed")));
      setSubmitting(false);
    }
  }

  return (
    <>
      <Head>
        <title>{`${t("auth.register")} — ${t("site.name")}`}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <main className="flex min-h-screen flex-col items-center justify-center bg-ink-950 px-4 py-16">
        <Link href="/" className="mb-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo-accelerez.png" alt={t("site.name")} className="h-9 w-auto" />
        </Link>

        <div className="w-full max-w-lg rounded-panel border border-white/10 bg-ink-900 p-7 md:p-9">
          <h1 className="font-head text-2xl text-white">{t("auth.register")}</h1>
          <p className="mt-2 text-sm text-ink-400">
            {trainer
              ? t("auth.registerWithTrainer", { name: trainer.displayName })
              : t("auth.registerLead")}
          </p>

          {error && (
            <p
              role="alert"
              className="mt-5 rounded-card border border-flare-500/30 bg-flare-500/10 px-4 py-3 text-sm text-flare-300"
            >
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("auth.firstName")} required>
                <TextInput
                  value={form.firstName}
                  onChange={(event) => patch({ firstName: event.target.value })}
                  autoComplete="given-name"
                  required
                  autoFocus
                />
              </Field>
              <Field label={t("auth.lastName")}>
                <TextInput
                  value={form.lastName}
                  onChange={(event) => patch({ lastName: event.target.value })}
                  autoComplete="family-name"
                />
              </Field>
            </div>

            <Field label={t("auth.email")} required>
              <TextInput
                type="email"
                value={form.email}
                onChange={(event) => patch({ email: event.target.value })}
                autoComplete="email"
                required
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("auth.password")} hint={t("auth.passwordHint")} required>
                <TextInput
                  type="password"
                  value={form.password}
                  onChange={(event) => patch({ password: event.target.value })}
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
              </Field>
              <Field label={t("auth.phone")} hint={t("auth.phoneHint")}>
                <TextInput
                  type="tel"
                  value={form.phone}
                  onChange={(event) => patch({ phone: event.target.value })}
                  autoComplete="tel"
                />
              </Field>
            </div>

            {trainer && (
              <Field label={t("auth.goal")} hint={t("auth.goalHint")} required>
                <TextArea
                  value={form.goal}
                  onChange={(event) => patch({ goal: event.target.value })}
                  minLength={10}
                  required
                  rows={4}
                />
              </Field>
            )}

            <label className="flex items-start gap-3 text-sm text-ink-300">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(event) => setAcceptTerms(event.target.checked)}
                required
                className="mt-1 h-4 w-4 rounded border-white/20 bg-ink-950 accent-acid-500"
              />
              <span>
                {t("auth.terms")}{" "}
                <Link
                  href="/termeni-si-conditii"
                  className="text-acid-400 underline-offset-4 hover:underline"
                >
                  {t("auth.termsLink")}
                </Link>{" "}
                {t("auth.and")}{" "}
                <Link
                  href="/confidentialitate"
                  className="text-acid-400 underline-offset-4 hover:underline"
                >
                  {t("auth.privacyLink")}
                </Link>
                .
              </span>
            </label>

            <PortalButton type="submit" loading={submitting} className="w-full">
              {submitting ? t("auth.registering") : t("auth.createAccount")}
            </PortalButton>
          </form>

          <p className="mt-6 text-sm text-ink-400">
            {t("auth.haveAccount")}{" "}
            <Link href="/autentificare" className="text-acid-400 underline-offset-4 hover:underline">
              {t("auth.signIn")}
            </Link>
          </p>
        </div>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: { ...(await translations(locale, ["common"])) },
});
