import { useCallback, useEffect, useState } from "react";
import type { GetStaticProps } from "next";
import Head from "next/head";
import { useTranslation } from "next-i18next/pages";
import { PlusIcon } from "@heroicons/react/24/outline";
import PortalLayout, { PortalChecking } from "@/components/portal/PortalLayout";
import { Field, PortalButton, SelectInput, TextArea, TextInput } from "@/components/portal/Field";
import { TRAINER_NAV } from "./index";
import { usePortalAuth } from "@/hooks/usePortalAuth";
import { useTrainerBadges } from "@/hooks/useTrainerBadges";
import { api, apiErrorMessage } from "@/utils/api";
import { translations } from "@/utils/i18n";
import { resourceTypeKey } from "@/utils/labels";
import { RESOURCE_TYPES, type ResourceType, type TrainingResource } from "@/types/content";

/**
 * The trainer's library: material every active client of theirs can read.
 *
 * **This is the feature that makes the product usable at scale.** A technique
 * video belongs to the coach, not to one client, and a trainer with forty
 * clients who has to attach it forty times is a trainer who stops attaching it.
 * Anything written for one person lives on that person's screen instead.
 */
export default function TrainerLibrary() {
  const { t } = useTranslation("common");
  const { user, ready } = usePortalAuth("trainer");
  const badges = useTrainerBadges(ready);

  const [rows, setRows] = useState<TrainingResource[] | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    type: "video" as ResourceType,
    title: "",
    description: "",
    url: "",
    body: "",
  });

  const needsBody = form.type === "diet" || form.type === "tip";

  const load = useCallback(async () => {
    const { data } = await api.get<TrainingResource[]>("/portal/trainer/library");
    setRows(data);
  }, []);

  useEffect(() => {
    if (!ready) return;
    void load();
  }, [ready, load]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      await api.post("/portal/trainer/resources", {
        type: form.type,
        visibility: "library",
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        url: needsBody ? undefined : form.url.trim() || undefined,
        body: needsBody ? form.body : undefined,
      });

      setForm({ type: "video", title: "", description: "", url: "", body: "" });
      setOpen(false);
      await load();
    } catch (caught) {
      setError(apiErrorMessage(caught, t("portal.trainer.resourceFailed")));
    } finally {
      setBusy(false);
    }
  }

  if (!ready) return <PortalChecking />;

  return (
    <>
      <Head>
        <title>{`${t("portal.trainer.nav.library")} — ${t("site.name")}`}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <PortalLayout
        user={user}
        items={TRAINER_NAV(t, badges)}
        title={t("portal.trainer.libraryTitle")}
        lead={t("portal.trainer.libraryLead")}
        actions={
          <PortalButton type="button" onClick={() => setOpen((v) => !v)}>
            <PlusIcon className="h-4 w-4" aria-hidden />
            {open ? t("actions.cancel") : t("portal.trainer.addMaterial")}
          </PortalButton>
        }
      >
        {open && (
          <form onSubmit={submit} className="mb-7 rounded-panel border border-white/10 bg-ink-900 p-5">
            {error && (
              <p role="alert" className="mb-4 rounded-card border border-flare-500/30 bg-flare-500/10 px-4 py-2.5 text-sm text-flare-300">
                {error}
              </p>
            )}

            <div className="grid gap-4 sm:grid-cols-[12rem_1fr]">
              <Field label={t("portal.trainer.resourceType")}>
                <SelectInput
                  value={form.type}
                  onChange={(event) =>
                    setForm((v) => ({ ...v, type: event.target.value as ResourceType }))
                  }
                >
                  {RESOURCE_TYPES.map((value) => (
                    <option key={value} value={value}>
                      {t(resourceTypeKey(value))}
                    </option>
                  ))}
                </SelectInput>
              </Field>

              <Field label={t("portal.trainer.resourceTitle")} required>
                <TextInput
                  value={form.title}
                  onChange={(event) => setForm((v) => ({ ...v, title: event.target.value }))}
                  required
                  minLength={2}
                />
              </Field>
            </div>

            <div className="mt-4">
              <Field label={t("portal.trainer.resourceDescription")}>
                <TextInput
                  value={form.description}
                  onChange={(event) =>
                    setForm((v) => ({ ...v, description: event.target.value }))
                  }
                />
              </Field>
            </div>

            <div className="mt-4">
              {needsBody ? (
                <Field label={t("portal.trainer.resourceBody")} required>
                  <TextArea
                    value={form.body}
                    onChange={(event) => setForm((v) => ({ ...v, body: event.target.value }))}
                    rows={8}
                    required
                  />
                </Field>
              ) : (
                <Field
                  label={t("portal.trainer.resourceUrl")}
                  hint={t("portal.trainer.resourceUrlHint")}
                  required
                >
                  <TextInput
                    type="url"
                    value={form.url}
                    onChange={(event) => setForm((v) => ({ ...v, url: event.target.value }))}
                    placeholder="https://"
                    required
                  />
                </Field>
              )}
            </div>

            <PortalButton type="submit" loading={busy} className="mt-5">
              {t("actions.save")}
            </PortalButton>
          </form>
        )}

        {rows === null ? (
          <p className="text-sm text-ink-400">{t("portal.loading")}</p>
        ) : rows.length === 0 ? (
          <div className="rounded-panel border border-dashed border-white/15 bg-ink-900/60 px-6 py-14 text-center">
            <p className="font-head text-xl text-white">{t("portal.trainer.libraryEmpty")}</p>
            <p className="mx-auto mt-3 max-w-prose text-sm text-ink-400">
              {t("portal.trainer.libraryEmptyText")}
            </p>
          </div>
        ) : (
          <ul className="grid gap-4 lg:grid-cols-2">
            {rows.map((row) => (
              <li
                key={row.id}
                className="flex items-start justify-between gap-3 rounded-card border border-white/10 bg-ink-900 p-5"
              >
                <div className="min-w-0">
                  <p className="font-head text-base text-white">{row.title}</p>
                  <p className="mt-0.5 text-xs uppercase tracking-wider text-ink-500">
                    {t(resourceTypeKey(row.type))}
                  </p>
                  {row.description && (
                    <p className="mt-2 text-sm text-ink-300">{row.description}</p>
                  )}
                  {row.url && (
                    <a
                      href={row.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-block text-sm text-acid-400 underline-offset-4 hover:underline"
                    >
                      {t("actions.open")}
                    </a>
                  )}
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    await api.delete(`/portal/trainer/resources/${row.id}`);
                    await load();
                  }}
                  className="shrink-0 text-xs text-flare-400 underline-offset-4 hover:underline"
                >
                  {t("actions.delete")}
                </button>
              </li>
            ))}
          </ul>
        )}
      </PortalLayout>
    </>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: { ...(await translations(locale, ["common"])) },
});
