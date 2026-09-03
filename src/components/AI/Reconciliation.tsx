/**
 * AI Reconciliation Panel
 *
 * A generic "human-in-the-loop" review surface for AI-proposed changes.
 * Renders a list of field-level proposals (current → proposed), lets the
 * user accept/reject/edit each one, and emits the final accepted set via
 * `onApply`.
 *
 * Use cases:
 *  - Document scanner suggesting profile updates from a scanned ID
 *  - CSV import suggesting column → field mappings
 *  - AI-generated form drafts that the user reviews before saving
 *  - Any "AI proposes, human approves" workflow
 *
 * Two variants:
 *  - `panel` — inline card, drop anywhere
 *  - `modal` — wraps the panel in `<Modal>` from @mieweb/ui
 *
 * @example
 * ```tsx
 * <AIReconciliationPanel
 *   variant="modal"
 *   open={open}
 *   onOpenChange={setOpen}
 *   title="Update your profile from your license?"
 *   source={{ label: "Driver's License", generatedAt: new Date() }}
 *   proposals={[
 *     { id: 'fullName', label: 'Legal name',
 *       current: profile.name, proposed: scan.name, confidence: 0.95 },
 *     { id: 'dob', label: 'Date of birth',
 *       current: profile.dob, proposed: scan.dob, confidence: 0.92 },
 *   ]}
 *   onApply={async (accepted) => { await save(accepted); }}
 *   onSkip={() => setOpen(false)}
 * />
 * ```
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';
import { Button } from '../Button';
import { Checkbox } from '../Checkbox';
import {
  Modal,
  ModalBody,
  ModalClose,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from '../Modal';
import { SparklesIcon } from './icons';

// ============================================================================
// Types
// ============================================================================

export type ReconciliationConfidenceLevel = 'high' | 'medium' | 'low';

/**
 * A single field-level change being proposed by an AI source.
 *
 * The component compares `current` and `proposed` using `isEqual` (or the
 * default normalizer) and silently drops rows that are effectively equal,
 * so callers can pass every candidate field without pre-filtering.
 */
export interface ReconciliationProposal {
  /** Stable id used as the key in the `onApply` payload (e.g. `address`). */
  id: string;
  /** Short, user-facing label for the field (e.g. `Date of birth`). */
  label: string;
  /** Optional subtext describing the field. */
  description?: string;
  /** Current value on file (null / undefined / `''` render as `—`). */
  current: unknown;
  /** Proposed value from the AI source. */
  proposed: unknown;
  /** Optional grouping key. Rows with the same `group` render together. */
  group?: string;
  /**
   * Model confidence in [0, 1]. When provided and not overridden by
   * `confidenceLevel`, values < 0.6 are treated as `low` (row defaults to
   * unchecked), 0.6–0.85 as `medium`, ≥ 0.85 as `high`.
   */
  confidence?: number;
  /** Explicit confidence level override. Wins over numeric `confidence`. */
  confidenceLevel?: ReconciliationConfidenceLevel;
  /**
   * Force the row's initial accepted state. Defaults to `true` for high /
   * medium confidence and `false` for low confidence.
   */
  defaultAccepted?: boolean;
  /** Custom renderer for the current / proposed values. */
  renderValue?: (value: unknown) => React.ReactNode;
  /**
   * Inline editor. When provided, an `Edit` button appears that expands the
   * proposed value into the editor. Call `onChange` with the new value.
   */
  renderEditor?: (
    value: unknown,
    onChange: (next: unknown) => void
  ) => React.ReactNode;
  /** Optional hint shown under the row. */
  hint?: string;
  /** Required rows cannot be unchecked. */
  required?: boolean;
}

/** Identifies where the proposals came from. Shown in the header. */
export interface ReconciliationSource {
  /** Short label, e.g. `Driver's License` or `Ozwell extraction`. */
  label: string;
  /** Optional thumbnail / preview URL shown beside the source label. */
  thumbnailUrl?: string;
  /** When the source produced these values. */
  generatedAt?: Date;
  /** Override the default sparkles icon. */
  icon?: React.ReactNode;
}

