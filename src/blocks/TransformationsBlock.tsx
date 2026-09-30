import { useTranslation } from "next-i18next/pages";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import Button from "@/components/ui/Button";
import ImageField from "@/components/ui/ImageField";
import Input from "@/components/ui/Input";
import TranslatedField from "@/components/ui/TranslatedField";
import BeforeAfter from "@/components/public/BeforeAfter";
import Reveal from "@/components/public/Reveal";
import SectionIntro from "@/components/public/SectionIntro";
import { emptyTranslated, tr } from "@/utils/localized";
import type { Translated } from "@/types/content";
import type { BlockEditorProps, BlockRendererProps } from "./types";

/**
 * Results, as two photographs the reader drags between.
 *
 * **The proof a fitness page is actually asked for.** The quotes block says
 * what people thought; this one shows what changed, and a visitor decides on
 * the second far more than on the first. They sit next to each other on the
 * page for that reason — a picture with nobody's words under it is a stock
 * photo, and words with no picture are a paragraph.
 *
 * **Its content lives in the block, not in a collection.** The testimonial
 * entity has a quote and an author and no photographs, and a transformation
 * without both pictures is not one. Rather than grow that table and the admin
 * screen it does not yet have, this is edited where it is seen, in the page.
 *
 * **Every pair needs written consent before it is published.** These are
 * photographs of a named person's body. The block cannot enforce that, so the
 * editor's hint says it and `PLAN.md` repeats it for the seeded pair.
 *
 * The comparison itself — how the drag works, why the new picture is the one
 * on top — is `BeforeAfter`.
 */

export type TransformationItem = {
  id: string;
  before: string | null;
  beforeAlt: string;
  after: string | null;
  afterAlt: string;
  /** A person's name is not translated. */
  name: string;
  /** The line under the name: how long it took, with whom. */
  meta: Translated;
  quote: Translated;
};

export type TransformationsData = {
  eyebrow: Translated;
  title: Translated;
  lead: Translated;
  /** The two chips over the picture. Empty falls back to the interface's own. */
  beforeLabel: Translated;
  afterLabel: Translated;
  items: TransformationItem[];
};

let counter = 0;
const nextId = () => `transformation-${Date.now().toString(36)}-${counter++}`;

const emptyItem = (): TransformationItem => ({
  id: nextId(),
  before: null,
  beforeAlt: "",
  after: null,
  afterAlt: "",
  name: "",
  meta: emptyTranslated(),
  quote: emptyTranslated(),
});

