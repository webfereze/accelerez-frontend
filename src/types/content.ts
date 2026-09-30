/**
 * The shapes the API answers with.
 *
 * Hand-kept in step with the backend entities. When a field is renamed there it
 * shows up here as `undefined` at run time rather than as a compile error, so
 * the two are changed together or not at all.
 */

// --- languages --------------------------------------------------------------

/** The languages the site is served in. */
export const LOCALES = ["ro", "hu", "en"] as const;
export type Locale = (typeof LOCALES)[number];

/**
 * The language every record is guaranteed to have, and what a missing
 * translation falls back to.
 *
 * Romanian on both counts here: the association writes in Romanian, and a
 * visitor whose language is missing should read Romanian rather than nothing.
 * They are separate constants because they answer different questions and a
 * project can have them differ.
 */
export const SOURCE_LOCALE: Locale = "ro";
export const FALLBACK_LOCALE: Locale = "ro";

/** How each language is offered in the switcher. `name` is its own name. */
export const LOCALE_META: Record<Locale, { flag: string; code: string; name: string }> = {
  ro: { flag: "🇷🇴", code: "RO", name: "Română" },
  hu: { flag: "🇭🇺", code: "HU", name: "Magyar" },
  en: { flag: "🇬🇧", code: "EN", name: "English" },
};

export const LOCALE_LABELS: Record<Locale, string> = {
  ro: LOCALE_META.ro.name,
  hu: LOCALE_META.hu.name,
  en: LOCALE_META.en.name,
};

/**
 * A translatable value, stored server-side as one JSON column.
 *
 * Read it with `tr(value, locale)` — never `value[locale]` directly, or a
 * record with no Hungarian renders as an empty string instead of falling back.
 */
export type Translated = {
  ro: string;
  hu?: string | null;
  en?: string | null;
};

// --- pages and blocks -------------------------------------------------------

export type PageBlock = {
  id: string;
  type: string;
  data: Record<string, unknown>;
};

export type PageStatus = "draft" | "published";
export type PageLayout = "full" | "sidebar";

