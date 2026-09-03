/**
 * Two-gate verify — DEV DIAGNOSTIC (not the client UI).
 *
 * Enroll once (guided, phrase-validated), then just talk: it listens continuously and on every wake
 * shows WHICH phrase fired and all three confidence levels — base (wake model), WHO (speaker), WHAT
 * (phrase voiceprint) — each green (pass) / red (fail) / grey (off), with the overall verdict. This is
 * how WE confirm + tune the gates; in the product, verification is invisible (folded into the chat).
 *
 * Composes useWakeWord (detection + WHAT) + useSpeakerVerify (WHO). All on-device. One shared mic:
 * a single rolling recorder (2nd consumer of the detector's stream) supplies audio for both enroll + verify.
 */
import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import { useSpeakerVerify, type VerifyResult } from './useSpeakerVerify';
import { useWakeWord } from '../WakeWord/useWakeWord';
import { loadWhatPrints, clearWhatPrints } from '../../voiceprintStore';
import { openRollingRecorder, chime, type RollingRecorder } from '../audio';

const meta: Meta = {
  title:
    'Product/Feature Modules/AI/Hey Ozwell/Speaker Verify (dev diagnostic)',
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'DEV diagnostic for tuning the gates — not the client UI (in the product, verification is invisible). ' +
          'Enroll once, then talk: every wake shows the phrase + base/WHO/WHAT confidence, colour-coded, on-device.',
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
const WHAT_THRESHOLD = 0.8; // raw-cosine gate (product value) — real phrases land ~0.85-0.94
const VP_CAP = 18;
const delay = (ms: number) => new Promise((r) => window.setTimeout(r, ms));

// chime + the rolling recorder (2nd consumer of the detector's stream, last ~2s) are shared from ../audio.
// WHAT phrase-print templates persist via the shared voiceprint store (IndexedDB) — see ../../voiceprintStore.

interface LogRow {
  id: number;
  phrase: string;
  base: number;
  who: VerifyResult | null;
  what: number | null;
  pass: boolean;
  t: string;
}

interface SVArgs {
  cosineThreshold: number;
  znormThreshold: number;
  useAsnorm: boolean;
}

function SpeakerVerifyDemo({
  cosineThreshold,
  znormThreshold,
  useAsnorm,
}: SVArgs) {
  const sv = useSpeakerVerify();

  // Push the gate thresholds to the live verifier (read at verify-time, so changes apply on the next wake).
  React.useEffect(() => {
    if (!sv.ready) return;
    sv.setGates({ cosine: cosineThreshold, znorm: znormThreshold, useAsnorm });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sv.ready, cosineThreshold, znormThreshold, useAsnorm]);
  const expectRef = React.useRef<string | null>(null);
  const resolveRef = React.useRef<((firedName: string) => void) | null>(null);
  const whatRef = React.useRef<Record<string, Float32Array[]>>({});
  const rollingRef = React.useRef<RollingRecorder | null>(null);
  const enrolledRef = React.useRef(false);
  const rowId = React.useRef(0);

  const wake = useWakeWord({
    onWake: (name) => {
      if (expectRef.current && resolveRef.current) {
        resolveRef.current(name);
        return;
      } // enrolling → resolve waiter
      handleLiveFire(name); // idle → live gate readout
    },
  });
  const wakeRef = React.useRef(wake);
  wakeRef.current = wake;

  // keep a rolling recorder open off the detector's stream while mounted (retry until the stream exists)
  React.useEffect(() => {
    if (!wake.ready) return;
    let cancelled = false;
    let tries = 0;
    const tryOpen = () => {
      if (cancelled || rollingRef.current) return;
      const stream = wakeRef.current.getStream();
      if (stream) rollingRef.current = openRollingRecorder(stream);
      else if (tries++ < 30) window.setTimeout(tryOpen, 300);
    };
    tryOpen();
    return () => {
      cancelled = true;
      rollingRef.current?.close();
      rollingRef.current = null;
    };
  }, [wake.ready]);

  const [status, setStatus] = React.useState('');
  const [cue, setCue] = React.useState<{
    phrase: string;
    mode: 'ready' | 'live' | 'deny';
    msg?: string;
  } | null>(null);
  const [conditions, setConditions] = React.useState(0);
  const [log, setLog] = React.useState<LogRow[]>([]);
  const [busy, setBusy] = React.useState(false);
  const bothReady = sv.ready && wake.ready;
  const enrolled = conditions > 0;
  enrolledRef.current = enrolled;

  // Re-read the enrolled count when the runtime becomes ready (sv is a fresh handle each render; keying on
  // sv.ready is intentional — including `sv` would re-run every render).
  React.useEffect(() => {
    if (sv.ready) setConditions(sv.conditionCount('hey-ozwell'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sv.ready]);

  // restore persisted WHAT templates into the detector when it's ready (so they survive reloads, like WHO)
  React.useEffect(() => {
    if (!wake.ready) return;
    void loadWhatPrints().then((loaded) => {
      whatRef.current = loaded;
      for (const k in loaded) wakeRef.current.setVoiceprint(k, loaded[k]);
    });
  }, [wake.ready]);

  // every wake, while idle: score all three gates and add a colour-coded row
  function handleLiveFire(name: string) {
    const roll = rollingRef.current;
    const samples = roll ? roll.snapshot() : new Float32Array(0);
    const emb = wakeRef.current.getLastEmbedding();
    const base = wakeRef.current.getLastProb(); // frozen fire confidence — a row only exists because it fired
    const enr = enrolledRef.current;
    const who =
      enr && samples.length && roll
        ? sv.verify(name, samples, roll.sampleRate)
        : null;
    const what = enr ? wakeRef.current.phraseCosine(name, emb) : null;
    // verdict = the two REAL gates. "wake" isn't a gate — the fire itself IS the detection.
    const pass =
      (who ? who.pass : true) && (what != null ? what >= WHAT_THRESHOLD : true);
    console.log(
      '[gate]',
      name,
      '· emb',
      emb ? emb.length : 'NULL',
      '· enrolled',
      enr,
      '· hasVP',
      wakeRef.current.hasVoiceprint(name),
      '· WHO',
      who?.score?.toFixed(2),
      '· WHAT',
      what?.toFixed(2)
    );
    setLog((l) =>
      [
        {
          id: ++rowId.current,
          phrase: name,
          base,
          who,
          what,
          pass,
          t: new Date().toLocaleTimeString(),
        },
        ...l,
      ].slice(0, 6)
    );
  }

  const awaitWake = (
    expect: string
  ): Promise<{ fired?: string; timeout?: boolean }> => {
    expectRef.current = expect;
    return new Promise((resolve) => {
      const t = window.setTimeout(() => {
        if (resolveRef.current) {
          resolveRef.current = null;
          expectRef.current = null;
          resolve({ timeout: true });
        }
      }, TIMEOUT_MS);
      resolveRef.current = (n) => {
        window.clearTimeout(t);
        expectRef.current = null;
        resolveRef.current = null;
        resolve({ fired: n });
      };
    });
  };

  const runEnroll = async (append: boolean) => {
    setBusy(true);
    setLog([]);
    if (!rollingRef.current) {
      setStatus('mic not ready yet — give it a second');
      setBusy(false);
      return;
    }
    try {
      for (const ph of PHRASES) {
        const clips: { samples: Float32Array; sampleRate: number }[] = [];
        const embs: Float32Array[] = [];
        while (clips.length < REPS) {
          setCue({ phrase: ph.label, mode: 'ready' });
          setStatus(`sample ${clips.length + 1} of ${REPS}`);
          chime(660);
          await delay(400);
          setCue({ phrase: ph.label, mode: 'live' });
          const w = await awaitWake(ph.key);
          const samples = rollingRef.current.snapshot();
          const emb = wakeRef.current.getLastEmbedding();
          console.log(
            '[enroll]',
            ph.key,
            '· fired',
            w.fired,
            '· emb',
            emb ? emb.length : 'NULL'
          );
          if (w.fired === ph.key) {
            clips.push({ samples, sampleRate: rollingRef.current.sampleRate });
            if (emb) embs.push(emb);
            chime(990);
            setCue({ phrase: ph.label, mode: 'ready' });
            setStatus(`✓ got ${clips.length}/${REPS}`);
            await delay(800);
          } else if (w.fired) {
            setCue({
              phrase: ph.label,
              mode: 'deny',
              msg: 'that was the other phrase',
            });
            await delay(1600);
          } else {
            setCue({
              phrase: ph.label,
              mode: 'deny',
              msg: 'didn’t catch that',
            });
            await delay(1600);
          }
        }
        sv.enroll(ph.key, clips, { append });
        const base = append ? whatRef.current[ph.key] || [] : [];
        const merged = base.concat(embs).slice(-VP_CAP);
        whatRef.current[ph.key] = merged;
        wakeRef.current.setVoiceprint(ph.key, merged);
        console.log(
          '[enroll] stored',
          ph.key,
          '· n',
          merged.length,
          '· hasVP',
          wakeRef.current.hasVoiceprint(ph.key)
        );
      }
      setCue(null);
      setConditions(sv.conditionCount('hey-ozwell'));
      setStatus(
        append
          ? '✅ condition added — now just talk'
          : '✅ enrolled — now just talk; every phrase shows its gates below'
      );
    } catch (e) {
      setCue(null);
      setStatus('error: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setBusy(false);
    }
  };

  const clearAll = () => {
    sv.clear();
    void clearWhatPrints();
    PHRASES.forEach((p) => wakeRef.current.clearVoiceprint(p.key));
    whatRef.current = {};
    setConditions(0);
    setLog([]);
    setStatus('cleared');
  };

  const btn: React.CSSProperties = {
    font: '14px system-ui',
    padding: '8px 14px',
    borderRadius: 8,
    cursor: busy ? 'default' : 'pointer',
    border: '1px solid #2563eb',
    background: '#2563eb',
    color: '#fff',
    opacity: busy ? 0.5 : 1,
  };
  const dot = (state: 'pass' | 'fail' | 'off') => ({
    display: 'inline-block',
    width: 8,
    height: 8,
    borderRadius: '50%',
    marginRight: 4,
    background:
      state === 'pass' ? '#15803d' : state === 'fail' ? '#dc2626' : '#6b7280',
  });
  const lbl = (n: string) => PHRASES.find((p) => p.key === n)?.label || n;

  return (
    <div
      style={{
        fontFamily: 'system-ui, sans-serif',
        width: 520,
        color: '#1f2733',
      }}
    >
      <h3 style={{ marginBottom: 2 }}>
        Two-gate verify{' '}
        <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 400 }}>
          · dev diagnostic
        </span>
      </h3>
      <p style={{ color: '#64748b', fontSize: 13, marginTop: 2 }}>
        Enroll once, then just talk — every phrase shows wake · WHO · WHAT,
        colour-coded. Verdict = WHO + WHAT (the wake confidence is just the
        trigger). In the product this is all invisible.
      </p>

      <div
        style={{
          font: '12px monospace',
          color:
            sv.error || wake.error
              ? '#dc2626'
              : bothReady
                ? '#15803d'
                : '#b45309',
          marginBottom: 10,
        }}
      >
        {sv.error
          ? `speaker error: ${sv.error}`
          : wake.error
            ? `wake error: ${wake.error}`
            : bothReady
              ? `● listening · conditions: ${conditions}`
              : '… loading models'}
      </div>

      {cue && (
        <div
          style={{
            margin: '10px 0',
            padding: 16,
            borderRadius: 12,
            textAlign: 'center',
            background:
              cue.mode === 'deny' || cue.mode === 'live'
                ? '#fef2f2'
                : '#eff6ff',
            border: `1px solid ${cue.mode === 'deny' ? '#f87171' : cue.mode === 'live' ? '#fecaca' : '#bfdbfe'}`,
          }}
        >
          {cue.mode === 'deny' ? (
            <>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#dc2626' }}>
                ❌ {cue.msg} — not counted
              </div>
              <div style={{ fontSize: 17, fontWeight: 700, marginTop: 4 }}>
                try again: “{cue.phrase}”
              </div>
            </>
          ) : (
            <>
              <style>{`@keyframes oz-pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
              <div style={{ fontSize: 13, color: '#64748b' }}>
                {cue.mode === 'live' ? '🔴 say it now' : 'get ready…'}
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>
                “{cue.phrase}”
              </div>
              {cue.mode === 'live' && (
                <div
                  style={{
                    fontSize: 12,
                    color: '#dc2626',
                    marginTop: 6,
                    animation: 'oz-pulse 1s infinite',
                  }}
                >
                  ● listening…
                </div>
              )}
            </>
          )}
        </div>
      )}

      <div
        style={{ display: 'flex', gap: 8, margin: '10px 0', flexWrap: 'wrap' }}
      >
        <button
          style={btn}
          disabled={!bothReady || busy}
          onClick={() => runEnroll(false)}
        >
          {enrolled ? 'Re-enroll (fresh)' : 'Enroll my voice'}
        </button>
        <button
          style={{ ...btn, background: '#0d9488', borderColor: '#0d9488' }}
          disabled={!bothReady || busy || !enrolled}
          onClick={() => runEnroll(true)}
        >
          Add condition
        </button>
        <button
          style={{
            ...btn,
            background: '#fff',
            color: '#dc2626',
            borderColor: '#fca5a5',
          }}
          disabled={busy}
          onClick={clearAll}
        >
          Clear
        </button>
      </div>

      <div style={{ font: '13px monospace', color: '#475569', minHeight: 18 }}>
        {status}
      </div>
      <div style={{ font: '11px monospace', color: '#64748b' }}>
        WHAT prints stored — hey ozwell:{' '}
        {wake.hasVoiceprint('hey-ozwell') ? '✓' : '✗'} · ozwell I’m done:{' '}
        {wake.hasVoiceprint("ozwell-i'm-done") ? '✓' : '✗'}
      </div>

      <div
        style={{ marginTop: 10, borderTop: '1px solid #f1f5f9', paddingTop: 8 }}
      >
        <div
          style={{
            fontSize: 11,
            color: '#64748b',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            marginBottom: 6,
          }}
        >
          Live gate readout
        </div>
        {log.length === 0 ? (
          <div style={{ color: '#64748b', fontSize: 13 }}>
            {enrolled ? 'say a phrase…' : 'enroll first, then talk'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {log.map((r) => (
              <div
                key={r.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '6px 10px',
                  borderRadius: 8,
                  fontSize: 13,
                  background: r.pass ? '#f0fdf4' : '#fef2f2',
                  border: `1px solid ${r.pass ? '#bbf7d0' : '#fecaca'}`,
                }}
              >
                <span style={{ fontWeight: 700, minWidth: 120 }}>
                  {r.pass ? '✅' : '🔒'} “{lbl(r.phrase)}”
                </span>
                <span
                  style={{
                    fontVariantNumeric: 'tabular-nums',
                    color: '#475569',
                  }}
                >
                  <span style={dot('pass')} />
                  wake {r.base.toFixed(2)}
                </span>
                <span
                  style={{
                    fontVariantNumeric: 'tabular-nums',
                    color: '#475569',
                  }}
                >
                  <span
                    style={dot(r.who ? (r.who.pass ? 'pass' : 'fail') : 'off')}
                  />
                  WHO{' '}
                  {r.who
                    ? r.who.score.toFixed(2) +
                      (r.who.znorm != null ? ` z${r.who.znorm.toFixed(1)}` : '')
                    : '—'}
                </span>
                <span
                  style={{
                    fontVariantNumeric: 'tabular-nums',
                    color: '#475569',
                  }}
                >
                  <span
                    style={dot(
                      r.what != null
                        ? r.what >= WHAT_THRESHOLD
                          ? 'pass'
                          : 'fail'
                        : 'off'
                    )}
                  />
                  WHAT {r.what != null ? r.what.toFixed(2) : '—'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** Dev diagnostic: enroll once, then talk — live colour-coded base/WHO/WHAT readout per wake. The WHO-gate
 *  thresholds are live Controls; changes apply on the next wake. */
export const Verify: StoryObj<SVArgs> = {
  args: { cosineThreshold: 0.45, znormThreshold: 1.5, useAsnorm: true },
  argTypes: {
    cosineThreshold: {
      name: 'Cosine threshold (WHO)',
      control: { type: 'range', min: 0, max: 1, step: 0.01 },
      description:
        'Raw cosine to the enrolled voiceprint must clear this to pass. ~0.45 default; lower for noisy rooms ' +
        '(not below ~0.3 — impostors start leaking through).',
    },
    znormThreshold: {
      name: 'Z-score threshold (AS-norm)',
      control: { type: 'range', min: -1, max: 4, step: 0.1 },
      description:
        'How many standard deviations above the cohort the score must sit. Only gates when AS-norm is ON.',
    },
    useAsnorm: {
      name: 'Gate on z-score (AS-norm)',
      control: 'boolean',
      description:
        'OFF (default) gates on raw cosine. ON gates on the channel-invariant z-score instead — steadier ' +
        'across rooms/mics once tuned.',
    },
  },
  render: (args) => <SpeakerVerifyDemo {...args} />,
};
