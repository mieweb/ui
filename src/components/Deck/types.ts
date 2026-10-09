// Slide data is plain JSON: author it in a content file, pass it to <Deck>.
// `type` picks the renderer (see registry.tsx).

/** Slide surface. Every tone except `light` is a dark ground with light text. */
export type SlideTone = 'brand' | 'deep' | 'ink' | 'glow' | 'light';

/** Semantic accent colours, drawn from the active brand's tokens. */
export type AccentName =
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'success'
  | 'warning'
  | 'danger';

/** A cited source \u2014 give one for every statistic, quote or regulatory claim. */
export interface SourceRef {
  label: string;
  url: string;
}

export interface DeckLink {
  label: string;
  href: string;
  /** Rendered as `data-track`. */
  trackingId?: string;
}

export interface DeckImage {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

export interface Highlight {
  value: string;
  label: string;
}

export interface DeckMeta {
  title: string;
  subtitle?: string;
  /** Shown in the chrome, e.g. `Q2 2026`. */
  period?: string;
}

interface SlideBase {
  /** Anchor for deep links; defaults to `slide-{index}`. */
  id?: string;
  /** Short label for the dot nav and outline; defaults to `title`. */
  navLabel?: string;
  tone?: SlideTone;
  /** Group label shown in the chrome and used to build the outline. */
  section?: string;
}

// ---------------------------------------------------------------------------
// Graphics \u2014 charts that slides embed
// ---------------------------------------------------------------------------

export interface BarGraphic {
  type: 'bar';
  bars: Array<{ label: string; value: number; highlight?: boolean }>;
  yAxisLabel?: string;
  /** A vertical rule before a bar, e.g. a launch date. */
  marker?: { atIndex: number; label: string };
}

export interface HorizontalBarGraphic {
  type: 'horizontal-bar';
  bars: Array<{ label: string; value: number; display?: string }>;
}

export interface MultiLineGraphic {
  type: 'multi-line';
  xLabels: string[];
  /** Raw values \u2014 don't pre-normalize. `log` plots very different magnitudes on one axis. */
  series: Array<{ label: string; values: number[]; summary?: string }>;
  scale?: 'log' | 'linear';
  caption?: string;
}

export interface KpiRowGraphic {
  type: 'kpi-row';
  kpis: Array<{ label: string; value: string; trend?: 'up' | 'down' | 'flat' }>;
}

export interface SparkGraphic {
  type: 'spark';
  label: string;
  values: number[];
  suffix?: string;
}

/** A graphic the site renders itself, looked up in `Deck`'s `graphics` map (e.g. a map). */
export interface CustomGraphic {
  type: 'custom';
  component: string;
  props?: Record<string, unknown>;
}

export type DeckGraphic =
  | BarGraphic
  | HorizontalBarGraphic
  | MultiLineGraphic
  | KpiRowGraphic
  | SparkGraphic
  | CustomGraphic;

// ---------------------------------------------------------------------------
// Narrative slides
// ---------------------------------------------------------------------------

export interface CoverSlide extends SlideBase {
  type: 'cover';
  eyebrow?: string;
  title: string;
  subtitle?: string;
  dateline?: string;
  preparedBy?: string;
  image?: DeckImage;
  highlights?: Highlight[];
}

export interface SectionDividerSlide extends SlideBase {
  type: 'section-divider';
  eyebrow?: string;
  title: string;
  description?: string;
  /** Oversized statement above the title, e.g. `10 minutes`. */
  statement?: string;
  image?: DeckImage;
}

export interface OutlineEntry {
  /** One-based slide number the entry jumps to. */
  number: number;
  title: string;
  subtitle?: string;
}

export interface TableOfContentsSlide extends SlideBase {
  type: 'table-of-contents';
  eyebrow?: string;
  title: string;
  description?: string;
  /** Explicit outline; omit to derive one from the slides' `section`s. */
  sections?: Array<{ heading?: string; items: OutlineEntry[] }>;
}

export interface BulletItem {
  text: string;
  /** Emphasized lead-in, e.g. `Fair \u2014`. */
  lead?: string;
  icon?: string;
  children?: BulletItem[];
}

export interface BulletListSlide extends SlideBase {
  type: 'bullet-list';
  eyebrow?: string;
  title: string;
  subtitle?: string;
  items: Array<BulletItem | string>;
  note?: string;
}

export interface QuoteSlide extends SlideBase {
  type: 'quote';
  eyebrow?: string;
  title?: string;
  quote: string;
  attribution?: string;
  role?: string;
  source?: SourceRef;
}

export interface ImageSlide extends SlideBase {
  type: 'image';
  title: string;
  image: DeckImage;
  caption?: string;
}

export interface DefinitionListSlide extends SlideBase {
  type: 'definition-list';
  eyebrow?: string;
  title: string;
  subtitle?: string;
  terms: Array<{ term: string; lead?: string; definition: string }>;
  source?: SourceRef;
}

export interface ConclusionSlide extends SlideBase {
  type: 'conclusion';
  eyebrow?: string;
  title: string;
  body?: string;
  highlights?: Highlight[];
  takeaways?: string[];
  cta?: DeckLink;
  secondaryCta?: DeckLink;
  /** A link to pass the deck on, with a copy button. */
  share?: { url: string; instructions?: string };
  preparedBy?: string;
  dateline?: string;
  /** e.g. `Confidential \u2014 internal use only`. */
  confidentiality?: string;
}

// ---------------------------------------------------------------------------
// Data slides
// ---------------------------------------------------------------------------

export interface MetricCard {
  icon?: string;
  value: string;
  label: string;
  description?: string;
  accent?: AccentName;
}

export interface MetricsSlide extends SlideBase {
  type: 'metrics';
  eyebrow?: string;
  title: string;
  subtitle?: string;
  metrics: MetricCard[];
}

export interface ChartSlide extends SlideBase {
  type: 'chart';
  eyebrow?: string;
  title: string;
  subtitle?: string;
  description?: string;
  graphic: DeckGraphic;
  source?: SourceRef;
}

export interface FeatureHighlightSlide extends SlideBase {
  type: 'feature-highlight';
  eyebrow?: string;
  title: string;
  body: string;
  stat?: Highlight;
  pullQuote?: string;
  bullets?: string[];
  graphic?: DeckGraphic;
  secondaryGraphic?: DeckGraphic;
}

export interface ComparisonTableSlide extends SlideBase {
  type: 'comparison-table';
  eyebrow?: string;
  title: string;
  subtitle?: string;
  /** Column headings; default `Metric / Before / After / Change`. */
  headers?: [string, string, string, string];
  rows: Array<{
    label: string;
    before: string;
    after: string;
    change: string;
  }>;
}

export interface ImpactTableSlide extends SlideBase {
  type: 'impact-table';
  eyebrow?: string;
  title: string;
  subtitle?: string;
  /** Column headings; default `Investment / Impact`. */
  headers?: [string, string];
  rows: Array<{ item: string; detail?: string; impact: string }>;
}

export interface CardsSlide extends SlideBase {
  type: 'cards';
  eyebrow?: string;
  title: string;
  subtitle?: string;
  cards: Array<{
    title: string;
    body: string;
    icon?: string;
    stat?: string;
    statLabel?: string;
  }>;
  note?: string;
}

export interface RankedEntry {
  label: string;
  sublabel?: string;
  value: number;
  /** Text shown for `value`; defaults to the formatted number. */
  display?: string;
  /** Second figure, e.g. users beside pageviews. */
  secondary?: string;
  /** Rank movement since the last period; positive is up. */
  change?: number;
  highlighted?: boolean;
}

export interface RankedListSlide extends SlideBase {
  type: 'ranked-list';
  eyebrow?: string;
  title: string;
  subtitle?: string;
  entries: RankedEntry[];
  /** Context for the ranking, e.g. `of 42 vendors`. */
  outOf?: string;
  source?: SourceRef;
}

export interface BreakdownSlide extends SlideBase {
  type: 'breakdown';
  eyebrow?: string;
  title: string;
  body?: string;
  talkingPoint?: string;
  pullQuote?: string;
  callout?: Highlight;
  /** A bar chart over time, e.g. monthly signups. */
  series?: BarGraphic;
  /** Share of the total by category. */
  breakdown?: Array<{ label: string; count: number }>;
  /** Named records behind the numbers, e.g. the newest accounts. */
  entries?: Array<{ title: string; meta?: string; date?: string }>;
}

// ---------------------------------------------------------------------------
// Diagram and grid slides
// ---------------------------------------------------------------------------

export interface CycleSlide extends SlideBase {
  type: 'cycle';
  eyebrow?: string;
  title: string;
  body?: string;
  talkingPoint?: string;
  /** Three to six stages, clockwise from the top. */
  nodes: Array<{ label: string; metric?: string; icon?: string }>;
}

export interface RoadmapSlide extends SlideBase {
  type: 'roadmap';
  eyebrow?: string;
  title: string;
  subtitle?: string;
  items: Array<{
    title: string;
    children?: string[];
    icon?: string;
    status?: 'now' | 'next' | 'later';
  }>;
}

export interface AdoptionCurveSlide extends SlideBase {
  type: 'adoption-curve';
  eyebrow?: string;
  title: string;
  subtitle?: string;
  /** Left to right; `pct` sets each band's width. */
  segments: Array<{ label: string; pct: string; accent?: AccentName }>;
  marker?: { label: string; atPct: number };
  annotations?: Array<{
    text: string;
    atPct: number;
    side?: 'top' | 'bottom';
    emphasis?: boolean;
  }>;
  source?: SourceRef;
}

export interface DiagramNode {
  id: string;
  label: string;
  /** Centre on a 0\u2013100 stage. */
  x: number;
  y: number;
  /** Width in stage units; default 20. */
  w?: number;
  icon?: string;
  accent?: AccentName;
  image?: DeckImage;
}

export interface DiagramSlide extends SlideBase {
  type: 'diagram';
  eyebrow?: string;
  title: string;
  subtitle?: string;
  nodes: DiagramNode[];
  edges: Array<{
    from: string;
    to: string;
    label?: string;
    /** 0 = at `from`, 1 = at `to`; default 0.5. */
    labelAt?: number;
    dashed?: boolean;
    /** Animate a dot along the edge. */
    flow?: boolean;
    accent?: AccentName;
  }>;
  /** Dashed enclosures around groups of nodes. */
  boundaries?: Array<{ label: string; nodes: string[]; accent?: AccentName }>;
  callouts?: Array<{ text: string; lead?: string; side: 'left' | 'right' }>;
}

export interface Certification {
  name: string;
  issuer?: string;
  description?: string;
  image?: DeckImage;
  /** Text badge when there is no logo. */
  badge?: string;
  accent?: AccentName;
  source?: SourceRef;
}

export interface CertificationGridSlide extends SlideBase {
  type: 'certification-grid';
  eyebrow?: string;
  title: string;
  subtitle?: string;
  /** Rendered large beside the grid. */
  featured?: Certification;
  certifications: Certification[];
  footnote?: SourceRef;
}

export interface ShowcaseSlide extends SlideBase {
  type: 'showcase';
  eyebrow?: string;
  title: string;
  subtitle?: string;
  total?: Highlight;
  categories: Array<{ title: string; items: string[]; icon?: string }>;
  video?: {
    href: string;
    title: string;
    duration?: string;
    speaker?: string;
    thumbnail?: DeckImage;
    /** Link text; default `Watch the video`. */
    cta?: string;
  };
}

/** A slide that switches between several views, e.g. one per month. */
export interface TabsSlide extends SlideBase {
  type: 'tabs';
  eyebrow?: string;
  title: string;
  tabs: Array<{
    label: string;
    icon?: string;
    slide: TabPanelSlide;
  }>;
}

/** A slide shown inside a tab: the content fields of a data slide, without frame options. */
export type TabPanelSlide =
  | Omit<FeatureHighlightSlide, keyof SlideBase>
  | Omit<CardsSlide, keyof SlideBase>
  | Omit<RankedListSlide, keyof SlideBase>
  | Omit<ChartSlide, keyof SlideBase>
  | Omit<MetricsSlide, keyof SlideBase>;

/** A slide the site renders itself, looked up in `Deck`'s `renderers` map. */
export interface CustomSlide extends SlideBase {
  type: 'custom';
  component: string;
  title?: string;
  props?: Record<string, unknown>;
}

export type Slide =
  | CoverSlide
  | SectionDividerSlide
  | TableOfContentsSlide
  | BulletListSlide
  | QuoteSlide
  | ImageSlide
  | DefinitionListSlide
  | ConclusionSlide
  | MetricsSlide
  | ChartSlide
  | FeatureHighlightSlide
  | ComparisonTableSlide
  | ImpactTableSlide
  | CardsSlide
  | RankedListSlide
  | BreakdownSlide
  | CycleSlide
  | RoadmapSlide
  | AdoptionCurveSlide
  | DiagramSlide
  | CertificationGridSlide
  | ShowcaseSlide
  | TabsSlide
  | CustomSlide;

export type SlideType = Slide['type'];

/** Props every slide renderer receives. */
export interface SlideRendererProps<T extends Slide = Slide> {
  slide: T;
  index: number;
}
