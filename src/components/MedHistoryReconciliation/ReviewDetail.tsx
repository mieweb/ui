'use client';

/**
 * Detail pane of MedHistoryReconciliation: the decision buttons, one
 * incoming record against its chart candidates, and a repeat-fill group.
 */

import * as React from 'react';
import { useMessages, type MessageTranslator } from '../../utils/messages';
import { cn } from '../../utils/cn';
import { Badge } from '../Badge/Badge';
import { Button } from '../Button';
import { CheckIcon, PencilIcon, SparklesIcon } from '../Icons';
import { toolbarKeyNav } from '../RowActionToolbar';
import {
  fillBlocker,
  type DismissReason,
  type FillBlocker,
  type MatchScore,
} from './scoring';
import {
  currentPreset,
  decisionValue,
  type DecisionMap,
  type GroupPreset,
  type MedHistoryDecision,
  type RepeatGroup,
} from './decisions';
import {
  FieldComparison,
  RecordBadges,
  RecordDetails,
  fieldText,
  formatIsoDate,
  formatPercent,
  type PharmacyNames,
} from './RecordReview';
import type { MedHistoryAiSuggestion, MedHistoryRecord } from './types';

/** A chart record the incoming record may duplicate. */
export interface CandidateOption {
  chart: MedHistoryRecord;
  match: MatchScore;
  ai?: MedHistoryAiSuggestion;
}

const DISMISS_LABELS: Record<DismissReason, string> = {
  'different-drug': 'Coded as a different drug',
  'supply-vs-drug': 'Supply compared with a drug',
  'name-length': 'Names too different',
  'no-shared-prefix': 'Names too different',
};

const BLOCKER_LABELS: Record<FillBlocker, string> = {
  'not-a-match':
    "Add as Refill is unavailable: the chart record doesn't match by the rules.",
  'different-name':
    "Add as Refill is unavailable: the medication names don't match closely enough.",
  'different-strength':
    'Add as Refill is unavailable: the strength differs from the chart record.',
  'different-form':
    'Add as Refill is unavailable: the dose form differs from the chart record.',
  'different-strength-form':
    'Add as Refill is unavailable: the strength and dose form differ from the chart record.',
  'unknown-strength-form':
    "Add as Refill is unavailable: strength and dose form can't be compared.",
};

/** Single-key shortcuts for the selected record. */
export type DecisionShortcut = 'N' | 'F' | 'S';

export interface DecisionChoice {
  /** Encoded decision (see `decisionValue`). */
  value: string;
  decision: MedHistoryDecision;
  /** Visible text. */
  label: string;
  /** Accessible name; must start with `label` (label in name). */
  ariaLabel?: string;
  shortcut?: DecisionShortcut;
  disabledReason?: string;
}

/** "On chart" for one candidate; "Chart A", "Chart B", … for several. */
export function candidateLabels(count: number, m: MessageTranslator): string[] {
  if (count === 1) return [m('On chart')];
  return Array.from({ length: count }, (_, i) =>
    m('Chart {letter}', { letter: String.fromCharCode(65 + i) })
  );
}

/**
 * Add as New · Add as Refill · Skip. Refill buttons appear only when
 * `allowFill` and there are candidates; one per eligible candidate when
 * there are several, or a single disabled button stating why.
 */
