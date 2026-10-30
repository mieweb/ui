/**
 * Kerebron editor entry point — separate from the main bundle.
 *
 * Usage:
 *   npm install @mieweb/ui @kerebron/editor @kerebron/editor-kits @kerebron/wasm
 *   import { RichEditor, CodeEditor } from '@mieweb/ui/kerebron';
 *   import '@mieweb/ui/kerebron.css';
 *
 * This keeps the @kerebron/* packages (and their WASM/CSS side effects) out of
 * the default install/bundle so consumers who don't need the editor aren't
 * burdened. Mirrors the AG Grid (src/ag-grid.ts) and DataVis (src/datavis.ts)
 * optional-entry convention.
 *
 * Note: the editor loads tree-sitter WASM grammars at runtime from
 * `/kerebron-wasm`. Host apps must serve @kerebron/wasm's `assets/` directory
 * at that path (see .storybook/main.ts for the Storybook setup).
 */
export * from './components/RichEditor';

// The Kerebron-backed TextAreaRich surface. Same `TextAreaRichProps`
// contract as the main-bundle (legacy-engine) `TextAreaRich` — upgrading is
// an import-path change: `import { TextAreaRich } from '@mieweb/ui/kerebron'`.
export { TextAreaRichKerebron as TextAreaRich } from './components/TextAreaRich/TextAreaRichKerebron';
export type { TextAreaRichProps } from './components/TextAreaRich';
