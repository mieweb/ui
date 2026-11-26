'use client';

/**
 * MedHistoryReconciliation — review incoming medication history (Source A)
 * against the chart (Source B) before anything is written. A fixed-height
 * list of incoming records sits beside the selected record's comparison;
 * the reviewer chooses Add as New, Add as Refill or Skip and confirms a
 * change set the host applies.
 */

import * as React from 'react';
import { useMessages } from '../../utils/messages';
import { cn } from '../../utils/cn';
import { useLiveAnnouncement } from '../../hooks/useLiveAnnouncement';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { Alert, AlertDescription } from '../Alert';
import { Button } from '../Button';
import { SparklesIcon } from '../Icons';
import {
  Modal,
  ModalBody,
  ModalClose,
  ModalHeader,
  ModalTitle,
} from '../Modal';
import {
  MedicationEditor,
  type CodeLookupConfig,
  type MedicationEditorOptions,
} from '../MedicationList/MedicationEditor';
import type { PharmacyDataSource } from '../Pharmacy/dataSource';
import {
  canBeFillOf,
  findDuplicateCandidates,
  findRepeatFillGroups,
  scoreMedicationPair,
  type MatchScoringOptions,
} from './scoring';
import {
  addAllNew,
  applyPreset,
  buildChangeSet,
  currentPreset,
  pruneReview,
  skipRemaining,
  toMedication,
  toRepeatGroups,
  withGroupDefaults,
  type DecisionMap,
  type EditMap,
  type GroupPreset,
  type MedHistoryDecision,
  type RepeatGroup,
} from './decisions';
import {
  formatPercent,
  pharmacyLookupId,
  type PharmacyNames,
} from './RecordReview';
import {
  GroupDetail,
  RecordDetail,
  candidateLabels,
  choiceForShortcut,
  decisionChoices,
  type CandidateOption,
} from './ReviewDetail';
import { ReviewList, type ReviewListSection } from './ReviewList';
import { MergeSummaryModal } from './MergeSummaryModal';
import type {
  MedHistoryAiSuggestion,
  MedHistoryChangeSet,
  MedHistoryRecord,
} from './types';

export type { MedHistoryAiSuggestion } from './types';

// =============================================================================
// Types
// =============================================================================

/**
 * Host-injected AI matcher. Called when the sources change; aborted when
 * they change again. Rejecting shows a notice — review continues without it.
 */
export type MedHistoryAiProvider = (
  request: {
    incoming: readonly MedHistoryRecord[];
    chart: readonly MedHistoryRecord[];
  },
  signal: AbortSignal
) => Promise<MedHistoryAiSuggestion[]>;

export interface MedHistoryReconciliationProps {
  /** Incoming medication history (Source A). Memoize between renders. */
  incoming: MedHistoryRecord[];
  /** The patient's current chart medications (Source B). Memoize between renders. */
  chart: MedHistoryRecord[];
  /**
   * Called with the confirmed change set. Return a promise to keep the
   * summary open while saving; a rejection is shown and selections are kept.
   */
  onConfirm: (changeSet: MedHistoryChangeSet) => void | Promise<void>;
  /** Chart revision the review is based on, echoed in the change set. */
  chartRevision?: string;
  /** 0–1 score at which pairs are potential duplicates (default 0.8). */
  duplicateThreshold?: number;
  /** Scoring weights, brand/generic credit, aliases, custom scorers. Memoize. */
  scoring?: Omit<MatchScoringOptions, 'duplicateThreshold'>;
  /** Optional AI duplicate suggestions; off when omitted. */
  aiSuggestions?: MedHistoryAiProvider;
  /** Looks up names for pharmacies given only by id. */
  pharmacySource?: Pick<PharmacyDataSource, 'getPharmacy'>;
  /** CodeLookup wiring for the edit dialog (see `MedicationEditor`). */
  codeLookup?: CodeLookupConfig | false;
  /** Edit dialog options (see `MedicationEditor`). */
  editorOptions?: MedicationEditorOptions;
  /** Called when unsaved decisions appear or are cleared. */
  onDirtyChange?: (dirty: boolean) => void;
  /** Height of the list + detail panel on medium screens and up (default 32rem). */
  panelHeight?: string;
  /** Heading (pass null to hide). */
  title?: string | null;
  className?: string;
  'data-testid'?: string;
}

