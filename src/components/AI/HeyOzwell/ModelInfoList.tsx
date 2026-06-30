/**
 * Hey Ozwell — model info readout (mieweb/ui#288).
 *
 * Presentational list of the on-device models (name · version · size · source) with a live status
 * dot. Rendered inside the Ozwell settings menu so people can see what they're running. Pure: the
 * host passes readiness per status key (computed from the wake / transcription load stores). Styled
 * with design-system tokens (neutral / muted / success / ozwell) so it tracks theme + dark mode.
 */

import * as React from 'react';
import { MODEL_MANIFEST, type ModelStatus, type ModelStatusKey } from './modelManifest';

const DOT: Record<ModelStatus, { dot: string; text: string; label: string }> = {
  ready: { dot: 'bg-success', text: 'text-success', label: 'ready' },
  loading: { dot: 'bg-ozwell animate-pulse', text: 'text-ozwell', label: 'loading' },
  idle: { dot: 'bg-neutral-300 dark:bg-neutral-600', text: 'text-muted-foreground', label: 'not loaded' },
};

export interface ModelInfoListProps {
  /** Readiness per status key; 'static' models default to 'ready' (load on first use). */
  status?: Partial<Record<ModelStatusKey, ModelStatus>>;
}

/** The model · version · size · source rows with a status dot, for the settings menu. */
export function ModelInfoList({ status }: ModelInfoListProps) {
  return (
    <div className="flex flex-col">
      {MODEL_MANIFEST.map((m) => {
        const st: ModelStatus = status?.[m.statusKey] ?? (m.statusKey === 'static' ? 'ready' : 'idle');
        const d = DOT[st];
        return (
          <div key={m.id} className="border-t border-neutral-100 px-3.5 py-2 dark:border-neutral-700">
            <div className="flex items-center gap-2">
              <span aria-hidden="true" className={`h-2 w-2 shrink-0 rounded-full ${d.dot}`} />
              <span className="text-[9px] font-bold tracking-wide uppercase text-muted-foreground">{m.role}</span>
              <span className="flex-1" />
              <span className={`text-[11px] ${d.text}`} title={`Status: ${d.label}`}>{d.label}</span>
            </div>
            <div className="mt-0.5 text-[12.5px] font-semibold text-neutral-900 dark:text-neutral-100">{m.label}</div>
            <div className="mt-px text-[11px] text-neutral-600 dark:text-neutral-300">{m.variant}</div>
            <div className="mt-0.5 text-[11px] text-muted-foreground">
              <span title="Pinned version">{m.version}</span>
              {' · '}
              <span title="Approx. download size">{m.approxSize}</span>
            </div>
            <div className="mt-px text-[11px] text-muted-foreground" title="Loaded from">{m.source}</div>
          </div>
        );
      })}
    </div>
  );
}
