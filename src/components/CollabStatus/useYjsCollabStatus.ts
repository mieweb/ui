import * as React from 'react';
import type {
  CollabLogEntry,
  CollabPeer,
  CollabRoomInfo,
} from './CollabStatus';

/* eslint-disable @typescript-eslint/no-explicit-any */

// =============================================================================
// Structural Yjs types
// =============================================================================
//
// Declared structurally (as methods, so parameter bivariance applies) rather
// than imported from `yjs` / `y-protocols`, so `@mieweb/ui` needs no Yjs
// dependency at all. A real `Y.Doc`, `Awareness` and `WebsocketProvider`
// satisfy these as-is.

/** The subset of `Y.Doc` this hook observes. */
export interface YjsDocLike {
  clientID: number;
  on(event: string, handler: (...args: any[]) => void): void;
  off(event: string, handler: (...args: any[]) => void): void;
}

/** The subset of `y-protocols/awareness`.`Awareness` this hook uses. */
export interface YjsAwarenessLike {
  clientID: number;
  getStates(): Map<number, Record<string, any>>;
  setLocalStateField(field: string, value: unknown): void;
  on(event: string, handler: (...args: any[]) => void): void;
  off(event: string, handler: (...args: any[]) => void): void;
}

/** The subset of `y-websocket`.`WebsocketProvider` this hook uses. */
export interface YjsProviderLike {
  awareness: YjsAwarenessLike;
  /** True once the initial sync completed (y-websocket exposes this). */
  synced?: boolean;
  /** Room name, used as the default label in the debug panel. */
  roomname?: string;
  /** Server URL, used as the default label in the debug panel. */
  url?: string;
  on(event: string, handler: (...args: any[]) => void): void;
  off(event: string, handler: (...args: any[]) => void): void;
}

/** Awareness payload published whenever this window makes a local edit. */
interface EditActivity {
  at: number;
  fields: string[];
}

/** A remote collaborator's edit that just changed the open document. */
export interface CollabRemoteEdit {
  /** Human-readable labels of the fields that changed. */
  fields: string[];
  /** Who made the change, when attributable from presence. */
  by?: string;
  /** Timestamp; a new value signals a fresh growl/toast. */
  at: number;
}

export interface UseYjsCollabStatusOptions {
  /** The shared document. Pass null to keep the hook inert. */
  doc: YjsDocLike | null | undefined;
  /** The sync provider (e.g. `y-websocket`). Pass null to keep it inert. */
  provider: YjsProviderLike | null | undefined;
  /**
   * Presence identity published for this window. Defaults to
   * `User <clientID>` so windows are distinguishable without a login.
   */
  user?: { name?: string; color?: string };
  /** Room label for the debug panel. Defaults to `provider.roomname`. */
  roomName?: string;
  /** URL label for the debug panel. Defaults to `provider.url`. */
  url?: string;
  /** Application user id shown in the debug panel. */
  userId?: string;
  /** Maximum log entries kept in memory. Default 100. */
  logCap?: number;
}

