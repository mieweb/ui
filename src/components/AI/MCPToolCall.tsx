/**
 * MCP Tool Call Display Component
 *
 * Renders an MCP tool invocation with status, parameters, and results.
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';
import type {
  MCPToolCall,
  MCPToolStatus,
  MCPToolResult,
  MCPResourceLink,
  MCPToolParameter,
} from './types';

// ============================================================================
// Status Icon Component
// ============================================================================

const statusIconVariants = cva(
  'flex h-5 w-5 items-center justify-center rounded-full',
  {
    variants: {
      status: {
        pending: 'bg-neutral-200 dark:bg-neutral-700',
        running: 'bg-primary-100 dark:bg-primary-900/50',
        success: 'bg-green-100 dark:bg-green-900/50',
        error: 'bg-red-100 dark:bg-red-900/50',
        cancelled: 'bg-neutral-200 dark:bg-neutral-700',
      },
    },
    defaultVariants: {
      status: 'pending',
    },
  }
);

interface ToolStatusIconProps {
  status: MCPToolStatus;
  className?: string;
}

function ToolStatusIcon({ status, className }: ToolStatusIconProps) {
  return (
    <span className={cn(statusIconVariants({ status }), className)}>
      {status === 'pending' && (
        <svg
          className="h-3 w-3 text-neutral-500"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <circle cx="10" cy="10" r="3" />
        </svg>
      )}
      {status === 'running' && (
        <svg
          className="text-primary-600 dark:text-primary-400 h-3 w-3 animate-spin"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {status === 'success' && (
        <svg
          className="h-3 w-3 text-green-600 dark:text-green-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="3"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
      )}
      {status === 'error' && (
        <svg
          className="h-3 w-3 text-red-600 dark:text-red-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="3"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      )}
      {status === 'cancelled' && (
        <svg
          className="h-3 w-3 text-neutral-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="3"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" />
        </svg>
      )}
    </span>
  );
}

// ============================================================================
// Tool Icon Component
// ============================================================================

const TOOL_ICONS: Record<string, React.ReactNode> = {
  // Patient tools
  create_patient: (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z"
      />
    </svg>
  ),
  get_patient: (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
      />
    </svg>
  ),
  search_patients: (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
      />
    </svg>
  ),
  // Appointment tools
  schedule_appointment: (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z"
      />
    </svg>
  ),
  // Document tools
  create_document: (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
      />
    </svg>
  ),
  // Provider tools
  search_providers: (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
      />
    </svg>
  ),
  // Default tool icon
  default: (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z"
      />
    </svg>
  ),
};

function getToolIcon(toolName: string): React.ReactNode {
  return TOOL_ICONS[toolName] || TOOL_ICONS.default;
}

// ============================================================================
// Resource Link Component
// ============================================================================

export interface ResourceLinkProps {
  link: MCPResourceLink;
  onClick?: (link: MCPResourceLink) => void;
  className?: string;
}

export function ResourceLink({ link, onClick, className }: ResourceLinkProps) {
  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault();
      onClick(link);
    }
  };

  const linkTypeIcons: Record<string, React.ReactNode> = {
    patient: (
      <svg
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
        />
      </svg>
    ),
    document: (
      <svg
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
        />
      </svg>
    ),
    appointment: (
      <svg
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
        />
      </svg>
    ),
    order: (
      <svg
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"
        />
      </svg>
    ),
    provider: (
      <svg
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
        />
      </svg>
    ),
    external: (
      <svg
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
        />
      </svg>
    ),
    internal: (
      <svg
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
        />
      </svg>
    ),
  };

  const icon = link.type ? linkTypeIcons[link.type] : linkTypeIcons.internal;

  return (
    <a
      href={link.href}
      onClick={handleClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5',
        'bg-primary-50 text-primary-700 hover:bg-primary-100',
        'dark:bg-primary-900/30 dark:text-primary-300 dark:hover:bg-primary-900/50',
        'text-sm font-medium transition-colors',
        'focus:ring-primary-500 focus:ring-2 focus:ring-offset-2 focus:outline-none',
        'dark:focus:ring-offset-neutral-900',
        className
      )}
    >
      {icon}
      <span>{link.label}</span>
      {link.type === 'external' && (
        <svg
          className="h-3 w-3 opacity-60"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25"
          />
        </svg>
      )}
    </a>
  );
}

// ============================================================================
// Tool Result Component
// ============================================================================

interface ToolResultDisplayProps {
  result: MCPToolResult;
  onLinkClick?: (link: MCPResourceLink) => void;
  showRawData?: boolean;
  className?: string;
}

function ToolResultDisplay({
  result,
  onLinkClick,
  showRawData = false,
  className,
}: ToolResultDisplayProps) {
  const [showJson, setShowJson] = React.useState(false);

  if (result.type === 'error') {
    return (
      <div
        className={cn(
          'mt-2 rounded-md bg-red-50 p-3 dark:bg-red-900/20',
          className
        )}
      >
        <p className="text-sm text-red-700 dark:text-red-300">
          {typeof result.data === 'string'
            ? String(result.data)
            : 'An error occurred'}
        </p>
      </div>
    );
  }

  const hasRawData =
    result.type === 'json' && result.data !== undefined && result.data !== null;

  return (
    <div className={cn('space-y-2', className)}>
      {result.summary && (
        <p className="text-sm text-neutral-700 dark:text-neutral-300">
          {result.summary}
        </p>
      )}

      {result.link && <ResourceLink link={result.link} onClick={onLinkClick} />}

      {result.resources && result.resources.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {result.resources.map((resource) => (
            <ResourceLink
              key={resource.id}
              link={{
                href: resource.uri || '#',
                label: resource.name,
                type: resource.type as MCPResourceLink['type'],
              }}
              onClick={onLinkClick}
            />
          ))}
        </div>
      )}

      {/* Raw JSON data - hidden by default */}
      {hasRawData && showRawData && (
        <div className="mt-2">
          <button
            onClick={() => setShowJson(!showJson)}
            className="flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300"
          >
            <svg
              className={cn(
                'h-3 w-3 transition-transform',
                showJson && 'rotate-90'
              )}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              />
            </svg>
            {showJson ? 'Hide' : 'Show'} raw data
          </button>
          {showJson && (
            <pre className="mt-2 max-h-40 overflow-auto rounded-md bg-neutral-100 p-2 text-xs dark:bg-neutral-800">
              {JSON.stringify(result.data, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MCP Tool Call Component
// ============================================================================

const toolCallVariants = cva(
  ['rounded-lg border', 'overflow-hidden', 'transition-all duration-200'],
  {
    variants: {
      status: {
        pending:
          'border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800/50',
        running:
          'border-primary-200 bg-primary-50/50 dark:border-primary-800 dark:bg-primary-900/20',
        success:
          'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-900/20',
        error:
          'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-900/20',
        cancelled:
          'border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800/50 opacity-60',
      },
      compact: {
        true: 'p-2',
        false: 'p-3',
      },
    },
    defaultVariants: {
      status: 'pending',
      compact: false,
    },
  }
);

// Human-readable tool names
const TOOL_FRIENDLY_NAMES: Record<string, string> = {
  create_patient: 'Creating patient',
  get_patient: 'Looking up patient',
  search_patients: 'Searching patients',
  update_patient: 'Updating patient',
  delete_patient: 'Removing patient',
  schedule_appointment: 'Scheduling appointment',
  cancel_appointment: 'Canceling appointment',
  update_appointment: 'Updating appointment',
  create_document: 'Creating document',
  upload_document: 'Uploading document',
  get_document: 'Retrieving document',
  search_documents: 'Searching documents',
  create_order: 'Creating order',
  send_message: 'Sending message',
  search: 'Searching',
  search_providers: 'Searching for providers',
};

function getToolFriendlyName(toolName: string, status: MCPToolStatus): string {
  const baseName = TOOL_FRIENDLY_NAMES[toolName] || toolName.replace(/_/g, ' ');

  // Adjust tense based on status
  if (status === 'success') {
    // Past tense approximation
    if (baseName.startsWith('Creating'))
      return baseName.replace('Creating', 'Created');
    if (baseName.startsWith('Scheduling'))
      return baseName.replace('Scheduling', 'Scheduled');
    if (baseName.startsWith('Searching'))
      return baseName.replace('Searching', 'Found');
    if (baseName.startsWith('Looking'))
      return baseName.replace('Looking', 'Found');
    if (baseName.startsWith('Updating'))
      return baseName.replace('Updating', 'Updated');
    if (baseName.startsWith('Removing'))
      return baseName.replace('Removing', 'Removed');
    if (baseName.startsWith('Canceling'))
      return baseName.replace('Canceling', 'Canceled');
    if (baseName.startsWith('Retrieving'))
      return baseName.replace('Retrieving', 'Retrieved');
    if (baseName.startsWith('Uploading'))
      return baseName.replace('Uploading', 'Uploaded');
    if (baseName.startsWith('Sending'))
      return baseName.replace('Sending', 'Sent');
  }
  return baseName;
}

// Generate a user-friendly summary from parameters
function getParameterSummary(
  toolName: string,
  params: MCPToolParameter[]
): string | null {
  const paramMap = Object.fromEntries(params.map((p) => [p.name, p.value]));

  // Patient creation
  if (
    toolName === 'create_patient' &&
    paramMap.firstName &&
    paramMap.lastName
  ) {
    return `${paramMap.firstName} ${paramMap.lastName}`;
  }

  // Search
  if (toolName.includes('search') && paramMap.query) {
    return `"${paramMap.query}"`;
  }

  // Appointment
  if (toolName.includes('appointment') && paramMap.patientName) {
    const date = paramMap.preferredDate || paramMap.date;
    return date
      ? `${paramMap.patientName} on ${date}`
      : String(paramMap.patientName);
  }

  // Provider search
  if (toolName === 'search_providers' && paramMap.zipcode) {
    const service = paramMap.service;
    return service
      ? `${service} near ${paramMap.zipcode}`
      : `near ${paramMap.zipcode}`;
  }

  return null;
}

export interface MCPToolCallDisplayProps extends VariantProps<
  typeof toolCallVariants
> {
  /** The tool call to display */
  toolCall: MCPToolCall;
  /** Whether to show parameters (in detailed view) */
  showParameters?: boolean;
  /** Whether the component is collapsible to show details */
  collapsible?: boolean;
  /** Default collapsed state (true = hide details) */
  defaultCollapsed?: boolean;
  /** Callback when a resource link is clicked */
  onLinkClick?: (link: MCPResourceLink) => void;
  /** Additional class name */
  className?: string;
}

/**
 * Displays an MCP tool call with its status, parameters, and results.
 * Shows a user-friendly summary by default, with technical details available on expand.
 */
export function MCPToolCallDisplay({
  toolCall,
  showParameters = true,
  collapsible = true,
  defaultCollapsed = true,
  compact,
  onLinkClick,
  className,
}: MCPToolCallDisplayProps) {
  const [showDetails, setShowDetails] = React.useState(!defaultCollapsed);

  const formatDuration = (ms?: number) => {
    if (!ms) return null;
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const friendlyName = getToolFriendlyName(toolCall.toolName, toolCall.status);
  const paramSummary = getParameterSummary(
    toolCall.toolName,
    toolCall.parameters
  );

  return (
    <div
      className={cn(
        toolCallVariants({ status: toolCall.status, compact }),
        className
      )}
    >
      {/* Main Content - Always Visible */}
      <div className="flex items-start gap-3">
        {/* Tool Icon */}
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/50 text-neutral-600 dark:bg-neutral-700/50 dark:text-neutral-400">
          {getToolIcon(toolCall.toolName)}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Friendly Status Line */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-neutral-900 dark:text-white">
              {friendlyName}
            </span>
            <ToolStatusIcon status={toolCall.status} />
            {toolCall.duration && (
              <span className="text-xs text-neutral-400">
                {formatDuration(toolCall.duration)}
              </span>
            )}
          </div>

          {/* Parameter Summary (user-friendly) */}
          {paramSummary && toolCall.status !== 'success' && (
            <p className="mt-0.5 text-sm text-neutral-600 dark:text-neutral-400">
              {paramSummary}
            </p>
          )}

          {/* Result Summary & Links */}
          {toolCall.result && (
            <div className="mt-2">
              <ToolResultDisplay
                result={toolCall.result}
                onLinkClick={onLinkClick}
                showRawData={showDetails}
              />
            </div>
          )}

          {/* Error */}
          {toolCall.error && (
            <div className="mt-2 rounded-md bg-red-100 p-2 dark:bg-red-900/30">
              <p className="text-sm text-red-700 dark:text-red-300">
                {toolCall.error}
              </p>
            </div>
          )}

          {/* Show Details Toggle */}
          {collapsible && showParameters && toolCall.parameters.length > 0 && (
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="mt-2 flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300"
            >
              <svg
                className={cn(
                  'h-3 w-3 transition-transform',
                  showDetails && 'rotate-90'
                )}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>
              {showDetails ? 'Hide' : 'Show'} details
            </button>
          )}

          {/* Technical Details (collapsed by default) */}
          {showDetails && showParameters && toolCall.parameters.length > 0 && (
            <div className="mt-3 rounded-md bg-neutral-100 p-2 dark:bg-neutral-800">
              <h4 className="mb-1.5 text-xs font-medium tracking-wide text-neutral-500 uppercase dark:text-neutral-400">
                Parameters
              </h4>
              <div className="space-y-0.5">
                {toolCall.parameters.map((param) => (
                  <div
                    key={param.name}
                    className="flex items-start gap-2 text-xs"
                  >
                    <span className="font-mono text-neutral-500 dark:text-neutral-500">
                      {param.name}:
                    </span>
                    <span className="font-mono text-neutral-700 dark:text-neutral-300">
                      {typeof param.value === 'string'
                        ? param.value
                        : JSON.stringify(param.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export { ToolStatusIcon, getToolIcon };
