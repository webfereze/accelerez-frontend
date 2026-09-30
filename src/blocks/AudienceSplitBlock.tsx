import { useTranslation } from "next-i18next/pages";
import clsx from "clsx";
import { CheckIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import Button from "@/components/ui/Button";
import ImageField from "@/components/ui/ImageField";
import Input from "@/components/ui/Input";
import LinkField from "@/components/ui/LinkField";
import Select from "@/components/ui/Select";
import TranslatedField from "@/components/ui/TranslatedField";
import CtaButton from "@/components/public/CtaButton";
import Reveal from "@/components/public/Reveal";
import SectionIntro from "@/components/public/SectionIntro";
import { emptyTranslated, tr } from "@/utils/localized";
import type { Translated } from "@/types/content";
import type { BlockEditorProps, BlockRendererProps } from "./types";

/**
 * "For men" and "for women" — the site is shared, so the first question a
 * visitor has is which half of it is theirs.
 *
 * Each side is one coach: their photograph, who they train, and the results
 * their clients come for, as a ticked list. The list is **one field with one
 * result per line** rather than a repeater of single fields: an editor writing
 * five short lines in three languages would otherwise be clicking "add" fifteen
 * times, and the order they type is the order that shows.
 *
 * The accent is per side — neon for one, pink for the other — because the two
 * colours are already the site's pair, and it lets each half be told apart at a
 * glance without a second visual language.
 */

export type AudienceAccent = "acid" | "flare";

export type AudienceItem = {
  id: string;
  image: string | null;
  alt: string;
  /** "Pentru bărbați" — the line the visitor looks for. */
  audience: Translated;
  /** The coach's name, the same in every language. */
  name: string;
  text: Translated;
  /** One result per line. */
  results: Translated;
  ctaLabel: Translated;
  ctaHref: string;
  accent: AudienceAccent;
};

export type AudienceSplitData = {
  eyebrow: Translated;
  title: Translated;
  lead: Translated;
  items: AudienceItem[];
};

let counter = 0;
const nextId = () => `audience-${Date.now().toString(36)}-${counter++}`;

const emptyItem = (accent: AudienceAccent = "acid"): AudienceItem => ({
  id: nextId(),
  image: null,
  alt: "",
  audience: emptyTranslated(),
  name: "",
  text: emptyTranslated(),
  results: emptyTranslated(),
  ctaLabel: emptyTranslated(),
  ctaHref: "",
  accent,
});

/** Blank lines are an editor's spacing, not an empty tick. */
const lines = (value: string) =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

const ACCENTS: Record<AudienceAccent, { text: string; tick: string; rule: string }> = {
  acid: { text: "text-acid-500", tick: "bg-acid-500 text-ink-950", rule: "bg-acid-500" },
  flare: { text: "text-flare-400", tick: "bg-flare-500 text-white", rule: "bg-flare-500" },
};

export function AudienceSplitEditor({ data, onChange }: BlockEditorProps<AudienceSplitData>) {
  const { t } = useTranslation("common");
  const items = data.items ?? [];

  const update = (id: string, patch: Partial<AudienceItem>) =>
    onChange({
      ...data,
      items: items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    });

  return (
    <div className="space-y-4">
      <TranslatedField
        label={t("blocks.audienceSplit.eyebrow")}
        value={data.eyebrow ?? emptyTranslated()}
        onChange={(eyebrow) => onChange({ ...data, eyebrow })}
      />
      <TranslatedField
        label={t("blocks.audienceSplit.title")}
        value={data.title ?? emptyTranslated()}
        onChange={(title) => onChange({ ...data, title })}
      />
      <TranslatedField
        label={t("blocks.audienceSplit.lead")}
        value={data.lead ?? emptyTranslated()}
        onChange={(lead) => onChange({ ...data, lead })}
        multiline
        rows={2}
      />

      <ul className="space-y-3">
        {items.map((item, index) => (
          <li key={item.id} className="rounded-lg border border-gray-200 bg-gray-50/60 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {t("blocks.audienceSplit.item", { index: index + 1 })}
              </span>
              <button
                type="button"
                onClick={() => onChange({ ...data, items: items.filter((i) => i.id !== item.id) })}
                className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-600"
                aria-label={t("blocks.audienceSplit.remove", { index: index + 1 })}
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <ImageField
                label={t("blocks.audienceSplit.image")}
                url={item.image}
                alt={item.alt}
                onChange={({ url, alt }) => update(item.id, { image: url, alt })}
              />
              <div className="grid gap-3 sm:grid-cols-3">
                <TranslatedField
                  label={t("blocks.audienceSplit.audience")}
                  value={item.audience ?? emptyTranslated()}
                  onChange={(audience) => update(item.id, { audience })}
                  required
                />
                <Input
                  label={t("blocks.audienceSplit.name")}
                  value={item.name ?? ""}
                  onChange={(event) => update(item.id, { name: event.target.value })}
                />
                <Select
                  label={t("blocks.audienceSplit.accent")}
                  value={item.accent ?? "acid"}
                  onChange={(event) =>
                    update(item.id, { accent: event.target.value as AudienceAccent })
                  }
                >
                  <option value="acid">{t("blocks.audienceSplit.accentAcid")}</option>
                  <option value="flare">{t("blocks.audienceSplit.accentFlare")}</option>
                </Select>
              </div>
              <TranslatedField
                label={t("blocks.audienceSplit.text")}
                value={item.text ?? emptyTranslated()}
                onChange={(text) => update(item.id, { text })}
                multiline
                rows={3}
              />
              <TranslatedField
                label={t("blocks.audienceSplit.results")}
                hint={t("blocks.audienceSplit.resultsHint")}
                value={item.results ?? emptyTranslated()}
                onChange={(results) => update(item.id, { results })}
                multiline
                rows={5}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <TranslatedField
                  label={t("blocks.audienceSplit.ctaLabel")}
                  value={item.ctaLabel ?? emptyTranslated()}
                  onChange={(ctaLabel) => update(item.id, { ctaLabel })}
                />
                <LinkField
                  label={t("blocks.audienceSplit.ctaHref")}
                  value={item.ctaHref ?? ""}
                  onChange={(ctaHref) => update(item.id, { ctaHref })}
                />
              </div>
            </div>
          </li>
        ))}
      </ul>

      <Button
        variant="secondary"
        onClick={() =>
          onChange({
            ...data,
            items: [...items, emptyItem(items.length % 2 ? "flare" : "acid")],
          })
        }
      >
        <PlusIcon className="h-4 w-4" aria-hidden />
        {t("blocks.audienceSplit.add")}
      </Button>
    </div>
  );
}

export function AudienceSplitRenderer({ data, locale }: BlockRendererProps<AudienceSplitData>) {
  // A side with no "for whom" is a coach card, which the trainer grid already is.
  const items = (data.items ?? []).filter((item) => tr(item.audience, locale));
  if (!items.length) return null;

  return (
    <section>
      <SectionIntro
        eyebrow={tr(data.eyebrow, locale)}
        title={tr(data.title, locale)}
        lead={tr(data.lead, locale)}
        className="mb-12"
      />

      <div className={clsx("grid gap-6 lg:gap-8", items.length > 1 && "md:grid-cols-2")}>
        {items.map((item, index) => {
          const accent = ACCENTS[item.accent] ?? ACCENTS.acid;
          const results = lines(tr(item.results, locale));
          const text = tr(item.text, locale);
          const label = tr(item.ctaLabel, locale);

          return (
            <Reveal
              as="article"
              key={item.id}
              delay={index * 90}
              className="flex flex-col overflow-hidden rounded-panel bg-ink-900 ring-1 ring-white/10"
            >
              <div className="relative aspect-[4/5] overflow-hidden bg-ink-800 sm:aspect-[3/4]">
                {item.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.image}
                    alt={item.alt || ""}
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 h-full w-full object-cover object-top"
                  />
                )}
                <span
                  aria-hidden
                  className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-ink-900 via-ink-900/60 to-transparent"
                />
                <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                  <span aria-hidden className={clsx("block h-1 w-12", accent.rule)} />
                  <h3 className="mt-4 font-head text-3xl uppercase leading-[1.08] text-white sm:text-4xl">
                    {tr(item.audience, locale)}
                  </h3>
                  {item.name && (
                    <p className={clsx("mt-1 font-head text-xl", accent.text)}>{item.name}</p>
                  )}
                </div>
              </div>

              <div className="flex flex-1 flex-col p-6 sm:p-8">
                {text && <p className="text-base leading-relaxed text-ink-300">{text}</p>}

                {results.length > 0 && (
                  <ul className={clsx("space-y-3", text && "mt-6")}>
                    {results.map((result) => (
                      <li key={result} className="flex items-start gap-3 text-ink-100">
                        <span
                          aria-hidden
                          className={clsx(
                            "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                            accent.tick,
                          )}
                        >
                          <CheckIcon className="h-3 w-3" strokeWidth={3} />
                        </span>
                        <span className="leading-snug">{result}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {label && item.ctaHref && (
                  <div className="mt-auto pt-8">
                    <CtaButton href={item.ctaHref} variant={item.accent === "flare" ? "outline" : "primary"}>
                      {label}
                    </CtaButton>
                  </div>
                )}
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}

export const audienceSplitDefaults = (): AudienceSplitData => ({
  eyebrow: emptyTranslated(),
  title: emptyTranslated(),
  lead: emptyTranslated(),
  items: [emptyItem("acid"), emptyItem("flare")],
});
