import type { Meta, StoryObj } from '@storybook/react-vite';
import { ResourceCardsSection } from './ResourceCardsSection';
import { resources, templateOrigin } from '../../templates/storyData';

const meta: Meta<typeof ResourceCardsSection> = {
  id: 'content-resourcecardssection',
  title: 'Templates/Content/ResourceCardsSection',
  component: ResourceCardsSection,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:experimental'],
  parameters: {
    layout: 'fullscreen',
    meta: templateOrigin(
      'bluehive',
      'BlueHive BlogPreview, widened to any resource type like the EH vertical-hub resources rail.'
    ),
    docs: {
      description: {
        component: `### What it's for

A heading over a grid of linked cards — guides, articles, case studies, reports — each with an optional image, type label, title, excerpt and a free-text detail line, plus an optional "view all" link.

### Use it when

- A page points readers to related content: the resources rail on a vertical hub, "keep reading" on a lead magnet.

### Don't use it when

- The cards are videos with play previews — use [VideoCard](?path=/docs/media-videocard--docs).
- The items are records a user manages — use the Views family.

### Example

\`\`\`tsx
<ResourceCardsSection
  title="Resources for construction safety teams"
  items={[{ kind: 'Guide', title: 'Building a fit-for-duty program', href: '/guides/fit-for-duty/', meta: '12 min read' }]}
  viewAll={{ label: 'All resources', href: '/resources/' }}
/>
\`\`\`

### Limitations

- The whole card is clickable through a stretched link on the title, so there is one tab stop per card; the card shows a focus ring when its link is focused.
- \`meta\` is free text: format dates and reading times in the app, in the reader's locale.
- Excerpts clamp to three lines.`,
      },
    },
    catalog: { entry: '@mieweb/ui/templates' },
  },
  argTypes: {
    items: {
      description: 'Cards: `{ title, href, excerpt?, image?, kind?, meta? }`.',
    },
    columns: { control: 'inline-radio', options: [2, 3, 4] },
    viewAll: { description: 'Link to the full index.' },
    tone: { control: 'inline-radio', options: ['default', 'muted', 'brand'] },
  },
  args: {
    title: 'Resources for construction safety teams',
    items: resources,
    viewAll: { label: 'All resources', href: '#resources' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithImages: Story = {
  args: {
    tone: 'muted',
    items: resources.map((r) => ({ ...r, image: resources[0].image })),
  },
};

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
};
