import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { CodeLookup } from './CodeLookup';
import type { CodifyResult } from './engine';
import { Modal } from '../Modal';

const result: CodifyResult = {
  fullid: 'catalog-condition-1',
  label: 'Synthetic concern',
  codetype: 'urn:mieweb:simulation-condition',
  fullcode: 'condition-1',
  domain: 'condition',
  score: 1,
  viaAlias: false,
};

class TestWorker {
  static unavailable = false;
  static holdSearch = false;
  static pendingSearch: { worker: TestWorker; id?: number } | null = null;
  onmessage: ((event: { data: unknown }) => void) | null = null;
  postMessage(message: { type: string; id?: number }) {
    if (message.type === 'search' && TestWorker.holdSearch) {
      TestWorker.pendingSearch = { worker: this, id: message.id };
      return;
    }
    queueMicrotask(() => {
      this.onmessage?.({
        data:
          message.type === 'load'
            ? TestWorker.unavailable
              ? { type: 'error', message: 'Offline index unavailable' }
              : { type: 'ready', docCount: 1 }
            : { type: 'results', id: message.id, results: [result], tookMs: 1 },
      });
    });
  }
  terminate() {}
}

beforeEach(() => {
  TestWorker.unavailable = false;
  TestWorker.holdSearch = false;
  TestWorker.pendingSearch = null;
  vi.stubGlobal('Worker', TestWorker);
});
afterEach(() => vi.unstubAllGlobals());

describe('CodeLookup editor integration', () => {
  it('closes search results with Escape without dismissing the containing editor', async () => {
    const onClose = vi.fn();
    render(
      <Modal open onOpenChange={onClose}>
        <CodeLookup indexUrl="/test-codify" bare onFreeText={vi.fn()} />
      </Modal>
    );
    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'Synthetic' } });
    await screen.findByRole('option', { name: /Synthetic concern/ });
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(input).toHaveValue('Synthetic');
    expect(input).toHaveAttribute('aria-expanded', 'false');
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeVisible();
  });

  it('discards a delayed result after the query has been cleared', async () => {
    TestWorker.holdSearch = true;
    render(<CodeLookup indexUrl="/test-codify" bare />);
    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'Synthetic' } });
    await waitFor(() => expect(TestWorker.pendingSearch).not.toBeNull());
    const pending = TestWorker.pendingSearch!;
    fireEvent.change(input, { target: { value: '' } });
    act(() => {
      pending.worker.onmessage?.({
        data: { type: 'results', id: pending.id, results: [result], tookMs: 1 },
      });
    });
    expect(input).toHaveValue('');
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
    expect(input).toHaveAttribute('aria-expanded', 'false');
  });

  it('associates the combobox input with its label and inline issue', async () => {
    render(
      <>
        <label htmlFor="indication-search">Indication (concern)</label>
        <p id="indication-issue">Choose or enter the concern.</p>
        <CodeLookup
          indexUrl="/test-codify"
          id="indication-search"
          aria-label="Indication (concern)"
          aria-invalid="true"
          aria-describedby="indication-issue"
          domains={['condition']}
          bare
        />
      </>
    );
    const input = screen.getByRole('combobox', {
      name: 'Indication (concern)',
    });
    expect(screen.getByLabelText('Indication (concern)')).toBe(input);
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Choose or enter the concern.');
    await waitFor(() =>
      expect(input).not.toHaveAttribute(
        'placeholder',
        expect.stringContaining('Loading')
      )
    );
  });

  it('reports direct edits separately from coded picks and retains the selected display', async () => {
    const onQueryChange = vi.fn();
    const onSelect = vi.fn();
    render(
      <CodeLookup
        indexUrl="/test-codify"
        aria-label="Indication"
        domains={['condition']}
        bare
        clearOnSelect={false}
        onQueryChange={onQueryChange}
        onSelect={onSelect}
      />
    );
    const input = screen.getByRole('combobox', { name: 'Indication' });
    fireEvent.change(input, { target: { value: 'Synthetic' } });
    expect(onQueryChange).toHaveBeenLastCalledWith('Synthetic');
    fireEvent.click(
      await screen.findByRole('option', { name: /Synthetic concern/ })
    );
    expect(onSelect).toHaveBeenCalledWith(result);
    expect(input).toHaveValue('Synthetic concern');
    expect(onQueryChange).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(input).toHaveValue('');
    expect(onQueryChange).toHaveBeenLastCalledWith('');
  });

  it('keeps free-text drafts editable and committable after index failure', async () => {
    TestWorker.unavailable = true;
    const onQueryChange = vi.fn();
    const onFreeText = vi.fn();
    render(
      <CodeLookup
        indexUrl="/missing-codify"
        aria-label="Medication"
        bare
        clearOnSelect={false}
        onQueryChange={onQueryChange}
        onFreeText={onFreeText}
      />
    );
    const input = screen.getByRole('combobox', { name: 'Medication' });
    await waitFor(() =>
      expect(input).toHaveAttribute('placeholder', 'Code index unavailable')
    );
    expect(input).toBeEnabled();
    fireEvent.change(input, { target: { value: 'Lasix' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onQueryChange).toHaveBeenCalledWith('Lasix');
    expect(onFreeText).toHaveBeenCalledWith('Lasix');
    expect(input).toHaveValue('Lasix');
  });
});
