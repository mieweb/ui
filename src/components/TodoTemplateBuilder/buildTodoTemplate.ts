/**
 * Configuration describing a single todo template line.
 */
export interface TodoTemplateConfig {
  /** Todo title (required). Rendered as a quoted string. */
  title: string;
  /** Numeric offset value, e.g. `"1"`. */
  offsetValue?: string;
  /** Offset unit, e.g. `"Day"`, `"Week"`, or `"Month"`. */
  offsetUnit?: string;
  /** Anchor date key the offset is calculated from. */
  anchor?: string;
  /** Required document type code, or `"none"` for no document. */
  documentType?: string;
  /** Whether a recurrence rule is included. */
  hasRecurrence?: boolean;
  /** RRULE frequency: `DAILY`, `WEEKLY`, `MONTHLY`, or `YEARLY`. */
  rruleFreq?: string;
  /** RRULE interval (repeat every N units). */
  rruleInterval?: string;
  /** RRULE total occurrence count. Omit for infinite repetition. */
  rruleCount?: string;
}

/**
 * Serializes a {@link TodoTemplateConfig} into a single todo template line of
 * the form: `"Title"; offset=1 Week; anchor=caseCreation; docType=X; rrule=...`.
 * Only sections with values are emitted.
 */
export function buildTodoTemplate(config: TodoTemplateConfig): string {
  const {
    title,
    offsetValue,
    offsetUnit,
    anchor,
    documentType,
    hasRecurrence,
    rruleFreq = 'WEEKLY',
    rruleInterval,
    rruleCount,
  } = config;

  let template = `"${title}"`;

  if (offsetValue && offsetUnit) {
    template += `; offset=${offsetValue} ${offsetUnit}`;
  }

  if (anchor) {
    template += `; anchor=${anchor}`;
  }

  if (documentType && documentType !== 'none') {
    template += `; docType=${documentType}`;
  }

  if (hasRecurrence) {
    let rrule = `FREQ=${rruleFreq}`;
    if (rruleInterval) {
      rrule += `;INTERVAL=${rruleInterval}`;
    }
    if (rruleCount) {
      rrule += `;COUNT=${rruleCount}`;
    }
    template += `; rrule=${rrule}`;
  }

  return template;
}
