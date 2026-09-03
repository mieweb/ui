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

/** {@link AdvancedEditorKit} minus {@link unsafeExtensions} (and, for collab
 * mode, minus `history`). */
class SafeAdvancedEditorKit implements EditorKit {
  name = 'advanced-editor';
  constructor(private readonly forCollab: boolean) {}

  getExtensions() {
    const dropped: string[] = [...unsafeExtensions];
    if (this.forCollab) dropped.push('history');

    return new AdvancedEditorKit()
      .getExtensions()
      .filter(
        (extension) =>
          !('name' in extension && dropped.includes(extension.name))
      );
  }
}

/** MarkYChange + ExtensionYjs live in `collabKit.ts` (lazy-loaded). */

/**
 * Build the editor kits for a session. Pass `config` to join a collaborative
 * room; omit it for a plain local editor.
 *
 * Async because collaborative mode lazy-loads the Yjs kit (and its optional
 * peer deps) on first use; plain mode resolves immediately.
 */
export async function createEditorKits(
  config?: CollabConfig
): Promise<EditorKit[]> {
  if (!config) return [new SafeAdvancedEditorKit(false)];

  const { HuddleYjsKit, defaultWsUrl } = await import('./collabKit');
  const url = config.wsUrl ?? defaultWsUrl();
  return [
    new SafeAdvancedEditorKit(true),
    new HuddleYjsKit(
      url,
      config.params ?? {},
      config.WebSocketPolyfill,
      config.user
    ),
  ];
}
