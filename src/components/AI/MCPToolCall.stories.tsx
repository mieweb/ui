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
  title: 'Product/Feature Modules/AI/MCPToolCall',
  component: MCPToolCallDisplay,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: [
          '`MCPToolCallDisplay` renders a single **Model Context Protocol (MCP) tool invocation**',
          'inside an AI conversation — for example, an assistant calling a `create_patient` tool.',
          '',
          'It shows a friendly, human-readable summary by default (tool name, status, duration, and',
          'any resulting resource link), and hides the technical parameter/JSON details behind a',
          '_Show details_ toggle so non-technical users are not overwhelmed.',
          '',
          '### Status states',
          '`pending` · `running` · `success` · `error` · `cancelled` — each renders a distinct icon and color.',
          '',
          '### When to use',
          'Embed it inside an `AIMessage` content block of type `tool_use`, or render it standalone to',
          'visualize an in-progress or completed tool call. Inside `AIChat` this happens automatically.',
        ].join('\n'),
      },
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
      description: 'Whether the technical details can be collapsed/expanded.',
      table: { defaultValue: { summary: 'true' } },
    },
    defaultCollapsed: {
      control: 'boolean',
      description:
        'Initial collapsed state. `true` hides the technical details by default.',
      table: { defaultValue: { summary: 'true' } },
    },
    compact: {
      control: 'boolean',
      description:
        'Render a condensed single-line variant, ideal for dense lists.',
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
    defaultCollapsed: false,
  },
};

/** A failed tool call surfacing the error message. */
export const Error: Story = {
  args: {
    toolCall: errorToolCall,
    defaultCollapsed: false,
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
