import * as React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EncounterExportView } from './EncounterExportView';
import { getEncounterFieldId } from './definition';
import { createEncounterSnapshot } from './model';
import type { EncounterVisitDefinition } from './types';

const definition: EncounterVisitDefinition = {
  id: 'export-test',
  title: 'Visit export',
  sections: [{ id: 'hpi', title: 'History', kind: 'narrative' }],
};

const mockCreateObjectURL = vi.fn(() => 'blob:visit');
const mockRevokeObjectURL = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  URL.createObjectURL = mockCreateObjectURL;
  URL.revokeObjectURL = mockRevokeObjectURL;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('EncounterExportView', () => {
  it('shows the portable MDY document verbatim, including front matter', () => {
    const snapshot = createEncounterSnapshot(definition, {
      [getEncounterFieldId('hpi')]: { answer: 'Supplied history.' },
    });
    const { container } = render(
      <EncounterExportView source={snapshot.mdy} fileName="export-test.md" />
    );
    expect(
      screen.getByRole('region', { name: 'Visit export' })
    ).toHaveTextContent('Supplied history.');
    // The raw serialization, not the rendered report.
    expect(container.querySelector('pre')?.textContent).toBe(snapshot.mdy);
  });

  it('downloads the document as a Markdown file and releases the blob URL', async () => {
    const snapshot = createEncounterSnapshot(definition, {});
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {});
    render(
      <EncounterExportView source={snapshot.mdy} fileName="export-test.md" />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Download visit' }));
    expect(click).toHaveBeenCalledOnce();
    const anchor = click.mock.contexts[0] as HTMLAnchorElement;
    expect(anchor.getAttribute('href')).toBe('blob:visit');
    expect(anchor.download).toBe('export-test.md');
    const blob = vi.mocked(URL.createObjectURL).mock.calls[0][0] as Blob;
    expect(blob.type).toBe('text/markdown');
    // jsdom's Blob has no text(); read it the portable way.
    const text = await new Promise<string>((resolve, reject) => {
      const reader = new globalThis.FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsText(blob);
    });
    expect(text).toBe(snapshot.mdy);
    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:visit');
  });
});
