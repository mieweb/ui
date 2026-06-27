/**
 * SuperChat attachment plugin (opt-in, offline-first).
 *
 * Renders file attachments (image / video / audio / pdf / generic) inline in a
 * message via a fenced ` ```superchat-attachment ` block whose body is a small
 * JSON descriptor:
 *
 * ````md
 * ```superchat-attachment
 * { "id": "att-1", "type": "video/mp4", "name": "clip.mp4" }
 * ```
 * ````
 *
 * Use {@link attachmentMarkdown} to build the block. The descriptor carries an
 * attachment **id**; the player resolves a `blob:` URL from the
 * {@link attachmentCache} (IndexedDB) at render time, so previously sent media
 * keeps rendering offline without storing base64 in the conversation. An
 * optional inline `src` (`data:` URL) is used as a fallback when the cache is
 * empty or unavailable, and is opportunistically persisted for next time.
 *
 * Mirrors the GenUI plugin's fence→custom-element rehype transform so the
 * payload never travels through `urlTransform` / raw-HTML, keeping the pipeline
 * robust under `rehype-sanitize`.
 */

import * as React from 'react';
import { cn } from '../../../utils/cn';
import { attachmentCache } from '../render/attachmentCache';
import type { SuperChatRenderPlugin } from '../types';

/** Custom element the fenced block is rewritten to before sanitization. */
export const ATTACHMENT_TAG = 'superchat-attachment';
/** Fenced-code language that marks an attachment block. */
export const ATTACHMENT_FENCE = 'superchat-attachment';

/** JSON payload carried by a ` ```superchat-attachment ` block. */
export interface AttachmentBlockPayload {
  /** Attachment id used as the {@link attachmentCache} key. */
  id?: string;
  /** MIME type, e.g. `video/mp4`. */
  type: string;
  /** File name (shown as a label / download name). */
  name: string;
  /** Optional inline `data:` URL fallback when the cache has no entry. */
  src?: string;
}

/**
 * Build the Markdown for an attachment block. Embed the result in a message so
 * the attachment plugin renders it.
 *
 * @example
 * const md = attachmentMarkdown({ id: att.id, type: att.type, name: att.name });
 */
export function attachmentMarkdown(payload: AttachmentBlockPayload): string {
  return ['```superchat-attachment', JSON.stringify(payload), '```'].join('\n');
}

// ---------------------------------------------------------------------------
// Offline URL resolution
// ---------------------------------------------------------------------------

type AttachmentUrlStatus = 'idle' | 'loading' | 'ready' | 'missing';

/**
 * Resolve a displayable URL for an attachment. Prefers a cached `blob:` URL
 * (offline), falling back to the inline `data:` URL when the cache is empty or
 * unavailable. The returned object URL is revoked automatically on unmount /
 * id change.
 */
export function useAttachmentUrl(
  id?: string,
  fallbackSrc?: string
): { url?: string; status: AttachmentUrlStatus } {
  const [url, setUrl] = React.useState<string | undefined>(undefined);
  const [status, setStatus] = React.useState<AttachmentUrlStatus>('idle');

  React.useEffect(() => {
    let active = true;
    let created: string | undefined;

    if (!id && !fallbackSrc) {
      setUrl(undefined);
      setStatus('idle');
      return;
    }

    setStatus('loading');
    void (async () => {
      if (id) {
        const cached = await attachmentCache.getObjectURL(id);
        if (!active) {
          if (cached) window.URL.revokeObjectURL(cached);
          return;
        }
        if (cached) {
          created = cached;
          setUrl(cached);
          setStatus('ready');
          return;
        }
      }
      if (!active) return;
      setUrl(fallbackSrc);
      setStatus(fallbackSrc ? 'ready' : 'missing');
    })();

    return () => {
      active = false;
      if (created) window.URL.revokeObjectURL(created);
    };
  }, [id, fallbackSrc]);

  return { url, status };
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

const ICON_PROPS = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

function FileGlyph() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M14 3v4a1 1 0 0 0 1 1h4" />
      <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2Z" />
    </svg>
  );
}

