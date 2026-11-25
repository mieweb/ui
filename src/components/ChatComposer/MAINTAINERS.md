# ChatComposer — Maintainer Notes

Short notes on the invariants that are easy to break. User-facing docs live in
[ChatComposer.stories.tsx](./ChatComposer.stories.tsx).

In-repo hosts: `SuperChat`, `AIChat` and Messaging's `MessageThread` all mount
this composer — run their suites too when changing send/attachment behavior.

## Staged files live in `useAttachmentUploads`

The composer's staged files are the `useAttachmentUploads` hook's list
(exported for hosts' own composers). `addFiles` only validates (type, size,
room) and calls `uploads.add`; everything else is the hook's:

- **Object URLs.** Images and videos get one preview URL each, revoked exactly
  once: on `remove`, on `take` (a send) and `clear`, and at unmount. A new
  path that drops items must go through `drop()` in the hook, which revokes.
  `resolveAttachments` drops the staged files its result leaves out with
  `remove`, so they are revoked (and their uploads aborted or discarded) too.
- **Synchronous list.** `uploads.current()` (a ref) is updated synchronously
  on every add/remove/take, so same-batch `addFiles` calls see accurate room.
  State updaters stay pure; side effects (URLs, ids, aborts, `onError`) happen
  outside them, because StrictMode may run updaters twice.
- **Uploads start in `add`,** never in an effect, so StrictMode's
  double-mount can't start one twice.

## Upload on attach (`uploadAttachment`)

With `uploadAttachment`, each file uploads as it's staged: progress on its
tile (`processing` once every byte is in), `signal` aborted on remove,
`discardAttachment` for a finished one removed before sending, Retry on
failure. Without it, files stay `pending` and nothing below applies.

- **Send waits, it isn't disabled.** Pressed with uploads in flight it sets
  `awaitingUploads` (busy spinner, Enter blocked) and awaits `settle()`, which
  loops until nothing is in flight. Each in-flight entry is raced against its
  abort, so a removed upload stops holding the wait up even when the host
  ignores `signal`.
- **Where it goes is fixed at press, what goes is read at the end.** Send
  captures a `SendTarget`: the `onSend` and reply target of that moment and
  the draft's generation. A host that reuses the composer (SuperChatInbox
  switching conversations) rebinds `onSend`, and a waiting send must still
  land where it was written; if the host swaps in another draft meanwhile,
  it's dropped and the tiles stay. The text is read when the wait ends (with
  `editor="rich"`, from the editor, after the wait), and nothing is sent if
  every tile was removed and the text is empty. A failed upload stops the
  send (`'upload-failed'`) and keeps the draft.
- **Checked again before every send.** `handleSend` → `sendWhenUploaded` →
  `sendDraft` → `sendText`. A file attached during the rich editor's
  `getContent()` sends the flow back to `sendWhenUploaded`, so `take()` never
  sees an upload still in flight.
- **`take()` before `onSend`.** It empties the list without discarding: the
  results now belong to the message. If the host's send fails, SuperChat puts
  them back with `restoreAttachments` (no re-upload).
- **Unmount** aborts uploads in flight and discards finished ones — nothing
  will send them — unless `keepUploadingOnUnmount` (for uploads that land
  where they're going by themselves). It also clears the list, so effects that
  rerun without a real unmount don't keep dead tiles.
- **An aborted upload that succeeds anyway is discarded.** A host may ignore
  `signal`, or the server may finish before the abort lands: its result goes
  to `discardAttachment`, as a finished upload taken off does. A rejected one
  is left alone.
- **Announcements** are `UploadAnnouncer`'s (shared with hosts that draw their
  own tiles): starts and finishes politely, failures as an alert, never each
  percent. Messages wait in a per-file queue with its own 50 ms timer, apart
  from the render effect, so a progress update can't cancel one; a file taken
  off takes its queued message with it.

## Imperative `addFiles` bypasses `allowAttachments`

