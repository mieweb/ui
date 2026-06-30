/**
 * On-device speaker-verification gate (the "only the enrolled doctor can wake it" layer).
 *
 * Loads the custom single-threaded sherpa-onnx WASM build (in /sv-wasm/) that exports the
 * SpeakerEmbeddingExtractor C-API, runs TitaNet speaker embeddings fully in-browser, and
 * verifies a live utterance against enrolled per-voice centroids stored in IndexedDB (db `ozwell-voice`,
 * migrated from the old localStorage format on first read).
 *
 * Proven in the /sv-wasm/ spike: a ~1s "hey ozwell" gives genuine cosine ~0.66 / impostor
 * ~0.30 (enroll-centroid: ~0.75 vs ~0.22, EER ~1.3%). This is a DIFFERENT axis from the
 * content voiceprint in hey-buddy.js: that BOOSTS the doctor's accented phrase (recall);
 * this BLOCKS a non-doctor's clean phrase (act/no-act). They compose.
 *
 * Loaded via dynamic import by the `useSpeakerVerify` hook (NOT a classic <script>). Exposes window.SpeakerVerify.
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
  // --- WHO-centroid persistence on IndexedDB (replaces localStorage; same db/store as voiceprintStore.ts).
  // verify()/enroll() read these synchronously, so we keep an in-memory `_store` hydrated from IndexedDB on
  // init (before ready() resolves) and write through on save. ---
  const IDB_DB = "ozwell-voice", IDB_STORE = "voiceprints";
  function idbOpen() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(IDB_DB, 1);
      req.onupgradeneeded = () => { if (!req.result.objectStoreNames.contains(IDB_STORE)) req.result.createObjectStore(IDB_STORE); };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  function idbReq(mode, run) {
    return idbOpen().then((db) => new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, mode);
      const r = run(tx.objectStore(IDB_STORE));
      tx.oncomplete = () => { resolve(r && r.result); db.close(); };
      tx.onerror = () => { reject(tx.error); db.close(); };
    }));
  }
  const idbGet = (key) => idbReq("readonly", (s) => s.get(key));
  const idbPut = (key, v) => idbReq("readwrite", (s) => s.put(v, key));
  const idbDel = (key) => idbReq("readwrite", (s) => s.delete(key));

  let _store = null; // in-memory WHO map; hydrated from IndexedDB before ready() resolves
  // Ignore the old single-centroid format ({centroid, n}) from earlier builds.
  const normalizeWho = (o) => (o && Array.isArray(o.centroid)) ? {} : (o || {});

  async function hydrateStore() {
    try {
      let v = await idbGet(LS_KEY);
      if (v === undefined) { // nothing in IndexedDB — migrate a legacy localStorage value once, then drop it
        let raw = null; try { raw = localStorage.getItem(LS_KEY); } catch (e) { /* ignore */ }
        if (raw != null) {
          v = normalizeWho(JSON.parse(raw || "{}"));
          await idbPut(LS_KEY, v);
          try { localStorage.removeItem(LS_KEY); } catch (e) { /* ignore */ }
        }
      }
      _store = v || {};
    } catch (e) { _store = _store || {}; }
  }
  function loadAll() {
    if (_store) return _store;
    // Pre-hydration fallback (verify/enroll only run after ready(), which awaits hydrateStore).
    try { return normalizeWho(JSON.parse(localStorage.getItem(LS_KEY) || "{}")); } catch (e) { return {}; }
  }
  function saveAll(obj) {
    _store = obj;
    idbPut(LS_KEY, obj).catch((e) => console.warn("SV save failed", e));
  }
  // Multi-VOICE, multi-condition: each phrase stores a map of voices, each with a LIST of condition
  // centroids. Verify passes if ANY voice's ANY condition matches (so the doctor AND an enrolled
  // assistant both wake it; adding "across the room"/"with background" extends a voice's coverage).
  // Backward-compatible: legacy flat shapes ({centroids} / {centroid}) normalize to a default "You" voice.
  const SV_CENTROID_CAP = 6;     // keep the most recent N conditions per voice
  const DEFAULT_VOICE_ID = "you";
  // Normalize any legacy per-phrase entry into { voices: { [id]: { label, createdAt, centroids:number[][] } } }.
  function normPhrase(o) {
    if (!o) return { voices: {} };
    if (o.voices) return o;                                                            // already voice-keyed
    if (Array.isArray(o.centroids)) return { voices: { [DEFAULT_VOICE_ID]: { label: "You", createdAt: 0, centroids: o.centroids } } };
    if (Array.isArray(o.centroid))  return { voices: { [DEFAULT_VOICE_ID]: { label: "You", createdAt: 0, centroids: [o.centroid] } } };
    return { voices: {} };
  }
  // Flat list of EVERY enrolled voice's centroids for a phrase (verify passes if any matches).
  function allCentroids(phrase) {
    const voices = normPhrase(loadAll()[phrase]).voices;
    const out = [];
    for (const id in voices) for (const c of (voices[id].centroids || [])) out.push(Float32Array.from(c));
    return out;
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

    /** Enroll a VOICE for a phrase from N utterances → one condition-centroid under opts.voiceId
     *  (default "you"). opts.append ADDS it as another condition for that voice; otherwise it replaces
     *  that voice's conditions. opts.label names the voice. Capped to the most recent SV_CENTROID_CAP. */
    enroll(phrase, utterances /* [{samples, sampleRate}] */, opts) {
      if (!handle) throw new Error("SpeakerVerify not ready");
      const voiceId = (opts && opts.voiceId) || DEFAULT_VOICE_ID;
      const embs = utterances.map(u => embed(u.samples, u.sampleRate));
      const c = new Float32Array(dim);
      for (const e of embs) for (let i = 0; i < dim; i++) c[i] += e[i];
      for (let i = 0; i < dim; i++) c[i] /= embs.length;
      l2normalize(c);
      const all = loadAll();
      const entry = normPhrase(all[phrase]);
      const prevVoice = entry.voices[voiceId];
      const prev = (opts && opts.append && prevVoice && Array.isArray(prevVoice.centroids))
        ? prevVoice.centroids.map((x) => Float32Array.from(x)) : [];
      const centroids = prev.concat([c]).slice(-SV_CENTROID_CAP).map((v) => Array.from(v));
      entry.voices[voiceId] = {
        // keep the existing label when appending; otherwise use the provided one (or a sensible default)
        label: (prevVoice && opts && opts.append) ? prevVoice.label : ((opts && opts.label) || (voiceId === DEFAULT_VOICE_ID ? "You" : "Voice")),
        createdAt: (prevVoice && prevVoice.createdAt) || Date.now(),
        centroids,
      };
      all[phrase] = entry; saveAll(all);
      return { n: embs.length, conditions: centroids.length, voiceId };
    },

    /** Verify a live utterance against the BEST condition-centroid across ALL enrolled voices. */
    verify(phrase, samples, sampleRate) {
      const cents = allCentroids(phrase);
      if (!cents.length) return { score: 0, znorm: null, pass: false, enrolled: false };
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

    /** How many conditions are enrolled for a phrase, across ALL voices (0 = none). */
    conditionCount: (phrase) => allCentroids(phrase).length,

    /** List enrolled voices aggregated across phrases: [{ id, label, createdAt, conditions }]. */
    listVoices() {
      const all = loadAll();
      const acc = {};
      for (const phrase in all) {
        const voices = normPhrase(all[phrase]).voices;
        for (const id in voices) {
          const v = voices[id];
          const conds = (v.centroids || []).length;
          if (!acc[id]) acc[id] = { id, label: v.label || id, createdAt: v.createdAt || 0, conditions: conds };
          else {
            acc[id].conditions = Math.max(acc[id].conditions, conds);
            if (v.label) acc[id].label = v.label;
            if (v.createdAt && (!acc[id].createdAt || v.createdAt < acc[id].createdAt)) acc[id].createdAt = v.createdAt;
          }
        }
      }
      return Object.keys(acc).map((k) => acc[k]).sort((a, b) => a.createdAt - b.createdAt);
    },

    /** Remove a voice across all phrases — revokes that person's WHO match (the WHAT phrase-prints,
     *  which are shared/speaker-independent, are left in voiceprintStore). */
    removeVoice(voiceId) {
      const all = loadAll();
      let changed = false;
      for (const phrase in all) {
        const entry = normPhrase(all[phrase]);
        if (entry.voices[voiceId]) { delete entry.voices[voiceId]; all[phrase] = entry; changed = true; }
      }
      if (changed) saveAll(all);
    },

    /** Rename a voice across all phrases. */
    renameVoice(voiceId, label) {
      const all = loadAll();
      let changed = false;
      for (const phrase in all) {
        const entry = normPhrase(all[phrase]);
        if (entry.voices[voiceId]) { entry.voices[voiceId].label = label; all[phrase] = entry; changed = true; }
      }
      if (changed) saveAll(all);
    },

    // hasEnrollment(phrase) -> is that phrase enrolled; hasEnrollment() -> is anything enrolled.
    hasEnrollment: (phrase) => phrase ? allCentroids(phrase).length > 0 : Object.keys(loadAll()).some((p) => allCentroids(p).length > 0),
    enrolledPhrases: () => Object.keys(loadAll()),
    clearEnrollment: () => { _store = {}; idbDel(LS_KEY).catch(() => {}); try { localStorage.removeItem(LS_KEY); } catch (e) { /* ignore */ } },
  };

  async function init() {
    // Save the existing Emscripten global so we can restore it — don't permanently clobber window.Module
    // for any other emscripten bundle the host loads.
    const prevModule = window.Module;
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
      window.Module = prevModule; // restore the global; we keep our own ref in `Module`
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
      await hydrateStore(); // load enrolled WHO centroids from IndexedDB before reporting ready
      readyResolve(SpeakerVerify);
    } catch (e) {
      window.Module = prevModule; // restore the global even on failure
      console.error("[SpeakerVerify] init failed:", e);
      readyReject(e);
    }
  }

  window.SpeakerVerify = SpeakerVerify;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
