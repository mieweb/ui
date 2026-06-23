import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import { Separator } from './Separator';

describe('Separator', () => {
  it('is decorative (role="none") by default', () => {
    const { container } = renderWithTheme(<Separator />);
    const el = container.querySelector('[data-slot="separator"]');
    expect(el).toHaveAttribute('role', 'none');
    expect(el).not.toHaveAttribute('aria-orientation');
  });

  it('exposes a semantic separator role when not decorative', () => {
    renderWithTheme(<Separator decorative={false} />);
    const el = screen.getByRole('separator');
    expect(el).toHaveAttribute('aria-orientation', 'horizontal');
  });

  it('applies horizontal classes by default', () => {
    const { container } = renderWithTheme(<Separator />);
    const el = container.querySelector('[data-slot="separator"]');
    expect(el).toHaveClass('h-px', 'w-full');
  });

  it('applies vertical classes when oriented vertically', () => {
    renderWithTheme(<Separator decorative={false} orientation="vertical" />);
    const el = screen.getByRole('separator');
    expect(el).toHaveClass('h-full', 'w-px');
    expect(el).toHaveAttribute('aria-orientation', 'vertical');
  });
});
