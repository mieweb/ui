import type { Meta, StoryObj } from '@storybook/react-vite';
import { PdfEmbedSection } from './PdfEmbedSection';
import { templateOrigin } from '../../templates/storyData';

const meta: Meta<typeof PdfEmbedSection> = {
  id: 'reports-pdfembedsection',
  title: 'Templates/Reports/PdfEmbedSection',
  component: PdfEmbedSection,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:experimental'],
  parameters: {
    layout: 'fullscreen',
    meta: templateOrigin(
      'bluehive',
      'PdfEmbedSection + PdfEmbedViewer, using `<object>` so it needs no mount check.'
    ),
    docs: {
      description: {
        component: `### What it's for

An inline PDF edition of a report or one-pager, with download and open-in-new-tab links.

### Use it when

- A page has a designed PDF counterpart readers may want to read in place or keep.

### Don't use it when

- The PDF is gated — put a [LeadFormSection](?path=/docs/conversion-leadformsection--docs) in front and email it instead.

### Example

\`\`\`tsx
<PdfEmbedSection title="Read the full report" src="/reports/access-2026.pdf" downloadAs="access-2026.pdf" aspectRatio={1.294} />
\`\`\`

### Limitations

- Mobile browsers mostly don't render PDFs inline; they show the fallback link, and the buttons below always work.
- \`aspectRatio\` is height ÷ width: US Letter portrait ≈ 1.29, 16:9 slides = 0.5625.
- Server-safe; no client JavaScript.`,
      },
    },
    catalog: { entry: '@mieweb/ui/templates' },
  },
  argTypes: {
    src: { control: 'text' },
    downloadAs: { control: 'text' },
    aspectRatio: { control: { type: 'number', step: 0.05 } },
    notice: { control: 'text' },
    tone: { control: 'inline-radio', options: ['default', 'muted', 'brand'] },
  },
  args: {
    eyebrow: 'PDF edition',
    title: 'Read or download the full report',
    src: '/templates/sample-report.pdf',
    downloadAs: 'sample-report.pdf',
    aspectRatio: 1.294,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithNotice: Story = {
  args: {
    notice:
      'This PDF has embedded video that only plays in Acrobat — download it to watch.',
  },
};
