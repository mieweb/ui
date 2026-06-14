import * as React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import { createMarkdownRenderer } from './render/createMarkdownRenderer';
import { createCodePlugin } from './plugins/code';
import { createGenUIPlugin } from './plugins/genui';
import { createMermaidPlugin } from './plugins/mermaid';
import { createImagePlugin } from './plugins/image';
import { createNitroTablePlugin } from './plugins/nitroTable';
import { SuperChat } from './SuperChat';
import { SuperChatConversations } from './SuperChatConversations';
import { SuperChatInbox } from './SuperChatInbox';
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
    renderText(
      r('**bold** and\n\n- one\n- two', {
        messageId: 'm1',
        streaming: false,
        role: 'assistant',
      })
    );
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
      r('```js\nconst x = 1;\n```', {
        messageId: 'm3',
        streaming: false,
        role: 'assistant',
      })
    );
    expect(
      container.querySelector('code.hljs, code[class*="language-"]')
    ).not.toBeNull();
  });
});

describe('GenUI plugin', () => {
  const KpiCard = ({
    data,
  }: GenUIWidgetProps<{ label: string; value: string }>) => (
    <div data-testid="kpi">
      {data.label}: {data.value}
    </div>
  );
  const registry: GenUIRegistry = {
    kpi_card: {
      component: () =>
        Promise.resolve({
          default: KpiCard as React.ComponentType<GenUIWidgetProps>,
        }),
      prefetch: 'eager',
    },
  };

  it('renders a registered widget from a fenced genui block', async () => {
    const r = createMarkdownRenderer({
      plugins: [createGenUIPlugin(registry)],
    });
    renderText(
      r(
        '```genui\n{ "widget": "kpi_card", "props": { "label": "Risk", "value": "High" } }\n```',
        {
          messageId: 'm4',
          streaming: false,
          role: 'assistant',
        }
      )
    );
    await waitFor(() =>
      expect(screen.getByTestId('kpi')).toHaveTextContent('Risk: High')
    );
  });

  it('falls back to an inert block for unknown widgets', () => {
    const r = createMarkdownRenderer({
      plugins: [createGenUIPlugin(registry)],
    });
    const { container } = renderText(
      r('```genui\n{ "widget": "nope", "props": {} }\n```', {
        messageId: 'm5',
        streaming: false,
        role: 'assistant',
      })
    );
    expect(
      container.querySelector('[data-slot="superchat-genui-fallback"]')
    ).not.toBeNull();
  });

  it('falls back to an inert block for malformed JSON once streaming is complete', () => {
    const r = createMarkdownRenderer({
      plugins: [createGenUIPlugin(registry)],
    });
    const { container } = renderText(
      r('```genui\n{ "widget": "kpi_card", "props": { "label": "Risk" \n```', {
        messageId: 'm6',
        streaming: false,
        role: 'assistant',
      })
    );
    expect(
      container.querySelector('[data-slot="superchat-genui-fallback"]')
    ).not.toBeNull();
  });
});

describe('mermaid plugin', () => {
  it('shows a pending card while the message is still streaming', () => {
    const r = createMarkdownRenderer({ plugins: [createMermaidPlugin()] });
    const { container } = renderText(
      r('```mermaid\ngraph TD; A-->B;\n```', {
        messageId: 'mm1',
        streaming: true,
        role: 'assistant',
      })
    );
    expect(
      container.querySelector('[data-slot="superchat-mermaid-pending"]')
    ).not.toBeNull();
  });

  it('falls back for an empty mermaid block once streaming is complete', () => {
    const r = createMarkdownRenderer({ plugins: [createMermaidPlugin()] });
    const { container } = renderText(
      r('```mermaid\n\n```', {
        messageId: 'mm2',
        streaming: false,
        role: 'assistant',
      })
    );
    expect(
      container.querySelector('[data-slot="superchat-mermaid-fallback"]')
    ).not.toBeNull();
  });
});

