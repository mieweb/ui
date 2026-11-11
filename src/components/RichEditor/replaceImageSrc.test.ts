import { describe, it, expect, vi } from 'vitest';
import { replaceImageSrc } from './insertMediaFiles';

/**
 * A minimal ProseMirror view stand-in: one paragraph holding image nodes.
 * `replaceImageSrc` only touches `state.schema.nodes.image`, `doc.descendants`,
 * `doc.nodeAt`, `tr.setNodeMarkup`, and `dispatch` (mieweb/ui#735).
 */
function fakeView(images: Array<Record<string, unknown>>) {
  const nodes = images.map((attrs, i) => ({
    type: { name: 'image' },
    attrs,
    pos: i + 1,
  }));
  const dispatch = vi.fn();
  const setNodeMarkup = vi.fn(
    (pos: number, _type: unknown, attrs: unknown) => ({
      pos,
      attrs,
    })
  );
  const view = {
    state: {
      schema: { nodes: { image: {} } },
      doc: {
        descendants: (
          fn: (node: unknown, pos: number) => boolean | undefined
        ) => {
          for (const n of nodes) if (fn(n, n.pos) === false) return;
        },
        nodeAt: (pos: number) => nodes.find((n) => n.pos === pos) ?? null,
      },
      tr: { setNodeMarkup },
    },
    dispatch,
  } as unknown as Parameters<typeof replaceImageSrc>[0];
  return { view, dispatch, setNodeMarkup, nodes };
}

const png = (name = 'annotated.png') =>
  new File(['fake-bytes'], name, { type: 'image/png' });

describe('replaceImageSrc', () => {
  it('uploads through uploadHandler and rewrites the matching node src', async () => {
    const { view, dispatch, setNodeMarkup } = fakeView([
      { src: 'blob:old', alt: 'shot.png' },
    ]);
    const uploadHandler = vi.fn().mockResolvedValue('https://cdn/new.png');

    const ok = await replaceImageSrc(view, 'blob:old', png(), {
      uploadHandler,
    });

    expect(ok).toBe(true);
    expect(uploadHandler).toHaveBeenCalledOnce();
    expect(setNodeMarkup).toHaveBeenCalledWith(1, undefined, {
      src: 'https://cdn/new.png',
      alt: 'shot.png', // other attrs survive the swap
    });
    expect(dispatch).toHaveBeenCalledOnce();
  });

  it('embeds as a base64 data URL without an uploadHandler, like insertion does', async () => {
    const { view, setNodeMarkup } = fakeView([{ src: 'blob:old' }]);

    const ok = await replaceImageSrc(view, 'blob:old', png(), {});

    expect(ok).toBe(true);
    expect(setNodeMarkup).toHaveBeenCalledWith(1, undefined, {
      src: expect.stringMatching(/^data:image\/png;base64,/) as string,
    });
  });

  it('reports false when the image left the document mid-upload', async () => {
    const { view, dispatch } = fakeView([{ src: 'blob:other' }]);

    const ok = await replaceImageSrc(view, 'blob:gone', png(), {});

    expect(ok).toBe(false);
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('reports false for files failing type or size validation', async () => {
    const { view, dispatch } = fakeView([{ src: 'blob:old' }]);
    const pdf = new File(['x'], 'doc.pdf', { type: 'application/pdf' });
    const oversize = png();
    Object.defineProperty(oversize, 'size', { value: 11 * 1024 * 1024 });

    expect(await replaceImageSrc(view, 'blob:old', pdf, {})).toBe(false);
    expect(await replaceImageSrc(view, 'blob:old', oversize, {})).toBe(false);
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('reports false instead of throwing when the upload rejects', async () => {
    const { view, dispatch } = fakeView([{ src: 'blob:old' }]);
    const uploadHandler = vi.fn().mockRejectedValue(new Error('offline'));

    const ok = await replaceImageSrc(view, 'blob:old', png(), {
      uploadHandler,
    });

    expect(ok).toBe(false);
    expect(dispatch).not.toHaveBeenCalled();
  });
});
