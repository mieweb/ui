import { describe, expect, it } from 'vitest';
import {
  createEmailPreview,
  findInlineAttachment,
  referencedAttachments,
} from './emailPreview';

const attachments = [
  {
    id: 'image',
    ref: 'protected:1',
    filename: 'image.png',
    mediaType: 'image/png',
    size: 68,
    disposition: 'inline',
    cid: '<logo@example.test>',
    contentLocation: 'images/logo.png',
  },
];

describe('protected email preview', () => {
  it('matches CID and Content-Location without selecting remote URLs', () => {
    expect(
      findInlineAttachment('cid:logo%40example.test', attachments)?.id
    ).toBe('image');
    expect(findInlineAttachment('images/logo.png', attachments)?.id).toBe(
      'image'
    );
    expect(
      findInlineAttachment('https://outside.test/logo.png', attachments)
    ).toBeUndefined();
    expect(
      referencedAttachments(
        '<img src="cid:logo@example.test"><video poster="images/logo.png"></video>',
        attachments
      )
    ).toEqual(attachments);
  });

  it('blocks every unleased URL, script, form, srcset, frame, and active link', () => {
    const preview = createEmailPreview(
      '<img src="cid:logo@example.test" srcset="https://outside.test/2x 2x"><img src="data:image/png;base64,AAAA"><video src="https://outside.test/movie" autoplay></video><a href="https://outside.test" ping="https://outside.test/ping">Link</a><iframe src="https://outside.test"></iframe><form action="https://outside.test"><input></form><script>bad()</script>',
      attachments,
      new Map([['image', 'blob:leased-image']])
    );
    expect(preview).toContain('src="blob:leased-image"');
    expect(preview).not.toContain('https://outside.test');
    expect(preview).not.toContain('data:image');
    expect(preview).not.toContain('srcset');
    expect(preview).not.toContain('autoplay');
    expect(preview).not.toContain('<script');
    expect(preview).not.toContain('<iframe');
    expect(preview).not.toContain('<form');
    expect(preview).not.toContain('href=');
    expect(preview).toContain("connect-src 'none'");
  });
});
