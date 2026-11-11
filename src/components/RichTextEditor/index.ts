/**
 * @deprecated `RichTextEditor` (legacy `document.execCommand` engine) is
 * deprecated — use `RichEditor` from `@mieweb/ui/kerebron` (Markdown on the
 * ProseMirror engine; `@kerebron/*` peers + `@mieweb/ui/kerebron.css`), or
 * `TextAreaRich` from `@mieweb/ui/kerebron` for a textarea-like HTML surface
 * (mieweb/ui#692). This component will be removed in a future major release.
 */
export { RichTextEditor } from './RichTextEditor';
// Shared contracts: these types and utilities are also used by the supported
// Kerebron surfaces (`TextAreaRich` from `@mieweb/ui/kerebron`, `EmailEditor`)
// and are not deprecated. `RichTextEditorProps` is the base props contract
// that `TextAreaRichProps` extends (mieweb/ui#692).
export type {
  RichTextEditorProps,
  RichTextEditorBlockMenuLabels,
  RichTextVariable,
  RichTextVariableGroup,
} from './RichTextEditor';
export {
  processDictation,
  convertAngleBracketsToMustache,
  isHtmlEmpty,
} from './processDictation';
