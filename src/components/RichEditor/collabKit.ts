/**
 * Collaborative (Yjs) editor kit for {@link RichEditor}.
 *
 * Kept in its own module — loaded via dynamic `import()` from `editorKits.ts`
 * only when a `collab` config is passed — so `@kerebron/extension-yjs`, `yjs`
 * and `y-protocols` stay truly optional peers: plain-mode consumers never load
 * them and don't need them installed.
 *
 * The peers are themselves loaded via dynamic `import()` here, not static
 * `import`: bundlers substitute an empty stub module for absent optional
 * peers, and a static *named* import from that stub is a hard build error in
 * Rolldown-based Vite (mieweb/ui#706) — even for consumers who never enable
 * collab. A dynamic namespace import is not statically checked, so their
 * builds pass; at runtime {@link createHuddleYjsKit} validates the loaded
 * modules and rejects with a descriptive error that `createEditorKits`'
 * degrade-to-local path already handles.
 *
 * We deliberately do not use `@kerebron/editor-kits`' own `YjsEditorKit`: it
 * constructs the `WebsocketProvider` with no query params, leaving no way to
 * authenticate the socket. Here we thread caller-supplied `params` (e.g. an
 * auth token) into the provider so the backend `/yjs` route can authorize the
 * room.
 */
import type { EditorKit } from '@kerebron/editor';
import type { ExtensionYjs } from '@kerebron/extension-yjs';
import type { WebsocketProvider } from '@kerebron/extension-yjs/WebsocketProvider';
import type { MarkYChange } from '@kerebron/extension-yjs/MarkYChange';
import type * as awarenessProtocol from 'y-protocols/awareness';
import type * as Y from 'yjs';

/** Derive the default `/yjs` websocket URL from the current page origin. */
export function defaultWsUrl(): string {
  const loc = globalThis.location;
  const protocol = loc && loc.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = loc ? loc.host : 'localhost';
  return `${protocol}//${host}/yjs`;
}

/** The optional-peer constructors {@link HuddleYjsKit} needs at runtime. */
interface YjsPeers {
  ExtensionYjs: typeof ExtensionYjs;
  WebsocketProvider: typeof WebsocketProvider;
  MarkYChange: typeof MarkYChange;
  Awareness: typeof awarenessProtocol.Awareness;
  Doc: typeof Y.Doc;
}

/**
 * Import one optional peer and pluck a named export, rejecting with a
 * peer-install hint when the export is missing — which is what "installed"
 * looks like when a bundler stubbed out an absent optional dependency.
 */
async function peerExport<T>(
  specifier: string,
  exportName: string,
  load: Promise<Record<string, unknown>>
): Promise<T> {
  const mod = await load;
  const value = mod[exportName];
  if (value === undefined) {
    throw new Error(
      `[RichEditor] Optional peer "${specifier}" has no "${exportName}" export — ` +
        `it is likely not installed (bundlers stub absent optional peers). ` +
        `Collaborative editing needs @kerebron/extension-yjs, yjs and y-protocols.`
    );
  }
  return value as T;
}

/** MarkYChange + ExtensionYjs, with an authenticated websocket provider. */
class HuddleYjsKit implements EditorKit {
  name = 'yjs-editor';
  constructor(
    private readonly peers: YjsPeers,
    private readonly url: string,
    private readonly params: Record<string, string>,
    private readonly WebSocketImpl?: typeof globalThis.WebSocket,
    private readonly user?: { id: string; name: string; color?: string }
  ) {}

  getExtensions() {
    const { ExtensionYjs, WebsocketProvider, MarkYChange, Awareness, Doc } =
      this.peers;
    const url = this.url;
    const params = this.params;
    const user = this.user;
    const WebSocketImpl = this.WebSocketImpl ?? globalThis.WebSocket;
    const createYjsProvider = (roomId: string): [WebsocketProvider, Y.Doc] => {
      const ydoc = new Doc({ gc: false });
      // The provider's opts default is a *default parameter*, not a merge, so we
      // must pass every field when we want to set `params`.
      const provider = new WebsocketProvider(url, roomId, ydoc, {
        connect: true,
        awareness: new Awareness(ydoc),
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

/**
 * Load the optional Yjs peers and build the collab kit. Rejects when any peer
 * is missing/stubbed; `createEditorKits` catches that and degrades to a local
 * editor via {@link CollabConfig.onUnavailable}.
 */
export async function createHuddleYjsKit(
  url: string,
  params: Record<string, string>,
  WebSocketImpl?: typeof globalThis.WebSocket,
  user?: { id: string; name: string; color?: string }
): Promise<EditorKit> {
  const [extensionYjs, websocketProvider, markYChange, awareness, doc] =
    await Promise.all([
      peerExport<YjsPeers['ExtensionYjs']>(
        '@kerebron/extension-yjs',
        'ExtensionYjs',
        import('@kerebron/extension-yjs')
      ),
      peerExport<YjsPeers['WebsocketProvider']>(
        '@kerebron/extension-yjs/WebsocketProvider',
        'WebsocketProvider',
        import('@kerebron/extension-yjs/WebsocketProvider')
      ),
      peerExport<YjsPeers['MarkYChange']>(
        '@kerebron/extension-yjs/MarkYChange',
        'MarkYChange',
        import('@kerebron/extension-yjs/MarkYChange')
      ),
      peerExport<YjsPeers['Awareness']>(
        'y-protocols/awareness',
        'Awareness',
        import('y-protocols/awareness')
      ),
      peerExport<YjsPeers['Doc']>('yjs', 'Doc', import('yjs')),
    ]);
  return new HuddleYjsKit(
    {
      ExtensionYjs: extensionYjs,
      WebsocketProvider: websocketProvider,
      MarkYChange: markYChange,
      Awareness: awareness,
      Doc: doc,
    },
    url,
    params,
    WebSocketImpl,
    user
  );
}
