import { useTranslation } from "next-i18next/pages";
import Link from "next/link";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import Input from "@/components/ui/Input";
import TranslatedField from "@/components/ui/TranslatedField";
import Reveal from "@/components/public/Reveal";
import SectionIntro from "@/components/public/SectionIntro";
import TrainerPoster from "@/components/public/TrainerPoster";
import { emptyTranslated, tr } from "@/utils/localized";
import type { Translated } from "@/types/content";
import type { BlockEditorProps, BlockRendererProps } from "./types";

/**
 * Trainers, read from the directory rather than typed into the block.
 *
 * **It carries no trainers.** The block stores a heading and how many to show;
 * the profiles arrive through `context`, fetched once by the page. A
 * hand-filled copy of the list is a copy that disagrees with the directory the
 * first time a coach closes their list — and it would be wrong in the worst
 * possible place, sending somebody to a profile that will refuse them.
 *
 * With no trainers it renders **nothing at all** rather than an empty heading:
 * a section waiting to be filled is worse than no section.
 *
 * **Two to a row, at half the screen each** — `TrainerPoster`, not the
 * directory's `TrainerCard`. On a front page the coaches are the offer, and
 * four tiles in a row make them look like stock. At half the width a
 * photograph is a person you are being introduced to, and there is room for
 * the name to be set large enough to read as one. The directory keeps the
 * four-up grid, because there the job is to compare twenty of them.
 *
 * An odd number leaves one poster over; it spans both columns rather than
 * sitting half-width beside a hole, and gets a shorter frame so a wide picture
 * does not become a second hero.
 */

export type TrainerGridData = {
  eyebrow: Translated;
  title: Translated;
  lead: Translated;
  linkLabel: Translated;
  /** A cap, not a promise — the directory may hold four or forty. */
  count: number;
};

export function TrainerGridEditor({ data, onChange }: BlockEditorProps<TrainerGridData>) {
  const { t } = useTranslation("common");

  return (
    <div className="space-y-4">
      <p className="rounded-lg bg-gray-50 p-3 text-xs text-gray-500">
        {t("blocks.trainerGrid.hint")}
      </p>

      <TranslatedField
        label={t("blocks.eyebrow")}
        hint={t("blocks.eyebrowHint")}
        value={data.eyebrow ?? emptyTranslated()}
        onChange={(eyebrow) => onChange({ ...data, eyebrow })}
      />

      <TranslatedField
        label={t("blocks.trainerGrid.title")}
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

      <TranslatedField
        label={t("blocks.trainerGrid.linkLabel")}
        value={data.linkLabel ?? emptyTranslated()}
        onChange={(linkLabel) => onChange({ ...data, linkLabel })}
      />

      <Input
        label={t("blocks.trainerGrid.count")}
        hint={t("blocks.trainerGrid.countHint")}
        type="number"
        min={1}
        max={12}
        value={String(data.count ?? 4)}
        onChange={(event) => onChange({ ...data, count: Number(event.target.value) || 4 })}
      />
    </div>
  );
}

export function TrainerGridRenderer({
  data,
  locale,
  context,
}: BlockRendererProps<TrainerGridData>) {
  const trainers = (context?.trainers ?? []).slice(
    0,
    Math.min(12, Math.max(1, data.count ?? 4)),
  );

  if (trainers.length === 0) return null;

  return (
    <section>
      <SectionIntro
        eyebrow={tr(data.eyebrow, locale)}
        title={tr(data.title, locale)}
        lead={tr(data.lead, locale)}
        className="mb-10"
      />

      <ul className="grid gap-5 md:grid-cols-2">
        {trainers.map((trainer, index) => {
          const alone = index === trainers.length - 1 && trainers.length % 2 === 1;

          return (
            <Reveal
              as="li"
              key={trainer.id}
              delay={index * 80}
              className={alone ? "md:col-span-2" : undefined}
            >
              <TrainerPoster trainer={trainer} locale={locale} wide={alone} />
            </Reveal>
          );
        })}
      </ul>

      {tr(data.linkLabel, locale) && (
        <p className="mt-10">
          <Link
            href="/antrenori"
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

export const trainerGridDefaults = (): TrainerGridData => ({
  eyebrow: emptyTranslated(),
  title: emptyTranslated(),
  lead: emptyTranslated(),
  linkLabel: emptyTranslated(),
  count: 4,
});
