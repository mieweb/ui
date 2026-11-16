# Evals — SuperChat / chat / AI messages / media conversation

Primary agent: **MIE UI SuperChat Agent**. See [README.md](./README.md) for
format and scoring. The #609 done-when: the agent answers the golden
chat-integration questions — streaming wiring, media conversation,
stick-to-bottom behavior — without inventing API.

### SC-1 — Entry-point trap

- **Ask:** "`import { SuperChat } from '@mieweb/ui'` can't resolve — is the
  export missing?"
- **Expect:** SuperChat, SuperChatInbox and SuperChatConversations are
  subpath-only: `@mieweb/ui/components/SuperChat` (render plugins at
  `/components/SuperChat/plugins`). Telling the consumer to add a root
  export or patch the package FAILS.
- **Agent:** MIE UI SuperChat Agent
- **Source:** mieweb-ui-superchat skill — Entries; mieweb-ui-catalog SKILL.md entry table

### SC-2 — Invented-API trap

- **Ask:** "Where do I import the `useSuperChat` hook to manage the thread
  state?"
- **Expect:** No such hook exists (nor a `ChatThread` component). State is
  host-owned: pass `conversation`/`conversations` props and append to
  `thread[]` in app state. Inventing the hook FAILS.
- **Agent:** MIE UI SuperChat Agent
- **Source:** mieweb-ui-superchat skill — Which chat surface?; SuperChat/index.ts

### SC-3 — Surface selection stays with the orchestrator

- **Ask:** "Should my support tool use AIChat or SuperChatInbox?"
- **Expect:** Selection answer from the Design Agent: one user ↔ one
  assistant → `AIChat`; multiple participants or a conversation list →
  `SuperChatInbox`; human-to-human with receipts → Messaging primitives.
- **Agent:** MIE UI Design Agent (selection is the orchestrator's domain;
  the SuperChat Agent redirects it back)
- **Source:** mieweb-ui-catalog selection-guidance.md — Chat

### SC-4 — Host owns the data

- **Ask:** "What endpoint does SuperChatInbox poll for new messages?"
- **Expect:** None — it's a headless module; it never fetches, subscribes,
  or navigates. The host owns transport and pushes updated
  `conversations`/`thread` props; mutations come back out via
  promise-returning `on*` callbacks.
- **Agent:** MIE UI SuperChat Agent
- **Source:** lessons/wiring-headless-modules.md; mieweb-ui-superchat skill — wiring contract

### SC-5 — Return the promise

- **Ask:** "Sending a message shows no pending state, and failed sends
  don't roll back."
- **Expect:** Two parts: (1) return the promise from `onMessageSent` — it's
  the module's only failure signal, and SuperChat's restore path (failed
  draft text comes back) rides on it; (2) pending indicators, retry, and
  rolling back host-appended messages are the host's job — the module never
  promised them. Claiming the module provides pending/rollback UI FAILS.
- **Agent:** MIE UI SuperChat Agent
- **Source:** lessons/wiring-headless-modules.md — rule 1; SuperChat.tsx handleComposerSend

### SC-6 — Streaming wiring (SuperChat)

- **Ask:** "How do I show a stop button while my agent reply streams into
  SuperChat?"
- **Expect:** Set `isStreaming` while tokens arrive — the send button
  becomes a stop button — and supply `onStop` (required while streaming;
  `stopLabel` localizes it). Tokens themselves stream by updating the last
  `thread[]` message's text in host state.
- **Agent:** MIE UI SuperChat Agent
- **Source:** mieweb-ui-superchat skill — Streaming & scroll; SuperChat README

### SC-7 — Streaming wiring (AIChat)

- **Ask:** "Which prop streams tokens into AIChat?"
- **Expect:** There is no token prop — streaming is data: append an
  assistant message with `status: 'streaming'` and immutably update its
  text `content` block as tokens arrive (no top-level `text` field); flip
  to `'complete'` (or `'error'`) when done. Typing dots come from a
  `'streaming'` message with empty `content[]`; the separate `isGenerating`
  flag drives the header's Generating text and Stop button only with
  `showHeader` plus `onCancel`. Inventing `status: 'generating'` or a
  top-level text field FAILS.
