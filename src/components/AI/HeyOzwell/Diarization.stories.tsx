/**
 * Diarization — DEV DIAGNOSTIC (not a client surface).
 *
 * Record a short multi-speaker clip → run `useDiarization` (Whisper timestamps + TitaNet clustering +
 * voiceprint anchoring, all on-device) → show the attributed transcript. Enroll voices first (Voice
 * Manager) to see the doctor/care-team named; unknowns show as "Speaker N" (or LLM-inferred roles if you
 * tick the box and have a chat backend configured). See AI/DIARIZATION.md.
 */
import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import { Button } from '../../Button';
import { useDiarization } from './useDiarization';

function DiarizationDemo() {
  const [inferRoles, setInferRoles] = React.useState(false);
  const oz = useDiarization({ inferRoles });
  const [recording, setRecording] = React.useState(false);
  const recRef = React.useRef<MediaRecorder | null>(null);
  const chunksRef = React.useRef<BlobPart[]>([]);

  const start = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const rec = new MediaRecorder(stream);
    chunksRef.current = [];
    rec.ondataavailable = (e) => {
      if (e.data && e.data.size) chunksRef.current.push(e.data);
    };
    rec.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      const blob = new Blob(chunksRef.current, { type: rec.mimeType || 'audio/webm' });
      void oz.diarize(blob).catch(() => {});
    };
    rec.start();
    recRef.current = rec;
    setRecording(true);
  };
  const stop = () => {
    recRef.current?.stop();
    recRef.current = null;
    setRecording(false);
  };

  const speakers = oz.result ? new Set(oz.result.map((s) => s.speaker)).size : 0;

  return (
    <div className="bg-background text-foreground mx-auto flex max-w-[640px] flex-col gap-4 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Diarization</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Record a short clip with 2+ people, then stop — Ozwell segments it, clusters the speakers, and
          names any you’ve enrolled. All on-device.
        </p>
      </div>

      <div className="flex items-center gap-3">
        {recording ? (
          <Button variant="danger" onClick={stop}>Stop &amp; diarize</Button>
        ) : (
          <Button onClick={start} disabled={!oz.ready || oz.busy}>Record</Button>
        )}
        <label className="text-muted-foreground flex items-center gap-2 text-sm">
          <input type="checkbox" checked={inferRoles} onChange={(e) => setInferRoles(e.target.checked)} />
          Infer roles with the LLM (needs a chat backend)
        </label>
      </div>

      <div className="text-muted-foreground text-[13px]">
        {!oz.ready && 'Loading the speaker model…'}
        {oz.ready && oz.busy && 'Diarizing…'}
        {oz.error && <span className="text-destructive">Error: {oz.error}</span>}
        {oz.result && !oz.busy && `${oz.result.length} turns · ${speakers} speaker${speakers === 1 ? '' : 's'}`}
      </div>

      {oz.result && (
        <div className="border-border divide-border divide-y rounded-xl border">
          {oz.result.map((turn, i) => (
            <div key={i} className="p-3">
              <div className="text-ozwell text-xs font-semibold">
                {turn.speaker} <span className="text-muted-foreground font-normal">· {turn.start.toFixed(1)}s</span>
              </div>
              <div className="text-foreground mt-0.5 text-sm">{turn.text}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const meta: Meta<typeof DiarizationDemo> = {
  title: 'Product/Feature Modules/AI/Hey Ozwell/Diarization (dev diagnostic)',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'DEV diagnostic for on-device diarization — record a multi-speaker clip → attributed transcript ' +
          '(enrolled voices named, unknowns as Speaker N or LLM-inferred roles). Not the client UI.',
      },
    },
  },
};
export default meta;

/** Record → diarize → attributed transcript. */
export const Demo: StoryObj<typeof DiarizationDemo> = {
  render: () => <DiarizationDemo />,
};