export interface ReconciliationAcceptedChange {
  id: string;
  value: unknown;
}

export interface AIReconciliationPanelBaseProps extends VariantProps<
  typeof panelVariants
> {
  /** Headline, e.g. `Update your profile from your license?` */
  title: string;
  /** Optional explainer rendered under the title. */
  description?: React.ReactNode;
  /** Provenance metadata shown in the header. */
  source: ReconciliationSource;
  /** All candidate changes. Equal rows are filtered out automatically. */
  proposals: ReconciliationProposal[];
  /**
   * Called when the user clicks Apply. Receives only the accepted rows
   * (with their possibly-edited value). Async — the button shows a spinner
   * while the promise is pending.
   */
  onApply: (accepted: ReconciliationAcceptedChange[]) => Promise<void> | void;
  /** Called when the user dismisses without applying. */
  onSkip?: () => void;
  /** Override button labels. */
  applyLabel?: string;
  skipLabel?: string;
  acceptAllLabel?: string;
  rejectAllLabel?: string;
  /** Hide the bulk accept / reject toggle. */
  hideBulkActions?: boolean;
  /**
   * Equality test used to drop `no real change` rows. Default normalizes
   * strings (trim, collapse whitespace, case-insensitive), compares Dates by
   * epoch, and falls back to JSON for plain objects / arrays.
   */
  isEqual?: (current: unknown, proposed: unknown) => boolean;
  /** Fires once when every proposal is filtered out as equal. */
  onNothingToReconcile?: () => void;
  /** Additional class names on the outer container. */
  className?: string;
}

export interface AIReconciliationPanelVariantProps extends AIReconciliationPanelBaseProps {
  /** Render mode. Defaults to `panel`. */
  variant?: 'panel';
  open?: never;
  onOpenChange?: never;
}

export interface AIReconciliationModalProps extends AIReconciliationPanelBaseProps {
  variant: 'modal';
  /** Controls modal visibility. */
  open: boolean;
  /** Modal open-state change handler. */
  onOpenChange: (open: boolean) => void;
}

export type AIReconciliationPanelProps =
  | AIReconciliationPanelVariantProps
  | AIReconciliationModalProps;

// ============================================================================
// Equality helpers
// ============================================================================

function normalizeString(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

function stableStringify(
  value: unknown,
  seen: WeakSet<object> = new WeakSet()
): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (seen.has(value as object)) return '"[Circular]"';
  seen.add(value as object);
  if (Array.isArray(value))
    return '[' + value.map((v) => stableStringify(v, seen)).join(',') + ']';
  const keys = Object.keys(value as Record<string, unknown>).sort();
  return (
    '{' +
    keys
      .map(
        (k) =>
          JSON.stringify(k) +
          ':' +
          stableStringify((value as Record<string, unknown>)[k], seen)
      )
      .join(',') +
    '}'
  );
}

function safeStableStringify(value: unknown): string {
  try {
    return stableStringify(value);
  } catch {
    // e.g. a getter that throws; fall back to a value-independent sentinel
    // that still differs from `undefined` / `null`.
    return '"[Unserializable]"';
  }
}

/**
 * Default equality used to filter out cosmetic-only diffs. Treats null,
 * undefined, and `''` as equivalent; ignores case and whitespace for strings;
 * compares Dates by epoch; compares plain objects / arrays via a key-sorted
 * stringify so insertion order doesn't matter.
 */
export function defaultReconciliationIsEqual(
  current: unknown,
  proposed: unknown
): boolean {
  const a = current ?? '';
  const b = proposed ?? '';
  if (a === b) return true;
  if (typeof a === 'string' && typeof b === 'string') {
    return normalizeString(a) === normalizeString(b);
  }
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }
  if (typeof a === 'object' && typeof b === 'object' && a && b) {
    try {
      return stableStringify(a) === stableStringify(b);
    } catch {
      return false;
    }
  }
  return false;
}

