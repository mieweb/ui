/**
 * Collaborative (Yjs) editor kit assembly for {@link RichEditor}.
 *
 * The default {@link AdvancedEditorKit} bundles `ExtensionHistory` (undo/redo).
 * `ExtensionYjs` provides its own CRDT-aware history and therefore *conflicts*
 * with the `history` extension — the editor throws
 * `Extension conflict: yjs vs history` if both are present. So for collaborative
 * mode we reuse every advanced extension **except** `history`, then add the Yjs
 * pieces on top.
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

/** Advanced editing extensions minus `history`, `autocomplete`, and `hover`.
 *
 * `history` conflicts with ExtensionYjs (which supplies its own CRDT-aware
 * undo/redo). `autocomplete` and `hover` both store stale node references in
 * debounced callbacks; when a Yjs remote update replaces the document tree,
 * their deferred `dispatchMeta` calls crash with `null.matchesNode()` inside
 * ProseMirror's `EditorView.updateStateInner`, leaving the view in a
 * permanently broken state that blocks further sync. Removing them in collab
 * mode has no functional cost — autocomplete popups and node-hover tooltips are
 * compositor conveniences, not required for collaborative text editing.
 */
class CollabAdvancedEditorKit implements EditorKit {
  name = 'advanced-editor';
  getExtensions() {
    return new AdvancedEditorKit()
      .getExtensions()
      .filter(
        (extension) =>
          !('name' in extension &&
            (extension.name === 'history' ||
              extension.name === 'autocomplete' ||
              extension.name === 'hover')),
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

/** Build the editor kits for a collaborative session. */
export function createCollabEditorKits(config: CollabConfig): EditorKit[] {
  const url = config.wsUrl ?? defaultWsUrl();
  return [
    new CollabAdvancedEditorKit(),
    new HuddleYjsKit(url, config.params ?? {}),
  ];
}
