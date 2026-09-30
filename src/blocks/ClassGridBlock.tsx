import { useTranslation } from "next-i18next/pages";
import Link from "next/link";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import Input from "@/components/ui/Input";
import TranslatedField from "@/components/ui/TranslatedField";
import Reveal from "@/components/public/Reveal";
import SectionIntro from "@/components/public/SectionIntro";
import ClassCard from "@/components/public/ClassCard";
import { emptyTranslated, tr } from "@/utils/localized";
import type { Translated } from "@/types/content";
import type { BlockEditorProps, BlockRendererProps } from "./types";

/**
 * The classes, read from the CMS rather than typed into the block.
 *
 * **It carries no classes.** The block stores a heading and how many to show;
 * the classes arrive through `context`, fetched once by the page — so a price
 * change or a class that stops running cannot leave a stale copy on the home
 * page, which is the one place it would be most expensive to be wrong.
 *
 * Renders nothing at all with no classes: a section waiting to be filled is
 * worse than no section.
 */

export type ClassGridData = {
  eyebrow: Translated;
  title: Translated;
  lead: Translated;
  linkLabel: Translated;
  /** A cap, not a promise. Four fill a row at desktop width. */
  count: number;
};

export function ClassGridEditor({ data, onChange }: BlockEditorProps<ClassGridData>) {
  const { t } = useTranslation("common");

  return (
    <div className="space-y-4">
      <p className="rounded-lg bg-gray-50 p-3 text-xs text-gray-500">
        {t("blocks.classGrid.hint")}
      </p>

      <TranslatedField
        label={t("blocks.eyebrow")}
        value={data.eyebrow ?? emptyTranslated()}
        onChange={(eyebrow) => onChange({ ...data, eyebrow })}
      />
      <TranslatedField
        label={t("blocks.classGrid.title")}
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
      <TranslatedField
        label={t("blocks.classGrid.linkLabel")}
        value={data.linkLabel ?? emptyTranslated()}
        onChange={(linkLabel) => onChange({ ...data, linkLabel })}
      />
      <Input
        label={t("blocks.classGrid.count")}
        hint={t("blocks.classGrid.countHint")}
        type="number"
        min={1}
        max={12}
        value={String(data.count ?? 4)}
        onChange={(event) => onChange({ ...data, count: Number(event.target.value) || 4 })}
      />
    </div>
  );
}

export function ClassGridRenderer({ data, locale, context }: BlockRendererProps<ClassGridData>) {
  const classes = (context?.classes ?? []).slice(
    0,
    Math.min(12, Math.max(1, data.count ?? 4)),
  );

  if (classes.length === 0) return null;

  return (
    <section>
      <SectionIntro
        eyebrow={tr(data.eyebrow, locale)}
        title={tr(data.title, locale)}
        lead={tr(data.lead, locale)}
        className="mb-12"
      />

      {/* `items-start` matters: without it every card stretches to the tallest
          one and the stagger disappears. */}
      <ul className="grid items-start gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
        {classes.map((item, index) => (
          <Reveal as="li" key={item.id} delay={index * 70}>
            <ClassCard item={item} offset={index % 2 === 1} priority={index < 2} />
          </Reveal>
        ))}
      </ul>

      {tr(data.linkLabel, locale) && (
        <p className="mt-14">
          <Link
            href="/clase"
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/15 px-5 text-sm font-semibold text-white transition-colors hover:border-acid-500 hover:text-acid-400"
          >
            {tr(data.linkLabel, locale)}
            <ArrowRightIcon className="h-4 w-4" aria-hidden />
          </Link>
        </p>
      )}
    </section>
  );
}

export const classGridDefaults = (): ClassGridData => ({
  eyebrow: emptyTranslated(),
  title: emptyTranslated(),
  lead: emptyTranslated(),
  linkLabel: emptyTranslated(),
  count: 4,
});