function resolveConfidenceLevel(
  p: ReconciliationProposal
): ReconciliationConfidenceLevel | undefined {
  if (p.confidenceLevel) return p.confidenceLevel;
  if (typeof p.confidence !== 'number') return undefined;
  if (p.confidence >= 0.85) return 'high';
  if (p.confidence >= 0.6) return 'medium';
  return 'low';
}

function defaultAcceptedFor(p: ReconciliationProposal): boolean {
  if (typeof p.defaultAccepted === 'boolean') return p.defaultAccepted;
  if (p.required) return true;
  return resolveConfidenceLevel(p) !== 'low';
}

// ============================================================================
// Variants
// ============================================================================

const panelVariants = cva(
  [
    'rounded-xl bg-card text-card-foreground',
    'border border-border shadow-sm',
    'flex flex-col overflow-hidden',
  ],
  {
    variants: {
      tone: {
        default: '',
        accent: 'ring-1 ring-primary-200 dark:ring-primary-900',
      },
    },
    defaultVariants: {
      tone: 'default',
    },
  }
);

const confidenceBadgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
  {
    variants: {
      level: {
        high: 'bg-success-100 text-success-900 dark:bg-success-900/30 dark:text-success-300',
        medium:
          'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
        low: 'bg-amber-200 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
      },
    },
    defaultVariants: { level: 'high' },
  }
);

// ============================================================================
// Row
// ============================================================================

interface RowState {
  accepted: boolean;
  editing: boolean;
  value: unknown;
}

