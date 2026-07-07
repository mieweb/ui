/**
 * Shared on-device audio helpers for Hey Ozwell — previously copy-pasted across the enrollment,
 * hands-free, and diagnostic stories. Centralized so all surfaces use one implementation.
 */

export interface RollingRecorder {
  /** The AudioContext sample rate the snapshot is captured at. */
  sampleRate: number;
  /** The last ~2s of mono audio as Float32 samples (copies the whole retained buffer). */
  snapshot: () => Float32Array;
  /** Total samples captured so far (cheap; no copy). For an unbounded accumulator this grows with the
   *  recording — pair with `snapshotFrom` to read only new audio without re-copying everything. */
  totalSamples: () => number;
  /** Copy only the samples from absolute index `startSample` to the end — O(new audio), not O(total).
   *  Lets a live loop read just the fresh tail each tick instead of the whole accumulator (avoids O(n²)). */
  snapshotFrom: (startSample: number) => Float32Array;
  /** Tear down the audio graph + context. */
  close: () => void;
}

/**
 * Open a rolling ~2s recorder as a SECOND consumer of an existing mic stream (e.g. the wake-word
 * detector's `getStream()`) — never a second getUserMedia, which would silence the detector. Used to
 * capture the wake-utterance audio for the speaker-verify (WHO) gate and for enrollment.
 */
export function openRollingRecorder(stream: MediaStream, maxSeconds = 2): RollingRecorder {
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new Ctx();
  const src = ctx.createMediaStreamSource(stream);
  const proc = ctx.createScriptProcessor(4096, 1, 1);
  const sink = ctx.createGain();
  sink.gain.value = 0;
  // `maxSeconds = Infinity` → an unbounded accumulator (keeps the whole utterance, e.g. for live captions).
  const max = maxSeconds === Infinity ? Infinity : Math.round(ctx.sampleRate * maxSeconds);
  let chunks: Float32Array[] = [];
  let total = 0;
  proc.onaudioprocess = (e) => {
    chunks.push(Float32Array.from(e.inputBuffer.getChannelData(0)));
    total += e.inputBuffer.length;
    while (total > max && chunks.length > 1) {
      total -= chunks[0].length;
      chunks.shift();
    }
  };
  src.connect(proc);
  proc.connect(sink);
  sink.connect(ctx.destination);
  return {
    sampleRate: ctx.sampleRate,
    snapshot: () => {
      const s = new Float32Array(total);
      let o = 0;
      for (const c of chunks) {
        s.set(c, o);
        o += c.length;
      }
      return s;
    },
    totalSamples: () => total,
    snapshotFrom: (startSample: number) => {
      const start = Math.max(0, Math.min(startSample, total));
      const out = new Float32Array(total - start);
      let pos = 0; // absolute sample index at the start of the current chunk
      let o = 0;
      for (const c of chunks) {
        const chunkEnd = pos + c.length;
        if (chunkEnd > start) {
          const from = Math.max(0, start - pos);
          const slice = from === 0 ? c : c.subarray(from);
          out.set(slice, o);
          o += slice.length;
        }
        pos = chunkEnd;
      }
      return out;
    },
    close: () => {
      try {
        proc.disconnect();
        src.disconnect();
        sink.disconnect();
      } catch {
        /* ignore */
      }
      void ctx.close();
    },
  };
}

/** A short sine-wave feedback tone (enrollment "get ready" / "got it" cues). Best-effort; no-ops if audio out is unavailable. */
export function chime(freq: number, ms = 170): void {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.value = freq;
    o.type = 'sine';
    o.connect(g);
    g.connect(ctx.destination);
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.16, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + ms / 1000);
    o.start();
    o.stop(ctx.currentTime + ms / 1000 + 0.02);
    window.setTimeout(() => {
      void ctx.close();
    }, ms + 120);
  } catch {
    /* no audio out */
  }
}
