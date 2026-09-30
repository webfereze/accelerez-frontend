import { useTranslation } from "next-i18next/pages";
import Reveal from "@/components/public/Reveal";
import SectionIntro from "@/components/public/SectionIntro";
import TranslatedField from "@/components/ui/TranslatedField";
import SelectMenu from "@/components/ui/SelectMenu";
import { emptyTranslated, tr } from "@/utils/localized";
import { BLOCK_ICON_KEYS, iconFor } from "./icons";
import type { Translated } from "@/types/content";
import type { BlockEditorProps, BlockRendererProps } from "./types";

/**
 * A numbered sequence — how something works, in four moves.
 *
 * **The numbers are the design.** A reader scanning a page reads "01 02 03 04"
 * before any of the words, and that alone answers "how much is there to this",
 * which is the question a visitor actually has about a process. They are
 * generated from the order, never typed: a hand-numbered list gets renumbered
 * wrongly the first time a step is inserted in the middle.
 *
 * Four is the shape it is drawn for — they sit on one row at desktop width.
 * Five wrap to a second row of one, which reads as a mistake; the editor is
 * told so rather than prevented, because a five-step process is a real thing.
 */

export type StepsData = {
  eyebrow: Translated;
  title: Translated;
  lead: Translated;
  items: { id: string; icon: string; title: Translated; text: Translated }[];
};

export function StepsEditor({ data, onChange }: BlockEditorProps<StepsData>) {
  const { t } = useTranslation("common");
  const items = data.items ?? [];

  const patch = (id: string, changes: Partial<StepsData["items"][number]>) =>
    onChange({
      ...data,
      items: items.map((item) => (item.id === id ? { ...item, ...changes } : item)),
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
        label={t("blocks.steps.title")}
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

      {items.length > 4 && (
        <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
          {t("blocks.steps.tooMany")}
        </p>
      )}

      <div className="space-y-4">
        {items.map((item, index) => (
          <fieldset key={item.id} className="rounded-lg border border-gray-200 p-4">
            <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
              {String(index + 1).padStart(2, "0")}
            </legend>

            <div className="grid gap-3 sm:grid-cols-[10rem_1fr]">
              <SelectMenu
                label={t("blocks.steps.icon")}
                value={item.icon ?? "sparkles"}
                placeholder={t("blocks.steps.icon")}
                onChange={(icon) => patch(item.id, { icon })}
                options={BLOCK_ICON_KEYS.map((key) => ({ value: key, label: key }))}
              />
              <TranslatedField
                label={t("blocks.steps.stepTitle")}
                value={item.title ?? emptyTranslated()}
                onChange={(title) => patch(item.id, { title })}
              />
            </div>

            <div className="mt-3">
              <TranslatedField
                label={t("blocks.steps.stepText")}
                value={item.text ?? emptyTranslated()}
                onChange={(text) => patch(item.id, { text })}
                multiline
                rows={3}
              />
            </div>

            <button
              type="button"
              onClick={() =>
                onChange({ ...data, items: items.filter((row) => row.id !== item.id) })
              }
              className="mt-3 text-xs font-medium text-red-600 hover:underline"
            >
              {t("blocks.steps.remove")}
            </button>
          </fieldset>
        ))}
      </div>

      <button
        type="button"
        onClick={() =>
          onChange({
            ...data,
            items: [
              ...items,
              {
                id: `s${Date.now()}`,
                icon: "sparkles",
                title: emptyTranslated(),
                text: emptyTranslated(),
              },
            ],
          })
        }
        className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
      >
        {t("blocks.steps.add")}
      </button>
    </div>
  );
}

export function StepsRenderer({ data, locale }: BlockRendererProps<StepsData>) {
  const items = data.items ?? [];
  if (items.length === 0) return null;

  return (
    <section>
      <SectionIntro
        eyebrow={tr(data.eyebrow, locale)}
        title={tr(data.title, locale)}
        lead={tr(data.lead, locale)}
        className="mb-12"
      />

      <ol className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item, index) => {
          const Icon = iconFor(item.icon);

          return (
            <Reveal as="li" key={item.id} delay={index * 70}>
              {/* Generated from the order, never typed — see the class note. */}
              <span className="font-head text-5xl text-white/10">
                {String(index + 1).padStart(2, "0")}
              </span>
              <Icon className="mt-4 h-7 w-7 text-acid-500" aria-hidden />
              <h3 className="mt-4 font-head text-xl text-white">{tr(item.title, locale)}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-ink-400">
                {tr(item.text, locale)}
              </p>
            </Reveal>
          );
        })}
      </ol>
    </section>
  );
}

export const stepsDefaults = (): StepsData => ({
  eyebrow: emptyTranslated(),
  title: emptyTranslated(),
  lead: emptyTranslated(),
  items: [],
});
