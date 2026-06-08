/**
 * SuperChat math plugin (opt-in).
 *
 * Renders `$…$` (inline) and `$$…$$` (block) math with `remark-math` +
 * `rehype-katex` (KaTeX). Consumers must also load KaTeX's stylesheet:
 *
 * ```ts
 * import 'katex/dist/katex.min.css';
 * ```
 *
 * The sanitize allow-list is extended so KaTeX's HTML + MathML output survives
 * the untrusted-content sanitizer.
 */

import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import type { SuperChatRenderPlugin } from '../types';

/** Elements KaTeX emits (HTML + MathML) that must survive sanitization. */
const KATEX_TAGS = [
  'span',
  'svg',
  'path',
  'line',
  'math',
  'semantics',
  'annotation',
  'mrow',
  'mi',
  'mo',
  'mn',
  'ms',
  'mtext',
  'msup',
  'msub',
  'msubsup',
  'mfrac',
  'msqrt',
  'mroot',
  'mover',
  'munder',
  'munderover',
  'mtable',
  'mtr',
  'mtd',
  'mspace',
  'mpadded',
  'mphantom',
  'menclose',
  'mstyle',
];

/** Create the math (KaTeX) render plugin. */
export function createMathPlugin(): SuperChatRenderPlugin {
  return {
    name: 'math',
    remarkPlugins: [remarkMath],
    // `output: 'htmlAndMathml'` (KaTeX default) gives accessible MathML too.
    rehypePlugins: [[rehypeKatex, { throwOnError: false }]],
    sanitizeSchema: {
      tagNames: KATEX_TAGS,
      attributes: {
        '*': ['className'],
        span: ['className', 'style', 'ariaHidden'],
        svg: ['xmlns', 'width', 'height', 'viewBox', 'preserveAspectRatio', 'style'],
        path: ['d'],
        line: ['x1', 'y1', 'x2', 'y2', 'stroke', 'strokeWidth'],
        math: ['xmlns', 'display'],
        annotation: ['encoding'],
      },
    },
  };
}
