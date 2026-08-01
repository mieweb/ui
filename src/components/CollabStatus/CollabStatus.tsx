import * as React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

// =============================================================================
// Types
// =============================================================================

/** Another participant currently present in the room. */
export interface CollabPeer {
  /** Display name published through presence. */
  name: string;
  /** Optional presence color (cursor/avatar tint). */
  color?: string;
}

/** Static identity of the open collaboration room, shown in the debug panel. */
export interface CollabRoomInfo {
  /** Room name on the sync server (e.g. `case/4`). */
  name: string;
  /** Transport URL the client connected to. */
  url?: string;
  /** This window's client id (stable per document), or null before connect. */
  clientId?: number | null;
  /** The acting application user id passed to the sync server. */
  userId?: string;
}

/** Category of a collaboration event in the debug log. */
export type CollabLogKind = 'doc' | 'awareness' | 'sync' | 'patch';

/** A single entry in the collaboration debug log. */
export interface CollabLogEntry {
  /** Stable key for rendering. */
  id: number | string;
  /** Wall-clock time of the event (epoch ms). */
  at: number;
  /** Event category. */
  kind: CollabLogKind;
  /** Whether this window or a peer originated it. */
  origin?: 'local' | 'remote';
  /** Human-readable detail line. */
  detail: string;
}

/** Every user-facing string, so apps can translate the widget. */
export interface CollabStatusLabels {
  /** Trigger text once the initial sync completed. */
  live: string;
  /** Trigger text before the initial sync completes. */
  connecting: string;
  /** Summary of who else is editing, e.g. `Ann, Bo are editing`. */
  editing: (names: string[]) => string;
  /** Accessible name / tooltip of the trigger button. */
  triggerLabel: string;
  /** Heading of the debug panel. */
  logTitle: (count: number) => string;
  /** Accessible name of the panel close button. */
  close: string;
  /** Shown when the log is empty. */
  empty: React.ReactNode;
  roomTerm: string;
  urlTerm: string;
  clientTerm: string;
  userTerm: string;
  /** Suffix appended to the client id once synced / while connecting. */
  clientSynced: string;
  clientConnecting: string;
}

export const defaultCollabStatusLabels: CollabStatusLabels = {
  live: 'Live',
  connecting: 'Connecting…',
  editing: (names) =>
    `${names.join(', ')} ${names.length === 1 ? 'is' : 'are'} editing`,
  triggerLabel: 'Live-sync status — open the update log',
  logTitle: (count) => `Update log (${count})`,
  close: 'Close update log',
  empty: 'No updates yet.',
  roomTerm: 'Room',
  urlTerm: 'Socket',
  clientTerm: 'Client',
  userTerm: 'User',
  clientSynced: 'synced',
  clientConnecting: 'connecting',
};

export interface CollabStatusProps {
  /** True once the room has completed its initial sync with the server. */
  connected: boolean;
  /** Other people in the room right now. */
  peers?: CollabPeer[];
  /** Recent collaboration events, newest first. */
  log?: CollabLogEntry[];
  /** Identity of the open room, shown at the top of the panel. */
  room?: CollabRoomInfo | null;
  /** Set false to render a status-only chip with no debug panel. */
  showLog?: boolean;
  /** Overrides for any user-facing string. */
  labels?: Partial<CollabStatusLabels>;
  /** Additional className for the trigger wrapper. */
  className?: string;
}

// =============================================================================
// Helpers
// =============================================================================

/** Collapse multiple windows of the same person into `Name (N)`. */
function peerLabels(peers: CollabPeer[]): string[] {
  const counts = new Map<string, number>();
  for (const p of peers) counts.set(p.name, (counts.get(p.name) ?? 0) + 1);
  return [...counts].map(([name, n]) => (n > 1 ? `${name} (${n})` : name));
}

const PANEL_OFFSET = 6;
const VIEWPORT_PADDING = 8;

/**
 * Position the panel under the trigger, right-aligned to it but clamped to the
 * viewport on both axes (it flips above the trigger when it would overflow the
 * bottom). Returns null until the panel has been measured.
 */
function useAnchoredPanel(
  open: boolean,
  anchorRef: React.RefObject<HTMLElement | null>,
  panelRef: React.RefObject<HTMLElement | null>
) {
  const [pos, setPos] = React.useState<{ top: number; left: number } | null>(
    null
  );

  React.useLayoutEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }
    const update = () => {
      const anchor = anchorRef.current;
      const panel = panelRef.current;
      if (!anchor || !panel) return;
      const a = anchor.getBoundingClientRect();
      const { offsetWidth: width, offsetHeight: height } = panel;

      const maxLeft = window.innerWidth - width - VIEWPORT_PADDING;
      const left = Math.max(
        VIEWPORT_PADDING,
        Math.min(a.right - width, Math.max(VIEWPORT_PADDING, maxLeft))
      );

      let top = a.bottom + PANEL_OFFSET;
      if (top + height > window.innerHeight - VIEWPORT_PADDING) {
        top = Math.max(VIEWPORT_PADDING, a.top - height - PANEL_OFFSET);
      }

      setPos({ top, left });
    };

    // Measured after the (hidden) panel has been laid out.
    const raf = window.requestAnimationFrame(update);
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [open, anchorRef, panelRef]);

  return pos;
}

