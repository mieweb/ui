# Migration guide

Breaking-change recipes for `@mieweb/ui` consumers. Each section is anchored
so release notes and dev-console notices can deep-link to it.

## Textarea is rich text underneath (0.12.0)

**`Textarea` now renders `TextAreaRich`** (hidden toolbar, markdown block
shortcuts, Notion-style block gutter menu) while keeping its plain-text
contract: `value`, `defaultValue` and `onChange`'s `event.target.value` are
still plain strings, `name` still posts plain text through a hidden mirror
`<textarea>`, and `ref.current.value` / `ref.current.focus()` keep working.
Formatting is visible while composing but flattened to lines when reported —
hosts that persist the value store the same plain text as before.

Related renames (also 0.12.0): **`RichTextArea` → `TextAreaRich`**
(deprecated aliases `RichTextArea` / `RichTextAreaProps` still exported), and
the previous native implementation is now **`TextAreaPlain`**
(`textareaVariants` moved with it).

### Pick your lane

| You need…                                                                          | Use                                            |
| ----------------------------------------------------------------------------------- | ----------------------------------------------- |
| A multi-line note field storing plain text (the default)                            | `Textarea` — no code changes                    |
| To **persist** the formatting (value is HTML)                                       | `TextAreaRich`                                  |
| The native `<textarea>` element: hard `maxLength`, native validation/autofill, drag-resize, floating labels, element-targeting CSS/refs | `TextAreaPlain` — same props as the old `Textarea` |

### Behaviour changes to review

- **`maxLength` is no longer enforced while typing.** The counter
  (`showCount`) still renders and turns red past the limit. Enforce limits in
  `onChange` or switch to `TextAreaPlain`.
- **`labelVariant="floating"`, `resize` and `autoResize={false}` are ignored**
  (stacked label, no drag handle, always auto-grows) with a one-time dev
  console warning.
- **Native validation, autofill and IME/browser integrations** tied to a
  visible `<textarea>` element no longer apply.
- **DOM shape changed.** There is no visible `<textarea>`; the surface is a
  `contenteditable` region inside `[data-slot="rich-text-editor"]`, plus a
  hidden mirror `[data-slot="textarea-mirror"]` carrying `name`/`value`. CSS
  selectors like `textarea { … }` no longer match — target the existing
  `[data-slot="textarea-*"]` hooks instead. Tests using
  `getByRole('textbox')` keep working.
- **Controlled transforms reset formatting.** Echoing `event.target.value`
  back unchanged preserves the on-screen formatting; transforming it
  (uppercasing, trimming) resyncs the editor to plain paragraphs.

## Chat composer

**`MessageComposer` was retired in 0.10.0.** The shared **`ChatComposer`** is
the single composer across the library — `SuperChat`, `AIChat`, and
`MessageThread` all mount it internally. If you only used those surfaces, no
code changes are required (their public props are unchanged); the notes below
about DOM/selector changes still apply to any CSS or tests that reached into
the composer.

### Removed exports

| Removed in 0.10.0                            | Replacement                                                                     |
| -------------------------------------------- | ------------------------------------------------------------------------------- |
| `MessageComposer`                            | `ChatComposer`                                                                   |
| `MessageComposerProps`                       | `ChatComposerProps`                                                              |
| `CharacterCounter`, `CharacterCounterProps`  | none — internal to the retired component (ChatComposer renders its own counter)  |
| `SendButton`, `SendButtonProps`, `sendButtonVariants` | none — internal to the retired component                                |

Still exported and unchanged: `MentionOption`, `NewMessage`,
`AttachmentPicker`, `DragDropZone`, `CameraButton`, and the Messaging hooks.

### Prop mapping

Most props transfer 1:1 — `onSend(NewMessage)`, `value` / `onValueChange`,
`placeholder`, `disabled`, `isSending`, `autoFocus`, `maxLength`,
`showCharacterCount`, `acceptedFileTypes`, `maxFileSize`, `maxAttachments`,
`replyTo` / `onCancelReply`, `mentionOptions`, `className`.

