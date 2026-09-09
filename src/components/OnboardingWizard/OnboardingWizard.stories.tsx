import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import {
  OnboardingWizard,
  OnboardingStepQuestion,
  OnboardingCompletion,
} from './OnboardingWizard';
import { Button } from '../Button';
import { Input } from '../Input';

// =============================================================================
// Sample Steps Data
// =============================================================================

const sampleSteps = [
  {
    id: 'step1',
    title: 'Company Info',
    description: 'Tell us about your company',
    icon: 'fas fa-building',
    content: (
      <OnboardingStepQuestion
        icon="fas fa-building"
        title="What industry is your company in?"
        description="This helps us customize your experience."
        options={[
          { id: 'healthcare', label: 'Healthcare', icon: 'fas fa-heartbeat' },
          {
            id: 'construction',
            label: 'Construction',
            icon: 'fas fa-hard-hat',
          },
          {
            id: 'transportation',
            label: 'Transportation',
            icon: 'fas fa-truck',
          },
          {
            id: 'manufacturing',
            label: 'Manufacturing',
            icon: 'fas fa-industry',
          },
          { id: 'other', label: 'Other', icon: 'fas fa-ellipsis-h' },
        ]}
      />
    ),
  },
  {
    id: 'step2',
    title: 'Company Size',
    description: 'How many employees?',
    icon: 'fas fa-users',
    content: (
      <OnboardingStepQuestion
        icon="fas fa-users"
        title="How many employees does your company have?"
        description="We'll recommend the best plan for your needs."
        options={[
          { id: '1-10', label: '1-10' },
          { id: '11-50', label: '11-50' },
          { id: '51-200', label: '51-200' },
          { id: '201-500', label: '201-500' },
          { id: '500+', label: '500+' },
        ]}
      />
    ),
  },
  {
    id: 'step3',
    title: 'Import Employees',
    description: 'Add your team',
    icon: 'fas fa-file-import',
    content: (
      <OnboardingStepQuestion
        icon="fas fa-file-import"
        title="Import your employees"
        description="Import from your HR / HCM / HRIS / payroll system or upload a CSV."
      >
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button variant="outline" className="rounded-full">
            <i className="fas fa-file-import mr-2" />
            Import from HR Platform
          </Button>
          <Button variant="secondary" className="rounded-full">
            <i className="fas fa-file-upload mr-2" />
            Upload CSV
          </Button>
          <Button variant="secondary" className="rounded-full">
            <i className="fas fa-user-plus mr-2" />
            Add Manually
          </Button>
        </div>
      </OnboardingStepQuestion>
    ),
  },
  {
    id: 'step4',
    title: 'Payment',
    description: 'Set up billing',
    icon: 'fas fa-credit-card',
    content: (
      <OnboardingStepQuestion
        icon="fas fa-credit-card"
        title="Set up payment"
        description="Add your payment method to start ordering services."
      >
        <div className="border-border bg-muted/30 mx-auto mt-6 max-w-md rounded-lg border p-6">
          <div className="space-y-4">
            <Input
              id="card-number"
              label="Card Number"
              placeholder="4242 4242 4242 4242"
            />
            <div className="grid grid-cols-2 gap-4">
              <Input id="card-expiry" label="Expiry" placeholder="MM/YY" />
              <Input id="card-cvc" label="CVC" placeholder="123" />
            </div>
          </div>
        </div>
      </OnboardingStepQuestion>
    ),
  },
  {
    id: 'step5',
    title: 'Complete',
    description: 'All done!',
    icon: 'fas fa-check',
    content: (
      <OnboardingCompletion
        completed={true}
        onStartOrder={() => window.alert('Start order!')}
        onGoToDashboard={() => window.alert('Go to dashboard!')}
        onGoToEmployees={() => window.alert('Go to employees!')}
      />
    ),
  },
];

// =============================================================================
// Demo Mode Types
// =============================================================================

type DemoMode =
  | 'interactive'
  | 'loading'
  | 'error'
  | 'customBranding'
  | 'noHeader'
  | 'incomplete';

// =============================================================================
// Interactive Demo Wrapper
// =============================================================================

