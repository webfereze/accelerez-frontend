import { useTranslation } from "next-i18next/pages";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import LinkField from "@/components/ui/LinkField";
import TranslatedField from "@/components/ui/TranslatedField";
import Reveal from "@/components/public/Reveal";
import SectionIntro from "@/components/public/SectionIntro";
import { ArrowLink } from "@/components/public/CtaButton";
import { emptyTranslated, tr } from "@/utils/localized";
import type { Translated } from "@/types/content";
import type { BlockEditorProps, BlockRendererProps } from "./types";

/**
 * Recognitions: a name, a year, what it was for, and a sentence.
 *
 * **A ruled list, not a row of badges.** Award logos are somebody else's brand
 * marks pasted onto your page, and four of them in a row is a wall of
 * unrelated graphics. Set as type — the name large, the year right-aligned on
 * the same line, the category in grey underneath — they read as a record, which
 * is a stronger claim than a badge and one a reader can actually check.
 *
 * The year is a plain string rather than a number: "2019–2020" and "2021 (II)"
 * are things an award list genuinely contains, and a numeric field would force
 * whoever enters them to lie.
 *
 * Two columns on a wide screen, one on a phone, and the whole thing renders
 * nothing when the list is empty. The blueprint is explicit that the site must
 * not ship empty sections waiting to be filled.
 */

export type AwardItem = {
  id: string;
  title: Translated;
  /** Free text: "2019", "2019–2020", "2021 (II)". */
  year: string;
  /** The discipline or category, set small and grey under the name. */
  category: Translated;
  text: Translated;
};

export type AwardsData = {
  eyebrow: Translated;
  title: Translated;
  lead: Translated;
  linkLabel: Translated;
  linkHref: string;
  items: AwardItem[];
};

let counter = 0;
const nextId = () => `award-${Date.now().toString(36)}-${counter++}`;

const emptyItem = (): AwardItem => ({
  id: nextId(),
  title: emptyTranslated(),
  year: "",
  category: emptyTranslated(),
  text: emptyTranslated(),
});

export function AwardsEditor({ data, onChange }: BlockEditorProps<AwardsData>) {
  const { t } = useTranslation("common");
  const items = data.items ?? [];

  const update = (id: string, patch: Partial<AwardItem>) =>
    onChange({
      ...data,
      items: items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    });

  return (
    <div className="space-y-4">
      <TranslatedField
        label={t("blocks.eyebrow")}
        hint={t("blocks.eyebrowHint")}
        value={data.eyebrow ?? emptyTranslated()}
        onChange={(eyebrow) => onChange({ ...data, eyebrow })}
      />

      <TranslatedField
        label={t("blocks.awards.title")}
        value={data.title ?? emptyTranslated()}
        onChange={(title) => onChange({ ...data, title })}
        required
      />

      <TranslatedField
        label={t("blocks.lead")}
        hint={t("blocks.leadHint")}
        value={data.lead ?? emptyTranslated()}
        onChange={(lead) => onChange({ ...data, lead })}
        multiline
        rows={3}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <TranslatedField
          label={t("blocks.awards.linkLabel")}
          value={data.linkLabel ?? emptyTranslated()}
          onChange={(linkLabel) => onChange({ ...data, linkLabel })}
        />
        <LinkField
          label={t("blocks.awards.linkHref")}
          value={data.linkHref ?? ""}
          onChange={(linkHref) => onChange({ ...data, linkHref })}
        />
      </div>

      <ul className="space-y-3">
        {items.map((item, index) => (
          <li key={item.id} className="rounded-lg border border-gray-200 bg-gray-50/60 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {t("blocks.awards.item", { index: index + 1 })}
              </span>
              <button
                type="button"
                onClick={() =>
                  onChange({ ...data, items: items.filter((i) => i.id !== item.id) })
                }
                className="rounded p-1.5 text-gray-400 hover:bg-ink-900 hover:text-red-600"
                aria-label={t("blocks.awards.remove", { index: index + 1 })}
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
                <TranslatedField
                  label={t("blocks.awards.itemTitle")}
                  value={item.title ?? emptyTranslated()}
                  onChange={(title) => update(item.id, { title })}
                  required
                />
                <Input
                  label={t("blocks.awards.year")}
                  hint={t("blocks.awards.yearHint")}
                  value={item.year}
                  onChange={(event) => update(item.id, { year: event.target.value })}
                />
              </div>

              <TranslatedField
                label={t("blocks.awards.category")}
                value={item.category ?? emptyTranslated()}
                onChange={(category) => update(item.id, { category })}
              />

              <TranslatedField
                label={t("blocks.awards.itemText")}
                value={item.text ?? emptyTranslated()}
                onChange={(text) => update(item.id, { text })}
                multiline
                rows={2}
              />
            </div>
          </li>
        ))}
      </ul>

      <Button
        variant="secondary"
        onClick={() => onChange({ ...data, items: [...items, emptyItem()] })}
      >
        <PlusIcon className="h-4 w-4" aria-hidden />
        {t("blocks.awards.add")}
      </Button>
    </div>
  );
}

export function AwardsRenderer({ data, locale }: BlockRendererProps<AwardsData>) {
  const items = (data.items ?? []).filter((item) => tr(item.title, locale));
  if (!items.length) return null;

  const linkLabel = tr(data.linkLabel, locale);

  return (
    <section className="relative [overflow:clip]">

      <div className="relative">
        <SectionIntro
          eyebrow={tr(data.eyebrow, locale)}
          title={tr(data.title, locale)}
          lead={tr(data.lead, locale)}
          aside={
            linkLabel && data.linkHref ? (
              <ArrowLink href={data.linkHref} label={linkLabel} />
            ) : undefined
          }
        />

        <ul className="mt-14 grid gap-x-16 gap-y-12 border-t border-white/15 pt-12 lg:grid-cols-2">
          {items.map((item, index) => (
            <Reveal as="li" key={item.id} delay={index * 70}>
              <div className="flex items-baseline justify-between gap-6">
                <h3 className="font-head text-2xl text-ink-50">{tr(item.title, locale)}</h3>
                {item.year && (
                  <span className="shrink-0 font-head text-2xl tabular-nums text-ink-50">
                    {item.year}
                  </span>
                )}
              </div>

              {tr(item.category, locale) && (
                <p className="mt-2 text-[0.95rem] text-ink-400">
                  {tr(item.category, locale)}
                </p>
              )}

              {tr(item.text, locale) && (
                <p className="mt-4 max-w-md text-[0.95rem] leading-[1.8] text-ink-400">
                  {tr(item.text, locale)}
                </p>
              )}
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

export const awardsDefaults = (): AwardsData => ({
  eyebrow: emptyTranslated(),
  title: emptyTranslated(),
  lead: emptyTranslated(),
  linkLabel: emptyTranslated(),
  linkHref: "",
  items: [emptyItem(), emptyItem()],
});
