'use client';

import * as React from 'react';
import { cn } from '../../utils/cn';
import { useMessages } from '../../utils/messages';
import { Badge } from '../Badge/Badge';
import { Button } from '../Button';
import { Checkbox } from '../Checkbox';
import { DateInput } from '../DateInput';
import { Input } from '../Input';
import { Radio, RadioGroup } from '../Radio';
import { Textarea } from '../Textarea';
import { Select } from '../Select';
import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalBody,
  ModalFooter,
} from '../Modal';
import {
  PlusIcon,
  TrashIcon,
  AlertTriangleIcon,
  HelpCircleIcon,
} from '../Icons';
import {
  currentAssertion,
  type ConcernRelationship,
  type ConditionAssertion,
  type ConditionCoding,
  type ConditionConcern,
  type FieldUncertainty,
  type Uncertainty,
  type UncertainConditionField,
  type VerificationStatus,
} from '../ProblemList';
import {
  useCodeLookupConfig,
  type CodeLookupProviderConfig,
} from '../CodeLookup/context';
import {
  dateToDisplayFormat,
  displayFormatToDateString,
  isValidDate,
} from '../../utils/date';

// =============================================================================
// Types
// =============================================================================

/** What the editor is doing. Determines the resulting changeType / operation. */
export type ConditionEditorMode =
  | 'add'
  | 'observe'
  | 'refine'
  | 'revise'
  | 'relate';

/** Draft assertion returned by onSave — id/date assignment is the caller's job. */
export type ConditionAssertionDraft = Omit<ConditionAssertion, 'id' | 'date'>;

/** A code picked from an injected lookup (structurally matches CodifyResult). */
export interface ConditionCodePick {
  fullid: string;
  label: string;
  codetype: string;
  fullcode: string;
}

/**
 * Render-prop that draws the coding-section code search. Picking a result
 * calls `onPick` (appends a coding row, fills an empty name); free text calls
 * `onFreeText` (fills the name).
 */
export type RenderConditionCodeSearch = (args: {
  placeholder: string;
  onPick: (pick: ConditionCodePick) => void;
  onFreeText: (text: string) => void;
}) => React.ReactNode;

export interface ConditionEditorProps {
  /** Editor operation */
  mode: ConditionEditorMode;
  /** Whether the dialog is open */
  open: boolean;
  /** Called when the dialog requests closing (cancel / overlay / Esc) */
  onOpenChange: (open: boolean) => void;
  /** The concern being refined / revised / related (omit for add) */
  concern?: ConditionConcern;
  /** Concerns available as relate targets (mode 'relate') */
  relatableConcerns?: ConditionConcern[];
  /** Called with the new assertion draft (modes add / refine / revise) */
  onSave?: (draft: ConditionAssertionDraft) => void;
  /** Called with the relationship (mode 'relate') */
  onRelate?: (relationship: ConcernRelationship) => void;
  /** Called with a quick progress note (mode 'observe', or the observation box in other modes) */
  onAddObservation?: (text: string) => void;
  /**
   * Render a code-lookup search for the coding section (dependency-injected
   * so the library build doesn't bundle the lookup's worker — pass e.g. a
   * `CodeLookup` wired to your index, the same pattern as Assessment's
   * `renderOrderSearch`). Picking a result appends a coding row and fills an
   * empty problem name; free text fills the problem name. Defaults to the
   * ambient `CodeLookupProvider` (condition shard, ICD-10 preferred); pass
   * `false` for manual code entry only.
   */
  renderCodeSearch?: RenderConditionCodeSearch | false;
  /** Additional CSS classes for the dialog content */
  className?: string;
  /** Test ID for testing */
  'data-testid'?: string;
}

// =============================================================================
// Constants
// =============================================================================

const MODE_META: Record<
  ConditionEditorMode,
  { title: string; changeType: ConditionAssertion['changeType'] }
> = {
  add: { title: 'Add problem', changeType: undefined },
  observe: { title: 'Progress observation', changeType: undefined },
  refine: { title: 'Refine problem', changeType: 'refinement' },
  revise: { title: 'Revise problem', changeType: 'revision' },
  relate: { title: 'Relate problem', changeType: undefined },
};

const CODING_SYSTEMS = ['SNOMED', 'ICD-10-CM', 'ICD-11'] as const;

