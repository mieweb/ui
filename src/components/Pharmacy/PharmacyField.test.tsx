import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import {
  act,
  fireEvent,
  renderHook,
  screen,
  within,
} from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import type { PharmacyDataSource } from './dataSource';
import { PharmacyField } from './PharmacyField';
import {
  createFakePharmacySource,
  storyPharmacies as P,
  type FakePharmacySourceOptions,
} from './storyData';
import {
  PHARMACY_SEARCH_DEBOUNCE_MS,
  usePharmacySearch,
} from './usePharmacyData';

const flush = (ms = 0) => act(() => vi.advanceTimersByTimeAsync(ms));
const settleSearch = () => flush(PHARMACY_SEARCH_DEBOUNCE_MS + 10);

const select = () =>
  screen.getByRole('combobox', { name: 'Pharmacy' }) as HTMLSelectElement;
const dialog = () => screen.getByRole('dialog', { name: 'Pharmacy Search' });
const searchBox = () =>
  within(dialog()).getByRole('combobox', { name: 'Search' });
const resultTexts = () =>
  within(screen.getByRole('listbox'))
    .getAllByRole('option')
    .map((o) => o.textContent);
const result = (name: RegExp) =>
  within(screen.getByRole('listbox')).getByRole('option', { name });

async function setup(
  patId = 'preferred-and-recent',
  options: FakePharmacySourceOptions = {},
  wrap: (source: PharmacyDataSource) => PharmacyDataSource = (s) => s
) {
  const calls: { name: string; args: unknown[] }[] = [];
  const source = wrap(
    createFakePharmacySource({
      ...options,
      onCall: (name, args) => calls.push({ name, args }),
    })
  );
  const onCandidatesLoaded = vi.fn();
  const onValueChange = vi.fn();
  renderWithTheme(
    <PharmacyField
      source={source}
      patId={patId}
      onCandidatesLoaded={onCandidatesLoaded}
      onValueChange={onValueChange}
    />
  );
  await flush();
  const count = (name: string) => calls.filter((c) => c.name === name).length;
  return { calls, count, onCandidatesLoaded, onValueChange };
}

async function openSearch() {
  fireEvent.click(screen.getByRole('button', { name: 'Search pharmacies' }));
  await flush();
}

