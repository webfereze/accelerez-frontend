import Link from "next/link";
import clsx from "clsx";
import {
  ButtonSweep,
  buttonClasses,
  type ButtonSize,
  type ButtonVariant,
} from "./Button";

/**
 * A link that looks like a button.
 *
 * Kept separate from `Button` rather than making that component polymorphic:
 * navigation is an anchor and an action is a button, and conflating them is how
 * keyboard and screen-reader behaviour quietly breaks.
 */
export default function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
  children,
  ...rest
}: React.ComponentProps<typeof Link> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}) {
  return (
    <Link
      href={href}
      className={clsx(buttonClasses({ variant, size, fullWidth }), className)}
      {...rest}
    >
      <ButtonSweep variant={variant} />
      <span className="relative inline-flex items-center justify-center gap-2">
        {children}
      </span>
    </Link>
  );
}
