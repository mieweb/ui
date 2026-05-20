/**
 * useMarkdown — Hook that converts raw Markdown text to sanitised HTML.
 *
 * Features:
 * - GFM + line breaks via `marked`
 * - Syntax highlighting via `highlight.js` with lazy language loading
 * - Sanitisation via DOMPurify (target="_blank" on links)
 * - Special fence blocks emitted as placeholder divs (mermaid, csv, survey,
 *   html, code) — `MarkdownRenderer` mounts React portals into them.
 */
import DOMPurify from 'dompurify';
import hljs from 'highlight.js/lib/core';
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
import { marked, type MarkedOptions, type RendererThis, type Tokens } from 'marked';
import { useCallback, useMemo } from 'react';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('js', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('ts', typescript);
hljs.registerLanguage('python', python);
hljs.registerLanguage('json', json);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('html', xml);
hljs.registerLanguage('css', css);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('shell', bash);
hljs.registerLanguage('sh', bash);
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
  'js',
  'typescript',
  'ts',
  'python',
  'json',
  'xml',
  'html',
  'css',
  'bash',
  'shell',
  'sh',
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
    hljs.registerLanguage(key, mod.default as Parameters<typeof hljs.registerLanguage>[1]);
    loadedLanguages.add(key);
    return true;
  } catch {
    return false;
  }
}

/**
 * Highlight `code` with `highlight.js`. If `lang` is registered, that grammar
 * is used; otherwise auto-detection is attempted (only accepted when
 * relevance > 5). Returns `code` HTML-escaped if neither path produces a
 * usable result.
 */
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
    ADD_TAGS: ['iframe'],
    ADD_ATTR: [
      'target',
      'rel',
      'allow',
      'allowfullscreen',
      'sandbox',
      'srcdoc',
      'data-block-type',
      'data-block-id',
      'data-code',
      'data-lang',
    ],
    WHOLE_DOCUMENT: false,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
    FORCE_BODY: false,
  }) as string;
}

// Open links in a new tab. DOMPurify hooks are global, so this runs for every
// consumer once this module is imported — intentional, since rendered links
// inside chat bubbles should never navigate the host app away.
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node instanceof HTMLAnchorElement) {
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer');
  }
});

function createRenderer() {
  const renderer = new marked.Renderer();
  let blockCounter = 0;

  renderer.code = function (token: Tokens.Code) {
    const { text: code, lang = '' } = token;
    const normalised = lang.toLowerCase().trim();
    const blockId = `block-${++blockCounter}`;
    const encodedCode = encodeURIComponent(code);
    const escapedLang = escapeHtml(normalised);

    switch (normalised) {
      case 'mermaid':
      case 'csv':
      case 'survey':
        return `<div data-block-type="${normalised}" data-block-id="${blockId}" data-code="${encodedCode}"></div>`;
      case 'html':
        return `<div data-block-type="html-preview" data-block-id="${blockId}" data-code="${encodedCode}"></div>`;
      default:
        return `<div data-block-type="code" data-block-id="${blockId}" data-code="${encodedCode}" data-lang="${escapedLang}"></div>`;
    }
  };

  renderer.link = function (this: RendererThis, token: Tokens.Link) {
    const { href, title, tokens } = token;
    const text = this.parser.parseInline(tokens);
    const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
    return `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer"${titleAttr}>${text}</a>`;
  };

  renderer.table = function (this: RendererThis, token: Tokens.Table) {
    const headerCells = token.header
      .map((cell) => `<th>${this.parser.parseInline(cell.tokens)}</th>`)
      .join('');
    const bodyRows = token.rows
      .map((row) => {
        const cells = row
          .map((cell) => `<td>${this.parser.parseInline(cell.tokens)}</td>`)
          .join('');
        return `<tr>${cells}</tr>`;
      })
      .join('');
    return `<div class="overflow-x-auto"><table class="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700"><thead><tr>${headerCells}</tr></thead><tbody class="divide-y divide-neutral-200 dark:divide-neutral-700">${bodyRows}</tbody></table></div>`;
  };

  return { renderer, reset: () => (blockCounter = 0) };
}

const { renderer, reset: resetBlockCounter } = createRenderer();

const markedOptions: MarkedOptions = {
  gfm: true,
  breaks: true,
  renderer,
};

marked.setOptions(markedOptions);

// Module-shared LRU cache. Bounded so long-running chats don't grow forever.
// Move-to-end on hit (`cacheGet`) approximates LRU; eviction drops the
// oldest entry once the size cap is exceeded.
const RENDER_CACHE_MAX = 200;
const renderCache = new Map<string, string>();

function cacheGet(key: string): string | undefined {
  const value = renderCache.get(key);
  if (value === undefined) return undefined;
  renderCache.delete(key);
  renderCache.set(key, value);
  return value;
}

function cacheSet(key: string, value: string): void {
  if (renderCache.has(key)) renderCache.delete(key);
  renderCache.set(key, value);
  if (renderCache.size > RENDER_CACHE_MAX) {
    const firstKey = renderCache.keys().next().value;
    if (firstKey !== undefined) renderCache.delete(firstKey);
  }
}

export interface UseMarkdownResult {
  /** Render markdown text to sanitised HTML string */
  render: (text: string, cacheKey?: string) => string;
  /** Async-render that lazy-loads needed languages first */
  renderAsync: (text: string, cacheKey?: string) => Promise<string>;
  /** Clear the shared render cache (affects all consumers) */
  clearCache: () => void;
}

export function useMarkdown(): UseMarkdownResult {
  const render = useCallback((text: string, cacheKey?: string): string => {
    if (!text) return '';
    const key = cacheKey ?? text;
    const cached = cacheGet(key);
    if (cached !== undefined) return cached;

    resetBlockCounter();
    const raw = marked.parse(text, { async: false }) as string;
    const clean = sanitise(raw);
    cacheSet(key, clean);
    return clean;
  }, []);

  const renderAsync = useCallback(async (text: string, cacheKey?: string): Promise<string> => {
    if (!text) return '';
    const key = cacheKey ?? text;
    const cached = cacheGet(key);
    if (cached !== undefined) return cached;

    const fenceRegex = /^```(\w+)\s*$/gm;
    let match: RegExpExecArray | null;
    const langs: string[] = [];
    while ((match = fenceRegex.exec(text)) !== null) {
      langs.push(match[1]);
    }
    await Promise.all(langs.map((l) => ensureLanguage(l)));

    resetBlockCounter();
    const raw = await marked.parse(text);
    const clean = sanitise(raw);
    cacheSet(key, clean);
    return clean;
  }, []);

  const clearCache = useCallback(() => {
    renderCache.clear();
  }, []);

  return useMemo(() => ({ render, renderAsync, clearCache }), [render, renderAsync, clearCache]);
}
