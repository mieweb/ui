import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import { MCPToolCallGroup } from './MCPToolCallGroup';
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

const expand = () =>
  fireEvent.click(screen.getByRole('button', { name: /create_container/ }));

describe('MCPToolCallGroup result de-duplication', () => {
  it('shows text wrapped in a single structured field only once', () => {
    const answer = 'React is a JavaScript library for building interfaces.';
    renderWithTheme(
      <MCPToolCallGroup
        toolCalls={[
          call({
            result: {
              type: 'json',
              data: answer,
              structured: { result: answer },
              summary: answer,
            },
          }),
        ]}
      />
    );
    expand();
    expect(screen.queryByText('Fields')).toBeNull();
    expect(
      document.querySelector('[data-slot="ai-tool-call-summary-full"]')
    ).toBeNull();
  });

  it('skips a shortened summary already contained in the result text', () => {
    const text = `${'word '.repeat(80)}end`;
    renderWithTheme(
      <MCPToolCallGroup
        toolCalls={[
          call({
            result: {
              type: 'text',
              data: text,
              summary: `${text.slice(0, 120)}…`,
            },
          }),
        ]}
      />
    );
    expand();
    expect(
      document.querySelector('[data-slot="ai-tool-call-summary-full"]')
    ).toBeNull();
  });
});

describe('MCPToolCallGroup collapsed success', () => {
  it('keeps the result summary inside the row details', () => {
    renderWithTheme(
      <MCPToolCallGroup
        toolCalls={[
          call({
            result: { type: 'text', data: 'Done.', summary: 'Opened foo-dev' },
          }),
        ]}
      />
    );
    expect(screen.queryByText('Opened foo-dev')).toBeNull();
    expand();
    expect(screen.getByText('Opened foo-dev')).toBeInTheDocument();
  });
});

describe('MCPToolCallGroup trust-server link', () => {
  it('hands the call to onTrustServer without approving it', () => {
    const onTrustServer = vi.fn();
    const onApprove = vi.fn();
    renderWithTheme(
      <MCPToolCallGroup
        toolCalls={[
          call({ status: 'awaiting-approval', serverName: 'DeepWiki' }),
        ]}
        onApprove={onApprove}
        onTrustServer={onTrustServer}
      />
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Trust all DeepWiki tools…' })
    );
    expect(onTrustServer).toHaveBeenCalledTimes(1);
    expect(onApprove).not.toHaveBeenCalled();
  });

  it('is absent for calls without a server', () => {
    renderWithTheme(
      <MCPToolCallGroup
        toolCalls={[call({ status: 'awaiting-approval' })]}
        onApprove={() => {}}
        onTrustServer={() => {}}
      />
    );
    expect(screen.queryByRole('button', { name: /Trust all/ })).toBeNull();
  });
});

describe('MCPToolCallGroup details after approval', () => {
  const details = { description: 'Creates a container.', result: undefined };

  it('closes details opened for approval once the call settles', () => {
    const { rerender } = renderWithTheme(
      <MCPToolCallGroup
        toolCalls={[call({ status: 'awaiting-approval', ...details })]}
        onApprove={() => {}}
      />
    );
    expect(screen.getByText('Creates a container.')).toBeInTheDocument();

    rerender(
      <MCPToolCallGroup toolCalls={[call({ status: 'running', ...details })]} />
    );
    expect(screen.getByText('Creates a container.')).toBeInTheDocument();

    rerender(
      <MCPToolCallGroup toolCalls={[call({ status: 'success', ...details })]} />
    );
    expect(screen.queryByText('Creates a container.')).toBeNull();
  });

  it('keeps details the user opened after the call settles', () => {
    const { rerender } = renderWithTheme(
      <MCPToolCallGroup toolCalls={[call({ status: 'running', ...details })]} />
    );
    expand();
    rerender(
      <MCPToolCallGroup toolCalls={[call({ status: 'success', ...details })]} />
    );
    expect(screen.getByText('Creates a container.')).toBeInTheDocument();
  });
});
