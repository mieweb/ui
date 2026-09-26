import * as React from 'react';
import {
  ComparisonSection,
  type ComparisonSectionProps,
} from '../ComparisonSection';
import { CtaSection, type CtaSectionProps } from '../CtaSection';
import { FaqSection, type FaqSectionProps } from '../FaqSection';
import {
  FeatureGridSection,
  type FeatureGridSectionProps,
} from '../FeatureGridSection';
import { HeroSection, type HeroSectionProps } from '../HeroSection';
import { LeadFormSection, type LeadFormSectionProps } from '../LeadFormSection';
import {
  LogoCloudSection,
  type LogoCloudSectionProps,
} from '../LogoCloudSection';
import { PricingSection, type PricingSectionProps } from '../PricingSection';
import {
  ProcessStepsSection,
  type ProcessStepsSectionProps,
} from '../ProcessStepsSection';
import {
  ResourceCardsSection,
  type ResourceCardsSectionProps,
} from '../ResourceCardsSection';
import {
  SplitContentSection,
  type SplitContentSectionProps,
} from '../SplitContentSection';
import { StatsSection, type StatsSectionProps } from '../StatsSection';
import {
  TestimonialSection,
  type TestimonialSectionProps,
} from '../TestimonialSection';
import { VideoSection, type VideoSectionProps } from '../VideoSection';
import type { TemplateIconRegistry } from '../../templates/icons';
import type { TemplateComponents } from '../../templates/types';

/** A section the site renders itself, looked up by name in `LandingPage`'s `custom` map. */
export interface CustomBlock {
  type: 'custom';
  component: string;
  props?: Record<string, unknown>;
  id?: string;
}

/** One entry of a page's `blocks` array: a section's props tagged with its `type`. */
export type LandingBlock =
  | ({ type: 'hero' } & HeroSectionProps)
  | ({ type: 'logos' } & LogoCloudSectionProps)
  | ({ type: 'features' } & FeatureGridSectionProps)
  | ({ type: 'split' } & SplitContentSectionProps)
  | ({ type: 'process' } & ProcessStepsSectionProps)
  | ({ type: 'stats' } & StatsSectionProps)
  | ({ type: 'comparison' } & ComparisonSectionProps)
  | ({ type: 'pricing' } & PricingSectionProps)
  | ({ type: 'video' } & VideoSectionProps)
  | ({ type: 'testimonials' } & TestimonialSectionProps)
  | ({ type: 'resources' } & ResourceCardsSectionProps)
  | ({ type: 'faq' } & FaqSectionProps)
  | ({ type: 'lead-form' } & LeadFormSectionProps)
  | ({ type: 'cta' } & CtaSectionProps)
  | CustomBlock;

export type LandingBlockType = LandingBlock['type'];

const sections = {
  hero: HeroSection,
  logos: LogoCloudSection,
  features: FeatureGridSection,
  split: SplitContentSection,
  process: ProcessStepsSection,
  stats: StatsSection,
  comparison: ComparisonSection,
  pricing: PricingSection,
  video: VideoSection,
  testimonials: TestimonialSection,
  resources: ResourceCardsSection,
  faq: FaqSection,
  'lead-form': LeadFormSection,
  cta: CtaSection,
} satisfies Record<Exclude<LandingBlockType, 'custom'>, unknown>;

/** Block types whose section resolves icon tokens. */
const takesIcons = new Set<LandingBlockType>(['features', 'process']);

export interface LandingPageProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The page, top to bottom. Plain data — import it from a content file or a CMS. */
  blocks: LandingBlock[];
  /** Site icon tokens, passed to every section that renders icons. */
  icons?: TemplateIconRegistry;
  /** Site image and link components (e.g. `next/image`, `next/link`), passed to every section. */
  components?: TemplateComponents;
  /** Site-owned sections for `{ type: 'custom', component }` blocks. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- each custom section owns its props
  custom?: Record<string, React.ComponentType<any>>;
}

export const LandingPage = React.forwardRef<HTMLDivElement, LandingPageProps>(
  ({ blocks, icons, components, custom, ...rest }, ref) => (
    <div ref={ref} data-slot="landing-page" {...rest}>
      {blocks.map((block, i) => {
        const key = block.id ?? `${block.type}-${i}`;
        if (block.type === 'custom') {
          const Custom = custom?.[block.component];
          return Custom ? (
            <Custom key={key} id={block.id} {...block.props} />
          ) : null;
        }
        const { type, ...props } = block;
        // `type` narrowed `props` to this section's props; TS can't correlate the lookup.
        const Section = sections[type] as unknown as React.ComponentType<
          Record<string, unknown>
        >;
        return (
          <Section
            key={key}
            components={components}
            {...(takesIcons.has(type) ? { icons } : {})}
            {...props}
          />
        );
      })}
    </div>
  )
);
LandingPage.displayName = 'LandingPage';