interface OnboardingWizardDemoProps {
  demoMode?: DemoMode;
  currentStep?: number;
  showHeader?: boolean;
  loading?: boolean;
  loadingMessage?: string;
  error?: string;
  brandName?: string;
  brandSubname?: string;
  nextEnabled?: boolean;
  backEnabled?: boolean;
}

function OnboardingWizardDemo({
  demoMode = 'interactive',
  currentStep: initialStep = 0,
  showHeader = true,
  loading = false,
  loadingMessage = 'Getting ready, one moment please...',
  error,
  brandName = 'BlueHive',
  brandSubname = 'for employers',
  nextEnabled = true,
  backEnabled = true,
}: OnboardingWizardDemoProps) {
  // For incomplete mode, start at the completion step (4) if no initialStep specified
  const effectiveInitialStep =
    demoMode === 'incomplete' && initialStep === 0 ? 4 : initialStep;
  const [currentStep, setCurrentStep] = React.useState(effectiveInitialStep);

  // Sync with Storybook controls
  React.useEffect(() => {
    // For incomplete mode, default to completion step if control is at 0
    const step =
      demoMode === 'incomplete' && initialStep === 0 ? 4 : initialStep;
    setCurrentStep(step);
  }, [initialStep, demoMode]);

  // Get steps based on demo mode
  const getSteps = () => {
    if (demoMode === 'incomplete') {
      return [
        ...sampleSteps.slice(0, 4),
        {
          id: 'step5',
          title: 'Complete',
          description: 'Review',
          icon: 'fas fa-check',
          content: (
            <OnboardingCompletion
              completed={false}
              incompleteSteps={[
                { step: 3, label: 'Import Employees' },
                { step: 4, label: 'Payment' },
              ]}
              onGoToStep={(step) => setCurrentStep(step - 1)}
            />
          ),
        },
      ];
    }
    return sampleSteps;
  };

  // Demo-specific overrides
  const getProps = () => {
    const baseProps = {
      steps: getSteps(),
      currentStep,
      onStepChange: setCurrentStep,
      onComplete: () => window.alert('Onboarding complete!'),
      onSkip: (step: number) => console.log('Skipped step:', step),
      showHeader,
      nextEnabled,
      backEnabled,
    };

    switch (demoMode) {
      case 'loading':
        return { ...baseProps, loading: true, loadingMessage };
      case 'error':
        return {
          ...baseProps,
          error: error || 'Something went wrong. Please try again.',
        };
      case 'customBranding':
        return {
          ...baseProps,
          brandName: 'Enterprise Health',
          brandSubname: 'Occupational Health',
          logoUrl:
            'https://www.enterprisehealth.com/hs-fs/hubfs/CMS%20Site-24/EH-Logo-Refresh.png',
        };
      case 'noHeader':
        return { ...baseProps, showHeader: false };
      case 'incomplete':
        return baseProps;
      case 'interactive':
      default:
        return { ...baseProps, brandName, brandSubname, loading, error };
    }
  };

  return (
    <div
      className="border-border relative h-[700px] overflow-hidden rounded-lg border shadow-lg"
      data-slot="onboarding-wizard-preview"
    >
      <OnboardingWizard
        {...getProps()}
        className="!absolute !inset-0 !h-full"
      />
    </div>
  );
}

// =============================================================================
// Meta Configuration
// =============================================================================

