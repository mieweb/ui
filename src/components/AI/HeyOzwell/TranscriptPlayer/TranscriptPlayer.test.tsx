import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
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
) => {
  const result = render(
    <TranscriptPlayer
      src="visit.wav"
      transcript={transcript}
      peaks={peaks}
      {...props}
    />
  );
  audio = document.querySelector('audio');
  return result;
};

const lane = (name: string) =>
  screen.getByRole('group', { name: `${name} speaking turns` });

describe('TranscriptPlayer', () => {
  it('hides segment details on Escape', async () => {
    renderPlayer();
    act(() => within(lane('Patient')).getByRole('button').focus());
    expect(screen.getByText('0:02 – 0:05 (2.5s)')).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByText('0:02 – 0:05 (2.5s)')).not.toBeInTheDocument();
  });

  it('survives a missing duration and keeps a paused keyboard seek on screen', async () => {
    renderPlayer({
      transcript: {
        ...transcript,
        durationMs: Number.NaN,
        segments: [
          ...(transcript.segments ?? []),
          {
            text: 'Much later.',
            startMs: 3_590_000,
            endMs: 3_600_000,
            speakerId: 'doc',
            words: [],
          },
        ],
      },
    });
    const windowSlider = screen.getByRole('slider', {
      name: 'Visible part of the recording',
    });
    expect(windowSlider).toHaveAttribute('aria-valuetext', '0:00 to 5:00');
    screen.getByRole('slider', { name: 'Seek' }).focus();
    await userEvent.keyboard('{End}');
    expect(windowSlider).toHaveAttribute('aria-valuetext', '55:00 to 1:00:00');
  });

  it('marks the visible line active when an overlapping line is hidden', async () => {
    renderPlayer({
      transcript: {
        durationMs: 10000,
        speakers: transcript.speakers,
        words: [],
        segments: [
          {
            text: 'Long answer',
            startMs: 0,
            endMs: 8000,
            speakerId: 'doc',
            words: [],
          },
          {
            text: 'Mm-hm',
            startMs: 4000,
            endMs: 6000,
            speakerId: 'pt',
            words: [],
          },
        ],
      },
    });
    await userEvent.click(screen.getByRole('checkbox', { name: 'Patient' }));
    screen.getByRole('slider', { name: 'Seek' }).focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(
      screen.getByText('Long answer').closest('[role="listitem"]')
    ).toHaveAttribute('aria-current', 'true');
  });

  it('closes a stale segment tooltip when the activity changes', async () => {
    const { rerender } = renderPlayer();
    await userEvent.hover(within(lane('Patient')).getByRole('button'));
    expect(screen.getByText('0:02 – 0:05 (2.5s)')).toBeInTheDocument();
    rerender(
      <TranscriptPlayer
        src="visit.wav"
        transcript={{
          ...transcript,
          speakerActivity: [{ speakerId: 'pt', startMs: 3000, endMs: 5000 }],
        }}
        peaks={peaks}
      />
    );
    expect(screen.queryByText('0:02 – 0:05 (2.5s)')).not.toBeInTheDocument();
  });

  it('stops following playback when the reader scrolls the transcript away', async () => {
    renderPlayer();
    await userEvent.click(
      screen.getByRole('button', { name: 'Play Dr. Smith at 0:06' })
    );
    // Past the window in which scroll events are the list's own follow-along.
    vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 1000);
    fireEvent.scroll(screen.getByRole('list', { name: 'Transcript' }));
    expect(
      screen.getByRole('button', { name: 'Back to current' })
    ).toBeInTheDocument();
  });

  it('keeps the clock in sync from timeupdate when animation frames are paused', async () => {
    vi.stubGlobal('requestAnimationFrame', () => 0);
    renderPlayer();
    await userEvent.click(screen.getByRole('button', { name: 'Play' }));
    act(() => {
      if (audio) audio.currentTime = 7.4;
      audio?.dispatchEvent(new Event('timeupdate'));
    });
    expect(screen.getByRole('slider', { name: 'Seek' })).toHaveAttribute(
      'aria-valuetext',
      '0:07 of 0:10'
    );
  });

  it('filters to the unknown speaker and shows it as the selection', async () => {
    renderPlayer({
      transcript: {
        ...transcript,
        segments: [
          ...(transcript.segments ?? []),
          { text: 'Mm-hm.', startMs: 9200, endMs: 9600, words: [] },
        ],
      },
    });
    await userEvent.click(
      screen.getByRole('combobox', { name: 'Show speakers' })
    );
    await userEvent.click(
      screen.getByRole('option', { name: 'Unknown speaker' })
    );
    expect(
      screen.getByRole('combobox', { name: 'Show speakers' })
    ).toHaveTextContent('Unknown speaker');
    expect(screen.getByText('Mm-hm.')).toBeInTheDocument();
    expect(screen.queryByText('Let me look.')).not.toBeInTheDocument();
  });

  it('makes the page behind a fullscreen player inert and exits on Escape without the Fullscreen API', async () => {
    render(
      <>
        <button type="button">Host control</button>
        <TranscriptPlayer
          src="visit.wav"
          transcript={transcript}
          peaks={peaks}
        />
      </>
    );
    const host = screen.getByRole('button', { name: 'Host control' });
    await userEvent.click(screen.getByRole('button', { name: 'Full screen' }));
    expect(host).toHaveAttribute('inert');

    await userEvent.keyboard('{Escape}');
    expect(host).not.toHaveAttribute('inert');
    expect(screen.getByRole('button', { name: 'Full screen' })).toHaveFocus();
  });

  it('stops interval playback on timeupdate when animation frames are paused', async () => {
    vi.stubGlobal('requestAnimationFrame', () => 0);
    renderPlayer();
    await userEvent.click(within(lane('Patient')).getByRole('button'));
    act(() => {
      if (audio) audio.currentTime = 5.2;
      audio?.dispatchEvent(new Event('timeupdate'));
    });
    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalled();
    expect(audio?.currentTime).toBe(5);
  });

  it('pauses from a playing line and keeps the main button usable after a refused play', async () => {
    renderPlayer();
    const line = screen.getByRole('button', { name: 'Play Dr. Smith at 0:06' });
    await userEvent.click(line);
    expect(line).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(line);
    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalled();
    expect(
      screen.getByRole('button', { name: 'Play Dr. Smith at 0:06' })
    ).toHaveAttribute('aria-pressed', 'false');

    // A playing lane segment pauses on a second press too.
    const segment = within(lane('Patient')).getByRole('button');
    await userEvent.click(segment);
    expect(segment).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(segment);
    expect(segment).toHaveAttribute('aria-pressed', 'false');

    vi.mocked(HTMLMediaElement.prototype.play).mockRejectedValueOnce(
      Object.assign(new Error('blocked'), { name: 'NotAllowedError' })
    );
    await userEvent.click(screen.getByRole('button', { name: 'Play' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Playback failed.'
    );
    const main = screen.getByRole('button', { name: 'Play' });
    expect(main).toBeEnabled();
    await userEvent.click(main);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('formats durations through labels', async () => {
    renderPlayer({ labels: { formatDuration: (s) => `${s.toFixed(1)} s` } });
    await userEvent.hover(within(lane('Patient')).getByRole('button'));
    expect(screen.getByText('0:02 – 0:05 (2.5 s)')).toBeInTheDocument();
  });

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