function DownloadGlyph() {
  return (
    <svg {...ICON_PROPS} width={16} height={16}>
      <path d="M12 3v12" />
      <path d="m7 12 5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Presentation
// ---------------------------------------------------------------------------

type AttachmentRenderKind = 'image' | 'video' | 'audio' | 'pdf' | 'file';

function kindOf(type: string): AttachmentRenderKind {
  if (type.startsWith('image/')) return 'image';
  if (type.startsWith('video/')) return 'video';
  if (type.startsWith('audio/')) return 'audio';
  if (type === 'application/pdf') return 'pdf';
  return 'file';
}

function FileChip({
  name,
  url,
  unavailable,
}: {
  name: string;
  url?: string;
  unavailable?: boolean;
}) {
  const content = (
    <>
      <span className="text-neutral-500 dark:text-neutral-400">
        <FileGlyph />
      </span>
      <span className="min-w-0 flex-1 truncate text-sm">{name}</span>
      {url && !unavailable ? (
        <span className="text-neutral-400">
          <DownloadGlyph />
        </span>
      ) : null}
    </>
  );

  const className = cn(
    'my-2 flex max-w-sm items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800',
    unavailable && 'opacity-60'
  );

  if (url && !unavailable) {
    return (
      <a
        href={url}
        download={name}
        target="_blank"
        rel="noopener noreferrer"
        title={name}
        className={cn(
          className,
          'hover:border-neutral-300 hover:bg-neutral-100 dark:hover:border-neutral-600 dark:hover:bg-neutral-700'
        )}
      >
        {content}
      </a>
    );
  }

  return (
    <div className={className} title={name}>
      {content}
      {unavailable ? (
        <span className="text-xs whitespace-nowrap text-neutral-400">
          unavailable offline
        </span>
      ) : null}
    </div>
  );
}

function AttachmentBlock({ payload }: { payload: AttachmentBlockPayload }) {
  const { id, type, name, src } = payload;
  const { url, status } = useAttachmentUrl(id || undefined, src);
  const kind = kindOf(type);

  // Opportunistically persist an inline data: URL so it renders offline next
  // time, without re-storing what's already cached.
  React.useEffect(() => {
    if (!id || !src || !attachmentCache.isAvailable()) return;
    let active = true;
    void attachmentCache.get(id).then((existing) => {
      if (active && !existing) {
        void attachmentCache.put({ id, name, type, dataUrl: src });
      }
    });
    return () => {
      active = false;
    };
  }, [id, src, name, type]);

  if (status === 'loading') {
    return (
      <div
        data-slot="superchat-attachment"
        className="my-2 h-10 max-w-sm animate-pulse rounded-lg bg-neutral-100 dark:bg-neutral-800"
        aria-label={`Loading ${name}`}
      />
    );
  }

  if (!url) {
    return (
      <div data-slot="superchat-attachment">
        <FileChip name={name} unavailable />
      </div>
    );
  }

  let body: React.ReactNode;
  switch (kind) {
    case 'image':
      body = (
        <img
          src={url}
          alt={name}
          className="max-h-80 max-w-full rounded-lg object-contain"
        />
      );
      break;
    case 'video':
      body = (
        <video
          src={url}
          controls
          className="max-h-80 max-w-full rounded-lg bg-black"
        >
          <track kind="captions" />
        </video>
      );
      break;
    case 'audio':
      body = (
        <div className="max-w-sm">
          <div className="mb-1 truncate text-xs text-neutral-500 dark:text-neutral-400">
            {name}
          </div>
          <audio src={url} controls className="w-full">
            <track kind="captions" />
          </audio>
        </div>
      );
      break;
    case 'pdf':
      body = (
        <div className="max-w-2xl overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center justify-between gap-2 border-b border-neutral-200 bg-neutral-50 px-3 py-1.5 dark:border-neutral-700 dark:bg-neutral-800">
            <span className="truncate text-sm" title={name}>
              {name}
            </span>
            <a
              href={url}
              download={name}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-700 hover:text-primary-800 dark:text-primary-300 inline-flex items-center gap-1 text-xs whitespace-nowrap"
            >
              <DownloadGlyph />
              Open
            </a>
          </div>
          <iframe src={url} title={name} className="h-96 w-full bg-white" />
        </div>
      );
      break;
    default:
      body = <FileChip name={name} url={url} />;
  }

  return <div data-slot="superchat-attachment">{body}</div>;
}

// ---------------------------------------------------------------------------
// rehype: fenced block → <superchat-attachment>{json}</superchat-attachment>
// ---------------------------------------------------------------------------

interface HastNode {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
}

function textOf(node: HastNode): string {
  if (node.type === 'text') return node.value ?? '';
  return (node.children ?? []).map(textOf).join('');
}

function isAttachmentPre(node: HastNode): boolean {
  if (node.tagName !== 'pre') return false;
  const code = node.children?.find((c) => c.tagName === 'code');
  const className = code?.properties?.className;
  const classes = Array.isArray(className) ? className : [className];
  return classes.some(
    (c) =>
      typeof c === 'string' &&
      (c === `language-${ATTACHMENT_FENCE}` || c === ATTACHMENT_FENCE)
  );
}

function rehypeAttachment() {
  return (tree: HastNode) => {
    const walk = (node: HastNode) => {
      if (!node.children) return;
      node.children = node.children.map((child) => {
        if (isAttachmentPre(child)) {
          const code = child.children?.find((c) => c.tagName === 'code');
          const raw = code ? textOf(code) : '';
          return {
            type: 'element',
            tagName: ATTACHMENT_TAG,
            properties: {},
            children: [{ type: 'text', value: raw }],
          } satisfies HastNode;
        }
        walk(child);
        return child;
      });
    };
    walk(tree);
  };
}

function childText(children: React.ReactNode): string {
  return React.Children.toArray(children)
    .map((c) => (typeof c === 'string' ? c : ''))
    .join('');
}

/**
 * Allow-list the URL schemes that may back an attachment `src`.
 *
 * The payload rides as a Markdown text child, so it bypasses `rehype-sanitize`
 * and could otherwise smuggle a `javascript:` href or a `data:text/html` /
 * `image/svg+xml` source that executes script when rendered in the PDF iframe
 * or opened in a new tab (XSS / UI-redress). We trust only object URLs,
 * http(s), and `data:` URLs — and for `data:` we reject the MIME types that a
 * browser will execute as an active document. Anything else (including
 * `javascript:` / `vbscript:`) is treated as an absent `src`.
 */
function sanitizeSrc(src: string | undefined): string | undefined {
  if (!src) return undefined;
  if (/^(?:blob:|https?:\/\/)/i.test(src)) return src;
  const dataMatch = /^data:([\w.+-]+\/[\w.+-]+)?[;,]/i.exec(src);
  if (dataMatch) {
    const mime = (dataMatch[1] ?? 'text/plain').toLowerCase();
    const EXECUTABLE_MIME =
      /^(?:text\/html|application\/xhtml\+xml|image\/svg\+xml|text\/xml|application\/xml)$/;
    return EXECUTABLE_MIME.test(mime) ? undefined : src;
  }
  return undefined;
}

function parsePayload(raw: string): AttachmentBlockPayload | null {
  try {
    const parsed = JSON.parse(raw) as Partial<AttachmentBlockPayload>;
    if (!parsed || typeof parsed.type !== 'string') return null;
    const src =
      typeof parsed.src === 'string' ? sanitizeSrc(parsed.src) : undefined;
    if (!parsed.id && !src) return null;
    return {
      id: typeof parsed.id === 'string' ? parsed.id : undefined,
      type: parsed.type,
      name: typeof parsed.name === 'string' ? parsed.name : 'attachment',
      src,
    };
  } catch {
    return null;
  }
}

function AttachmentElement({
  node: _node,
  children,
}: {
  node?: unknown;
  children?: React.ReactNode;
}) {
  const payload = parsePayload(childText(children));
  if (!payload) return null;
  return <AttachmentBlock payload={payload} />;
}

/**
 * Create the attachment render plugin: renders ` ```superchat-attachment `
 * blocks as inline image/video/audio/pdf players backed by the offline
 * {@link attachmentCache}.
 */
export function createAttachmentPlugin(): SuperChatRenderPlugin {
  return {
    name: 'attachment',
    rehypePlugins: [rehypeAttachment],
    components: {
      [ATTACHMENT_TAG]: AttachmentElement as React.ComponentType<
        Record<string, unknown>
      >,
    },
    // The payload rides as a text child; only the custom tag needs allow-listing.
    sanitizeSchema: {
      tagNames: [ATTACHMENT_TAG],
    },
  };
}
