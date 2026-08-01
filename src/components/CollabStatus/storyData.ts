import * as Y from 'yjs';
import {
  Awareness,
  applyAwarenessUpdate,
  encodeAwarenessUpdate,
} from 'y-protocols/awareness';
import type { YjsProviderLike } from './useYjsCollabStatus';

/**
 * Story fixtures for `CollabStatus`.
 *
 * `createLocalYjsRoom` is a **real Yjs room** (real `Y.Doc` + `Awareness`, real
 * update encoding) whose transport is an in-memory hub instead of a WebSocket.
 * That lets the stories exercise the exact `useYjsCollabStatus` code path —
 * sync, presence join/leave, remote-edit attribution — with no server running,
 * so it also works in CI and the Storybook test runner.
 */

type Handler = (...args: unknown[]) => void;

/** Minimal event emitter with the `on`/`off` surface the hook expects. */
class Emitter {
  private handlers = new Map<string, Set<Handler>>();

  on(event: string, handler: Handler) {
    const set = this.handlers.get(event) ?? new Set<Handler>();
    set.add(handler);
    this.handlers.set(event, set);
  }

  off(event: string, handler: Handler) {
    this.handlers.get(event)?.delete(handler);
  }

  emit(event: string, ...args: unknown[]) {
    this.handlers.get(event)?.forEach((h) => h(...args));
  }
}

/** A `y-websocket`-shaped provider backed by {@link LocalYjsRoom}. */
class LocalProvider extends Emitter implements YjsProviderLike {
  synced = false;

  constructor(
    readonly roomname: string,
    readonly url: string,
    readonly awareness: Awareness
  ) {
    super();
  }

  markSynced(value: boolean) {
    this.synced = value;
    this.emit('status', { status: value ? 'connected' : 'disconnected' });
    this.emit('sync', value);
  }
}

export interface LocalYjsMember {
  doc: Y.Doc;
  awareness: Awareness;
  provider: LocalProvider;
  /** Disconnect this member and clear its presence for everyone else. */
  leave: () => void;
}

/**
 * A real Yjs room whose peers relay updates through memory. Every member gets
 * its own `Y.Doc` and `Awareness`, exactly as separate browser tabs would.
 */
export class LocalYjsRoom {
  private members = new Set<LocalYjsMember>();

  constructor(
    readonly name = 'case/4',
    readonly url = 'memory://storybook'
  ) {}

  /** Add a member. `syncDelay` simulates the initial server round-trip. */
  join(syncDelay = 400): LocalYjsMember {
    const doc = new Y.Doc();
    const awareness = new Awareness(doc);
    const provider = new LocalProvider(this.name, this.url, awareness);

    // Catch the newcomer up with the room's current state.
    for (const peer of this.members) {
      Y.applyUpdate(doc, Y.encodeStateAsUpdate(peer.doc), provider);
      const ids = [...peer.awareness.getStates().keys()];
      applyAwarenessUpdate(
        awareness,
        encodeAwarenessUpdate(peer.awareness, ids),
        provider
      );
      break;
    }

    const onDocUpdate = (update: Uint8Array, origin: unknown) => {
      if (origin === provider) return; // came from the hub; don't echo it back
      for (const peer of this.members) {
        if (peer.provider === provider) continue;
        Y.applyUpdate(peer.doc, update, peer.provider);
      }
    };
    doc.on('update', onDocUpdate);

    const onAwareness = (
      changed: { added: number[]; updated: number[]; removed: number[] },
      origin: unknown
    ) => {
      if (origin === provider) return;
      const ids = [...changed.added, ...changed.updated, ...changed.removed];
      const update = encodeAwarenessUpdate(awareness, ids);
      for (const peer of this.members) {
        if (peer.provider === provider) continue;
        applyAwarenessUpdate(peer.awareness, update, peer.provider);
      }
    };
    awareness.on('update', onAwareness);

    const member: LocalYjsMember = {
      doc,
      awareness,
      provider,
      leave: () => {
        this.members.delete(member);
        doc.off('update', onDocUpdate);
        awareness.off('update', onAwareness);
        // Clear presence, then push that removal so peers log "left the room".
        awareness.setLocalState(null);
        const removal = encodeAwarenessUpdate(awareness, [awareness.clientID]);
        for (const peer of this.members) {
          applyAwarenessUpdate(peer.awareness, removal, peer.provider);
        }
        provider.markSynced(false);
        awareness.destroy();
        doc.destroy();
      },
    };

    this.members.add(member);
    window.setTimeout(() => provider.markSynced(true), syncDelay);
    return member;
  }

  /** Type into the shared `notes` text as this member, like a real edit. */
  static type(member: LocalYjsMember, text: string) {
    const notes = member.doc.getText('notes');
    member.doc.transact(() => notes.insert(notes.length, text));
  }
}

/** Static log fixture for the presentational (transport-free) stories. */
export const sampleLog = [
  {
    id: 4,
    at: Date.now() - 2_000,
    kind: 'doc' as const,
    origin: 'remote' as const,
    detail: 'doc update · 42 bytes',
  },
  {
    id: 3,
    at: Date.now() - 9_000,
    kind: 'awareness' as const,
    origin: 'remote' as const,
    detail: 'Ann Nurse edited Case notes',
  },
  {
    id: 2,
    at: Date.now() - 21_000,
    kind: 'patch' as const,
    origin: 'local' as const,
    detail: 'edited Status',
  },
  {
    id: 1,
    at: Date.now() - 34_000,
    kind: 'sync' as const,
    detail: 'synced with server',
  },
];
