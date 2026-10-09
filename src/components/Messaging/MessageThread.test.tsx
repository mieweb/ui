import * as React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { screen, fireEvent, waitFor, act } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import { MessageThread } from './MessageThread';
import type { Message, MessageParticipant } from './types';

const me: MessageParticipant = { id: 'u1', name: 'Alice', isCurrentUser: true };
const other: MessageParticipant = { id: 'u2', name: 'Bob' };

const messages: Message[] = [
  {
    id: 'm1',
    type: 'text',
    content: 'Hi Alice',
    sender: other,
    timestamp: new Date('2026-01-01T10:00:00Z'),
    status: 'read',
  },
];

function getInput() {
  // MessageComposer parity: same accessible name as before the swap.
  return screen.getByRole('textbox', { name: 'Message' });
}

afterEach(() => {
  vi.useRealTimers();
});

describe('MessageThread (ChatComposer integration)', () => {
  it('sends trimmed text through eventHandlers.onSendMessage and clears the draft', () => {
    const onSendMessage = vi.fn();
    renderWithTheme(
      <MessageThread
        messages={messages}
        currentUser={me}
        eventHandlers={{ onSendMessage }}
      />
    );

    const input = getInput();
    fireEvent.change(input, { target: { value: '  Hello Bob  ' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onSendMessage).toHaveBeenCalledWith(
      expect.objectContaining({ content: 'Hello Bob' })
    );
    expect(input).toHaveValue('');
  });

  it('restores the draft when onSendMessage rejects and reports onError', async () => {
    const onSendMessage = vi.fn(() => Promise.reject(new Error('offline')));
    const onError = vi.fn();
    renderWithTheme(
      <MessageThread
        messages={messages}
        currentUser={me}
        eventHandlers={{ onSendMessage }}
        onError={onError}
      />
    );

    const input = getInput();
    fireEvent.change(input, { target: { value: 'important note' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    // The composer clears optimistically; MessageThread restores the draft
    // on failure (MessageComposer parity — attachments are not restaged).
    await waitFor(() => expect(input).toHaveValue('important note'));
    // Same copy MessageComposer reported through onError.
    await waitFor(() =>
      expect(onError).toHaveBeenCalledWith(
        'Failed to send message',
        expect.objectContaining({ reason: 'send-failed' })
      )
    );
  });

  it('does not clobber newer input when a stale send fails', async () => {
    let reject!: (error: Error) => void;
    const onSendMessage = vi.fn(
      () =>
        new Promise<void>((_resolve, rej) => {
          reject = rej;
        })
    );
    renderWithTheme(
      <MessageThread
        messages={messages}
        currentUser={me}
        eventHandlers={{ onSendMessage }}
      />
    );

    const input = getInput();
    fireEvent.change(input, { target: { value: 'first draft' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    // User types a newer draft while the send is still pending.
    fireEvent.change(input, { target: { value: 'newer draft' } });

    await act(async () => {
      reject(new Error('offline'));
      await Promise.resolve();
    });

    expect(input).toHaveValue('newer draft');
  });

  it('emulates MessageComposer typing callbacks: start on input, stop on send', () => {
    const onTypingStart = vi.fn();
    const onTypingStop = vi.fn();
    renderWithTheme(
      <MessageThread
        messages={messages}
        currentUser={me}
        eventHandlers={{ onSendMessage: vi.fn(), onTypingStart, onTypingStop }}
      />
    );

    const input = getInput();
    fireEvent.change(input, { target: { value: 'ty' } });
    expect(onTypingStart).toHaveBeenCalledTimes(1);
    expect(onTypingStop).not.toHaveBeenCalled();

    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onTypingStop).toHaveBeenCalledTimes(1);
  });

  it('fires onTypingStop after 2s idle', () => {
    vi.useFakeTimers();
    const onTypingStart = vi.fn();
    const onTypingStop = vi.fn();
    renderWithTheme(
      <MessageThread
        messages={messages}
        currentUser={me}
        eventHandlers={{ onSendMessage: vi.fn(), onTypingStart, onTypingStop }}
      />
    );

    fireEvent.change(getInput(), { target: { value: 'still typing' } });
    expect(onTypingStart).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(onTypingStop).toHaveBeenCalledTimes(1);
  });

  it('applies MessageComposer attachment validation defaults', () => {
    const { container } = renderWithTheme(
      <MessageThread
        messages={messages}
        currentUser={me}
        eventHandlers={{ onSendMessage: vi.fn() }}
      />
    );

    // ChatComposer alone leaves `accept` unset; MessageThread supplies the
    // old MessageComposer defaults.
    const fileInput = container.querySelector('input[type="file"]');
    expect(fileInput).toHaveAttribute(
      'accept',
      'image/*,video/*,.pdf,.doc,.docx'
    );
  });

  it('hides the attach UI when showAttachmentPicker is false', () => {
    renderWithTheme(
      <MessageThread
        messages={messages}
        currentUser={me}
        eventHandlers={{ onSendMessage: vi.fn() }}
        showAttachmentPicker={false}
      />
    );

    expect(
      screen.queryByRole('button', { name: /add to message/i })
    ).not.toBeInTheDocument();
  });

  it('stages files dropped on the message list into the composer', () => {
    const { container } = renderWithTheme(
      <MessageThread
        messages={messages}
        currentUser={me}
        eventHandlers={{ onSendMessage: vi.fn() }}
      />
    );

    const list = container.querySelector('[data-slot="message-list"]');
    expect(list).not.toBeNull();
    // The thread-level DragDropZone is the wrapper around the message list.
    const dropZone = list!.parentElement!;
    const file = new File(['x'], 'photo.png', { type: 'image/png' });
    fireEvent.drop(dropZone, { dataTransfer: { files: [file] } });

    // The dropped file is staged as a composer attachment chip.
    expect(screen.getByText('photo.png')).toBeInTheDocument();
  });

  it('honors maxAttachments above 10 for list drops (no silent truncation)', () => {
    // Regression: the list-level DragDropZone's default maxFiles={10} used to
    // silently discard files before the composer's addFiles could see them.
    const { container } = renderWithTheme(
      <MessageThread
        messages={messages}
        currentUser={me}
        eventHandlers={{ onSendMessage: vi.fn() }}
        maxAttachments={12}
      />
    );

    const list = container.querySelector('[data-slot="message-list"]');
    const dropZone = list!.parentElement!;
    const files = Array.from(
      { length: 12 },
      (_, i) => new File(['x'], `file-${i}.png`, { type: 'image/png' })
    );
    fireEvent.drop(dropZone, { dataTransfer: { files } });

    // All 12 land as attachment chips — none are dropped by the wrapper.
    expect(screen.getByText('file-0.png')).toBeInTheDocument();
    expect(screen.getByText('file-11.png')).toBeInTheDocument();
  });

  it('renders a camera capture button that stages photos as attachments', () => {
    renderWithTheme(
      <MessageThread
        messages={messages}
        currentUser={me}
        eventHandlers={{ onSendMessage: vi.fn() }}
        showCameraButton
      />
    );

    const cameraInput = screen.getByLabelText('Take a photo', {
      selector: 'input',
    });
    const photo = new File(['x'], 'capture.png', { type: 'image/png' });
    fireEvent.change(cameraInput, { target: { files: [photo] } });

    expect(screen.getByText('capture.png')).toBeInTheDocument();
  });

  it('stages camera captures even when the attachment picker is disabled', () => {
    // Parity with the legacy composer: the camera path never depended on
    // showAttachmentPicker, which only gates the + menu / paste / drop.
    renderWithTheme(
      <MessageThread
        messages={messages}
        currentUser={me}
        eventHandlers={{ onSendMessage: vi.fn() }}
        showCameraButton
        showAttachmentPicker={false}
      />
    );

    const cameraInput = screen.getByLabelText('Take a photo', {
      selector: 'input',
    });
    const photo = new File(['x'], 'camera-only.png', { type: 'image/png' });
    fireEvent.change(cameraInput, { target: { files: [photo] } });

    expect(screen.getByText('camera-only.png')).toBeInTheDocument();
  });

  it('sends staged attachments with the message', () => {
    const onSendMessage = vi.fn();
    renderWithTheme(
      <MessageThread
        messages={messages}
        currentUser={me}
        eventHandlers={{ onSendMessage }}
        showCameraButton
      />
    );

    const cameraInput = screen.getByLabelText('Take a photo', {
      selector: 'input',
    });
    const photo = new File(['x'], 'capture.png', { type: 'image/png' });
    fireEvent.change(cameraInput, { target: { files: [photo] } });

    const input = getInput();
    fireEvent.change(input, { target: { value: 'see photo' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onSendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        content: 'see photo',
        attachments: [photo],
      })
    );
  });

  it('blocks sending while isSending', () => {
    const onSendMessage = vi.fn();
    renderWithTheme(
      <MessageThread
        messages={messages}
        currentUser={me}
        eventHandlers={{ onSendMessage }}
        isSending
      />
    );

    const input = getInput();
    fireEvent.change(input, { target: { value: 'queued' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onSendMessage).not.toHaveBeenCalled();
  });

  it('enforces maxMessageLength (default 1600) with the character counter', () => {
    const onSendMessage = vi.fn();
    renderWithTheme(
      <MessageThread
        messages={messages}
        currentUser={me}
        eventHandlers={{ onSendMessage }}
        maxMessageLength={5}
        showCharacterCount
      />
    );

    const input = getInput();
    fireEvent.change(input, { target: { value: 'Too long' } });
    expect(screen.getByText('8/5')).toBeInTheDocument();
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onSendMessage).not.toHaveBeenCalled();
  });
});