type AiState =
  | { status: 'off' | 'loading' | 'error'; suggestions: [] }
  | { status: 'ready'; suggestions: MedHistoryAiSuggestion[] };

/** One list item: a single incoming record or a repeat-fill group. */
interface ReviewUnit {
  key: string;
  ids: string[];
  group?: RepeatGroup;
  duplicate: boolean;
}

const NO_EDITS: EditMap = {};

/** Media query for the list-only layout with the detail in a sheet. */
const NARROW_QUERY = '(max-width: 767px)';

function isTypingTarget(target: unknown): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
  );
}

// =============================================================================
// Hooks
// =============================================================================

function usePharmacyNames(
  records: readonly MedHistoryRecord[],
  source: MedHistoryReconciliationProps['pharmacySource']
): PharmacyNames {
  const [names, setNames] = React.useState<PharmacyNames>(new Map());
  const key = React.useMemo(
    () =>
      [
        ...new Set(
          records
            .map(pharmacyLookupId)
            .filter((id): id is string => id !== undefined)
        ),
      ].join('|'),
    [records]
  );

  React.useEffect(() => {
    if (!source || !key) return;
    const controller = new AbortController();
    Promise.all(
      key.split('|').map((id) =>
        source
          .getPharmacy(id, controller.signal)
          .then((p): [string, string] | null => (p ? [id, p.storeName] : null))
          .catch(() => null)
      )
    ).then((entries) => {
      if (!controller.signal.aborted)
        setNames(new Map(entries.filter((e) => e !== null)));
    });
    return () => controller.abort();
  }, [source, key]);

  return names;
}

function useAiSuggestions(
  provider: MedHistoryAiProvider | undefined,
  incoming: readonly MedHistoryRecord[],
  chart: readonly MedHistoryRecord[]
): AiState {
  const [state, setState] = React.useState<AiState>({
    status: 'off',
    suggestions: [],
  });

  React.useEffect(() => {
    if (!provider) {
      setState({ status: 'off', suggestions: [] });
      return;
    }
    const controller = new AbortController();
    setState({ status: 'loading', suggestions: [] });
    provider({ incoming, chart }, controller.signal).then(
      (suggestions) => {
        if (!controller.signal.aborted)
          setState({ status: 'ready', suggestions });
      },
      () => {
        if (!controller.signal.aborted)
          setState({ status: 'error', suggestions: [] });
      }
    );
    return () => controller.abort();
  }, [provider, incoming, chart]);

  return state;
}

/** Restores focus after a Modal closes (Modal does not). */
function useReturnFocus(): [() => void, () => void] {
  const target = React.useRef<HTMLElement | null>(null);
  const remember = React.useCallback(() => {
    target.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
  }, []);
  const restore = React.useCallback(() => {
    const element = target.current;
    target.current = null;
    if (element) setTimeout(() => element.focus(), 0);
  }, []);
  return [remember, restore];
}

// =============================================================================
// MedHistoryReconciliation
// =============================================================================

/**
 * @example
 * ```tsx
 * <MedHistoryReconciliation
 *   incoming={incomingRecords}
 *   chart={chartRecords}
 *   duplicateThreshold={0.8}
 *   onConfirm={async (changeSet) => { await save(changeSet); }}
 * />
 * ```
 */
