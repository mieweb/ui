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

  it('preserves single newlines as hard line breaks', () => {
    const r = createMarkdownRenderer();
    const { container } = renderText(
      r('another\none\nthere', {
        messageId: 'm1',
        streaming: false,
        role: 'user',
      })
    );
    // Three lines separated by two <br> elements (newlines preserved).
    expect(container.querySelectorAll('br')).toHaveLength(2);
    expect(container.querySelector('p')?.textContent).toBe(
      'another\none\nthere'
    );
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

  it('renders inline data: image URLs when the image plugin is enabled', () => {
    const r = createMarkdownRenderer({ plugins: [createImagePlugin()] });
    const dataUrl =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const { container } = renderText(
      r(`![shot](${dataUrl})`, {
        messageId: 'mimg',
        streaming: false,
        role: 'assistant',
      })
    );
    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    expect(img?.getAttribute('src')).toBe(dataUrl);
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

  it('styles each core/GFM markdown element', () => {
    const r = createMarkdownRenderer();
    const md = [
      '# H1',
      '## H2',
      '### H3',
      '',
      'Para with **bold**, _italic_, ~~strike~~, `inline`, and [link](https://example.com).',
      '',
      '> A quote',
      '',
      '- bullet one',
      '- bullet two',
      '',
      '1. step one',
      '2. step two',
      '',
      '| Code | Desc |',
      '| --- | --- |',
      '| 93000 | ECG |',
      '',
      '---',
    ].join('\n');
    const { container } = renderText(
      r(md, { messageId: 'm-md', streaming: false, role: 'assistant' })
    );

    // Headings render with a distinct size/weight class (preflight would
    // otherwise flatten them to body text).
    const h1 = container.querySelector('h1');
    const h2 = container.querySelector('h2');
    const h3 = container.querySelector('h3');
    expect(h1?.textContent).toBe('H1');
    expect(h1?.className).toContain('font-semibold');
    expect(h2?.className).toContain('text-lg');
    expect(h3?.className).toContain('text-base');

    // Inline emphasis.
    expect(screen.getByText('bold').tagName).toBe('STRONG');
    expect(screen.getByText('italic').tagName).toBe('EM');
    expect(screen.getByText('strike').tagName).toBe('DEL');
    expect(screen.getByText('inline').tagName).toBe('CODE');

    // Link opens safely in a new tab.
    const link = screen.getByRole('link', { name: 'link' });
    expect(link).toHaveAttribute('href', 'https://example.com');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));

    // Blockquote.
    expect(container.querySelector('blockquote')?.textContent).toContain(
      'A quote'
    );

    // Unordered list shows disc markers; ordered list shows decimals.
    const ul = container.querySelector('ul');
    const ol = container.querySelector('ol');
    expect(ul?.className).toContain('list-disc');
    expect(ul?.querySelectorAll('li')).toHaveLength(2);
    expect(ol?.className).toContain('list-decimal');
    expect(ol?.querySelectorAll('li')).toHaveLength(2);

    // GFM table.
    expect(container.querySelector('table')).not.toBeNull();
    expect(screen.getByText('Code').tagName).toBe('TH');
    expect(screen.getByText('93000').tagName).toBe('TD');

    // Horizontal rule.
    expect(container.querySelector('hr')).not.toBeNull();
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

  it('attaches a pasted image and sends it with the message', async () => {
    const onMessageSent = vi.fn();
    const { fireEvent } = await import('@testing-library/react');
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
    const file = new File(['fake-bytes'], 'shot.png', { type: 'image/png' });
    fireEvent.paste(input, {
      clipboardData: {
        items: [
          {
            kind: 'file',
            type: 'image/png',
            getAsFile: () => file,
          },
        ],
      },
    });
    // The pasted image shows up as a removable preview thumbnail.
    const remove = await screen.findByLabelText('Remove shot.png');
    expect(remove).toBeInTheDocument();
    await user.click(screen.getByLabelText('Send message'));
    expect(onMessageSent).toHaveBeenCalledWith(
      '',
      expect.objectContaining({
        attachments: [
          expect.objectContaining({
            name: 'shot.png',
            type: 'image/png',
            dataUrl: expect.stringMatching(/^data:image\/png/),
          }),
        ],
      })
    );
  });

  it('attaches a file chosen via the paperclip and sends it', async () => {
    const onMessageSent = vi.fn();
    const { default: userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    const { container } = render(
      <SuperChat
        conversation={conversation}
        currentParticipantId="u1"
        onMessageSent={onMessageSent}
      />
    );
    expect(screen.getByLabelText('Attach files')).toBeInTheDocument();
    const fileInput = container.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    const file = new File(['fake-bytes'], 'picked.png', { type: 'image/png' });
    await user.upload(fileInput, file);
    const remove = await screen.findByLabelText('Remove picked.png');
    expect(remove).toBeInTheDocument();
    await user.click(screen.getByLabelText('Send message'));
    expect(onMessageSent).toHaveBeenCalledWith(
      '',
      expect.objectContaining({
        attachments: [
          expect.objectContaining({
            name: 'picked.png',
            type: 'image/png',
            dataUrl: expect.stringMatching(/^data:image\/png/),
          }),
        ],
      })
    );
  });

  it('attaches a non-image file (pdf) with an icon preview', async () => {
    const onMessageSent = vi.fn();
    const { default: userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    const { container } = render(
      <SuperChat
        conversation={conversation}
        currentParticipantId="u1"
        onMessageSent={onMessageSent}
      />
    );
    const fileInput = container.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    const file = new File(['%PDF-1.4'], 'report.pdf', {
      type: 'application/pdf',
    });
    await user.upload(fileInput, file);
    // Non-image attachments show a labelled chip (no broken <img> preview).
    const remove = await screen.findByLabelText('Remove report.pdf');
    expect(remove).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: 'report.pdf' })).toBeNull();
    await user.click(screen.getByLabelText('Send message'));
    expect(onMessageSent).toHaveBeenCalledWith(
      '',
      expect.objectContaining({
        attachments: [
          expect.objectContaining({
            name: 'report.pdf',
            type: 'application/pdf',
          }),
        ],
      })
    );
  });

  it('restricts the file picker to acceptedFileTypes', async () => {
    const onMessageSent = vi.fn();
    const { default: userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    const { container } = render(
      <SuperChat
        conversation={conversation}
        currentParticipantId="u1"
        acceptedFileTypes={['image']}
        onMessageSent={onMessageSent}
      />
    );
    const fileInput = container.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    expect(fileInput.accept).toBe('image/*');
    // A disallowed type (audio) is ignored — no preview chip appears.
    const file = new File(['id3'], 'song.mp3', { type: 'audio/mpeg' });
    await user.upload(fileInput, file);
    expect(screen.queryByLabelText('Remove song.mp3')).toBeNull();
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

  it('orders the thread newest-first when order="desc"', () => {
    const { getAllByRole } = render(
      <div style={{ height: 400 }}>
        <SuperChat
          conversation={conversation}
          currentParticipantId="u1"
          order="desc"
        />
      </div>
    );
    const articles = getAllByRole('article');
    // Newest (m2 "hi Alice") should appear before oldest (m1 "hello @Triage").
    expect(articles[0]).toHaveTextContent('hi');
    expect(articles[1]).toHaveTextContent('hello');
  });

  it('mounts the virtualized thread without error when virtualized', () => {
    const { getByRole } = render(
      <div style={{ height: 400 }}>
        <SuperChat
          conversation={conversation}
          currentParticipantId="u1"
          virtualized
        />
      </div>
    );
    // The scroll container keeps its log role; rows window in based on layout
    // (jsdom reports zero size, so the assertion stays on the container).
    const log = getByRole('log', { name: 'Messages' });
    expect(log).toBeInTheDocument();
    expect(log).toHaveAttribute('data-slot', 'superchat-thread');
  });

  it('does not show an edit affordance without onMessageEdited', () => {
    render(
      <div style={{ height: 400 }}>
        <SuperChat conversation={conversation} currentParticipantId="u1" />
      </div>
    );
    expect(
      screen.queryByRole('button', { name: 'Edit message' })
    ).not.toBeInTheDocument();
  });

  it('only offers editing on the local user’s own messages', () => {
    render(
      <div style={{ height: 400 }}>
        <SuperChat
          conversation={conversation}
          currentParticipantId="u1"
          onMessageEdited={() => {}}
        />
      </div>
    );
    // u1 authored m1; a1 authored m2 — only one edit button should exist.
    const editButtons = screen.getAllByRole('button', { name: 'Edit message' });
    expect(editButtons).toHaveLength(1);
  });

  it('edits a message and fires onMessageEdited with the new text', async () => {
    const { default: userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    const onMessageEdited = vi.fn();
    render(
      <div style={{ height: 400 }}>
        <SuperChat
          conversation={conversation}
          currentParticipantId="u1"
          onMessageEdited={onMessageEdited}
        />
      </div>
    );
    await user.click(screen.getByRole('button', { name: 'Edit message' }));
    const editor = screen.getByRole('textbox', { name: 'Edit message' });
    await user.clear(editor);
    await user.type(editor, 'edited body');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(onMessageEdited).toHaveBeenCalledTimes(1);
    expect(onMessageEdited).toHaveBeenCalledWith('m1', 'edited body', {
      conversation,
    });
  });

  it('pastes an image into the edit window as Markdown', async () => {
    const { fireEvent } = await import('@testing-library/react');
    const { default: userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    const onMessageEdited = vi.fn();
    render(
      <div style={{ height: 400 }}>
        <SuperChat
          conversation={conversation}
          currentParticipantId="u1"
          onMessageEdited={onMessageEdited}
        />
      </div>
    );
    await user.click(screen.getByRole('button', { name: 'Edit message' }));
    const editor = screen.getByRole('textbox', { name: 'Edit message' });
    const file = new File(['fake-bytes'], 'edited.png', { type: 'image/png' });
    fireEvent.paste(editor, {
      clipboardData: {
        items: [{ kind: 'file', type: 'image/png', getAsFile: () => file }],
      },
    });
    await waitFor(() =>
      expect((editor as HTMLTextAreaElement).value).toMatch(
        /!\[edited\.png\]\(data:image\/png/
      )
    );
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onMessageEdited).toHaveBeenCalledTimes(1);
    const [, savedText] = onMessageEdited.mock.calls[0];
    expect(savedText).toMatch(/!\[edited\.png\]\(data:image\/png/);
  });

  it('cancels an edit without firing onMessageEdited', async () => {
    const { default: userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    const onMessageEdited = vi.fn();
    render(
      <div style={{ height: 400 }}>
        <SuperChat
          conversation={conversation}
          currentParticipantId="u1"
          onMessageEdited={onMessageEdited}
        />
      </div>
    );
    await user.click(screen.getByRole('button', { name: 'Edit message' }));
    const editor = screen.getByRole('textbox', { name: 'Edit message' });
    await user.type(editor, ' extra');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onMessageEdited).not.toHaveBeenCalled();
    expect(
      screen.queryByRole('textbox', { name: 'Edit message' })
    ).not.toBeInTheDocument();
  });

  it('shows an "(edited)" indicator when a message has editedAt', () => {
    const edited: SuperChatConversation = {
      ...conversation,
      thread: [
        { ...conversation.thread[0], editedAt: '2026-06-07T09:05:00Z' },
        conversation.thread[1],
      ],
    };
    render(
      <div style={{ height: 400 }}>
        <SuperChat conversation={edited} currentParticipantId="u1" />
      </div>
    );
    expect(screen.getByText('(edited)')).toBeInTheDocument();
  });

  it('shows a copy affordance on every content message', () => {
    render(
      <div style={{ height: 400 }}>
        <SuperChat conversation={conversation} currentParticipantId="u1" />
      </div>
    );
    // m1 (u1) and m2 (a1) are content messages; the system/ref rows have none.
    const copyButtons = screen.getAllByRole('button', {
      name: 'Copy message',
    });
    expect(copyButtons).toHaveLength(2);
  });

  it('copies the message source as Markdown via the copy menu', async () => {
    const { default: userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    const writeText = vi.fn(async () => {});
    const write = vi.fn(async () => {});
    vi.stubGlobal('navigator', {
      ...globalThis.navigator,
      clipboard: { writeText, write },
    });

    render(
      <div style={{ height: 400 }}>
        <SuperChat conversation={conversation} currentParticipantId="u1" />
      </div>
    );

    // Open the menu on the first message (m1, authored by u1) and pick Markdown.
    const [firstCopy] = screen.getAllByRole('button', {
      name: 'Copy message',
    });
    await user.click(firstCopy);
    await user.click(
      screen.getByRole('menuitem', { name: 'Copy as Markdown' })
    );

    expect(writeText).toHaveBeenCalledWith(conversation.thread[0].text);
    vi.unstubAllGlobals();
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
