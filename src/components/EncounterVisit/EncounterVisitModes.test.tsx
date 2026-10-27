import * as React from 'react';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Document } from 'yaml';
import { EncounterVisit, type EncounterVisitHandle } from './EncounterVisit';
import { getEncounterFieldId } from './definition';
import {
  ENCOUNTER_DOCUMENT_FIELD_ID,
  getEncounterMdyFields,
  parseEncounterMdy,
} from './mdy';
import { createEncounterSnapshot } from './model';
import type { EncounterVisitDefinition } from './types';

// Browser tests exercise Kerebron itself. This stand-in can delay its change
// callback, verifying that mode switches and Save flush the editor handle.
vi.mock('./EncounterMdyEditor', async () => {
  const React = await import('react');
  return {
    EncounterMdyEditor: React.forwardRef(function Editor(
      {
        body,
        fieldIds,
        onChange,
        onFieldActivate,
        disabled,
      }: {
        body: string;
        fieldIds: string[];
        onChange: (body: string) => void;
        onFieldActivate: (id: string) => void;
        disabled: boolean;
      },
      ref
    ) {
      const input = React.useRef<HTMLTextAreaElement>(null);
      React.useEffect(() => {
        if (input.current) input.current.value = body;
      }, [body]);
      React.useImperativeHandle(ref, () => ({
        getContent: async () => input.current?.value ?? body,
        focus: () => input.current?.focus(),
      }));
      return (
        <>
          <textarea
            ref={input}
            aria-label="Encounter narrative"
            defaultValue={body}
            readOnly={disabled}
            onChange={() => {}}
            onInput={(event) => onChange(event.currentTarget.value)}
          />
          <button
            type="button"
            disabled={disabled}
            onClick={() => onFieldActivate(fieldIds[fieldIds.length - 1])}
          >
            Edit linked vitals
          </button>
        </>
      );
    }),
  };
});

const definition: EncounterVisitDefinition = {
  id: 'mode-test',
  title: 'Anonymous visit',
  sections: [
    { id: 'hpi', title: 'HPI', kind: 'narrative' },
    { id: 'vitals', title: 'Vitals', kind: 'vitals' },
  ],
};

const modeSwitch = () => screen.getByRole('combobox', { name: 'Visit mode' });
const selectMode = (label: 'eSheet' | 'RichEdit' | 'View') => {
  fireEvent.click(modeSwitch());
  fireEvent.click(screen.getByRole('option', { name: label }));
};

