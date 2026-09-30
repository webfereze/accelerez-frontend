import type {
  ClientVideoStatus,
  EnrollmentStatus,
  MembershipStatus,
  PaymentMethod,
  ResourceType,
  Specialization,
  TrainingFormat,
} from "@/types/content";

/**
 * Enum values are keys, never sentences.
 *
 * Every closed list in this product is stored as a machine value — `weight_loss`,
 * `unpaid`, `in_person` — and has to be printed in three languages. These
 * helpers build the translation key, so a component writes
 * `t(specializationKey(value))` and the wording lives in
 * each locale's `common.json` where a translator can reach it.
 *
 * The alternative — a `Record<Specialization, string>` in a component — is a
 * fourth place the list exists, and the one that silently keeps the old wording
 * after somebody edits the locale file.
 */

export const specializationKey = (value: Specialization | string) => `spec.${value}`;
export const formatKey = (value: TrainingFormat | string) => `format.${value}`;
export const enrollmentStatusKey = (value: EnrollmentStatus | string) => `enrollment.${value}`;
export const membershipStatusKey = (value: MembershipStatus | string) => `membership.${value}`;
export const paymentMethodKey = (value: PaymentMethod | string) => `payment.${value}`;
export const resourceTypeKey = (value: ResourceType | string) => `resource.${value}`;
export const videoStatusKey = (value: ClientVideoStatus | string) => `video.${value}`;
export const monthKey = (month: number) => `month.${month}`;

/**
 * The colour a status wears, as Tailwind classes.
 *
 * **Decided once, here, because the same status appears on five screens** — the
 * client's dashboard, the trainer's list, the trainer's client detail, the
 * admin's oversight table and the payment history — and a status that is amber
 * on one screen and pink on the next is a status nobody learns to read.
 *
 * Green is reserved for "this is settled and open". Pink is "somebody has to do
 * something". Grey is over, and neither good nor bad.
 */
export const ENROLLMENT_TONE: Record<string, string> = {
  active: "bg-acid-500/15 text-acid-400 ring-1 ring-inset ring-acid-500/30",
  pending: "bg-flare-500/15 text-flare-400 ring-1 ring-inset ring-flare-500/30",
  paused: "bg-white/10 text-ink-200 ring-1 ring-inset ring-white/15",
  ended: "bg-white/5 text-ink-400 ring-1 ring-inset ring-white/10",
  declined: "bg-white/5 text-ink-400 ring-1 ring-inset ring-white/10",
};

export const MEMBERSHIP_TONE: Record<string, string> = {
  paid: "bg-acid-500/15 text-acid-400 ring-1 ring-inset ring-acid-500/30",
  waived: "bg-white/10 text-ink-200 ring-1 ring-inset ring-white/15",
  unpaid: "bg-flare-500/15 text-flare-400 ring-1 ring-inset ring-flare-500/30",
  refunded: "bg-white/5 text-ink-400 ring-1 ring-inset ring-white/10",
};

/** Money, in the currency the record carries. Never a hardcoded "RON". */
export function money(amount: number | null | undefined, currency = "RON", locale = "ro"): string {
  if (amount == null) return "";
  return new Intl.NumberFormat(locale === "ro" ? "ro-RO" : locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}
