import { useTranslation } from "next-i18next/pages";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import TranslatedField from "@/components/ui/TranslatedField";
import Reveal from "@/components/public/Reveal";
import { BLOCK_ICON_KEYS, iconFor } from "./icons";
import { emptyTranslated, tr } from "@/utils/localized";
import type { Translated } from "@/types/content";
import type { BlockEditorProps, BlockRendererProps } from "./types";

/**
 * "How to get here" — the routes in, with a map beside them.
 *
 * Every destination site needs this and most bury it in a paragraph on a
 * contact page. As a block it is **structured**: each way in has an icon, a
 * name, a journey time and a line of advice, so a visitor comparing the train
 * against the drive can do it by scanning one column.
 *
 * The map is an **`<iframe>` the editor pastes**, not a mapping SDK. A map
 * library is an API key to hold, a bill to watch and a dependency to upgrade,
 * for a pin that never moves. `loading="lazy"` keeps it off the critical path,
 * and the block renders perfectly well with the field left empty.
 */

export type TravelMode = {
  id: string;
  icon: string;
  title: Translated;
  /** "2 h 30 min", "45 km" — free text, because journeys are described. */
  duration: string;
  text: Translated;
};

export type HowToGetThereData = {
  eyebrow: Translated;
  title: Translated;
  text: Translated;
  modes: TravelMode[];
  /** A `src` from a map provider's "embed" option. */
  mapEmbedUrl: string;
  note: Translated;
};

export function HowToGetThereEditor({
  data,
  onChange,
}: BlockEditorProps<HowToGetThereData>) {
  const { t } = useTranslation("common");
  const modes = data.modes ?? [];

  const setMode = (id: string, changes: Partial<TravelMode>) =>
    onChange({
      ...data,
      modes: modes.map((mode) => (mode.id === id ? { ...mode, ...changes } : mode)),
    });

  return (
    <div className="space-y-4">
      <TranslatedField
        label={t("blocks.howToGetThere.eyebrow")}
        value={data.eyebrow ?? emptyTranslated()}
        onChange={(eyebrow) => onChange({ ...data, eyebrow })}
      />

      <TranslatedField
        label={t("blocks.howToGetThere.title")}
        value={data.title ?? emptyTranslated()}
        onChange={(title) => onChange({ ...data, title })}
        required
      />

      <TranslatedField
        label={t("blocks.howToGetThere.text")}
        value={data.text ?? emptyTranslated()}
        onChange={(text) => onChange({ ...data, text })}
        multiline
        rows={2}
      />

      <fieldset className="rounded-xl border border-gray-200 p-4">
        <legend className="px-1 text-sm font-semibold text-gray-900">
          {t("blocks.howToGetThere.modes")}
        </legend>

        <div className="space-y-4">
          {modes.map((mode) => (
            <div key={mode.id} className="rounded-lg border border-gray-200 p-3">
              <div className="grid gap-3 sm:grid-cols-[9rem_minmax(0,1fr)_8rem_auto]">
                <Select
                  label={t("blocks.howToGetThere.icon")}
                  value={mode.icon}
                  onChange={(event) => setMode(mode.id, { icon: event.target.value })}
                >
                  {BLOCK_ICON_KEYS.map((key) => (
                    <option key={key} value={key}>
                      {t(`blocks.icon.${key}`)}
                    </option>
                  ))}
                </Select>
                <TranslatedField
                  label={t("blocks.howToGetThere.modeTitle")}
                  value={mode.title ?? emptyTranslated()}
                  onChange={(title) => setMode(mode.id, { title })}
                />
                <Input
                  label={t("blocks.howToGetThere.duration")}
                  value={mode.duration ?? ""}
                  onChange={(event) => setMode(mode.id, { duration: event.target.value })}
                />
                <Button
                  variant="ghost"
                  aria-label={t("common.remove")}
                  className="self-end"
                  onClick={() =>
                    onChange({ ...data, modes: modes.filter((m) => m.id !== mode.id) })
                  }
                >
                  <TrashIcon className="h-4 w-4" aria-hidden />
                </Button>
              </div>

              <div className="mt-3">
                <TranslatedField
                  label={t("blocks.howToGetThere.modeText")}
                  value={mode.text ?? emptyTranslated()}
                  onChange={(text) => setMode(mode.id, { text })}
                  multiline
                  rows={2}
                />
              </div>
            </div>
          ))}
        </div>

        {modes.length < 5 && (
          <Button
            variant="secondary"
            className="mt-3"
            onClick={() =>
              onChange({
                ...data,
                modes: [
                  ...modes,
                  {
                    id: `mode-${Date.now().toString(36)}`,
                    icon: "car",
                    title: emptyTranslated(),
                    duration: "",
                    text: emptyTranslated(),
                  },
                ],
              })
            }
          >
            <PlusIcon className="h-4 w-4" aria-hidden />
            {t("blocks.howToGetThere.addMode")}
          </Button>
        )}
      </fieldset>

      <Input
        label={t("blocks.howToGetThere.mapEmbedUrl")}
        hint={t("blocks.howToGetThere.mapEmbedHint")}
        value={data.mapEmbedUrl ?? ""}
        onChange={(event) => onChange({ ...data, mapEmbedUrl: event.target.value })}
      />

      <TranslatedField
        label={t("blocks.howToGetThere.note")}
        value={data.note ?? emptyTranslated()}
        onChange={(note) => onChange({ ...data, note })}
        multiline
        rows={2}
      />
    </div>
  );
}

