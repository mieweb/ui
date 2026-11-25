/**
 * MCP Tool Call Group
 *
 * Renders a run of consecutive tool calls as one compact block: a row per call
 * under a "Used N tools" header that collapses itself once every call has
 * settled, while calls that need the user stay in view.
 */

import * as React from 'react';
import { Check, ChevronDown, Copy, Wrench } from 'lucide-react';
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
import {
  defaultToolCallResultLabels,
  defaultToolHintLabels,
  hasRichResult,
  hasToolCallMetadata,
  isStructuredTwin,
  safeStringify,
  ToolCallMetadata,
  ToolCallResultContent,
  type ToolCallResultLabels,
} from './ToolCallResultContent';
import type {
  MCPResourceLink,
  ToolBehaviorHints,
  ToolCall as MCPToolCall,
  ToolCallStatus as MCPToolStatus,
} from './types';

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
  /** Live-region announcement when calls fail, sent as each failure lands. */
  announceFailed: (count: number) => string;
  /** Status badge text per status; `uncertain` falls back to the default. */
  status: Record<Exclude<MCPToolStatus, 'uncertain'>, string> & {
    uncertain?: string;
  };
  /** Accessible name for a call's row. */
  callLabel: (toolCall: MCPToolCall) => string;
  /** Heads the raw `toolName` in a row's details when `displayName` is set. */
  toolId: string;
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
  /** Shown on a call that may or may not have run. */
  uncertainNotice?: string;
  /** Shown on a call the user denied. */
  deniedNotice?: string;
  /** Shown on a call whose approval timed out. */
  expiredNotice?: string;
  /** Header badge for calls that may or may not have run. */
  notConfirmed?: (count: number) => string;
  /** Link under approval controls that opens the server's trust settings. */
  trustServer?: (serverName: string) => string;
  /** Accessible name of the copy button next to raw output. */
  copy?: string;
  /** Announced once text has been copied. */
  copied?: string;
  /** Heads a call's labeled arguments. */
  arguments?: string;
  /** Disclosure for the raw arguments as JSON. */
  showRawArguments?: string;
  /** Provider-declared behavior hints, shown as explanation only. */
  hints?: Partial<Record<keyof ToolBehaviorHints, string>>;
  /** Introduces the hints as the provider's claims, e.g. "Provider notes:". */
  hintsLead?: string;
  /** Strings for structured, media and embedded results. */
  result?: Partial<ToolCallResultLabels>;
}

/** Every label resolved, so rendering never reads an optional key. */
type ResolvedLabels = Required<
  Omit<MCPToolCallGroupLabels, 'status' | 'hints' | 'result'>
> & {
  status: Record<MCPToolStatus, string>;
  hints: Record<keyof ToolBehaviorHints, string>;
  result: ToolCallResultLabels;
};

/** Label overrides; `status`, `hints` and `result` merge per key. */
export type MCPToolCallGroupLabelOverrides = Partial<
  Omit<MCPToolCallGroupLabels, 'status' | 'hints' | 'result'>
> & {
  status?: Partial<Record<MCPToolStatus, string>>;
  hints?: Partial<Record<keyof ToolBehaviorHints, string>>;
  result?: Partial<ToolCallResultLabels>;
};

const plural = (count: number, one: string, other: string) =>
  count === 1 ? one : other;

export const defaultMCPToolCallGroupLabels: ResolvedLabels = {
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
    uncertain: 'Not confirmed',
    cancelled: 'Cancelled',
    denied: 'Denied',
    expired: 'Expired',
  },
  callLabel: (toolCall) => {
    const name = toolCall.displayName || toolCall.toolName;
    return toolCall.serverName
      ? `Tool call: ${name} from ${toolCall.serverName}`
      : `Tool call: ${name}`;
  },
  toolId: 'Tool ID',
  showResult: 'Show result',
  showError: 'Show error',
  allowOnce: 'Allow once',
  allowAlways: 'Always allow',
  deny: 'Deny',
  uncertainNotice:
    'Could not confirm completion. The action may have taken effect, so check before retrying.',
  deniedNotice: "You denied this call, so it didn't run.",
  expiredNotice: "No decision was made in time, so this call didn't run.",
  notConfirmed: (count) => `${count} not confirmed`,
  trustServer: (serverName) => `Trust all ${serverName} tools…`,
  copy: 'Copy',
  copied: 'Copied',
  arguments: 'Inputs',
  showRawArguments: 'Show raw inputs',
  hints: defaultToolHintLabels,
  hintsLead: 'Provider notes:',
  result: defaultToolCallResultLabels,
};

