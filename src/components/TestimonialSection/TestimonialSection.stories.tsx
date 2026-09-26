import type { Meta, StoryObj } from '@storybook/react-vite';
import { TestimonialSection } from './TestimonialSection';
import { templateOrigin, testimonials } from '../../templates/storyData';

const meta: Meta<typeof TestimonialSection> = {
  id: 'social-proof-testimonialsection',
  title: 'Templates/Social proof/TestimonialSection',
  component: TestimonialSection,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:experimental'],
  parameters: {
    layout: 'fullscreen',
    meta: templateOrigin(
      'bluehive',
      'BlueHive TestimonialsEnhanced (cards + featured) and the EH PullQuote, without the client-side carousel.'
    ),
    docs: {
      description: {
        component: `### What it's for

Customer quotes with attribution — a grid of cards, or one featured quote given the whole section. Each is a \`<figure>\` with a \`<blockquote>\` and \`<figcaption>\`, optional headshot and star rating.

### Use it when

- A page needs voices from customers in the buyer's position.

### Don't use it when

- You want a rotating carousel — that needs client state; keep it in the app.
- The proof is a number — use [StatsSection](?path=/docs/social-proof-statssection--docs).

### Example

\`\`\`tsx
<TestimonialSection
  title="Safety teams on the switch"
  testimonials={[{ quote: '…', author: 'Dana Whitfield', role: 'Safety Director', company: 'Acme', rating: 5 }]}
/>
\`\`\`

### Limitations

- \`featured\` shows only the first testimonial.
- Headshots are decorative (\`alt=""\`) because the author is named in the caption.
- The rating is announced from \`labels.rating\` (English default, \`{rating}\` placeholder); stars are hidden from assistive tech.
- Only publish quotes you have permission to use.`,
      },
    },
    catalog: { entry: '@mieweb/ui/templates' },
  },
  argTypes: {
    testimonials: {
      description:
        'Quotes: `{ quote, author, role?, company?, avatar?, rating? }`.',
    },
    variant: { control: 'inline-radio', options: ['cards', 'featured'] },
    tone: { control: 'inline-radio', options: ['default', 'muted', 'brand'] },
  },
  args: {
    title: 'Safety teams on the switch',
    testimonials,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Cards: Story = {};

export const Featured: Story = {
  args: { title: undefined, variant: 'featured', tone: 'muted' },
};

export const OnBrand: Story = { args: { variant: 'featured', tone: 'brand' } };

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
};
