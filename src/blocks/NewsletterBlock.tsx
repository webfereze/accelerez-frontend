import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import clsx from "clsx";
import {
  CheckCircleIcon,
  EnvelopeIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import LinkField from "@/components/ui/LinkField";
import TranslatedField from "@/components/ui/TranslatedField";
import { useIsSideColumn } from "./column";
import { api, apiErrorMessage } from "@/utils/api";
import { emptyTranslated, tr } from "@/utils/localized";
import type { Translated } from "@/types/content";
import type { BlockEditorProps, BlockRendererProps } from "./types";

/**
 * The mailing list sign-up.
 *
 * **A line, a field and a tick.** Deliberately plain: this block turns up at
 * the bottom of a page somebody is already reading, and a dark panel with an
 * illustration in it competes with whatever they came for. The band behind it
 * is chosen in the block header like any other block's — that is enough to set
 * it apart from the text above.
 *
 * Every extra box is somebody deciding not to bother, so the only thing asked
 * for is an address. The name is an editor toggle, off by default.
 *
 * It writes to the **same list** as the sign-up in the footer
 * (`POST /newsletter/subscribe`, one row per address), so a mailing is sent
 * from one place. Signing up twice is not an error: people forget, and a
 * duplicate-key error on a public form reads as a broken site rather than "you
 * are already on the list".
 *
 * **The consent is stored, not merely enforced.** The tick is the lawful basis
 * for holding the address at all, so it goes into the record with its
 * timestamp; the API refuses a submission without it. Same rule as the contact
 * form, and the same reason there is no third-party captcha — the endpoint is
 * rate-limited instead of reporting every visitor to an ad network.
 */

export type NewsletterData = {
  eyebrow: Translated;
  title: Translated;
  /** A line or two on what actually gets sent, and how often. */
  text: Translated;
  /** The wording inside the empty field. */
  placeholder: Translated;
  buttonLabel: Translated;
  /** The wording beside the tick, e.g. "I accept the privacy policy". */
  termsLabel: Translated;
  /** Where that wording links. Usually the privacy page. */
  termsHref: string;
  /** What replaces the form once it has been sent. */
  success: Translated;
  /** Off by default: one field signs more people up than two. */
  askName: boolean;
};

export function newsletterDefaults(): NewsletterData {
  return {
    eyebrow: emptyTranslated(),
    title: emptyTranslated(),
    text: emptyTranslated(),
    placeholder: emptyTranslated(),
    buttonLabel: emptyTranslated(),
    termsLabel: emptyTranslated(),
    termsHref: "",
    success: emptyTranslated(),
    askName: false,
  };
}

// --- editor ----------------------------------------------------------------

export function NewsletterEditor({
  data,
  onChange,
}: BlockEditorProps<NewsletterData>) {
  const { t } = useTranslation("common");

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <TranslatedField
          label={t("blocks.newsletter.eyebrow")}
          value={data.eyebrow ?? emptyTranslated()}
          onChange={(eyebrow) => onChange({ ...data, eyebrow })}
        />
        <TranslatedField
          label={t("blocks.newsletter.heading")}
          value={data.title ?? emptyTranslated()}
          onChange={(title) => onChange({ ...data, title })}
        />
      </div>

      <TranslatedField
        label={t("blocks.newsletter.text")}
        hint={t("blocks.newsletter.textHint")}
        value={data.text ?? emptyTranslated()}
        onChange={(text) => onChange({ ...data, text })}
        multiline
        rows={2}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <TranslatedField
          label={t("blocks.newsletter.placeholder")}
          value={data.placeholder ?? emptyTranslated()}
          onChange={(placeholder) => onChange({ ...data, placeholder })}
        />
        <TranslatedField
          label={t("blocks.newsletter.button")}
          value={data.buttonLabel ?? emptyTranslated()}
          onChange={(buttonLabel) => onChange({ ...data, buttonLabel })}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <TranslatedField
          label={t("blocks.newsletter.terms")}
          value={data.termsLabel ?? emptyTranslated()}
          onChange={(termsLabel) => onChange({ ...data, termsLabel })}
        />
        <LinkField
          label={t("blocks.newsletter.termsHref")}
          value={data.termsHref ?? ""}
          onChange={(termsHref) => onChange({ ...data, termsHref })}
        />
      </div>

      <TranslatedField
        label={t("blocks.newsletter.success")}
        value={data.success ?? emptyTranslated()}
        onChange={(success) => onChange({ ...data, success })}
      />

      <label className="flex min-h-11 items-center gap-2.5 text-sm text-ink-300">
        <input
          type="checkbox"
          checked={data.askName ?? false}
          onChange={(e) => onChange({ ...data, askName: e.target.checked })}
          className="h-5 w-5 rounded border-white/15 text-flare-500 focus:ring-flare-500"
        />
        {t("blocks.newsletter.askName")}
      </label>
      <p className="-mt-2 text-xs text-ink-400">
        {t("blocks.newsletter.askNameHint")}
      </p>
    </div>
  );
}

