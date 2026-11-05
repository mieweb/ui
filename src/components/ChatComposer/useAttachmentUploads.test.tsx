import { describe, it, expect, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import {
  useAttachmentUploads,
  type AttachmentUploadContext,
} from './useAttachmentUploads';

/** An upload the test settles by hand, keeping each call's context. */
function fakeUpload() {
  const calls: {
    file: File;
    ctx: AttachmentUploadContext;
    resolve: (value: { id: string }) => void;
    reject: (error: Error) => void;
  }[] = [];
  const upload = vi.fn(
    (file: File, ctx: AttachmentUploadContext) =>
      new Promise<{ id: string }>((resolve, reject) => {
        calls.push({ file, ctx, resolve, reject });
      })
  );
  return { upload, calls };
}

const clip = () => new File(['x'], 'clip.mp4', { type: 'video/mp4' });

describe('useAttachmentUploads', () => {
  it('starts uploading as soon as a file is added', () => {
    const { upload } = fakeUpload();
    const { result } = renderHook(() => useAttachmentUploads({ upload }));
    const file = clip();
    act(() => void result.current.add([file]));
    expect(upload).toHaveBeenCalledTimes(1);
    expect(upload.mock.calls[0][0]).toBe(file);
    expect(result.current.items[0].state).toBe('uploading');
  });

  it('stages files as pending without an upload function', () => {
    const { result } = renderHook(() => useAttachmentUploads());
    act(() => void result.current.add([clip()]));
    expect(result.current.items[0].state).toBe('pending');
  });

  it('shows processing after the last byte, then uploaded with its result', async () => {
    const { upload, calls } = fakeUpload();
    const { result } = renderHook(() => useAttachmentUploads({ upload }));
    act(() => void result.current.add([clip()]));
    act(() => calls[0].ctx.onProgress(0.42));
    expect(result.current.items[0]).toMatchObject({
      state: 'uploading',
      progress: 0.42,
    });
    act(() => calls[0].ctx.onProgress(1));
    expect(result.current.items[0].state).toBe('processing');
    await act(async () => calls[0].resolve({ id: 'm1' }));
    expect(result.current.items[0]).toMatchObject({
      state: 'uploaded',
      result: { id: 'm1' },
    });
  });

  it('aborts an upload in flight when it is removed, without discarding', () => {
    const { upload, calls } = fakeUpload();
    const discard = vi.fn();
    const { result } = renderHook(() =>
      useAttachmentUploads({ upload, discard })
    );
    act(() => void result.current.add([clip()]));
    act(() => result.current.remove(result.current.items[0].id));
    expect(calls[0].ctx.signal.aborted).toBe(true);
    expect(result.current.items).toEqual([]);
    expect(discard).not.toHaveBeenCalled();
  });

  it('discards a finished upload when it is removed', async () => {
    const { upload, calls } = fakeUpload();
    const discard = vi.fn();
    const { result } = renderHook(() =>
      useAttachmentUploads({ upload, discard })
    );
    const file = clip();
    act(() => void result.current.add([file]));
    await act(async () => calls[0].resolve({ id: 'm1' }));
    await act(async () => result.current.remove(result.current.items[0].id));
    expect(discard).toHaveBeenCalledWith({ id: 'm1' }, file);
  });

  it('retries a failed upload with a fresh signal', async () => {
    const { upload, calls } = fakeUpload();
    const { result } = renderHook(() => useAttachmentUploads({ upload }));
    act(() => void result.current.add([clip()]));
    await act(async () => calls[0].reject(new Error('offline')));
    expect(result.current.items[0]).toMatchObject({
      state: 'failed',
      error: 'offline',
    });
    act(() => result.current.retry(result.current.items[0].id));
    expect(upload).toHaveBeenCalledTimes(2);
    expect(calls[1].ctx.signal.aborted).toBe(false);
    expect(result.current.items[0].state).toBe('uploading');
  });

  it('settle waits for uploads in flight and splits successes from failures', async () => {
    const { upload, calls } = fakeUpload();
    const { result } = renderHook(() => useAttachmentUploads({ upload }));
    act(() => void result.current.add([clip(), clip()]));
    let settled: Awaited<ReturnType<typeof result.current.settle>> | undefined;
    const waiting = result.current.settle().then((s) => (settled = s));
    await act(async () => calls[0].resolve({ id: 'm1' }));
    expect(settled).toBeUndefined();
    await act(async () => {
      calls[1].reject(new Error('too big'));
      await waiting;
    });
    expect(settled?.uploaded.map((item) => item.result)).toEqual([
      { id: 'm1' },
    ]);
    expect(settled?.failed.map((item) => item.error)).toEqual(['too big']);
  });

  it('take empties the list without discarding; clear discards', async () => {
    const { upload, calls } = fakeUpload();
    const discard = vi.fn();
    const { result } = renderHook(() =>
      useAttachmentUploads({ upload, discard })
    );
    act(() => void result.current.add([clip()]));
    await act(async () => calls[0].resolve({ id: 'm1' }));
    let taken: ReturnType<typeof result.current.take> = [];
    act(() => void (taken = result.current.take()));
    expect(taken.map((item) => item.result)).toEqual([{ id: 'm1' }]);
    expect(result.current.items).toEqual([]);
    expect(discard).not.toHaveBeenCalled();

    act(() => void result.current.add([clip()]));
    await act(async () => calls[1].resolve({ id: 'm2' }));
    await act(async () => result.current.clear());
    expect(discard).toHaveBeenCalledWith({ id: 'm2' }, expect.any(File));
  });

  it('aborts and discards everything on unmount', async () => {
    const { upload, calls } = fakeUpload();
    const discard = vi.fn();
    const { result, unmount } = renderHook(() =>
      useAttachmentUploads({ upload, discard })
    );
    act(() => void result.current.add([clip(), clip()]));
    await act(async () => calls[0].resolve({ id: 'm1' }));
    await act(async () => unmount());
    expect(calls[1].ctx.signal.aborted).toBe(true);
    expect(discard).toHaveBeenCalledWith({ id: 'm1' }, expect.any(File));
  });

  it('restore stages uploaded files without uploading them', () => {
    const { upload } = fakeUpload();
    const { result } = renderHook(() => useAttachmentUploads({ upload }));
    act(() => result.current.restore([{ file: clip(), result: { id: 'm1' } }]));
    expect(upload).not.toHaveBeenCalled();
    expect(result.current.items[0]).toMatchObject({
      state: 'uploaded',
      result: { id: 'm1' },
    });
  });
});
