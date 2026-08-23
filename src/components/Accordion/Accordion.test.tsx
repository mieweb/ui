import { describe, it, expect, vi } from 'vitest';
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
});
