import type { Meta, StoryObj } from '@storybook/react-vite';
import * as React from 'react';
import {
  BookMarked,
  BookOpen,
  Clapperboard,
  FileText,
  Layers,
  Newspaper,
  Palette,
  ShieldCheck,
  Sparkles,
  Syringe,
  BarChart3,
} from 'lucide-react';
import { MegaMenu, MegaMenuBar, type MegaMenuConfig } from './MegaMenu';
import { VideoCard } from '../VideoCard';
import type { ComponentMeta } from '../../docs/component-meta';

const componentMeta: ComponentMeta = {
  usedIn: [
    {
      repo: 'mieweb/enterprise-health-frontdoor',
      live: 'https://concept.enterprise.health/',
      note: 'Product / Industries / Resources / Company dropdowns in the site nav.',
    },
  ],
  origin: {
    repo: 'mieweb/enterprise-health-frontdoor',
    note: 'Ported from components/layout/MegaMenu.tsx + MEGA_MENUS in lib/site.ts. The per-item `featured` swap is new here.',
  },
};

const resources: MegaMenuConfig = {
  key: 'resources',
  label: 'Resources',
  href: '#resources',
  heading: 'Resources & insight',
  items: [
    {
      label: 'Resource library',
      href: '#library',
      description: 'Guides, briefs and tools for workforce-health teams.',
      icon: <BookOpen />,
    },
    {
      label: 'Blog',
      href: '#blog',
      description: 'Field notes on occupational health, compliance and AI.',
      icon: <Newspaper />,
      featured: {
        eyebrow: 'Latest post',
        title: 'What the OSHA 300A deadline actually requires',
        description:
          'A plain-language walkthrough of posting, certification and electronic submission.',
        ctaLabel: 'Read the post',
        ctaHref: '#post',
        icon: <Newspaper />,
        tone: 'neutral',
      },
    },
    {
      label: 'Whitepapers',
      href: '#whitepapers',
      description: 'Interactive assessments and the full e-book library.',
      icon: <FileText />,
    },
    {
      label: 'Video library',
      href: '#videos',
      description: 'Demos, customer stories and webinars from the team.',
      icon: <Clapperboard />,
      featured: {
        eyebrow: 'Featured video',
        title: 'Ozwell AI in the exam room',
        description: 'Documentation and surveillance, native to the platform.',
        ctaLabel: 'Watch · 2:44',
        ctaHref: '#video',
        media: (
          <VideoCard
            title="Ozwell AI in the exam room"
            href="#video"
            youtubeId="aqz-KE-bpKQ"
            variant="plate"
            preview={false}
          />
        ),
      },
    },
    {
      label: 'Glossary',
      href: '#glossary',
      description:
        'Plain-language definitions for occupational & employee health.',
      icon: <BookMarked />,
    },
    {
      label: 'Style guide',
      href: '#style',
      description:
        'Logo usage, the living-systems palette, tokens & components.',
      icon: <Palette />,
    },
  ],
  allLabel: 'Browse all resources',
  allHref: '#resources',
  ctaLabel: 'Request a demo',
  ctaHref: '#demo',
  featured: {
    eyebrow: 'Whitepaper',
    title: 'The Fragmentation Index',
    description:
      'Score your workforce-health stack and see what consolidation is worth.',
    ctaLabel: 'Continue reading',
    ctaHref: '#whitepaper',
    icon: <FileText />,
    tone: 'accent',
  },
};

const platform: MegaMenuConfig = {
  key: 'platform',
  label: 'Platform',
  href: '#platform',
  heading: 'One certified record',
  groups: [
    {
      label: 'Modules',
      href: '#modules',
      items: [
        { label: 'Certified EHR', href: '#ehr', icon: <Layers /> },
        { label: 'Compliance', href: '#compliance', icon: <ShieldCheck /> },
        { label: 'Immunization', href: '#immunization', icon: <Syringe /> },
        { label: 'Analytics', href: '#analytics', icon: <BarChart3 /> },
        { label: 'Ozwell AI', href: '#ai', icon: <Sparkles /> },
      ],
    },
    {
      label: 'By role',
      items: [
        { label: 'Occupational health nurse', href: '#nurse' },
        { label: 'EHS leader', href: '#ehs' },
        { label: 'Medical director', href: '#md' },
        { label: 'HR & benefits', href: '#hr' },
      ],
    },
  ],
  allLabel: 'Explore the platform',
  allHref: '#platform',
  featured: {
    eyebrow: 'Platform tour',
    title: 'See every module in one walkthrough',
    ctaLabel: 'Take the tour',
    ctaHref: '#tour',
    icon: <Layers />,
  },
};

