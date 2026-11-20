/**
 * Rich tool-call result content: structured fields, labeled links, media
 * previews and embedded resources. Shared by `ToolCallDisplay` and
 * `ToolCallGroup` rows so both render results the same way.
 *
 * Everything here is untrusted tool output: it is rendered as text (React
 * escapes it), links open only on click and only for http(s) or same-origin
 * paths, and media is limited to inline-safe formats.
 */

import * as React from 'react';
import { Badge } from '../Badge';
import type {
  MCPResourceLink,
  ToolBehaviorHints,
  ToolCall,
  ToolCallEmbeddedResource,
  ToolCallMedia,
  ToolCallResult,
} from './types';

export type ToolHintLabels = Record<keyof ToolBehaviorHints, string>;

/** Hints are the provider's claims, so the wording describes, never reassures. */
export const defaultToolHintLabels: ToolHintLabels = {
  readOnly: 'Read-only',
  destructive: 'May change or delete data',
  idempotent: 'Provider says repeating has no extra effect',
  openWorld: 'Reaches external services',
};

/** A call's description and provider hints, shown before it runs. */
export function ToolCallMetadata({
  toolCall,
  hintLabels = defaultToolHintLabels,
}: {
  toolCall: ToolCall;
  hintLabels?: ToolHintLabels;
}) {
  const hints = toolCall.hints;
  const shown = hints
    ? (Object.keys(hintLabels) as (keyof ToolBehaviorHints)[]).filter(
        (key) => hints[key]
      )
    : [];
  if (!toolCall.description && shown.length === 0) return null;
  return (
    <>
      {toolCall.description && (
        <p
          data-slot="ai-tool-call-description"
          dir="auto"
          className="text-xs break-words text-neutral-600 dark:text-neutral-400"
        >
          {toolCall.description}
        </p>
      )}
      {shown.length > 0 && (
        <ul data-slot="ai-tool-call-hints" className="flex flex-wrap gap-1">
          {shown.map((key) => (
            <li key={key}>
              <Badge variant="secondary" size="sm">
                {hintLabels[key]}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

/** True when a call has a description or any declared hint to show. */
export function hasToolCallMetadata(toolCall: ToolCall): boolean {
  return Boolean(
    toolCall.description ||
    (toolCall.hints && Object.values(toolCall.hints).some(Boolean))
  );
}

/** True when `data` is only the JSON text of `structured`, so showing both repeats it. */
export function isStructuredTwin(result: ToolCallResult): boolean {
  if (result.structured === undefined) return false;
  if (typeof result.data !== 'string') return result.data === result.structured;
  try {
    return (
      JSON.stringify(JSON.parse(result.data)) ===
      JSON.stringify(result.structured)
    );
  } catch {
    return false;
  }
}

/** Strings the rich result renders; hosts translate them. */
export interface ToolCallResultLabels {
  /** Heading for structured fields. */
  fields: string;
  /** Fallback shown in place of media that cannot be previewed. */
  mediaUnsupported: (mimeType: string) => string;
  /** Download control for an embedded binary resource. */
  download: string;
  /** Notice listing content types the host could not present. */
  unsupportedContent: (types: string[]) => string;
  /** Notice when a list or table was cut short. */
  truncated: (shown: number, total: number) => string;
  /** Notice when table columns were cut short. */
  columnsTruncated: (shown: number, total: number) => string;
  /** Download control for the complete structured result. */
  downloadFull: string;
  /** Shown when structured data cannot be displayed. */
  structuredUnavailable: string;
  /** Alt text for a tool image that came without a description. */
  imageAlt: string;
  /** Notice when the host dropped or shortened parts of the result. */
  incomplete: string;
}

export const defaultToolCallResultLabels: ToolCallResultLabels = {
  fields: 'Fields',
  mediaUnsupported: (mimeType) => `Preview not available (${mimeType})`,
  download: 'Download',
  unsupportedContent: (types) => `Not shown: ${types.join(', ')}`,
  truncated: (shown, total) => `Showing ${shown} of ${total}`,
  columnsTruncated: (shown, total) => `Showing ${shown} of ${total} columns`,
  downloadFull: 'Download full result (JSON)',
  structuredUnavailable: 'This result cannot be displayed',
  imageAlt: 'Image returned by the tool',
  incomplete: 'Part of this result was too large to keep and is not shown.',
};

const MAX_FIELDS = 20;
const MAX_ROWS = 10;
const MAX_COLUMNS = 6;
const MAX_CELL_CHARS = 200;

const IMAGE_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
]);
const AUDIO_TYPES = new Set([
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/ogg',
  'audio/webm',
]);
const BASE64 = /^[A-Za-z0-9+/]+=*$/;

/** True for links the browser may open: http(s) URLs and same-origin paths. */
export function isSafeHref(href: string): boolean {
  // Browsers strip tabs/newlines and treat `\` as `/`, turning a path into another origin.
  if (/[\\\t\n\r]/.test(href)) return false;
  if (href.startsWith('/') && !href.startsWith('//')) return true;
  try {
    const { protocol } = new URL(href);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}

/** The destination host of an absolute browser link, else null. */
export function linkHost(href: string): string | null {
  if (!/^https?:/i.test(href)) return null;
  try {
    return new URL(href).host;
  } catch {
    return null;
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

/** JSON text, or null for values JSON cannot represent (BigInt, cycles). */
function safeStringify(value: unknown, indent?: number): string | null {
  try {
    return JSON.stringify(value, null, indent) ?? String(value);
  } catch {
    return null;
  }
}

function cellText(value: unknown): string {
  const text =
    typeof value === 'string' ? value : (safeStringify(value) ?? '…');
  return text.length > MAX_CELL_CHARS
    ? `${text.slice(0, MAX_CELL_CHARS)}…`
    : text;
}

/** Every link a result carries, in display order. */
export function resultLinks(
  result: ToolCallResult | undefined
): MCPResourceLink[] {
  if (!result) return [];
  return [
    ...(result.link ? [result.link] : []),
    ...(result.links ?? []),
    ...(result.resources ?? []).map((resource) => ({
      href: resource.uri || '',
      label: resource.name,
      type: resource.type as MCPResourceLink['type'],
    })),
  ];
}

/** True when a result has anything beyond its text to render. */
export function hasRichResult(result: ToolCallResult | undefined): boolean {
  return Boolean(
    result &&
    (result.structured !== undefined ||
      result.truncated ||
      result.media?.length ||
      result.embedded?.length ||
      result.unsupported?.length)
  );
}

function StructuredFields({
  value,
  fieldLabels,
  labels,
}: {
  value: unknown;
  fieldLabels?: Record<string, string>;
  labels: ToolCallResultLabels;
}) {
  if (isPlainObject(value)) {
    const entries = Object.entries(value);
    const shown = entries.slice(0, MAX_FIELDS);
    return (
      <div data-slot="ai-tool-result-fields">
        <h4 className="mb-1 text-xs font-medium text-neutral-600 dark:text-neutral-400">
          {labels.fields}
        </h4>
        <dl className="grid grid-cols-[minmax(0,auto)_minmax(0,1fr)] gap-x-3 gap-y-0.5 text-xs">
          {shown.map(([key, field]) => (
            <React.Fragment key={key}>
              <dt className="font-medium break-words text-neutral-600 dark:text-neutral-400">
                {fieldLabels?.[key] ?? key}
              </dt>
              <dd dir="auto" className="break-words">
                {cellText(field)}
              </dd>
            </React.Fragment>
          ))}
        </dl>
        {entries.length > shown.length && (
          <p className="mt-1 text-xs text-neutral-500">
            {labels.truncated(shown.length, entries.length)}
          </p>
        )}
      </div>
    );
  }

  if (Array.isArray(value) && value.length > 0 && value.every(isPlainObject)) {
    const rows = value.slice(0, MAX_ROWS) as Record<string, unknown>[];
    const allColumns = Array.from(new Set(rows.flatMap(Object.keys)));
    const columns = allColumns.slice(0, MAX_COLUMNS);
    return (
      <div data-slot="ai-tool-result-table" className="overflow-x-auto">
        <table className="w-full text-start text-xs">
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column}
                  scope="col"
                  className="pe-3 text-start font-medium text-neutral-600 dark:text-neutral-400"
                >
                  {fieldLabels?.[column] ?? column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index}>
                {columns.map((column) => (
                  <td key={column} dir="auto" className="pe-3 align-top">
                    {row[column] === undefined ? '' : cellText(row[column])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {value.length > rows.length && (
          <p className="mt-1 text-xs text-neutral-500">
            {labels.truncated(rows.length, value.length)}
          </p>
        )}
        {allColumns.length > columns.length && (
          <p className="mt-1 text-xs text-neutral-500">
            {labels.columnsTruncated(columns.length, allColumns.length)}
          </p>
        )}
      </div>
    );
  }

  const json = safeStringify(value, 2);
  if (json === null) {
    return (
      <p className="text-xs text-neutral-500">{labels.structuredUnavailable}</p>
    );
  }
  return (
    <pre
      dir="ltr"
      className="max-h-60 overflow-auto rounded bg-neutral-100 p-2 text-xs whitespace-pre-wrap dark:bg-neutral-900"
    >
      {json}
    </pre>
  );
}

/** The complete structured result as a JSON download, beyond the bounded preview. */
function FullResultDownload({
  value,
  labels,
}: {
  value: unknown;
  labels: ToolCallResultLabels;
}) {
  const json = safeStringify(value, 2);
  if (json === null) return null;
  return (
    <a
      href={`data:application/octet-stream;charset=utf-8,${encodeURIComponent(json)}`}
      download="result.json"
      className="text-primary-700 dark:text-primary-300 text-xs underline"
    >
      {labels.downloadFull}
    </a>
  );
}

function MediaPreview({
  media,
  labels,
}: {
  media: ToolCallMedia;
  labels: ToolCallResultLabels;
}) {
  const mimeType = media.mimeType.toLowerCase();
  const valid = BASE64.test(media.data);
  const src = `data:${mimeType};base64,${media.data}`;
  if (valid && media.type === 'image' && IMAGE_TYPES.has(mimeType)) {
    return (
      <img
        src={src}
        alt={media.alt || labels.imageAlt}
        className="max-h-60 max-w-full rounded border border-neutral-200 dark:border-neutral-700"
      />
    );
  }
  if (valid && media.type === 'audio' && AUDIO_TYPES.has(mimeType)) {
    // Tool-returned audio carries no caption track to offer.
    // eslint-disable-next-line jsx-a11y/media-has-caption
    return <audio controls preload="none" src={src} className="max-w-full" />;
  }
  return (
    <p className="text-xs text-neutral-500">
      {labels.mediaUnsupported(media.mimeType)}
    </p>
  );
}

function EmbeddedResource({
  resource,
  labels,
}: {
  resource: ToolCallEmbeddedResource;
  labels: ToolCallResultLabels;
}) {
  const name = resource.uri.split('/').pop() || resource.uri;
  return (
    <div data-slot="ai-tool-result-embedded" className="space-y-1 text-xs">
      <p className="font-mono break-all text-neutral-600 dark:text-neutral-400">
        {resource.uri}
      </p>
      {resource.text !== undefined && (
        <pre
          dir="auto"
          className="max-h-40 overflow-auto rounded bg-neutral-100 p-2 whitespace-pre-wrap dark:bg-neutral-900"
        >
          {resource.text}
        </pre>
      )}
      {resource.blob && BASE64.test(resource.blob) && (
        // Served as an opaque download so the browser never renders it inline.
        <a
          href={`data:application/octet-stream;base64,${resource.blob}`}
          download={name}
          className="text-primary-700 dark:text-primary-300 underline"
        >
          {labels.download} <bdi>{name}</bdi>
        </a>
      )}
    </div>
  );
}

export interface ToolCallResultContentProps {
  result: ToolCallResult;
  labels?: ToolCallResultLabels;
}

/**
 * Structured fields, media, embedded resources and unsupported-content notice.
 * Links and the text summary are rendered by the caller.
 */
export function ToolCallResultContent({
  result,
  labels = defaultToolCallResultLabels,
}: ToolCallResultContentProps) {
  return (
    <div data-slot="ai-tool-result-content" className="space-y-2">
      {result.structured !== undefined && (
        <>
          <StructuredFields
            value={result.structured}
            fieldLabels={result.fieldLabels}
            labels={labels}
          />
          <FullResultDownload value={result.structured} labels={labels} />
        </>
      )}
      {result.media?.map((media, index) => (
        <MediaPreview key={index} media={media} labels={labels} />
      ))}
      {result.embedded?.map((resource, index) => (
        <EmbeddedResource key={index} resource={resource} labels={labels} />
      ))}
      {result.unsupported && result.unsupported.length > 0 && (
        <p className="text-xs text-neutral-500">
          {labels.unsupportedContent(result.unsupported)}
        </p>
      )}
      {result.truncated && (
        <p
          data-slot="ai-tool-result-incomplete"
          className="text-xs text-amber-700 dark:text-amber-400"
        >
          {labels.incomplete}
        </p>
      )}
    </div>
  );
}