function formatValueDefault(value: unknown): React.ReactNode {
  if (value === null || value === undefined || value === '') {
    return (
      <span className="text-muted-foreground italic" aria-label="empty">
        —
      </span>
    );
  }
  if (value instanceof Date) return value.toLocaleDateString();
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

function ConfidenceBadge({ level }: { level: ReconciliationConfidenceLevel }) {
  const labels: Record<ReconciliationConfidenceLevel, string> = {
    high: 'High confidence',
    medium: 'Medium confidence',
    low: 'Low confidence',
  };
  return (
    <span
      className={cn(confidenceBadgeVariants({ level }))}
      data-slot="reconciliation-confidence"
    >
      {labels[level]}
    </span>
  );
}

interface ReconciliationProposalRowProps {
  proposal: ReconciliationProposal;
  state: RowState | undefined;
  onAcceptedChange: (accepted: boolean) => void;
  onValueChange: (value: unknown) => void;
  onToggleEditing: () => void;
}

function ReconciliationProposalRow({
  proposal,
  state,
  onAcceptedChange,
  onValueChange,
  onToggleEditing,
}: ReconciliationProposalRowProps) {
  // `state` can briefly be undefined immediately after `proposals` changes
  // and before the reset effect runs. Fall back to the proposal's defaults
  // rather than throwing on `state.accepted`.
  const safeState: RowState = state ?? {
    accepted: defaultAcceptedFor(proposal),
    editing: false,
    value: proposal.proposed,
  };
  const rowId = React.useId();
  const checkboxId = `${rowId}-accept`;
  const level = resolveConfidenceLevel(proposal);
  const render = proposal.renderValue ?? formatValueDefault;
  const canEdit = Boolean(proposal.renderEditor);

  return (
    <li
      data-slot="reconciliation-row"
      data-accepted={safeState.accepted}
      className={cn(
        'flex gap-3 px-4 py-3 transition-colors',
        safeState.accepted ? 'bg-background' : 'bg-muted/40',
        'border-border border-b last:border-b-0'
      )}
    >
      <div className="pt-0.5">
        <Checkbox
          id={checkboxId}
          checked={safeState.accepted}
          onChange={(e) => onAcceptedChange(e.target.checked)}
          disabled={proposal.required}
          aria-label={`Apply update for ${proposal.label}`}
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <label
            htmlFor={checkboxId}
            className={cn(
              'text-foreground cursor-pointer text-sm font-medium',
              proposal.required && 'cursor-default'
            )}
          >
            {proposal.label}
            {proposal.required && (
              <span
                className="text-muted-foreground ml-1 text-xs font-normal"
                aria-label="required"
              >
                (required)
              </span>
            )}
          </label>
          <div className="flex items-center gap-2">
            {level && <ConfidenceBadge level={level} />}
            {canEdit && (
              <button
                type="button"
                onClick={onToggleEditing}
                className={cn(
                  'text-muted-foreground hover:text-foreground text-xs',
                  'focus-visible:ring-ring rounded focus-visible:ring-2 focus-visible:outline-none',
                  'hover:underline'
                )}
                aria-expanded={safeState.editing}
                aria-controls={`${rowId}-editor`}
              >
                {safeState.editing ? 'Done' : 'Edit'}
              </button>
            )}
          </div>
        </div>

        {proposal.description && (
          <p className="text-muted-foreground mt-0.5 text-xs">
            {proposal.description}
          </p>
        )}

        <dl className="mt-2 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
          <div className="border-border/60 rounded-md border border-dashed px-3 py-2">
            <dt className="text-muted-foreground text-[11px] tracking-wide uppercase">
              On file
            </dt>
            <dd className="text-foreground mt-0.5 break-words">
              {render(proposal.current)}
            </dd>
          </div>
          <div
            className={cn(
              'rounded-md border px-3 py-2',
              safeState.accepted
                ? 'border-primary-300 bg-primary-50/60 dark:border-primary-700 dark:bg-primary-950/30'
                : 'border-border bg-background'
            )}
          >
            <dt className="text-muted-foreground flex items-center gap-1 text-[11px] tracking-wide uppercase">
              <SparklesIcon
                size="sm"
                className="text-primary-700 dark:text-primary-400"
              />
              From AI
              <span className="sr-only">(AI-suggested value)</span>
            </dt>
            <dd
              id={`${rowId}-editor`}
              className="text-foreground mt-0.5 break-words"
            >
              {safeState.editing && proposal.renderEditor
                ? proposal.renderEditor(safeState.value, onValueChange)
                : render(safeState.value)}
            </dd>
          </div>
        </dl>

        {proposal.hint && (
          <p
            className={cn(
              'mt-2 text-xs',
              level === 'low'
                ? 'text-amber-700 dark:text-amber-300'
                : 'text-muted-foreground'
            )}
          >
            {proposal.hint}
          </p>
        )}
      </div>
    </li>
  );
}

// ============================================================================
// Header bits
// ============================================================================

function relativeTimeLabel(date: Date): string {
  const seconds = Math.max(0, Math.round((Date.now() - date.getTime()) / 1000));
  if (seconds < 45) return 'just now';
  if (seconds < 90) return '1 minute ago';
  if (seconds < 3600) return `${Math.round(seconds / 60)} minutes ago`;
  if (seconds < 5400) return '1 hour ago';
  if (seconds < 86400) return `${Math.round(seconds / 3600)} hours ago`;
  return date.toLocaleString();
}

function SourcePill({ source }: { source: ReconciliationSource }) {
  return (
    <div
      data-slot="reconciliation-source"
      className={cn(
        'inline-flex items-center gap-2 rounded-full',
        'border-border bg-muted/60 border px-3 py-1 text-xs font-medium',
        'text-muted-foreground'
      )}
    >
      <span className="text-primary-700 dark:text-primary-400 flex items-center">
        {source.icon ?? <SparklesIcon size="sm" />}
      </span>
      {source.thumbnailUrl && (
        <img
          src={source.thumbnailUrl}
          alt=""
          className="h-5 w-5 rounded object-cover"
          aria-hidden="true"
        />
      )}
      <span className="text-foreground">{source.label}</span>
      {source.generatedAt && (
        <span className="text-muted-foreground">
          · {relativeTimeLabel(source.generatedAt)}
        </span>
      )}
    </div>
  );
}

// ============================================================================
// Main component
// ============================================================================

/**
 * Human-in-the-loop review panel for AI-proposed changes.
 *
 * Render this whenever an AI process has produced a set of values you'd like
 * the user to confirm before persisting. The panel handles diff filtering,
 * per-row accept / reject, bulk actions, inline editing, and confidence-aware
 * defaults.
 *
 * @see {@link ReconciliationProposal} for per-field options.
 */
function AIReconciliationPanel({
  title,
  description,
  source,
  proposals,
  onApply,
  onSkip,
  variant = 'panel',
  open,
  onOpenChange,
  tone,
  applyLabel,
  skipLabel = 'Skip for now',
  acceptAllLabel = 'Accept all',
  rejectAllLabel = 'Reject all',
  hideBulkActions,
  isEqual = defaultReconciliationIsEqual,
  onNothingToReconcile,
  className,
}: AIReconciliationPanelProps) {
  // Drop rows that are effectively equal ------------------------------------
  const effective = React.useMemo(
    () => proposals.filter((p) => !isEqual(p.current, p.proposed)),
    [proposals, isEqual]
  );

  // A signature that changes whenever any field we use for initial state
  // changes — id, proposed value, defaultAccepted, required, or confidence.
  // Without this, an updated `proposed` value on an existing id would leave
  // stale state in place and `handleApply` could submit the old value.
  const stateSignature = React.useMemo(
    () =>
      effective
        .map(
          (p) =>
            `${p.id}\u241F${safeStableStringify(p.proposed)}\u241F${
              p.defaultAccepted ?? ''
            }\u241F${p.required ?? ''}\u241F${p.confidence ?? ''}\u241F${
              p.confidenceLevel ?? ''
            }`
        )
        .join('|'),
    [effective]
  );

  const [rowStates, setRowStates] = React.useState<Record<string, RowState>>(
    () =>
      Object.fromEntries(
        effective.map((p) => [
          p.id,
          {
            accepted: defaultAcceptedFor(p),
            editing: false,
            value: p.proposed,
          },
        ])
      )
  );

  // If the proposal set changes, reset internal state.
  React.useEffect(() => {
    setRowStates(
      Object.fromEntries(
        effective.map((p) => [
          p.id,
          {
            accepted: defaultAcceptedFor(p),
            editing: false,
            value: p.proposed,
          },
        ])
      )
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stateSignature]);

  // Empty-state callback ----------------------------------------------------
  const reportedEmpty = React.useRef(false);
  React.useEffect(() => {
    if (effective.length === 0 && !reportedEmpty.current) {
      reportedEmpty.current = true;
      onNothingToReconcile?.();
    }
    if (effective.length > 0) reportedEmpty.current = false;
  }, [effective.length, onNothingToReconcile]);

  const acceptedCount = React.useMemo(
    () => Object.values(rowStates).filter((s) => s.accepted).length,
    [rowStates]
  );
  const [submitting, setSubmitting] = React.useState(false);

  const setAllAccepted = React.useCallback(
    (accepted: boolean) => {
      setRowStates((prev) => {
        const next: Record<string, RowState> = { ...prev };
        for (const p of effective) {
          if (p.required && !accepted) continue;
          const base: RowState = prev[p.id] ?? {
            accepted: defaultAcceptedFor(p),
            editing: false,
            value: p.proposed,
          };
          next[p.id] = { ...base, accepted };
        }
        return next;
      });
    },
    [effective]
  );

  const setRowAccepted = React.useCallback(
    (id: string, accepted: boolean) => {
      const proposal = effective.find((p) => p.id === id);
      setRowStates((prev) => {
        const base: RowState = prev[id] ?? {
          accepted: proposal ? defaultAcceptedFor(proposal) : false,
          editing: false,
          value: proposal?.proposed,
        };
        return { ...prev, [id]: { ...base, accepted } };
      });
    },
    [effective]
  );

  const setRowValue = React.useCallback(
    (id: string, value: unknown) => {
      const proposal = effective.find((p) => p.id === id);
      setRowStates((prev) => {
        const base: RowState = prev[id] ?? {
          accepted: proposal ? defaultAcceptedFor(proposal) : false,
          editing: false,
          value: proposal?.proposed,
        };
        return { ...prev, [id]: { ...base, value } };
      });
    },
    [effective]
  );

  const toggleRowEditing = React.useCallback(
    (id: string) => {
      const proposal = effective.find((p) => p.id === id);
      setRowStates((prev) => {
        const base: RowState = prev[id] ?? {
          accepted: proposal ? defaultAcceptedFor(proposal) : false,
          editing: false,
          value: proposal?.proposed,
        };
        return { ...prev, [id]: { ...base, editing: !base.editing } };
      });
    },
    [effective]
  );

  const handleApply = React.useCallback(async () => {
    const accepted: ReconciliationAcceptedChange[] = effective
      .filter((p) => rowStates[p.id]?.accepted)
      .map((p) => ({
        id: p.id,
        value: rowStates[p.id]?.value ?? p.proposed,
      }));
    if (accepted.length === 0) return;
    try {
      setSubmitting(true);
      await onApply(accepted);
    } finally {
      setSubmitting(false);
    }
  }, [effective, rowStates, onApply]);

  // Keyboard shortcuts:
  //  - `A` toggles accept-all when focus is inside
  //  - `Cmd/Ctrl+Enter` submits (Apply)
  const containerRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        if (acceptedCount === 0 || submitting) return;
        e.preventDefault();
        void handleApply();
        return;
      }
      if (e.key !== 'a' && e.key !== 'A') return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || target?.isContentEditable) {
        return;
      }
      e.preventDefault();
      setAllAccepted(acceptedCount !== effective.length);
    };
    el.addEventListener('keydown', handler);
    return () => el.removeEventListener('keydown', handler);
  }, [
    acceptedCount,
    effective.length,
    setAllAccepted,
    handleApply,
    submitting,
  ]);

  const allAccepted =
    effective.length > 0 && acceptedCount === effective.length;
  const someAccepted = acceptedCount > 0 && !allAccepted;

  const resolvedApplyLabel =
    applyLabel ??
    (acceptedCount === 1 ? 'Apply 1 update' : `Apply ${acceptedCount} updates`);

  // Group rows --------------------------------------------------------------
  const grouped = React.useMemo(() => {
    const map = new Map<string | undefined, ReconciliationProposal[]>();
    for (const p of effective) {
      const key = p.group;
      const arr = map.get(key) ?? [];
      arr.push(p);
      map.set(key, arr);
    }
    return Array.from(map.entries());
  }, [effective]);

  // -------------------------------------------------------------------------
  // Sub-renderers
  // -------------------------------------------------------------------------
  const bulkBar =
    !hideBulkActions && effective.length > 1 ? (
      <div
        className={cn(
          'border-border flex items-center justify-between gap-2 border-b',
          'bg-muted/40 px-4 py-2'
        )}
        data-slot="reconciliation-bulk"
      >
        <Checkbox
          checked={allAccepted}
          indeterminate={someAccepted}
          onChange={(e) => setAllAccepted(e.target.checked)}
          aria-label={allAccepted ? rejectAllLabel : acceptAllLabel}
          label={allAccepted ? rejectAllLabel : acceptAllLabel}
        />
        <p
          className="text-muted-foreground text-xs"
          role="status"
          aria-live="polite"
        >
          {acceptedCount} of {effective.length} selected
        </p>
      </div>
    ) : null;

  const rowList = (
    <ul
      data-slot="reconciliation-rows"
      className="divide-border max-h-[60vh] overflow-y-auto"
    >
      {grouped.map(([groupKey, items]) => (
        <React.Fragment key={groupKey ?? '__nogroup'}>
          {groupKey && (
            <li
              aria-hidden="true"
              className={cn(
                'bg-muted/30 text-muted-foreground border-border',
                'border-b px-4 py-1.5 text-[11px] font-medium tracking-wide uppercase'
              )}
            >
              {groupKey}
            </li>
          )}
          {items.map((p) => (
            <ReconciliationProposalRow
              key={p.id}
              proposal={p}
              state={rowStates[p.id]}
              onAcceptedChange={(a) => setRowAccepted(p.id, a)}
              onValueChange={(v) => setRowValue(p.id, v)}
              onToggleEditing={() => toggleRowEditing(p.id)}
            />
          ))}
        </React.Fragment>
      ))}
    </ul>
  );

  const footerButtons = (
    <>
      {onSkip && (
        <Button
          type="button"
          variant="ghost"
          onClick={onSkip}
          disabled={submitting}
        >
          {skipLabel}
        </Button>
      )}
      <Button
        type="button"
        onClick={handleApply}
        disabled={acceptedCount === 0 || submitting}
        isLoading={submitting}
        loadingText="Applying…"
      >
        {resolvedApplyLabel}
      </Button>
    </>
  );

  // -------------------------------------------------------------------------
  // Modal variant
  // -------------------------------------------------------------------------
  if (variant === 'modal') {
    if (!onOpenChange) {
      throw new Error(
        'AIReconciliationPanel: `onOpenChange` is required when `variant="modal"`.'
      );
    }
    return (
      <Modal open={Boolean(open)} onOpenChange={onOpenChange} size="2xl">
        <ModalHeader>
          <ModalTitle>{title}</ModalTitle>
          <ModalClose />
        </ModalHeader>
        <ModalBody className="px-0 py-0">
          <div
            ref={containerRef}
            data-slot="reconciliation-panel"
            data-variant="modal"
            className={cn('flex flex-col', className)}
            role="group"
            aria-label={title}
          >
            <div className="border-border border-b px-6 py-3">
              {description && (
                <p className="text-muted-foreground text-sm">{description}</p>
              )}
              <div className={cn(description && 'mt-3')}>
                <SourcePill source={source} />
              </div>
            </div>
            {effective.length === 0 ? (
              <p className="text-muted-foreground px-6 py-6 text-sm">
                No updates to review — your profile already matches the scan.
              </p>
            ) : (
              <>
                {bulkBar}
                {rowList}
              </>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          {effective.length === 0 ? (
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          ) : (
            footerButtons
          )}
        </ModalFooter>
      </Modal>
    );
  }

  // -------------------------------------------------------------------------
  // Panel variant
  // -------------------------------------------------------------------------
  if (effective.length === 0) return null;

  return (
    <div
      ref={containerRef}
      data-slot="reconciliation-panel"
      data-variant="panel"
      className={cn(panelVariants({ tone }), className)}
      role="group"
      aria-label={title}
    >
      <div className="border-border border-b px-4 pt-4 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-foreground text-base font-semibold">{title}</h2>
            {description && (
              <p className="text-muted-foreground mt-1 text-sm">
                {description}
              </p>
            )}
          </div>
          <SourcePill source={source} />
        </div>
      </div>
      {bulkBar}
      {rowList}
      <div
        className={cn(
          'border-border flex flex-col-reverse gap-2 border-t px-4 py-3',
          'sm:flex-row sm:items-center sm:justify-end sm:gap-3'
        )}
        data-slot="reconciliation-footer"
      >
        {footerButtons}
      </div>
    </div>
  );
}

AIReconciliationPanel.displayName = 'AIReconciliationPanel';

export { AIReconciliationPanel, panelVariants as reconciliationPanelVariants };
