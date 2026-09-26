import type { Meta, StoryObj } from '@storybook/react-vite';
import { FaqSection } from './FaqSection';
import { faqs, templateOrigin } from '../../templates/storyData';

const meta: Meta<typeof FaqSection> = {
  id: 'content-faqsection',
  title: 'Templates/Content/FaqSection',
  component: FaqSection,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:experimental'],
  parameters: {
    layout: 'fullscreen',
    meta: templateOrigin(
      'eh',
      'The EH Faq (native <details>, hash-linkable items) with the section heading of BlueHive FAQSection (51 page imports).'
    ),
    docs: {
      description: {
        component: `### What it's for

A heading over a list of questions that expand to their answers. Each item is a native \`<details>\`/\`<summary>\`, so it works without JavaScript and every answer is in the HTML for search engines and answer engines.

### Use it when

- A marketing page closes out objections before the final call to action.
- Answers are short plain text and an item should be linkable (\`id\` → \`/page/#faq-setup\`).

### Don't use it when

- The panels hold rich app content or you need a single-open rule — use [Accordion](?path=/docs/layout-accordion--docs).
- There are only one or two questions — put them in the copy.

### Example

\`\`\`tsx
<FaqSection
  id="faq"
  title="Frequently asked questions"
  items={[{ id: 'faq-setup', question: 'How long does setup take?', answer: 'Most teams…' }]}
/>
\`\`\`

### Limitations

- Several items can be open at once; opening one does not close another.
- A link to an item's \`id\` scrolls to it but does not open it in every browser.
- Answers are plain text with preserved line breaks. Emit \`FAQPage\` JSON-LD from the page — structured data is the app's, not the section's.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui/templates',
      relationships: [
        {
          type: 'alternative to',
          target: 'layout-accordion',
          why: 'FaqSection is a server-rendered <details> list of plain-text Q&A for marketing pages; Accordion is a styled, stateful panel stack for app content.',
        },
      ],
    },
  },
  argTypes: {
    items: { description: 'Questions: `{ question, answer, id? }`.' },
    tone: { control: 'inline-radio', options: ['default', 'muted', 'brand'] },
    align: { control: 'inline-radio', options: ['start', 'center'] },
  },
  args: {
    id: 'faq',
    title: 'Frequently asked questions',
    description: 'Still deciding? These come up on almost every call.',
    items: faqs,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Muted: Story = { args: { tone: 'muted', align: 'start' } };

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
};
