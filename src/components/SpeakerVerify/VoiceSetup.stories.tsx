/**
 * Voice Setup — the client-facing enrollment page (Apple "Hey Siri"-style).
 *
 * A polished, guided enrollment: a glowing orb that reacts to your voice, the exact phrase to say, a
 * chime cue, per-rep progress, graceful retry, and a finish state. One pass builds BOTH prints (WHO
 * speaker + WHAT phrase), phrase-validated by the wake model. This is the *pretty* front-end over the
 * same proven enroll logic in the dev diagnostic. All on-device.
 */
import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import { useSpeakerVerify } from './useSpeakerVerify';
import { useWakeWord } from '../WakeWord/useWakeWord';

const meta: Meta = {
  title: 'Product/Feature Modules/AI/Voice Setup',
  parameters: { layout: 'fullscreen', docs: { description: { component: 'Apple-style on-device voice enrollment — glowing reactive orb, guided phrase prompts, progress, retry.' } } },
};
export default meta;

const PHRASES = [
  { key: 'hey-ozwell', label: 'hey ozwell' },
  { key: "ozwell-i'm-done", label: "ozwell I'm done" },
];
const REPS = 3;
const TIMEOUT_MS = 5000;
const VP_CAP = 18;
const WHAT_KEY = 'ozwellWhatPrints';
const delay = (ms: number) => new Promise((r) => window.setTimeout(r, ms));

function chime(freq: number, ms = 170) {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx(); const o = ctx.createOscillator(); const g = ctx.createGain();
    o.frequency.value = freq; o.type = 'sine'; o.connect(g); g.connect(ctx.destination);
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.16, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + ms / 1000);
    o.start(); o.stop(ctx.currentTime + ms / 1000 + 0.02);
    window.setTimeout(() => { void ctx.close(); }, ms + 120);
  } catch { /* no audio out */ }
}
function saveWhat(map: Record<string, Float32Array[]>) {
  try { localStorage.setItem(WHAT_KEY, JSON.stringify(Object.fromEntries(Object.entries(map).map(([k, v]) => [k, v.map((a) => Array.from(a))])))); } catch { /* ignore */ }
}

interface Rec { sampleRate: number; snapshot: () => Float32Array; close: () => void; }
function openRolling(stream: MediaStream): Rec {
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new Ctx(); const src = ctx.createMediaStreamSource(stream);
  const proc = ctx.createScriptProcessor(4096, 1, 1); const sink = ctx.createGain(); sink.gain.value = 0;
  const max = Math.round(ctx.sampleRate * 2);
  let chunks: Float32Array[] = []; let total = 0;
  proc.onaudioprocess = (e) => { chunks.push(Float32Array.from(e.inputBuffer.getChannelData(0))); total += e.inputBuffer.length; while (total > max && chunks.length > 1) { total -= chunks[0].length; chunks.shift(); } };
  src.connect(proc); proc.connect(sink); sink.connect(ctx.destination);
  return { sampleRate: ctx.sampleRate, snapshot: () => { const s = new Float32Array(total); let o = 0; for (const c of chunks) { s.set(c, o); o += c.length; } return s; }, close: () => { try { proc.disconnect(); src.disconnect(); sink.disconnect(); } catch { /* ignore */ } void ctx.close(); } };
}

type Phase = 'intro' | 'getready' | 'speak' | 'gotit' | 'deny' | 'done';

