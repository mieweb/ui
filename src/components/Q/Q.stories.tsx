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
  id: 'editors-q',
  title: 'Modules/Editors/Q',
  component: Q,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:stable'],
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
        component: `### What it's for

**A generated form for writing an AI agent's configuration, with a YAML/JSON view beside it.** \`Q\` wraps \`@mieweb/q\`'s \`AgentConfigGenerator\`: it renders a questionnaire from a \`schema\` (\`mieforms-v1.0\` sections and fields), keeps a \`QConfig\` object in sync, and — when \`showEditor\` (default \`true\`) — shows the same config as editable YAML/JSON. Hosts own persistence through \`initialConfig\`, \`onConfigChange(config)\`, \`onSubmit(yamlString)\` and \`onDownload(content, mode)\`. \`className\` / \`style\` size the wrapper. The entry also re-exports Q's building blocks (\`FormBuilder\`, \`ConfigEditor\`, \`ToolBuilder\`, \`Header\`, \`configToYaml\`, \`yamlToConfig\`, \`validateConfig\`, \`deriveDefaultConfig\`, \`TIMEZONES\`, \`GENERIC_TOOLS\`…) and two presets: \`qAgentSchema\` / \`qLandingPageAgentConfig\` (name, instructions, temperature) and \`qTwilioAgentSchema\` / \`createQTwilioAgentConfig()\` (phone, Twilio credentials, welcome, system prompt).

Ships from the optional **\`@mieweb/ui/q\`** entry: install the peer \`@mieweb/q\` (\`1.0.0\`) and import \`@mieweb/q/style.css\` beside \`@mieweb/ui/styles.css\`.

### Use it when

- Admins configure an **Ozwell / voice agent** — system prompt, tools, telephony — and should see the YAML they are producing.
- You want a form derived from a schema rather than hand-built fields, and the result must round-trip to YAML/JSON.

### Don't use it when

- The user writes **prose** — \`RichEditor\` (Markdown) or \`RichTextEditor\` (HTML). Q is in this family because of its code editor pane, not because it edits documents.
- You need a general form builder/renderer for clinical or business forms — the ESheet components (Composite forms), which own their own schema and validation.
- You cannot add the \`@mieweb/q\` peer or its stylesheet: the component is a thin wrapper and renders nothing without them.

### Example

\`\`\`tsx
const [config, setConfig] = useState<QConfig>(() => agent.config ?? createQTwilioAgentConfig());

<div className="h-[calc(100vh-var(--header-h))]">
  <Q
    initialConfig={config}
    schema={qTwilioAgentSchema}
    showEditor
    onConfigChange={setConfig}
    onSubmit={async (yaml) => {
      const errors = validateConfig(yamlToConfig(yaml), qTwilioAgentSchema).errors;
      if (errors.length) return toast.error(errors.join('\\n'));
      await api.saveAgent(agent.id, yaml);
    }}
    onDownload={(content, mode) => saveAs(content, \`agent.\${mode}\`)}
  />
</div>
\`\`\`

Q fills its container (\`h-full min-h-0 w-full\`), so give it a bounded height.

### Limitations

- Everything inside is **\`@mieweb/q\`'s** DOM: this wrapper adds one \`div\` and forwards props. Labels, tab structure, validation messages and keyboard handling are upstream and English-only; the story disables axe's \`aria-valid-attr-value\` rule because Q renders tab triggers without their referenced panels.
- No \`disabled\`, \`readOnly\`, \`aria-label\` or field-level error props on the wrapper; \`initialConfig\` is read once (remount with \`key\` to reset). Types are loose (\`QConfig\`/\`QSchema\` are \`Record<string, unknown>\`) via a local \`mieweb-q.d.ts\` shim.
- The Twilio preset carries an \`authToken\` field — the host must never render or persist real credentials client-side.
- Styling comes from \`@mieweb/q/style.css\`, not Tailwind tokens; dark mode and RTL depend on that stylesheet, not on \`@mieweb/ui\` theming. Peer \`@mieweb/q\` is pinned to \`1.0.0\`. Entry \`@mieweb/ui/q\`.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui/q',
      peers: ['@mieweb/q'],
      relationships: [
        {
          type: 'alternative to',
          target: 'editors-richeditor',
          why: 'RichEditor edits free-form Markdown prose; Q edits a structured agent configuration through a generated form plus YAML/JSON view.',
        },
      ],
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

export const DarkMode: Story = {
  render: () => (
    <div className="dark h-screen min-h-[720px] bg-neutral-950">
      <Q
        initialConfig={qLandingPageAgentConfig}
        schema={qAgentSchema}
        showEditor
      />
    </div>
  ),
};
