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

    expect(
      screen.getByRole('button', { name: /remove a\.png/i })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /remove b\.png/i })
    ).not.toBeInTheDocument();
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
    expect(
      screen.getByRole('button', { name: /remove a\.png/i })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /remove a\.png/i }));
    expect(
      screen.queryByRole('button', { name: /remove a\.png/i })
    ).not.toBeInTheDocument();
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

  it('defers the ResizeObserver re-measure to the next frame and cancels it on unmount', () => {
    // Mutating the observed textarea's height synchronously inside the
    // observer callback triggers the browser's "ResizeObserver loop
    // completed with undelivered notifications" error, so the re-measure
    // must be scheduled via requestAnimationFrame and the pending frame
    // canceled on unmount. The jsdom ResizeObserver stub (test/setup.ts)
    // fires its callback once during observe(), exercising this path.
    const frameCallbacks: Array<(time: number) => void> = [];
    const raf = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((callback) => {
        frameCallbacks.push(callback);
        return frameCallbacks.length;
      });
    const caf = vi
      .spyOn(window, 'cancelAnimationFrame')
      .mockImplementation(() => {});

    // Control the measured content height — jsdom always reports 0, which
    // makes resizeTextarea bail — and count reads so a synchronous
    // re-measure inside the observer callback is detectable.
    let measuredScrollHeight = 120;
    let scrollHeightReads = 0;
    Object.defineProperty(HTMLTextAreaElement.prototype, 'scrollHeight', {
      configurable: true,
      get() {
        scrollHeightReads += 1;
        return measuredScrollHeight;
      },
    });

    try {
      const { unmount } = renderWithTheme(<ChatComposer onSend={vi.fn()} />);
      const textarea = getInput();

      // The mount layout effect (typing path) measures synchronously —
      // exactly two reads: the visibility check and the applied value.
      expect(textarea.style.height).toBe('120px');
      expect(scrollHeightReads).toBe(2);

      // The observer fired during observe() but must only have scheduled a
      // frame: no further scrollHeight reads means no synchronous
      // re-measure — the loop-error regression this test guards against.
      expect(raf).toHaveBeenCalled();
      expect(frameCallbacks).toHaveLength(1);
      expect(scrollHeightReads).toBe(2);

      // Driving the queued frame performs the actual re-measure using the
      // height at flush time, not at observation time.
      measuredScrollHeight = 160;
      frameCallbacks.splice(0).forEach((callback) => callback(0));
      expect(textarea.style.height).toBe('160px');

      const lastResult = raf.mock.results[raf.mock.results.length - 1];
      const scheduledFrame = lastResult.value as number;

      unmount();
      expect(caf).toHaveBeenCalledWith(scheduledFrame);
    } finally {
      delete (HTMLTextAreaElement.prototype as { scrollHeight?: number })
        .scrollHeight;
      raf.mockRestore();
      caf.mockRestore();
    }
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

    // role="status" makes the notice a live region so the change is
    // announced when readOnly flips at runtime.
    expect(screen.getByRole('status')).toHaveTextContent('No access');
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

  it('lets textareaProps.onKeyDown claim Enter via preventDefault', () => {
    const onSend = vi.fn();
    const onKeyDown = vi.fn((event: React.KeyboardEvent) => {
      if (event.key === 'Enter') event.preventDefault();
    });
    renderWithTheme(
      <ChatComposer onSend={onSend} textareaProps={{ onKeyDown }} />
    );

    const input = getInput();
    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onKeyDown).toHaveBeenCalled();
    expect(onSend).not.toHaveBeenCalled();
  });

  it('still sends on Enter when textareaProps.onKeyDown does not preventDefault', () => {
    const onSend = vi.fn();
    renderWithTheme(
      <ChatComposer onSend={onSend} textareaProps={{ onKeyDown: vi.fn() }} />
    );

    const input = getInput();
    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onSend).toHaveBeenCalledWith({
      content: 'Hello',
      attachments: [],
    });
  });

  it('lets textareaProps.onPaste opt out of paste-to-attach', () => {
    const onPaste = vi.fn((event: React.ClipboardEvent) => {
      event.preventDefault();
    });
    renderWithTheme(<ChatComposer textareaProps={{ onPaste }} />);

    const file = new File(['data'], 'pasted.png', { type: 'image/png' });
    fireEvent.paste(getInput(), {
      clipboardData: { files: [file], getData: () => '' },
    });

    expect(onPaste).toHaveBeenCalled();
    expect(screen.queryByText('pasted.png')).not.toBeInTheDocument();
  });

  it('passes caret events through textareaProps (onSelect)', () => {
    const onSelect = vi.fn();
    renderWithTheme(<ChatComposer textareaProps={{ onSelect }} />);

    fireEvent.select(getInput());
    expect(onSelect).toHaveBeenCalled();
  });

  it('exposes the textarea element via getTextarea on the handle', () => {
    const ref = React.createRef<ChatComposerHandle>();
    renderWithTheme(<ChatComposer ref={ref} />);

    expect(ref.current?.getTextarea()).toBe(getInput());
  });

  it('allows sending while empty when canSendWhenEmpty is set', () => {
    const onSend = vi.fn();
    renderWithTheme(<ChatComposer onSend={onSend} canSendWhenEmpty />);

    const sendButton = screen.getByRole('button', { name: /send message/i });
    expect(sendButton).toBeEnabled();

    fireEvent.click(sendButton);
    expect(onSend).toHaveBeenCalledWith({ content: '', attachments: [] });
  });

  it('applies maxHeight as an inline style cap', () => {
    const { rerender } = renderWithTheme(<ChatComposer maxHeight={200} />);
    expect(getInput()).toHaveStyle({ maxHeight: '200px' });

    rerender(<ChatComposer maxHeight="40vh" />);
    expect(getInput()).toHaveStyle({ maxHeight: '40vh' });
  });

  it('renders the selector row outside the card', () => {
    const { container } = renderWithTheme(
      <ChatComposer
        showModelSelector
        modelSelectorProps={{
          models: [{ provider: 'openai', model: 'gpt-5', label: 'GPT-5' }],
          value: { provider: 'openai', model: 'gpt-5' },
          onChange: vi.fn(),
        }}
      />
    );

    const card = container.querySelector('[data-slot="chat-composer-card"]');
    expect(card).not.toBeNull();
    const selectors = container.querySelector(
      '[data-slot="chat-composer-selectors"]'
    );
    // Selector row is a sibling of the card, not inside it.
    expect(card?.contains(selectors)).toBe(false);
    expect(selectors?.parentElement).toHaveAttribute(
      'data-slot',
      'chat-composer'
    );
  });

  describe('@mentions', () => {
    const mentionOptions = [
      { id: 'a1', label: 'Triage Agent', description: 'agent' },
      { id: 'u1', label: 'Trish Nurse' },
      { id: 'u2', label: 'Sam Clerk' },
    ];

    it('does not expose combobox semantics when mentionOptions is absent', () => {
      renderWithTheme(<ChatComposer />);
      const input = getInput();
      expect(input).not.toHaveAttribute('aria-autocomplete');

      fireEvent.change(input, { target: { value: 'Hi @tri' } });
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('opens a filtered mention menu on @ with combobox ARIA wiring', () => {
      renderWithTheme(<ChatComposer mentionOptions={mentionOptions} />);
      const input = getInput();
      expect(input).toHaveAttribute('aria-autocomplete', 'list');

      fireEvent.change(input, { target: { value: 'Hi @tri' } });

      const menu = screen.getByRole('listbox', { name: 'Mention' });
      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(2);
      expect(options[0]).toHaveAccessibleName(/Triage Agent/);
      expect(options[0]).toHaveAttribute('aria-selected', 'true');
      expect(input).toHaveAttribute('aria-controls', menu.id);
      expect(input).toHaveAttribute('aria-activedescendant', options[0].id);
    });

    it('navigates with arrows and inserts the highlighted option on Enter without sending', () => {
      const onSend = vi.fn();
      renderWithTheme(
        <ChatComposer onSend={onSend} mentionOptions={mentionOptions} />
      );
      const input = getInput();
      fireEvent.change(input, { target: { value: 'Hi @tri' } });

      fireEvent.keyDown(input, { key: 'ArrowDown' });
      expect(screen.getAllByRole('option')[1]).toHaveAttribute(
        'aria-selected',
        'true'
      );

      fireEvent.keyDown(input, { key: 'Enter' });
      expect(onSend).not.toHaveBeenCalled();
      expect(input).toHaveValue('Hi @Trish ');
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('inserts the visibly highlighted option after the list shrinks under the highlight', () => {
      // Regression: when the host swaps mentionOptions while the menu is open
      // and the highlight index falls out of range, Enter must insert the
      // option the clamped highlight points at — the one the user sees.
      const { rerender } = renderWithTheme(
        <ChatComposer mentionOptions={mentionOptions} />
      );
      const input = getInput();
      fireEvent.change(input, { target: { value: '@' } });
      expect(screen.getAllByRole('option')).toHaveLength(3);

      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      expect(screen.getAllByRole('option')[2]).toHaveAttribute(
        'aria-selected',
        'true'
      );

      // Host shrinks the option list; highlight (2) is now out of range.
      rerender(<ChatComposer mentionOptions={mentionOptions.slice(0, 2)} />);
      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(2);
      expect(options[1]).toHaveAttribute('aria-selected', 'true');
      expect(input).toHaveAttribute('aria-activedescendant', options[1].id);

      fireEvent.keyDown(input, { key: 'Enter' });
      // Trish Nurse (index 1, the visible highlight) — not Triage Agent (0).
      expect(input).toHaveValue('@Trish ');
    });

    it('inserts a mention on mouse down so the textarea keeps focus', () => {
      renderWithTheme(<ChatComposer mentionOptions={mentionOptions} />);
      const input = getInput();
      fireEvent.change(input, { target: { value: '@sam' } });

      fireEvent.mouseDown(screen.getByRole('option', { name: /Sam Clerk/ }));
      expect(input).toHaveValue('@Sam ');
    });

    it('closes the menu on Escape without clearing the draft', () => {
      renderWithTheme(<ChatComposer mentionOptions={mentionOptions} />);
      const input = getInput();
      fireEvent.change(input, { target: { value: '@tri' } });
      expect(screen.getByRole('listbox')).toBeInTheDocument();

      fireEvent.keyDown(input, { key: 'Escape' });
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      expect(input).toHaveValue('@tri');
    });

    it('labels the listbox via mentionListLabel', () => {
      renderWithTheme(
        <ChatComposer
          mentionOptions={mentionOptions}
          mentionListLabel="Mencionar"
        />
      );
      fireEvent.change(getInput(), { target: { value: '@tri' } });
      expect(
        screen.getByRole('listbox', { name: 'Mencionar' })
      ).toBeInTheDocument();
    });

    it('lets host textareaProps handlers claim key events before the mention menu', () => {
      const onKeyDown = vi.fn((event: React.KeyboardEvent) =>
        event.preventDefault()
      );
      const onSend = vi.fn();
      renderWithTheme(
        <ChatComposer
          onSend={onSend}
          mentionOptions={mentionOptions}
          textareaProps={{ onKeyDown }}
        />
      );
      const input = getInput();
      fireEvent.change(input, { target: { value: '@tri' } });

      fireEvent.keyDown(input, { key: 'Enter' });
      expect(onKeyDown).toHaveBeenCalled();
      // Host claimed the event: no mention insertion, no send.
      expect(input).toHaveValue('@tri');
      expect(onSend).not.toHaveBeenCalled();
    });
  });

  describe('drag-and-drop', () => {
    function getCard(container: HTMLElement) {
      return container.querySelector('[data-slot="chat-composer-card"]')!;
    }

    it('stages dropped files', () => {
      const { container } = renderWithTheme(<ChatComposer />);
      const file = new File(['data'], 'dropped.png', { type: 'image/png' });

      fireEvent.drop(getCard(container), {
        dataTransfer: { files: [file], items: [], types: ['Files'] },
      });

      expect(screen.getByText('dropped.png')).toBeInTheDocument();
    });

    it('shows the drop overlay while dragging, with a customizable label', () => {
      const { container } = renderWithTheme(
        <ChatComposer dropFilesLabel="Soltar archivos aquí" />
      );

      fireEvent.dragEnter(getCard(container), {
        dataTransfer: {
          items: [{ kind: 'file' }],
          files: [],
          types: ['Files'],
        },
      });
      expect(screen.getByText('Soltar archivos aquí')).toBeInTheDocument();

      fireEvent.dragLeave(getCard(container), {
        dataTransfer: { items: [], files: [], types: [] },
      });
      expect(
        screen.queryByText('Soltar archivos aquí')
      ).not.toBeInTheDocument();
    });

    it('validates dropped files through the standard onError path', () => {
      const onError = vi.fn();
      const { container } = renderWithTheme(
        <ChatComposer acceptedFileTypes={['image/*']} onError={onError} />
      );
      const doc = new File(['data'], 'notes.txt', { type: 'text/plain' });

      fireEvent.drop(getCard(container), {
        dataTransfer: { files: [doc], items: [], types: ['Files'] },
      });

      expect(onError).toHaveBeenCalledWith(
        expect.stringContaining('notes.txt'),
        { reason: 'file-type', file: doc }
      );
      expect(screen.queryByText('notes.txt')).not.toBeInTheDocument();
    });

    it('enforces maxAttachments on drop with the structured limit error', () => {
      const onError = vi.fn();
      const { container } = renderWithTheme(
        <ChatComposer maxAttachments={1} onError={onError} />
      );
      const a = new File(['data'], 'a.png', { type: 'image/png' });
      const b = new File(['data'], 'b.png', { type: 'image/png' });

      fireEvent.drop(getCard(container), {
        dataTransfer: { files: [a, b], items: [], types: ['Files'] },
      });

      expect(
        screen.getByRole('button', { name: /remove a\.png/i })
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /remove b\.png/i })
      ).not.toBeInTheDocument();
      expect(onError).toHaveBeenCalledWith('Attachment limit reached (max 1)', {
        reason: 'attachment-limit',
      });
    });

    it('does not stage dropped files when attachments are disabled', () => {
      const { container } = renderWithTheme(
        <ChatComposer allowAttachments={false} />
      );
      const file = new File(['data'], 'dropped.png', { type: 'image/png' });

      fireEvent.drop(getCard(container), {
        dataTransfer: { files: [file], items: [], types: ['Files'] },
      });

      expect(screen.queryByText('dropped.png')).not.toBeInTheDocument();
    });
  });
});
