/**
 * SuperChat image plugin (opt-in).
 *
 * Makes inline Markdown images (`![alt](url)`) click-to-zoom, reusing the
 * Messaging module's full-screen {@link LightboxModal}. The image `src`/`alt`
 * come from (untrusted) Markdown and are already protocol-restricted by
 * `rehype-sanitize`; this plugin only adds the zoom affordance.
 */

import * as React from 'react';
import { createPortal } from 'react-dom';
import { LightboxModal, type MessageAttachment } from '../../Messaging';
import { cn } from '../../../utils/cn';
import type { SuperChatRenderPlugin } from '../types';

function filenameFromUrl(url: string, alt?: string): string {
  if (alt && alt.trim()) return alt.trim();
  try {
    const path = new URL(url, 'http://localhost').pathname;
    const last = path.split('/').filter(Boolean).pop();
    return last || 'image';
  } catch {
    return 'image';
  }
}

function ZoomableImage({
  node: _node,
  ...props
}: React.ComponentProps<'img'> & { node?: unknown }) {
  const [open, setOpen] = React.useState(false);
  const src = typeof props.src === 'string' ? props.src : '';
  const alt = typeof props.alt === 'string' ? props.alt : '';

  const attachment: MessageAttachment | null = React.useMemo(() => {
    if (!src) return null;
    return {
      id: src,
      type: 'image',
      url: src,
      filename: filenameFromUrl(src, alt),
      size: 0,
      mimeType: 'image/*',
      state: 'uploaded',
      alt,
    };
  }, [src, alt]);

  if (!src) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={alt ? `View image: ${alt}` : 'View image'}
        className="focus-visible:ring-primary-500 my-2 inline-block cursor-zoom-in rounded-lg focus-visible:ring-2 focus-visible:outline-none"
      >
        <img
          {...props}
          alt={alt}
          className={cn(
            'max-h-80 max-w-full rounded-lg object-contain',
            props.className
          )}
        />
      </button>
      {open &&
        typeof document !== 'undefined' &&
        createPortal(
          <LightboxModal
            attachment={attachment}
            onClose={() => setOpen(false)}
          />,
          document.body
        )}
    </>
  );
}

/** Create the image (click-to-zoom lightbox) render plugin. */
export function createImagePlugin(): SuperChatRenderPlugin {
  return {
    name: 'image',
    components: {
      img: ZoomableImage as React.ComponentType<Record<string, unknown>>,
    },
  };
}
