/**
 * Speaker verification (the doctor-only WHO gate) — with PHRASE-VALIDATED enrollment.
 *
 * Enrollment runs the wake detector: it shows the exact phrase, chimes to cue you, and only accepts a
 * rep when the wake model actually fires for THAT phrase — say the wrong phrase or mumble and it denies
 * and retries. The audio the model captured is what builds your voiceprint. Then Verify scores a live
 * "hey ozwell" against it with TitaNet, on-device, showing cosine + z-score + pass/fail.
 *
 * Composes two primitives: useWakeWord (validates the phrase + supplies the captured audio) and
 * useSpeakerVerify (builds/checks the voiceprint). All on-device.
 */
import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import { useSpeakerVerify, type VerifyResult } from './useSpeakerVerify';
import { useWakeWord } from '../WakeWord/useWakeWord';

const meta: Meta = {
  title: 'Product/Feature Modules/AI/Speaker Verify',
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'On-device speaker verification with **phrase-validated** enrollment — the wake model must actually ' +
          'fire for the requested phrase or the rep is denied. Scored as a z-score vs a cohort of other voices. ' +
          'The "who" gate that makes the wake word doctor-only.',
      },
    },
  },
};
export default meta;

const PHRASES = [
  { key: 'hey-ozwell', label: 'hey ozwell' },
  { key: "ozwell-i'm-done", label: "ozwell I'm done" },
];
const REPS = 3;
const WAKE_SR = 16000; // HeyBuddy captures utterances at 16 kHz
const TIMEOUT_MS = 9000;

const delay = (ms: number) => new Promise((r) => window.setTimeout(r, ms));

// short chime — 660 Hz "speak now", 990 Hz "got it"
function chime(freq: number, ms = 160) {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.frequency.value = freq; o.type = 'sine'; o.connect(g); g.connect(ctx.destination);
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + ms / 1000);
    o.start(); o.stop(ctx.currentTime + ms / 1000 + 0.02);
    window.setTimeout(() => { void ctx.close(); }, ms + 120);
  } catch { /* no audio out — fine */ }
}

type PhraseResult = { samples?: Float32Array; wrong?: boolean; timeout?: boolean };

