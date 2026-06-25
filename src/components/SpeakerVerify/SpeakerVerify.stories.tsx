/**
 * Speaker verification (the doctor-only WHO gate) — with PHRASE-VALIDATED enrollment.
 *
 * Enrollment runs the wake detector and only accepts a rep when the wake model FIRES for the requested
 * phrase (onWake — the reliable, wake-gated signal; the model firing is the proof you said it). Say the
 * wrong phrase or anything else and it's denied + retried. The audio captured during that window builds
 * your voiceprint. Then Verify scores a live "hey ozwell" against it with TitaNet, on-device.
 *
 * Composes useWakeWord (validates the phrase + shares its mic) + useSpeakerVerify (builds/checks the print).
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
          'On-device speaker verification with **phrase-validated** enrollment — a rep is accepted only when ' +
          'the wake model fires for the requested phrase, so you can\'t enroll junk. Scored as a z-score vs a ' +
          'cohort of other voices. The "who" gate that makes the wake word doctor-only.',
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
const TIMEOUT_MS = 4000; // how long to wait for the phrase before "didn't catch that" (only bites on failure)
const delay = (ms: number) => new Promise((r) => window.setTimeout(r, ms));

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

interface Rec { sampleRate: number; start: () => void; grab: () => Float32Array; close: () => void; }

function SpeakerVerifyDemo() {
  const sv = useSpeakerVerify();
  // pending "waiting for the user to say the expected phrase", resolved by onWake
  const expectRef = React.useRef<string | null>(null);
  const resolveRef = React.useRef<((firedName: string) => void) | null>(null);

  const wake = useWakeWord({
    // onWake is wake-GATED (only fires when the model classifies the phrase) — the right validation signal
    onWake: (name) => { if (expectRef.current && resolveRef.current) resolveRef.current(name); },
  });
  const wakeRef = React.useRef(wake);
  wakeRef.current = wake;

  // record off the wake detector's OWN stream (a 2nd consumer — never a 2nd getUserMedia)
  const openRec = (): Rec | null => {
    const stream = wakeRef.current.getStream();
    if (!stream) return null;
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const src = ctx.createMediaStreamSource(stream);
    const proc = ctx.createScriptProcessor(4096, 1, 1);
    const sink = ctx.createGain(); sink.gain.value = 0;
    let chunks: Float32Array[] = []; let cap = false;
    proc.onaudioprocess = (e) => { if (cap) chunks.push(Float32Array.from(e.inputBuffer.getChannelData(0))); };
    src.connect(proc); proc.connect(sink); sink.connect(ctx.destination);
    return {
      sampleRate: ctx.sampleRate,
      start: () => { chunks = []; cap = true; },
      grab: () => { cap = false; let l = 0; for (const c of chunks) l += c.length; const s = new Float32Array(l); let o = 0; for (const c of chunks) { s.set(c, o); o += c.length; } return s; },
      close: () => { try { proc.disconnect(); src.disconnect(); sink.disconnect(); } catch { /* ignore */ } void ctx.close(); },
    };
  };

  // resolve when the wake fires for ANY phrase (we then check it matched), or timeout
  const awaitWake = (expect: string): Promise<{ fired?: string; timeout?: boolean }> => {
    expectRef.current = expect;
    return new Promise((resolve) => {
      const t = window.setTimeout(() => { if (resolveRef.current) { resolveRef.current = null; expectRef.current = null; resolve({ timeout: true }); } }, TIMEOUT_MS);
      resolveRef.current = (name) => { window.clearTimeout(t); expectRef.current = null; resolveRef.current = null; resolve({ fired: name }); };
    });
  };

  const [status, setStatus] = React.useState('');
  const [cue, setCue] = React.useState<{ phrase: string; mode: 'ready' | 'live' | 'deny'; msg?: string } | null>(null);
  const [conditions, setConditions] = React.useState(0);
  const [result, setResult] = React.useState<VerifyResult | null>(null);
  const [busy, setBusy] = React.useState(false);
  const bothReady = sv.ready && wake.ready;

  React.useEffect(() => { if (sv.ready) setConditions(sv.conditionCount('hey-ozwell')); }, [sv.ready]);

  const enroll = async () => {
    setBusy(true); setResult(null);
    const rec = openRec();
    if (!rec) { setStatus('mic not ready yet — give the listener a second, then retry'); setBusy(false); return; }
    try {
      for (const ph of PHRASES) {
        const clips: { samples: Float32Array; sampleRate: number }[] = [];
        while (clips.length < REPS) {
          setCue({ phrase: ph.label, mode: 'ready' }); setStatus(`sample ${clips.length + 1} of ${REPS}`);
          chime(660); await delay(400);
          setCue({ phrase: ph.label, mode: 'live' }); rec.start();
          const w = await awaitWake(ph.key);
          const samples = rec.grab();
          if (w.fired === ph.key) {
            clips.push({ samples, sampleRate: rec.sampleRate });
            chime(990); setCue({ phrase: ph.label, mode: 'ready' }); setStatus(`✓ got ${clips.length}/${REPS}`); await delay(800);
          } else if (w.fired) {
            setCue({ phrase: ph.label, mode: 'deny', msg: 'that was the other phrase' }); await delay(1600);
          } else {
            setCue({ phrase: ph.label, mode: 'deny', msg: 'didn’t catch that' }); await delay(1600);
          }
        }
        sv.enroll(ph.key, clips, { append: false });
      }
      setCue(null); setStatus('✅ enrolled — both phrases'); setConditions(sv.conditionCount('hey-ozwell'));
    } catch (e) { setCue(null); setStatus('error: ' + (e instanceof Error ? e.message : String(e))); }
    finally { rec.close(); setBusy(false); }
  };

  const verify = async () => {
    setBusy(true); setResult(null);
    const rec = openRec();
    if (!rec) { setStatus('mic not ready'); setBusy(false); return; }
    try {
      setCue({ phrase: 'hey ozwell', mode: 'ready' }); setStatus('get ready…');
      chime(660); await delay(400);
      setCue({ phrase: 'hey ozwell', mode: 'live' }); rec.start();
      const w = await awaitWake('hey-ozwell');
      const samples = rec.grab();
      if (w.fired === 'hey-ozwell') { setCue(null); setStatus('verifying on-device…'); setResult(sv.verify('hey-ozwell', samples, rec.sampleRate)); setStatus(''); }
      else { setCue({ phrase: 'hey ozwell', mode: 'deny', msg: w.fired ? 'that was the other phrase' : 'didn’t catch that' }); await delay(1600); setCue(null); }
    } catch (e) { setCue(null); setStatus('error: ' + (e instanceof Error ? e.message : String(e))); }
    finally { rec.close(); setBusy(false); }
  };

  const btn: React.CSSProperties = {
    font: '14px system-ui', padding: '8px 16px', borderRadius: 8, cursor: busy ? 'default' : 'pointer',
    border: '1px solid #2563eb', background: '#2563eb', color: '#fff', opacity: busy ? 0.5 : 1,
  };

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', width: 480, color: '#1f2733' }}>
      <h3 style={{ marginBottom: 4 }}>Speaker verification — the “who” gate</h3>
      <p style={{ color: '#64748b', fontSize: 13.5, marginTop: 0 }}>
        Phrase-validated enrollment — a rep only counts if the wake model fires for the requested phrase
        (no enrolling junk). Then verify, scored on-device as a z-score vs a cohort of other voices.
      </p>

      <div style={{ font: '12px monospace', color: sv.error || wake.error ? '#dc2626' : bothReady ? '#16a34a' : '#d97706', marginBottom: 12 }}>
        {sv.error ? `speaker error: ${sv.error}` : wake.error ? `wake error: ${wake.error}`
          : bothReady ? `● ready · enrolled: ${conditions ? 'yes' : 'no'}`
            : `… loading models${!wake.ready ? ' (wake)' : ''}${!sv.ready ? ' (TitaNet ~50MB, first time)' : ''}`}
      </div>

      {cue && (
        <div style={{ margin: '12px 0', padding: 18, borderRadius: 12, textAlign: 'center',
          background: cue.mode === 'deny' || cue.mode === 'live' ? '#fef2f2' : '#eff6ff',
          border: `1px solid ${cue.mode === 'deny' ? '#f87171' : cue.mode === 'live' ? '#fecaca' : '#bfdbfe'}` }}>
          {cue.mode === 'deny' ? (
            <>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#dc2626' }}>❌ {cue.msg} — not counted</div>
              <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>try again: “{cue.phrase}”</div>
            </>
          ) : (
            <>
              <style>{`@keyframes oz-pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
              <div style={{ fontSize: 13, color: '#64748b' }}>{cue.mode === 'live' ? '🔴 say it now' : 'get ready…'}</div>
              <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4 }}>“{cue.phrase}”</div>
              {cue.mode === 'live' && (
                <div style={{ fontSize: 12, color: '#dc2626', marginTop: 8, animation: 'oz-pulse 1s infinite' }}>● listening…</div>
              )}
            </>
          )}
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

/** Phrase-validated enroll (wake model must fire for the phrase — no junk) → on-device verify with a z-score. */
export const Verify: StoryObj = {
  render: () => <SpeakerVerifyDemo />,
};
