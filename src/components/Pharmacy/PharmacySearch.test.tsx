import { describe, it, expect, vi } from 'vitest';
import { act, fireEvent, screen, within } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import { PharmacySearch, type PharmacySearchProps } from './PharmacySearch';
import { filtersFromLocation, type Pharmacy } from './pharmacy';
import { storyPharmacies as P, storyStateOptions } from './storyData';

const initialFilters = filtersFromLocation({
  state: 'IN',
  city: 'Fort Wayne',
  postal: '46805-1234',
});

function renderSearch(overrides: Partial<PharmacySearchProps> = {}) {
  const props: PharmacySearchProps = {
    open: true,
    onOpenChange: vi.fn(),
    initialFilters,
    stateOptions: storyStateOptions,
    results: [],
    onSearchRequest: vi.fn(),
    selectedPharmacy: null,
    onSelectPharmacy: vi.fn(),
    onChoose: vi.fn(),
    onMakePreferred: vi.fn(),
    ...overrides,
  };
  const view = renderWithTheme(<PharmacySearch {...props} />);
  const rerender = (next: Partial<PharmacySearchProps>) =>
    view.rerender(<PharmacySearch {...props} {...next} />);
  return { props, rerender };
}

const searchBox = () => screen.getByRole('combobox', { name: 'Search' });
const method = (name: string) => screen.getByRole('radio', { name });

