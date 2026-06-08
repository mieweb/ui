/**
 * SuperChat rich render plugins (opt-in subpath).
 *
 * Import only the plugins you need; each pulls its heavy dependency lazily and
 * stays out of the SuperChat base bundle.
 *
 * @example
 * import { createCodePlugin, createMathPlugin } from '@mieweb/ui/components/SuperChat/plugins';
 * import 'katex/dist/katex.min.css'; // required by the math plugin
 *
 * const render = createMarkdownRenderer({
 *   plugins: [createCodePlugin(), createMathPlugin()],
 * });
 */

export { createCodePlugin } from './code';
export { createMathPlugin } from './math';
export { createGenUIPlugin, GENUI_TAG } from './genui';
export type {
  GenUIRegistry,
  GenUIWidgetEntry,
  GenUIWidgetProps,
} from './genui';
