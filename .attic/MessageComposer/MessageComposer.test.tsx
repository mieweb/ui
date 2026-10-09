import { describe, expect, it, vi } from 'vitest';
import * as React from 'react';
import { screen } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import { MessageComposer } from './MessageComposer';

const replyTo = {
  id: 'msg-1',
  content: 'Original message text',
  senderName: 'Ada Lovelace',
};

function getInput() {
  return screen.getByRole('textbox', { name: /message/i });
}

describe('MessageComposer', () => {
  describe('reply-to focus', () => {
    it('focuses the input when replyTo is set', () => {
      const { rerender } = renderWithTheme(
        <MessageComposer onSend={vi.fn()} />
      );
      expect(getInput()).not.toHaveFocus();

      rerender(<MessageComposer onSend={vi.fn()} replyTo={replyTo} />);
      expect(getInput()).toHaveFocus();
    });

    it('does not re-steal focus when a new replyTo object has the same id', () => {
      const { rerender } = renderWithTheme(
        <MessageComposer
          onSend={vi.fn()}
          replyTo={replyTo}
          onCancelReply={vi.fn()}
        />
      );
      expect(getInput()).toHaveFocus();

      // Host moves focus elsewhere, then re-renders with a recreated (inline)
      // replyTo object for the same message — focus must not be stolen back.
      const cancelButton = screen.getByRole('button', {
        name: /cancel reply/i,
      });
      cancelButton.focus();
      rerender(
        <MessageComposer
          onSend={vi.fn()}
          replyTo={{ ...replyTo }}
          onCancelReply={vi.fn()}
        />
      );
      expect(cancelButton).toHaveFocus();

      // A different reply target re-focuses the input.
      rerender(
        <MessageComposer
          onSend={vi.fn()}
          replyTo={{ ...replyTo, id: 'msg-2' }}
          onCancelReply={vi.fn()}
        />
      );
      expect(getInput()).toHaveFocus();
    });
  });
});
