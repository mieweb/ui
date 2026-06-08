/** useMarkdown — converts markdown to sanitised HTML with hljs highlighting and special fence blocks. */
import DOMPurify from 'dompurify';
import hljs from 'highlight.js/lib/core';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
import bash from 'highlight.js/lib/languages/bash';
import css from 'highlight.js/lib/languages/css';
import javascript from 'highlight.js/lib/languages/javascript';
import json from 'highlight.js/lib/languages/json';
import markdown from 'highlight.js/lib/languages/markdown';
import python from 'highlight.js/lib/languages/python';
import sql from 'highlight.js/lib/languages/sql';
import typescript from 'highlight.js/lib/languages/typescript';
import xml from 'highlight.js/lib/languages/xml';
import yaml from 'highlight.js/lib/languages/yaml';
import { marked, type MarkedOptions, type Tokens } from 'marked';
import { useCallback, useMemo, useRef } from 'react';

hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('python', python);
hljs.registerLanguage('json', json);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('html', xml);
hljs.registerLanguage('css', css);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('shell', bash);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('yaml', yaml);
hljs.registerLanguage('yml', yaml);
hljs.registerLanguage('markdown', markdown);
hljs.registerLanguage('md', markdown);

const lazyLanguages: Record<string, () => Promise<unknown>> = {
  java: () => import('highlight.js/lib/languages/java'),
  cpp: () => import('highlight.js/lib/languages/cpp'),
  'c++': () => import('highlight.js/lib/languages/cpp'),
  c: () => import('highlight.js/lib/languages/c'),
  csharp: () => import('highlight.js/lib/languages/csharp'),
  php: () => import('highlight.js/lib/languages/php'),
  ruby: () => import('highlight.js/lib/languages/ruby'),
  go: () => import('highlight.js/lib/languages/go'),
  rust: () => import('highlight.js/lib/languages/rust'),
  perl: () => import('highlight.js/lib/languages/perl'),
  r: () => import('highlight.js/lib/languages/r'),
  makefile: () => import('highlight.js/lib/languages/makefile'),
  dockerfile: () => import('highlight.js/lib/languages/dockerfile'),
};

const loadedLanguages = new Set<string>([
  'javascript',
  'typescript',
  'python',
  'json',
  'xml',
  'html',
  'css',
  'bash',
  'shell',
  'sql',
  'yaml',
  'yml',
  'markdown',
  'md',
]);

async function ensureLanguage(lang: string): Promise<boolean> {
  const key = lang.toLowerCase();
  if (loadedLanguages.has(key)) return true;
  const loader = lazyLanguages[key];
  if (!loader) return false;
  try {
    const mod = (await loader()) as { default: unknown };
    hljs.registerLanguage(
      key,
      mod.default as Parameters<typeof hljs.registerLanguage>[1]
    );
    loadedLanguages.add(key);
    return true;
  } catch {
    return false;
  }
}

export function highlightCode(code: string, lang?: string): string {
  if (lang && loadedLanguages.has(lang.toLowerCase())) {
    try {
      return hljs.highlight(code, { language: lang.toLowerCase() }).value;
    } catch {
      /* fall through */
    }
  }
  try {
    const result = hljs.highlightAuto(code);
    if (result.relevance > 5) return result.value;
  } catch {
    /* fall through */
  }
  return escapeHtml(code);
}

function sanitise(html: string): string {
  return DOMPurify.sanitize(html, {
    ADD_ATTR: [
      'target',
      'rel',
      'data-block-type',
      'data-block-id',
      'data-code',
      'data-lang',
      'data-md-fence',
    ],
  }) as string;
}

// Use globalThis to prevent duplicate DOMPurify hook registration across HMR reloads.
const _g = globalThis as unknown as Record<string, boolean>;
// Guard against SSR: DOMPurify hooks operate on the DOM, so only register in the browser.
if (typeof document !== 'undefined' && !_g.__markdownAnchorHookInstalled) {
  _g.__markdownAnchorHookInstalled = true;
  DOMPurify.addHook('afterSanitizeAttributes', (node: Element) => {
    const isAnchor =
      (typeof HTMLAnchorElement !== 'undefined' &&
        node instanceof HTMLAnchorElement) ||
      node.nodeName === 'A';
    if (isAnchor) {
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noopener noreferrer');
    }
  });
}

let blockCounter = 0;

