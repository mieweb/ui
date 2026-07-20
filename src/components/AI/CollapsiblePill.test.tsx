import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import { CollapsiblePill } from './CollapsiblePill';

describe('CollapsiblePill', () => {
  it('syncs open state when defaultOpen changes', () => {
    const { rerender } = renderWithTheme(
      <CollapsiblePill label="Tool" defaultOpen={false}>
        <div>Tool details</div>
      </CollapsiblePill>
    );

    const button = screen.getByRole('button', { name: /tool/i });
    const content = document.getElementById(
      button.getAttribute('aria-controls') ?? ''
    );
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(content).toHaveAttribute('aria-hidden', 'true');

    rerender(
      <CollapsiblePill label="Tool" defaultOpen>
        <div>Tool details</div>
      </CollapsiblePill>
    );

    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(content).toHaveAttribute('aria-hidden', 'false');
  });
});
