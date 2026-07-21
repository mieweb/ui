import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { MediaEditor } from './MediaEditor';
import type { Transcript } from '../TranscriptView/transcript';
import { Button } from '../Button';
import { Select } from '../Select';
import { Progress } from '../Progress';
import { Alert } from '../Alert';
import {
  decodeTo16kMono,
  transcribeWordsFromSamples,
  transcribeSegmentsFromSamples,
  getDictationLoad,
  subscribeDictationLoad,
  isWhisperLoaded,
} from '../AI/whisperTranscribe';

// ============================================================================
// Meta
// ============================================================================

const meta: Meta = {
  title: 'Components/Images & Media/MediaEditor Live Demo',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Fully-functional MediaEditor demo: drop any audio or video file and it is ' +
          'transcribed IN THE BROWSER by the on-device Whisper worker (no server, no API ' +
          'keys — audio never leaves the page), then opened in the editor. Pick the ' +
          'Whisper model before the first transcription; base.en is the recommended ' +
          'default (it preserves inter-word silence gaps, which the silence-editing ' +
          'features depend on). Word-level timestamps are requested first, with a ' +
          'fallback to segment-level if the model rejects word alignment.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ============================================================================
// Demo
// ============================================================================

/** Whisper model choices exposed by the on-device worker (see whisperTranscribe SMALL_MODELS). */
const MODEL_OPTIONS = [
  { value: 'base.en', label: 'base.en (~75 MB, recommended)' },
  { value: 'tiny.en', label: 'tiny.en (~40 MB, fastest)' },
  { value: 'small.en', label: 'small.en (~250 MB, more accurate)' },
  { value: 'turbo', label: 'turbo (~1.3 GB, multilingual)' },
];

type Status =
  | { phase: 'idle' }
  | { phase: 'working'; note: string }
  | { phase: 'ready'; mode: 'word' | 'segment'; wordCount: number; seconds: number }
  | { phase: 'error'; message: string };

/** Inference device choices — WebGPU is fast but on software/broken adapters it can silently
 *  produce garbage tokens; CPU (wasm) is slower but always correct. */
const DEVICE_OPTIONS = [
  { value: 'auto', label: 'Compute: Auto (WebGPU)' },
  { value: 'wasm', label: 'Compute: CPU (always correct)' },
];

const LiveDemo: React.FC = () => {
  const [model, setModel] = React.useState('base.en');
  const [device, setDevice] = React.useState('auto');
  const [modelLocked, setModelLocked] = React.useState(false);
  const [status, setStatus] = React.useState<Status>({ phase: 'idle' });
  const [mediaUrl, setMediaUrl] = React.useState<string | null>(null);
  const [mediaKind, setMediaKind] = React.useState<'audio' | 'video'>('audio');
  const [transcript, setTranscript] = React.useState<Transcript | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const load = React.useSyncExternalStore(
    subscribeDictationLoad,
    getDictationLoad,
    getDictationLoad
  );

  const handleFile = async (file: File) => {
    if (!file) return;
    // The worker resolves its model from window.__ozwell.whisper at first load; after that the
    // pipeline is cached for the page's lifetime, so lock the picker (reload the story to switch).
    (window as unknown as { __ozwell?: { whisper?: string } }).__ozwell = {
      ...(window as unknown as { __ozwell?: object }).__ozwell,
      whisper: model,
      ...(device === 'wasm' ? { whisperDevice: 'wasm' } : {}),
    };
    setModelLocked(true);
    setTranscript(null);
    if (mediaUrl) URL.revokeObjectURL(mediaUrl);
    const url = URL.createObjectURL(file);
    setMediaUrl(url);
    setMediaKind(file.type.startsWith('video/') ? 'video' : 'audio');

    const startedAt = performance.now();
    try {
      // Media duration (for a word-rate plausibility check on word-level alignment output).
      const durationSec = await new Promise<number>((resolve) => {
        const el = document.createElement('video');
        el.preload = 'metadata';
        el.onloadedmetadata = () => resolve(el.duration || 0);
        el.onerror = () => resolve(0);
        el.src = url;
      });

      // Decode first, with a watchdog: decodeAudioData can hang forever on codecs the
      // browser can't handle (some .mov/HEVC containers) — surface that as an error
      // instead of an eternal spinner.
      setStatus({ phase: 'working', note: `Decoding audio from ${file.name}…` });
      const samples = await Promise.race([
        decodeTo16kMono(file),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error(
              `Could not decode "${file.name}" within 60s — the browser may not support this codec. Try a shorter clip or convert it (e.g. to mp4/wav).`
            )),
            60_000
          )
        ),
      ]);

      setStatus({ phase: 'working', note: 'Transcribing on-device (word-level)…' });
      let mode: 'word' | 'segment' = 'word';
      // Samples are transferred to the worker — keep copies for the retry path.
      let segments = await transcribeWordsFromSamples(samples.slice()).catch(() => []);
      // Word-level alignment can silently produce token salad on some model builds / noisy audio.
      // Treat implausible output (impossible word rate, timestamps past the end) as a failed
      // alignment and fall back to segment timestamps.
      const lastEnd = segments.length ? segments[segments.length - 1].end : 0;
      const implausible =
        segments.length === 0 ||
        (durationSec > 0 &&
          (segments.length / durationSec > 8 || lastEnd > durationSec * 1.5));
      if (implausible) {
        mode = 'segment';
        setStatus({ phase: 'working', note: 'Word alignment unusable — falling back to segments…' });
        segments = await transcribeSegmentsFromSamples(samples.slice());
      }
      if (segments.length === 0) {
        throw new Error('No speech detected in this file.');
      }
      const words = segments.map((s) => ({
        text: s.text,
        startMs: Math.round(s.start * 1000),
        endMs: Math.round(Math.max(s.end, s.start) * 1000),
      }));
      setTranscript({ durationMs: words[words.length - 1].endMs, words });
      setStatus({
        phase: 'ready',
        mode,
        wordCount: words.length,
        seconds: (performance.now() - startedAt) / 1000,
      });
    } catch (err) {
      setStatus({
        phase: 'error',
        message: err instanceof Error ? err.message : 'Transcription failed.',
      });
    }
  };

  const working = status.phase === 'working';

  return (
    <div className="flex h-[640px] w-full flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <Select
          options={MODEL_OPTIONS}
          value={model}
          onValueChange={setModel}
          size="sm"
          label="Whisper model"
          hideLabel
          disabled={modelLocked || isWhisperLoaded()}
          className="w-64"
        />
        <Select
          options={DEVICE_OPTIONS}
          value={device}
          onValueChange={setDevice}
          size="sm"
          label="Inference device"
          hideLabel
          disabled={modelLocked || isWhisperLoaded()}
          className="w-56"
        />
        <Button size="sm" onClick={() => inputRef.current?.click()} disabled={working}>
          Choose audio or video…
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="audio/*,video/*"
          className="sr-only"
          aria-label="Choose an audio or video file to transcribe"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleFile(f);
          }}
        />
        {modelLocked && (
          <span className="text-xs text-muted-foreground">
            Model locked for this session — reload the story to switch.
          </span>
        )}
        {status.phase === 'ready' && (
          <span className="text-xs text-muted-foreground">
            {status.mode === 'word' ? 'Word-level' : 'Segment-level'} · {status.wordCount} entries ·{' '}
            {status.seconds.toFixed(1)}s on-device
          </span>
        )}
      </div>

      {load.active && (
        <Progress
          value={Math.round(load.progress * 100)}
          label="Downloading Whisper model (cached after first load)"
          showValue
        />
      )}
      {working && (
        <p className="m-0 text-sm text-muted-foreground" role="status">
          {status.note}
        </p>
      )}
      {status.phase === 'error' && <Alert variant="danger">{status.message}</Alert>}

      {mediaUrl && transcript ? (
        <div className="min-h-0 flex-1">
          <MediaEditor src={mediaUrl} kind={mediaKind} transcript={transcript} />
        </div>
      ) : (
        <div
          className={`flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed text-center transition-colors ${
            isDragging ? 'border-primary-600 bg-primary-50 dark:bg-primary-950' : 'border-border'
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            const f = e.dataTransfer.files?.[0];
            if (f && !working) void handleFile(f);
          }}
        >
          <p className="m-0 font-medium text-foreground">Drop an audio or video file here</p>
          <p className="m-0 text-sm text-muted-foreground">
            Transcribed entirely in your browser — nothing is uploaded anywhere.
          </p>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Stories
// ============================================================================

export const LiveTranscription: Story = {
  render: () => <LiveDemo />,
};
