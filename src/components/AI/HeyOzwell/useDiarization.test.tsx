import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useDiarization, type ExperimentalDiarizer } from './useDiarization';

const { embed, identify, transcribeSegments, decodeTo16kMono, warmWhisper } =
  vi.hoisted(() => ({
    embed: vi.fn((window: Float32Array) =>
      Float32Array.from([window.length, 1])
    ),
    identify: vi.fn(() => null),
    transcribeSegments: vi.fn(),
    decodeTo16kMono: vi.fn(),
    warmWhisper: vi.fn(),
  }));

vi.mock('./SpeakerVerify/useSpeakerVerify', () => ({
  useSpeakerVerify: () => ({
    ready: true,
    embed,
    identify,
  }),
}));

vi.mock('../whisperTranscribe', () => ({
  transcribeSegments,
  decodeTo16kMono,
  warmWhisper,
}));

vi.mock('../ozwellChat', () => ({
  askOzwell: vi.fn(),
  isOzwellConfigured: () => false,
}));

describe('useDiarization experimental adapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    transcribeSegments.mockResolvedValue([
      { start: 0, end: 1.2, text: 'doctor starts' },
      { start: 1.2, end: 2.5, text: 'patient interrupts' },
    ]);
    decodeTo16kMono.mockResolvedValue(new Float32Array(16_000 * 3));
  });

  it('hydrates overlap-capable metadata from an experimental diarizer', async () => {
    const experimentalDiarizer: ExperimentalDiarizer = async ({
      segments,
      sampleRate,
    }) => {
      expect(sampleRate).toBe(16_000);
      expect(segments).toHaveLength(2);
      return [
        {
          speakerId: 'doctor',
          confidence: 0.95,
          speakerActivities: [
            { speakerId: 'doctor', start: 0, end: 1.2, confidence: 0.95 },
          ],
        },
        {
          speakerId: 'doctor',
          attribution: 'overlap',
          provisional: true,
          confidence: 0.62,
          speakerActivities: [
            { speakerId: 'doctor', start: 0.5, end: 3.5, confidence: 0.62 },
            { speakerId: '   ', start: 1.25, end: 2.4, confidence: 0.1 },
            { speakerId: 'patient', start: 1.3, end: 2.3, confidence: 0.58 },
          ],
        },
      ];
    };
    const { result } = renderHook(() =>
      useDiarization({ enabled: true, experimentalDiarizer })
    );

    let out = null as Awaited<ReturnType<typeof result.current.diarize>> | null;
    await act(async () => {
      out = await result.current.diarize(new Blob(['voice']));
    });

    expect(out).toHaveLength(2);
    expect(out?.[0]).toMatchObject({
      speaker: 'Speaker 1',
      speakerId: 'doctor',
      attribution: 'single',
      confidence: 0.95,
    });
    expect(out?.[1]).toMatchObject({
      speaker: 'Speaker 1',
      speakerId: 'doctor',
      attribution: 'overlap',
      provisional: true,
      confidence: 0.62,
    });
    expect(out?.[1].speakerActivities).toEqual([
      {
        speakerId: 'doctor',
        cluster: 0,
        speaker: 'Speaker 1',
        start: 1.2,
        end: 2.5,
        confidence: 0.62,
      },
      {
        speakerId: 'patient',
        cluster: 1,
        speaker: 'Speaker 2',
        start: 1.3,
        end: 2.3,
        confidence: 0.58,
      },
    ]);
  });
});
