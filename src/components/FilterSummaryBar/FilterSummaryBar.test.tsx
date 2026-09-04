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
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('all records visible');
    expect(status).not.toHaveTextContent('100');
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
    expect(status).toHaveTextContent(
      `${(1204).toLocaleString()} of ${(8911).toLocaleString()} records`
    );
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

  it('uses the singular record label when one row is visible', () => {
    renderWithTheme(
      <FilterSummaryBar
        filteredCount={1}
        totalCount={8911}
        activeFilterCount={1}
        onClearAll={() => {}}
      />
    );
    expect(screen.getByRole('status')).toHaveTextContent(
      `1 of ${(8911).toLocaleString()} record —`
    );
  });

  it('renders a real total of zero', () => {
    renderWithTheme(
      <FilterSummaryBar
        filteredCount={0}
        totalCount={0}
        activeFilterCount={1}
        onClearAll={() => {}}
      />
    );
    expect(screen.getByRole('status')).toHaveTextContent('0 of 0 records');
  });

  it('hides the clear button when onClearAll is omitted', () => {
    renderWithTheme(
      <FilterSummaryBar filteredCount={5} activeFilterCount={2} />
    );
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
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
