'use client';

/**
 * RichEditor with a docked capture ribbon: Capture image, Capture screen
 * (still), Attach file, Scan document — every capture lands in the document
 * as an image/video node at the cursor, through `RichEditorHandle.insertFiles`
 * and the editor's `mediaUpload` pipeline. Promoted from the ChatComposer
 * Action Ribbon POC (mieweb/ui#733, epic mieweb/ui#728).
 *
 * Working name pending stakeholder sign-off — keep references localized to
 * this directory and the kerebron entry so a rename stays one small PR.
 */
import * as React from 'react';
import {
  RichEditor,
  type RichEditorHandle,
  type RichEditorProps,
} from '../RichEditor';
import { CaptureDock, type MediaCaptureOptions } from './CaptureDock';

export interface RichMediaCaptureEditorProps
  extends RichEditorProps, MediaCaptureOptions {}

/**
 * Captures that cannot land as an image/video node are out of scope here:
 * the markdown schema has no audio node, and dictation into a ProseMirror
 * document is a different model (see mieweb/ui#728 for both).
 */
export const RichMediaCaptureEditor = React.forwardRef<
  RichEditorHandle,
  RichMediaCaptureEditorProps
>(function RichMediaCaptureEditor(
  { scanDocument, extraCaptures, ...editorProps },
  ref
) {
  const editorRef = React.useRef<RichEditorHandle>(null);
  const locked = Boolean(editorProps.disabled || editorProps.readOnly);

  React.useImperativeHandle(
    ref,
    () => ({
      getContent: () => editorRef.current!.getContent(),
      focus: () => editorRef.current?.focus(),
      insertFiles: (files: File[]) => editorRef.current!.insertFiles!(files),
      replaceImage: (src: string, file: File) =>
        editorRef.current!.replaceImage!(src, file),
    }),
    []
  );

  return (
    <CaptureDock
      locked={locked}
      insertFiles={(files) => editorRef.current?.insertFiles?.(files)}
      replaceImage={(src, file) => editorRef.current?.replaceImage?.(src, file)}
      scanDocument={scanDocument}
      extraCaptures={extraCaptures}
    >
      <RichEditor ref={editorRef} {...editorProps} />
    </CaptureDock>
  );
});
