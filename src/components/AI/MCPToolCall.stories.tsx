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
        component:
          'Renders an MCP tool invocation as a status pill with an optional detail box for results, errors, and parameters.',
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
