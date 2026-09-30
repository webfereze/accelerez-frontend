/**
 * The four flags, drawn rather than typed.
 *
 * Emoji flags are the obvious shortcut and the wrong one: Windows ships no
 * flag glyphs at all, so `🇭🇺` renders as the letters "HU" in a box for a large
 * share of visitors — on the one control whose whole job is to be recognised
 * without reading. These are a handful of rectangles each, they inherit no
 * colour, and they cost nothing.
 *
 * Drawn on a 4:3 viewBox with a hairline border applied by the caller, so a
 * white field (Denmark's cross, Hungary's middle stripe) still reads as a flag
 * on a white page.
 */
type Props = { className?: string };

function Frame({ children, className }: Props & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 20 15"
      aria-hidden
      focusable="false"
      className={className}
      preserveAspectRatio="xMidYMid slice"
    >
      {children}
    </svg>
  );
}

/** Hungary — red, white, green in bands. */
export function FlagHU({ className }: Props) {
  return (
    <Frame className={className}>
      <rect width="20" height="5" fill="#CE2939" />
      <rect y="5" width="20" height="5" fill="#fff" />
      <rect y="10" width="20" height="5" fill="#477050" />
    </Frame>
  );
}

/** Romania — blue, yellow, red in pales. */
export function FlagRO({ className }: Props) {
  return (
    <Frame className={className}>
      <rect width="6.67" height="15" fill="#002B7F" />
      <rect x="6.67" width="6.66" height="15" fill="#FCD116" />
      <rect x="13.33" width="6.67" height="15" fill="#CE1126" />
    </Frame>
  );
}

/** English — the Union Flag, since the language has no flag of its own. */
export function FlagEN({ className }: Props) {
  return (
    <Frame className={className}>
      <rect width="20" height="15" fill="#012169" />
      {/* The white saltire, then the red one inset on it. */}
      <path d="M0 0 L20 15 M20 0 L0 15" stroke="#fff" strokeWidth="3" />
      <path d="M0 0 L20 15 M20 0 L0 15" stroke="#C8102E" strokeWidth="1.6" />
      {/* The cross of St George: white ground, red on top. */}
      <path d="M10 0 V15 M0 7.5 H20" stroke="#fff" strokeWidth="5" />
      <path d="M10 0 V15 M0 7.5 H20" stroke="#C8102E" strokeWidth="3" />
    </Frame>
  );
}

/** Denmark — the Dannebrog. */
export function FlagDK({ className }: Props) {
  return (
    <Frame className={className}>
      <rect width="20" height="15" fill="#C8102E" />
      <path d="M7 0 V15 M0 7 H20" stroke="#fff" strokeWidth="3" />
    </Frame>
  );
}

export const FLAGS = {
  hu: FlagHU,
  ro: FlagRO,
  en: FlagEN,
  da: FlagDK,
} as const;