/** Result text up to this length is shown directly; longer text sits behind a disclosure. */
const INLINE_RESULT_CHARS = 280;

function resolveLabels(
  overrides: MCPToolCallGroupLabelOverrides | undefined
): ResolvedLabels {
  if (!overrides) return defaultMCPToolCallGroupLabels;
  const base = defaultMCPToolCallGroupLabels;
  return {
    ...base,
    ...(Object.fromEntries(
      Object.entries(overrides).filter(([, value]) => value !== undefined)
    ) as Partial<ResolvedLabels>),
    status: { ...base.status, ...overrides.status },
    hints: { ...base.hints, ...overrides.hints },
    result: { ...base.result, ...overrides.result },
  };
}

// ============================================================================
// Group state
// ============================================================================

/** A call the user has to see without expanding anything. */
function needsAttention(toolCall: MCPToolCall): boolean {
  return (
    toolCall.status === 'awaiting-approval' ||
    toolCall.status === 'error' ||
    toolCall.status === 'uncertain'
  );
}

interface ToolGroupSummary {
  total: number;
  awaitingApproval: number;
  failed: number;
  uncertain: number;
  /** True while any call is queued, running or awaiting approval. */
  isActive: boolean;
  /** Changes whenever a call is added or changes status. */
  signature: string;
  /** IDs of the calls awaiting approval; changes with each new request. */
  approvalKey: string;
}

function summarize(toolCalls: MCPToolCall[]): ToolGroupSummary {
  let failed = 0;
  let uncertain = 0;
  let inFlight = 0;
  const awaitingIds: string[] = [];
  for (const toolCall of toolCalls) {
    if (toolCall.status === 'awaiting-approval') awaitingIds.push(toolCall.id);
    else if (toolCall.status === 'error') failed += 1;
    else if (toolCall.status === 'uncertain') uncertain += 1;
    else if (toolCall.status === 'running' || toolCall.status === 'pending')
      inFlight += 1;
  }
  return {
    total: toolCalls.length,
    awaitingApproval: awaitingIds.length,
    failed,
    uncertain,
    isActive: awaitingIds.length + inFlight > 0,
    signature: toolCalls.map((call) => `${call.id}:${call.status}`).join('|'),
    approvalKey: awaitingIds.join('|'),
  };
}

/** Where keyboard focus sits within a group, if anywhere. */
type GroupFocus = 'header' | 'rows' | null;

/**
 * Open while any call is active, closed once every call has settled. A manual
 * toggle holds until the group's signature changes (a call arrives or changes
 * status), at which point the automatic state returns.
 *
 * Focus in the rows holds them in view: an automatic change made then opens
 * the group rather than removing the focused row, and the automatic state is
 * applied once focus leaves the group. Leaving for the header does not count,
 * so clicking the header still toggles from what the user sees.
 */
function useAutoCollapse(
  isActive: boolean,
  signature: string,
  focus: GroupFocus
): [boolean, (expanded: boolean) => void] {
  const [state, setState] = React.useState(() => ({
    signature,
    expanded: isActive,
    deferred: false,
  }));

  let next = state;
  if (state.signature !== signature) {
    const expanded = isActive || focus === 'rows';
    next = { signature, expanded, deferred: expanded !== isActive };
  } else if (state.deferred && focus === null) {
    next = { signature, expanded: isActive, deferred: false };
  }
  if (next !== state) setState(next);

  const setExpanded = React.useCallback(
    (expanded: boolean) =>
      setState((current) => ({ ...current, expanded, deferred: false })),
    []
  );
  return [next.expanded, setExpanded];
}

