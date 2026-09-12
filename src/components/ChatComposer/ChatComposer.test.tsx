import { describe, expect, it, vi } from 'vitest';
import * as React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import {
  ChatComposer,
  type ChatComposerHandle,
  type ChatComposerAgentOption,
} from './ChatComposer';

const agents: ChatComposerAgentOption[] = [
  { id: 'general', label: 'General assistant' },
  { id: 'coder', label: 'Code helper', description: 'Writes code' },
];

function getInput() {
  return screen.getByRole('textbox', { name: /message input/i });
}

describe('ChatComposer', () => {
  it('sends trimmed text on Enter and clears the input', () => {
    const onSend = vi.fn();
    renderWithTheme(<ChatComposer onSend={onSend} />);

    const input = getInput();
    fireEvent.change(input, { target: { value: '  Hello world  ' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onSend).toHaveBeenCalledWith({
      content: 'Hello world',
      attachments: [],
    });
    expect(input).toHaveValue('');
  });

  it('does not send on Shift+Enter', () => {
    const onSend = vi.fn();
    renderWithTheme(<ChatComposer onSend={onSend} />);

    const input = getInput();
    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: true });

    expect(onSend).not.toHaveBeenCalled();
  });

  it('disables the send button while empty and enables it with text', () => {
    renderWithTheme(<ChatComposer onSend={vi.fn()} />);

    const sendButton = screen.getByRole('button', { name: /send message/i });
    expect(sendButton).toBeDisabled();

    fireEvent.change(getInput(), { target: { value: 'Hi' } });
    expect(sendButton).toBeEnabled();
  });

  it('supports controlled value', () => {
    const onValueChange = vi.fn();
    renderWithTheme(
      <ChatComposer value="Controlled" onValueChange={onValueChange} />
    );

    const input = getInput();
    expect(input).toHaveValue('Controlled');

    fireEvent.change(input, { target: { value: 'Changed' } });
    expect(onValueChange).toHaveBeenCalledWith('Changed');
    // Still controlled by the prop.
    expect(input).toHaveValue('Controlled');
  });

  it('blocks sending while over maxLength and shows the counter', () => {
    const onSend = vi.fn();
    renderWithTheme(
      <ChatComposer onSend={onSend} maxLength={5} showCharacterCount />
    );

    const input = getInput();
    fireEvent.change(input, { target: { value: 'Too long' } });

    expect(screen.getByText('8/5')).toBeInTheDocument();
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onSend).not.toHaveBeenCalled();
  });

  it('opens the + menu with the built-in attach item and custom items', () => {
    const onSelect = vi.fn();
    renderWithTheme(
      <ChatComposer
        addMenuItems={[{ id: 'photo', label: 'Take photo', onSelect }]}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /add to message/i }));
    expect(screen.getByText('Attach files')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Take photo'));
    expect(onSelect).toHaveBeenCalled();
    // Selecting an item closes the menu.
    expect(screen.queryByText('Take photo')).not.toBeInTheDocument();
  });

  it('renders checked menu items as menuitemcheckbox', () => {
    renderWithTheme(
      <ChatComposer
        addMenuItems={[
          { id: 'web', label: 'Search web', checked: true },
          { id: 'think', label: 'Think longer', checked: false },
        ]}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /add to message/i }));
    expect(
      screen.getByRole('menuitemcheckbox', { name: /search web/i })
    ).toHaveAttribute('aria-checked', 'true');
    expect(
      screen.getByRole('menuitemcheckbox', { name: /think longer/i })
    ).toHaveAttribute('aria-checked', 'false');
  });

  it('hides the + menu entirely when attachments and menu items are absent', () => {
    renderWithTheme(<ChatComposer allowAttachments={false} />);

    expect(
      screen.queryByRole('button', { name: /add to message/i })
    ).not.toBeInTheDocument();
  });

  it('stages files via the imperative handle and includes them on send', () => {
    const onSend = vi.fn();
    const ref = React.createRef<ChatComposerHandle>();
    renderWithTheme(<ChatComposer ref={ref} onSend={onSend} />);

    const file = new File(['data'], 'notes.txt', { type: 'text/plain' });
    React.act(() => ref.current?.addFiles([file]));

    expect(screen.getByText('notes.txt')).toBeInTheDocument();

    // Attachments alone should enable send.
    const sendButton = screen.getByRole('button', { name: /send message/i });
    expect(sendButton).toBeEnabled();
    fireEvent.click(sendButton);

    expect(onSend).toHaveBeenCalledWith({
      content: '',
      attachments: [file],
    });
  });

  it('rejects files over the limits and reports via onError', () => {
    const onError = vi.fn();
    const ref = React.createRef<ChatComposerHandle>();
    renderWithTheme(
      <ChatComposer
        ref={ref}
        onError={onError}
        maxAttachments={1}
        acceptedFileTypes={['image/*']}
      />
    );

    const doc = new File(['data'], 'notes.txt', { type: 'text/plain' });
    React.act(() => ref.current?.addFiles([doc]));
    expect(onError).toHaveBeenCalledWith(expect.stringContaining('notes.txt'), {
      reason: 'file-type',
      file: doc,
    });

    const image = new File(['data'], 'a.png', { type: 'image/png' });
    const image2 = new File(['data'], 'b.png', { type: 'image/png' });
    React.act(() => ref.current?.addFiles([image]));
    React.act(() => ref.current?.addFiles([image2]));
    expect(onError).toHaveBeenCalledWith('Attachment limit reached (max 1)', {
      reason: 'attachment-limit',
    });
  });

  it('enforces maxAttachments across addFiles calls in the same batch', () => {
    const ref = React.createRef<ChatComposerHandle>();
    renderWithTheme(<ChatComposer ref={ref} maxAttachments={1} />);

    const a = new File(['data'], 'a.png', { type: 'image/png' });
    const b = new File(['data'], 'b.png', { type: 'image/png' });
    React.act(() => {
      ref.current?.addFiles([a]);
      ref.current?.addFiles([b]);
    });

    expect(screen.getByText('a.png')).toBeInTheDocument();
    expect(screen.queryByText('b.png')).not.toBeInTheDocument();
  });

  it('creates preview URLs for video attachments and renders a video element', () => {
    const spy = vi
      .spyOn(URL, 'createObjectURL')
      .mockReturnValue('blob:clip-preview');
    const ref = React.createRef<ChatComposerHandle>();
    renderWithTheme(<ChatComposer ref={ref} />);

    const video = new File(['data'], 'clip.mp4', { type: 'video/mp4' });
    React.act(() => ref.current?.addFiles([video]));

    expect(spy).toHaveBeenCalledWith(video);
    const videoEl = screen.getByLabelText('clip.mp4');
    expect(videoEl.tagName).toBe('VIDEO');
    expect(videoEl).toHaveAttribute('src', 'blob:clip-preview');
    spy.mockRestore();
  });

  it('removes a staged attachment and revokes its preview URL', () => {
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL');
    const ref = React.createRef<ChatComposerHandle>();
    renderWithTheme(<ChatComposer ref={ref} />);

    const image = new File(['data'], 'a.png', { type: 'image/png' });
    React.act(() => ref.current?.addFiles([image]));
    expect(screen.getByText('a.png')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /remove a\.png/i }));
    expect(screen.queryByText('a.png')).not.toBeInTheDocument();
    expect(revokeSpy).toHaveBeenCalledTimes(1);
    revokeSpy.mockRestore();
  });

  it('stages pasted files', () => {
    renderWithTheme(<ChatComposer />);

    const file = new File(['data'], 'pasted.png', { type: 'image/png' });
    fireEvent.paste(getInput(), {
      clipboardData: { files: [file], getData: () => '' },
    });

    expect(screen.getByText('pasted.png')).toBeInTheDocument();
  });

  it('shows the mic button and fires onMicClick', () => {
    const onMicClick = vi.fn();
    renderWithTheme(<ChatComposer onMicClick={onMicClick} />);

    fireEvent.click(screen.getByRole('button', { name: /start voice input/i }));
    expect(onMicClick).toHaveBeenCalled();
  });

  it("hides the mic while typing when micBehavior is 'whenEmpty'", () => {
    renderWithTheme(
      <ChatComposer onMicClick={vi.fn()} micBehavior="whenEmpty" />
    );

    expect(
      screen.getByRole('button', { name: /start voice input/i })
    ).toBeInTheDocument();

    fireEvent.change(getInput(), { target: { value: 'Hi' } });
    expect(
      screen.queryByRole('button', { name: /start voice input/i })
    ).not.toBeInTheDocument();
  });

  it('renders a custom micSlot instead of the built-in button', () => {
    renderWithTheme(
      <ChatComposer micSlot={<button type="button">Custom mic</button>} />
    );

    expect(screen.getByText('Custom mic')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /start voice input/i })
    ).not.toBeInTheDocument();
  });

  it('swaps send for stop while streaming', () => {
    const onStop = vi.fn();
    renderWithTheme(<ChatComposer isStreaming onStop={onStop} />);

    expect(
      screen.queryByRole('button', { name: /send message/i })
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /stop generating/i }));
    expect(onStop).toHaveBeenCalled();
  });

  it('disables the stop button when the composer is disabled', () => {
    renderWithTheme(<ChatComposer isStreaming onStop={vi.fn()} disabled />);

    expect(
      screen.getByRole('button', { name: /stop generating/i })
    ).toBeDisabled();
  });

  it('shows a busy send button while isSending', () => {
    renderWithTheme(<ChatComposer onSend={vi.fn()} isSending />);

    const sendButton = screen.getByRole('button', {
      name: /sending message/i,
    });
    expect(sendButton).toBeDisabled();
    expect(sendButton).toHaveAttribute('aria-busy', 'true');
  });

  it('keeps send disabled when no onSend handler is provided', () => {
    renderWithTheme(<ChatComposer />);

    fireEvent.change(getInput(), { target: { value: 'Hi' } });
    expect(
      screen.getByRole('button', { name: /send message/i })
    ).toBeDisabled();
  });

  it('reports a rejected async onSend through onError', async () => {
    const onError = vi.fn();
    const onSend = vi.fn().mockRejectedValue(new Error('boom'));
    renderWithTheme(<ChatComposer onSend={onSend} onError={onError} />);

    fireEvent.change(getInput(), { target: { value: 'Hi' } });
    fireEvent.keyDown(getInput(), { key: 'Enter' });

    await vi.waitFor(() =>
      expect(onError).toHaveBeenCalledWith('Failed to send message', {
        reason: 'send-failed',
      })
    );
  });

  it('reports a synchronously throwing onSend through onError', () => {
    const onError = vi.fn();
    const onSend = vi.fn(() => {
      throw new Error('boom');
    });
    renderWithTheme(<ChatComposer onSend={onSend} onError={onError} />);

    fireEvent.change(getInput(), { target: { value: 'Hi' } });
    fireEvent.keyDown(getInput(), { key: 'Enter' });

    expect(onError).toHaveBeenCalledWith('Failed to send message', {
      reason: 'send-failed',
    });
  });

  it('selects an agent from the agent menu', () => {
    const onAgentChange = vi.fn();
    renderWithTheme(
      <ChatComposer
        showAgentSelector
        agents={agents}
        selectedAgent="general"
        onAgentChange={onAgentChange}
      />
    );

    const trigger = screen.getByRole('button', { name: /select agent/i });
    expect(trigger).toHaveTextContent('General assistant');

    fireEvent.click(trigger);
    const selected = screen.getByRole('menuitemradio', {
      name: /general assistant/i,
    });
    expect(selected).toHaveAttribute('aria-checked', 'true');

    fireEvent.click(screen.getByText('Code helper'));
    expect(onAgentChange).toHaveBeenCalledWith('coder');
    // Selecting an agent closes the menu.
    expect(screen.queryByText('Writes code')).not.toBeInTheDocument();
  });

  it('renders the model selector when enabled', () => {
    renderWithTheme(
      <ChatComposer
        showModelSelector
        modelSelectorProps={{
          models: [
            {
              provider: 'openai',
              providerLabel: 'OpenAI',
              model: 'gpt-5',
              label: 'GPT-5',
            },
          ],
          value: { provider: 'openai', model: 'gpt-5' },
          onChange: vi.fn(),
        }}
      />
    );

    expect(screen.getByRole('button', { name: /gpt-5/i })).toBeInTheDocument();
  });

  it('shows a read-only notice instead of the input', () => {
    renderWithTheme(<ChatComposer readOnly readOnlyMessage="No access" />);

    expect(screen.getByText('No access')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('disables interaction when disabled', () => {
    renderWithTheme(<ChatComposer disabled onMicClick={vi.fn()} />);

    expect(getInput()).toBeDisabled();
    expect(
      screen.getByRole('button', { name: /add to message/i })
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: /start voice input/i })
    ).toBeDisabled();
  });

  it('disables attachment removal when disabled', () => {
    const ref = React.createRef<ChatComposerHandle>();
    const { rerender } = renderWithTheme(<ChatComposer ref={ref} />);

    const file = new File(['data'], 'notes.txt', { type: 'text/plain' });
    React.act(() => ref.current?.addFiles([file]));
    expect(
      screen.getByRole('button', { name: /remove notes\.txt/i })
    ).toBeEnabled();

    rerender(<ChatComposer ref={ref} disabled />);
    expect(
      screen.getByRole('button', { name: /remove notes\.txt/i })
    ).toBeDisabled();
  });

  it('includes the selected agent in the trigger accessible name', () => {
    renderWithTheme(
      <ChatComposer showAgentSelector agents={agents} selectedAgent="coder" />
    );

    expect(
      screen.getByRole('button', { name: 'Select agent: Code helper' })
    ).toBeInTheDocument();
  });
});
