/**
 * MCP Tool Call Group
 *
 * Renders a run of consecutive tool calls as one compact block: a row per call
 * under a "Used N tools" header that collapses itself once every call has
 * settled, while calls that need the user stay in view.
 */

import * as React from 'react';
import { ChevronDown, Wrench } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Animated, AnimatedPresence } from '../../motion';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { Badge, type BadgeProps } from '../Badge';
import { Button } from '../Button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../Collapsible';
import { Spinner } from '../Spinner';
import { hasToolResultLinks, ToolResultLinks } from './MCPToolCall';
import type { MCPResourceLink, MCPToolCall, MCPToolStatus } from './types';

// ============================================================================
// Labels
// ============================================================================

/**
 * Every user-facing string the group renders. Strings that carry a count are
 * functions so the host can pluralise with its own i18n library.
 */
export interface MCPToolCallGroupLabels {
  /** Header once every call has settled, e.g. "Used 3 tools". */
  used: (count: number) => string;
  /** Header while any call is running or awaiting approval. */
  running: (count: number) => string;
  /** Header badge for calls awaiting approval. */
  needsApproval: (count: number) => string;
  /** Header badge for failed calls. */
  failed: (count: number) => string;
  /** Live-region announcement when calls start awaiting approval. */
  announceApproval: (count: number) => string;
  /** Live-region announcement when the run settles with failures. */
  announceFailed: (count: number) => string;
  /** Status badge text per status. */
  status: Record<MCPToolStatus, string>;
  /** Accessible name for a call's row. */
  callLabel: (toolCall: MCPToolCall) => string;
  /** Disclosure for a successful call's output. */
  showResult: string;
  /** Disclosure for a failed call's full error. */
  showError: string;
  /** Approve this call only. */
  allowOnce: string;
  /** Approve this call and stop asking for it. */
  allowAlways: string;
  /** Refuse the call. */
  deny: string;
}

/** Label overrides; `status` merges per key rather than replacing the record. */
export type MCPToolCallGroupLabelOverrides = Partial<
  Omit<MCPToolCallGroupLabels, 'status'>
> & {
  status?: Partial<Record<MCPToolStatus, string>>;
};

const plural = (count: number, one: string, other: string) =>
  count === 1 ? one : other;

export const defaultMCPToolCallGroupLabels: MCPToolCallGroupLabels = {
  used: (count) => `Used ${count} ${plural(count, 'tool', 'tools')}`,
  running: (count) => `Running ${count} ${plural(count, 'tool', 'tools')}`,
  needsApproval: (count) =>
    `${count} ${plural(count, 'needs', 'need')} approval`,
  failed: (count) => `${count} failed`,
  announceApproval: (count) =>
    `${count} tool ${plural(count, 'call needs', 'calls need')} your approval`,
  announceFailed: (count) =>
    `${count} tool ${plural(count, 'call', 'calls')} failed`,
  status: {
    pending: 'Pending',
    'awaiting-approval': 'Needs approval',
    running: 'Running',
    success: 'Done',
    error: 'Failed',
    cancelled: 'Cancelled',
    denied: 'Denied',
    expired: 'Expired',
  },
  callLabel: (toolCall) =>
    toolCall.serverName
      ? `Tool call: ${toolCall.toolName} from ${toolCall.serverName}`
      : `Tool call: ${toolCall.toolName}`,
  showResult: 'Show result',
  showError: 'Show error',
  allowOnce: 'Allow once',
  allowAlways: 'Always allow',
  deny: 'Deny',
};

function resolveLabels(
  overrides: MCPToolCallGroupLabelOverrides | undefined
): MCPToolCallGroupLabels {
  if (!overrides) return defaultMCPToolCallGroupLabels;
  return {
    ...defaultMCPToolCallGroupLabels,
    ...overrides,
    status: { ...defaultMCPToolCallGroupLabels.status, ...overrides.status },
  };
}

// ============================================================================
// Group state
// ============================================================================

/** A call the user has to see without expanding anything. */
function needsAttention(toolCall: MCPToolCall): boolean {
  return toolCall.status === 'awaiting-approval' || toolCall.status === 'error';
}

