'use client';

import * as React from 'react';
import { useMessages, type MessageTranslator } from '../../utils/messages';
import { cn } from '../../utils/cn';
import { Badge } from '../Badge/Badge';
import { Button } from '../Button';
import { AlertTriangleIcon, CheckIcon, MinusIcon, XIcon } from '../Icons';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../Table';
import {
  MATCH_FIELDS,
  parsePharmacyIdentifier,
  type FieldOutcome,
  type MatchField,
  type MatchScore,
} from './scoring';
import {
  FIELD_LABELS,
  OUTCOME_LABELS,
  REASON_LABELS,
  WARNING_LABELS,
} from './labels';
import type { MedHistoryRecord, PharmacyRef } from './types';

/** Resolved pharmacy names keyed by pharmId. */
export type PharmacyNames = ReadonlyMap<string, string>;

const OUTCOME_VARIANT: Record<
  FieldOutcome,
  'success' | 'warning' | 'danger' | 'secondary'
> = {
  agree: 'success',
  partial: 'warning',
  differ: 'danger',
  missing: 'secondary',
};

/** Pharmacy identifiers from the record, then `medication.pharmacyId`. */
export function recordPharmacy(record: MedHistoryRecord): PharmacyRef {
  return {
    ...parsePharmacyIdentifier(record.medication.pharmacyId),
    ...parsePharmacyIdentifier(record.pharmacy),
  };
}

/** The pharmId to look a pharmacy's name up by, when only ids are known. */
export function pharmacyLookupId(record: MedHistoryRecord): string | undefined {
  const pharmacy = recordPharmacy(record);
  if (pharmacy.name) return undefined;
  if (pharmacy.ncpdpid) return pharmacy.ncpdpid;
  return pharmacy.npi ? `N${pharmacy.npi}` : undefined;
}

export function formatIsoDate(iso: string | undefined): string | undefined {
  if (!iso) return undefined;
  const time = Date.parse(`${iso.slice(0, 10)}T00:00:00Z`);
  return Number.isNaN(time)
    ? iso
    : new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeZone: 'UTC',
      }).format(time);
}

function pharmacyText(
  record: MedHistoryRecord,
  names: PharmacyNames,
  m: MessageTranslator
): string | undefined {
  const pharmacy = recordPharmacy(record);
  const lookupId = pharmacyLookupId(record);
  const resolved = lookupId ? names.get(lookupId) : undefined;
  if (pharmacy.name ?? resolved) return pharmacy.name ?? resolved;
  if (pharmacy.ncpdpid) return m('NCPDP {id}', { id: pharmacy.ncpdpid });
  return pharmacy.npi ? m('NPI {id}', { id: pharmacy.npi }) : undefined;
}

function prescriberText(record: MedHistoryRecord): string | undefined {
  const structured = record.prescriber;
  const name =
    record.medication.prescriber ??
    ([structured?.firstName, structured?.lastName].filter(Boolean).join(' ') ||
      undefined);
  return name ?? (structured?.npi ? `NPI ${structured.npi}` : undefined);
}

/** Display text for one compared field, or `undefined` when missing. */
export function fieldText(
  record: MedHistoryRecord,
  field: MatchField,
  names: PharmacyNames,
  m: MessageTranslator
): string | undefined {
  const med = record.medication;
  switch (field) {
    case 'identity':
      return med.name;
    case 'strengthForm':
      return (
        [med.strength, med.doseForm].filter(Boolean).join(' ') || undefined
      );
    case 'sig':
      return med.patientSig ?? med.sig;
    case 'date': {
      const start = formatIsoDate(med.startDate);
      const filled = formatIsoDate(record.dispensedDate);
      return (
        [
          start && m('Started {date}', { date: start }),
          filled && m('Filled {date}', { date: filled }),
        ]
          .filter(Boolean)
          .join(' · ') || undefined
      );
    }
    case 'prescriber':
      return prescriberText(record);
    case 'pharmacy':
      return pharmacyText(record, names, m);
    case 'quantity':
      return med.quantity
        ? [med.quantity, med.quantityUnit].filter(Boolean).join(' ')
        : undefined;
  }
}

/** Score as a whole percentage, e.g. 0.965 → "97%". */
export function formatPercent(value: number): string {
  return new Intl.NumberFormat(undefined, {
    style: 'percent',
    maximumFractionDigits: 0,
  }).format(value);
}

function Missing() {
  const m = useMessages();
  return (
    <span className="text-muted-foreground italic">{m('Not recorded')}</span>
  );
}

/** One chart record compared with the incoming record. */
export interface ComparisonCandidate {
  chart: MedHistoryRecord;
  match: MatchScore;
  /** Row label, e.g. "On chart" or "Chart A". */
  label: string;
  /** Second line under the label, e.g. the score. */
  detail?: string;
}

