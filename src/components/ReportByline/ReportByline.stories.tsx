import type { Meta, StoryObj } from '@storybook/react-vite';
import { ReportByline } from './ReportByline';
import { templateOrigin } from '../../templates/storyData';
import { reportAuthors } from '../../templates/reportStoryData';

const meta: Meta<typeof ReportByline> = {
  id: 'reports-reportbyline',
  title: 'Templates/Reports/ReportByline',
  component: ReportByline,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:experimental'],
  parameters: {
    layout: 'fullscreen',
    meta: templateOrigin(
      'bluehive',
      'The author variant of the access report’s ReportByline.'
    ),
    docs: {
      description: {
        component: `### What it's for

Who wrote a report and when: name linked to the author page, role, publish and update dates, and external profiles.

### Use it when

- Closing a report, whitepaper or long-form page where authorship is part of the credibility (E-E-A-T).

### Don't use it when

- The page is a blog post with its own byline and author card — use the blog's layout.

### Example

\`\`\`tsx
<ReportByline authors={[{ name: 'Jordan Rivera', role: 'Director of Research', href: '/authors/jordan/' }]} published="June 13, 2026" />
\`\`\`

### Limitations

- Dates are display strings — format them in the site's locale.
- Emit the matching \`Person\` JSON-LD in the page head; the byline renders none.
- The section heading is visually hidden ("About the author"); translate through \`labels\`.
- Server-safe (\`@mieweb/ui/templates\`).`,
      },
    },
    catalog: { entry: '@mieweb/ui/templates' },
  },
  argTypes: {
    authors: { description: '`{ name, role?, href?, avatar?, profiles? }[]`.' },
    published: { control: 'text', description: 'Display date.' },
    updated: { control: 'text', description: 'Display date.' },
    labels: {
      control: false,
      description: 'Heading, “By”, “Published” and “Updated”.',
    },
  },
  args: { authors: reportAuthors, published: 'June 13, 2026' },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Updated: Story = { args: { updated: 'September 1, 2026' } };
export const TwoAuthors: Story = {
  args: {
    authors: [...reportAuthors, { name: 'Sam Patel', role: 'Data Analyst' }],
  },
};