export function decisionChoices(
  options: readonly CandidateOption[],
  allowFill: boolean,
  m: MessageTranslator
): DecisionChoice[] {
  const add: DecisionChoice = {
    value: 'add',
    decision: { kind: 'add' },
    label: m('Add as New'),
    shortcut: 'N',
  };
  const skip: DecisionChoice = {
    value: 'skip',
    decision: { kind: 'skip' },
    label: m('Skip'),
    shortcut: 'S',
  };
  if (!allowFill || options.length === 0) return [add, skip];

  const fillChoice = (
    option: CandidateOption,
    label: string,
    shortcut: DecisionShortcut | undefined,
    blocker: FillBlocker | undefined
  ): DecisionChoice => {
    const decision: MedHistoryDecision = {
      kind: 'fill',
      chartId: option.chart.id,
    };
    return {
      value: decisionValue(decision),
      decision,
      label,
      ariaLabel: m('{action}: {name}', {
        action: label,
        name: option.chart.medication.name,
      }),
      shortcut,
      disabledReason: blocker ? m(BLOCKER_LABELS[blocker]) : undefined,
    };
  };

  if (options.length === 1) {
    const option = options[0];
    return [
      add,
      fillChoice(option, m('Add as Refill'), 'F', fillBlocker(option.match)),
      skip,
    ];
  }
  const eligible = options
    .map((option, index) => ({ option, index }))
    .filter(({ option }) => fillBlocker(option.match) === undefined);
  if (eligible.length === 0)
    return [
      add,
      fillChoice(
        options[0],
        m('Add as Refill'),
        undefined,
        fillBlocker(options[0].match)
      ),
      skip,
    ];
  return [
    add,
    ...eligible.map(({ option, index }, i) =>
      fillChoice(
        option,
        m('Add as Refill (chart {letter})', {
          letter: String.fromCharCode(65 + index),
        }),
        i === 0 ? 'F' : undefined,
        undefined
      )
    ),
    skip,
  ];
}

/** The enabled choice bound to a shortcut key, if any. */
export function choiceForShortcut(
  choices: readonly DecisionChoice[],
  key: string
): DecisionChoice | undefined {
  return choices.find(
    (c) => c.shortcut === key.toUpperCase() && !c.disabledReason
  );
}

/**
 * Mutually exclusive toggle buttons (`aria-pressed`) in a toolbar. Pressing
 * the active button clears the decision unless `clearable` is false.
 */
export function DecisionButtons({
  label,
  choices,
  value,
  disabled,
  onChange,
  size = 'md',
}: {
  label: string;
  choices: readonly DecisionChoice[];
  value: string;
  disabled: boolean;
  onChange: (decision: MedHistoryDecision | undefined) => void;
  size?: 'sm' | 'md';
}) {
  const reasons = [
    ...new Set(
      choices
        .map((c) => c.disabledReason)
        .filter((r): r is string => r !== undefined)
    ),
  ];
  return (
    <div className={cn('space-y-1', size === 'md' && 'w-full sm:w-auto')}>
      <ToggleGroup label={label} size={size}>
        {choices.map((choice) => (
          <ToggleButton
            key={choice.value}
            pressed={choice.value === value}
            disabled={disabled || choice.disabledReason !== undefined}
            ariaLabel={choice.ariaLabel}
            shortcut={choice.shortcut}
            size={size}
            onClick={() =>
              onChange(choice.value === value ? undefined : choice.decision)
            }
          >
            {choice.label}
          </ToggleButton>
        ))}
      </ToggleGroup>
      {reasons.map((reason) => (
        <p key={reason} className="text-muted-foreground text-xs">
          {reason}
        </p>
      ))}
    </div>
  );
}

function ToggleGroup({
  label,
  size,
  children,
}: {
  label: string;
  size: 'sm' | 'md';
  children: React.ReactNode;
}) {
  return (
    <div
      role="toolbar"
      aria-label={label}
      onKeyDown={toolbarKeyNav}
      className={cn(
        'border-border overflow-hidden rounded-lg border',
        size === 'md'
          ? 'grid w-full grid-cols-1 sm:inline-flex sm:w-auto sm:max-w-full sm:flex-wrap'
          : 'inline-flex max-w-full flex-wrap'
      )}
    >
      {children}
    </div>
  );
}

function ToggleButton({
  pressed,
  disabled,
  ariaLabel,
  shortcut,
  size,
  onClick,
  children,
}: {
  pressed: boolean;
  disabled: boolean;
  ariaLabel?: string;
  shortcut?: DecisionShortcut;
  size: 'sm' | 'md';
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      aria-label={ariaLabel}
      aria-keyshortcuts={shortcut}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'border-border inline-flex items-center justify-center gap-1.5 font-medium',
        'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset',
        'disabled:cursor-not-allowed disabled:opacity-50',
        size === 'md'
          ? 'border-t px-3 py-2 text-sm first:border-t-0 sm:border-s sm:border-t-0 sm:py-1.5 sm:first:border-s-0'
          : 'border-s px-2.5 py-1 text-xs first:border-s-0',
        pressed
          ? 'bg-primary-800 text-white'
          : 'bg-background text-foreground hover:bg-muted'
      )}
    >
      {pressed && <CheckIcon aria-hidden="true" className="h-4 w-4" />}
      {children}
      {shortcut && (
        <kbd
          aria-hidden="true"
          className={cn(
            'rounded border px-1 font-mono text-[0.625rem] leading-4',
            pressed ? 'border-white/60' : 'border-border text-muted-foreground'
          )}
        >
          {shortcut}
        </kbd>
      )}
    </button>
  );
}

