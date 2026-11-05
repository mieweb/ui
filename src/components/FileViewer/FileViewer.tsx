/**
 * FileViewer — read-only view of a text file, chosen by its name: Markdown
 * renders as a document, other known file types as one syntax-highlighted
 * code block, and very large files as plain text so the page stays responsive.
 */

import * as React from 'react';
import { cn } from '../../utils/cn';
import '../Markdown/styles.css';
import { createCodePlugin } from '../SuperChat/plugins/code';
import { createMarkdownRenderer } from '../SuperChat/render/createMarkdownRenderer';
import {
  FILE_VIEWER_HIGHLIGHT_LIMIT,
  fileViewLanguage,
  isMarkdownPath,
  toCodeFence,
} from './fileView';

// ============================================================================
// Labels
// ============================================================================

/** Every user-facing string the viewer renders. */
export interface FileViewerLabels {
  /** Accessible name of the scrollable view, e.g. "Preview of notes.md". */
  region: (path: string) => string;
  /** Shown instead of the view when the file has no content. */
  empty: string;
}

export const defaultFileViewerLabels: FileViewerLabels = {
  region: (path) => `Preview of ${path}`,
  empty: 'This file is empty.',
};

// ============================================================================
// Rendering
// ============================================================================

/**
 * Renders Markdown into React nodes. `key` is stable per file, so a renderer
 * can use it as a cache key.
 */
export type FileViewerRenderMarkdown = (
  markdown: string,
  key: string
) => React.ReactNode;

let defaultRenderer: ReturnType<typeof createMarkdownRenderer> | undefined;

/** The SuperChat Markdown renderer with its code plugin, built on first use. */
const renderMarkdownDefault: FileViewerRenderMarkdown = (markdown, key) => {
  defaultRenderer ??= createMarkdownRenderer({ plugins: [createCodePlugin()] });
  return defaultRenderer(markdown, {
    messageId: key,
    streaming: false,
    role: 'assistant',
  });
};

// ============================================================================
// Component
// ============================================================================

export interface FileViewerProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'children'
> {
  /** The file's path or name; its extension picks Markdown, code or plain text. */
  path: string;
  /** The file's text. */
  text: string;
  /** Above this many characters, text renders unhighlighted. Defaults to 200,000. */
  highlightLimit?: number;
  /**
   * Replaces the built-in Markdown renderer (SuperChat's renderer with the
   * code plugin), for example to add Mermaid or math plugins. Code files are
   * passed through it too, as one fenced block.
   */
  renderMarkdown?: FileViewerRenderMarkdown;
  /** Overrides for the English default strings. */
  labels?: Partial<FileViewerLabels>;
}

/**
 * A text file as a reader sees it. The view is a focusable, labelled region so
 * keyboard users can scroll long files.
 */
export const FileViewer = React.forwardRef<HTMLDivElement, FileViewerProps>(
  (
    {
      path,
      text,
      highlightLimit = FILE_VIEWER_HIGHLIGHT_LIMIT,
      renderMarkdown = renderMarkdownDefault,
      labels: labelOverrides,
      className,
      ...rest
    },
    ref
  ) => {
    const labels = { ...defaultFileViewerLabels, ...labelOverrides };

    if (!text) {
      return (
        <div
          ref={ref}
          data-slot="file-viewer-empty"
          className={cn('text-muted-foreground text-sm', className)}
          {...rest}
        >
          {labels.empty}
        </div>
      );
    }

    const markdown = isMarkdownPath(path);
    let body: React.ReactNode;
    if (text.length > highlightLimit) {
      body = (
        <pre
          data-slot="file-viewer-plain"
          className="m-0 font-mono text-xs whitespace-pre"
        >
          {text}
        </pre>
      );
    } else if (markdown) {
      body = renderMarkdown(text, path);
    } else {
      body = renderMarkdown(toCodeFence(text, fileViewLanguage(path)), path);
    }

    return (
      <div
        ref={ref}
        role="region"
        aria-label={labels.region(path)}
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- the scrollable view needs keyboard focus
        tabIndex={0}
        // Code reads left to right even on an RTL page; prose follows its own text.
        dir={markdown ? 'auto' : 'ltr'}
        data-slot="file-viewer"
        className={cn(
          'border-border min-h-0 overflow-auto rounded-md border p-3 text-sm',
          'focus-visible:ring-primary-500 focus-visible:ring-2 focus-visible:outline-none',
          className
        )}
        {...rest}
      >
        {body}
      </div>
    );
  }
);

FileViewer.displayName = 'FileViewer';