export interface FieldComparisonProps {
  incoming: MedHistoryRecord;
  candidates: ComparisonCandidate[];
  pharmacyNames: PharmacyNames;
  caption: string;
  /** `stack`: field-by-field pairs for narrow containers (default `table`). */
  layout?: 'table' | 'stack';
}

const OUTCOME_ICON: Record<FieldOutcome, typeof CheckIcon> = {
  agree: CheckIcon,
  partial: AlertTriangleIcon,
  differ: XIcon,
  missing: MinusIcon,
};

/** Tint and start-edge bar for cells that don't match. */
const OUTCOME_CELL: Record<FieldOutcome, string | undefined> = {
  agree: undefined,
  partial: 'border-s-4 border-s-yellow-500 bg-yellow-50 dark:bg-yellow-950',
  differ: 'border-s-4 border-s-red-500 bg-red-50 dark:bg-red-950',
  missing: undefined,
};

function fieldResult(match: MatchScore, field: MatchField) {
  return match.fields.find((f) => f.field === field);
}

function OutcomeBadge({
  match,
  field,
  candidateLabel,
}: {
  match: MatchScore;
  field: MatchField;
  /** Names the chart record when the incoming value is compared with several. */
  candidateLabel?: string;
}) {
  const m = useMessages();
  const result = fieldResult(match, field);
  const outcome = result?.outcome ?? 'missing';
  const Icon = OUTCOME_ICON[outcome];
  const label = m(OUTCOME_LABELS[outcome]);
  return (
    <span className="mt-1 flex flex-wrap items-center gap-1 text-xs">
      <Badge
        variant={OUTCOME_VARIANT[outcome]}
        size="sm"
        icon={<Icon aria-hidden="true" className="h-3 w-3" />}
      >
        {candidateLabel
          ? m('{candidate}: {outcome}', {
              candidate: candidateLabel,
              outcome: label,
            })
          : label}
      </Badge>
      {result && result.reason !== 'missing' && (
        <span className="text-muted-foreground">
          {m(REASON_LABELS[result.reason])}
        </span>
      )}
    </span>
  );
}

function Value({ text }: { text: string | undefined }) {
  return text ? <bdi>{text}</bdi> : <Missing />;
}

/**
 * Fields as rows; each chart candidate, then the incoming record, as columns.
 * Chart values are the reference; the incoming value carries the match
 * markings. By default only fields that differ (plus the medication) are
 * shown; the rest are summarized behind "Show N matching fields".
 */
