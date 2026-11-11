import * as React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  createFormStore,
  createUIStore,
  type FieldComponentProps,
  type FieldDefinition,
  type FieldResponse,
} from '@esheet/core';
import { renderWithTheme } from '../test/test-utils';
import { EsheetNarrativeField } from './EsheetNarrativeField';
import { getNarrativeFindings } from './narrativeFindings';

// ProseMirror resists jsdom simulation; field logic runs on the legacy
// engine, which shares the TextAreaRichProps contract (see the stub).
vi.mock(
  '../components/TextAreaRich/TextAreaRichKerebron',
  () => import('../test/textAreaRichKerebronStub')
);

const finding = {
  id: 'no-fever',
  label: 'No fever',
  text: 'No fever reported.',
};

function props(
  overrides: Partial<FieldComponentProps> = {}
): FieldComponentProps {
  return {
    field: {
      definition: {
        id: 'narrative',
        fieldType: 'narrative',
        question: 'Summary',
        _sourceData: { narrativeFindings: [finding] },
      } as unknown as FieldDefinition,
      parentId: null,
      childIds: [],
      index: 0,
    },
    form: createFormStore(),
    ui: createUIStore(),
    isPreview: true,
    isEnabled: true,
    isReadOnly: false,
    isSelected: false,
    isRequired: false,
    isSoftRequired: false,
    response: undefined,
    onRemove: vi.fn(),
    onUpdate: vi.fn(),
    onResponse: vi.fn(),
    ...overrides,
  };
}

describe('EsheetNarrativeField', () => {
  it('publishes under the generic narrative* attribute namespace', () => {
    const onResponse = vi.fn();
    renderWithTheme(<EsheetNarrativeField {...props({ onResponse })} />);
    fireEvent.input(screen.getByRole('textbox', { name: 'Summary' }), {
      target: { innerHTML: '<p><b>Stable</b></p>' },
    });
    expect(onResponse).toHaveBeenLastCalledWith(
      expect.objectContaining({
        answer: 'Stable',
        attributes: expect.objectContaining({
          narrativeHtml: '<p><b>Stable</b></p>',
          narrativeText: 'Stable',
        }),
      })
    );
  });

  it('reads findings from the generic source key and records picks as provenance', () => {
    let latest: FieldResponse | undefined;
    function Harness() {
      const [response, setResponse] = React.useState<FieldResponse>();
      latest = response;
      return (
        <EsheetNarrativeField
          {...props()}
          response={response}
          onResponse={setResponse}
        />
      );
    }
    renderWithTheme(<Harness />);
    fireEvent.focus(screen.getByRole('textbox'));
    fireEvent.click(screen.getByRole('button', { name: /No fever/ }));
    expect(latest?.answer).toBe('No fever reported.');
    expect(latest?.attributes?.narrativeFindings).toBe(
      JSON.stringify([finding])
    );
    expect(getNarrativeFindings(latest)).toEqual([finding]);
  });
});
