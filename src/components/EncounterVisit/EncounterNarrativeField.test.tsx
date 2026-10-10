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
import { renderWithTheme } from '../../test/test-utils';
import {
  EncounterNarrativeField,
  encounterNarrativeText,
  sanitizeEncounterNarrativeHtml,
} from './EncounterNarrativeField';

function props(
  overrides: Partial<FieldComponentProps> = {}
): FieldComponentProps {
  return {
    field: {
      definition: {
        id: 'narrative',
        fieldType: 'encounterNarrative',
        question: 'History of present illness',
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

function edit(html: string) {
  fireEvent.input(screen.getByRole('textbox'), { target: { innerHTML: html } });
}

describe('EncounterNarrativeField', () => {
  it('renders plain answers as text and retains their line breaks without interpreting markup', () => {
    renderWithTheme(
      <EncounterNarrativeField
        {...props({ response: { answer: 'Back pain\n<unknown> & improving' } })}
      />
    );
    const editor = screen.getByRole('textbox', {
      name: 'History of present illness',
    });
    expect(editor).toHaveAttribute('contenteditable', 'true');
    expect(editor.innerHTML).toBe(
      'Back pain<br>&lt;unknown&gt; &amp; improving'
    );
    expect(editor.querySelector('unknown')).toBeNull();
    expect(editor).toHaveAttribute('aria-readonly', 'false');
    expect(editor).toHaveAttribute('dir', 'auto');
  });

  it('keeps a native plain answer and optional rich formatting while preserving host metadata', () => {
    const onResponse = vi.fn();
    function Harness() {
      const [response, setResponse] = React.useState<FieldResponse>({
        answer: 'Back pain',
        attributes: { hostAttribute: 'retain' },
        _ai: true,
      });
      return (
        <EncounterNarrativeField
          {...props()}
          response={response}
          onResponse={(next) => {
            onResponse(next);
            setResponse(next);
          }}
        />
      );
    }
    renderWithTheme(<Harness />);
    edit('<p><b>Back pain</b></p><p>Worse with movement</p>');
    expect(onResponse).toHaveBeenLastCalledWith({
      answer: 'Back pain\nWorse with movement',
      _ai: false,
      attributes: {
        hostAttribute: 'retain',
        encounterNarrativeText: 'Back pain\nWorse with movement',
        encounterNarrativeHtml:
          '<p><b>Back pain</b></p><p>Worse with movement</p>',
      },
    });
    expect(screen.getByRole('textbox').querySelector('b')).toHaveTextContent(
      'Back pain'
    );
  });

  it('restores formatting only when it agrees with the current native answer', () => {
    const attributes = {
      encounterNarrativeText: 'Back pain',
      encounterNarrativeHtml: '<b>Back pain</b>',
    };
    const { rerender } = renderWithTheme(
      <EncounterNarrativeField
        {...props({ response: { answer: 'Back pain', attributes } })}
      />
    );
    expect(screen.getByRole('textbox').innerHTML).toBe('<b>Back pain</b>');
    rerender(
      <EncounterNarrativeField
        {...props({
          response: { answer: 'Updated by MCP', attributes, _ai: true },
        })}
      />
    );
    expect(screen.getByRole('textbox').innerHTML).toBe('Updated by MCP');
    rerender(
      <EncounterNarrativeField
        {...props({
          response: {
            answer: 'Back pain',
            attributes: {
              ...attributes,
              encounterNarrativeHtml: '<b>Wrong text</b>',
            },
          },
        })}
      />
    );
    expect(screen.getByRole('textbox').innerHTML).toBe('Back pain');
  });

  it('strips imported styles, host classes, links, media and scripts before restoring formatting', () => {
    const response: FieldResponse = {
      answer: 'Back pain',
      attributes: {
        encounterNarrativeText: 'Back pain',
        encounterNarrativeHtml:
          '<p class="overlay" style="position:fixed" onclick="alert(1)"><a href="javascript:alert(1)"><b>Back pain</b></a><img src="x" onerror="alert(1)"></p><script>alert(1)</script>',
      },
    };
    renderWithTheme(<EncounterNarrativeField {...props({ response })} />);
    expect(screen.getByRole('textbox').innerHTML).toBe(
      '<p><b>Back pain</b></p>'
    );
  });

  it('keeps paragraphs, blank lines and lists readable in plain observation/note text', () => {
    expect(
      encounterNarrativeText(
        'Symptoms:<div><b>Back pain</b></div><div><br></div><ol><li>Worse with movement</li><li>No trauma</li></ol><ul><li>Additional detail</li></ul>'
      )
    ).toBe(
      'Symptoms:\nBack pain\n\n1. Worse with movement\n2. No trauma\n• Additional detail'
    );
  });

  it.each([{ isPreview: false }, { isEnabled: false }, { isReadOnly: true }])(
    'honors the native eSheet editing state %j',
    (state) => {
      const fieldProps = props({
        ...state,
        response: { answer: 'Recorded history' },
      });
      renderWithTheme(<EncounterNarrativeField {...fieldProps} />);
      expect(screen.getByRole('textbox')).toHaveAttribute(
        'contenteditable',
        'false'
      );
      expect(screen.getByRole('textbox')).toHaveAttribute(
        'aria-readonly',
        'true'
      );
      edit('Unexpected write');
      expect(fieldProps.onResponse).not.toHaveBeenCalled();
    }
  );

  it('retains an accessible label when the report heading supplies the visible narrative title', () => {
    const fieldProps = props({ isRequired: true });
    fieldProps.field = {
      ...fieldProps.field,
      definition: {
        ...fieldProps.field.definition,
        _sourceData: { encounterHideLabel: true },
      } as unknown as FieldDefinition,
    };
    renderWithTheme(<EncounterNarrativeField {...fieldProps} />);
    const editor = screen.getByRole('textbox', {
      name: 'History of present illness *',
    });
    expect(editor).toHaveAttribute('aria-required', 'true');
    expect(
      document.getElementById(editor.getAttribute('aria-labelledby')!)
    ).toHaveClass('sr-only');
  });

  it('limits rich formatting to lightweight narrative markup', () => {
    expect(
      sanitizeEncounterNarrativeHtml(
        '<p style="text-align:center"><i>Text</i><span> detail</span></p>'
      )
    ).toBe('<p><i>Text</i> detail</p>');
  });
});
