import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { RichEditor } from './RichEditor';
import { CodeEditor } from './CodeEditor';

const meta: Meta<typeof RichEditor> = {
  title: 'Components/Forms & Inputs/RichEditor',
  component: RichEditor,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
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
