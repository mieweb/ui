import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithTheme } from '../../test/test-utils';
import { Button } from '../Button';
import {
  Dropdown,
  DropdownItem,
  DropdownLabel,
  DropdownSeparator,
} from './Dropdown';

describe('Dropdown', () => {
  it('renders a search input when searchable is enabled', async () => {
    const user = userEvent.setup();

    renderWithTheme(
      <Dropdown searchable trigger={<Button>Open menu</Button>}>
        <DropdownItem>Alpha</DropdownItem>
      </Dropdown>
    );

    await user.click(screen.getByRole('button', { name: 'Open menu' }));

    expect(
      screen.getByRole('searchbox', { name: 'Search dropdown items' })
    ).toBeInTheDocument();
  });

  it('does not render the search input inside the role="menu" element', async () => {
    const user = userEvent.setup();

    renderWithTheme(
      <Dropdown searchable trigger={<Button>Open menu</Button>}>
        <DropdownItem>Alpha</DropdownItem>
      </Dropdown>
    );

    await user.click(screen.getByRole('button', { name: 'Open menu' }));

    const menu = screen.getByRole('menu');
    const searchInput = screen.getByRole('searchbox', {
      name: 'Search dropdown items',
    });

    expect(menu).not.toContainElement(searchInput);
  });

  it('filters dropdown items based on the search query', async () => {
    const user = userEvent.setup();

    renderWithTheme(
      <Dropdown searchable trigger={<Button>Open menu</Button>}>
        <DropdownLabel>Actions</DropdownLabel>
        <DropdownItem>Alpha</DropdownItem>
        <DropdownItem>Beta</DropdownItem>
        <DropdownSeparator />
        <DropdownItem>Gamma</DropdownItem>
      </Dropdown>
    );

    await user.click(screen.getByRole('button', { name: 'Open menu' }));
    await user.type(
      screen.getByRole('searchbox', { name: 'Search dropdown items' }),
      'bet'
    );

    expect(screen.getByRole('menuitem', { name: 'Beta' })).toBeInTheDocument();
    expect(
      screen.queryByRole('menuitem', { name: 'Alpha' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('menuitem', { name: 'Gamma' })
    ).not.toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });

  it('renders an empty state when no items match', async () => {
    const user = userEvent.setup();

    renderWithTheme(
      <Dropdown
        searchable
        searchEmptyState="Nothing matched"
        trigger={<Button>Open menu</Button>}
      >
        <DropdownItem>Alpha</DropdownItem>
        <DropdownItem>Beta</DropdownItem>
      </Dropdown>
    );

    await user.click(screen.getByRole('button', { name: 'Open menu' }));
    await user.type(
      screen.getByRole('searchbox', { name: 'Search dropdown items' }),
      'zzz'
    );

    expect(screen.getByText('Nothing matched')).toBeInTheDocument();
    expect(
      screen.queryByRole('menuitem', { name: 'Alpha' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('menuitem', { name: 'Beta' })
    ).not.toBeInTheDocument();
  });

  it('uses custom searchText when provided', async () => {
    const user = userEvent.setup();

    renderWithTheme(
      <Dropdown searchable trigger={<Button>Open menu</Button>}>
        <DropdownItem searchText="new patient intake">Create</DropdownItem>
        <DropdownItem>Archive</DropdownItem>
      </Dropdown>
    );

    await user.click(screen.getByRole('button', { name: 'Open menu' }));
    await user.type(
      screen.getByRole('searchbox', { name: 'Search dropdown items' }),
      'patient'
    );

    expect(
      screen.getByRole('menuitem', { name: 'Create' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('menuitem', { name: 'Archive' })
    ).not.toBeInTheDocument();
  });

  it('matches both the visible label and custom searchText when searchText is provided', async () => {
    const user = userEvent.setup();

    renderWithTheme(
      <Dropdown searchable trigger={<Button>Open menu</Button>}>
        <DropdownItem searchText="schedule appointment">
          Schedule Visit
        </DropdownItem>
        <DropdownItem searchText="send secure message">
          Message Patient
        </DropdownItem>
      </Dropdown>
    );

    await user.click(screen.getByRole('button', { name: 'Open menu' }));
    await user.type(
      screen.getByRole('searchbox', { name: 'Search dropdown items' }),
      'visit'
    );

    expect(
      screen.getByRole('menuitem', { name: 'Schedule Visit' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('menuitem', { name: 'Message Patient' })
    ).not.toBeInTheDocument();
  });

  it('supports multi-select items with checkbox semantics', async () => {
    const user = userEvent.setup();
    const handleSelectedValuesChange = vi.fn();

    renderWithTheme(
      <Dropdown
        multiSelect
        defaultSelectedValues={['alpha']}
        onSelectedValuesChange={handleSelectedValuesChange}
        trigger={<Button>Open menu</Button>}
      >
        <DropdownItem value="alpha">Alpha</DropdownItem>
        <DropdownItem value="beta">Beta</DropdownItem>
      </Dropdown>
    );

    await user.click(screen.getByRole('button', { name: 'Open menu' }));

    const alphaItem = screen.getByRole('menuitemcheckbox', { name: 'Alpha' });
    const betaItem = screen.getByRole('menuitemcheckbox', { name: 'Beta' });

    expect(alphaItem).toHaveAttribute('aria-checked', 'true');
    expect(betaItem).toHaveAttribute('aria-checked', 'false');

    await user.click(betaItem);

    expect(betaItem).toHaveAttribute('aria-checked', 'true');
    expect(handleSelectedValuesChange).toHaveBeenCalledWith(['alpha', 'beta']);
  });

  it('keeps multi-select behavior when filtering searchable dropdowns', async () => {
    const user = userEvent.setup();

    function SearchableMultiSelectHarness() {
      const [selectedValues, setSelectedValues] = React.useState<string[]>([]);

      return (
        <Dropdown
          searchable
          multiSelect
          selectedValues={selectedValues}
          onSelectedValuesChange={setSelectedValues}
          trigger={<Button>Open menu</Button>}
        >
          <DropdownItem value="schedule" searchText="schedule appointment">
            Schedule Visit
          </DropdownItem>
          <DropdownItem value="message" searchText="send secure message">
            Message Patient
          </DropdownItem>
        </Dropdown>
      );
    }

    renderWithTheme(<SearchableMultiSelectHarness />);

    await user.click(screen.getByRole('button', { name: 'Open menu' }));
    await user.type(
      screen.getByRole('searchbox', { name: 'Search dropdown items' }),
      'secure'
    );

    const messageItem = screen.getByRole('menuitemcheckbox', {
      name: 'Message Patient',
    });

    expect(
      screen.queryByRole('menuitemcheckbox', { name: 'Schedule Visit' })
    ).not.toBeInTheDocument();

    await user.click(messageItem);

    expect(messageItem).toHaveAttribute('aria-checked', 'true');
  });

  it('selects all multi-select items when the select-all control is used', async () => {
    const user = userEvent.setup();

    function MultiSelectHarness() {
      const [selectedValues, setSelectedValues] = React.useState<string[]>([]);

      return (
        <Dropdown
          multiSelect
          showSelectAll
          selectedValues={selectedValues}
          onSelectedValuesChange={setSelectedValues}
          trigger={<Button>Open menu</Button>}
        >
          <DropdownItem value="alpha">Alpha</DropdownItem>
          <DropdownItem value="beta">Beta</DropdownItem>
        </Dropdown>
      );
    }

    renderWithTheme(<MultiSelectHarness />);

    await user.click(screen.getByRole('button', { name: 'Open menu' }));
    await user.click(
      screen.getByRole('menuitemcheckbox', { name: 'Select all' })
    );

    expect(
      screen.getByRole('menuitemcheckbox', { name: 'Alpha' })
    ).toHaveAttribute('aria-checked', 'true');
    expect(
      screen.getByRole('menuitemcheckbox', { name: 'Beta' })
    ).toHaveAttribute('aria-checked', 'true');
  });

  it('select all targets only visible searchable items', async () => {
    const user = userEvent.setup();

    function SearchableSelectAllHarness() {
      const [selectedValues, setSelectedValues] = React.useState<string[]>([
        'alpha',
      ]);

      return (
        <Dropdown
          searchable
          multiSelect
          showSelectAll
          selectedValues={selectedValues}
          onSelectedValuesChange={setSelectedValues}
          trigger={<Button>Open menu</Button>}
        >
          <DropdownItem value="alpha" searchText="alpha primary">
            Alpha
          </DropdownItem>
          <DropdownItem value="beta" searchText="beta visible">
            Beta
          </DropdownItem>
          <DropdownItem value="gamma" searchText="gamma visible">
            Gamma
          </DropdownItem>
        </Dropdown>
      );
    }

    renderWithTheme(<SearchableSelectAllHarness />);

    await user.click(screen.getByRole('button', { name: 'Open menu' }));
    await user.type(
      screen.getByRole('searchbox', { name: 'Search dropdown items' }),
      'visible'
    );

    const selectAllItem = screen.getByRole('menuitemcheckbox', {
      name: 'Select all',
    });

    expect(selectAllItem).toHaveAttribute('aria-checked', 'false');
    expect(
      screen.queryByRole('menuitemcheckbox', { name: 'Alpha' })
    ).not.toBeInTheDocument();

    await user.click(selectAllItem);

    expect(
      screen.getByRole('menuitemcheckbox', { name: 'Beta' })
    ).toHaveAttribute('aria-checked', 'true');
    expect(
      screen.getByRole('menuitemcheckbox', { name: 'Gamma' })
    ).toHaveAttribute('aria-checked', 'true');
  });

  it('shows an indeterminate select-all state when some visible items are selected', async () => {
    const user = userEvent.setup();

    renderWithTheme(
      <Dropdown
        multiSelect
        showSelectAll
        selectedValues={['alpha']}
        trigger={<Button>Open menu</Button>}
      >
        <DropdownItem value="alpha">Alpha</DropdownItem>
        <DropdownItem value="beta">Beta</DropdownItem>
      </Dropdown>
    );

    await user.click(screen.getByRole('button', { name: 'Open menu' }));

    expect(
      screen.getByRole('menuitemcheckbox', { name: 'Select all' })
    ).toHaveAttribute('aria-checked', 'mixed');
  });
});