function EditButton({
  name,
  enabled,
  onEdit,
}: {
  name: string;
  enabled: boolean;
  onEdit: () => void;
}) {
  const m = useMessages();
  return (
    <Button
      variant="outline"
      size="sm"
      className="w-full sm:w-auto"
      leftIcon={<PencilIcon aria-hidden="true" className="h-4 w-4" />}
      disabled={!enabled}
      onClick={onEdit}
      aria-label={m('{action}: {name}', {
        action: m('Edit before import'),
        name,
      })}
    >
      {m('Edit before import')}
    </Button>
  );
}

function CandidateNotes({
  options,
  labels,
  disabled,
  onDismissAi,
}: {
  options: readonly CandidateOption[];
  labels: readonly string[];
  disabled: boolean;
  onDismissAi: (chartId: string) => void;
}) {
  const m = useMessages();
  return (
    <>
      {options.map((option, index) =>
        option.match.dismissedBy || option.ai ? (
          <div key={option.chart.id} className="space-y-1 text-sm">
            {option.match.dismissedBy && (
              <p className="text-muted-foreground">
                {m('{label}: not a match by the rules — {reason}', {
                  label: labels[index],
                  reason: m(DISMISS_LABELS[option.match.dismissedBy]),
                })}
              </p>
            )}
            {option.ai && (
              <div className="flex flex-wrap items-center gap-2">
                <SparklesIcon
                  aria-hidden="true"
                  className="text-primary-600 h-4 w-4"
                />
                <span>
                  {m('AI suggestion: {reason}', { reason: option.ai.reason })}
                  {option.ai.confidence !== undefined &&
                    ` (${formatPercent(option.ai.confidence)})`}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={disabled}
                  onClick={() => onDismissAi(option.chart.id)}
                  aria-label={m('Dismiss AI suggestion for {name}', {
                    name: option.chart.medication.name,
                  })}
                >
                  {m('Dismiss')}
                </Button>
              </div>
            )}
          </div>
        ) : null
      )}
    </>
  );
}

function ScoreBadges({ options }: { options: readonly CandidateOption[] }) {
  const m = useMessages();
  const flagged = options.filter((o) => !o.match.dismissedBy);
  if (options.length === 1 && flagged.length === 1) {
    const match = flagged[0].match;
    return (
      <div className="flex flex-wrap gap-1.5">
        <Badge variant="default" size="sm">
          {m('Possible duplicate · {score} match', {
            score: formatPercent(match.score),
          })}
        </Badge>
        <Badge variant="secondary" size="sm">
          <bdi>
            {m('{compared} of {total} criteria compared', {
              compared: match.fields.filter((f) => f.outcome !== 'missing')
                .length,
              total: match.fields.length,
            })}
          </bdi>
        </Badge>
      </div>
    );
  }
  if (flagged.length > 1)
    return (
      <Badge variant="default" size="sm">
        {m('{count} possible duplicates', { count: flagged.length })}
      </Badge>
    );
  return null;
}

function Comparison({
  record,
  options,
  labels,
  pharmacyNames,
  stacked,
}: {
  record: MedHistoryRecord;
  options: readonly CandidateOption[];
  labels: readonly string[];
  pharmacyNames: PharmacyNames;
  stacked?: boolean;
}) {
  const m = useMessages();
  return (
    <FieldComparison
      incoming={record}
      candidates={options.map((option, index) => ({
        chart: option.chart,
        match: option.match,
        label: labels[index],
        detail: option.match.dismissedBy
          ? m('AI suggestion')
          : options.length > 1
            ? formatPercent(option.match.score)
            : undefined,
      }))}
      pharmacyNames={pharmacyNames}
      caption={m('{incoming} compared with the chart', {
        incoming: record.medication.name,
      })}
      layout={stacked ? 'stack' : 'table'}
    />
  );
}

