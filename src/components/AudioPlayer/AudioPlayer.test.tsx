import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

import { AudioPlayer } from './AudioPlayer';

// jsdom does not implement media playback
beforeAll(() => {
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(
    async () => {}
  );
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
});

/** jsdom does not cascade dir → direction; set both (see useDirection.test). */
function setRtl(element: HTMLElement) {
  element.setAttribute('dir', 'rtl');
  element.style.direction = 'rtl';
}

/** Compact player with a known duration and an initialized audio element. */
function renderCompact() {
  const { container } = render(
    <AudioPlayer
      src="clip.mp3"
      variant="compact"
      preload
      fallbackDuration={100}
    />
  );
  const progress = screen.getByRole('slider', { name: 'Audio progress' });
  return { container, progress };
}

function mockProgressRect(progress: HTMLElement) {
  vi.spyOn(progress, 'getBoundingClientRect').mockReturnValue({
    top: 0,
    bottom: 6,
    left: 0,
    right: 200,
    width: 200,
    height: 6,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  } as ReturnType<HTMLElement['getBoundingClientRect']>);
}

describe('AudioPlayer compact progress bar', () => {
  it('positions the thumb with inset-inline-start', () => {
    const { container } = renderCompact();
    const thumb = container.querySelector<HTMLElement>(
      '[data-slot="audio-player-progress-thumb"]'
    );
    expect(thumb?.style.insetInlineStart).toBe('calc(0% - 6px)');
  });

  describe('keyboard seeking', () => {
    it('seeks forward on ArrowRight and back on ArrowLeft in LTR', () => {
      const { progress } = renderCompact();

      fireEvent.keyDown(progress, { key: 'ArrowRight' });
      expect(progress).toHaveAttribute('aria-valuenow', '5');
      fireEvent.keyDown(progress, { key: 'ArrowLeft' });
      expect(progress).toHaveAttribute('aria-valuenow', '0');
    });

    it('inverts ArrowRight/ArrowLeft under RTL', () => {
      const { progress } = renderCompact();
      setRtl(progress);

      fireEvent.keyDown(progress, { key: 'ArrowLeft' });
      expect(progress).toHaveAttribute('aria-valuenow', '5');
      fireEvent.keyDown(progress, { key: 'ArrowRight' });
      expect(progress).toHaveAttribute('aria-valuenow', '0');
    });
  });

  describe('click seeking', () => {
    it('maps clientX from the left edge in LTR', () => {
      const { progress } = renderCompact();
      mockProgressRect(progress);

      fireEvent.click(progress, { clientX: 50 });
      expect(progress).toHaveAttribute('aria-valuenow', '25');
    });

    it('maps clientX from the right edge in RTL', () => {
      const { progress } = renderCompact();
      setRtl(progress);
      mockProgressRect(progress);

      fireEvent.click(progress, { clientX: 50 });
      expect(progress).toHaveAttribute('aria-valuenow', '75');
    });
  });
});

describe('AudioPlayer waveform', () => {
  it('renders the waveform as an explicit LTR island', () => {
    const { container } = render(
      <AudioPlayer src="clip.mp3" variant="waveform" />
    );
    const waveform = container.querySelector(
      '[data-slot="audio-player-waveform"]'
    );
    expect(waveform).toHaveAttribute('dir', 'ltr');
  });
});
