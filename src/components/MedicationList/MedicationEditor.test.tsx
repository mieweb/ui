import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MedicationEditor } from './MedicationEditor';
import { renderWithTheme } from '../../test/test-utils';

describe('MedicationEditor', () => {
  it('edits stored ISO dates as MM/DD/YYYY and saves them back as ISO', () => {
    const onSave = vi.fn();
    renderWithTheme(
      <MedicationEditor
        open
        medication={{
          id: 'm1',
          name: 'Lisinopril',
          status: 'taking',
          startDate: '2026-10-10',
        }}
        onClose={() => {}}
        onSave={onSave}
      />
    );
    expect(screen.getByLabelText('Start date')).toHaveValue('10/10/2026');
    fireEvent.change(screen.getByLabelText('End date'), {
      target: { value: '11/05/2026' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        startDate: '2026-10-10',
        endDate: '2026-11-05',
      })
    );
  });
});
