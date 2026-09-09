import type { Meta, StoryObj } from '@storybook/react-vite';
import { SectionSpyNav, type SectionSpyItem } from './SectionSpyNav';
import { skillUrl, type ComponentMeta } from '../../docs/component-meta';

const componentMeta: ComponentMeta = {
  usedIn: [
    {
      repo: 'mieweb/enterprise-health-frontdoor',
      live: 'https://concept.enterprise.health/industry/aviation/',
      note: 'The dark "On this page" band on every industry hub and /platform, with the per-page CTA.',
    },
    {
      repo: 'mieweb/agent-skills',
      live: 'https://skills.mieweb.org/',
      note: 'Skill detail pages.',
    },
  ],
  skills: [
    {
      name: 'industry-page',
      repo: 'mieweb/enterprise-health-frontdoor',
      url: skillUrl('mieweb/enterprise-health-frontdoor', 'industry-page'),
      summary:
        'Scaffolds a vertical hub — wires the spy nav items and CTA tier.',
    },
  ],
  origin: {
    repo: 'mieweb/enterprise-health-frontdoor',
    note: 'Promoted from components/ui/SectionSpyNav.tsx after the scroll-spy strip lab.',
  },
};

const meta: Meta<typeof SectionSpyNav> = {
  title: 'Components/Navigation/SectionSpyNav',
  component: SectionSpyNav,
  parameters: {
    layout: 'fullscreen',
    meta: componentMeta,
    docs: {
      description: {
        component:
          "Sticky horizontal in-page wayfinding: anchor links to a page's major sections, a " +
          'sliding underline tracking the section in view (via `useScrollSpy`), and an ' +
          'optional page-specific CTA whose `tier` sets its visual weight. The horizontal ' +
          'complement to `TableOfContents`. Section elements need matching `id`s.',
      },
    },
  },
  tags: ['autodocs'],
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
