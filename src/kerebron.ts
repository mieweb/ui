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
