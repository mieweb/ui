import type { FieldResponse, FormDefinition } from '@esheet/core';
import { fieldDisplay, render } from '@mieweb/templit';
import { markdownToHtml } from '@mieweb/templit/markdown';
import { isMap, isSeq, parseDocument } from 'yaml';

/**
 * The shared MDY document engine behind RichTextEsheet and EncounterVisit
 * (mieweb/ui#758): a portable document whose YAML front matter carries the
 * native eSheet form, response map and host definition, and whose Markdown
 * body holds authored prose with inline `[display](mdy:<id>)` projections of
 * native answers. Each host configures the engine with its definition key,
 * field projections and initial body; the parsing, link refresh, metadata
 * preservation and rendering below stay identical across hosts.
 */

export interface MdyDocumentField {
  /** MDY/Kerebron-safe id, stable across ordering and definition changes. */
  id: string;
  /** Original eSheet field id; the canonical answer remains in response[fieldId]. */
  fieldId: string;
  sectionId: string;
  label: string;
  display: string;
  /** Derived capture state for report pruning; never stored in the MDY envelope. */
  empty?: boolean;
}

export interface MdyDocumentDiagnostic {
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

export interface ParsedMdyDocument<TDefinition> {
  source: string;
  frontMatterSource: string;
  body: string;
  frontMatter: Record<string, unknown> | null;
  form?: FormDefinition;
  response?: Record<string, FieldResponse>;
  definition?: TDefinition;
  diagnostics: MdyDocumentDiagnostic[];
}

/** Markdown helpers handed to a host's initial-body builder. */
export interface MdyDocumentMarkdown {
  /** Escape text for safe literal use in Markdown prose. */
  markdownText(value: string): string;
  /** An inline projection link for a native field. */
  fieldLink(field: MdyDocumentField): string;
}

export interface MdyDocumentConfig<
  TDefinition extends { id: string; title: string },
  TSnapshot extends {
    definition: TDefinition;
    responses: Record<string, FieldResponse>;
  },
> {
  /** Reserved in-memory response id carrying the authored body. */
  documentFieldId: string;
  /** Prefix bridging native colon-bearing ids to MDY's id grammar, e.g. `visit`. */
  linkPrefix: string;
  /** Front-matter key carrying the host's document definition. */
  definitionKey: string;
  /** Templit engine name used when rendering the flattened document. */
  engineName: string;
  /** Diagnostic for a source without YAML front matter. */
  missingFrontMatterMessage: string;
  /** Diagnostic for an invalid host definition in front matter. */
  invalidDefinitionMessage: string;
  /** `_sourceData` keys owned by the host's form generator. */
  sourceDataProperties: readonly string[];
  /** Throw on an invalid host definition (same contract as the component). */
  validateDefinition(definition: TDefinition): void;
  /** Regenerate the native eSheet form for the snapshot's definition. */
  createFormDefinition(snapshot: TSnapshot): FormDefinition;
  /** One link projection per native field, including empty memory aids. */
  getFields(snapshot: TSnapshot): MdyDocumentField[];
  /** The starting authored body when a document has none yet. */
  createInitialBody(
    snapshot: TSnapshot,
    fields: MdyDocumentField[],
    markdown: MdyDocumentMarkdown
  ): string;
  /**
   * Additional host front-matter entries (e.g. parties). An `undefined`
   * value removes the key from a previously saved document.
   */
  extraFrontMatter?(snapshot: TSnapshot): Record<string, unknown>;
  /**
   * Rebuild the canonical snapshot (including its `mdy`) from a parsed
   * document so rendering prefers canonical responses over cached
   * projections. Loaded lazily because snapshot creation calls `create`.
   */
  rebuildSnapshot?(
    parsed: ParsedMdyDocument<TDefinition>
  ): Promise<(TSnapshot & { mdy: string }) | null>;
}

export interface MdyDocumentEngine<
  TDefinition extends { id: string; title: string },
  TSnapshot extends {
    definition: TDefinition;
    responses: Record<string, FieldResponse>;
  },
> {
  /** Encode a native id as an MDY-safe projection id. */
  linkId(fieldId: string): string;
  parse(source: string): ParsedMdyDocument<TDefinition>;
  create(snapshot: TSnapshot, body?: string, source?: string): string;
  render(source: string): Promise<{
    raw: string;
    html?: string;
    fields: MdyDocumentField[];
    diagnostics: MdyDocumentDiagnostic[];
  }>;
  getDocumentBody(responses: Record<string, FieldResponse>): string | undefined;
  updateDocumentBody(
    responses: Record<string, FieldResponse>,
    body: string,
    options?: { _ai?: boolean }
  ): Record<string, FieldResponse>;
  /** Carry the exact imported block alongside prose through the native response store. */
  documentResponse(source: string): FieldResponse;
  /** Update existing projections only: unlinked prose and removed links stay authored. */
  refreshLinks(body: string, fields: MdyDocumentField[]): string;
  /** Projections imported with the document whose fields were since removed. */
  retiredFields(snapshot: TSnapshot): MdyDocumentField[];
}

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function hasValue(value: unknown): boolean {
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number' || typeof value === 'boolean') return true;
  if (Array.isArray(value)) return value.some(hasValue);
  if (record(value)) return Object.values(value).some(hasValue);
  return false;
}

/** Selection identities and labels alone are not an explicitly selected value. */
function hasSelectedValue(selected: unknown): boolean {
  if (Array.isArray(selected)) return selected.some(hasSelectedValue);
  if (!record(selected)) return false;
  if ('value' in selected) return hasValue(selected.value);
  return Object.values(selected).some(hasSelectedValue);
}

export function hasNativeDocumentValue(
  response?: FieldResponse,
  parseAnswer = false
): boolean {
  return (
    (response?.answer !== undefined &&
      hasValue(parseAnswer ? canonicalValue(response) : response.answer)) ||
    hasSelectedValue(response?.selected)
  );
}

export function markdownText(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/\r?\n/g, ' · ')
    .replace(/[\\[\]`*_~<>]/g, '\\$&');
}

/** Blank lines/list markers cannot cross a CommonMark link label. Safe breaks can. */
function markdownDisplay(value: string): string {
  return value.split(/\r?\n/).map(markdownText).join('<br>');
}

function fieldLink(field: MdyDocumentField): string {
  return `[${markdownDisplay(field.display)}](mdy:${field.id})`;
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
  // Pair brackets once. Looking for a closing bracket separately for each
  // opening bracket makes malformed documents with many `[` quadratic.
  const closingBrackets = new Map<number, number>();
  const openingBrackets: number[] = [];
  for (let cursor = 0; cursor < body.length; cursor += 1) {
    if (body[cursor] === '\\') cursor += 1;
    else if (body[cursor] === '[') openingBrackets.push(cursor);
    else if (body[cursor] === ']') {
      const opening = openingBrackets.pop();
      if (opening !== undefined) closingBrackets.set(opening, cursor);
    }
  }
  // Inline code closes only on an entire run of the same length. Index those
  // runs once rather than searching every suffix when run lengths differ.
  const ticksByLength = new Map<number, number[]>();
  for (let cursor = 0; cursor < body.length; cursor += 1) {
    if (body[cursor] !== '`') continue;
    const start = cursor;
    while (body[cursor + 1] === '`') cursor += 1;
    const length = cursor - start + 1;
    const runs = ticksByLength.get(length) ?? [];
    runs.push(start);
    ticksByLength.set(length, runs);
  }
  const tickCursors = new Map<number, number>();
  let noMoreTagEnds = false;
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
    const htmlPrefix =
      !noMoreTagEnds && body[index] === '<'
        ? /^<(pre|code|script|style)\b/i.exec(body.slice(index, index + 8))
        : null;
    if (htmlPrefix) {
      const tagEnd = body.indexOf('>', index + htmlPrefix[0].length);
      if (tagEnd < 0) noMoreTagEnds = true;
      else {
        const contentStart = tagEnd + 1;
        const end = new RegExp(`</${htmlPrefix[1]}\\s*>`, 'i').exec(
          body.slice(contentStart)
        );
        index = end ? contentStart + end.index + end[0].length : body.length;
        continue;
      }
    }
    if (body[index] === '\\') {
      index += 2;
      continue;
    }
    if (body[index] === '`') {
      let ticksEnd = index + 1;
      while (body[ticksEnd] === '`') ticksEnd += 1;
      const length = ticksEnd - index;
      const runs = ticksByLength.get(length) ?? [];
      let cursor = tickCursors.get(length) ?? 0;
      while (cursor < runs.length && runs[cursor] < ticksEnd) cursor += 1;
      tickCursors.set(length, cursor);
      const closing = runs[cursor];
      index = closing === undefined ? ticksEnd : closing + length;
      continue;
    }
    if (body[index] !== '[' || body[index - 1] === '!') {
      index += 1;
      continue;
    }
    const labelEnd = closingBrackets.get(index);
    if (labelEnd === undefined) {
      index += 1;
      continue;
    }
    const closing = labelEnd + 1;
    const destination =
      /^\([ \t]*(?:<(?:mdy:|#)([a-z0-9_-]+)>|(?:mdy:|#)([a-z0-9_-]+))(?:[ \t]+(?:"[^"\n]*"|'[^'\n]*'))?[ \t]*\)/.exec(
        body.slice(closing)
      );
    if (destination) {
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

function refreshLinks(body: string, fields: MdyDocumentField[]): string {
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
): MdyDocumentField[] {
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

function validNativeResponses(
  value: unknown
): value is Record<string, FieldResponse> {
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

function hasTemplateSyntax(body: string): boolean {
  for (const [opener, closer] of [
    ['{{', '}}'],
    ['{%', '%}'],
  ]) {
    // Any closing token after the first opener is enough. Searching once per
    // token avoids rescanning the suffix for every unmatched opening token.
    const start = body.indexOf(opener);
    if (start >= 0 && body.indexOf(closer, start + opener.length) >= 0)
      return true;
  }
  return false;
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
  next: FormDefinition,
  sourceProperties: Set<string>
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
          sourceProperties
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

/** Configure the shared engine for one document host. */
export function createMdyDocumentEngine<
  TDefinition extends { id: string; title: string },
  TSnapshot extends {
    definition: TDefinition;
    responses: Record<string, FieldResponse>;
  },
>(
  config: MdyDocumentConfig<TDefinition, TSnapshot>
): MdyDocumentEngine<TDefinition, TSnapshot> {
  /** Encode native ids without assuming their punctuation is valid in MDY. */
  const linkId = (fieldId: string): string =>
    `${config.linkPrefix}_${Array.from(
      new TextEncoder().encode(fieldId),
      (byte) => byte.toString(16).padStart(2, '0')
    ).join('')}`;

  /** Flat link projections in the front matter whose fields no longer exist. */
  const findRetiredFields = (
    existing: unknown,
    activeIds: ReadonlySet<string>
  ): MdyDocumentField[] => {
    if (!record(existing)) return [];
    const retired: MdyDocumentField[] = [];
    for (const [id, value] of Object.entries(existing)) {
      if (
        !activeIds.has(id) &&
        record(value) &&
        typeof value.fieldId === 'string' &&
        id === linkId(value.fieldId)
      ) {
        retired.push({
          id,
          fieldId: value.fieldId,
          sectionId: typeof value.sectionId === 'string' ? value.sectionId : '',
          label: 'Field no longer configured',
          display: 'Field no longer configured',
        });
      }
    }
    return retired;
  };

  /**
   * Projections imported with the document whose fields were since removed.
   * Lets live editors normalize retired links the same way `create` does,
   * without round-tripping the authored body through serialization.
   */
  function retiredFields(snapshot: TSnapshot): MdyDocumentField[] {
    const reserved = snapshot.responses[config.documentFieldId];
    const source = reserved?.attributes?.mdyFrontMatterSource;
    const split = typeof source === 'string' ? splitSource(source) : undefined;
    if (!split) return [];
    const document = parseDocument(split.yamlSource, { uniqueKeys: true });
    if (
      document.errors.length ||
      document.warnings.length ||
      !isMap(document.contents)
    )
      return [];
    const existing: unknown = document.toJS({ maxAliasCount: 100 });
    const activeIds = new Set(
      config.getFields(snapshot).map((field) => field.id)
    );
    return findRetiredFields(existing, activeIds);
  }

  /** Parse safe YAML and native objects without dropping unknown metadata or provenance. */
  function parse(source: string): ParsedMdyDocument<TDefinition> {
    const split = splitSource(source);
    const result: ParsedMdyDocument<TDefinition> = {
      source,
      frontMatterSource: split?.frontMatterSource ?? '',
      body: split?.body ?? source,
      frontMatter: null,
      diagnostics: [],
    };
    const error = (code: MdyDocumentDiagnostic['code'], message: string) =>
      result.diagnostics.push({ severity: 'error', code, message });
    if (!split) {
      error('frontmatter', config.missingFrontMatterMessage);
      return result;
    }
    try {
      const document = parseDocument(split.yamlSource, { uniqueKeys: true });
      if (document.errors.length || document.warnings.length) {
        throw new Error('Front matter must contain valid safe YAML.');
      }
      const data: unknown = document.toJS({ maxAliasCount: 100 });
      if (!record(data))
        throw new Error('Front matter must be a YAML mapping.');
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
    else
      error('form', 'Front matter requires a native eSheet form definition.');
    if (validNativeResponses(data.response)) result.response = data.response;
    else
      error('response', 'Front matter requires a native eSheet response map.');
    if (data[config.definitionKey] !== undefined) {
      try {
        config.validateDefinition(data[config.definitionKey] as TDefinition);
        result.definition = data[config.definitionKey] as TDefinition;
      } catch {
        error('definition', config.invalidDefinitionMessage);
      }
    }
    const fields = fieldsFromFrontMatter(data);
    const byId = new Map(fields.map((field) => [field.id, field]));
    const linked = new Set<string>();
    for (const link of fieldLinkSpans(result.body)) {
      if (!byId.has(link.id)) {
        // Ordinary section anchors are not document field links.
        if (
          link.id.startsWith(`${config.linkPrefix}_`) ||
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
      if (
        !linked.has(field.id) &&
        field.display !== '—' &&
        field.display.trim()
      )
        result.diagnostics.push({
          severity: 'warning',
          code: 'orphan',
          message: `${field.label} is recorded without a narrative field link.`,
          fieldId: field.fieldId,
        });
    }
    if (hasTemplateSyntax(result.body))
      result.diagnostics.push({
        severity: 'warning',
        code: 'template-syntax',
        message:
          'Template syntax belongs in .mdyt; document prose is displayed literally.',
      });
    return result;
  }

  function getDocumentBody(
    responses: Record<string, FieldResponse>
  ): string | undefined {
    return responses[config.documentFieldId]?.answer;
  }

  function updateDocumentBody(
    responses: Record<string, FieldResponse>,
    body: string,
    options: { _ai?: boolean } = {}
  ): Record<string, FieldResponse> {
    return {
      ...responses,
      [config.documentFieldId]: {
        ...responses[config.documentFieldId],
        answer: body,
        ...options,
      },
    };
  }

  function documentResponse(source: string): FieldResponse {
    const parsed = parse(source);
    return {
      answer: parsed.body,
      attributes: { mdyFrontMatterSource: parsed.frontMatterSource },
    };
  }

  /**
   * Assemble a portable, flattened .mdy. Canonical form/response are native
   * eSheet objects. Flat projections bridge the native colon-bearing ids to
   * Templit/Kerebron's MDY id grammar; they are never another answer store.
   */
  function create(snapshot: TSnapshot, body?: string, source?: string): string {
    const reserved = snapshot.responses[config.documentFieldId];
    const previousSource =
      source ?? reserved?.attributes?.mdyFrontMatterSource ?? '';
    const split = splitSource(previousSource);
    const fields = config.getFields(snapshot);
    const authoredBody =
      body ??
      reserved?.answer ??
      split?.body ??
      config.createInitialBody(snapshot, fields, { markdownText, fieldLink });
    let refreshedBody = refreshLinks(authoredBody, fields);
    const responses = Object.fromEntries(
      Object.entries(snapshot.responses).filter(
        ([id]) => id !== config.documentFieldId
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
    const removedFields = findRetiredFields(existing, activeIds);
    for (const field of removedFields) {
      document.delete(field.id);
      changed = true;
    }
    refreshedBody = refreshLinks(refreshedBody, removedFields);
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
        config.createFormDefinition(snapshot),
        new Set(config.sourceDataProperties)
      ),
      response: responses,
      [config.definitionKey]: snapshot.definition,
    })) {
      changed = setPreserving(document, [key], value) || changed;
    }
    for (const [key, value] of Object.entries(
      config.extraFrontMatter?.(snapshot) ?? {}
    )) {
      if (value === undefined) {
        if (record(existing) && key in existing) {
          document.delete(key);
          changed = true;
        }
      } else {
        changed = setPreserving(document, [key], value) || changed;
      }
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
   * This identity engine deliberately preserves {{authored prose}} literally;
   * .mdy is data and markdown, never a template. Hosts sanitize returned HTML.
   */
  async function renderMdy(source: string): Promise<{
    raw: string;
    html?: string;
    fields: MdyDocumentField[];
    diagnostics: MdyDocumentDiagnostic[];
  }> {
    let parsed = parse(source);
    let fields = fieldsFromFrontMatter(parsed.frontMatter ?? {});
    const rebuilt =
      parsed.definition && parsed.response && config.rebuildSnapshot
        ? await config.rebuildSnapshot(parsed)
        : null;
    if (rebuilt) {
      // A portable document may have been edited outside this component. The
      // canonical response wins over cached projections and display strings.
      parsed = parse(rebuilt.mdy);
      const canonical = new Map(
        config.getFields(rebuilt).map((field) => [field.fieldId, field])
      );
      fields = fieldsFromFrontMatter(parsed.frontMatter ?? {}).map((field) => ({
        ...field,
        display: canonical.get(field.fieldId)?.display ?? field.display,
        empty:
          canonical.get(field.fieldId)?.empty ??
          !hasNativeDocumentValue(parsed.response?.[field.fieldId], true),
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
        const empty = !hasNativeDocumentValue(native, true);
        if (
          !native ||
          !record(cached) ||
          JSON.stringify(cached.value) ===
            JSON.stringify(canonicalValue(native))
        )
          return { ...field, empty };
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
        return { ...field, display: display.trim() ? display : '—', empty };
      });
    }
    const body = refreshLinks(parsed.body, fields);
    // Templit consumes one front-matter block before invoking the engine. Give
    // it the document envelope, so YAML-shaped authored prose is never mistaken
    // for a second data layer. The empty envelope also protects malformed/no-FM
    // source previews while their diagnostics remain visible to the host.
    const envelope = parsed.frontMatterSource || '---\n{}\n---\n';
    const { raw, html } = await render(
      `${envelope}${body}`,
      {},
      {
        engine: { name: config.engineName, render: (content) => content },
        markdown: markdownToHtml,
        fieldLinks: false,
      }
    );
    return { raw, html, fields, diagnostics: parsed.diagnostics };
  }

  return {
    linkId,
    parse,
    create,
    render: renderMdy,
    getDocumentBody,
    updateDocumentBody,
    documentResponse,
    refreshLinks,
    retiredFields,
  };
}
