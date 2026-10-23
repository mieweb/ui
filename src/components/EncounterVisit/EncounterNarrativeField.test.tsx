import * as React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
import { getEncounterNarrativeFindings } from './narrativeFindings';

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

const commonFindings = [
  {
    id: 'no-trauma',
    label: 'No trauma',
    text: 'No recent trauma.',
    code: {
      system: 'https://example.test/findings',
      code: 'no-trauma',
      display: 'No recent trauma',
    },
  },
  {
    id: 'movement',
    label: 'Worse with movement',
    text: 'Pain worsens with movement.',
  },
];

function findingProps(
  overrides: Partial<FieldComponentProps> = {}
): FieldComponentProps {
  const fieldProps = props(overrides);
  return {
    ...fieldProps,
    field: {
      ...fieldProps.field,
      definition: {
        ...fieldProps.field.definition,
        _sourceData: { encounterFindings: commonFindings },
      } as unknown as FieldDefinition,
    },
  };
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

  it('offers findings immediately without capturing any suggestion before an explicit selection', () => {
    const fieldProps = findingProps();
    renderWithTheme(<EncounterNarrativeField {...fieldProps} />);
    expect(screen.getByRole('textbox')).toHaveTextContent('');
    expect(fieldProps.onResponse).not.toHaveBeenCalled();
    expect(
      screen.getByText('Common findings').closest('details')
    ).toHaveAttribute('open');
    expect(screen.getByRole('button', { name: 'Add No trauma' })).toBeEnabled();
    expect(
      screen.getByRole('group', {
        name: 'History of present illness common findings',
      })
    ).toBeInTheDocument();
  });

  it('keeps editor focus during pointer selection so the focus-only toolbar cannot move the picker', async () => {
    const user = userEvent.setup();
    const fieldProps = findingProps({ response: { answer: 'Back pain' } });
    renderWithTheme(<EncounterNarrativeField {...fieldProps} />);
    const editor = screen.getByRole('textbox');
    const summary = screen.getByText('Common findings');
    const details = summary.closest('details')!;
    editor.focus();
    const mouseDown = new globalThis.MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true,
    });
    fireEvent(summary, mouseDown);
    expect(mouseDown.defaultPrevented).toBe(true);
    expect(details.open).toBe(true);
    expect(editor).toHaveFocus();
    await user.click(screen.getByRole('button', { name: 'Add No trauma' }));
    expect(editor).toHaveFocus();
    expect(fieldProps.onResponse).toHaveBeenLastCalledWith(
      expect.objectContaining({ answer: 'Back pain\nNo recent trauma.' })
    );
  });

  it('leaves keyboard events and normal focus outside the narrative unchanged', async () => {
    const user = userEvent.setup();
    const fieldProps = findingProps();
    renderWithTheme(<EncounterNarrativeField {...fieldProps} />);
    const summary = screen.getByText('Common findings');
    summary.focus();
    expect(summary).toHaveFocus();
    expect(fireEvent.mouseDown(summary)).toBe(true);
    expect(fireEvent.keyDown(summary, { key: 'Enter' })).toBe(true);
    expect(fireEvent.keyDown(summary, { key: ' ' })).toBe(true);
    // jsdom does not implement summary keyboard activation; native clicks
    // still collapse/reopen the disclosure, and button keyboard activation works.
    fireEvent.click(summary);
    expect(summary.closest('details')).not.toHaveAttribute('open');
    fireEvent.click(summary);
    expect(summary.closest('details')).toHaveAttribute('open');
    const button = screen.getByRole('button', { name: 'Add No trauma' });
    button.focus();
    expect(button).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(fieldProps.onResponse).toHaveBeenLastCalledWith(
      expect.objectContaining({ answer: 'No recent trauma.' })
    );
    expect(button).toHaveFocus();
  });

  it('appends multiple explicit findings without overwriting rich text or host metadata', () => {
    const onResponse = vi.fn();
    function Harness() {
      const [response, setResponse] = React.useState<FieldResponse>({
        answer: 'Back pain\nPatient reports discomfort.',
        _ai: true,
        attributes: {
          hostAttribute: 'retain',
          encounterNarrativeText: 'Back pain\nPatient reports discomfort.',
          encounterNarrativeHtml:
            '<p><b>Back pain</b></p><p>Patient reports discomfort.</p>',
        },
      });
      return (
        <EncounterNarrativeField
          {...findingProps()}
          response={response}
          onResponse={(next) => {
            onResponse(next);
            setResponse(next);
          }}
        />
      );
    }
    renderWithTheme(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'Add No trauma' }));
    expect(
      screen.getByRole('button', { name: 'Added No trauma' })
    ).toBeDisabled();
    fireEvent.click(
      screen.getByRole('button', { name: 'Add Worse with movement' })
    );
    const answer =
      'Back pain\nPatient reports discomfort.\nNo recent trauma.\nPain worsens with movement.';
    expect(onResponse).toHaveBeenLastCalledWith({
      answer,
      _ai: false,
      attributes: {
        hostAttribute: 'retain',
        encounterNarrativeText: answer,
        encounterNarrativeHtml:
          '<p><b>Back pain</b></p><p>Patient reports discomfort.</p><p>No recent trauma.</p><p>Pain worsens with movement.</p>',
        encounterNarrativeFindingsText: answer,
        encounterNarrativeFindings: JSON.stringify(commonFindings),
      },
    });
    expect(screen.getByRole('textbox').querySelector('b')).toHaveTextContent(
      'Back pain'
    );
    fireEvent.click(screen.getByRole('button', { name: 'Added No trauma' }));
    expect(onResponse).toHaveBeenCalledTimes(2);
  });

  it('deduplicates rapid picks even while the host has not refreshed response props', () => {
    const fieldProps = findingProps({ response: { answer: 'Back pain' } });
    renderWithTheme(<EncounterNarrativeField {...fieldProps} />);
    const button = screen.getByRole('button', { name: 'Add No trauma' });
    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(
      screen.getByRole('button', { name: 'Add Worse with movement' })
    );
    expect(fieldProps.onResponse).toHaveBeenCalledTimes(2);
    expect(fieldProps.onResponse).toHaveBeenLastCalledWith(
      expect.objectContaining({
        answer: 'Back pain\nNo recent trauma.\nPain worsens with movement.',
      })
    );
  });

  it('codes an explicitly selected existing complete line without duplicating it', () => {
    const fieldProps = findingProps({
      response: { answer: 'Back pain\nNo recent trauma.' },
    });
    renderWithTheme(<EncounterNarrativeField {...fieldProps} />);
    fireEvent.click(screen.getByRole('button', { name: 'Add No trauma' }));
    const next = vi.mocked(fieldProps.onResponse).mock.calls[0][0];
    expect(next.answer).toBe('Back pain\nNo recent trauma.');
    expect(getEncounterNarrativeFindings(next)).toEqual([commonFindings[0]]);
    expect(getEncounterNarrativeFindings(fieldProps.response)).toEqual([]);
  });

  it('does not treat a finding phrase inside other prose as a captured complete finding', () => {
    const fieldProps = findingProps({
      response: { answer: 'Discussed whether there was No recent trauma.' },
    });
    renderWithTheme(<EncounterNarrativeField {...fieldProps} />);
    fireEvent.click(screen.getByRole('button', { name: 'Add No trauma' }));
    expect(fieldProps.onResponse).toHaveBeenLastCalledWith(
      expect.objectContaining({
        answer:
          'Discussed whether there was No recent trauma.\nNo recent trauma.',
      })
    );
  });

  it('retains codes for unchanged selected lines and removes codes when those lines are edited away', () => {
    const onResponse = vi.fn();
    function Harness() {
      const [response, setResponse] = React.useState<FieldResponse>();
      return (
        <EncounterNarrativeField
          {...findingProps()}
          response={response}
          onResponse={(next) => {
            onResponse(next);
            setResponse(next);
          }}
        />
      );
    }
    renderWithTheme(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'Add No trauma' }));
    edit('<p><b>No recent trauma.</b></p><p>More history.</p>');
    let next = onResponse.mock.calls.at(-1)![0];
    expect(getEncounterNarrativeFindings(next)).toEqual([commonFindings[0]]);
    edit('<p>Recent trauma.</p><p>More history.</p>');
    next = onResponse.mock.calls.at(-1)![0];
    expect(getEncounterNarrativeFindings(next)).toEqual([]);
    expect(next.attributes.encounterNarrativeFindings).toBe('[]');
    expect(screen.getByRole('button', { name: 'Add No trauma' })).toBeEnabled();
  });

  it('refreshes the current response and discards stale chosen-finding provenance after external edits', () => {
    const original = {
      answer: 'No recent trauma.',
      attributes: {
        encounterNarrativeFindings: JSON.stringify([commonFindings[0]]),
        encounterNarrativeFindingsText: 'No recent trauma.',
        encounterNarrativeText: 'No recent trauma.',
        encounterNarrativeHtml: '<p><b>No recent trauma.</b></p>',
      },
    };
    const fieldProps = findingProps({ response: original });
    const { rerender } = renderWithTheme(
      <EncounterNarrativeField {...fieldProps} />
    );
    expect(
      screen.getByRole('button', { name: 'Added No trauma' })
    ).toBeDisabled();
    rerender(
      <EncounterNarrativeField
        {...fieldProps}
        response={{ ...original, answer: 'Updated by host.' }}
      />
    );
    expect(screen.getByRole('textbox')).toHaveTextContent('Updated by host.');
    fireEvent.click(screen.getByRole('button', { name: 'Add No trauma' }));
    expect(fieldProps.onResponse).toHaveBeenLastCalledWith(
      expect.objectContaining({
        answer: 'Updated by host.\nNo recent trauma.',
        attributes: expect.objectContaining({
          encounterNarrativeFindings: JSON.stringify([commonFindings[0]]),
          encounterNarrativeHtml: 'Updated by host.<p>No recent trauma.</p>',
        }),
      })
    );
  });

  it.each([{ isPreview: false }, { isEnabled: false }, { isReadOnly: true }])(
    'does not offer findings while the native editing state is %j',
    (state) => {
      const fieldProps = findingProps(state);
      renderWithTheme(<EncounterNarrativeField {...fieldProps} />);
      expect(screen.queryByText('Common findings')).not.toBeInTheDocument();
      expect(fieldProps.onResponse).not.toHaveBeenCalled();
    }
  );

  it('removes the picker when a save freezes the current editing state', () => {
    const fieldProps = findingProps();
    const { rerender } = renderWithTheme(
      <EncounterNarrativeField {...fieldProps} />
    );
    rerender(<EncounterNarrativeField {...fieldProps} isReadOnly />);
    expect(screen.queryByText('Common findings')).not.toBeInTheDocument();
    expect(fieldProps.onResponse).not.toHaveBeenCalled();
  });

  it('escapes configured finding text and ignores malformed or duplicate suggestions', () => {
    const fieldProps = findingProps();
    fieldProps.field = {
      ...fieldProps.field,
      definition: {
        ...fieldProps.field.definition,
        _sourceData: {
          encounterFindings: [
            {
              id: 'literal',
              label: 'Literal text',
              text: '<script>alert(1)</script> & <b>finding</b>',
            },
            { id: 'literal', label: 'Duplicate', text: 'Duplicate.' },
            { id: 'blank', label: 'Blank', text: '  ' },
            { id: 'missing', text: 'Missing label.' },
          ],
        },
      } as unknown as FieldDefinition,
    };
    renderWithTheme(<EncounterNarrativeField {...fieldProps} />);
    expect(screen.queryByRole('button', { name: 'Add Duplicate' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Add Blank' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Add Literal text' }));
    const next = vi.mocked(fieldProps.onResponse).mock.calls[0][0];
    expect(next.answer).toBe('<script>alert(1)</script> & <b>finding</b>');
    expect(next.attributes?.encounterNarrativeHtml).toBe(
      '<p>&lt;script&gt;alert(1)&lt;/script&gt; &amp; &lt;b&gt;finding&lt;/b&gt;</p>'
    );
  });
});