interface ToolGroupSummary {
  total: number;
  awaitingApproval: number;
  failed: number;
  /** True while any call is queued, running or awaiting approval. */
  isActive: boolean;
  /** Changes whenever a call is added or changes status. */
  signature: string;
}

function summarize(toolCalls: MCPToolCall[]): ToolGroupSummary {
  let awaitingApproval = 0;
  let failed = 0;
  let inFlight = 0;
  for (const toolCall of toolCalls) {
    if (toolCall.status === 'awaiting-approval') awaitingApproval += 1;
    else if (toolCall.status === 'error') failed += 1;
    else if (toolCall.status === 'running' || toolCall.status === 'pending')
      inFlight += 1;
  }
  return {
    total: toolCalls.length,
    awaitingApproval,
    failed,
    isActive: awaitingApproval + inFlight > 0,
    signature: toolCalls.map((call) => `${call.id}:${call.status}`).join('|'),
  };
}

/**
 * Open while any call is active, closed once every call has settled. A manual
 * toggle holds until the group's signature changes (a call arrives or changes
 * status), at which point the automatic state returns.
 */
function useAutoCollapse(
  isActive: boolean,
  signature: string
): [boolean, (expanded: boolean) => void] {
  const [state, setState] = React.useState(() => ({
    signature,
    expanded: isActive,
  }));
  const isStale = state.signature !== signature;
  if (isStale) setState({ signature, expanded: isActive });

  const setExpanded = React.useCallback(
    (expanded: boolean) => setState((current) => ({ ...current, expanded })),
    []
  );
  return [isStale ? isActive : state.expanded, setExpanded];
}

function announcementFor(
  summary: ToolGroupSummary,
  labels: MCPToolCallGroupLabels
): string {
  if (summary.awaitingApproval > 0) {
    return labels.announceApproval(summary.awaitingApproval);
  }
  if (summary.isActive) return labels.running(summary.total);
  if (summary.failed > 0) return labels.announceFailed(summary.failed);
  return labels.used(summary.total);
}

// ============================================================================
// Row
// ============================================================================

const STATUS_BADGE_VARIANT: Record<
  MCPToolStatus,
  NonNullable<BadgeProps['variant']>
> = {
  pending: 'secondary',
  'awaiting-approval': 'warning',
  running: 'default',
  success: 'success',
  error: 'danger',
  cancelled: 'secondary',
  denied: 'secondary',
  expired: 'secondary',
};

function formatParameters(toolCall: MCPToolCall): string {
  return JSON.stringify(
    Object.fromEntries(toolCall.parameters.map((p) => [p.name, p.value])),
    null,
    2
  );
}

function formatResult(toolCall: MCPToolCall): string | null {
  const { result } = toolCall;
  if (!result) return null;
  if (result.summary) return result.summary;
  return typeof result.data === 'string'
    ? result.data
    : JSON.stringify(result.data, null, 2);
}

interface ToolCallRowProps {
  toolCall: MCPToolCall;
  labels: MCPToolCallGroupLabels;
  onApprove?: MCPToolCallGroupProps['onApprove'];
  onDeny?: MCPToolCallGroupProps['onDeny'];
  onLinkClick?: MCPToolCallGroupProps['onLinkClick'];
}

/**
 * One call as a single compact line: icon, provider, name, status. Arguments
 * and output sit behind the row's own disclosure; approval controls and the
 * failure reason stay outside it so they are never hidden.
 *
 * The row animates its height in and out, so it must sit in an
 * `AnimatedPresence` for the exit to run.
 */
