import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderWithTheme } from '../../test/test-utils';
import { WorkspaceSwitcher } from './WorkspaceSwitcher';

describe('WorkspaceSwitcher', () => {
  it('closes the menu after selecting or creating a workspace', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onCreate = vi.fn();
    renderWithTheme(<WorkspaceSwitcher workspaces={[{ id: 'a', name: 'Alpha' }, { id: 'b', name: 'Beta' }]} currentId="a" onSelect={onSelect} onCreate={onCreate} />);
    const trigger = screen.getByRole('button', { name: 'Switch workspace' });
    await user.click(trigger);
    await user.click(screen.getByText('Beta'));
    expect(onSelect).toHaveBeenCalledWith({ id: 'b', name: 'Beta' });
    await waitFor(() => expect(screen.queryByText('Beta')).not.toBeInTheDocument());
    await user.click(trigger);
    await user.click(screen.getByText('Add workspace'));
    expect(onCreate).toHaveBeenCalledOnce();
    await waitFor(() => expect(screen.queryByText('Add workspace')).not.toBeInTheDocument());
  });
});
