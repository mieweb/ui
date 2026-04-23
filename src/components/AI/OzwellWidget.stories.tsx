import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import { OzwellWidget, useOzwell } from './OzwellWidget';
import type { OzwellTool } from './OzwellWidget';

// ============================================================================
// Ozwell Widget Stories
// ============================================================================

const meta: Meta<typeof OzwellWidget> = {
  title: 'Product/Feature Modules/AI/OzwellWidget',
  component: OzwellWidget,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: [
          'The **OzwellWidget** wraps the official `@ozwell/react` chat widget with MIE brand defaults.',
          '',
          'This is a **real AI chat widget** — not a mock. It loads an iframe-based Ozwell chat that connects',
          'to an Ozwell-compatible server. Conversations are **private by default**; the host page only receives',
          'lifecycle events and tool calls, never message content.',
          '',
          '### Requirements',
          '- A valid `apiKey` (agent key `agnt_key-...` or parent key `ozw_...`)',
          '- Network access to the Ozwell reference server (or your own deployment)',
          '',
          '### Getting an API Key',
          'Contact `adamerla128@gmail.com` or `horner@mieweb.com` for credentials,',
          'or create an agent via the [Agent Registration API](https://mieweb.github.io/ozwellai-api/backend/agents).',
          '',
          '### Privacy',
          'Ozwell respects user privacy. The host site receives only lifecycle events — never conversation content.',
          'Users can ask anything without fear of surveillance. Sharing is always opt-in.',
        ].join('\n'),
      },
    },
  },
  argTypes: {
    apiKey: {
      control: 'text',
      description:
        'Agent key (`agnt_key-...`) or parent API key (`ozw_...`). Required for the widget to connect.',
    },
    endpoint: {
      control: 'text',
      description:
        'API endpoint URL. Defaults to the Ozwell dev reference server.',
    },
    theme: {
      control: 'select',
      options: ['auto', 'light', 'dark'],
      description: 'Color theme for the chat widget.',
    },
    primaryColor: {
      control: 'color',
      description:
        'Primary accent color. Defaults to Ozwell brand blue (#27aae1).',
    },
    position: {
      control: 'select',
      options: ['bottom-right', 'bottom-left', 'top-right', 'top-left'],
      description: 'Position of the floating widget button.',
    },
    width: {
      control: 'number',
      description: 'Chat window width in pixels.',
    },
    height: {
      control: 'number',
      description: 'Chat window height in pixels.',
    },
    defaultUI: {
      control: 'boolean',
      description:
        'When true (default), renders the floating chat button. When false, mounts in a container.',
    },
    debug: {
      control: 'boolean',
      description:
        'Enable debug mode — shows tool execution pills in the chat UI.',
    },
    welcomeMessage: {
      control: 'text',
      description: 'Welcome message shown when the chat opens.',
    },
    placeholder: {
      control: 'text',
      description: 'Input field placeholder text.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof OzwellWidget>;

// ============================================================================
// Default — Floating Widget
// ============================================================================

/**
 * The default Ozwell widget with the floating chat button.
 * Enter your API key in the controls panel to connect to a live Ozwell server.
 */
export const Default: Story = {
  args: {
    apiKey: 'agnt_key-moao6r5z2942807d0c04fc6d',
    defaultUI: true,
    debug: true,
    welcomeMessage: "Hi! I'm Ozwell. How can I help you today?",
  },
  render: (args) => (
    <div style={{ height: '600px', position: 'relative' }}>
      <div style={{ padding: '2rem' }}>
        <h2 style={{ marginBottom: '0.5rem' }}>Ozwell AI Chat Widget</h2>
        <p style={{ color: '#666', marginBottom: '1rem' }}>
          Enter an API key in the Storybook controls panel to activate the chat.
          The floating button will appear in the bottom-right corner.
        </p>
        <p style={{ color: '#999', fontSize: '0.875rem' }}>
          Using endpoint:{' '}
          <code>
            {args.endpoint ||
              'https://ozwell-dev-refserver.opensource.mieweb.org/v1/chat/completions'}
          </code>
        </p>
      </div>
      {args.apiKey ? (
        <OzwellWidget {...args} />
      ) : (
        <div
          style={{
            padding: '1rem 2rem',
            background: '#fef3cd',
            border: '1px solid #ffc107',
            borderRadius: '8px',
            margin: '0 2rem',
          }}
        >
          <strong>No API key provided.</strong> Enter an{' '}
          <code>agnt_key-...</code> or <code>ozw_...</code> key in the controls
          below to connect.
        </div>
      )}
    </div>
  ),
};

// ============================================================================
// Embedded — Container Mode
// ============================================================================

/**
 * Ozwell chat embedded in a specific container (no floating button).
 * Useful when you want the chat to appear inline in your layout.
 */
export const Embedded: Story = {
  args: {
    apiKey: '',
    defaultUI: false,
    width: 400,
    height: 500,
    debug: true,
    welcomeMessage: "Hi! I'm embedded in the page. Ask me anything!",
  },
  render: (args) => (
    <div style={{ padding: '2rem' }}>
      <h2 style={{ marginBottom: '1rem' }}>Embedded Chat</h2>
      <div
        style={{
          display: 'flex',
          gap: '2rem',
          alignItems: 'flex-start',
        }}
      >
        <div style={{ flex: 1 }}>
          <p style={{ color: '#666' }}>
            The chat widget is embedded directly in the page layout, not as a
            floating overlay. Set <code>defaultUI=false</code> to use this mode.
          </p>
        </div>
        <div
          style={{
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            overflow: 'hidden',
          }}
        >
          {args.apiKey ? (
            <OzwellWidget {...args} />
          ) : (
            <div
              style={{
                width: args.width || 400,
                height: args.height || 500,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#f9fafb',
                color: '#999',
                padding: '2rem',
                textAlign: 'center',
              }}
            >
              Enter an API key in controls to activate
            </div>
          )}
        </div>
      </div>
    </div>
  ),
};

// ============================================================================
// Dark Theme
// ============================================================================

/**
 * Ozwell widget with dark theme.
 * The widget automatically inherits `--mieweb-*` CSS token overrides,
 * so wrapping in a `.dark` class applies the design system dark palette.
 */
export const DarkTheme: Story = {
  args: {
    apiKey: '',
    theme: 'dark',
    defaultUI: true,
    debug: true,
  },
  render: (args) => (
    <div
      className="dark"
      style={{
        height: '600px',
        position: 'relative',
        background: 'var(--mieweb-background, #171717)',
        padding: '2rem',
        color: 'var(--mieweb-foreground, #e5e5e5)',
      }}
    >
      <h2 style={{ marginBottom: '0.5rem' }}>Dark Theme</h2>
      <p style={{ color: 'var(--mieweb-muted-foreground, #999)' }}>
        The widget button, header, and wrapper all inherit the dark mode tokens
        from the <code style={{ color: '#7dd3fc' }}>--mieweb-*</code> design
        system. Wrap your container in{' '}
        <code style={{ color: '#7dd3fc' }}>className=&quot;dark&quot;</code> to
        switch.
      </p>
      {args.apiKey ? (
        <OzwellWidget {...args} />
      ) : (
        <p
          style={{
            color: 'var(--mieweb-muted-foreground, #666)',
            marginTop: '1rem',
          }}
        >
          Enter an API key in controls to activate.
        </p>
      )}
    </div>
  ),
};

// ============================================================================
// With Tool Calling
// ============================================================================

const demoTools: OzwellTool[] = [
  {
    type: 'function',
    function: {
      name: 'get_patient_info',
      description: 'Get information about a patient by name or ID',
      parameters: {
        type: 'object',
        properties: {
          patientId: {
            type: 'string',
            description: 'The patient ID or name to look up',
          },
        },
        required: ['patientId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'schedule_appointment',
      description: 'Schedule a new appointment for a patient',
      parameters: {
        type: 'object',
        properties: {
          patientId: {
            type: 'string',
            description: 'The patient ID',
          },
          date: {
            type: 'string',
            description: 'Appointment date (YYYY-MM-DD)',
          },
          type: {
            type: 'string',
            description: 'Type of appointment',
            enum: ['checkup', 'follow-up', 'consultation', 'procedure'],
          },
        },
        required: ['patientId', 'date'],
      },
    },
  },
];

/**
 * Ozwell widget with MCP tool calling.
 * The AI can invoke tools you define — like reading patient data or scheduling appointments.
 * Tool calls cross the iframe boundary via postMessage; conversation content stays private.
 */

function ToolCallingDemo(props: React.ComponentProps<typeof OzwellWidget>) {
  const handleToolCall = React.useCallback(
    (
      tool: string,
      toolArgs: Record<string, unknown>,
      sendResult: (result: unknown) => void
    ) => {
      // Demo tool handlers — in a real app these would call your APIs
      if (tool === 'get_patient_info') {
        sendResult({
          success: true,
          data: {
            id: toolArgs.patientId,
            name: 'Jane Smith',
            dob: '1985-03-15',
            lastVisit: '2026-03-01',
            provider: 'Dr. Johnson',
          },
        });
      } else if (tool === 'schedule_appointment') {
        sendResult({
          success: true,
          message: `Appointment scheduled for patient ${toolArgs.patientId} on ${toolArgs.date} (${toolArgs.type || 'checkup'})`,
        });
      } else {
        sendResult({ success: false, error: `Unknown tool: ${tool}` });
      }
    },
    []
  );

  return (
    <div style={{ height: '600px', position: 'relative', padding: '2rem' }}>
      <h2 style={{ marginBottom: '0.5rem' }}>Tool Calling Demo</h2>
      <p style={{ color: '#666', marginBottom: '0.5rem' }}>
        This widget has two MCP tools registered: <code>get_patient_info</code>{' '}
        and <code>schedule_appointment</code>.
      </p>
      <p style={{ color: '#999', fontSize: '0.875rem' }}>
        Try: &quot;Look up patient 12345&quot; or &quot;Schedule a checkup for
        patient 12345 on 2026-05-01&quot;
      </p>
      {props.apiKey ? (
        <OzwellWidget {...props} onToolCall={handleToolCall} />
      ) : (
        <div
          style={{
            padding: '1rem',
            background: '#fef3cd',
            border: '1px solid #ffc107',
            borderRadius: '8px',
            marginTop: '1rem',
          }}
        >
          Enter an API key in controls to try tool calling live.
        </div>
      )}
    </div>
  );
}

export const WithToolCalling: Story = {
  args: {
    apiKey: '',
    tools: demoTools,
    debug: true,
    defaultUI: true,
    system:
      'You are a helpful medical office assistant. You can look up patient information and schedule appointments using the available tools.',
    welcomeMessage:
      'Hi! I can help you look up patient info or schedule appointments. Try asking me!',
  },
  render: (args) => <ToolCallingDemo {...args} />,
};

// ============================================================================
// Programmatic Control with useOzwell
// ============================================================================

function OzwellWithControls(props: React.ComponentProps<typeof OzwellWidget>) {
  const ozwell = useOzwell();

  return (
    <div style={{ padding: '2rem' }}>
      <h2 style={{ marginBottom: '1rem' }}>Programmatic Control</h2>
      <p style={{ color: '#666', marginBottom: '1rem' }}>
        Use the <code>useOzwell()</code> hook to control the widget
        programmatically.
      </p>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <button
          type="button"
          onClick={() => ozwell.open()}
          style={{
            padding: '0.5rem 1rem',
            background: '#27aae1',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          Open Chat
        </button>
        <button
          type="button"
          onClick={() => ozwell.close()}
          style={{
            padding: '0.5rem 1rem',
            background: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          Close Chat
        </button>
        <button
          type="button"
          onClick={() => ozwell.toggle()}
          style={{
            padding: '0.5rem 1rem',
            background: '#374151',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          Toggle
        </button>
      </div>

      <div
        style={{
          padding: '0.75rem',
          background: '#f3f4f6',
          borderRadius: '6px',
          fontSize: '0.875rem',
          fontFamily: 'monospace',
        }}
      >
        <div>isReady: {String(ozwell.isReady)}</div>
        <div>isOpen: {String(ozwell.isOpen)}</div>
        <div>hasUnread: {String(ozwell.hasUnread)}</div>
      </div>

      <OzwellWidget {...props} />
    </div>
  );
}

/**
 * Demonstrates the `useOzwell()` hook for programmatic control.
 * Open, close, and toggle the chat using buttons. Hook state is shown live.
 */
export const ProgrammaticControl: Story = {
  args: {
    apiKey: '',
    defaultUI: true,
    debug: true,
  },
  render: (args) =>
    args.apiKey ? (
      <OzwellWithControls {...args} />
    ) : (
      <div style={{ padding: '2rem' }}>
        <h2>Programmatic Control</h2>
        <p style={{ color: '#666', marginTop: '0.5rem' }}>
          Enter an API key in the controls to see the <code>useOzwell()</code>{' '}
          hook in action.
        </p>
      </div>
    ),
};

// ============================================================================
// Animated Rive Button
// ============================================================================

/**
 * Replaces the static launcher icon with a Rive-powered animated mascot.
 * The mascot floats gently and responds to hover/click via state machine triggers.
 * Set `animated={true}` to enable; the default ozwell button is hidden automatically.
 */
export const Animated: Story = {
  args: {
    apiKey: 'agnt_key-moao6r5z2942807d0c04fc6d',
    animated: true,
    defaultUI: true,
    debug: true,
    welcomeMessage: "Hi! I'm Ozwell. How can I help you today?",
  },
  render: (args) => (
    <div style={{ height: '600px', position: 'relative' }}>
      <div style={{ padding: '2rem' }}>
        <h2 style={{ marginBottom: '0.5rem' }}>Animated Ozwell Button</h2>
        <p style={{ color: '#666', marginBottom: '1rem' }}>
          The Rive mascot replaces the default launcher. It floats, responds to
          hover, and fires a click trigger on press. Try hovering and clicking
          the mascot in the bottom-right corner!
        </p>
        <p style={{ color: '#999', fontSize: '0.875rem' }}>
          Animation: <code>ozwell2.8.riv</code> &middot; State machine:{' '}
          <code>State Machine 1</code>
        </p>
      </div>
      {args.apiKey ? (
        <OzwellWidget {...args} />
      ) : (
        <div
          style={{
            padding: '1rem 2rem',
            background: '#fef3cd',
            border: '1px solid #ffc107',
            borderRadius: '8px',
            margin: '0 2rem',
          }}
        >
          <strong>No API key provided.</strong> Enter an{' '}
          <code>agnt_key-...</code> or <code>ozw_...</code> key in the controls
          below to connect.
        </div>
      )}
    </div>
  ),
};
