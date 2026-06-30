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
import type { ModelStatus, ModelStatusKey } from './modelManifest';

export interface OzwellSettingsMenuProps {
  /** The trigger element — usually the <HeyOzwellToggle>. The Dropdown anchors the menu to it. */
  trigger: React.ReactElement;
  /** Controlled open state (drive from `useHeyOzwell().settingsOpen`). */
  open?: boolean;
  /** Open-state change (Dropdown fires this on click-outside / escape). */
  onOpenChange?: (open: boolean) => void;
  /** Live readiness per model for the "Models & versions" readout. */
  modelStatus?: Partial<Record<ModelStatusKey, ModelStatus>>;
  /** Set up or re-enroll the user's voice. Item hidden when omitted. */
  onVoiceEnrollment?: () => void;
  /** Add a new room / distance / background condition. Item hidden when omitted. */
  onAddCondition?: () => void;
  /** Open speaker-verify WHO/WHAT diagnostics. Item hidden when omitted. */
  onTestDiagnostics?: () => void;
  /** Open the wake-word detector test (live probabilities). Item hidden when omitted. */
  onWakeWordTest?: () => void;
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
  onVoiceEnrollment,
  onAddCondition,
  onTestDiagnostics,
  onWakeWordTest,
}: OzwellSettingsMenuProps) {
  const [modelsOpen, setModelsOpen] = React.useState(false);

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
      className="max-h-[392px] overflow-x-hidden overflow-y-auto"
    >
      <DropdownHeader title="⚙ Ozwell settings" />
      {onVoiceEnrollment && (
        <DropdownItem onClick={act(onVoiceEnrollment)}>
          <ItemLabel label="Voice enrollment" sub="Set up or re-enroll your voice" />
        </DropdownItem>
      )}
      {onAddCondition && (
        <DropdownItem onClick={act(onAddCondition)}>
          <ItemLabel label="Add a condition" sub="New room / distance / background" />
        </DropdownItem>
      )}
      {onTestDiagnostics && (
        <DropdownItem onClick={act(onTestDiagnostics)}>
          <ItemLabel label="Test & diagnostics" sub="Speaker-verify WHO/WHAT readout" />
        </DropdownItem>
      )}
      {onWakeWordTest && (
        <DropdownItem onClick={act(onWakeWordTest)}>
          <ItemLabel label="Wake-word test" sub="Detector + live probabilities" />
        </DropdownItem>
      )}
      {/* Models & versions — collapsible readout of what's running, per model (Doug). A custom row
          (not DropdownItem) so the chevron can right-align; kept open on click so expanding it
          doesn't dismiss the whole menu. */}
      <button
        type="button"
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
    </Dropdown>
  );
}
