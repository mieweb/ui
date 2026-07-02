/**
 * Shared on-device audio helpers for Hey Ozwell — previously copy-pasted across the enrollment,
 * hands-free, and diagnostic stories. Centralized so all surfaces use one implementation.
 */

export interface RollingRecorder {
  /** The AudioContext sample rate the snapshot is captured at. */
  sampleRate: number;
  /** The last ~2s of mono audio as Float32 samples. */
  snapshot: () => Float32Array;
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
