import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import {
  MessageComposer,
  activeMentionQuery,
  replaceMentionToken,
  type MentionToken,
} from './MessageComposer';

describe('activeMentionQuery', () => {
  it('finds a token at the start of the value', () => {
    expect(activeMentionQuery('@ali', 4)).toEqual({ query: 'ali', start: 0 });
  });

  it('finds a token after whitespace', () => {
    expect(activeMentionQuery('hi @ali', 7)).toEqual({
      query: 'ali',
      start: 3,
    });
  });

  it('ignores an `@` that neither starts the value nor follows whitespace', () => {
    expect(activeMentionQuery('a@b', 3)).toBeNull();
  });

  it('ignores a token containing a second `@`', () => {
    expect(activeMentionQuery('@a@b', 4)).toBeNull();
  });

  it('only looks at the text before the caret', () => {
    expect(activeMentionQuery('@ali there', 4)).toEqual({
      query: 'ali',
      start: 0,
    });
  });
});

describe('replaceMentionToken', () => {
  it('replaces the token and reports the caret after the inserted mention', () => {
    const token: MentionToken = { query: 'al', start: 3 };
    expect(replaceMentionToken('hi @al', token, 'Alice')).toEqual({
      value: 'hi @Alice ',
      caret: 10,
    });
  });

  it('keeps the text that follows the token', () => {
    const token: MentionToken = { query: 'al', start: 3 };
    expect(replaceMentionToken('hi @al there', token, 'Alice').value).toBe(
      'hi @Alice  there'
    );
  });
});

describe('MessageComposer extension points', () => {
  it('renders toolbar slots on a control row in the stacked layout', () => {
    renderWithTheme(
      <MessageComposer
        onSend={vi.fn()}
        layout="stacked"
        toolbarStart={<button type="button">Model</button>}
        toolbarEnd={<button type="button">Mic</button>}
      />
    );

    const toolbar = document.querySelector('[data-slot="composer-toolbar"]');
    expect(toolbar).not.toBeNull();
    expect(
      toolbar!.contains(screen.getByRole('button', { name: 'Model' }))
    ).toBe(true);
    expect(toolbar!.contains(screen.getByRole('button', { name: 'Mic' }))).toBe(
      true
    );
  });

  it('replaces the built-in send button when renderSendButton is given', () => {
    renderWithTheme(
      <MessageComposer
        onSend={vi.fn()}
        labels={{ send: 'Send message' }}
        renderSendButton={({ canSend }) => (
          <button type="submit" disabled={!canSend}>
            Go
          </button>
        )}
      />
    );

    expect(screen.getByRole('button', { name: 'Go' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Send message' })).toBeNull();
  });

  it('uses overridden labels for the textarea and send button', () => {
    renderWithTheme(
      <MessageComposer
        onSend={vi.fn()}
        labels={{ message: 'Nachricht', send: 'Nachricht senden' }}
      />
    );

    expect(screen.getByLabelText('Nachricht')).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Nachricht senden' })
    ).toBeTruthy();
  });

  it('applies a viewport-relative max height to the textarea by default', () => {
    renderWithTheme(<MessageComposer onSend={vi.fn()} />);
    const textarea = screen.getByLabelText('Message') as HTMLTextAreaElement;
    expect(textarea.style.maxHeight).toBe('40vh');
  });

  it('lets an inputProps key handler claim a key before Enter would send', () => {
    const onSend = vi.fn();
    renderWithTheme(
      <MessageComposer
        onSend={onSend}
        inputProps={{
          onKeyDown: (event) => {
            // Stands in for a host overlay that owns Enter while it is open.
            if (event.key === 'Enter') event.preventDefault();
          },
        }}
      />
    );

    const textarea = screen.getByLabelText('Message');
    fireEvent.change(textarea, { target: { value: 'hello' } });
    fireEvent.keyDown(textarea, { key: 'Enter' });

    expect(onSend).not.toHaveBeenCalled();
  });

  it('still sends on Enter when the inputProps key handler declines', () => {
    const onSend = vi.fn();
    const onKeyDown = vi.fn();
    renderWithTheme(
      <MessageComposer onSend={onSend} inputProps={{ onKeyDown }} />
    );

    const textarea = screen.getByLabelText('Message');
    fireEvent.change(textarea, { target: { value: 'hello' } });
    fireEvent.keyDown(textarea, { key: 'Enter' });

    expect(onKeyDown).toHaveBeenCalled();
    expect(onSend).toHaveBeenCalledWith(
      expect.objectContaining({ content: 'hello' })
    );
  });

  it('reports caret movement to an inputProps select handler', () => {
    const onSelect = vi.fn();
    renderWithTheme(
      <MessageComposer onSend={vi.fn()} inputProps={{ onSelect }} />
    );

    fireEvent.select(screen.getByLabelText('Message'));

    expect(onSelect).toHaveBeenCalled();
  });

  it('lets an inputProps paste handler opt out of the built-in paste-to-attach', () => {
    const onPaste = vi.fn((event: React.ClipboardEvent) => {
      event.preventDefault();
    });

    renderWithTheme(
      <MessageComposer onSend={vi.fn()} inputProps={{ onPaste }} />
    );
    fireEvent.paste(screen.getByLabelText('Message'), {
      clipboardData: { items: [] },
    });

    expect(onPaste).toHaveBeenCalled();
  });
});