describe('EncounterVisit mode synchronization', () => {
  it('requires a compatible explicit definition before opening a native eSheet MDY', () => {
    const original = parseEncounterMdy(
      createEncounterSnapshot(definition, {}).mdy
    );
    const yaml = new Document(original.frontMatter);
    yaml.delete('encounterDefinition');
    const source = `---\n${yaml.toString()}---\n${original.body}`;
    expect(() => render(<EncounterVisit initialMdy={source} />)).toThrow(
      'Supply an encounter definition'
    );
    expect(() =>
      render(
        <EncounterVisit
          initialMdy={source}
          definition={{ ...definition, sections: [definition.sections[0]] }}
        />
      )
    ).toThrow('The MDY fields do not match');
    yaml.setIn(['form', 'id'], 'another-visit');
    expect(() =>
      render(
        <EncounterVisit
          initialMdy={`---\n${yaml.toString()}---\n${original.body}`}
          definition={definition}
        />
      )
    ).toThrow('The MDY form id does not match');
  });

  it('rejects imported field schemas and choice options that reuse the same native IDs', () => {
    const original = parseEncounterMdy(
      createEncounterSnapshot(definition, {}).mdy
    );
    const yaml = new Document(original.frontMatter);
    yaml.delete('encounterDefinition');
    const source = `---\n${yaml.toString()}---\n${original.body}`;
    expect(() =>
      render(
        <EncounterVisit
          initialMdy={source}
          definition={{
            ...definition,
            sections: [
              definition.sections[0],
              { ...definition.sections[1], kind: 'medications' },
            ],
          }}
        />
      )
    ).toThrow('The MDY fields do not match');
    const choices: EncounterVisitDefinition = {
      id: definition.id,
      title: definition.title,
      sections: [
        {
          id: 'exam',
          title: 'Exam',
          kind: 'observations',
          observations: [
            {
              id: 'finding',
              label: 'Finding',
              type: 'choice',
              options: ['Yes', 'No'],
            },
          ],
        },
      ],
    };
    const choiceMdy = parseEncounterMdy(
      createEncounterSnapshot(choices, {}).mdy
    );
    const choiceYaml = new Document(choiceMdy.frontMatter);
    choiceYaml.delete('encounterDefinition');
    const imported = `---\n${choiceYaml.toString()}---\n${choiceMdy.body}`;
    expect(() =>
      render(
        <EncounterVisit
          initialMdy={imported}
          definition={{
            ...choices,
            sections: [
              {
                ...choices.sections[0],
                observations: [
                  {
                    ...choices.sections[0].observations![0],
                    options: ['Positive', 'Negative'],
                  },
                ],
              },
            ],
          }}
        />
      )
    ).toThrow('The MDY fields do not match');
    expect(() =>
      render(<EncounterVisit initialMdy={imported} definition={choices} />)
    ).not.toThrow();
  });

  it('flushes rich prose and focuses the requested section after the eSheet is visible', async () => {
    const ref = React.createRef<EncounterVisitHandle>();
    const { container } = render(
      <EncounterVisit ref={ref} definition={definition} defaultMode="rich" />
    );
    const editor = await screen.findByRole('textbox', {
      name: 'Encounter narrative',
    });
    const body = `${(editor as HTMLTextAreaElement).value}\n\nFinal unreported keystroke.`;
    fireEvent.change(editor, { target: { value: body } });
    const section = container.querySelector<HTMLElement>(
      '[data-field-id="encounter:vitals:section"]'
    )!;
    const focus = vi.spyOn(section, 'focus');
    focus.mockImplementation(() => {
      expect(section.closest('[hidden]')).toBeNull();
    });
    const scroll = vi.fn();
    section.scrollIntoView = scroll;
    act(() => {
      ref.current!.getTools().navigateToSection('vitals');
    });
    await waitFor(() => expect(focus).toHaveBeenCalledOnce());
    expect(scroll).toHaveBeenCalledWith({ block: 'start', behavior: 'auto' });
    expect(modeSwitch()).toHaveTextContent('eSheet');
    expect(ref.current!.getSnapshot().mdy).toContain(
      'Final unreported keystroke.'
    );
  });

  it('flushes the last rich edit before switching and saving, with coded responses retained', async () => {
    const ref = React.createRef<EncounterVisitHandle>();
    const onSubmit = vi.fn();
    render(
      <EncounterVisit ref={ref} definition={definition} onSubmit={onSubmit} />
    );
    const hpi = await screen.findByRole('textbox', { name: 'HPI' });
    fireEvent.input(hpi, { target: { innerHTML: 'Back pain' } });
    act(() => {
      ref
        .current!.getTools()
        .upsertVitals('vitals', { id: 'one', systolic: 142, diastolic: 88 });
    });
    const clinicalResponses = ref.current!.getSnapshot().responses;
    selectMode('RichEdit');
    const editor = await screen.findByRole('textbox', {
      name: 'Encounter narrative',
    });
    const body = `${(editor as HTMLTextAreaElement).value}\n\n### Discussion\n\nFree text stays in the document.`;
    fireEvent.change(editor, { target: { value: body } });
    selectMode('View');
    await waitFor(() =>
      expect(
        screen.getByRole('region', { name: 'Visit note preview' })
      ).toHaveTextContent('Free text stays in the document.')
    );
    const snapshot = ref.current!.getSnapshot();
    expect(snapshot.responses[getEncounterFieldId('hpi')]).toEqual(
      clinicalResponses[getEncounterFieldId('hpi')]
    );
    expect(snapshot.responses[getEncounterFieldId('vitals', 'value')]).toEqual(
      clinicalResponses[getEncounterFieldId('vitals', 'value')]
    );
    expect(parseEncounterMdy(snapshot.mdy).body).toContain('### Discussion');
    expect(
      snapshot.observations.some((observation) =>
        String(observation.value).includes('Free text')
      )
    ).toBe(false);
    selectMode('RichEdit');
    await waitFor(() => expect(modeSwitch()).toHaveTextContent('RichEdit'));
    fireEvent.change(editor, {
      target: { value: `${body}\n\nLast keystroke.` },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save visit' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    expect(onSubmit.mock.calls[0][0].mdy).toContain('Last keystroke.');
  });

  it('opens related inputs in the same renderer and refreshes authored linked data after MCP changes', async () => {
    const ref = React.createRef<EncounterVisitHandle>();
    render(<EncounterVisit ref={ref} definition={definition} />);
    await screen.findByRole('textbox', { name: 'HPI' });
    act(() => {
      ref.current!.getTools().setNarrative('hpi', 'Back pain');
    });
    const fields = getEncounterMdyFields(ref.current!.getSnapshot());
    const vitals = fields.find((field) => field.sectionId === 'vitals')!;
    act(() => {
      ref
        .current!.getTools()
        .setDocumentBody(
          `# Visit\n\n## Measurements\n\n[—](mdy:${vitals.id})\n\n### Discussion\n\nAuthored prose.`
        );
    });
    selectMode('RichEdit');
    fireEvent.click(
      await screen.findByRole('button', { name: 'Edit linked vitals' })
    );
    expect(
      await screen.findByRole('dialog', { name: 'Vitals' })
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Add vitals set' }));
    fireEvent.change(screen.getByLabelText('Systolic'), {
      target: { value: '142' },
    });
    fireEvent.change(screen.getByLabelText('Diastolic'), {
      target: { value: '88' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(ref.current!.getSnapshot().mdy).toContain('142/88');
    act(() => {
      ref
        .current!.getTools()
        .upsertVitals('vitals', { id: 'mcp', systolic: 138, diastolic: 86 });
    });
    expect(ref.current!.getSnapshot().mdy).toContain('138/86');
    expect(ref.current!.getSnapshot().mdy).toContain('Authored prose.');
    selectMode('eSheet');
    await waitFor(() =>
      expect(screen.getAllByLabelText('Systolic')).toHaveLength(2)
    );
  });

  it('keeps portaled Move menus reachable inside the linked-field resolver focus trap', async () => {
    const ref = React.createRef<EncounterVisitHandle>();
    render(
      <EncounterVisit
        ref={ref}
        definition={{
          id: 'plan-test',
          title: 'Anonymous visit',
          sections: [
            { id: 'hpi', title: 'HPI', kind: 'narrative' },
            {
              id: 'assessment',
              title: 'Assessment',
              kind: 'assessment',
              requireCoding: false,
            },
          ],
        }}
      />
    );
    await screen.findByRole('textbox', { name: 'HPI' });
    act(() => {
      ref.current!.getTools().updateSection('assessment', {
        concerns: ['bp', 'back'].map((concernId) => ({
          concernId,
          clinicalStatus: 'active',
          assertions: [
            {
              id: `${concernId}-today`,
              date: '2026-10-10',
              text: concernId === 'bp' ? 'Hypertension' : 'Back pain',
              verificationStatus: 'confirmed',
            },
          ],
        })),
        items: [
          { concernId: 'bp', assertionId: 'bp-today' },
          { concernId: 'back', assertionId: 'back-today' },
        ],
        orders: [
          {
            orderId: 'a1c',
            type: 'lab',
            display: 'Hemoglobin A1c',
            concernId: 'bp',
          },
        ],
      });
    });
    selectMode('RichEdit');
    // The mock editor activates the last linked field — the assessment section.
    fireEvent.click(
      await screen.findByRole('button', { name: 'Edit linked vitals' })
    );
    const dialog = await screen.findByRole('dialog', { name: 'Assessment' });
    fireEvent.click(
      screen.getByRole('button', { name: 'Move Hemoglobin A1c' })
    );
    // The menu portals to document.body; the trap must treat it as in scope
    // instead of yanking focus back and closing it on keyboard entry.
    const item = await screen.findByRole('menuitem', { name: /Move to:/ });
    expect(dialog.contains(item)).toBe(false);
    act(() => item.focus());
    expect(document.activeElement).toBe(item);
  });

  it('restores a portable document and allows read-only mode switching without changing answers', async () => {
    const original = createEncounterSnapshot(definition, {
      [getEncounterFieldId('hpi')]: { answer: 'Back pain' },
      [ENCOUNTER_DOCUMENT_FIELD_ID]: {
        answer: '# Final visit\n\n### Follow-up\n\nFree report text.',
      },
    });
    const ref = React.createRef<EncounterVisitHandle>();
    render(
      <EncounterVisit
        ref={ref}
        initialMdy={original.mdy}
        defaultMode="view"
        readOnly
      />
    );
    await waitFor(() =>
      expect(
        screen.getByRole('region', { name: 'Visit note preview' })
      ).toHaveTextContent('Free report text.')
    );
    expect(modeSwitch()).toHaveTextContent('View');
    expect(ref.current!.getTools().setDocumentBody('overwrite')).toMatchObject({
      success: false,
      error: { code: 'READ_ONLY' },
    });
    selectMode('RichEdit');
    expect(
      await screen.findByRole('textbox', { name: 'Encounter narrative' })
    ).toHaveAttribute('readonly');
    selectMode('eSheet');
    await waitFor(() =>
      expect(screen.getByRole('textbox', { name: 'HPI' })).toHaveTextContent(
        'Back pain'
      )
    );
    expect(
      ref.current!.getSnapshot().responses[getEncounterFieldId('hpi')].answer
    ).toBe('Back pain');
  });
});
