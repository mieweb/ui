'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { Maximize2, Minimize2, X } from 'lucide-react';

import { cn } from '../../utils/cn';
import { useLiveAnnouncement } from '../../hooks/useLiveAnnouncement';
import { Button } from '../Button';

export type DockablePanelMode = 'full' | 'docked';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

export interface DockablePanelProps {
  /** Accessible name for the dialog, and the dock strip's default summary. */
  title: string;
  children: React.ReactNode;
  /** Called when the user closes the panel. Dirty work is confirmed first. */
  onClose: () => void;
  /** Full-screen unless the owner has collapsed the panel to the dock. */
  mode?: DockablePanelMode;
  /** Supplying this makes the panel dockable; omitting it keeps it modal. */
  onModeChange?: (mode: DockablePanelMode) => void;
  /** Whether the panel holds work the user would mind losing. */
  dirty?: boolean;
  /** What the dock strip says while collapsed; defaults to `title`. */
  dockSummary?: React.ReactNode;
  /** Confirmation shown before discarding dirty work. */
  discardMessage?: string;
  /** Portal target. Defaults to `document.body`. */
  container?: HTMLElement | null;
  /** Extra classes for the panel surface. */
  className?: string;
}

/**
 * A dialog that owns the viewport while `full` and collapses to a bottom-right
 * strip while `docked`, **without ever unmounting or resizing its content** —
 * docking clips the panel with `overflow: hidden` and leaves the layout at its
 * full-screen width. Anything inside that measures itself (a rich-text
 * toolbar's `ResizeObserver`, a chart, a virtualized list) therefore never sees
 * a width change and never rebuilds mid-edit.
 *
 * Modality follows the mode: `full` is modal (focus trap, `aria-modal`,
 * background `inert`); `docked` is deliberately not, since its whole point is
 * letting the user work behind it.
 *
 * Layer with `--mieweb-dockable-panel-z` (default 45 — above the sidebar, below
 * dropzone/chat/tooltip overlays).
 *
 * @example
 * ```tsx
 * <DockablePanel
 *   title="Compose letter"
 *   mode={mode}
 *   onModeChange={setMode}
 *   dirty={hasEdits}
 *   dockSummary={<strong>{draft.title || 'Untitled letter'}</strong>}
 *   onClose={close}
 * >
 *   <ComposeForm />
 * </DockablePanel>
 * ```
 */
