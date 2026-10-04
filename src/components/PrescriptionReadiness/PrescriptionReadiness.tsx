'use client';

import * as React from 'react';
import { DateTime } from 'luxon';
import { AlertCircle, CheckCircle2, Clock, Send } from 'lucide-react';
import { cn } from '../../utils/cn';
import { validatePrescription } from '../../prescribing/validate';
import type {
  PrescriptionDetails,
  PrescriptionIssue,
  PrescriptionReadiness,
  PrescribingConfiguration,
} from '../../prescribing/types';
import { Badge } from '../Badge/Badge';
import { Button } from '../Button';

export type PrescriptionValidationOptions = PrescribingConfiguration;
export type PrescriptionReadinessState =
  | 'incomplete'
  | 'invalid'
  | 'unknown'
  | 'blocked'
  | 'complete'
  | 'review'
  | 'send'
  | 'sending'
  | 'sent'
  | 'failed';
export interface PrescriptionReadinessLabels {
  incomplete: string;
  invalid: string;
  unknown: string;
  blocked: string;
  complete: string;
  review: string;
  send: string;
  sending: string;
  sent: string;
  failed: string;
  simulation: string;
  reasons: string;
  noIssues: string;
  completeAction: string;
  resolveAction: string;
  readOnly: string;
}
export const prescriptionReadinessLabels: PrescriptionReadinessLabels = {
  incomplete: 'Needs prescription details',
  invalid: 'Prescription needs correction',
  unknown: 'Readiness not checked',
  blocked: 'Prescribing blocked',
  complete: 'Details complete',
  review: 'Ready for prescriber review',
  send: 'Ready to send',
  sending: 'Sending',
  sent: 'Sent',
  failed: 'Send failed',
  simulation: 'Simulation',
  reasons: 'Prescription issues',
  noIssues: 'No unresolved prescription issues.',
  completeAction: 'Complete prescription',
  resolveAction: 'Resolve issue',
  readOnly: 'An authorized team member can complete this prescription.',
};
export interface PrescriptionReadinessProps {
  readiness?: PrescriptionReadiness;
  medicationName?: string;
  expectedOrderId?: string;
  expectedOrderRevision?: string;
  expectedContextRevision?: string;
  expectedPolicyVersion?: string;
  labels?: Partial<PrescriptionReadinessLabels>;
  className?: string;
  /** Fixed ISO clock for simulation/tests; omit to expire workflow labels in real time. */
  now?: string;
}

/** Timestamp validation never lets Luxon fill an implicit date or timezone. */
function prescriptionTimestamp(value: string): DateTime | null {
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(
      value
    )
  )
    return null;
  const parsed = DateTime.fromISO(value, { zone: 'utc' });
  return parsed.isValid ? parsed : null;
}

/** The nearest future expiry lets aggregate views rearm after each result expires. */
export function nextPrescriptionExpiry(
  results: Iterable<PrescriptionReadiness | undefined>,
  now?: string
): string | undefined {
  const clock = now === undefined ? DateTime.utc() : prescriptionTimestamp(now);
  if (!clock) return undefined;
  let earliest: { value: string; milliseconds: number } | undefined;
  for (const result of results) {
    const value = result?.workflow?.expiresAt;
    const expiry = value ? prescriptionTimestamp(value) : null;
    if (
      expiry &&
      expiry.toMillis() > clock.toMillis() &&
      (!earliest || expiry.toMillis() < earliest.milliseconds)
    )
      earliest = { value: value!, milliseconds: expiry.toMillis() };
  }
  return earliest?.value;
}

/** Refresh at expiry without an API response, including deadlines beyond timer limits. */
export function usePrescriptionClock(
  expiresAt?: string | null,
  now?: string
): string {
  const [, refresh] = React.useReducer((value: number) => value + 1, 0);
  React.useEffect(() => {
    if (now !== undefined || !expiresAt) return;
    const expiry = prescriptionTimestamp(expiresAt);
    if (!expiry || expiry.toMillis() <= DateTime.utc().toMillis()) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      const remaining = expiry.toMillis() - DateTime.utc().toMillis();
      timer = setTimeout(
        () => {
          if (cancelled) return;
          if (expiry.toMillis() > DateTime.utc().toMillis()) schedule();
          else refresh();
        },
        Math.max(1, Math.min(2147483647, remaining + 1))
      );
    };
    schedule();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [expiresAt, now]);
  return now ?? DateTime.utc().toISO()!;
}

