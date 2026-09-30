import { useTranslation } from "next-i18next/pages";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import ImageField from "@/components/ui/ImageField";
import TranslatedField from "@/components/ui/TranslatedField";
import Reveal from "@/components/public/Reveal";
import { useCountUp } from "@/hooks/useCountUp";
import { BLOCK_ICON_KEYS, iconFor } from "./icons";
import { emptyTranslated, tr } from "@/utils/localized";
import type { Translated } from "@/types/content";
import type { BlockEditorProps, BlockRendererProps } from "./types";

/**
 * A claim on the left, the evidence beside it, and two pictures that overlap.
 *
 * The argument block: eyebrow, a large statement, a short paragraph, then the
 * points set in two tight columns with a small accent mark each. Short labels, not
 * sentences — the whole device only works if every line is two or three words,
 * so the eye reads the set as one object.
 *
 * A figure typed into the `value` field **counts up once** when it first comes
 * into view and is then set beside its label. They are plain numbers an editor
 * types rather than anything computed: a counter wired to a live query is a
 * counter that one day says "0 projects" on the front page because somebody
 * changed a filter.
 *
 * **The pictures overlap on purpose.** Two equal frames side by side read as a
 * comparison; one laid over the other reads as a composition, which is what an
 * agency's own page has to demonstrate rather than claim. They stack on a phone,
 * where an overlap would just be an obstruction.
 */

export type StatCard = {
  id: string;
  icon: string;
  /** Text, so "1.020 +" and "24/7" survive; parsed for the count-up. */
  value: string;
  label: Translated;
};

export type StatsGalleryData = {
  eyebrow: Translated;
  title: Translated;
  text: Translated;
  stats: StatCard[];
  imageLeft: string | null;
  imageLeftAlt: string;
  imageRight: string | null;
  imageRightAlt: string;
};