const VERIFICATION_OPTIONS: { value: VerificationStatus; label: string }[] = [
  { value: 'unconfirmed', label: 'Unconfirmed' },
  { value: 'provisional', label: 'Provisional' },
  { value: 'differential', label: 'Differential' },
  { value: 'confirmed', label: 'Confirmed' },
];

const RELATIONSHIP_OPTIONS: {
  value: ConcernRelationship['type'];
  label: string;
}[] = [
  { value: 'caused-by', label: 'Caused by' },
  { value: 'evolved-from', label: 'Evolved from' },
  { value: 'differential-sibling', label: 'Differential sibling' },
  { value: 'complication-of', label: 'Complication of' },
];

const SEVERITIES = ['mild', 'moderate', 'severe'] as const;
const CONFIDENCES = ['low', 'medium', 'high'] as const;

/** Map an index codetype (e.g. 'ICD10') onto the ConditionCoding system. */
export function normalizeConditionCodingSystem(codetype: string): string {
  const ct = codetype.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (ct === 'ICD10' || ct === 'ICD10CM') return 'ICD-10-CM';
  if (ct === 'ICD11') return 'ICD-11';
  if (ct === 'SNOMED' || ct === 'SNOMEDCT' || ct === 'SNOMEDUS') {
    return 'SNOMED';
  }
  return codetype;
}

function withSinglePrimary(coding: ConditionCoding[]): ConditionCoding[] {
  if (coding.length === 0) return coding;
  const primaryIndex = coding.findIndex((entry) => entry.primary);
  const selectedIndex = primaryIndex >= 0 ? primaryIndex : 0;
  return coding.map((entry, index) => ({
    ...entry,
    primary: index === selectedIndex,
  }));
}

/**
 * Default code search built from an ambient `CodeLookupProvider`: a bare
 * condition-shard lookup (ICD-10 preferred) wired to the editor's onPick /
 * onFreeText. Used when no explicit `renderCodeSearch` prop is given.
 */
function contextConditionCodeSearch(
  ctx: CodeLookupProviderConfig
): RenderConditionCodeSearch {
  const ContextConditionCodeSearch: RenderConditionCodeSearch = ({
    placeholder,
    onPick,
    onFreeText,
  }) => {
    const Lookup = ctx.component;
    return (
      <Lookup
        indexUrl={ctx.indexUrl}
        locale={ctx.locale}
        domains={['condition']}
        preferCodetypes={['ICD10']}
        bare
        clearOnSelect={false}
        placeholder={placeholder}
        onSelect={(result) =>
          onPick({
            fullid: result.fullid,
            label: result.label,
            codetype: result.codetype,
            fullcode: result.fullcode,
          })
        }
        onFreeText={onFreeText}
      />
    );
  };
  return ContextConditionCodeSearch;
}

// =============================================================================
// Field uncertainty affordance (§4.1 three-state rule)
// =============================================================================

/**
 * Per-field uncertainty control: an "Unknown" toggle (explicitly unknown —
 * distinct from untouched) and a low/med/high confidence toggle for values
 * that are present but soft.
 */
function FieldFlag({
  label,
  value,
  onChange,
  hasValue,
}: {
  label: string;
  value?: FieldUncertainty;
  onChange: (f: FieldUncertainty | undefined) => void;
  hasValue: boolean;
}) {
  const m = useMessages();
  const unknown = value?.known === false;
  return (
    <span
      role="group"
      aria-label={m('Certainty for {label}', { label })}
      className="flex items-center gap-1"
    >
      <button
        type="button"
        aria-pressed={unknown}
        onClick={() =>
          onChange(
            unknown ? undefined : { known: false, reason: 'asked-unknown' }
          )
        }
        className={cn(
          'rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors',
          unknown
            ? 'border-warning/50 bg-warning/10 text-warning-800 dark:text-warning-200'
            : 'border-border text-muted-foreground hover:text-foreground'
        )}
      >
        {m('Unknown')}
      </button>
      {hasValue &&
        !unknown &&
        CONFIDENCES.map((c) => {
          const active = value?.known !== false && value?.confidence === c;
          return (
            <button
              key={c}
              type="button"
              aria-pressed={active}
              aria-label={m('{label} confidence {confidence}', {
                label,
                confidence: m(c),
              })}
              onClick={() =>
                onChange(active ? undefined : { known: true, confidence: c })
              }
              className={cn(
                'rounded-full border px-1.5 py-0.5 text-[11px] transition-colors',
                active
                  ? 'border-primary-400 bg-primary-100 text-primary-900 dark:border-primary-600 dark:bg-primary-950 dark:text-primary-200'
                  : 'border-border text-muted-foreground hover:text-foreground'
              )}
            >
              {m(c)}
            </button>
          );
        })}
    </span>
  );
}

