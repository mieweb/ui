'use client';

import * as React from 'react';
import { cn } from '../../utils/cn';
import { Badge } from '../Badge/Badge';
import { Button } from '../Button';
import { Input } from '../Input';
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
   * empty problem name; free text fills the problem name. Omit for manual
   * code entry only.
   */
  renderCodeSearch?: (args: {
    placeholder: string;
    onPick: (pick: ConditionCodePick) => void;
    onFreeText: (text: string) => void;
  }) => React.ReactNode;
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
function systemForCodetype(codetype: string): string {
  const ct = codetype.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (ct === 'ICD10' || ct === 'ICD10CM') return 'ICD-10-CM';
  if (ct === 'ICD11') return 'ICD-11';
  if (ct === 'SNOMED' || ct === 'SNOMEDCT') return 'SNOMED';
  return codetype;
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
  const unknown = value?.known === false;
  return (
    <span
      role="group"
      aria-label={`Certainty for ${label}`}
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
            ? 'border-amber-400 bg-amber-100 text-amber-900 dark:border-amber-600 dark:bg-amber-950 dark:text-amber-200'
            : 'border-border text-muted-foreground hover:text-foreground'
        )}
      >
        Unknown
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
              aria-label={`${label} confidence ${c}`}
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
              {c}
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
  const observations = concern?.observations;
  if (!observations?.length) return null;
  return (
    <section aria-label="Past observations" className="space-y-1">
      <h4 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
        Observations
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
  const prior = concern ? currentAssertion(concern) : undefined;

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
    setCoding(prior?.coding ?? []);
    setVerification(
      mode === 'add'
        ? 'unconfirmed'
        : (prior?.verificationStatus ?? 'confirmed')
    );
    setSeverity(prior?.severity);
    setOnsetDate(prior?.onset?.date ?? '');
    setOnsetFuzzy(prior?.onset?.fuzzy ?? '');
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

  /** A pick from the injected lookup — appends a coding row, fills an empty
   * name, and clears a contradictory "coding unknown" flag. */
  const handleCodePick = (pick: ConditionCodePick) => {
    const system = systemForCodetype(pick.codetype);
    setCoding((prev) =>
      prev.some((c) => c.system === system && c.code === pick.fullcode)
        ? prev
        : [
            ...prev,
            {
              system,
              code: pick.fullcode,
              display: pick.label,
              primary: prev.length === 0,
            },
          ]
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
    if (!text.trim()) return;
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
          : coding
              .filter((c) => c.code.trim())
              .map((c) => ({
                ...c,
                code: c.code.trim(),
                display: c.display?.trim() || undefined,
                mappedFrom: c.mappedFrom?.trim() || undefined,
              })),
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
            ? { date: onsetDate || undefined, fuzzy: onsetFuzzy || undefined }
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
        : !text.trim();

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      className={className}
    >
      <ModalHeader>
        <ModalTitle>
          {MODE_META[mode].title}
          {prior ? ` — ${prior.text}` : ''}
        </ModalTitle>
      </ModalHeader>
      <ModalBody data-testid={dataTestId}>
        <div className="space-y-4">
          {mode === 'revise' && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200"
            >
              <AlertTriangleIcon size={16} />
              <span>
                Revising marks the prior assertion <strong>refuted</strong> (it
                was never true) — history is preserved on the timeline. Use{' '}
                <em>Refine</em> instead if the prior was correct but less
                specific.
              </span>
            </div>
          )}

          {mode === 'relate' ? (
            <>
              <Select
                label="Relationship"
                options={RELATIONSHIP_OPTIONS}
                value={relType}
                onValueChange={(v) =>
                  setRelType(v as ConcernRelationship['type'])
                }
              />
              <Select
                label="Related problem"
                placeholder="Select a problem…"
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
                label="New observation"
                value={observation}
                onChange={(e) => setObservation(e.target.value)}
                placeholder="e.g. BP improving on current regimen; patient reports better sleep"
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
              {mode === 'add' && renderCodeSearch && !text.trim() ? (
                <div className="space-y-1">
                  <span className="text-foreground block text-sm font-medium">
                    Problem name
                    <span className="text-destructive ml-1" aria-hidden="true">
                      *
                    </span>
                  </span>
                  {renderCodeSearch({
                    placeholder:
                      'Search conditions — or type a name and press Enter…',
                    onPick: handleCodePick,
                    onFreeText: (t) => setText(t.trim()),
                  })}
                  <p className="text-muted-foreground text-xs">
                    Picking a code fills the name and coding together; free
                    text is fine — codes can be added any time.
                  </p>
                </div>
              ) : (
                <Input
                  label="Problem name"
                  required
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="e.g. Type 1 diabetes mellitus with neuropathy"
                />
              )}

              {mode === 'refine' && (
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={progression}
                    onChange={(e) => setProgression(e.target.checked)}
                    className="accent-primary-600 h-4 w-4"
                  />
                  Disease progressed (e.g. new complication) rather than a more
                  specific diagnosis
                </label>
              )}

              {/* Coding — progressive enrichment, never required */}
              <fieldset className="space-y-2">
                <legend className="flex w-full items-center justify-between text-sm font-medium">
                  <span className="flex items-center gap-2">
                    Coding
                    <FieldFlag
                      label="Coding"
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
                    className="h-7 text-xs"
                  >
                    Add code
                  </Button>
                </legend>
                {renderCodeSearch && !(mode === 'add' && !text.trim()) && (
                  <div className="max-w-md">
                    {renderCodeSearch({
                      placeholder: 'Search codes — ICD-10-CM / SNOMED…',
                      onPick: handleCodePick,
                      onFreeText: (t) => setText((prev) => prev || t),
                    })}
                  </div>
                )}
                {coding.length === 0 && (
                  <p className="text-muted-foreground text-xs">
                    Optional — a name-only problem is valid. Codes can be added
                    any time.
                  </p>
                )}
                {coding.map((c, i) => (
                  <div key={i} className="flex flex-wrap items-center gap-1.5">
                    <Select
                      aria-label={`Coding system ${i + 1}`}
                      options={CODING_SYSTEMS.map((s) => ({
                        value: s,
                        label: s,
                      }))}
                      value={c.system}
                      onValueChange={(v) => updateCoding(i, { system: v })}
                      disabled={codingUnknown}
                      className="w-32"
                    />
                    <Input
                      aria-label={`Code ${i + 1}`}
                      value={c.code}
                      onChange={(e) =>
                        updateCoding(i, { code: e.target.value })
                      }
                      placeholder="Code"
                      disabled={codingUnknown}
                      className="w-28 font-mono"
                    />
                    <Input
                      aria-label={`Display ${i + 1}`}
                      value={c.display ?? ''}
                      onChange={(e) =>
                        updateCoding(i, { display: e.target.value })
                      }
                      placeholder="Display"
                      disabled={codingUnknown}
                      className="min-w-32 flex-1"
                    />
                    <label className="flex items-center gap-1 text-xs">
                      <input
                        type="radio"
                        name="primary-coding"
                        checked={Boolean(c.primary)}
                        disabled={codingUnknown}
                        onChange={() =>
                          setCoding((prev) =>
                            prev.map((cc, j) => ({ ...cc, primary: j === i }))
                          )
                        }
                        className="accent-primary-600"
                      />
                      primary
                    </label>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove code ${i + 1}`}
                      onClick={() =>
                        setCoding((prev) => prev.filter((_, j) => j !== i))
                      }
                      className="h-7 w-7"
                    >
                      <TrashIcon size={14} />
                    </Button>
                  </div>
                ))}
              </fieldset>

              <Select
                label="Verification status"
                options={VERIFICATION_OPTIONS}
                value={verification}
                onValueChange={(v) => setVerification(v as VerificationStatus)}
              />

              {/* Severity with three-state affordance */}
              <div className="space-y-1">
                <span className="flex items-center gap-2 text-sm font-medium">
                  Severity
                  <FieldFlag
                    label="Severity"
                    value={fields.severity}
                    onChange={setField('severity')}
                    hasValue={Boolean(severity)}
                  />
                </span>
                <div
                  role="group"
                  aria-label="Severity"
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
                          'border-border border-l px-2.5 py-1 text-xs font-medium capitalize transition-colors first:border-l-0',
                          'disabled:opacity-40',
                          active
                            ? 'bg-primary-600 text-white'
                            : 'bg-background text-muted-foreground hover:text-foreground'
                        )}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Fuzzy onset — exact date OR human string */}
              <div className="space-y-1">
                <span className="flex items-center gap-2 text-sm font-medium">
                  Onset
                  <FieldFlag
                    label="Onset"
                    value={fields.onset}
                    onChange={setField('onset')}
                    hasValue={Boolean(onsetDate || onsetFuzzy)}
                  />
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Input
                    type="date"
                    aria-label="Onset date (exact)"
                    value={onsetDate}
                    onChange={(e) => setOnsetDate(e.target.value)}
                    disabled={fields.onset?.known === false}
                    className="w-40"
                  />
                  <span className="text-muted-foreground text-xs">or</span>
                  <Input
                    aria-label="Onset (fuzzy)"
                    value={onsetFuzzy}
                    onChange={(e) => setOnsetFuzzy(e.target.value)}
                    disabled={fields.onset?.known === false}
                    placeholder={
                      'Fuzzy — "since her twenties", "~3 months ago"'
                    }
                    className="min-w-48 flex-1"
                  />
                </div>
              </div>

              <Textarea
                label="Note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. patient thinks it started after the fall, not sure"
                rows={2}
              />

              {Object.keys(fields).length > 0 && (
                <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
                  <HelpCircleIcon size={12} />
                  <span>
                    Uncertainty recorded:{' '}
                    {Object.entries(fields)
                      .map(([k, f]) =>
                        f?.known === false
                          ? `${k} unknown`
                          : `${k} ${f?.confidence ?? 'soft'}`
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
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saveDisabled}>
          {mode === 'relate'
            ? 'Relate'
            : mode === 'observe'
              ? 'Add observation'
              : 'Save'}
        </Button>
        {mode !== 'relate' && mode !== 'observe' && !text.trim() && (
          <Badge variant="outline" size="sm" className="text-muted-foreground">
            name required
          </Badge>
        )}
      </ModalFooter>
    </Modal>
  );
}

ConditionEditor.displayName = 'ConditionEditor';

export default ConditionEditor;
