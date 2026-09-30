import { useTranslation } from "next-i18next/pages";
import RichTextField from "@/components/ui/RichTextField";
import { PROSE_RICH } from "./prose";
import { tr } from "@/utils/localized";
import { emptyTranslated } from "@/utils/localized";
import type {
  BlockEditorProps,
  BlockRendererProps,
  RichTextData,
} from "./types";

/** Free prose — the workhorse block. */

export function RichTextEditor({
  data,
  onChange,
}: BlockEditorProps<RichTextData>) {
  const { t } = useTranslation("common");

  return (
    <RichTextField
      label={t("blocks.richText.label")}
      value={data.html ?? emptyTranslated()}
      onChange={(html) => onChange({ ...data, html })}
    />
  );
}

export function RichTextRenderer({
  data,
  locale,
}: BlockRendererProps<RichTextData>) {
  const html = tr(data.html, locale);
  if (!html) return null;

  return (
    // The HTML comes from the admin's Quill editor, which is restricted to a
    // safe format whitelist (headings, lists, links, emphasis) — no scripts,
    // no arbitrary attributes.
    <div
      className={`
        break-words text-base leading-relaxed text-ink-300
        [&_a]:text-flare-400 [&_a]:underline [&_a:hover]:text-flare-500
        [&_blockquote]:border-l-4 [&_blockquote]:border-flare-300 [&_blockquote]:pl-4 [&_blockquote]:italic
        [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-flare-500
        [&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-flare-500
        [&_li]:mt-1
        [&_ol]:mt-3 [&_ol]:list-decimal [&_ol]:pl-6
        [&_p]:mt-3
        [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-6
        ${PROSE_RICH}
      `}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export const richTextDefaults = (): RichTextData => ({
  html: emptyTranslated(),
});