- **Agent:** MIE UI SuperChat Agent
- **Source:** mieweb-ui-superchat skill — Streaming & scroll; selection-guidance.md — AIChat

### SC-8 — Stick-to-bottom behavior

- **Ask:** "While a reply streams, the page yanks users back to the bottom
  even when they've scrolled up to re-read."
- **Expect:** Don't force-scroll — that's `useStickToBottom`'s contract:
  auto-follow only while pinned within `threshold` of the bottom. Use
  `followIfPinned()` on content growth, `scrollToBottom` only on explicit
  action (`JumpToBottomButton`), `anchorToTurnStart` for the
  pin-reply-to-top pattern.
- **Agent:** MIE UI SuperChat Agent
- **Source:** src/hooks/useStickToBottom.ts; mieweb-ui-superchat skill — Streaming & scroll

### SC-9 — Jump button missing

- **Ask:** "With `order=\"desc\"` the jump-to-bottom button never appears —
  bug?"
- **Expect:** By design: `desc` pins newest to the top, so there's no
  bottom to jump to; the button (and bottom-follow) belong to the default
  `asc` order.
- **Agent:** MIE UI SuperChat Agent
- **Source:** mieweb-ui-superchat skill — Streaming & scroll; SuperChat README

### SC-10 — Markdown renders as plain text

- **Ask:** "My assistant's Markdown shows as literal asterisks in AIChat."
- **Expect:** Standalone AIChat/AIMessageDisplay render plain text until the
  host passes `renderTextContent` — wire `createMarkdownRenderer()` (from
  `@mieweb/ui/components/SuperChat`); code/math/mermaid/genui blocks are
  opt-in plugins from `/components/SuperChat/plugins` (math also needs the
  katex CSS). Note SuperChat itself already defaults to this renderer.
- **Agent:** MIE UI SuperChat Agent
- **Source:** mieweb-ui-superchat skill — Markdown & sanitization; SuperChat/plugins/index.ts

### SC-11 — Sanitization ownership

- **Ask:** "Can I set `trustedContent` to skip sanitization for speed? The
  messages come from our LLM."
- **Expect:** No — `trustedContent: true` is for host-authored content
  only, never model output. The `renderTextContent` seam owns sanitization
  (`createMarkdownRenderer` sanitizes by default); recommending it for LLM
  output FAILS.
- **Agent:** MIE UI SuperChat Agent
- **Source:** mieweb-ui-superchat skill — Markdown & sanitization; SuperChat README

### SC-12 — Attachment round-trip

- **Ask:** "Users attach a photo in the composer — how does it become part
  of the conversation?"
- **Expect:** The composer stages `ComposerAttachment`s
  (`{ id, name, type, dataUrl }`, gated by `acceptedFileTypes`) and hands
  them to `onMessageSent`'s meta; the **host** uploads and writes
  `SuperChatMediaAttachment` records (required `id`; `kind` limited to
  image/video/audio/youtube) into the message's `media[]` — there is no
  second media store. Attachment-only sends work by default — staged
  attachments count as content (`canSendWhenEmpty` is a
  standalone-ChatComposer prop, not a SuperChat one).
- **Agent:** MIE UI SuperChat Agent
- **Source:** mieweb-ui-superchat skill — Media in the conversation; SuperChat README

### SC-13 — Media view of the conversation

- **Ask:** "How do I show all the clips shared in a conversation as a
  browsable feed?"
- **Expect:** That's built in: the inbox's media view is a `MediaFeed` fed
  by `getConversationMediaItems(conversation)` — flattened from the same
  `thread[].media[]` data; inline previews (`MessageMedia`) switch to it
  via the open-media affordance. No separate media collection to maintain.
- **Agent:** MIE UI SuperChat Agent
- **Source:** src/components/SuperChat/media.ts; selection-guidance.md — MediaFeed

### SC-14 — Seconds vs milliseconds

