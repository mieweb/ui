import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DateTime } from 'luxon';
import {
  byTime,
  filesToComposerAttachments,
  formatTime,
  lastActivityOf,
  lastMessageByTime,
  MessageRow,
  sortThread,
} from './parts';
import { VirtualThread } from './VirtualThread';
import type { SuperChatLabels } from './labels';
import type { SuperChatConversation, SuperChatMessage } from './types';

// Exercise the virtual row's presentation contract without jsdom's missing
// layout/scroll measurements. Actual windowing is covered by the panel suite.
vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: ({ count }: { count: number }) => ({
    getVirtualItems: () =>
      Array.from({ length: count }, (_, index) => ({
        index,
        key: index,
        start: index * 88,
      })),
    getTotalSize: () => count * 88,
    measureElement: () => {},
  }),
}));

const early = '2026-01-02T13:07:00';
const late = '2026-01-02T14:10:00';

function message(id: string, time?: Date | string): SuperChatMessage {
  return { id, participantId: 'person', text: `Message ${id}`, time };
}

function conversation(
  thread: SuperChatMessage[],
  lastActivity?: Date | string
): SuperChatConversation {
  return {
    id: 'conversation',
    title: 'Conversation',
    participants: [],
    thread,
    lastActivity,
  };
}

const renderText = (text: string) => text;

describe('SuperChat timestamp helpers', () => {
  it('sorts fully timestamped messages without mutating the host array', () => {
    const thread = [
      message('late', late),
      message('early', DateTime.fromISO(early).toJSDate()),
    ];
    Object.freeze(thread);
    expect(sortThread(thread).map(({ id }) => id)).toEqual(['early', 'late']);
    expect(thread.map(({ id }) => id)).toEqual(['late', 'early']);
    expect(sortThread(thread)).not.toBe(thread);
  });

  it('keeps supplied order when requested even with complete timestamps', () => {
    const thread = [message('late', late), message('early', early)];
    expect(sortThread(thread, 'provided')).toEqual(thread);
    expect(sortThread(thread, 'provided')).not.toBe(thread);
  });

  it.each([
    undefined,
    '',
    'not a date',
    '2026-02-30T10:00:00',
    new Date(Number.NaN),
  ])(
    'preserves the entire supplied sequence for a missing/invalid time: %s',
    (time) => {
      const thread = [
        message('late', late),
        message('early', early),
        message('unknown', time),
      ];
      expect(sortThread(thread)).toEqual(thread);
      expect(lastMessageByTime(thread)).toBe(thread[2]);
      expect(formatTime(time)).toBe('');
      expect(byTime(thread[0], thread[2])).toBe(0);
    }
  );

  it('uses supplied order for the latest message even when the unknown time is in the middle', () => {
    const thread = [
      message('late', late),
      message('unknown'),
      message('last-supplied', early),
    ];
    expect(sortThread(thread)).toEqual(thread);
    expect(lastMessageByTime(thread)).toBe(thread[2]);
  });

  it('keeps equal timestamps stable and returns the last tied message', () => {
    const thread = [
      message('first', late),
      message('earlier', early),
      message('second', late),
    ];
    expect(sortThread(thread).map(({ id }) => id)).toEqual([
      'earlier',
      'first',
      'second',
    ]);
    expect(lastMessageByTime(thread)).toBe(thread[2]);
  });

  it('prefers explicit valid activity, otherwise uses the newest known message time', () => {
    const thread = [
      message('late', late),
      message('early', early),
      message('undated'),
    ];
    expect(lastActivityOf(conversation(thread, early))).toBe(
      DateTime.fromISO(early).toMillis()
    );
    expect(lastActivityOf(conversation(thread, 'not a date'))).toBe(
      DateTime.fromISO(late).toMillis()
    );
    expect(lastActivityOf(conversation(thread))).toBe(
      DateTime.fromISO(late).toMillis()
    );
    expect(
      lastActivityOf(conversation([message('unknown')], new Date(Number.NaN)))
    ).toBe(0);
    expect(lastActivityOf(conversation([]))).toBe(0);
    expect(lastMessageByTime([])).toBeUndefined();
    expect(sortThread([])).toEqual([]);
  });

  it('retains valid activity before the Unix epoch', () => {
    const past = '1960-01-01T00:00:00Z';
    expect(lastActivityOf(conversation([message('historic', past)]))).toBe(
      DateTime.fromISO(past).toMillis()
    );
  });

  it('formats known times using the supplied locale', () => {
    expect(formatTime(early, 'fr-FR')).toBe('13:07');
    expect(formatTime(early, 'en-US')).toBe('1:07 PM');
  });
});