describe('PharmacySearch', () => {
  it('opens as a labelled dialog with postal search prefilled', () => {
    renderSearch();
    expect(
      screen.getByRole('dialog', { name: 'Pharmacy Search' })
    ).toHaveAttribute('aria-modal', 'true');
    expect(method('Postal Code')).toBeChecked();
    expect(screen.getByLabelText('Postal code')).toHaveValue('46805');
    expect(screen.queryByLabelText('State')).not.toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Exclude NPI' })).toBeChecked();
    expect(
      screen.getByRole('checkbox', { name: 'Mail Only' })
    ).not.toBeChecked();
  });

  it('groups filters in labelled fieldsets', () => {
    renderSearch();
    expect(
      screen.getByRole('group', { name: 'Filter Criteria' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('group', { name: 'Additional Filters' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Help: Exclude NPI' })
    ).toBeInTheDocument();
  });

  it('shows only the criteria for the chosen method', () => {
    renderSearch();
    fireEvent.click(method('State/City'));
    expect(screen.queryByLabelText('Postal code')).not.toBeInTheDocument();
    expect(screen.getByLabelText('State')).toHaveValue('IN');
    expect(screen.getByRole('combobox', { name: 'City' })).toHaveValue(
      'Fort Wayne'
    );
    fireEvent.click(method('Phone'));
    expect(screen.queryByLabelText('State')).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText('Phone number')).toBeInTheDocument();
  });

  it('re-scopes city suggestions when the state changes', () => {
    const onCityQuery = vi.fn();
    renderSearch({ onCityQuery });
    fireEvent.click(method('State/City'));
    fireEvent.change(screen.getByLabelText('State'), {
      target: { value: 'OH' },
    });
    expect(onCityQuery).toHaveBeenLastCalledWith('Fort Wayne', 'OH');
  });

  it('requests a postal search once per distinct request', () => {
    const { props, rerender } = renderSearch();
    fireEvent.change(searchBox(), { target: { value: 'walg' } });
    expect(props.onSearchRequest).toHaveBeenCalledTimes(1);
    expect(props.onSearchRequest).toHaveBeenCalledWith({
      query: 'walg',
      zip: '46805',
      excludeNpi: true,
      mailOnly: false,
    });
    rerender({ resultsLoading: true });
    expect(props.onSearchRequest).toHaveBeenCalledTimes(1);
  });

  it('reports filter changes and includes them in the request', () => {
    const onFiltersChange = vi.fn();
    const { props } = renderSearch({ onFiltersChange });
    fireEvent.change(searchBox(), { target: { value: 'care' } });
    fireEvent.click(screen.getByRole('checkbox', { name: 'Mail Only' }));
    expect(onFiltersChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ mailOnly: true })
    );
    expect(props.onSearchRequest).toHaveBeenLastCalledWith(
      expect.objectContaining({ query: 'care', mailOnly: true })
    );
  });

  it('needs 6 digits for a phone search and says so', () => {
    const { props } = renderSearch();
    fireEvent.click(method('Phone'));
    const phone = screen.getByPlaceholderText('Phone number');
    fireEvent.change(phone, { target: { value: '260-55' } });
    fireEvent.blur(phone);
    expect(props.onSearchRequest).not.toHaveBeenCalled();
    expect(screen.getByRole('status')).toHaveTextContent(
      'At least 6 digits are required for phone number search.'
    );
    expect(phone).toHaveAttribute(
      'aria-describedby',
      screen.getByRole('status').id
    );

    fireEvent.change(phone, { target: { value: '260-555' } });
    expect(props.onSearchRequest).toHaveBeenCalledWith({
      phone: '260555',
      excludeNpi: true,
      mailOnly: false,
    });
    expect(screen.getByRole('status')).toHaveTextContent(
      'Pharmacies found: 0. Press Tab or select Search to see them.'
    );
  });

  it('picks a result, shows its details and does not search for its label', () => {
    const results: Pharmacy[] = [P.main, P.corner];
    const { props, rerender } = renderSearch({ results });
    fireEvent.change(searchBox(), { target: { value: 'ma' } });
    const option = screen.getByRole('option', { name: /Main Street/ });
    expect(
      within(option).getByRole('img', { name: 'E-prescribing' })
    ).toBeInTheDocument();
    fireEvent.click(option);
    expect(props.onSelectPharmacy).toHaveBeenCalledWith(P.main);
    expect(searchBox()).toHaveValue(
      'Main Street Pharmacy - 100 Main St Fort Wayne IN (260) 555-0101 f: (260) 555-0102'
    );
    expect(props.onSearchRequest).toHaveBeenCalledTimes(1);

    rerender({ results, selectedPharmacy: P.main });
    const info = screen.getByRole('region', { name: 'Pharmacy details' });
    expect(info).toHaveAttribute('aria-live', 'polite');
    expect(within(info).getByText('Main Street Pharmacy')).toBeInTheDocument();
    expect(
      within(info).getByRole('link', { name: 'Call Main Street Pharmacy' })
    ).toHaveAttribute('href', 'tel:2605550101');
  });

  it('clears the selection when free text is left in the search box', () => {
    const { props } = renderSearch({ selectedPharmacy: P.main });
    fireEvent.change(searchBox(), { target: { value: 'something else' } });
    fireEvent.blur(searchBox());
    expect(props.onSelectPharmacy).toHaveBeenCalledWith(null);
  });

  it('keeps a prefilled selection when the search box is left empty', () => {
    const { props } = renderSearch({ selectedPharmacy: P.main });
    fireEvent.focus(searchBox());
    fireEvent.blur(searchBox());
    expect(props.onSelectPharmacy).not.toHaveBeenCalled();
  });

  it('disables Make Preferred until a pharmacy is selected', () => {
    renderSearch();
    expect(
      screen.getByRole('button', { name: 'Make Preferred' })
    ).toBeDisabled();
  });

  it('saves an NPI pharmacy as preferred, then returns it and closes', async () => {
    const onMakePreferred = vi.fn().mockResolvedValue(undefined);
    const { props } = renderSearch({
      selectedPharmacy: P.riverside,
      onMakePreferred,
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Make Preferred' }));
    });
    expect(onMakePreferred).toHaveBeenCalledWith({
      pharmId: P.riverside.pharmId,
      id: P.riverside.npi,
      idType: 'npi',
      roleId: 5,
    });
    expect(props.onChoose).toHaveBeenCalledWith(P.riverside.pharmId);
    expect(props.onOpenChange).toHaveBeenCalledTimes(1);
    expect(props.onOpenChange).toHaveBeenCalledWith(false);
  });

  it('saves a mail-order pharmacy in the mail-order slot', async () => {
    const onMakePreferred = vi.fn();
    renderSearch({ selectedPharmacy: P.mail, onMakePreferred });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Make Preferred' }));
    });
    expect(onMakePreferred).toHaveBeenCalledWith(
      expect.objectContaining({ roleId: 6, idType: 'ncpdp' })
    );
  });

  it('stays open with an error when saving fails', async () => {
    const onMakePreferred = vi.fn().mockRejectedValue(new Error('nope'));
    const { props } = renderSearch({
      selectedPharmacy: P.main,
      onMakePreferred,
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Make Preferred' }));
    });
    expect(screen.getByRole('alert')).toHaveTextContent(
      'The preferred pharmacy could not be saved.'
    );
    expect(props.onChoose).not.toHaveBeenCalled();
    expect(props.onOpenChange).not.toHaveBeenCalled();
    expect(
      screen.getByRole('button', { name: 'Make Preferred' })
    ).toBeEnabled();
  });

  it('uses the selection once without saving', () => {
    const { props } = renderSearch({ selectedPharmacy: P.corner });
    fireEvent.click(screen.getByRole('button', { name: 'Use Once' }));
    expect(props.onMakePreferred).not.toHaveBeenCalled();
    expect(props.onChoose).toHaveBeenCalledWith(P.corner.pharmId);
    expect(props.onOpenChange).toHaveBeenCalledWith(false);
  });

  it('resets the filters when new initial filters arrive', () => {
    const { rerender } = renderSearch({
      initialFilters: filtersFromLocation(null),
    });
    expect(screen.getByLabelText('Postal code')).toHaveValue('');
    rerender({ initialFilters });
    expect(screen.getByLabelText('Postal code')).toHaveValue('46805');
  });

  it('returns focus to the opener when it closes', async () => {
    const opener = document.createElement('button');
    document.body.append(opener);
    opener.focus();
    const { rerender } = renderSearch({ open: false });
    rerender({ open: true });
    expect(opener).not.toHaveFocus();
    rerender({ open: false });
    await act(async () => {});
    expect(opener).toHaveFocus();
    opener.remove();
  });

  it('returns focus to returnFocusRef when given', async () => {
    const target = document.createElement('button');
    document.body.append(target);
    const returnFocusRef = { current: target };
    const { rerender } = renderSearch({ open: false, returnFocusRef });
    rerender({ open: true, returnFocusRef });
    rerender({ open: false, returnFocusRef });
    await act(async () => {});
    expect(target).toHaveFocus();
    target.remove();
  });

  it('moves from a complete phone number to the results and announces them', () => {
    const { rerender } = renderSearch({ results: [P.main, P.corner] });
    fireEvent.click(method('Phone'));
    const phone = screen.getByPlaceholderText('Phone number');
    fireEvent.change(phone, { target: { value: '260-555' } });
    expect(screen.getByRole('status')).toHaveTextContent(
      'Pharmacies found: 2. Press Tab or select Search to see them.'
    );
    rerender({ results: [P.main, P.corner] });
    fireEvent.keyDown(phone, { key: 'Tab' });
    expect(searchBox()).toHaveFocus();
    expect(searchBox()).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getAllByRole('option')).toHaveLength(2);
    expect(screen.getByRole('status')).toHaveTextContent('');
  });

  it('keeps normal Tab order while the phone number is incomplete', () => {
    renderSearch();
    fireEvent.click(method('Phone'));
    const phone = screen.getByPlaceholderText('Phone number');
    fireEvent.change(phone, { target: { value: '260' } });
    expect(fireEvent.keyDown(phone, { key: 'Tab' })).toBe(true);
    expect(searchBox()).not.toHaveFocus();
  });

  it('hides Make Preferred when the host cannot save', () => {
    renderSearch({ onMakePreferred: undefined });
    expect(
      screen.queryByRole('button', { name: 'Make Preferred' })
    ).not.toBeInTheDocument();
  });
});
