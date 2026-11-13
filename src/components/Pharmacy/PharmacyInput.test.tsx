import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import { PharmacyInput } from './PharmacyInput';
import { storyCandidates, storyPharmacies as P } from './storyData';

const select = () =>
  screen.getByRole('combobox', { name: 'Pharmacy' }) as HTMLSelectElement;

describe('PharmacyInput', () => {
  it('shows only the placeholder for a patient with no history', () => {
    renderWithTheme(
      <PharmacyInput candidates={storyCandidates('no-history')} />
    );
    expect(select().value).toBe('0');
    expect(screen.getAllByRole('option')).toHaveLength(1);
    expect(screen.getByRole('option')).toHaveTextContent('Choose Pharmacy...');
  });

  it('selects the only candidate', () => {
    renderWithTheme(
      <PharmacyInput candidates={storyCandidates('single-faxed')} />
    );
    expect(select().value).toBe(P.oldTown.pharmId);
  });

  it('lists preferred first, then most recent, at most 5, preferred selected', () => {
    renderWithTheme(
      <PharmacyInput candidates={storyCandidates('preferred-and-recent')} />
    );
    const values = screen
      .getAllByRole('option')
      .map((o) => (o as HTMLSelectElement['options'][number]).value);
    expect(values).toEqual([
      '0',
      P.main.pharmId,
      P.corner.pharmId,
      P.wellway.pharmId,
      P.riverside.pharmId,
      P.northside.pharmId,
    ]);
    expect(select().value).toBe(P.main.pharmId);
  });

  it('selects only the first of two preferred pharmacies', () => {
    renderWithTheme(
      <PharmacyInput candidates={storyCandidates('two-preferred')} />
    );
    expect(select().value).toBe(P.corner.pharmId);
    expect(
      screen
        .getAllByRole('option')
        .filter((o) => (o as HTMLSelectElement['options'][number]).selected)
    ).toHaveLength(1);
  });

  it('exposes ncpdpid, npi and newrx on each option', () => {
    renderWithTheme(
      <PharmacyInput candidates={storyCandidates('preferred-and-recent')} />
    );
    const main = screen.getByRole('option', { name: /Main Street/ });
    expect(main).toHaveAttribute('ncpdpid', P.main.ncpdpid);
    expect(main).toHaveAttribute('newrx', '1');
    expect(main).toHaveAttribute('data-newrx', '1');
    const riverside = screen.getByRole('option', { name: /Riverside/ });
    expect(riverside).toHaveAttribute('ncpdpid', '');
    expect(riverside).toHaveAttribute('npi', P.riverside.npi);
    expect(riverside).toHaveAttribute('data-npi', P.riverside.npi);
    expect(riverside).toHaveAttribute('newrx', '0');
  });

  it('reports the default on mount and the override after a reload', () => {
    const onValueChange = vi.fn();
    const { rerender } = renderWithTheme(
      <PharmacyInput
        candidates={storyCandidates('preferred-and-recent')}
        onValueChange={onValueChange}
      />
    );
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenLastCalledWith(
      P.main.pharmId,
      expect.objectContaining({ preferred: 1 })
    );
    rerender(
      <PharmacyInput
        candidates={storyCandidates('preferred-and-recent', P.lakeview.pharmId)}
        overridePharmId={P.lakeview.pharmId}
        onValueChange={onValueChange}
      />
    );
    expect(select().value).toBe(P.lakeview.pharmId);
    expect(select().options[1].value).toBe(P.lakeview.pharmId);
    expect(onValueChange).toHaveBeenCalledTimes(2);
    expect(onValueChange).toHaveBeenLastCalledWith(
      P.lakeview.pharmId,
      expect.objectContaining({ pharmId: P.lakeview.pharmId, preferred: 2 })
    );
    expect(
      document.querySelector<HTMLInputElement>('input[name="pharm_id"]')?.value
    ).toBe(P.lakeview.pharmId);
  });

  it('keeps a manual choice when the host passes a new array with the same contents', () => {
    const onValueChange = vi.fn();
    const { rerender } = renderWithTheme(
      <PharmacyInput
        candidates={storyCandidates('preferred-and-recent')}
        onValueChange={onValueChange}
      />
    );
    fireEvent.change(select(), { target: { value: P.corner.pharmId } });
    rerender(
      <PharmacyInput
        candidates={storyCandidates('preferred-and-recent')}
        onValueChange={onValueChange}
      />
    );
    expect(select().value).toBe(P.corner.pharmId);
    expect(onValueChange).toHaveBeenLastCalledWith(
      P.corner.pharmId,
      expect.objectContaining({ pharmId: P.corner.pharmId })
    );
  });

  it('reports the placeholder as an empty pharmId', () => {
    const onValueChange = vi.fn();
    renderWithTheme(
      <PharmacyInput
        candidates={storyCandidates('preferred-and-recent')}
        value={P.main.pharmId}
        onValueChange={onValueChange}
      />
    );
    fireEvent.change(select(), { target: { value: '0' } });
    expect(onValueChange).toHaveBeenCalledWith('', null);
    // Controlled: the host has not changed `value` yet.
    expect(select().value).toBe(P.main.pharmId);
  });

  it('fires a bubbling native change event for delegated handlers', () => {
    const delegated = vi.fn();
    document.addEventListener('change', delegated);
    renderWithTheme(
      <PharmacyInput candidates={storyCandidates('preferred-and-recent')} />
    );
    fireEvent.change(select(), { target: { value: P.corner.pharmId } });
    document.removeEventListener('change', delegated);
    expect(delegated).toHaveBeenCalledTimes(1);
    expect(select().value).toBe(P.corner.pharmId);
  });

  it('opens the search from a labelled button', () => {
    const onSearchClick = vi.fn();
    renderWithTheme(
      <PharmacyInput candidates={[]} onSearchClick={onSearchClick} />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Search pharmacies' }));
    expect(onSearchClick).toHaveBeenCalledTimes(1);
  });

  it('disables the search button without a handler', () => {
    renderWithTheme(<PharmacyInput candidates={[]} />);
    expect(
      screen.getByRole('button', { name: 'Search pharmacies' })
    ).toBeDisabled();
  });

  it('shows loading and error states', () => {
    renderWithTheme(
      <PharmacyInput
        candidates={[]}
        loading
        error="Could not load pharmacies"
      />
    );
    expect(select()).toHaveAttribute('aria-busy', 'true');
    expect(select()).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('option')).toHaveTextContent('Loading pharmacies…');
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Could not load pharmacies'
    );
  });

  it('fails native validation on the placeholder when required', () => {
    const { rerender } = renderWithTheme(
      <PharmacyInput candidates={storyCandidates('no-history')} required />
    );
    expect(select().value).toBe('0');
    expect(select()).toBeRequired();
    expect(select().checkValidity()).toBe(false);
    expect(select().validationMessage).toBe('Choose a pharmacy.');

    rerender(
      <PharmacyInput candidates={storyCandidates('single-faxed')} required />
    );
    expect(select().value).toBe(P.oldTown.pharmId);
    expect(select().checkValidity()).toBe(true);
  });

  it('stays valid on the placeholder when not required', () => {
    renderWithTheme(<PharmacyInput candidates={[]} />);
    expect(select().checkValidity()).toBe(true);
  });

  it('forwards its ref to the select', () => {
    const ref = { current: null as HTMLSelectElement | null };
    renderWithTheme(<PharmacyInput ref={ref} candidates={[]} />);
    expect(ref.current).toBe(select());
  });

  it('translates built-in labels', () => {
    renderWithTheme(
      <PharmacyInput
        candidates={[]}
        onSearchClick={() => {}}
        messages={{
          labels: {
            Pharmacy: 'Farmacia',
            'Search pharmacies': 'Buscar farmacias',
          },
        }}
      />
    );
    expect(
      screen.getByRole('combobox', { name: 'Farmacia' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Buscar farmacias' })
    ).toBeInTheDocument();
  });
});
