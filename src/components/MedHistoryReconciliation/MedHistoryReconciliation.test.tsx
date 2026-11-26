import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  act,
  fireEvent,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import {
  MedHistoryReconciliation,
  type MedHistoryAiProvider,
  type MedHistoryReconciliationProps,
} from './MedHistoryReconciliation';
import { chartHistory, incomingHistory } from './storyData';
import type { MedHistoryChangeSet, MedHistoryRecord } from './types';

function renderReview(props: Partial<MedHistoryReconciliationProps> = {}) {
  const onConfirm = vi.fn<(set: MedHistoryChangeSet) => Promise<void>>(
    async () => {}
  );
  const result = renderWithTheme(
    <MedHistoryReconciliation
      incoming={incomingHistory}
      chart={chartHistory}
      codeLookup={false}
      onConfirm={onConfirm}
      {...props}
    />
  );
  return { onConfirm, ...result };
}

const list = () =>
  screen.getByRole('listbox', { name: 'Incoming medications' });
const item = (name: string) =>
  within(list()).getByRole('option', { name: new RegExp(`^${name}`) });
const detail = () => screen.getByRole('region', { name: 'Selected record' });
const select = (name: string) => fireEvent.click(item(name));
const button = (name: string | RegExp) =>
  within(detail()).getByRole('button', { name });

function expectPressed(element: HTMLElement, pressed = true) {
  expect(element).toHaveAttribute('aria-pressed', String(pressed));
}

function expectSelected(name: string) {
  expect(item(name)).toHaveAttribute('aria-selected', 'true');
  expect(
    within(detail()).getByRole('heading', {
      level: 3,
      name: new RegExp(`^${name}`),
    })
  ).toBeInTheDocument();
}

async function confirmImport() {
  fireEvent.click(screen.getByRole('button', { name: 'Review changes' }));
  const dialog = await screen.findByRole('dialog');
  fireEvent.click(
    within(dialog).getByRole('button', { name: 'Confirm import' })
  );
  return dialog;
}

const chartLancets: MedHistoryRecord = {
  id: 'chart-lancets',
  medication: {
    id: 'chart-lancets',
    name: 'FreeStyle 28G lancets',
    status: 'taking',
    quantity: '100',
    quantityUnit: 'each',
    startDate: '2025-06-01',
  },
  codes: [{ system: 'NDC', code: '99073013001' }],
};