const KIND_TONE: Record<CollabLogKind, string> = {
  doc: 'text-muted-foreground',
  awareness: 'text-primary-600 dark:text-primary-400',
  sync: 'text-success-700 dark:text-success-400',
  patch: 'text-muted-foreground',
};

// =============================================================================
// Component
// =============================================================================

/**
 * Live-collaboration status chip: a connection dot, a `Live` / `Connecting…`
 * label, a summary of who else is editing, and a click-to-open panel with the
 * room identity and a rolling log of collaboration events.
 *
 * Transport-agnostic — it renders whatever presence state you hand it. For a
 * Yjs (`y-websocket`) room, {@link useYjsCollabStatus} produces these props
 * directly:
 *
 * @example
 * ```tsx
 * const doc = React.useMemo(() => new Y.Doc(), []);
 * const provider = React.useMemo(
 *   () => new WebsocketProvider('ws://localhost:1234', 'case/4', doc),
 *   [doc]
 * );
 * const status = useYjsCollabStatus({ doc, provider, user: { name: 'Ann' } });
 *
 * return <CollabStatus {...status} />;
 * ```
 */
export function CollabStatus({
  connected,
  peers = [],
  log = [],
  room = null,
  showLog = true,
  labels: labelOverrides,
  className,
}: CollabStatusProps) {
  const labels = { ...defaultCollabStatusLabels, ...labelOverrides };
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const pos = useAnchoredPanel(open && showLog, triggerRef, panelRef);
  const titleId = React.useId();

  // Escape closes and returns focus; a pointer outside dismisses.
  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    const onPointerDown = (e: Event) => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (triggerRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [open]);

  const names = peerLabels(peers);

  const trigger = (
    <button
      type="button"
      ref={triggerRef}
      className={cn(
        'text-muted-foreground inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-xs',
        'focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none',
        showLog && 'hover:bg-muted cursor-pointer',
        className
      )}
      onClick={showLog ? () => setOpen((v) => !v) : undefined}
      disabled={!showLog}
      title={showLog ? labels.triggerLabel : undefined}
      aria-expanded={showLog ? open : undefined}
      aria-label={showLog ? labels.triggerLabel : undefined}
      data-slot="collab-status-trigger"
    >
      <span
        aria-hidden="true"
        data-slot="collab-status-dot"
        className={cn(
          'h-2 w-2 shrink-0 rounded-full',
          connected ? 'bg-success-500' : 'bg-warning-500 animate-pulse'
        )}
      />
      <span>{connected ? labels.live : labels.connecting}</span>
      {names.length > 0 && (
        <span className="truncate">{`· ${labels.editing(names)}`}</span>
      )}
    </button>
  );

  if (!showLog) return trigger;

  return (
    <span
      className="relative inline-flex items-center"
      data-slot="collab-status"
    >
      {trigger}
      {open &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={panelRef}
            role="dialog"
            aria-labelledby={titleId}
            data-slot="collab-status-panel"
            className={cn(
              'bg-card text-card-foreground border-border fixed z-50 w-[26rem] max-w-[calc(100vw-1rem)]',
              'rounded-lg border p-3 text-xs shadow-xl'
            )}
            style={{
              top: pos?.top ?? 0,
              left: pos?.left ?? 0,
              visibility: pos ? undefined : 'hidden',
            }}
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <strong id={titleId} className="text-foreground text-sm">
                {labels.logTitle(log.length)}
              </strong>
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground focus-visible:ring-ring rounded p-0.5 focus-visible:ring-2 focus-visible:outline-none"
                onClick={() => {
                  setOpen(false);
                  triggerRef.current?.focus();
                }}
                aria-label={labels.close}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            {room && (
              <dl className="border-border text-muted-foreground mb-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 border-b pb-2">
                <dt className="opacity-70">{labels.roomTerm}</dt>
                <dd className="truncate">{room.name}</dd>
                {room.url && (
                  <>
                    <dt className="opacity-70">{labels.urlTerm}</dt>
                    <dd className="truncate">{room.url}</dd>
                  </>
                )}
                <dt className="opacity-70">{labels.clientTerm}</dt>
                <dd className="truncate">
                  {room.clientId ?? '—'}
                  {` · ${connected ? labels.clientSynced : labels.clientConnecting}`}
                </dd>
                {room.userId && (
                  <>
                    <dt className="opacity-70">{labels.userTerm}</dt>
                    <dd className="truncate">{room.userId}</dd>
                  </>
                )}
              </dl>
            )}

            {log.length === 0 ? (
              <p className="text-muted-foreground">{labels.empty}</p>
            ) : (
              <ul className="max-h-72 space-y-0.5 overflow-y-auto font-mono">
                {log.map((e) => (
                  <li
                    key={e.id}
                    className="grid grid-cols-[auto_auto_1fr] gap-2"
                  >
                    <span className="text-muted-foreground opacity-70">
                      {new Date(e.at).toLocaleTimeString()}
                    </span>
                    <span
                      className={cn(
                        'whitespace-nowrap',
                        e.origin === 'remote'
                          ? 'text-primary-600 dark:text-primary-400'
                          : KIND_TONE[e.kind]
                      )}
                    >
                      {e.kind}
                      {e.origin ? `/${e.origin}` : ''}
                    </span>
                    <span className="text-foreground truncate">{e.detail}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>,
          document.body
        )}
    </span>
  );
}
