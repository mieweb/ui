/**
 * Text file viewing for `@mieweb/ui`, imported from
 * `@mieweb/ui/components/FileViewer`. It renders Markdown with the SuperChat
 * renderer, so it needs the same optional peers (`react-markdown`,
 * `remark-gfm`, `rehype-sanitize`, `rehype-highlight`) and is not part of the
 * main entry. Code colours come from `@mieweb/ui/markdown.css`.
 */

export {
  FileViewer,
  defaultFileViewerLabels,
  type FileViewerLabels,
  type FileViewerProps,
  type FileViewerRenderMarkdown,
} from './FileViewer';

export {
  FileDocument,
  defaultFileDocumentLabels,
  type FileDocumentLabels,
  type FileDocumentMode,
  type FileDocumentProps,
} from './FileDocument';

export {
  FILE_VIEWER_HIGHLIGHT_LIMIT,
  fileViewLanguage,
  isMarkdownPath,
  toCodeFence,
} from './fileView';
