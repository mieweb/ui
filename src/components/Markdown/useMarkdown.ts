/**
 * useMarkdown — Hook that converts raw Markdown text to sanitised HTML.
 *
 * Features:
 * - GFM + line breaks via `marked`
 * - Syntax highlighting via `highlight.js` with lazy language loading
 * - Sanitisation via DOMPurify (target="_blank" on links)
 * - Special fence blocks emitted as placeholder divs (mermaid, csv, survey, html)
 */
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
    hljs.registerLanguage(key, mod.default as Parameters<typeof hljs.registerLanguage>[1]);
    loadedLanguages.add(key);
    return true;
  } catch {
    return false;
  }
}

function highlightCode(code: string, lang?: string): string {
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

DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node instanceof HTMLAnchorElement) {
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer');
  }
});

// Static copy-button markup reused for every fenced code block. Wired up by
// a single delegated click handler that reads `data-code` from `.fence-block`.
const COPY_BTN_HTML =
  '<button type="button" class="fence-copy-btn" aria-label="Copy code">' +
  '<svg class="fence-copy-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>' +
  '<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>' +
  '</svg>' +
  '<svg class="fence-check-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<polyline points="20 6 9 17 4 12"></polyline>' +
  '</svg>' +
  '<span class="fence-copy-label">Copy</span>' +
  '<span class="fence-copied-label">Copied</span>' +
  '</button>';

if (typeof document !== 'undefined') {
  document.addEventListener('click', (event) => {
    const btn =
      event.target instanceof Element
        ? event.target.closest<HTMLButtonElement>('.fence-copy-btn')
        : null;
    if (!btn) return;
    const encoded = btn.closest('.fence-block')?.getAttribute('data-code');
    if (!encoded) return;
    const code = decodeURIComponent(encoded);
    const markCopied = () => {
      btn.classList.add('is-copied');
      btn.setAttribute('aria-label', 'Copied');
      setTimeout(() => {
        btn.classList.remove('is-copied');
        btn.setAttribute('aria-label', 'Copy code');
      }, 1500);
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard
        .writeText(code)
        .then(markCopied)
        .catch(() => {});
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

    switch (normalised) {
      case 'mermaid':
        return `<div data-block-type="mermaid" data-block-id="${blockId}" data-code="${encodedCode}"></div>`;
      case 'csv':
        return `<div data-block-type="csv" data-block-id="${blockId}" data-code="${encodedCode}"></div>`;
      case 'survey':
        return `<div data-block-type="survey" data-block-id="${blockId}" data-code="${encodedCode}"></div>`;
      case 'html':
        return `<div data-block-type="html-preview" data-block-id="${blockId}" data-code="${encodedCode}"></div>`;
      default: {
        const highlighted = highlightCode(code, normalised || undefined);
        const header = `<div class="fence-block-header"><span class="fence-lang">${escapeHtml(normalised || 'code')}</span>${COPY_BTN_HTML}</div>`;
        return `<div data-block-type="code" data-block-id="${blockId}" data-code="${encodedCode}" data-lang="${escapeHtml(normalised)}" class="fence-block">${header}<pre><code class="hljs">${highlighted}</code></pre></div>`;
      }
    }
  };

  renderer.link = function (this: unknown, token: Tokens.Link) {
    const { href, title, tokens } = token;
    const text =
      this && typeof (this as Record<string, unknown>).parser === 'object'
        ? (
            this as { parser: { parseInline: (t: Tokens.Link['tokens']) => string } }
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
                this as { parser: { parseInline: (t: Tokens.TableCell['tokens']) => string } }
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
              this && typeof (this as Record<string, unknown>).parser === 'object'
                ? (
                    this as { parser: { parseInline: (t: Tokens.TableCell['tokens']) => string } }
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

const markedOptions: MarkedOptions = {
  gfm: true,
  breaks: true,
  renderer: createRenderer(),
};

marked.setOptions(markedOptions);

const renderCache = new Map<string, string>();

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

    const raw = marked.parse(text, { async: false }) as string;
    const clean = sanitise(raw);
    cacheRef.current.set(key, clean);
    return clean;
  }, []);

  const renderAsync = useCallback(async (text: string, cacheKey?: string): Promise<string> => {
    if (!text) return '';
    const key = cacheKey ?? text;
    const cached = cacheRef.current.get(key);
    if (cached) return cached;

    const fenceRegex = /^```(\w+)\s*$/gm;
    let match: RegExpExecArray | null;
    const langs: string[] = [];
    while ((match = fenceRegex.exec(text)) !== null) {
      langs.push(match[1]);
    }
    await Promise.all(langs.map((l) => ensureLanguage(l)));

    const raw = await marked.parse(text);
    const clean = sanitise(raw);
    cacheRef.current.set(key, clean);
    return clean;
  }, []);

  const clearCache = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  return useMemo(() => ({ render, renderAsync, clearCache }), [render, renderAsync, clearCache]);
}