- **Ask:** "My transcript highlight drifts way ahead of the audio."
- **Expect:** Clock-unit mismatch: `AudioPlayer` reports **seconds**;
  `TranscriptView` (and `MediaPlayer`/`MediaEditor`) speak
  **milliseconds**. Pair transcripts with `MediaPlayer`, or convert at the
  boundary.
- **Agent:** MIE UI SuperChat Agent
- **Source:** mieweb-ui-superchat skill — Media components; src/catalog/Media.mdx

### SC-15 — Recorder selection

- **Ask:** "I need voice input in my chat — AudioRecorder, RecordButton, or
  DictationButton?"
- **Expect:** Voice **typing** (editable text into the composer, no Blob) →
  `DictationButton`; one-tap capture returning an audio `Blob` →
  `RecordButton`; deliberate take with review/waveform → `AudioRecorder`;
  multi-speaker diarization → `VisitScribe`.
- **Agent:** MIE UI Design Agent (component selection is the orchestrator's
  domain — same split as SC-3; the SuperChat Agent owns wiring the chosen
  recorder)
- **Source:** mieweb-ui-superchat skill — Media components; src/catalog/Media.mdx

### SC-16 — Silent microphone

- **Ask:** "RecordButton does nothing when tapped on our staging site."
- **Expect:** Recorders need a secure context (HTTPS) plus mic permission.
  RecordButton/AudioRecorder surface denial only through
  `onError`/`onRecordingError` — wire those handlers and check the context
  before suspecting the component. (DictationButton additionally announces
  the error in its `role="status"` region.)
- **Agent:** MIE UI SuperChat Agent
- **Source:** mieweb-ui-superchat skill — Entries, deps, SSR / troubleshooting table

### SC-17 — Missing waveform

- **Ask:** "`AudioPlayer variant=\"waveform\"` renders no waveform and
  throws nothing."
- **Expect:** Optional peer `wavesurfer.js` (>=7) isn't installed — it's
  dynamically imported and absence logs a `console.error` instead of
  throwing. Install the peer (an Install-Agent-grade peer question, but the
  symptom diagnosis is this agent's).
- **Agent:** MIE UI SuperChat Agent
- **Source:** mieweb-ui-superchat skill — Entries, deps, SSR

### SC-18 — Screen readers and streams

- **Ask:** "Do streamed AI replies get announced to screen readers?"
- **Expect:** In SuperChat yes — the thread is `role="log"`. In
  AIChat **no** — its thread has no live region; the host wraps it in an
  `aria-live` container (or uses Messaging's `MessageList`). Claiming
  AIChat announces by default FAILS.
- **Agent:** MIE UI A11y Agent (cross-cutting a11y audits win the routing
  tie-break no matter the component; the component facts live in the
  superchat skill)
- **Source:** mieweb-ui-superchat skill — A11y & i18n posture; agent/agents/mieweb-ui-design.agent.md — tie-breakers

### SC-19 — Inbox is not a collection view

- **Ask:** "Can I pass my `ViewAccessors` adapter and `items` to
  SuperChatInbox so it matches our ViewSet wiring?"
- **Expect:** No — the inbox has its own contract (`conversations`,
  `currentParticipantId`, `onMessageSent`, …); `items`/accessors belong to
  the views family. ViewSet wiring itself is the Views Agent's domain.
- **Agent:** MIE UI SuperChat Agent
- **Source:** mieweb-ui-superchat skill — data contract; agent/agents/mieweb-ui-superchat.agent.md — Redirects

### SC-20 — Prose styles dead

- **Ask:** "Rendered Markdown in SuperChat has no typography — headings and
  lists look unstyled."
- **Expect:** The `@tailwindcss/typography` peer is missing, so `prose`
  classes compile to nothing. Peer/CSS plumbing is the Install Agent's
  seat; the SuperChat Agent names the cause and redirects the setup fix.
- **Agent:** MIE UI Install Agent (via the SuperChat Agent's redirect)
- **Source:** mieweb-ui-superchat skill — Entries, deps, SSR; mieweb-ui-tailwind4 skill
