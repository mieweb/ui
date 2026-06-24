/**
 * Wake-word listener (Phase 1 — detection).
 *
 * A headless on-device detector that fires when it hears "hey ozwell" / "ozwell i'm done".
 * This story is the bare listener with a live readout; the next step wires a verified wake to
 * the AIChat voice (hands-free), and Phase 2 adds the doctor-only speaker gate.
 *
 * Requires (one-time): `pnpm add onnxruntime-web`. All 5 models ship in .storybook/public/wakeword/.
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

const LABELS: Record<string, string> = { 'hey-ozwell': 'hey ozwell', "ozwell-i'm-done": "ozwell I'm done" };

function Meter({ label, value, accent }: { label: string; value: number; accent: string }) {
  const pct = Math.round((value || 0) * 100);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10 }}>
      <span style={{ width: 116, fontSize: 13, color: '#475569', textAlign: 'right' }}>{label}</span>
      <div style={{ flex: 1, height: 12, background: '#eef2f7', borderRadius: 6, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`, borderRadius: 6,
          background: `linear-gradient(90deg, ${accent}aa, ${accent})`,
          transition: 'width 90ms linear',
        }} />
      </div>
      <span style={{ width: 34, fontSize: 12, color: '#94a3b8', fontVariantNumeric: 'tabular-nums' }}>{pct}%</span>
    </div>
  );
}

function WakeWordDemo() {
  const [log, setLog] = React.useState<{ name: string; t: string }[]>([]);
  const [flash, setFlash] = React.useState<string | null>(null);
  const st = useWakeWord({
    onWake: (name) => {
      setLog((l) => [{ name, t: new Date().toLocaleTimeString() }, ...l].slice(0, 6));
      setFlash(name);
      window.setTimeout(() => setFlash((f) => (f === name ? null : f)), 900);
    },
  });

  const status = st.error ? 'error' : st.ready ? 'listening' : 'loading';
  const dotColor = status === 'error' ? '#dc2626' : status === 'listening' ? '#16a34a' : '#d97706';

  return (
    <div style={{
      fontFamily: 'system-ui, -apple-system, sans-serif', width: 460, color: '#1f2733',
      background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16,
      boxShadow: '0 1px 3px rgba(0,0,0,.06)', padding: 24,
      outline: flash ? '2px solid #16a34a' : '2px solid transparent', transition: 'outline-color .2s',
    }}>
      <style>{`@keyframes oz-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.55;transform:scale(.82)}}`}</style>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{
          width: 10, height: 10, borderRadius: '50%', background: dotColor,
          animation: status === 'listening' ? 'oz-pulse 1.4s infinite' : 'none',
        }} />
        <h3 style={{ margin: 0, fontSize: 16 }}>Wake-word listener</h3>
        <span style={{ marginLeft: 'auto', font: '11px monospace', color: dotColor, textTransform: 'uppercase', letterSpacing: .5 }}>
          {status === 'error' ? st.error : status}
        </span>
      </div>
      <p style={{ color: '#64748b', margin: '6px 0 4px', fontSize: 13.5 }}>
        Say <b style={{ color: '#1f2733' }}>“hey ozwell”</b> or <b style={{ color: '#1f2733' }}>“ozwell I’m done”</b>.
        Detection runs fully on-device — audio never leaves the page.
      </p>

      <div style={{ marginTop: 14 }}>
        <Meter label="speech" value={st.speech} accent="#3b82f6" />
        {Object.keys(LABELS).map((n) => (
          <Meter key={n} label={LABELS[n]} value={st.probs[n] || 0} accent="#16a34a" />
        ))}
      </div>

      <div style={{ marginTop: 18, borderTop: '1px solid #f1f5f9', paddingTop: 12 }}>
        <div style={{ fontSize: 12, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 8 }}>
          Detections
        </div>
        {log.length === 0 ? (
          <div style={{ color: '#cbd5e1', fontSize: 13 }}>none yet — say a phrase</div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {log.map((d, i) => (
              <span key={i} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5,
                background: i === 0 ? '#dcfce7' : '#f1f5f9', color: '#166534',
                padding: '4px 10px', borderRadius: 999,
              }}>
                🔔 <b>{LABELS[d.name] || d.name}</b>
                <span style={{ color: '#94a3b8' }}>{d.t}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** The on-device listener with a live readout of speech + per-phrase wake probabilities. */
export const Listener: StoryObj = {
  render: () => <WakeWordDemo />,
};
