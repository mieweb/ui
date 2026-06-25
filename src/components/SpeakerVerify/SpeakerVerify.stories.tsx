/**
 * Speaker verification (the doctor-only WHO gate) — standalone primitive.
 *
 * Enroll your voice with a guided, concrete flow — exact phrase shown, a chime cues WHEN to speak, it
 * checks you actually said something (retries on silence), confirm-chimes on success, with per-rep
 * progress — then Verify scores a live clip against your voiceprint with TitaNet, fully on-device,
 * showing the raw cosine, the z-score (graded vs a cohort of other voices), and pass/fail.
 *
 * (Full phrase validation — "was that actually 'hey ozwell'?" — happens once this is composed with the
 * wake detector; standalone we validate non-silence. Assets in .storybook/public/sv-runtime/.)
 */
import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import { useSpeakerVerify, type VerifyResult } from './useSpeakerVerify';

const meta: Meta = {
  title: 'Product/Feature Modules/AI/Speaker Verify',
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'On-device speaker verification (TitaNet). Guided enrollment (exact phrase + chime cue + retry on ' +
          'silence + confirm chime), then verify — scored as a **z-score** vs a cohort of other voices so the ' +
          'threshold holds across rooms. The "who" gate that makes the wake word doctor-only.',
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
const CLIP_SECONDS = 2.2;
const SILENCE_PEAK = 0.02; // below this, "didn't catch that"

const delay = (ms: number) => new Promise((r) => window.setTimeout(r, ms));
const peak = (s: Float32Array) => { let p = 0; for (let i = 0; i < s.length; i++) { const a = Math.abs(s[i]); if (a > p) p = a; } return p; };

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

// Open the mic ONCE for a session; record() grabs a clip on demand (no repeated getUserMedia).
async function openRecorder() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new Ctx();
  const src = ctx.createMediaStreamSource(stream);
  const proc = ctx.createScriptProcessor(4096, 1, 1);
  const sink = ctx.createGain(); sink.gain.value = 0; // muted → no feedback
  let chunks: Float32Array[] = [];
  let recording = false;
  proc.onaudioprocess = (e) => { if (recording) chunks.push(Float32Array.from(e.inputBuffer.getChannelData(0))); };
  src.connect(proc); proc.connect(sink); sink.connect(ctx.destination);
  return {
    async record(seconds: number) {
      chunks = []; recording = true;
      await delay(seconds * 1000);
      recording = false;
      let len = 0; for (const c of chunks) len += c.length;
      const samples = new Float32Array(len); let o = 0; for (const c of chunks) { samples.set(c, o); o += c.length; }
      return { samples, sampleRate: ctx.sampleRate };
    },
    close() {
      try { proc.disconnect(); src.disconnect(); sink.disconnect(); } catch { /* ignore */ }
      stream.getTracks().forEach((t) => t.stop());
      void ctx.close();
    },
  };
}

function SpeakerVerifyDemo() {
  const sv = useSpeakerVerify();
  const [status, setStatus] = React.useState('');
  const [cue, setCue] = React.useState<{ phrase: string; rep: string } | null>(null); // the big "say this" prompt
  const [conditions, setConditions] = React.useState(0);
  const [result, setResult] = React.useState<VerifyResult | null>(null);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => { if (sv.ready) setConditions(sv.conditionCount('hey-ozwell')); }, [sv.ready]);

  const enroll = async () => {
    setBusy(true); setResult(null);
    const rec = await openRecorder().catch((e) => { setStatus('mic error: ' + (e instanceof Error ? e.message : String(e))); return null; });
    if (!rec) { setBusy(false); return; }
    try {
      for (const ph of PHRASES) {
        const clips: { samples: Float32Array; sampleRate: number }[] = [];
        let i = 0;
        while (i < REPS) {
          setCue({ phrase: ph.label, rep: `get ready… (${i + 1} of ${REPS})` });
          setStatus('');
          chime(660); await delay(450);                 // cue, let the chime finish so it isn't recorded
          setCue({ phrase: ph.label, rep: `🔴 speak now — “${ph.label}” (${i + 1} of ${REPS})` });
          const clip = await rec.record(CLIP_SECONDS);
          if (peak(clip.samples) < SILENCE_PEAK) {       // didn't hear anything — retry this rep
            setStatus(`didn't catch that — let's try ${i + 1}/${REPS} again`); await delay(1100); continue;
          }
          clips.push(clip);
          chime(990); setStatus(`✓ got ${i + 1}/${REPS}`); await delay(750);
          i++;
        }
        sv.enroll(ph.key, clips, { append: false });     // one centroid per phrase
      }
      setConditions(sv.conditionCount('hey-ozwell'));
      setCue(null); setStatus('✅ enrolled — both phrases');
    } catch (e) { setCue(null); setStatus('error: ' + (e instanceof Error ? e.message : String(e))); }
    finally { rec.close(); setBusy(false); }
  };

  const verify = async () => {
    setBusy(true); setResult(null);
    const rec = await openRecorder().catch(() => null);
    if (!rec) { setBusy(false); setStatus('mic error'); return; }
    try {
      setCue({ phrase: 'hey ozwell', rep: 'get ready…' });
      chime(660); await delay(450);
      setCue({ phrase: 'hey ozwell', rep: '🔴 speak now' });
      const { samples, sampleRate } = await rec.record(CLIP_SECONDS);
      setCue(null); setStatus('verifying on-device…');
      setResult(sv.verify('hey-ozwell', samples, sampleRate));
      setStatus('');
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
        Guided enrollment, then verify. Scored on-device (TitaNet) as a z-score vs a cohort of other voices.
      </p>

      <div style={{ font: '12px monospace', color: sv.error ? '#dc2626' : sv.ready ? '#16a34a' : '#d97706', marginBottom: 12 }}>
        {sv.error ? `error: ${sv.error}` : sv.ready ? `● ready · enrolled: ${conditions ? 'yes' : 'no'}` : '… loading TitaNet (~50 MB, first time)'}
      </div>

      {cue && (
        <div style={{ margin: '12px 0', padding: 18, borderRadius: 12, textAlign: 'center',
          background: cue.rep.includes('speak now') ? '#fef2f2' : '#eff6ff',
          border: `1px solid ${cue.rep.includes('speak now') ? '#fecaca' : '#bfdbfe'}` }}>
          <div style={{ fontSize: 13, color: '#64748b' }}>{cue.rep}</div>
          <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4 }}>“{cue.phrase}”</div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, margin: '12px 0' }}>
        <button style={btn} disabled={!sv.ready || busy} onClick={enroll}>Enroll my voice</button>
        <button style={{ ...btn, background: '#16a34a', borderColor: '#16a34a' }} disabled={!sv.ready || busy || conditions === 0} onClick={verify}>Verify</button>
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

/** Guided enroll (phrase + chime cue + retry-on-silence + confirm chime), then on-device verify with a z-score. */
export const Verify: StoryObj = {
  render: () => <SpeakerVerifyDemo />,
};
