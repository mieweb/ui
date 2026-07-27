/**
 * Editor kit assembly for {@link RichEditor}, for both plain and collaborative
 * (Yjs) mode.
 *
 * Both modes start from {@link AdvancedEditorKit} and drop the extensions that
 * are unsafe for our usage — see {@link unsafeExtensions} — then collaborative
 * mode adds the Yjs pieces on top.
 *
 * We deliberately do not use `@kerebron/editor-kits`' own `YjsEditorKit`: it
 * constructs the `WebsocketProvider` with no query params, leaving no way to
 * authenticate the socket. Here we thread caller-supplied `params` (e.g. an auth
 * token) into the provider so the backend `/yjs` route can authorize the room.
 */
import type { EditorKit } from '@kerebron/editor';
import { AdvancedEditorKit } from '@kerebron/editor-kits/AdvancedEditorKit';
import { ExtensionYjs } from '@kerebron/extension-yjs';
import { WebsocketProvider } from '@kerebron/extension-yjs/WebsocketProvider';
import { MarkYChange } from '@kerebron/extension-yjs/MarkYChange';
import * as awarenessProtocol from 'y-protocols/awareness';
import * as Y from 'yjs';

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
}

/** Derive the default `/yjs` websocket URL from the current page origin. */
function defaultWsUrl(): string {
  const loc = globalThis.location;
  const protocol = loc && loc.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = loc ? loc.host : 'localhost';
  return `${protocol}//${host}/yjs`;
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
        (extension) => !('name' in extension && dropped.includes(extension.name)),
      );
  }
}

/** MarkYChange + ExtensionYjs, with an authenticated websocket provider. */
class HuddleYjsKit implements EditorKit {
  name = 'yjs-editor';
  constructor(
    private readonly url: string,
    private readonly params: Record<string, string>,
  ) {}

  getExtensions() {
    const url = this.url;
    const params = this.params;
    const createYjsProvider = (roomId: string): [WebsocketProvider, Y.Doc] => {
      const ydoc = new Y.Doc({ gc: false });
      // The provider's opts default is a *default parameter*, not a merge, so we
      // must pass every field when we want to set `params`.
      const provider = new WebsocketProvider(url, roomId, ydoc, {
        connect: true,
        awareness: new awarenessProtocol.Awareness(ydoc),
        params,
        protocols: [],
        WebSocketPolyfill: WebSocket,
        resyncInterval: -1,
        maxBackoffTime: 2500,
        disableBc: false,
      });
      return [provider, ydoc];
    };
    return [new MarkYChange(), new ExtensionYjs({ createYjsProvider })];
  }
}

/**
 * Build the editor kits for a session. Pass `config` to join a collaborative
 * room; omit it for a plain local editor.
 */
export function createEditorKits(config?: CollabConfig): EditorKit[] {
  if (!config) return [new SafeAdvancedEditorKit(false)];

  const url = config.wsUrl ?? defaultWsUrl();
  return [
    new SafeAdvancedEditorKit(true),
    new HuddleYjsKit(url, config.params ?? {}),
  ];
}
