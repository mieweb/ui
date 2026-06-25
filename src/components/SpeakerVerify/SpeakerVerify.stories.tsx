/**
 * Speaker verification (the doctor-only WHO gate) — standalone primitive.
 *
 * Enroll your voice (a few short clips), then Verify: it records a clip and scores it against your
 * enrolled voiceprint with TitaNet, fully on-device. Shows the raw cosine, the z-score (graded vs a
 * cohort of other voices), and pass/fail. Next step folds this into the hands-free composition so only
 * the enrolled doctor can trigger it.
 *
 * Assets (~50 MB sherpa WASM/data + cohort) are served from .storybook/public/sv-runtime/.
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
          'On-device speaker verification (TitaNet). Enroll your voice, then verify — it scores a live ' +
          'clip against your voiceprint and grades it as a **z-score** vs a cohort of other voices, so the ' +
          'threshold holds across rooms. The "who" gate that makes the wake word doctor-only.',
      },
    },
  },
};
export default meta;

const PHRASE = 'doctor';      // single text-independent key for this WHO test
const CLIP_SECONDS = 2.5;

// Record one mono clip of Float32 samples at the mic's native rate (sherpa resamples to 16k internally).
async function recordClip(seconds: number): Promise<{ samples: Float32Array; sampleRate: number }> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new Ctx();
  const src = ctx.createMediaStreamSource(stream);
  const proc = ctx.createScriptProcessor(4096, 1, 1);
  const sink = ctx.createGain(); sink.gain.value = 0; // muted → no feedback
  const chunks: Float32Array[] = [];
  proc.onaudioprocess = (e) => chunks.push(Float32Array.from(e.inputBuffer.getChannelData(0)));
  src.connect(proc); proc.connect(sink); sink.connect(ctx.destination);
  await new Promise((r) => window.setTimeout(r, seconds * 1000));
  try { proc.disconnect(); src.disconnect(); sink.disconnect(); } catch { /* ignore */ }
  stream.getTracks().forEach((t) => t.stop());
  const sampleRate = ctx.sampleRate;
  void ctx.close();
  let len = 0; for (const c of chunks) len += c.length;
  const samples = new Float32Array(len); let o = 0; for (const c of chunks) { samples.set(c, o); o += c.length; }
  return { samples, sampleRate };
}

function SpeakerVerifyDemo() {
  const sv = useSpeakerVerify();
  const [status, setStatus] = React.useState('');
  const [conditions, setConditions] = React.useState(0);
  const [result, setResult] = React.useState<VerifyResult | null>(null);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => { if (sv.ready) setConditions(sv.conditionCount(PHRASE)); }, [sv.ready]);

  const enroll = async () => {
    setBusy(true); setResult(null);
    try {
      const clips: { samples: Float32Array; sampleRate: number }[] = [];
      for (let i = 1; i <= 3; i++) {
        setStatus(`recording ${i}/3 — say a sentence…`);
        clips.push(await recordClip(CLIP_SECONDS));
        setStatus(`got ${i}/3`);
        await new Promise((r) => window.setTimeout(r, 500));
      }
      setStatus('building voiceprint…');
      sv.enroll(PHRASE, clips, { append: false });
      setConditions(sv.conditionCount(PHRASE));
      setStatus('✅ enrolled');
    } catch (e) { setStatus('error: ' + (e instanceof Error ? e.message : String(e))); }
    finally { setBusy(false); }
  };

  const verify = async () => {
    setBusy(true); setResult(null);
    try {
      setStatus('recording — say a sentence…');
      const { samples, sampleRate } = await recordClip(CLIP_SECONDS);
      setStatus('verifying on-device…');
      const r = sv.verify(PHRASE, samples, sampleRate);
      setResult(r);
      setStatus(r ? '' : 'no result');
    } catch (e) { setStatus('error: ' + (e instanceof Error ? e.message : String(e))); }
    finally { setBusy(false); }
  };

  const btn: React.CSSProperties = {
    font: '14px system-ui', padding: '8px 16px', borderRadius: 8, cursor: busy ? 'default' : 'pointer',
    border: '1px solid #2563eb', background: '#2563eb', color: '#fff', opacity: busy ? 0.5 : 1,
  };

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', width: 460, color: '#1f2733' }}>
      <h3 style={{ marginBottom: 4 }}>Speaker verification — the “who” gate</h3>
      <p style={{ color: '#64748b', fontSize: 13.5, marginTop: 0 }}>
        Enroll your voice, then verify. Scored on-device (TitaNet) as a z-score vs a cohort of other voices.
      </p>

      <div style={{ font: '12px monospace', color: sv.error ? '#dc2626' : sv.ready ? '#16a34a' : '#d97706', marginBottom: 12 }}>
        {sv.error ? `error: ${sv.error}` : sv.ready ? `● ready · enrolled conditions: ${conditions}` : '… loading TitaNet (~50 MB, first time)'}
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
        <button style={btn} disabled={!sv.ready || busy} onClick={enroll}>Enroll my voice (3×)</button>
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

/** Enroll your voice, then Verify — on-device TitaNet speaker match with a z-score readout. */
export const Verify: StoryObj = {
  render: () => <SpeakerVerifyDemo />,
};
