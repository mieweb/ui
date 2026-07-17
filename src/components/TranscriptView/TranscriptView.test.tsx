import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

import { TranscriptView, formatTimestampMs } from './TranscriptView';
import type { Transcript } from './transcript';

// jsdom does not implement scrollIntoView
beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

const segmentTranscript: Transcript = {
  durationMs: 6600,
  speakers: [
    { id: 'spk_0', name: 'Clinician' },
    { id: 'spk_1', name: 'Patient' },
  ],
  words: [
    { text: 'Good', startMs: 0, endMs: 400, speakerId: 'spk_0' },
    { text: 'morning', startMs: 400, endMs: 900, speakerId: 'spk_0' },
    { text: 'better', startMs: 3400, endMs: 4000, speakerId: 'spk_1' },
  ],
  segments: [
    { text: 'Good morning', startMs: 0, endMs: 900, speakerId: 'spk_0', words: [] },
    { text: 'Feeling better', startMs: 3400, endMs: 4000, speakerId: 'spk_1', words: [] },
  ],
};

const wordTranscript: Transcript = {
  durationMs: 1500,
  words: [
    { text: 'The', startMs: 0, endMs: 300 },
    { text: 'quick', startMs: 300, endMs: 700 },
    { text: 'fox', startMs: 700, endMs: 1500 },
  ],
};

describe('formatTimestampMs', () => {
  it('formats milliseconds as m:ss with zero-padded seconds', () => {
    expect(formatTimestampMs(0)).toBe('0:00');
    expect(formatTimestampMs(5000)).toBe('0:05');
    expect(formatTimestampMs(65000)).toBe('1:05');
    expect(formatTimestampMs(600000)).toBe('10:00');
  });
});

describe('TranscriptView', () => {
  it('defaults to segment granularity when segments exist', () => {
    render(<TranscriptView transcript={segmentTranscript} />);
    expect(screen.getByRole('list')).toBeInTheDocument();
    expect(screen.getByText('Good morning')).toBeInTheDocument();
    expect(screen.getByText('Feeling better')).toBeInTheDocument();
  });

  it('resolves speaker labels from transcript.speakers', () => {
    render(<TranscriptView transcript={segmentTranscript} />);
    expect(screen.getByText('Clinician:')).toBeInTheDocument();
    expect(screen.getByText('Patient:')).toBeInTheDocument();
  });

  it('applies speakerLabels overrides', () => {
    render(
      <TranscriptView
        transcript={segmentTranscript}
        speakerLabels={{ spk_0: 'Doctor', spk_1: 'Patient A' }}
      />
    );
    expect(screen.getByText('Doctor:')).toBeInTheDocument();
    expect(screen.getByText('Patient A:')).toBeInTheDocument();
  });

  it('merges consecutive same-speaker segments when mergeSameSpeaker is set', () => {
    const merged: Transcript = {
      durationMs: 2000,
      speakers: [{ id: 'spk_0', name: 'Clinician' }],
      words: [],
      segments: [
        { text: 'Hello', startMs: 0, endMs: 500, speakerId: 'spk_0', words: [] },
        { text: 'there', startMs: 500, endMs: 1000, speakerId: 'spk_0', words: [] },
      ],
    };
    render(<TranscriptView transcript={merged} mergeSameSpeaker />);
    expect(screen.getByText('Hello there')).toBeInTheDocument();
  });

  it('shows timestamps by default and hides them when showTimestamps is false', () => {
    const { rerender } = render(<TranscriptView transcript={segmentTranscript} />);
    expect(screen.getByText('0:00')).toBeInTheDocument();

    rerender(<TranscriptView transcript={segmentTranscript} showTimestamps={false} />);
    expect(screen.queryByText('0:00')).not.toBeInTheDocument();
  });

  it('calls onSeek with the segment start time when a row is clicked', () => {
    const onSeek = vi.fn();
    render(<TranscriptView transcript={segmentTranscript} onSeek={onSeek} />);
    fireEvent.click(screen.getByText('Feeling better'));
    expect(onSeek).toHaveBeenCalledWith(3400);
  });

  it('renders word granularity and seeks on word click', () => {
    const onSeek = vi.fn();
    render(<TranscriptView transcript={wordTranscript} granularity="word" onSeek={onSeek} />);
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('quick'));
    expect(onSeek).toHaveBeenCalledWith(300);
  });

  it('marks the active item with aria-current based on currentTimeMs', () => {
    render(
      <TranscriptView transcript={wordTranscript} granularity="word" currentTimeMs={400} />
    );
    const active = screen.getByText('quick').closest('[data-transcript-index]');
    expect(active).toHaveAttribute('aria-current', 'true');
  });

  it('activates on Enter/Space keyboard press', () => {
    const onSeek = vi.fn();
    render(<TranscriptView transcript={wordTranscript} granularity="word" onSeek={onSeek} />);
    const word = screen.getByText('fox');
    fireEvent.keyDown(word, { key: 'Enter' });
    expect(onSeek).toHaveBeenCalledWith(700);
  });

  it('renders host-supplied actions', () => {
    render(
      <TranscriptView
        transcript={segmentTranscript}
        actions={<button type="button">Copy</button>}
      />
    );
    expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument();
  });

  it('uses a custom aria-label for the transcript container', () => {
    render(<TranscriptView transcript={segmentTranscript} aria-label="Visit notes" />);
    expect(screen.getByLabelText('Visit notes')).toBeInTheDocument();
  });
});
