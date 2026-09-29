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
import { safeHref } from '../../templates/Section';
import type { TemplateComponents } from '../../templates/types';
import { ownProperty } from '../../utils/own';

/** A section the site renders itself, looked up by name in `LandingPage`'s `custom` map. */
export interface CustomBlock {
  type: 'custom';
  component: string;
  props?: Record<string, unknown>;
  id?: string;
}

/** Section props as page data: no event handlers, children or components, so a block survives JSON. */
type BlockData<P> = Omit<
  P,
  keyof React.DOMAttributes<HTMLElement> | 'components' | 'icons'
>;

/** One entry of a page's `blocks` array: a section's props tagged with its `type`. */
export type LandingBlock =
  | ({ type: 'hero' } & BlockData<HeroSectionProps>)
  | ({ type: 'logos' } & BlockData<LogoCloudSectionProps>)
  | ({ type: 'features' } & BlockData<FeatureGridSectionProps>)
  | ({ type: 'split' } & BlockData<SplitContentSectionProps>)
  | ({ type: 'process' } & BlockData<ProcessStepsSectionProps>)
  | ({ type: 'stats' } & BlockData<StatsSectionProps>)
  | ({ type: 'comparison' } & BlockData<ComparisonSectionProps>)
  | ({ type: 'pricing' } & BlockData<PricingSectionProps>)
  | ({ type: 'video' } & BlockData<VideoSectionProps>)
  | ({ type: 'testimonials' } & BlockData<TestimonialSectionProps>)
  | ({ type: 'resources' } & BlockData<ResourceCardsSectionProps>)
  | ({ type: 'faq' } & BlockData<FaqSectionProps>)
  | ({ type: 'lead-form' } & Omit<BlockData<LeadFormSectionProps>, 'action'> & {
        /** A URL, or the name of a function in `LandingPage`'s `actions` map. */
        action: string;
      })
  | ({ type: 'cta' } & BlockData<CtaSectionProps>)
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

/** Every block type the renderer knows — `validateLandingPage` checks runtime data against it. */
export const landingBlockTypes = [
  ...Object.keys(sections),
  'custom',
] as LandingBlockType[];

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
  /** Form actions (e.g. Server Actions, React 19) that `lead-form` blocks name in `action`. */
  actions?: Record<string, (formData: FormData) => void | Promise<void>>;
}

export const LandingPage = React.forwardRef<HTMLDivElement, LandingPageProps>(
  ({ blocks, icons, components, custom, actions, ...rest }, ref) => (
    <div ref={ref} data-slot="landing-page" {...rest}>
      {blocks.map((block, i) => {
        const key = block.id ?? `${block.type}-${i}`;
        // Own-property lookups throughout: block data is runtime JSON, so
        // `"toString"` must mean "unknown", not `Object.prototype.toString`.
        if (block.type === 'custom') {
          const Custom = ownProperty(custom, block.component);
          return Custom ? (
            <Custom key={key} id={block.id} {...block.props} />
          ) : null;
        }
        const { type, ...props } = block;
        // `type` narrowed `props` to this section's props; TS can't correlate the lookup.
        const Section = ownProperty(
          sections as Record<string, unknown>,
          type
        ) as React.ComponentType<Record<string, unknown>> | undefined;
        // Runtime page data bypasses `BlockData`, so guard what TypeScript
        // cannot: skip unknown types the way unknown `custom` components are
        // skipped (`validateLandingPage` reports them), drop the props JSON
        // must not control, and inject the framework-owned props after the
        // spread so a block cannot override the site's adapters.
        if (!Section) return null;
        // A non-named lead-form action is a form URL — same trust boundary as
        // hrefs. No safe action means no form: an action-less form would
        // submit the lead to the current document URL instead of going inert.
        const action =
          block.type === 'lead-form'
            ? (ownProperty(actions, block.action) ?? safeHref(block.action))
            : undefined;
        if (block.type === 'lead-form' && action == null) return null;
        const data = { ...props } as Record<string, unknown>;
        delete data.children;
        delete data.dangerouslySetInnerHTML;
        return (
          <Section
            key={key}
            {...data}
            components={components}
            {...(takesIcons.has(type) ? { icons } : {})}
            {...(block.type === 'lead-form' ? { action } : {})}
          />
        );
      })}
    </div>
  )
);
LandingPage.displayName = 'LandingPage';
