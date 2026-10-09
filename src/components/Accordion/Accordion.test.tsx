import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import { Accordion, type AccordionItem } from './Accordion';

const ITEMS: AccordionItem[] = [
  { id: 'a', title: 'Question A', content: 'Answer A' },
  { id: 'b', title: 'Question B', content: 'Answer B' },
  { id: 'c', title: 'Question C', content: 'Answer C', disabled: true },
];

describe('Accordion', () => {
  it('renders all triggers collapsed by default', () => {
    renderWithTheme(<Accordion items={ITEMS} />);
    for (const name of ['Question A', 'Question B']) {
      expect(screen.getByRole('button', { name })).toHaveAttribute(
        'aria-expanded',
        'false'
      );
    }
  });

  it('opens defaultOpenIds and wires aria-controls to the panel', () => {
    renderWithTheme(<Accordion items={ITEMS} defaultOpenIds={['a']} />);
    const trigger = screen.getByRole('button', { name: 'Question A' });
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    const panel = screen.getByRole('region', { name: 'Question A' });
    expect(panel.id).toBe(trigger.getAttribute('aria-controls'));
  });

  it('single mode closes the previous panel', () => {
    renderWithTheme(
      <Accordion items={ITEMS} type="single" defaultOpenIds={['a']} />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Question B' }));
    expect(screen.getByRole('button', { name: 'Question A' })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
    expect(screen.getByRole('button', { name: 'Question B' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
  });

  it('single non-collapsible keeps one panel open', () => {
    renderWithTheme(
      <Accordion
        items={ITEMS}
        type="single"
        collapsible={false}
        defaultOpenIds={['a']}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Question A' }));
    expect(screen.getByRole('button', { name: 'Question A' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
  });

  it('multiple mode opens panels independently', () => {
    renderWithTheme(<Accordion items={ITEMS} type="multiple" />);
    fireEvent.click(screen.getByRole('button', { name: 'Question A' }));
    fireEvent.click(screen.getByRole('button', { name: 'Question B' }));
    expect(screen.getByRole('button', { name: 'Question A' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
    expect(screen.getByRole('button', { name: 'Question B' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
  });

  it('supports controlled open state', () => {
    const onOpenChange = vi.fn();
    renderWithTheme(
      <Accordion items={ITEMS} openIds={['b']} onOpenChange={onOpenChange} />
    );
    expect(screen.getByRole('button', { name: 'Question B' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
    fireEvent.click(screen.getByRole('button', { name: 'Question A' }));
    expect(onOpenChange).toHaveBeenCalledWith(['a']);
    // Controlled: state does not change without the parent updating props
    expect(screen.getByRole('button', { name: 'Question A' })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
  });

  it('disables items', () => {
    renderWithTheme(<Accordion items={ITEMS} />);
    expect(screen.getByRole('button', { name: 'Question C' })).toBeDisabled();
  });

  it('hides collapsed panels from AT and keyboard via aria-hidden + inert', () => {
    renderWithTheme(<Accordion items={ITEMS} defaultOpenIds={['a']} />);
    const openPanel = document.getElementById(
      screen
        .getByRole('button', { name: 'Question A' })
        .getAttribute('aria-controls')!
    )!;
    const closedPanel = document.getElementById(
      screen
        .getByRole('button', { name: 'Question B' })
        .getAttribute('aria-controls')!
    )!;
    expect(openPanel).toHaveAttribute('aria-hidden', 'false');
    expect(openPanel).not.toHaveAttribute('inert');
    expect(closedPanel).toHaveAttribute('aria-hidden', 'true');
    expect(closedPanel).toHaveAttribute('inert');
  });

  it('normalizes single mode to at most one open panel', () => {
    renderWithTheme(
      <Accordion type="single" items={ITEMS} defaultOpenIds={['a', 'b']} />
    );
    expect(screen.getByRole('button', { name: 'Question A' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
    expect(screen.getByRole('button', { name: 'Question B' })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
  });

  describe('storageKey', () => {
    beforeEach(() => window.localStorage.clear());

    const expanded = (name: string) =>
      screen.getByRole('button', { name }).getAttribute('aria-expanded');

    it('skips stored ids for removed items in single mode', () => {
      window.localStorage.setItem('faq', JSON.stringify(['removed', 'b']));
      renderWithTheme(<Accordion items={ITEMS} storageKey="faq" />);
      expect(expanded('Question B')).toBe('true');
    });

    it('restores and persists the open ids', () => {
      window.localStorage.setItem('faq', JSON.stringify(['b']));
      const { unmount } = renderWithTheme(
        <Accordion
          items={ITEMS}
          type="multiple"
          storageKey="faq"
          defaultOpenIds={['a']}
        />
      );
      expect(expanded('Question A')).toBe('false');
      expect(expanded('Question B')).toBe('true');
      fireEvent.click(screen.getByRole('button', { name: 'Question A' }));
      expect(JSON.parse(window.localStorage.getItem('faq')!)).toEqual([
        'b',
        'a',
      ]);
      unmount();
      renderWithTheme(
        <Accordion items={ITEMS} type="multiple" storageKey="faq" />
      );
      expect(expanded('Question A')).toBe('true');
    });

    it('falls back to defaultOpenIds on a corrupt value', () => {
      window.localStorage.setItem('faq', '{not json');
      renderWithTheme(
        <Accordion items={ITEMS} storageKey="faq" defaultOpenIds={['a']} />
      );
      expect(expanded('Question A')).toBe('true');
    });

    it('ignores storage when controlled', () => {
      window.localStorage.setItem('faq', JSON.stringify(['b']));
      renderWithTheme(
        <Accordion
          items={ITEMS}
          storageKey="faq"
          openIds={['a']}
          onOpenChange={vi.fn()}
        />
      );
      expect(expanded('Question B')).toBe('false');
      fireEvent.click(screen.getByRole('button', { name: 'Question B' }));
      expect(window.localStorage.getItem('faq')).toBe(JSON.stringify(['b']));
    });
  });
});