export function FieldComparison({
  incoming,
  candidates,
  pharmacyNames,
  caption,
  layout = 'table',
}: FieldComparisonProps) {
  const m = useMessages();
  const tableId = React.useId();
  const [showAll, setShowAll] = React.useState(false);
  const matching = MATCH_FIELDS.filter(
    (field) =>
      field !== 'identity' &&
      candidates.every(
        (c) =>
          !c.match.dismissedBy &&
          fieldResult(c.match, field)?.outcome === 'agree'
      )
  );
  const shown = showAll
    ? MATCH_FIELDS
    : MATCH_FIELDS.filter((field) => !matching.includes(field));

  // Dismissed candidates aren't duplicates, so they don't mark the incoming value.
  const scored = candidates.filter((c) => !c.match.dismissedBy);
  const labelBadges = scored.length > 1;

  const worstOutcome = (field: MatchField): FieldOutcome | undefined => {
    const outcomes = scored.map(
      (c) => fieldResult(c.match, field)?.outcome ?? 'missing'
    );
    if (outcomes.includes('differ')) return 'differ';
    if (outcomes.includes('partial')) return 'partial';
    return outcomes.includes('agree') ? 'agree' : outcomes[0];
  };

  const incomingValue = (field: MatchField) => (
    <>
      <Value text={fieldText(incoming, field, pharmacyNames, m)} />
      {scored.map((candidate) => (
        <OutcomeBadge
          key={candidate.chart.id}
          match={candidate.match}
          field={field}
          candidateLabel={labelBadges ? candidate.label : undefined}
        />
      ))}
    </>
  );

  const stack = (
    <dl
      id={tableId}
      aria-label={caption}
      className="divide-border border-border divide-y rounded-lg border"
    >
      {shown.map((field) => {
        const worst = worstOutcome(field);
        return (
          <div
            key={field}
            data-outcome={worst}
            className={cn('space-y-1 px-3 py-2', worst && OUTCOME_CELL[worst])}
          >
            <dt className="text-muted-foreground text-xs font-medium">
              {m(FIELD_LABELS[field])}
            </dt>
            <dd className="grid grid-cols-[5rem_minmax(0,1fr)] gap-x-2 gap-y-1 text-sm">
              {candidates.map((candidate) => (
                <React.Fragment key={candidate.chart.id}>
                  <span className="text-muted-foreground text-xs">
                    {candidate.label}
                  </span>
                  <span className="break-words">
                    <Value
                      text={fieldText(candidate.chart, field, pharmacyNames, m)}
                    />
                  </span>
                </React.Fragment>
              ))}
              <span className="text-muted-foreground text-xs">
                {m('Incoming')}
              </span>
              <span className="break-words">{incomingValue(field)}</span>
            </dd>
          </div>
        );
      })}
    </dl>
  );

  return (
    <div className="space-y-1">
      {layout === 'stack' ? (
        stack
      ) : (
        <div className="overflow-x-auto">
          <Table id={tableId} responsive={false} className="table-fixed">
            <TableCaption className="sr-only">{caption}</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead scope="col" className="w-36">
                  {m('Field')}
                </TableHead>
                {candidates.map((candidate) => (
                  <TableHead key={candidate.chart.id} scope="col">
                    {candidate.label}
                    {candidate.detail && (
                      <span className="ms-1 text-xs font-normal">
                        {candidate.detail}
                      </span>
                    )}
                  </TableHead>
                ))}
                <TableHead scope="col">{m('Incoming')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shown.map((field) => {
                const worst = worstOutcome(field);
                return (
                  <TableRow key={field}>
                    <TableHead
                      scope="row"
                      className="py-2 align-top font-medium"
                    >
                      {m(FIELD_LABELS[field])}
                    </TableHead>
                    {candidates.map((candidate) => (
                      <TableCell
                        key={candidate.chart.id}
                        className="px-3 py-2 align-top break-words"
                      >
                        <Value
                          text={fieldText(
                            candidate.chart,
                            field,
                            pharmacyNames,
                            m
                          )}
                        />
                      </TableCell>
                    ))}
                    <TableCell
                      data-outcome={worst}
                      className={cn(
                        'px-3 py-2 align-top break-words',
                        worst && OUTCOME_CELL[worst]
                      )}
                    >
                      {incomingValue(field)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
      {matching.length > 0 && (
        <Button
          variant="link"
          size="sm"
          className="px-2"
          aria-expanded={showAll}
          aria-controls={tableId}
          onClick={() => setShowAll((v) => !v)}
        >
          {showAll
            ? m('Hide matching fields')
            : m('Show {count} matching fields', { count: matching.length })}
        </Button>
      )}
    </div>
  );
}

/** Field list for an incoming record with no chart match. */
export function RecordDetails({
  record,
  pharmacyNames,
}: {
  record: MedHistoryRecord;
  pharmacyNames: PharmacyNames;
}) {
  const m = useMessages();
  const rows = MATCH_FIELDS.filter((f) => f !== 'identity')
    .map((field) => ({
      field,
      text: fieldText(record, field, pharmacyNames, m),
    }))
    .filter((row) => row.text);
  if (rows.length === 0) return null;
  return (
    <dl className="grid grid-cols-1 gap-x-4 gap-y-1 text-sm sm:grid-cols-[auto_1fr]">
      {rows.map(({ field, text }) => (
        <React.Fragment key={field}>
          <dt className="text-muted-foreground">{m(FIELD_LABELS[field])}</dt>
          <dd className="break-words">
            <bdi>{text}</bdi>
          </dd>
        </React.Fragment>
      ))}
    </dl>
  );
}

/** Whether the record has no drug code and no uncoded type — maybe a supply. */
export function isPossibleSupply(record: MedHistoryRecord): boolean {
  if (record.medication.uncodedType) return false;
  const codes =
    record.codes ?? (record.medication.code ? [record.medication.code] : []);
  return !codes.some((c) =>
    ['FDB', 'RXNORM'].includes(c.system.trim().toUpperCase())
  );
}

/** Source, import warnings, and the possible-supply hint. */
export function RecordBadges({ record }: { record: MedHistoryRecord }) {
  const m = useMessages();
  const warnings = record.warnings ?? [];
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {record.source && (
        <Badge variant="secondary" size="sm">
          {m('From {source}', { source: record.source.label })}
        </Badge>
      )}
      {warnings.map((warning, index) => (
        <Badge key={`${warning.code}-${index}`} variant="warning" size="sm">
          {warning.message ??
            (warning.code in WARNING_LABELS
              ? m(WARNING_LABELS[warning.code as keyof typeof WARNING_LABELS])
              : warning.code)}
        </Badge>
      ))}
      {isPossibleSupply(record) && (
        <Badge variant="outline" size="sm">
          {m('No drug code — may be a supply')}
        </Badge>
      )}
    </div>
  );
}
