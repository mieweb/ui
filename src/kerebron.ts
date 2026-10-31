/**
 * Kerebron editor entry point — separate from the main bundle.
 *
 * Usage:
 *   import { RichEditor, CodeEditor } from '@mieweb/ui/kerebron';
 *   import '@mieweb/ui/kerebron.css';
 *
 * Since 0.12 the `@kerebron/*` packages are required peers of `@mieweb/ui`
 * itself — the main bundle's `Textarea` renders the Kerebron engine — so this
 * entry no longer gates the install; it still keeps `RichEditor`/`CodeEditor`
 * (and their code) out of the default bundle for consumers who only need the
 * core components. Mirrors the AG Grid (src/ag-grid.ts) and DataVis
 * (src/datavis.ts) separate-entry convention.
 *
 * Note: the editor loads tree-sitter WASM grammars at runtime from
 * `/kerebron-wasm`. Host apps must serve @kerebron/wasm's `assets/` directory
 * at that path (see .storybook/main.ts for the Storybook setup).
 */
export * from './components/RichEditor';

// The Kerebron-backed TextAreaRich surface. Same `TextAreaRichProps`
// contract as the main-bundle (legacy-engine) `TextAreaRich`, which is now
// deprecated in its favor — upgrading is an import-path change:
// `import { TextAreaRich } from '@mieweb/ui/kerebron'`.
export { TextAreaRichKerebron as TextAreaRich } from './components/TextAreaRich/TextAreaRichKerebron';
export type { TextAreaRichProps } from './components/TextAreaRich';
