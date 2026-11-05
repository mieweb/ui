import { describe, expect, it } from 'vitest';
import { renderWithTheme } from '../../test/test-utils';
import { MCPToolCallDisplay } from './MCPToolCall';
import type { MCPToolCall } from './types';

function call(extra: Partial<MCPToolCall> = {}): MCPToolCall {
  return {
    id: 'a',
    toolName: 'list_dir',
    parameters: [],
    status: 'success',
    startedAt: new Date('2026-01-01T10:00:00Z'),
    duration: 1200,
    ...extra,
  };
}

// The label follows the status icon in both pill renderings.
const pillLabel = (container: HTMLElement) =>
  container.querySelector(
    '[data-slot="collapsible-pill"] > button > span:last-of-type, [data-slot="ai-tool-pill"] > span:last-of-type'
  );

describe('MCPToolCallDisplay', () => {
  it.each([
    ['static pill', {}],
    ['collapsible pill', { result: { type: 'text' as const, data: 'src/' } }],
  ])('isolates a display name in the %s', (_, extra) => {
    const { container } = renderWithTheme(
      <MCPToolCallDisplay
        toolCall={call({ displayName: 'Looked at files in src/', ...extra })}
      />
    );

    const label = pillLabel(container);
    expect(label).toHaveTextContent('Looked at files in src/ · 1.2s');
    expect(label?.querySelector('bdi')).toHaveTextContent(
      'Looked at files in src/'
    );
  });

  it('keeps the friendly name unisolated without a display name', () => {
    const { container } = renderWithTheme(
      <MCPToolCallDisplay toolCall={call()} />
    );

    const label = pillLabel(container);
    expect(label).toHaveTextContent('· 1.2s');
    expect(label?.querySelector('bdi')).toBeNull();
  });

  it.each([
    [
      'a display name hides',
      'Looked up flu shots',
      'Looked up flu shots · 1.2s',
    ],
    ['no display name keeps', undefined, '· "flu shot"'],
    ['an empty display name keeps', '', '· "flu shot"'],
  ])('%s the parameter summary while running', (_, displayName, expected) => {
    const { container } = renderWithTheme(
      <MCPToolCallDisplay
        toolCall={call({
          toolName: 'search_services',
          status: 'running',
          displayName,
          parameters: [{ name: 'query', type: 'string', value: 'flu shot' }],
        })}
      />
    );

    const label = pillLabel(container);
    expect(label).toHaveTextContent(expected);
    if (displayName) expect(label).not.toHaveTextContent('flu shot"');
  });
});
