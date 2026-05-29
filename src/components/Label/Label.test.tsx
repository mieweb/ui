import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import { Label } from './Label';

describe('Label', () => {
  it('renders its children', () => {
    renderWithTheme(<Label>Email</Label>);
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('associates with a control via htmlFor', () => {
    renderWithTheme(
      <>
        <Label htmlFor="email">Email</Label>
        <input id="email" />
      </>
    );
    expect(screen.getByText('Email')).toHaveAttribute('for', 'email');
  });

  it('renders a required indicator when required', () => {
    renderWithTheme(<Label required>Name</Label>);
    const asterisk = screen.getByText('*');
    expect(asterisk).toBeInTheDocument();
    expect(asterisk).toHaveAttribute('aria-hidden', 'true');
  });

  it('does not render an asterisk by default', () => {
    renderWithTheme(<Label>Name</Label>);
    expect(screen.queryByText('*')).not.toBeInTheDocument();
  });

  it('applies size classes', () => {
    const { rerender } = renderWithTheme(<Label size="sm">A</Label>);
    expect(screen.getByText('A')).toHaveClass('text-xs');

    rerender(<Label size="lg">A</Label>);
    expect(screen.getByText('A')).toHaveClass('text-base');
  });
});
