import { useCallback, useEffect, useState } from "react";
import type { GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import PortalLayout, { PortalChecking } from "@/components/portal/PortalLayout";
import { Field, PortalButton, TextArea, TextInput } from "@/components/portal/Field";
import { TRAINER_NAV } from "./index";
import { usePortalAuth } from "@/hooks/usePortalAuth";
import { useTrainerBadges } from "@/hooks/useTrainerBadges";
import { api, apiErrorMessage } from "@/utils/api";
import { translations } from "@/utils/i18n";
import { slugIn } from "@/utils/href";
import { specializationKey } from "@/utils/labels";
import { SPECIALIZATIONS, type Trainer } from "@/types/content";

/**
 * What a trainer may change about themselves.
 *
 * **Deliberately less than the admin's form.** Publication, featuring, SEO and
 * the account's e-mail are not here and cannot be sent — the API accepts a
 * different, smaller shape from this route (`UpdateOwnProfileDto`). A coach
 * owns their bio, their price and whether they are taking clients; the
 * directory's front page is the platform's editorial decision.
 *
 * The switch that matters most is `isAcceptingClients`: it is the one a trainer
 * reaches for the week they fill up, and leaving it buried in an admin nobody
 * gives them access to is how a full coach keeps receiving requests.
 */
export default function TrainerProfileScreen() {
  const { t } = useTranslation("common");
  const { locale } = useRouter();
  const { user, ready } = usePortalAuth("trainer");
  const badges = useTrainerBadges(ready);

  const [trainer, setTrainer] = useState<Trainer | null>(null);
  const [form, setForm] = useState({
    displayName: "",
    headline: "",
    excerpt: "",
    city: "",
    county: "",
    monthlyPrice: "",
    capacity: "",
    yearsExperience: "",
    phone: "",
    publicEmail: "",
    specializations: [] as string[],
    isAcceptingClients: true,
  });
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await api.get<Trainer>("/portal/trainer/profile");
    setTrainer(data);
    setForm({
      displayName: data.displayName ?? "",
      headline: data.headline?.ro ?? "",
      excerpt: data.excerpt?.ro ?? "",
      city: data.city ?? "",
      county: data.county ?? "",
      monthlyPrice: data.monthlyPrice != null ? String(data.monthlyPrice) : "",
      capacity: data.capacity != null ? String(data.capacity) : "",
      yearsExperience: data.yearsExperience != null ? String(data.yearsExperience) : "",
      phone: data.phone ?? "",
      publicEmail: data.publicEmail ?? "",
      specializations: data.specializations ?? [],
      isAcceptingClients: data.isAcceptingClients ?? true,
    });
  }, []);

  useEffect(() => {
    if (!ready) return;
    void load();
  }, [ready, load]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setSaved(false);

    try {
      await api.put("/portal/trainer/profile", {
        displayName: form.displayName.trim(),
        // Romanian only from this form: a coach writing their own bio writes it
        // once, in their own language. The translations are an editorial job and
        // live in the admin, where somebody can be asked to do them.
        headline: { ro: form.headline },
        excerpt: { ro: form.excerpt },
        city: form.city.trim() || undefined,
        county: form.county.trim() || undefined,
        monthlyPrice: form.monthlyPrice ? Number(form.monthlyPrice) : null,
        capacity: form.capacity ? Number(form.capacity) : null,
        yearsExperience: form.yearsExperience ? Number(form.yearsExperience) : null,
        phone: form.phone.trim() || undefined,
        publicEmail: form.publicEmail.trim() || undefined,
        specializations: form.specializations,
        isAcceptingClients: form.isAcceptingClients,
      });

      setSaved(true);
      await load();
    } catch (caught) {
      setError(apiErrorMessage(caught, t("portal.trainer.saveFailed")));
    } finally {
      setBusy(false);
    }
  }

  if (!ready) return <PortalChecking />;

  return (
    <>
      <Head>
        <title>{`${t("portal.trainer.nav.profile")} — ${t("site.name")}`}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <PortalLayout
        user={user}
        items={TRAINER_NAV(t, badges)}
        title={t("portal.trainer.profileTitle")}
        lead={t("portal.trainer.profileLead")}
        actions={
          trainer && (
            <Link href={`/antrenori/${slugIn(trainer.slug, locale ?? "ro")}`} target="_blank">
              <PortalButton variant="ghost" type="button">
                {t("portal.trainer.viewPublic")}
                <ArrowTopRightOnSquareIcon className="h-4 w-4" aria-hidden />
              </PortalButton>
            </Link>
          )
        }
      >
        <form onSubmit={save} className="max-w-3xl space-y-6">
          {error && (
            <p role="alert" className="rounded-card border border-flare-500/30 bg-flare-500/10 px-4 py-3 text-sm text-flare-300">
              {error}
            </p>
          )}
          {saved && (
            <p className="rounded-card border border-acid-500/30 bg-acid-500/10 px-4 py-3 text-sm text-acid-300">
              {t("portal.trainer.saved")}
            </p>
          )}

          <div className="rounded-panel border border-white/10 bg-ink-900 p-5">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={form.isAcceptingClients}
                onChange={(event) =>
                  setForm((v) => ({ ...v, isAcceptingClients: event.target.checked }))
                }
                className="mt-1 h-4 w-4 rounded border-white/20 bg-ink-950 accent-acid-500"
              />
              <span>
                <span className="block font-head text-base text-white">
                  {t("portal.trainer.accepting")}
                </span>
                <span className="mt-1 block text-sm text-ink-400">
                  {t("portal.trainer.acceptingHint")}
                </span>
              </span>
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("trainers.displayName")} required>
              <TextInput
                value={form.displayName}
                onChange={(event) => setForm((v) => ({ ...v, displayName: event.target.value }))}
                required
              />
            </Field>
            <Field label={t("trainers.yearsExperience")}>
              <TextInput
                type="number"
                value={form.yearsExperience}
                onChange={(event) =>
                  setForm((v) => ({ ...v, yearsExperience: event.target.value }))
                }
              />
            </Field>
          </div>

          <Field label={t("trainers.headline")} hint={t("trainers.headlineHint")}>
            <TextInput
              value={form.headline}
              onChange={(event) => setForm((v) => ({ ...v, headline: event.target.value }))}
            />
          </Field>

          <Field label={t("trainers.excerpt")} hint={t("trainers.excerptHint")}>
            <TextArea
              value={form.excerpt}
              onChange={(event) => setForm((v) => ({ ...v, excerpt: event.target.value }))}
              rows={3}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("trainers.city")}>
              <TextInput
                value={form.city}
                onChange={(event) => setForm((v) => ({ ...v, city: event.target.value }))}
              />
            </Field>
            <Field label={t("trainers.county")}>
              <TextInput
                value={form.county}
                onChange={(event) => setForm((v) => ({ ...v, county: event.target.value }))}
              />
            </Field>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-ink-200">
              {t("trainers.specializations")}
            </p>
            <ul className="flex flex-wrap gap-2">
              {SPECIALIZATIONS.map((value) => {
                const on = form.specializations.includes(value);
                return (
                  <li key={value}>
                    <button
                      type="button"
                      aria-pressed={on}
                      onClick={() =>
                        setForm((v) => ({
                          ...v,
                          specializations: on
                            ? v.specializations.filter((row) => row !== value)
                            : [...v.specializations, value],
                        }))
                      }
                      className={
                        on
                          ? "min-h-9 rounded-full bg-acid-500 px-3.5 text-xs font-medium text-ink-950"
                          : "min-h-9 rounded-full border border-white/12 px-3.5 text-xs font-medium text-ink-300 hover:border-white/30 hover:text-white"
                      }
                    >
                      {t(specializationKey(value))}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("trainers.monthlyPrice")} hint={t("trainers.monthlyPriceHint")}>
              <TextInput
                type="number"
                value={form.monthlyPrice}
                onChange={(event) =>
                  setForm((v) => ({ ...v, monthlyPrice: event.target.value }))
                }
              />
            </Field>
            <Field label={t("trainers.capacity")} hint={t("trainers.capacityHint")}>
              <TextInput
                type="number"
                value={form.capacity}
                onChange={(event) => setForm((v) => ({ ...v, capacity: event.target.value }))}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("trainers.phone")} hint={t("trainers.phoneHint")}>
              <TextInput
                value={form.phone}
                onChange={(event) => setForm((v) => ({ ...v, phone: event.target.value }))}
              />
            </Field>
            <Field label={t("trainers.publicEmail")}>
              <TextInput
                type="email"
                value={form.publicEmail}
                onChange={(event) => setForm((v) => ({ ...v, publicEmail: event.target.value }))}
              />
            </Field>
          </div>

          <p className="text-xs leading-relaxed text-ink-500">
            {t("portal.trainer.adminOnlyNote")}
          </p>

          <PortalButton type="submit" loading={busy}>
            {busy ? t("actions.saving") : t("actions.save")}
          </PortalButton>
        </form>
      </PortalLayout>
    </>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: { ...(await translations(locale, ["common"])) },
});
