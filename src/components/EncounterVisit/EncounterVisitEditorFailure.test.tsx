import * as React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EncounterVisit, type EncounterVisitHandle } from './EncounterVisit';
import { getEncounterFieldId } from './definition';
import type { EncounterVisitDefinition } from './types';

vi.mock('./EncounterMdyEditor', () => {
  throw new Error('Optional Kerebron dependency is unavailable');
});

const definition: EncounterVisitDefinition = {
  id: 'optional-editor',
  title: 'Anonymous visit',
  sections: [{ id: 'hpi', title: 'HPI', kind: 'narrative' }],
};

describe('EncounterVisit optional rich editor failure', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => vi.restoreAllMocks());

  it.each(['esheet', 'rich'] as const)(
    'preserves the form and allows review when RichEdit fails from %s',
    async (defaultMode) => {
      const ref = React.createRef<EncounterVisitHandle>();
      const original = {
        [getEncounterFieldId('hpi')]: { answer: 'Recorded back pain.' },
      };
      render(
        <EncounterVisit
          ref={ref}
          definition={definition}
          initialResponses={original}
          defaultMode={defaultMode}
        />
      );
      const selectMode = (label: string) => {
        fireEvent.click(screen.getByRole('combobox', { name: 'Visit mode' }));
        fireEvent.click(screen.getByRole('option', { name: label }));
      };
      if (defaultMode === 'esheet') selectMode('RichEdit');
      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Rich editor is unavailable'
      );
      selectMode('View');
      await waitFor(() =>
        expect(
          screen.getByRole('region', { name: 'Visit note preview' })
        ).toHaveTextContent('Recorded back pain.')
      );
      selectMode('eSheet');
      await waitFor(() =>
        expect(screen.getByRole('textbox', { name: 'HPI' })).toHaveTextContent(
          'Recorded back pain.'
        )
      );
      expect(ref.current!.getSnapshot().responses).toMatchObject(original);
    }
  );
});