| MessageComposer                  | ChatComposer                                                                                                   |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `showAttachmentPicker` (default `true`) | `allowAttachments` (default `true`)                                                                       |
| `showCameraButton`               | none built in — pass `micSlot={<CameraButton onCapture={(f) => ref.current?.addFiles([f])} />}` (MessageThread's pattern; `addFiles` works even with `allowAttachments={false}`) |
| `onTypingStart` / `onTypingStop` | none built in — drive them from `useTypingEmulation({ value, onTypingStart, onTypingStop })` (exported from the Messaging module; same 2s-idle state machine) |
| `inputTrailing` slot             | `micSlot` (rendered in the icon row; `micBehavior` controls visibility)                                         |
| `variant="minimal"`              | none — ChatComposer has a single card presentation                                                              |
| `onError(message: string)`       | `onError(message, context?)` — `context.reason` is a stable machine key: `'file-type' \| 'file-size' \| 'attachment-limit' \| 'send-failed'` |
| `maxLength` default `1600`       | no default cap — pass `maxLength={1600}` to keep the old limit                                                  |

### Failed-send restore semantics (behavior change)

`MessageComposer` restored the typed text itself when `onSend` threw or
rejected. **`ChatComposer` clears the draft optimistically and delegates
restore to the host**: a rejection is reported through
`onError(sendFailedLabel, { reason: 'send-failed' })` and the host restores
the draft via controlled `value` / `onValueChange`. See `MessageThread.tsx`
for the reference implementation (epoch-guarded so a stale failure never
overwrites newer typed input). In both old and new worlds, attachments are
**not** restaged after a failure.

### Attach flow: paperclip → `+` menu

The inline paperclip button is gone; attaching is behind the `+` menu.

```ts
// Before — one click on the paperclip:
page.getByRole('button', { name: 'Attach files' }).click();

// After — open the + menu, then pick the item:
page.getByRole('button', { name: 'Add to message' }).click(); // + button
page.getByRole('menuitem', { name: 'Attach files' }).click();
```

Paste-to-attach still works, and drag-and-drop is now **built in**: the whole
composer card is a drop target (overlay text "Drop files here"). Hosts no
longer need their own `DragDropZone` around the composer — page-level drop
zones can forward files through `ChatComposerHandle.addFiles()`.

### DOM / selector anchors

`data-slot` renames (old rows without a counterpart were internal wrappers
with no replacement):

| MessageComposer slot        | ChatComposer slot              |
| --------------------------- | ------------------------------ |
| `message-composer` (root)   | `chat-composer` (root)         |
| `composer-input`            | `chat-composer-input`          |
| `composer-send-button`      | `chat-composer-send-button`    |
| `composer-attachments`      | `chat-composer-attachments`    |
| `composer-reply-preview`    | `chat-composer-reply-preview`  |
| `composer-char-count`       | `chat-composer-char-count`     |
| `composer-input-trailing`   | `chat-composer-mic-slot`       |
| `composer-input-area`, `composer-input-wrapper` | — (card layout: `chat-composer-card`) |

New slots without an old counterpart: `chat-composer-add-button`,
`chat-composer-cancel-reply`, `chat-composer-mic-button`,
`chat-composer-stop-button`, `chat-composer-readonly`,
`chat-composer-selectors`, `chat-composer-agent-trigger`.

The shared @mention listbox keeps its `composer-mention-list` default slot in
standalone use; ChatComposer renders it as `chat-composer-mention-list`.

Accessible-name changes (all overridable via label props):

| Element        | Before               | After (default)                          |
| -------------- | -------------------- | ---------------------------------------- |
| Textarea       | `Message`            | `Message input` (`inputLabel`)           |
| Send button    | `Send message` / `Sending message` | `Send message` / `Sending message…` (`sendLabel` / `sendingLabel`) |
| Attach control | `Attach files` (paperclip) | `Add to message` (+ menu) → `Attach files` (menu item) |

### `composerProps` on AIChat

`AIChat`'s `composerProps` is now `Partial<ChatComposerProps>` (it forwards to
the internal `ChatComposer`). Legacy `MessageComposerProps`-era keys —
`showAttachmentPicker`, `showCameraButton`, `onTypingStart` / `onTypingStop`,
`inputTrailing`, `onSend`, controlled `value` / `onValueChange` — are still
accepted and mapped for compatibility, but new code should use the
`ChatComposerProps` names directly.
