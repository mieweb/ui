/**
 * VoiceSetup — the client-facing voice-enrollment screen (Apple "Hey Siri"-style, Ozwell-branded).
 *
 * Tap the Ozwell octopus to start; it glows and pulses with your voice, bounces on each success. One
 * guided pass builds BOTH prints (WHO speaker + WHAT phrase). Presentation over `useVoiceSetup`, which
 * owns the enrollment logic — so a host gets the whole flow as a component, not story-only code.
 */
import * as React from 'react';
import { useVoiceSetup } from './useVoiceSetup';

const OZ = '#0BA0E0'; // Ozwell octopus blue

export interface VoiceSetupProps {
  /**
   * 'enroll' (default) = fresh first-time setup. 'add' = jump straight into appending a new condition
   * (room/distance/background) to the existing voiceprint — what the settings menu's "Add a condition"
   * uses, so the user doesn't have to re-do a full enroll first.
   */
  mode?: 'enroll' | 'add';
  /** Octopus logo source. */
  logoSrc?: string;
  /** Fired when the user taps "Done" after enrollment — host closes/advances the setup surface. */
  onDone?: () => void;
}

/** On-device voice enrollment — tap the octopus, it pulses as you talk. Brand-aligned. */
export function VoiceSetup({ mode = 'enroll', logoSrc = '/ozwell/icon.svg', onDone }: VoiceSetupProps) {
  const oz = useVoiceSetup({ startAdding: mode === 'add' });
  const { phase, phrase, step, total, adding, level, ready, error } = oz;

  const octoScale = 1 + Math.min(0.32, level * 2.2);
  const glowOpacity = 0.35 + Math.min(0.6, level * 4);
  const glowScale = 1 + Math.min(0.6, level * 3);

  const big =
    phase === 'intro'
      ? adding
        ? 'Add a spot'
        : 'Meet Ozwell'
      : phase === 'done'
        ? 'You’re all set'
        : phase === 'deny'
          ? 'Let’s try that again'
          : `“${phrase}”`;
  const small =
    phase === 'intro'
      ? adding
        ? 'Tap Ozwell and say each phrase here too — a new room, distance, or background. It’s remembered alongside your other spots, not instead of them.'
        : 'Tap Ozwell and say each phrase a few times — it learns your voice so it only responds to you, privately on your device.'
      : phase === 'getready'
        ? 'Get ready…'
        : phase === 'speak'
          ? 'Now say it'
          : phase === 'gotit'
            ? 'Got it!'
            : phase === 'deny'
              ? `Say “${phrase}” clearly`
              : 'Ozwell now responds only to your voice.';
  const wrapAnim =
    phase === 'gotit' ? 'oz-bounce .6s ease' : phase === 'deny' ? 'oz-shake .5s ease' : 'oz-float 4s ease-in-out infinite';

  const canStart = phase === 'intro' && ready;

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: '#1f2733',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
        background: 'radial-gradient(900px 520px at 50% -5%, #e8f6fd 0%, #ffffff 58%)',
      }}
    >
      <style>{`
        @keyframes oz-ring { 0% { transform: translate(-50%,-50%) scale(.7); opacity:.5 } 100% { transform: translate(-50%,-50%) scale(2.2); opacity:0 } }
        @keyframes oz-float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-10px) } }
        @keyframes oz-bounce { 0% { transform: scale(1) } 35% { transform: scale(1.18) } 70% { transform: scale(.96) } 100% { transform: scale(1) } }
        @keyframes oz-shake { 0%,100% { transform: translateX(0) } 20% { transform: translateX(-10px) } 40% { transform: translateX(9px) } 60% { transform: translateX(-6px) } 80% { transform: translateX(4px) } }
        @keyframes oz-fade { from { opacity:0; transform: translateY(8px) } to { opacity:1; transform: none } }
        @keyframes oz-invite { 0%,100% { box-shadow: 0 0 0 0 ${OZ}55 } 50% { box-shadow: 0 0 0 14px ${OZ}00 } }
      `}</style>

      <div
        style={{
          position: 'relative',
          width: 260,
          height: 240,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 28,
        }}
      >
        {phase === 'speak' &&
          [0, 0.7, 1.4].map((d, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: 150,
                height: 150,
                borderRadius: '50%',
                border: `2px solid ${OZ}55`,
                animation: `oz-ring 2.1s ${d}s infinite ease-out backwards`,
              }}
            />
          ))}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: 180,
            height: 180,
            transform: `translate(-50%,-50%) scale(${glowScale.toFixed(3)})`,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${OZ}66, transparent 68%)`,
            filter: 'blur(26px)',
            opacity: glowOpacity,
            pointerEvents: 'none',
          }}
        />
        {/* a real <button> so it's keyboard-accessible; tappable only in intro */}
        <button
          type="button"
          disabled={!canStart}
          onClick={canStart ? oz.start : undefined}
          title={phase === 'intro' ? 'Tap to set up your voice' : undefined}
          aria-label={phase === 'intro' ? 'Set up your voice' : 'Ozwell'}
          style={{
            position: 'relative',
            width: 150,
            height: 150,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            background: 'transparent',
            padding: 0,
            cursor: canStart ? 'pointer' : 'default',
            animation: wrapAnim,
          }}
        >
          <div style={canStart ? { position: 'absolute', inset: 0, borderRadius: '50%', animation: 'oz-invite 2s infinite' } : undefined} />
          <img
            src={logoSrc}
            alt=""
            aria-hidden="true"
            draggable={false}
            style={{
              width: 120,
              height: 122,
              filter: `drop-shadow(0 8px 24px ${OZ}55)`,
              transform: `scale(${octoScale.toFixed(3)})`,
              transition: 'transform .08s linear',
              willChange: 'transform',
              userSelect: 'none',
            }}
          />
          {(phase === 'gotit' || phase === 'done') && (
            <div
              style={{
                position: 'absolute',
                right: -2,
                bottom: -2,
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: '#16a34a',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                boxShadow: '0 2px 10px #16a34a66',
              }}
            >
              ✓
            </div>
          )}
        </button>
      </div>

      <div key={big} style={{ fontSize: 32, fontWeight: 700, letterSpacing: -0.5, animation: 'oz-fade .35s ease', minHeight: 40, color: '#0f2233' }}>
        {big}
      </div>
      <div style={{ fontSize: 15.5, color: '#5b6b7e', maxWidth: 430, marginTop: 10, lineHeight: 1.55, minHeight: 48, padding: '0 20px' }}>{small}</div>

      {phase !== 'intro' && phase !== 'done' && (
        <div style={{ display: 'flex', gap: 8, marginTop: 26 }}>
          {Array.from({ length: total }).map((_, i) => (
            <div
              key={i}
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                transition: 'all .3s',
                background: i < step ? OZ : '#cbd5e1',
                transform: i === step ? 'scale(1.4)' : 'none',
              }}
            />
          ))}
        </div>
      )}

      <div style={{ marginTop: 34, minHeight: 48 }}>
        {phase === 'intro' &&
          (error ? (
            <div style={{ fontSize: 13, color: '#dc2626' }}>couldn’t load models — check console</div>
          ) : !ready ? (
            <div style={{ font: '13px monospace', color: '#94a3b8' }}>loading…</div>
          ) : null)}
        {phase === 'done' && (
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button
              onClick={oz.addAnotherSpot}
              style={{ font: '600 15px system-ui', padding: '12px 26px', borderRadius: 999, cursor: 'pointer', border: `1.5px solid ${OZ}`, background: 'transparent', color: OZ }}
            >
              Add another spot
            </button>
            <button
              onClick={onDone}
              style={{ font: '600 15px system-ui', padding: '12px 30px', borderRadius: 999, cursor: 'pointer', border: 'none', color: '#fff', background: OZ, boxShadow: `0 8px 24px ${OZ}55` }}
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
