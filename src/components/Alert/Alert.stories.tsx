import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Info as InfoIcon,
  Bell,
  ShieldAlert,
  Lightbulb,
  Zap,
} from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from './Alert';

// Icon registry for Storybook controls
const iconRegistry: Record<string, React.ReactElement | null> = {
  none: null,
  info: <InfoIcon size={16} />,
  alertCircle: <AlertCircle size={16} />,
  alertTriangle: <AlertTriangle size={16} />,
  checkCircle: <CheckCircle size={16} />,
  bell: <Bell size={16} />,
  shieldAlert: <ShieldAlert size={16} />,
  lightbulb: <Lightbulb size={16} />,
  zap: <Zap size={16} />,
};

const meta: Meta<typeof Alert> = {
  id: 'feedback-alert',
  title: 'Components/Feedback/Alert',
  component: Alert,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `### What it's for

An inline, persistent message box with \`role="alert"\`: five intents (\`default\`, \`info\`, \`success\`, \`warning\`, \`danger\`), an \`icon\` slot, and optional \`dismissible\` × with \`onDismiss\`. Compose the body with \`AlertTitle\` and \`AlertDescription\`.

### Use it when

- The message belongs to the content it sits next to and should stay until the situation changes: a form-level validation summary, "this record is read-only", a deprecation notice.
- The user must be able to re-read it; it is not a fleeting confirmation.

### Don't use it when

- Confirming a completed action ("Saved") — use \`Toast\`, which is transient and announced for you.
- The user must decide before continuing — use \`AlertDialog\`.
- The whole page is in an error state (404, offline) — use \`ErrorPage\`.
- Asking for cookie/terms consent — \`CookieConsent\` is the persistent, positioned banner for that.

### Example

\`\`\`tsx
{errors.length > 0 && (
  <Alert variant="danger" dismissible onDismiss={clearErrors}>
    <AlertTitle>Fix {errors.length} fields to continue</AlertTitle>
    <AlertDescription>
      <ul>{errors.map((e) => <li key={e.field}>{e.message}</li>)}</ul>
    </AlertDescription>
  </Alert>
)}
\`\`\`

### Limitations

- \`role="alert"\` makes screen readers announce the box **when it mounts**; if it is present on page load that is fine, but avoid mounting several at once or re-mounting on every render.
- \`dismissLabel\` (\`aria-label\` of the × button) defaults to English; translate it.
- Dismissal is not persisted — the host decides whether to show it again.
- Colours are semantic tokens with \`dark:\` variants; the \`icon\` you pass is not recoloured.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'alternative to',
          target: 'feedback-toast',
          why: 'Toast is transient and stacked in a corner; Alert stays inline until the condition clears.',
        },
        {
          type: 'alternative to',
          target: 'feedback-alertdialog',
          why: 'AlertDialog blocks and demands a decision; Alert informs without interrupting.',
        },
        {
          type: 'alternative to',
          target: 'feedback-errorpage',
          why: 'ErrorPage replaces the whole view; Alert annotates part of a working view.',
        },
        {
          type: 'alternative to',
          target: 'overlays-cookieconsent',
          why: 'CookieConsent is a fixed-position consent banner with accept/decline; Alert is inline content.',
        },
      ],
    },
  },
  tags: ['autodocs', 'scope:general-purpose', 'maturity:stable'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'info', 'success', 'warning', 'danger'],
    },
    dismissible: {
      control: 'boolean',
    },
    icon: {
      control: 'select',
      options: Object.keys(iconRegistry),
      mapping: iconRegistry,
      description: 'Icon to display in the alert',
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: '400px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    variant: 'default',
    children: (
      <>
        <AlertTitle>Default Alert</AlertTitle>
        <AlertDescription>This is a default alert message.</AlertDescription>
      </>
    ),
  },
};

export const Info: Story = {
  args: {
    variant: 'info',
    icon: <InfoIcon size={16} />,
    children: (
      <>
        <AlertTitle>Information</AlertTitle>
        <AlertDescription>This is an informational message.</AlertDescription>
      </>
    ),
  },
};

export const Success: Story = {
  args: {
    variant: 'success',
    icon: <CheckCircle size={16} />,
    children: (
      <>
        <AlertTitle>Success!</AlertTitle>
        <AlertDescription>
          Your changes have been saved successfully.
        </AlertDescription>
      </>
    ),
  },
};

export const Warning: Story = {
  args: {
    variant: 'warning',
    icon: <AlertTriangle size={16} />,
    children: (
      <>
        <AlertTitle>Warning</AlertTitle>
        <AlertDescription>
          Your session is about to expire in 5 minutes.
        </AlertDescription>
      </>
    ),
  },
};

export const Danger: Story = {
  args: {
    variant: 'danger',
    icon: <AlertCircle size={16} />,
    children: (
      <>
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Something went wrong. Please try again.
        </AlertDescription>
      </>
    ),
  },
};

export const WithIcon: Story = {
  args: {
    variant: 'info',
    icon: <InfoIcon size={16} />,
    children: (
      <>
        <AlertTitle>Did you know?</AlertTitle>
        <AlertDescription>
          You can customize the look and feel of alerts with different variants.
        </AlertDescription>
      </>
    ),
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-4">
      <Alert variant="default">
        <AlertTitle>Default</AlertTitle>
        <AlertDescription>Default alert style.</AlertDescription>
      </Alert>
      <Alert variant="info" icon={<InfoIcon size={16} />}>
        <AlertTitle>Info</AlertTitle>
        <AlertDescription>Informational alert style.</AlertDescription>
      </Alert>
      <Alert variant="success" icon={<CheckCircle size={16} />}>
        <AlertTitle>Success</AlertTitle>
        <AlertDescription>Success alert style.</AlertDescription>
      </Alert>
      <Alert variant="warning" icon={<AlertTriangle size={16} />}>
        <AlertTitle>Warning</AlertTitle>
        <AlertDescription>Warning alert style.</AlertDescription>
      </Alert>
      <Alert variant="danger" icon={<AlertCircle size={16} />}>
        <AlertTitle>Danger</AlertTitle>
        <AlertDescription>Danger alert style.</AlertDescription>
      </Alert>
    </div>
  ),
};

function DismissibleExample() {
  const [visible, setVisible] = useState(true);

  if (!visible) {
    return (
      <button
        onClick={() => setVisible(true)}
        className="text-primary-800 text-sm underline"
      >
        Show alert again
      </button>
    );
  }

  return (
    <Alert
      variant="info"
      dismissible
      onDismiss={() => setVisible(false)}
      icon={<InfoIcon size={16} />}
    >
      <AlertTitle>Dismissible Alert</AlertTitle>
      <AlertDescription>
        This alert can be dismissed by clicking the close button.
      </AlertDescription>
    </Alert>
  );
}

export const Dismissible: Story = {
  render: () => <DismissibleExample />,
};
