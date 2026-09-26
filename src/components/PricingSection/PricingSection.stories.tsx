import type { Meta, StoryObj } from '@storybook/react-vite';
import { PricingSection } from './PricingSection';
import { plans, templateOrigin } from '../../templates/storyData';

const meta: Meta<typeof PricingSection> = {
  id: 'conversion-pricingsection',
  title: 'Templates/Conversion/PricingSection',
  component: PricingSection,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:experimental'],
  parameters: {
    layout: 'fullscreen',
    meta: templateOrigin(
      'bluehive',
      'The plan cards of the BlueHive /pricing page, without the client-side billing-period toggle.'
    ),
    docs: {
      description: {
        component: `### What it's for

Plan cards side by side: name, description, price and billing unit, a checked list of what is included and a call to action. One plan can be highlighted with a badge.

### Use it when

- A pricing page, or a service page, lays out two to four plans a buyer chooses between.

### Don't use it when

- The difference between plans is the point, feature by feature — follow the cards with [ComparisonSection](?path=/docs/content-comparisonsection--docs).
- Prices change with a monthly/annual switch — that toggle needs client state; render one \`PricingSection\` per period behind your own toggle.

### Example

\`\`\`tsx
<PricingSection
  title="Plans"
  plans={[
    { name: 'Growth', price: '$6', period: 'per employee / month', features: ['HRIS sync'], cta: { label: 'Book a demo', href: '/demo/' }, highlighted: true, badge: 'Most popular' },
  ]}
  note="Service fees are billed at clinic rates."
/>
\`\`\`

### Limitations

- \`price\` is display text: format currency in the app, in the reader's locale.
- The highlighted plan is marked visually (ring + badge); say why in its \`description\` if it matters to screen-reader users.
- Plans stack on phones, pair up on tablets and sit in one row from \`lg\`.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui/templates',
      relationships: [
        {
          type: 'composes with',
          target: 'content-comparisonsection',
          why: 'PricingSection shows the plans; a ComparisonSection under it compares them feature by feature.',
        },
      ],
    },
  },
  argTypes: {
    plans: {
      description:
        'Plans: `{ name, price, period?, description?, features, cta?, highlighted?, badge? }`.',
    },
    note: { description: 'Small print under the plans.' },
    tone: { control: 'inline-radio', options: ['default', 'muted', 'brand'] },
  },
  args: {
    eyebrow: 'Pricing',
    title: 'Pay for the program you run',
    plans,
    note: 'Service fees (exams, screens) are billed at clinic rates.',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const TwoPlans: Story = {
  args: { plans: plans.slice(1), tone: 'muted' },
};

export const OnBrand: Story = { args: { tone: 'brand' } };

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
};
