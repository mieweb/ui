import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useState } from 'react';
import { fn } from 'storybook/test';
import { MCPToolCallDisplay, MCPToolCallGroup } from './index';
import type { MCPToolCall } from './types';
import { Button } from '../Button';
import { MotionProvider } from '../../motion/MotionProvider';
import {
  pendingToolCall,
  runningToolCall,
  successToolCall,
  errorToolCall,
} from './storyData';

// ============================================================================
// MCP Tool Call Stories
// ============================================================================

const meta: Meta<typeof MCPToolCallDisplay> = {
  id: 'chat-mcptoolcall',
  title: 'Modules/Chat/MCPToolCall',
  component: MCPToolCallDisplay,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:stable'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `### What it's for

**A status pill for one MCP tool invocation that expands into its result, error and parameters.** \`MCPToolCallDisplay\` takes \`toolCall: MCPToolCall\` (\`toolName\`, \`parameters: { name, type, value }[]\`, \`status\` \`pending\` | \`running\` | \`success\` | \`error\` | \`cancelled\`, optional \`duration\`, \`result: { type, data, summary, link, resources }\`, \`error\`). The pill label is a friendly verb phrase derived from \`toolName\` (a built-in map such as \`create_patient\` → "Creating patient" → "Created patient" on success; unknown names fall back to the snake_case name with underscores replaced) plus a detail bit — a parameter summary while running (\`firstName lastName\`, \`"query"\`, \`patientName on date\`, \`service near zipcode\`) or the formatted duration once done. When there is anything to show, the pill becomes a \`CollapsiblePill\` (\`collapsible\`, default \`true\`) whose box holds \`result.summary\`, a \`ResourceLink\` for \`result.link\` and each \`result.resources[]\`, the error text, and the raw parameter list (\`showParameters\`, default \`true\`). \`defaultCollapsed\` defaults to open for completed calls and collapsed while pending/running; \`compact\` tightens the pill; \`hidden\` renders nothing; \`onLinkClick(link)\` intercepts resource links. Also exported: \`ResourceLink\`, \`ToolStatusIcon\`, \`getToolIcon\`, and the shared \`CollapsiblePill\`.

**\`MCPToolCallGroup\`** renders a run of consecutive calls as compact rows (icon, \`serverName\`, \`toolName\`, status badge) under one "Used N tools" header. It stays open while any call is \`pending\`, \`running\` or \`awaiting-approval\`, and collapses once every call has settled, so a finished run takes one line (a group with keyboard focus in its rows stays open, so the focused row is not removed). Calls that are \`awaiting-approval\` or \`error\` stay listed while collapsed, with **Allow once / Always allow / Deny** (\`onApprove(toolCall, { always })\`, \`onDeny(toolCall)\`) and the error text. A manual toggle holds until a call arrives or changes status. Each row discloses its result links (\`result.link\` and \`result.resources\` as \`ResourceLink\`s; \`onLinkClick(link)\` intercepts them), parameters and result. A lone call renders as a bare row. Every string is in \`labels\` (English defaults in \`defaultMCPToolCallGroupLabels\`; counts are functions so the host pluralises). \`AIMessageDisplay\` and \`AIChat\` render it for each run of \`tool_use\` blocks when you pass \`toolCallGroup\`.

### Use it when

- An assistant turn includes tool activity and the user should see **what ran, on what, and what came back** without leaving the thread — \`AIMessageDisplay\` renders this for every \`tool_use\` block, and SuperChat reuses it.
- You render tool traces outside a chat (an audit drawer, a job log) and want the same pill; \`compact\` fits dense lists.
- An agent makes **many calls per turn**, or calls need the user's **approval**: use \`MCPToolCallGroup\` (or \`toolCallGroup\` on \`AIChat\`) so the run collapses to one line and approvals stay in view.

### Don't use it when

- The item is not a tool call — a plain collapsible summary should use \`CollapsiblePill\` directly, and reasoning text is the \`thinking\` block in \`AIMessage\`.
- You need users to **approve or deny** a single call shown as a pill: \`MCPToolCallDisplay\` has no action buttons; use \`MCPToolCallGroup\`, which renders a lone call as a bare row with the controls.
- You need to show large or structured \`result.data\`: only \`summary\`, links and resources are rendered; \`data\` is ignored unless \`result.type === 'error'\`.

### Example

\`\`\`tsx
// Host maps its agent events onto MCPToolCall and keeps the list in state.
const [calls, setCalls] = useState<Record<string, MCPToolCall>>({});

<ul className="space-y-2">
  {Object.values(calls).map((tc) => (
    <li key={tc.id}>
      <MCPToolCallDisplay
        toolCall={tc}
        compact
        showParameters={isDeveloperMode}
        onLinkClick={(link) => router.push(link.href)}
      />
    </li>
  ))}
</ul>

// Or hand a run of calls to the group, with approval wired to your API.
<MCPToolCallGroup
  toolCalls={calls}
  onApprove={(tc, { always }) => api.approve(tc.id, { always })}
  onDeny={(tc) => api.deny(tc.id)}
  labels={{ used: (n) => t('tools.used', { count: n }) }}
/>
\`\`\`

### Limitations

- **\`MCPToolCallDisplay\` does not announce status changes.** The pill re-renders from \`pending\` → \`running\` → \`success\`/\`error\` with only a colour and icon change (icons are \`aria-hidden\`); wrap the container in a live region if the transition matters to screen-reader users. The pill is a \`<button>\` with \`aria-expanded\` / \`aria-controls\` and a hard-coded \`title="Toggle details"\`; when there is nothing to expand it is rendered \`disabled\`.
- **\`MCPToolCallGroup\` does.** Its header is a \`<button>\` with \`aria-expanded\` / \`aria-controls\` naming the list; a polite \`role="status"\` region announces approval requests, the running count, failures and the settled count. Rows are \`role="listitem"\` groups named by \`labels.callLabel\`, each with its own disclosure trigger. Buttons stay disabled while \`onApprove\`/\`onDeny\` settle; reporting a rejected promise is the host's job.
- \`ResourceLink\` is an \`<a href>\` — with \`onLinkClick\` it calls \`preventDefault\` and hands you the link; without it the browser navigates, and \`resources[]\` without \`uri\` produce \`href="#"\`. External links carry no \`rel\`.
- **\`MCPToolCallDisplay\` is English only.** The friendly-name map, tense rewriting ("Creating" → "Created"), "Parameters", the \`ms\`/\`s\` duration format and "An error occurred" are hard-coded and assume English verb forms; \`toolName\` fallbacks are shown raw. \`MCPToolCallGroup\` takes every string through \`labels\`.
- Parameter values render via \`JSON.stringify\` (no truncation); the box is \`max-w-md\` and \`max-h-[500px]\` scrolling. Nothing is sanitised — \`summary\`, \`error\` and parameter values are text nodes, so HTML is not interpreted, but very long strings are not wrapped by word.
- Theming uses hard-coded \`neutral-*\`, \`primary-*\`, \`green-*\`, \`red-*\`, \`amber-*\` utilities; RTL is fine (flex, logical \`ms-*\`/\`border-s\`, no physical offsets). Depends on \`class-variance-authority\` and \`lucide-react\`. Entry \`@mieweb/ui\`.

### Motion

Under \`<MotionProvider>\`, \`MCPToolCallGroup\` rows expand and collapse with the \`collapse\` preset (height and opacity), and a call that joins a running group slides in. Rows honour \`prefers-reduced-motion\` themselves, because the provider's reduced-motion setting does not stop height animations. Without a provider, rows appear and disappear instantly. See the \`GroupMotion\` story.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'composes with',
          target: 'chat-aimessage',
          why: 'AIMessageDisplay embeds MCPToolCallDisplay for every `tool_use` content block.',
        },
      ],
    },
  },
  argTypes: {
    toolCall: {
      control: 'object',
      description:
        'The tool call to display, including status, parameters, and result.',
      table: { type: { summary: 'MCPToolCall' } },
    },
    showParameters: {
      control: 'boolean',
      description:
        'Whether to show the parameter list in the detailed (expanded) view.',
      table: { defaultValue: { summary: 'true' } },
    },
    collapsible: {
      control: 'boolean',
      description:
        'Whether clicking the pill toggles the entire detail box open/closed.',
      table: { defaultValue: { summary: 'true' } },
    },
    defaultCollapsed: {
      control: 'boolean',
      description:
        'Initial detail-box state. When omitted, completed tool calls start expanded and in-progress calls start collapsed.',
      table: { defaultValue: { summary: 'status-based' } },
    },
    compact: {
      control: 'boolean',
      description:
        'Render a condensed single-line variant, ideal for dense lists.',
    },
    hidden: {
      control: 'boolean',
      description:
        'Hide the whole tool-call display (mirrors the Ozwell widget debug flag).',
      table: { defaultValue: { summary: 'false' } },
    },
    onLinkClick: {
      action: 'onLinkClick',
      description: 'Called when a resource link in the result is clicked.',
      table: { type: { summary: '(link: MCPResourceLink) => void' } },
    },
    className: { table: { disable: true } },
  },
};

export default meta;
type Story = StoryObj<typeof MCPToolCallDisplay>;

/** A tool call that has been queued but has not started executing yet. */
export const Pending: Story = {
  args: {
    toolCall: pendingToolCall,
  },
};

/** A tool call that is currently executing. */
export const Running: Story = {
  args: {
    toolCall: runningToolCall,
  },
};

/** A completed tool call showing its result summary and a resource link. */
export const Success: Story = {
  args: {
    toolCall: successToolCall,
  },
};

/** A failed tool call surfacing the error message. */
export const Error: Story = {
  args: {
    toolCall: errorToolCall,
  },
};

/** The condensed single-line variant, ideal for dense lists. */
export const Compact: Story = {
  args: {
    toolCall: successToolCall,
    compact: true,
    collapsible: false,
  },
};

/**
 * Pill only by default — the box (result + params) stays hidden until the pill
 * is clicked. While running, the pill shows the input summary
 * (e.g. "Creating patient · John Smith").
 */
export const PillOnly: Story = {
  args: {
    toolCall: pendingToolCall,
  },
};

/**
 * `hidden` turns the whole display off at once — the equivalent of the Ozwell
 * widget's debug flag for toggling tool-call visibility.
 */
export const Hidden: Story = {
  args: {
    toolCall: successToolCall,
    hidden: true,
  },
};

// ============================================================================
// MCPToolCallGroup
// ============================================================================

function groupCall(
  id: string,
  toolName: string,
  status: MCPToolCall['status'],
  extra: Partial<MCPToolCall> = {}
): MCPToolCall {
  return {
    id,
    toolName,
    parameters: [{ name: 'path', type: 'string', value: 'src/' }],
    status,
    startedAt: new Date('2026-01-01T10:00:00Z'),
    result:
      status === 'success'
        ? { type: 'text', data: 'index.ts\nutils/' }
        : undefined,
    ...extra,
  };
}

const settledRun: MCPToolCall[] = [
  groupCall('g1', 'list_dir', 'success'),
  groupCall('g2', 'read_file', 'success'),
  groupCall('g3', 'bash', 'success', {
    parameters: [{ name: 'command', type: 'string', value: 'pnpm test' }],
  }),
  groupCall('g4', 'apply_patch', 'success'),
  groupCall('g5', 'bash', 'success', {
    parameters: [{ name: 'command', type: 'string', value: 'pnpm lint' }],
  }),
];

/**
 * `MCPToolCallGroup` with a finished run: five calls collapse to one "Used 5
 * tools" line. Click the header to list them; click a row for its parameters
 * and result.
 */
export const Group: Story = {
  render: () => <MCPToolCallGroup toolCalls={settledRun} />,
};

/**
 * A run with a call awaiting approval and one that failed, collapsed by hand.
 * Both stay listed with their controls and error; the header counts them.
 */
export const GroupNeedsAttention: Story = {
  render: () => (
    <MCPToolCallGroup
      toolCalls={[
        groupCall('a1', 'list_dir', 'success'),
        groupCall('a2', 'read_file', 'error', {
          error: 'ENOENT: no such file or directory, open notes.txt',
          result: undefined,
        }),
        groupCall('a3', 'delete_file', 'awaiting-approval', {
          serverName: 'Workspace',
          parameters: [{ name: 'path', type: 'string', value: 'build/' }],
          result: undefined,
        }),
      ]}
      onApprove={fn()}
      onDeny={fn()}
    />
  ),
};

/**
 * Every string comes from `labels`; counts are functions so the host can
 * pluralise. Shown with Spanish overrides.
 */
export const GroupLabels: Story = {
  render: () => (
    <MCPToolCallGroup
      toolCalls={settledRun}
      labels={{
        used: (n) =>
          `${n} ${n === 1 ? 'herramienta usada' : 'herramientas usadas'}`,
        running: (n) => `Ejecutando ${n} herramientas`,
        status: { success: 'Hecho' },
        callLabel: (tc) => `Llamada a herramienta: ${tc.toolName}`,
        showResult: 'Mostrar resultado',
      }}
    />
  ),
};

/**
 * Plays a live run: calls arrive one by one, the group stays open while they
 * run, then collapses once the last settles. Toggle motion to compare the
 * `collapse` preset with instant rows.
 */
function GroupMotionDemo() {
  const [motionEnabled, setMotionEnabled] = useState(true);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (step === 0 || step > settledRun.length) return;
    const timer = setTimeout(() => setStep((s) => s + 1), 700);
    return () => clearTimeout(timer);
  }, [step]);

  const calls = settledRun
    .slice(0, Math.min(step, settledRun.length))
    .map((call, index, shown) =>
      index === shown.length - 1 && step <= settledRun.length
        ? { ...call, status: 'running' as const, result: undefined }
        : call
    );

  return (
    <MotionProvider disabled={!motionEnabled}>
      <div className="flex w-96 flex-col gap-4">
        <div className="flex items-center gap-3">
          <Button size="sm" onClick={() => setStep(1)}>
            Play run
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setMotionEnabled((enabled) => !enabled)}
            aria-pressed={motionEnabled}
          >
            Motion: {motionEnabled ? 'on' : 'off'}
          </Button>
        </div>
        {calls.length > 0 && <MCPToolCallGroup toolCalls={calls} />}
      </div>
    </MotionProvider>
  );
}

export const GroupMotion: Story = {
  render: () => <GroupMotionDemo />,
  parameters: {
    docs: {
      description: {
        story:
          '`MCPToolCallGroup` under `@mieweb/ui/motion`. Each arriving call slides in, the group stays open while one runs, and the rows collapse away once the run settles. With motion off they appear and disappear instantly. Rows check `prefers-reduced-motion` themselves. The provider is normally mounted once at the app root; it is local here so the comparison can be toggled.',
      },
    },
  },
};
