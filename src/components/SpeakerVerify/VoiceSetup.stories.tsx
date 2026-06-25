/**
 * Voice Setup — the client-facing enrollment page (Apple "Hey Siri"-style, Ozwell-branded).
 *
 * Tap the Ozwell octopus to start; it glows and pulses with your voice, bounces on each success.
 * One guided pass builds BOTH prints (WHO speaker + WHAT phrase), phrase-validated by the wake model,
 * persisted. The pretty front-end over the same enroll logic as the dev diagnostic. All on-device.
 */
import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import { useSpeakerVerify } from './useSpeakerVerify';
import { useWakeWord } from '../WakeWord/useWakeWord';

const meta: Meta = {
  title: 'Product/Feature Modules/AI/Voice Setup',
  parameters: { layout: 'fullscreen', docs: { description: { component: 'On-device voice enrollment — tap the Ozwell octopus, it pulses as you talk. Apple-style, brand-aligned.' } } },
};
export default meta;

const OZ = '#0BA0E0';                 // Ozwell octopus blue
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
  const octoRef = React.useRef<HTMLImageElement>(null);
  const glowRef = React.useRef<HTMLDivElement>(null);
  const levelRef = React.useRef(0);

  const wake = useWakeWord({ onWake: (name) => { if (expectRef.current && resolveRef.current) resolveRef.current(name); } });
  const wakeRef = React.useRef(wake); wakeRef.current = wake;
  const bothReady = sv.ready && wake.ready;

  const [phase, setPhase] = React.useState<Phase>('intro');
  const [phrase, setPhrase] = React.useState('hey ozwell');
  const [step, setStep] = React.useState(0);
  const TOTAL = PHRASES.length * REPS;

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
        levelRef.current = levelRef.current * 0.78 + peak * 0.22;
        const lv = levelRef.current;
        if (octoRef.current) octoRef.current.style.transform = `scale(${(1 + Math.min(0.32, lv * 2.2)).toFixed(3)})`;
        if (glowRef.current) { glowRef.current.style.opacity = `${(0.35 + Math.min(0.6, lv * 4)).toFixed(2)}`; glowRef.current.style.transform = `translate(-50%,-50%) scale(${(1 + Math.min(0.6, lv * 3)).toFixed(3)})`; }
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
    if (!bothReady || phase !== 'intro' || !recRef.current) return;
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
          chime(990); setPhase('gotit'); overall++; setStep(overall); await delay(750);
        } else { setPhase('deny'); await delay(1500); }
      }
      sv.enroll(ph.key, clips, { append: false });
      const merged = embs.slice(-VP_CAP);
      whatRef.current[ph.key] = merged; wakeRef.current.setVoiceprint(ph.key, merged);
    }
    saveWhat(whatRef.current);
    setPhase('done');
  };

  const big = phase === 'intro' ? 'Meet Ozwell'
    : phase === 'done' ? 'You’re all set'
    : phase === 'deny' ? 'Let’s try that again'
    : `“${phrase}”`;
  const small = phase === 'intro' ? 'Tap Ozwell and say each phrase a few times — it learns your voice so it only responds to you. On-device.'
    : phase === 'getready' ? 'Get ready…'
    : phase === 'speak' ? 'Now say it'
    : phase === 'gotit' ? 'Got it!'
    : phase === 'deny' ? `Say “${phrase}” clearly`
    : 'Ozwell now responds only to your voice.';
  const wrapAnim = phase === 'gotit' ? 'oz-bounce .6s ease' : phase === 'deny' ? 'oz-shake .5s ease' : 'oz-float 4s ease-in-out infinite';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'system-ui, -apple-system, sans-serif', color: '#1f2733', textAlign: 'center', position: 'relative', overflow: 'hidden',
      background: 'radial-gradient(900px 520px at 50% -5%, #e8f6fd 0%, #ffffff 58%)' }}>
      <style>{`
        @keyframes oz-ring { 0% { transform: translate(-50%,-50%) scale(.7); opacity:.5 } 100% { transform: translate(-50%,-50%) scale(2.2); opacity:0 } }
        @keyframes oz-float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-10px) } }
        @keyframes oz-bounce { 0% { transform: scale(1) } 35% { transform: scale(1.18) } 70% { transform: scale(.96) } 100% { transform: scale(1) } }
        @keyframes oz-shake { 0%,100% { transform: translateX(0) } 20% { transform: translateX(-10px) } 40% { transform: translateX(9px) } 60% { transform: translateX(-6px) } 80% { transform: translateX(4px) } }
        @keyframes oz-fade { from { opacity:0; transform: translateY(8px) } to { opacity:1; transform: none } }
        @keyframes oz-invite { 0%,100% { box-shadow: 0 0 0 0 ${OZ}55 } 50% { box-shadow: 0 0 0 14px ${OZ}00 } }
      `}</style>

      <div style={{ position: 'relative', width: 260, height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28 }}>
        {phase === 'speak' && [0, 0.7, 1.4].map((d, i) => (
          <div key={i} style={{ position: 'absolute', left: '50%', top: '50%', width: 150, height: 150, borderRadius: '50%', border: `2px solid ${OZ}55`, animation: `oz-ring 2.1s ${d}s infinite ease-out` }} />
        ))}
        <div ref={glowRef} style={{ position: 'absolute', left: '50%', top: '50%', width: 180, height: 180, transform: 'translate(-50%,-50%)', borderRadius: '50%',
          background: `radial-gradient(circle, ${OZ}66, transparent 68%)`, filter: 'blur(26px)', opacity: 0.4, pointerEvents: 'none' }} />
        {/* the octopus — tappable in intro, pulses with voice via the ref */}
        <div
          role={phase === 'intro' ? 'button' : undefined}
          onClick={phase === 'intro' ? run : undefined}
          title={phase === 'intro' ? 'Tap to set up your voice' : undefined}
          style={{ position: 'relative', width: 150, height: 150, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: phase === 'intro' && bothReady ? 'pointer' : 'default', animation: wrapAnim,
            ...(phase === 'intro' && bothReady ? { borderRadius: '50%' } : {}) }}
        >
          <div style={phase === 'intro' && bothReady ? { position: 'absolute', inset: 0, borderRadius: '50%', animation: 'oz-invite 2s infinite' } : undefined} />
          <img ref={octoRef} src="/ozwell/icon.svg" alt="Ozwell" draggable={false}
            style={{ width: 120, height: 122, filter: `drop-shadow(0 8px 24px ${OZ}55)`, transition: 'transform .08s linear', willChange: 'transform', userSelect: 'none' }} />
          {(phase === 'gotit' || phase === 'done') && (
            <div style={{ position: 'absolute', right: -2, bottom: -2, width: 36, height: 36, borderRadius: '50%', background: '#16a34a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, boxShadow: '0 2px 10px #16a34a66' }}>✓</div>
          )}
        </div>
      </div>

      <div key={big} style={{ fontSize: 32, fontWeight: 700, letterSpacing: -0.5, animation: 'oz-fade .35s ease', minHeight: 40, color: '#0f2233' }}>{big}</div>
      <div style={{ fontSize: 15.5, color: '#5b6b7e', maxWidth: 430, marginTop: 10, lineHeight: 1.55, minHeight: 48, padding: '0 20px' }}>{small}</div>

      {phase !== 'intro' && phase !== 'done' && (
        <div style={{ display: 'flex', gap: 8, marginTop: 26 }}>
          {Array.from({ length: TOTAL }).map((_, i) => (
            <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', transition: 'all .3s', background: i < step ? OZ : '#cbd5e1', transform: i === step ? 'scale(1.4)' : 'none' }} />
          ))}
        </div>
      )}

      <div style={{ marginTop: 34, minHeight: 48 }}>
        {phase === 'intro' && !bothReady && <div style={{ font: '13px monospace', color: '#94a3b8' }}>loading models…</div>}
        {phase === 'done' && (
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button onClick={() => setPhase('intro')} style={{ font: '600 15px system-ui', padding: '12px 26px', borderRadius: 999, cursor: 'pointer', border: `1.5px solid ${OZ}`, background: 'transparent', color: OZ }}>Add another spot</button>
            <button onClick={() => { /* host closes the setup here */ }} style={{ font: '600 15px system-ui', padding: '12px 30px', borderRadius: 999, cursor: 'pointer', border: 'none', color: '#fff', background: OZ, boxShadow: `0 8px 24px ${OZ}55` }}>Done</button>
          </div>
        )}
      </div>

      <div style={{ position: 'absolute', bottom: 18, font: '11px monospace', color: '#aebccb' }}>
        {sv.error || wake.error ? 'model error — check console' : '🔒 on-device · audio never leaves the page'}
      </div>
    </div>
  );
}

/** Tap the Ozwell octopus; it pulses as you talk. On-device, brand-aligned enrollment. */
export const Setup: StoryObj = {
  render: () => <VoiceSetup />,
};
