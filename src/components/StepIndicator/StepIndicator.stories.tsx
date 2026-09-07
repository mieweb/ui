import type { Meta, StoryObj } from '@storybook/react';
import { StepIndicator } from './StepIndicator';

const meta: Meta<typeof StepIndicator> = {
  id: 'navigation-stepindicator',
  title: 'Components/Navigation/StepIndicator',
  component: StepIndicator,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:stable'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `### What it's for

The **numbered step rail of a multi-step form or wizard**: circles joined by connectors, each with a label and optional description. Pass \`steps: Step[]\` (\`{ id, label, description?, icon?, hasError?, optional? }\`) and a 0-based \`currentStep\`; steps before it render as completed (check), the current one is highlighted with \`aria-current="step"\`, the rest are upcoming. \`orientation\` is \`horizontal\` (labels under the circles) or \`vertical\` (labels beside); \`size\` is \`sm\` | \`md\` | \`lg\`. Give it \`onStepClick(index)\` and the circles become live buttons — by default only steps ≤ \`currentStep\` are clickable (\`allowCompletedStepsOnly\`, default true); set it to \`false\` to allow jumping ahead.

### Use it when

- A form is split into 2–6 stages the user moves through in order and should be able to see where they are and step back.
- You are building your own wizard shell (your buttons, your validation) and only need the indicator.

### Don't use it when

- You want the **whole flow** — header, Back / Next / Skip / Finish, progress, loading and error states — \`OnboardingWizard\` (it renders a \`Progress\` bar, not this component).
- The user is **watching** a process advance and cannot click stages — \`TimelineProgress\` in \`Timeline\`.
- The stages are peer views, not an ordered sequence — \`Tabs\`.
- You need a percentage — \`Progress\`.

### Example

\`\`\`tsx
const steps = [
  { id: 'details', label: 'Details' },
  { id: 'services', label: 'Services', description: 'Pick what to order' },
  { id: 'review', label: 'Review', optional: false },
];
const [current, setCurrent] = useState(0);
const [errors, setErrors] = useState<Record<string, boolean>>({});

<StepIndicator
  steps={steps.map((s) => ({ ...s, hasError: errors[s.id] }))}
  currentStep={current}
  onStepClick={setCurrent}
/>
{current === 0 && <DetailsForm onNext={() => setCurrent(1)} />}
…
\`\`\`

The host owns \`currentStep\`, validation and the step bodies; the indicator only reports clicks.

### Limitations

- Accessibility: \`<nav aria-label="Progress">\` (hard-coded English, not a prop) containing one \`<button aria-label="Step N: {label}">\` per step (also hard-coded "Step"); non-clickable steps are \`disabled\` buttons, so they are skipped by Tab and read as unavailable. The current step carries \`aria-current="step"\`. Completed/upcoming state is conveyed by the check icon and colour only — there is no "completed" text for screen readers. Connectors are \`aria-hidden\`. No list semantics and no arrow-key movement between steps.
- \`hasError\` recolours the circle red and shows an X but does not change \`aria-*\`; \`optional\` appends a hard-coded " (optional)" to the label. \`icon\` replaces the number/check for that step.
- Steps do not truncate: long horizontal labels wrap under their circle; there is no overflow/scroll handling.
- RTL: horizontal layout is symmetric flex; vertical connectors are centred under the circle. Fine in both directions.
- Theming: completed/current use \`primary-800\` (\`ring-primary-600/500\`), upcoming and connectors hard-coded \`neutral-200/500/700\`, errors \`red-*\`; focus rings are \`focus:\` (not \`focus-visible:\`), so they also show on mouse click. Uses raw class strings (no cva). No dependencies.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'alternative to',
          target: 'navigation-onboardingwizard',
          why: 'StepIndicator is only the clickable step rail for a wizard you build; OnboardingWizard is the full-screen flow with header, buttons, progress, loading and error states.',
        },
        {
          type: 'alternative to',
          target: 'data-display-timeline',
          why: 'StepIndicator has clickable steps for a flow the user drives; TimelineProgress shows the status of a process the user watches.',
        },
      ],
    },
  },
};

export default meta;
type Story = StoryObj<typeof StepIndicator>;

const basicSteps = [
  { id: 1, label: 'Schedule' },
  { id: 2, label: 'Confirm' },
  { id: 3, label: 'Results' },
];

const detailedSteps = [
  { id: 1, label: 'Account', description: 'Create your account' },
  { id: 2, label: 'Profile', description: 'Set up your profile' },
  { id: 3, label: 'Preferences', description: 'Configure settings' },
  { id: 4, label: 'Complete', description: 'Review and finish' },
];

export const Default: Story = {
  args: {
    steps: basicSteps,
    currentStep: 0,
  },
};

export const SecondStep: Story = {
  args: {
    steps: basicSteps,
    currentStep: 1,
  },
};

export const ThirdStep: Story = {
  args: {
    steps: basicSteps,
    currentStep: 2,
  },
};

export const AllComplete: Story = {
  args: {
    steps: basicSteps,
    currentStep: 3,
  },
};

export const WithDescriptions: Story = {
  args: {
    steps: detailedSteps,
    currentStep: 1,
  },
};

export const Vertical: Story = {
  args: {
    steps: detailedSteps,
    currentStep: 2,
    orientation: 'vertical',
  },
  decorators: [
    (Story) => (
      <div className="max-w-xs">
        <Story />
      </div>
    ),
  ],
};

export const Small: Story = {
  args: {
    steps: basicSteps,
    currentStep: 1,
    size: 'sm',
  },
};

export const Large: Story = {
  args: {
    steps: basicSteps,
    currentStep: 1,
    size: 'lg',
  },
};

export const WithError: Story = {
  args: {
    steps: [
      { id: 1, label: 'Details', description: 'Enter order details' },
      {
        id: 2,
        label: 'Payment',
        description: 'Payment failed',
        hasError: true,
      },
      { id: 3, label: 'Confirm', description: 'Review and confirm' },
    ],
    currentStep: 1,
  },
};

export const WithOptionalStep: Story = {
  args: {
    steps: [
      { id: 1, label: 'Required Step' },
      { id: 2, label: 'Optional Step', optional: true },
      { id: 3, label: 'Final Step' },
    ],
    currentStep: 0,
  },
};

export const Clickable: Story = {
  args: {
    steps: detailedSteps,
    currentStep: 2,
    onStepClick: (index) => console.log('Clicked step:', index),
  },
};

export const ClickableAllSteps: Story = {
  args: {
    steps: detailedSteps,
    currentStep: 2,
    onStepClick: (index) => console.log('Clicked step:', index),
    allowCompletedStepsOnly: false,
  },
};

export const WithCustomIcons: Story = {
  args: {
    steps: [
      {
        id: 1,
        label: 'Cart',
        icon: (
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        ),
      },
      {
        id: 2,
        label: 'Shipping',
        icon: (
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
            />
          </svg>
        ),
      },
      {
        id: 3,
        label: 'Payment',
        icon: (
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
            />
          </svg>
        ),
      },
    ],
    currentStep: 1,
  },
};

export const OrderConfirmationFlow: Story = {
  args: {
    steps: [
      {
        id: 'schedule',
        label: 'Schedule',
        description: 'Pick appointment time',
      },
      { id: 'confirm', label: 'Confirm', description: 'Review order details' },
      {
        id: 'results',
        label: 'Upload Results',
        description: 'Enter test results',
      },
    ],
    currentStep: 1,
    size: 'md',
  },
};
