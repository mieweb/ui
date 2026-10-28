import * as React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  EncounterMdyEditor,
  type EncounterMdyEditorHandle,
} from './EncounterMdyEditor';
import { EncounterVisit, type EncounterVisitHandle } from './EncounterVisit';
import { getEncounterFieldId } from './definition';
import type { EncounterVisitDefinition } from './types';

const mock = vi.hoisted(() => ({
  mode: 'initial-failure' as
    | 'initial-failure'
    | 'initialized-failure'
    | 'pending',
  failure: new Error('WASM grammar failed to load'),
  getContent: vi.fn(),
}));

vi.mock('../RichEditor/mdyEditorKit', () => ({
  createMdyEditorKit: () => ({}),
  refreshMdyFieldProjections: vi.fn(),
}));

vi.mock('../RichEditor/RichEditor', async () => {
  const React = await import('react');
  return {
    RichEditor: React.forwardRef(function Editor(
      {
        value,
        disabled,
        onError,
        onReady,
        'aria-label': label,
      }: {
        value: string;
        disabled: boolean;
        onError: (error: Error) => void;
        onReady: (editor: unknown) => void;
        'aria-label': string;
      },
      ref
    ) {
      React.useImperativeHandle(ref, () => ({
        getContent: mock.getContent,
        focus: () => {},
      }));
      const callbacks = React.useRef({ onReady, onError });
      callbacks.current = { onReady, onError };
      React.useEffect(() => {
        if (mock.mode === 'initialized-failure')
          callbacks.current.onReady({
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
          });
        if (mock.mode !== 'pending') callbacks.current.onError(mock.failure);
      }, []);
      return (
        <textarea
          aria-label={label}
          value={value}
          readOnly={disabled}
          onChange={() => {}}
        />
      );
    }),
  };
});

describe('EncounterMdyEditor setup failure recovery', () => {
  beforeEach(() => {
    mock.mode = 'initial-failure';
    mock.getContent.mockReset().mockRejectedValue(mock.failure);
  });

  it('keeps editing disabled until initialization succeeds', () => {
    mock.mode = 'pending';
    render(
      <EncounterMdyEditor
        body="# Original"
        onChange={vi.fn()}
        onFieldActivate={vi.fn()}
      />
    );
    expect(
      screen.getByRole('textbox', { name: 'Encounter narrative' })
    ).toHaveAttribute('readonly');
  });

  it('returns the exact canonical body after an initial failure, including later host updates', async () => {
    const ref = React.createRef<EncounterMdyEditorHandle>();
    const body = '\n##  Original\n\n[140/90](mdy:bloodpressure)  \n';
    const { rerender } = render(
      <EncounterMdyEditor
        ref={ref}
        body={body}
        onChange={vi.fn()}
        onFieldActivate={vi.fn()}
      />
    );
    await screen.findByRole('alert');
    await expect(ref.current!.getContent()).resolves.toBe(body);
    const changed = `${body}\nHost-authored update.\n`;
    rerender(
      <EncounterMdyEditor
        ref={ref}
        body={changed}
        onChange={vi.fn()}
        onFieldActivate={vi.fn()}
      />
    );
    await expect(ref.current!.getContent()).resolves.toBe(changed);
    expect(mock.getContent).not.toHaveBeenCalled();
  });

  it('continues to reject failed reads after a successful initialization', async () => {
    mock.mode = 'initialized-failure';
    const ref = React.createRef<EncounterMdyEditorHandle>();
    render(
      <EncounterMdyEditor
        ref={ref}
        body="# Original"
        onChange={vi.fn()}
        onFieldActivate={vi.fn()}
      />
    );
    await screen.findByRole('alert');
    await expect(ref.current!.getContent()).rejects.toBe(mock.failure);
    expect(mock.getContent).toHaveBeenCalledOnce();
  });

  it('allows eSheet and View after an initial failure while retaining recorded answers and codes', async () => {
    const definition: EncounterVisitDefinition = {
      id: 'initial-editor-failure',
      title: 'Anonymous visit',
      sections: [
        { id: 'hpi', title: 'HPI', kind: 'narrative' },
        { id: 'vitals', title: 'Vitals', kind: 'vitals' },
      ],
    };
    const original = {
      [getEncounterFieldId('hpi')]: { answer: 'Recorded back pain.' },
      [getEncounterFieldId('vitals', 'value')]: {
        answer: JSON.stringify({
          readings: [{ id: 'bp', systolic: 140, diastolic: 90 }],
        }),
      },
    };
    const ref = React.createRef<EncounterVisitHandle>();
    render(
      <EncounterVisit
        ref={ref}
        definition={definition}
        initialResponses={original}
        defaultMode="rich"
      />
    );
    await screen.findByRole('alert');
    fireEvent.click(screen.getByRole('combobox', { name: 'Visit mode' }));
    fireEvent.click(screen.getByRole('option', { name: 'View' }));
    await waitFor(() =>
      expect(
        screen.getByRole('region', { name: 'Visit note preview' })
      ).toHaveTextContent('140/90')
    );
    expect(
      screen.getByRole('region', { name: 'Visit note preview' })
    ).toHaveTextContent('Recorded back pain.');
    fireEvent.click(screen.getByRole('combobox', { name: 'Visit mode' }));
    fireEvent.click(screen.getByRole('option', { name: 'eSheet' }));
    await waitFor(() =>
      expect(screen.getByRole('textbox', { name: 'HPI' })).toHaveTextContent(
        'Recorded back pain.'
      )
    );
    const snapshot = ref.current!.getSnapshot();
    expect(snapshot.responses).toMatchObject(original);
    expect(
      snapshot.observations
        .find((observation) => observation.code?.code === '85354-9')
        ?.components?.map((component) => component.code?.code)
    ).toEqual(['8480-6', '8462-4']);
    expect(mock.getContent).not.toHaveBeenCalled();
  });
});
