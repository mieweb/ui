import * as React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { RichTextEsheet, type RichTextEsheetHandle } from './RichTextEsheet';
import type { RichTextEsheetDefinition } from './definition';

// ProseMirror resists jsdom simulation; narrative fields run on the legacy
// engine, which shares the TextAreaRichProps contract (see the stub).
vi.mock(
  '../../components/TextAreaRich/TextAreaRichKerebron',
  () => import('../../test/textAreaRichKerebronStub')
);

const definition: RichTextEsheetDefinition = {
  id: 'test-letter',
  title: 'Referral letter',
  sections: [
    { id: 'reason', title: 'Reason for referral', required: true },
    {
      id: 'closing',
      title: 'Closing',
      findings: [
        {
          id: 'thanks',
          label: 'Thank you',
          text: 'Thank you for seeing this patient.',
        },
      ],
    },
  ],
};

const parties = [
  { role: 'Patient', name: 'Jordan Rivera', detail: 'DOB 1979-03-14' },
  { role: 'Provider', name: 'Dr. Casey Morgan', detail: 'NPI 1234567890' },
];

describe('RichTextEsheet with the real eSheet renderer', () => {
  it('shows parties in the header and inserts them as macros', async () => {
    const ref = React.createRef<RichTextEsheetHandle>();
    render(
      <RichTextEsheet ref={ref} definition={definition} parties={parties} />
    );
    expect(screen.getByText('Jordan Rivera')).toBeInTheDocument();
    expect(screen.getByText('Dr. Casey Morgan')).toBeInTheDocument();
    const reason = await screen.findByRole('textbox', {
      name: /Reason for referral/,
    });
    fireEvent.focus(reason);
    fireEvent.click(
      await screen.findByRole('button', { name: /Patient: Jordan Rivera/ })
    );
    await waitFor(() =>
      expect(screen.getByText('1 of 2 sections documented')).toBeInTheDocument()
    );
    const snapshot = ref.current!.getSnapshot();
    expect(snapshot.documentedSections).toEqual(['reason']);
    expect(snapshot.mdy).toContain('Jordan Rivera (DOB 1979-03-14)');
    expect(snapshot.mdy).toContain('name: Dr. Casey Morgan');
  });

  it('blocks submit on missing required sections, then saves the document', async () => {
    const onSubmit = vi.fn();
    render(
      <RichTextEsheet
        definition={definition}
        parties={parties}
        onSubmit={onSubmit}
      />
    );
    const save = screen.getByRole('button', { name: 'Save document' });
    fireEvent.click(save);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Reason for referral is required.'
    );
    expect(onSubmit).not.toHaveBeenCalled();
    const reason = await screen.findByRole('textbox', {
      name: /Reason for referral/,
    });
    fireEvent.input(reason, {
      target: { innerHTML: '<p>Routine evaluation, please.</p>' },
    });
    fireEvent.click(save);
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    const snapshot = onSubmit.mock.calls[0][0];
    expect(snapshot.errors).toEqual([]);
    expect(snapshot.mdy).toContain(
      '## Reason for referral\n\nRoutine evaluation, please.'
    );
    expect(await screen.findByText('Document saved.')).toBeInTheDocument();
  });

  it('translates shell labels without resetting the draft', async () => {
    const { rerender } = render(
      <RichTextEsheet
        definition={definition}
        messages={{
          labels: {
            '{count} of {total} sections documented':
              '{count} sur {total} sections documentées',
          },
        }}
      />
    );
    const reason = await screen.findByRole('textbox', {
      name: /Reason for referral/,
    });
    fireEvent.input(reason, { target: { innerHTML: 'Draft retained' } });
    expect(
      screen.getByText('1 sur 2 sections documentées')
    ).toBeInTheDocument();
    rerender(<RichTextEsheet definition={definition} />);
    expect(
      screen.getByRole('textbox', { name: /Reason for referral/ })
    ).toHaveTextContent('Draft retained');
  });
});
