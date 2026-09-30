import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "next-i18next/pages";
import { ArrowRightIcon, PlayCircleIcon } from "@heroicons/react/24/outline";
import Input from "@/components/ui/Input";
import LinkField from "@/components/ui/LinkField";
import TranslatedField from "@/components/ui/TranslatedField";
import { emptyTranslated, tr } from "@/utils/localized";
import type { Translated } from "@/types/content";
import type { BlockEditorProps, BlockRendererProps } from "./types";

/**
 * The front page's opening — as a block, so the wording is the editor's.
 *
 * **The headline is three fields, not one**, because the middle one is set in
 * the neon italic the logo is drawn in. A single field with markup in it would
 * mean an editor typing HTML to get the accent, and getting a stray `<em>` into
 * a page title the first time they paste from somewhere.
 *
 * Two things are **not** editable and that is deliberate: the row of faces and
 * the count beneath it come from the directory through `context`, because a
 * hand-typed "peste 40 de antrenori" is a number that is wrong within a month
 * and is exactly the kind of claim this product must not make falsely. With no
 * trainers published the row renders nothing rather than inventing anybody.
 *
 * The panel on the right is the product itself — a client's account with the
 * month settled. Showing the thing beats describing it, and it is the honest
 * answer to "what do I get for the money", which is why the lines in it are
 * editable but the shape is not.
 */

export type HomeHeroData = {
  badge: Translated;
  titleLead: Translated;
  /** The one word in the neon. One, not three — see the class note. */
  titleAccent: Translated;
  titleRest: Translated;
  lead: Translated;
  primaryLabel: Translated;
  primaryHref: string;
  secondaryLabel: Translated;
  secondaryHref: string;
  /** The row of faces and the count. Off for a campaign page. */
  showProof: boolean;
  proofLabel: Translated;
  cardTitle: Translated;
  cardBadge: Translated;
  cardItems: { id: string; text: Translated }[];
  cardNote: Translated;
};

