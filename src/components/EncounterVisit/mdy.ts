import type { FieldResponse, FormDefinition } from '@esheet/core';
import { fieldDisplay, render } from '@mieweb/templit';
import { markdownToHtml } from '@mieweb/templit/markdown';
import { isMap, isSeq, parseDocument } from 'yaml';
import {
  createEncounterFormDefinition,
  getEncounterFieldId,
  getEncounterSectionFieldIds,
  validateEncounterDefinition,
} from './definition';
import type {
  EncounterObservation,
  EncounterResponses,
  EncounterVisitDefinition,
  EncounterVisitSnapshot,
} from './types';

/** Authored prose is a native answer; it is excluded from its own MDY response layer. */
export const ENCOUNTER_DOCUMENT_FIELD_ID = '__encounter_document__';

type MdySnapshot = Pick<
  EncounterVisitSnapshot,
  'definition' | 'responses' | 'observations'
>;

export interface EncounterMdyField {
  /** MDY/Kerebron-safe id, stable across ordering and definition changes. */
  id: string;
  /** Original eSheet field id; the canonical answer remains in response[fieldId]. */
  fieldId: string;
  sectionId: string;
  label: string;
  display: string;
}

export interface EncounterMdyDiagnostic {
  severity: 'error' | 'warning';
  code:
    | 'frontmatter'
    | 'form'
    | 'response'
    | 'definition'
    | 'dangling-link'
    | 'orphan'
    | 'template-syntax';
  message: string;
  fieldId?: string;
}

export interface ParsedEncounterMdy {
  source: string;
  frontMatterSource: string;
  body: string;
  frontMatter: Record<string, unknown> | null;
  form?: FormDefinition;
  response?: EncounterResponses;
  definition?: EncounterVisitDefinition;
  diagnostics: EncounterMdyDiagnostic[];
}

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** Encode native ids without assuming their punctuation is valid in MDY. */
function linkId(fieldId: string): string {
  return `visit_${Array.from(new TextEncoder().encode(fieldId), (byte) =>
    byte.toString(16).padStart(2, '0')
  ).join('')}`;
}

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

function groupedDisplay(observations: EncounterObservation[]): string {
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
      groupId,
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
  return snapshot.definition.sections.flatMap((section) =>
    getEncounterSectionFieldIds(section).map((fieldId) => {
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
      let display: string;
      if (!narrative && section.kind !== 'observations') {
        display = groupedDisplay(observations);
      } else if (observations.length) {
        display = observations.map(observationDisplay).join('; ');
      } else {
        // Do not invent a normal finding, numeric zero, or negative choice.
        display = fieldDisplay({ ...snapshot.responses[fieldId] });
      }
      return {
        id: linkId(fieldId),
        fieldId,
        sectionId: section.id,
        label,
        display: display.trim() ? display : '—',
      };
    })
  );
}

function markdownText(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/\r?\n/g, ' · ')
    .replace(/[\\[\]`*_~<>]/g, '\\$&');
}

function fieldLink(field: EncounterMdyField): string {
  return `[${markdownDisplay(field.display)}](mdy:${field.id})`;
}

/** Blank lines/list markers cannot cross a CommonMark link label. Safe breaks can. */
function markdownDisplay(value: string): string {
  return value.split(/\r?\n/).map(markdownText).join('<br>');
}

function initialBody(
  snapshot: MdySnapshot,
  fields: EncounterMdyField[]
): string {
  return [
    `# ${markdownText(snapshot.definition.title)}`,
    ...snapshot.definition.sections.map((section) =>
      [
        `## ${markdownText(section.title)}`,
        fields
          .filter((field) => field.sectionId === section.id)
          .map((field) =>
            section.kind === 'narrative'
              ? fieldLink(field)
              : `- **${markdownText(field.label)}:** ${fieldLink(field)}`
          )
          .join('\n'),
      ].join('\n\n')
    ),
  ].join('\n\n');
}

interface LinkSpan {
  id: string;
  start: number;
  labelEnd: number;
  end: number;
}

