/**
 * A send that fails puts the message back in its own conversation only, and
 * is reported: SuperChatInbox reuses one panel (and composer) for every
 * conversation, so a send can fail after the reader moved on.
 */
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SuperChat, type SuperChatProps } from './SuperChat';
import type { SuperChatConversation } from './types';

const participants: SuperChatConversation['participants'] = [
  { id: 'me', kind: 'human', name: 'Me' },
  { id: 'peer', kind: 'human', name: 'Peer' },
];
const first: SuperChatConversation = {
  id: 'first',
  title: 'First',
  participants,
  thread: [],
};
const second: SuperChatConversation = {
  ...first,
  id: 'second',
  title: 'Second',
};

/** A send the test settles by hand. */
function pendingSend() {
  let fail: (error: Error) => void = () => {};
  const onMessageSent = vi.fn(
    () => new Promise<void>((_, reject) => (fail = reject))
  );
  return { onMessageSent, fail: (error: Error) => fail(error) };
}

async function sendWithFile(
  props: Pick<SuperChatProps, 'onMessageSent' | 'onComposerError'>
) {
  const user = userEvent.setup();
  const view = render(
    <SuperChat conversation={first} currentParticipantId="me" {...props} />
  );
  await user.upload(
    view.container.querySelector<HTMLInputElement>('input[type="file"]')!,
    new File(['png'], 'shot.png', { type: 'image/png' })
  );
  await user.type(screen.getByLabelText('Message'), 'See this');
  await user.click(screen.getByRole('button', { name: 'Send message' }));
  await waitFor(() => expect(props.onMessageSent).toHaveBeenCalled());
  const show = (conversation: SuperChatConversation) =>
    view.rerender(
      <SuperChat
        conversation={conversation}
        currentParticipantId="me"
        {...props}
      />
    );
  return { ...view, show };
}

describe('a failed send', () => {
  it('stays out of another conversation shown meanwhile', async () => {
    const { onMessageSent, fail } = pendingSend();
    const { show } = await sendWithFile({ onMessageSent });
    show(second);
    await act(async () => fail(new Error('offline')));
    expect(screen.queryByLabelText('Remove shot.png')).toBeNull();
    expect(screen.getByLabelText('Message')).toHaveValue('');
  });

  it('shows only its own conversation as sending', async () => {
    const { onMessageSent } = pendingSend();
    const { show } = await sendWithFile({ onMessageSent });
    expect(
      screen.getByRole('button', { name: 'Sending message…' })
    ).toBeInTheDocument();
    show(second);
    expect(
      screen.queryByRole('button', { name: 'Sending message…' })
    ).toBeNull();
    show(first);
    expect(
      screen.getByRole('button', { name: 'Sending message…' })
    ).toBeInTheDocument();
  });

  it('keeps a conversation sending while another one sends too', async () => {
    const settle: Array<() => void> = [];
    const onMessageSent = vi.fn(
      () => new Promise<void>((resolve) => settle.push(resolve))
    );
    const user = userEvent.setup();
    const { show } = await sendWithFile({ onMessageSent });
    show(second);
    await user.type(screen.getByLabelText('Message'), 'Over here');
    await user.click(screen.getByRole('button', { name: 'Send message' }));
    await waitFor(() => expect(onMessageSent).toHaveBeenCalledTimes(2));
    show(first);
    expect(
      screen.getByRole('button', { name: 'Sending message…' })
    ).toBeInTheDocument();
    // The second send settling leaves the first one still going.
    await act(async () => settle[1]());
    expect(
      screen.getByRole('button', { name: 'Sending message…' })
    ).toBeInTheDocument();
    await act(async () => settle[0]());
    expect(
      screen.queryByRole('button', { name: 'Sending message…' })
    ).toBeNull();
  });

  it('is put back and reported to onComposerError', async () => {
    const { onMessageSent, fail } = pendingSend();
    const onComposerError = vi.fn();
    await sendWithFile({ onMessageSent, onComposerError });
    await act(async () => fail(new Error('offline')));
    expect(await screen.findByLabelText('Remove shot.png')).toBeTruthy();
    expect(screen.getByLabelText('Message')).toHaveValue('See this');
    expect(onComposerError).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ reason: 'send-failed' })
    );
  });
});
