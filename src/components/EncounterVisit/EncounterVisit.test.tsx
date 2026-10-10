import * as React from 'react';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { EncounterVisit, type EncounterVisitHandle } from './EncounterVisit';
import { getEncounterFieldId } from './definition';
import type { EncounterVisitDefinition, EncounterVisitSnapshot } from './types';

const definition: EncounterVisitDefinition = {
  id: 'test-visit',
  title: 'Anonymous exam',
  sections: [
    { id: 'hpi', title: 'HPI', kind: 'narrative' },
    {
      id: 'exam',
      title: 'Exam',
      kind: 'observations',
      narrative: true,
      observations: [{ id: 'back', label: 'Back examination' }],
    },
    { id: 'vitals', title: 'Vitals', kind: 'vitals' },
  ],
};

describe('EncounterVisit with the real eSheet renderer', () => {
  it('keeps unfinished numeric drafts visible to Save and MCP validation', async () => {
    const ref = React.createRef<EncounterVisitHandle>();
    const onSubmit = vi.fn();
    render(
      <EncounterVisit ref={ref} definition={definition} onSubmit={onSubmit} />
    );
    await screen.findByRole('textbox', { name: 'HPI' });
    act(() => {
      ref.current!.getTools().upsertVitals('vitals', { id: 'one', pulse: 76 });
    });
    fireEvent.change(screen.getByLabelText('Pulse'), {
      target: { value: 'unfinished' },
    });
    expect(
      ref
        .current!.getSnapshot()
        .observations.some((observation) => observation.label === 'Pulse')
    ).toBe(false);
    expect(ref.current!.getTools().validateVisit()).toMatchObject({
      success: true,
      data: { valid: false },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save visit' }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Pulse')).toHaveValue('unfinished');
    fireEvent.change(screen.getByLabelText('Pulse'), {
      target: { value: '78' },
    });
    expect(ref.current!.getTools().validateVisit()).toMatchObject({
      success: true,
      data: { valid: true },
    });
  });

  it('edits one narrative observation and exports the same native answer and note', async () => {
    const ref = React.createRef<EncounterVisitHandle>();
    const onChange = vi.fn();
    render(
      <EncounterVisit
        ref={ref}
        definition={definition}
        patientContext="45 yo male with back pain"
        onChange={onChange}
      />
    );
    const input = await screen.findByRole('textbox', { name: 'HPI' });
    fireEvent.change(input, {
      target: {
        value: '45 yo male with pre-diabetes, back pain and hypertension.',
      },
    });
    const snapshot = ref.current!.getSnapshot();
    expect(snapshot.responses[getEncounterFieldId('hpi')].answer).toContain(
      'back pain'
    );
    expect(snapshot.observations).toHaveLength(1);
    expect(onChange.mock.lastCall?.[0].responses).toEqual(snapshot.responses);
    fireEvent.click(screen.getByRole('button', { name: 'Review note' }));
    expect(
      screen.getByRole('region', { name: 'Visit note preview' })
    ).toHaveTextContent('hypertension');
    expect(
      screen.queryByRole('textbox', { name: /patient name/i })
    ).not.toBeInTheDocument();
  });

  it('keeps draft input through callback-driven host renders and inline config objects', async () => {
    function Host() {
      const [saved, setSaved] = React.useState<EncounterVisitSnapshot | null>(
        null
      );
      return (
        <EncounterVisit
          definition={{
            ...definition,
            sections: definition.sections.map((section) => ({ ...section })),
          }}
          initialResponses={saved?.responses ?? {}}
          onChange={setSaved}
        />
      );
    }
    render(<Host />);
    const input = await screen.findByRole('textbox', { name: 'HPI' });
    fireEvent.change(input, { target: { value: 'Draft retained' } });
    fireEvent.change(input, {
      target: { value: 'Draft retained after another edit' },
    });
    expect(input).toHaveValue('Draft retained after another edit');
  });

  it('MCP writes update visible fields and user edits return through the same tools', async () => {
    const ref = React.createRef<EncounterVisitHandle>();
    const { rerender } = render(
      <EncounterVisit ref={ref} definition={definition} />
    );
    await screen.findByRole('textbox', { name: 'HPI' });
    let result;
    act(() => {
      result = ref
        .current!.getTools()
        .upsertVitals('vitals', { id: 'first', systolic: 142, diastolic: 88 });
    });
    expect(result).toMatchObject({ success: true });
    expect(screen.getByLabelText('Systolic')).toHaveValue('142');
    expect(screen.getByLabelText('Diastolic')).toHaveValue('88');
    fireEvent.change(screen.getByLabelText('Pulse'), {
      target: { value: '76' },
    });
    const snapshot = ref.current!.getTools().getVisit();
    expect(
      snapshot.success &&
        snapshot.data.observations.find((item) => item.label === 'Pulse')?.value
    ).toBe(76);
    rerender(<EncounterVisit ref={ref} definition={definition} readOnly />);
    expect(
      ref.current!.getTools().setNarrative('hpi', 'blocked')
    ).toMatchObject({ success: false, error: { code: 'READ_ONLY' } });
    expect(screen.getByLabelText('Systolic')).toHaveAttribute('readonly');
  });

  it('blocks save for partial BP and keeps a rejected save draft', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('Storage is offline'));
    render(<EncounterVisit definition={definition} onSubmit={onSubmit} />);
    await screen.findByRole('textbox', { name: 'HPI' });
    fireEvent.click(
      screen.getByRole('button', { name: 'Add measurement set' })
    );
    fireEvent.change(screen.getByLabelText('Systolic'), {
      target: { value: '142' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save visit' }));
    expect(onSubmit).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText('Diastolic'), {
      target: { value: '88' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save visit' }));
    await screen.findByText('Storage is offline');
    expect(onSubmit).toHaveBeenCalledOnce();
    expect(screen.getByLabelText('Systolic')).toHaveValue('142');
    expect(screen.getByRole('button', { name: 'Save visit' })).toBeEnabled();
  });

  it('preserves answers when sections change without publishing intermediate empty drafts', async () => {
    const ref = React.createRef<EncounterVisitHandle>();
    const onChange = vi.fn();
    const { rerender } = render(
      <EncounterVisit ref={ref} definition={definition} onChange={onChange} />
    );
    fireEvent.change(await screen.findByRole('textbox', { name: 'HPI' }), {
      target: { value: 'Preserved narrative' },
    });
    onChange.mockClear();
    const next = {
      ...definition,
      sections: [
        ...definition.sections,
        { id: 'plan', title: 'Plan', kind: 'narrative' as const },
      ],
    };
    rerender(
      <EncounterVisit ref={ref} definition={next} onChange={onChange} />
    );
    await screen.findByRole('textbox', { name: 'Plan' });
    expect(screen.getByRole('textbox', { name: 'HPI' })).toHaveValue(
      'Preserved narrative'
    );
    expect(onChange.mock.calls.length).toBeGreaterThan(0);
    for (const [visit] of onChange.mock.calls)
      expect(visit.responses[getEncounterFieldId('hpi')].answer).toBe(
        'Preserved narrative'
      );
    rerender(
      <EncounterVisit ref={ref} definition={{ ...next, id: 'new-visit' }} />
    );
    await waitFor(() =>
      expect(screen.getByRole('textbox', { name: 'HPI' })).toHaveValue('')
    );
  });

  it('freezes UI and tools while an asynchronous save is pending', async () => {
    const ref = React.createRef<EncounterVisitHandle>();
    let resolveSave: (() => void) | undefined;
    const onSubmit = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSave = resolve;
        })
    );
    render(
      <EncounterVisit ref={ref} definition={definition} onSubmit={onSubmit} />
    );
    await screen.findByRole('textbox', { name: 'HPI' });
    fireEvent.click(screen.getByRole('button', { name: 'Save visit' }));
    expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled();
    expect(
      ref.current!.getTools().setNarrative('hpi', 'late edit')
    ).toMatchObject({ success: false, error: { code: 'READ_ONLY' } });
    await act(async () => {
      resolveSave?.();
    });
    expect(screen.getByText('Visit saved.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save visit' })).toBeEnabled();
  });
});
