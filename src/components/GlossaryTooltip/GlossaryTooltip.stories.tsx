import type { Meta, StoryObj } from '@storybook/react-vite';
import { GlossaryTooltip } from './GlossaryTooltip';

const meta: Meta<typeof GlossaryTooltip> = {
  id: 'overlays-glossarytooltip',
  title: 'Components/Overlays/GlossaryTooltip',
  component: GlossaryTooltip,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `### What it's for

A rich "what does this term mean?" hover card: \`category\` badge, canonical \`term\`, \`definition\` truncated to \`maxDefinitionLength\`, optional \`keyFact\`, \`source\` link and \`related\` term chips. Pass \`href\` to make the trigger a real link. The sibling of \`SourceTip\` ("what backs this claim?") — same interaction grammar: hover previews, a touch tap pins, Escape or an outside tap closes and returns focus. Phrasing-content markup keeps it valid inside prose; the card portals to body and stays in the viewport.

### Use it when

- Domain vocabulary appears in running text (regulatory terms, clinical abbreviations) and readers need a definition without leaving the page.
- The definition has structure worth showing: category, one key fact, a source, related terms.

### Don't use it when

- A few words suffice — \`Tooltip\`.
- You are explaining where a value comes from rather than what a word means — \`SourceTip\`.
- The term needs a whole article; link to it instead and keep the card as a preview.

### Example

\`\`\`tsx
<p>
  Employers must keep an{' '}
  <GlossaryTooltip
    term="OSHA 300 log"
    category="Compliance"
    definition="The annual record of work-related injuries and illnesses…"
    keyFact="Required for most workplaces with more than 10 employees."
    source={{ label: '29 CFR 1904', url: 'https://www.osha.gov/recordkeeping' }}
    related={[{ term: 'OSHA 301', href: '/glossary/osha-301' }]}
  >
    OSHA 300 log
  </GlossaryTooltip>{' '}
  for each establishment.
</p>
\`\`\`

### Limitations

- A pinned card is a non-modal dialog: focus moves into it so its links are reachable, and returns to the trigger on close. Hover-only display is not keyboard reachable until the trigger is focused.
- Uses \`useAnchoredPosition\`; long definitions are truncated, not scrolled.
- Neutral card tokens; the category badge colour is fixed rather than brand-driven.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'alternative to',
          target: 'overlays-tooltip',
          why: 'Tooltip for a few words; GlossaryTooltip for a structured, pinnable definition.',
        },
        {
          type: 'alternative to',
          target: 'overlays-sourcetip',
          why: 'Same interaction grammar; GlossaryTooltip explains a term, SourceTip cites the evidence behind a claim.',
        },
      ],
    },
  },
  tags: ['autodocs', 'scope:general-purpose', 'maturity:stable'],
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