export function StatsGalleryEditor({
  data,
  onChange,
}: BlockEditorProps<StatsGalleryData>) {
  const { t } = useTranslation("common");
  const stats = data.stats ?? [];

  const setStat = (id: string, changes: Partial<StatCard>) =>
    onChange({
      ...data,
      stats: stats.map((stat) => (stat.id === id ? { ...stat, ...changes } : stat)),
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
        label={t("blocks.statsGallery.title")}
        value={data.title ?? emptyTranslated()}
        onChange={(title) => onChange({ ...data, title })}
        required
      />

      <TranslatedField
        label={t("blocks.statsGallery.text")}
        value={data.text ?? emptyTranslated()}
        onChange={(text) => onChange({ ...data, text })}
        multiline
        rows={3}
      />

      <fieldset className="rounded-xl border border-gray-200 p-4">
        <legend className="px-1 text-sm font-semibold text-gray-900">
          {t("blocks.statsGallery.stats")}
        </legend>

        <div className="space-y-3">
          {stats.map((stat) => (
            <div
              key={stat.id}
              className="grid gap-3 sm:grid-cols-[9rem_7rem_minmax(0,1fr)_auto]"
            >
              <Select
                label={t("blocks.statsGallery.icon")}
                value={stat.icon}
                onChange={(event) => setStat(stat.id, { icon: event.target.value })}
              >
                {BLOCK_ICON_KEYS.map((key) => (
                  <option key={key} value={key}>
                    {t(`blocks.icon.${key}`)}
                  </option>
                ))}
              </Select>
              <Input
                label={t("blocks.statsGallery.value")}
                value={stat.value}
                onChange={(event) => setStat(stat.id, { value: event.target.value })}
              />
              <TranslatedField
                label={t("blocks.statsGallery.label")}
                value={stat.label ?? emptyTranslated()}
                onChange={(label) => setStat(stat.id, { label })}
              />
              <Button
                variant="ghost"
                aria-label={t("common.remove")}
                className="self-end"
                onClick={() =>
                  onChange({ ...data, stats: stats.filter((s) => s.id !== stat.id) })
                }
              >
                <TrashIcon className="h-4 w-4" aria-hidden />
              </Button>
            </div>
          ))}
        </div>

        {/* Three is the row. A fourth wraps on a laptop and the shape is gone. */}
        {stats.length < 3 && (
          <Button
            variant="secondary"
            className="mt-3"
            onClick={() =>
              onChange({
                ...data,
                stats: [
                  ...stats,
                  {
                    id: `stat-${Date.now().toString(36)}`,
                    icon: "map",
                    value: "",
                    label: emptyTranslated(),
                  },
                ],
              })
            }
          >
            <PlusIcon className="h-4 w-4" aria-hidden />
            {t("blocks.statsGallery.addStat")}
          </Button>
        )}
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <ImageField
          label={t("blocks.statsGallery.imageLeft")}
          url={data.imageLeft ?? null}
          alt={data.imageLeftAlt ?? ""}
          onChange={({ url, alt }) =>
            onChange({ ...data, imageLeft: url, imageLeftAlt: alt })
          }
        />
        <ImageField
          label={t("blocks.statsGallery.imageRight")}
          url={data.imageRight ?? null}
          alt={data.imageRightAlt ?? ""}
          onChange={({ url, alt }) =>
            onChange({ ...data, imageRight: url, imageRightAlt: alt })
          }
        />
      </div>
    </div>
  );
}

export function StatsGalleryRenderer({
  data,
  locale,
}: BlockRendererProps<StatsGalleryData>) {
  const eyebrow = tr(data.eyebrow, locale);
  const title = tr(data.title, locale);
  const text = tr(data.text, locale);
  const stats = data.stats ?? [];

  if (!title) return null;

  return (
    <section className="relative grid items-center gap-14 [overflow:clip] lg:grid-cols-2 lg:gap-20">

      <Reveal className="relative min-w-0">
        {eyebrow && (
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-ink-300">
            {eyebrow}
          </p>
        )}

        <h2 className="mt-6 font-head text-[2.5rem] text-ink-50 lg:text-6xl">{title}</h2>

        {text && (
          <p className="mt-7 max-w-lg text-[1.05rem] leading-[1.8] text-ink-400">{text}</p>
        )}

        {stats.length > 0 && (
          <ul className="mt-10 grid gap-x-10 gap-y-5 sm:grid-cols-2">
            {stats.map((stat, index) => (
              <StatLine key={stat.id} stat={stat} locale={locale} index={index} />
            ))}
          </ul>
        )}
      </Reveal>

      {(data.imageLeft || data.imageRight) && (
        <div className="relative min-w-0 lg:pb-16 lg:pl-16">
          {data.imageRight && (
            <Reveal className="overflow-hidden rounded-panel bg-ink-800 lg:ml-auto lg:w-[78%]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={data.imageRight}
                alt={data.imageRightAlt ?? ""}
                loading="lazy"
                className="aspect-[4/3] w-full object-cover"
              />
            </Reveal>
          )}

          {data.imageLeft && (
            <Reveal
              delay={120}
              className="mt-5 overflow-hidden rounded-panel bg-ink-800 ring-1 ring-white/80 lg:absolute lg:bottom-0 lg:left-0 lg:mt-0 lg:w-[62%]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={data.imageLeft}
                alt={data.imageLeftAlt ?? ""}
                loading="lazy"
                className="aspect-[4/3] w-full object-cover"
              />
            </Reveal>
          )}
        </div>
      )}
    </section>
  );
}

/**
 * One point: an accent mark, an optional counted figure, and its label.
 *
 * The mark is a dot rather than a tick. A tick claims the thing is done or
 * true, which is a promise; a dot just says "this is one of the set", which is
 * what a list of capabilities actually is.
 */
function StatLine({
  stat,
  locale,
  index,
}: {
  stat: StatCard;
  locale: string;
  index: number;
}) {
  // "1.020 +" counts 1020 and keeps " +"; "24/7" is printed as typed, because
  // a counter that tried to animate it would render "NaN" on the way up.
  const match = /^\s*([\d.,\s]+)(.*)$/.exec(stat.value ?? "");
  const digits = match ? match[1].replace(/[^\d]/g, "") : "";
  const numeric = digits ? Number(digits) : NaN;
  const suffix = match ? match[2] : "";

  const { ref, shown } = useCountUp(numeric);
  const animates = Number.isFinite(numeric);
  const label = tr(stat.label, locale);

  return (
    <Reveal as="li" delay={index * 60} className="flex items-baseline gap-3.5">
      <span aria-hidden className="mt-2 h-2 w-2 shrink-0 self-start rounded-full bg-acid-500" />
      <span ref={ref} className="min-w-0 text-[1.05rem] leading-snug text-ink-300">
        {stat.value && (
          <span className="font-head text-ink-50 tabular-nums">
            {animates ? `${shown.toLocaleString(locale)}${suffix}` : stat.value}{" "}
          </span>
        )}
        {label}
      </span>
    </Reveal>
  );
}

export const statsGalleryDefaults = (): StatsGalleryData => ({
  eyebrow: emptyTranslated(),
  title: emptyTranslated(),
  text: emptyTranslated(),
  stats: [],
  imageLeft: null,
  imageLeftAlt: "",
  imageRight: null,
  imageRightAlt: "",
});
