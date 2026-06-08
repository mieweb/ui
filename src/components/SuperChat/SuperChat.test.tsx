import * as React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { createMarkdownRenderer } from './render/createMarkdownRenderer';
import { createCodePlugin } from './plugins/code';
import { createGenUIPlugin } from './plugins/genui';
import { SuperChat } from './SuperChat';
import type {
  GenUIRegistry,
  GenUIWidgetProps,
  SuperChatConversation,
} from './index';

function renderText(node: React.ReactNode) {
  return render(<div>{node}</div>);
}

describe('createMarkdownRenderer', () => {
  it('renders GFM markdown (bold + lists)', () => {
    const r = createMarkdownRenderer();
    renderText(r('**bold** and\n\n- one\n- two', { messageId: 'm1', streaming: false, role: 'assistant' }));
    expect(screen.getByText('bold').tagName).toBe('STRONG');
    expect(screen.getByText('one')).toBeInTheDocument();
    expect(screen.getByText('two')).toBeInTheDocument();
  });

  it('sanitizes untrusted HTML / script by default', () => {
    const r = createMarkdownRenderer();
    const { container } = renderText(
      r('hi <img src=x onerror="alert(1)"> <script>alert(2)</script>', {
        messageId: 'm2',
        streaming: false,
        role: 'assistant',
      })
    );
    expect(container.querySelector('script')).toBeNull();
    // react-markdown does not render raw HTML, so no <img> sink survives at all.
    expect(container.querySelector('img')).toBeNull();
  });

  it('keeps syntax-highlight token classes through sanitization (code plugin)', () => {
    const r = createMarkdownRenderer({ plugins: [createCodePlugin()] });
    const { container } = renderText(
      r('```js\nconst x = 1;\n```', { messageId: 'm3', streaming: false, role: 'assistant' })
    );
    expect(container.querySelector('code.hljs, code[class*="language-"]')).not.toBeNull();
  });
});

describe('GenUI plugin', () => {
  const KpiCard = ({ data }: GenUIWidgetProps<{ label: string; value: string }>) => (
    <div data-testid="kpi">{data.label}: {data.value}</div>
  );
  const registry: GenUIRegistry = {
    kpi_card: {
      component: () => Promise.resolve({ default: KpiCard as React.ComponentType<GenUIWidgetProps> }),
      prefetch: 'eager',
    },
  };

  it('renders a registered widget from a fenced genui block', async () => {
    const r = createMarkdownRenderer({ plugins: [createGenUIPlugin(registry)] });
    renderText(
      r('```genui\n{ "widget": "kpi_card", "props": { "label": "Risk", "value": "High" } }\n```', {
        messageId: 'm4',
        streaming: false,
        role: 'assistant',
      })
    );
    await waitFor(() => expect(screen.getByTestId('kpi')).toHaveTextContent('Risk: High'));
  });

  it('falls back to an inert block for unknown widgets', () => {
    const r = createMarkdownRenderer({ plugins: [createGenUIPlugin(registry)] });
    const { container } = renderText(
      r('```genui\n{ "widget": "nope", "props": {} }\n```', {
        messageId: 'm5',
        streaming: false,
        role: 'assistant',
      })
    );
    expect(container.querySelector('[data-slot="superchat-genui-fallback"]')).not.toBeNull();
  });
});

describe('SuperChat', () => {
  const conversation: SuperChatConversation = {
    id: 'c1',
    title: 'Intake',
    participants: [
      { id: 'u1', kind: 'human', name: 'Alice Reyes' },
      { id: 'a1', kind: 'agent', name: 'Triage Agent', color: '#2563eb' },
    ],
    thread: [
      { id: 'm1', participantId: 'u1', text: 'hello @Triage', time: '2026-06-07T09:00:00Z', mentions: ['a1'] },
      { id: 'm2', participantId: 'a1', text: '**hi** Alice', time: '2026-06-07T09:00:30Z' },
    ],
  };

  it('renders participants and markdown messages', () => {
    render(<div style={{ height: 400 }}><SuperChat conversations={[conversation]} currentParticipantId="u1" /></div>);
    // 'Intake' appears in both the sidebar and the thread header.
    expect(screen.getAllByText('Intake').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Triage Agent').length).toBeGreaterThan(0);
    expect(screen.getByText('hi').tagName).toBe('STRONG');
  });

  it('fires onMessageSent with detected mentions', async () => {
    const onMessageSent = vi.fn();
    const { default: userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    render(<SuperChat conversations={[conversation]} currentParticipantId="u1" onMessageSent={onMessageSent} />);
    const input = screen.getByLabelText('Message');
    await user.type(input, 'ping @Triage');
    await user.click(screen.getByLabelText('Send message'));
    expect(onMessageSent).toHaveBeenCalledWith('ping @Triage', expect.objectContaining({ mentions: ['a1'] }));
  });

  it('disables the composer when readOnly', () => {
    render(<SuperChat conversations={[conversation]} currentParticipantId="u1" readOnly />);
    expect(screen.getByLabelText('Message')).toBeDisabled();
  });

  it('opens an @-mention menu and inserts the chosen participant', async () => {
    const { default: userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    render(<SuperChat conversations={[conversation]} currentParticipantId="u1" />);
    const input = screen.getByLabelText('Message') as HTMLTextAreaElement;
    await user.type(input, 'hello @Tri');
    const menu = screen.getByRole('listbox', { name: 'Mention a participant' });
    expect(menu).toBeInTheDocument();
    await user.click(screen.getByRole('option', { name: /Triage Agent/ }));
    expect(input.value).toBe('hello @Triage ');
    expect(screen.queryByRole('listbox')).toBeNull();
  });
});
