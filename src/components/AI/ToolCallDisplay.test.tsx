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

  it('shows description and hints while awaiting approval', () => {
    renderWithTheme(
      <ToolCallDisplay
        toolCall={call({
          status: 'awaiting-approval',
          description: 'Creates a container.',
          hints: { idempotent: true },
        })}
      />
    );
    expect(screen.getByText('Creates a container.')).toBeInTheDocument();
    expect(
      screen.getByText('Provider says repeating has no extra effect')
    ).toBeInTheDocument();
  });

  it('keeps focus on the pill when a call starts awaiting approval', () => {
    const toolCall = call({
      status: 'running',
      description: 'Creates a container.',
    });
    const { rerender } = renderWithTheme(
      <ToolCallDisplay toolCall={toolCall} defaultCollapsed />
    );
    const pill = screen.getByRole('button', { name: /create container/i });
    pill.focus();
    rerender(
      <ToolCallDisplay
        toolCall={{ ...toolCall, status: 'awaiting-approval' }}
        defaultCollapsed
      />
    );
    expect(document.activeElement).toBe(pill);
    expect(pill).toHaveAttribute('aria-expanded', 'true');
  });

  it('keeps links and rich content on an error result', () => {
    renderWithTheme(
      <ToolCallDisplay
        toolCall={call({
          status: 'error',
          result: {
            type: 'error',
            data: 'Quota exceeded',
            links: [{ href: 'https://a.example/logs', label: 'Open logs' }],
            truncated: true,
          },
        })}
      />
    );
    expect(screen.getByText('Quota exceeded')).toBeInTheDocument();
    expect(screen.getByText('Open logs')).toBeInTheDocument();
    expect(screen.getByText(/too large to keep/)).toBeInTheDocument();
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

  it('keeps independent text next to structured fields', () => {
    renderWithTheme(
      <MCPToolCallGroup
        toolCalls={[
          call({
            result: {
              type: 'json',
              data: '3 of 10 rows written',
              structured: { written: 3 },
            },
          }),
        ]}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /create_container/ }));
    expect(screen.getByText('Show result')).toBeInTheDocument();
  });

  it('opens approval details when an existing row starts awaiting approval', () => {
    const details = {
      description: 'Creates a container.',
      result: undefined,
    };
    const { rerender } = renderWithTheme(
      <MCPToolCallGroup toolCalls={[call({ status: 'pending', ...details })]} />
    );
    expect(screen.queryByText('Creates a container.')).toBeNull();
    rerender(
      <MCPToolCallGroup
        toolCalls={[call({ status: 'awaiting-approval', ...details })]}
        onApprove={() => {}}
      />
    );
    expect(screen.getByText('Creates a container.')).toBeInTheDocument();
  });

  it('never hands an unsafe href to a host click handler', () => {
    renderWithTheme(
      <MCPToolCallGroup
        onLinkClick={() => {}}
        toolCalls={[
          call({
            result: {
              type: 'text',
              data: 'ok',
              links: [{ href: '/\\evil.example', label: 'Sneaky' }],
            },
          }),
        ]}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /create_container/ }));
    expect(screen.getByText('Sneaky').closest('a')).toBeNull();
  });
});

describe('ToolCallDisplay uncertain outcome', () => {
  it('explains the outcome outside the disclosure', () => {
    renderWithTheme(
      <ToolCallDisplay toolCall={call({ status: 'uncertain' })} />
    );
    expect(
      screen.getByText(/Could not confirm completion/)
    ).toBeInTheDocument();
  });
});

describe('structured results that JSON cannot represent', () => {
  it('shows a fallback instead of throwing', () => {
    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;
    renderWithTheme(
      <ToolCallResultContent
        result={{ type: 'json', data: '', structured: [1n] }}
      />
    );
    renderWithTheme(
      <ToolCallResultContent
        result={{ type: 'json', data: '', structured: { a: cyclic } }}
      />
    );
    expect(
      screen.getByText('This result cannot be displayed')
    ).toBeInTheDocument();
  });
});
