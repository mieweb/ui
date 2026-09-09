import { useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { RichEditor, type RichEditorHandle } from './RichEditor';
import { CodeEditor } from './CodeEditor';

const meta: Meta<typeof RichEditor> = {
  id: 'editors-richeditor',
  title: 'Modules/Editors/RichEditor',
  component: RichEditor,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `### What it's for

**A Markdown document editor built on Kerebron's \`CoreEditor\` (ProseMirror), with optional live collaboration.** \`RichEditor\` loads \`value\` as Markdown (\`text/x-markdown\`), renders the Kerebron **AdvancedEditorKit** toolbar and surface, and reports Markdown back through \`onChange\` on every transaction. \`RichEditorHandle\` gives \`getContent()\` (awaits the initial load — read this on submit, \`onChange\` can lag a keystroke) and \`focus()\`. \`collab={{ room, wsUrl?, params?, user?, WebSocketPolyfill? }}\` switches to a Yjs CRDT document shared by every peer in the room (the Yjs kit is lazy-loaded; \`history\` is swapped for CRDT undo). \`disabled\` makes the surface read-only and dims it; \`id\`, \`aria-label\`, \`aria-labelledby\`, \`className\` land on the host; \`showPreview\` prints the Markdown under the editor; \`assetLoad\` redirects the tree-sitter WASM grammars. The same entry exports \`CodeEditor\` (\`value\`, \`onChange\`, \`lang\` default \`typescript\`) over Kerebron's **CodeEditorKit**, plus the \`CollabConfig\` type.

Ships from the optional **\`@mieweb/ui/kerebron\`** entry, not the main barrel: install the peers \`@kerebron/editor\`, \`@kerebron/editor-kits\`, \`@kerebron/wasm\` (plus \`@kerebron/extension-yjs\`, \`yjs\`, \`y-protocols\` for \`collab\`), import \`@mieweb/ui/kerebron.css\` beside \`@mieweb/ui/styles.css\`, and serve \`@kerebron/wasm\`'s \`assets/\` directory at \`/kerebron-wasm\`.

### Use it when

- The stored format is **Markdown** — notes, templates with \`{{placeholders}}\`, documentation — and the writer needs headings, lists, tables, code blocks and a real toolbar.
- Several people edit the **same document at once** (\`collab.room\`), with a \`CollabStatus\` chip showing presence and sync.
- You need syntax-highlighted source editing — \`CodeEditor\` from the same entry.

### Don't use it when

- The stored format is **HTML**, or you need template-variable insertion and dictation from a toolbar — \`RichTextEditor\` (main barrel, no peers).
- Plain multi-line text is enough — \`Textarea\`.
- You only need to **display** Markdown — \`MarkdownRenderer\` (\`editors-markdown\`).
- The host cannot serve WASM assets or add the Kerebron peers: the editor does not start without them.

### Example

\`\`\`tsx
const editorRef = useRef<RichEditorHandle>(null);
const [saving, setSaving] = useState(false);

async function save() {
  setSaving(true);
  const markdown = await editorRef.current!.getContent();
  await api.saveNote(note.id, markdown);
  setSaving(false);
}

<span id="note-label">Progress note</span>
<RichEditor
  ref={editorRef}
  id="note-body"
  aria-labelledby="note-label"
  value={note.markdown}
  disabled={saving}
  collab={{ room: \`note/\${note.id}\`, wsUrl: \`\${wsBase}/yjs\`, params: { token }, user: me }}
/>
<CollabStatus {...presence} />
<Button onClick={save} disabled={saving}>Save</Button>
\`\`\`

\`value\` and \`collab\` are read on mount (uncontrolled); remount with \`key\` to switch documents or rooms. Pass \`user\` in collab or remote cursors will not render.

### Limitations

- Accessibility: the contenteditable surface gets \`role="textbox" aria-multiline\` **only when** you pass \`aria-label\` or \`aria-labelledby\`; the host is a \`div\`, so \`<label htmlFor>\` does not associate. Toolbar buttons, menus and keyboard shortcuts come from \`@kerebron/extension-menu\` and are outside this component's control (\`@mieweb/ui/kerebron.css\` carries layout workarounds for its overflow menu). \`disabled\` sets \`aria-disabled\` and \`pointer-events: none\` but does not remove the surface from the tab order.
- Runtime: tree-sitter WASM grammars load from \`/kerebron-wasm\` (or \`assetLoad\`); the first load per editor is serialised, so many editors on one page start one after another. \`autocomplete\` and \`hover\` extensions are removed from the kit for teardown safety. The editor mounts into a disposable child \`div\` because \`CoreEditor.destroy()\` clones its host.
- Collaboration: \`wsUrl\` defaults to \`<ws|wss>://<host>/yjs\` and the room is appended by the provider; the host must run a Yjs websocket relay. Joining an empty room seeds it from \`value\`; the component re-seeds if the sync lands as a blank overwrite (observed with extension-yjs 0.8.x). There is no offline queue, permissions or comment model.
- \`showPreview\` renders an unstyled \`<h5>Markdown Output</h5><pre>\` for debugging, not for end users. No \`placeholder\`, character count or validation props.
- i18n/RTL/theming: toolbar labels and menus are Kerebron's (English); direction and colours follow Kerebron's CSS with \`kb-component--dark\` toggled by \`useIsDarkMode\`. Peers: \`@kerebron/editor\`, \`@kerebron/editor-kits\`, \`@kerebron/wasm\` (\`>=0.8.6\`), optional \`@kerebron/extension-yjs\`, \`yjs\`, \`y-protocols\`. Entry \`@mieweb/ui/kerebron\` + \`@mieweb/ui/kerebron.css\`.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui/kerebron',
      peers: ['@kerebron/editor', '@kerebron/editor-kits', '@kerebron/wasm'],
      relationships: [
        {
          type: 'composes with',
          target: 'feedback-collabstatus',
          why: 'CollabStatus shows who else is editing and whether the Yjs document is in sync.',
        },
        {
          type: 'alternative to',
          target: 'text-inputs-textarea',
          why: 'RichEditor when the text needs formatting or collaboration; Textarea for plain multi-line text.',
        },
        {
          type: 'alternative to',
          target: 'editors-richtexteditor',
          why: 'RichEditor stores Markdown on ProseMirror via the @mieweb/ui/kerebron entry with Yjs collab; RichTextEditor stores HTML from a contentEditable div on the main barrel with variables and dictation.',
        },
        {
          type: 'composes with',
          target: 'editors-markdown',
          why: 'RichEditor emits Markdown; MarkdownRenderer displays that Markdown read-only elsewhere in the app.',
        },
        {
          type: 'alternative to',
          target: 'editors-q',
          why: 'RichEditor edits free-form Markdown prose; Q edits a structured agent configuration through a generated form plus YAML/JSON view.',
        },
      ],
    },
  },
  tags: ['autodocs', 'scope:general-purpose', 'maturity:stable'],
};

export default meta;
type Story = StoryObj<typeof meta>;

function BasicExample() {
  const [value, setValue] = useState('');
  return (
    <div className="max-w-2xl">
      <RichEditor value={value} onChange={setValue} showPreview />
    </div>
  );
}

export const Basic: Story = {
  render: () => <BasicExample />,
};

/**
 * What a document composer needs: a label pointing at the surface, a disabled
 * state while saving, and `getContent()` read on submit — `onChange` can lag
 * the last keystroke.
 */
function ComposerExample() {
  const editorRef = useRef<RichEditorHandle>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setSaved((await editorRef.current?.getContent().catch(() => '')) ?? '');
    setSaving(false);
  };

  return (
    <div className="max-w-2xl space-y-2">
      {/* Not a <label htmlFor>: the editor host is a div, not a labelable
          control — aria-labelledby carries the name instead. */}
      <span id="composer-body-label">Note</span>
      <RichEditor
        ref={editorRef}
        id="composer-body"
        aria-labelledby="composer-body-label"
        disabled={saving}
        value="Dear **{{patient}}**,"
      />
      <button type="button" onClick={save} disabled={saving}>
        {saving ? 'Saving…' : 'Save'}
      </button>
      {saved !== null && <pre>{saved}</pre>}
    </div>
  );
}

export const Composer: Story = {
  render: () => <ComposerExample />,
};

function CodeExample() {
  const [value, setValue] = useState('');
  return (
    <div className="max-w-2xl">
      <CodeEditor value={value} lang="javascript" onChange={setValue} />
    </div>
  );
}

export const Code: Story = {
  render: () => <CodeExample />,
};

function CollabExample() {
  // Unique room per mount so story remounts (and other open tabs) start fresh.
  const [room] = useState(
    () => `storybook-collab-${Math.random().toString(36).slice(2)}`
  );
  // In-page loopback relay (no server needed). In production, omit
  // `WebSocketPolyfill` and point `wsUrl` at the real `/yjs` relay,
  // optionally authenticated via `params`.
  const collab = {
    room,
    wsUrl: 'ws://loopback.invalid/yjs',
    WebSocketPolyfill:
      LoopbackWebSocket as unknown as typeof globalThis.WebSocket,
  };
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <h5 className="mb-2 text-sm font-medium">Peer A</h5>
        <RichEditor value="# Shared document" collab={collab} />
      </div>
      <div>
        <h5 className="mb-2 text-sm font-medium">Peer B</h5>
        <RichEditor collab={collab} />
      </div>
    </div>
  );
}

/**
 * Two editors joined to the same Yjs room. Type in either — edits appear in
 * both. This demo swaps the websocket for an in-page loopback relay so it
 * works without a server; in production every peer connects to the `/yjs`
 * websocket relay, optionally authenticated via `collab.params`.
 */
export const Collaborative: Story = {
  render: () => <CollabExample />,
};

/**
 * Demo-only stand-in for the `/yjs` relay: a fake `WebSocket` that relays
 * every frame to all sockets on the same URL (including the sender — the
 * y-sync protocol needs an answer to its sync-step-1 even when you're alone
 * in the room) and replays history to late joiners. Yjs updates are
 * idempotent, so the duplicate delivery is harmless.
 */
class LoopbackWebSocket {
  static rooms = new Map<
    string,
    { sockets: Set<LoopbackWebSocket>; history: ArrayBuffer[] }
  >();

  binaryType = 'arraybuffer';
  readyState = 0; // CONNECTING
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: ArrayBuffer }) => void) | null = null;
  onclose: ((event: { code: number }) => void) | null = null;
  onerror: ((event: unknown) => void) | null = null;

  private room: { sockets: Set<LoopbackWebSocket>; history: ArrayBuffer[] };

  constructor(url: string) {
    let room = LoopbackWebSocket.rooms.get(url);
    if (!room) {
      room = { sockets: new Set(), history: [] };
      LoopbackWebSocket.rooms.set(url, room);
    }
    this.room = room;
    room.sockets.add(this);
    setTimeout(() => {
      if (this.readyState !== 0) return;
      this.readyState = 1; // OPEN
      this.onopen?.();
      // Replay the room's history so late joiners catch up.
      for (const frame of this.room.history) {
        this.onmessage?.({ data: frame });
      }
    }, 0);
  }

  send(data: Uint8Array) {
    const frame = data.slice().buffer as ArrayBuffer;
    this.room.history.push(frame);
    for (const socket of this.room.sockets) {
      if (socket.readyState === 1) {
        setTimeout(() => socket.onmessage?.({ data: frame }), 0);
      }
    }
  }

  close() {
    this.readyState = 3; // CLOSED
    this.room.sockets.delete(this);
    this.onclose?.({ code: 1000 });
  }
}
