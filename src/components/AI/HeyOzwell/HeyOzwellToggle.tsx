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

/** Ozwell octopus blue — the `ozwell` brand token (themeable; falls back to the octopus blue). */
const OZ = 'var(--mieweb-ozwell, #0BA0E0)';
/** Ready-green — the design-system success token; the inner ring completes to this the moment wake
 *  detection is ready (you can talk NOW — before Whisper finishes). */
const READY_GREEN = 'var(--mieweb-success, #10B981)';
/** Ozwell accent at `pct` opacity (glows/shadows) — themeable + dark-mode safe via color-mix. */
const ozA = (pct: number) => `color-mix(in srgb, ${OZ} ${pct}%, transparent)`;

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
  /**
   * Whether the primary (wake-detection) ring is loading — this gates whether the octopus is
   * actually usable. Fast: off → green flash → ready. Off-ramp keeps the octopus from looking
   * "unavailable" for the slower transcription warm-up (see `warm*`).
   */
  loading?: boolean;
  /**
   * Wake-detection load progress, 0..1, for the primary determinate fill ring. When omitted
   * while `loading`, the ring falls back to an indeterminate spin. Completion flashes green.
   */
  loadProgress?: number;
  /**
   * Whether transcription is still warming in the background. Shows as a thin, muted secondary
   * arc OUTSIDE the primary ring — purely informational, never implies the octopus isn't ready
   * (you can press and talk immediately; audio is captured and transcribed once this finishes).
   */
  warmActive?: boolean;
  /** Background transcription warm progress, 0..1, for the secondary arc. */
  warmProgress?: number;
  /** Optional status appended to the tooltip, e.g. "Transcription 80%". */
  loadLabel?: string;
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
  loadProgress,
  warmActive = false,
  warmProgress,
  loadLabel,
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

  // Complete the ring (full circle) for a brief beat when loading finishes, so "ready" is legible before
  // the ring gives way to the audio-reactive octopus.
  const [doneFlash, setDoneFlash] = React.useState(false);
  const wasLoading = React.useRef(loading);
  React.useEffect(() => {
    if (wasLoading.current && !loading) {
      setDoneFlash(true);
      const t = window.setTimeout(() => setDoneFlash(false), 700);
      wasLoading.current = loading;
      return () => window.clearTimeout(t);
    }
    wasLoading.current = loading;
  }, [loading]);

  // Gracefully fade the secondary (transcription) arc out when it finishes — no green flash, since the
  // single green "ready" signal belongs to wake detection. Just a soft completion so it doesn't hard-vanish.
  const [warmFade, setWarmFade] = React.useState(false);
  const wasWarm = React.useRef(warmActive);
  React.useEffect(() => {
    if (wasWarm.current && !warmActive) {
      setWarmFade(true);
      const t = window.setTimeout(() => setWarmFade(false), 500);
      wasWarm.current = warmActive;
      return () => window.clearTimeout(t);
    }
    wasWarm.current = warmActive;
  }, [warmActive]);

  // Primary ring geometry — a circle stroked from 12 o'clock, filling clockwise with loadProgress (wake).
  const ringBox = size + 6; // inset -3 on each side
  const ringStroke = 2.5;
  const ringR = (ringBox - ringStroke) / 2;
  const ringC = 2 * Math.PI * ringR;
  const hasProgress = typeof loadProgress === 'number';
  const p = hasProgress ? Math.max(0, Math.min(1, loadProgress as number)) : 0;

  // Cold-start sweep: when the ring is up but there's no real byte progress (the live detector's
  // getUserMedia + ONNX session + first inference report none), drive a synthetic determinate fill so the
  // ring VISIBLY travels. It eases toward 0.82 and STOPS there — deliberately leaving an open gap ("white
  // space") so the circle never looks finished until it truly is. Only `loading→false` (mic live +
  // pulsing) closes the gap to a full circle. See the ring render below.
  const [synthP, setSynthP] = React.useState(0);
  React.useEffect(() => {
    if (!(loading && !hasProgress)) {
      setSynthP(0);
      return;
    }
    setSynthP(0.08); // start visibly non-zero so the ring appears at once
    const id = window.setInterval(
      () => setSynthP((s) => s + (0.82 - s) * 0.12),
      60
    );
    return () => window.clearInterval(id);
  }, [loading, hasProgress]);
  const ringProgress = hasProgress ? p : synthP;

  // Secondary arc — thinner + muted, sits just OUTSIDE the primary, tracks the background transcription warm.
  const warmBox = size + 12; // inset -6
  const warmStroke = 1.5;
  const warmR = (warmBox - warmStroke) / 2;
  const warmC = 2 * Math.PI * warmR;
  const wp =
    typeof warmProgress === 'number'
      ? Math.max(0, Math.min(1, warmProgress))
      : 0;

  // Long-press / right-click → settings. A fired long-press sets a flag so the click on press-release
  // doesn't ALSO toggle. Pointer events cover mouse + touch; contextmenu covers right-click.
  const pressTimer = React.useRef<number | undefined>(undefined);
  const longFiredRef = React.useRef(false);
  React.useEffect(
    () => () => {
      if (pressTimer.current) window.clearTimeout(pressTimer.current);
    },
    []
  );

  const startPress = (e: React.PointerEvent) => {
    if (!onOpenSettings) return;
    // Long-press is a TOUCH affordance; mouse users open settings via right-click (contextmenu). Arming
    // the timer for a mouse press would open settings on a long left-click hold, which the UX copy
    // ("right-click / long-press") doesn't intend.
    if (e.pointerType === 'mouse') return;
    longFiredRef.current = false;
    pressTimer.current = window.setTimeout(() => {
      longFiredRef.current = true;
      onOpenSettings();
    }, longPressMs);
  };
  const cancelPress = () => {
    if (pressTimer.current) {
      window.clearTimeout(pressTimer.current);
      pressTimer.current = undefined;
    }
  };
  const handleClick = () => {
    if (longFiredRef.current) {
      longFiredRef.current = false;
      return;
    } // long-press already opened settings
    onToggle?.(!active);
  };
  const handleContextMenu = (e: React.MouseEvent) => {
    if (!onOpenSettings) return;
    e.preventDefault();
    cancelPress();
    // A long-press can fire the timer AND then a contextmenu (common on mobile) — don't open twice.
    if (longFiredRef.current) {
      longFiredRef.current = false;
      return;
    }
    onOpenSettings();
  };

  const settingsHint = onOpenSettings ? ' · right-click for settings' : '';
  const loadHint = loading && loadLabel ? ` · ${loadLabel}` : '';

  return (
    <button
      type="button"
      data-slot="hey-ozwell-toggle"
      aria-pressed={active}
      aria-label={
        active ? 'Hey Ozwell active — click to turn off' : 'Activate Hey Ozwell'
      }
      title={
        (loading
          ? 'Getting Ozwell ready'
          : active
            ? 'Ozwell is listening — click to turn off'
            : 'Activate Ozwell') +
        loadHint +
        settingsHint
      }
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onPointerDown={(e) => startPress(e)}
      onPointerUp={cancelPress}
      onPointerLeave={cancelPress}
      onPointerCancel={cancelPress}
      className={cn(
        'relative inline-flex cursor-pointer items-center justify-center rounded-full',
        'transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800',
        'focus-visible:ring-primary-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'dark:focus-visible:ring-offset-neutral-900',
        className
      )}
      style={{ width: size, height: size }}
    >
      {/* Listening ring — ONE continuous GREEN ring (never blue). While starting up it fills clockwise but
          DELIBERATELY stops short (ringFill capped < 1) so an open gap / "white space" stays visible — the
          circle must never look finished until the mic is actually live and pulsing. The instant that lands
          (loading→false) it closes the gap to a full circle, holds for the completion beat, then fades as
          the octopus takes over. Rendered only while `active`, and it stays mounted so the fill + fade
          animate smoothly instead of hard-swapping elements (which is what looked like a glitch). */}
      {active && (
        <svg
          aria-hidden="true"
          width={ringBox}
          height={ringBox}
          viewBox={`0 0 ${ringBox} ${ringBox}`}
          style={{
            position: 'absolute',
            inset: -3,
            pointerEvents: 'none',
            transform: 'rotate(-90deg)',
            opacity: loading || doneFlash ? 1 : 0,
            transition: 'opacity .5s ease',
          }}
        >
          {/* faint track = the visible "white space" the arc fills into */}
          <circle
            cx={ringBox / 2}
            cy={ringBox / 2}
            r={ringR}
            fill="none"
            stroke={READY_GREEN}
            strokeWidth={ringStroke}
            style={{ opacity: 0.15 }}
          />
          <circle
            cx={ringBox / 2}
            cy={ringBox / 2}
            r={ringR}
            fill="none"
            stroke={READY_GREEN}
            strokeWidth={ringStroke}
            strokeLinecap="round"
            strokeDasharray={ringC}
            strokeDashoffset={
              ringC * (1 - (loading ? Math.min(ringProgress, 0.85) : 1))
            }
            style={{ transition: 'stroke-dashoffset .3s ease' }}
          />
        </svg>
      )}
      {/* Secondary arc — thin + muted, OUTSIDE the primary ring. Background transcription warm only;
          the octopus is already usable, so this never implies "not ready". */}
      {(warmActive || warmFade) && (
        <svg
          aria-hidden="true"
          width={warmBox}
          height={warmBox}
          viewBox={`0 0 ${warmBox} ${warmBox}`}
          style={{
            position: 'absolute',
            inset: -6,
            pointerEvents: 'none',
            transform: 'rotate(-90deg)',
            // Stays mounted from active → fade so the opacity transition actually fires (soft completion).
            opacity: warmActive ? 1 : 0,
            transition: 'opacity .5s ease',
          }}
        >
          {/* faint full track so the arc reads as a ring, not a stray mark */}
          <circle
            cx={warmBox / 2}
            cy={warmBox / 2}
            r={warmR}
            fill="none"
            stroke={OZ}
            strokeWidth={warmStroke}
            strokeLinecap="round"
            style={{ opacity: 0.12 }}
          />
          <circle
            cx={warmBox / 2}
            cy={warmBox / 2}
            r={warmR}
            fill="none"
            stroke={OZ}
            strokeWidth={warmStroke}
            strokeLinecap="round"
            strokeDasharray={warmC}
            strokeDashoffset={warmC * (1 - (warmActive ? wp : 1))}
            style={{ opacity: 0.4, transition: 'stroke-dashoffset .2s linear' }}
          />
        </svg>
      )}
      {/* Volume glow — fades in only while active, scales with the room. */}
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: size * 1.7,
          height: size * 1.7,
          transform: `translate(-50%, -50%) scale(${glowScale.toFixed(3)})`,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${ozA(53)}, transparent 68%)`,
          filter: 'blur(8px)',
          opacity: glowOpacity,
          transition: 'opacity .15s linear',
          pointerEvents: 'none',
        }}
      />
      {/* One-shot "wake up" pop: a single scale bounce the instant wake detection is ready (doneFlash), so
          the octopus visibly comes alive AT wake-ready — before Whisper — even in a silent room where the
          volume vibration has nothing to react to yet. The wrapper owns the pop transform; the img owns the
          volume scale, so the two compose without fighting. Honors prefers-reduced-motion. */}
      <style>{`
        @keyframes heyozwell-wake { 0%{transform:scale(1)} 35%{transform:scale(1.18)} 70%{transform:scale(0.97)} 100%{transform:scale(1)} }
        @media (prefers-reduced-motion: reduce){ [data-oz-wake]{animation:none!important} }
      `}</style>
      <span
        data-oz-wake={doneFlash ? '' : undefined}
        style={{
          position: 'relative',
          display: 'inline-flex',
          animation: doneFlash ? 'heyozwell-wake .5s ease-out' : undefined,
        }}
      >
        <img
          src={logoSrc}
          alt=""
          aria-hidden="true"
          draggable={false}
          style={{
            width: size,
            height: size,
            userSelect: 'none',
            transform: `scale(${octoScale.toFixed(3)})`,
            transition: 'transform .08s linear, filter .3s ease',
            filter: active
              ? `drop-shadow(0 2px 8px ${ozA(40)})`
              : 'grayscale(1) opacity(0.45)',
          }}
        />
      </span>
    </button>
  );
}
