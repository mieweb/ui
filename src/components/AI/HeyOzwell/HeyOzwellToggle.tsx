/**
 * Hey Ozwell — the in-header toggle (mieweb/ui#287).
 *
 * The Ozwell octopus that lives in the top bar. Off, it sits gray and muted.
 * Activated, it turns full colour and pulses with the room volume — the same
 * mic-reactive glow as the Voice Setup enrollment screen.
 *
 * Click toggles on/off. Right-click or long-press fires `onOpenSettings` — the host
 * surfaces "Ozwell settings" (voice enrollment / re-enroll / add a condition / test).
 *
 * Presentational: the host owns on/off and feeds the live `level` (0..1) from its
 * single wake-word analyser — this component never opens the mic itself (one shared
 * mic; a second getUserMedia would silence the detector).
 */

import * as React from 'react';
import { cn } from '../../../utils/cn';

/** Ozwell octopus blue — matches the Voice Setup glow. */
const OZ = '#0BA0E0';

export interface HeyOzwellToggleProps {
  /** Whether Hey Ozwell is on. Off → gray + muted; on → colour + volume pulse. */
  active?: boolean;
  /** Called with the next active state when clicked. */
  onToggle?: (active: boolean) => void;
  /**
   * Room volume, 0..1, driving the colour pulse while active. Wire this to the
   * wake-word analyser (see Voice Setup). Ignored when inactive.
   */
  level?: number;
  /** Show a spinning ring around the octopus while models load (e.g. on reload until wake is ready). */
  loading?: boolean;
  /** Ozwell logo source. Defaults to the bundled Storybook public asset. */
  logoSrc?: string;
  /** Logo diameter in px. */
  size?: number;
  /** Additional class name. */
  className?: string;
  /** Fired on right-click or long-press — host opens "Ozwell settings" (enrollment / test). */
  onOpenSettings?: () => void;
  /** Long-press duration (ms) before settings fire. */
  longPressMs?: number;
}

/**
 * The header Ozwell octopus. Click to turn the assistant on/off; while on it
 * glows and pulses with the room volume passed via `level`. Right-click or
 * long-press opens settings.
 */
export function HeyOzwellToggle({
  active = false,
  onToggle,
  level = 0,
  loading = false,
  logoSrc = '/ozwell/icon.svg',
  size = 36,
  className,
  onOpenSettings,
  longPressMs = 500,
}: HeyOzwellToggleProps) {
  const lv = active ? Math.max(0, Math.min(1, level)) : 0;
  const octoScale = 1 + Math.min(0.28, lv * 2.2);
  const glowOpacity = active ? 0.4 + Math.min(0.55, lv * 4) : 0;
  const glowScale = 1 + Math.min(0.7, lv * 3);

  // Long-press / right-click → settings. A fired long-press sets a flag so the click on press-release
  // doesn't ALSO toggle. Pointer events cover mouse + touch; contextmenu covers right-click.
  const pressTimer = React.useRef<number | undefined>(undefined);
  const longFiredRef = React.useRef(false);
  React.useEffect(() => () => { if (pressTimer.current) window.clearTimeout(pressTimer.current); }, []);

  const startPress = () => {
    if (!onOpenSettings) return;
    longFiredRef.current = false;
    pressTimer.current = window.setTimeout(() => { longFiredRef.current = true; onOpenSettings(); }, longPressMs);
  };
  const cancelPress = () => {
    if (pressTimer.current) { window.clearTimeout(pressTimer.current); pressTimer.current = undefined; }
  };
  const handleClick = () => {
    if (longFiredRef.current) { longFiredRef.current = false; return; } // long-press already opened settings
    onToggle?.(!active);
  };
  const handleContextMenu = (e: React.MouseEvent) => {
    if (!onOpenSettings) return;
    e.preventDefault();
    cancelPress();
    onOpenSettings();
  };

  const settingsHint = onOpenSettings ? ' · right-click for settings' : '';

  return (
    <button
      type="button"
      data-slot="hey-ozwell-toggle"
      aria-pressed={active}
      aria-label={active ? 'Hey Ozwell active — click to turn off' : 'Activate Hey Ozwell'}
      title={(active ? 'Ozwell is listening — click to turn off' : 'Activate Ozwell') + settingsHint}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onPointerDown={startPress}
      onPointerUp={cancelPress}
      onPointerLeave={cancelPress}
      onPointerCancel={cancelPress}
      className={cn(
        'relative inline-flex cursor-pointer items-center justify-center rounded-full',
        'transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
        'dark:focus-visible:ring-offset-neutral-900',
        className
      )}
      style={{ width: size, height: size }}
    >
      {/* Loading ring — a spinning arc while models load (gray octopus on reload). */}
      {loading && (
        <span
          aria-hidden="true"
          className="animate-spin"
          style={{
            position: 'absolute', inset: -3, borderRadius: '50%',
            border: '2px solid transparent', borderTopColor: OZ,
            pointerEvents: 'none',
          }}
        />
      )}
      {/* Volume glow — fades in only while active, scales with the room. */}
      <span
        aria-hidden="true"
        style={{
          position: 'absolute', left: '50%', top: '50%',
          width: size * 1.7, height: size * 1.7,
          transform: `translate(-50%, -50%) scale(${glowScale.toFixed(3)})`,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${OZ}88, transparent 68%)`,
          filter: 'blur(8px)', opacity: glowOpacity,
          transition: 'opacity .15s linear', pointerEvents: 'none',
        }}
      />
      <img
        src={logoSrc}
        alt=""
        aria-hidden="true"
        draggable={false}
        style={{
          position: 'relative', width: size, height: size, userSelect: 'none',
          transform: `scale(${octoScale.toFixed(3)})`,
          transition: 'transform .08s linear, filter .3s ease',
          filter: active ? `drop-shadow(0 2px 8px ${OZ}66)` : 'grayscale(1) opacity(0.45)',
        }}
      />
    </button>
  );
}
