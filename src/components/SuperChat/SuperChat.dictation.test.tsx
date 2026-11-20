import * as React from 'react';
import { describe, it, expect, vi } from 'vitest';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { SuperChat } from './SuperChat';
import type { SuperChatConversation } from './types';

const mounts = { count: 0 };

// Stand-in for the recorder: one click delivers a transcript (no mic in jsdom).
vi.mock('../DictationButton', () => ({
  DictationButton: ({ onText }: { onText: (text: string) => void }) => {
    React.useEffect(() => {
      mounts.count += 1;
    }, []);
    return (
      <button type="button" onClick={() => onText('dictated words')}>
        Start dictation
      </button>
    );
  },
}));

function convo(id = 'c1'): SuperChatConversation {
  return {
    id,
    title: 'Chat',
    participants: [{ id: 'me', kind: 'human', name: 'Me' }],
    thread: [],
  };
}

const input = () => screen.getByRole('textbox', { name: 'Message' });
const dictate = () =>
  fireEvent.click(screen.getByRole('button', { name: 'Start dictation' }));

describe('SuperChat dictation', () => {
  it('fills an empty draft without sending', () => {
    const onMessageSent = vi.fn();
    render(
      <SuperChat
        conversation={convo()}
        currentParticipantId="me"
        dictation
        onMessageSent={onMessageSent}
      />
    );
    dictate();
    expect(input()).toHaveValue('dictated words');
    expect(onMessageSent).not.toHaveBeenCalled();
  });

  it('appends to typed text and keeps trailing line breaks', () => {
    render(
      <SuperChat conversation={convo()} currentParticipantId="me" dictation />
    );
    fireEvent.change(input(), { target: { value: 'Hello' } });
    dictate();
    expect(input()).toHaveValue('Hello dictated words');

    fireEvent.change(input(), { target: { value: 'Para one.\n\n' } });
    dictate();
    expect(input()).toHaveValue('Para one.\n\ndictated words');
  });

  it('sends the edited dictated draft through onMessageSent', async () => {
    const onMessageSent = vi.fn();
    render(
      <SuperChat
        conversation={convo()}
        currentParticipantId="me"
        dictation
        onMessageSent={onMessageSent}
      />
    );
    dictate();
    fireEvent.change(input(), { target: { value: 'dictated words, edited' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
    await waitFor(() =>
      expect(onMessageSent).toHaveBeenCalledWith(
        'dictated words, edited',
        expect.anything()
      )
    );
  });

  it('is hidden when read-only and remounts on conversation change', () => {
    const { rerender } = render(
      <SuperChat conversation={convo()} currentParticipantId="me" dictation />
    );
    const before = mounts.count;
    rerender(
      <SuperChat
        conversation={convo('c2')}
        currentParticipantId="me"
        dictation
      />
    );
    expect(mounts.count).toBe(before + 1);

    rerender(
      <SuperChat
        conversation={convo('c2')}
        currentParticipantId="me"
        dictation
        readOnly
      />
    );
    expect(
      screen.queryByRole('button', { name: 'Start dictation' })
    ).not.toBeInTheDocument();
  });

  it('keeps dictated text when an older send fails', async () => {
    let reject!: (error: Error) => void;
    const onMessageSent = vi.fn(
      () => new Promise<void>((_resolve, rej) => (reject = rej))
    );
    render(
      <SuperChat
        conversation={convo()}
        currentParticipantId="me"
        dictation
        onMessageSent={onMessageSent}
      />
    );
    fireEvent.change(input(), { target: { value: 'first' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
    await waitFor(() => expect(onMessageSent).toHaveBeenCalled());
    dictate();
    await act(async () => {
      reject(new Error('network'));
    });
    expect(input()).toHaveValue('dictated words');
  });
});
