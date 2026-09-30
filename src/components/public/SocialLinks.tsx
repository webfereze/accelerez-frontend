import clsx from "clsx";
import SocialIcon, { SOCIAL_LABELS, isKnownNetwork } from "./SocialIcons";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import type { SocialNetwork } from "./SocialIcons";

/**
 * The association's social profiles, as a row of marks.
 *
 * Read from the `site` setting — never hardcoded — and edited at
 * `/admin/settings`. With that setting still blank, which is how it ships, this
 * renders **nothing at all** rather than a row of dead icons pointing at
 * profiles that may not exist.
 *
 * A profile whose network this build does not recognise is **skipped rather
 * than drawn as a hole**: the stored key is open-ended data and a future entry
 * should degrade to absence, not to an empty square.
 *
 * The accessible name is the network's own name, so a screen reader announces
 * "Facebook" rather than "link".
 */
export default function SocialLinks({
  onDark = false,
  size = "md",
  className,
  style,
}: {
  onDark?: boolean;
  size?: "sm" | "md";
  className?: string;
  /** For the hero, which staggers this row in after the buttons. */
  style?: React.CSSProperties;
}) {
  const profiles = (useSiteSettings().social ?? []).filter(
    (profile) => profile?.url && isKnownNetwork(profile.network),
  );

  if (profiles.length === 0) return null;

  return (
    <ul className={clsx("flex flex-wrap items-center gap-2", className)} style={style}>
      {profiles.map((profile) => (
        <li key={`${profile.network}-${profile.url}`}>
          <a
            href={profile.url}
            target="_blank"
            rel="noopener noreferrer"
            className={clsx(
              "flex items-center justify-center rounded-full border transition-colors",
              size === "sm" ? "h-10 w-10" : "h-11 w-11",
              onDark
                ? "border-white/25 text-ink-200 hover:border-white hover:bg-ink-900 hover:text-ink-50"
                : "border-white/15 text-ink-400 hover:border-ink-900 hover:bg-ink-900 hover:text-ink-50",
            )}
          >
            <span className="sr-only">
              {SOCIAL_LABELS[profile.network as SocialNetwork]}
            </span>
            <SocialIcon
              network={profile.network}
              className={size === "sm" ? "h-4 w-4" : "h-[1.1rem] w-[1.1rem]"}
            />
          </a>
        </li>
      ))}
    </ul>
  );
}
