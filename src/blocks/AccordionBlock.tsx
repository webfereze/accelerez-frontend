import { useTranslation } from "next-i18next/pages";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import Button from "@/components/ui/Button";
import TranslatedField from "@/components/ui/TranslatedField";
import RichTextField from "@/components/ui/RichTextField";
import LinkField from "@/components/ui/LinkField";
import CtaButton from "@/components/public/CtaButton";
import { emptyTranslated, tr } from "@/utils/localized";
import type {
  AccordionData,
  BlockEditorProps,
  BlockRendererProps,
} from "./types";

/**
 * The questions section.
 *
 * **The title sits beside the list, not above it.** A very large word — "FAQ",
 * "Întrebări" — anchored on the left, the questions stacked on the right,
 * separated only by hairlines. That arrangement is the reason the section has
 * presence at all: centred over the list, the same title would just be a label.
 *
 * Each row is a `+` that turns into a `—`. Not a chevron: the plus reads as
 * "there is more here" rather than as "this scrolls", and it rotates into its
 * own minus, which is one element doing both states instead of two swapping.
 *
 * Rendered with native `<details>`/`<summary>`: keyboard-accessible and
 * expandable with JavaScript disabled.
 *
 * One column, always. The earlier two-column split meant an answer opening on
 * the left pushed nothing on the right — so the two sides drifted out of step
 * and the hairlines stopped lining up, which is exactly what this design
 * cannot afford.
 */

/** Ids only need to be unique within one block. */
let counter = 0;
const nextId = () => `item-${Date.now().toString(36)}-${counter++}`;

export function AccordionEditor({
  data,
  onChange,
}: BlockEditorProps<AccordionData>) {
  const { t } = useTranslation("common");
  const items = data.items ?? [];

  const update = (id: string, patch: Partial<AccordionData["items"][number]>) =>
    onChange({
      ...data,
      items: items.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
    });

  return (
    <div className="space-y-4">
      <TranslatedField
        label={t("blocks.accordion.heading")}
        value={data.title ?? emptyTranslated()}
        onChange={(title) => onChange({ ...data, title })}
      />

      <TranslatedField
        label={t("blocks.accordion.intro")}
        hint={t("blocks.accordion.introHint")}
        value={data.intro ?? emptyTranslated()}
        onChange={(intro) => onChange({ ...data, intro })}
        multiline
        rows={2}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <TranslatedField
          label={t("blocks.accordion.ctaLabel")}
          value={data.ctaLabel ?? emptyTranslated()}
          onChange={(ctaLabel) => onChange({ ...data, ctaLabel })}
        />
        <LinkField
          label={t("blocks.accordion.ctaHref")}
          value={data.ctaHref ?? ""}
          onChange={(ctaHref) => onChange({ ...data, ctaHref })}
        />
      </div>

      <ul className="space-y-3">
        {items.map((item, index) => (
          <li
            key={item.id}
            className="rounded-lg border border-white/10 bg-ink-900/60 p-3"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                {t("blocks.accordion.item", { index: index + 1 })}
              </span>
              <button
                type="button"
                onClick={() =>
                  onChange({
                    ...data,
                    items: items.filter((i) => i.id !== item.id),
                  })
                }
                className="rounded p-1.5 text-ink-400 hover:bg-ink-900 hover:text-red-600"
                aria-label={t("blocks.accordion.remove", { index: index + 1 })}
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <TranslatedField
                label={t("blocks.accordion.question")}
                value={item.question ?? emptyTranslated()}
                onChange={(question) => update(item.id, { question })}
                required
              />
              <RichTextField
                label={t("blocks.accordion.answer")}
                value={item.answer ?? emptyTranslated()}
                onChange={(answer) => update(item.id, { answer })}
              />
            </div>
          </li>
        ))}
      </ul>

      <Button
        variant="secondary"
        onClick={() =>
          onChange({
            ...data,
            items: [
              ...items,
              {
                id: nextId(),
                question: emptyTranslated(),
                answer: emptyTranslated(),
              },
            ],
          })
        }
      >
        <PlusIcon className="h-4 w-4" aria-hidden />
        {t("blocks.accordion.add")}
      </Button>
    </div>
  );
}

export function AccordionRenderer({
  data,
  locale,
}: BlockRendererProps<AccordionData>) {
  const heading = tr(data.title, locale);
  const intro = tr(data.intro, locale);
  const ctaLabel = tr(data.ctaLabel, locale);
  const items = (data.items ?? []).filter((item) => tr(item.question, locale));

  if (!items.length) return null;

  return (
    <section className="relative [overflow:clip]">

      <div className="relative grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:gap-24">
        <div className="flex flex-col items-start gap-6 lg:sticky lg:top-32 lg:self-start">
          {heading && (
            <h2 className="font-head text-5xl text-ink-50 lg:text-7xl">{heading}</h2>
          )}
          {intro && (
            <p className="max-w-sm text-base leading-[1.75] text-ink-400">{intro}</p>
          )}
          {ctaLabel && data.ctaHref && (
            <CtaButton href={data.ctaHref}>
              {ctaLabel}
            </CtaButton>
          )}
        </div>

        <div>
          {items.map((item) => (
            <details key={item.id} className="group border-b border-white/10">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-7 text-left [&::-webkit-details-marker]:hidden">
                <span className="font-head text-xl leading-snug text-ink-50 lg:text-2xl">
                  {tr(item.question, locale)}
                </span>

                {/* Two strokes: the horizontal one stays, the vertical one
                    rotates away. One glyph, both states, and it animates —
                    where swapping a `+` for a `−` can only cut. */}
                <span
                  aria-hidden
                  className="relative block h-6 w-6 shrink-0 text-ink-50"
                >
                  <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-current" />
                  <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-current transition-transform duration-300 ease-out group-open:rotate-90 group-open:scale-y-0 motion-reduce:transition-none" />
                </span>
              </summary>

              <div
                className="
                  max-w-2xl pb-8 pr-10 text-[0.95rem] leading-[1.8] text-ink-400 break-words
                  [&_a]:underline
                  [&_ol]:mt-3 [&_ol]:list-decimal [&_ol]:pl-5
                  [&_p]:mt-3 [&_p:first-child]:mt-0
                  [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5
                "
                dangerouslySetInnerHTML={{ __html: tr(item.answer, locale) }}
              />
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export const accordionDefaults = (): AccordionData => ({
  title: emptyTranslated(),
  intro: emptyTranslated(),
  ctaLabel: emptyTranslated(),
  ctaHref: "",
  items: [
    { id: nextId(), question: emptyTranslated(), answer: emptyTranslated() },
  ],
});
