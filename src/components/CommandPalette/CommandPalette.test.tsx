import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithTheme } from '../../test/test-utils';
import { CommandPalette } from './CommandPalette';
import {
  CommandPaletteProvider,
  useCommandPalette,
  type CommandPaletteItem,
} from './CommandPaletteProvider';

function OpenButton(): React.JSX.Element {
  const { open } = useCommandPalette();
  return <button onClick={open}>open-palette</button>;
}

function SetItems({
  items,
}: {
  items: CommandPaletteItem[];
}): React.JSX.Element {
  const { setItems } = useCommandPalette();
  // setItems on mount only
  if (items) {
    // wrapped in effect-equivalent: run synchronously during render is fine for test setup
    queueMicrotask(() => setItems(items));
  }
  return <></>;
}

function renderPalette(
  props: Parameters<typeof CommandPalette>[0] = {},
  opts: { items?: CommandPaletteItem[]; openOnMount?: boolean } = {}
) {
  return renderWithTheme(
    <CommandPaletteProvider enableShortcut={false}>
      <OpenButton />
      {opts.items ? <SetItems items={opts.items} /> : null}
      <CommandPalette {...props} />
    </CommandPaletteProvider>
  );
}

describe('CommandPalette', () => {
  it('does not render when closed', () => {
    renderPalette();
    expect(screen.queryByTestId('command-palette')).toBeNull();
  });

  it('opens via context and shows pinned items even when query is empty', async () => {
    const user = userEvent.setup();
    const pinnedItems: CommandPaletteItem[] = [
      { id: 'call', label: 'Call John Doe' },
      { id: 'ai', label: 'Ask AI: anything' },
    ];

    renderPalette({ pinnedItems, pinnedCategoryLabel: 'Actions' });

    await user.click(screen.getByText('open-palette'));
    expect(screen.getByTestId('command-palette')).toBeInTheDocument();

    expect(screen.getByText('Call John Doe')).toBeInTheDocument();
    expect(screen.getByText('Ask AI: anything')).toBeInTheDocument();
    expect(screen.getByText(/Actions \(2\)/)).toBeInTheDocument();
  });

  it('fires onQueryChange as the user types', async () => {
    const user = userEvent.setup();
    const onQueryChange = vi.fn();

    renderPalette({ onQueryChange });
    await user.click(screen.getByText('open-palette'));

    // Initial empty-string fire happens on open.
    expect(onQueryChange).toHaveBeenCalledWith('');

    const input = screen.getByTestId('command-palette-input');
    await user.type(input, 'abc');

    expect(onQueryChange).toHaveBeenCalledWith('a');
    expect(onQueryChange).toHaveBeenCalledWith('ab');
    expect(onQueryChange).toHaveBeenCalledWith('abc');
  });

  it('shows recent items only when query is empty and no provider items', async () => {
    const user = userEvent.setup();
    const recentItems: CommandPaletteItem[] = [
      { id: 'r1', label: 'Recent call with Acme' },
    ];

    renderPalette({ recentItems });
    await user.click(screen.getByText('open-palette'));

    expect(screen.getByText('Recent call with Acme')).toBeInTheDocument();
    expect(screen.getByText(/Recent \(1\)/)).toBeInTheDocument();

    // Typing hides recents (and yields empty state because no provider items)
    await user.type(screen.getByTestId('command-palette-input'), 'x');
    expect(screen.queryByText('Recent call with Acme')).toBeNull();
    expect(screen.getByText(/No results for "x"/)).toBeInTheDocument();
  });

  it('keyboard navigation flows pinned -> filtered items and Enter selects', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const pinnedItems: CommandPaletteItem[] = [
      { id: 'action-1', label: 'Pinned action' },
    ];
    const items: CommandPaletteItem[] = [
      { id: 'r1', label: 'Result one' },
      { id: 'r2', label: 'Result two' },
    ];

    renderPalette({ pinnedItems, onSelect }, { items });
    await user.click(screen.getByText('open-palette'));

    // Wait for queued setItems to flush and effective list to render.
    await screen.findByText('Result one');

    const input = screen.getByTestId('command-palette-input');
    // Drive selection explicitly via ArrowDown to avoid timing on the
    // "reset selectedIndex on effective list change" effect.
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'action-1' })
    );
  });

  it('shows loading spinner when isLoading is true', async () => {
    const user = userEvent.setup();
    renderPalette({ isLoading: true });
    await user.click(screen.getByText('open-palette'));
    const palette = screen.getByTestId('command-palette');
    expect(palette.querySelector('.animate-spin')).toBeTruthy();
  });
});