function ToolCallRow({
  toolCall,
  labels,
  onApprove,
  onDeny,
  onLinkClick,
}: ToolCallRowProps) {
  // `collapse` animates height, which `MotionConfig reducedMotion="user"`
  // leaves running, so the row honours the preference itself.
  const prefersReducedMotion = usePrefersReducedMotion();
  const [acting, setActing] = React.useState(false);
  const isAwaitingApproval = toolCall.status === 'awaiting-approval';
  const result = formatResult(toolCall);
  const hasLinks = hasToolResultLinks(toolCall.result);
  const hasDetails =
    toolCall.parameters.length > 0 || Boolean(result) || hasLinks;

  const act = async (action: () => void | Promise<void>) => {
    setActing(true);
    try {
      await action();
    } finally {
      setActing(false);
    }
  };

  return (
    <Animated
      preset="collapse"
      mode="presence"
      enabled={!prefersReducedMotion}
      role="listitem"
      data-slot="ai-tool-call-row"
      // Clipped so the row does not spill past its box while the height travels.
      className="overflow-hidden text-sm"
    >
      <div role="group" aria-label={labels.callLabel(toolCall)}>
        <Collapsible defaultOpen={isAwaitingApproval && hasDetails}>
          <CollapsibleTrigger className="focus-visible:ring-primary-500 flex w-full min-w-0 items-center gap-2 rounded px-1.5 py-1 text-start hover:bg-neutral-100 focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset dark:hover:bg-neutral-800">
            <span
              aria-hidden="true"
              className="flex h-3.5 w-3.5 shrink-0 items-center justify-center text-neutral-500 [&_svg]:h-3.5 [&_svg]:w-3.5"
            >
              {toolCall.icon ?? <Wrench />}
            </span>
            {toolCall.serverName && (
              <span className="shrink-0 text-neutral-500 dark:text-neutral-400">
                {toolCall.serverName}
              </span>
            )}
            <code className="min-w-0 truncate font-mono text-xs">
              {toolCall.toolName}
            </code>
            {toolCall.status === 'running' && (
              <span aria-hidden="true" className="shrink-0">
                <Spinner size="xs" />
              </span>
            )}
            <Badge
              variant={STATUS_BADGE_VARIANT[toolCall.status]}
              size="sm"
              className="ms-auto shrink-0"
            >
              {labels.status[toolCall.status]}
            </Badge>
            <ChevronDown
              aria-hidden="true"
              className="h-3.5 w-3.5 shrink-0 text-neutral-400 transition-transform motion-reduce:transition-none [[data-state=open]>&]:rotate-180"
            />
          </CollapsibleTrigger>

          <CollapsibleContent className="ms-6 mt-1 space-y-2 pb-1">
            {toolCall.result && hasLinks && (
              <ToolResultLinks
                result={toolCall.result}
                onLinkClick={onLinkClick}
              />
            )}
            {toolCall.parameters.length > 0 && (
              <pre className="max-h-40 overflow-auto rounded bg-neutral-100 p-2 text-xs dark:bg-neutral-900">
                {formatParameters(toolCall)}
              </pre>
            )}
            {(result || toolCall.error) && (
              <Collapsible>
                <CollapsibleTrigger className="flex items-center gap-1 text-xs font-medium text-neutral-600 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200">
                  <ChevronDown
                    aria-hidden="true"
                    className="h-3 w-3 transition-transform motion-reduce:transition-none [[data-state=open]>&]:rotate-180"
                  />
                  {result ? labels.showResult : labels.showError}
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-1">
                  <pre className="max-h-60 overflow-auto rounded bg-neutral-100 p-2 text-xs whitespace-pre-wrap dark:bg-neutral-900">
                    {result ?? toolCall.error}
                  </pre>
                </CollapsibleContent>
              </Collapsible>
            )}
          </CollapsibleContent>
        </Collapsible>

        {toolCall.status === 'error' && toolCall.error && (
          <p className="ms-6 line-clamp-2 text-xs text-red-600 dark:text-red-400">
            {toolCall.error}
          </p>
        )}

        {isAwaitingApproval && (onApprove || onDeny) && (
          <div className="ms-6 mt-1 flex flex-wrap gap-2 pb-1">
            {onApprove && (
              <>
                <Button
                  size="sm"
                  onClick={() =>
                    void act(() => onApprove(toolCall, { always: false }))
                  }
                  disabled={acting}
                  isLoading={acting}
                >
                  {labels.allowOnce}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    void act(() => onApprove(toolCall, { always: true }))
                  }
                  disabled={acting}
                >
                  {labels.allowAlways}
                </Button>
              </>
            )}
            {onDeny && (
              <Button
                size="sm"
                variant="danger"
                onClick={() => void act(() => onDeny(toolCall))}
                disabled={acting}
              >
                {labels.deny}
              </Button>
            )}
          </div>
        )}
      </div>
    </Animated>
  );
}

// ============================================================================
// Group
// ============================================================================