export function HowToGetThereRenderer({
  data,
  locale,
}: BlockRendererProps<HowToGetThereData>) {
  const title = tr(data.title, locale);
  const eyebrow = tr(data.eyebrow, locale);
  const text = tr(data.text, locale);
  const note = tr(data.note, locale);
  const modes = data.modes ?? [];

  if (!title) return null;

  return (
    <section>
      <Reveal className="max-w-2xl">
        {eyebrow && (
          <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-ink-400">
            <span aria-hidden className="h-px w-6 bg-acid-500" />
            {eyebrow}
          </p>
        )}

        <h2 className="mt-4 font-head text-3xl leading-[1.12] tracking-tight text-ink-50 md:text-5xl">
          {title}
        </h2>

        {text && (
          <p className="mt-4 text-base leading-relaxed text-ink-400">{text}</p>
        )}
      </Reveal>

      <div className="mt-10 grid gap-10 lg:grid-cols-2 lg:gap-14">
        {modes.length > 0 && (
          <ul className="flex flex-col divide-y divide-ink-900/10">
            {modes.map((mode, index) => {
              const Icon = iconFor(mode.icon);

              return (
                <Reveal
                  as="li"
                  key={mode.id}
                  delay={index * 70}
                  className="flex gap-4 py-5 first:pt-0"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 text-ink-200">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                      <span className="font-head text-lg text-ink-50">
                        {tr(mode.title, locale)}
                      </span>
                      {mode.duration && (
                        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-acid-400 tabular-nums">
                          {mode.duration}
                        </span>
                      )}
                    </span>
                    <span className="mt-1.5 block text-sm leading-relaxed text-ink-400">
                      {tr(mode.text, locale)}
                    </span>
                  </span>
                </Reveal>
              );
            })}
          </ul>
        )}

        {data.mapEmbedUrl && (
          <Reveal className="min-w-0">
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-ink-800">
              <iframe
                src={data.mapEmbedUrl}
                title={title}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="aspect-[4/3] w-full"
              />
            </div>
          </Reveal>
        )}
      </div>

      {note && (
        <Reveal className="mt-8">
          <p className="border-l-2 border-acid-500 pl-4 text-sm leading-relaxed text-ink-400">
            {note}
          </p>
        </Reveal>
      )}
    </section>
  );
}

export const howToGetThereDefaults = (): HowToGetThereData => ({
  eyebrow: emptyTranslated(),
  title: emptyTranslated(),
  text: emptyTranslated(),
  modes: [],
  mapEmbedUrl: "",
  note: emptyTranslated(),
});