export function HomeHeroEditor({ data, onChange }: BlockEditorProps<HomeHeroData>) {
  const { t } = useTranslation("common");

  const patchItem = (id: string, text: Translated) =>
    onChange({
      ...data,
      cardItems: (data.cardItems ?? []).map((item) =>
        item.id === id ? { ...item, text } : item,
      ),
    });

  return (
    <div className="space-y-4">
      <TranslatedField
        label={t("blocks.homeHero.badge")}
        hint={t("blocks.homeHero.badgeHint")}
        value={data.badge ?? emptyTranslated()}
        onChange={(badge) => onChange({ ...data, badge })}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <TranslatedField
          label={t("blocks.homeHero.titleLead")}
          value={data.titleLead ?? emptyTranslated()}
          onChange={(titleLead) => onChange({ ...data, titleLead })}
          required
        />
        <TranslatedField
          label={t("blocks.homeHero.titleAccent")}
          hint={t("blocks.homeHero.titleAccentHint")}
          value={data.titleAccent ?? emptyTranslated()}
          onChange={(titleAccent) => onChange({ ...data, titleAccent })}
        />
        <TranslatedField
          label={t("blocks.homeHero.titleRest")}
          value={data.titleRest ?? emptyTranslated()}
          onChange={(titleRest) => onChange({ ...data, titleRest })}
        />
      </div>

      <TranslatedField
        label={t("blocks.homeHero.lead")}
        value={data.lead ?? emptyTranslated()}
        onChange={(lead) => onChange({ ...data, lead })}
        multiline
        rows={3}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <TranslatedField
          label={t("blocks.homeHero.primaryLabel")}
          value={data.primaryLabel ?? emptyTranslated()}
          onChange={(primaryLabel) => onChange({ ...data, primaryLabel })}
        />
        <LinkField
          label={t("blocks.homeHero.primaryHref")}
          value={data.primaryHref ?? ""}
          onChange={(primaryHref) => onChange({ ...data, primaryHref })}
        />
        <TranslatedField
          label={t("blocks.homeHero.secondaryLabel")}
          value={data.secondaryLabel ?? emptyTranslated()}
          onChange={(secondaryLabel) => onChange({ ...data, secondaryLabel })}
        />
        <LinkField
          label={t("blocks.homeHero.secondaryHref")}
          value={data.secondaryHref ?? ""}
          onChange={(secondaryHref) => onChange({ ...data, secondaryHref })}
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={data.showProof ?? true}
          onChange={(event) => onChange({ ...data, showProof: event.target.checked })}
          className="h-4 w-4 rounded border-gray-300"
        />
        {t("blocks.homeHero.showProof")}
      </label>

      {(data.showProof ?? true) && (
        <TranslatedField
          label={t("blocks.homeHero.proofLabel")}
          hint={t("blocks.homeHero.proofLabelHint")}
          value={data.proofLabel ?? emptyTranslated()}
          onChange={(proofLabel) => onChange({ ...data, proofLabel })}
        />
      )}

      <fieldset className="rounded-lg border border-gray-200 p-4">
        <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
          {t("blocks.homeHero.card")}
        </legend>

        <div className="grid gap-3 sm:grid-cols-2">
          <TranslatedField
            label={t("blocks.homeHero.cardTitle")}
            value={data.cardTitle ?? emptyTranslated()}
            onChange={(cardTitle) => onChange({ ...data, cardTitle })}
          />
          <TranslatedField
            label={t("blocks.homeHero.cardBadge")}
            value={data.cardBadge ?? emptyTranslated()}
            onChange={(cardBadge) => onChange({ ...data, cardBadge })}
          />
        </div>

        <div className="mt-3 space-y-3">
          {(data.cardItems ?? []).map((item, index) => (
            <TranslatedField
              key={item.id}
              label={t("blocks.homeHero.cardItem", { index: index + 1 })}
              value={item.text ?? emptyTranslated()}
              onChange={(text) => patchItem(item.id, text)}
            />
          ))}
        </div>

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() =>
              onChange({
                ...data,
                cardItems: [
                  ...(data.cardItems ?? []),
                  { id: `i${Date.now()}`, text: emptyTranslated() },
                ],
              })
            }
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            {t("blocks.homeHero.addItem")}
          </button>
          {(data.cardItems ?? []).length > 0 && (
            <button
              type="button"
              onClick={() =>
                onChange({ ...data, cardItems: (data.cardItems ?? []).slice(0, -1) })
              }
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              {t("blocks.homeHero.removeItem")}
            </button>
          )}
        </div>

        <div className="mt-3">
          <TranslatedField
            label={t("blocks.homeHero.cardNote")}
            hint={t("blocks.homeHero.cardNoteHint")}
            value={data.cardNote ?? emptyTranslated()}
            onChange={(cardNote) => onChange({ ...data, cardNote })}
            multiline
            rows={2}
          />
        </div>
      </fieldset>
    </div>
  );
}