const meta: Meta<typeof MegaMenu> = {
  id: 'navigation-megamenu',
  title: 'Components/Navigation/MegaMenu',
  component: MegaMenu,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:experimental'],
  parameters: {
    layout: 'fullscreen',
    meta: componentMeta,
    docs: {
      description: {
        component: `### What it's for

A hover/click mega-menu for public-site navigation: a trigger with chevron, a panel with heading, a 2-column item grid (or grouped columns via \`groups\`), a "Browse all" + CTA footer, and a right-column feature panel. The feature panel is **contextual** — while an item with its own \`featured\` is hovered or focused the column swaps to it (fading in), then falls back to the menu default; override the selection entirely with \`resolveFeatured\`. Exports \`MegaMenu\` (one controlled menu) and \`MegaMenuBar\` (a row of menus that keeps one open at a time).

### Use it when

- A marketing/product site's top nav sections carry many grouped links plus a promoted feature (article, video, CTA).
- \`SiteHeader\` should drive it — pass \`menus\` + \`currentPath\` there and it renders a \`MegaMenuBar\` on desktop and flattens the same config into its mobile drawer.

### Don't use it when

- A handful of flat links suffices — \`SiteHeader links\` alone, without panels.
- You're navigating **inside an app**: command-driven jumps — \`CommandPalette\`; content sections — \`Tabs\`; step flows — \`StepIndicator\`.
- The content is actions on the current page rather than site destinations — a menu/popover, not navigation.

### Example

\`\`\`tsx
const [open, setOpen] = React.useState(false);

<MegaMenu
  menu={platformMenu} // heading, items[] or groups[], featured, footer CTA
  open={open}
  onOpenChange={setOpen}
  currentPath={location.pathname} // marks the active route with aria-current
  onNavigate={closeMobileDrawer}
/>;
// …or several at once: <MegaMenuBar menus={[platform, solutions]} currentPath={…} />
\`\`\`

### Limitations

- Accessibility: the trigger carries \`aria-haspopup\` / \`aria-expanded\` / \`aria-controls\`; the panel is a labelled \`role="region"\`, not a \`menu\` — links are ordinary tab stops (no arrow-key roving). Escape closes and returns focus to the trigger. The current route gets \`aria-current="page"\` (paths compared ignoring query, hash and trailing slashes).
- Hover-open uses intent delays (70ms open / 150ms close) and is disabled below \`hoverMinWidth\` (default 900px) — there the chevron button toggles on click/tap.
- The panel is absolutely positioned under the trigger and clamped to the viewport (16px padding), re-clamped when the contextual feature column changes the panel width and on resize.
- Items with \`external: true\` open in a new tab with \`noopener\` — on desktop and in \`SiteHeader\`'s mobile drawer.
- i18n: footer fallbacks \`"Browse all"\` / \`"Get started"\` and the toggle's \`"Toggle {label} menu"\` are hard-coded English (\`allLabel\` / \`ctaLabel\` override the first two).
- Controlled only — the host owns \`open\`; \`MegaMenuBar\` supplies that state for a whole nav row.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'composes with',
          target: 'layout-siteheader',
          why: 'SiteHeader accepts `menus` directly, rendering a MegaMenuBar on desktop and flattening the same config into its mobile drawer.',
        },
      ],
    },
  },
  argTypes: {
    menu: {
      control: false,
      description:
        'Menu config: heading, items or groups, featured panel, footer CTA.',
    },
    open: {
      control: false,
      description: 'Controlled open state — pair with `onOpenChange`.',
    },
    onOpenChange: { control: false },
    resolveFeatured: {
      control: false,
      description: 'Override which feature panel shows for the hovered item.',
    },
    variant: {
      control: 'select',
      options: ['light', 'dark'],
      description: 'Trigger styling on light or dark header bars.',
    },
    currentPath: {
      control: 'text',
      description:
        'Current pathname — marks the matching item with aria-current.',
    },
  },
  decorators: [
    (Story) => (
      <div className="bg-background min-h-[560px] p-6">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

/** Story helper: owns the open state so a panel can start expanded. */
function Controlled(
  props: Omit<React.ComponentProps<typeof MegaMenu>, 'open' | 'onOpenChange'>
) {
  const [open, setOpen] = React.useState(true);
  return <MegaMenu {...props} open={open} onOpenChange={setOpen} />;
}

/** Hover "Blog" or "Video library" to watch the right column follow the item. */
export const SmartFeatured: Story = {
  render: (args) => <Controlled {...args} menu={resources} />,
  args: { currentPath: '/blog/' },
};

export const Grouped: Story = {
  render: (args) => <Controlled {...args} menu={platform} />,
};

/** No feature panel — the grid takes the full width. */
export const WithoutFeatured: Story = {
  render: (args) => (
    <Controlled
      {...args}
      menu={{
        ...resources,
        featured: undefined,
        items: resources.items?.map((i) => ({ ...i, featured: undefined })),
      }}
    />
  ),
};

/** Several menus sharing one open state — the building block `SiteHeader` uses. */
export const Bar: Story = {
  render: () => (
    <div className="bg-primary-800 rounded-xl px-4 py-2">
      <MegaMenuBar
        menus={[platform, resources]}
        variant="light"
        currentPath="/blog/"
      />
    </div>
  ),
};