// Full-fixture renders and role queries are slow in jsdom.
describe('MedHistoryReconciliation', { timeout: 20_000 }, () => {
  it('lists records by section with a review status in the header', () => {
    renderReview();
    expect(
      screen.getByText('9 incoming · 4 on chart · 3 of 9 reviewed')
    ).toBeInTheDocument();
    const sections = within(list()).getAllByRole('group');
    expect(sections.map((s) => s.getAttribute('aria-labelledby'))).toHaveLength(
      2
    );
    expect(sections[0]).toHaveAccessibleName('Possible duplicates (3)');
    expect(sections[1]).toHaveAccessibleName('New medications (6)');
    expect(item('Sprycel 70 mg tablet')).toHaveTextContent(
      '→ dasatinib 70 mg tablet · 93%'
    );
    expect(item('FreeStyle 28G lancets')).toHaveTextContent('Keep newest');
    expectSelected('Sprycel 70 mg tablet');
  });

  it('compares only differing fields until all are shown', () => {
    renderReview();
    const table = within(detail()).getByRole('table', {
      name: 'Sprycel 70 mg tablet compared with the chart',
    });
    const rowNames = () =>
      within(table)
        .getAllByRole('rowheader')
        .map((h) => h.textContent);
    expect(rowNames()).toEqual(['Medication', 'Directions']);
    expect(
      within(table)
        .getAllByRole('columnheader')
        .map((h) => h.textContent)
    ).toEqual(['Field', 'On chart', 'Incoming']);
    const [chartCell, incomingCell] = within(
      within(table).getByRole('row', { name: /^Directions/ })
    ).getAllByRole('cell');
    expect(chartCell).not.toHaveAttribute('data-outcome');
    expect(chartCell).not.toHaveTextContent('match');
    expect(incomingCell).toHaveAttribute('data-outcome', 'partial');
    expect(
      within(table).getByRole('row', { name: /^Medication/ })
    ).toHaveTextContent('Brand/generic match');
    const toggle = button('Show 5 matching fields');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(toggle);
    expect(rowNames()).toHaveLength(7);
    expect(toggle).toHaveTextContent('Hide matching fields');
  });

  it('marks the incoming value once per chart candidate when there are several', () => {
    const doxy = incomingHistory.find((r) => r.id === 'rxh-doxycycline')!;
    const chartCopy = (id: string, startDate: string): MedHistoryRecord => ({
      ...doxy,
      id,
      dispensedDate: undefined,
      medication: { ...doxy.medication, id, startDate },
    });
    renderReview({
      incoming: [doxy],
      chart: [
        chartCopy('chart-a', doxy.dispensedDate!),
        chartCopy('chart-b', '2025-06-01'),
      ],
    });
    const table = within(detail()).getByRole('table');
    expect(
      within(table)
        .getAllByRole('columnheader')
        .map((h) => h.textContent?.replace(/\d+%/, '').trim())
    ).toEqual(['Field', 'Chart A', 'Chart B', 'Incoming']);
    const incomingCell = within(
      within(table).getByRole('row', { name: /^Start \/ fill date/ })
    ).getAllByRole('cell')[2];
    expect(incomingCell).toHaveAttribute('data-outcome', 'differ');
    expect(incomingCell).toHaveTextContent('Chart A: Match');
    expect(incomingCell).toHaveTextContent('Chart B: Different');
  });

  it('decides with toggle buttons and moves to the next undecided record', () => {
    renderReview();
    const add = button('Add as New');
    fireEvent.click(add);
    expect(item('Sprycel 70 mg tablet')).toHaveTextContent('Add as New');
    expectSelected('methylPREDNISolone 4 MG DOSEPAK');
    expect(
      screen.getByText('9 incoming · 4 on chart · 4 of 9 reviewed')
    ).toBeInTheDocument();

    select('Sprycel 70 mg tablet');
    expectPressed(button('Add as New'));
    fireEvent.click(button('Add as New'));
    expectPressed(button('Add as New'), false);
    expectSelected('Sprycel 70 mg tablet');
    expect(item('Sprycel 70 mg tablet')).toHaveTextContent('Not reviewed');
  });

  it('orders the buttons Add as New, Add as Refill, Skip', () => {
    renderReview();
    const toolbar = within(detail()).getByRole('toolbar', {
      name: 'What to do with Sprycel 70 mg tablet',
    });
    expect(
      within(toolbar)
        .getAllByRole('button')
        .map((b) => b.textContent)
    ).toEqual(['Add as NewN', 'Add as RefillF', 'SkipS']);
  });

  it('applies N / F / S to the selected record', () => {
    renderReview();
    fireEvent.keyDown(item('Sprycel 70 mg tablet'), { key: 'f' });
    expect(item('Sprycel 70 mg tablet')).toHaveTextContent('Refill');
    expectSelected('methylPREDNISolone 4 MG DOSEPAK');
    fireEvent.keyDown(item('methylPREDNISolone 4 MG DOSEPAK'), { key: 'S' });
    expect(item('methylPREDNISolone 4 MG DOSEPAK')).toHaveTextContent('Skip');
    expectSelected('doxycycline hyclate 100 mg capsule');
    fireEvent.keyDown(item('doxycycline hyclate 100 mg capsule'), {
      key: 'n',
      ctrlKey: true,
    });
    expect(item('doxycycline hyclate 100 mg capsule')).toHaveTextContent(
      'Not reviewed'
    );
  });

  it('moves the selection with the arrow keys', () => {
    renderReview();
    fireEvent.keyDown(item('Sprycel 70 mg tablet'), { key: 'ArrowDown' });
    expectSelected('methylPREDNISolone 4 MG DOSEPAK');
    expect(item('methylPREDNISolone 4 MG DOSEPAK')).toHaveFocus();
    fireEvent.keyDown(item('methylPREDNISolone 4 MG DOSEPAK'), {
      key: 'End',
    });
    expect(
      item('Tobramycin and Dexamethasone Ophthalmic Suspension')
    ).toHaveAttribute('aria-selected', 'true');
  });

  it('explains why a refill is unavailable', () => {
    const lisinopril20: MedHistoryRecord = {
      id: 'rxh-lisinopril',
      medication: {
        id: 'rxh-lisinopril',
        name: 'lisinopril 20 mg tablet',
        strength: '20 mg',
        doseForm: 'tablet',
        startDate: '2025-01-15',
        patientSig: 'Take 1 tablet by mouth once daily',
      },
      drugId: 'drug-lisinopril',
    };
    renderReview({ incoming: [lisinopril20] });
    expect(button('Add as Refill: lisinopril 10 mg tablet')).toBeDisabled();
    expect(detail()).toHaveTextContent(
      'Add as Refill is unavailable: the strength differs from the chart record.'
    );
  });

  it('offers only Add as New and Skip for new medications, with warnings', () => {
    renderReview();
    select('BD 3mL syringe 25G x 1');
    expect(detail()).toHaveTextContent('No NDC in the history record');
    expect(detail()).toHaveTextContent('No drug code — may be a supply');
    const toolbar = within(detail()).getByRole('toolbar', {
      name: /^What to do with/,
    });
    expect(
      within(toolbar)
        .getAllByRole('button')
        .map((b) => b.textContent)
    ).toEqual(['Add as NewN', 'SkipS']);
  });

  it('presets repeat fills to Keep newest and switches to custom on manual change', () => {
    renderReview();
    select('FreeStyle 28G lancets');
    const presets = within(detail()).getByRole('toolbar', {
      name: 'All fills of FreeStyle 28G lancets',
    });
    const keep = within(presets).getByRole('button', { name: 'Keep newest' });
    expectPressed(keep);
    expectPressed(button('Add as New (Apr 2, 2026)'));
    expectPressed(button('Skip (Dec 23, 2025)'));
    expect(
      within(detail()).queryByRole('button', { name: /Refill/ })
    ).not.toBeInTheDocument();

    fireEvent.click(button('Add as New (Sep 19, 2025)'));
    expectPressed(keep, false);
    expectPressed(
      within(presets).getByRole('button', { name: 'Skip all' }),
      false
    );
    expect(item('FreeStyle 28G lancets')).toHaveTextContent(
      '2 added · 1 skipped'
    );

    // A preset overwrites every fill and moves on, like any decision.
    fireEvent.click(keep);
    expect(item('FreeStyle 28G lancets')).toHaveTextContent('Keep newest');
    expectSelected('Tobramycin and Dexamethasone Ophthalmic Suspension');
    select('FreeStyle 28G lancets');
    expectPressed(button('Skip (Sep 19, 2025)'));

    fireEvent.click(button('Skip all'));
    expect(item('FreeStyle 28G lancets')).toHaveTextContent('Skip all');
  });

  it('lets only the newest repeat fill be a refill', () => {
    renderReview({ chart: [...chartHistory, chartLancets] });
    select('FreeStyle 28G lancets');
    const refill = button('Add as Refill: FreeStyle 28G lancets (Apr 2, 2026)');
    expect(refill).toBeEnabled();
    expect(
      within(detail()).getAllByRole('button', { name: /^Add as Refill/ })
    ).toHaveLength(1);
    fireEvent.click(refill);
    expect(item('FreeStyle 28G lancets')).toHaveTextContent(
      '1 added · 2 skipped'
    );
  });

  it('adds all new medications and skips the rest, leaving groups alone', async () => {
    const { onConfirm } = renderReview();
    fireEvent.click(screen.getByRole('button', { name: 'Add all new (3)' }));
    expect(item('dexamethasone 4 mg/ml vial')).toHaveTextContent('Add as New');
    fireEvent.click(screen.getByRole('button', { name: 'Skip remaining (3)' }));
    expect(item('Sprycel 70 mg tablet')).toHaveTextContent('Skip');
    expect(item('FreeStyle 28G lancets')).toHaveTextContent('Keep newest');
    expect(
      screen.getByText('9 incoming · 4 on chart · 9 of 9 reviewed')
    ).toBeInTheDocument();

    await confirmImport();
    await waitFor(() => expect(onConfirm).toHaveBeenCalled());
    const set = onConfirm.mock.calls[0][0];
    expect(set.changes.map((c) => [c.action, c.incoming.id])).toEqual([
      ['add', 'rxh-syringe'],
      ['add', 'rxh-dexamethasone'],
      ['add', 'rxh-lancets-3'],
      ['add', 'rxh-tobradex'],
    ]);
    expect(set.undecided).toEqual([]);
  });

  it('records a refill in the change set and shows it in the summary', async () => {
    const { onConfirm } = renderReview({ chartRevision: 'rev-1' });
    fireEvent.click(button('Add as Refill: dasatinib 70 mg tablet'));
    const dialog = await confirmImport();
    expect(
      within(dialog).getByRole('row', { name: /^Refill/ })
    ).toHaveTextContent('dasatinib 70 mg tablet');
    await waitFor(() => expect(onConfirm).toHaveBeenCalled());
    const set = onConfirm.mock.calls[0][0];
    expect(set.chartRevision).toBe('rev-1');
    expect(set.changes[0]).toMatchObject({
      action: 'fill',
      fillOf: chartHistory[0],
      fill: { fillDate: '2026-05-07', quantity: '60' },
    });
    expect(
      await screen.findByText('Medication history import saved.', {
        selector: '[role="alert"] *, [role="alert"]',
      })
    ).toBeInTheDocument();
  });

  it('keeps selections and shows the error when saving fails', async () => {
    const onConfirm = vi.fn(async () => {
      throw new Error('Chart is locked');
    });
    renderReview({ onConfirm });
    fireEvent.click(button('Add as New'));
    const dialog = await confirmImport();
    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'The changes could not be saved: Chart is locked'
    );
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Back to review' })
    );
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    );
    expect(item('Sprycel 70 mg tablet')).toHaveTextContent('Add as New');
  });

  it('reports unsaved decisions, not the Keep newest default', () => {
    const onDirtyChange = vi.fn();
    renderReview({ onDirtyChange });
    expect(onDirtyChange).not.toHaveBeenCalled();
    fireEvent.click(button('Skip'));
    expect(onDirtyChange).toHaveBeenLastCalledWith(true);
  });

  it('edits a record before import and lists the edit in the summary', async () => {
    const { onConfirm } = renderReview();
    select('dexamethasone 4 mg/ml vial');
    expect(
      button('Edit before import: dexamethasone 4 mg/ml vial')
    ).toBeDisabled();
    fireEvent.click(button('Add as New'));
    select('dexamethasone 4 mg/ml vial');
    fireEvent.click(button('Edit before import: dexamethasone 4 mg/ml vial'));
    const editor = await screen.findByRole('dialog');
    fireEvent.change(within(editor).getByLabelText('Indication'), {
      target: { value: 'Inflammation' },
    });
    fireEvent.click(within(editor).getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    );
    expect(item('dexamethasone 4 mg/ml vial')).toHaveTextContent(
      'Add as New · edited'
    );

    const dialog = await confirmImport();
    expect(dialog).toHaveTextContent('Indication');
    await waitFor(() => expect(onConfirm).toHaveBeenCalled());
    expect(
      onConfirm.mock.calls[0][0].changes.find(
        (c) => c.incoming.id === 'rxh-dexamethasone'
      )
    ).toMatchObject({
      editedFields: ['indication'],
      medication: { indication: 'Inflammation' },
    });
  });

  it('resolves pharmacy names from ids through the data source', async () => {
    const getPharmacy = vi.fn(async (id: string) =>
      id === '7777777'
        ? ({ storeName: 'Corner Drug' } as Awaited<
            ReturnType<
              NonNullable<
                MedHistoryReconciliationProps['pharmacySource']
              >['getPharmacy']
            >
          >)
        : null
    );
    const record: MedHistoryRecord = {
      id: 'x',
      medication: {
        id: 'x',
        name: 'aspirin 81 mg tablet',
        pharmacyId: '7777777',
      },
    };
    renderReview({
      incoming: [record],
      chart: [],
      pharmacySource: { getPharmacy },
    });
    expect(
      await within(detail()).findByText('Corner Drug')
    ).toBeInTheDocument();
  });

  it('shows the empty state', () => {
    renderReview({ incoming: [] });
    expect(
      screen.getByText('No incoming medications to review.')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Review changes' })
    ).toBeDisabled();
  });
});

