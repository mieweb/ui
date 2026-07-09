import { describe, it, expect } from 'vitest';
import * as React from 'react';
import { screen } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import { ButtonLink } from './ButtonLink';

describe('ButtonLink', () => {
  it('renders an anchor with href by default', () => {
    renderWithTheme(
      <ButtonLink href="/docs" variant="primary">
        Docs
      </ButtonLink>
    );
    const link = screen.getByRole('link', { name: /docs/i });
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', '/docs');
  });

  it('applies the shared button variant and size classes', () => {
    renderWithTheme(
      <ButtonLink href="#" variant="ghost" size="sm">
        Edit
      </ButtonLink>
    );
    const link = screen.getByRole('link');
    expect(link).toHaveClass('bg-transparent');
    expect(link).toHaveClass('h-8');
    expect(link).toHaveAttribute('data-slot', 'button');
    expect(link).toHaveAttribute('data-size', 'sm');
  });

  it('merges a custom className after the variant classes', () => {
    renderWithTheme(
      <ButtonLink href="#" variant="ghost" className="bg-red-100">
        Danger-ish
      </ButtonLink>
    );
    const link = screen.getByRole('link');
    // tailwind-merge keeps the custom background and drops the variant's
    expect(link).toHaveClass('bg-red-100');
    expect(link).not.toHaveClass('bg-transparent');
  });

  it('renders through a custom component via `as` (router links)', () => {
    const RouterLink = React.forwardRef<
      HTMLAnchorElement,
      React.AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }
    >(function RouterLink({ to, children, ...props }, ref) {
      return (
        <a ref={ref} href={to} data-testid="router-link" {...props}>
          {children}
        </a>
      );
    });

    renderWithTheme(
      <ButtonLink as={RouterLink} to="/users/new" variant="primary">
        New user
      </ButtonLink>
    );
    const link = screen.getByTestId('router-link');
    expect(link).toHaveAttribute('href', '/users/new');
    expect(link).toHaveClass('bg-primary-800');
  });

  it('renders left and right icons in shrink-0 wrappers', () => {
    renderWithTheme(
      <ButtonLink
        href="#"
        leftIcon={<svg data-testid="left" />}
        rightIcon={<svg data-testid="right" />}
      >
        Iconic
      </ButtonLink>
    );
    expect(screen.getByTestId('left').parentElement).toHaveClass('shrink-0');
    expect(screen.getByTestId('right').parentElement).toHaveClass('shrink-0');
  });

  it('forwards refs to the underlying element', () => {
    const ref = React.createRef<HTMLAnchorElement>();
    renderWithTheme(
      <ButtonLink href="#" ref={ref}>
        Ref
      </ButtonLink>
    );
    expect(ref.current).toBeInstanceOf(HTMLAnchorElement);
  });
});