/** Find inline field links while leaving code, images, and escaped text inert. */
function fieldLinkSpans(body: string): LinkSpan[] {
  const links: LinkSpan[] = [];
  let index = 0;
  while (index < body.length) {
    const lineStart = index === 0 || body[index - 1] === '\n';
    if (lineStart) {
      const rest = body.slice(index);
      const fence = /^ {0,3}(`{3,}|~{3,})[^\n]*(?:\n|$)/.exec(rest);
      if (fence) {
        const marker = fence[1][0];
        const close = new RegExp(
          `^ {0,3}${marker}{${fence[1].length},}[ \\t]*\\r?$`,
          'm'
        ).exec(rest.slice(fence[0].length));
        index += close
          ? fence[0].length + close.index + close[0].length
          : rest.length;
        continue;
      }
      if (/^(?: {4}|\t)/.test(rest)) {
        const end = body.indexOf('\n', index);
        index = end < 0 ? body.length : end + 1;
        continue;
      }
    }
    if (body.startsWith('<!--', index)) {
      const end = body.indexOf('-->', index + 4);
      index = end < 0 ? body.length : end + 3;
      continue;
    }
    const htmlBlock = /^<(pre|code|script|style)\b[^>]*>/i.exec(
      body.slice(index)
    );
    if (htmlBlock) {
      const end = new RegExp(`</${htmlBlock[1]}\\s*>`, 'i').exec(
        body.slice(index + htmlBlock[0].length)
      );
      index += end
        ? htmlBlock[0].length + end.index + end[0].length
        : body.length - index;
      continue;
    }
    if (body[index] === '\\') {
      index += 2;
      continue;
    }
    if (body[index] === '`') {
      const ticks = /^`+/.exec(body.slice(index))![0];
      let end = body.indexOf(ticks, index + ticks.length);
      while (
        end >= 0 &&
        (body[end - 1] === '`' || body[end + ticks.length] === '`')
      ) {
        end = body.indexOf(ticks, end + ticks.length);
      }
      index = end >= 0 ? end + ticks.length : index + ticks.length;
      continue;
    }
    if (body[index] !== '[' || body[index - 1] === '!') {
      index += 1;
      continue;
    }
    let depth = 1;
    let closing = index + 1;
    for (; closing < body.length && depth; closing += 1) {
      if (body[closing] === '\\') closing += 1;
      else if (body[closing] === '[') depth += 1;
      else if (body[closing] === ']') depth -= 1;
    }
    const labelEnd = closing - 1;
    const destination =
      /^\([ \t]*(?:<(?:mdy:|#)([a-z0-9_-]+)>|(?:mdy:|#)([a-z0-9_-]+))(?:[ \t]+(?:"[^"\n]*"|'[^'\n]*'))?[ \t]*\)/.exec(
        body.slice(closing)
      );
    if (depth === 0 && destination) {
      const end = closing + destination[0].length;
      links.push({
        id: destination[1] ?? destination[2],
        start: index,
        labelEnd,
        end,
      });
      index = end;
    } else {
      index += 1;
    }
  }
  return links;
}

/** Update existing projections only: unlinked prose and removed links stay authored. */
export function refreshEncounterMdyLinks(
  body: string,
  fields: EncounterMdyField[]
): string {
  const byId = new Map(fields.map((field) => [field.id, field]));
  let result = body;
  for (const link of fieldLinkSpans(body).reverse()) {
    const field = byId.get(link.id);
    if (!field) continue;
    result =
      result.slice(0, link.start + 1) +
      markdownDisplay(field.display) +
      result.slice(link.labelEnd);
  }
  return result;
}

interface SplitSource {
  frontMatterSource: string;
  yamlSource: string;
  body: string;
  opening: string;
  closing: string;
}

function splitSource(source: string): SplitSource | undefined {
  const opening = /^\uFEFF?---[ \t]*\r?\n/.exec(source);
  if (!opening) return undefined;
  const remainder = source.slice(opening[0].length);
  const closing = /(^|\r?\n)---[ \t]*(\r?\n|$)/.exec(remainder);
  if (!closing) return undefined;
  const yamlEnd = closing.index + closing[1].length;
  const end = opening[0].length + closing.index + closing[0].length;
  return {
    frontMatterSource: source.slice(0, end),
    yamlSource: remainder.slice(0, yamlEnd),
    body: source.slice(end),
    opening: opening[0],
    closing: closing[0].slice(closing[1].length),
  };
}

function fieldsFromFrontMatter(
  frontMatter: Record<string, unknown>
): EncounterMdyField[] {
  return Object.entries(frontMatter).flatMap(([id, value]) =>
    /^[a-z0-9_-]+$/.test(id) &&
    record(value) &&
    typeof value.fieldId === 'string' &&
    typeof value.sectionId === 'string' &&
    typeof value.display === 'string'
      ? [
          {
            id,
            fieldId: value.fieldId,
            sectionId: value.sectionId,
            label:
              typeof value.label === 'string' ? value.label : value.fieldId,
            display: fieldDisplay(value),
          },
        ]
      : []
  );
}

function validNativeForm(value: unknown): value is FormDefinition {
  if (
    !record(value) ||
    typeof value.id !== 'string' ||
    !Array.isArray(value.pages)
  )
    return false;
  const ids = new Set<string>();
  const fieldsValid = (fields: unknown): boolean =>
    Array.isArray(fields) &&
    fields.every((field) => {
      if (
        !record(field) ||
        typeof field.id !== 'string' ||
        !field.id ||
        typeof field.fieldType !== 'string' ||
        ids.has(field.id)
      )
        return false;
      ids.add(field.id);
      return field.fields === undefined || fieldsValid(field.fields);
    });
  return value.pages.every(
    (page) =>
      record(page) && typeof page.id === 'string' && fieldsValid(page.fields)
  );
}

function validNativeResponses(value: unknown): value is EncounterResponses {
  return (
    record(value) &&
    Object.values(value).every(
      (response) =>
        record(response) &&
        (response.answer === undefined ||
          typeof response.answer === 'string') &&
        (response.selected === undefined ||
          record(response.selected) ||
          Array.isArray(response.selected))
    )
  );
}

/** Parse safe YAML and native objects without dropping unknown metadata or provenance. */
export function parseEncounterMdy(source: string): ParsedEncounterMdy {
  const split = splitSource(source);
  const result: ParsedEncounterMdy = {
    source,
    frontMatterSource: split?.frontMatterSource ?? '',
    body: split?.body ?? source,
    frontMatter: null,
    diagnostics: [],
  };
  const error = (code: EncounterMdyDiagnostic['code'], message: string) =>
    result.diagnostics.push({ severity: 'error', code, message });
  if (!split) {
    error(
      'frontmatter',
      'An encounter MDY document requires YAML front matter.'
    );
    return result;
  }
  try {
    const document = parseDocument(split.yamlSource, { uniqueKeys: true });
    if (document.errors.length || document.warnings.length) {
      throw new Error('Front matter must contain valid safe YAML.');
    }
    const data: unknown = document.toJS({ maxAliasCount: 100 });
    if (!record(data)) throw new Error('Front matter must be a YAML mapping.');
    result.frontMatter = data;
  } catch (cause) {
    error(
      'frontmatter',
      cause instanceof Error ? cause.message : 'Invalid YAML front matter.'
    );
    return result;
  }
  const data = result.frontMatter;
  if (validNativeForm(data.form)) result.form = data.form;
  else error('form', 'Front matter requires a native eSheet form definition.');
  if (validNativeResponses(data.response)) result.response = data.response;
  else error('response', 'Front matter requires a native eSheet response map.');
  if (data.encounterDefinition !== undefined) {
    try {
      validateEncounterDefinition(
        data.encounterDefinition as EncounterVisitDefinition
      );
      result.definition = data.encounterDefinition as EncounterVisitDefinition;
    } catch {
      error(
        'definition',
        'Front matter contains an invalid encounterDefinition.'
      );
    }
  }
  const fields = fieldsFromFrontMatter(data);
  const byId = new Map(fields.map((field) => [field.id, field]));
  const linked = new Set<string>();
  for (const link of fieldLinkSpans(result.body)) {
    if (!byId.has(link.id)) {
      // Ordinary section anchors are not encounter field links.
      if (
        link.id.startsWith('visit_') ||
        result.body.slice(link.labelEnd, link.end).includes('mdy:')
      )
        result.diagnostics.push({
          severity: 'error',
          code: 'dangling-link',
          message: `Field link ${link.id} has no indexed data.`,
        });
    } else linked.add(link.id);
  }
  for (const field of fields) {
    if (!linked.has(field.id) && field.display !== '—' && field.display.trim())
      result.diagnostics.push({
        severity: 'warning',
        code: 'orphan',
        message: `${field.label} is recorded without a narrative field link.`,
        fieldId: field.fieldId,
      });
  }
  if (/\{\{[\s\S]*?\}\}|\{%[\s\S]*?%\}/.test(result.body))
    result.diagnostics.push({
      severity: 'warning',
      code: 'template-syntax',
      message:
        'Template syntax belongs in .mdyt; document prose is displayed literally.',
    });
  return result;
}

export function getEncounterDocumentBody(
  responses: EncounterResponses
): string | undefined {
  return responses[ENCOUNTER_DOCUMENT_FIELD_ID]?.answer;
}

export function updateEncounterDocumentBody(
  responses: EncounterResponses,
  body: string,
  options: { _ai?: boolean } = {}
): EncounterResponses {
  return {
    ...responses,
    [ENCOUNTER_DOCUMENT_FIELD_ID]: {
      ...responses[ENCOUNTER_DOCUMENT_FIELD_ID],
      answer: body,
      ...options,
    },
  };
}

/** Carry the exact imported block alongside prose through the native response store. */
export function encounterDocumentResponse(source: string): FieldResponse {
  const parsed = parseEncounterMdy(source);
  return {
    answer: parsed.body,
    attributes: { mdyFrontMatterSource: parsed.frontMatterSource },
  };
}

function canonicalValue(response?: FieldResponse): unknown {
  if (response?.answer !== undefined) {
    try {
      return JSON.parse(response.answer) as unknown;
    } catch {
      return response.answer;
    }
  }
  return response?.selected ?? null;
}

const FORM_PROPERTIES = new Set(['id', 'title', 'pages']);
const PAGE_PROPERTIES = new Set(['id', 'title', 'fields']);
const FIELD_PROPERTIES = new Set([
  'id',
  'fieldType',
  'title',
  'question',
  'required',
  'width',
  'content',
  'fields',
  'sectionCollapse',
  'options',
  'inputType',
  'unit',
  'validators',
  '_sourceData',
]);
const SOURCE_PROPERTIES = new Set([
  'id',
  'label',
  'type',
  'unit',
  'code',
  'options',
  'required',
  'encounterHideLabel',
]);

function mergeMetadata(
  previous: unknown,
  next: Record<string, unknown>,
  owned: Set<string>
): Record<string, unknown> {
  const merged = { ...(record(previous) ? previous : {}), ...next };
  for (const property of owned) {
    if (!(property in next)) delete merged[property];
  }
  return merged;
}

/** Carry native extensions on matching identities; removed pages/fields stay removed. */
function mergeNativeFormMetadata(
  previous: unknown,
  next: FormDefinition
): FormDefinition {
  if (!record(previous) || previous.id !== next.id) return next;
  const mergeFields = (
    oldFields: unknown,
    newFields: unknown[]
  ): Record<string, unknown>[] => {
    const oldById = new Map(
      (Array.isArray(oldFields) ? oldFields : [])
        .filter(record)
        .map((field) => [field.id, field])
    );
    return newFields.filter(record).map((field) => {
      const oldField = oldById.get(field.id);
      const merged = mergeMetadata(oldField, field, FIELD_PROPERTIES);
      if (Array.isArray(field.fields))
        merged.fields = mergeFields(oldField?.fields, field.fields);
      if (record(field._sourceData))
        merged._sourceData = mergeMetadata(
          oldField?._sourceData,
          field._sourceData,
          SOURCE_PROPERTIES
        );
      return merged;
    });
  };
  const oldPages = new Map(
    (Array.isArray(previous.pages) ? previous.pages : [])
      .filter(record)
      .map((page) => [page.id, page])
  );
  const merged = mergeMetadata(
    previous,
    next as unknown as Record<string, unknown>,
    FORM_PROPERTIES
  );
  merged.pages = next.pages.map((page) => {
    const oldPage = oldPages.get(page.id);
    return {
      ...mergeMetadata(
        oldPage,
        page as unknown as Record<string, unknown>,
        PAGE_PROPERTIES
      ),
      fields: mergeFields(oldPage?.fields, page.fields ?? []),
    };
  });
  return merged as unknown as FormDefinition;
}

/** Synchronize changed YAML nodes while preserving comments, styles, and key order. */
function setPreserving(
  document: ReturnType<typeof parseDocument>,
  path: (string | number)[],
  value: unknown
): boolean {
  const node = document.getIn(path, true);
  const previous = document.getIn(path);
  if (JSON.stringify(previous) === JSON.stringify(value)) return false;
  if (record(value) && isMap(node)) {
    let changed = false;
    const keys = new Set(
      Object.keys(value).filter((key) => value[key] !== undefined)
    );
    for (const pair of [...node.items]) {
      const key = String(pair.key);
      if (!keys.has(key)) {
        document.deleteIn([...path, key]);
        changed = true;
      }
    }
    for (const key of keys) {
      changed = setPreserving(document, [...path, key], value[key]) || changed;
    }
    return changed;
  }
  if (Array.isArray(value) && isSeq(node)) {
    if (
      value.every((item) => record(item) && typeof item.id === 'string') &&
      node.items.every(
        (item) => isMap(item) && typeof item.get('id') === 'string'
      )
    ) {
      // Reuse retained YAML nodes when a section is removed or reordered, so
      // their comments, quoting and native extensions survive too.
      const byId = new Map(
        node.items.map((item) => [
          isMap(item) ? item.get('id') : undefined,
          item,
        ])
      );
      node.items = value.map((item) => {
        const id = (item as Record<string, unknown>).id;
        return byId.get(id) ?? document.createNode(item);
      });
      value.forEach((item, index) =>
        setPreserving(document, [...path, index], item)
      );
      return true;
    }
    if (node.items.length === value.length) {
      return value.reduce(
        (changed, item, index) =>
          setPreserving(document, [...path, index], item) || changed,
        false
      );
    }
  }
  document.setIn(path, value);
  return true;
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
  const reserved = snapshot.responses[ENCOUNTER_DOCUMENT_FIELD_ID];
  const previousSource =
    source ?? reserved?.attributes?.mdyFrontMatterSource ?? '';
  const split = splitSource(previousSource);
  const fields = getEncounterMdyFields(snapshot);
  const authoredBody =
    body ?? reserved?.answer ?? split?.body ?? initialBody(snapshot, fields);
  let refreshedBody = refreshEncounterMdyLinks(authoredBody, fields);
  const responses = Object.fromEntries(
    Object.entries(snapshot.responses).filter(
      ([id]) => id !== ENCOUNTER_DOCUMENT_FIELD_ID
    )
  );
  const document = split
    ? parseDocument(split.yamlSource, { uniqueKeys: true })
    : parseDocument('{}\n');
  if (
    document.errors.length ||
    document.warnings.length ||
    !isMap(document.contents)
  )
    throw new Error('Cannot update invalid MDY front matter.');
  if (!split) document.contents.flow = false;
  let changed = false;
  const existing: unknown = document.toJS({ maxAliasCount: 100 });
  const activeIds = new Set(fields.map((field) => field.id));
  const removedFields: EncounterMdyField[] = [];
  if (record(existing)) {
    for (const [id, value] of Object.entries(existing)) {
      if (
        !activeIds.has(id) &&
        record(value) &&
        typeof value.fieldId === 'string' &&
        id === linkId(value.fieldId)
      ) {
        document.delete(id);
        changed = true;
        removedFields.push({
          id,
          fieldId: value.fieldId,
          sectionId: typeof value.sectionId === 'string' ? value.sectionId : '',
          label: 'Field no longer configured',
          display: 'Field no longer configured',
        });
      }
    }
  }
  refreshedBody = refreshEncounterMdyLinks(refreshedBody, removedFields);
  const oldMdy = record(existing) && record(existing.mdy) ? existing.mdy : {};
  const metadata = {
    ...oldMdy,
    kind: 'document',
    schema: 'esheet',
    template: oldMdy.template ?? {
      name: snapshot.definition.title,
      version: '1.0.0',
    },
  };
  for (const [key, value] of Object.entries({
    mdy: metadata,
    form: mergeNativeFormMetadata(
      record(existing) ? existing.form : undefined,
      createEncounterFormDefinition(snapshot.definition)
    ),
    response: responses,
    encounterDefinition: snapshot.definition,
  })) {
    changed = setPreserving(document, [key], value) || changed;
  }
  for (const field of fields) {
    const oldField = record(existing) ? existing[field.id] : undefined;
    changed =
      setPreserving(document, [field.id], {
        ...(record(oldField) ? oldField : {}),
        fieldId: field.fieldId,
        sectionId: field.sectionId,
        label: field.label,
        value: canonicalValue(responses[field.fieldId]),
        display: field.display,
      }) || changed;
  }
  const newline = split?.opening.endsWith('\r\n') ? '\r\n' : '\n';
  if (split && !changed) {
    const boundary =
      refreshedBody && !split.frontMatterSource.endsWith('\n') ? newline : '';
    return `${split.frontMatterSource}${boundary}${refreshedBody}`;
  }
  const yaml = document.toString({ lineWidth: 0 }).replace(/\n/g, newline);
  let closing = split?.closing || `---${newline}`;
  if (refreshedBody && !closing.endsWith('\n')) closing += newline;
  return `${split?.opening ?? `---${newline}`}${yaml}${closing}${refreshedBody}`;
}

/**
 * Render an already flattened document through Templit's actual pipeline.
 * This identity engine deliberately preserves {{clinical prose}} literally;
 * .mdy is data and markdown, never a template. Hosts sanitize returned HTML.
 */
export async function renderEncounterMdy(source: string): Promise<{
  raw: string;
  html?: string;
  fields: EncounterMdyField[];
  diagnostics: EncounterMdyDiagnostic[];
}> {
  let parsed = parseEncounterMdy(source);
  let fields = fieldsFromFrontMatter(parsed.frontMatter ?? {});
  if (parsed.definition && parsed.response) {
    // A portable document may have been edited outside this component. The
    // canonical response wins over cached visit_* values and display strings.
    // Import lazily because snapshot creation itself calls createEncounterMdy.
    const { createEncounterSnapshot } = await import('./model');
    const snapshot = createEncounterSnapshot(parsed.definition, {
      ...parsed.response,
      [ENCOUNTER_DOCUMENT_FIELD_ID]: encounterDocumentResponse(source),
    });
    parsed = parseEncounterMdy(snapshot.mdy);
    const canonical = new Map(
      getEncounterMdyFields(snapshot).map((field) => [field.fieldId, field])
    );
    fields = fieldsFromFrontMatter(parsed.frontMatter ?? {}).map((field) => ({
      ...field,
      display: canonical.get(field.fieldId)?.display ?? field.display,
    }));
  } else if (parsed.response) {
    const units = new Map<string, string>();
    const indexUnits = (nativeFields: unknown): void => {
      if (!Array.isArray(nativeFields)) return;
      for (const field of nativeFields) {
        if (!record(field)) continue;
        if (typeof field.id === 'string' && typeof field.unit === 'string')
          units.set(field.id, field.unit);
        indexUnits(field.fields);
      }
    };
    parsed.form?.pages.forEach((page) => indexUnits(page.fields));
    const response = parsed.response;
    fields = fields.map((field) => {
      const cached = parsed.frontMatter?.[field.id];
      const native = response[field.fieldId];
      if (
        !native ||
        !record(cached) ||
        JSON.stringify(cached.value) === JSON.stringify(canonicalValue(native))
      )
        return field;
      const display = fieldDisplay({
        ...native,
        unit: units.get(field.fieldId),
      });
      parsed.diagnostics.push({
        severity: 'warning',
        code: 'response',
        fieldId: field.fieldId,
        message: `${field.label}'s cached projection differed from its canonical response and was refreshed.`,
      });
      return { ...field, display: display.trim() ? display : '—' };
    });
  }
  const body = refreshEncounterMdyLinks(parsed.body, fields);
  // Templit consumes one front-matter block before invoking the engine. Give
  // it the document envelope, so YAML-shaped authored prose is never mistaken
  // for a second data layer. The empty envelope also protects malformed/no-FM
  // source previews while their diagnostics remain visible to the host.
  const envelope = parsed.frontMatterSource || '---\n{}\n---\n';
  const { raw, html } = await render(
    `${envelope}${body}`,
    {},
    {
      engine: { name: 'encounter-mdy-document', render: (content) => content },
      markdown: markdownToHtml,
      fieldLinks: false,
    }
  );
  return { raw, html, fields, diagnostics: parsed.diagnostics };
}
