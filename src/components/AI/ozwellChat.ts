/**
 * Ozwell chat backend — the real call that replaces the demo stub.
 *
 * Mirrors the ozwellai-api TypeScript SDK (clients/typescript/src/index.ts) with plain `fetch`,
 * so there's no SDK dependency to install: OpenAI-compatible POST /v1/chat/completions, Bearer auth,
 * `messages` array in / `choices[0].message.content` (or streamed `delta.content`) out.
 *
 * KEY HANDLING (deliberate): the API key is NEVER hardcoded or committed. It's read at runtime from
 *   - `window.__ozwell` (e.g. `window.__ozwell = { apiKey: 'sk-...' }` in the console), or
 *   - `localStorage['ozwellConfig']` (JSON, survives reloads).
 * If no key is configured, `isOzwellConfigured()` is false and the chat falls back to its canned reply —
 * so this file is always safe to push and the demo still works keyless. For a PUBLIC deploy the key
 * should live server-side behind a proxy (a browser-direct Bearer key is visible to anyone with the page);
 * point `baseURL` at that proxy then. See AI/MODEL-HOSTING.md / the hosted-demo plan.
 */

export interface OzwellMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OzwellConfig {
  /** API base. Defaults to https://api.ozwell.ai (or http://localhost:11434 when apiKey === 'ollama'). */
  baseURL: string;
  /** Bearer key. Empty = not configured → callers fall back to the stub. */
  apiKey: string;
  /** Model id. */
  model: string;
  /** System prompt prepended to the conversation (omit by setting to ''). */
  system: string;
  /** Sampling temperature. */
  temperature: number;
}

const DEFAULT_BASE = 'https://api.ozwell.ai';
const OLLAMA_BASE = 'http://localhost:11434';
const DEFAULTS = {
  model: 'gpt-4o-mini',
  system: 'You are Ozwell, a concise and helpful clinical assistant. Answer briefly and clearly.',
  temperature: 0.7,
};

function readRaw(): Partial<OzwellConfig> {
  let stored: Partial<OzwellConfig> = {};
  try { stored = JSON.parse(localStorage.getItem('ozwellConfig') || '{}'); } catch { /* ignore bad JSON */ }
  const win = ((window as unknown as { __ozwell?: Partial<OzwellConfig> }).__ozwell) || {};
  return { ...stored, ...win }; // window override wins over localStorage
}

/** Resolve the effective config from runtime sources + defaults. */
export function getOzwellConfig(): OzwellConfig {
  const c = readRaw();
  const apiKey = c.apiKey || '';
  const baseURL = c.baseURL || (apiKey === 'ollama' ? OLLAMA_BASE : DEFAULT_BASE);
  return {
    baseURL,
    apiKey,
    model: c.model || DEFAULTS.model,
    system: c.system ?? DEFAULTS.system,
    temperature: c.temperature ?? DEFAULTS.temperature,
  };
}

/** True once a key is configured — gate the real call on this; otherwise keep the stub reply. */
export function isOzwellConfigured(): boolean {
  return !!getOzwellConfig().apiKey;
}

/** Map AIChat's message blocks to the API's role/content shape (user+assistant text only) for multi-turn. */
export function toOzwellMessages(
  msgs: { role: string; content: { type?: string; text?: string }[] }[],
): OzwellMessage[] {
  const out: OzwellMessage[] = [];
  for (const m of msgs) {
    if (m.role !== 'user' && m.role !== 'assistant') continue;
    const text = (m.content || []).map((c) => c.text || '').join(' ').trim();
    if (text) out.push({ role: m.role, content: text });
  }
  return out;
}

function withSystem(messages: OzwellMessage[], system: string): OzwellMessage[] {
  if (!system || messages.some((m) => m.role === 'system')) return messages;
  return [{ role: 'system', content: system }, ...messages];
}

function buildRequest(messages: OzwellMessage[] | string, cfg: OzwellConfig, stream: boolean) {
  const msgs = typeof messages === 'string' ? [{ role: 'user' as const, content: messages }] : messages;
  return {
    url: `${cfg.baseURL.replace(/\/$/, '')}/v1/chat/completions`,
    headers: {
      'Content-Type': 'application/json',
      ...(cfg.apiKey ? { Authorization: `Bearer ${cfg.apiKey}` } : {}),
    } as Record<string, string>,
    body: JSON.stringify({
      model: cfg.model,
      messages: withSystem(msgs, cfg.system),
      temperature: cfg.temperature,
      stream,
    }),
  };
}

export interface AskOpts extends Partial<OzwellConfig> {
  signal?: AbortSignal;
}

/** One-shot (non-streaming) completion → the answer text. Throws on HTTP error. */
export async function askOzwell(messages: OzwellMessage[] | string, opts: AskOpts = {}): Promise<string> {
  const cfg = { ...getOzwellConfig(), ...opts };
  const req = buildRequest(messages, cfg, false);
  const res = await fetch(req.url, { method: 'POST', headers: req.headers, body: req.body, signal: opts.signal });
  if (!res.ok) throw new Error(`Ozwell API ${res.status}: ${res.statusText}`);
  const data = await res.json();
  return (data?.choices?.[0]?.message?.content ?? '').trim();
}

/**
 * Streaming completion (SSE). Calls `onToken(delta, full)` as text arrives and resolves with the full text.
 * Token-by-token is the natural fit for a spoken/hands-free reply. Throws on HTTP error.
 */
export async function askOzwellStream(
  messages: OzwellMessage[] | string,
  onToken: (delta: string, full: string) => void,
  opts: AskOpts = {},
): Promise<string> {
  const cfg = { ...getOzwellConfig(), ...opts };
  const req = buildRequest(messages, cfg, true);
  const res = await fetch(req.url, { method: 'POST', headers: req.headers, body: req.body, signal: opts.signal });
  if (!res.ok || !res.body) throw new Error(`Ozwell API ${res.status}: ${res.statusText}`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  let full = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const events = buf.split('\n\n'); // SSE events are separated by a blank line
    buf = events.pop() || ''; // keep the trailing partial event for the next chunk
    for (const ev of events) {
      for (const line of ev.split('\n')) {
        if (!line.startsWith('data:')) continue;
        const payload = line.slice(5).trim();
        if (payload === '[DONE]') return full;
        try {
          const json = JSON.parse(payload);
          const delta: string = json?.choices?.[0]?.delta?.content || '';
          if (delta) { full += delta; onToken(delta, full); }
        } catch { /* keep-alive / partial line — ignore */ }
      }
    }
  }
  return full;
}