describe(
  'MedHistoryReconciliation — narrow screens',
  { timeout: 20_000 },
  () => {
    afterEach(() => vi.restoreAllMocks());

    it('opens the detail as a sheet and closes it after a decision', async () => {
      const original = window.matchMedia;
      vi.spyOn(window, 'matchMedia').mockImplementation((query: string) => ({
        ...original(query),
        matches: query === '(max-width: 767px)',
        media: query,
      }));
      renderReview();
      expect(
        screen.queryByRole('region', { name: 'Selected record' })
      ).not.toBeInTheDocument();
      select('Sprycel 70 mg tablet');
      const sheet = await screen.findByRole('dialog');
      fireEvent.click(
        within(sheet).getByRole('button', { name: 'Add as New' })
      );
      await waitFor(() =>
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      );
      expect(item('Sprycel 70 mg tablet')).toHaveTextContent('Add as New');
      expect(item('methylPREDNISolone 4 MG DOSEPAK')).toHaveAttribute(
        'aria-selected',
        'true'
      );
    });
  }
);

describe(
  'MedHistoryReconciliation — AI suggestions',
  { timeout: 20_000 },
  () => {
    const tobradex = incomingHistory.find((r) => r.id === 'rxh-tobradex')!;
    const chartTobradex: MedHistoryRecord = {
      id: 'chart-tobradex',
      medication: { id: 'chart-tobradex', name: 'TobraDex eye drops' },
    };

    it('adds an AI-suggested match the rules missed, and can dismiss it', async () => {
      const provider: MedHistoryAiProvider = async () => [
        {
          incomingId: tobradex.id,
          chartId: chartTobradex.id,
          reason: 'Possible match: brand name of the same eye drop',
          confidence: 0.82,
        },
      ];
      renderReview({
        incoming: [tobradex],
        chart: [chartTobradex],
        aiSuggestions: provider,
      });
      expect(
        await within(detail()).findByText(
          /AI suggestion: Possible match: brand name/
        )
      ).toBeInTheDocument();
      expect(detail()).toHaveTextContent(
        'On chart: not a match by the rules — Names too different'
      );
      expect(button('Add as Refill: TobraDex eye drops')).toBeDisabled();
      fireEvent.click(button('Dismiss AI suggestion for TobraDex eye drops'));
      expect(
        within(detail()).queryByRole('button', { name: /Refill/ })
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole('group', { name: /^New medications/ })
      ).toBeInTheDocument();
    });

    it('keeps reviewing when the provider fails', async () => {
      const provider: MedHistoryAiProvider = async () => {
        throw new Error('offline');
      };
      renderReview({ aiSuggestions: provider });
      expect(
        await screen.findByText(
          'AI suggestions are unavailable. Review continues without them.'
        )
      ).toBeInTheDocument();
      fireEvent.click(button('Add as New'));
      expect(item('Sprycel 70 mg tablet')).toHaveTextContent('Add as New');
    });

    it('shows loading and aborts a stale request when the sources change', async () => {
      let signal: AbortSignal | undefined;
      const provider: MedHistoryAiProvider = (_, s) => {
        signal = s;
        return new Promise(() => {});
      };
      const { rerender } = renderReview({ aiSuggestions: provider });
      expect(
        screen.getByText('Checking for AI suggestions…')
      ).toBeInTheDocument();
      const first = signal;
      await act(async () => {
        rerender(
          <MedHistoryReconciliation
            incoming={incomingHistory.slice(0, 2)}
            chart={chartHistory}
            codeLookup={false}
            aiSuggestions={provider}
            onConfirm={() => {}}
          />
        );
      });
      expect(first?.aborted).toBe(true);
    });
  }
);
