import Link from "next/link";
import clsx from "clsx";
import { ArrowRightIcon } from "@heroicons/react/24/outline";

/**
 * The public site has exactly **three** buttons: the neon fill, the outline,
 * and the white one.
 *
 * All three are the same object at the same size — identical height, padding
 * and type — so a pair side by side reads as a pair rather than as a button and
 * a nearly-button. Only the fill differs.
 *
 * What is deliberate here:
 *
 * - **One size, and only one.** There is no large variant. Two button sizes on
 *   a page means deciding which of two calls to action matters more, and the
 *   answer is almost always "neither, they are next to each other" — so the
 *   pair reads as a pair. It sits on 44px, the floor for a comfortable touch
 *   target, and it does not grow in a hero.
 * - **Fully rounded.** A pill against the panels' soft corners and the cards'
 *   tighter ones: three radii, each on a different kind of object, so the
 *   hierarchy is legible rather than three near-misses at the same corner.
 * - **Near-black type on the neon, never white.** White on `#00ea54` is about
 *   1.6:1 and illegible; `ink-950` clears 12:1. This is a contrast requirement,
 *   not taste, and it is the first thing to check if the accent ever changes.
 *   See the note in `theme.css`.
 * - **Sentence case, display face, medium weight.** Not tracked-out capitals:
 *   at this scale capitals turn a two-word label into a texture, and the whole
 *   art direction is built on type you read rather than type you register.
 * - **The hover is a wipe, not a tint.** A dark panel sweeps in from the left
 *   and the label inverts on top of it. A colour that merely shifts a shade
 *   reads as a hover state; something arriving reads as a control.
 * - **The arrow travels, and it has no ring.** It leaves to the right while its
 *   twin enters from the left. A circle around a 16px arrow reads as a second,
 *   smaller button inside the first.
 * - **It does not move.** No lift and no shadow: shifting a small target on
 *   hover reads as the control dodging the pointer.
 *
 * All of it is switched off under `prefers-reduced-motion`, where the fill
 * simply appears.
 */

export type CtaVariant = "primary" | "outline" | "light";

/** The one size. 44px is the floor for a comfortable touch target. */
const SIZE = "min-h-11 gap-2.5 px-6 text-[0.9rem]";

const SHELL =
  "group relative isolate inline-flex items-center justify-center overflow-hidden rounded-full font-head font-medium tracking-normal transition-colors duration-300 ease-out focus-visible:outline-2 focus-visible:outline-offset-2";

type Skin = { base: string; sweep: string };

const SKINS: Record<"primary" | "light" | "outlineLight" | "outlineDark", Skin> = {
  // The hover colour is not decoration: the sweep paints a panel behind the
  // label, so every skin has to invert whatever its own sweep paints under it.
  // A label left as it was is black on black for the whole hover.
  primary: { base: "bg-acid-500 text-ink-950 hover:text-acid-400", sweep: "bg-ink-950" },
  light: { base: "bg-white text-ink-950 hover:text-ink-950", sweep: "bg-acid-500" },
  outlineLight: {
    base: "border border-white/25 text-white hover:text-ink-950",
    sweep: "bg-white",
  },
  outlineDark: {
    base: "border border-ink-950/25 text-ink-950 hover:text-white",
    sweep: "bg-ink-950",
  },
};

/**
 * `onDark` now means "on a *light* band" — the page itself is dark, so the
 * outline's default is the light-on-dark one and the flag is what a neon or a
 * white section passes. The prop kept its name so every existing caller kept
 * working; this is the one place that has to know.
 */
function skinFor(variant: CtaVariant, onDark: boolean): Skin {
  if (variant === "primary") return SKINS.primary;
  if (variant === "light") return SKINS.light;
  return onDark ? SKINS.outlineDark : SKINS.outlineLight;
}

/** The classes only — for the rare caller that has to own its own element. */
export function ctaClasses({
  variant = "primary",
  onDark = false,
  fullWidth = false,
}: {
  variant?: CtaVariant;
  onDark?: boolean;
  fullWidth?: boolean;
} = {}): string {
  return clsx(SHELL, SIZE, skinFor(variant, onDark).base, fullWidth && "w-full");
}

/**
 * The moving parts: the wipe behind the label, and the label above it.
 *
 * Exported so a `next/link` in the header renders the identical button without
 * either component owning a second copy of the markup.
 */
