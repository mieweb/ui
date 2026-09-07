import type { Meta, StoryObj } from '@storybook/react-vite';
import { SectionSpyNav, type SectionSpyItem } from './SectionSpyNav';

const meta: Meta<typeof SectionSpyNav> = {
  id: 'navigation-sectionspynav',
  title: 'Components/Navigation/SectionSpyNav',
  component: SectionSpyNav,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `### What it's for

**Sticky horizontal in-page wayfinding**: a band of anchor links to a page's major sections, a sliding underline tracking the section in view (via \`useScrollSpy\`), and an optional page-specific next-step CTA. Pass \`items: SectionSpyItem[]\` (\`{ id, label }\`, in page order — each \`id\` must match a \`section[id]\` on the page), an optional \`cta: SectionSpyCta\` (\`{ label, href, tier }\` where \`tier\` explore | evaluate | commit maps to ghost | outline | primary \`Button\` styling so the strip never out-shouts the page's primary CTA), \`label\` for the eyebrow (default "On this page"), \`tone\` (\`surface\` on the page background or the inverted \`brand\` band), and \`rootMargin\` to tune the observer. \`onItemClick(id)\` / \`onCtaClick(cta)\` are for analytics. Pure anchor links, so it still works if the scroll spy never runs.

### Use it when

- A marketing, landing or long single-column page has 3–8 flat sections and a band **under the page header** is the natural place to jump between them.
- The page has one next-step action (book a demo, start an order) that should travel with the reader.

### Don't use it when

- Headings are nested or numerous and there is a sidebar — \`TableOfContents\` (tree, auto-discovery, \`contentRef\` support).
- You want progress feedback without links — \`ReadingProgressBar\`; the two pair well.
- The links go to other pages — \`AppHeader\` / \`Sidebar\` navigation.
- The content scrolls inside a container rather than the window — the spy has no \`root\` option here (it observes against the viewport).

### Example

\`\`\`tsx
const sections = [
  { id: 'overview', label: 'Overview' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'faq', label: 'FAQ' },
];

<SiteHeader … />
<SectionSpyNav
  items={sections}
  cta={{ label: 'Book a demo', href: '/demo', tier: 'evaluate' }}
  onItemClick={(id) => track('section_nav', { id })}
/>
<main>
  <section id="overview">…</section>
  <section id="pricing">…</section>
  <section id="faq">…</section>
</main>
\`\`\`

Active state is internal (first item until the spy reports); nothing to control.

### Limitations

- Accessibility: \`<nav aria-label={label}>\` (so the eyebrow doubles as the landmark name; the visible eyebrow is \`aria-hidden\` and hidden below \`md\`); links are \`<a href="#id">\` with \`aria-current="location"\` on the active one; the underline marker and arrow glyphs are \`aria-hidden\`. No extra keyboard handling beyond native anchors; no skip affordance when many items overflow (the rail scrolls horizontally with the scrollbar hidden and centres the active link).
- \`sticky top-0 z-30\` — it must be rendered inside the scrolling ancestor and below any fixed header, or pass \`className\` to offset it. Scroll-spy default \`rootMargin\` is \`'-22% 0px -68% 0px'\` (a band in the upper third), different from \`useScrollSpy\`'s default.
- Only one CTA; its arrow is inferred from \`href\` (\`#\` ↓, \`/\` →, otherwise ↗).
- RTL: the underline is positioned with physical \`offsetLeft\` / \`style.left\` measured against the rail, which tracks the link correctly in both directions; text itself follows \`dir\`.
- Theming: \`surface\` uses \`bg-card/95 border-border\` + \`primary-500\` marker; \`brand\` is \`bg-primary-900 text-white\` + \`primary-400\` marker. Depends on \`buttonVariants\` from \`Button\`, \`lucide-react\`, \`useScrollSpy\`.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'alternative to',
          target: 'navigation-tableofcontents',
          why: 'SectionSpyNav is a flat sticky horizontal band with an optional CTA; TableOfContents is a nested sidebar outline that can auto-discover headings.',
        },
        {
          type: 'composes with',
          target: 'navigation-readingprogressbar',
          why: 'Band for jumping between sections plus a viewport-top bar for how far through the page the reader is; they share no state.',
        },
        {
          type: 'uses',
          target: 'actions-button',
          why: 'The CTA link is styled with buttonVariants; tier maps to ghost / outline / primary.',
        },
      ],
    },
  },
  tags: ['autodocs', 'scope:general-purpose', 'maturity:stable'],
  argTypes: {
    items: {
      description: 'Sections to link to, in page order.',
      control: false,
    },
    cta: {
      description:
        'Optional next-step CTA (`tier`: explore | evaluate | commit).',
      control: false,
    },
    label: { description: 'Eyebrow before the links.', control: 'text' },
    tone: {
      description: 'Visual tone of the band.',
      control: 'select',
      options: ['surface', 'brand'],
    },
    rootMargin: {
      description: 'IntersectionObserver root margin tuning.',
      control: 'text',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const ITEMS: SectionSpyItem[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'capabilities', label: 'Capabilities' },
  { id: 'compliance', label: 'Compliance' },
  { id: 'integrations', label: 'Integrations' },
  { id: 'pricing', label: 'Pricing' },
];

function DemoSections() {
  return (
    <main className="flex flex-col">
      {ITEMS.map((it, i) => (
        <section
          key={it.id}
          id={it.id}
          className={
            'flex min-h-[70vh] flex-col justify-center gap-2 px-8 ' +
            (i % 2 ? 'bg-muted/40' : 'bg-background')
          }
        >
          <h2 className="text-foreground text-2xl font-bold">{it.label}</h2>
          <p className="text-muted-foreground max-w-lg text-sm">
            Scroll to see the underline slide to the section in view. This
            section stands in for the page&apos;s {it.label.toLowerCase()}{' '}
            content.
          </p>
        </section>
      ))}
    </main>
  );
}

export const Default: Story = {
  args: {
    items: ITEMS,
    cta: { label: 'Book a demo', href: '#pricing', tier: 'evaluate' },
  },
  render: (args) => (
    <div>
      <SectionSpyNav {...args} />
      <DemoSections />
    </div>
  ),
};

export const BrandTone: Story = {
  args: {
    items: ITEMS,
    tone: 'brand',
    cta: { label: 'Get started', href: '/signup', tier: 'commit' },
  },
  render: (args) => (
    <div>
      <SectionSpyNav {...args} />
      <DemoSections />
    </div>
  ),
};

export const WithoutCta: Story = {
  args: { items: ITEMS },
  render: (args) => (
    <div>
      <SectionSpyNav {...args} />
      <DemoSections />
    </div>
  ),
};
