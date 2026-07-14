import { describe, it, expect } from 'vitest';
import { stripStopPhrase } from './whisperTranscribe';

describe('stripStopPhrase', () => {
  it('strips the spoken stop phrase and its common mishearings off the tail', () => {
    expect(stripStopPhrase('schedule a follow up ozwell I’m done')).toBe(
      'schedule a follow up'
    );
    expect(stripStopPhrase('schedule a follow up all’s well')).toBe(
      'schedule a follow up'
    );
    // regression: "ozwell I'm done" misheard as "all was well" (ozwell→"all was", done→"well")
    expect(stripStopPhrase('schedule a follow up all was well')).toBe(
      'schedule a follow up'
    );
    expect(stripStopPhrase('note the plan all was well ozwell I am done')).toBe(
      'note the plan'
    );
  });

  it('does NOT strip legitimate trailing words that merely resemble the phrase', () => {
    expect(stripStopPhrase('the wound is healing well')).toBe(
      'the wound is healing well'
    );
    expect(stripStopPhrase('prescribe amoxicillin')).toBe(
      'prescribe amoxicillin'
    );
  });
});
