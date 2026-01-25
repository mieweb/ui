import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import { Button } from './Button';

describe('Button', () => {
  it('renders children correctly', () => {
    renderWithTheme(<Button>Click me</Button>);
    expect(
      screen.getByRole('button', { name: /click me/i })
    ).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = vi.fn();
    renderWithTheme(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies variant classes correctly', () => {
    const { rerender } = renderWithTheme(
      <Button variant="primary">Primary</Button>
    );
    expect(screen.getByRole('button')).toHaveClass('bg-primary-800');

    rerender(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-neutral-200');

    rerender(<Button variant="outline">Outline</Button>);
    expect(screen.getByRole('button')).toHaveClass('border-primary-800');
  });

  it('applies size classes correctly', () => {
    const { rerender } = renderWithTheme(<Button size="sm">Small</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-8');

    rerender(<Button size="md">Medium</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-10');

    rerender(<Button size="lg">Large</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-12');
  });

  it('disables button when disabled prop is true', () => {
    renderWithTheme(<Button disabled>Disabled</Button>);
    const button = screen.getByRole('button');

    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'false');
  });

  it('shows loading state correctly', () => {
    renderWithTheme(<Button isLoading>Loading</Button>);
    const button = screen.getByRole('button');

    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument(); // Loading spinner
  });

  it('shows custom loading text', () => {
    renderWithTheme(
      <Button isLoading loadingText="Saving...">
        Save
      </Button>
    );
    expect(screen.getByText('Saving...')).toBeInTheDocument();
  });

  it('supports custom className', () => {
    renderWithTheme(<Button className="custom-class">Button</Button>);
    expect(screen.getByRole('button')).toHaveClass('custom-class');
  });

  it('forwards ref correctly', () => {
    const ref = vi.fn();
    renderWithTheme(<Button ref={ref}>Button</Button>);
    expect(ref).toHaveBeenCalledWith(expect.any(HTMLButtonElement));
  });

  it('supports different button types', () => {
    renderWithTheme(<Button type="submit">Submit</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });

  it('renders left and right icons', () => {
    const LeftIcon = () => <span data-testid="left-icon">Left</span>;
    const RightIcon = () => <span data-testid="right-icon">Right</span>;

    renderWithTheme(
      <Button leftIcon={<LeftIcon />} rightIcon={<RightIcon />}>
        Button Text
      </Button>
    );

    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    expect(screen.getByText('Button Text')).toBeInTheDocument();
  });

  describe('accessibility', () => {
    it('has proper ARIA attributes', () => {
      renderWithTheme(<Button aria-label="Custom label">Button</Button>);
      expect(screen.getByRole('button')).toHaveAttribute(
        'aria-label',
        'Custom label'
      );
    });

    it('is keyboard navigable', () => {
      const handleClick = vi.fn();
      renderWithTheme(<Button onClick={handleClick}>Button</Button>);

      const button = screen.getByRole('button');
      button.focus();
      fireEvent.keyDown(button, { key: 'Enter' });
      fireEvent.keyUp(button, { key: 'Enter' });

      expect(handleClick).toHaveBeenCalled();
    });
  });
});
