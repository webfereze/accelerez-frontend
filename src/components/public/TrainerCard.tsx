import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "next-i18next/pages";
import { MapPinIcon } from "@heroicons/react/24/outline";
import { tr } from "@/utils/localized";
import { slugIn } from "@/utils/href";
import { formatKey, money, specializationKey } from "@/utils/labels";
import type { Trainer } from "@/types/content";

/**
 * One trainer, as a card.
 *
 * Written once and used in three places from the start — the home page, the
 * directory and the `trainerGrid` block — which is exactly the case the house
 * rule about building the primitive before the third copy is for.
 *
 * **The card answers the four questions a visitor actually has**, in the order
 * they ask them: who is this, what are they for, where are they, what does it
 * cost. Anything else belongs on the profile.
 *
 * A trainer who has closed their list still gets a card. Hiding them would make
 * the directory look emptier than the platform is, and someone deciding between
 * two coaches deserves to know one of them is full rather than to wonder why
 * they vanished.
 */
export default function TrainerCard({
  trainer,
  locale = "ro",
  priority = false,
}: {
  trainer: Trainer;
  locale?: string;
  priority?: boolean;
}) {
  const { t } = useTranslation("common");
  const href = `/antrenori/${slugIn(trainer.slug, locale)}`;
  const specializations = (trainer.specializations ?? []).slice(0, 3);

  return (
    <article className="group relative h-full">
      <Link
        href={href}
        className="flex h-full flex-col overflow-hidden rounded-card border border-white/10 bg-ink-900 transition-colors duration-300 hover:border-acid-500/50 focus-visible:border-acid-500"
      >
        <div className="relative aspect-4/5 overflow-hidden bg-ink-800">
          {trainer.photo ? (
            <Image
              src={trainer.photo}
              alt={trainer.displayName}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
              priority={priority}
              // Anchored to the top: a gym photograph is usually full-body,
              // and a centred crop of one puts the chest in the frame and the
              // face outside it.
              className="object-cover object-top transition-transform duration-500 ease-out group-hover:scale-105 motion-reduce:transition-none"
            />
          ) : (
            /* No photograph is a real state — a trainer added this morning has
               none. A monogram is a designed absence; a broken image is not. */
            <span className="flex h-full items-center justify-center font-head text-6xl text-white/15">
              {initials(trainer.displayName)}
            </span>
          )}

          {/* The gradient is what keeps the name legible over a light shirt. */}
          <div className="absolute inset-x-0 bottom-0 h-2/5 bg-linear-to-t from-ink-950 to-transparent" />

          {!trainer.isAcceptingClients && (
            <span className="absolute left-3 top-3 rounded-full bg-ink-950/85 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-wider text-flare-400 ring-1 ring-inset ring-flare-500/40">
              {t("trainer.full")}
            </span>
          )}

          <div className="absolute inset-x-0 bottom-0 p-4">
            <h3 className="font-head text-xl text-white">{trainer.displayName}</h3>
            {(trainer.city || trainer.formats?.length) && (
              <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-300">
                {trainer.city && (
                  <>
                    <MapPinIcon className="h-3.5 w-3.5" aria-hidden />
                    {trainer.city}
                  </>
                )}
                {trainer.formats?.[0] && (
                  <span className="text-ink-400">· {t(formatKey(trainer.formats[0]))}</span>
                )}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-1 flex-col p-4">
          {tr(trainer.headline, locale) && (
            <p className="text-sm leading-relaxed text-ink-300">
              {tr(trainer.headline, locale)}
            </p>
          )}

          {specializations.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-1.5">
              {specializations.map((spec) => (
                <li
                  key={spec}
                  className="rounded-full bg-white/5 px-2.5 py-1 text-[0.7rem] font-medium text-ink-200 ring-1 ring-inset ring-white/10"
                >
                  {t(specializationKey(spec))}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-auto flex items-end justify-between gap-3 pt-5">
            {trainer.monthlyPrice != null ? (
              <p className="text-sm text-ink-400">
                <span className="font-head text-lg text-acid-500">
                  {money(trainer.monthlyPrice, trainer.currency, locale)}
                </span>{" "}
                {t("trainer.perMonth")}
              </p>
            ) : (
              <p className="text-sm text-ink-400">{t("trainer.priceOnRequest")}</p>
            )}

            {trainer.yearsExperience != null && (
              <p className="shrink-0 text-xs text-ink-400">
                {t("trainer.years", { count: trainer.yearsExperience })}
              </p>
            )}
          </div>
        </div>
      </Link>
    </article>
  );
}

/** Two letters at most — three is a monogram nobody can read at this size. */
function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
