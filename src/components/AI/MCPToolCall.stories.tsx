import type { Meta, StoryObj } from '@storybook/react-vite';
import { MCPToolCallDisplay } from './index';
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

### Use it when

- An assistant turn includes tool activity and the user should see **what ran, on what, and what came back** without leaving the thread — \`AIMessageDisplay\` renders this for every \`tool_use\` block, and SuperChat reuses it.
- You render tool traces outside a chat (an audit drawer, a job log) and want the same pill; \`compact\` fits dense lists.

### Don't use it when

- The item is not a tool call — a plain collapsible summary should use \`CollapsiblePill\` directly, and reasoning text is the \`thinking\` block in \`AIMessage\`.
- You need users to **approve or cancel** the call: there are no action buttons; \`cancelled\` is only a display status your host sets.
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
\`\`\`

### Limitations

- **Status changes are not announced.** The pill re-renders from \`pending\` → \`running\` → \`success\`/\`error\` with only a colour and icon change (icons are \`aria-hidden\`); wrap the container in a live region if the transition matters to screen-reader users. The pill is a \`<button>\` with \`aria-expanded\` / \`aria-controls\` and a hard-coded \`title="Toggle details"\`; when there is nothing to expand it is rendered \`disabled\`.
- \`ResourceLink\` is an \`<a href>\` — with \`onLinkClick\` it calls \`preventDefault\` and hands you the link; without it the browser navigates, and \`resources[]\` without \`uri\` produce \`href="#"\`. External links carry no \`rel\`.
- **English only.** The friendly-name map, tense rewriting ("Creating" → "Created"), "Parameters", the \`ms\`/\`s\` duration format and "An error occurred" are hard-coded and assume English verb forms; \`toolName\` fallbacks are shown raw.
- Parameter values render via \`JSON.stringify\` (no truncation); the box is \`max-w-md\` and \`max-h-[500px]\` scrolling. Nothing is sanitised — \`summary\`, \`error\` and parameter values are text nodes, so HTML is not interpreted, but very long strings are not wrapped by word.
- Theming uses hard-coded \`neutral-*\`, \`primary-*\`, \`green-*\`, \`red-*\` utilities; RTL is fine (flex, no physical offsets). Depends on \`class-variance-authority\`. Entry \`@mieweb/ui\`.`,
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
