import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import { Modal } from '../Modal';
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

  it('does not send on Enter during IME composition', () => {
    const onSend = vi.fn();
    renderWithTheme(<ChatComposer onSend={onSend} />);

    const input = getInput();
    fireEvent.change(input, { target: { value: 'こんにちは' } });
    fireEvent.keyDown(input, { key: 'Enter', isComposing: true });

    expect(onSend).not.toHaveBeenCalled();
  });

  describe('on touch devices', () => {
    beforeEach(() => {
      vi.spyOn(window, 'matchMedia').mockImplementation(
        (query: string) =>
          ({
            matches: query.includes('pointer: coarse'),
            media: query,
            onchange: null,
            addListener: () => {},
            removeListener: () => {},
            addEventListener: () => {},
            removeEventListener: () => {},
            dispatchEvent: () => false,
          }) as MediaQueryList
      );
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('inserts a newline on Enter instead of sending', () => {
      const onSend = vi.fn();
      renderWithTheme(<ChatComposer onSend={onSend} />);

      const input = getInput();
      fireEvent.change(input, { target: { value: 'Hello' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(onSend).not.toHaveBeenCalled();
      expect(input).toHaveAttribute('enterkeyhint', 'enter');
    });

    it('sends on Enter when submitOnEnter is "always"', () => {
      const onSend = vi.fn();
      renderWithTheme(<ChatComposer onSend={onSend} submitOnEnter="always" />);

      const input = getInput();
      fireEvent.change(input, { target: { value: 'Hello' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(onSend).toHaveBeenCalled();
      expect(input).toHaveAttribute('enterkeyhint', 'send');
    });

    it('ignores autoFocus so the keyboard does not pop on navigation', () => {
      // eslint-disable-next-line jsx-a11y/no-autofocus
      renderWithTheme(<ChatComposer autoFocus />);
      expect(getInput()).not.toHaveFocus();
    });
  });

  describe('layout', () => {
    // The `+` cell carries the md+ single-row classes only in the responsive
    // layout; stacked keeps the input on its own row at every width.
    function addCell() {
      return screen
        .getByRole('button', { name: /add to message/i })
        .closest('[class*="col-start-1"]') as HTMLElement;
    }

    it('collapses to one row at md+ by default', () => {
      renderWithTheme(<ChatComposer onSend={vi.fn()} allowAttachments />);
      expect(addCell().className).toContain('md:row-start-1');
    });

    it('keeps the controls under the input when stacked', () => {
      renderWithTheme(
        <ChatComposer onSend={vi.fn()} allowAttachments layout="stacked" />
      );
      expect(addCell().className).toContain('row-start-2');
      expect(addCell().className).not.toContain('md:');
    });
  });

  it('honors autoFocus on fine-pointer devices', () => {
    // eslint-disable-next-line jsx-a11y/no-autofocus
    renderWithTheme(<ChatComposer autoFocus />);
    expect(getInput()).toHaveFocus();
  });

  it('focuses the input when pressing empty card space', () => {
    const { container } = renderWithTheme(<ChatComposer onSend={vi.fn()} />);
    const card = container.querySelector('[data-slot="chat-composer-card"]')!;

    expect(fireEvent.mouseDown(card)).toBe(false);
    fireEvent.mouseUp(card);
    expect(getInput()).toHaveFocus();
  });

  it('leaves presses on card buttons alone', () => {
    renderWithTheme(<ChatComposer />);
    const addButton = screen.getByRole('button', { name: /add to message/i });

    expect(fireEvent.mouseDown(addButton)).toBe(true);
    fireEvent.mouseUp(addButton);
    expect(getInput()).not.toHaveFocus();
  });

  it('keeps focus on the input when pressing send', () => {
    const onSend = vi.fn();
    renderWithTheme(<ChatComposer onSend={onSend} />);

    const input = getInput();
    input.focus();
    fireEvent.change(input, { target: { value: 'Hello' } });
    const sendButton = screen.getByRole('button', { name: /send message/i });

    // A cancelled mousedown is what stops the browser moving focus.
    expect(fireEvent.mouseDown(sendButton)).toBe(false);
    // Complete the press: React suppresses onSelect between mousedown and
    // mouseup module-wide, which would leak into later tests.
    fireEvent.mouseUp(sendButton);
    fireEvent.click(sendButton);

    expect(onSend).toHaveBeenCalled();
    expect(input).toHaveFocus();
  });

  it('sets mobile keyboard attributes that textareaProps can override', () => {
    renderWithTheme(
      <ChatComposer textareaProps={{ autoCapitalize: 'off', dir: 'rtl' }} />
    );

    const input = getInput();
    expect(input).toHaveAttribute('inputmode', 'text');
    expect(input).toHaveAttribute('autocorrect', 'on');
    expect(input).toHaveAttribute('spellcheck', 'true');
    expect(input).toHaveAttribute('enterkeyhint', 'send');
    expect(input).toHaveAttribute('autocapitalize', 'off');
    expect(input).toHaveAttribute('dir', 'rtl');
    // 16px on small screens prevents iOS zoom-on-focus.
    expect(input).toHaveClass('text-base', 'sm:text-sm');
  });

  it('never sends on Enter when submitOnEnter is "never"', () => {
    const onSend = vi.fn();
    renderWithTheme(<ChatComposer onSend={onSend} submitOnEnter="never" />);

    const input = getInput();
    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onSend).not.toHaveBeenCalled();
    expect(input).toHaveAttribute('enterkeyhint', 'enter');
  });

  it('disables the send button while empty and enables it with text', () => {
    renderWithTheme(<ChatComposer onSend={vi.fn()} />);

    const sendButton = screen.getByRole('button', { name: /send message/i });
    expect(sendButton).toBeDisabled();

    fireEvent.change(getInput(), { target: { value: 'Hi' } });
    expect(sendButton).toBeEnabled();
  });

  describe('sendOptions', () => {
    const sendOptions = [
      { id: 'later', label: 'Send later…' },
      { id: 'quiet', label: 'Send without notifying' },
    ];

    it('renders no options trigger without sendOptions', () => {
      renderWithTheme(<ChatComposer onSend={vi.fn()} />);
      expect(
        screen.queryByRole('button', { name: 'More send options' })
      ).not.toBeInTheDocument();
    });

    it('sends the draft with the chosen option id', () => {
      const onSend = vi.fn();
      renderWithTheme(
        <ChatComposer onSend={onSend} sendOptions={sendOptions} />
      );
      fireEvent.change(getInput(), { target: { value: 'See you Monday' } });
      fireEvent.click(
        screen.getByRole('button', { name: 'More send options' })
      );
      fireEvent.click(
        screen.getByRole('menuitem', { name: 'Send without notifying' })
      );

      expect(onSend).toHaveBeenCalledWith(
        { content: 'See you Monday', attachments: [] },
        { sendOption: 'quiet' }
      );
      expect(getInput()).toHaveValue('');
    });

    it('keeps a plain send free of meta', () => {
      const onSend = vi.fn();
      renderWithTheme(
        <ChatComposer onSend={onSend} sendOptions={sendOptions} />
      );
      fireEvent.change(getInput(), { target: { value: 'Now' } });
      fireEvent.keyDown(getInput(), { key: 'Enter' });
      expect(onSend).toHaveBeenCalledWith({ content: 'Now', attachments: [] });
    });

    it('disables the options trigger with nothing to send', () => {
      renderWithTheme(
        <ChatComposer
          onSend={vi.fn()}
          sendOptions={sendOptions}
          sendOptionsLabel="Más opciones de envío"
        />
      );
      expect(
        screen.getByRole('button', { name: 'Más opciones de envío' })
      ).toBeDisabled();
    });

    it('moves through the options from the keyboard and returns focus on Escape', async () => {
      renderWithTheme(
        <ChatComposer
          onSend={vi.fn()}
          sendOptions={[
            ...sendOptions,
            { id: 'off', label: 'Off', disabled: true },
          ]}
        />
      );
      fireEvent.change(getInput(), { target: { value: 'Later' } });
      const trigger = screen.getByRole('button', { name: 'More send options' });
      fireEvent.click(trigger);

      const later = screen.getByRole('menuitem', { name: 'Send later…' });
      const quiet = screen.getByRole('menuitem', {
        name: 'Send without notifying',
      });
      // The first option takes focus once the menu opens.
      await vi.waitFor(() => expect(later).toHaveFocus());

      fireEvent.keyDown(later, { key: 'ArrowDown' });
      expect(quiet).toHaveFocus();
      // Skips the disabled option and wraps around.
      fireEvent.keyDown(quiet, { key: 'ArrowDown' });
      expect(later).toHaveFocus();
      fireEvent.keyDown(later, { key: 'End' });
      expect(quiet).toHaveFocus();
      fireEvent.keyDown(quiet, { key: 'Home' });
      expect(later).toHaveFocus();

      fireEvent.keyDown(later, { key: 'Escape' });
      expect(trigger).toHaveFocus();
      expect(screen.queryByRole('menuitem')).not.toBeInTheDocument();
    });

    it('keeps Escape in the options menu from reaching a document listener', async () => {
      // A surrounding Modal closes on a document-level Escape listener.
      const onDocumentKeyDown = vi.fn();
      document.addEventListener('keydown', onDocumentKeyDown);
      try {
        renderWithTheme(
          <ChatComposer onSend={vi.fn()} sendOptions={sendOptions} />
        );
        fireEvent.change(getInput(), { target: { value: 'Later' } });
        fireEvent.click(
          screen.getByRole('button', { name: 'More send options' })
        );
        const later = screen.getByRole('menuitem', { name: 'Send later…' });
        await vi.waitFor(() => expect(later).toHaveFocus());

        fireEvent.keyDown(later, { key: 'Escape' });
        expect(screen.queryByRole('menuitem')).not.toBeInTheDocument();
        expect(onDocumentKeyDown).not.toHaveBeenCalled();
      } finally {
        document.removeEventListener('keydown', onDocumentKeyDown);
      }
    });

    it('disables the options trigger when every option is disabled', () => {
      renderWithTheme(
        <ChatComposer
          onSend={vi.fn()}
          sendOptions={[
            { id: 'later', label: 'Send later…', disabled: true },
            { id: 'quiet', label: 'Send without notifying', disabled: true },
          ]}
        />
      );
      fireEvent.change(getInput(), { target: { value: 'Later' } });
      const trigger = screen.getByRole('button', { name: 'More send options' });
      expect(trigger).toBeDisabled();
      fireEvent.click(trigger);
      expect(screen.queryByRole('menuitem')).not.toBeInTheDocument();
    });

    it.each([false, true])(
      'closes the options menu on Tab (shift: %s) and keeps focus inside a Modal',
      async (shiftKey) => {
        renderWithTheme(
          <Modal open onOpenChange={vi.fn()} aria-label="Compose">
            <ChatComposer onSend={vi.fn()} sendOptions={sendOptions} />
          </Modal>
        );
        fireEvent.change(getInput(), { target: { value: 'Later' } });
        const trigger = screen.getByRole('button', {
          name: 'More send options',
        });
        fireEvent.click(trigger);
        const later = screen.getByRole('menuitem', { name: 'Send later…' });
        await vi.waitFor(() => expect(later).toHaveFocus());

        // The menu is portaled out of the dialog, past its focus trap.
        expect(screen.getByRole('dialog')).not.toContainElement(later);
        const tab = fireEvent.keyDown(later, { key: 'Tab', shiftKey });

        expect(tab).toBe(false); // default prevented: no body-order Tab
        expect(screen.queryByRole('menuitem')).not.toBeInTheDocument();
        expect(trigger).toHaveFocus();
        expect(screen.getByRole('dialog')).toContainElement(trigger);
      }
    );
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

  it('renders a leadingSlot alongside the + menu', () => {
    renderWithTheme(
      <ChatComposer leadingSlot={<button type="button">Voice</button>} />
    );

    expect(screen.getByText('Voice')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /add to message/i })
    ).toBeInTheDocument();
  });

  it('renders a leadingSlot when the + menu is hidden', () => {
    renderWithTheme(
      <ChatComposer
        allowAttachments={false}
        leadingSlot={<button type="button">Voice</button>}
      />
    );

    expect(screen.getByText('Voice')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /add to message/i })
    ).not.toBeInTheDocument();
  });

  it('renders a headerSlot above the card', () => {
    const { container } = renderWithTheme(
      <ChatComposer headerSlot={<div role="toolbar" aria-label="Capture" />} />
    );

    const header = container.querySelector(
      '[data-slot="chat-composer-header-slot"]'
    );
    const card = container.querySelector('[data-slot="chat-composer-card"]');
    expect(header).toContainElement(
      screen.getByRole('toolbar', { name: 'Capture' })
    );
    expect(
      header!.compareDocumentPosition(card!) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
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

  it('stages imperative addFiles even when allowAttachments is false', () => {
    // The prop only hides the composer's own attach affordances; explicit
    // host calls (e.g. a camera capture slot) must still stage files.
    const ref = React.createRef<ChatComposerHandle>();
    renderWithTheme(<ChatComposer ref={ref} allowAttachments={false} />);

    const file = new File(['data'], 'photo.png', { type: 'image/png' });
    React.act(() => ref.current?.addFiles([file]));

    expect(screen.getByText('photo.png')).toBeInTheDocument();
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

  it('caps each file by its own size when maxFileSize is a function', () => {
    const onError = vi.fn();
    const ref = React.createRef<ChatComposerHandle>();
    const sized = (name: string, type: string, size: number) => {
      const file = new File(['x'], name, { type });
      Object.defineProperty(file, 'size', { value: size });
      return file;
    };
    renderWithTheme(
      <ChatComposer
        ref={ref}
        onError={onError}
        maxFileSize={(file) =>
          file.type.startsWith('video/') ? 500 : file.type ? 100 : undefined
        }
      />
    );

    const video = sized('clip.mp4', 'video/mp4', 400);
    const photo = sized('big.png', 'image/png', 400);
    const unknown = sized('blob.bin', '', 10_000);
    React.act(() => ref.current?.addFiles([video, photo, unknown]));

    // The video is under its own cap, the photo over its; no cap for the last.
    expect(screen.getByText('clip.mp4')).toBeInTheDocument();
    expect(screen.queryByText('big.png')).toBeNull();
    expect(screen.getByText('blob.bin')).toBeInTheDocument();
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(expect.stringContaining('big.png'), {
      reason: 'file-size',
      file: photo,
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

  it('names the remove button through removeAttachmentLabel', () => {
    const ref = React.createRef<ChatComposerHandle>();
    renderWithTheme(
      <ChatComposer
        ref={ref}
        removeAttachmentLabel={(name) => `Quitar ${name}`}
      />
    );

    const image = new File(['data'], 'a.png', { type: 'image/png' });
    React.act(() => ref.current?.addFiles([image]));
    expect(
      screen.getByRole('button', { name: 'Quitar a.png' })
    ).toBeInTheDocument();
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

  it('shows the bottom row for selectorsEndSlot alone', () => {
    const { container } = renderWithTheme(
      <ChatComposer selectorsEndSlot={<button type="button">Voice</button>} />
    );

    const end = container.querySelector(
      '[data-slot="chat-composer-selectors-end"]'
    );
    expect(end).toContainElement(screen.getByRole('button', { name: 'Voice' }));
    expect(
      container.querySelector('[data-slot="chat-composer-selectors"]')
    ).toContainElement(end as HTMLElement);
  });

  it('renders selectorsEndSlot after the model selector', () => {
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
        selectorsEndSlot={<button type="button">Voice</button>}
      />
    );

    const model = screen.getByRole('button', { name: /gpt-5/i });
    const voice = screen.getByRole('button', { name: 'Voice' });
    expect(model.compareDocumentPosition(voice)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
  });

  it('omits the bottom row when no selector or end slot is set', () => {
    const { container } = renderWithTheme(<ChatComposer />);
    expect(
      container.querySelector('[data-slot="chat-composer-selectors"]')
    ).toBeNull();
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

    describe('onMentionSearch', () => {
      it('shows the host results for the typed query', async () => {
        const onMentionSearch = vi.fn((query: string) =>
          Promise.resolve(
            mentionOptions.filter((o) => o.label.toLowerCase().includes(query))
          )
        );
        renderWithTheme(<ChatComposer onMentionSearch={onMentionSearch} />);
        const input = getInput();
        expect(input).toHaveAttribute('aria-autocomplete', 'list');

        fireEvent.change(input, { target: { value: 'Hi @sam' } });

        expect(
          await screen.findByRole('option', { name: /Sam Clerk/ })
        ).toBeInTheDocument();
        expect(screen.getAllByRole('option')).toHaveLength(1);
        expect(onMentionSearch).toHaveBeenLastCalledWith('sam');
      });

      it('passes an email address through as the query', async () => {
        const onMentionSearch = vi.fn(() => Promise.resolve([]));
        renderWithTheme(<ChatComposer onMentionSearch={onMentionSearch} />);

        fireEvent.change(getInput(), {
          target: { value: 'invite @jo@example.com' },
        });

        await vi.waitFor(() =>
          expect(onMentionSearch).toHaveBeenLastCalledWith('jo@example.com')
        );
      });

      it('ignores a slow response for an older query', async () => {
        const pending = new Map<string, (r: typeof mentionOptions) => void>();
        const onMentionSearch = (query: string) =>
          new Promise<typeof mentionOptions>((resolve) =>
            pending.set(query, resolve)
          );
        renderWithTheme(<ChatComposer onMentionSearch={onMentionSearch} />);
        const input = getInput();

        fireEvent.change(input, { target: { value: '@t' } });
        await vi.waitFor(() => expect(pending.has('t')).toBe(true));
        fireEvent.change(input, { target: { value: '@sa' } });
        await vi.waitFor(() => expect(pending.has('sa')).toBe(true));

        await React.act(async () => pending.get('sa')!([mentionOptions[2]]));
        await React.act(async () =>
          pending.get('t')!(mentionOptions.slice(0, 2))
        );

        const options = screen.getAllByRole('option');
        expect(options).toHaveLength(1);
        expect(options[0]).toHaveAccessibleName(/Sam Clerk/);
      });

      it('lists the picked mentions still in the text when sending', async () => {
        const onSend = vi.fn();
        renderWithTheme(
          <ChatComposer
            onSend={onSend}
            onMentionSearch={() => Promise.resolve(mentionOptions.slice(1))}
          />
        );
        const input = getInput();

        fireEvent.change(input, { target: { value: '@' } });
        fireEvent.mouseDown(
          await screen.findByRole('option', { name: /Trish Nurse/ })
        );
        fireEvent.change(input, { target: { value: '@Trish and @' } });
        fireEvent.mouseDown(
          await screen.findByRole('option', { name: /Sam Clerk/ })
        );
        expect(input).toHaveValue('@Trish and @Sam ');
        // Sam's mention is deleted before sending.
        fireEvent.change(input, { target: { value: '@Trish and Sam' } });
        fireEvent.keyDown(input, { key: 'Enter' });

        expect(onSend).toHaveBeenCalledWith({
          content: '@Trish and Sam',
          attachments: [],
          mentions: [mentionOptions[1]],
        });
      });
    });

    describe('onMentionSelect', () => {
      it('leaves the text unchanged when it returns false', () => {
        const onMentionSelect = vi.fn(() => false);
        renderWithTheme(
          <ChatComposer
            mentionOptions={mentionOptions}
            onMentionSelect={onMentionSelect}
          />
        );
        const input = getInput();
        fireEvent.change(input, { target: { value: 'Hi @sam' } });

        fireEvent.keyDown(input, { key: 'Enter' });

        expect(onMentionSelect).toHaveBeenCalledWith(mentionOptions[2]);
        expect(input).toHaveValue('Hi @sam');
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      });

      it('inserts once an async confirmation resolves', async () => {
        let confirm: (ok: boolean) => void = () => {};
        renderWithTheme(
          <ChatComposer
            mentionOptions={mentionOptions}
            onMentionSelect={() =>
              new Promise<boolean>((resolve) => (confirm = resolve))
            }
          />
        );
        const input = getInput();
        fireEvent.change(input, { target: { value: 'Hi @sam' } });
        fireEvent.keyDown(input, { key: 'Enter' });
        expect(input).toHaveValue('Hi @sam');

        await React.act(async () => confirm(true));

        expect(input).toHaveValue('Hi @Sam ');
      });

      it('skips the insert when the token was edited while confirming', async () => {
        let confirm: (ok: boolean) => void = () => {};
        renderWithTheme(
          <ChatComposer
            mentionOptions={mentionOptions}
            onMentionSelect={() =>
              new Promise<boolean>((resolve) => (confirm = resolve))
            }
          />
        );
        const input = getInput();
        fireEvent.change(input, { target: { value: 'Hi @sam' } });
        fireEvent.keyDown(input, { key: 'Enter' });
        fireEvent.change(input, { target: { value: 'Hi there' } });

        await React.act(async () => confirm(true));

        expect(input).toHaveValue('Hi there');
      });
    });
  });

  describe('host attachment rules', () => {
    const png = (name: string) =>
      new File(['data'], name, { type: 'image/png' });
    const pdf = (name: string) =>
      new File(['data'], name, { type: 'application/pdf' });
    // One kind at a time: images stack, a document replaces everything.
    const oneKindAtATime = (incoming: File[], staged: File[]) => {
      const images = incoming.filter((f) => f.type.startsWith('image/'));
      if (images.length === 0) return incoming.slice(0, 1);
      const stagedImages = staged.every((f) => f.type.startsWith('image/'));
      return stagedImages ? [...staged, ...images] : images;
    };

    it('stages what resolveAttachments returns and revokes dropped previews', () => {
      const revokeSpy = vi.spyOn(URL, 'revokeObjectURL');
      const resolveAttachments = vi.fn(oneKindAtATime);
      const ref = React.createRef<ChatComposerHandle>();
      renderWithTheme(
        <ChatComposer ref={ref} resolveAttachments={resolveAttachments} />
      );
      const a = png('a.png');
      const b = png('b.png');
      const doc = pdf('report.pdf');

      React.act(() => ref.current?.addFiles([a]));
      React.act(() => ref.current?.addFiles([b]));
      expect(screen.getByText('a.png')).toBeInTheDocument();
      expect(screen.getByText('b.png')).toBeInTheDocument();
      expect(resolveAttachments).toHaveBeenLastCalledWith([b], [a]);

      React.act(() => ref.current?.addFiles([doc]));
      expect(screen.getByText('report.pdf')).toBeInTheDocument();
      expect(screen.queryByText('a.png')).toBeNull();
      expect(screen.queryByText('b.png')).toBeNull();
      // Both image previews were dropped, so both URLs are released.
      expect(revokeSpy).toHaveBeenCalledTimes(2);
      revokeSpy.mockRestore();
    });

    it('passes only files that passed the type and size checks', () => {
      const resolveAttachments = vi.fn(oneKindAtATime);
      const onError = vi.fn();
      const ref = React.createRef<ChatComposerHandle>();
      renderWithTheme(
        <ChatComposer
          ref={ref}
          acceptedFileTypes={['image/*']}
          onError={onError}
          resolveAttachments={resolveAttachments}
        />
      );
      const a = png('a.png');
      React.act(() => ref.current?.addFiles([a, pdf('report.pdf')]));

      expect(resolveAttachments).toHaveBeenCalledWith([a], []);
      expect(onError).toHaveBeenCalledWith(
        expect.stringContaining('report.pdf'),
        expect.objectContaining({ reason: 'file-type' })
      );
    });

    it('applies maxAttachments to the resolved list', () => {
      const onError = vi.fn();
      const ref = React.createRef<ChatComposerHandle>();
      renderWithTheme(
        <ChatComposer
          ref={ref}
          maxAttachments={1}
          onError={onError}
          resolveAttachments={oneKindAtATime}
        />
      );
      React.act(() => ref.current?.addFiles([png('a.png'), png('b.png')]));

      expect(screen.getByText('a.png')).toBeInTheDocument();
      expect(screen.queryByText('b.png')).toBeNull();
      expect(onError).toHaveBeenCalledWith('Attachment limit reached (max 1)', {
        reason: 'attachment-limit',
      });
    });

    it('reports staged files through onAttachmentsChange', () => {
      const onAttachmentsChange = vi.fn();
      const ref = React.createRef<ChatComposerHandle>();
      renderWithTheme(
        <ChatComposer
          ref={ref}
          onSend={vi.fn()}
          onAttachmentsChange={onAttachmentsChange}
        />
      );
      expect(onAttachmentsChange).not.toHaveBeenCalled();

      const a = png('a.png');
      React.act(() => ref.current?.addFiles([a]));
      expect(onAttachmentsChange).toHaveBeenLastCalledWith([a]);

      fireEvent.click(screen.getByRole('button', { name: /send message/i }));
      expect(onAttachmentsChange).toHaveBeenLastCalledWith([]);
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

  describe('reply-to preview', () => {
    const replyTo = {
      id: 'msg-1',
      content: 'Original message text',
      senderName: 'Ada Lovelace',
    };

    it('renders no preview row by default', () => {
      const { container } = renderWithTheme(<ChatComposer onSend={vi.fn()} />);
      expect(
        container.querySelector('[data-slot="chat-composer-reply-preview"]')
      ).not.toBeInTheDocument();
    });

    it('omits the replyToId key from the payload when not replying', () => {
      const onSend = vi.fn();
      renderWithTheme(<ChatComposer onSend={onSend} />);

      const input = getInput();
      fireEvent.change(input, { target: { value: 'Hi' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(onSend).toHaveBeenCalledTimes(1);
      expect(onSend.mock.calls[0][0]).not.toHaveProperty('replyToId');
    });

    it('shows the sender and content and focuses the input when replyTo is set', () => {
      const { container, rerender } = renderWithTheme(
        <ChatComposer onSend={vi.fn()} />
      );
      expect(getInput()).not.toHaveFocus();

      rerender(<ChatComposer onSend={vi.fn()} replyTo={replyTo} />);

      expect(
        container.querySelector('[data-slot="chat-composer-reply-preview"]')
      ).toBeInTheDocument();
      expect(screen.getByText('Replying to Ada Lovelace')).toBeInTheDocument();
      expect(screen.getByText('Original message text')).toBeInTheDocument();
      expect(getInput()).toHaveFocus();
    });

    it('does not re-steal focus when a new replyTo object has the same id', () => {
      const { rerender } = renderWithTheme(
        <ChatComposer onSend={vi.fn()} replyTo={replyTo} />
      );
      expect(getInput()).toHaveFocus();

      // Host moves focus elsewhere, then re-renders with a recreated (inline)
      // replyTo object for the same message — focus must not be stolen back.
      const addButton = screen.getByRole('button', { name: /add to message/i });
      addButton.focus();
      rerender(<ChatComposer onSend={vi.fn()} replyTo={{ ...replyTo }} />);
      expect(addButton).toHaveFocus();

      // A different reply target re-focuses the input.
      rerender(
        <ChatComposer onSend={vi.fn()} replyTo={{ ...replyTo, id: 'msg-2' }} />
      );
      expect(getInput()).toHaveFocus();
    });

    it('announces the reply target via a polite status region', () => {
      renderWithTheme(
        <ChatComposer
          onSend={vi.fn()}
          replyTo={replyTo}
          onCancelReply={vi.fn()}
        />
      );

      const status = screen.getByRole('status');
      expect(status).toHaveTextContent('Replying to Ada Lovelace');
      expect(status).toHaveTextContent('Original message text');
      // The cancel button must stay outside the announced region.
      expect(status.querySelector('button')).toBeNull();
    });

    it('includes replyToId in the sent message without clearing the reply itself', () => {
      const onSend = vi.fn();
      const onCancelReply = vi.fn();
      renderWithTheme(
        <ChatComposer
          onSend={onSend}
          replyTo={replyTo}
          onCancelReply={onCancelReply}
        />
      );

      const input = getInput();
      fireEvent.change(input, { target: { value: 'A reply' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(onSend).toHaveBeenCalledWith({
        content: 'A reply',
        attachments: [],
        replyToId: 'msg-1',
      });
      // The host owns replyTo state; sending must not invoke onCancelReply.
      expect(onCancelReply).not.toHaveBeenCalled();
    });

    it('fires onCancelReply from the cancel button, with a customizable label', () => {
      const onCancelReply = vi.fn();
      renderWithTheme(
        <ChatComposer
          replyTo={replyTo}
          onCancelReply={onCancelReply}
          replyingToLabel="Respondiendo a"
          cancelReplyLabel="Cancelar respuesta"
        />
      );

      expect(
        screen.getByText('Respondiendo a Ada Lovelace')
      ).toBeInTheDocument();

      fireEvent.click(
        screen.getByRole('button', { name: 'Cancelar respuesta' })
      );
      expect(onCancelReply).toHaveBeenCalledTimes(1);
    });

    it('disables the cancel button while the composer is disabled', () => {
      renderWithTheme(
        <ChatComposer replyTo={replyTo} onCancelReply={vi.fn()} disabled />
      );
      expect(
        screen.getByRole('button', { name: /cancel reply/i })
      ).toBeDisabled();
    });
  });
});
