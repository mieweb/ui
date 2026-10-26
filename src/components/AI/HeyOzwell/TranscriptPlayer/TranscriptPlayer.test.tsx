import { act, cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Transcript } from '../../../TranscriptView/transcript';
import { TranscriptPlayer } from './TranscriptPlayer';

const transcript: Transcript = {
  durationMs: 10000,
  speakers: [
    { id: 'doc', name: 'Dr. Smith' },
    { id: 'pt', name: 'Patient' },
  ],
  words: [],
  segments: [
    {
      text: 'How is the knee?',
      startMs: 0,
      endMs: 2000,
      speakerId: 'doc',
      words: [],
    },
    {
      text: 'Better but sore.',
      startMs: 2500,
      endMs: 5000,
      speakerId: 'pt',
      words: [],
      overlapSpeakerIds: ['doc'],
    },
    {
      text: 'Let me look.',
      startMs: 6000,
      endMs: 9000,
      speakerId: 'doc',
      words: [],
    },
  ],
  speakerActivity: [
    { speakerId: 'doc', startMs: 0, endMs: 2000 },
    { speakerId: 'pt', startMs: 2500, endMs: 5000 },
    { speakerId: 'doc', startMs: 4500, endMs: 9000 },
  ],
};
const peaks = { data: new Float32Array(10).fill(0.5), perSecond: 1 };

let audio: HTMLMediaElement | null = null;
const remember = (element: HTMLMediaElement) => {
  audio = element;
};
const times = new WeakMap<HTMLMediaElement, number>();

beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(function (
    this: HTMLMediaElement
  ) {
    this.dispatchEvent(new Event('play'));
    return Promise.resolve();
  });
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(function (
    this: HTMLMediaElement
  ) {
    this.dispatchEvent(new Event('pause'));
  });
  vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
  Object.defineProperty(HTMLMediaElement.prototype, 'currentTime', {
    configurable: true,
    get(this: HTMLMediaElement) {
      return times.get(this) ?? 0;
    },
    set(this: HTMLMediaElement, value: number) {
      times.set(this, value);
    },
  });
  // The player creates its audio element off-DOM; keep a handle to the latest one.
  Object.defineProperty(HTMLMediaElement.prototype, 'src', {
    configurable: true,
    get(this: HTMLMediaElement) {
      return this.getAttribute('src') ?? '';
    },
    set(this: HTMLMediaElement, value: string) {
      remember(this);
      this.setAttribute('src', value);
    },
  });
  vi.stubGlobal('requestAnimationFrame', (cb: (time: number) => void) =>
    window.setTimeout(() => cb(performance.now()), 16)
  );
  vi.stubGlobal('cancelAnimationFrame', (id: number) =>
    window.clearTimeout(id)
  );
});

afterEach(() => {
  // Unmount while the media mocks are still installed; the player pauses and unloads on cleanup.
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  audio = null;
});

const renderPlayer = (
  props: Partial<Parameters<typeof TranscriptPlayer>[0]> = {}
) =>
  render(
    <TranscriptPlayer
      src="visit.wav"
      transcript={transcript}
      peaks={peaks}
      {...props}
    />
  );

const lane = (name: string) =>
  screen.getByRole('group', { name: `${name} speaking turns` });

