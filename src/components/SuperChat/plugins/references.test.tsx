import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMarkdownRenderer } from '../render/createMarkdownRenderer';
import type { ReferenceTrigger } from '../../ReferenceChip/references';
import { createReferencesPlugin } from './references';

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
});
