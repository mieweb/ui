/**
 * On-device speaker-verification gate (the "only the enrolled doctor can wake it" layer).
 *
 * Loads the custom single-threaded sherpa-onnx WASM build (in /sv-wasm/) that exports the
 * SpeakerEmbeddingExtractor C-API, runs TitaNet speaker embeddings fully in-browser, and
 * verifies a live utterance against an enrolled "doctor" centroid stored in localStorage.
 *
 * Proven in the /sv-wasm/ spike: a ~1s "hey ozwell" gives genuine cosine ~0.66 / impostor
 * ~0.30 (enroll-centroid: ~0.75 vs ~0.22, EER ~1.3%). This is a DIFFERENT axis from the
 * content voiceprint in hey-buddy.js: that BOOSTS the doctor's accented phrase (recall);
 * this BLOCKS a non-doctor's clean phrase (act/no-act). They compose.
 *
 * Load this as a classic <script> BEFORE index.js. Exposes window.SpeakerVerify.
 * Audio in == Float32Array; pass its TRUE sample rate (sherpa resamples to 16k internally).
 */
(function () {
  // Production runtime artifacts live in their OWN folder so they never clobber the
  // frozen feasibility proof in /sv-wasm (test.html + mic-test.html, kept for the
  // progression demo / YouTube short). This loads the single-threaded slim build.
  // Where the sherpa runtime (.js glue + .wasm + .data) and the AS-norm cohort are served from.
  // Default "/sv-runtime" (Storybook static dir). Set window.__ozwellAssets (a base URL string, or
  // { base, svRuntime }) to fetch the ~50 MB off the repo from a host — see AI/MODEL-HOSTING.md.
  const SV_DIR = (function () {
    // Storybook runs in an iframe; a console-set window.__ozwellAssets often lands on the parent frame,
    // so check current -> parent -> top (all same-origin).
    var pick = function (w) { try { return w && w.__ozwellAssets; } catch (e) { return null; } };
    var g = (typeof window !== "undefined") ? (pick(window) || pick(window.parent) || pick(window.top)) : null;
    var strip = function (s) { return String(s).replace(/\/$/, ""); };
    if (typeof g === "string") return strip(g) + "/sv-runtime";
    if (g && g.svRuntime) return strip(g.svRuntime);
    if (g && g.base) return strip(g.base) + "/sv-runtime";
    // localStorage fallback — shared across Storybook frames, survives reload (the reliable path).
    try { var ls = localStorage.getItem("ozwellAssetBase"); if (ls) return strip(ls) + "/sv-runtime"; } catch (e) { /* ignore */ }
    // Default host: the runtime was moved off the repo (see AI/MODEL-HOSTING.md) so a fresh clone
    // fetches it from here with no config. Override via window.__ozwellAssets / localStorage.
    return "https://huggingface.co/jlocala/ozwell-voice-assets/resolve/main/sv-runtime";
  })();
  const MODEL = "./nemo_en_titanet_small.onnx"; // preloaded into the WASM filesystem
  const LS_KEY = "ozwellDoctorVoiceprint";       // { centroid: number[], n: number }
  // Threshold from the spike's enroll-centroid distributions (genuine ~0.75 / impostor ~0.22).
  // 0.45 (2026-06-22): with mic DSP on + matched enrollment the genuine doctor scores ~0.75-0.93 clean,
  // so 0.45 passes with wide margin and rejects impostors harder. Heavy background can still drag the doctor
  // toward ~0.4 (then 0.45 rejects -> "say it again", a fail-safe miss in an unrealistic-noise case).
  // Re-tune live: window.SpeakerVerify.threshold = 0.4 / 0.35 for heavy noise (don't go below ~0.3 — impostors).
  const DEFAULT_THRESHOLD = 0.45;

  let Module = null, handle = 0, dim = 0;
  let cohort = [];   // AS-norm crowd: other-voice embeddings; live/centroid scored against it cancels channel
  let readyResolve, readyReject;
  const readyPromise = new Promise((res, rej) => { readyResolve = res; readyReject = rej; });

  function loadScript(src) {
    return new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = src; s.onload = res; s.onerror = () => rej(new Error("failed to load " + src));
      document.head.appendChild(s);
    });
  }

  // --- speaker-embedding extraction over the WASM C-API (names confirmed from the build) ---
  function embed(samples, sampleRate) {
    const M = Module;
    const stream = M._SherpaOnnxSpeakerEmbeddingExtractorCreateStream(handle);
    const ptr = M._malloc(samples.length * 4);
    M.HEAPF32.set(samples, ptr / 4);
    M._SherpaOnnxOnlineStreamAcceptWaveform(stream, sampleRate, ptr, samples.length); // stream-only
    M._free(ptr);
    M._SherpaOnnxOnlineStreamInputFinished(stream);
    const ep = M._SherpaOnnxSpeakerEmbeddingExtractorComputeEmbedding(handle, stream);
    const out = M.HEAPF32.subarray(ep / 4, ep / 4 + dim).slice();
    // free the embedding (exported in the slim rebuild); guard in case it's absent.
    if (M._SherpaOnnxSpeakerEmbeddingExtractorDestroyEmbedding) {
      M._SherpaOnnxSpeakerEmbeddingExtractorDestroyEmbedding(ep);
    }
    M._SherpaOnnxDestroyOnlineStream(stream);
    return l2normalize(out);
  }

  function l2normalize(v) {
    let s = 0; for (let i = 0; i < v.length; i++) s += v[i] * v[i];
    s = Math.sqrt(s); if (s > 0) for (let i = 0; i < v.length; i++) v[i] /= s;
    return v;
  }
  function cosine(a, b) { let d = 0; const n = Math.min(a.length, b.length); for (let i = 0; i < n; i++) d += a[i] * b[i]; return d; } // both L2-normalized

  // --- enrollment storage: PER-PHRASE centroids of the doctor's embeddings (vectors, not
  // audio). Per-phrase because on a ~1s clip a speaker embedding still carries a little of
  // WHAT was said, so the doctor's "hey ozwell" centroid scores their "ozwell i'm done"
  // too low. We enroll + gate each phrase against its own centroid. ---
  function loadAll() {
    try {
      const o = JSON.parse(localStorage.getItem(LS_KEY) || "{}") || {};
      // Ignore the old single-centroid format ({centroid, n}) from earlier builds.
      if (o && Array.isArray(o.centroid)) return {};
      return o;
    } catch (e) { return {}; }
  }
  function saveAll(obj) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(obj)); } catch (e) { console.warn("SV save failed", e); }
  }
  // Multi-condition: store a LIST of centroids per phrase (one per enroll session/condition) and verify
  // against the BEST match — so adding a rep "from across the room" or "with background" extends coverage
  // instead of blurring one averaged centroid. Backward-compatible with the old single-centroid format.
  const SV_CENTROID_CAP = 6; // keep the most recent N conditions
  function loadCentroids(phrase) {
    const o = loadAll()[phrase];
    if (!o) return [];
    if (Array.isArray(o.centroids)) return o.centroids.map((c) => Float32Array.from(c)); // new multi format
    if (Array.isArray(o.centroid)) return [Float32Array.from(o.centroid)];               // old single format
    return [];
  }

  const SpeakerVerify = {
    ready: () => readyPromise,
    isLoaded: () => handle !== 0,
    threshold: DEFAULT_THRESHOLD,
    // AS-norm (score normalization): normalize the raw cosine against a crowd of other voices, so the
    // threshold stays stable when a room/mic drags scores down. SHADOW by default — we compute & expose the
    // z-score but still gate on raw cosine until znormThreshold is set from a real second-speaker test.
    useAsnorm: false,
    znormThreshold: 1.5,   // "at least N std above the crowd"; tune from genuine vs real-impostor z-scores
    cohortSize: () => cohort.length,
    embeddingDim: () => dim,

    /** Enroll the doctor for a phrase from N utterances → one condition-centroid. opts.append ADDS it as
     *  another condition (multi-condition); otherwise it replaces. Capped to the most recent SV_CENTROID_CAP. */
    enroll(phrase, utterances /* [{samples, sampleRate}] */, opts) {
      if (!handle) throw new Error("SpeakerVerify not ready");
      const embs = utterances.map(u => embed(u.samples, u.sampleRate));
      const c = new Float32Array(dim);
      for (const e of embs) for (let i = 0; i < dim; i++) c[i] += e[i];
      for (let i = 0; i < dim; i++) c[i] /= embs.length;
      l2normalize(c);
      const prev = (opts && opts.append) ? loadCentroids(phrase) : [];
      const centroids = prev.concat([c]).slice(-SV_CENTROID_CAP).map((v) => Array.from(v));
      const all = loadAll(); all[phrase] = { centroids }; saveAll(all);
      return { n: embs.length, conditions: centroids.length };
    },

    /** Verify a live utterance against the BEST of the phrase's condition-centroids. {score, pass, enrolled}. */
    verify(phrase, samples, sampleRate) {
      const cents = loadCentroids(phrase);
      if (!cents.length) return { score: 0, pass: false, enrolled: false };
      const live = embed(samples, sampleRate);
      let score = -1;
      for (const c of cents) { const s = cosine(live, c); if (s > score) score = s; }
      // AS-norm: z = how many std the raw score sits above the crowd's scores against this same live clip.
      // A weird room drags the crowd scores down too, so the offset cancels and z stays stable.
      let znorm = null;
      if (cohort.length) {
        let sum = 0, sum2 = 0;
        for (const cv of cohort) { const s = cosine(live, cv); sum += s; sum2 += s * s; }
        const m = cohort.length, mean = sum / m, std = Math.sqrt(Math.max(sum2 / m - mean * mean, 1e-9));
        znorm = (score - mean) / std;
      }
      const pass = (SpeakerVerify.useAsnorm && znorm !== null)
        ? (znorm >= SpeakerVerify.znormThreshold)
        : (score >= SpeakerVerify.threshold);
      return { score, znorm, pass, enrolled: true };
    },

    /** How many conditions are enrolled for a phrase (0 = none). */
    conditionCount: (phrase) => loadCentroids(phrase).length,

    // hasEnrollment(phrase) -> is that phrase enrolled; hasEnrollment() -> is anything enrolled.
    hasEnrollment: (phrase) => phrase ? !!loadAll()[phrase] : Object.keys(loadAll()).length > 0,
    enrolledPhrases: () => Object.keys(loadAll()),
    clearEnrollment: () => { try { localStorage.removeItem(LS_KEY); } catch (e) {} },
  };

  async function init() {
    try {
      // locateFile: the page is at "/" but the glue + .wasm/.data live in SV_DIR, so
      // tell emscripten exactly where to fetch them (otherwise it 404s and init hangs).
      window.Module = { locateFile: (path) => SV_DIR + "/" + path };
      const onRuntime = new Promise((res) => { window.Module.onRuntimeInitialized = res; });
      // order matters: config-marshaling helper, then the glue (which fires onRuntimeInitialized)
      await loadScript(SV_DIR + "/sherpa-onnx-speaker-diarization.js");
      await loadScript(SV_DIR + "/sherpa-onnx-wasm-main-speaker-diarization.js");
      await onRuntime;
      Module = window.Module;
      const cfg = initSherpaOnnxSpeakerEmbeddingExtractorConfig(
        { model: MODEL, numThreads: 1, debug: 0, provider: "cpu" }, Module);
      handle = Module._SherpaOnnxCreateSpeakerEmbeddingExtractor(cfg.ptr);
      Module._free(cfg.buffer); Module._free(cfg.ptr);
      if (!handle) throw new Error("CreateSpeakerEmbeddingExtractor returned null");
      dim = Module._SherpaOnnxSpeakerEmbeddingExtractorDim(handle);
      console.log("[SpeakerVerify] ready — embedding dim", dim);
      // Load the AS-norm cohort (other-voice embeddings, same model). Optional — gate works without it.
      try {
        const r = await fetch(SV_DIR + "/sv-cohort.json");
        if (r.ok) { cohort = (await r.json()).map((v) => Float32Array.from(v)); console.log("[SpeakerVerify] AS-norm cohort:", cohort.length); }
      } catch (e) { console.warn("[SpeakerVerify] cohort load failed (AS-norm off):", e); }
      readyResolve(SpeakerVerify);
    } catch (e) {
      console.error("[SpeakerVerify] init failed:", e);
      readyReject(e);
    }
  }

  window.SpeakerVerify = SpeakerVerify;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