export interface RecordDetailProps {
  record: MedHistoryRecord;
  options: readonly CandidateOption[];
  decision: MedHistoryDecision | undefined;
  edited: boolean;
  disabled: boolean;
  pharmacyNames: PharmacyNames;
  headingRef?: React.Ref<HTMLHeadingElement>;
  /** Inside the narrow-screen sheet: heading hidden (the dialog shows it), stacked comparison. */
  inSheet?: boolean;
  onDecide: (decision: MedHistoryDecision | undefined) => void;
  onEdit: () => void;
  onDismissAi: (chartId: string) => void;
}

/** One incoming record: comparison with its chart candidates and decision. */
export function RecordDetail({
  record,
  options,
  decision,
  edited,
  disabled,
  pharmacyNames,
  headingRef,
  inSheet,
  onDecide,
  onEdit,
  onDismissAi,
}: RecordDetailProps) {
  const m = useMessages();
  const name = record.medication.name;
  const labels = candidateLabels(options.length, m);

  return (
    <div className="flex h-full flex-col gap-3" data-record={record.id}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <h3
            ref={headingRef}
            tabIndex={-1}
            className={cn(
              'font-semibold break-words outline-none',
              inSheet && 'sr-only'
            )}
          >
            <bdi>{name}</bdi>
          </h3>
          <div className="flex flex-wrap items-center gap-1.5">
            <RecordBadges record={record} />
            {edited && (
              <Badge variant="default" size="sm">
                {m('Edited')}
              </Badge>
            )}
          </div>
        </div>
        <ScoreBadges options={options} />
      </div>

      <CandidateNotes
        options={options}
        labels={labels}
        disabled={disabled}
        onDismissAi={onDismissAi}
      />

      {options.length > 0 ? (
        <Comparison
          record={record}
          options={options}
          labels={labels}
          pharmacyNames={pharmacyNames}
          stacked={inSheet}
        />
      ) : (
        <RecordDetails record={record} pharmacyNames={pharmacyNames} />
      )}

      <div className="mt-auto flex flex-wrap items-start justify-between gap-3 pt-2">
        <EditButton
          name={name}
          enabled={!disabled && decision?.kind === 'add'}
          onEdit={onEdit}
        />
        <div className="w-full sm:ms-auto sm:w-auto">
          <DecisionButtons
            label={m('What to do with {name}', { name })}
            choices={decisionChoices(options, true, m)}
            value={decisionValue(decision)}
            disabled={disabled}
            onChange={onDecide}
          />
        </div>
      </div>
    </div>
  );
}

export interface GroupDetailProps {
  group: RepeatGroup;
  /** Group members, any order. */
  records: readonly MedHistoryRecord[];
  /** Candidates of the newest fill. */
  options: readonly CandidateOption[];
  decisions: DecisionMap;
  editedIds: ReadonlySet<string>;
  disabled: boolean;
  pharmacyNames: PharmacyNames;
  headingRef?: React.Ref<HTMLHeadingElement>;
  inSheet?: boolean;
  onPreset: (preset: GroupPreset) => void;
  onDecide: (
    incomingId: string,
    decision: MedHistoryDecision | undefined
  ) => void;
  onEdit: (incomingId: string) => void;
  onDismissAi: (chartId: string) => void;
}

const PRESET_LABELS: Record<GroupPreset, string> = {
  'keep-newest': 'Keep newest',
  'skip-all': 'Skip all',
};

/**
 * Repeat fills of one prescription. Keep newest / Skip all are presets that
 * overwrite every fill; their pressed state is derived from the fills.
 */
