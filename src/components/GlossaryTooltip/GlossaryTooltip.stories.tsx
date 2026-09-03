import type { Meta, StoryObj } from '@storybook/react-vite';
import { GlossaryTooltip } from './GlossaryTooltip';

const meta: Meta<typeof GlossaryTooltip> = {
  title: 'Components/Overlays & Popups/GlossaryTooltip',
  component: GlossaryTooltip,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A rich "what does this term mean?" hover card: category badge, canonical term, ' +
          'truncated definition, optional key fact, source link, and related-term chips. ' +
          'The sibling of `SourceTip` ("what backs this claim?") — same interaction grammar: ' +
          'hover previews, touch taps pin, Escape/outside-tap closes. Phrasing-content markup ' +
          'keeps it valid inside prose; the card portals to body and stays in the viewport.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    term: {
      description: 'Canonical term name — the card heading.',
      control: 'text',
    },
    definition: {
      description: 'Definition text (truncated in-card).',
      control: 'text',
    },
    category: { description: 'Category badge label.', control: 'text' },
    keyFact: {
      description: 'Single key fact with a diamond marker.',
      control: 'text',
    },
    source: { description: 'Authoritative source link.', control: false },
    related: { description: 'Sibling terms shown as chips.', control: false },
    href: {
      description:
        'Full glossary page — desktop clicks navigate, hover previews.',
      control: 'text',
    },
    underline: {
      description: 'Dashed underline on the trigger.',
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    term: 'OSHA recordable',
    definition:
      'A work-related injury or illness that must be entered on the OSHA 300 log: one involving death, days away from work, restricted work or job transfer, medical treatment beyond first aid, or loss of consciousness.',
    category: 'Compliance',
    href: '#osha-recordable',
    children: 'OSHA recordables',
  },
  render: (args) => (
    <p className="text-foreground max-w-md text-sm leading-relaxed">
      Clinics that manage <GlossaryTooltip {...args} /> for employers need a
      defensible audit trail from intake to the 300A summary.
    </p>
  ),
};

export const FullCard: Story = {
  args: {
    term: 'DOT physical',
    definition:
      'A medical examination required for commercial motor vehicle drivers, performed by a certified medical examiner listed on the FMCSA National Registry. Certification is valid for up to 24 months.',
    category: 'Occupational Health',
    keyFact: 'Examiners must be listed on the FMCSA National Registry.',
    source: {
      label: '49 CFR 391.43',
      url: 'https://www.ecfr.gov/current/title-49/section-391.43',
    },
    related: [
      { term: 'FMCSA', href: '#fmcsa' },
      { term: 'Medical certificate', href: '#medical-certificate' },
      { term: 'CDL' },
    ],
    href: '#dot-physical',
    children: 'DOT physicals',
  },
  render: (args) => (
    <p className="text-foreground max-w-md text-sm leading-relaxed">
      Scheduling <GlossaryTooltip {...args} /> alongside drug screens cuts
      driver downtime to a single visit.
    </p>
  ),
};

export const WithoutLink: Story = {
  args: {
    term: 'Momentum score',
    definition:
      'A composite 0–100 index summarizing how an account is trending, computed from engagement, friction, and readiness signals over a rolling window.',
    category: 'Waggleline',
    children: 'momentum score',
  },
  render: (args) => (
    <p className="text-foreground max-w-md text-sm leading-relaxed">
      An account&apos;s <GlossaryTooltip {...args} /> drops when meetings go
      dark — Enter or Space pins the card for keyboard users.
    </p>
  ),
};