describe('TranscriptPlayer', () => {
  it('shows segment details on hover without starting playback', async () => {
    renderPlayer();
    const segment = within(lane('Patient')).getByRole('button');
    await userEvent.hover(segment);
    expect(screen.getByText('0:02 – 0:05 (2.5s)')).toBeInTheDocument();
    expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
  });

  it('plays only the clicked segment and pauses at its end', async () => {
    renderPlayer();
    const segment = within(lane('Patient')).getByRole('button');
    await userEvent.click(segment);

    expect(audio?.currentTime).toBe(2.5);
    expect(segment).toHaveAttribute('aria-pressed', 'true');

    await act(async () => {
      if (audio) audio.currentTime = 5.1;
      await new Promise((r) => setTimeout(r, 40));
    });
    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalled();
    expect(audio?.currentTime).toBe(5);
    expect(segment).toHaveAttribute('aria-pressed', 'false');
  });

  it('keeps overlapping speech on both lanes', () => {
    renderPlayer();
    expect(within(lane('Dr. Smith')).getAllByRole('button')).toHaveLength(2);
    expect(within(lane('Patient')).getAllByRole('button')).toHaveLength(1);
    expect(
      screen.getByText(/shares can add up to more than 100%/)
    ).toBeInTheDocument();
    expect(screen.getByText('Overlaps Dr. Smith')).toBeInTheDocument();
  });

  it('uses translated labels', () => {
    renderPlayer({
      labels: {
        play: 'Reproducir',
        speakingTurns: (speaker) => `Turnos de ${speaker}`,
      },
    });
    expect(
      screen.getByRole('button', { name: 'Reproducir' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('group', { name: 'Turnos de Patient' })
    ).toBeInTheDocument();
  });

  it('plays a transcript line from its own play button', async () => {
    renderPlayer();
    await userEvent.click(
      screen.getByRole('button', { name: 'Play Dr. Smith at 0:06' })
    );
    expect(audio?.currentTime).toBe(6);
  });

  it('hides a speaker from the lanes and transcript', async () => {
    renderPlayer();
    await userEvent.click(screen.getByRole('checkbox', { name: 'Patient' }));
    expect(
      screen.queryByRole('group', { name: 'Patient speaking turns' })
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Better but sore.')).not.toBeInTheDocument();
    expect(screen.getByText('Let me look.')).toBeInTheDocument();
  });

  it('filters the transcript by search', async () => {
    renderPlayer();
    await userEvent.type(screen.getByLabelText('Search transcript'), 'knee');
    expect(
      within(screen.getByRole('list', { name: 'Transcript' })).getAllByRole(
        'listitem'
      )
    ).toHaveLength(1);
    expect(screen.getByText('knee').tagName).toBe('MARK');
  });

  it('opens long recordings on a window that zooms and pans', async () => {
    renderPlayer({ transcript: { ...transcript, durationMs: 3_600_000 } });
    const windowSlider = screen.getByRole('slider', {
      name: 'Visible part of the recording',
    });
    expect(windowSlider).toHaveAttribute('aria-valuetext', '0:00 to 5:00');

    await userEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
    expect(windowSlider).toHaveAttribute('aria-valuetext', '0:00 to 2:30');

    await userEvent.click(screen.getByRole('button', { name: 'Later' }));
    expect(windowSlider).toHaveAttribute('aria-valuetext', '2:30 to 5:00');
    expect(
      screen.getByRole('button', { name: 'Follow playback' })
    ).toHaveAttribute('aria-pressed', 'false');
  });

  it('seeks with the keyboard and moves between segments with arrow keys', async () => {
    renderPlayer();
    await userEvent.click(screen.getByRole('button', { name: 'Play' }));
    const seek = screen.getByRole('slider', { name: 'Seek' });
    seek.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(audio?.currentTime).toBe(5);

    const [first, second] = within(lane('Dr. Smith')).getAllByRole('button');
    act(() => first.focus());
    await userEvent.keyboard('{ArrowRight}');
    expect(second).toHaveFocus();
    // Let the tooltip's hide delay settle inside act.
    await act(() => new Promise((r) => setTimeout(r, 200)));
  });

  it('reports audio that fails to load and keeps the transcript readable', () => {
    renderPlayer();
    act(() => {
      audio?.dispatchEvent(new Event('error'));
    });
    expect(screen.getByRole('alert')).toHaveTextContent(
      'The recording could not be loaded.'
    );
    expect(screen.getByRole('button', { name: 'Play' })).toBeDisabled();
    expect(screen.getByText('How is the knee?')).toBeInTheDocument();
  });

  it('handles an empty transcript and resets search when the recording changes', async () => {
    const { rerender } = renderPlayer();
    await userEvent.type(screen.getByLabelText('Search transcript'), 'zzz');
    expect(
      screen.getByText('No lines match the search or speaker filter.')
    ).toBeInTheDocument();

    rerender(
      <TranscriptPlayer
        src="other.wav"
        transcript={{ durationMs: 0, words: [] }}
        peaks={peaks}
      />
    );
    expect(screen.getByLabelText('Search transcript')).toHaveValue('');
    expect(
      screen.getByText('No transcript for this recording.')
    ).toBeInTheDocument();
    expect(screen.getByText('No speaker activity.')).toBeInTheDocument();
  });
});
