/**
 * Hey Ozwell — model info readout (mieweb/ui#288).
 *
 * Presentational list of the on-device models (name · version · size · source) with a live status
 * dot. Rendered inside the Ozwell settings menu so people can see what they're running. Pure: the
 * host passes readiness per status key (computed from the wake / transcription load stores).
 */

import * as React from 'react';
import { MODEL_MANIFEST, type ModelStatus, type ModelStatusKey } from './modelManifest';

const DOT: Record<ModelStatus, { color: string; label: string }> = {
  ready: { color: '#10B981', label: 'ready' },
  loading: { color: '#0BA0E0', label: 'loading' },
  idle: { color: '#cbd5e1', label: 'not loaded' },
};

export interface ModelInfoListProps {
  /** Readiness per status key; 'static' models default to 'ready' (load on first use). */
  status?: Partial<Record<ModelStatusKey, ModelStatus>>;
}

/** The model · version · size · source rows with a status dot, for the settings menu. */
export function ModelInfoList({ status }: ModelInfoListProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {MODEL_MANIFEST.map((m) => {
        const st: ModelStatus = status?.[m.statusKey] ?? (m.statusKey === 'static' ? 'ready' : 'idle');
        const dot = DOT[st];
        return (
          <div key={m.id} style={{ padding: '8px 14px', borderTop: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                aria-hidden="true"
                style={{
                  width: 8, height: 8, borderRadius: '50%', flex: '0 0 auto', background: dot.color,
                  ...(st === 'loading' ? { animation: 'oz-pulse 1s ease-in-out infinite' } : {}),
                }}
              />
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', color: '#94a3b8' }}>
                {m.role}
              </span>
              <span style={{ flex: 1 }} />
              <span style={{ fontSize: 11, color: dot.color }} title={`Status: ${dot.label}`}>{dot.label}</span>
            </div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: '#0f172a', marginTop: 2 }}>{m.label}</div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>{m.variant}</div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
              <span title="Pinned version">{m.version}</span>
              {' · '}
              <span title="Approx. download size">{m.approxSize}</span>
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }} title="Loaded from">{m.source}</div>
          </div>
        );
      })}
      {/* keyframes for the loading dot; scoped-ish via the unique animation name */}
      <style>{`@keyframes oz-pulse { 0%,100% { opacity: 1 } 50% { opacity: .35 } }`}</style>
    </div>
  );
}
