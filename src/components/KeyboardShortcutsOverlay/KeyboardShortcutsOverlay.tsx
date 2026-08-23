'use client';

import * as React from 'react';
import { Keyboard } from 'lucide-react';
import { cn } from '../../utils/cn';
import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalClose,
  ModalBody,
  ModalFooter,
} from '../Modal';

// =============================================================================
// Kbd
// =============================================================================

export type KbdProps = React.HTMLAttributes<HTMLElement>;

/** A keyboard-key chip: `<Kbd>⌘K</Kbd>`. */
export const Kbd = React.forwardRef<HTMLElement, KbdProps>(function Kbd(
  { className, ...props },
  ref
) {
  return (
    <kbd
      ref={ref}
      className={cn(
        'border-border bg-muted text-foreground rounded border px-1.5 py-0.5 font-mono text-[11px]',
        className
      )}
      {...props}
    />
  );
});

// =============================================================================
// KeyboardShortcutsOverlay
// =============================================================================

export interface ShortcutDef {
  /** Key or alternatives — `"j"`, `["j", "↓"]`, `"⌘K"`. */
  keys: string | string[];
  description: string;
}

export interface ShortcutGroup {
  title: string;
  shortcuts: ShortcutDef[];
}

export interface KeyboardShortcutsOverlayProps {
  open: boolean;
  onClose: () => void;
  /** Flat list of shortcuts, or use `groups` for sectioned help. */
  shortcuts?: ShortcutDef[];
  /** Sectioned shortcuts with group headings. */
  groups?: ShortcutGroup[];
  title?: string;
  /** Footer hint. Pass `null` to hide it. */
  hint?: React.ReactNode | null;
  /** Joins key alternatives (default "or"), overridable for i18n. */
  alternativesLabel?: string;
}

function Keys({
  keys,
  alternativesLabel,
}: {
  keys: string | string[];
  alternativesLabel: string;
}) {
  const list = Array.isArray(keys) ? keys : keys.split(' / ');
  return (
    <span className="flex shrink-0 items-center gap-1">
      {list.map((k, i) => (
        <React.Fragment key={`${k}-${i}`}>
          <Kbd>{k}</Kbd>
          {i < list.length - 1 && (
            <span className="text-muted-foreground mx-0.5 text-xs">
              {alternativesLabel}
            </span>
          )}
        </React.Fragment>
      ))}
    </span>
  );
}

function ShortcutList({
  shortcuts,
  alternativesLabel,
}: {
  shortcuts: ShortcutDef[];
  alternativesLabel: string;
}) {
  return (
    <ul className="flex list-none flex-col gap-2 p-0">
      {shortcuts.map((s) => (
        <li
          key={`${s.description}-${String(s.keys)}`}
          className="text-foreground flex items-center justify-between gap-4 text-sm"
        >
          <span className="min-w-0">{s.description}</span>
          <Keys keys={s.keys} alternativesLabel={alternativesLabel} />
        </li>
      ))}
    </ul>
  );
}

/**
 * The `?` keyboard-shortcuts help dialog: a list of shortcut rows
 * (optionally grouped) with `Kbd` chips for each key. Pairs with the
 * `useKeyboardShortcut` hook, which handles the binding — this component
 * only renders the help.
 *
 * @example
 * ```tsx
 * const [open, setOpen] = useState(false);
 * useKeyboardShortcut({ key: '?', shift: true }, () => setOpen((v) => !v));
 *
 * <KeyboardShortcutsOverlay
 *   open={open}
 *   onClose={() => setOpen(false)}
 *   shortcuts={[
 *     { keys: ['j', '↓'], description: 'Next record' },
 *     { keys: '⌘K', description: 'Command palette' },
 *   ]}
 * />
 * ```
 */
export function KeyboardShortcutsOverlay({
  open,
  onClose,
  shortcuts,
  groups,
  title = 'Keyboard shortcuts',
  hint,
  alternativesLabel = 'or',
}: KeyboardShortcutsOverlayProps) {
  const defaultHint = (
    <>
      Press <Kbd>?</Kbd> anytime to toggle this help
    </>
  );
  const footer = hint === null ? null : (hint ?? defaultHint);

  return (
    <Modal
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
      size="sm"
      aria-label={title}
    >
      <ModalHeader>
        <ModalTitle className="flex items-center gap-2 text-sm">
          <Keyboard aria-hidden="true" className="text-primary-500 h-4 w-4" />
          {title}
        </ModalTitle>
        <ModalClose />
      </ModalHeader>
      <ModalBody className="flex flex-col gap-4">
        {shortcuts && (
          <ShortcutList
            shortcuts={shortcuts}
            alternativesLabel={alternativesLabel}
          />
        )}
        {groups?.map((group) => (
          <div key={group.title} className="flex flex-col gap-2">
            <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              {group.title}
            </h3>
            <ShortcutList
              shortcuts={group.shortcuts}
              alternativesLabel={alternativesLabel}
            />
          </div>
        ))}
      </ModalBody>
      {footer && (
        <ModalFooter className="text-muted-foreground justify-center text-[11px]">
          <span>{footer}</span>
        </ModalFooter>
      )}
    </Modal>
  );
}