export interface YjsCollabStatus {
  /** True once the initial server sync completed. */
  connected: boolean;
  /** Other windows currently present in the room. */
  peers: CollabPeer[];
  /** Recent collaboration events, newest first. */
  log: CollabLogEntry[];
  /** Room identity for the debug panel. */
  room: CollabRoomInfo | null;
  /** The most recent remote edit, or null. */
  lastRemoteEdit: CollabRemoteEdit | null;
  /**
   * Announce a local edit and the fields it touched, so other windows can
   * attribute it. Also records a `patch` log entry.
   */
  publishActivity: (fields: string[]) => void;
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Bind {@link CollabStatus} to a Yjs room: tracks initial-sync state, publishes
 * this window's presence, tracks peers joining/leaving, attributes remote edits,
 * and keeps a capped log of document/awareness/sync events.
 *
 * The return value is spreadable straight into the component.
 *
 * @example
 * ```tsx
 * import * as Y from 'yjs';
 * import { WebsocketProvider } from 'y-websocket';
 * import { CollabStatus, useYjsCollabStatus } from '@mieweb/ui';
 *
 * function Header({ caseId }: { caseId: string }) {
 *   const doc = React.useMemo(() => new Y.Doc(), []);
 *   const provider = React.useMemo(
 *     () => new WebsocketProvider('ws://localhost:1234', `case/${caseId}`, doc),
 *     [doc, caseId]
 *   );
 *   React.useEffect(() => () => provider.destroy(), [provider]);
 *
 *   const status = useYjsCollabStatus({ doc, provider, user: { name: 'Ann' } });
 *   return <CollabStatus {...status} />;
 * }
 * ```
 */
export function useYjsCollabStatus({
  doc,
  provider,
  user,
  roomName,
  url,
  userId,
  logCap = 100,
}: UseYjsCollabStatusOptions): YjsCollabStatus {
  const [connected, setConnected] = React.useState(false);
  const [peers, setPeers] = React.useState<CollabPeer[]>([]);
  const [lastRemoteEdit, setLastRemoteEdit] =
    React.useState<CollabRemoteEdit | null>(null);
  const [log, setLog] = React.useState<CollabLogEntry[]>([]);

  const logIdRef = React.useRef(0);
  const awarenessRef = React.useRef<YjsAwarenessLike | null>(null);
  /** Effective display name published to presence. */
  const selfNameRef = React.useRef('');
  /** Last activity timestamp seen per remote client, to detect new edits. */
  const activitySeen = React.useRef(new Map<number, number>());
  /** Names present, keyed by clientID, to detect join/leave. */
  const peerNames = React.useRef(new Map<number, string>());

  const pushLog = React.useCallback(
    (entry: Omit<CollabLogEntry, 'id' | 'at'>) => {
      const full: CollabLogEntry = {
        id: ++logIdRef.current,
        at: Date.now(),
        ...entry,
      };
      setLog((prev) => [full, ...prev].slice(0, logCap));
    },
    [logCap]
  );

  const selfName = user?.name?.trim();
  const selfColor = user?.color;

  React.useEffect(() => {
    if (!doc || !provider) {
      setConnected(false);
      setPeers([]);
      setLastRemoteEdit(null);
      return;
    }

    const awareness = provider.awareness;
    awarenessRef.current = awareness;
    activitySeen.current = new Map();
    peerNames.current = new Map();
    setConnected(provider.synced ?? false);

    // Remote updates arrive with `origin === provider`; local transactions have
    // a null origin — that is what labels the log entry.
    const onDocUpdate = (update: Uint8Array, origin: unknown) => {
      pushLog({
        kind: 'doc',
        origin: origin === provider ? 'remote' : 'local',
        detail: `doc update · ${update.byteLength} bytes`,
      });
    };
    doc.on('update', onDocUpdate);

    const onSync = (isSynced: boolean) => {
      setConnected(isSynced);
      pushLog({
        kind: 'sync',
        detail: isSynced ? 'synced with server' : 'disconnected',
      });
    };
    provider.on('sync', onSync);

    const onStatus = (event: { status?: string }) => {
      if (event?.status === 'disconnected') setConnected(false);
    };
    provider.on('status', onStatus);

    const onAwareness = () => {
      const others: CollabPeer[] = [];
      const present = new Map<number, string>();
      let freshest: CollabRemoteEdit | null = null;

      awareness.getStates().forEach((state, clientId) => {
        if (clientId === awareness.clientID) return; // skip this window
        const peer = state.user as CollabPeer | undefined;
        if (peer?.name) {
          others.push({ name: peer.name, color: peer.color });
          present.set(clientId, peer.name);
        }
        const activity = state.activity as EditActivity | undefined;
        if (
          activity &&
          activity.at > (activitySeen.current.get(clientId) ?? 0)
        ) {
          activitySeen.current.set(clientId, activity.at);
          if (!freshest || activity.at > freshest.at) {
            const sameUser = !!peer?.name && peer.name === selfNameRef.current;
            freshest = {
              fields: activity.fields,
              by: sameUser ? 'You (another window)' : peer?.name,
              at: activity.at,
            };
          }
        }
      });

      for (const [clientId, name] of present) {
        if (!peerNames.current.has(clientId)) {
          pushLog({
            kind: 'awareness',
            origin: 'remote',
            detail: `${name} joined the room`,
          });
        }
      }
      for (const [clientId, name] of peerNames.current) {
        if (!present.has(clientId)) {
          pushLog({
            kind: 'awareness',
            origin: 'remote',
            detail: `${name} left the room`,
          });
        }
      }
      peerNames.current = present;
      setPeers(others);

      if (freshest) {
        const edit = freshest as CollabRemoteEdit;
        setLastRemoteEdit(edit);
        pushLog({
          kind: 'awareness',
          origin: 'remote',
          detail: `${edit.by ?? 'peer'} edited ${edit.fields.join(', ')}`,
        });
      }
    };
    awareness.on('change', onAwareness);

    return () => {
      doc.off('update', onDocUpdate);
      provider.off('sync', onSync);
      provider.off('status', onStatus);
      awareness.off('change', onAwareness);
      awarenessRef.current = null;
      activitySeen.current = new Map();
      peerNames.current = new Map();
      setConnected(false);
      setPeers([]);
      setLastRemoteEdit(null);
      setLog([]);
    };
  }, [doc, provider, pushLog]);

  // Publish (and re-publish) this window's presence without tearing the room
  // down when the display name changes. Runs after the room effect above, which
  // is what populates `awarenessRef`.
  React.useEffect(() => {
    const awareness = awarenessRef.current;
    if (!awareness) return;
    const name = selfName || `User ${awareness.clientID}`;
    selfNameRef.current = name;
    awareness.setLocalStateField('user', { name, color: selfColor });
  }, [provider, selfName, selfColor]);

  const publishActivity = React.useCallback(
    (fields: string[]) => {
      awarenessRef.current?.setLocalStateField('activity', {
        at: Date.now(),
        fields,
      } satisfies EditActivity);
      pushLog({
        kind: 'patch',
        origin: 'local',
        detail: `edited ${fields.join(', ')}`,
      });
    },
    [pushLog]
  );

  const room: CollabRoomInfo | null =
    doc && provider
      ? {
          name: roomName ?? provider.roomname ?? 'room',
          url: url ?? provider.url,
          clientId: doc.clientID,
          userId,
        }
      : null;

  return { connected, peers, log, room, lastRemoteEdit, publishActivity };
}
