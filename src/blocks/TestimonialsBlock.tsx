import { useTranslation } from "next-i18next/pages";
import Input from "@/components/ui/Input";
import TranslatedField from "@/components/ui/TranslatedField";
import Reveal from "@/components/public/Reveal";
import SectionIntro from "@/components/public/SectionIntro";
import { emptyTranslated, tr } from "@/utils/localized";
import type { Translated } from "@/types/content";
import type { BlockEditorProps, BlockRendererProps } from "./types";

/**
 * What clients said, read from the CMS.
 *
 * **Only approved quotations reach this block.** Approval is a field on the
 * testimonial that defaults to false, and the API filters on it — publishing
 * somebody else's words about you is a deliberate act, and a quotation that
 * appears because a draft was saved is a quotation the person never agreed to.
 *
 * Every card names the person, and where they work. An unattributed
 * testimonial is worth nothing and looks like it was written in-house, which
 * on an agency's own site is the exact suspicion it has to avoid.
 *
 * Set as type on paper, not in speech bubbles with five gold stars. The stars
 * are a review-site convention and they imply an aggregate this site does not
 * have; the quotation mark is the whole decoration the block gets.
 */

export type TestimonialsData = {
  eyebrow: Translated;
  title: Translated;
  lead: Translated;
  count: number;
};

export function TestimonialsEditor({ data, onChange }: BlockEditorProps<TestimonialsData>) {
  const { t } = useTranslation("common");

  return (
    <div className="space-y-4">
      <p className="rounded-lg bg-gray-50 p-3 text-xs text-gray-500">
        {t("blocks.testimonials.hint")}
      </p>

      <TranslatedField
        label={t("blocks.eyebrow")}
        hint={t("blocks.eyebrowHint")}
        value={data.eyebrow ?? emptyTranslated()}
        onChange={(eyebrow) => onChange({ ...data, eyebrow })}
      />

      <TranslatedField
        label={t("blocks.testimonials.title")}
        value={data.title ?? emptyTranslated()}
        onChange={(title) => onChange({ ...data, title })}
      />

      <TranslatedField
        label={t("blocks.lead")}
        hint={t("blocks.leadHint")}
        value={data.lead ?? emptyTranslated()}
        onChange={(lead) => onChange({ ...data, lead })}
        multiline
        rows={2}
      />

      <Input
        label={t("blocks.testimonials.count")}
        type="number"
        min={1}
        max={9}
        value={String(data.count ?? 3)}
        onChange={(event) => onChange({ ...data, count: Number(event.target.value) || 3 })}
      />
    </div>
  );
}

export function TestimonialsRenderer({
  data,
  locale,
  context,
}: BlockRendererProps<TestimonialsData>) {
  const items = (context?.testimonials ?? []).slice(
    0,
    Math.min(9, Math.max(1, data.count ?? 3)),
  );

  if (items.length === 0) return null;

  return (
    <section>
      <SectionIntro
        eyebrow={tr(data.eyebrow, locale)}
        title={tr(data.title, locale)}
        lead={tr(data.lead, locale)}
        className="mb-12"
      />

      <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item, index) => (
          <Reveal as="li" key={item.id} delay={index * 70}>
            <figure className="flex h-full flex-col rounded-card border border-white/10 bg-ink-900 p-8 lg:p-10">
              <span aria-hidden className="font-head text-5xl leading-none text-acid-400">
                &ldquo;
              </span>

              <blockquote className="mt-4 flex-1 text-[1.05rem] leading-[1.75] text-ink-200">
                {tr(item.quote, locale)}
              </blockquote>

              <figcaption className="mt-8 flex items-center gap-4 border-t border-white/10 pt-6">
                {item.avatar && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.avatar}
                    alt=""
                    loading="lazy"
                    className="h-12 w-12 rounded-full object-cover"
                  />
                )}
                <span>
                  <span className="block font-head text-lg text-ink-50">{item.author}</span>
                  {(item.role || item.company) && (
                    <span className="block text-sm text-ink-400">
                      {[item.role, item.company].filter(Boolean).join(", ")}
                    </span>
                  )}
                </span>
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}

export const testimonialsDefaults = (): TestimonialsData => ({
  eyebrow: emptyTranslated(),
  title: emptyTranslated(),
  lead: emptyTranslated(),
  count: 3,
});
