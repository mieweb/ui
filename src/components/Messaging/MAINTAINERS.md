# Messaging — Maintainer Notes

Short notes on the invariants that are easy to break. User-facing docs live in
[Messaging.stories.tsx](./Messaging.stories.tsx).

## MessageThread mounts ChatComposer

[MessageThread.tsx](./MessageThread.tsx) mounts the shared `ChatComposer`
(`../ChatComposer/ChatComposer.tsx`) — the legacy `MessageComposer` was
retired in 0.10.0 (now in `.attic/MessageComposer/`; consumer guide in
`MIGRATION.md#chat-composer`) — while keeping
MessageThread's public props unchanged:

- **Failed-send restore is host-side.** ChatComposer clears the draft
  optimistically; MessageThread controls `value`/`onValueChange` and restores
  the text when `eventHandlers.onSendMessage` rejects, epoch-guarded so a
  stale failure never clobbers newer typed input (same pattern as SuperChat
  and AIChat). The send handler **rethrows** so ChatComposer reports
  `'Failed to send message'` through `onError` — don't swallow the error.
- **Typing callbacks are emulated** via `useTypingEmulation` in
  [hooks.ts](./hooks.ts) — the state machine extracted from the retired
  MessageComposer
  (start on non-empty draft, stop after 2s idle, keepalive loop, stop on
  send). `AIChat` uses the same hook; run both suites when touching it.
- **Attachment validation defaults** (`DEFAULT_ACCEPTED_FILE_TYPES`,
  `DEFAULT_MAX_FILE_SIZE` in [AttachmentPicker.tsx](./AttachmentPicker.tsx))
  are applied by MessageThread because ChatComposer leaves types/size
  unrestricted.
- `showCameraButton` renders `CameraButton` in ChatComposer's `micSlot`;
  captures route through the composer's imperative `addFiles`, which
  deliberately bypasses `allowAttachments` — camera staging works even with
  `showAttachmentPicker={false}`. Files dropped on the message list also
  route through `addFiles`, but the list-level `DragDropZone` is gated on
  `showAttachmentPicker`. Validation and error reporting happen once, in
  `addFiles`.
- Suite: [MessageThread.test.tsx](./MessageThread.test.tsx).

## Shared @mention module

[useMentionAutocomplete.tsx](./useMentionAutocomplete.tsx) is the single
implementation of `@mention` autocomplete, consumed by `ChatComposer`. It was
extracted **verbatim** from the retired `MessageComposer` (now in
`.attic/MessageComposer/`).

- **Run all affected suites** when touching it: `ChatComposer` has its own
  `@mentions` describe block in `ChatComposer.test.tsx` plus consumer coverage
  in `SuperChat.test.tsx` and `AIChat.test.tsx`.
- `useMentionAutocomplete().handleKeyDown(event)` returns `true` when it
  consumed the key — callers **must** check it before their own Enter-to-send
  handling. Each composer also runs host key handlers first (preventDefault
  claims the event); see
  [ChatComposer/MAINTAINERS.md](../ChatComposer/MAINTAINERS.md) for its exact
  ordering.
- Insertion is `option.value ?? option.label.split(' ')[0]`, written as
  `@X ` (trailing space), with the caret restored in a `requestAnimationFrame`
  because the value update re-renders the textarea.
- `MentionOption.id` is only the React key / `aria-activedescendant` identity.
  There is **no** selection callback — hosts that need structured mention data
  detect it from the sent text (as SuperChat does). Don't document it as more
  than a key.
- `MentionMenu` renders through a portal positioned by `useAnchoredPosition`
  (`top-start`, `maxHeight: 224`); the anchor is the composer's textarea
  wrapper (`anchorRef`), not the textarea itself.

## DragDropZone

`DragDropZone` (in [AttachmentPicker.tsx](./AttachmentPicker.tsx)) is also
consumed by `ChatComposer` as a **pure drop target** — no validation props.
Its `overlayLabel` prop exists for that consumer's i18n; keep new props
additive and defaulted.