export type Page = {
  id: number;
  slug: string;
  title: Translated;
  excerpt: Translated | null;
  content: PageBlock[] | null;
  sidebar: PageBlock[] | null;
  layout: PageLayout;
  status: PageStatus;
  sortOrder: number;
  isHomepage: boolean;
  parentId: number | null;
  /**
   * The parent's slug and title, attached by the API when there is one — for
   * the breadcrumb, which is the only thing that needs it. See the note on
   * `findPublishedBySlug`.
   */
  parent?: { slug: string; title: Translated } | null;
  seoTitle: Translated | null;
  seoDescription: Translated | null;
  noindex: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

// --- navigation and settings ------------------------------------------------

export type MenuItem = {
  id: number;
  label: Translated;
  href: string;
  children?: MenuItem[];
};

export type SocialProfile = { network: string; url: string };

export type SiteSettings = {
  name?: string;
  /** Brand mark, as an uploaded URL. Falls back to the name set in type. */
  logo?: string | null;
  tagline?: Translated | null;
  about?: Translated | null;
  phone?: string;
  email?: string;
  address?: string;
  company?: { name?: string; cui?: string; onrc?: string };
  social?: SocialProfile[];
  /**
   * The persistent button in the header (blueprint ch. 02).
   *
   * Editable rather than hardcoded because it is the single most consequential
   * string on the site — it is what a visitor is asked to do on every page —
   * and the document proposes wording Creative is expected to confirm. Empty
   * falls back to the `nav.headerCta` UI string and `/contact`.
   */
  headerCta?: { label?: Translated | null; href?: string };
  /** Falls back for a shared link when a page has no image of its own. */
  shareImage?: string | null;
  shareImageAlt?: string | null;
};

/** Deploy-level config, served by the API so this app needs none of its own. */
export type SiteConfig = {
  baseUrl: string;
  allowIndexing: boolean;
};

/** A blog article. Named `Post` because `Article` is a DOM element name. */
export type Post = {
  id: number;
  /** A URL segment per language — see `LocalizedSlug`. */
  slug: LocalizedSlug;
  title: Translated;
  excerpt: Translated | null;
  content: PageBlock[] | null;
  coverImage: string | null;
  coverAlt: string | null;
  /** A name, not a user id — most contributors will never have an account. */
  author: string | null;
  tags: string[] | null;
  /** Fills the large tile in the listing and in the home page block. */
  isFeatured: boolean;
  readingMinutes: number | null;
  /** One of the five, from a closed list. Shown on the card above the date. */
  category: BlogCategory | null;
  specializations: Specialization[] | null;
  authorRole: Translated | null;
  /** The last substantive revision, deliberately not `updatedAt`. */
  contentUpdatedAt: string | null;
  relatedTrainerIds: number[] | null;
  relatedPostIds: number[] | null;
  ctaLabel: Translated | null;
  ctaHref: string | null;
  publishedLocales: PublishedLocales | null;
  status: PageStatus;
  /** Stamped on first publish and then left alone. Null while unpublished. */
  publishedAt: string | null;
  seoTitle: Translated | null;
  seoDescription: Translated | null;
  noindex: boolean;
  updatedAt: string;
};

export type PostTag = { tag: string; count: number };

// --- Accelerez's own content -------------------------------------

/**
 * A URL segment per language.
 *
 * Romanian is always present — it is the source language. A language with no
 * entry here is one the record was never written in, and the site must not
 * serve it under another language's address.
 */
export type LocalizedSlug = { ro: string; hu?: string; en?: string };

/** Which languages a record is actually live in. Empty means Romanian only. */
export type PublishedLocales = Locale[];

/**
 * The closed lists, as arrays rather than as unions alone.
 *
 * A union type vanishes at run time, and every one of these has to be rendered
 * as a set of options *in a fixed order*. Declaring the array and deriving the
 * type from it means the select, the checklist and the type can never disagree
 * about what the options are.
 *
 * **These mirror `accelerez-backend/src/shared/enums/accelerez.enum.ts` and are
 * one decision in two files.** A value here that the API does not know is
 * rejected on save; a value there that is missing here renders as its raw key.
 */

/** What a trainer is for. Ordered by how often a visitor arrives wanting it. */
export const SPECIALIZATIONS = [
  "weight_loss",
  "muscle_gain",
  "strength",
  "conditioning",
  "nutrition",
  "rehab",
  "mobility",
  "prenatal",
  "seniors",
  "kids",
  "competition",
] as const;
export type Specialization = (typeof SPECIALIZATIONS)[number];

/** Where the work happens — deliberately not a specialisation. */
export const TRAINING_FORMATS = ["online", "in_person", "hybrid"] as const;
export type TrainingFormat = (typeof TRAINING_FORMATS)[number];

export const ENROLLMENT_STATUSES = [
  "pending",
  "active",
  "paused",
  "ended",
  "declined",
] as const;
export type EnrollmentStatus = (typeof ENROLLMENT_STATUSES)[number];

export const MEMBERSHIP_STATUSES = ["unpaid", "paid", "waived", "refunded"] as const;
export type MembershipStatus = (typeof MEMBERSHIP_STATUSES)[number];

export const PAYMENT_METHODS = ["cash", "transfer", "card", "other"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const RESOURCE_TYPES = ["video", "sheet", "diet", "tip", "document", "link"] as const;
export type ResourceType = (typeof RESOURCE_TYPES)[number];

export const RESOURCE_VISIBILITIES = ["client", "library"] as const;
export type ResourceVisibility = (typeof RESOURCE_VISIBILITIES)[number];

export const CLIENT_VIDEO_STATUSES = ["pending", "reviewed", "archived"] as const;
export type ClientVideoStatus = (typeof CLIENT_VIDEO_STATUSES)[number];

export const BLOG_CATEGORIES = [
  "training",
  "nutrition",
  "recovery",
  "mindset",
  "stories",
] as const;
export type BlogCategory = (typeof BLOG_CATEGORIES)[number];

export const REQUEST_STATUSES = ["new", "handled", "spam"] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

/** The four roles. Registration only ever produces `client` — see the API. */
export const USER_ROLES = ["admin", "editor", "trainer", "client"] as const;
export type UserRole = (typeof USER_ROLES)[number];

// --- the product -----------------------------------------------------------

/** A certification as it appears on a profile. */
export type Certification = { name: string; issuer?: string; year?: number };

/**
 * A trainer's public profile.
 *
 * The public API returns exactly this. Nothing about their clients, their
 * income or their account is in it — that lives behind `/portal`.
 */
export type Trainer = {
  id: number;
  userId: number;
  slug: LocalizedSlug;
  displayName: string;
  headline: Translated | null;
  excerpt: Translated | null;
  content: PageBlock[] | null;
  photo: string | null;
  coverImage: string | null;
  city: string | null;
  county: string | null;
  formats: TrainingFormat[] | null;
  specializations: Specialization[] | null;
  yearsExperience: number | null;
  certifications: Certification[] | null;
  monthlyPrice: number | null;
  currency: string;
  capacity: number | null;
  isAcceptingClients: boolean;
  isFeatured: boolean;
  phone: string | null;
  publicEmail: string | null;
  social: Record<string, string> | null;
  status: PageStatus;
  publishedLocales: PublishedLocales | null;
  sortOrder: number;
  seoTitle: Translated | null;
  seoDescription: Translated | null;
  noindex: boolean;
  /** Joined on admin screens only. */
  user?: AccountUser;
};

/** How full a trainer is. Counted live — never cached on the profile. */
export type Occupancy = { active: number; capacity: number | null; free: number | null };

/** The account behind any sign-in. */
export type AccountUser = {
  id: number;
  email: string;
  /** The handle the portal's addresses use instead of the id. */
  slug: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  locale: string;
  role: UserRole;
  isActive?: boolean;
};

/**
 * Whether the training material may be shown, and why not when it may not.
 *
 * Computed by the API from the enrolment's status and the current month's
 * payment — never stored, so it cannot drift from what was actually paid.
 */
export type AccessState = {
  open: boolean;
  reason: "not_active" | "unpaid" | null;
  /** The period covering today, when there is one. */
  startsOn: string | null;
  endsOn: string | null;
  status: MembershipStatus | null;
  amount: number | null;
  currency: string;
  paidAt: string | null;
  /** How long the period runs and how much of it is left — see the API. */
  daysTotal: number;
  daysLeft: number;
  /** When the last period ended, if it has. Lets a closed screen say when. */
  lastEndedOn: string | null;
};

/** One client training with one trainer. */
export type Enrollment = {
  id: number;
  clientId: number;
  trainerId: number;
  status: EnrollmentStatus;
  goal: string | null;
  /** The trainer's private note. Present only on the trainer's own screens. */
  trainerNote?: string | null;
  acceptedAt: string | null;
  endedAt: string | null;
  createdAt: string;
  updatedAt: string;
  client?: AccountUser;
  trainer?: Trainer;
  /** Added by the trainer's client list — the current month, per row. */
  access?: AccessState;
};

/** The client's own view of an enrolment. Carries no trainer note. */
export type ClientEnrollment = {
  id: number;
  status: EnrollmentStatus;
  goal: string | null;
  acceptedAt: string | null;
  createdAt: string;
  trainer: Pick<
    Trainer,
    "id" | "displayName" | "photo" | "slug" | "headline" | "city" | "monthlyPrice" | "currency"
  >;
  access: AccessState;
  /** Messages from the trainer this client has not read. */
  unreadMessages: number;
};

/** One calendar month of one enrolment, and whether it was paid for. */
export type MembershipPeriod = {
  id: number;
  enrollmentId: number;
  /** `YYYY-MM-DD`. A period runs 28 days from here — see the API's period.ts. */
  startsOn: string;
  /** Its last day, inclusive. */
  endsOn: string;
  status: MembershipStatus;
  amount: number | null;
  currency: string;
  method: PaymentMethod | null;
  paidAt: string | null;
  validatedById: number | null;
  validatedAt: string | null;
  note: string | null;
  createdAt: string;
};

/**
 * Something a trainer gave a client.
 *
 * Deliberately **not** translated: a coach writes one client one plan, in the
 * language the two of them speak.
 */
export type TrainingResource = {
  id: number;
  trainerId: number;
  enrollmentId: number | null;
  visibility: ResourceVisibility;
  type: ResourceType;
  title: string;
  description: string | null;
  url: string | null;
  filePath: string | null;
  body: string | null;
  isPublished: boolean;
  sortOrder: number;
  seenAt: string | null;
  createdAt: string;
  updatedAt: string;
};

/** A video the client filmed of themselves, and the trainer's answer. */
export type ClientVideo = {
  id: number;
  enrollmentId: number;
  title: string;
  note: string | null;
  filePath: string | null;
  url: string | null;
  fileSize: number | null;
  mimeType: string | null;
  status: ClientVideoStatus;
  /** Legacy: the trainer's single answer, before remarks became a thread. */
  feedback: string | null;
  reviewedAt: string | null;
  reviewedById: number | null;
  /** When the client last opened it — what the "new reply" dot is computed from. */
  clientSeenAt: string | null;
  createdAt: string;
  enrollment?: Enrollment;
};

/** The counts on a trainer's dashboard, in one response. */
export type TrainerOverview = {
  trainer: Pick<
    Trainer,
    "id" | "displayName" | "photo" | "status" | "isAcceptingClients" | "capacity" | "monthlyPrice" | "currency"
  >;
  active: number;
  pending: number;
  paused: number;
  unpaidThisMonth: number;
  pendingVideos: number;
  unpaidClients: Array<{
    enrollmentId: number;
    /** The handle the dashboard links with — never the id. */
    slug: string | null;
    name: string;
    email: string;
    /** When their last confirmed period ran out, when there was one. */
    lastEndedOn: string | null;
    status: MembershipStatus | null;
  }>;
};

/** What a trainer collected, by month. `waived` is counted apart. */
export type RevenueMonth = {
  year: number;
  month: number;
  paid: number;
  waived: number;
  total: number;
};

// --- marketing content -----------------------------------------------------

export type Faq = {
  id: number;
  question: Translated;
  answer: Translated;
  topic: string | null;
  sortOrder: number;
  isVisible: boolean;
};

export type Testimonial = {
  id: number;
  quote: Translated;
  author: string;
  role: string | null;
  company: string | null;
  avatar: string | null;
  trainerId: number | null;
  approved: boolean;
  isFeatured: boolean;
  sortOrder: number;
  createdAt: string;
};

export type ContactRequest = {
  id: number;
  name: string;
  email: string;
  message: string;
  company: string | null;
  phone: string | null;
  website: string | null;
  goal: Specialization | null;
  locale: string;
  sourceUrl: string | null;
  sourcePost: string | null;
  status: RequestStatus;
  /** Internal note — who replied and what was agreed. Never public. */
  note: string | null;
  handledAt: string | null;
  createdAt: string;
};

/** The envelope every paged admin list answers with. */
export type Paged<T> = { rows: T[]; total: number; page: number; perPage: number };

/**
 * One point on a client's timeline — a date, photographs, a weight, a note.
 *
 * The deltas are computed by the API, not here: two screens show this and a
 * subtraction done in each of them is one that eventually disagrees with
 * itself. See `ProgressService`.
 */
export type ProgressEntry = {
  id: number;
  enrollmentId: number;
  /** `YYYY-MM-DD` — the day the photograph is of, not the day it was uploaded. */
  takenAt: string;
  photos: Array<{ url: string; pose?: "front" | "side" | "back" }> | null;
  weightKg: number | null;
  measurements: Record<string, number> | null;
  note: string | null;
  /** The trainer's remark. They comment on a point; they never amend it. */
  trainerNote: string | null;
  consentToShare: boolean;
  createdAt: string;
  /** Kilograms against the previous entry, and against the very first one. */
  deltaFromPrevious: number | null;
  deltaFromStart: number | null;
};

/** The first entry carrying a photograph, beside the latest one. */
export type ProgressComparison = { before: ProgressEntry; after: ProgressEntry } | null;

/** One file or link travelling with a message. */
export type MessageAttachment = {
  kind: "video" | "image" | "document" | "link";
  url: string;
  name?: string;
  size?: number;
  mimeType?: string;
};

/**
 * One message in the thread between a client and their trainer.
 *
 * The thread hangs off the enrolment, so there is no conversation to create and
 * no membership to keep in step — see `MessageEntity`.
 */
export type Message = {
  id: number;
  enrollmentId: number;
  senderId: number;
  body: string | null;
  attachments: MessageAttachment[] | null;
  readAt: string | null;
  createdAt: string;
  sender?: AccountUser;
};

/**
 * A class somebody can join — CrossFit, boxing, yoga.
 *
 * Distinct from a trainer (a person you enrol with) and from a session (one
 * occurrence in a calendar): a class is the offer, with a price and a duration.
 * See `TrainingClassEntity`.
 */
export type TrainingClass = {
  id: number;
  slug: LocalizedSlug;
  title: Translated;
  excerpt: Translated | null;
  content: PageBlock[] | null;
  image: string | null;
  imageAlt: string | null;
  /** When it runs, in words — read, never queried. */
  scheduleText: Translated | null;
  /** ISO weekdays — 1 is Monday. What "next training" is computed from. */
  weekdays: number[] | null;
  /** `HH:MM`, 24-hour. */
  startTime: string | null;
  /** Only sent to people who have joined — see `TrainingClassEntity`. */
  meetingUrl?: string | null;
  /** `YYYY-MM-DD` for a course with a start date. */
  startsOn: string | null;
  durationMinutes: number | null;
  /** Either price may be absent; the card then shows a single figure. */
  pricePerSession: number | null;
  pricePerMonth: number | null;
  currency: string;
  /** The corner ribbon. Empty means none. */
  ribbon: Translated | null;
  location: "gym" | "online" | "outdoor" | "other";
  place: string | null;
  city: string | null;
  capacity: number | null;
  specializations: Specialization[] | null;
  trainerIds: number[] | null;
  status: PageStatus;
  isFeatured: boolean;
  publishedLocales: PublishedLocales | null;
  sortOrder: number;
  seoTitle: Translated | null;
  seoDescription: Translated | null;
  noindex: boolean;
  /** Resolved by the API, in the editor's order — see `withTrainers`. */
  trainers?: Array<Pick<Trainer, "id" | "displayName" | "photo" | "slug">>;
  /** Counted live on the class page — never cached. */
  memberCount?: number;
  freePlaces?: number | null;
};

/** Somebody in a class. `left` is kept: it is the record that they were here. */
export type ClassMember = {
  id: number;
  classId: number;
  clientId: number;
  status: "active" | "left";
  note: string | null;
  /** The coach's private note. Never sent to the client. */
  trainerNote?: string | null;
  joinedAt: string;
  client?: AccountUser;
  /** Whether the coach has accepted them as a client — computed, never stored. */
  accepted?: boolean;
};

/** A class in the client's own account, with the next date on it. */
export type ClientClass = {
  membershipId: number;
  joinedAt: string;
  trainingClass: TrainingClass;
  /** ISO timestamp of the next occurrence, when the class has a schedule. */
  nextAt: string | null;
  /** Whether a coach of this class has accepted them — what carries the link. */
  accepted: boolean;
  trainerIds: number[];
};

/** One person expected at one occurrence of a class. */
export type AgendaAttendee = {
  memberId: number;
  clientId: number;
  name: string;
  /** Whether this coach has accepted them — an unaccepted member has no link. */
  accepted: boolean;
};

/**
 * One time a class runs, on the trainer's calendar.
 *
 * `at` is a **local wall-clock string** (`2026-09-23T18:00`) with no zone, so
 * `new Date(at)` parses it as the hour the class actually starts rather than
 * shifting it — see `AgendaService` on the backend.
 */
export type AgendaOccurrence = {
  classId: number;
  slug: LocalizedSlug;
  title: Translated;
  at: string;
  day: string;
  time: string;
  durationMinutes: number | null;
  location: "gym" | "online" | "outdoor" | "other";
  place: string | null;
  city: string | null;
  meetingUrl: string | null;
  status: "draft" | "published";
  capacity: number | null;
  attendees: AgendaAttendee[];
  acceptedCount: number;
};

// --- The shop ---------------------------------------------------------------

export const PRODUCT_CATEGORIES = [
  "training_plan",
  "meal_plan",
  "bundle",
  "recipes",
  "menu",
  "other",
] as const;
export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

/**
 * One way to buy a product. The id is stable and is what an order points at;
 * `price` null is "preț la cerere", never free.
 */
export type ProductVariant = {
  id: string;
  label: Translated;
  price: number | null;
  compareAtPrice: number | null;
};

export type Product = {
  id: number;
  slug: LocalizedSlug;
  title: Translated;
  category: ProductCategory;
  excerpt: Translated | null;
  content: PageBlock[] | null;
  image: string | null;
  imageAlt: string | null;
  variants: ProductVariant[];
  currency: string;
  deliveryNote: Translated | null;
  ribbon: Translated | null;
  trainerId: number | null;
  status: PageStatus;
  isFeatured: boolean;
  publishedLocales: PublishedLocales | null;
  sortOrder: number;
  seoTitle: Translated | null;
  seoDescription: Translated | null;
  noindex: boolean;
  /** Resolved by the public API. */
  trainer?: Pick<Trainer, "id" | "displayName" | "photo" | "slug"> | null;
};

export const ORDER_STATUSES = ["new", "confirmed", "paid", "delivered", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** One line of an order — copied at the moment of ordering, see `OrderEntity`. */
export type OrderLine = {
  productId: number;
  variantId: string;
  productTitle: string;
  /** Null when the product has a single variant. */
  variantLabel: string | null;
  /** Null for "preț la cerere". */
  unitPrice: number | null;
  quantity: number;
  trainerId: number | null;
};

/** An order as the admin sees it. */
export type Order = {
  id: number;
  reference: string;
  items: OrderLine[];
  total: number | null;
  hasPriceOnRequest: boolean;
  currency: string;
  name: string;
  email: string;
  phone: string;
  message: string | null;
  locale: string;
  sourceUrl: string | null;
  status: OrderStatus;
  paidAt: string | null;
  note: string | null;
  createdAt: string;
};

/** What the browser keeps: which product, which variant, how many — never a price. */
export type CartItem = { productId: number; variantId: string; quantity: number };

/** A cart line as the server prices it now. */
export type QuotedLine = OrderLine & {
  slug: string | null;
  image: string | null;
  compareAtPrice: number | null;
  lineTotal: number | null;
};

/** The cart, priced by the server. */
export type Quote = {
  lines: QuotedLine[];
  /** Lines that can no longer be bought. */
  unavailable: Array<{ productId: number; variantId: string }>;
  total: number | null;
  hasPriceOnRequest: boolean;
  currency: string;
};

/** What the customer is shown once the order is in. */
export type OrderReceipt = {
  reference: string;
  lines: OrderLine[];
  total: number | null;
  hasPriceOnRequest: boolean;
  currency: string;
};
