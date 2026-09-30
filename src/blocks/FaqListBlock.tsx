import { useTranslation } from "next-i18next/pages";
import Input from "@/components/ui/Input";
import TranslatedField from "@/components/ui/TranslatedField";
import SectionIntro from "@/components/public/SectionIntro";
import { emptyTranslated, tr } from "@/utils/localized";
import type { Translated } from "@/types/content";
import type { BlockEditorProps, BlockRendererProps } from "./types";

/**
 * The questions, read from the FAQ collection rather than typed into the block.
 *
 * **It carries no questions.** The same five questions belong on the home page,
 * beside the pricing and at the foot of the directory; typed into each of them
 * they are three copies to correct when the answer changes, and the one nobody
 * remembers is the one a visitor reads.
 *
 * `topic` narrows it to a group — "payment" beside the price, "account" in the
 * portal's help. Empty means all of them.
 *
 * Rendered as native `<details>`: it works before hydration, the browser's own
 * find-in-page reaches inside it, and it is one element rather than a state
 * machine. The accordion block remains for questions that belong to one page
 * only and have no business in the shared list.
 */

export type FaqListData = {
  eyebrow: Translated;
  title: Translated;
  lead: Translated;
  /** Which group to show. Empty means every visible question. */
  topic: string;
};

export function FaqListEditor({ data, onChange }: BlockEditorProps<FaqListData>) {
  const { t } = useTranslation("common");

  return (
    <div className="space-y-4">
      <p className="rounded-lg bg-gray-50 p-3 text-xs text-gray-500">
        {t("blocks.faqList.hint")}
      </p>

      <TranslatedField
        label={t("blocks.eyebrow")}
        value={data.eyebrow ?? emptyTranslated()}
        onChange={(eyebrow) => onChange({ ...data, eyebrow })}
      />
      <TranslatedField
        label={t("blocks.faqList.title")}
        value={data.title ?? emptyTranslated()}
        onChange={(title) => onChange({ ...data, title })}
      />
      <TranslatedField
        label={t("blocks.lead")}
        value={data.lead ?? emptyTranslated()}
        onChange={(lead) => onChange({ ...data, lead })}
        multiline
        rows={2}
      />
      <Input
        label={t("blocks.faqList.topic")}
        hint={t("blocks.faqList.topicHint")}
        value={data.topic ?? ""}
        onChange={(event) => onChange({ ...data, topic: event.target.value })}
        placeholder="payment"
      />
    </div>
  );
}

export function FaqListRenderer({ data, locale, context }: BlockRendererProps<FaqListData>) {
  const topic = (data.topic ?? "").trim();
  const faqs = (context?.faqs ?? []).filter((faq) => !topic || faq.topic === topic);

  if (faqs.length === 0) return null;

  return (
    <section>
      <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <SectionIntro
            eyebrow={tr(data.eyebrow, locale)}
            title={tr(data.title, locale)}
            lead={tr(data.lead, locale)}
            align="stack"
          />
        </div>

        <ul className="divide-y divide-white/10 border-y border-white/10">
          {faqs.map((faq) => (
            <li key={faq.id}>
              <details className="group py-5">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-6 font-head text-lg text-white marker:content-none">
                  {tr(faq.question, locale)}
                  <span
                    aria-hidden
                    className="mt-1.5 shrink-0 text-acid-500 transition-transform duration-200 group-open:rotate-45"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                    </svg>
                  </span>
                </summary>
                <div
                  className="mt-3 max-w-prose text-sm leading-relaxed text-ink-300 [&_a]:text-acid-400 [&_a]:underline [&_p+p]:mt-3"
                  dangerouslySetInnerHTML={{ __html: tr(faq.answer, locale) }}
                />
              </details>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export const faqListDefaults = (): FaqListData => ({
  eyebrow: emptyTranslated(),
  title: emptyTranslated(),
  lead: emptyTranslated(),
  topic: "",
});
