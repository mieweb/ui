import type { Meta, StoryObj } from '@storybook/react-vite';
import { Calculator } from 'lucide-react';
import { LandingPage } from './LandingPage';
import { validateLandingPage } from './presets';
import {
  campaignBlocks,
  comparisonBlocks,
  pricingBlocks,
  resourceBlocks,
  serviceDetailBlocks,
  templateOrigin,
  verticalHubBlocks,
} from '../../templates/storyData';

function RoiTeaser({ id }: { id?: string }) {
  return (
    <section id={id} className="bg-muted py-16 text-center">
      <Calculator
        aria-hidden="true"
        className="text-primary-700 mx-auto size-8"
      />
      <h2 className="text-foreground mt-4 text-2xl font-bold">
        A site-owned custom block
      </h2>
      <p className="text-muted-foreground mt-2">
        e.g. an ROI calculator rendered by the app.
      </p>
    </section>
  );
}

const meta: Meta<typeof LandingPage> = {
  id: 'pages-landingpage',
  title: 'Templates/Pages/LandingPage',
  component: LandingPage,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:experimental'],
  parameters: {
    layout: 'fullscreen',
    meta: templateOrigin(
      'eh',
      'Generalises the EH VerticalHub machine (typed data → fixed section order) to every page archetype both sites share.'
    ),
    docs: {
      description: {
        component: `### What it's for

Renders a whole marketing page from data. \`blocks\` is an array of plain objects — each a section's props tagged with a \`type\` — so a page is a content file, not a component. Six presets (\`landingPresets\`) record the page archetypes the BlueHive and Enterprise Health sites repeat, and \`validateLandingPage\` checks a page against the heading contract and a preset.

| Preset | For | Required blocks |
| --- | --- | --- |
| \`vertical-hub\` | One page per industry served | hero, features, faq, cta |
| \`service-detail\` | One offering explained | hero, features, cta |
| \`campaign\` | Campaign or named-account (ABM) page that converts in place | hero, lead-form |
| \`comparison\` | Your product against an alternative, row by row | hero, comparison, cta |
| \`resource\` | A guide or tool offered for contact details | hero, lead-form |
| \`pricing\` | Plans, proof and pre-purchase questions | hero, pricing, faq |

Each preset's recommended order is in \`landingPresets[id].sequence\`; the stories below render one page per preset.

### Use it when

- A public page is a stack of standard sections: industry hubs, service pages, campaign/ABM pages, comparisons, lead magnets.
- Many pages share a shape and differ only in copy — keep one data file per page and one route that renders \`<LandingPage blocks={page.blocks} />\`.

### Don't use it when

- The page is mostly bespoke layout — compose the sections directly, or build your own with [SectionShell](?path=/docs/templates-pages-overview--docs).
- The content is long-form prose (blog posts, guides) — render it with your MDX pipeline.

### Example

\`\`\`tsx
// content/industries/construction.ts — plain data
export const page = {
  blocks: [
    { type: 'hero', title: 'Keep every crew cleared to work', primaryCta: { label: 'Book a demo', href: '/demo/' } },
    { type: 'features', title: 'Built for crews that move', features: [...] },
    { type: 'custom', component: 'roi', props: { preset: 'construction' } },
    { type: 'faq', id: 'faq', title: 'FAQ', items: [...] },
    { type: 'cta', title: 'See it with your roster', primaryCta: { label: 'Book a demo', href: '/demo/' } },
  ],
} satisfies { blocks: LandingBlock[] };

// app/industries/[slug]/page.tsx — a Server Component
import Link from 'next/link';
import { LandingPage } from '@mieweb/ui/templates';
import { SiteImage } from '@/components/SiteImage'; // adapts TemplateImageProps to next/image

export default function Page() {
  return (
    <LandingPage
      blocks={page.blocks}
      components={{ Image: SiteImage, Link }}
      custom={{ roi: RoiCalculator }}
      icons={siteIcons}
    />
  );
}
\`\`\`

### Limitations

- **Server-safe.** Import from \`@mieweb/ui/templates\` in a React Server Component; nothing on that entry uses client-only React APIs. (The root \`@mieweb/ui\` barrel re-exports the same components but also pulls in client modules.)
- **The page's head is the app's.** Metadata, canonical URLs, JSON-LD (\`FAQPage\`, \`BreadcrumbList\`, \`Organization\`), sitemaps and analytics stay in the site — the blocks give you the data to build them from.
- **Headings.** The hero renders the page's \`h1\`; every other section an \`h2\`. \`validateLandingPage\` reports a second \`h1\` hero, a hero that is not first, duplicate ids, and a preset's missing or out-of-order blocks. \`LandingPage\` itself renders whatever it is given.
- **Custom blocks** name a component in the \`custom\` map; an unknown name renders nothing.
- **Images and links.** Sections render \`<img>\` and \`<a>\` unless you pass \`components={{ Image, Link }}\`. \`Image\` receives \`{ src, alt, width?, height?, className, priority? }\` — \`priority\` is set on the hero image only — so a three-line adapter maps it onto \`next/image\`. \`next/link\` works as \`Link\` directly. Logos stay plain \`<img>\` because they carry no intrinsic size.
- **Analytics.** Give any link a \`trackingId\` (and \`LeadFormSection\` a \`submitTrackingId\`); it renders as \`data-track\` for the site's own click tracking. There are no click callbacks.
- **Styles.** Tailwind 4 apps must scan the library (\`@source "../node_modules/@mieweb/ui/dist"\`) and import \`@mieweb/ui/init.css\`, which also brings the marquee keyframes. Tailwind 3 apps include \`./node_modules/@mieweb/ui/dist/**/*.js\` in \`content\`; every template class is a literal string, so no safelist entries are needed.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui/templates',
      relationships: [
        {
          type: 'composes with',
          target: 'layout-siteheader',
          why: 'SiteHeader sits above a LandingPage and SiteFooter below it; together they make a complete public page.',
        },
        {
          type: 'composes with',
          target: 'layout-sitefooter',
          why: 'SiteFooter closes the public page that SiteHeader and LandingPage open.',
        },
        {
          type: 'contains',
          target: 'conversion-herosection',
          why: 'Rendered for `hero` blocks.',
        },
        {
          type: 'contains',
          target: 'conversion-ctasection',
          why: 'Rendered for `cta` blocks.',
        },
        {
          type: 'contains',
          target: 'conversion-leadformsection',
          why: 'Rendered for `lead-form` blocks.',
        },
        {
          type: 'contains',
          target: 'content-featuregridsection',
          why: 'Rendered for `features` blocks.',
        },
        {
          type: 'contains',
          target: 'content-splitcontentsection',
          why: 'Rendered for `split` blocks.',
        },
        {
          type: 'contains',
          target: 'content-processstepssection',
          why: 'Rendered for `process` blocks.',
        },
        {
          type: 'contains',
          target: 'content-comparisonsection',
          why: 'Rendered for `comparison` blocks.',
        },
        {
          type: 'contains',
          target: 'content-faqsection',
          why: 'Rendered for `faq` blocks.',
        },
        {
          type: 'contains',
          target: 'content-resourcecardssection',
          why: 'Rendered for `resources` blocks.',
        },
        {
          type: 'contains',
          target: 'social-proof-statssection',
          why: 'Rendered for `stats` blocks.',
        },
        {
          type: 'contains',
          target: 'social-proof-logocloudsection',
          why: 'Rendered for `logos` blocks.',
        },
        {
          type: 'contains',
          target: 'social-proof-testimonialsection',
          why: 'Rendered for `testimonials` blocks.',
        },
        {
          type: 'contains',
          target: 'conversion-pricingsection',
          why: 'Rendered for `pricing` blocks.',
        },
        {
          type: 'contains',
          target: 'content-videosection',
          why: 'Rendered for `video` blocks.',
        },
      ],
    },
  },
  argTypes: {
    blocks: {
      control: false,
      description: 'The page, top to bottom: section props tagged with `type`.',
    },
    icons: {
      control: false,
      description: 'Site icon tokens passed to sections that render icons.',
    },
    custom: {
      control: false,
      description: 'Components for `{ type: "custom", component }` blocks.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const VerticalHub: Story = { args: { blocks: verticalHubBlocks } };

export const ServiceDetail: Story = { args: { blocks: serviceDetailBlocks } };

export const Campaign: Story = { args: { blocks: campaignBlocks } };

export const Comparison: Story = { args: { blocks: comparisonBlocks } };

export const Resource: Story = { args: { blocks: resourceBlocks } };

export const Pricing: Story = { args: { blocks: pricingBlocks } };

/** A `custom` block renders a site-owned section from the `custom` map. */
export const WithCustomBlock: Story = {
  args: {
    blocks: [
      serviceDetailBlocks[0],
      { type: 'custom', component: 'roi', id: 'roi' },
      serviceDetailBlocks[serviceDetailBlocks.length - 1],
    ],
    custom: { roi: RoiTeaser },
  },
};

/** `validateLandingPage` output for a page missing its required blocks. */
export const Validation: Story = {
  args: { blocks: [verticalHubBlocks[2], verticalHubBlocks[0]] },
  render: (args) => (
    <div className="mx-auto max-w-3xl p-8">
      <h2 className="text-foreground text-xl font-bold">
        validateLandingPage(blocks, &apos;vertical-hub&apos;)
      </h2>
      <ul className="mt-4 space-y-2">
        {validateLandingPage(args.blocks, 'vertical-hub').map((issue, i) => (
          <li
            key={i}
            className="border-border bg-card text-card-foreground rounded-lg border p-3 text-sm"
          >
            <strong className="uppercase">{issue.severity}</strong>{' '}
            {issue.message}
          </li>
        ))}
      </ul>
    </div>
  ),
};

export const Mobile: Story = {
  args: { blocks: campaignBlocks },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
};

export const RTL: Story = {
  name: 'RTL',
  args: { blocks: verticalHubBlocks },
  render: (args) => (
    <div dir="rtl">
      <LandingPage {...args} />
    </div>
  ),
};
