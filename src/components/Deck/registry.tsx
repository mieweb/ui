import type * as React from 'react';
import {
  BreakdownRenderer,
  CardsRenderer,
  ChartRenderer,
  ComparisonTableRenderer,
  FeatureHighlightRenderer,
  ImpactTableRenderer,
  MetricsRenderer,
  RankedListRenderer,
  TabsRenderer,
} from './slides/data';
import {
  AdoptionCurveRenderer,
  CycleRenderer,
  DiagramRenderer,
  RoadmapRenderer,
} from './slides/diagrams';
import { CertificationGridRenderer, ShowcaseRenderer } from './slides/grids';
import {
  BulletListRenderer,
  ConclusionRenderer,
  CoverRenderer,
  DefinitionListRenderer,
  ImageRenderer,
  QuoteRenderer,
  SectionDividerRenderer,
  TableOfContentsRenderer,
} from './slides/narrative';
import type { SlideRendererProps, SlideType } from './types';

/** The built-in renderer for every slide type except `custom`. */
export const slideRenderers = {
  cover: CoverRenderer,
  'section-divider': SectionDividerRenderer,
  'table-of-contents': TableOfContentsRenderer,
  'bullet-list': BulletListRenderer,
  quote: QuoteRenderer,
  image: ImageRenderer,
  'definition-list': DefinitionListRenderer,
  conclusion: ConclusionRenderer,
  metrics: MetricsRenderer,
  chart: ChartRenderer,
  'feature-highlight': FeatureHighlightRenderer,
  'comparison-table': ComparisonTableRenderer,
  'impact-table': ImpactTableRenderer,
  cards: CardsRenderer,
  'ranked-list': RankedListRenderer,
  breakdown: BreakdownRenderer,
  cycle: CycleRenderer,
  roadmap: RoadmapRenderer,
  'adoption-curve': AdoptionCurveRenderer,
  diagram: DiagramRenderer,
  'certification-grid': CertificationGridRenderer,
  showcase: ShowcaseRenderer,
  tabs: TabsRenderer,
} satisfies Record<
  Exclude<SlideType, 'custom'>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- each renderer narrows its slide
  React.ComponentType<SlideRendererProps<any>>
>;
