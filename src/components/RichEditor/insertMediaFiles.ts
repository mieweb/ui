/**
 * Programmatic counterpart of `ExtensionMediaUpload`'s paste/drop handling
 * (mieweb/ui#733). The extension's handlers read real clipboard/drop events
 * and its internals are not exported, so `RichEditorHandle.insertFiles` goes
 * through this instead — same validation, same upload-or-embed pipeline, same
 * node insertion, minus the event plumbing. Keep the defaults below in sync
 * with `@kerebron/extension-basic-editor`'s `ExtensionMediaUpload`.
 */
import type { EditorView } from 'prosemirror-view';
import type { MediaUploadOptions } from './editorKits';

/**
 * The slice of the view this module touches — `CoreEditor.view` is a union of
 * `EditorView` and a headless stand-in, and both carry state + dispatch.
 */
type MediaInsertView = Pick<EditorView, 'state' | 'dispatch'>;

export interface InsertFilesResult {
  /** Files that became image/video nodes in the document. */
  inserted: File[];
  /** Files rejected by type (no image/video schema node) or size limit. */
  skipped: File[];
}

// ExtensionMediaUpload's defaults.
const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024; // images
const DEFAULT_MAX_VIDEO_FILE_SIZE = 50 * 1024 * 1024;
const DEFAULT_IMAGE_TYPES = ['^image/'];
const DEFAULT_VIDEO_TYPES = ['^video/'];

function matchesType(file: File, patterns: string[]): boolean {
  return patterns.some((pattern) => file.type.match(pattern));
}

function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new globalThis.FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Validate `files` against `options` and insert each image/video at the
 * current selection, exactly as a paste would: `uploadHandler` turns the file
 * into a URL; without one, images embed as base64 `data:` URLs and videos
 * become object URLs (unless `useObjectURLForVideos` is false). Files that
 * fail validation or upload are reported in `skipped`, never thrown.
 */
export async function insertMediaFiles(
  view: MediaInsertView,
  files: File[],
  options: MediaUploadOptions
): Promise<InsertFilesResult> {
  const {
    maxFileSize = DEFAULT_MAX_FILE_SIZE,
    maxVideoFileSize = DEFAULT_MAX_VIDEO_FILE_SIZE,
    allowedImageTypes = DEFAULT_IMAGE_TYPES,
    allowedVideoTypes = DEFAULT_VIDEO_TYPES,
    uploadHandler,
  } = options;

  const inserted: File[] = [];
  const skipped: File[] = [];
  let pos = view.state.selection.from;

  for (const file of files) {
    const isVideo = matchesType(file, allowedVideoTypes);
    const isImage = !isVideo && matchesType(file, allowedImageTypes);
    const nodeType = view.state.schema.nodes[isVideo ? 'video' : 'image'];

    if (
      (!isImage && !isVideo) ||
      !nodeType ||
      file.size > (isVideo ? maxVideoFileSize : maxFileSize)
    ) {
      skipped.push(file);
      continue;
    }

    try {
      let src: string;
      if (uploadHandler) {
        src = await uploadHandler(file);
      } else if (isVideo && options.useObjectURLForVideos !== false) {
        src = URL.createObjectURL(file);
      } else {
        src = await fileToDataURL(file);
      }
      const node = isVideo
        ? nodeType.create({ src, title: file.name, controls: true })
        : nodeType.create({ src, alt: file.name });
      // The document may have changed during the await (typing, collab).
      // Clamp so an edit can never turn a finished upload into a silent
      // failure; exact-position fidelity under concurrent edits would need
      // placeholder nodes mapped through transactions, which this
      // deliberately leaves to a future iteration (same trade-off as the
      // extension's own async paste path).
      const insertAt = Math.min(pos, view.state.doc.content.size);
      view.dispatch(view.state.tr.insert(insertAt, node));
      pos = insertAt + node.nodeSize;
      inserted.push(file);
    } catch {
      skipped.push(file);
    }
  }

  return { inserted, skipped };
}

/**
 * Swap the `src` of the image node currently showing `oldSrc` for `file`,
 * pushed through the same upload-or-embed pipeline as insertion — the
 * annotate flow's "save" (mieweb/ui#735). The node is located *after* the
 * upload resolves, so edits made while the upload was in flight cannot
 * misplace the swap; if the image was deleted meanwhile, the replace reports
 * `false` instead of inserting anything. Other attrs (alt, title) survive.
 */
export async function replaceImageSrc(
  view: MediaInsertView,
  oldSrc: string,
  file: File,
  options: MediaUploadOptions
): Promise<boolean> {
  const {
    maxFileSize = DEFAULT_MAX_FILE_SIZE,
    allowedImageTypes = DEFAULT_IMAGE_TYPES,
    uploadHandler,
  } = options;

  if (
    !matchesType(file, allowedImageTypes) ||
    file.size > maxFileSize ||
    !view.state.schema.nodes.image
  ) {
    return false;
  }

  try {
    const src = uploadHandler
      ? await uploadHandler(file)
      : await fileToDataURL(file);
    let found: number | null = null;
    view.state.doc.descendants((node, pos) => {
      if (
        found === null &&
        node.type.name === 'image' &&
        node.attrs.src === oldSrc
      ) {
        found = pos;
      }
      return found === null;
    });
    if (found === null) return false;
    const node = view.state.doc.nodeAt(found);
    if (!node) return false;
    view.dispatch(
      view.state.tr.setNodeMarkup(found, undefined, { ...node.attrs, src })
    );
    return true;
  } catch {
    return false;
  }
}
