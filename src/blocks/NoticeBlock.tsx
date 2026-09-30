import { useTranslation } from "next-i18next/pages";
import clsx from "clsx";
import {
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ScaleIcon,
} from "@heroicons/react/24/outline";
import Select from "@/components/ui/Select";
import TranslatedField from "@/components/ui/TranslatedField";
import RichTextField from "@/components/ui/RichTextField";
import { emptyTranslated, tr } from "@/utils/localized";
import type { Translated } from "@/types/content";
import type { BlockEditorProps, BlockRendererProps } from "./types";

/**
 * A callout that stands apart from the surrounding text: a deadline, a legal
 * basis, a warning about a service being unavailable.
 *
 * Three tones, each with an icon, because on a public-administration page the
 * difference between "for information" and "this expires on the 12th" has to
 * be legible at a glance.
 */

export type NoticeData = {
  tone: "info" | "warning" | "legal";
  title: Translated;
  body: Translated;
};

const TONES = {
  info: {
    icon: InformationCircleIcon,
    box: "border-acid-200 bg-acid-50",
    mark: "text-acid-400",
    heading: "text-acid-900",
  },
  warning: {
    icon: ExclamationTriangleIcon,
    box: "border-amber-300 bg-amber-50",
    mark: "text-amber-700",
    heading: "text-amber-900",
  },
  legal: {
    icon: ScaleIcon,
    box: "border-white/10 bg-ink-900",
    mark: "text-ink-400",
    heading: "text-ink-100",
  },
} as const;

export function NoticeEditor({ data, onChange }: BlockEditorProps<NoticeData>) {
  const { t } = useTranslation("common");

  return (
    <div className="space-y-4">
      <Select
        label={t("blocks.notice.tone")}
        value={data.tone ?? "info"}
        onChange={(e) =>
          onChange({ ...data, tone: e.target.value as NoticeData["tone"] })
        }
      >
        <option value="info">{t("blocks.notice.toneInfo")}</option>
        <option value="warning">{t("blocks.notice.toneWarning")}</option>
        <option value="legal">{t("blocks.notice.toneLegal")}</option>
      </Select>

      <TranslatedField
        label={t("blocks.notice.title")}
        value={data.title ?? emptyTranslated()}
        onChange={(title) => onChange({ ...data, title })}
      />

      <RichTextField
        label={t("blocks.notice.body")}
        value={data.body ?? emptyTranslated()}
        onChange={(body) => onChange({ ...data, body })}
      />
    </div>
  );
}

export function NoticeRenderer({ data, locale }: BlockRendererProps<NoticeData>) {
  const tone = TONES[data.tone ?? "info"];
  const Icon = tone.icon;
  const title = tr(data.title, locale);
  const body = tr(data.body, locale);

  if (!title && !body) return null;

  return (
    <aside className={clsx("rounded-xl border p-5", tone.box)}>
      <div className="flex gap-3.5">
        <Icon className={clsx("mt-0.5 h-5 w-5 shrink-0", tone.mark)} aria-hidden />

        <div className="min-w-0">
          {title && (
            <p className={clsx("text-base font-semibold", tone.heading)}>
              {title}
            </p>
          )}
          {body && (
            <div
              className={clsx(
                "break-words text-sm leading-relaxed text-ink-300",
                title && "mt-1.5",
                "[&_a]:underline [&_ol]:mt-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mt-2 [&_p:first-child]:mt-0 [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:pl-5",
              )}
              dangerouslySetInnerHTML={{ __html: body }}
            />
          )}
        </div>
      </div>
    </aside>
  );
}

export const noticeDefaults = (): NoticeData => ({
  tone: "info",
  title: emptyTranslated(),
  body: emptyTranslated(),
});
