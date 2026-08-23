import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import { FilterSummaryBar } from './FilterSummaryBar';

describe('FilterSummaryBar', () => {
  it('hides while idle by default', () => {
    renderWithTheme(
      <FilterSummaryBar
        filteredCount={100}
        totalCount={100}
        activeFilterCount={0}
        onClearAll={() => {}}
      />
    );
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('shows idle summary with showWhenIdle', () => {
    renderWithTheme(
      <FilterSummaryBar
        filteredCount={100}
        totalCount={100}
        activeFilterCount={0}
        showWhenIdle
        onClearAll={() => {}}
      />
    );
    expect(screen.getByRole('status')).toHaveTextContent('all records visible');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('summarizes counts and pluralizes filters', () => {
    renderWithTheme(
      <FilterSummaryBar
        filteredCount={1204}
        totalCount={8911}
        activeFilterCount={3}
        onClearAll={() => {}}
      />
    );
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('1,204 of 8,911 records');
    expect(status).toHaveTextContent('3 filters active');
  });

  it('uses the singular filter label', () => {
    renderWithTheme(
      <FilterSummaryBar
        filteredCount={10}
        activeFilterCount={1}
        onClearAll={() => {}}
      />
    );
    expect(screen.getByRole('status')).toHaveTextContent('1 filter active');
  });

  it('describes search-only and search+filters states', () => {
    const { rerender } = renderWithTheme(
      <FilterSummaryBar
        filteredCount={310}
        activeFilterCount={0}
        hasSearchText
        onClearAll={() => {}}
      />
    );
    expect(screen.getByRole('status')).toHaveTextContent('search active');

    rerender(
      <FilterSummaryBar
        filteredCount={42}
        activeFilterCount={2}
        hasSearchText
        onClearAll={() => {}}
      />
    );
    expect(screen.getByRole('status')).toHaveTextContent(
      '2 filters active + search'
    );
  });

  it('clears all filters', () => {
    const onClearAll = vi.fn();
    renderWithTheme(
      <FilterSummaryBar
        filteredCount={10}
        activeFilterCount={2}
        onClearAll={onClearAll}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /clear all/i }));
    expect(onClearAll).toHaveBeenCalled();
  });

  it('supports i18n label overrides', () => {
    renderWithTheme(
      <FilterSummaryBar
        filteredCount={5}
        activeFilterCount={1}
        onClearAll={() => {}}
        recordsLabel="contacts"
        filterLabel="condition"
        clearLabel="Reset"
      />
    );
    expect(screen.getByRole('status')).toHaveTextContent('5 contacts');
    expect(screen.getByRole('status')).toHaveTextContent('1 condition active');
    expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument();
  });
});