/** Reject a display result from another instance/revision/context/profile. */
export function isPrescriptionValidationCurrent(
  props: PrescriptionReadinessProps
): boolean {
  const {
    readiness,
    expectedOrderId,
    expectedOrderRevision,
    expectedContextRevision,
    expectedPolicyVersion,
  } = props;
  if (!readiness || !expectedOrderId || !expectedOrderRevision) return false;
  const result = readiness.validation;
  return (
    result.orderId === expectedOrderId &&
    result.orderRevision === expectedOrderRevision &&
    (!expectedContextRevision ||
      result.contextRevision === expectedContextRevision) &&
    (!expectedPolicyVersion || result.policyVersion === expectedPolicyVersion)
  );
}
export function isPrescriptionReadinessCurrent(
  props: PrescriptionReadinessProps
): boolean {
  if (!isPrescriptionValidationCurrent(props)) return false;
  const clock =
    props.now === undefined ? DateTime.utc() : prescriptionTimestamp(props.now);
  if (!clock) return false;
  const workflow = props.readiness?.workflow;
  if (!workflow) return true;
  if (workflow.validity !== 'current') return false;
  if (workflow.expiresAt !== null) {
    const expiry = prescriptionTimestamp(workflow.expiresAt);
    if (!expiry || expiry.toMillis() <= clock.toMillis()) return false;
  }
  return true;
}

export function getPrescriptionReadinessState(
  props: PrescriptionReadinessProps
): PrescriptionReadinessState {
  const { readiness } = props;
  if (!readiness || !isPrescriptionValidationCurrent(props)) return 'unknown';
  if (readiness.source !== 'client-preview') {
    if (readiness.delivery === 'sent') return 'sent';
    if (readiness.delivery === 'sending') return 'sending';
    if (readiness.delivery === 'failed') return 'failed';
  }
  if (!isPrescriptionReadinessCurrent(props)) return 'unknown';
  if (readiness.validation.dataState === 'invalid') return 'invalid';
  if (readiness.validation.dataState === 'incomplete') return 'incomplete';
  const workflow = readiness.workflow;
  if (
    workflow?.gates.review === 'fail' ||
    readiness.validation.checks.review === 'fail'
  )
    return 'blocked';
  if (readiness.validation.dataState === 'unknown') return 'unknown';
  if (readiness.source !== 'client-preview' && workflow) {
    if (workflow.gates.transmit === 'pass' && readiness.signing === 'signed')
      return 'send';
    if (workflow.gates.review === 'pass') return 'review';
    return 'unknown';
  }
  return 'complete';
}

/** Immediate previews run the same pure function a TypeScript EHR imports. */
export function createPrescriptionPreview(
  details: PrescriptionDetails,
  configuration?: PrescribingConfiguration,
  hostReadiness?: PrescriptionReadiness,
  now?: string
): PrescriptionReadiness | undefined {
  if (!configuration) return hostReadiness;
  const { input, policy } = configuration;
  if (
    hostReadiness &&
    isPrescriptionValidationCurrent({
      readiness: hostReadiness,
      now,
      expectedOrderId: input.orderId,
      expectedOrderRevision: input.orderRevision,
      expectedContextRevision: input.context.revision,
      expectedPolicyVersion: policy.version,
    })
  )
    return hostReadiness;
  const patient = input.context.patient;
  const prescriber = input.context.prescriber;
  return {
    validation: validatePrescription(
      {
        ...input,
        draft: {
          id: input.orderId,
          contentRevision: input.orderRevision,
          patientId:
            configuration.references?.patientId ??
            (patient?.state === 'known'
              ? patient.value.id
              : 'unresolved-patient'),
          prescriberId:
            configuration.references?.prescriberId ??
            (prescriber?.state === 'known'
              ? prescriber.value.id
              : 'unresolved-prescriber'),
          pharmacyId:
            details.pharmacyId ??
            (input.context.pharmacy?.state === 'known'
              ? input.context.pharmacy.value.id
              : undefined),
          display: details.name ?? '',
          intent: 'prescribe',
          prescription: details,
        },
      },
      policy
    ),
    source: 'client-preview',
    workflow: null,
    signing: 'not-signed',
    delivery: 'not-sent',
  };
}
export function usePrescriptionPreview(
  details: PrescriptionDetails,
  configuration?: PrescribingConfiguration,
  hostReadiness?: PrescriptionReadiness,
  now?: string
): PrescriptionReadiness | undefined {
  return React.useMemo(
    () => createPrescriptionPreview(details, configuration, hostReadiness, now),
    [details, configuration, hostReadiness, now]
  );
}

export const PrescriptionReadinessBadge = React.forwardRef<
  HTMLSpanElement,
  PrescriptionReadinessProps &
    Omit<React.HTMLAttributes<HTMLSpanElement>, 'className'>
