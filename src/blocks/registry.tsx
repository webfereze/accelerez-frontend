import {
  Bars3BottomLeftIcon,
  QueueListIcon,
  Squares2X2Icon,
  ViewColumnsIcon,
  PhotoIcon,
  SparklesIcon,
  TrophyIcon,
  NewspaperIcon as LatestPostsIcon,
  MegaphoneIcon,
  StarIcon,
  ArrowTrendingUpIcon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  ExclamationCircleIcon,
  IdentificationIcon,
  EnvelopeIcon,
  PlayCircleIcon,
  CursorArrowRaysIcon,
  PhotoIcon as GalleryIcon,
  Squares2X2Icon as GalleryPreviewIcon,
  VideoCameraIcon,
  NewspaperIcon,
  ShoppingBagIcon,
  RectangleStackIcon,
  MapIcon,
  BookOpenIcon,
  RectangleGroupIcon,
  InboxArrowDownIcon,
  Square2StackIcon,
  ArrowsRightLeftIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import {
  RichTextEditor,
  RichTextRenderer,
  richTextDefaults,
} from "./RichTextBlock";
import {
  AccordionEditor,
  AccordionRenderer,
  accordionDefaults,
} from "./AccordionBlock";
import {
  MediaTextEditor,
  MediaTextRenderer,
  mediaTextDefaults,
} from "./MediaTextBlock";
import { ColumnsEditor, ColumnsRenderer, columnsDefaults } from "./ColumnsBlock";
import {
  CardGridEditor,
  CardGridRenderer,
  cardGridDefaults,
} from "./CardGridBlock";
import { HeroEditor, HeroRenderer, heroDefaults } from "./HeroBlock";
import {
  ImageStripEditor,
  ImageStripRenderer,
  imageStripDefaults,
} from "./ImageStripBlock";
import {
  SplitCtaEditor,
  SplitCtaRenderer,
  splitCtaDefaults,
} from "./SplitCtaBlock";
import {
  TransformationsEditor,
  TransformationsRenderer,
  transformationsDefaults,
} from "./TransformationsBlock";
import { AwardsEditor, AwardsRenderer, awardsDefaults } from "./AwardsBlock";
import {
  TrainerGridEditor,
  TrainerGridRenderer,
  trainerGridDefaults,
} from "./TrainerGridBlock";
import { HomeHeroEditor, HomeHeroRenderer, homeHeroDefaults } from "./HomeHeroBlock";
import { StepsEditor, StepsRenderer, stepsDefaults } from "./StepsBlock";
import { FaqListEditor, FaqListRenderer, faqListDefaults } from "./FaqListBlock";
import { ClassGridEditor, ClassGridRenderer, classGridDefaults } from "./ClassGridBlock";
import {
  TestimonialsEditor,
  TestimonialsRenderer,
  testimonialsDefaults,
} from "./TestimonialsBlock";
import { NoticeEditor, NoticeRenderer, noticeDefaults } from "./NoticeBlock";
import { GalleryEditor, GalleryRenderer, galleryDefaults } from "./GalleryBlock";
import {
  GalleryPreviewEditor,
  GalleryPreviewRenderer,
  galleryPreviewDefaults,
} from "./GalleryPreviewBlock";
import {
  ContactCardEditor,
  ContactCardRenderer,
  contactCardDefaults,
} from "./ContactCardBlock";
import { SliderEditor, SliderRenderer, sliderDefaults } from "./SliderBlock";
import {
  NewsletterEditor,
  NewsletterRenderer,
  newsletterDefaults,
} from "./NewsletterBlock";
import { ImageEditor, ImageRenderer, imageDefaults } from "./ImageBlock";
import { VideoEditor, VideoRenderer, videoDefaults } from "./VideoBlock";
import { CtaEditor, CtaRenderer, ctaDefaults } from "./CtaBlock";
import {
  ShowcaseEditor,
  ShowcaseRenderer,
  showcaseDefaults,
} from "./ShowcaseBlock";
import {
  LatestPostsEditor,
  LatestPostsRenderer,
  latestPostsDefaults,
} from "./LatestPostsBlock";
import {
  PromoBandEditor,
  PromoBandRenderer,
  promoBandDefaults,
} from "./PromoBandBlock";
import {
  FeatureTeaserEditor,
  FeatureTeaserRenderer,
  featureTeaserDefaults,
} from "./FeatureTeaserBlock";
import {
  HowToGetThereEditor,
  HowToGetThereRenderer,
  howToGetThereDefaults,
} from "./HowToGetThereBlock";
import {
  ContactPanelEditor,
  ContactPanelRenderer,
  contactPanelDefaults,
} from "./ContactPanelBlock";
import {
  StatsGalleryEditor,
  StatsGalleryRenderer,
  statsGalleryDefaults,
} from "./StatsGalleryBlock";
import { EmbedEditor, EmbedRenderer, embedDefaults } from "./EmbedBlock";
import { DuoHeroEditor, DuoHeroRenderer, duoHeroDefaults } from "./DuoHeroBlock";
import {
  AudienceSplitEditor,
  AudienceSplitRenderer,
  audienceSplitDefaults,
} from "./AudienceSplitBlock";
import {
  ProductGridEditor,
  ProductGridRenderer,
  productGridDefaults,
} from "./ProductGridBlock";
import type { Block, BlockType } from "./types";

/** Inline placeholder so the gallery needs no network request. */
const PLACEHOLDER_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
       <rect width="800" height="600" fill="#e2e8f0"/>
       <circle cx="300" cy="220" r="70" fill="#cbd5e1"/>
       <path d="M120 480 L320 300 L470 430 L570 350 L700 480 Z" fill="#94a3b8"/>
     </svg>`.replace(/\s+/g, " "),
  );

/**
 * The single source of truth for block types.
 *
 * The page editor builds its "add block" menu from here, the public renderer
 * looks up the renderer here, and the block gallery documents them from here —
 * so a new block type is one entry, not three edits scattered around.
 */
export type BlockDefinition = {
  type: BlockType;
  /** i18n key suffix: `blocks.<key>.name` / `.description`. */
  key: string;
  icon: React.ComponentType<{ className?: string }>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Editor: React.ComponentType<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Renderer: React.ComponentType<any>;
  /** Fresh data for a newly inserted block. */
  defaults: () => Record<string, unknown>;
  /** Placeholder data used by the gallery preview. */
  sample: (t: (key: string) => string) => Record<string, unknown>;
  /**
   * Optional editor-side preview. Defaults to `Renderer`; blocks whose content
   * is resolved server-side on the public site supply a wrapper that fetches
   * what the renderer needs.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Preview?: React.ComponentType<any>;
};

export const BLOCK_DEFINITIONS: BlockDefinition[] = [
  {
    type: "hero",
    key: "hero",
    icon: SparklesIcon,
    Editor: HeroEditor,
    Renderer: HeroRenderer,
    defaults: heroDefaults,
    sample: (t) => ({
      image: PLACEHOLDER_IMAGE,
      alt: "",
      eyebrow: { ro: t("blocks.hero.sampleEyebrow") },
      title: { ro: t("blocks.hero.sampleTitle") },
      subtitle: { ro: t("blocks.hero.sampleSubtitle") },
      primaryLabel: { ro: t("blocks.hero.samplePrimary") },
      primaryHref: "#",
      secondaryLabel: { ro: t("blocks.hero.sampleSecondary") },
      secondaryHref: "#",
      height: "medium",
      align: "left",
    }),
  },
  {
    type: "showcase",
    key: "showcase",
    icon: TrophyIcon,
    Editor: ShowcaseEditor,
    Renderer: ShowcaseRenderer,
    defaults: showcaseDefaults,
    sample: (t) => ({
      image: PLACEHOLDER_IMAGE,
      alt: "",
      eyebrow: { ro: t("blocks.showcase.sampleEyebrow") },
      title: { ro: t("blocks.showcase.sampleTitle") },
      text: { ro: t("blocks.showcase.sampleText") },
      stats: [1, 2, 3].map((n) => ({
        id: `sample-stat-${n}`,
        value: ["8", "1.200", "3"][n - 1],
        label: { ro: t(`blocks.showcase.sampleStat${n}`) },
      })),
      ctaLabel: { ro: t("blocks.showcase.sampleCta") },
      ctaHref: "#",
    }),
  },
  {
    type: "latestPosts",
    key: "latestPosts",
    icon: LatestPostsIcon,
    Editor: LatestPostsEditor,
    Renderer: LatestPostsRenderer,
    defaults: latestPostsDefaults,
    sample: (t) => ({
      eyebrow: { ro: t("blocks.latestPosts.sampleEyebrow") },
      title: { ro: t("blocks.latestPosts.sampleTitle") },
      text: { ro: t("blocks.latestPosts.sampleText") },
      linkLabel: { ro: t("blocks.latestPosts.sampleLink") },
      count: 3,
    }),
  },
  {
    type: "promoBand",
    key: "promoBand",
    icon: MegaphoneIcon,
    Editor: PromoBandEditor,
    Renderer: PromoBandRenderer,
    defaults: promoBandDefaults,
    sample: (t) => ({
      value: "48",
      unit: { ro: t("blocks.promoBand.sampleUnit") },
      eyebrow: { ro: t("blocks.promoBand.sampleEyebrow") },
      title: { ro: t("blocks.promoBand.sampleTitle") },
      ctaLabel: { ro: t("blocks.promoBand.sampleCta") },
      ctaHref: "#",
    }),
  },
  {
    type: "featureTeaser",
    key: "featureTeaser",
    icon: StarIcon,
    Editor: FeatureTeaserEditor,
    Renderer: FeatureTeaserRenderer,
    defaults: featureTeaserDefaults,
    sample: (t) => ({
      image: PLACEHOLDER_IMAGE,
      alt: "",
      position: "left",
      eyebrow: { ro: t("blocks.featureTeaser.sampleEyebrow") },
      title: { ro: t("blocks.featureTeaser.sampleTitle") },
      titleAccent: { ro: t("blocks.featureTeaser.sampleAccent") },
      text: { ro: t("blocks.featureTeaser.sampleText") },
      items: [1, 2].map((n) => ({
        id: `sample-feature-${n}`,
        icon: ["shield", "map"][n - 1],
        title: { ro: t(`blocks.featureTeaser.sampleItem${n}`) },
        text: { ro: t(`blocks.featureTeaser.sampleItemText${n}`) },
      })),
      ctaLabel: { ro: t("blocks.featureTeaser.sampleCta") },
      ctaHref: "#",
      statValue: "25",
      statLabel: { ro: t("blocks.featureTeaser.sampleStat") },
    }),
  },
  {
    type: "howToGetThere",
    key: "howToGetThere",
    icon: ArrowTrendingUpIcon,
    Editor: HowToGetThereEditor,
    Renderer: HowToGetThereRenderer,
    defaults: howToGetThereDefaults,
    sample: (t) => ({
      eyebrow: { ro: t("blocks.howToGetThere.sampleEyebrow") },
      title: { ro: t("blocks.howToGetThere.sampleTitle") },
      text: { ro: t("blocks.howToGetThere.sampleText") },
      modes: [1, 2].map((n) => ({
        id: `sample-mode-${n}`,
        icon: ["car", "pin"][n - 1],
        title: { ro: t(`blocks.howToGetThere.sampleMode${n}`) },
        duration: ["2 h 30", "45 km"][n - 1],
        text: { ro: t(`blocks.howToGetThere.sampleModeText${n}`) },
      })),
      mapEmbedUrl: "",
      note: { ro: t("blocks.howToGetThere.sampleNote") },
    }),
  },
  {
    type: "contactPanel",
    key: "contactPanel",
    icon: ChatBubbleLeftRightIcon,
    Editor: ContactPanelEditor,
    Renderer: ContactPanelRenderer,
    defaults: contactPanelDefaults,
    sample: (t) => ({
      eyebrow: { ro: t("blocks.contactPanel.sampleEyebrow") },
      title: { ro: t("blocks.contactPanel.sampleTitle") },
      text: { ro: t("blocks.contactPanel.sampleText") },
      mapEmbedUrl: "",
      buttonLabel: { ro: t("blocks.contactPanel.defaultButton") },
      success: { ro: t("blocks.contactPanel.defaultSuccess") },
    }),
  },
  {
    type: "statsGallery",
    key: "statsGallery",
    icon: ChartBarIcon,
    Editor: StatsGalleryEditor,
    Renderer: StatsGalleryRenderer,
    defaults: statsGalleryDefaults,
    sample: (t) => ({
      title: { ro: t("blocks.statsGallery.sampleTitle") },
      text: { ro: t("blocks.statsGallery.sampleText") },
      stats: [1, 2, 3].map((n) => ({
        id: `sample-stat-${n}`,
        icon: ["map", "lodging", "people"][n - 1],
        value: ["8", "5", "3"][n - 1],
        label: { ro: t(`blocks.statsGallery.sampleStat${n}`) },
      })),
      imageLeft: PLACEHOLDER_IMAGE,
      imageLeftAlt: "",
      imageRight: PLACEHOLDER_IMAGE,
      imageRightAlt: "",
    }),
  },
  {
    type: "richText",
    key: "richText",
    icon: Bars3BottomLeftIcon,
    Editor: RichTextEditor,
    Renderer: RichTextRenderer,
    defaults: richTextDefaults,
    sample: (t) => ({ html: { ro: t("blocks.richText.sample") } }),
  },
  {
    type: "accordion",
    key: "accordion",
    icon: QueueListIcon,
    Editor: AccordionEditor,
    Renderer: AccordionRenderer,
    defaults: accordionDefaults,
    sample: (t) => ({
      title: { ro: t("blocks.accordion.sampleTitle") },
      items: [
        {
          id: "s1",
          question: { ro: t("blocks.accordion.sampleQ1") },
          answer: { ro: `<p>${t("blocks.accordion.sampleA1")}</p>` },
        },
        {
          id: "s2",
          question: { ro: t("blocks.accordion.sampleQ2") },
          answer: { ro: `<p>${t("blocks.accordion.sampleA2")}</p>` },
        },
      ],
    }),
  },
  {
    type: "homeHero",
    key: "homeHero",
    icon: SparklesIcon,
    Editor: HomeHeroEditor,
    Renderer: HomeHeroRenderer,
    defaults: homeHeroDefaults,
    sample: (t) => ({
      badge: { ro: t("blocks.homeHero.sampleBadge") },
      titleLead: { ro: t("blocks.homeHero.sampleLead1") },
      titleAccent: { ro: t("blocks.homeHero.sampleAccent") },
      titleRest: { ro: t("blocks.homeHero.sampleLead2") },
      lead: { ro: t("blocks.homeHero.sampleText") },
      primaryLabel: { ro: t("blocks.homeHero.samplePrimary") },
      primaryHref: "/antrenori",
      showProof: true,
      cardItems: [],
    }),
  },
  {
    type: "duoHero",
    key: "duoHero",
    icon: SparklesIcon,
    Editor: DuoHeroEditor,
    Renderer: DuoHeroRenderer,
    defaults: duoHeroDefaults,
    sample: (t) => ({
      left: { image: PLACEHOLDER_IMAGE, alt: "" },
      right: { image: PLACEHOLDER_IMAGE, alt: "" },
      eyebrow: { ro: t("blocks.duoHero.sampleEyebrow") },
      titleLead: { ro: t("blocks.duoHero.sampleLead") },
      titleAccent: { ro: t("blocks.duoHero.sampleAccent") },
      titleRest: { ro: t("blocks.duoHero.sampleRest") },
      primaryLabel: { ro: t("blocks.duoHero.samplePrimary") },
      primaryHref: "#",
    }),
  },
  {
    type: "audienceSplit",
    key: "audienceSplit",
    icon: UsersIcon,
    Editor: AudienceSplitEditor,
    Renderer: AudienceSplitRenderer,
    defaults: audienceSplitDefaults,
    sample: (t) => ({
      title: { ro: t("blocks.audienceSplit.sampleTitle") },
      items: [1, 2].map((n) => ({
        id: `sample-${n}`,
        image: PLACEHOLDER_IMAGE,
        alt: "",
        audience: { ro: t(`blocks.audienceSplit.sampleAudience${n}`) },
        name: t(`blocks.audienceSplit.sampleName${n}`),
        text: { ro: "" },
        results: { ro: t(`blocks.audienceSplit.sampleResults${n}`) },
        ctaLabel: { ro: t("blocks.audienceSplit.sampleCta") },
        ctaHref: "#",
        accent: n === 1 ? "acid" : "flare",
      })),
    }),
  },
  {
    type: "productGrid",
    key: "productGrid",
    icon: ShoppingBagIcon,
    Editor: ProductGridEditor,
    Renderer: ProductGridRenderer,
    defaults: productGridDefaults,
    // No products in the library — like the class grid, the preview renders
    // nothing without a page to fetch them for.
    sample: (t) => ({
      title: { ro: t("blocks.productGrid.sampleTitle") },
      count: 4,
      featuredOnly: true,
      category: "",
    }),
  },
  {
    type: "steps",
    key: "steps",
    icon: QueueListIcon,
    Editor: StepsEditor,
    Renderer: StepsRenderer,
    defaults: stepsDefaults,
    sample: (t) => ({
      eyebrow: { ro: t("blocks.steps.sampleEyebrow") },
      title: { ro: t("blocks.steps.sampleTitle") },
      items: [
        { id: "s1", icon: "userPlus", title: { ro: t("blocks.steps.sampleStep1") }, text: { ro: "" } },
        { id: "s2", icon: "chat", title: { ro: t("blocks.steps.sampleStep2") }, text: { ro: "" } },
      ],
    }),
  },
  {
    type: "faqList",
    key: "faqList",
    icon: ExclamationCircleIcon,
    Editor: FaqListEditor,
    Renderer: FaqListRenderer,
    defaults: faqListDefaults,
    sample: (t) => ({
      eyebrow: { ro: t("blocks.faqList.sampleEyebrow") },
      title: { ro: t("blocks.faqList.sampleTitle") },
      topic: "",
    }),
  },
  {
    type: "classGrid",
    key: "classGrid",
    icon: RectangleGroupIcon,
    Editor: ClassGridEditor,
    Renderer: ClassGridRenderer,
    defaults: classGridDefaults,
    sample: (t) => ({
      eyebrow: { ro: t("blocks.classGrid.sampleEyebrow") },
      title: { ro: t("blocks.classGrid.sampleTitle") },
      linkLabel: { ro: t("blocks.classGrid.sampleLink") },
      count: 4,
    }),
  },
  {
    type: "trainerGrid",
    key: "trainerGrid",
    icon: IdentificationIcon,
    Editor: TrainerGridEditor,
    Renderer: TrainerGridRenderer,
    defaults: trainerGridDefaults,
    sample: (t) => ({
      eyebrow: { ro: t("blocks.trainerGrid.sampleEyebrow") },
      title: { ro: t("blocks.trainerGrid.sampleTitle") },
      lead: { ro: t("blocks.trainerGrid.sampleLead") },
      linkLabel: { ro: t("blocks.trainerGrid.sampleLink") },
      count: 4,
    }),
  },
  {
    type: "testimonials",
    key: "testimonials",
    icon: ChatBubbleLeftRightIcon,
    Editor: TestimonialsEditor,
    Renderer: TestimonialsRenderer,
    defaults: testimonialsDefaults,
    sample: (t) => ({
      eyebrow: { ro: t("blocks.testimonials.sampleEyebrow") },
      title: { ro: t("blocks.testimonials.sampleTitle") },
      lead: { ro: t("blocks.testimonials.sampleLead") },
      count: 3,
    }),
  },
  {
    type: "imageStrip",
    key: "imageStrip",
    icon: RectangleGroupIcon,
    Editor: ImageStripEditor,
    Renderer: ImageStripRenderer,
    defaults: imageStripDefaults,
    sample: (t) => ({
      items: [1, 2, 3, 4].map((n) => ({
        id: `sample-${n}`,
        image: PLACEHOLDER_IMAGE,
        alt: "",
        title: { ro: t(`blocks.imageStrip.sample${n}`) },
        text: { ro: t("blocks.imageStrip.sampleText") },
        href: "",
      })),
    }),
  },
  {
    type: "splitCta",
    key: "splitCta",
    icon: Square2StackIcon,
    Editor: SplitCtaEditor,
    Renderer: SplitCtaRenderer,
    defaults: splitCtaDefaults,
    sample: (t) => ({
      items: [1, 2].map((n) => ({
        id: `sample-${n}`,
        image: PLACEHOLDER_IMAGE,
        alt: "",
        eyebrow: { ro: t(`blocks.splitCta.sampleEyebrow${n}`) },
        title: { ro: t(`blocks.splitCta.sampleTitle${n}`) },
        ctaLabel: { ro: t(`blocks.splitCta.sampleCta${n}`) },
        ctaHref: "#",
      })),
    }),
  },
  {
    type: "transformations",
    key: "transformations",
    icon: ArrowsRightLeftIcon,
    Editor: TransformationsEditor,
    Renderer: TransformationsRenderer,
    defaults: transformationsDefaults,
    sample: (t) => ({
      eyebrow: { ro: t("blocks.transformations.sampleEyebrow") },
      title: { ro: t("blocks.transformations.sampleTitle") },
      lead: { ro: t("blocks.transformations.sampleLead") },
      beforeLabel: { ro: t("transformations.before") },
      afterLabel: { ro: t("transformations.after") },
      items: [1, 2].map((n) => ({
        id: `sample-${n}`,
        before: PLACEHOLDER_IMAGE,
        beforeAlt: "",
        after: PLACEHOLDER_IMAGE,
        afterAlt: "",
        name: t(`blocks.transformations.sampleName${n}`),
        meta: { ro: t(`blocks.transformations.sampleMeta${n}`) },
        quote: { ro: t(`blocks.transformations.sampleQuote${n}`) },
      })),
    }),
  },
  {
    type: "awards",
    key: "awards",
    icon: TrophyIcon,
    Editor: AwardsEditor,
    Renderer: AwardsRenderer,
    defaults: awardsDefaults,
    sample: (t) => ({
      eyebrow: { ro: t("blocks.awards.sampleEyebrow") },
      title: { ro: t("blocks.awards.sampleTitle") },
      lead: { ro: t("blocks.awards.sampleLead") },
      linkLabel: { ro: t("blocks.awards.sampleLink") },
      linkHref: "#",
      items: [1, 2].map((n) => ({
        id: `sample-${n}`,
        title: { ro: t(`blocks.awards.sampleItem${n}`) },
        year: String(2024 + n),
        category: { ro: t("blocks.awards.sampleCategory") },
        text: { ro: t("blocks.awards.sampleText") },
      })),
    }),
  },
  {
    type: "mediaText",
    key: "mediaText",
    icon: PhotoIcon,
    Editor: MediaTextEditor,
    Renderer: MediaTextRenderer,
    defaults: mediaTextDefaults,
    sample: (t) => ({
      image: PLACEHOLDER_IMAGE,
      alt: "",
      position: "left",
      ratio: "third",
      title: { ro: t("blocks.mediaText.sampleTitle") },
      html: { ro: `<p>${t("blocks.mediaText.sampleBody")}</p>` },
      ctaLabel: { ro: t("blocks.mediaText.sampleCta") },
      ctaHref: "#",
    }),
  },
  {
    type: "columns",
    key: "columns",
    icon: ViewColumnsIcon,
    Editor: ColumnsEditor,
    Renderer: ColumnsRenderer,
    defaults: columnsDefaults,
    sample: (t) => ({
      title: { ro: t("blocks.columns.sampleTitle") },
      count: 2,
      columns: [
        {
          id: "c1",
          heading: { ro: t("blocks.columns.sampleH1") },
          html: { ro: `<p>${t("blocks.columns.sampleB1")}</p>` },
        },
        {
          id: "c2",
          heading: { ro: t("blocks.columns.sampleH2") },
          html: { ro: `<p>${t("blocks.columns.sampleB2")}</p>` },
        },
      ],
    }),
  },
  {
    type: "cardGrid",
    key: "cardGrid",
    icon: Squares2X2Icon,
    Editor: CardGridEditor,
    Renderer: CardGridRenderer,
    defaults: cardGridDefaults,
    sample: (t) => ({
      title: { ro: t("blocks.cardGrid.sampleTitle") },
      columns: 3,
      showImages: false,
      items: [1, 2, 3].map((n) => ({
        id: `g${n}`,
        image: null,
        alt: "",
        heading: { ro: t(`blocks.cardGrid.sampleC${n}`) },
        text: { ro: t(`blocks.cardGrid.sampleT${n}`) },
        href: "#",
      })),
    }),
  },
  {
    type: "notice",
    key: "notice",
    icon: ExclamationCircleIcon,
    Editor: NoticeEditor,
    Renderer: NoticeRenderer,
    defaults: noticeDefaults,
    sample: (t) => ({
      tone: "info",
      title: { ro: t("blocks.notice.sampleTitle") },
      body: { ro: `<p>${t("blocks.notice.sampleBody")}</p>` },
    }),
  },
  {
    type: "contactCard",
    key: "contactCard",
    icon: IdentificationIcon,
    Editor: ContactCardEditor,
    Renderer: ContactCardRenderer,
    defaults: contactCardDefaults,
    sample: (t) => ({
      name: { ro: t("blocks.contactCard.sampleName") },
      role: { ro: t("blocks.contactCard.sampleRole") },
      // Preview-only placeholders. Deliberately unmistakable as examples: a
      // plausible-looking address here gets copied into a real page sooner or
      // later. On the site itself the block reads the `site` setting.
      phone: "+40 700 000 000",
      email: "nume@exemplu.ro",
      room: { ro: "" },
      schedule: { ro: t("blocks.contactCard.sampleSchedule") },
    }),
  },
  {
    type: "slider",
    key: "slider",
    icon: RectangleStackIcon,
    Editor: SliderEditor,
    Renderer: SliderRenderer,
    defaults: sliderDefaults,
    sample: (t) => ({
      eyebrow: { ro: t("blocks.slider.sampleEyebrow") },
      title: { ro: t("blocks.slider.sampleTitle") },
      slides: [1, 2, 3, 4].map((n) => ({
        id: `sample-slide-${n}`,
        image: PLACEHOLDER_IMAGE,
        alt: "",
        caption: { ro: t(`blocks.slider.sampleCaption${n}`) },
        href: "",
      })),
    }),
  },
  {
    type: "newsletter",
    key: "newsletter",
    icon: InboxArrowDownIcon,
    Editor: NewsletterEditor,
    Renderer: NewsletterRenderer,
    defaults: newsletterDefaults,
    sample: (t) => ({
      eyebrow: { ro: t("blocks.newsletter.sampleEyebrow") },
      title: { ro: t("blocks.newsletter.defaultTitle") },
      text: { ro: t("blocks.newsletter.defaultText") },
      placeholder: { ro: t("blocks.newsletter.defaultPlaceholder") },
      buttonLabel: { ro: t("blocks.newsletter.defaultButton") },
      termsLabel: { ro: t("blocks.newsletter.defaultTerms") },
      termsHref: "",
      success: { ro: t("blocks.newsletter.defaultSuccess") },
      askName: false,
    }),
  },
  {
    type: "image",
    key: "image",
    icon: PhotoIcon,
    Editor: ImageEditor,
    Renderer: ImageRenderer,
    defaults: imageDefaults,
    sample: (t) => ({
      url: PLACEHOLDER_IMAGE,
      alt: "",
      caption: { ro: t("blocks.image.sampleCaption") },
      width: "column",
    }),
  },
  {
    type: "cta",
    key: "cta",
    icon: CursorArrowRaysIcon,
    Editor: CtaEditor,
    Renderer: CtaRenderer,
    defaults: ctaDefaults,
    sample: (t) => ({
      title: { ro: t("blocks.cta.sampleTitle") },
      text: { ro: t("blocks.cta.sampleText") },
      label: { ro: t("blocks.cta.sampleLabel") },
      href: "#",
    }),
  },
  {
    type: "embed",
    key: "embed",
    icon: PlayCircleIcon,
    Editor: EmbedEditor,
    Renderer: EmbedRenderer,
    defaults: embedDefaults,
    sample: (t) => ({
      url: "",
      title: { ro: t("blocks.embed.sampleTitle") },
      ratio: "video",
    }),
  },
  {
    type: "video",
    key: "video",
    icon: VideoCameraIcon,
    Editor: VideoEditor,
    Renderer: VideoRenderer,
    defaults: videoDefaults,
    sample: (t) => ({
      // A real, stable clip so the gallery shows a poster rather than a hole.
      url: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
      poster: null,
      posterAlt: "",
      title: { ro: t("blocks.video.sampleTitle") },
      caption: { ro: t("blocks.video.sampleCaption") },
      ratio: "wide",
    }),
  },
  {
    type: "gallery",
    key: "gallery",
    icon: GalleryIcon,
    Editor: GalleryEditor,
    Renderer: GalleryRenderer,
    defaults: galleryDefaults,
    sample: (t) => ({
      title: { ro: t("blocks.gallery.sampleTitle") },
      columns: 3,
      images: [1, 2, 3].map((n) => ({
        id: `sample-${n}`,
        url: PLACEHOLDER_IMAGE,
        alt: "",
        caption: t(`blocks.gallery.sampleCaption${n}`),
      })),
    }),
  },
  {
    type: "galleryPreview",
    key: "galleryPreview",
    icon: GalleryPreviewIcon,
    Editor: GalleryPreviewEditor,
    Renderer: GalleryPreviewRenderer,
    defaults: galleryPreviewDefaults,
    sample: (t) => ({
      title: { ro: t("blocks.galleryPreview.sampleTitle") },
      visible: 5,
      // Eight against a visible five, so the sample shows the "+3" tile that
      // is the whole point of the block rather than a plain row of photos.
      images: Array.from({ length: 8 }, (_, index) => ({
        id: `sample-${index + 1}`,
        url: PLACEHOLDER_IMAGE,
        alt: "",
        caption: "",
      })),
    }),
  },
];

const BY_TYPE = new Map(BLOCK_DEFINITIONS.map((d) => [d.type, d]));

export function getBlockDefinition(type: BlockType): BlockDefinition | null {
  return BY_TYPE.get(type) ?? null;
}

/** Builds a new block ready to insert into a page. */
export function createBlock(type: BlockType): Block | null {
  const definition = getBlockDefinition(type);
  if (!definition) return null;

  return {
    id: `${type}-${Date.now().toString(36)}-${Math.round(
      // Not security-sensitive; only needs to avoid collisions within a page.
      performance.now() * 1000,
    ).toString(36)}`,
    type,
    data: definition.defaults(),
  };
}
