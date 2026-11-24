---
name: mieweb-ui-superchat
description: Chat, AI and media-conversation components of @mieweb/ui — SuperChat/SuperChatInbox/SuperChatConversations, AIChat/OzwellChat/AIMessage/MCPToolCall, ChatComposer, Messaging primitives, and the media stack (AudioPlayer, MediaPlayer, MediaFeed, TranscriptView, MediaEditor, AudioRecorder, RecordButton, DictationButton, DocumentScanner). Headless wiring, streaming, stick-to-bottom, attachments, markdown/sanitization, recording. USE WHEN wiring a chat surface to app data, streaming AI replies, debugging scroll/attachment/recording behavior, or deciding which chat or media component fits.
---

# @mieweb/ui chat, AI & media conversation

Sourced from `src/components/SuperChat/README.md`, `src/catalog/Chat.mdx` /
`Media.mdx`, `lessons/wiring-headless-modules.md`, and component source.
Verify props against the installed `.d.ts` — never invent.

## Which chat surface?

- **AIChat** — one user ↔ one assistant; you own transport and push
  `AIMessage[]` of `content[]` blocks with `status`
  (`pending`/`streaming`/`complete`/`error`) and flip the separate
  `isGenerating` busy flag. `FloatingAIChat`/`AIChatModal` for a corner popup.
- **OzwellChat** — the Ozwell-branded shell around AIChat (thinking-mode
  menu, warning strip, model picker, footer). Generic assistants use AIChat.
- **SuperChat / SuperChatInbox** — multi-participant (humans + agents) chat;
  `SuperChat` is one conversation's panel, `SuperChatConversations` the
  sidebar list, `SuperChatInbox` the combined surface owning selection and
  the thread⇄media view switch.
- **Messaging primitives** — human-to-human with delivery status and read
  receipts: `MessageBubble`, `MessageList` (live `role="log"`),
  `MessageThread`, `MessagingSplitView`. The legacy `MessageComposer` was
  retired in 0.10.0 — `ChatComposer` is the standardized input for new work.
- **ChatComposer** — the input alone: auto-growing textarea, quiet icon
  toolbar, optional agent/model selectors, `@mention` autocomplete
  (non-empty `mentionOptions` enables it), reply-to preview, attachments.
- **There is no `useSuperChat` hook or `ChatThread` component.** The
  surfaces above are the API; scroll behavior is the separate
  `useStickToBottom` hook.

## Entries, deps, SSR

- **SuperChat is a subpath, not a root export:**
  `@mieweb/ui/components/SuperChat` (SuperChat, SuperChatInbox,
  SuperChatConversations, `createMarkdownRenderer`,
  `getConversationMediaItems`, all types). Rich render plugins are a second
  opt-in subpath `@mieweb/ui/components/SuperChat/plugins` (code, math,
  mermaid, genui, image, NITRO-table, attachment). Mermaid and the NITRO
  grid lazy-load their heavy implementations; the code and math plugins
  import `rehype-highlight` / `remark-math` + `rehype-katex` **eagerly** —
  a missing peer fails when the plugins entry loads, before any block
  renders (math also needs `katex/dist/katex.min.css`).
- Everything else here — AIChat/OzwellChat/AIMessage/MCPToolCall,
  ChatComposer, Messaging, all media components, `useStickToBottom`,
  `JumpToBottomButton` — exports from the **main** entry.
- SuperChat prose rendering needs the `@tailwindcss/typography` peer or
  `prose` classes do nothing.
- `AudioPlayer variant="waveform"` and `AudioRecorder showWaveform` (default
  true) dynamically import optional peer `wavesurfer.js` (>=7). AudioPlayer
  catches the missing peer and logs a `console.error`; AudioRecorder's
  import is uncaught — absence surfaces as an unhandled promise rejection.
- Recorders (`AudioRecorder`, `RecordButton`, `DictationButton`) need a
  secure context + microphone permission. `AudioRecorder`/`RecordButton`
  surface denial only through `onError`/`onRecordingError`;
  `DictationButton` also announces localized status/errors through an
  always-mounted `role="status"` region (visually hidden when `showStatus`
  is false) and updates its accessible label. All of this is client-only —
  keep it behind a client boundary.