// =============================================================================
// Observation history — quick progress notes over time
// =============================================================================

function ObservationHistory({ concern }: { concern?: ConditionConcern }) {
  const m = useMessages();
  const observations = concern?.observations;
  if (!observations?.length) return null;
  return (
    <section aria-label={m('Past observations')} className="space-y-1">
      <h4 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
        {m('Observations')}
      </h4>
      <ol className="border-border max-h-40 space-y-1.5 overflow-y-auto rounded-md border p-2">
        {[...observations].reverse().map((o) => (
          <li key={o.id} className="flex flex-wrap gap-x-2 text-sm">
            <span className="text-muted-foreground text-xs tabular-nums">
              {o.date}
            </span>
            <span className="text-foreground flex-1">{o.text}</span>
            {o.author && (
              <span className="text-muted-foreground text-xs">
                — {o.author}
              </span>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}

// =============================================================================
// ConditionEditor
// =============================================================================

/**
 * Dialog editor for condition assertions — the condition analog of the
 * planned MedicationEditor. Capture-first: only the problem name is required;
 * coding, severity, and onset are progressive enrichment. Every optional
 * field carries the §4.1 three-state affordance (confident / uncertain /
 * explicitly unknown), written to the assertion's uncertainty block.
 *
 * Modes:
 * - `add` — new concern, first assertion
 * - `observe` — quick progress note on the concern; shows the full observation
 *   history over time
 * - `refine` — new assertion, changeType 'refinement' (or 'progression')
 * - `revise` — new assertion, changeType 'revision'; warns that the prior
 *   assertion will be refuted
 * - `relate` — picks a relationship type + target concern
 */
export function ConditionEditor({
  mode,
  open,
  onOpenChange,
  concern,
  relatableConcerns = [],
  onSave,
  onRelate,
  onAddObservation,
  renderCodeSearch,
  className,
  'data-testid': dataTestId,
}: ConditionEditorProps) {
  const m = useMessages();
  const prior = concern ? currentAssertion(concern) : undefined;

  // Default the code search to the ambient provider; `false` forces manual
  // code entry only.
  const ambientCodeLookup = useCodeLookupConfig();
  const effectiveRenderCodeSearch: RenderConditionCodeSearch | undefined =
    renderCodeSearch === false
      ? undefined
      : (renderCodeSearch ??
        (ambientCodeLookup
          ? contextConditionCodeSearch(ambientCodeLookup)
          : undefined));

  const [text, setText] = React.useState('');
  const [coding, setCoding] = React.useState<ConditionCoding[]>([]);
  const [verification, setVerification] =
    React.useState<VerificationStatus>('confirmed');
  const [severity, setSeverity] =
    React.useState<ConditionAssertion['severity']>();
  const [onsetDate, setOnsetDate] = React.useState('');
  const [onsetFuzzy, setOnsetFuzzy] = React.useState('');
  const [note, setNote] = React.useState('');
  const [progression, setProgression] = React.useState(false);
  const [fields, setFields] = React.useState<
    Partial<Record<UncertainConditionField, FieldUncertainty>>
  >({});
  const [relType, setRelType] =
    React.useState<ConcernRelationship['type']>('caused-by');
  const [relTarget, setRelTarget] = React.useState('');
  const [observation, setObservation] = React.useState('');

  // Seed from the prior assertion whenever the dialog opens (or the mode /
  // concern changes while open — stale values must not carry over)
  React.useEffect(() => {
    if (!open) return;
    setText(prior?.text ?? '');
    setCoding(withSinglePrimary(prior?.coding ?? []));
    setVerification(
      mode === 'add'
        ? 'unconfirmed'
        : (prior?.verificationStatus ?? 'confirmed')
    );
    setSeverity(prior?.severity);
    const priorOnsetDate = prior?.onset?.date;
    setOnsetDate(priorOnsetDate ? dateToDisplayFormat(priorOnsetDate) : '');
    setOnsetFuzzy(priorOnsetDate ? '' : (prior?.onset?.fuzzy ?? ''));
    setNote('');
    setProgression(false);
    setFields(prior?.uncertainty?.fields ?? {});
    setRelType('caused-by');
    setRelTarget('');
    setObservation('');
  }, [open, mode, prior]);

  const setField =
    (field: UncertainConditionField) => (f: FieldUncertainty | undefined) =>
      setFields((prev) => {
        const next = { ...prev };
        if (f) next[field] = f;
        else delete next[field];
        return next;
      });

  const updateCoding = (i: number, patch: Partial<ConditionCoding>) =>
    setCoding((prev) => prev.map((c, j) => (j === i ? { ...c, ...patch } : c)));

  // Coding explicitly marked unknown: handleSave() drops the codes, so the
  // coding inputs disable to keep the UI and the saved output consistent.
  const codingUnknown = fields.coding?.known === false;
  const hasInvalidOnsetDate =
    fields.onset?.known !== false &&
    Boolean(onsetDate) &&
    !isValidDate(onsetDate);

  /** A pick from the injected lookup — appends a coding row, fills an empty
   * name, and clears a contradictory "coding unknown" flag. */
  const handleCodePick = (pick: ConditionCodePick) => {
    const system = normalizeConditionCodingSystem(pick.codetype);
    setCoding((prev) =>
      prev.some((c) => c.system === system && c.code === pick.fullcode)
        ? prev
        : withSinglePrimary([
            ...prev,
            { system, code: pick.fullcode, display: pick.label },
          ])
    );
    setText((prev) => prev || pick.label);
    setFields((prev) => {
      if (prev.coding?.known !== false) return prev;
      const next = { ...prev };
      delete next.coding;
      return next;
    });
  };

  const handleSave = () => {
    if (mode === 'relate') {
      if (!relTarget) return;
      onRelate?.({ type: relType, concernId: relTarget });
      onOpenChange(false);
      return;
    }
    if (mode === 'observe') {
      if (!observation.trim()) return;
      onAddObservation?.(observation.trim());
      onOpenChange(false);
      return;
    }
    if (!text.trim() || hasInvalidOnsetDate) return;
    if (observation.trim()) onAddObservation?.(observation.trim());
    const uncertainty: Uncertainty | undefined =
      Object.keys(fields).length > 0 ? { fields } : undefined;
    onSave?.({
      text: text.trim(),
      // write the trimmed values back — whitespace in codes breaks equality
      // checks downstream. A field marked explicitly unknown must not carry a
      // value (e.g. one seeded from the prior assertion): value + "unknown"
      // would be contradictory, so unknown wins and the value is dropped.
      coding:
        fields.coding?.known === false
          ? []
          : withSinglePrimary(
              coding
                .filter((c) => c.code.trim())
                .map((c) => ({
                  ...c,
                  code: c.code.trim(),
                  display: c.display?.trim() || undefined,
                  mappedFrom: c.mappedFrom?.trim() || undefined,
                }))
            ),
      verificationStatus: verification,
      changeType:
        mode === 'refine'
          ? progression
            ? 'progression'
            : 'refinement'
          : MODE_META[mode].changeType,
      supersedes: prior?.id,
      severity: fields.severity?.known === false ? undefined : severity,
      onset:
        fields.onset?.known === false
          ? undefined
          : onsetDate || onsetFuzzy
            ? {
                date: onsetDate
                  ? displayFormatToDateString(onsetDate)
                  : undefined,
                fuzzy: onsetFuzzy || undefined,
              }
            : undefined,
      uncertainty,
      note: note.trim() || undefined,
    });
    onOpenChange(false);
  };

  const saveDisabled =
    mode === 'relate'
      ? !relTarget
      : mode === 'observe'
        ? !observation.trim()
        : !text.trim() || hasInvalidOnsetDate;

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      size="2xl"
      className={className}
    >
      <ModalHeader>
        <ModalTitle>
          {m(MODE_META[mode].title)}
          {prior ? ` — ${prior.text}` : ''}
        </ModalTitle>
      </ModalHeader>
      <ModalBody data-testid={dataTestId} className="space-y-5">
        <div className="space-y-5">
          {mode === 'revise' && (
            <div
              role="alert"
              className="border-warning/30 bg-warning/10 text-warning-800 dark:text-warning-200 flex items-start gap-2 rounded-md border px-3 py-2 text-sm"
            >
              <AlertTriangleIcon size={16} />
              <span>
                {m(
                  'Revising marks the prior assertion refuted (it was never true) — history is preserved on the timeline. Use Refine instead if the prior was correct but less specific.'
                )}
              </span>
            </div>
          )}

          {mode === 'relate' ? (
            <>
              <Select
                label={m('Relationship')}
                options={RELATIONSHIP_OPTIONS.map((option) => ({
                  ...option,
                  label: m(option.label),
                }))}
                value={relType}
                onValueChange={(v) =>
                  setRelType(v as ConcernRelationship['type'])
                }
              />
              <Select
                label={m('Related problem')}
                placeholder={m('Select a problem…')}
                options={relatableConcerns
                  .filter((c) => c.concernId !== concern?.concernId)
                  .map((c) => ({
                    value: c.concernId,
                    label: currentAssertion(c)?.text ?? c.concernId,
                  }))}
                value={relTarget}
                onValueChange={setRelTarget}
              />
            </>
          ) : mode === 'observe' ? (
            <>
              <ObservationHistory concern={concern} />
              <Textarea
                label={m('New observation')}
                value={observation}
                onChange={(e) => setObservation(e.target.value)}
                placeholder={m(
                  'e.g. BP improving on current regimen; patient reports better sleep'
                )}
                rows={3}
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus
              />
            </>
          ) : (
            <>
              {/* Past progress observations — visible while editing an existing concern */}
              {(mode === 'refine' || mode === 'revise') && (
                <ObservationHistory concern={concern} />
              )}

              {/* Capture-first: name is the only required field. In add mode
                  with an injected lookup, name + coding are ONE input — pick
                  a code (sets both) or enter free text (name only). */}
              {mode === 'add' && effectiveRenderCodeSearch && !text.trim() ? (
                <div className="space-y-1">
                  <span className="text-foreground block text-sm font-medium">
                    {m('Problem name')}
                    <span className="text-destructive ms-1" aria-hidden="true">
                      *
                    </span>
                  </span>
                  {effectiveRenderCodeSearch({
                    placeholder: m(
                      'Search conditions — or type a name and press Enter…'
                    ),
                    onPick: handleCodePick,
                    onFreeText: (t) => setText(t.trim()),
                  })}
                  <p className="text-muted-foreground text-xs">
                    {m(
                      'Picking a code fills the name and coding together; free text is fine — codes can be added any time.'
                    )}
                  </p>
                </div>
              ) : (
                <Input
                  label={m('Problem name')}
                  required
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={m(
                    'e.g. Type 1 diabetes mellitus with neuropathy'
                  )}
                />
              )}

              {mode === 'refine' && (
                <Checkbox
                  size="sm"
                  checked={progression}
                  onChange={(e) => setProgression(e.target.checked)}
                  label={m(
                    'Disease progressed (e.g. new complication) rather than a more specific diagnosis'
                  )}
                />
              )}

              {/* Coding — progressive enrichment, never required */}
              <fieldset className="space-y-3">
                <legend className="sr-only">{m('Coding')}</legend>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="flex flex-wrap items-center gap-2 text-sm font-medium">
                    {m('Coding')}
                    <FieldFlag
                      label={m('Coding')}
                      value={fields.coding}
                      onChange={setField('coding')}
                      hasValue={coding.length > 0}
                    />
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={codingUnknown}
                    onClick={() =>
                      setCoding((prev) => [
                        ...prev,
                        {
                          system: 'SNOMED',
                          code: '',
                          primary: prev.length === 0,
                        },
                      ])
                    }
                    leftIcon={<PlusIcon size={12} />}
                    className="h-8 shrink-0 text-xs"
                  >
                    {m('Add code')}
                  </Button>
                </div>
                {effectiveRenderCodeSearch &&
                  !(mode === 'add' && !text.trim()) && (
                    <div>
                      {effectiveRenderCodeSearch({
                        placeholder: m('Search codes — ICD-10-CM / SNOMED…'),
                        onPick: handleCodePick,
                        onFreeText: (t) => setText((prev) => prev || t),
                      })}
                    </div>
                  )}
                {coding.length === 0 && (
                  <p className="text-muted-foreground text-xs">
                    {m(
                      'Optional — a name-only problem is valid. Codes can be added any time.'
                    )}
                  </p>
                )}
                {coding.length > 0 && (
                  <div
                    aria-hidden="true"
                    data-slot="condition-coding-header"
                    className="text-muted-foreground hidden grid-cols-[minmax(8rem,1.1fr)_minmax(7rem,0.9fr)_minmax(10rem,1.5fr)_5.5rem_2.5rem] items-center gap-2 px-1 text-xs font-medium sm:!grid"
                  >
                    <span>{m('System')}</span>
                    <span>{m('Code')}</span>
                    <span>{m('Display')}</span>
                    <span className="text-center">{m('Primary code')}</span>
                    <span className="sr-only">{m('Actions')}</span>
                  </div>
                )}
                {coding.length > 0 && (
                  <RadioGroup
                    name="primary-coding"
                    label={m('Primary display code')}
                    value={String(
                      Math.max(
                        0,
                        coding.findIndex((entry) => entry.primary)
                      )
                    )}
                    onValueChange={(value) => {
                      const selectedIndex = Number(value);
                      setCoding((prev) =>
                        prev.map((entry, index) => ({
                          ...entry,
                          primary: index === selectedIndex,
                        }))
                      );
                    }}
                    size="sm"
                    className="gap-2 [&_[data-slot=radio-group-items]]:gap-2 sm:[&_[data-slot=radio-group-legend]]:sr-only"
                  >
                    {coding.map((c, i) => (
                      <div
                        key={i}
                        data-slot="condition-coding-row"
                        className="border-border/70 grid grid-cols-1 gap-2 rounded-md border p-2 sm:grid-cols-[minmax(8rem,1.1fr)_minmax(7rem,0.9fr)_minmax(10rem,1.5fr)_5.5rem_2.5rem] sm:items-center sm:border-0 sm:p-0"
                      >
                        <div className="space-y-1">
                          <span className="text-muted-foreground text-xs sm:hidden">
                            {m('System')}
                          </span>
                          <Select
                            aria-label={m('Coding system {index}', {
                              index: i + 1,
                            })}
                            options={CODING_SYSTEMS.map((s) => ({
                              value: s,
                              label: s,
                            }))}
                            value={c.system}
                            onValueChange={(v) =>
                              updateCoding(i, { system: v })
                            }
                            disabled={codingUnknown}
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-muted-foreground text-xs sm:hidden">
                            {m('Code')}
                          </span>
                          <Input
                            aria-label={m('Code {index}', { index: i + 1 })}
                            value={c.code}
                            onChange={(e) =>
                              updateCoding(i, { code: e.target.value })
                            }
                            placeholder={m('Code')}
                            disabled={codingUnknown}
                            className="font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-muted-foreground text-xs sm:hidden">
                            {m('Display')}
                          </span>
                          <Input
                            aria-label={m('Display {index}', { index: i + 1 })}
                            value={c.display ?? ''}
                            onChange={(e) =>
                              updateCoding(i, { display: e.target.value })
                            }
                            placeholder={m('Display')}
                            disabled={codingUnknown}
                          />
                        </div>
                        <div className="flex min-h-10 items-center gap-1.5 text-xs sm:justify-center">
                          <Radio
                            value={String(i)}
                            aria-label={m('Primary code: {system} {code}', {
                              system: c.system,
                              code:
                                c.code || m('row {index}', { index: i + 1 }),
                            })}
                            disabled={codingUnknown}
                          />
                          <span className="sm:sr-only">
                            {m('Primary code')}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={m('Remove code {index}', {
                            index: i + 1,
                          })}
                          disabled={codingUnknown}
                          onClick={() =>
                            setCoding((prev) =>
                              withSinglePrimary(
                                prev.filter((_, index) => index !== i)
                              )
                            )
                          }
                          className="h-10 w-10 justify-self-start sm:justify-self-center"
                        >
                          <TrashIcon size={14} />
                        </Button>
                      </div>
                    ))}
                  </RadioGroup>
                )}
              </fieldset>

              <Select
                label={m('Verification status')}
                options={VERIFICATION_OPTIONS.map((option) => ({
                  ...option,
                  label: m(option.label),
                }))}
                value={verification}
                onValueChange={(v) => setVerification(v as VerificationStatus)}
              />

              {/* Severity value and its three-state certainty affordance */}
              <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
                <div className="space-y-1">
                  <span className="block text-sm font-medium">
                    {m('Severity')}
                  </span>
                  <div
                    role="group"
                    aria-label={m('Severity')}
                    className="border-border inline-flex items-center overflow-hidden rounded-md border"
                  >
                    {SEVERITIES.map((s) => {
                      const active = severity === s;
                      return (
                        <button
                          key={s}
                          type="button"
                          aria-pressed={active}
                          disabled={fields.severity?.known === false}
                          onClick={() => setSeverity(active ? undefined : s)}
                          className={cn(
                            'border-border border-s px-2.5 py-1 text-xs font-medium capitalize transition-colors first:border-s-0',
                            'disabled:opacity-40',
                            active
                              ? 'bg-primary-600 text-white'
                              : 'bg-background text-muted-foreground hover:text-foreground'
                          )}
                        >
                          {m(s)}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="block text-sm font-medium">
                    {m('Certainty')}
                  </span>
                  <FieldFlag
                    label={m('Severity')}
                    value={fields.severity}
                    onChange={setField('severity')}
                    hasValue={Boolean(severity)}
                  />
                </div>
              </div>

              {/* Fuzzy onset — exact date OR human string */}
              <div className="space-y-1">
                <span className="flex items-center gap-2 text-sm font-medium">
                  {m('Onset')}
                  <FieldFlag
                    label={m('Onset')}
                    value={fields.onset}
                    onChange={setField('onset')}
                    hasValue={Boolean(onsetDate || onsetFuzzy)}
                  />
                </span>
                <div className="grid grid-cols-1 items-end gap-2 sm:grid-cols-[minmax(10rem,0.8fr)_auto_minmax(14rem,1.2fr)]">
                  <DateInput
                    aria-label={m('Onset date (exact)')}
                    value={onsetDate}
                    onChange={(value) => {
                      setOnsetDate(value);
                      if (value) setOnsetFuzzy('');
                    }}
                    disabled={fields.onset?.known === false}
                    validateOnBlur
                    error={
                      hasInvalidOnsetDate
                        ? m('Please enter a valid date (MM/DD/YYYY)')
                        : undefined
                    }
                    width="full"
                  />
                  <span className="text-muted-foreground pb-3 text-center text-xs">
                    {m('or')}
                  </span>
                  <Input
                    aria-label={m('Onset (fuzzy)')}
                    value={onsetFuzzy}
                    onChange={(e) => {
                      setOnsetFuzzy(e.target.value);
                      if (e.target.value) setOnsetDate('');
                    }}
                    disabled={fields.onset?.known === false}
                    placeholder={m(
                      'Fuzzy — "since her twenties", "~3 months ago"'
                    )}
                  />
                </div>
              </div>

              <Textarea
                label={m('Note')}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={m(
                  'e.g. patient thinks it started after the fall, not sure'
                )}
                rows={2}
              />

              {Object.keys(fields).length > 0 && (
                <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
                  <HelpCircleIcon size={12} />
                  <span>
                    {m('Uncertainty recorded:')}{' '}
                    {Object.entries(fields)
                      .map(([k, f]) =>
                        f?.known === false
                          ? m('{field} unknown', { field: m(k) })
                          : m('{confidence} confidence in {field}', {
                              confidence: m(f?.confidence ?? 'unspecified'),
                              field: m(k),
                            })
                      )
                      .join(', ')}
                  </span>
                </p>
              )}
            </>
          )}
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={() => onOpenChange(false)}>
          {m('Cancel')}
        </Button>
        <Button onClick={handleSave} disabled={saveDisabled}>
          {m(
            mode === 'relate'
              ? 'Relate'
              : mode === 'observe'
                ? 'Add observation'
                : 'Save'
          )}
        </Button>
        {mode !== 'relate' && mode !== 'observe' && !text.trim() && (
          <Badge variant="outline" size="sm" className="text-muted-foreground">
            {m('name required')}
          </Badge>
        )}
      </ModalFooter>
    </Modal>
  );
}

ConditionEditor.displayName = 'ConditionEditor';

export default ConditionEditor;
