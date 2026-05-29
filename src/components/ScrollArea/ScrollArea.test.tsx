import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import { ScrollArea } from './ScrollArea';

describe('ScrollArea', () => {
  it('renders its children', () => {
    renderWithTheme(
      <ScrollArea>
        <p>Scrollable content</p>
      </ScrollArea>
    );
    expect(screen.getByText('Scrollable content')).toBeInTheDocument();
  });

  it('applies vertical orientation classes by default', () => {
    const { container } = renderWithTheme(<ScrollArea>content</ScrollArea>);
    const el = container.querySelector('[data-slot="scroll-area"]');
    expect(el).toHaveClass('overflow-y-auto', 'overflow-x-hidden');
  });

  it('applies horizontal orientation classes', () => {
    const { container } = renderWithTheme(
      <ScrollArea orientation="horizontal">content</ScrollArea>
    );
    const el = container.querySelector('[data-slot="scroll-area"]');
    expect(el).toHaveClass('overflow-x-auto', 'overflow-y-hidden');
  });

  it('forwards additional class names', () => {
    const { container } = renderWithTheme(
      <ScrollArea className="h-48">content</ScrollArea>
    );
    const el = container.querySelector('[data-slot="scroll-area"]');
    expect(el).toHaveClass('h-48');
  });
});
