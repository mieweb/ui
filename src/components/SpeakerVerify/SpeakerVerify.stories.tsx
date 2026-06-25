/**
 * Speaker verification + phrase voiceprint — the full two-gate, multi-condition enroll/verify.
 *
 * ONE phrase-validated enrollment builds BOTH prints (like the product):
 *   • WHO (speaker, TitaNet) — is it the enrolled doctor's voice  → useSpeakerVerify
 *   • WHAT (phrase voiceprint, the wake model's fire-frame embedding) — did they say the actual phrase → useWakeWord
 * A rep is only accepted when the wake model fires for the requested phrase (no enrolling junk).
 * "Add condition" appends another room/distance/background; both gates match best-over-conditions.
 * Verify checks BOTH gates. All on-device.
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
          'Two-gate, multi-condition enroll/verify, all on-device. One phrase-validated enrollment builds both ' +
          'the WHO (speaker) and WHAT (phrase voiceprint) prints; "Add condition" extends to new rooms. Verify ' +
          'requires both gates — the right voice AND the right phrase.',
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
const TIMEOUT_MS = 4000;
const WHAT_THRESHOLD = 0.6;  // phrase-voiceprint cosine to accept (tunable; product used ~0.8)
const VP_CAP = 18;           // max WHAT templates kept across conditions
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
type Combined = { who: VerifyResult | null; what: number | null; pass: boolean };

function SpeakerVerifyDemo() {
  const sv = useSpeakerVerify();
  const expectRef = React.useRef<string | null>(null);
  const resolveRef = React.useRef<((firedName: string) => void) | null>(null);
  const whatRef = React.useRef<Record<string, Float32Array[]>>({}); // WHAT templates per phrase (for append)

  const wake = useWakeWord({
    onWake: (name) => { if (expectRef.current && resolveRef.current) resolveRef.current(name); },
  });
  const wakeRef = React.useRef(wake);
  wakeRef.current = wake;

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
  const [result, setResult] = React.useState<Combined | null>(null);
  const [busy, setBusy] = React.useState(false);
  const bothReady = sv.ready && wake.ready;
  const enrolled = conditions > 0;

  React.useEffect(() => { if (sv.ready) setConditions(sv.conditionCount('hey-ozwell')); }, [sv.ready]);

  const runEnroll = async (append: boolean) => {
    setBusy(true); setResult(null);
    const rec = openRec();
    if (!rec) { setStatus('mic not ready yet — give the listener a second, then retry'); setBusy(false); return; }
    try {
      for (const ph of PHRASES) {
        const clips: { samples: Float32Array; sampleRate: number }[] = [];
        const embs: Float32Array[] = [];
        while (clips.length < REPS) {
          setCue({ phrase: ph.label, mode: 'ready' }); setStatus(`sample ${clips.length + 1} of ${REPS}`);
          chime(660); await delay(400);
          setCue({ phrase: ph.label, mode: 'live' }); rec.start();
          const w = await awaitWake(ph.key);
          const samples = rec.grab();
          const emb = wakeRef.current.getLastEmbedding();   // the WHAT fire-frame embedding for this rep
          if (w.fired === ph.key) {
            clips.push({ samples, sampleRate: rec.sampleRate });
            if (emb) embs.push(emb);
            chime(990); setCue({ phrase: ph.label, mode: 'ready' }); setStatus(`✓ got ${clips.length}/${REPS}`); await delay(800);
          } else if (w.fired) {
            setCue({ phrase: ph.label, mode: 'deny', msg: 'that was the other phrase' }); await delay(1600);
          } else {
            setCue({ phrase: ph.label, mode: 'deny', msg: 'didn’t catch that' }); await delay(1600);
          }
        }
        // WHO print (TitaNet centroid) — append adds a condition
        sv.enroll(ph.key, clips, { append });
        // WHAT print (phrase voiceprint templates) — append merges, else replaces
        const base = append ? (whatRef.current[ph.key] || []) : [];
        const merged = base.concat(embs).slice(-VP_CAP);
        whatRef.current[ph.key] = merged;
        wakeRef.current.setVoiceprint(ph.key, merged);
      }
      setCue(null); setConditions(sv.conditionCount('hey-ozwell'));
      setStatus(append ? '✅ condition added — both gates extended' : '✅ enrolled — both gates, both phrases');
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
      const emb = wakeRef.current.getLastEmbedding();
      if (w.fired === 'hey-ozwell') {
        setCue(null); setStatus('verifying on-device…');
        const who = sv.verify('hey-ozwell', samples, rec.sampleRate);                  // WHO gate
        const what = wakeRef.current.phraseCosine('hey-ozwell', emb);                  // WHAT gate
        const pass = (who?.pass ?? false) && (what != null ? what >= WHAT_THRESHOLD : true);
        setResult({ who, what, pass }); setStatus('');
      } else { setCue({ phrase: 'hey ozwell', mode: 'deny', msg: w.fired ? 'that was the other phrase' : 'didn’t catch that' }); await delay(1600); setCue(null); }
    } catch (e) { setCue(null); setStatus('error: ' + (e instanceof Error ? e.message : String(e))); }
    finally { rec.close(); setBusy(false); }
  };

  const clearAll = () => { sv.clear(); PHRASES.forEach((p) => wakeRef.current.clearVoiceprint(p.key)); whatRef.current = {}; setConditions(0); setResult(null); setStatus('cleared'); };

  const btn: React.CSSProperties = {
    font: '14px system-ui', padding: '8px 14px', borderRadius: 8, cursor: busy ? 'default' : 'pointer',
    border: '1px solid #2563eb', background: '#2563eb', color: '#fff', opacity: busy ? 0.5 : 1,
  };

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', width: 500, color: '#1f2733' }}>
      <h3 style={{ marginBottom: 4 }}>Two-gate verify — who + what</h3>
      <p style={{ color: '#64748b', fontSize: 13.5, marginTop: 0 }}>
        Phrase-validated enrollment builds both prints; verify needs the right <b>voice</b> AND the right
        <b> phrase</b>. "Add condition" extends to another room. All on-device.
      </p>

      <div style={{ font: '12px monospace', color: sv.error || wake.error ? '#dc2626' : bothReady ? '#16a34a' : '#d97706', marginBottom: 12 }}>
        {sv.error ? `speaker error: ${sv.error}` : wake.error ? `wake error: ${wake.error}`
          : bothReady ? `● ready · conditions enrolled: ${conditions}` : `… loading models${!wake.ready ? ' (wake)' : ''}${!sv.ready ? ' (TitaNet ~50MB)' : ''}`}
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
              {cue.mode === 'live' && <div style={{ fontSize: 12, color: '#dc2626', marginTop: 8, animation: 'oz-pulse 1s infinite' }}>● listening…</div>}
            </>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, margin: '12px 0', flexWrap: 'wrap' }}>
        <button style={btn} disabled={!bothReady || busy} onClick={() => runEnroll(false)}>{enrolled ? 'Re-enroll (fresh)' : 'Enroll my voice'}</button>
        <button style={{ ...btn, background: '#0d9488', borderColor: '#0d9488' }} disabled={!bothReady || busy || !enrolled} onClick={() => runEnroll(true)}>Add condition</button>
        <button style={{ ...btn, background: '#16a34a', borderColor: '#16a34a' }} disabled={!bothReady || busy || !enrolled} onClick={verify}>Verify</button>
        <button style={{ ...btn, background: '#fff', color: '#dc2626', borderColor: '#fca5a5' }} disabled={busy} onClick={clearAll}>Clear</button>
      </div>

      <div style={{ font: '13px monospace', color: '#475569', minHeight: 18 }}>{status}</div>

      {result && (
        <div style={{ marginTop: 12, padding: 14, borderRadius: 10, border: '1px solid #e2e8f0', background: result.pass ? '#f0fdf4' : '#fef2f2' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: result.pass ? '#16a34a' : '#dc2626' }}>
            {result.pass ? '✅ verified — your voice, the phrase' : '🔒 rejected'}
          </div>
          <div style={{ font: '13px monospace', color: '#475569', marginTop: 6 }}>
            WHO {result.who ? `${result.who.score.toFixed(2)}${result.who.znorm != null ? ` (z${result.who.znorm.toFixed(1)})` : ''} ${result.who.pass ? '✓' : '✗'}` : '—'}
            {'   '}·{'   '}
            WHAT {result.what != null ? `${result.what.toFixed(2)} ${result.what >= WHAT_THRESHOLD ? '✓' : '✗'}` : '—'}
          </div>
        </div>
      )}
    </div>
  );
}

/** Two-gate (who + what), multi-condition enroll/verify — all on-device. */
export const Verify: StoryObj = {
  render: () => <SpeakerVerifyDemo />,
};
