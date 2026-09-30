import { useTranslation } from "next-i18next/pages";
import {
  ClockIcon,
  EnvelopeIcon,
  MapPinIcon,
  PhoneIcon,
} from "@heroicons/react/24/outline";
import Input from "@/components/ui/Input";
import TranslatedField from "@/components/ui/TranslatedField";
import { emptyTranslated, tr } from "@/utils/localized";
import type { Translated } from "@/types/content";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import type { BlockEditorProps, BlockRendererProps } from "./types";

/**
 * Who to contact for this service, and when.
 *
 * The brief requires every service page to name the responsible department,
 * its opening hours, a phone number and an e-mail — this block is that
 * requirement made into one reusable piece, so no page can quietly omit half
 * of it.
 */

export type ContactCardData = {
  /**
   * Take the phone, e-mail and address from the site settings instead of the
   * fields below. A number typed into three blocks is three numbers to change,
   * and two of them get forgotten.
   */
  useSiteContact?: boolean;
  name: Translated;
  role: Translated;
  email: string;
  phone: string;
  room: Translated;
  schedule: Translated;
};

export function ContactCardEditor({
  data,
  onChange,
}: BlockEditorProps<ContactCardData>) {
  const { t } = useTranslation("common");

  return (
    <div className="space-y-4">
      <TranslatedField
        label={t("blocks.contactCard.name")}
        value={data.name ?? emptyTranslated()}
        onChange={(name) => onChange({ ...data, name })}
        required
      />
      <TranslatedField
        label={t("blocks.contactCard.role")}
        value={data.role ?? emptyTranslated()}
        onChange={(role) => onChange({ ...data, role })}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        {/* When on, the two fields below are ignored in favour of the site's
            own details — so they are disabled rather than merely overridden,
            which would leave stale text sitting in a form that does nothing. */}
        <label className="flex min-h-11 items-center gap-2.5 rounded-lg bg-ink-900 px-3 text-sm text-ink-300 sm:col-span-2">
          <input
            type="checkbox"
            checked={Boolean(data.useSiteContact)}
            onChange={(e) => onChange({ ...data, useSiteContact: e.target.checked })}
            className="h-5 w-5 rounded border-white/15 text-flare-500 focus:ring-flare-500"
          />
          {t("blocks.contactCard.useSiteContact")}
        </label>

        <Input
          disabled={Boolean(data.useSiteContact)}
          hint={data.useSiteContact ? t("blocks.contactCard.fromSite") : undefined}
          label={t("blocks.contactCard.phone")}
          value={data.phone ?? ""}
          onChange={(e) => onChange({ ...data, phone: e.target.value })}
          inputMode="tel"
        />
        <Input
          disabled={Boolean(data.useSiteContact)}
          hint={data.useSiteContact ? t("blocks.contactCard.fromSite") : undefined}
          label={t("blocks.contactCard.email")}
          value={data.email ?? ""}
          onChange={(e) => onChange({ ...data, email: e.target.value })}
          inputMode="email"
        />
      </div>

      <TranslatedField
        label={t("blocks.contactCard.room")}
        value={data.room ?? emptyTranslated()}
        onChange={(room) => onChange({ ...data, room })}
      />
      <TranslatedField
        label={t("blocks.contactCard.schedule")}
        value={data.schedule ?? emptyTranslated()}
        onChange={(schedule) => onChange({ ...data, schedule })}
        multiline
        rows={2}
      />
    </div>
  );
}

export function ContactCardRenderer({
  data,
  locale,
}: BlockRendererProps<ContactCardData>) {
  const site = useSiteSettings();

  const name = tr(data.name, locale);
  const role = tr(data.role, locale);
  const room = tr(data.room, locale);
  const schedule = tr(data.schedule, locale);

  // The site's own details win when the block follows them; the typed-in values
  // stay as the fallback, so nothing blanks out before the setting is filled in.
  const phone = data.useSiteContact ? site.phone || data.phone : data.phone;
  const email = data.useSiteContact ? site.email || data.email : data.email;

  // A card set to follow the site can be left unnamed and still be complete.
  const heading = name || (data.useSiteContact ? site.name ?? "" : "");
  if (!heading && !phone && !email) return null;

  return (
    <section className="border-t border-white/10 pt-5">
      {heading && (
        <p className="font-head text-lg font-semibold text-flare-500">{heading}</p>
      )}
      {role && <p className="mt-0.5 text-sm text-ink-400">{role}</p>}

      <dl className="mt-4 space-y-2.5 text-sm">
        {phone && (
          <div className="flex items-start gap-2.5">
            <dt className="mt-0.5">
              <PhoneIcon className="h-4 w-4 text-flare-400" aria-hidden />
              <span className="sr-only">{phone}</span>
            </dt>
            <dd>
              <a
                href={`tel:${phone.replace(/\s/g, "")}`}
                className="text-ink-200 hover:text-acid-400"
              >
                {phone}
              </a>
            </dd>
          </div>
        )}

        {email && (
          <div className="flex items-start gap-2.5">
            <dt className="mt-0.5">
              <EnvelopeIcon className="h-4 w-4 text-flare-400" aria-hidden />
            </dt>
            <dd>
              <a
                href={`mailto:${email}`}
                className="break-words text-ink-200 hover:text-acid-400"
              >
                {email}
              </a>
            </dd>
          </div>
        )}

        {room && (
          <div className="flex items-start gap-2.5">
            <dt className="mt-0.5">
              <MapPinIcon className="h-4 w-4 text-flare-400" aria-hidden />
            </dt>
            <dd className="text-ink-200">{room}</dd>
          </div>
        )}

        {schedule && (
          <div className="flex items-start gap-2.5">
            <dt className="mt-0.5">
              <ClockIcon className="h-4 w-4 text-flare-400" aria-hidden />
            </dt>
            <dd className="whitespace-pre-line text-ink-200">{schedule}</dd>
          </div>
        )}
      </dl>
    </section>
  );
}

export const contactCardDefaults = (): ContactCardData => ({
  name: emptyTranslated(),
  role: emptyTranslated(),
  email: "",
  phone: "",
  room: emptyTranslated(),
  schedule: emptyTranslated(),
});