`allowAttachments` gates only the composer's own attach affordances — the `+`
button, the paste handler, and the internal `DragDropZone`. The imperative
`ref.addFiles()` path deliberately has **no** gate: hosts that call it (e.g.
MessageThread's camera capture with `showAttachmentPicker={false}`) have
already opted in, and legacy MessageComposer parity requires camera-only
staging to work. Validation and structured `onError` reporting still apply.
Don't re-add an `allowAttachments` check inside `addFiles`; gate new
user-facing entry points at the entry point instead.

## Menus are controlled

The `+` menu and the selector-row menus use controlled `open`/`onOpenChange`
because `DropdownItem` does **not** close its parent `Dropdown` on click
(verified in Dropdown.tsx `handleClick`). Every item `onClick` must call the
corresponding `set…Open(false)` first. Selector-row menus (the agent selector,
and host selectors such as Hey Ozwell) share `ComposerSelector.tsx`, which owns
its own open state; change the look there, not per selector. It is internal
(not exported from `@mieweb/ui`).

## Error contract

`onError(message, context)` — `message` is a default-English string,
`context.reason` (`'file-type' | 'file-size' | 'attachment-limit' |
'send-failed'`) is the stable machine-readable key hosts localize on. Don't
change reason strings without a major-version note.

## Host attachment rules

`resolveAttachments(incoming, staged)` lets a host decide what stays staged
(e.g. one kind of attachment at a time). Type and size checks run first, so
it only sees files that passed them; `maxAttachments` applies to its result.
Staged entries are matched by `File` identity, so kept files keep their id,
preview URL and upload; the ones left out go through `uploads.remove`
(aborted while uploading, discarded once uploaded), and new ones kept are
added after them. Without it, `addFiles` appends as before.

## Shared mention module

`mentionOptions` / `onMentionSearch` / `onMentionSelect` delegate to
`useMentionAutocomplete` / `MentionMenu` in
`../Messaging/useMentionAutocomplete.tsx` — the module extracted from the
retired MessageComposer; its invariants live in
[Messaging/MAINTAINERS.md](../Messaging/MAINTAINERS.md). ChatComposer-specific
contract: keyboard priority in the textarea `onKeyDown` is host
`textareaProps.onKeyDown` (preventDefault claims the event) → mention menu
navigation → Enter-to-send. Don't reorder.

With `onMentionSearch`, the options picked are kept by id until a send, which
reports the ones still in the text as whole `@tokens` (`matchMentionTokens`)
and forgets them all. A host that puts a failed send's text back puts its
`mentions` back with `restoreMentions` too (SuperChat does, under the same
guard as the text), or the retry reports none.

## Mobile keyboard behavior

- **Enter.** `submitOnEnter="desktop"` (default) keys off
  `(hover: none) and (pointer: coarse)`: touch devices get a newline on
  Return. The `isComposing` guard sits before the send check so Enter that
  confirms an IME candidate never sends — keep it there.
- **Send/stop keep focus via `onMouseDown` preventDefault**, not
  `onPointerDown`: cancelling pointerdown does not stop the focus change in
  every browser. Removing it brings back the keyboard close/reopen bounce on
  iOS, because `handleSend` refocuses after the blur has started.
- **Card tap-to-focus** skips anything matching the interactive selector
  (buttons, links, inputs, menus). New interactive children must match it or
  a tap on them will be swallowed.
- **`autoFocus` is ignored on touch** (it would pop the keyboard on every
  navigation). It is applied by a mount effect after a client-side pointer
  check, never as an `autofocus` attribute, so SSR markup can't trigger it.
  `replyTo` still focuses on touch — it follows a user tap.
- **Keyboard inset is the host's job.** The composer doesn't measure the
  keyboard; hosts mount `useKeyboardInset()` and size their shell from its
  CSS variables (see the _Mobile Keyboard Shell_ story). In native apps,
  hosts pass `source: 'native'` (keyboard plugin events, which fire before
  the keyboard animates) and pad only the composer dock by
  `--mieweb-keyboard-inset`; resizing the whole shell from the visual
  viewport snaps on iOS because it only updates after the animation.

## Drag-and-drop delegates validation

The card is wrapped in `DragDropZone` (from `../Messaging/AttachmentPicker`)
purely as a drop target/overlay: no `acceptedTypes`/`maxFileSize`/`onError`
are passed and `maxFiles` is effectively unbounded, so **all** validation and
error reporting happen once, in `addFiles`, with the structured error contract
above. Don't add validation props to the zone — you'd double-report.

## Reply-to is host-owned

`replyTo` renders the dismissible preview row, focuses the input, and stamps
`replyToId` onto the sent `NewMessage`. The component never clears it —
`MessageComposer` parity (`MessageThread` clears its own state in its send
handler). `onCancelReply` fires only from the row's ✕ button. Don't add
auto-clear-on-send; hosts own the state.

## Extension points (instead of new props)

- `micSlot` — replaces the built-in mic button (e.g. `RecordButton`). The slot
  is wrapped in an `h-8` flex row (`data-slot="chat-composer-mic-slot"`) so
  taller content overflow-centers instead of inflating the control row.
  `disabled` does **not** propagate into custom slot content — that's the
  documented contract, not an oversight.
- `leadingSlot` — custom control at the leading edge (e.g. a voice-activation
  toggle). It shares the `+` menu's grid cell rather than adding a column, so
  it inherits the cell's responsive row placement; the cell renders even when
  the `+` menu is hidden. Same `h-8` wrapper and `disabled` contract as
  `micSlot` (`data-slot="chat-composer-leading-slot"`).
- `headerSlot` — host node directly above the card (e.g. a docked toolbar of
  capture actions), in `data-slot="chat-composer-header-slot"`. No sizing
  wrapper; same `disabled` contract as `micSlot`.
- `addMenuItems` — host actions in the `+` menu; `checked` items render as
  `menuitemcheckbox` via `DropdownItem`'s native `checked` prop.
- `modelSelectorProps` — passed through to `ComposerModelSelector`
  (`variant="ghost"` default, host may override; `disabled` is combined with
  the composer's `disabled` **after** the spread — keep that ordering).
- `selectorsEndSlot` — host node after the model selector, inside
  `data-slot="chat-composer-selectors-end"`. It shows the bottom row on its
  own; same `disabled` contract as `micSlot`. The agent trigger keeps
  `data-slot="chat-composer-agent-trigger"` for existing CSS and host tests.

## Visual baseline

`tests/visual/components.spec.ts` snapshots the `WithSelectors` story
(`chat-composer-with-selectors.png`) and the `WithSelectorsEndSlot` story
(`chat-composer-selectors-end-slot*.png`). Regenerate with
`pnpm playwright test --update-snapshots=all` and **view the PNG** before
committing. The ghost `ComposerModelSelector` is part of this baseline, so
changes there show up here too.