>((props, ref) => {
  const {
    readiness,
    medicationName,
    expectedOrderId,
    expectedOrderRevision,
    expectedContextRevision,
    expectedPolicyVersion,
    labels: overrides,
    className,
    now,
    ...rest
  } = props;
  const labels = { ...prescriptionReadinessLabels, ...overrides };
  const clock = usePrescriptionClock(readiness?.workflow?.expiresAt, now);
  const state = getPrescriptionReadinessState({
    now: clock,
    readiness,
    expectedOrderId,
    expectedOrderRevision,
    expectedContextRevision,
    expectedPolicyVersion,
  });
  const Icon = ['complete', 'review', 'send', 'sent'].includes(state)
    ? CheckCircle2
    : state === 'sending'
      ? Send
      : state === 'unknown'
        ? Clock
        : AlertCircle;
  const variant = ['complete', 'review', 'send', 'sent'].includes(state)
    ? 'success'
    : ['invalid', 'blocked', 'failed'].includes(state)
      ? 'danger'
      : 'warning';
  return (
    <span
      ref={ref}
      aria-label={
        medicationName ? `${medicationName}: ${labels[state]}` : undefined
      }
      data-slot="prescription-readiness"
      className={cn('inline-flex flex-wrap items-center gap-1', className)}
      {...rest}
    >
      <Badge variant={variant} size="sm">
        <Icon size={12} aria-hidden="true" />
        <span>{labels[state]}</span>
      </Badge>
      {readiness?.source === 'simulated-server' && (
        <Badge variant="secondary" size="sm">
          {labels.simulation}
        </Badge>
      )}
    </span>
  );
});
PrescriptionReadinessBadge.displayName = 'PrescriptionReadinessBadge';

export interface PrescriptionIssueSummaryProps extends PrescriptionReadinessProps {
  onCompletePrescription?: (issue?: PrescriptionIssue) => void;
  onIssueAction?: (issue: PrescriptionIssue) => void;
  readOnly?: boolean;
  /** Expanded editor summary; compact rows use a keyboard-operable disclosure. */
  collapsible?: boolean;
}
export const PrescriptionIssueSummary = React.forwardRef<
  HTMLDivElement,
  PrescriptionIssueSummaryProps
>((props, ref) => {
  const {
    readiness,
    medicationName = 'Medication',
    onCompletePrescription,
    onIssueAction,
    readOnly = false,
    collapsible = false,
    labels: overrides,
    className,
  } = props;
  const labels = { ...prescriptionReadinessLabels, ...overrides };
  const clock = usePrescriptionClock(readiness?.workflow?.expiresAt, props.now);
  const currentProps = { ...props, now: clock };
  const current = isPrescriptionReadinessCurrent(currentProps);
  const validationCurrent = isPrescriptionValidationCurrent(currentProps);
  // Known local issues remain useful even when a workflow projection expires.
  const issues = [
    ...(validationCurrent ? (readiness?.validation.issues ?? []) : []),
    ...(current ? (readiness?.workflow?.issues ?? []) : []),
  ].filter(
    (issue, index, all) =>
      all.findIndex(
        (other) =>
          other.code === issue.code && other.fieldPath === issue.fieldPath
      ) === index
  );
  const content = (
    <>
      {issues.length ? (
        <ul className="list-disc space-y-1 pl-5 text-sm">
          {issues.map((issue) => (
            <li key={`${issue.code}:${issue.fieldPath ?? ''}`}>
              <span>{issue.message}</span>
              {!readOnly && onIssueAction && (
                <Button
                  type="button"
                  size="sm"
                  variant="link"
                  onClick={() => onIssueAction(issue)}
                  aria-label={`${labels.resolveAction}: ${issue.message}`}
                >
                  {labels.resolveAction}
                </Button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground text-sm">
          {current ? labels.noIssues : labels.unknown}
        </p>
      )}
      {!readOnly &&
        onCompletePrescription &&
        !['sent', 'sending'].includes(
          getPrescriptionReadinessState(currentProps)
        ) && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label={`${labels.completeAction}: ${medicationName}`}
            onClick={() =>
              onCompletePrescription(
                issues.find(
                  (issue) => issue.remediation === 'edit-prescription'
                )
              )
            }
          >
            {labels.completeAction}
          </Button>
        )}
      {readOnly && issues.length > 0 && (
        <p className="text-muted-foreground text-xs">{labels.readOnly}</p>
      )}
    </>
  );
  return (
    <div
      ref={ref}
      data-slot="prescription-issue-summary"
      className={cn('space-y-2', className)}
    >
      {collapsible ? (
        <details>
          <summary className="focus-visible:ring-ring cursor-pointer rounded focus-visible:ring-2">
            <PrescriptionReadinessBadge
              readiness={readiness}
              medicationName={medicationName}
              expectedOrderId={props.expectedOrderId}
              expectedOrderRevision={props.expectedOrderRevision}
              expectedContextRevision={props.expectedContextRevision}
              expectedPolicyVersion={props.expectedPolicyVersion}
              labels={overrides}
              now={clock}
            />{' '}
            <span className="sr-only">
              {labels.reasons}: {medicationName}
            </span>
          </summary>
          <div className="mt-2 space-y-2">{content}</div>
        </details>
      ) : (
        <>
          <div role="status" aria-live="polite">
            <PrescriptionReadinessBadge
              readiness={readiness}
              medicationName={medicationName}
              expectedOrderId={props.expectedOrderId}
              expectedOrderRevision={props.expectedOrderRevision}
              expectedContextRevision={props.expectedContextRevision}
              expectedPolicyVersion={props.expectedPolicyVersion}
              labels={overrides}
              now={clock}
            />
          </div>
          {content}
        </>
      )}
    </div>
  );
});
PrescriptionIssueSummary.displayName = 'PrescriptionIssueSummary';