const meta: Meta<typeof OnboardingWizardDemo> = {
  id: 'navigation-onboardingwizard',
  title: 'Components/Navigation/OnboardingWizard',
  component: OnboardingWizardDemo,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:stable'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `### What it's for

A **full-screen guided setup flow** (\`fixed inset-0 z-50\`): branded header, a scrollable step body, and a footer with Back, a \`Progress\` bar ("Step 2 of 5"), Next / Finish and an optional Skip. It is **controlled**: pass \`steps: OnboardingStep[]\` (\`{ id, title, description?, skippable?, complete?, content }\`), \`currentStep\` (0-based) and \`onStepChange(index)\`; \`onComplete\` fires from Finish on the last step, \`onSkip(index)\` from Skip (which also advances). \`loading\` + \`loadingMessage\` swap the body for a \`Spinner\`; \`error\` renders an \`Alert\` above the step; \`backEnabled\` / \`nextEnabled\` gate the buttons (e.g. until the step validates); \`labels\` overrides the four button strings; \`showHeader\`, \`logoUrl\`, \`brandName\`, \`brandSubname\`, \`headerContent\` shape the header. Two content helpers ship with it: \`OnboardingStepQuestion\` (title, description, pill-button \`options\` with \`onSelect\`) and \`OnboardingCompletion\` (the "Setup complete!" / "Some steps not completed" final screen with BlueHive-specific actions). In Storybook, use the **Demo Mode** control to switch between the interactive, loading, error, custom-branding, no-header and incomplete scenarios.

### Use it when

- A new account or user must complete several setup questions before landing in the app, and the flow should take over the viewport.
- You want Back / Next / Skip / Finish, progress and loading/error handling for free and are happy to render each step's body yourself.

### Don't use it when

- The steps live **inside a page** with your own layout and buttons — \`StepIndicator\` gives you just the clickable rail.
- The flow is a **dialog**, not a takeover — compose \`Modal\` with a \`StepIndicator\`.
- Progress is something the user watches rather than drives — \`TimelineProgress\`.
- The product is not BlueHive — the default \`logoUrl\`, \`brandName\` ("BlueHive"), \`brandSubname\` ("for employers") and every string in \`OnboardingCompletion\` are BlueHive copy; override or replace them.

### Example

\`\`\`tsx
const [step, setStep] = useState(0);
const [answers, setAnswers] = useState<Answers>({});
const save = useSaveOnboarding();

<OnboardingWizard
  steps={[
    { id: 'size', title: 'Company size', content: (
        <OnboardingStepQuestion title="How many employees?" options={sizeOptions.map((o) => ({ ...o, selected: answers.size === o.id }))} onSelect={(id) => setAnswers((a) => ({ ...a, size: id }))} />
      ) },
    { id: 'services', title: 'Services', skippable: true, content: <ServicesPicker … /> },
    { id: 'done', title: 'Done', content: <OnboardingCompletion completed onStartOrder={() => navigate('/orders/new')} onGoToDashboard={() => navigate('/')} /> },
  ]}
  currentStep={step}
  onStepChange={setStep}
  nextEnabled={step !== 0 || Boolean(answers.size)}
  loading={save.isPending}
  error={save.error?.message}
  onComplete={() => save.mutate(answers)}
  labels={{ back: t('back'), next: t('next'), skip: t('skip'), finish: t('finish') }}
/>
\`\`\`

The host owns the step index, the answers and persistence; the wizard owns layout and button enablement only.

### Limitations

- Accessibility: the root is a plain \`<div>\` — **no \`role="dialog"\`, no \`aria-modal\`, no focus trap, no scroll lock**, even though it covers the page; the header is a \`<nav>\` with no label. Buttons get \`aria-label\` from \`labels\`; on small screens the text is hidden and a Font Awesome \`<i class="fas fa-chevron-*">\` icon is shown instead — **Font Awesome CSS is not bundled**, so without it the mobile buttons are empty. \`OnboardingStepQuestion\` option icons and \`OnboardingCompletion\` icons are also \`fas\` classes. Focus is not moved when the step changes; step titles (\`title\`, \`description\`) from \`OnboardingStep\` are **not rendered** by the wizard itself — put them in \`content\`. The \`Progress\` bar is labelled "Step N of M".
- i18n: button labels are props, but "Getting ready, one moment please...", "Step N of M", " Logo" alt suffix, and all \`OnboardingCompletion\` copy ("Setup complete!", "Start your first order", …) are hard-coded English. \`OnboardingStepQuestion\`'s \`multiple\` prop is accepted but unused.
- \`complete\` on a step is not used for anything; Skip appears on every non-last step unless \`skippable === false\`.
- RTL: header uses physical \`ml-3\`; icons use \`mr-2\`; chevrons do not mirror.
- Theming: header is \`bg-primary-800\`; body uses semantic tokens (\`bg-background\`, \`border-border\`); the \`Progress\` bar is fixed to \`variant="success"\`. Depends on \`Button\`, \`Alert\`, \`Spinner\`, \`Progress\`.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'alternative to',
          target: 'navigation-stepindicator',
          why: 'OnboardingWizard is the full-screen flow with header, buttons, progress, loading and error states; StepIndicator is only the clickable step rail for a wizard you build.',
        },
        {
          type: 'uses',
          target: 'loading-progress',
          why: 'The footer progress bar ("Step N of M") is a Progress with variant="success".',
        },
        {
          type: 'uses',
          target: 'feedback-alert',
          why: 'The error prop renders as an Alert variant="danger" above the step body.',
        },
        {
          type: 'uses',
          target: 'actions-button',
          why: 'Back / Next / Skip / Finish and the option pills are Buttons.',
        },
      ],
    },
  },
  args: {
    demoMode: 'interactive',
    currentStep: 0,
    showHeader: true,
    loading: false,
    loadingMessage: 'Getting ready, one moment please...',
    error: '',
    brandName: 'BlueHive',
    brandSubname: 'for employers',
    nextEnabled: true,
    backEnabled: true,
  },
  argTypes: {
    demoMode: {
      control: 'select',
      options: [
        'interactive',
        'loading',
        'error',
        'customBranding',
        'noHeader',
        'incomplete',
      ],
      description: 'Switch between different demo scenarios',
      table: { category: 'Demo' },
    },
    currentStep: {
      control: { type: 'range', min: 0, max: 4, step: 1 },
      description: 'Current step index (0-4)',
      if: { arg: 'demoMode', eq: 'interactive' },
    },
    showHeader: {
      control: 'boolean',
      description: 'Show the header with branding',
      if: { arg: 'demoMode', eq: 'interactive' },
    },
    loading: {
      control: 'boolean',
      description: 'Show loading state',
      if: { arg: 'demoMode', eq: 'interactive' },
    },
    loadingMessage: {
      control: 'text',
      description: 'Message shown during loading',
      if: { arg: 'demoMode', eq: 'loading' },
    },
    error: {
      control: 'text',
      description: 'Error message to display',
      if: { arg: 'demoMode', eq: 'error' },
    },
    brandName: {
      control: 'text',
      description: 'Brand name in header',
      if: { arg: 'demoMode', eq: 'interactive' },
    },
    brandSubname: {
      control: 'text',
      description: 'Brand subname in header',
      if: { arg: 'demoMode', eq: 'interactive' },
    },
    nextEnabled: {
      control: 'boolean',
      description: 'Enable/disable Next button',
      if: { arg: 'demoMode', eq: 'interactive' },
    },
    backEnabled: {
      control: 'boolean',
      description: 'Enable/disable Back button',
      if: { arg: 'demoMode', eq: 'interactive' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof OnboardingWizardDemo>;

// =============================================================================
// Stories
// =============================================================================

/** Interactive demo - use controls to navigate and customize */
export const Default: Story = {};

/** Loading state with customizable message */
export const Loading: Story = {
  args: { demoMode: 'loading', loadingMessage: 'Setting up your account...' },
};

/** Error state with alert banner */
export const WithError: Story = {
  args: {
    demoMode: 'error',
    error: 'Unable to save your progress. Please check your connection.',
  },
};

/** Custom branding example (Enterprise Health) */
export const CustomBranding: Story = {
  args: { demoMode: 'customBranding' },
};

/** Wizard without header */
export const NoHeader: Story = {
  args: { demoMode: 'noHeader', currentStep: 1 },
};

/** Completion step with incomplete items */
export const IncompleteSteps: Story = {
  args: { demoMode: 'incomplete' },
};

/** Import Employees step */
export const ImportStep: Story = {
  args: { demoMode: 'interactive', currentStep: 2 },
};

/** Payment step */
export const PaymentStep: Story = {
  args: { demoMode: 'interactive', currentStep: 3 },
};

/** Completion step (all complete) */
export const CompletionStep: Story = {
  args: { demoMode: 'interactive', currentStep: 4 },
};

/** Mobile viewport */
export const Mobile: Story = {
  args: { demoMode: 'interactive', currentStep: 2 },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
};
