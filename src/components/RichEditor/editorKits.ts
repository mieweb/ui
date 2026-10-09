/**
 * Editor kit assembly for {@link RichEditor}, for both plain and collaborative
 * (Yjs) mode.
 *
 * Both modes start from {@link AdvancedEditorKit} and drop the extensions that
 * are unsafe for our usage — see {@link unsafeExtensions} — then collaborative
 * mode adds the Yjs pieces on top.
 *
 * The Yjs pieces live in `collabKit.ts` behind a dynamic `import()`, so
 * `@kerebron/extension-yjs`, `yjs` and `y-protocols` remain truly optional
 * peers — plain-mode consumers never load them.
 */
import type { EditorKit } from '@kerebron/editor';
import { AdvancedEditorKit } from '@kerebron/editor-kits/AdvancedEditorKit';
import {
  ExtensionMediaUpload,
  type MediaUploadOptions,
} from '@kerebron/extension-basic-editor/ExtensionMediaUpload';

export type { MediaUploadOptions };

export interface CollabConfig {
  /** Room id — one shared document per room (e.g. a post id). */
  room: string;
  /**
   * WebSocket base URL for the Yjs relay. Defaults to
   * `<ws|wss>://<location.host>/yjs`. The room id is appended by the provider.
   */
  wsUrl?: string;
  /** Extra query params for the socket (e.g. `{ token }` for auth). */
  params?: Record<string, string>;
  /**
   * Who this editor is, published on awareness (`kerebron:user`) so peers see
   * a named, coloured cursor. Without it remote cursors do not render — the
   * position plugin skips awareness states that carry no user — and the
   * `id` is what the cursor colour is derived from (kerebron's `User` shape).
   */
  user?: { id: string; name: string; color?: string };
  /**
   * Custom WebSocket implementation handed to the Yjs provider — e.g. a
   * loopback socket for demos/tests, or a polyfill outside the browser.
   * Defaults to `globalThis.WebSocket`.
   */
  WebSocketPolyfill?: typeof globalThis.WebSocket;
  /**
   * Called when collaborative editing could not be started at all — the Yjs
   * kit failed to load (see {@link createEditorKits}). The editor mounts
   * anyway, as a local one; this is how the host finds out that edits are no
   * longer shared, so it can say so, or tear its own editor down if unshared
   * editing would be unsafe.
   *
   * Not for connection trouble: a room that is reachable but currently
   * disconnected still has the Yjs kit loaded, and the provider retries on its
   * own. This fires once, before the editor is created.
   */
  onUnavailable?: (error: unknown) => void;
}

/** What {@link createEditorKits} resolves to. */
export interface EditorKits {
  kits: EditorKit[];
  /**
   * Whether the returned kits can actually collaborate. False when `config`
   * asked for a room but the Yjs kit could not be loaded, so callers know not
   * to join one.
   */
  collaborative: boolean;
}

/**
 * Extensions dropped from {@link AdvancedEditorKit}, and why.
 *
 * `autocomplete` and `hover` debounce their DOM handlers (200ms) and then call
 * `dispatchMeta`, which reads `this.editor.state` with no guard that the editor
 * is still alive. Any teardown or document swap inside that debounce window
 * lands the deferred call on a dead view and throws
 * `null.matchesNode()` inside ProseMirror's `EditorView.updateStateInner`,
 * leaving the view permanently broken. Two ways to hit it:
 *   - remount (e.g. a `key` change) while the pointer is over the editor, which
 *     fires the debounced `onMouseLeave` after the view is destroyed;
 *   - a Yjs remote update replacing the document tree under a pending callback.
 * The first applies to *every* editor, so both extensions come out in both
 * modes. No functional cost — autocomplete popups and node-hover tooltips are
 * compositor conveniences, not required for editing.
 *
 * `history` is collab-only: ExtensionYjs supplies its own CRDT-aware undo/redo
 * and the editor throws `Extension conflict: yjs vs history` if both are
 * present. Plain mode keeps it, so undo/redo still works there.
 */
const unsafeExtensions = ['autocomplete', 'hover'] as const;

/**
 * {@link AdvancedEditorKit} minus {@link unsafeExtensions} (and, for collab
 * mode, minus `history`), with `mediaUpload` reconfigured when the host asks.
 *
 * `AdvancedEditorKit` constructs `ExtensionMediaUpload` with no options, and an
 * extension's options are fixed at construction — so the only way to configure
 * it is to drop that instance and append one of our own.
 */
class SafeAdvancedEditorKit implements EditorKit {
  name = 'advanced-editor';
  constructor(
    private readonly forCollab: boolean,
    private readonly mediaUpload?: MediaUploadOptions
  ) {}

  getExtensions() {
    const dropped: string[] = [...unsafeExtensions];
    if (this.forCollab) dropped.push('history');
    if (this.mediaUpload) dropped.push('mediaUpload');

    const extensions = new AdvancedEditorKit()
      .getExtensions()
      .filter(
        (extension) =>
          !('name' in extension && dropped.includes(extension.name))
      );

    if (this.mediaUpload) {
      extensions.push(new ExtensionMediaUpload(this.mediaUpload));
    }
    return extensions;
  }
}

/** MarkYChange + ExtensionYjs live in `collabKit.ts` (lazy-loaded). */

/**
 * Build the editor kits for a session. Pass `config` to join a collaborative
 * room; omit it for a plain local editor. Pass `mediaUpload` to configure how
 * pasted/dropped files are handled — most importantly `uploadHandler`, without
 * which every image is embedded in the document as a base64 `data:` URL.
 *
 * Async because collaborative mode lazy-loads the Yjs kit (and its optional
 * peer deps) on first use; plain mode resolves immediately.
 *
 * That lazy load is allowed to fail. `@kerebron/extension-yjs`, `yjs` and
 * `y-protocols` are optional peers, so the chunk can be absent (peers never
 * installed), stale (a dev server's dependency hash moved under a running
 * page) or simply unreachable (a partial deploy, an offline client). None of
 * that is a reason to leave the caller without an editor: collaboration is an
 * enhancement, editing is the feature. So a failed load degrades to the local
 * kit and reports itself through {@link CollabConfig.onUnavailable} rather
 * than rejecting.
 */
export async function createEditorKits(
  config?: CollabConfig,
  mediaUpload?: MediaUploadOptions
): Promise<EditorKits> {
  if (!config) {
    return {
      kits: [new SafeAdvancedEditorKit(false, mediaUpload)],
      collaborative: false,
    };
  }

  try {
    const { HuddleYjsKit, defaultWsUrl } = await import('./collabKit');
    const url = config.wsUrl ?? defaultWsUrl();
    return {
      kits: [
        new SafeAdvancedEditorKit(true, mediaUpload),
        new HuddleYjsKit(
          url,
          config.params ?? {},
          config.WebSocketPolyfill,
          config.user
        ),
      ],
      collaborative: true,
    };
  } catch (error) {
    console.warn(
      '[RichEditor] Collaborative editing unavailable — the Yjs kit failed to load. Continuing as a local editor.',
      error
    );
    config.onUnavailable?.(error);
    // Degrading to a local editor must not also drop `mediaUpload`: without it
    // the stock extension comes back and pasted files are embedded as base64.
    return {
      kits: [new SafeAdvancedEditorKit(false, mediaUpload)],
      collaborative: false,
    };
  }
}
