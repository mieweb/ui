/**
 * Wake-word listener (Phase 1 — detection).
 *
 * A headless on-device detector that fires when it hears "hey ozwell" / "ozwell i'm done".
 * This story is the bare listener with a live readout; the next step wires a verified wake to
 * the AIChat voice (hands-free), and Phase 2 adds the doctor-only speaker gate.
 *
 * Requires (one-time): `pnpm add onnxruntime-web`, and the VAD model copied to
 * `.storybook/public/wakeword/silero-vad.onnx` (it isn't in the repo yet — grab it from the
 * hey-ozwell-sv demo's pretrained/ folder). The other 4 models are already in .storybook/public/wakeword/.
 */
import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import { useWakeWord } from './useWakeWord';

const meta: Meta = {
  title: 'Product/Feature Modules/AI/Wake Word',
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'On-device wake-word detection. Say **"hey ozwell"** or **"ozwell I\'m done"** — it fires ' +
          'a verified event entirely in the browser (no audio leaves the page). Headless: a host wires ' +
          '`onWake` to an action (e.g. start the AIChat voice).',
      },
    },
  },
};
export default meta;

function bar(p: number) {
  const pct = Math.round((p || 0) * 100);
  return (
    <div style={{ background: '#e5e7eb', borderRadius: 4, height: 10, overflow: 'hidden', width: 200 }}>
      <div style={{ background: pct > 50 ? '#16a34a' : '#3b82f6', height: '100%', width: `${pct}%`, transition: 'width 80ms' }} />
    </div>
  );
}

function WakeWordDemo() {
  const [log, setLog] = React.useState<{ name: string; t: string }[]>([]);
  const st = useWakeWord({
    onWake: (name) => {
      const t = new Date().toLocaleTimeString();
      setLog((l) => [{ name, t }, ...l].slice(0, 8));
    },
  });

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', width: 420, color: '#1f2733' }}>
      <h3 style={{ marginBottom: 4 }}>Wake-word listener</h3>
      <p style={{ color: '#6b7785', marginTop: 0, fontSize: 14 }}>
        Say <b>“hey ozwell”</b> or <b>“ozwell I’m done”</b>. Runs fully on-device.
      </p>

      <div style={{ font: '12px monospace', color: st.error ? '#dc2626' : '#16a34a', marginBottom: 12 }}>
        {st.error ? `error: ${st.error}` : st.ready ? '● listening' : '… loading models'}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '6px 10px', alignItems: 'center', fontSize: 13 }}>
        <span>speech</span>{bar(st.speech)}
        {Object.entries(st.probs).map(([n, p]) => (
          <React.Fragment key={n}>
            <span>{n}</span>{bar(p)}
          </React.Fragment>
        ))}
      </div>

      <h4 style={{ marginBottom: 4 }}>Detections</h4>
      {log.length === 0 ? (
        <div style={{ color: '#9ca3af', fontSize: 13 }}>none yet — say a phrase</div>
      ) : (
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
          {log.map((d, i) => (
            <li key={i}>🔔 <b>{d.name}</b> <span style={{ color: '#9ca3af' }}>{d.t}</span></li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** The bare on-device listener with a live readout of speech + per-phrase wake probabilities. */
export const Listener: StoryObj = {
  render: () => <WakeWordDemo />,
};
