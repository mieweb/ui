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
  resetWhisperWorker,
} from '../AI/whisperTranscribe';

// ============================================================================
// Meta
// ============================================================================

const meta: Meta = {
  title: 'Components/Images & Media/MediaEditor Live Demo',
  component: MediaEditor,
  tags: ['autodocs'],
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
          'fallback to segment-level if the model rejects word alignment. The ' +
          'toolbar Script button docks the ScriptPanel: the live edit state as an ' +
          'editable YAML/JSON script (Apply pushes changes back through the ' +
          'undo-safe replaceEditedWords), alongside the read-only original.',
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
  | {
      phase: 'ready';
      mode: 'word' | 'segment';
      wordCount: number;
      seconds: number;
    }
  | { phase: 'error'; message: string };

/** Inference device choices. CPU (wasm) is the default: WebGPU is faster where it works, but
 *  on many Chrome/adapter combos it silently computes garbage tokens with the q8 models — the
 *  demo auto-falls back to CPU when it detects that, so WebGPU is safe to try. */
const DEVICE_OPTIONS = [
  { value: 'wasm', label: 'Compute: CPU (recommended)' },
  { value: 'auto', label: 'Compute: WebGPU (fast, experimental)' },
];

const LiveDemo: React.FC = () => {
  const [model, setModel] = React.useState('base.en');
  const [device, setDevice] = React.useState('wasm');
  // The worker keeps its pipeline until reset; remember what it loaded so we only reset on change.
  const loadedCfg = React.useRef<{ model: string; device: string } | null>(
    null
  );
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

  /** Point the worker config at a model+device; reset the worker if it already loaded something else. */
  const configureWorker = (nextModel: string, nextDevice: string) => {
    (window as unknown as { __ozwell?: object }).__ozwell = {
      ...(window as unknown as { __ozwell?: object }).__ozwell,
      whisper: nextModel,
      whisperDevice: nextDevice === 'wasm' ? 'wasm' : undefined,
    };
    if (
      loadedCfg.current &&
      (loadedCfg.current.model !== nextModel ||
        loadedCfg.current.device !== nextDevice)
    ) {
      resetWhisperWorker();
    }
    loadedCfg.current = { model: nextModel, device: nextDevice };
  };

  const handleFile = async (file: File) => {
    if (!file) return;
    configureWorker(model, device);
    setTranscript(null);
    if (mediaUrl) URL.revokeObjectURL(mediaUrl);
    const url = URL.createObjectURL(file);
    setMediaUrl(url);
    setMediaKind(file.type.startsWith('video/') ? 'video' : 'audio');

    const startedAt = performance.now();
    try {
      // Decode first, with a watchdog: decodeAudioData can hang forever on codecs the
      // browser can't handle (some .mov/HEVC containers) — surface that as an error
      // instead of an eternal spinner.
      setStatus({
        phase: 'working',
        note: `Decoding audio from ${file.name}…`,
      });
      const samples = await Promise.race([
        decodeTo16kMono(file),
        new Promise<never>((_, reject) =>
          setTimeout(
            () =>
              reject(
                new Error(
                  `Could not decode "${file.name}" within 60s — the browser may not support this codec. Try a shorter clip or convert it (e.g. to mp4/wav).`
                )
              ),
            60_000
          )
        ),
      ]);

      // Duration straight from the decoded audio (16 kHz mono) — no probe element needed.
      const durationSec = samples.length / 16000;

      // Implausible output (impossible word rate, timestamps past the end) means the pipeline
      // is producing token salad — a broken WebGPU adapter or failed word alignment.
      const implausible = (segs: { end: number }[]) => {
        const lastEnd = segs.length ? segs[segs.length - 1].end : 0;
        return (
          segs.length === 0 ||
          (durationSec > 0 &&
            (segs.length / durationSec > 8 || lastEnd > durationSec * 1.5))
        );
      };

      setStatus({
        phase: 'working',
        note: 'Transcribing on-device (word-level)…',
      });
      let mode: 'word' | 'segment' = 'word';
      // Samples are transferred to the worker — keep copies for the retry paths.
      let segments = await transcribeWordsFromSamples(samples.slice()).catch(
        () => []
      );

      // Garbage on WebGPU → automatically redo the whole thing on CPU (always correct).
      if (implausible(segments) && device !== 'wasm') {
        setStatus({
          phase: 'working',
          note: 'WebGPU output unusable on this machine — retrying on CPU…',
        });
        configureWorker(model, 'wasm');
        setDevice('wasm');
        segments = await transcribeWordsFromSamples(samples.slice()).catch(
          () => []
        );
      }
      // Word alignment itself unusable → fall back to segment timestamps.
      if (implausible(segments)) {
        mode = 'segment';
        setStatus({
          phase: 'working',
          note: 'Word alignment unusable — falling back to segments…',
        });
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
          disabled={working}
          className="w-64"
        />
        <Select
          options={DEVICE_OPTIONS}
          value={device}
          onValueChange={setDevice}
          size="sm"
          label="Inference device"
          hideLabel
          disabled={working}
          className="w-56"
        />
        <Button
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={working}
        >
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
        {status.phase === 'ready' && (
          <span className="text-muted-foreground text-xs">
            {status.mode === 'word' ? 'Word-level' : 'Segment-level'} ·{' '}
            {status.wordCount} entries · {status.seconds.toFixed(1)}s on-device
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
        <p className="text-muted-foreground m-0 text-sm" role="status">
          {status.note}
        </p>
      )}
      {status.phase === 'error' && (
        <Alert variant="danger">{status.message}</Alert>
      )}

      {mediaUrl && transcript ? (
        <div className="min-h-0 flex-1">
          <MediaEditor
            src={mediaUrl}
            kind={mediaKind}
            transcript={transcript}
          />
        </div>
      ) : (
        <div
          className={`flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed text-center transition-colors ${
            isDragging
              ? 'border-primary-600 bg-primary-50 dark:bg-primary-950'
              : 'border-border'
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
          <p className="text-foreground m-0 font-medium">
            Drop an audio or video file here
          </p>
          <p className="text-muted-foreground m-0 text-sm">
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
