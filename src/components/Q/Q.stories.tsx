import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Q,
  createQTwilioAgentConfig,
  qAgentSchema,
  qLandingPageAgentConfig,
  qTwilioAgentSchema,
} from './index';
import '@mieweb/q/style.css';

const sampleTwilioConfig = {
  ...createQTwilioAgentConfig(),
  _id: 'sample-client-001',
  name: 'Main Street Medical',
  description: 'Agent for Main Street Medical Practice',
  timezone: 'America/New_York',
  twilio: {
    phoneNumber: '+15551234567',
    accountSid: 'AC_SAMPLE_SID',
    authToken: 'sample_auth_token',
  },
  welcome:
    'Thank you for calling Main Street Medical. How can I help you today?',
  systemPrompt:
    'You are a friendly medical office assistant for Main Street Medical Practice.',
};

const meta: Meta<typeof Q> = {
  title: 'Product/Feature Modules/Q',
  component: Q,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    a11y: {
      config: {
        // @mieweb/q renders tab triggers without their referenced tab panels.
        // Keep the upstream-only exception narrow while retaining contrast checks.
        rules: [{ id: 'aria-valid-attr-value', enabled: false }],
      },
    },
    docs: {
      description: {
        component:
          '`Q` is the agent config generator form surface. It wraps `@mieweb/q` for use through `@mieweb/ui/q`; hosts own persistence and submit/download behavior through callbacks.',
      },
    },
  },
  argTypes: {
    initialConfig: {
      control: 'object',
      description: 'Pre-populate Q with an existing agent config object.',
    },
    schema: {
      control: 'object',
      description: 'Override Q’s built-in questionnaire schema.',
    },
    showEditor: {
      control: 'boolean',
      description: 'Show the YAML/JSON config editor tab.',
      table: { defaultValue: { summary: 'true' } },
    },
    onConfigChange: {
      action: 'onConfigChange',
      description: 'Called whenever the config changes.',
    },
    onDownload: {
      action: 'onDownload',
      description: 'Called when the user downloads the config.',
    },
    onSubmit: {
      action: 'onSubmit',
      description: 'Called when the user submits the generated YAML.',
    },
    className: { table: { disable: true } },
    style: { table: { disable: true } },
  },
  args: {
    initialConfig: qLandingPageAgentConfig,
    schema: qAgentSchema,
    showEditor: true,
  },
};

export default meta;
type Story = StoryObj<typeof Q>;

export const Playground: Story = {
  render: (args) => (
    <div className="h-screen min-h-[720px] bg-neutral-50">
      <Q {...args} />
    </div>
  ),
};

export const AgentForm: Story = {
  name: 'Agent Form',
  render: () => (
    <div className="h-screen min-h-[720px] bg-neutral-50">
      <Q
        initialConfig={qLandingPageAgentConfig}
        schema={qAgentSchema}
        showEditor
        onConfigChange={(config) => console.log('Config changed:', config)}
        onSubmit={(yaml) => console.log('Submitted YAML:', yaml)}
      />
    </div>
  ),
};

export const AgentFormOnly: Story = {
  name: 'Agent Form Only',
  render: () => (
    <div className="h-screen min-h-[720px] bg-neutral-50">
      <Q
        initialConfig={qLandingPageAgentConfig}
        schema={qAgentSchema}
        showEditor={false}
        onConfigChange={(config) => console.log('Config changed:', config)}
        onSubmit={(yaml) => console.log('Submitted YAML:', yaml)}
      />
    </div>
  ),
};

export const TwilioAgentForm: Story = {
  name: 'Twilio Agent Form',
  render: () => (
    <div className="h-screen min-h-[720px] bg-neutral-50">
      <Q
        initialConfig={sampleTwilioConfig}
        schema={qTwilioAgentSchema}
        showEditor
        onConfigChange={(config) => console.log('Config changed:', config)}
        onSubmit={(yaml) => console.log('Submitted YAML:', yaml)}
      />
    </div>
  ),
};