export function TransformationsEditor({
  data,
  onChange,
}: BlockEditorProps<TransformationsData>) {
  const { t } = useTranslation("common");
  const items = data.items ?? [];

  const update = (id: string, patch: Partial<TransformationItem>) =>
    onChange({
      ...data,
      items: items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    });

  return (
    <div className="space-y-4">
      <p className="rounded-lg bg-gray-50 p-3 text-xs text-gray-500">
        {t("blocks.transformations.hint")}
      </p>

      <TranslatedField
        label={t("blocks.eyebrow")}
        hint={t("blocks.eyebrowHint")}
        value={data.eyebrow ?? emptyTranslated()}
        onChange={(eyebrow) => onChange({ ...data, eyebrow })}
      />

      <TranslatedField
        label={t("blocks.transformations.title")}
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
        rows={2}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <TranslatedField
          label={t("blocks.transformations.beforeLabel")}
          value={data.beforeLabel ?? emptyTranslated()}
          onChange={(beforeLabel) => onChange({ ...data, beforeLabel })}
        />
        <TranslatedField
          label={t("blocks.transformations.afterLabel")}
          value={data.afterLabel ?? emptyTranslated()}
          onChange={(afterLabel) => onChange({ ...data, afterLabel })}
        />
      </div>

      <ul className="space-y-3">
        {items.map((item, index) => (
          <li
            key={item.id}
            className="rounded-lg border border-gray-200 bg-gray-50/60 p-3"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {t("blocks.transformations.item", { index: index + 1 })}
              </span>
              <button
                type="button"
                onClick={() =>
                  onChange({ ...data, items: items.filter((i) => i.id !== item.id) })
                }
                className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-600"
                aria-label={t("blocks.transformations.remove", { index: index + 1 })}
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <ImageField
                  label={t("blocks.transformations.before")}
                  url={item.before}
                  alt={item.beforeAlt}
                  onChange={({ url, alt }) =>
                    update(item.id, { before: url, beforeAlt: alt })
                  }
                />
                <ImageField
                  label={t("blocks.transformations.after")}
                  url={item.after}
                  alt={item.afterAlt}
                  onChange={({ url, alt }) =>
                    update(item.id, { after: url, afterAlt: alt })
                  }
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  label={t("blocks.transformations.personName")}
                  hint={t("blocks.transformations.nameHint")}
                  value={item.name ?? ""}
                  onChange={(event) => update(item.id, { name: event.target.value })}
                />
                <TranslatedField
                  label={t("blocks.transformations.meta")}
                  value={item.meta ?? emptyTranslated()}
                  onChange={(meta) => update(item.id, { meta })}
                />
              </div>

              <TranslatedField
                label={t("blocks.transformations.quote")}
                value={item.quote ?? emptyTranslated()}
                onChange={(quote) => update(item.id, { quote })}
                multiline
                rows={3}
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
        {t("blocks.transformations.add")}
      </Button>
    </div>
  );
}

/**
 * Written out rather than built from a count — Tailwind reads its classes out
 * of the source, so an interpolated column count compiles to no CSS at all.
 */
function columns(count: number): string {
  if (count <= 1) return "mx-auto max-w-xl grid-cols-1";
  if (count === 2) return "mx-auto max-w-5xl grid-cols-1 md:grid-cols-2";
  return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";
}

export function TransformationsRenderer({
  data,
  locale,
}: BlockRendererProps<TransformationsData>) {
  const { t } = useTranslation("common");

  // A pair with one picture is not a comparison, and neither is one with no
  // name to attach it to. Half-filled items are dropped rather than shown.
  const items = (data.items ?? []).filter((item) => item.before && item.after);
  if (!items.length) return null;

  const beforeLabel = tr(data.beforeLabel, locale) || t("transformations.before");
  const afterLabel = tr(data.afterLabel, locale) || t("transformations.after");

  return (
    <section>
      <SectionIntro
        eyebrow={tr(data.eyebrow, locale)}
        title={tr(data.title, locale)}
        lead={tr(data.lead, locale)}
        className="mb-12"
      />

      <ul className={`grid gap-8 ${columns(items.length)}`}>
        {items.map((item, index) => {
          const meta = tr(item.meta, locale);
          const quote = tr(item.quote, locale);

          return (
            <Reveal as="li" key={item.id} delay={index * 80}>
              <BeforeAfter
                before={item.before as string}
                beforeAlt={item.beforeAlt}
                after={item.after as string}
                afterAlt={item.afterAlt}
                beforeLabel={beforeLabel}
                afterLabel={afterLabel}
                ariaLabel={
                  item.name
                    ? t("transformations.sliderFor", { name: item.name })
                    : t("transformations.slider")
                }
                className="aspect-3/4"
              />

              {quote && (
                <blockquote className="mt-6 text-[1.05rem] leading-relaxed text-ink-200">
                  „{quote}”
                </blockquote>
              )}

              {(item.name || meta) && (
                <figcaption className="mt-4 flex flex-wrap items-baseline gap-x-3">
                  {item.name && (
                    <span className="font-head text-lg text-white">{item.name}</span>
                  )}
                  {meta && (
                    <span className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-acid-400">
                      {meta}
                    </span>
                  )}
                </figcaption>
              )}
            </Reveal>
          );
        })}
      </ul>

      <p className="mt-10 text-xs text-ink-500">{t("transformations.note")}</p>
    </section>
  );
}

export const transformationsDefaults = (): TransformationsData => ({
  eyebrow: emptyTranslated(),
  title: emptyTranslated(),
  lead: emptyTranslated(),
  beforeLabel: emptyTranslated(),
  afterLabel: emptyTranslated(),
  items: [emptyItem(), emptyItem()],
});
