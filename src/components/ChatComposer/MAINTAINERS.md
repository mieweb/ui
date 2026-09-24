# ChatComposer — Maintainer Notes

Short notes on the invariants that are easy to break. User-facing docs live in
[ChatComposer.stories.tsx](./ChatComposer.stories.tsx).

In-repo hosts: `SuperChat`, `AIChat` and Messaging's `MessageThread` all mount
this composer — run their suites too when changing send/attachment behavior.

## Object-URL lifecycle

Staged image/video attachments get a `URL.createObjectURL` preview. Every URL
must be revoked exactly once. The three revoke paths are:

1. `removeAttachment` — user removes a chip.
2. `handleSend` — draft is sent, previews are no longer needed.
3. Unmount cleanup effect — reads `attachmentsRef.current` (a ref mirror of
   state) because the effect runs once.

If you add a new path that drops attachments, revoke their `previewUrl`s.

## `addFiles` stays pure-ish

All side effects (URL creation/revocation, id generation, `onError`) happen
**outside** the state updaters — React may invoke updaters more than once in
StrictMode. `attachmentsRef.current` is updated **synchronously** on every
add/remove/send so same-batch calls see accurate room and the unmount cleanup
never re-revokes. The updaters themselves are pure merges/filters. Keep it
that way.

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

The `+` menu and agent menu use controlled `open`/`onOpenChange` because
`DropdownItem` does **not** close its parent `Dropdown` on click (verified in
Dropdown.tsx `handleClick`). Every item `onClick` must call the corresponding
`set…MenuOpen(false)` first.

## Error contract

`onError(message, context)` — `message` is a default-English string,
`context.reason` (`'file-type' | 'file-size' | 'attachment-limit' |
'send-failed'`) is the stable machine-readable key hosts localize on. Don't
change reason strings without a major-version note.

## Shared mention module

`mentionOptions` delegates to `useMentionAutocomplete` / `MentionMenu` in
`../Messaging/useMentionAutocomplete.tsx` — the module extracted from the
retired MessageComposer; its invariants live in
[Messaging/MAINTAINERS.md](../Messaging/MAINTAINERS.md). ChatComposer-specific
contract: keyboard priority in the textarea `onKeyDown` is host
`textareaProps.onKeyDown` (preventDefault claims the event) → mention menu
navigation → Enter-to-send. Don't reorder.

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
  navigation). `replyTo` still focuses on touch — it follows a user tap.
- **Keyboard inset is the host's job.** The composer doesn't measure the
  keyboard; hosts mount `useKeyboardInset()` and size their shell from its
  CSS variables (see the *Mobile Keyboard Shell* story).

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
- `addMenuItems` — host actions in the `+` menu; `checked` items render as
  `menuitemcheckbox` via `DropdownItem`'s native `checked` prop.
- `modelSelectorProps` — passed through to `ComposerModelSelector`
  (`variant="ghost"` default, host may override; `disabled` is combined with
  the composer's `disabled` **after** the spread — keep that ordering).

## Visual baseline

`tests/visual/components.spec.ts` snapshots the `WithSelectors` story
(`chat-composer-with-selectors.png`). Regenerate with
`pnpm playwright test --update-snapshots=all` and **view the PNG** before
committing. The ghost `ComposerModelSelector` is part of this baseline, so
changes there show up here too.