export interface MCPToolCallGroupProps {
  /** The calls in this run, in the order they were made. */
  toolCalls: MCPToolCall[];
  /**
   * Approve a call that is `awaiting-approval`. `always` is true for "Always
   * allow". The row shows a busy state until the returned promise settles;
   * report failures yourself (a toast, for example).
   */
  onApprove?: (
    toolCall: MCPToolCall,
    options: { always: boolean }
  ) => void | Promise<void>;
  /** Deny a call that is `awaiting-approval`. */
  onDeny?: (toolCall: MCPToolCall) => void | Promise<void>;
  /** Intercept clicks on a result's `link` and `resources`. */
  onLinkClick?: (link: MCPResourceLink) => void;
  /** Overrides for the English default strings. */
  labels?: MCPToolCallGroupLabelOverrides;
  /** Additional class name */
  className?: string;
}

/**
 * The parts of {@link MCPToolCallGroupProps} a chat passes to every group.
 * `onLinkClick` comes from the chat's own prop of the same name.
 */
export type MCPToolCallGroupOptions = Omit<
  MCPToolCallGroupProps,
  'toolCalls' | 'className' | 'onLinkClick'
>;

/**
 * A run of consecutive tool calls as one compact block. More than one call gets
 * a "Used N tools" header that collapses once every call has settled; calls
 * awaiting approval or that failed stay listed even while collapsed. A lone
 * call renders as a bare row.
 */
export function MCPToolCallGroup({
  toolCalls,
  onApprove,
  onDeny,
  onLinkClick,
  labels: labelOverrides,
  className,
}: MCPToolCallGroupProps) {
  const labels = React.useMemo(
    () => resolveLabels(labelOverrides),
    [labelOverrides]
  );
  const listId = React.useId();
  const summary = summarize(toolCalls);
  const [expanded, setExpanded] = useAutoCollapse(
    summary.isActive,
    summary.signature
  );

  // A lone call needs no header. The list keeps its place in the tree either
  // way, so the first row is not remounted when a second call arrives.
  const hasHeader = toolCalls.length > 1;
  const visibleCalls =
    !hasHeader || expanded ? toolCalls : toolCalls.filter(needsAttention);

  return (
    <div data-slot="ai-tool-call-group" className={className}>
      {hasHeader && (
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={listId}
          onClick={() => setExpanded(!expanded)}
          className="focus-visible:ring-primary-500 flex max-w-full items-center gap-2 rounded px-1.5 py-1 text-start text-sm text-neutral-600 hover:bg-neutral-100 focus-visible:ring-2 focus-visible:outline-none dark:text-neutral-400 dark:hover:bg-neutral-800"
        >
          {summary.isActive ? (
            <span aria-hidden="true" className="shrink-0">
              <Spinner size="xs" />
            </span>
          ) : (
            <Wrench aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
          )}
          <span className="font-medium">
            {summary.isActive
              ? labels.running(summary.total)
              : labels.used(summary.total)}
          </span>
          {summary.awaitingApproval > 0 && (
            <Badge variant="warning" size="sm" className="shrink-0">
              {labels.needsApproval(summary.awaitingApproval)}
            </Badge>
          )}
          {summary.failed > 0 && (
            <Badge variant="danger" size="sm" className="shrink-0">
              {labels.failed(summary.failed)}
            </Badge>
          )}
          <ChevronDown
            aria-hidden="true"
            className={cn(
              'h-3.5 w-3.5 shrink-0 transition-transform motion-reduce:transition-none',
              expanded && 'rotate-180'
            )}
          />
        </button>
      )}
      <div
        role="list"
        id={listId}
        className={cn(
          hasHeader &&
            'ms-3 border-s border-neutral-200 ps-2 dark:border-neutral-700'
        )}
      >
        <AnimatedPresence initial={false}>
          {visibleCalls.map((toolCall) => (
            <ToolCallRow
              key={toolCall.id}
              toolCall={toolCall}
              labels={labels}
              onApprove={onApprove}
              onDeny={onDeny}
              onLinkClick={onLinkClick}
            />
          ))}
        </AnimatedPresence>
      </div>
      <p role="status" className="sr-only">
        {announcementFor(summary, labels)}
      </p>
    </div>
  );
}