describe('SuperChat message presentation labels', () => {
  it.each([undefined, 'not a date', new Date(Number.NaN)])(
    'omits unknown time and leaves no trailing punctuation in the accessible name: %s',
    (time) => {
      const { container } = render(
        <MessageRow
          message={message('unknown', time)}
          isSelf={false}
          renderText={renderText}
        />
      );
      expect(
        screen.getByRole('article', { name: 'Unknown' })
      ).toBeInTheDocument();
      expect(
        container.querySelector('[data-slot="superchat-message-time"]')
      ).not.toBeInTheDocument();
      expect(container).not.toHaveTextContent('Invalid Date');
    }
  );

  it('localizes author, accessible name, edit marker, and known timestamps', () => {
    const labels: Partial<SuperChatLabels> = {
      unknownAuthor: 'Auteur inconnu',
      messageLabel: (author, time) => (time ? `${time} — ${author}` : author),
      edited: '(modifié)',
      editedAt: (time) => `Modifié à ${time}`,
    };
    const { rerender } = render(
      <MessageRow
        message={{ ...message('localized', early), editedAt: late }}
        isSelf={false}
        renderText={renderText}
        labels={labels}
        locale="fr-FR"
      />
    );
    expect(
      screen.getByRole('article', { name: '13:07 — Auteur inconnu' })
    ).toBeInTheDocument();
    expect(screen.getByText('13:07')).toBeInTheDocument();
    expect(screen.getByText('(modifié)')).toHaveAttribute(
      'title',
      'Modifié à 14:10'
    );

    rerender(
      <MessageRow
        message={{ ...message('localized'), editedAt: 'unknown' }}
        isSelf={false}
        renderText={renderText}
        labels={labels}
      />
    );
    expect(
      screen.getByRole('article', { name: 'Auteur inconnu' })
    ).toBeInTheDocument();
    expect(screen.getByText('(modifié)')).not.toHaveAttribute('title');
  });

  it('localizes the copy trigger, tooltip, and all copy formats', async () => {
    const user = userEvent.setup();
    render(
      <MessageRow
        message={message('copy')}
        isSelf={false}
        renderText={renderText}
        labels={{
          copyMessage: 'Copier le message',
          copyMessageHint: 'Copier avec le format préféré',
          copyAsRichText: 'Copier le texte enrichi',
          richTextAndMarkdown: 'Texte enrichi et Markdown',
          copyAsMarkdown: 'Copier le Markdown',
          copyAsPlainText: 'Copier le texte brut',
        }}
      />
    );
    const copy = screen.getByRole('button', { name: 'Copier le message' });
    expect(copy).toHaveAttribute('title', 'Copier avec le format préféré');
    await user.click(copy);
    expect(
      screen.getByRole('menuitem', {
        name: 'Copier le texte enrichi Texte enrichi et Markdown',
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', { name: 'Copier le Markdown' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', { name: 'Copier le texte brut' })
    ).toBeInTheDocument();
  });

  it('localizes the action menu, copy submenu, and inline edit controls', async () => {
    const user = userEvent.setup();
    const edited = vi.fn();
    render(
      <MessageRow
        message={message('edit')}
        isSelf
        editable
        onMessageEdited={edited}
        renderText={renderText}
        labels={{
          messageActions: 'Actions du message',
          copyAs: 'Copier comme',
          editMessage: 'Modifier le message',
          cancelEdit: 'Annuler',
          saveEdit: 'Enregistrer',
        }}
      />
    );
    await user.click(
      screen.getByRole('button', { name: 'Actions du message' })
    );
    expect(
      screen.getByRole('menuitem', { name: 'Copier comme' })
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole('menuitem', { name: 'Modifier le message' })
    );
    const editor = screen.getByRole('textbox', { name: 'Modifier le message' });
    expect(editor).toHaveFocus();
    expect(screen.getByRole('button', { name: 'Annuler' })).toBeInTheDocument();
    fireEvent.change(editor, { target: { value: 'Texte modifié' } });
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(edited).toHaveBeenCalledWith('edit', 'Texte modifié');
  });

  it('localizes unnamed attachment fallbacks while preserving host filenames', async () => {
    const attachments = await filesToComposerAttachments(
      [
        new File(['one'], '', { type: 'text/plain' }),
        new File(['two'], 'original.txt', { type: 'text/plain' }),
      ],
      { attachmentName: (index) => `pièce-jointe-${index}` }
    );
    expect(attachments.map(({ name }) => name)).toEqual([
      'pièce-jointe-1',
      'original.txt',
    ]);
  });

  it('forwards labels and locale through virtual rows and uses a logical inline inset', () => {
    const { container } = render(
      <VirtualThread
        items={[message('virtual', early)]}
        participantById={new Map()}
        renderText={renderText}
        labels={{
          unknownAuthor: 'Auteur virtuel',
          copyMessage: 'Copier la ligne',
        }}
        locale="fr-FR"
        scrollRef={React.createRef()}
        contentRef={React.createRef()}
        containerProps={{ dir: 'rtl' }}
      />
    );
    expect(
      screen.getByRole('article', { name: 'Auteur virtuel, 13:07' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Copier la ligne' })
    ).toBeInTheDocument();
    expect(container.querySelector('[data-index="0"]')).toHaveStyle({
      insetInlineStart: '0',
    });
  });
});
