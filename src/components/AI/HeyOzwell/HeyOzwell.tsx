/**
 * Hey Ozwell — the drop-in voice entry point (mieweb/ui#287).
 *
 * Place this where your app header wants the Ozwell octopus. It renders the octopus toggle + the
 * "Ozwell settings" menu, and (while active) the library FloatingAIChat — running the whole
 * wake → open-chat → dictate → transcribe → send flow internally via `useHeyOzwell`. The chat is
 * fixed-position, so it appears correctly regardless of where this sits in the tree.
 *
 * For custom layouts (e.g. placing the chat elsewhere, or your own menu), use the `useHeyOzwell`
 * hook directly and compose <HeyOzwellToggle>, <OzwellSettingsMenu> and <FloatingAIChat> yourself.
 */
import * as React from 'react';
import { HeyOzwellToggle } from './HeyOzwellToggle';
import { OzwellSettingsMenu } from './OzwellSettingsMenu';
import { useHeyOzwell, type UseHeyOzwellOptions } from './useHeyOzwell';
import { FloatingAIChat, type FloatingAIChatProps } from '../AIChatModal';

export interface HeyOzwellProps extends UseHeyOzwellOptions {
  /** Octopus diameter in px. */
  size?: number;
  /** Octopus logo source. */
  logoSrc?: string;
  /** Long-press duration (ms) before settings open. */
  longPressMs?: number;
  /** Class name applied to the octopus toggle button. */
  className?: string;
  /** Set up or re-enroll the user's voice. Settings item hidden when omitted. */
  onVoiceEnrollment?: () => void;
  /** Add a new room / distance / background condition. Settings item hidden when omitted. */
  onAddCondition?: () => void;
  /** Open speaker-verify WHO/WHAT diagnostics. Settings item hidden when omitted. */
  onTestDiagnostics?: () => void;
  /** Open the wake-word detector test. Settings item hidden when omitted. */
  onWakeWordTest?: () => void;
  /**
   * Extra props forwarded to the FloatingAIChat (e.g. `suggestions`, `userName`). The open state,
   * messages, placeholder and send handler are wired from the hook; anything here overrides them.
   */
  chatProps?: Partial<FloatingAIChatProps>;
}

/** The Hey Ozwell octopus + settings menu + floating chat, wired end-to-end. */
export function HeyOzwell({
  size = 40,
  logoSrc,
  longPressMs,
  className,
  onVoiceEnrollment,
  onAddCondition,
  onTestDiagnostics,
  onWakeWordTest,
  chatProps,
  ...options
}: HeyOzwellProps) {
  const oz = useHeyOzwell(options);

  const toggle = (
    <HeyOzwellToggle
      {...oz.toggleProps}
      size={size}
      logoSrc={logoSrc}
      longPressMs={longPressMs}
      className={className}
    />
  );

  return (
    <>
      <OzwellSettingsMenu
        trigger={toggle}
        open={oz.settingsOpen}
        onOpenChange={oz.setSettingsOpen}
        modelStatus={oz.modelStatus}
        onVoiceEnrollment={onVoiceEnrollment}
        onAddCondition={onAddCondition}
        onTestDiagnostics={onTestDiagnostics}
        onWakeWordTest={onWakeWordTest}
      />
      {oz.active && <FloatingAIChat {...oz.chatProps} {...chatProps} />}
    </>
  );
}