- `DictationButton` transcribes on-device (Whisper) by default or via a host
  `transcribe` provider, and returns **text only** — it never hands you the
  audio `Blob` (that's `RecordButton`/`AudioRecorder`). The default provider
  keeps the audio local but **downloads** the transformers.js runtime and
  Whisper model assets on first use (large, browser-cached) — offline or
  strict-CSP hosts must provision those assets or supply `transcribe`.

## The headless wiring contract

The host owns state, fetching, subscriptions, and navigation; the components
never put conversation data on the network (the one asset exception is
DictationButton's default Whisper download, above). Three rules carry the
whole lesson:

1. **Return the promise from `on*` callbacks** (`void | Promise<void>`) —
   it's the only failure signal the module gets. Scope the expectation to
   each callback's real behavior: SuperChat awaits `onMessageSent` and, on
   rejection, restores the user's draft text (attachments are not
   restaged); pending indicators, retry, and rolling back host-appended
   messages are the **host's** job. Standalone `ChatComposer` leaves
   pending/restore to the host entirely.
2. **Pass `onOpen` and `getHref` together** where offered: `getHref` keeps
   rows real anchors (middle-click, copy-link), `onOpen` intercepts
   left-click for client routing. `onOpen` alone degrades rows to buttons.
3. **Keep adapters/accessors stable** — module scope or `useMemo`;
   re-created functions make lists regroup every render.

### SuperChat's data contract

In: `conversation: SuperChatConversation` — `id`, `title`,
`participants[]` (`kind: 'human' | 'agent' | 'system'`, accent `color`),
append-only `thread[]` of `SuperChatMessage` (`participantId`, `text`,
optional AI `content[]` blocks, optional `media[]` attachments, `time`,
`status`). Out: `onMessageSent(text, { conversation, mentions, attachments })`
(promise-returning — host appends the message), `onMessageEdited`,
`onConversationClosed`, `onAgentChange`, `onReferenceClick`.
`SuperChatInbox` adds host-owned `conversations[]` with
controlled/uncontrolled `activeConversationId`. **Never hand the inbox
collection-view props** (`items`/`accessors` belong to the views family).

## Streaming & scroll

- SuperChat: `isStreaming` turns send into stop; `onStop` is required while
  it's true; `stopLabel` localizes it. AIChat/OzwellChat: stream by
  appending an assistant message with `status: 'streaming'` and immutably
  updating its text `content` block as tokens arrive (there is no top-level
  `text` field); flip to `'complete'`/`'error'` when done. Typing dots
  render for a `'streaming'` message whose `content[]` is still empty. The
  separate `isGenerating` flag drives the header's "Generating…" text and
  Stop button — and only when `showHeader` is on and `onCancel` is wired
  (OzwellChat renders that header off and exposes no generation cancel).
- **`useStickToBottom`** (main entry) is the scroll engine the chat surfaces
  share: `containerRef` + `contentRef`, `isAtBottom`, `scrollToBottom`,
  `followIfPinned()` (follow only if pinned; returns whether it did),
  `stopFollowing()`, and `anchorToTurnStart(target)` for the ChatGPT-style
  "pin new reply to viewport top and stop following" UX. Content growth
  auto-scrolls only while the user is within `threshold` px of the bottom;
  `JumpToBottomButton` is the matching affordance.
- Thread `order`: `'asc'` (default) pins to the bottom and auto-follows;
  `'desc'` pins newest to the top **and drops the jump-to-bottom button** —
  don't report that as a bug.

## Markdown & sanitization

- **The `renderTextContent` seam owns rendering — but the defaults differ.**
  SuperChat defaults it to `createMarkdownRenderer` (sanitizing unless
  `trustedContent`), so Markdown works out of the box there; plugins opt in
  via the plugins subpath. Standalone AIChat/AIMessageDisplay render plain
  text until the host passes a renderer — and a host-supplied renderer owns
  its own sanitization.
- SuperChat `trustedContent: true` skips sanitization — host-authored
  content only, never model output.

## Media in the conversation

- Attachments live **on the message**: `SuperChatMessage.media[]`
  (`SuperChatMediaAttachment`: a **required host-assigned `id`** plus the
  `MediaFeedMedia` fields — `kind: 'image' | 'video' | 'audio' | 'youtube'`,
  `src`, `poster`, `alt` — and optional `title`/`caption`; there is no
  `file` kind — generic files need the host's own rendering path). The
  thread previews them inline (`MessageMedia`); "Play/Open" switches the
  inbox to its media view, which is a `MediaFeed` fed by
  `getConversationMediaItems(conversation)` — same message data, no second
  store.
- Composer side: `acceptedFileTypes` (default `['image', 'video', 'audio',
  'pdf']`) stages `ComposerAttachment`s (`{ id, name, type, dataUrl }`)
  handed to `onMessageSent`'s meta; the host uploads and writes the
  `media[]` records back into conversation state. Attachment-only sends
  work by default — staged attachments count as content; `canSendWhenEmpty`
  is a standalone-`ChatComposer` prop for sending with *nothing* staged and
  is not exposed by SuperChat/SuperChatInbox.

## Media components — mind the clock units

- **`AudioPlayer` speaks seconds; `MediaPlayer`, `TranscriptView` and
  `MediaEditor` speak milliseconds.** Pair transcript components with
  `MediaPlayer`, not `AudioPlayer`.
- `MediaPlayer` — native `<audio>`/`<video>` only (`kind: 'video' | 'audio'`),
  browser or touch-first overlay controls, localized `labels`; YouTube
  resources belong to `MediaFeed`'s embed renderer, not MediaPlayer.
  `AudioPlayer` — one
  styled clip (`inline`/`compact`/`waveform`); pass `preload={false}` in
  lists. `MediaFeed` — host-owned collection, one active player, immersive
  viewer; controlled `playbackRequest` drives playback from outside.
- `TranscriptView` — read-only, highlights `currentTimeMs`, reports
  `onSeek(ms)`. `MediaEditor` — word-timestamped editing (delete/cut/paste,
  silence split, filler removal) with an embedded MediaPlayer; word-level
  timestamps are the host's to supply.
- Recorder picker: deliberate take with review → `AudioRecorder`; one mic
  button returning a `Blob` → `RecordButton`; voice **typing** returning
  editable text → `DictationButton`; several speakers with diarization →
  `VisitScribe`. Camera/file capture with AI extraction → `DocumentScanner`
  (`onScan(files)`, `onResult(data)`).
- `MediaRecorder` mimeTypes differ per browser (`audio/webm` vs Safari's
  `audio/mp4`); on fallback the `Blob` may still carry the requested label.

## A11y & i18n posture

- SuperChat's thread is `role="log"` (announced); **AIChat's thread has no
  live region** — streamed replies are silent to screen readers unless the
  host wraps the thread in `aria-live` (or uses Messaging's `MessageList`).
- Many chat/media strings are hard-coded English unless overridden — pass
  the `labels` props everywhere they exist and treat gaps as i18n findings.
- `MediaEditor` uses physical CSS (not RTL-safe) and right-click-only speed
  markers; `TranscriptView` word mode puts a tab stop on every word. Flag,
  don't re-implement.

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| `SuperChat` import fails from the root | It's subpath-only: `@mieweb/ui/components/SuperChat` |
| Failed send silently loses the draft | `onMessageSent` swallowed its promise — return it so SuperChat's restore path fires; pending/retry UI is host-owned |
| Streamed reply doesn't follow / page jumps while reading | `useStickToBottom` contract: follows only when pinned near bottom; use `followIfPinned`/`anchorToTurnStart`, don't force-scroll |
| No jump-to-bottom button | `order="desc"` — by design |
| Markdown renders as plain text in AIChat/AIMessageDisplay | No renderer wired — pass `renderTextContent` (`createMarkdownRenderer`); SuperChat already defaults to it |
| Code/math blocks dead | Plugin not registered, or katex CSS missing |
| Waveform never renders | Optional peer `wavesurfer.js` missing — AudioPlayer logs a console.error; AudioRecorder leaves an unhandled rejection |
| Transcript highlight drifts | Seconds vs milliseconds mismatch — `AudioPlayer` is the odd one out |
| Mic silently does nothing | Insecure context or permission denied — AudioRecorder/RecordButton report it only via `onError`/`onRecordingError`; DictationButton also announces it in its `role="status"` region |
| Screen reader silent during AI replies | AIChat thread has no `aria-live` — host wraps it |
