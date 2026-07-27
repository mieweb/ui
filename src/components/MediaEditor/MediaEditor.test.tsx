import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

import { MediaEditor } from './MediaEditor';
import type { Transcript } from '../TranscriptView/transcript';

// jsdom does not implement media playback or scrollIntoView
beforeAll(() => {
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(
    async () => {}
  );
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
  Element.prototype.scrollIntoView = vi.fn();
});

const transcript: Transcript = {
  durationMs: 2000,
  words: [
    { text: 'Hello', startMs: 0, endMs: 500 },
    { text: 'brave', startMs: 500, endMs: 1000 },
    { text: 'world', startMs: 1000, endMs: 2000 },
  ],
};

describe('MediaEditor', () => {
  it('renders the media player and the transcript words', () => {
    render(<MediaEditor src="clip.mp3" kind="audio" transcript={transcript} />);

    expect(screen.getByLabelText('Media player')).toBeInTheDocument();
    expect(
      screen.getByRole('listbox', { name: 'Transcript words' })
    ).toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('brave')).toBeInTheDocument();
    expect(screen.getByText('world')).toBeInTheDocument();
  });

  it('renders each word as a listbox option', () => {
    render(<MediaEditor src="clip.mp3" kind="audio" transcript={transcript} />);
    // Three spoken words, no gaps => no silence pseudo-words.
    expect(screen.getAllByRole('option')).toHaveLength(3);
  });

  it('emits the initial edited timeline via onEditedWordsRender', () => {
    const onEditedWordsRender = vi.fn();
    render(
      <MediaEditor
        src="clip.mp3"
        kind="audio"
        transcript={transcript}
        onEditedWordsRender={onEditedWordsRender}
      />
    );
    expect(onEditedWordsRender).toHaveBeenCalled();
    const [words] = onEditedWordsRender.mock.calls[0];
    expect(words).toHaveLength(3);
  });

  it('infers audio kind from the src extension when kind is omitted', () => {
    render(<MediaEditor src="clip.mp3" transcript={transcript} />);
    expect(screen.getByLabelText('Media player').tagName).toBe('AUDIO');
  });
});

// Regression suite: dragging used to cancel on mouseleave and the selection
// stopped following once the pointer left the pane (no document tracking)
describe('MediaEditor drag selection beyond the pane', () => {
  it('keeps extending the selection while the pointer is outside the pane', () => {
    render(<MediaEditor src="clip.mp3" kind="audio" transcript={transcript} />);
    const options = screen.getAllByRole('option');

    // jsdom has no layout (all rects are zero-size); give the pane a real
    // shape so the visible-area clamping has something to clamp into
    const listbox = screen.getByRole('listbox', { name: 'Transcript words' });
    vi.spyOn(listbox, 'getBoundingClientRect').mockReturnValue({
      top: 0,
      bottom: 400,
      left: 0,
      right: 600,
      width: 600,
      height: 400,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as unknown as ReturnType<Element['getBoundingClientRect']>);

    fireEvent.mouseDown(options[0], { button: 0, clientX: 10, clientY: 10 });

    // Pointer far below the pane: document-level tracking clamps the point
    // back inside and resolves the word under it via elementFromPoint
    const originalFromPoint = document.elementFromPoint;
    document.elementFromPoint = vi.fn().mockReturnValue(options[2]);
    try {
      fireEvent.mouseMove(document, { clientX: 10, clientY: 999, buttons: 1 });

      expect(options[0]).toHaveAttribute('aria-selected', 'true');
      expect(options[1]).toHaveAttribute('aria-selected', 'true');
      expect(options[2]).toHaveAttribute('aria-selected', 'true');

      // Releasing ends the drag: later movement must not shrink the selection
      fireEvent.mouseUp(document);
      document.elementFromPoint = vi.fn().mockReturnValue(options[1]);
      fireEvent.mouseMove(document, { clientX: 10, clientY: 10, buttons: 1 });
      expect(options[2]).toHaveAttribute('aria-selected', 'true');
    } finally {
      document.elementFromPoint = originalFromPoint;
    }
  });

  it('does not cancel the drag when the pointer leaves the listbox', () => {
    render(<MediaEditor src="clip.mp3" kind="audio" transcript={transcript} />);
    const options = screen.getAllByRole('option');
    const listbox = screen.getByRole('listbox', { name: 'Transcript words' });

    fireEvent.mouseDown(options[0], { button: 0, clientX: 10, clientY: 10 });
    fireEvent.mouseLeave(listbox);
    fireEvent.mouseEnter(options[1]);

    expect(options[0]).toHaveAttribute('aria-selected', 'true');
    expect(options[1]).toHaveAttribute('aria-selected', 'true');

    fireEvent.mouseUp(document);
  });
});
