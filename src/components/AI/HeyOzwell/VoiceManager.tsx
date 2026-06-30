/**
 * VoiceManager — the central "your voice" page (mieweb/ui#287).
 *
 * One home for voice enrollment: set up your voice, add another authorized voice (an assistant, or you
 * under a new condition), or clear everything. Built on the shipped `useSpeakerVerify` + `<VoiceSetup>`
 * components — it's a real, exported surface, not story-only code.
 *
 * Phase 1 (this): status + set-up / add / clear (everything the current store supports). Phase 2 will
 * add a labeled, individually-removable list once voiceprints are keyed by voice id — see
 * SpeakerVerify/lib/speaker-verify.js + voiceprintStore.ts.
 */
import * as React from 'react';
import { useSpeakerVerify } from './SpeakerVerify/useSpeakerVerify';
import { clearWhatPrints } from '../voiceprintStore';
import { VoiceSetup } from './VoiceSetup';

const OZ = '#0BA0E0';
const ENROLL_PHRASE = 'hey-ozwell'; // representative phrase for "is anything enrolled / how many".

export interface VoiceManagerProps {
  /** Octopus logo source, forwarded to the enrollment screen. */
  logoSrc?: string;
}

type View = 'manage' | 'enroll' | 'add';

/** The central voice-enrollment management page. */
export function VoiceManager({ logoSrc }: VoiceManagerProps) {
  const sv = useSpeakerVerify();
  const [view, setView] = React.useState<View>('manage');
  const [tick, setTick] = React.useState(0); // bump to re-read conditionCount after enroll/clear

  // conditionCount reads the store synchronously (not reactive) — re-read on ready / view change / tick.
  const conditions = React.useMemo(
    () => (sv.ready ? sv.conditionCount(ENROLL_PHRASE) : 0),
    [sv, sv.ready, view, tick]
  );
  const enrolled = conditions > 0;

  if (view === 'enroll' || view === 'add') {
    return (
      <VoiceSetup
        mode={view === 'add' ? 'add' : 'enroll'}
        logoSrc={logoSrc}
        onDone={() => {
          setTick((t) => t + 1);
          setView('manage');
        }}
      />
    );
  }

  const clearAll = () => {
    sv.clear();
    void clearWhatPrints();
    setTick((t) => t + 1);
  };

  const btn = (variant: 'primary' | 'ghost' | 'danger'): React.CSSProperties => ({
    font: '600 15px system-ui',
    padding: '12px 26px',
    borderRadius: 999,
    cursor: 'pointer',
    transition: 'background .15s, color .15s',
    ...(variant === 'primary'
      ? { border: 'none', color: '#fff', background: OZ, boxShadow: `0 8px 24px ${OZ}55` }
      : variant === 'danger'
        ? { border: '1.5px solid #fca5a5', background: 'transparent', color: '#dc2626' }
        : { border: `1.5px solid ${OZ}`, background: 'transparent', color: OZ }),
  });

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
        padding: 24,
        background: 'radial-gradient(900px 520px at 50% -5%, #e8f6fd 0%, #ffffff 58%)',
      }}
    >
      <img
        src={logoSrc ?? '/ozwell/icon.svg'}
        alt=""
        aria-hidden="true"
        draggable={false}
        style={{ width: 96, height: 98, filter: `drop-shadow(0 8px 24px ${OZ}55)`, marginBottom: 22 }}
      />
      <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: -0.5, color: '#0f2233' }}>Your voice</div>

      <div style={{ fontSize: 15, color: '#5b6b7e', maxWidth: 440, marginTop: 10, lineHeight: 1.55 }}>
        {!sv.ready && !sv.error && 'Loading…'}
        {sv.error && <span style={{ color: '#dc2626' }}>Couldn’t load the voice models — check the console.</span>}
        {sv.ready && !enrolled && 'Set up your voice so Ozwell only responds to you. You can add an assistant or extra conditions afterward.'}
        {sv.ready && enrolled &&
          `Your voice is set up — ${conditions} voice${conditions === 1 ? '' : 's'} / condition${conditions === 1 ? '' : 's'} enrolled. Add an assistant or another condition, or clear everything.`}
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginTop: 28 }}>
        {sv.ready && !enrolled && (
          <button type="button" style={btn('primary')} onClick={() => setView('enroll')}>
            Set up your voice
          </button>
        )}
        {sv.ready && enrolled && (
          <>
            <button type="button" style={btn('primary')} onClick={() => setView('add')}>
              Add a voice
            </button>
            <button type="button" style={btn('danger')} onClick={clearAll}>
              Clear all voices
            </button>
          </>
        )}
      </div>

      <div style={{ fontSize: 12.5, color: '#64748b', marginTop: 26 }}>
        Voiceprints stay on your device — they’re never uploaded.
      </div>
    </div>
  );
}
