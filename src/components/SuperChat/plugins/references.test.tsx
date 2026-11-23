import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  createMarkdownRenderer,
  MarkdownLink,
} from '../render/createMarkdownRenderer';
import * as superChat from '../index';
import type { ReferenceTrigger } from '../../ReferenceChip/references';
import { SuperChat } from '../SuperChat';
import { createMathPlugin } from './math';
import { createNitroTablePlugin } from './nitroTable';
import { createReferencesPlugin } from './references';

// Stand in for the datavis grid (absent under jsdom) so a table the NITRO
// plugin hands to it really leaves the HTML path.
vi.mock('./nitroTableGrid', () => ({
  default: () => <div data-testid="nitro-grid" />,
}));

const trigger = (kind: string, prefix: string): ReferenceTrigger => ({
  kind,
  char: kind === 'person' ? '@' : '#',
  label: kind,
  search: () => [],
  toHref: (id) => `${prefix}${id}`,
  fromHref: (href) =>
    href.startsWith(prefix) ? href.slice(prefix.length) : null,
});
const triggers = [
  trigger('person', '/people/'),
  trigger('ticket', '/tickets/'),
];
const CONTEXT = { messageId: 'm1', streaming: false, role: 'user' as const };
const text =
  'Ask [@Ann Lee](/people/u-ann) about [TH-12: Fix login](/tickets/t-12), see [docs](https://example.com).';