async function searchAndPick(text: string, option: RegExp) {
  fireEvent.change(searchBox(), { target: { value: text } });
  await settleSearch();
  fireEvent.click(result(option));
  await flush();
}

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe('PharmacyField', () => {
  it('loads the short list and selects the preferred pharmacy', async () => {
    const { onCandidatesLoaded, onValueChange } = await setup();
    expect(select().value).toBe(P.main.pharmId);
    expect(onCandidatesLoaded).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenLastCalledWith(
      P.main.pharmId,
      expect.objectContaining({ storeName: P.main.storeName })
    );
  });

  it('opens the search prefilled with the address and current pharmacy', async () => {
    await setup();
    await openSearch();
    expect(within(dialog()).getByLabelText('Postal code')).toHaveValue('46805');
    const info = within(dialog()).getByRole('region', {
      name: 'Pharmacy details',
    });
    expect(within(info).getByText(P.main.storeName)).toBeInTheDocument();
  });

  it('opens with empty filters for an unknown patient', async () => {
    await setup('unknown');
    await openSearch();
    expect(within(dialog()).getByLabelText('Postal code')).toHaveValue('');
    expect(
      within(dialog()).getByText('No pharmacy selected.')
    ).toBeInTheDocument();
  });

  it('uses a pharmacy once: reloads the list with it selected', async () => {
    const { count, onCandidatesLoaded } = await setup();
    await openSearch();
    await searchAndPick('lake', /Lakeview/);
    fireEvent.click(within(dialog()).getByRole('button', { name: 'Use Once' }));
    await flush();

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(select().value).toBe(P.lakeview.pharmId);
    expect(select().options[1].value).toBe(P.lakeview.pharmId);
    expect(
      document.querySelector<HTMLInputElement>('input[name="pharm_id"]')?.value
    ).toBe(P.lakeview.pharmId);
    expect(onCandidatesLoaded).toHaveBeenCalledTimes(2);
    expect(count('setPreferred')).toBe(0);
  });

  it('selects the same pharmacy again after a second Use Once', async () => {
    const { onCandidatesLoaded } = await setup();
    for (let round = 0; round < 2; round++) {
      await openSearch();
      await searchAndPick('lake', /Lakeview/);
      fireEvent.click(
        within(dialog()).getByRole('button', { name: 'Use Once' })
      );
      await flush();
      expect(select().value).toBe(P.lakeview.pharmId);
      if (round === 0) {
        fireEvent.change(select(), { target: { value: P.main.pharmId } });
        expect(select().value).toBe(P.main.pharmId);
      }
    }
    expect(onCandidatesLoaded).toHaveBeenCalledTimes(3);
  });

  it('returns focus to the search button after closing', async () => {
    await setup();
    await openSearch();
    fireEvent.click(within(dialog()).getByRole('button', { name: 'Use Once' }));
    await flush();
    expect(
      screen.getByRole('button', { name: 'Search pharmacies' })
    ).toHaveFocus();
  });

  it('makes a mail-order pharmacy preferred without touching the local one', async () => {
    const { calls } = await setup();
    await openSearch();
    await searchAndPick('mailmeds', /MailMeds/);
    await act(async () => {
      fireEvent.click(
        within(dialog()).getByRole('button', { name: 'Make Preferred' })
      );
    });
    // Save, then reload the list.
    await flush();
    await flush();

    expect(calls.find((c) => c.name === 'setPreferred')?.args[0]).toEqual({
      patId: 'preferred-and-recent',
      pharmId: P.mail.pharmId,
      id: P.mail.ncpdpid,
      idType: 'ncpdp',
      roleId: 6,
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(select().value).toBe(P.mail.pharmId);
    expect(
      screen.getByRole('option', { name: /Main Street/ })
    ).toBeInTheDocument();
  });

  it('keeps the dialog open when saving fails', async () => {
    await setup('preferred-and-recent', { failSave: true });
    await openSearch();
    await act(async () => {
      fireEvent.click(
        within(dialog()).getByRole('button', { name: 'Make Preferred' })
      );
    });
    await flush();
    expect(within(dialog()).getByRole('alert')).toHaveTextContent(
      'could not be saved'
    );
  });

  it('debounces typing into one search request', async () => {
    const { count } = await setup();
    await openSearch();
    for (const text of ['w', 'we', 'wel', 'wellw']) {
      fireEvent.change(searchBox(), { target: { value: text } });
      await flush(50);
    }
    await settleSearch();
    expect(count('searchPharmacies')).toBe(1);
    expect(resultTexts()).toEqual([
      expect.stringContaining('Wellway Pharmacy #12'),
      expect.stringContaining('Northside Wellway'),
    ]);
  });

  it('ignores a late result even when the source ignores the abort signal', async () => {
    await setup('preferred-and-recent', { delayMs: 500 }, (source) => ({
      ...source,
      searchPharmacies: (params) => source.searchPharmacies(params),
    }));
    await openSearch();
    await flush(1000);
    fireEvent.change(searchBox(), { target: { value: 'main' } });
    await settleSearch();
    fireEvent.change(searchBox(), { target: { value: 'corner' } });
    await settleSearch();
    await flush(1000);
    expect(resultTexts()).toEqual([expect.stringContaining('Corner Drug')]);
  });

  it('shows search failures in the results list', async () => {
    await setup('preferred-and-recent', { failSearch: true });
    await openSearch();
    fireEvent.change(searchBox(), { target: { value: 'main' } });
    await settleSearch();
    expect(
      screen.getByText('The pharmacy search failed. Try again.')
    ).toBeInTheDocument();
  });

  it('shows a load error for the short list', async () => {
    await setup('preferred-and-recent', { failCandidates: true });
    expect(screen.getByRole('alert')).toHaveTextContent(
      'The pharmacy list could not be loaded.'
    );
  });

  it('keeps a pending search when the prefill arrives late', async () => {
    const source = createFakePharmacySource();
    const { result, rerender } = renderHook(
      ({ prefillPharmId }: { prefillPharmId: string }) =>
        usePharmacySearch(source, 'preferred-and-recent', {
          open: true,
          prefillPharmId,
        }),
      { initialProps: { prefillPharmId: '' } }
    );
    act(() =>
      result.current.onSearchRequest({
        query: 'lake',
        zip: '46805',
        excludeNpi: true,
        mailOnly: false,
      })
    );
    rerender({ prefillPharmId: P.main.pharmId });
    await settleSearch();
    expect(result.current.results.map((p) => p.pharmId)).toEqual([
      P.lakeview.pharmId,
    ]);
    expect(result.current.selectedPharmacy?.pharmId).toBe(P.main.pharmId);
  });

  it('starts fresh when the patient changes', async () => {
    const source = createFakePharmacySource();
    const getCandidates = vi.spyOn(source, 'getCandidates');
    const { rerender } = renderWithTheme(
      <PharmacyField source={source} patId="preferred-and-recent" />
    );
    await flush();
    await openSearch();
    await searchAndPick('lake', /Lakeview/);
    fireEvent.click(within(dialog()).getByRole('button', { name: 'Use Once' }));
    await flush();
    expect(select().value).toBe(P.lakeview.pharmId);

    rerender(<PharmacyField source={source} patId="two-preferred" />);
    await flush();
    expect(getCandidates).toHaveBeenLastCalledWith(
      'two-preferred',
      undefined,
      expect.anything()
    );
    expect(select().value).toBe(P.corner.pharmId);
    expect(
      screen.queryByRole('option', { name: /Lakeview/ })
    ).not.toBeInTheDocument();
    expect(
      document.querySelector<HTMLInputElement>('input[name="pharm_id"]')?.value
    ).toBe('');
  });

  it('keeps filters the user edited when the patient address arrives late', async () => {
    await setup('preferred-and-recent', {}, (source) => ({
      ...source,
      getPatientLocation: (patId, signal) =>
        new Promise((resolve) =>
          setTimeout(
            () => resolve(source.getPatientLocation(patId, signal)),
            2000
          )
        ),
    }));
    await openSearch();
    fireEvent.click(within(dialog()).getByRole('radio', { name: 'Phone' }));
    fireEvent.change(within(dialog()).getByPlaceholderText('Phone number'), {
      target: { value: '260-555' },
    });
    await flush(2500);
    expect(
      within(dialog()).getByRole('radio', { name: 'Phone' })
    ).toBeChecked();
    expect(within(dialog()).getByPlaceholderText('Phone number')).toHaveValue(
      '260-555'
    );
  });

  it('applies the late patient address when the filters are untouched', async () => {
    await setup('preferred-and-recent', {}, (source) => ({
      ...source,
      getPatientLocation: (patId, signal) =>
        new Promise((resolve) =>
          setTimeout(
            () => resolve(source.getPatientLocation(patId, signal)),
            2000
          )
        ),
    }));
    await openSearch();
    expect(within(dialog()).getByLabelText('Postal code')).toHaveValue('');
    await flush(2500);
    expect(within(dialog()).getByLabelText('Postal code')).toHaveValue('46805');
  });

  it('never offers results from superseded criteria while searching', async () => {
    await setup('preferred-and-recent', { delayMs: 500 });
    await openSearch();
    await flush(600);
    fireEvent.change(searchBox(), { target: { value: 'c' } });
    await flush(PHARMACY_SEARCH_DEBOUNCE_MS + 600);
    expect(result(/Corner Drug/)).toBeInTheDocument();

    fireEvent.click(
      within(dialog()).getByRole('checkbox', { name: 'Mail Only' })
    );
    await flush(50);
    const listbox = screen.getByRole('listbox');
    expect(within(listbox).queryAllByRole('option')).toHaveLength(0);
    expect(within(listbox).getByText('Searching…')).toBeInTheDocument();

    await flush(PHARMACY_SEARCH_DEBOUNCE_MS + 600);
    // Only mail-order pharmacies match now; Corner Drug is gone.
    expect(resultTexts()).toEqual([
      expect.stringContaining('CareMail Pharmacy'),
      expect.stringContaining('MailMeds Direct'),
    ]);
  });

  it('hides NPI pharmacies unless Exclude NPI is cleared', async () => {
    await setup();
    await openSearch();
    fireEvent.change(searchBox(), { target: { value: 'riverside' } });
    await settleSearch();
    expect(screen.getByText('No pharmacies found.')).toBeInTheDocument();
    fireEvent.click(
      within(dialog()).getByRole('checkbox', { name: 'Exclude NPI' })
    );
    await settleSearch();
    expect(result(/Riverside Apothecary/)).toBeInTheDocument();
  });
});
