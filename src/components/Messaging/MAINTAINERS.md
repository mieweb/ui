# Messaging — Maintainer Notes

Short notes on the invariants that are easy to break. User-facing docs live in
[Messaging.stories.tsx](./Messaging.stories.tsx).

## Shared @mention module

[useMentionAutocomplete.tsx](./useMentionAutocomplete.tsx) is the single
implementation of `@mention` autocomplete, consumed by **two** composers:
`MessageComposer` (here) and `ChatComposer`. It was extracted **verbatim**
from MessageComposer so both stay behavior-identical.

- **Run both suites** when touching it: `MessageComposer` is exercised by
  `SuperChat.test.tsx` (SuperChat pins mention behavior through it) and
  `ChatComposer.test.tsx` has its own `@mentions` describe block.
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