export function DockablePanel({
  title,
  children,
  onClose,
  mode = 'full',
  onModeChange,
  dirty = false,
  dockSummary,
  discardMessage,
  container,
  className,
}: DockablePanelProps): React.ReactElement | null {
  const panelRef = React.useRef<HTMLDivElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const onCloseRef = React.useRef(onClose);
  onCloseRef.current = onClose;
  const onModeChangeRef = React.useRef(onModeChange);
  onModeChangeRef.current = onModeChange;
  const dirtyRef = React.useRef(dirty);
  dirtyRef.current = dirty;
  const modeRef = React.useRef(mode);
  modeRef.current = mode;
  const discardRef = React.useRef(discardMessage);
  discardRef.current = discardMessage;

  const dockable = Boolean(onModeChange);
  const docked = dockable && mode === 'docked';
  const contentId = React.useId();
  const [announcement, announce] = useLiveAnnouncement();

  const requestClose = React.useCallback((): void => {
    const view = panelRef.current?.ownerDocument.defaultView;
    // Discarding work is always deliberate; Escape and collapse never destroy.
    if (
      dirtyRef.current &&
      view?.confirm &&
      !view.confirm(discardRef.current ?? `Discard ${title}?`)
    ) {
      return;
    }
    onCloseRef.current();
  }, [title]);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape') return;
      if (dockable && dirtyRef.current && modeRef.current === 'full') {
        onModeChangeRef.current?.('docked');
        return;
      }
      requestClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [dockable, requestClose]);

  // Work held only in memory means leaving the page has to be a choice.
  React.useEffect(() => {
    if (!dirty || typeof window === 'undefined') return;
    const handleBeforeUnload = (event: globalThis.BeforeUnloadEvent): void => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [dirty]);

  // Modality is a function of mode: a docked panel must leave the app usable.
  React.useEffect(() => {
    const panel = panelRef.current;
    if (!panel || mode !== 'full') return;
    const root = panel.closest('[data-slot="dockable-panel-dock"]') ?? panel;
    const inerted = Array.from(panel.ownerDocument.body.children).filter(
      (child) =>
        child !== root && !child.contains(root) && !child.hasAttribute('inert')
    );
    for (const element of inerted) element.setAttribute('inert', '');
    return () => {
      for (const element of inerted) element.removeAttribute('inert');
    };
  }, [mode]);

  // Opening lands the caret in the content, not on the header's chrome.
  React.useEffect(() => {
    if (docked) return;
    const target =
      contentRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR) ??
      panelRef.current;
    target?.focus();
  }, [docked]);

  React.useEffect(() => {
    if (!docked) return;
    announce(`${title} collapsed to dock`);
    panelRef.current
      ?.querySelector<HTMLElement>('[data-slot="dockable-panel-restore"]')
      ?.focus();
  }, [announce, docked, title]);

  const handleTabTrap = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    if (event.key !== 'Tab' || mode !== 'full') return;
    const panel = panelRef.current;
    if (!panel) return;
    // Queried per keystroke: panel content changes while the user works.
    const focusable = Array.from(
      panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
    ).filter((element) => element.offsetParent !== null || element === panel);
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = panel.ownerDocument.activeElement;
    if (event.shiftKey && (active === first || !panel.contains(active))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const target =
    container ?? (typeof document === 'undefined' ? null : document.body);
  if (!target) return null;

  const panel = (
    <>
      {!docked && (
        <div
          data-slot="dockable-panel-scrim"
          className="fixed inset-0 bg-slate-900/45"
          style={{ zIndex: 'calc(var(--mieweb-dockable-panel-z, 45) - 1)' }}
          aria-hidden="true"
        />
      )}
      <div
        data-slot="dockable-panel-dock"
        data-mode={docked ? 'docked' : 'full'}
        className={cn(
          'fixed',
          docked
            ? 'inset-auto right-6 bottom-0 w-[26rem] max-w-[calc(100vw-3rem)] overflow-hidden max-sm:inset-x-0 max-sm:w-full max-sm:max-w-full'
            : 'inset-6 flex justify-center max-sm:inset-0'
        )}
        style={{ zIndex: 'var(--mieweb-dockable-panel-z, 45)' }}
      >
        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
        <div
          ref={panelRef}
          data-slot="dockable-panel"
          data-mode={docked ? 'docked' : 'full'}
          className={cn(
            'relative flex flex-col overflow-hidden border border-border bg-card text-card-foreground shadow-[0_1.25rem_2.5rem_rgb(15_23_42/0.22)]',
            docked
              ? 'w-full rounded-t-lg border-b-0'
              : 'h-full w-full max-w-[90rem] rounded-lg',
            className
          )}
          role="dialog"
          aria-modal={docked ? undefined : true}
          aria-label={title}
          tabIndex={-1}
          onKeyDown={handleTabTrap}
        >
          <div
            data-slot="dockable-panel-header"
            className="flex items-center justify-between gap-2 border-b border-border px-3 py-2.5"
          >
            {docked ? (
              <div
                data-slot="dockable-panel-summary"
                className="flex min-w-0 items-center gap-2 text-sm"
              >
                {dockSummary ?? title}
              </div>
            ) : (
              <h3
                data-slot="dockable-panel-title"
                className="m-0 text-[0.9375rem] font-semibold capitalize"
              >
                {title}
              </h3>
            )}
            <div className="flex items-center gap-1">
              {dockable && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  data-slot={
                    docked ? 'dockable-panel-restore' : 'dockable-panel-collapse'
                  }
                  aria-expanded={!docked}
                  aria-controls={contentId}
                  onClick={() => onModeChange?.(docked ? 'full' : 'docked')}
                  aria-label={docked ? 'Restore' : 'Collapse to dock'}
                  title={docked ? 'Restore' : 'Collapse to dock'}
                >
                  {docked ? (
                    <Maximize2 size={16} aria-hidden="true" />
                  ) : (
                    <Minimize2 size={16} aria-hidden="true" />
                  )}
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                data-slot="dockable-panel-close"
                onClick={requestClose}
                aria-label={docked ? 'Discard' : 'Close'}
                title={docked ? 'Discard' : 'Close'}
              >
                <X size={16} aria-hidden="true" />
              </Button>
            </div>
          </div>
          {/* Docked keeps the content laid out at its full-screen width and
              clips it away, rather than hiding or shrinking it. */}
          <div
            ref={contentRef}
            id={contentId}
            data-slot="dockable-panel-content"
            className={cn(
              'flex min-h-0 flex-1 flex-col',
              docked &&
                'absolute top-full right-0 h-[calc(100vh-4rem)] w-[min(90rem,100vw-3rem)] max-sm:w-screen'
            )}
          >
            {children}
          </div>
        </div>
      </div>
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
    </>
  );

  return createPortal(panel, target);
}

DockablePanel.displayName = 'DockablePanel';