function progressAnnouncement(
  summary: ToolGroupSummary,
  labels: ResolvedLabels
): string {
  if (summary.awaitingApproval > 0) {
    return labels.announceApproval(summary.awaitingApproval);
  }
  if (summary.isActive) return labels.running(summary.total);
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
  uncertain: 'warning',
  cancelled: 'secondary',
  denied: 'secondary',
  expired: 'secondary',
};

function formatParameters(toolCall: MCPToolCall): string {
  return (
    safeStringify(
      Object.fromEntries(toolCall.parameters.map((p) => [p.name, p.value])),
      2
    ) ?? ''
  );
}

/** Text for a value, or null when JSON cannot represent it (BigInt, cycles). */
function formatData(data: unknown): string | null {
  return typeof data === 'string' ? data : safeStringify(data, 2);
}

/** True when `text` already carries the summary, which hosts may shorten with "…". */
function containsSummary(text: string | null, summary: string): boolean {
  if (!text) return false;
  const core = summary.replace(/…$/, '').trim();
  return core !== '' && text.includes(core);
}

function formatResult(toolCall: MCPToolCall): string | null {
  const { result } = toolCall;
  if (!result) return null;
  if (isStructuredTwin(result)) return null;
  if (result.data == null || result.data === '') return result.summary || null;
  return formatData(result.data) ?? (result.summary || null);
}

/** The failure text: `error`, else an error result's detail, else its summary. */
function formatError(toolCall: MCPToolCall): string | null {
  if (toolCall.error) return toolCall.error;
  const { result } = toolCall;
  if (result?.type !== 'error') return null;
  if (result.data != null && result.data !== '') {
    return formatData(result.data) ?? (result.summary || null);
  }
  return result.summary || null;
}

/** A row's own collapsed block of output text, such as a result or error. */
function OutputDisclosure({
  label,
  text,
  labels,
  dir = 'auto',
}: {
  label: string;
  text: string;
  labels: Pick<ResolvedLabels, 'copy' | 'copied'>;
  dir?: 'auto' | 'ltr';
}) {
  return (
    <Collapsible>
      <div className="flex items-center gap-2">
        <CollapsibleTrigger className="flex items-center gap-1 text-xs font-medium text-neutral-600 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200">
          <ChevronDown
            aria-hidden="true"
            className="h-3 w-3 transition-transform motion-reduce:transition-none [[data-state=open]>&]:rotate-180"
          />
          {label}
        </CollapsibleTrigger>
        <CopyTextButton text={text} labels={labels} context={label} />
      </div>
      <CollapsibleContent className="mt-1">
        <pre
          dir={dir}
          className="max-h-60 overflow-auto rounded bg-neutral-100 p-2 text-xs whitespace-pre-wrap dark:bg-neutral-900"
        >
          {text}
        </pre>
      </CollapsibleContent>
    </Collapsible>
  );
}

/** Copies raw output; the confirmation is announced and then reverts. */
function CopyTextButton({
  text,
  labels,
  context,
}: {
  text: string;
  labels: Pick<ResolvedLabels, 'copy' | 'copied'>;
  context: string;
}) {
  const [copied, setCopied] = React.useState(false);
  React.useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(timer);
  }, [copied]);
  if (typeof navigator === 'undefined' || !navigator.clipboard) return null;
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(text).then(
          () => setCopied(true),
          () => {}
        );
      }}
      aria-label={`${labels.copy}: ${context}`}
      title={labels.copy}
      className="focus-visible:ring-primary-500 inline-flex items-center gap-1 rounded px-1 text-xs text-neutral-500 hover:text-neutral-800 focus-visible:ring-2 focus-visible:outline-none dark:hover:text-neutral-200"
    >
      {copied ? (
        <Check aria-hidden="true" className="h-3 w-3" />
      ) : (
        <Copy aria-hidden="true" className="h-3 w-3" />
      )}
      <span role="status" className={copied ? undefined : 'sr-only'}>
        {copied ? labels.copied : ''}
      </span>
    </button>
  );
}

