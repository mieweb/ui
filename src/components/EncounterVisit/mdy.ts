import type { FieldResponse } from '@esheet/core';
import { fieldDisplay } from '@mieweb/templit';
import {
  createMdyDocumentEngine,
  hasNativeDocumentValue,
  type MdyDocumentDiagnostic,
  type MdyDocumentField,
  type ParsedMdyDocument,
} from '../RichTextEsheet/documentMdy';
import {
  getEncounterFieldId,
  getEncounterFormSections,
  getEncounterSectionFieldIds,
} from './definition';
import {
  encounterFormFromLegacy,
  validateEncounterDefinition,
  type EncounterVisitDefinition,
} from './legacy';
import type {
  EncounterObservation,
  EncounterResponses,
  EncounterVisitSnapshot,
} from './types';

/** Authored prose is a native answer; it is excluded from its own MDY response layer. */
export const ENCOUNTER_DOCUMENT_FIELD_ID = '__encounter_document__';

type MdySnapshot = Pick<
  EncounterVisitSnapshot,
  'form' | 'responses' | 'observations'
>;

export type EncounterMdyField = MdyDocumentField;

export type EncounterMdyDiagnostic = MdyDocumentDiagnostic;

export type ParsedEncounterMdy = ParsedMdyDocument & {
  definition?: EncounterVisitDefinition;
};

function unitDisplay(unit?: string): string | undefined {
  return unit === 'Cel'
    ? '°C'
    : unit === 'mm[Hg]'
      ? 'mmHg'
      : unit === '{score}'
        ? '/10'
        : unit;
}

function observationDisplay(observation: EncounterObservation): string {
  const unit = unitDisplay(observation.unit);
  return `${observation.value}${unit ? ` ${unit}` : ''}`;
}

function groupedDisplay(
  observations: EncounterObservation[],
  showReadingId: boolean
): string {
  const groups = new Map<string, EncounterObservation[]>();
  for (const observation of observations) {
    const key = observation.groupId ?? '';
    const group = groups.get(key) ?? [];
    group.push(observation);
    groups.set(key, group);
  }
  return Array.from(groups, ([groupId, values]) => {
    const first = values[0];
    const metadata = [
      showReadingId ? groupId : undefined,
      first.recordedAt,
      first.position,
      first.site,
    ].filter(Boolean);
    const summary = values
      .map((value) => `${value.label}: ${observationDisplay(value)}`)
      .join('\n');
    return metadata.length ? `${summary} (${metadata.join('; ')})` : summary;
  }).join('\n\n');
}

/** One link projection per native field, including empty memory aids. */
export function getEncounterMdyFields(
  snapshot: MdySnapshot
): EncounterMdyField[] {
  return engine.fields(snapshot);
}

/** A legacy encounterDefinition is a one-time import, never written back (mieweb/ui#772). */
function readMdyDefinition(
  parsed: ParsedMdyDocument
): EncounterVisitDefinition | undefined {
  const raw = parsed.frontMatter?.encounterDefinition;
  if (raw === undefined) return undefined;
  try {
    validateEncounterDefinition(raw as EncounterVisitDefinition);
    return raw as EncounterVisitDefinition;
  } catch {
    parsed.diagnostics.push({
      severity: 'error',
      code: 'definition',
      message: 'Front matter contains an invalid encounterDefinition.',
    });
    return undefined;
  }
}