describe('createReferencesPlugin', () => {
  it('draws claimed links as chips and leaves other links alone', () => {
    const renderText = createMarkdownRenderer({
      plugins: [createReferencesPlugin({ triggers })],
    });
    render(<>{renderText(text, CONTEXT)}</>);
    const ann = screen.getByRole('link', { name: '@Ann Lee' });
    expect(ann).toHaveAttribute('data-reference-kind', 'person');
    expect(ann).not.toHaveAttribute('target');
    expect(
      screen.getByRole('link', { name: 'TH-12: Fix login' })
    ).toHaveAttribute('data-reference-kind', 'ticket');
    const docs = screen.getByRole('link', { name: 'docs' });
    expect(docs).not.toHaveAttribute('data-reference-kind');
    expect(docs).toHaveAttribute('target', '_blank');
  });

  it('hands a click to onOpen instead of following the link', async () => {
    const onOpen = vi.fn();
    const renderText = createMarkdownRenderer({
      plugins: [createReferencesPlugin({ triggers, onOpen })],
    });
    render(<>{renderText(text, CONTEXT)}</>);
    await userEvent.click(screen.getByRole('link', { name: '@Ann Lee' }));
    expect(onOpen).toHaveBeenCalledWith({
      kind: 'person',
      id: 'u-ann',
      label: '@Ann Lee',
      href: '/people/u-ann',
    });
  });
  it('names a chip from an image link by its alt text', () => {
    const onOpen = vi.fn();
    const renderText = createMarkdownRenderer({
      plugins: [createReferencesPlugin({ triggers, onOpen })],
    });
    render(<>{renderText('[![@Ann Lee](/a.png)](/people/u-ann)', CONTEXT)}</>);
    const ann = screen.getByRole('link', { name: '@Ann Lee' });
    fireEvent.click(ann);
    expect(onOpen).toHaveBeenCalledWith(
      expect.objectContaining({ label: '@Ann Lee' })
    );
  });

  it('names a chip once when its text holds math, with the math plugin on', () => {
    const onOpen = vi.fn();
    const renderText = createMarkdownRenderer({
      plugins: [
        createMathPlugin(),
        createReferencesPlugin({ triggers, onOpen }),
      ],
    });
    render(<>{renderText('[Ticket $x$](/tickets/t-12)', CONTEXT)}</>);
    const chip = screen.getByRole('link', { name: /Ticket/ });
    expect(chip).toHaveAttribute('data-reference-kind', 'ticket');
    expect(chip).toHaveTextContent(/^Ticket x$/);
    fireEvent.click(chip);
    expect(onOpen).toHaveBeenCalledWith(
      expect.objectContaining({ label: 'Ticket x' })
    );
  });

  it.each(['altKey', 'metaKey', 'ctrlKey', 'shiftKey'] as const)(
    'leaves a %s click to the browser',
    (modifier) => {
      const onOpen = vi.fn();
      const renderText = createMarkdownRenderer({
        plugins: [createReferencesPlugin({ triggers, onOpen })],
      });
      render(<>{renderText(text, CONTEXT)}</>);
      const ann = screen.getByRole('link', { name: '@Ann Lee' });
      // Record whether the chip prevented the click, then stop jsdom from
      // attempting the navigation it doesn't implement.
      let preventedByChip: boolean | undefined;
      const record = (event: MouseEvent) => {
        preventedByChip = event.defaultPrevented;
        event.preventDefault();
      };
      document.addEventListener('click', record);
      fireEvent.click(ann, { [modifier]: true });
      document.removeEventListener('click', record);
      expect(preventedByChip).toBe(false);
      expect(onOpen).not.toHaveBeenCalled();
    }
  );
  it('leaves a link a trigger cannot decode as an ordinary link', () => {
    const decoding: ReferenceTrigger = {
      ...trigger('person', '/people/'),
      fromHref: (href) =>
        href.startsWith('/people/')
          ? decodeURIComponent(href.slice('/people/'.length))
          : null,
    };
    const renderText = createMarkdownRenderer({
      plugins: [createReferencesPlugin({ triggers: [decoding] })],
    });
    render(<>{renderText('Ask [@Ann](/people/%E0%A4).', CONTEXT)}</>);
    expect(screen.getByRole('link', { name: '@Ann' })).not.toHaveAttribute(
      'data-reference-kind'
    );
  });
  it('keeps a chip in a table when the NITRO table plugin is on', async () => {
    const onOpen = vi.fn();
    const renderText = createMarkdownRenderer({
      plugins: [
        createNitroTablePlugin(),
        createReferencesPlugin({ triggers, onOpen }),
      ],
    });
    render(
      <>
        {renderText(
          '| Code |\n| --- |\n| 93000 |\n\n| Owner |\n| --- |\n| [@Ann](/people/u-ann) |',
          CONTEXT
        )}
      </>
    );
    // Once the grid has loaded for the plain table, the one with a chip
    // has had every chance to swap in too — and must not have.
    expect(await screen.findAllByTestId('nitro-grid')).toHaveLength(1);
    const ann = screen.getByRole('link', { name: '@Ann' });
    expect(ann).toHaveAttribute('data-reference-kind', 'person');
    fireEvent.click(ann);
    expect(onOpen).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'person', id: 'u-ann' })
    );
  });

  it('leaves a chip icon out of a plain-text copy', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn(async () => {});
    vi.stubGlobal('navigator', {
      ...globalThis.navigator,
      clipboard: { writeText, write: vi.fn(async () => {}) },
    });
    render(
      <SuperChat
        currentParticipantId="u1"
        defaultCopyFormat="plain"
        renderPlugins={[
          createReferencesPlugin({
            triggers,
            icon: () => <span aria-hidden="true">AL</span>,
          }),
        ]}
        conversation={{
          id: 'c1',
          title: 'Refs',
          participants: [{ id: 'u1', kind: 'human', name: 'Ann Lee' }],
          thread: [
            {
              id: 'm1',
              participantId: 'u1',
              text: 'Ask [@Ann Lee](/people/u-ann).',
              time: '2026-06-07T09:00:00Z',
            },
          ],
        }}
      />
    );
    await user.keyboard('{Control>}');
    await user.click(screen.getByRole('button', { name: 'Copy message' }));
    await user.keyboard('{/Control}');
    expect(writeText).toHaveBeenCalledWith('Ask @Ann Lee.');
    vi.unstubAllGlobals();
  });
  it('exports MarkdownLink from the SuperChat entry for other link plugins', () => {
    expect(superChat.MarkdownLink).toBe(MarkdownLink);
  });
  it('names a chip with a line break in its label as one line', () => {
    const renderText = createMarkdownRenderer({
      plugins: [createReferencesPlugin({ triggers })],
    });
    render(<>{renderText('[Ann  \nLee](/people/u-ann)', CONTEXT)}</>);
    const chip = screen.getByRole('link', { name: 'Ann Lee' });
    expect(chip).toHaveAttribute('data-reference-kind', 'person');
    expect(chip).toHaveTextContent('Ann Lee');
  });
});