interface ToolCallRowProps {
  toolCall: MCPToolCall;
  labels: ResolvedLabels;
  onApprove?: MCPToolCallGroupProps['onApprove'];
  onDeny?: MCPToolCallGroupProps['onDeny'];
  onTrustServer?: MCPToolCallGroupProps['onTrustServer'];
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
  onTrustServer,
  onLinkClick,
}: ToolCallRowProps) {
  // `collapse` animates height, which `MotionConfig reducedMotion="user"`
  // leaves running, so the row honours the preference itself.
  const prefersReducedMotion = usePrefersReducedMotion();
  const [acting, setActing] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const focusInActionsRef = React.useRef(false);
  const isAwaitingApproval = toolCall.status === 'awaiting-approval';
  // An `error` result is failure text, the same as `toolCall.error`.
  const result =
    toolCall.result?.type === 'error' ? null : formatResult(toolCall);
  const errorText = formatError(toolCall);
  // The row clamps the summary to one line, so details carry it in full.
  const summary = toolCall.result?.summary;
  const fullSummary =
    summary &&
    !containsSummary(result, summary) &&
    !containsSummary(errorText, summary)
      ? summary
      : null;
  const hasLinks = hasToolResultLinks(toolCall.result);
  const hasRich = hasRichResult(toolCall.result);
  const hasLabels = toolCall.parameters.some((param) => param.label);
  const hasDetails =
    Boolean(toolCall.displayName) ||
    hasToolCallMetadata(toolCall) ||
    toolCall.parameters.length > 0 ||
    Boolean(result) ||
    Boolean(fullSummary) ||
    hasLinks ||
    hasRich;

  // Approval details must be in view before Allow/Deny, including when a row
  // already on screen starts awaiting approval or its details arrive later.
  // Details opened that way close again once the call settles; a row the user
  // opened themselves stays as they left it.
  const mustShowDetails = isAwaitingApproval && hasDetails;
  const isSettled = !['awaiting-approval', 'pending', 'running'].includes(
    toolCall.status
  );
  const [detailsOpen, setDetailsOpen] = React.useState(mustShowDetails);
  const [autoOpened, setAutoOpened] = React.useState(mustShowDetails);
  const [shownForApproval, setShownForApproval] =
    React.useState(mustShowDetails);
  if (mustShowDetails !== shownForApproval) {
    setShownForApproval(mustShowDetails);
    if (mustShowDetails) {
      setDetailsOpen(true);
      setAutoOpened(true);
    }
  }
  if (autoOpened && isSettled) {
    setAutoOpened(false);
    setDetailsOpen(false);
  }
  const toggleDetails = (open: boolean) => {
    setAutoOpened(false);
    setDetailsOpen(open);
  };

  const act = async (action: () => void | Promise<void>) => {
    setActing(true);
    try {
      await action();
    } catch {
      // The host reports failures; the row only re-enables its controls.
    } finally {
      setActing(false);
    }
  };

  // Browsers fire no blur when a focused element is removed, so when the
  // approval buttons go with focus in them, focus would drop to the body.
  // Keep it on the row instead.
  React.useLayoutEffect(() => {
    if (isAwaitingApproval || !focusInActionsRef.current) return;
    focusInActionsRef.current = false;
    if (!document.activeElement || document.activeElement === document.body) {
      triggerRef.current?.focus();
    }
  }, [isAwaitingApproval]);

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
        <Collapsible open={detailsOpen} onOpenChange={toggleDetails}>
          <CollapsibleTrigger
            ref={triggerRef}
            className="focus-visible:ring-primary-500 flex w-fit max-w-full min-w-0 items-center gap-2 rounded px-1.5 py-1 text-start hover:bg-neutral-100 focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset dark:hover:bg-neutral-800"
          >
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
            {toolCall.displayName ? (
              // Host text may be in another script than the page; isolate it so
              // neutral characters such as a trailing "/" keep their place.
              <bdi className="min-w-0 truncate">{toolCall.displayName}</bdi>
            ) : (
              <code className="min-w-0 truncate font-mono text-xs">
                {toolCall.toolName}
              </code>
            )}
            {toolCall.status === 'running' && (
              <span aria-hidden="true" className="shrink-0">
                <Spinner size="xs" />
              </span>
            )}
            <Badge
              variant={STATUS_BADGE_VARIANT[toolCall.status]}
              size="sm"
              className="shrink-0"
            >
              {labels.status[toolCall.status]}
            </Badge>
            <ChevronDown
              aria-hidden="true"
              className="h-3.5 w-3.5 shrink-0 text-neutral-400 transition-transform motion-reduce:transition-none [[data-state=open]>&]:rotate-180"
            />
          </CollapsibleTrigger>

          <CollapsibleContent className="ms-6 mt-1 space-y-2 pb-1">
            {toolCall.displayName && (
              <>
                {/* The row truncates the name; here it wraps so it can be read in full. */}
                <p
                  data-slot="ai-tool-call-display-name"
                  className="break-words"
                >
                  <bdi>{toolCall.displayName}</bdi>
                </p>
                <p
                  data-slot="ai-tool-call-id"
                  className="text-xs break-words text-neutral-600 dark:text-neutral-400"
                >
                  <span className="font-medium">{labels.toolId}</span>{' '}
                  <code className="font-mono">{toolCall.toolName}</code>
                </p>
              </>
            )}
            <ToolCallMetadata
              toolCall={toolCall}
              hintLabels={labels.hints}
              hintsLead={labels.hintsLead}
            />
            {toolCall.result && hasLinks && (
              <ToolResultLinks
                result={toolCall.result}
                onLinkClick={onLinkClick}
              />
            )}
            {fullSummary && (
              <p
                data-slot="ai-tool-call-summary-full"
                className="text-sm break-words whitespace-pre-wrap"
              >
                <bdi dir="auto">{fullSummary}</bdi>
              </p>
            )}
            {result && result.length <= INLINE_RESULT_CHARS && (
              <p
                data-slot="ai-tool-call-result-text"
                className="text-sm break-words whitespace-pre-wrap"
              >
                <bdi dir="auto">{result}</bdi>
              </p>
            )}
            {hasLabels ? (
              <>
                <div
                  data-slot="ai-tool-call-arguments"
                  className="rounded bg-neutral-50 p-2 dark:bg-neutral-800/60"
                >
                  <h4 className="mb-1 text-xs font-medium text-neutral-600 dark:text-neutral-400">
                    {labels.arguments}
                  </h4>
                  <dl className="grid grid-cols-[minmax(0,auto)_minmax(0,1fr)] gap-x-3 gap-y-0.5 text-xs">
                    {toolCall.parameters.map((param) => (
                      <React.Fragment key={param.name}>
                        <dt
                          title={param.description}
                          className="font-semibold break-words text-neutral-700 dark:text-neutral-300"
                        >
                          {param.label ?? param.name}
                        </dt>
                        <dd className="break-words">
                          <bdi dir="auto">{formatData(param.value)}</bdi>
                        </dd>
                      </React.Fragment>
                    ))}
                  </dl>
                </div>
                <OutputDisclosure
                  label={labels.showRawArguments}
                  text={formatParameters(toolCall)}
                  labels={labels}
                  dir="ltr"
                />
              </>
            ) : (
              toolCall.parameters.length > 0 && (
                // JSON keeps its left-to-right order in RTL documents.
                <pre
                  dir="ltr"
                  className="max-h-40 overflow-auto rounded bg-neutral-100 p-2 text-xs break-words whitespace-pre-wrap dark:bg-neutral-900"
                >
                  {formatParameters(toolCall)}
                </pre>
              )
            )}
            {toolCall.result && hasRich && (
              <ToolCallResultContent
                result={toolCall.result}
                labels={labels.result}
              />
            )}
            {result && result.length > INLINE_RESULT_CHARS && (
              <OutputDisclosure
                label={labels.showResult}
                text={result}
                labels={labels}
              />
            )}
            {errorText && (
              <OutputDisclosure
                label={labels.showError}
                text={errorText}
                labels={labels}
              />
            )}
          </CollapsibleContent>
        </Collapsible>

        {toolCall.status === 'error' && errorText && (
          <p className="ms-6 line-clamp-2 text-xs text-red-600 dark:text-red-400">
            {errorText}
          </p>
        )}

        {toolCall.status === 'uncertain' && (
          <p
            data-slot="ai-tool-call-uncertain"
            className="ms-6 line-clamp-2 text-xs text-amber-700 dark:text-amber-400"
          >
            {labels.uncertainNotice}
          </p>
        )}

        {(toolCall.status === 'denied' || toolCall.status === 'expired') && (
          <p
            data-slot="ai-tool-call-not-run"
            className="ms-6 text-xs text-neutral-500 dark:text-neutral-400"
          >
            {toolCall.status === 'denied'
              ? labels.deniedNotice
              : labels.expiredNotice}
          </p>
        )}

        {toolCall.status === 'success' && toolCall.result?.summary && (
          <p
            data-slot="ai-tool-call-summary"
            className="ms-6 line-clamp-1 text-xs text-neutral-600 dark:text-neutral-400"
          >
            <bdi dir="auto">{toolCall.result.summary}</bdi>
          </p>
        )}

        {isAwaitingApproval && (onApprove || onDeny) && (
          <div
            className="ms-6 mt-2 flex flex-wrap gap-2 border-t border-neutral-200 pt-2 pb-1 dark:border-neutral-700"
            onFocus={() => {
              focusInActionsRef.current = true;
            }}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) {
                focusInActionsRef.current = false;
              }
            }}
          >
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
            {onTrustServer && toolCall.serverName && (
              // Opens the host's settings; it never approves anything itself.
              <button
                type="button"
                onClick={() => onTrustServer(toolCall)}
                className="focus-visible:ring-primary-500 basis-full rounded text-start text-xs text-neutral-600 underline hover:text-neutral-800 focus-visible:ring-2 focus-visible:outline-none dark:text-neutral-400 dark:hover:text-neutral-200"
              >
                {labels.trustServer(toolCall.serverName)}
              </button>
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
  /**
   * Open the host's settings for trusting every tool from the call's server.
   * Shown under the approval buttons when the call has a `serverName`.
   */
  onTrustServer?: (toolCall: MCPToolCall) => void;
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
  onTrustServer,
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
  const [focus, setFocus] = React.useState<GroupFocus>(null);
  const [expanded, setExpanded] = useAutoCollapse(
    summary.isActive,
    summary.signature,
    focus
  );

  // A lone call needs no header. The list keeps its place in the tree either
  // way, so the first row is not remounted when a second call arrives.
  const hasHeader = toolCalls.length > 1;
  const visibleCalls =
    !hasHeader || expanded ? toolCalls : toolCalls.filter(needsAttention);

  return (
    <div
      data-slot="ai-tool-call-group"
      className={className}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocus(null);
      }}
    >
      {hasHeader && (
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={listId}
          onClick={() => setExpanded(!expanded)}
          onFocus={() => setFocus('header')}
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
          {summary.uncertain > 0 && (
            <Badge variant="warning" size="sm" className="shrink-0">
              {labels.notConfirmed(summary.uncertain)}
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
        onFocus={() => setFocus('rows')}
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
              onTrustServer={onTrustServer}
              onLinkClick={onLinkClick}
            />
          ))}
        </AnimatedPresence>
      </div>
      <p role="status" className="sr-only">
        {/* A new approval request replaces the node even when the text is
            unchanged, so it is announced as an addition. */}
        <span key={summary.approvalKey}>
          {progressAnnouncement(summary, labels)}
        </span>
      </p>
      {/* Failures get their own region so progress updates never mask them. */}
      <p role="status" className="sr-only">
        {summary.failed > 0 ? labels.announceFailed(summary.failed) : ''}
      </p>
      {/* Unconfirmed outcomes too: another call still running leaves the
          progress text unchanged, so this warning needs its own region. */}
      <p role="status" className="sr-only">
        {summary.uncertain > 0
          ? `${labels.notConfirmed(summary.uncertain)}. ${labels.uncertainNotice}`
          : ''}
      </p>
    </div>
  );
}