function VoiceSetup() {
  const sv = useSpeakerVerify();
  const expectRef = React.useRef<string | null>(null);
  const resolveRef = React.useRef<((n: string) => void) | null>(null);
  const whatRef = React.useRef<Record<string, Float32Array[]>>({});
  const recRef = React.useRef<Rec | null>(null);
  const orbRef = React.useRef<HTMLDivElement>(null);
  const levelRef = React.useRef(0);

  const wake = useWakeWord({ onWake: (name) => { if (expectRef.current && resolveRef.current) resolveRef.current(name); } });
  const wakeRef = React.useRef(wake); wakeRef.current = wake;
  const bothReady = sv.ready && wake.ready;

  const [phase, setPhase] = React.useState<Phase>('intro');
  const [phrase, setPhrase] = React.useState('hey ozwell');
  const [step, setStep] = React.useState(0);   // overall rep index across phrases
  const TOTAL = PHRASES.length * REPS;

  // tap the detector's stream: a rolling recorder (for enroll audio) + an analyser that drives the orb
  React.useEffect(() => {
    if (!wake.ready) return;
    let raf = 0, ctx: AudioContext | null = null, cancelled = false, tries = 0;
    const start = () => {
      if (cancelled) return;
      const stream = wakeRef.current.getStream();
      if (!stream) { if (tries++ < 40) window.setTimeout(start, 300); return; }
      if (!recRef.current) recRef.current = openRolling(stream);
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new Ctx(); const src = ctx.createMediaStreamSource(stream); const an = ctx.createAnalyser(); an.fftSize = 512; src.connect(an);
      const data = new Float32Array(an.fftSize);
      const tick = () => {
        an.getFloatTimeDomainData(data);
        let peak = 0; for (let i = 0; i < data.length; i++) { const a = Math.abs(data[i]); if (a > peak) peak = a; }
        levelRef.current = levelRef.current * 0.75 + peak * 0.25;
        if (orbRef.current) { const s = 1 + Math.min(0.55, levelRef.current * 3.2); orbRef.current.style.transform = `translate(-50%,-50%) scale(${s.toFixed(3)})`; }
        raf = requestAnimationFrame(tick);
      };
      tick();
    };
    start();
    return () => { cancelled = true; if (raf) cancelAnimationFrame(raf); void ctx?.close(); recRef.current?.close(); recRef.current = null; };
  }, [wake.ready]);

  const awaitWake = (expect: string): Promise<{ fired?: string; timeout?: boolean }> => {
    expectRef.current = expect;
    return new Promise((resolve) => {
      const t = window.setTimeout(() => { if (resolveRef.current) { resolveRef.current = null; expectRef.current = null; resolve({ timeout: true }); } }, TIMEOUT_MS);
      resolveRef.current = (n) => { window.clearTimeout(t); expectRef.current = null; resolveRef.current = null; resolve({ fired: n }); };
    });
  };

  const run = async () => {
    if (!recRef.current) { setPhase('intro'); return; }
    let overall = 0;
    for (const ph of PHRASES) {
      const clips: { samples: Float32Array; sampleRate: number }[] = []; const embs: Float32Array[] = [];
      setPhrase(ph.label);
      while (clips.length < REPS) {
        setStep(overall); setPhase('getready');
        chime(660); await delay(550);
        setPhase('speak');
        const w = await awaitWake(ph.key);
        const samples = recRef.current.snapshot();
        const emb = wakeRef.current.getLastEmbedding();
        if (w.fired === ph.key) {
          clips.push({ samples, sampleRate: recRef.current.sampleRate }); if (emb) embs.push(emb);
          chime(990); setPhase('gotit'); overall++; setStep(overall); await delay(700);
        } else {
          setPhase('deny'); await delay(1500);
        }
      }
      sv.enroll(ph.key, clips, { append: false });
      const merged = embs.slice(-VP_CAP);
      whatRef.current[ph.key] = merged; wakeRef.current.setVoiceprint(ph.key, merged);
    }
    saveWhat(whatRef.current);
    setPhase('done');
  };

  // ---- visuals ----
  const orbColor = phase === 'deny' ? ['#fb7185', '#f43f5e', '#be123c'] : phase === 'gotit' || phase === 'done' ? ['#4ade80', '#22c55e', '#15803d'] : ['#60a5fa', '#a78bfa', '#f0abfc'];
  const big = phase === 'intro' ? 'Set up your voice'
    : phase === 'done' ? 'You’re all set'
    : phase === 'deny' ? 'Let’s try that again'
    : `“${phrase}”`;
  const small = phase === 'intro' ? 'So Ozwell only responds to you. Say each phrase a few times — it learns your voice, on-device.'
    : phase === 'getready' ? 'Get ready…'
    : phase === 'speak' ? 'Now say it'
    : phase === 'gotit' ? 'Got it'
    : phase === 'deny' ? `Say “${phrase}” clearly`
    : phase === 'done' ? 'Ozwell now responds only to your voice.'
    : '';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'system-ui, -apple-system, sans-serif', color: '#fff', textAlign: 'center', position: 'relative', overflow: 'hidden',
      background: 'radial-gradient(1200px 600px at 50% -10%, #1b2440 0%, #0a0e1a 60%)' }}>
      <style>{`
        @keyframes oz-ring { 0% { transform: translate(-50%,-50%) scale(.7); opacity:.55 } 100% { transform: translate(-50%,-50%) scale(2.1); opacity:0 } }
        @keyframes oz-spin { to { transform: rotate(360deg) } }
        @keyframes oz-fade { from { opacity:0; transform: translateY(8px) } to { opacity:1; transform: none } }
      `}</style>

      {/* orb stage */}
      <div style={{ position: 'relative', width: 260, height: 260, marginBottom: 40 }}>
        {/* pulse rings while listening */}
        {(phase === 'speak') && [0, 0.7, 1.4].map((d, i) => (
          <div key={i} style={{ position: 'absolute', left: '50%', top: '50%', width: 150, height: 150, borderRadius: '50%',
            border: `2px solid ${orbColor[1]}66`, animation: `oz-ring 2.1s ${d}s infinite ease-out` }} />
        ))}
        {/* glow */}
        <div style={{ position: 'absolute', left: '50%', top: '50%', width: 150, height: 150, transform: 'translate(-50%,-50%)', borderRadius: '50%',
          background: `radial-gradient(circle, ${orbColor[2]}88, transparent 70%)`, filter: 'blur(28px)' }} />
        {/* shimmer ring */}
        <div style={{ position: 'absolute', left: '50%', top: '50%', width: 168, height: 168, transform: 'translate(-50%,-50%)', borderRadius: '50%',
          background: `conic-gradient(from 0deg, ${orbColor[0]}, ${orbColor[1]}, ${orbColor[2]}, ${orbColor[0]})`, filter: 'blur(10px)', opacity: 0.5,
          animation: 'oz-spin 8s linear infinite' }} />
        {/* the orb (reactive scale via ref) */}
        <div ref={orbRef} style={{ position: 'absolute', left: '50%', top: '50%', width: 140, height: 140, transform: 'translate(-50%,-50%)', borderRadius: '50%',
          background: `radial-gradient(circle at 35% 30%, #ffffff, ${orbColor[0]} 35%, ${orbColor[1]} 65%, ${orbColor[2]})`,
          boxShadow: `0 0 60px ${orbColor[1]}aa, inset 0 0 30px #ffffff55`, transition: 'background .4s', willChange: 'transform' }} />
        {(phase === 'gotit' || phase === 'done') && (
          <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', fontSize: 56 }}>✓</div>
        )}
      </div>

      <div key={big} style={{ fontSize: 34, fontWeight: 700, letterSpacing: -0.5, animation: 'oz-fade .35s ease', minHeight: 42 }}>{big}</div>
      <div style={{ fontSize: 16, color: '#9fb0c8', maxWidth: 420, marginTop: 12, lineHeight: 1.5, minHeight: 48, padding: '0 20px' }}>{small}</div>

      {/* progress dots */}
      {phase !== 'intro' && phase !== 'done' && (
        <div style={{ display: 'flex', gap: 8, marginTop: 28 }}>
          {Array.from({ length: TOTAL }).map((_, i) => (
            <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', transition: 'all .3s',
              background: i < step ? '#fff' : '#ffffff33', transform: i === step ? 'scale(1.4)' : 'none' }} />
          ))}
        </div>
      )}

      {/* actions */}
      <div style={{ marginTop: 40 }}>
        {phase === 'intro' && (
          <button disabled={!bothReady} onClick={run} style={{ font: '600 16px system-ui', padding: '14px 40px', borderRadius: 999, cursor: bothReady ? 'pointer' : 'default',
            border: 'none', color: '#0a0e1a', background: '#fff', opacity: bothReady ? 1 : 0.5, boxShadow: '0 8px 30px #ffffff22' }}>
            {bothReady ? 'Get started' : 'Loading…'}
          </button>
        )}
        {phase === 'done' && (
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button onClick={() => setPhase('intro')} style={{ font: '600 15px system-ui', padding: '12px 28px', borderRadius: 999, cursor: 'pointer', border: '1px solid #ffffff44', background: 'transparent', color: '#fff' }}>Add another spot</button>
            <button onClick={() => { /* host would close the setup here */ }} style={{ font: '600 15px system-ui', padding: '12px 28px', borderRadius: 999, cursor: 'pointer', border: 'none', color: '#0a0e1a', background: '#fff' }}>Done</button>
          </div>
        )}
      </div>

      <div style={{ position: 'absolute', bottom: 18, font: '11px monospace', color: '#ffffff33' }}>
        {sv.error || wake.error ? 'model error — check console' : 'on-device · audio never leaves the page'}
      </div>
    </div>
  );
}

/** Apple-style on-device voice enrollment with a reactive glowing orb. */
export const Setup: StoryObj = {
  render: () => <VoiceSetup />,
};
