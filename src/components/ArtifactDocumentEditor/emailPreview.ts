import DOMPurify from 'dompurify';
import type { DocumentAttachment } from '@kerebron/documents';

function contentId(value: string): string {
  const id = value.replace(/^cid:/i, '').replace(/^<|>$/g, '');
  try {
    return decodeURIComponent(id);
  } catch {
    return id;
  }
}

/** Only MIME-part references are resolved; outside URLs remain unfetched. */
export function findInlineAttachment(
  source: string,
  attachments: readonly DocumentAttachment[]
): DocumentAttachment | undefined {
  return attachments.find((attachment) =>
    /^cid:/i.test(source)
      ? Boolean(
          attachment.cid && contentId(attachment.cid) === contentId(source)
        )
      : attachment.contentLocation === source
  );
}

export function referencedAttachments(
  html: string,
  attachments: readonly DocumentAttachment[]
): DocumentAttachment[] {
  // A template stays inert while inspecting source, including image URLs.
  const template = document.createElement('template');
  template.innerHTML = html;
  const ids = new Set<string>();
  for (const element of template.content.querySelectorAll('[src], [poster]')) {
    for (const attribute of ['src', 'poster']) {
      const source = element.getAttribute(attribute);
      if (!source) continue;
      const attachment = findInlineAttachment(source, attachments);
      if (attachment) ids.add(attachment.id);
    }
  }
  return attachments.filter((attachment) => ids.has(attachment.id));
}

/**
 * A second boundary behind sanitization: scriptless sandbox + restrictive CSP.
 * Only this view's leased blob URLs can load, including CSS-backed media.
 */
export function createEmailPreview(
  html: string,
  attachments: readonly DocumentAttachment[],
  urls: ReadonlyMap<string, string>,
  direction: 'ltr' | 'rtl' = 'ltr'
): string {
  const sanitized = DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: [
      'script',
      'iframe',
      'object',
      'embed',
      'form',
      'input',
      'button',
      'textarea',
      'select',
      'link',
      'base',
      'meta',
    ],
    FORBID_ATTR: ['srcset', 'autoplay'],
    ADD_TAGS: ['video', 'audio', 'source'],
    ADD_ATTR: ['controls', 'poster'],
  });
  const template = document.createElement('template');
  template.innerHTML = sanitized;
  for (const element of template.content.querySelectorAll('[src], [poster]')) {
    for (const attribute of ['src', 'poster']) {
      const source = element.getAttribute(attribute);
      if (!source) continue;
      const attachment = findInlineAttachment(source, attachments);
      const url = attachment && urls.get(attachment.id);
      if (url?.startsWith('blob:')) element.setAttribute(attribute, url);
      else element.removeAttribute(attribute);
    }
  }
  for (const media of template.content.querySelectorAll('video, audio')) {
    media.setAttribute('controls', '');
    media.setAttribute('preload', 'metadata');
  }
  // Link activation is left to a future authorized host navigation seam.
  for (const link of template.content.querySelectorAll('a[href]')) {
    link.removeAttribute('href');
    link.removeAttribute('target');
    link.removeAttribute('ping');
  }
  return `<!doctype html><html dir="${direction}"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'none'; object-src 'none'; img-src blob:; media-src blob:; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; connect-src 'none'; font-src 'none'; frame-src 'none'"><meta name="referrer" content="no-referrer"><style>body{font-family:system-ui,sans-serif;overflow-wrap:anywhere;margin:0;padding:1rem}img,video{max-width:100%;height:auto}table{max-width:100%}</style></head><body>${template.innerHTML}</body></html>`;
}
