import * as React from 'react';
import { cn } from '../../utils/cn';

/**
 * The Kerebron surface, loaded the first time it renders. It brings the
 * editor (ProseMirror, the Kerebron kits): imported statically by anything
 * the main entry exports, it would ride into every app bundle that imports
 * anything from `@mieweb/ui`, including apps that never render it.
 *
 * Every component in the main entry that renders the surface uses this one
 * lazy component, so it loads once, and a test suite that preloads it
 * (`loadTextareaSurface` in src/test/test-utils) preloads it for all of them.
 * Internal: not exported from the package.
 */
export const TextAreaRichKerebronLazy = React.lazy(() =>
  import('./TextAreaRichKerebron').then((module) => ({
    default: module.TextAreaRichKerebron,
  }))
);

/**
 * Contains a surface that failed: Suspense only covers the pending import,
 * and React.lazy throws a failed one (a dropped connection, or chunk names a
 * new deploy replaced) on render. Without a boundary that error would unmount
 * the host app; with it, the field shows `fallback` instead. React keeps a
 * failed lazy import, so the fallback stays until the page reloads.
 */
export class TextAreaRichLoadBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export interface TextAreaRichLoadingFrameProps {
  /** The surface's frame classes, so the stand-in matches it. */
  className?: string;
  /** How tall the empty editor will be, inside the frame's borders. */
  minHeight: string;
}

/**
 * The surface's empty frame, drawn while it loads so nothing below the field
 * moves when the editor arrives. The height sits inside the frame, its
 * borders outside it.
 */
export function TextAreaRichLoadingFrame({
  className,
  minHeight,
}: TextAreaRichLoadingFrameProps) {
  return (
    <div
      data-slot="textarea-rich-loading"
      aria-hidden="true"
      className={cn('border-input rounded-lg border', className)}
    >
      <div style={{ minHeight }} />
    </div>
  );
}
