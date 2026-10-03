import type { Meta, StoryObj } from '@storybook/react-vite';
import { ReportMethodology } from './ReportMethodology';
import { templateOrigin } from '../../templates/storyData';
import { methodologySources } from '../../templates/reportStoryData';

const meta: Meta<typeof ReportMethodology> = {
  id: 'reports-reportmethodology',
  title: 'Templates/Reports/ReportMethodology',
  component: ReportMethodology,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:experimental'],
  parameters: {
    layout: 'fullscreen',
    meta: templateOrigin(
      'bluehive',
      'The access report’s methodology section, with cadence and developer panels generalised to notes and resources.'
    ),
    docs: {
      description: {
        component: `### What it's for

The section that makes a report checkable: each source with a link, a suggested citation, caveats such as the publishing cadence, and links to the underlying data.

### Use it when

- A page publishes figures that a reader, journalist or answer engine may quote.

### Don't use it when

- You need per-sentence citations in prose — use the site's footnote system, and keep this section for the overview.

### Example

\`\`\`tsx
<ReportMethodology
  title="How this report was built"
  sources={[{ label: 'BLS OEWS', description: 'Metro employment.', href: 'https://www.bls.gov/oes/' }]}
  citation="Example Health. The State of Access, 2026."
/>
\`\`\`

### Limitations

- The citation is selectable text. For a copy button, render [CopyButton](?path=/docs/actions-copybutton--docs) beside it from a client component — this section is server-safe and has no JavaScript.
- Source links open in the same tab and carry \`rel="noopener noreferrer"\`.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui/templates',
      relationships: [
        {
          type: 'composes with',
          target: 'actions-copybutton',
          why: 'Add a copy button for the citation from a client component.',
        },
      ],
    },
  },
  argTypes: {
    sources: { description: '`{ label, description, href? }[]`.' },
    citation: { control: 'text' },
    notes: { description: '`{ title, body }[]` — cadence, limitations.' },
    resources: {
      description: '`{ title, description?, links }` — data downloads, API.',
    },
    tone: { control: 'inline-radio', options: ['default', 'muted', 'brand'] },
  },
  args: {
    eyebrow: 'Methodology & sources',
    title: 'How this report was built',
    description:
      'Every figure traces to a named source and is labelled by provenance.',
    sources: methodologySources,
    citation:
      'Example Health. The State of Workforce Health Access, 2026 edition.',
    notes: [{ title: 'Publishing cadence', body: 'Refreshed each quarter.' }],
    resources: {
      title: 'Use the data',
      links: [{ label: 'Download CSV', href: '#csv' }],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const SourcesOnly: Story = {
  args: { citation: undefined, notes: undefined, resources: undefined },
};