// --- renderer --------------------------------------------------------------

export function NewsletterRenderer({
  data,
  locale,
}: BlockRendererProps<NewsletterData>) {
  const { t } = useTranslation("common");
  const { asPath } = useRouter();
  const side = useIsSideColumn();

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [consent, setConsent] = useState(false);

  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [consentError, setConsentError] = useState(false);

  const eyebrow = tr(data.eyebrow, locale);
  const title = tr(data.title, locale) || t("blocks.newsletter.defaultTitle");
  const text = tr(data.text, locale) || t("blocks.newsletter.defaultText");
  const placeholder =
    tr(data.placeholder, locale) || t("blocks.newsletter.defaultPlaceholder");
  const buttonLabel =
    tr(data.buttonLabel, locale) || t("blocks.newsletter.defaultButton");
  const termsLabel =
    tr(data.termsLabel, locale) || t("blocks.newsletter.defaultTerms");
  const success =
    tr(data.success, locale) || t("blocks.newsletter.defaultSuccess");

  async function submit(event: React.FormEvent) {
    event.preventDefault();

    // Checked here as well as by the browser: the tick is the reason the
    // address may be stored at all, and `required` on a checkbox gives a
    // browser-styled bubble rather than the message beside the field.
    if (!consent) {
      setConsentError(true);
      return;
    }

    setSending(true);
    setError(null);

    try {
      await api.post("/newsletter/subscribe", {
        email: email.trim(),
        name: data.askName ? name.trim() || undefined : undefined,
        consent: true,
        locale,
        source: asPath,
      });

      setSent(true);
    } catch (err) {
      setError(apiErrorMessage(err, t("blocks.newsletter.failed")));
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <section>
        <p className="flex items-start gap-3 text-base leading-relaxed text-ink-200">
          <CheckCircleIcon
            className="h-6 w-6 shrink-0 text-acid-400"
            aria-hidden
          />
          {success}
        </p>
      </section>
    );
  }

  return (
    <section>
      {eyebrow && (
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-flare-400">
          {eyebrow}
        </p>
      )}

      <h2
        className={clsx(
          "font-semibold leading-tight tracking-tight text-ink-100",
          eyebrow && "mt-2",
          side ? "text-lg" : "text-xl sm:text-2xl",
        )}
      >
        {title}
      </h2>

      {text && (
        <p className="mt-2 max-w-prose leading-relaxed text-ink-400">{text}</p>
      )}

      <form onSubmit={submit} noValidate className="mt-5 max-w-xl">
        {/* Field and button on one line from `sm:` up, stacked below it. An
            e-mail field squeezed next to a button at 360px leaves room for
            about four characters of an address. */}
        <div className={clsx("flex flex-col gap-3", !side && "sm:flex-row")}>
          {data.askName && (
            <Input
              label={t("blocks.newsletter.nameLabel")}
              srOnlyLabel
              leading={UserIcon}
              autoComplete="name"
              placeholder={t("blocks.newsletter.namePlaceholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={clsx(!side && "sm:flex-1")}
            />
          )}

          <Input
            label={t("blocks.newsletter.emailLabel")}
            srOnlyLabel
            leading={EnvelopeIcon}
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            placeholder={placeholder}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={clsx(!side && "sm:flex-1")}
          />

          <Button
            type="submit"
            loading={sending}
            className="shrink-0 justify-center"
          >
            {buttonLabel}
          </Button>
        </div>

        <label className="mt-3 flex items-start gap-2.5 text-sm text-ink-400">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => {
              setConsent(e.target.checked);
              if (e.target.checked) setConsentError(false);
            }}
            aria-invalid={consentError || undefined}
            className="mt-0.5 h-5 w-5 shrink-0 rounded border-white/15 text-flare-500 focus:ring-flare-500"
          />
          <span>
            {data.termsHref ? (
              <Link
                href={data.termsHref}
                className="underline underline-offset-2 hover:text-flare-500"
              >
                {termsLabel}
              </Link>
            ) : (
              termsLabel
            )}
          </span>
        </label>

        {consentError && (
          <p role="alert" className="mt-2 text-sm text-red-600">
            {t("blocks.newsletter.consentRequired")}
          </p>
        )}

        {error && (
          <div className="mt-3">
            <Alert tone="error">{error}</Alert>
          </div>
        )}
      </form>
    </section>
  );
}
