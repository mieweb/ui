import { describe, it, expect, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { UploadAnnouncer } from './UploadAnnouncer';
import type { AttachmentUpload } from './useAttachmentUploads';

const labels = {
  uploading: (name: string) => `Uploading ${name}`,
  uploaded: (name: string) => `${name} uploaded`,
  failed: (name: string) => `${name} didn't upload`,
};
const item = (id: string, name: string, state: AttachmentUpload['state']) =>
  ({
    id,
    file: new File(['x'], name),
    type: 'file',
    state,
    progress: 0,
  }) as AttachmentUpload;

describe('UploadAnnouncer', () => {
  it('says several changes together, and a failure as an alert', () => {
    vi.useFakeTimers();
    const { rerender } = render(
      <UploadAnnouncer
        items={[
          item('1', 'a.mov', 'uploading'),
          item('2', 'b.mov', 'uploading'),
        ]}
        labels={labels}
      />
    );
    act(() => vi.advanceTimersByTime(60));
    expect(screen.getByRole('status').textContent).toBe(
      'Uploading a.mov. Uploading b.mov'
    );
    rerender(
      <UploadAnnouncer
        items={[item('1', 'a.mov', 'uploaded'), item('2', 'b.mov', 'failed')]}
        labels={labels}
      />
    );
    act(() => vi.advanceTimersByTime(60));
    expect(screen.getByRole('status').textContent).toBe('a.mov uploaded');
    expect(screen.getByRole('alert').textContent).toBe("b.mov didn't upload");
    vi.useRealTimers();
  });

  it('clears the alert once nothing has failed', () => {
    vi.useFakeTimers();
    const { rerender } = render(
      <UploadAnnouncer items={[item('1', 'a.mov', 'failed')]} labels={labels} />
    );
    act(() => vi.advanceTimersByTime(60));
    expect(screen.getByRole('alert').textContent).toBe("a.mov didn't upload");
    rerender(
      <UploadAnnouncer
        items={[item('1', 'a.mov', 'uploading')]}
        labels={labels}
      />
    );
    act(() => vi.advanceTimersByTime(60));
    expect(screen.getByRole('alert').textContent).toBe('');
    vi.useRealTimers();
  });
  it("isn't cut off by a progress update right after a change", () => {
    vi.useFakeTimers();
    const { rerender } = render(
      <UploadAnnouncer
        items={[item('1', 'a.mov', 'uploading')]}
        labels={labels}
      />
    );
    act(() => vi.advanceTimersByTime(20));
    // Same state, new objects: a progress-only re-render.
    rerender(
      <UploadAnnouncer
        items={[{ ...item('1', 'a.mov', 'uploading'), progress: 0.1 }]}
        labels={labels}
      />
    );
    act(() => vi.advanceTimersByTime(60));
    expect(screen.getByRole('status').textContent).toBe('Uploading a.mov');
    vi.useRealTimers();
  });

  it('drops what was queued for a file taken off before it was said', () => {
    vi.useFakeTimers();
    const { rerender } = render(
      <UploadAnnouncer
        items={[
          item('1', 'a.mov', 'uploading'),
          item('2', 'b.mov', 'uploading'),
        ]}
        labels={labels}
      />
    );
    rerender(
      <UploadAnnouncer
        items={[item('2', 'b.mov', 'uploading')]}
        labels={labels}
      />
    );
    act(() => vi.advanceTimersByTime(60));
    expect(screen.getByRole('status').textContent).toBe('Uploading b.mov');
    vi.useRealTimers();
  });
});
