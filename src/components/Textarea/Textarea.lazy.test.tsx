import { describe, it, expect, vi } from 'vitest';
import * as React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';

// Counts loads of the Kerebron surface (the suite's stand-in for it, as in
// every suite): Textarea must import it only when a rich field renders. The
// load is held until the last test lets it through: every rich field here
// shares one cached lazy import, so each assertion on the loading frame needs
// it still pending, however fast modules load.
const surface = vi.hoisted(() => {
  let release = () => {};
  const released = new Promise<void>((resolve) => {
    release = resolve;
  });
  return { loads: 0, released, release };
});
vi.mock('../TextAreaRich/TextAreaRichKerebron', async (importOriginal) => {
  surface.loads += 1;
  await surface.released;
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
    ['md', 'max(38px, calc(1.5rem + 14px))'],
    ['sm', 'max(38px, calc(1.25rem + 14px))'],
    ['lg', 'max(38px, calc(1.75rem + 14px))'],
  ] as const)(
    'with no rows, holds a %s field at its empty editor’s height',
    (size, height) => {
      const { container } = renderWithTheme(
        <Textarea label="Notes" size={size} />
      );
      const frame = container.querySelector<HTMLElement>(
        '[data-slot="textarea-rich-loading"]'
      );
      // One line in rem, as kerebron.css sizes it (so it follows the root
      // font size), and its padding, never under the editor's 38px minimum.
      expect(frame?.firstElementChild).toHaveStyle({ minHeight: height });
    }
  );

  it('with rows, holds the rows’ floor, not the 38px one it replaces', () => {
    const { container } = renderWithTheme(
      <Textarea label="Notes" rows={1} size="sm" />
    );
    const frame = container.querySelector<HTMLElement>(
      '[data-slot="textarea-rich-loading"]'
    );
    // One 20px row and its padding (34px): the editor's inline minimum, which
    // overrides the stylesheet's 38px, so reserving 38px would shrink on load.
    expect(frame?.firstElementChild).toHaveStyle({
      minHeight: 'max(34px, calc(1.25rem + 14px))',
    });
  });

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
    // inside the frame's borders, or one line if the root font makes that taller.
    expect(frame?.firstElementChild).toHaveStyle({
      minHeight: 'max(74px, calc(1.25rem + 14px))',
    });

    surface.release();
    await waitFor(() =>
      expect(
        container.querySelector('[data-slot="textarea-rich-loading"]')
      ).toBeNull()
    );
    expect(surface.loads).toBe(1);
    expect(screen.getByRole('textbox', { name: 'Notes' })).toBeInTheDocument();
  });
});
