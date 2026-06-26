# Ozwell backend wiring — the chat's real answers

The voice/chat stories used to fake the assistant reply (`setTimeout(… "Heard: …")`).
They now call the real **ozwellai-api** when a key is configured, and fall back to that
canned reply when it isn't — so the demo always works, and no secret is ever committed.

## What was wired

- **`ozwellChat.ts`** — framework-agnostic helper (plain `fetch`, no SDK dep). Mirrors the
  ozwellai-api TypeScript SDK: OpenAI-compatible `POST /v1/chat/completions`, `Bearer` auth,
  `messages` in → `choices[0].message.content` (or streamed `delta.content`) out.
  - `askOzwell(messages | text)` — one-shot.
  - `askOzwellStream(messages | text, onToken)` — SSE, token-by-token (used by the stories;
    natural fit for a spoken reply).
  - `isOzwellConfigured()` — true once a key is present; the stories gate the real call on it.
  - `toOzwellMessages(aiMessages)` — maps AIChat history → API messages (multi-turn, not single-shot).
- **`AIChatVoice.stories.tsx`** and **`HandsFreeChat.stories.tsx`** — the two stub sites now
  stream the real reply into one assistant message (`status: 'streaming'` → `'complete'`),
  showing the `isGenerating` indicator. No key → unchanged canned reply.

The shipped `AIChat` component is untouched — this all lives in the demo/story layer and the
new helper, exactly the seam a real host would wire to its own backend.

## Configure the key (never hardcoded, never committed)

Read at runtime from either source (the browser console is easiest for local testing):

```js
// RECOMMENDED in Storybook — survives reloads AND is shared across the story iframe:
localStorage.setItem('ozwellConfig', JSON.stringify({ apiKey: 'YOUR_KEY' }));

// also works (the loader checks current → parent → top frame):
window.__ozwell = { apiKey: 'YOUR_KEY' };
```

> Storybook renders each story inside an **iframe**. A console-set `window.__ozwell` lands on the
> parent page, not the story's frame — the loader now checks parent/top to cope, but the
> **localStorage form is the reliable one** because localStorage is shared across same-origin frames.
> Reload the tab after setting it.

Optional overrides in the same object: `baseURL`, `model` (default `gpt-4o-mini`), `system`,
`temperature`. Convenience: `apiKey: 'ollama'` points `baseURL` at `http://localhost:11434`.

## ⚠️ Public deploy = proxy the key

A browser-direct `Bearer` key is visible to anyone with the page. For the local demo / your own
Mac that's fine (you set it in the console). For a **public hosted demo**, stand up a small proxy
that holds the key server-side and point `baseURL` at it — do **not** ship the key in the bundle.
(Deferred with the hosted-demo work; the reference server reads the key from `LLM_API_KEY`.)
