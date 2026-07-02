/**
 * Hey Ozwell — the "Ozwell settings" menu (mieweb/ui#287).
 *
 * Opened by right-click / long-press on the octopus toggle. Built on the shared MIE `Dropdown` so it
 * inherits the design-system styling, theming, click-outside / escape handling and a11y tokens (vs the
 * hand-rolled menu it replaces). The host passes the toggle as the `trigger` and wires the action
 * callbacks (where each item navigates is host-specific). The "Models & versions" readout collapses in
 * via `ModelInfoList`, driven by the live `modelStatus` from `useHeyOzwell`.
 */
import * as React from 'react';
import { cn } from '../../../utils/cn';
import {
  Dropdown,
  DropdownHeader,
  DropdownItem,
  type DropdownProps,
} from '../../Dropdown';
import { ModelInfoList } from './ModelInfoList';
import { switchTrackVariants, switchThumbVariants } from '../../Switch';
import type { ModelStatus, ModelStatusKey } from './modelManifest';

/** A live on/off setting rendered as a switch row inside the menu (e.g. doctor-only, live caption,
 *  server transcription). Flipping it keeps the menu open — it's a persistent control, not a one-shot action. */
export interface OzwellSettingToggle {
  id: string;
  label: string;
  sub?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export interface OzwellSettingsMenuProps {
  /** The trigger element — usually the <HeyOzwellToggle>. The Dropdown anchors the menu to it. */
  trigger: React.ReactElement;
  /** Controlled open state (drive from `useHeyOzwell().settingsOpen`). */
  open?: boolean;
  /** Open-state change (Dropdown fires this on click-outside / escape). */
  onOpenChange?: (open: boolean) => void;
  /** Live readiness per model for the "Models & versions" readout. */
  modelStatus?: Partial<Record<ModelStatusKey, ModelStatus>>;
  /** Open the central voice page (set up / add / rename / remove authorized voices). Item hidden when omitted. */
  onManageVoices?: () => void;
  /** Live on/off settings rendered as switch rows (doctor-only, live caption, server transcription, …).
   *  Omit for a plain menu (the <HeyOzwell> drop-in does). */
  toggles?: OzwellSettingToggle[];
}

/** A two-line label (title + muted sub) shared by the items. */
function ItemLabel({ label, sub }: { label: string; sub: string }) {
  return (
    <span className="flex flex-1 flex-col">
      <span className="text-neutral-900 dark:text-neutral-100">{label}</span>
      <span className="text-muted-foreground text-xs font-normal">{sub}</span>
    </span>
  );
}

/** DropdownItem's default-variant classes, reused by the custom collapsible row for visual parity. */
const itemClasses = cn(
  'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm',
  'transition-colors duration-150 focus:outline-none',
  'text-neutral-700 dark:text-neutral-300',
  'hover:bg-neutral-100 dark:hover:bg-neutral-700',
  'focus:bg-neutral-100 dark:focus:bg-neutral-700'
);

/** The "Ozwell settings" dropdown menu, on the shared MIE Dropdown. */
export function OzwellSettingsMenu({
  trigger,
  open,
  onOpenChange,
  modelStatus,
  onManageVoices,
  toggles,
}: OzwellSettingsMenuProps) {
  const [modelsOpen, setModelsOpen] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  // Show a bottom fade while there's more to scroll (the menu is height-capped so the expanded "Models &
  // versions" list is otherwise cut off with no hint). Recompute on scroll + when the content grows.
  const [hasMore, setHasMore] = React.useState(false);
  const updateHasMore = React.useCallback(() => {
    const el = scrollRef.current;
    if (el) setHasMore(el.scrollTop + el.clientHeight < el.scrollHeight - 4);
  }, []);
  React.useEffect(() => {
    updateHasMore();
  }, [modelsOpen, open, modelStatus, updateHasMore]);

  // Closing the menu after an action keeps parity with the old hand-rolled menu.
  const act = (fn?: () => void) => () => {
    onOpenChange?.(false);
    fn?.();
  };

  return (
    <Dropdown
      // Dropdown clones the trigger to inject onClick / aria-* — the toggle harmlessly ignores them
      // (left-click toggles Ozwell; the menu is driven controlled via `open`). Cast to satisfy the
      // clone's prop shape without forcing those props onto HeyOzwellToggle's public API.
      trigger={trigger as DropdownProps['trigger']}
      open={open}
      onOpenChange={onOpenChange}
      placement="bottom-end"
      width={290}
      className="overflow-hidden"
    >
      {/* scroll container (height-capped) + a bottom fade overlay so it's clear there's more below */}
      <div ref={scrollRef} onScroll={updateHasMore} className="max-h-[392px] overflow-x-hidden overflow-y-auto">
      <DropdownHeader title="⚙ Ozwell settings" />
      {onManageVoices && (
        <DropdownItem onClick={act(onManageVoices)}>
          <ItemLabel label="Your voice" sub="Set up, add, or manage authorized voices" />
        </DropdownItem>
      )}
      {/* Live settings — switch rows (doctor-only, live caption, server transcription, …). The whole row
          is the toggle target (role=menuitemcheckbox); the Switch is decorative so there's one click
          target and no double-fire. Flipping does NOT close the menu — these are persistent controls. */}
      {toggles?.map((t) => (
        <button
          key={t.id}
          type="button"
          role="menuitemcheckbox"
          aria-checked={t.checked}
          disabled={t.disabled}
          onClick={() => t.onChange(!t.checked)}
          className={cn(itemClasses, t.disabled && 'cursor-not-allowed opacity-50')}
        >
          <ItemLabel label={t.label} sub={t.sub ?? ''} />
          {/* Decorative switch (the whole row IS the button, so this can't be one too) — rendered from the
              shared Switch variants so it matches the design system exactly. */}
          <span
            aria-hidden="true"
            data-state={t.checked ? 'checked' : 'unchecked'}
            className={cn(switchTrackVariants({ size: 'sm' }), 'items-center')}
          >
            <span
              data-state={t.checked ? 'checked' : 'unchecked'}
              className={switchThumbVariants({ size: 'sm' })}
            />
          </span>
        </button>
      ))}
      {/* Models & versions — collapsible readout of what's running, per model (Doug). A custom row
          (not DropdownItem) so the chevron can right-align; kept open on click so expanding it
          doesn't dismiss the whole menu. */}
      <button
        type="button"
        role="menuitem"
        aria-expanded={modelsOpen}
        onClick={() => setModelsOpen((v) => !v)}
        className={itemClasses}
      >
        <ItemLabel
          label="Models & versions"
          sub="What you’re running · where it loads from"
        />
        <span
          aria-hidden="true"
          className="text-muted-foreground text-xs transition-transform duration-150"
          style={{ transform: modelsOpen ? 'rotate(90deg)' : 'none' }}
        >
          ▸
        </span>
      </button>
      {modelsOpen && <ModelInfoList status={modelStatus} />}
      </div>
      {/* bottom fade — only while more content sits below the fold (cleared once scrolled to the end) */}
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-x-0 bottom-0 h-9 rounded-b-xl transition-opacity duration-150',
          'bg-gradient-to-t from-white to-transparent dark:from-neutral-800',
          hasMore ? 'opacity-100' : 'opacity-0'
        )}
      />
    </Dropdown>
  );
}
