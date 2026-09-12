# ChatComposer — Maintainer Notes

Short notes on the invariants that are easy to break. User-facing docs live in
[ChatComposer.stories.tsx](./ChatComposer.stories.tsx).

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

## Extension points (instead of new props)

- `micSlot` — replaces the built-in mic button (e.g. `RecordButton`). Rendered
  as-is: `disabled` does **not** propagate into custom slot content — that's
  the documented contract, not an oversight.
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