function SpeakerVerifyDemo() {
  const sv = useSpeakerVerify();

  // a pending "waiting for the user to say the expected phrase" resolver, driven by the wake utterance
  const expectRef = React.useRef<string | null>(null);
  const resolveRef = React.useRef<((r: PhraseResult) => void) | null>(null);

  const wake = useWakeWord({
    onUtterance: (name, samples) => {
      const resolve = resolveRef.current;
      if (!resolve || !expectRef.current) return;          // not currently enrolling/verifying
      resolveRef.current = null;
      if (name === expectRef.current) resolve({ samples }); // wake fired for the RIGHT phrase → accept
      else resolve({ wrong: true });                        // fired for the other phrase → deny
      expectRef.current = null;
    },
  });

  // wait for the wake model to fire for `expect`; deny on wrong phrase or timeout
  const awaitPhrase = React.useCallback((expect: string): Promise<PhraseResult> => {
    expectRef.current = expect;
    return new Promise((resolve) => {
      const t = window.setTimeout(() => {
        if (resolveRef.current) { resolveRef.current = null; expectRef.current = null; resolve({ timeout: true }); }
      }, TIMEOUT_MS);
      resolveRef.current = (r) => { window.clearTimeout(t); resolve(r); };
    });
  }, []);

  const [status, setStatus] = React.useState('');
  const [cue, setCue] = React.useState<{ phrase: string; live: boolean } | null>(null);
  const [conditions, setConditions] = React.useState(0);
  const [result, setResult] = React.useState<VerifyResult | null>(null);
  const [busy, setBusy] = React.useState(false);
  const bothReady = sv.ready && wake.ready;

  React.useEffect(() => { if (sv.ready) setConditions(sv.conditionCount('hey-ozwell')); }, [sv.ready]);

  const enroll = async () => {
    setBusy(true); setResult(null);
    try {
      for (const ph of PHRASES) {
        const clips: { samples: Float32Array; sampleRate: number }[] = [];
        while (clips.length < REPS) {
          setCue({ phrase: ph.label, live: false }); setStatus(`get ready… (${clips.length + 1} of ${REPS})`);
          chime(660); await delay(350);
          setCue({ phrase: ph.label, live: true });
          const r = await awaitPhrase(ph.key);
          if (r.samples) {
            clips.push({ samples: r.samples, sampleRate: WAKE_SR });
            chime(990); setStatus(`✓ got ${clips.length}/${REPS}`); await delay(750);
          } else if (r.wrong) {
            setStatus(`that was the other phrase — say “${ph.label}”`); await delay(1300);
          } else {
            setStatus(`didn't hear “${ph.label}” — say it clearly`); await delay(900);
          }
        }
        sv.enroll(ph.key, clips, { append: false });
      }
      setCue(null); setStatus('✅ enrolled — both phrases'); setConditions(sv.conditionCount('hey-ozwell'));
    } catch (e) { setCue(null); setStatus('error: ' + (e instanceof Error ? e.message : String(e))); }
    finally { setBusy(false); }
  };

  const verify = async () => {
    setBusy(true); setResult(null);
    try {
      setCue({ phrase: 'hey ozwell', live: false }); setStatus('get ready…');
      chime(660); await delay(350);
      setCue({ phrase: 'hey ozwell', live: true });
      const r = await awaitPhrase('hey-ozwell');
      setCue(null);
      if (r.samples) { setStatus('verifying on-device…'); setResult(sv.verify('hey-ozwell', r.samples, WAKE_SR)); setStatus(''); }
      else setStatus(r.wrong ? 'that was the other phrase — try “hey ozwell”' : 'didn’t catch “hey ozwell” — try again');
    } catch (e) { setCue(null); setStatus('error: ' + (e instanceof Error ? e.message : String(e))); }
    finally { setBusy(false); }
  };

  const btn: React.CSSProperties = {
    font: '14px system-ui', padding: '8px 16px', borderRadius: 8, cursor: busy ? 'default' : 'pointer',
    border: '1px solid #2563eb', background: '#2563eb', color: '#fff', opacity: busy ? 0.5 : 1,
  };

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', width: 480, color: '#1f2733' }}>
      <h3 style={{ marginBottom: 4 }}>Speaker verification — the “who” gate</h3>
      <p style={{ color: '#64748b', fontSize: 13.5, marginTop: 0 }}>
        Phrase-validated enrollment (the wake model must actually fire for the requested phrase), then verify —
        scored on-device as a z-score vs a cohort of other voices.
      </p>

      <div style={{ font: '12px monospace', color: sv.error || wake.error ? '#dc2626' : bothReady ? '#16a34a' : '#d97706', marginBottom: 12 }}>
        {sv.error ? `speaker error: ${sv.error}` : wake.error ? `wake error: ${wake.error}`
          : bothReady ? `● ready · enrolled: ${conditions ? 'yes' : 'no'}`
            : `… loading models${!wake.ready ? ' (wake)' : ''}${!sv.ready ? ' (TitaNet ~50MB, first time)' : ''}`}
      </div>

      {cue && (
        <div style={{ margin: '12px 0', padding: 18, borderRadius: 12, textAlign: 'center',
          background: cue.live ? '#fef2f2' : '#eff6ff', border: `1px solid ${cue.live ? '#fecaca' : '#bfdbfe'}` }}>
          <div style={{ fontSize: 13, color: '#64748b' }}>{cue.live ? '🔴 say it now' : 'get ready…'}</div>
          <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4 }}>“{cue.phrase}”</div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, margin: '12px 0' }}>
        <button style={btn} disabled={!bothReady || busy} onClick={enroll}>Enroll my voice</button>
        <button style={{ ...btn, background: '#16a34a', borderColor: '#16a34a' }} disabled={!bothReady || busy || conditions === 0} onClick={verify}>Verify</button>
        <button style={{ ...btn, background: '#fff', color: '#dc2626', borderColor: '#fca5a5' }} disabled={busy} onClick={() => { sv.clear(); setConditions(0); setResult(null); setStatus('cleared'); }}>Clear</button>
      </div>

      <div style={{ font: '13px monospace', color: '#475569', minHeight: 18 }}>{status}</div>

      {result && (
        <div style={{ marginTop: 12, padding: 14, borderRadius: 10, border: '1px solid #e2e8f0', background: result.pass ? '#f0fdf4' : '#fef2f2' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: result.pass ? '#16a34a' : '#dc2626' }}>
            {result.pass ? '✅ verified — it’s you' : '🔒 not a match'}
          </div>
          <div style={{ font: '13px monospace', color: '#475569', marginTop: 6 }}>
            cosine {result.score.toFixed(2)}{result.znorm != null ? `  ·  z-score ${result.znorm.toFixed(1)}` : ''}
          </div>
        </div>
      )}
    </div>
  );
}

/** Phrase-validated enroll (wake model must fire for the phrase) → on-device verify with a z-score. */
export const Verify: StoryObj = {
  render: () => <SpeakerVerifyDemo />,
};
