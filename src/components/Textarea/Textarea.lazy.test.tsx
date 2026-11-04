import { describe, it, expect, vi } from 'vitest';
import * as React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';

// Counts loads of the Kerebron surface (the suite's stand-in for it, as in
// every suite): Textarea must import it only when a rich field renders.
const surface = vi.hoisted(() => ({ loads: 0 }));
vi.mock('../TextAreaRich/TextAreaRichKerebron', async (importOriginal) => {
  surface.loads += 1;
  return importOriginal();
});

// Imported after the mock, so the import itself is what's under test.
const { Textarea } = await import('./Textarea');

describe('Textarea loads its Kerebron surface lazily', () => {
  it('loads nothing on import, nor for a plain field', () => {
    expect(surface.loads).toBe(0);
    renderWithTheme(<Textarea label="Notes" richText={false} />);
    expect(screen.getByLabelText('Notes').tagName).toBe('TEXTAREA');
    expect(surface.loads).toBe(0);
  });

  it.each([
    ['md', '38px'],
    ['sm', '38px'],
    ['lg', '42px'],
  ] as const)(
    'with no rows, holds a %s field at its empty editor’s height (%s)',
    (size, height) => {
      const { container } = renderWithTheme(
        <Textarea label="Notes" size={size} />
      );
      const frame = container.querySelector<HTMLElement>(
        '[data-slot="textarea-rich-loading"]'
      );
      // One line and its padding, never under the editor's 38px minimum.
      expect(frame?.firstElementChild).toHaveStyle({ minHeight: height });
    }
  );

  it('draws an empty frame at the field’s height until the surface loads', async () => {
    const { container } = renderWithTheme(
      <Textarea label="Notes" rows={3} size="sm" />
    );
    const frame = container.querySelector<HTMLElement>(
      '[data-slot="textarea-rich-loading"]'
    );
    expect(frame).not.toBeNull();
    expect(frame).toHaveAttribute('aria-hidden', 'true');
    // Three 20px rows plus the editable's 7px block padding on each side,
    // inside the frame's borders.
    expect(frame?.firstElementChild).toHaveStyle({ minHeight: '74px' });

    await waitFor(() =>
      expect(
        container.querySelector('[data-slot="textarea-rich-loading"]')
      ).toBeNull()
    );
    expect(surface.loads).toBe(1);
    expect(screen.getByRole('textbox', { name: 'Notes' })).toBeInTheDocument();
  });
});
