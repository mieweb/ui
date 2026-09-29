import type { Meta, StoryObj } from '@storybook/react-vite';
import { SplitContentSection } from './SplitContentSection';
import { dashboardImage, templateOrigin } from '../../templates/storyData';

const meta: Meta<typeof SplitContentSection> = {
  id: 'content-splitcontentsection',
  title: 'Templates/Content/SplitContentSection',
  component: SplitContentSection,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:experimental'],
  parameters: {
    layout: 'fullscreen',
    meta: templateOrigin(
      'eh',
      'The EH WhyEnterpriseHealth / SystemOfRecord copy-and-media split, without the brand-specific duotone.'
    ),
    docs: {
      description: {
        component: `### What it's for

One argument, made beside an image: eyebrow, heading, description, a checked list of proof points and calls to action on one side; an image with an optional caption on the other.

### Use it when

- A single idea needs a picture and a paragraph — "one record per worker", "built for your industry".
- You alternate several such blocks down a page (flip \`mediaPosition\` on every other one).

### Don't use it when

- You list several parallel points — use [FeatureGridSection](?path=/docs/content-featuregridsection--docs).
- The image is the page's first screen — use [HeroSection](?path=/docs/conversion-herosection--docs) with \`variant="split"\`.

### Example

\`\`\`tsx
<SplitContentSection
  eyebrow="System of record"
  title="One record per worker, across every site"
  bullets={['Fit-for-duty status per role and site', 'Full audit trail']}
  image={{ src: '/record.webp', alt: 'Worker record with clearance status', width: 1280, height: 800 }}
  mediaPosition="start"
/>
\`\`\`

### Limitations

- \`mediaPosition\` is logical: \`start\` is the left in LTR and the right in RTL. On phones the image always follows the copy.
- The image is a lazy-loaded \`<img>\` inside a \`<figure>\`; its \`alt\` is required and should describe the content, since the caption is optional.
- Brand photo treatments (duotones, glows) are site styling — apply them with \`className\` in the host app.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui/templates',
      relationships: [
        {
          type: 'alternative to',
          target: 'content-featuregridsection',
          why: 'SplitContentSection argues one point beside an image; FeatureGridSection lists several parallel points.',
        },
      ],
    },
  },
  argTypes: {
    image: {
      description: '`{ src, alt, width?, height? }` — alt is required.',
    },
    bullets: { description: 'Proof points rendered as a checked list.' },
    mediaPosition: { control: 'inline-radio', options: ['start', 'end'] },
    tone: { control: 'inline-radio', options: ['default', 'muted', 'brand'] },
  },
  args: {
    eyebrow: 'System of record',
    title: 'One record per worker, across every site',
    description:
      'Stop reconciling clinic faxes with a spreadsheet. Results land on the worker record the moment they are final.',
    bullets: [
      'Fit-for-duty status per role and site',
      'Full audit trail on every change',
      'Role-based access for supervisors and clinicians',
    ],
    image: dashboardImage,
    caption: 'Clearance status across 12 sites.',
    primaryCta: { label: 'Explore the platform', href: '#platform' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const MediaEnd: Story = {};

export const MediaStart: Story = {
  args: { mediaPosition: 'start', tone: 'muted' },
};

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
};

export const RTL: Story = {
  name: 'RTL',
  args: { mediaPosition: 'start' },
  render: (args) => (
    <div dir="rtl">
      <SplitContentSection {...args} />
    </div>
  ),
};