export function GroupDetail({
  group,
  records,
  options,
  decisions,
  editedIds,
  disabled,
  pharmacyNames,
  headingRef,
  inSheet,
  onPreset,
  onDecide,
  onEdit,
  onDismissAi,
}: GroupDetailProps) {
  const m = useMessages();
  const byId = new Map(records.map((r) => [r.id, r]));
  const newest = byId.get(group.newestId) ?? records[0];
  const ordered = [
    newest,
    ...records
      .filter((r) => r.id !== newest.id)
      .sort((a, b) =>
        (b.dispensedDate ?? b.medication.startDate ?? '').localeCompare(
          a.dispensedDate ?? a.medication.startDate ?? ''
        )
      ),
  ];
  const preset = currentPreset(decisions, group);
  const labels = candidateLabels(options.length, m);
  const name = newest.medication.name;

  return (
    <div className="flex flex-col gap-3" data-group={group.newestId}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <h3
            ref={headingRef}
            tabIndex={-1}
            className={cn(
              'font-semibold break-words outline-none',
              inSheet && 'sr-only'
            )}
          >
            <bdi>{name}</bdi>{' '}
            <Badge variant="secondary" size="sm">
              {m('{count} fills', { count: records.length })}
            </Badge>
          </h3>
          <RecordBadges record={newest} />
        </div>
        <ScoreBadges options={options} />
      </div>

      <p className="text-muted-foreground text-sm">
        {m(
          'These records look like repeat fills of one prescription. Keep newest adds only the newest fill; changing any fill below switches to a custom choice.'
        )}
      </p>

      <ToggleGroup label={m('All fills of {name}', { name })} size="md">
        {(['keep-newest', 'skip-all'] as const).map((p) => (
          <ToggleButton
            key={p}
            pressed={preset === p}
            disabled={disabled}
            size="md"
            onClick={() => {
              if (preset !== p) onPreset(p);
            }}
          >
            {m(PRESET_LABELS[p])}
          </ToggleButton>
        ))}
      </ToggleGroup>

      {options.length > 0 && (
        <>
          <CandidateNotes
            options={options}
            labels={labels}
            disabled={disabled}
            onDismissAi={onDismissAi}
          />
          <Comparison
            record={newest}
            options={options}
            labels={labels}
            pharmacyNames={pharmacyNames}
            stacked={inSheet}
          />
        </>
      )}

      <ul className="space-y-2">
        {ordered.map((record) => {
          const isNewest = record.id === newest.id;
          const date =
            formatIsoDate(
              record.dispensedDate ?? record.medication.startDate
            ) ?? m('Unknown date');
          const details = (['quantity', 'pharmacy', 'prescriber'] as const)
            .map((field) => fieldText(record, field, pharmacyNames, m))
            .filter(Boolean)
            .join(' · ');
          const decision = decisions[record.id];
          return (
            <li
              key={record.id}
              data-fill={record.id}
              className={cn(
                'border-border flex flex-wrap items-center justify-between gap-2 rounded-lg border p-2.5',
                isNewest && 'border-primary-800'
              )}
            >
              <div className="min-w-0">
                <span className="font-medium">
                  {m('Filled {date}', { date })}
                </span>{' '}
                {isNewest && (
                  <Badge variant="default" size="sm">
                    {m('Newest')}
                  </Badge>
                )}
                {editedIds.has(record.id) && (
                  <Badge variant="default" size="sm">
                    {m('Edited')}
                  </Badge>
                )}
                {details && (
                  <span className="text-muted-foreground block text-xs">
                    <bdi>{details}</bdi>
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <DecisionButtons
                  label={m('What to do with the fill from {date}', { date })}
                  choices={decisionChoices(options, isNewest, m)
                    .map((c) => ({ ...c, shortcut: undefined }))
                    .map((c) => ({
                      ...c,
                      ariaLabel: c.ariaLabel
                        ? `${c.ariaLabel} (${date})`
                        : `${c.label} (${date})`,
                    }))}
                  value={decisionValue(decision)}
                  disabled={disabled}
                  size="sm"
                  onChange={(next) => onDecide(record.id, next)}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={
                    <PencilIcon aria-hidden="true" className="h-4 w-4" />
                  }
                  disabled={disabled || decision?.kind !== 'add'}
                  onClick={() => onEdit(record.id)}
                  aria-label={m('Edit the fill from {date} before import', {
                    date,
                  })}
                >
                  {m('Edit')}
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
