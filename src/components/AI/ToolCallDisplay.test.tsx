import { describe, expect, it } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import { MCPToolCallDisplay, ToolCallDisplay } from './MCPToolCall';
import { MCPToolCallGroup } from './MCPToolCallGroup';
import { isSafeHref, ToolCallResultContent } from './ToolCallResultContent';
import type { ToolCall } from './types';

function call(extra: Partial<ToolCall> = {}): ToolCall {
  return {
    id: 'c1',
    toolName: 'create_container',
    parameters: [],
    status: 'success',
    startedAt: new Date('2026-01-01T10:00:00Z'),
    ...extra,
  };
}

describe('ToolCallDisplay', () => {
  it('keeps the MCP-prefixed export as an alias of the same component', () => {
    expect(MCPToolCallDisplay).toBe(ToolCallDisplay);
  });
});

describe('isSafeHref', () => {
  it('allows http(s) and same-origin paths only', () => {
    expect(isSafeHref('https://example.com/a')).toBe(true);
    expect(isSafeHref('/chat/1')).toBe(true);
    expect(isSafeHref('//evil.example')).toBe(false);
    expect(isSafeHref('javascript:alert(1)')).toBe(false);
    expect(isSafeHref('data:text/html,<b>x</b>')).toBe(false);
  });
});

describe('ToolCallResultContent', () => {
  it('renders structured fields with labels', () => {
    renderWithTheme(
      <ToolCallResultContent
        result={{
          type: 'json',
          data: '',
          structured: { vmid: 101 },
          fieldLabels: { vmid: 'Container ID' },
        }}
      />
    );
    expect(screen.getByText('Container ID')).toBeInTheDocument();
    expect(screen.getByText('101')).toBeInTheDocument();
  });

  it('falls back for media it cannot preview', () => {
    renderWithTheme(
      <ToolCallResultContent
        result={{
          type: 'text',
          data: '',
          media: [
            { type: 'image', mimeType: 'image/svg+xml', data: 'PHN2Zz4=' },
          ],
        }}
      />
    );
    expect(screen.queryByRole('img')).toBeNull();
    expect(screen.getByText(/Preview not available/)).toBeInTheDocument();
  });
});

describe('MCPToolCallGroup outcomes', () => {
  it('shows the uncertain notice without expanding', () => {
    renderWithTheme(
      <MCPToolCallGroup toolCalls={[call({ status: 'uncertain' })]} />
    );
    expect(
      screen.getByText(/Could not confirm completion/)
    ).toBeInTheDocument();
    expect(screen.getByText('Not confirmed')).toBeInTheDocument();
  });

  it('renders unsafe links as text rather than anchors', () => {
    renderWithTheme(
      <MCPToolCallGroup
        toolCalls={[
          call({
            result: {
              type: 'text',
              data: 'ok',
              links: [{ href: 'javascript:alert(1)', label: 'Bad link' }],
            },
          }),
        ]}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /create_container/ }));
    expect(screen.getByText('Bad link').closest('a')).toBeNull();
  });

  it('does not repeat structured content as JSON text', () => {
    renderWithTheme(
      <MCPToolCallGroup
        toolCalls={[
          call({
            result: { type: 'json', data: '{"a":1}', structured: { a: 1 } },
          }),
        ]}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /create_container/ }));
    expect(screen.queryByText('Show result')).toBeNull();
  });
});