export function CtaInner({
  variant = "primary",
  onDark = false,
  arrow = true,
  icon,
  children,
}: {
  variant?: CtaVariant;
  onDark?: boolean;
  arrow?: boolean;
  /** A leading mark, where the label alone is not the instruction. */
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Behind the label, in front of the button's own fill. `origin-left` is
          what makes it a wipe rather than a fade. */}
      <span
        aria-hidden
        className={clsx(
          // `z-0`, not `-z-10`. The shell is `isolate`, so a negative z-index
          // child paints *behind* the parent's own background — which on a
          // filled button means the wipe never appears at all. The label above
          // carries `z-10` to stay on top of it.
          "absolute inset-0 z-0 origin-left scale-x-0 transition-transform duration-300 ease-out",
          "group-hover:scale-x-100 group-focus-visible:scale-x-100",
          "motion-reduce:transition-none",
          skinFor(variant, onDark).sweep,
        )}
      />

      {icon && (
        <span aria-hidden className="relative z-10 flex h-4 w-4 shrink-0 items-center">
          {icon}
        </span>
      )}

      <span className="relative z-10">{children}</span>

      {arrow && (
        // A 16px window with two arrows in it: one leaves to the right as its
        // twin arrives from the left. The overflow is what sells it — the arrow
        // goes *somewhere* rather than nudging and snapping back.
        <span aria-hidden className="relative z-10 block h-4 w-4 shrink-0 overflow-hidden">
          <ArrowRightIcon
            strokeWidth={2}
            className="absolute inset-0 h-4 w-4 transition-transform duration-300 ease-out group-hover:translate-x-5 motion-reduce:transition-none"
          />
          <ArrowRightIcon
            strokeWidth={2}
            className="absolute inset-0 h-4 w-4 -translate-x-5 transition-transform duration-300 ease-out group-hover:translate-x-0 motion-reduce:hidden"
          />
        </span>
      )}
    </>
  );
}

export default function CtaButton({
  href,
  variant = "primary",
  onDark = false,
  fullWidth = false,
  newTab = false,
  /** Off for a button whose label is already an instruction ("Trimite"). */
  arrow = true,
  icon,
  locale,
  className,
  children,
}: {
  href: string;
  variant?: CtaVariant;
  /** True when the button sits on a dark background. */
  onDark?: boolean;
  fullWidth?: boolean;
  newTab?: boolean;
  arrow?: boolean;
  icon?: React.ReactNode;
  /** Sends the link to another language — see `next/link`'s `locale`. */
  locale?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const classes = clsx(ctaClasses({ variant, onDark, fullWidth }), className);
  const inner = (
    <CtaInner variant={variant} onDark={onDark} arrow={arrow} icon={icon}>
      {children}
    </CtaInner>
  );

  // Editors type whatever they like into a CTA — an anchor, a mail link, an
  // absolute URL. Only an in-site path can be client-routed, and handing the
  // rest to `next/link` would have it try to prefetch a `mailto:`.
  const internal = href.startsWith("/") && !newTab;

  if (internal) {
    return (
      <Link href={href} locale={locale} className={classes}>
        {inner}
      </Link>
    );
  }

  return (
    <a
      href={href}
      target={newTab ? "_blank" : undefined}
      rel={newTab ? "noopener noreferrer" : undefined}
      className={classes}
    >
      {inner}
    </a>
  );
}

/**
 * The bare arrow a card ends with, and the `Read more →` text link.
 *
 * Its own component because the design uses it about as often as it uses the
 * filled button: on every card in every grid. It is a link, not a button —
 * nothing is filled, the arrow slides on hover, and the whole card is usually
 * the click target with this only marking where the eye should land.
 */
export function ArrowLink({
  href,
  label,
  className,
}: {
  href: string;
  /** Omitted for the bare arrow at the foot of a card. */
  label?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={clsx(
        "group/arrow inline-flex items-center gap-3 font-head text-sm font-medium text-ink-50",
        className,
      )}
    >
      {label}
      <ArrowRightIcon
        strokeWidth={2}
        className="h-5 w-5 transition-transform duration-300 ease-out group-hover/arrow:translate-x-1.5 group-hover:translate-x-1.5 motion-reduce:transition-none"
      />
    </Link>
  );
}