describe('image plugin', () => {
  it('makes images click-to-zoom and opens a lightbox', async () => {
    const { default: userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    const r = createMarkdownRenderer({ plugins: [createImagePlugin()] });
    renderText(
      r('![ECG strip](https://example.com/ecg.png)', {
        messageId: 'img1',
        streaming: false,
        role: 'assistant',
      })
    );
    const trigger = screen.getByRole('button', {
      name: 'View image: ECG strip',
    });
    await user.click(trigger);
    expect(
      screen.getByRole('dialog', { name: /ECG strip/ })
    ).toBeInTheDocument();
  });
});

describe('nitro-table plugin', () => {
  it('renders table data (degrading to an HTML table when datavis is absent)', async () => {
    const r = createMarkdownRenderer({ plugins: [createNitroTablePlugin()] });
    renderText(
      r('| Code | Description |\n| --- | --- |\n| 93000 | ECG, complete |', {
        messageId: 'tbl1',
        streaming: false,
        role: 'assistant',
      })
    );
    await waitFor(() => expect(screen.getByText('93000')).toBeInTheDocument());
    expect(screen.getByText('Description')).toBeInTheDocument();
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
      {
        id: 'm1',
        participantId: 'u1',
        text: 'hello @Triage',
        time: '2026-06-07T09:00:00Z',
        mentions: ['a1'],
      },
      {
        id: 'm2',
        participantId: 'a1',
        text: '**hi** Alice',
        time: '2026-06-07T09:00:30Z',
      },
    ],
  };

  it('renders participants and markdown messages', () => {
    render(
      <div style={{ height: 400 }}>
        <SuperChat conversation={conversation} currentParticipantId="u1" />
      </div>
    );
    expect(screen.getByText('Intake')).toBeInTheDocument();
    expect(screen.getAllByText('Triage Agent').length).toBeGreaterThan(0);
    expect(screen.getByText('hi').tagName).toBe('STRONG');
  });

  it('fires onMessageSent with detected mentions', async () => {
    const onMessageSent = vi.fn();
    const { default: userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    render(
      <SuperChat
        conversation={conversation}
        currentParticipantId="u1"
        onMessageSent={onMessageSent}
      />
    );
    const input = screen.getByLabelText('Message');
    await user.type(input, 'ping @Triage');
    await user.click(screen.getByLabelText('Send message'));
    expect(onMessageSent).toHaveBeenCalledWith(
      'ping @Triage',
      expect.objectContaining({ mentions: ['a1'] })
    );
  });

  it('does not detect mentions for system participants', async () => {
    const onMessageSent = vi.fn();
    const withSystem: SuperChatConversation = {
      ...conversation,
      participants: [
        ...conversation.participants,
        { id: 's1', kind: 'system', name: 'System' },
      ],
    };
    const { default: userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    render(
      <SuperChat
        conversation={withSystem}
        currentParticipantId="u1"
        onMessageSent={onMessageSent}
      />
    );
    const input = screen.getByLabelText('Message');
    await user.type(input, 'ping @System');
    await user.click(screen.getByLabelText('Send message'));
    expect(onMessageSent).toHaveBeenCalledWith(
      'ping @System',
      expect.objectContaining({ mentions: [] })
    );
  });

  it('disables the composer when readOnly', () => {
    render(
      <SuperChat
        conversation={conversation}
        currentParticipantId="u1"
        readOnly
      />
    );
    expect(screen.getByLabelText('Message')).toBeDisabled();
  });

  it('opens an @-mention menu and inserts the chosen participant', async () => {
    const { default: userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    render(<SuperChat conversation={conversation} currentParticipantId="u1" />);
    const input = screen.getByLabelText('Message') as HTMLTextAreaElement;
    await user.type(input, 'hello @Tri');
    const menu = screen.getByRole('listbox', { name: 'Mention a participant' });
    expect(menu).toBeInTheDocument();
    await user.click(screen.getByRole('option', { name: /Triage Agent/ }));
    expect(input.value).toBe('hello @Triage ');
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('renders AI content blocks of type code', () => {
    const withCode: SuperChatConversation = {
      ...conversation,
      thread: [
        ...conversation.thread,
        {
          id: 'm3',
          participantId: 'a1',
          time: '2026-06-07T09:01:00Z',
          content: [{ type: 'code', text: 'const x = 1;', language: 'ts' }],
        },
      ],
    };
    const { container } = render(
      <div style={{ height: 400 }}>
        <SuperChat conversation={withCode} currentParticipantId="u1" />
      </div>
    );
    expect(container.querySelector('code')).toHaveTextContent('const x = 1;');
  });
});

describe('SuperChatConversations', () => {
  const conversations: SuperChatConversation[] = [
    {
      id: 'c1',
      title: 'Intake',
      unread: 2,
      participants: [{ id: 'u1', kind: 'human', name: 'Alice Reyes' }],
      thread: [
        {
          id: 'm1',
          participantId: 'u1',
          text: 'hello',
          time: '2026-06-07T09:00:00Z',
        },
      ],
    },
    {
      id: 'c2',
      title: 'Follow-up',
      participants: [{ id: 'u1', kind: 'human', name: 'Alice Reyes' }],
      thread: [
        {
          id: 'm2',
          participantId: 'u1',
          text: 'later',
          time: '2026-06-07T10:00:00Z',
        },
      ],
    },
  ];

  it('renders the conversation list with an unread badge', () => {
    render(<SuperChatConversations conversations={conversations} />);
    expect(screen.getByText('Intake')).toBeInTheDocument();
    expect(screen.getByText('Follow-up')).toBeInTheDocument();
    expect(screen.getByText('unread messages', { exact: false }));
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('fires onConversationOpened when a conversation is selected', async () => {
    const onConversationOpened = vi.fn();
    const { default: userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    render(
      <SuperChatConversations
        conversations={conversations}
        onConversationOpened={onConversationOpened}
      />
    );
    await user.click(screen.getByText('Follow-up'));
    expect(onConversationOpened).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'c2' })
    );
  });

  it('fires onNewConversation from the new-conversation button', async () => {
    const onNewConversation = vi.fn();
    const { default: userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    render(
      <SuperChatConversations
        conversations={conversations}
        onNewConversation={onNewConversation}
      />
    );
    await user.click(screen.getByLabelText('New conversation'));
    expect(onNewConversation).toHaveBeenCalled();
  });
});

describe('SuperChatInbox', () => {
  const conversations: SuperChatConversation[] = [
    {
      id: 'c1',
      title: 'Intake',
      participants: [
        { id: 'u1', kind: 'human', name: 'Alice Reyes' },
        { id: 'a1', kind: 'agent', name: 'Triage Agent', color: '#2563eb' },
      ],
      thread: [
        {
          id: 'm1',
          participantId: 'a1',
          text: 'first conversation',
          time: '2026-06-07T09:00:00Z',
        },
      ],
    },
    {
      id: 'c2',
      title: 'Follow-up',
      participants: [{ id: 'u1', kind: 'human', name: 'Alice Reyes' }],
      thread: [
        {
          id: 'm2',
          participantId: 'u1',
          text: 'second conversation',
          time: '2026-06-07T10:00:00Z',
        },
      ],
    },
  ];

  it('renders both the conversation list and the active panel', () => {
    const { container } = render(
      <div style={{ height: 400 }}>
        <SuperChatInbox
          conversations={conversations}
          currentParticipantId="u1"
          defaultActiveConversationId="c1"
        />
      </div>
    );
    expect(
      container.querySelector('[data-slot="superchat-conversations"]')
    ).not.toBeNull();
    const panel = container.querySelector('[data-slot="superchat"]');
    expect(panel).not.toBeNull();
    const thread = within(panel as HTMLElement);
    expect(thread.getByText('first conversation')).toBeInTheDocument();
  });

  it('switches the active panel when another conversation is opened', async () => {
    const { default: userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    const { container } = render(
      <div style={{ height: 400 }}>
        <SuperChatInbox
          conversations={conversations}
          currentParticipantId="u1"
          defaultActiveConversationId="c1"
        />
      </div>
    );
    const panel = () =>
      within(container.querySelector('[data-slot="superchat"]') as HTMLElement);
    expect(panel().getByText('first conversation')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Follow-up/ }));
    expect(panel().getByText('second conversation')).toBeInTheDocument();
  });
});
