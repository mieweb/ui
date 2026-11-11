/**
 * Variables menu on the REAL Kerebron TextAreaRich surface (mieweb/ui#695).
 *
 * Unit suites normally see the legacy-backed stub (vitest.config.ts aliases
 * every `…/TextAreaRichKerebron` import), because jsdom cannot drive
 * ProseMirror *input*. The Variables menu, however, is React chrome around a
 * programmatic transaction (`insertPlainText`), which jsdom can execute —
 * so this suite dodges the alias with a Vite query suffix and exercises the
 * real engine. Positioning/visuals stay covered by the browser tests.
 */
import { describe, it, expect, vi, beforeAll } from 'vitest';
import * as React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import type { TextAreaRichProps } from './TextAreaRich';

// @ts-expect-error — the `?real` query dodges the vitest stub alias (it only
// matches specifiers *ending* in /TextAreaRichKerebron); Vite resolves the
// query to the real module.
const kerebronModule = (await import('./TextAreaRichKerebron?real')) as {
  TextAreaRichKerebron: React.ForwardRefExoticComponent<
    TextAreaRichProps & React.RefAttributes<HTMLDivElement>
  >;
};
const { TextAreaRichKerebron } = kerebronModule;

const variableGroups = [
  {
    label: 'Employee',
    variables: [
      { label: 'Full Name', value: '{{employee.name}}' },
      { label: 'Email', value: '{{employee.email}}' },
    ],
  },
  {
    label: 'Case',
    variables: [
      {
        label: 'Case Adjuster',
        value: '{{case.adjuster}}',
        insertValue: '{{case.adjuster}}, {{case.adjusterPhone}}',
      },
    ],
  },
];

function Harness(props: Partial<TextAreaRichProps>) {
  const [value, setValue] = React.useState(props.value ?? '');
  return (
    <TextAreaRichKerebron
      {...props}
      value={value}
      onChange={(html) => {
        setValue(html);
        props.onChange?.(html);
      }}
      defaultToolbar="visible"
      variableGroups={
        'variableGroups' in props ? props.variableGroups : variableGroups
      }
      aria-label="Letter body"
    />
  );
}

/** Mount and wait for the Kerebron toolbar (async editor kit mount). */
async function renderEditor(props: Partial<TextAreaRichProps> = {}) {
  renderWithTheme(<Harness {...props} />);
  await waitFor(() => {
    expect(document.querySelector('.tar-menu-variables')).not.toBeNull();
  });
  return document.querySelector<HTMLButtonElement>('.tar-menu-variables')!;
}

/** Kerebron menu items run on mousedown, not click. */
const pressToolbarButton = (button: HTMLElement) => fireEvent.mouseDown(button);

beforeAll(() => {
  // jsdom lacks these layout/observer APIs the editor chrome touches.
  window.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
  Element.prototype.scrollIntoView ??= () => {};
  // ProseMirror's post-dispatch scrollToSelection measures the caret via
  // Range rects, which jsdom does not implement.
  const zeroRect = {
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    width: 0,
    height: 0,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  } as globalThis.DOMRect;
  Range.prototype.getBoundingClientRect ??= () => zeroRect;
  Range.prototype.getClientRects ??= () =>
    [zeroRect] as unknown as globalThis.DOMRectList;
});

describe('TextAreaRichKerebron variables menu', () => {
  it('shows a labelled toolbar button wired as a menu trigger', async () => {
    const button = await renderEditor();
    await waitFor(() => {
      expect(button).toHaveAttribute('aria-label', 'Insert variable');
    });
    expect(button).toHaveAttribute('aria-haspopup', 'menu');
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button.style.display).not.toBe('none');
  });

  it('opens a searchable menu with the variable groups', async () => {
    const button = await renderEditor();
    pressToolbarButton(button);
    const menu = await screen.findByRole('menu');
    expect(menu).toBeInTheDocument();
    expect(screen.getByLabelText('Search template variables')).toBeVisible();
    expect(screen.getByText('Employee')).toBeInTheDocument();
    expect(screen.getByText('Case')).toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', { name: 'Full Name' })
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(button).toHaveAttribute('aria-expanded', 'true');
    });
  });

  it('inserts the token at the caret as one transaction and closes', async () => {
    const onChange = vi.fn();
    const button = await renderEditor({ onChange });
    pressToolbarButton(button);
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Full Name' }));
    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(
        expect.stringContaining('{{employee.name}}')
      );
    });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('prefers insertValue over value when provided', async () => {
    const onChange = vi.fn();
    const button = await renderEditor({ onChange });
    pressToolbarButton(button);
    fireEvent.click(
      await screen.findByRole('menuitem', { name: 'Case Adjuster' })
    );
    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(
        expect.stringContaining('{{case.adjuster}}, {{case.adjusterPhone}}')
      );
    });
  });

  it('neither opens nor inserts when disabled', async () => {
    const onChange = vi.fn();
    const button = await renderEditor({ onChange, disabled: true });
    await waitFor(() => {
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });
    pressToolbarButton(button);
    // The open guard runs synchronously off the mousedown; nothing to await.
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('shows a translated empty state for unmatched searches', async () => {
    const button = await renderEditor();
    pressToolbarButton(button);
    const search = await screen.findByLabelText('Search template variables');
    fireEvent.change(search, { target: { value: 'zzz-no-such-variable' } });
    expect(
      await screen.findByText('No matching variables')
    ).toBeInTheDocument();
  });

  it('closes when variableGroups empties and stays closed on restore', async () => {
    const { rerender } = renderWithTheme(<Harness />);
    await waitFor(() => {
      expect(document.querySelector('.tar-menu-variables')).not.toBeNull();
    });
    const button = document.querySelector<HTMLButtonElement>(
      '.tar-menu-variables'
    )!;
    pressToolbarButton(button);
    await screen.findByRole('menu');

    rerender(<Harness variableGroups={[]} />);
    await waitFor(() => {
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
    expect(button.style.display).toBe('none');

    // Restoring the groups must not reopen the menu without user activation.
    rerender(<Harness variableGroups={variableGroups} />);
    await waitFor(() => {
      expect(button.style.display).not.toBe('none');
    });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });
});
