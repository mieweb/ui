import { describe, expect, it, vi } from 'vitest';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { StrictMode } from 'react';
import { FakeEhrStoryHost } from './FakeEhrStoryHost';
import * as transport from './createFakeFetch';
import type { FakeEhrService } from './createFakeEhrService';

async function press(name: string) {
  const button = screen.getByRole('button', { name });
  await waitFor(() => expect(button).not.toBeDisabled());
  fireEvent.click(button);
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: 'Save draft' })
    ).not.toBeDisabled()
  );
}
async function prepare() {
  await press('Save draft');
  await press('Check readiness');
  await press('Advance pending jobs');
  await screen.findByText('Ready for prescriber review');
}

describe('real API client prescribing story host', { timeout: 20000 }, () => {
  it('keeps the floating summary separate from scoped inline medication and pharmacy alerts', async () => {
    render(<FakeEhrStoryHost automaticClock={false} />);
    const name = await screen.findByRole('textbox', {
      name: 'Medication name',
    });
    await waitFor(() => expect(name).toHaveAttribute('aria-invalid', 'true'));
    const medicationDescription = document.getElementById(
      name.getAttribute('aria-describedby')!
    )!;
    expect(medicationDescription).toHaveTextContent('Drug product is required');
    expect(medicationDescription).toHaveTextContent('Drug code is required');
    const pharmacy = screen.getByRole('combobox', { name: 'Pharmacy' });
    expect(
      document.getElementById(pharmacy.getAttribute('aria-describedby')!)
    ).toHaveTextContent('pharmacy must be resolved');
    const toggle = screen.getByRole('button', {
      name: /^Expand prescription issues:/,
    });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(toggle);
    expect(
      screen.getByRole('button', { name: /^Collapse prescription issues:/ })
    ).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(
      screen.getByRole('button', { name: 'Complete prescription: Lasix' })
    );
    const dialog = await screen.findByRole('dialog');
    expect(
      document.querySelectorAll('[data-presentation="floating"]')
    ).toHaveLength(1);
    const lookup = within(dialog).getByRole('textbox', {
      name: 'Medication',
    });
    expect(lookup).toHaveAttribute('aria-invalid', 'true');
    expect(
      document.getElementById(lookup.getAttribute('aria-describedby')!)
    ).toHaveTextContent('Drug product is required');
  });
  it('keeps signed content read-only through summary actions and edits a replacement instead', async () => {
    render(
      <FakeEhrStoryHost
        initialScenario="complete-demo"
        automaticClock={false}
      />
    );
    await prepare();
    fireEvent.click(
      screen.getByRole('checkbox', {
        name: 'I reviewed this prescription and select it as ready to sign',
      })
    );
    await press('Review and select ready to sign');
    fireEvent.click(screen.getByRole('button', { name: 'Simulate signing' }));
    await screen.findByText('Simulated signing: completed');
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Edit prescription' })
      ).toBeDisabled()
    );
    fireEvent.click(screen.getByRole('button', { name: 'Advance 24 hours' }));
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Simulate send' })
      ).toBeDisabled()
    );
    expect(
      screen.queryByRole('button', { name: /Complete prescription/ })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Correct prescription' })
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Draft replacement' }));
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Edit prescription' })
      ).not.toBeDisabled()
    );
    fireEvent.click(screen.getByRole('button', { name: 'Edit prescription' }));
    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).getByLabelText('Dose per administration')
    ).not.toBeDisabled();
    expect(
      within(dialog).getByRole('button', { name: 'Save draft' })
    ).not.toBeDisabled();
  });
  it('suppresses review/sign/send controls at injected clock expiry without waiting for a new API response', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    const actual = transport.createFakeFetch;
    let captured: FakeEhrService | undefined;
    let reads = 0;
    const spy = vi
      .spyOn(transport, 'createFakeFetch')
      .mockImplementation((service, options) => {
        const fetch = actual(service, options);
        if (!options?.onRequest) return fetch;
        if ('controller' in service) captured = service as FakeEhrService;
        return (input, init) => {
          if (init?.method === 'GET') reads += 1;
          return fetch(input, init);
        };
      });
    const view = render(<FakeEhrStoryHost initialScenario="complete-demo" />);
    try {
      await prepare();
      fireEvent.click(
        screen.getByRole('checkbox', {
          name: 'I reviewed this prescription and select it as ready to sign',
        })
      );
      await press('Review and select ready to sign');
      fireEvent.click(screen.getByRole('button', { name: 'Simulate signing' }));
      await screen.findByText('Simulated signing: completed');
      await waitFor(() =>
        expect(
          screen.getByRole('button', { name: 'Simulate send' })
        ).not.toBeDisabled()
      );
      const readsBeforeExpiry = reads;
      // Terminal workflows no longer poll. Only the injected clock reaches the UI.
      captured!.controller.advanceTime(86400000);
      await act(async () => {
        vi.advanceTimersByTime(500);
      });
      expect(reads).toBe(readsBeforeExpiry);
      expect(
        screen.getByRole('button', { name: 'Simulate send' })
      ).toBeDisabled();
      expect(
        screen.getByRole('checkbox', {
          name: 'I reviewed this prescription and select it as ready to sign',
        })
      ).toBeDisabled();
      expect(
        screen.getByRole('button', { name: 'Review and select ready to sign' })
      ).toBeDisabled();
    } finally {
      view.unmount();
      spy.mockRestore();
      vi.useRealTimers();
    }
  });
  it('completes one simulated prescription from draft through acknowledgement and reset', async () => {
    render(
      <StrictMode>
        <FakeEhrStoryHost
          initialScenario="complete-demo"
          automaticClock={false}
        />
      </StrictMode>
    );
    await prepare();
    fireEvent.click(
      screen.getByRole('checkbox', {
        name: 'I reviewed this prescription and select it as ready to sign',
      })
    );
    await press('Review and select ready to sign');
    const sign = screen.getByRole('button', { name: 'Simulate signing' });
    await waitFor(() => expect(sign).not.toBeDisabled());
    fireEvent.click(sign);
    await screen.findByText('Simulated signing: completed');
    const send = screen.getByRole('button', { name: 'Simulate send' });
    await waitFor(() => expect(send).not.toBeDisabled());
    fireEvent.click(send);
    await screen.findByText(/Simulated transmission: queued/);
    fireEvent.click(
      screen.getByRole('button', { name: 'Advance pending jobs' })
    );
    await screen.findByText(/Simulated transmission: acknowledged/);
    expect(
      screen.getByText('Simulated destination acknowledgement; not dispensing')
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reset simulation' }));
    await waitFor(() =>
      expect(screen.queryByText(/Order rx-0001/)).not.toBeInTheDocument()
    );
    await press('Save draft');
    expect(await screen.findByText(/Order rx-0001/)).toBeInTheDocument();
  });
  it('saves bare Lasix, completes an explicitly selected product in the full editor and retains the order identity', async () => {
    render(<FakeEhrStoryHost automaticClock={false} />);
    await press('Save draft');
    expect(screen.getByText('Needs prescription details')).toBeInTheDocument();
    const original = await screen.findByText(/Order rx-0001/);
    expect(original).toBeInTheDocument();
    fireEvent.change(screen.getByRole('combobox', { name: 'Pharmacy' }), {
      target: { value: 'sim-pharmacy-1' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Edit prescription' }));
    const dialog = await screen.findByRole('dialog');
    const query = within(dialog).getByRole('textbox', { name: 'Medication' });
    fireEvent.change(query, { target: { value: 'SimDrug' } });
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Search synthetic catalog' })
    );
    fireEvent.click(
      await within(dialog).findByRole('button', {
        name: 'Select SimDrug A 5 mg tablet',
      })
    );
    // Product metadata is selected authoritatively; actual dose and directions remain explicit.
    const labels: Record<string, string> = {
      'Dose per administration': '5',
      'Dose unit': 'mg',
      Route: 'oral',
      Frequency: 'daily',
      'Sig (patient directions)': 'Take demonstration dose by mouth daily',
      Quantity: '30',
      'Dispensing unit': 'tablet',
      Refills: '0',
      Indication: 'Synthetic indication',
    };
    for (const [label, value] of Object.entries(labels)) {
      const control = within(dialog).getByLabelText(label, { exact: true });
      fireEvent.change(control, { target: { value } });
    }
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save draft' }));
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    );
    expect(
      await screen.findByText(/Order rx-0001 · content revision 2/)
    ).toBeInTheDocument();
    await press('Check readiness');
    await press('Advance pending jobs');
    await screen.findByText('Ready for prescriber review');
  });
  it('resolves a finding through a revision-bound API decision while retaining its evidence', async () => {
    render(
      <FakeEhrStoryHost
        initialScenario="interaction-review"
        automaticClock={false}
      />
    );
    await press('Save draft');
    await press('Check readiness');
    await press('Advance pending jobs');
    await screen.findByText('Prescribing blocked');
    await press('Override synthetic finding');
    await screen.findByText('Decision recorded; finding retained.');
    await screen.findByText('Ready for prescriber review');
  });
  it('cannot review or sign saved old content while the visible draft has unsaved edits', async () => {
    render(
      <FakeEhrStoryHost
        initialScenario="complete-demo"
        automaticClock={false}
      />
    );
    await prepare();
    fireEvent.click(
      screen.getByRole('checkbox', {
        name: 'I reviewed this prescription and select it as ready to sign',
      })
    );
    await press('Review and select ready to sign');
    expect(
      screen.getByRole('button', { name: 'Simulate signing' })
    ).not.toBeDisabled();
    fireEvent.change(screen.getByRole('textbox', { name: 'Medication name' }), {
      target: { value: 'Unresolved other medication' },
    });
    expect(
      screen.getByRole('checkbox', {
        name: 'I reviewed this prescription and select it as ready to sign',
      })
    ).not.toBeChecked();
    expect(
      screen.getByRole('button', { name: 'Review and select ready to sign' })
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Simulate signing' })
    ).toBeDisabled();
    expect(
      screen.queryByText('Ready for prescriber review')
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Save draft' })
    ).not.toBeDisabled();
  });
  it('does not let a delayed old refresh replace a newly selected evaluation of the same clinical scope', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    const actual = transport.createFakeFetch;
    let delayReads = false;
    let release: (() => void) | undefined;
    const delayed = new Promise<void>((resolve) => {
      release = resolve;
    });
    const spy = vi
      .spyOn(transport, 'createFakeFetch')
      .mockImplementation((service, options) => {
        const fetch = actual(service, options);
        return async (input, init) => {
          const response = await fetch(input, init);
          if (
            options?.onRequest &&
            delayReads &&
            String(input).endsWith('/evaluations/ev-0001') &&
            init?.method === 'GET'
          ) {
            delayReads = false;
            await delayed;
          }
          return response;
        };
      });
    try {
      render(<FakeEhrStoryHost initialScenario="complete-demo" />);
      await press('Save draft');
      await press('Check readiness');
      delayReads = true;
      // Start an old read, then create a replacement evaluation without waiting for it.
      await act(async () => {
        vi.advanceTimersByTime(500);
      });
      await waitFor(() => expect(delayReads).toBe(false));
      await press('Check readiness');
      await act(async () => {
        release!();
      });
      expect(
        await screen.findByText(/Gates: review unknown/)
      ).toBeInTheDocument();
      await press('Advance pending jobs');
      await screen.findByText('Ready for prescriber review');
    } finally {
      release?.();
      spy.mockRestore();
      vi.useRealTimers();
    }
  });
});
