/**
 * How a text file is shown when it is not being edited: Markdown renders as a
 * document, other known file types as one syntax-highlighted code block.
 */

/** Above this many characters the viewer skips highlighting and shows plain text. */
export const FILE_VIEWER_HIGHLIGHT_LIMIT = 200_000;

const MARKDOWN_EXTENSIONS = new Set(['md', 'markdown']);

/** Extension → highlight.js language from rehype-highlight's default (`common`) set. */
const LANGUAGE_BY_EXTENSION: Record<string, string> = {
  ts: 'typescript',
  tsx: 'typescript',
  mts: 'typescript',
  cts: 'typescript',
  js: 'javascript',
  jsx: 'javascript',
  mjs: 'javascript',
  cjs: 'javascript',
  json: 'json',
  jsonc: 'json',
  py: 'python',
  sh: 'bash',
  bash: 'bash',
  zsh: 'bash',
  yml: 'yaml',
  yaml: 'yaml',
  css: 'css',
  scss: 'scss',
  less: 'less',
  html: 'xml',
  htm: 'xml',
  xml: 'xml',
  svg: 'xml',
  sql: 'sql',
  go: 'go',
  rs: 'rust',
  rb: 'ruby',
  java: 'java',
  kt: 'kotlin',
  c: 'c',
  h: 'c',
  cpp: 'cpp',
  cc: 'cpp',
  hpp: 'cpp',
  cs: 'csharp',
  php: 'php',
  swift: 'swift',
  lua: 'lua',
  r: 'r',
  ini: 'ini',
  toml: 'ini',
  cfg: 'ini',
  diff: 'diff',
  patch: 'diff',
  graphql: 'graphql',
  gql: 'graphql',
};

const LANGUAGE_BY_FILENAME: Record<string, string> = {
  makefile: 'makefile',
};

function fileName(path: string): string {
  return path.slice(path.lastIndexOf('/') + 1).toLowerCase();
}

function extension(path: string): string {
  const name = fileName(path);
  const dot = name.lastIndexOf('.');
  return dot > 0 ? name.slice(dot + 1) : '';
}

/** Whether a path names a Markdown file (`.md`, `.markdown`). */
export function isMarkdownPath(path: string): boolean {
  return MARKDOWN_EXTENSIONS.has(extension(path));
}

/** The highlight language for a path, or `undefined` to show it as plain text. */
export function fileViewLanguage(path: string): string | undefined {
  return (
    LANGUAGE_BY_FILENAME[fileName(path)] ??
    LANGUAGE_BY_EXTENSION[extension(path)]
  );
}

/**
 * Wrap text in a Markdown code fence. The fence is longer than any backtick
 * run inside the text, so a file that itself contains fences can't close it early.
 */
export function toCodeFence(text: string, language?: string): string {
  const longestRun = (text.match(/`+/g) ?? []).reduce(
    (max, run) => Math.max(max, run.length),
    0
  );
  const fence = '`'.repeat(Math.max(3, longestRun + 1));
  const body = text.endsWith('\n') ? text.slice(0, -1) : text;
  return `${fence}${language ?? ''}\n${body}\n${fence}`;
}
