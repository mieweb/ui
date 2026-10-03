import type { Meta, StoryObj } from '@storybook/react-vite';
import { LinkGroupsSection } from './LinkGroupsSection';
import { templateOrigin } from '../../templates/storyData';
import { relatedGroups } from '../../templates/reportStoryData';

const meta: Meta<typeof LinkGroupsSection> = {
  id: 'reports-linkgroupssection',
  title: 'Templates/Reports/LinkGroupsSection',
  component: LinkGroupsSection,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:experimental'],
  parameters: {
    layout: 'fullscreen',
    meta: templateOrigin('bluehive', 'The access report’s ReportRelatedLinks.'),
    docs: {
      description: {
        component: `### What it's for

Grouped lists of internal links — "explore the pages behind these numbers" — that bind a report or hub to the pages it draws on.

### Use it when

- A page should link out to several clusters (services, locations, tools) with a line of context each.

### Don't use it when

- Each link deserves an image and excerpt — use [ResourceCardsSection](?path=/docs/content-resourcecardssection--docs).

### Example

\`\`\`tsx
<LinkGroupsSection title="The pages behind these numbers" groups={[{ title: 'Services', links: [{ label: 'DOT physicals', href: '/services/dot/' }] }]} />
\`\`\`

### Limitations

- Links go through \`components.Link\` when given, so they get client-side navigation; use descriptive labels and no \`utm_*\` on same-site links.`,
      },
    },
    catalog: { entry: '@mieweb/ui/templates' },
  },
  argTypes: {
    groups: { description: '`{ title, description?, links }[]`.' },
    columns: { control: 'inline-radio', options: [2, 3] },
    tone: { control: 'inline-radio', options: ['default', 'muted', 'brand'] },
  },
  args: {
    eyebrow: 'Explore more',
    title: 'The pages behind these numbers',
    groups: relatedGroups,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const TwoColumns: Story = {
  args: { columns: 2, groups: relatedGroups.slice(0, 2) },
};
