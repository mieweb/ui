import type { Meta, StoryObj } from '@storybook/react-vite';
import { LeadFormSection } from './LeadFormSection';
import { templateOrigin } from '../../templates/storyData';

const meta: Meta<typeof LeadFormSection> = {
  id: 'conversion-leadformsection',
  title: 'Templates/Conversion/LeadFormSection',
  component: LeadFormSection,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:experimental'],
  parameters: {
    layout: 'fullscreen',
    meta: templateOrigin(
      'bluehive',
      'BlueHive InlineLeadForm, rebuilt as a plain HTML form so it works without client JavaScript.'
    ),
    docs: {
      description: {
        component: `### What it's for

An inline lead-capture section: heading and pitch beside (or above) a form of configurable fields, hidden attribution fields, a submit button and a consent line. It is a real \`<form>\`; where the data goes is the app's decision.

### Use it when

- A campaign, ABM or lead-magnet page should convert on the page instead of linking away.
- You need attribution (\`source\`, \`industry\`, campaign ids) posted with every submission — pass \`hiddenFields\`.

### Don't use it when

- The next step lives on another page — use [CtaSection](?path=/docs/conversion-ctasection--docs).
- The form is part of an app workflow with validation rules, steps or saved drafts — build it from the Inputs tier instead.

### Example

\`\`\`tsx
// Next.js: a Server Action receives the FormData.
<LeadFormSection
  title="Get your rollout plan"
  action={requestPlan}
  hiddenFields={{ source: 'industry-construction' }}
  submitLabel="Send my plan"
  note="We use your details only to prepare the plan."
/>
\`\`\`

### Limitations

- \`action\` is a URL (posted with \`method\`) or a React form action such as a Server Action. Validation beyond the browser's \`required\`/\`type\` checks, spam protection, success and error states belong to the app.
- Every input has a \`<label>\`; required fields are marked with a visual asterisk and the \`required\` attribute.
- Field labels and \`submitLabel\` default to English — pass translated \`fields\`.
- The form card always uses the theme surface, so inputs stay legible on a \`brand\` band.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui/templates',
      relationships: [
        {
          type: 'alternative to',
          target: 'conversion-ctasection',
          why: 'LeadFormSection captures the lead in place; CtaSection links to the page that does.',
        },
      ],
    },
  },
  argTypes: {
    action: { description: 'Form action: a URL or a React form action.' },
    fields: {
      description:
        'Form fields. Defaults to `defaultLeadFormFields`: `firstName`, `lastName`, `email` (work email) and `company`, all required.',
    },
    hiddenFields: { description: 'Name/value pairs posted with the form.' },
    layout: { control: 'inline-radio', options: ['split', 'stacked'] },
    tone: { control: 'inline-radio', options: ['default', 'muted', 'brand'] },
  },
  args: {
    eyebrow: 'Next step',
    title: 'Get your terminal-by-terminal rollout plan',
    description:
      'A specialist builds it from your terminal list within one business day.',
    action: '#submitted',
    hiddenFields: { source: 'storybook' },
    submitLabel: 'Send my plan',
    note: 'We use your details only to prepare the plan. No mailing list.',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Split: Story = {};

export const Stacked: Story = { args: { layout: 'stacked', tone: 'default' } };

export const CustomFields: Story = {
  args: {
    fields: [
      {
        name: 'name',
        label: 'Full name',
        required: true,
        autoComplete: 'name',
      },
      {
        name: 'email',
        label: 'Work email',
        type: 'email',
        required: true,
        width: 'half',
      },
      {
        name: 'phone',
        label: 'Phone',
        type: 'tel',
        autoComplete: 'tel',
        width: 'half',
      },
      {
        name: 'employees',
        label: 'Employees',
        type: 'select',
        placeholder: 'Choose a range',
        options: ['1–49', '50–249', '250–999', '1,000+'],
      },
      { name: 'message', label: 'What should we cover?', type: 'textarea' },
    ],
  },
};

export const OnBrand: Story = { args: { tone: 'brand' } };

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
};
