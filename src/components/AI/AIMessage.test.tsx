import { describe, expect, it } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import { AIMessageDisplay } from './AIMessage';
import type { AIMessage } from './types';

function thinkingMessage(status: AIMessage['status']): AIMessage {
  return {
    id: 'msg-1',
    role: 'assistant',
    status,
    timestamp: new Date('2026-01-01T10:00:00Z'),
    content: [{ type: 'thinking', text: 'Reasoning about the request…' }],
  };
}

describe('AIMessageDisplay tool message', () => {
  const toolMessage: AIMessage = {
    id: 'tool-1',
    role: 'tool',
    status: 'complete',
    timestamp: new Date('2026-01-01T10:00:00Z'),
    content: [{ type: 'text', text: 'Ran list_dir' }],
  };

  it('renders the content without an avatar, even when showAvatar is set', () => {
    const { container } = renderWithTheme(
      <AIMessageDisplay message={toolMessage} showAvatar />
    );

    expect(screen.getByText('Ran list_dir')).toBeInTheDocument();
    expect(
      container.querySelector('[data-slot="ai-message-avatar"]')
    ).not.toBeInTheDocument();
  });
});

describe('AIMessageDisplay toolCallGroup', () => {
  const toolUse = (id: string): AIMessage['content'][number] => ({
    type: 'tool_use',
    toolCall: {
      id,
      toolName: `tool_${id}`,
      parameters: [],
      status: 'success',
      startedAt: new Date('2026-01-01T10:00:00Z'),
    },
  });
  const message: AIMessage = {
    id: 'msg-tools',
    role: 'assistant',
    status: 'complete',
    timestamp: new Date('2026-01-01T10:00:00Z'),
    content: [
      toolUse('a'),
      toolUse('b'),
      { type: 'text', text: 'Halfway there' },
      toolUse('c'),
    ],
  };

  it('groups each run of consecutive tool_use blocks', () => {
    const { container } = renderWithTheme(
      <AIMessageDisplay message={message} toolCallGroup={{}} />
    );

    const groups = container.querySelectorAll(
      '[data-slot="ai-tool-call-group"]'
    );
    expect(groups).toHaveLength(2);
    expect(
      screen.getByRole('button', { name: 'Used 2 tools' })
    ).toBeInTheDocument();
    expect(screen.getByText('Halfway there')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="ai-tool-pill"]')).toBeNull();
  });

  it('keeps a pill per call without toolCallGroup', () => {
    const { container } = renderWithTheme(
      <AIMessageDisplay message={message} />
    );

    expect(
      container.querySelector('[data-slot="ai-tool-call-group"]')
    ).toBeNull();
    expect(
      container.querySelectorAll('[data-slot="ai-tool-call"]')
    ).toHaveLength(3);
  });
});

describe('AIMessageDisplay thinking block', () => {
  it('auto-collapses the thinking block when streaming finishes', () => {
    const { rerender } = renderWithTheme(
      <AIMessageDisplay message={thinkingMessage('streaming')} />
    );

    const pill = screen.getByRole('button', { name: /thinking/i });
    expect(pill).toHaveAttribute('aria-expanded', 'true');

    rerender(<AIMessageDisplay message={thinkingMessage('complete')} />);

    expect(screen.getByRole('button', { name: /thought/i })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
  });

  it('lets the user re-expand after the auto-collapse', () => {
    const { rerender } = renderWithTheme(
      <AIMessageDisplay message={thinkingMessage('streaming')} />
    );
    rerender(<AIMessageDisplay message={thinkingMessage('complete')} />);

    const pill = screen.getByRole('button', { name: /thought/i });
    fireEvent.click(pill);

    expect(pill).toHaveAttribute('aria-expanded', 'true');
  });

  it('re-expands when the same block starts streaming again', () => {
    const { rerender } = renderWithTheme(
      <AIMessageDisplay message={thinkingMessage('streaming')} />
    );
    rerender(<AIMessageDisplay message={thinkingMessage('complete')} />);
    rerender(<AIMessageDisplay message={thinkingMessage('streaming')} />);

    expect(screen.getByRole('button', { name: /thinking/i })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
  });

  it('keeps a mount-complete thinking block expanded by default', () => {
    renderWithTheme(<AIMessageDisplay message={thinkingMessage('complete')} />);

    expect(screen.getByRole('button', { name: /thought/i })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
  });
});
