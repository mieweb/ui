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
