import { useState } from "react";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import {
  AtSymbolIcon,
  BuildingOffice2Icon,
  EnvelopeIcon,
  GlobeAltIcon,
  InformationCircleIcon,
  MapPinIcon,
  PaperAirplaneIcon,
  PencilIcon,
  PhoneIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import Input from "@/components/ui/Input";
import TranslatedField from "@/components/ui/TranslatedField";
import Reveal from "@/components/public/Reveal";
import SocialLinks from "@/components/public/SocialLinks";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { api, apiErrorMessage } from "@/utils/api";
import { emptyTranslated, tr } from "@/utils/localized";
import { SPECIALIZATIONS, type Specialization, type Translated } from "@/types/content";
import { specializationKey } from "@/utils/labels";
import FormField, { FIELD_INPUT } from "@/components/public/FormField";
import type { BlockEditorProps, BlockRendererProps } from "./types";

/**
 * The contact section: the invitation and the details on the left, the form on
 * the right, on the page's own warm ground.
 *
 * **The form posts to `/contact/requests`** and the enquiry lands in the admin,
 * which is the whole reason this block exists rather than a `mailto:` link. The
 * API rate-limits it, the DTO carries a honeypot, and the address of the page
 * it was sent from travels with it in a hidden field — the blueprint asks for
 * that (ch. 09) so an enquiry from an article can be answered in context.
 *
 * **Short on purpose.** Name, e-mail and a message are the only required
 * fields; ch. 06 rules out a tax number, a mandatory budget or a full brief at
 * first contact. The topic is a select whose first option is "I don't know
 * yet", because that is a real answer and not a missing one.
 *
 * **The details are read from the `site` setting, not typed into the block.**
 * The company's address and telephone number live in one place and are edited
 * at `/admin/settings`; a copy pasted into a block is a copy that goes stale
 * the day they move office. With that setting blank — which is how it ships —
 * those rows simply do not render.
 *
 * **The fields are boxed, and each one is labelled.** They were underlined —
 * a hairline with a placeholder over it — which looked elegant and failed at
 * the only job a form has: two people could not tell where to click. A
 * placeholder is also not a label; it disappears the moment somebody types, so
 * a half-filled form stops saying what its own fields are, and a screen reader
 * gets nothing at all.
 *
 * So: a white surface, a hairline border, the mark inside at the start of the
 * line, and a small label above. The surface is what makes the field visible
 * against the paper; the label is what keeps it legible once it is full.
 */

export type ContactPanelData = {
  eyebrow: Translated;
  title: Translated;
  text: Translated;
  /** A `src` from a map provider's "embed" option. Blank hides the map. */
  mapEmbedUrl: string;
  buttonLabel: Translated;
  success: Translated;
};

export function ContactPanelEditor({
  data,
  onChange,
}: BlockEditorProps<ContactPanelData>) {
  const { t } = useTranslation("common");

  return (
    <div className="space-y-4">
      <TranslatedField
        label={t("blocks.contactPanel.eyebrow")}
        value={data.eyebrow ?? emptyTranslated()}
        onChange={(eyebrow) => onChange({ ...data, eyebrow })}
      />

      <TranslatedField
        label={t("blocks.contactPanel.title")}
        value={data.title ?? emptyTranslated()}
        onChange={(title) => onChange({ ...data, title })}
        required
      />

      <TranslatedField
        label={t("blocks.contactPanel.text")}
        value={data.text ?? emptyTranslated()}
        onChange={(text) => onChange({ ...data, text })}
        multiline
        rows={3}
      />

      <Input
        label={t("blocks.contactPanel.mapEmbedUrl")}
        hint={t("blocks.contactPanel.mapEmbedHint")}
        value={data.mapEmbedUrl ?? ""}
        onChange={(event) => onChange({ ...data, mapEmbedUrl: event.target.value })}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <TranslatedField
          label={t("blocks.contactPanel.buttonLabel")}
          value={data.buttonLabel ?? emptyTranslated()}
          onChange={(buttonLabel) => onChange({ ...data, buttonLabel })}
        />
        <TranslatedField
          label={t("blocks.contactPanel.success")}
          value={data.success ?? emptyTranslated()}
          onChange={(success) => onChange({ ...data, success })}
        />
      </div>

      <p className="rounded-lg bg-gray-50 p-3 text-xs text-gray-500">
        {t("blocks.contactPanel.detailsNote")}
      </p>
    </div>
  );
}

export function ContactPanelRenderer({
  data,
  locale,
}: BlockRendererProps<ContactPanelData>) {
  const { t } = useTranslation("common");
  const router = useRouter();
  const site = useSiteSettings();

  /**
   * The topic and the article the reader came from, both out of the address.
   *
   * Every service page and every article closes with a link to this form
   * carrying `?tema=<service>` — ch. 05 and ch. 09 both ask for "contact cu
   * tema preselectată", and a link that preselects nothing is a link that asks
   * the reader to answer a question they have already answered by clicking.
   * `sursa` is the article it came from, which ch. 09 says may travel in a
   * hidden field; it is never shown, and it is what lets an answer start from
   * what somebody was reading.
   */
  const preselected = (() => {
    const value = router.query.tema;
    const key = typeof value === "string" ? value : "";
    return (SPECIALIZATIONS as readonly string[]).includes(key) ? key : "";
  })();

  const sourcePost = typeof router.query.sursa === "string" ? router.query.sursa : "";

  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const title = tr(data.title, locale);
  const eyebrow = tr(data.eyebrow, locale);
  const text = tr(data.text, locale);
  const buttonLabel = tr(data.buttonLabel, locale) || t("blocks.contactPanel.defaultButton");

  if (!title) return null;

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    if (!form.get("consent")) {
      setError(t("blocks.contactPanel.consentRequired"));
      return;
    }

    setBusy(true);
    setError(null);

    try {
      await api.post("/contact/requests", {
        name: String(form.get("name") ?? ""),
        email: String(form.get("email") ?? ""),
        message: String(form.get("message") ?? ""),
        phone: String(form.get("phone") ?? "") || undefined,
        company: String(form.get("company") ?? "") || undefined,
        website: String(form.get("website") ?? "") || undefined,
        goal: String(form.get("goal") ?? "") || undefined,
        locale: router.locale ?? "ro",
        // Where the enquiry came from. Hidden from the sender, and the reason
        // an answer can start from what they were reading.
        sourceUrl: typeof window === "undefined" ? undefined : window.location.href,
        sourcePost: sourcePost || undefined,
        // The honeypot. A real visitor never sees it; a script fills everything.
        fax: String(form.get("fax") ?? ""),
        consent: true,
      });
      setSent(true);
    } catch (caught) {
      setError(apiErrorMessage(caught, t("blocks.contactPanel.failed")));
    } finally {
      setBusy(false);
    }
  };


  /** One line of the company's own details, with its mark. */
  const Detail = ({
    icon: Icon,
    children,
    strong = false,
  }: {
    icon: typeof MapPinIcon;
    children: React.ReactNode;
    strong?: boolean;
  }) => (
    <li className="flex items-center gap-5">
      <Icon className="h-6 w-6 shrink-0 text-ink-50" aria-hidden />
      <span
        className={
          strong
            ? "font-head text-xl text-ink-50 lg:text-2xl"
            : "text-[1.05rem] text-ink-400"
        }
      >
        {children}
      </span>
    </li>
  );

  return (
    <section className="relative [overflow:clip]">

      <Reveal className="relative">
        <div className="grid gap-14 lg:grid-cols-2 lg:gap-24">
          <div>
            {eyebrow && (
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-ink-100">
                {eyebrow}
              </p>
            )}

            <h2 className="mt-7 max-w-md font-head text-[2.75rem] text-ink-50 lg:text-7xl">
              {title}
            </h2>

            {text && (
              <p className="mt-8 max-w-md text-[1.05rem] leading-[1.8] text-ink-400">
                {text}
              </p>
            )}

            <ul className="mt-12 flex flex-col gap-7">
              {site.address && <Detail icon={MapPinIcon}>{site.address}</Detail>}

              {site.phone && (
                <Detail icon={PhoneIcon} strong>
                  <a href={`tel:${site.phone.replace(/\s+/g, "")}`}>{site.phone}</a>
                </Detail>
              )}

              {site.email && (
                <Detail icon={EnvelopeIcon}>
                  <a href={`mailto:${site.email}`} className="break-all">
                    {site.email}
                  </a>
                </Detail>
              )}
            </ul>

            {!site.address && !site.phone && !site.email && (
              <p className="mt-12 text-sm text-ink-400">{t("nav.contactMissing")}</p>
            )}

            <SocialLinks size="sm" className="mt-12" />
          </div>

          {sent ? (
            <p role="status" className="self-center font-head text-3xl text-acid-400">
              {tr(data.success, locale) || t("blocks.contactPanel.defaultSuccess")}
            </p>
          ) : (
            <form className="flex flex-col gap-6 lg:pt-4" onSubmit={submit}>
              <div className="grid gap-x-6 gap-y-6 sm:grid-cols-2">
                <FormField icon={UserIcon} label={t("blocks.contactPanel.name.field")}>
                  <input
                    name="name"
                    required
                    autoComplete="name"
                    placeholder={t("blocks.contactPanel.namePlaceholder")}
                    className={FIELD_INPUT}
                  />
                </FormField>

                <FormField icon={AtSymbolIcon} label={t("blocks.contactPanel.email")}>
                  <input
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder={t("blocks.contactPanel.emailPlaceholder")}
                    className={FIELD_INPUT}
                  />
                </FormField>

                <FormField icon={PhoneIcon} label={t("blocks.contactPanel.phone")}>
                  <input
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder={t("blocks.contactPanel.phone")}
                    className={FIELD_INPUT}
                  />
                </FormField>

                {/* Optional, and ch. 06 is explicit about what may not be
                    asked here: no tax number, no mandatory budget, no brief.
                    These two are on its list of optional fields, and the admin
                    already had columns waiting for them. */}
                <FormField icon={BuildingOffice2Icon} label={t("blocks.contactPanel.company")}>
                  <input
                    name="company"
                    autoComplete="organization"
                    placeholder={t("blocks.contactPanel.companyPlaceholder")}
                    className={FIELD_INPUT}
                  />
                </FormField>

                <FormField icon={GlobeAltIcon} label={t("blocks.contactPanel.website")}>
                  <input
                    name="website"
                    type="url"
                    autoComplete="url"
                    placeholder={t("blocks.contactPanel.websitePlaceholder")}
                    className={FIELD_INPUT}
                  />
                </FormField>

                <FormField icon={InformationCircleIcon} label={t("blocks.contactPanel.subject")}>
                  <select
                    name="goal"
                    defaultValue={preselected}
                    key={preselected}
                    className={FIELD_INPUT}
                  >
                    <option value="">{t("blocks.contactPanel.subjectUnsure")}</option>
                    {SPECIALIZATIONS.map((key: Specialization) => (
                      <option key={key} value={key}>
                        {t(specializationKey(key))}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>

              <FormField
                icon={PencilIcon}
                label={t("blocks.contactPanel.message")}
                align="start"
              >
                <textarea
                  name="message"
                  rows={4}
                  required
                  placeholder={t("blocks.contactPanel.messagePlaceholder")}
                  className={`${FIELD_INPUT} min-h-0 resize-y leading-relaxed`}
                />
              </FormField>

              {/* The honeypot. Hidden from people, not from scripts — which is
                  why it is off-screen rather than `display: none`, and why it
                  is `tabIndex={-1}` so a keyboard never lands in it. */}
              <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                <label>
                  Fax
                  <input name="fax" tabIndex={-1} autoComplete="off" />
                </label>
              </div>

              <div className="mt-2 flex flex-col gap-5 sm:flex-row sm:items-center">
                <button
                  type="submit"
                  disabled={busy}
                  className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2.5 rounded-full bg-acid-500 px-6 font-head text-[0.9rem] font-medium text-ink-950 transition-colors hover:bg-ink-950 hover:text-white disabled:opacity-60"
                >
                  <PaperAirplaneIcon className="h-4 w-4" aria-hidden />
                  {buttonLabel}
                </button>

                <label className="flex items-start gap-3 text-sm leading-relaxed text-ink-400">
                  <input
                    type="checkbox"
                    name="consent"
                    className="mt-0.5 h-5 w-5 shrink-0 rounded border border-ink-900/40 bg-ink-900"
                  />
                  {t("blocks.contactPanel.consent")}
                </label>
              </div>

              {error && (
                <p role="alert" className="text-sm text-red-600">
                  {error}
                </p>
              )}
            </form>
          )}
        </div>
      </Reveal>

      {data.mapEmbedUrl && (
        <Reveal className="relative mt-16">
          <div className="h-[22rem] overflow-hidden rounded-panel bg-ink-800 lg:h-[26rem]">
            <iframe
              src={data.mapEmbedUrl}
              title={title}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-full w-full"
            />
          </div>
        </Reveal>
      )}
    </section>
  );
}

export const contactPanelDefaults = (): ContactPanelData => ({
  eyebrow: emptyTranslated(),
  title: emptyTranslated(),
  text: emptyTranslated(),
  mapEmbedUrl: "",
  buttonLabel: emptyTranslated(),
  success: emptyTranslated(),
});
