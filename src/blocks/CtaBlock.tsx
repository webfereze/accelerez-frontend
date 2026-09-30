import { useTranslation } from "next-i18next/pages";
import clsx from "clsx";
import LinkField from "@/components/ui/LinkField";
import TranslatedField from "@/components/ui/TranslatedField";
import CtaButton from "@/components/public/CtaButton";
import { emptyTranslated, tr } from "@/utils/localized";
import { useIsSideColumn } from "./column";
import type { Translated } from "@/types/content";
import type { BlockEditorProps, BlockRendererProps } from "./types";

/** A band that asks the reader to do one specific thing. */
export type CtaData = {
  title: Translated;
  text: Translated;
  label: Translated;
  href: string;
};

export function CtaEditor({ data, onChange }: BlockEditorProps<CtaData>) {
  const { t } = useTranslation("common");

  return (
    <div className="space-y-4">
      <TranslatedField
        label={t("blocks.cta.title")}
        value={data.title ?? emptyTranslated()}
        onChange={(title) => onChange({ ...data, title })}
        required
      />
      <TranslatedField
        label={t("blocks.cta.text")}
        value={data.text ?? emptyTranslated()}
        onChange={(text) => onChange({ ...data, text })}
        multiline
        rows={2}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <TranslatedField
          label={t("blocks.cta.label")}
          value={data.label ?? emptyTranslated()}
          onChange={(label) => onChange({ ...data, label })}
        />
        <LinkField
          label={t("blocks.cta.href")}
          value={data.href ?? ""}
          onChange={(href) => onChange({ ...data, href })}
        />
      </div>
    </div>
  );
}

export function CtaRenderer({ data, locale }: BlockRendererProps<CtaData>) {
  const side = useIsSideColumn();
  const title = tr(data.title, locale);
  const text = tr(data.text, locale);
  const label = tr(data.label, locale);

  if (!title) return null;

  return (
    /**
     * No card, no inset. An accent rule across the top marks this as the
     * page's call to action, and the heading starts on the same line as every
     * other heading — and as the logo in the header. A padded box would push
     * the words a couple of dozen pixels right of everything above them, which
     * is the kind of near-miss that reads as a mistake rather than as emphasis.
     */
    <section
      className={clsx(
        // The rule sits *above* the words, not beside them: a left border with
        // padding would inset the heading by its own width, which is the very
        // misalignment this is fixing.
        //
        // No text colour here. This block defaults to the dark band, and a
        // hardcoded `text-ink-100` put black type on a near-black ground.
        // Inheriting means it is dark on paper and light on the band, which is
        // what `block-dark` exists to do.
        "flex flex-col border-t-2 border-acid-500 pt-6",
        side ? "gap-4" : "gap-5 md:flex-row md:items-center md:justify-between",
      )}
    >
      <div className="min-w-0">
        <h2 className={clsx("font-head", side ? "text-lg" : "text-2xl sm:text-4xl")}>
          {title}
        </h2>
        {text && (
          <p className="mt-3 max-w-xl text-base leading-relaxed opacity-80">
            {text}
          </p>
        )}
      </div>

      {label && data.href && (
        // A button floating in a narrow rail reads as unfinished; full width it
        // becomes the obvious next thing to do.
        <CtaButton href={data.href} className={side ? "w-full shrink-0" : "shrink-0"}>
          {label}
        </CtaButton>
      )}
    </section>
  );
}

export const ctaDefaults = (): CtaData => ({
  title: emptyTranslated(),
  text: emptyTranslated(),
  label: emptyTranslated(),
  href: "",
});