function createRenderer() {
  const renderer = new marked.Renderer();

  renderer.code = function (this: unknown, token: Tokens.Code) {
    const { text: code, lang = '' } = token;
    const normalised = lang.toLowerCase().trim();
    const blockId = `block-${++blockCounter}`;
    const encodedCode = encodeURIComponent(code);
    const sentinel = 'data-md-fence="1"';

    switch (normalised) {
      case 'mermaid':
        return `<div data-block-type="mermaid" data-block-id="${blockId}" data-code="${encodedCode}" ${sentinel}></div>`;
      case 'csv':
        return `<div data-block-type="csv" data-block-id="${blockId}" data-code="${encodedCode}" ${sentinel}></div>`;
      case 'survey':
        return `<div data-block-type="survey" data-block-id="${blockId}" data-code="${encodedCode}" ${sentinel}></div>`;
      case 'html':
        return `<div data-block-type="html-preview" data-block-id="${blockId}" data-code="${encodedCode}" ${sentinel}></div>`;
      default:
        return `<div data-block-type="code" data-block-id="${blockId}" data-code="${encodedCode}" data-lang="${escapeHtml(normalised)}" ${sentinel}></div>`;
    }
  };

  renderer.link = function (this: unknown, token: Tokens.Link) {
    const { href, title, tokens } = token;
    const text =
      this && typeof (this as Record<string, unknown>).parser === 'object'
        ? (
            this as {
              parser: { parseInline: (t: Tokens.Link['tokens']) => string };
            }
          ).parser.parseInline(tokens)
        : token.text;
    const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
    return `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer"${titleAttr}>${text}</a>`;
  };

  renderer.table = function (this: unknown, token: Tokens.Table) {
    const headerCells = token.header
      .map((cell) => {
        const content =
          this && typeof (this as Record<string, unknown>).parser === 'object'
            ? (
                this as {
                  parser: {
                    parseInline: (t: Tokens.TableCell['tokens']) => string;
                  };
                }
              ).parser.parseInline(cell.tokens)
            : cell.text;
        return `<th>${content}</th>`;
      })
      .join('');

    const bodyRows = token.rows
      .map((row) => {
        const cells = row
          .map((cell) => {
            const content =
              this &&
              typeof (this as Record<string, unknown>).parser === 'object'
                ? (
                    this as {
                      parser: {
                        parseInline: (t: Tokens.TableCell['tokens']) => string;
                      };
                    }
                  ).parser.parseInline(cell.tokens)
                : cell.text;
            return `<td>${content}</td>`;
          })
          .join('');
        return `<tr>${cells}</tr>`;
      })
      .join('');

    return `<div class="overflow-x-auto"><table class="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700"><thead><tr>${headerCells}</tr></thead><tbody class="divide-y divide-neutral-200 dark:divide-neutral-700">${bodyRows}</tbody></table></div>`;
  };

  return renderer;
}

function makeMarkedOptions(): MarkedOptions {
  return { gfm: true, breaks: true, renderer: createRenderer() };
}

const CACHE_MAX = 100;
const renderCache = new Map<string, string>();
function cacheSet(key: string, value: string) {
  if (renderCache.size >= CACHE_MAX) {
    renderCache.delete(renderCache.keys().next().value as string);
  }
  renderCache.set(key, value);
}

export interface UseMarkdownResult {
  /** Render markdown text to sanitised HTML string */
  render: (text: string, cacheKey?: string) => string;
  /** Async-render that lazy-loads needed languages first */
  renderAsync: (text: string, cacheKey?: string) => Promise<string>;
  /** Clear the render cache */
  clearCache: () => void;
}

export function useMarkdown(): UseMarkdownResult {
  const cacheRef = useRef(renderCache);

  const render = useCallback((text: string, cacheKey?: string): string => {
    if (!text) return '';
    const key = cacheKey ?? text;
    const cached = cacheRef.current.get(key);
    if (cached) return cached;

    const raw = marked.parse(text, {
      ...makeMarkedOptions(),
      async: false,
    }) as string;
    const clean = sanitise(raw);
    cacheSet(key, clean);
    return clean;
  }, []);

  const renderAsync = useCallback(
    async (text: string, cacheKey?: string): Promise<string> => {
      if (!text) return '';
      const key = cacheKey ?? text;
      const cached = cacheRef.current.get(key);
      if (cached) return cached;

      // Allow `+`, `-`, `.` in language identifiers (c++, objective-c, bash-session, etc.)
      const fenceRegex = /^```([\w+\-.]+)\s*$/gm;
      let match: RegExpExecArray | null;
      const langs: string[] = [];
      while ((match = fenceRegex.exec(text)) !== null) {
        langs.push(match[1]);
      }
      await Promise.all(langs.map((l) => ensureLanguage(l)));

      const raw = await marked.parse(text, makeMarkedOptions());
      const clean = sanitise(raw);
      cacheSet(key, clean);
      return clean;
    },
    []
  );

  const clearCache = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  return useMemo(
    () => ({ render, renderAsync, clearCache }),
    [render, renderAsync, clearCache]
  );
}