const engine = createMdyDocumentEngine<MdySnapshot>({
  documentFieldId: ENCOUNTER_DOCUMENT_FIELD_ID,
  linkPrefix: 'visit',
  engineName: 'encounter-mdy-document',
  missingFrontMatterMessage:
    'An encounter MDY document requires YAML front matter.',
  sourceDataProperties: [
    'id',
    'label',
    'type',
    'unit',
    'code',
    'options',
    'required',
    'encounterHideLabel',
    'findings',
    'encounterFindings',
    'encounterRequireCoding',
    'encounterDate',
    'encounterKind',
    'encounterSectionRequired',
  ],
  projectField: ({ field }, snapshot) => {
    // Views are recomputed from the live form: callers may mutate a form
    // in place between operations, so nothing is cached across calls.
    const section = getEncounterFormSections(snapshot.form).find((candidate) =>
      getEncounterSectionFieldIds(candidate).includes(field.id)
    );
    if (!section) return undefined;
    const fieldId = field.id;
    const observations = snapshot.observations.filter(
      (observation) => observation.fieldId === fieldId
    );
    const observationDefinition = section.observations?.find(
      (observation) =>
        getEncounterFieldId(section.id, observation.id) === fieldId
    );
    const narrative = fieldId === getEncounterFieldId(section.id);
    const label = narrative
      ? section.kind === 'narrative'
        ? section.title
        : `${section.title} narrative`
      : (observationDefinition?.label ?? section.title);
    const structured = !narrative && section.kind !== 'observations';
    let display: string;
    if (structured) {
      display = groupedDisplay(observations, section.kind === 'vitals');
    } else if (observations.length) {
      display = observations.map(observationDisplay).join('; ');
    } else {
      // Do not invent a normal finding, numeric zero, or negative choice.
      display = fieldDisplay({ ...snapshot.responses[fieldId] });
    }
    return {
      sectionId: section.id,
      label,
      display,
      empty: structured
        ? observations.length === 0 || !display.trim()
        : !hasNativeDocumentValue(snapshot.responses[fieldId]),
      narrative: section.kind === 'narrative',
    };
  },
  // Saves stop writing the legacy schema; undefined deletes an imported key.
  extraFrontMatter: () => ({ encounterDefinition: undefined }),
  rebuildSnapshot: async (parsed) => {
    // A portable document may have been edited outside this component. The
    // canonical response wins over cached visit_* values and display strings.
    // Import lazily because snapshot creation itself calls the engine.
    // Prefer the legacy import when present: #762 documents stamped complete
    // section metadata there that their saved forms predate.
    const legacy = readMdyDefinition(parsed);
    const form = legacy ? encounterFormFromLegacy(legacy) : parsed.form;
    if (!form || !parsed.response) return null;
    const { createEncounterSnapshot } = await import('./model');
    try {
      return createEncounterSnapshot(form, {
        ...parsed.response,
        [ENCOUNTER_DOCUMENT_FIELD_ID]: encounterDocumentResponse(parsed.source),
      });
    } catch (error) {
      parsed.diagnostics.push({
        severity: 'error',
        code: 'definition',
        message:
          error instanceof Error ? error.message : 'Invalid encounter form.',
      });
      return null;
    }
  },
});

/** Parse safe YAML and native objects without dropping unknown metadata or provenance. */
export function parseEncounterMdy(source: string): ParsedEncounterMdy {
  const parsed = engine.parse(source);
  return { ...parsed, definition: readMdyDefinition(parsed) };
}

/** Update existing projections only: unlinked prose and removed links stay authored. */
export function refreshEncounterMdyLinks(
  body: string,
  fields: EncounterMdyField[]
): string {
  return engine.refreshLinks(body, fields);
}

export function getEncounterDocumentBody(
  responses: EncounterResponses
): string | undefined {
  return engine.getDocumentBody(responses);
}

export function updateEncounterDocumentBody(
  responses: EncounterResponses,
  body: string,
  options: { _ai?: boolean } = {}
): EncounterResponses {
  return engine.updateDocumentBody(responses, body, options);
}

/** Carry the exact imported block alongside prose through the native response store. */
export function encounterDocumentResponse(source: string): FieldResponse {
  return engine.documentResponse(source);
}

/**
 * Assemble a portable, flattened .mdy. Canonical form/response are native
 * eSheet objects. Flat visit_* projections bridge the native colon-bearing
 * ids to Templit/Kerebron's MDY id grammar; they are never another answer store.
 */
export function createEncounterMdy(
  snapshot: MdySnapshot,
  body?: string,
  source?: string
): string {
  return engine.create(snapshot, body, source);
}

/**
 * Render an already flattened document through Templit's actual pipeline.
 * This identity engine deliberately preserves {{clinical prose}} literally;
 * .mdy is data and markdown, never a template. Hosts sanitize returned HTML.
 */
export function renderEncounterMdy(source: string): Promise<{
  raw: string;
  html?: string;
  fields: EncounterMdyField[];
  diagnostics: EncounterMdyDiagnostic[];
}> {
  return engine.render(source);
}