export function MedHistoryReconciliation({
  incoming,
  chart,
  onConfirm,
  chartRevision,
  duplicateThreshold,
  scoring,
  aiSuggestions,
  pharmacySource,
  codeLookup,
  editorOptions,
  onDirtyChange,
  panelHeight = '32rem',
  title,
  className,
  'data-testid': dataTestId,
}: MedHistoryReconciliationProps): React.JSX.Element {
  const m = useMessages();
  const titleId = React.useId();
  const [announcement, announce] = useLiveAnnouncement();
  const [rememberFocus, restoreFocus] = useReturnFocus();
  const narrow = useMediaQuery(NARROW_QUERY);

  // ---- matching -------------------------------------------------------------
  const scoringOptions = React.useMemo<MatchScoringOptions>(
    () => ({ ...scoring, duplicateThreshold }),
    [scoring, duplicateThreshold]
  );
  const candidates = React.useMemo(
    () => findDuplicateCandidates(incoming, chart, scoringOptions),
    [incoming, chart, scoringOptions]
  );
  const repeatGroups = React.useMemo(
    () =>
      toRepeatGroups(findRepeatFillGroups(incoming, scoringOptions), incoming),
    [incoming, scoringOptions]
  );
  const ai = useAiSuggestions(aiSuggestions, incoming, chart);
  const [dismissedAi, setDismissedAi] = React.useState<ReadonlySet<string>>(
    new Set()
  );
  const pharmacyNames = usePharmacyNames(
    React.useMemo(() => [...incoming, ...chart], [incoming, chart]),
    pharmacySource
  );

  const optionsByIncoming = React.useMemo(() => {
    const chartById = new Map(chart.map((r) => [r.id, r]));
    const incomingById = new Map(incoming.map((r) => [r.id, r]));
    const result = new Map<string, CandidateOption[]>();
    const add = (incomingId: string, option: CandidateOption) =>
      result.set(incomingId, [...(result.get(incomingId) ?? []), option]);
    const aiByPair = new Map(
      ai.suggestions.map((s) => [`${s.incomingId}|${s.chartId}`, s])
    );
    for (const c of candidates) {
      const chartRecord = chartById.get(c.chartId);
      if (chartRecord)
        add(c.incomingId, {
          chart: chartRecord,
          match: c.match,
          ai: aiByPair.get(`${c.incomingId}|${c.chartId}`),
        });
    }
    for (const suggestion of ai.suggestions) {
      const key = `${suggestion.incomingId}|${suggestion.chartId}`;
      const incomingRecord = incomingById.get(suggestion.incomingId);
      const chartRecord = chartById.get(suggestion.chartId);
      const known = result
        .get(suggestion.incomingId)
        ?.some((o) => o.chart.id === suggestion.chartId);
      if (!incomingRecord || !chartRecord || known || dismissedAi.has(key))
        continue;
      add(suggestion.incomingId, {
        chart: chartRecord,
        match: scoreMedicationPair(incomingRecord, chartRecord, scoringOptions),
        ai: suggestion,
      });
    }
    return result;
  }, [
    incoming,
    chart,
    candidates,
    ai.suggestions,
    dismissedAi,
    scoringOptions,
  ]);
  const optionsOf = React.useCallback(
    (id: string) => optionsByIncoming.get(id) ?? [],
    [optionsByIncoming]
  );

  // ---- list items -----------------------------------------------------------
  const units = React.useMemo(() => {
    const groupOf = new Map<string, RepeatGroup>();
    repeatGroups.forEach((g) => g.ids.forEach((id) => groupOf.set(id, g)));
    const seen = new Set<string>();
    const result: ReviewUnit[] = [];
    for (const record of incoming) {
      if (seen.has(record.id)) continue;
      const group = groupOf.get(record.id);
      const ids = group ? [...group.ids] : [record.id];
      ids.forEach((id) => seen.add(id));
      result.push({
        key: group ? group.newestId : record.id,
        ids,
        group,
        duplicate: ids.some((id) => optionsOf(id).length > 0),
      });
    }
    // Possible duplicates first, then new medications (stable within each).
    return [
      ...result.filter((u) => u.duplicate),
      ...result.filter((u) => !u.duplicate),
    ];
  }, [incoming, repeatGroups, optionsOf]);
  const recordById = React.useMemo(
    () => new Map(incoming.map((r) => [r.id, r])),
    [incoming]
  );

  // ---- review state ---------------------------------------------------------
  const [review, setReview] = React.useState<{
    decisions: DecisionMap;
    edits: EditMap;
  }>(() => ({
    decisions: withGroupDefaults({}, repeatGroups),
    edits: NO_EDITS,
  }));
  const [touched, setTouched] = React.useState(false);
  const [selectedKey, setSelectedKey] = React.useState<string | undefined>(
    () => units[0]?.key
  );
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [summaryOpen, setSummaryOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string>();
  const [saved, setSaved] = React.useState(false);
  const [staleNotice, setStaleNotice] = React.useState(false);

  // Drop decisions that no longer apply, default new repeat groups, and
  // invalidate an open summary whenever the sources actually change.
  const signature = React.useMemo(
    () => JSON.stringify([incoming, chart, chartRevision]),
    [incoming, chart, chartRevision]
  );
  const lastSignature = React.useRef(signature);
  React.useEffect(() => {
    const incomingIds = new Set(incoming.map((r) => r.id));
    const fillOptions = new Map(
      [...optionsByIncoming].map(([id, options]) => [
        id,
        new Set(
          options.filter((o) => canBeFillOf(o.match)).map((o) => o.chart.id)
        ),
      ])
    );
    setReview((current) => {
      const pruned = pruneReview(
        current.decisions,
        current.edits,
        incomingIds,
        fillOptions
      );
      const decisions = withGroupDefaults(pruned.decisions, repeatGroups);
      return decisions === current.decisions && pruned.edits === current.edits
        ? current
        : { decisions, edits: pruned.edits };
    });
    if (lastSignature.current !== signature) {
      lastSignature.current = signature;
      setSaved(false);
      if (summaryOpen) {
        setSummaryOpen(false);
        setStaleNotice(true);
      }
    }
  }, [signature, incoming, optionsByIncoming, repeatGroups, summaryOpen]);

  // Keep a valid selection as the list changes.
  React.useEffect(() => {
    if (!units.some((u) => u.key === selectedKey))
      setSelectedKey(units[0]?.key);
  }, [units, selectedKey]);

  const { decisions, edits } = review;
  const dirty = touched && !saved;
  const reportedDirty = React.useRef(false);
  React.useEffect(() => {
    if (reportedDirty.current === dirty) return;
    reportedDirty.current = dirty;
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  const changeSet = React.useMemo(
    () => buildChangeSet(incoming, chart, decisions, edits, chartRevision),
    [incoming, chart, decisions, edits, chartRevision]
  );
  const reviewedCount = incoming.filter((r) => decisions[r.id]).length;
  const grouped = new Set(repeatGroups.flatMap((g) => g.ids));
  const newUndecidedIds = incoming
    .filter(
      (r) =>
        !decisions[r.id] && !grouped.has(r.id) && optionsOf(r.id).length === 0
    )
    .map((r) => r.id);
  const undecidedCount = incoming.length - reviewedCount;
  const locked = saved || saving;

  // ---- focus & advance ------------------------------------------------------
  const optionElements = React.useRef(new Map<string, HTMLElement>());
  const detailRef = React.useRef<HTMLDivElement>(null);
  const headingRef = React.useRef<HTMLHeadingElement>(null);

  const unitDecided = (unit: ReviewUnit, map: DecisionMap) =>
    unit.ids.every((id) => map[id]);

  /** Next undecided item after `key` (wrapping), or undefined. */
  const nextUndecided = (key: string, map: DecisionMap) => {
    const start = units.findIndex((u) => u.key === key);
    for (let step = 1; step <= units.length; step++) {
      const unit = units[(start + step) % units.length];
      if (!unitDecided(unit, map)) return unit;
    }
    return undefined;
  };

  const commit = (next: DecisionMap) => {
    setTouched(true);
    setStaleNotice(false);
    setReview((current) => ({ ...current, decisions: next }));
  };

  /** After a decision on the selected item, move to the next undecided one. */
  const advance = (from: string, next: DecisionMap) => {
    const target = nextUndecided(from, next);
    const focusInDetail =
      detailRef.current?.contains(document.activeElement) ?? false;
    if (narrow) setSheetOpen(false);
    if (!target) {
      announce(m('All records reviewed.'));
      if (narrow)
        setTimeout(() => optionElements.current.get(from)?.focus(), 0);
      return;
    }
    setSelectedKey(target.key);
    const name = recordById.get(target.key)?.medication.name ?? target.key;
    announce(m('Next: {name}', { name }));
    if (narrow)
      setTimeout(() => optionElements.current.get(target.key)?.focus(), 0);
    else if (focusInDetail) setTimeout(() => headingRef.current?.focus(), 0);
  };

  const decide = (
    unitKey: string,
    incomingId: string,
    decision: MedHistoryDecision | undefined,
    { autoAdvance }: { autoAdvance: boolean }
  ) => {
    const next: Record<string, MedHistoryDecision> = { ...decisions };
    if (decision) next[incomingId] = decision;
    else delete next[incomingId];
    commit(next);
    if (decision && autoAdvance) advance(unitKey, next);
  };

  const preset = (unit: ReviewUnit, value: GroupPreset) => {
    if (!unit.group) return;
    const next = applyPreset(decisions, unit.group, value);
    commit(next);
    advance(unit.key, next);
  };

  const dismissAi = (incomingId: string, chartId: string) => {
    setDismissedAi((current) =>
      new Set(current).add(`${incomingId}|${chartId}`)
    );
    const decision = decisions[incomingId];
    if (decision?.kind === 'fill' && decision.chartId === chartId) {
      const next = { ...decisions };
      delete next[incomingId];
      commit(next);
    }
  };

  const openSummary = () => {
    rememberFocus();
    setSaveError(undefined);
    setStaleNotice(false);
    setSummaryOpen(true);
  };

  const confirm = async () => {
    setSaving(true);
    setSaveError(undefined);
    try {
      await onConfirm(changeSet);
      setSummaryOpen(false);
      setSaved(true);
      restoreFocus();
      announce(m('Medication history import saved.'));
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : String(error));
      announce(m('Saving failed. Your selections are kept.'));
    } finally {
      setSaving(false);
    }
  };

  const selectedUnit = units.find((u) => u.key === selectedKey);

  // N / F / S on the selected single record, from anywhere in the
  // component or its sheet (Modal content is portaled outside the section).
  const sectionRef = React.useRef<HTMLElement>(null);
  const onShortcut = (event: KeyboardEvent) => {
    const target = event.target;
    const inside =
      target instanceof Node &&
      (sectionRef.current?.contains(target) ||
        (sheetOpen && detailRef.current?.contains(target)));
    if (
      !inside ||
      event.defaultPrevented ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      locked ||
      summaryOpen ||
      editingId ||
      !selectedUnit ||
      selectedUnit.group ||
      isTypingTarget(target)
    )
      return;
    const choice = choiceForShortcut(
      decisionChoices(optionsOf(selectedUnit.key), true, m),
      event.key
    );
    if (!choice) return;
    event.preventDefault();
    decide(selectedUnit.key, selectedUnit.key, choice.decision, {
      autoAdvance: true,
    });
  };
  const shortcutRef = React.useRef(onShortcut);
  shortcutRef.current = onShortcut;
  React.useEffect(() => {
    const handler = (event: KeyboardEvent) => shortcutRef.current(event);
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // ---- list model -------------------------------------------------------------
  const decisionLabel = (id: string): string | undefined => {
    const decision = decisions[id];
    if (!decision) return undefined;
    if (decision.kind === 'skip') return m('Skip');
    if (decision.kind === 'add')
      return edits[id] ? m('Add as New · edited') : m('Add as New');
    const options = optionsOf(id);
    const index = options.findIndex((o) => o.chart.id === decision.chartId);
    return options.length > 1
      ? m('Refill {label}', {
          label: candidateLabels(options.length, m)[index] ?? '',
        })
      : m('Refill');
  };

  const listItem = (unit: ReviewUnit) => {
    const lead = recordById.get(unit.key);
    const name = lead?.medication.name ?? unit.key;
    if (unit.group) {
      const p = currentPreset(decisions, unit.group);
      const added = unit.ids.filter(
        (id) => decisions[id] && decisions[id].kind !== 'skip'
      ).length;
      const skipped = unit.ids.filter(
        (id) => decisions[id]?.kind === 'skip'
      ).length;
      return {
        key: unit.key,
        name,
        detail: m('{count} fills', { count: unit.ids.length }),
        status:
          p === 'keep-newest'
            ? m('Keep newest')
            : p === 'skip-all'
              ? m('Skip all')
              : m('{added} added · {skipped} skipped', { added, skipped }),
        decided: unitDecided(unit, decisions),
      };
    }
    const best = optionsOf(unit.key)[0];
    return {
      key: unit.key,
      name,
      detail: best
        ? best.match.dismissedBy
          ? m('→ {name} · AI suggestion', {
              name: best.chart.medication.name,
            })
          : m('→ {name} · {score}', {
              name: best.chart.medication.name,
              score: formatPercent(best.match.score),
            })
        : undefined,
      status: decisionLabel(unit.key),
      decided: unitDecided(unit, decisions),
    };
  };

  const recordCount = (list: ReviewUnit[]) =>
    list.reduce((n, u) => n + u.ids.length, 0);
  const duplicateUnits = units.filter((u) => u.duplicate);
  const newUnits = units.filter((u) => !u.duplicate);
  const sections: ReviewListSection[] = [
    {
      key: 'duplicates',
      label: m('Possible duplicates ({count})', {
        count: recordCount(duplicateUnits),
      }),
      items: duplicateUnits.map(listItem),
    },
    {
      key: 'new',
      label: m('New medications ({count})', { count: recordCount(newUnits) }),
      items: newUnits.map(listItem),
    },
  ].filter((section) => section.items.length > 0);

  // ---- detail ---------------------------------------------------------------
  const renderDetail = (unit: ReviewUnit, inSheet: boolean) => {
    if (unit.group) {
      const group = unit.group;
      return (
        <GroupDetail
          group={group}
          records={unit.ids
            .map((id) => recordById.get(id))
            .filter((r): r is MedHistoryRecord => r !== undefined)}
          options={optionsOf(group.newestId)}
          decisions={decisions}
          editedIds={new Set(unit.ids.filter((id) => edits[id]))}
          disabled={locked}
          pharmacyNames={pharmacyNames}
          headingRef={inSheet ? undefined : headingRef}
          inSheet={inSheet}
          onPreset={(value) => preset(unit, value)}
          onDecide={(id, decision) =>
            decide(unit.key, id, decision, { autoAdvance: false })
          }
          onEdit={(id) => {
            rememberFocus();
            setEditingId(id);
          }}
          onDismissAi={(chartId) => dismissAi(group.newestId, chartId)}
        />
      );
    }
    const record = recordById.get(unit.key);
    if (!record) return null;
    return (
      <RecordDetail
        record={record}
        options={optionsOf(record.id)}
        decision={decisions[record.id]}
        edited={edits[record.id] !== undefined}
        disabled={locked}
        pharmacyNames={pharmacyNames}
        headingRef={inSheet ? undefined : headingRef}
        inSheet={inSheet}
        onDecide={(decision) =>
          decide(unit.key, record.id, decision, { autoAdvance: true })
        }
        onEdit={() => {
          rememberFocus();
          setEditingId(record.id);
        }}
        onDismissAi={(chartId) => dismissAi(record.id, chartId)}
      />
    );
  };

  const editingRecord = editingId ? recordById.get(editingId) : undefined;
  const sheetName = selectedUnit
    ? (recordById.get(selectedUnit.key)?.medication.name ?? '')
    : '';

  return (
    <section
      aria-labelledby={title === null ? undefined : titleId}
      aria-label={
        title === null ? m('Medication history reconciliation') : undefined
      }
      className={cn(
        'border-border bg-card overflow-hidden rounded-lg border',
        className
      )}
      data-testid={dataTestId}
      ref={sectionRef}
    >
      <header className="border-border flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b px-4 py-3">
        <div className="min-w-0">
          {title !== null && (
            <h2 id={titleId} className="font-semibold">
              {title ?? m('Medication history reconciliation')}
            </h2>
          )}
          <p className="text-muted-foreground text-sm" aria-live="polite">
            <bdi>
              {m(
                '{incoming} incoming · {chart} on chart · {reviewed} of {total} reviewed',
                {
                  incoming: incoming.length,
                  chart: chart.length,
                  reviewed: reviewedCount,
                  total: incoming.length,
                }
              )}
            </bdi>
          </p>
          {ai.status !== 'off' && (
            <p
              className="text-muted-foreground flex items-center gap-1.5 text-xs"
              aria-live="polite"
            >
              <SparklesIcon aria-hidden="true" className="h-3.5 w-3.5" />
              {ai.status === 'loading'
                ? m('Checking for AI suggestions…')
                : ai.status === 'error'
                  ? m(
                      'AI suggestions are unavailable. Review continues without them.'
                    )
                  : m('{count} AI suggestions', {
                      count: ai.suggestions.length,
                    })}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={locked || newUndecidedIds.length === 0}
            onClick={() => {
              commit(addAllNew(decisions, newUndecidedIds, repeatGroups));
              announce(
                m('{count} new medications set to Add as New.', {
                  count: newUndecidedIds.length,
                })
              );
            }}
          >
            {m('Add all new ({count})', { count: newUndecidedIds.length })}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={locked || undecidedCount === 0}
            onClick={() => {
              commit(
                skipRemaining(
                  decisions,
                  incoming.map((r) => r.id)
                )
              );
              announce(
                m('{count} remaining records set to Skip.', {
                  count: undecidedCount,
                })
              );
            }}
          >
            {m('Skip remaining ({count})', { count: undecidedCount })}
          </Button>
          <Button
            size="sm"
            disabled={saved || incoming.length === 0}
            onClick={openSummary}
          >
            {m('Review changes')}
          </Button>
        </div>
      </header>

      {(staleNotice || saved) && (
        <div className="border-border border-b p-3">
          {staleNotice && (
            <Alert variant="warning">
              <AlertDescription>
                {m(
                  'The medication lists changed. Review your choices again before importing.'
                )}
              </AlertDescription>
            </Alert>
          )}
          {saved && (
            <Alert variant="success">
              <AlertDescription>
                {m('Medication history import saved.')}
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {incoming.length === 0 ? (
        <p className="text-muted-foreground p-4 text-sm">
          {m('No incoming medications to review.')}
        </p>
      ) : (
        <div
          className="md:grid md:grid-cols-[20rem_minmax(0,1fr)]"
          style={narrow ? undefined : { height: panelHeight }}
        >
          <div className="border-border overflow-y-auto md:border-e">
            <ReviewList
              label={m('Incoming medications')}
              sections={sections}
              selectedKey={selectedKey}
              onSelect={setSelectedKey}
              onOpen={(key) => {
                setSelectedKey(key);
                if (narrow) {
                  rememberFocus();
                  setSheetOpen(true);
                }
              }}
              optionRef={(key, element) => {
                if (element) optionElements.current.set(key, element);
                else optionElements.current.delete(key);
              }}
            />
          </div>
          {!narrow && (
            <div
              ref={detailRef}
              className="overflow-y-auto p-4"
              aria-label={m('Selected record')}
              role="region"
            >
              {selectedUnit && renderDetail(selectedUnit, false)}
            </div>
          )}
        </div>
      )}

      {narrow && selectedUnit && (
        <Modal
          open={sheetOpen}
          onOpenChange={(open) => {
            if (!open) {
              setSheetOpen(false);
              restoreFocus();
            }
          }}
          size="full"
        >
          <ModalHeader>
            <ModalTitle>
              <bdi>{sheetName}</bdi>
            </ModalTitle>
            <ModalClose aria-label={m('Close')} />
          </ModalHeader>
          <ModalBody>
            <div ref={detailRef}>{renderDetail(selectedUnit, true)}</div>
          </ModalBody>
        </Modal>
      )}

      <MergeSummaryModal
        open={summaryOpen}
        changeSet={changeSet}
        saving={saving}
        error={saveError}
        onCancel={() => {
          setSummaryOpen(false);
          restoreFocus();
        }}
        onConfirm={confirm}
      />

      {editingRecord && (
        <MedicationEditor
          key={editingRecord.id}
          open
          medication={
            edits[editingRecord.id] ?? toMedication(editingRecord.medication)
          }
          codeLookup={codeLookup}
          {...editorOptions}
          onClose={() => {
            setEditingId(null);
            restoreFocus();
          }}
          onSave={(medication) => {
            setTouched(true);
            setReview((current) => ({
              ...current,
              edits: { ...current.edits, [editingRecord.id]: medication },
            }));
            setEditingId(null);
            restoreFocus();
          }}
        />
      )}

      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>
    </section>
  );
}