export function HomeHeroRenderer({
  data,
  locale,
  context,
}: BlockRendererProps<HomeHeroData>) {
  const trainers = context?.trainers ?? [];
  const faces = trainers.filter((trainer) => trainer.photo).slice(0, 4);
  const showProof = (data.showProof ?? true) && faces.length > 0;

  const primary = tr(data.primaryLabel, locale);
  const secondary = tr(data.secondaryLabel, locale);

  return (
    // Full-bleed: `BlockRenderer` gives this type no container, because the
    // washes have to reach the glass. The gutter is the `site-container` below.
    <section className="relative overflow-hidden">
      {/* Two soft washes rather than a photograph: an image behind the headline
          would have to be dimmed so far to keep the type legible that nobody
          could tell what it was of. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-70"
        style={{
          background:
            "radial-gradient(60rem 40rem at 15% -10%, rgba(0,234,84,0.18), transparent 60%), radial-gradient(45rem 35rem at 90% 10%, rgba(255,46,136,0.14), transparent 60%)",
        }}
      />

      <div className="site-container grid gap-14 py-16 md:py-24 lg:grid-cols-[1.15fr_1fr] lg:items-center lg:gap-16 lg:py-28">
        <div>
          {tr(data.badge, locale) && (
            <p className="inline-flex items-center gap-2 rounded-full border border-acid-500/30 bg-acid-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-acid-400">
              <span className="h-1.5 w-1.5 rounded-full bg-acid-500" aria-hidden />
              {tr(data.badge, locale)}
            </p>
          )}

          <h1 className="mt-6 font-head text-[2.75rem] leading-[1.02] tracking-tight text-white sm:text-6xl lg:text-[4.25rem]">
            {tr(data.titleLead, locale)}{" "}
            {tr(data.titleAccent, locale) && (
              <>
                <em className="italic text-acid-500">{tr(data.titleAccent, locale)}</em>{" "}
              </>
            )}
            {tr(data.titleRest, locale)}
          </h1>

          {tr(data.lead, locale) && (
            <p className="mt-6 max-w-xl text-base leading-relaxed text-ink-300 md:text-lg">
              {tr(data.lead, locale)}
            </p>
          )}

          {(primary || secondary) && (
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              {primary && (
                <Link
                  href={data.primaryHref || "/antrenori"}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-acid-500 px-7 font-head font-semibold text-ink-950 transition-colors hover:bg-acid-400"
                >
                  {primary}
                  <ArrowRightIcon className="h-4 w-4" aria-hidden />
                </Link>
              )}

              {secondary && (
                <Link
                  href={data.secondaryHref || "/cum-functioneaza"}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/20 px-6 font-head font-medium text-white transition-colors hover:border-acid-500 hover:text-acid-400"
                >
                  <PlayCircleIcon className="h-5 w-5" aria-hidden />
                  {secondary}
                </Link>
              )}
            </div>
          )}

          {showProof && (
            <div className="mt-10 flex items-center gap-4">
              <ul className="flex -space-x-3">
                {faces.map((trainer) => (
                  <li
                    key={trainer.id}
                    className="relative h-11 w-11 overflow-hidden rounded-full ring-2 ring-ink-950"
                  >
                    <Image
                      src={trainer.photo as string}
                      alt={trainer.displayName}
                      fill
                      sizes="44px"
                      className="object-cover"
                    />
                  </li>
                ))}
              </ul>
              <p className="text-sm text-ink-400">
                {/* The count is the directory's, never the editor's — see the
                    class note. `{{count}}` in their text is replaced. */}
                {tr(data.proofLabel, locale).replace("{{count}}", String(trainers.length))}
              </p>
            </div>
          )}
        </div>

        <div className="relative">
          <div className="rounded-panel border border-white/10 bg-ink-900/80 p-5 shadow-2xl shadow-black/40 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
              <p className="font-head text-sm text-white">{tr(data.cardTitle, locale)}</p>
              {tr(data.cardBadge, locale) && (
                <span className="rounded-full bg-acid-500/15 px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-wider text-acid-400 ring-1 ring-inset ring-acid-500/30">
                  {tr(data.cardBadge, locale)}
                </span>
              )}
            </div>

            <ul className="mt-4 space-y-2.5">
              {(data.cardItems ?? []).map((item) => (
                <li
                  key={item.id}
                  className="flex items-center gap-3 rounded-card bg-white/5 px-4 py-3 text-sm text-ink-200"
                >
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-acid-500" aria-hidden />
                  {tr(item.text, locale)}
                </li>
              ))}
            </ul>

            {tr(data.cardNote, locale) && (
              <p className="mt-4 rounded-card border border-flare-500/25 bg-flare-500/10 px-4 py-3 text-xs leading-relaxed text-flare-300">
                {tr(data.cardNote, locale)}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export const homeHeroDefaults = (): HomeHeroData => ({
  badge: emptyTranslated(),
  titleLead: emptyTranslated(),
  titleAccent: emptyTranslated(),
  titleRest: emptyTranslated(),
  lead: emptyTranslated(),
  primaryLabel: emptyTranslated(),
  primaryHref: "/antrenori",
  secondaryLabel: emptyTranslated(),
  secondaryHref: "/cum-functioneaza",
  showProof: true,
  proofLabel: emptyTranslated(),
  cardTitle: emptyTranslated(),
  cardBadge: emptyTranslated(),
  cardItems: [],
  cardNote: emptyTranslated(),
});
