/**
 * Collaborative (Yjs) editor kit for {@link RichEditor}.
 *
 * Kept in its own module — loaded via dynamic `import()` from `editorKits.ts`
 * only when a `collab` config is passed — so `@kerebron/extension-yjs`, `yjs`
 * and `y-protocols` stay truly optional peers: plain-mode consumers never load
 * them and don't need them installed.
 *
 * We deliberately do not use `@kerebron/editor-kits`' own `YjsEditorKit`: it
 * constructs the `WebsocketProvider` with no query params, leaving no way to
 * authenticate the socket. Here we thread caller-supplied `params` (e.g. an
 * auth token) into the provider so the backend `/yjs` route can authorize the
 * room.
 */
import type { EditorKit } from '@kerebron/editor';
import { ExtensionYjs } from '@kerebron/extension-yjs';
import { WebsocketProvider } from '@kerebron/extension-yjs/WebsocketProvider';
import { MarkYChange } from '@kerebron/extension-yjs/MarkYChange';
import * as awarenessProtocol from 'y-protocols/awareness';
import * as Y from 'yjs';

/** Derive the default `/yjs` websocket URL from the current page origin. */
export function defaultWsUrl(): string {
  const loc = globalThis.location;
  const protocol = loc && loc.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = loc ? loc.host : 'localhost';
  return `${protocol}//${host}/yjs`;
}

/** MarkYChange + ExtensionYjs, with an authenticated websocket provider. */
export class HuddleYjsKit implements EditorKit {
  name = 'yjs-editor';
  constructor(
    private readonly url: string,
    private readonly params: Record<string, string>,
    private readonly WebSocketImpl?: typeof globalThis.WebSocket,
    private readonly user?: { id: string; name: string; color?: string }
  ) {}

  getExtensions() {
    const url = this.url;
    const params = this.params;
    const user = this.user;
    const WebSocketImpl = this.WebSocketImpl ?? globalThis.WebSocket;
    const createYjsProvider = (roomId: string): [WebsocketProvider, Y.Doc] => {
      const ydoc = new Y.Doc({ gc: false });
      // The provider's opts default is a *default parameter*, not a merge, so we
      // must pass every field when we want to set `params`.
      const provider = new WebsocketProvider(url, roomId, ydoc, {
        connect: true,
        awareness: new awarenessProtocol.Awareness(ydoc),
        params,
        protocols: [],
        WebSocketPolyfill: WebSocketImpl,
        resyncInterval: -1,
        maxBackoffTime: 2500,
        disableBc: false,
      });
      // Named cursors: the position plugin skips states with no user field.
      if (user) provider.awareness.setLocalStateField('kerebron:user', user);
      return [provider, ydoc];
    };
    return [new MarkYChange(), new ExtensionYjs({ createYjsProvider })];
  }
}
