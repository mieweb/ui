# RichTextEditor — Maintainer Notes

> **Provider notes** — how to _change_ the legacy rich-text editor. Consumers
> should read the Storybook stories. General conventions:
> [CONTRIBUTING.md](../../../CONTRIBUTING.md).

## ⚠️ DEPRECATED — no new usages

**RichTextEditor is deprecated** (mieweb/ui#692). Use
[RichEditor](../RichEditor/) from `@mieweb/ui/kerebron` for rich-text
documents — the supported ProseMirror/Kerebron engine — or `TextAreaRich`
from `@mieweb/ui/kerebron` for a textarea-like HTML surface. This editor is
built on the deprecated `document.execCommand` browser surface, the same
engine already deprecated for the legacy `TextAreaRich` (mieweb/ui#677).

- **No new RichTextEditor usages are allowed.** Reach for the Kerebron
  surfaces instead.
- The component logs a one-time `console.warn` on first mount (dev builds
  only) and is tagged `@deprecated` in JSDoc on the component and the barrel
  exports in [index.ts](index.ts), so editors flag usages with strikethrough.
- Migration: install the `@kerebron/*` peers, import
  `@mieweb/ui/kerebron.css`, and switch to `RichEditor`. Mind the format
  difference — `RichEditor` stores **Markdown** (`getContent()`), while
  `RichTextEditor` carries **HTML** through `value`/`onChange`; hosts that
  persist HTML can use `TextAreaRich` (`@mieweb/ui/kerebron`), which keeps
  the HTML `value`/`onChange` contract.
- If the Kerebron surfaces lack a capability you need (e.g. merge-variable
  menus or dictation from an always-on toolbar), **file a feature request
  against RichEditor** rather than adopting RichTextEditor.
- All exports keep working until the component is removed in a future major
  release — deprecation is not a breaking change.

## Internal consumers (intentional, non-warning)

`RichTextEditorBase` is the implementation; the exported `RichTextEditor` is
a thin wrapper that adds the one-time deprecation warning. Two library
composites render the base directly so **their** consumers are not warned
about a choice they never made:

- `EmailEditor` (text-block editing in `EmailBlockSettings.tsx`) — not
  deprecated; migrating it off this engine is tracked separately.
- `TextAreaRichLegacy` — already warns once as the deprecated legacy
  `TextAreaRich` (mieweb/ui#677).

Do not export `RichTextEditorBase` from the barrel.

## Shared contracts that are NOT deprecated

- `RichTextVariable`, `RichTextVariableGroup` — part of `EmailEditor`'s
  public props.
- `RichTextEditorBlockMenuLabels` — consumed by the Kerebron `TextAreaRich`.
- `processDictation`, `convertAngleBracketsToMustache`, `isHtmlEmpty` —
  dictation/HTML utilities also used by the Kerebron surfaces.

If these ever move, update the barrel comments in [index.ts](index.ts).
