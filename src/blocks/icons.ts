import {
  PlayCircleIcon,
  TableCellsIcon,
  ClipboardDocumentCheckIcon,
  VideoCameraIcon,
  ChatBubbleLeftRightIcon,
  CreditCardIcon,
  UserPlusIcon,
  ChartBarIcon,
  BoltIcon,
  FireIcon,
  TrophyIcon,
  ShieldCheckIcon,
  BanknotesIcon,
  HomeModernIcon,
  MapIcon,
  SparklesIcon,
  HeartIcon,
  SunIcon,
  UserGroupIcon,
  TruckIcon,
  MapPinIcon,
  ClockIcon,
  PhoneIcon,
  CheckBadgeIcon,
  BookOpenIcon,
} from "@heroicons/react/24/outline";

/**
 * The icons an editor may choose, as a closed list.
 *
 * A free text field here would mean an editor typing a Heroicons name they read
 * somewhere, and a page that renders a hole when they mistype it. A closed list
 * is also what lets the editor show a picker rather than a text box.
 *
 * Keys are **the stored value** and must never be renamed — they are written
 * into block data, and renaming one blanks the icon on every page already using
 * it. Adding is free; removing is not.
 */
export const BLOCK_ICONS = {
  // The product's own vocabulary first — these are what a page about training
  // actually needs. The general ones below are kept so pages written before
  // they were added still render their chosen mark.
  play: PlayCircleIcon,
  sheet: TableCellsIcon,
  diet: ClipboardDocumentCheckIcon,
  video: VideoCameraIcon,
  chat: ChatBubbleLeftRightIcon,
  card: CreditCardIcon,
  userPlus: UserPlusIcon,
  chart: ChartBarIcon,
  bolt: BoltIcon,
  fire: FireIcon,
  trophy: TrophyIcon,
  shield: ShieldCheckIcon,
  money: BanknotesIcon,
  lodging: HomeModernIcon,
  map: MapIcon,
  sparkles: SparklesIcon,
  heart: HeartIcon,
  sun: SunIcon,
  people: UserGroupIcon,
  car: TruckIcon,
  pin: MapPinIcon,
  clock: ClockIcon,
  phone: PhoneIcon,
  badge: CheckBadgeIcon,
  guide: BookOpenIcon,
} as const;

export type BlockIconKey = keyof typeof BLOCK_ICONS;

export const BLOCK_ICON_KEYS = Object.keys(BLOCK_ICONS) as BlockIconKey[];

/** Falls back to a neutral mark rather than rendering nothing. */
export function iconFor(key: string | null | undefined) {
  return BLOCK_ICONS[(key ?? "") as BlockIconKey] ?? SparklesIcon;
}
