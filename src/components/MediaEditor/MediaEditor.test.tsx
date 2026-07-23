import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
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
