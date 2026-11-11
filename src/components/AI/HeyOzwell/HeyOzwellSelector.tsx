/**
 * Hey Ozwell — wake-word selector for the row below `ChatComposer` (mieweb/ui#569).
 *
 * Presentational: the host runs the wake-word listener (e.g. `useWakeWord`) and maps its state to
 * `phase`; the selector shows it on the trigger icon, offers Activate / Disable (and optional
 * "Voice settings…"), and announces phase changes through a polite status region.
 */

import * as React from 'react';
import { AudioWaveform } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { ComposerSelector } from '../../ChatComposer/ComposerSelector';
import { AlertTriangleIcon, LoaderIcon, SettingsIcon } from '../../Icons';

export type HeyOzwellSelectorPhase = 'off' | 'loading' | 'listening' | 'error';

/** All visible and announced text, so hosts can translate it. */
export interface HeyOzwellSelectorLabels {
  /** Trigger text and accessible name. */
  name: string;
  activate: string;
  activateDescription: string;
  disable: string;
  disableDescription: string;
  settings: string;
  /** Status announcements, one per phase. */
  off: string;
  loading: string;
  listening: string;
  error: string;
}

export const defaultHeyOzwellSelectorLabels: HeyOzwellSelectorLabels = {
  name: 'Hey Ozwell',
  activate: 'Activate',
  activateDescription: 'Listen for "Hey Ozwell"',
  disable: 'Disable',
  disableDescription: 'Wake word off',
  settings: 'Voice settings…',
  off: 'Hey Ozwell is off',
  loading: 'Hey Ozwell is starting',
  listening: 'Listening for "Hey Ozwell"',
  error: 'Hey Ozwell could not start',
};

export interface HeyOzwellSelectorProps {
  /** Wake-word state, mapped by the host from its listener (see the story Example). */
  phase: HeyOzwellSelectorPhase;
  /** Called with `true` for Activate and `false` for Disable when the choice changes (Activate also retries from `error`). */
  onChange: (active: boolean) => void;
  /** Adds a "Voice settings…" item when set. */
  onOpenSettings?: () => void;
  /** Error detail shown under Activate while `phase` is `error`. */
  error?: string;
  disabled?: boolean;
  labels?: Partial<HeyOzwellSelectorLabels>;
}

const iconClasses = 'h-3.5 w-3.5 shrink-0';

const phaseIcons: Record<HeyOzwellSelectorPhase, React.ReactNode> = {
  off: <AudioWaveform className={iconClasses} aria-hidden="true" />,
  loading: (
    <LoaderIcon
      className={cn(iconClasses, 'animate-spin')}
      aria-hidden="true"
    />
  ),
  listening: (
    <AudioWaveform
      className={cn(iconClasses, 'text-success')}
      aria-hidden="true"
    />
  ),
  error: (
    <AlertTriangleIcon
      className={cn(iconClasses, 'text-destructive')}
      aria-hidden="true"
    />
  ),
};

/** Quiet "Hey Ozwell" on/off menu for `ChatComposer`'s `selectorsEndSlot`. */
export function HeyOzwellSelector({
  phase,
  onChange,
  onOpenSettings,
  error,
  disabled,
  labels: labelOverrides,
}: HeyOzwellSelectorProps) {
  const labels = { ...defaultHeyOzwellSelectorLabels, ...labelOverrides };
  const active = phase !== 'off';

  return (
    <>
      <ComposerSelector
        options={[
          {
            id: 'on',
            label: labels.activate,
            description:
              phase === 'error'
                ? (error ?? labels.error)
                : labels.activateDescription,
          },
          {
            id: 'off',
            label: labels.disable,
            description: labels.disableDescription,
          },
        ]}
        value={active ? 'on' : 'off'}
        onChange={(id) => {
          const next = id === 'on';
          // Re-choosing Activate after an error is a retry.
          if (next !== active || phase === 'error') onChange(next);
        }}
        actions={
          onOpenSettings && [
            {
              id: 'settings',
              label: labels.settings,
              icon: <SettingsIcon className="h-4 w-4" aria-hidden="true" />,
              onSelect: onOpenSettings,
            },
          ]
        }
        label={labels.name}
        triggerLabel={labels.name}
        icon={phaseIcons[phase]}
        disabled={disabled}
      />
      <span role="status" className="sr-only">
        {labels[phase]}
      </span>
    </>
  );
}
