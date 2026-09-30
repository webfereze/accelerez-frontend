/**
 * The social networks the association can list, and their marks.
 *
 * **A closed list with real glyphs**, not free text with initials. Two reasons:
 * a brand is recognised by its mark and not by the letters "fa", and a free
 * field means an editor types "Facebook", "facebook" and "FB" into three
 * records that then render three different things.
 *
 * Keys are the stored value and must never be renamed — they are written into
 * the `site` setting, and a rename blanks the icon on every profile already
 * saved. Adding is free.
 *
 * The paths are traced from each brand's own published mark and drawn with
 * `currentColor`, so one icon works on the light footer column and on the dark
 * panel without a second copy.
 */
export const SOCIAL_NETWORKS = [
  "facebook",
  "instagram",
  "tiktok",
  "youtube",
  "x",
  "linkedin",
] as const;

export type SocialNetwork = (typeof SOCIAL_NETWORKS)[number];

/** What an editor sees in the picker. Not translated — they are proper nouns. */
export const SOCIAL_LABELS: Record<SocialNetwork, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  x: "X",
  linkedin: "LinkedIn",
};

type IconProps = { className?: string };

const PATHS: Record<SocialNetwork, React.ReactNode> = {
  facebook: (
    <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.52 1.49-3.91 3.77-3.91 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.45 2.91h-2.33V22c4.78-.76 8.44-4.92 8.44-9.94Z" />
  ),
  instagram: (
    <>
      <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41-.56-.22-.96-.48-1.38-.9-.42-.42-.68-.82-.9-1.38-.16-.42-.36-1.06-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41 1.27-.06 1.65-.07 4.85-.07Z" />
      <circle cx="12" cy="12" r="3.33" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="16.8" cy="7.2" r="1.1" fill="#fff" />
    </>
  ),
  tiktok: (
    <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 1 1-1.84-2.48V9.78a5.72 5.72 0 1 0 4.93 5.66V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3a4.3 4.3 0 0 1-3.24-1.48Z" />
  ),
  youtube: (
    <path d="M21.58 7.19a2.51 2.51 0 0 0-1.77-1.77C18.25 5 12 5 12 5s-6.25 0-7.81.42A2.51 2.51 0 0 0 2.42 7.2 26.2 26.2 0 0 0 2 12a26.2 26.2 0 0 0 .42 4.81 2.51 2.51 0 0 0 1.77 1.77C5.75 19 12 19 12 19s6.25 0 7.81-.42a2.51 2.51 0 0 0 1.77-1.77A26.2 26.2 0 0 0 22 12a26.2 26.2 0 0 0-.42-4.81ZM10 15.02V8.98L15.2 12 10 15.02Z" />
  ),
  x: (
    <path d="M17.53 3h3.2l-6.99 7.99L22 21h-6.44l-5.05-6.6L4.74 21h-3.2l7.48-8.55L2 3h6.6l4.56 6.03L17.53 3Zm-1.12 16.06h1.77L7.68 4.84H5.78l10.63 14.22Z" />
  ),
  linkedin: (
    <path d="M6.94 5.5a1.94 1.94 0 1 1-3.88 0 1.94 1.94 0 0 1 3.88 0ZM3.2 8.98h3.5V21H3.2V8.98Zm5.7 0h3.35v1.64h.05c.47-.88 1.6-1.81 3.3-1.81 3.53 0 4.18 2.32 4.18 5.34V21h-3.5v-5.16c0-1.23-.02-2.82-1.72-2.82-1.72 0-1.98 1.34-1.98 2.73V21H8.9V8.98Z" />
  ),
};

/** One network's mark, or null for a key that is no longer in the list. */
export default function SocialIcon({
  network,
  className,
}: {
  network: string;
  className?: string;
}) {
  const path = PATHS[network as SocialNetwork];
  if (!path) return null;

  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      focusable="false"
      className={className}
    >
      {path}
    </svg>
  );
}

/** True when a stored key still maps to a mark this build knows. */
export function isKnownNetwork(network: string): network is SocialNetwork {
  return (SOCIAL_NETWORKS as readonly string[]).includes(network);
}

export type { IconProps };
