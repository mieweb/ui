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
import { RichTextEsheet, type RichTextEsheetHandle } from './RichTextEsheet';
import {
  getRichTextEsheetFieldId,
  getRichTextEsheetSectionFieldId,
  type RichTextEsheetDefinition,
} from './definition';
import {
  parseRichTextEsheetMdy,
  RICHTEXT_ESHEET_DOCUMENT_FIELD_ID,
} from './mdy';
import { createRichTextEsheetSnapshot } from './model';

// ProseMirror resists jsdom simulation; narrative fields run on the legacy
// engine, which shares the TextAreaRichProps contract (see the stub).
vi.mock(
  '../../components/TextAreaRich/TextAreaRichKerebron',
  () => import('../../test/textAreaRichKerebronStub')
);

// Browser tests exercise Kerebron itself. This stand-in can delay its change
// callback, verifying that mode switches and Save flush the editor handle.
vi.mock('./DocumentMdyEditor', async () => {
  const React = await import('react');
  return {
    DocumentMdyEditor: React.forwardRef(function Editor(
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
            aria-label="Document narrative"
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
            Edit linked section
          </button>
        </>
      );
    }),
  };
});

const definition: RichTextEsheetDefinition = {
  id: 'mode-doc',
  title: 'Support ticket',
  sections: [
    { id: 'summary', title: 'Summary' },
    { id: 'details', title: 'Details' },
  ],
};

const modeSwitch = () =>
  screen.getByRole('combobox', { name: 'Document mode' });
const selectMode = (label: 'eSheet' | 'RichEdit' | 'View' | 'Export') => {
  fireEvent.click(modeSwitch());
  fireEvent.click(screen.getByRole('option', { name: label }));
};

describe('RichTextEsheet mode synchronization', () => {
  it('requires a definition and a matching document id before opening an MDY', () => {
    const original = parseRichTextEsheetMdy(
      createRichTextEsheetSnapshot(definition, {}).mdy
    );
    const yaml = new Document(original.frontMatter);
    yaml.delete('richTextEsheet');
    const source = `---\n${yaml.toString()}---\n${original.body}`;
    expect(() => render(<RichTextEsheet initialMdy={source} />)).toThrow(
      'Supply a definition'
    );
    expect(() =>
      render(
        <RichTextEsheet
          initialMdy={createRichTextEsheetSnapshot(definition, {}).mdy}
          definition={{ ...definition, id: 'another-doc' }}
        />
      )
    ).toThrow('The MDY document id does not match');
    // A native eSheet MDY without richTextEsheet front matter still names its
    // form; foreign responses must not seed another definition's session.
    expect(() =>
      render(
        <RichTextEsheet
          initialMdy={source}
          definition={{ ...definition, id: 'another-doc' }}
        />
      )
    ).toThrow('The MDY form id does not match');
  });

  it('regenerates the RichEdit fallback body after a configuration change', async () => {
    const ref = React.createRef<RichTextEsheetHandle>();
    const { rerender } = render(
      <RichTextEsheet ref={ref} definition={definition} />
    );
    const summary = await screen.findByRole('textbox', { name: /Summary/ });
    fireEvent.input(summary, { target: { innerHTML: 'Login fails' } });
    rerender(
      <RichTextEsheet
        ref={ref}
        definition={{
          ...definition,
          sections: [
            ...definition.sections,
            { id: 'addendum', title: 'Addendum' },
          ],
        }}
      />
    );
    await screen.findByRole('textbox', { name: /Addendum/ });
    selectMode('RichEdit');
    const editor = await screen.findByRole('textbox', {
      name: 'Document narrative',
    });
    // A mount-time seed would miss the added section's link here…
    await waitFor(() =>
      expect((editor as HTMLTextAreaElement).value).toContain('## Addendum')
    );
    // …and leaving RichEdit would then commit that stale body.
    selectMode('eSheet');
    await waitFor(() =>
      expect(ref.current!.getSnapshot().mdy).toContain('## Addendum')
    );
    expect(ref.current!.getSnapshot().mdy).toContain('Login fails');
  });

  it('keeps the draft editable after a rejected save', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('Storage offline'));
    render(<RichTextEsheet definition={definition} onSubmit={onSubmit} />);
    const summary = await screen.findByRole('textbox', { name: /Summary/ });
    fireEvent.input(summary, { target: { innerHTML: 'Login fails' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save document' }));
    expect(await screen.findByText('Storage offline')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /Summary/ })).toHaveTextContent(
      'Login fails'
    );
    expect(screen.getByRole('button', { name: 'Save document' })).toBeEnabled();
  });

  it('keeps a portaled capture confirmation focusable inside the resolver trap', async () => {
    render(<RichTextEsheet definition={definition} />);
    await screen.findByRole('textbox', { name: /Summary/ });
    selectMode('RichEdit');
    fireEvent.click(
      await screen.findByRole('button', { name: 'Edit linked section' })
    );
    await screen.findByRole('dialog', { name: 'Details' });
    // The screen-capture confirmation portals to document.body as a modal
    // alertdialog (AlertDialog sets the role on its modal slot). The trap's
    // focusin listener must not yank focus off its buttons.
    const modal = document.createElement('div');
    modal.setAttribute('role', 'alertdialog');
    const confirm = document.createElement('button');
    confirm.textContent = 'Capture screen';
    modal.appendChild(confirm);
    document.body.appendChild(modal);
    act(() => confirm.focus());
    expect(document.activeElement).toBe(confirm);
    modal.remove();
  });

  it('ignores Escape in the resolver while a capture confirmation is open', async () => {
    render(<RichTextEsheet definition={definition} />);
    await screen.findByRole('textbox', { name: /Summary/ });
    selectMode('RichEdit');
    fireEvent.click(
      await screen.findByRole('button', { name: 'Edit linked section' })
    );
    await screen.findByRole('dialog', { name: 'Details' });
    // AlertDialog ignores Escape by design, so the key falls through to the
    // resolver's document listener. Closing the resolver underneath would
    // desync Modal's scroll lock and leave the page unscrollable.
    const modal = document.createElement('div');
    modal.setAttribute('role', 'alertdialog');
    document.body.appendChild(modal);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.getByRole('dialog', { name: 'Details' })).toBeInTheDocument();
    modal.remove();
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: 'Details' })
      ).not.toBeInTheDocument()
    );
  });

  it('ignores Escape and keeps focus while an annotation dialog is open', async () => {
    render(<RichTextEsheet definition={definition} />);
    await screen.findByRole('textbox', { name: /Summary/ });
    selectMode('RichEdit');
    fireEvent.click(
      await screen.findByRole('button', { name: 'Edit linked section' })
    );
    await screen.findByRole('dialog', { name: 'Details' });
    // The annotate-image Modal is a plain role="dialog" portaled to
    // document.body that refuses dismissal while its upload is saving —
    // Escape falls through to the resolver's document listener, and the
    // trap's focusin listener sees focus outside the resolver.
    const modal = document.createElement('div');
    modal.setAttribute('role', 'dialog');
    const save = document.createElement('button');
    save.textContent = 'Save annotation';
    modal.appendChild(save);
    document.body.appendChild(modal);
    act(() => save.focus());
    expect(document.activeElement).toBe(save);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.getByRole('dialog', { name: 'Details' })).toBeInTheDocument();
    modal.remove();
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: 'Details' })
      ).not.toBeInTheDocument()
    );
  });

  it('does not reload the rich editor for answer-only eSheet edits', async () => {
    render(<RichTextEsheet definition={definition} />);
    const summary = await screen.findByRole('textbox', { name: /Summary/ });
    fireEvent.input(summary, { target: { innerHTML: 'Login fails' } });
    selectMode('RichEdit');
    const editor = await screen.findByRole('textbox', {
      name: 'Document narrative',
    });
    // The skeleton body is keyed to the configuration: answer edits reach
    // the live editor through its fields projection refresh (not exercised
    // by this stub), never by regenerating the body — the always-mounted
    // editor would otherwise reload the whole document per keystroke.
    expect((editor as HTMLTextAreaElement).value).toContain('## Summary');
    expect((editor as HTMLTextAreaElement).value).not.toContain('Login fails');
    // Serialization refreshes projected displays, so no content is lost.
    selectMode('View');
    await waitFor(() =>
      expect(
        screen.getByRole('region', { name: 'Document preview' })
      ).toHaveTextContent('Login fails')
    );
  });

  it('keeps retired links protected instead of opening their resolver', async () => {
    // Author under the full definition, then reopen after `details` was
    // removed from a same-id configuration: the imported link is retired.
    const authored = createRichTextEsheetSnapshot(definition, {
      [getRichTextEsheetFieldId('details')]: { answer: 'Old details answer' },
    }).mdy;
    render(
      <RichTextEsheet
        initialMdy={authored}
        definition={{
          ...definition,
          sections: [{ id: 'summary', title: 'Summary' }],
        }}
      />
    );
    await screen.findByRole('textbox', { name: /Summary/ });
    selectMode('RichEdit');
    // The stub activates the LAST projected field id, which is the retired
    // `details` link appended after the active sections.
    fireEvent.click(
      await screen.findByRole('button', { name: 'Edit linked section' })
    );
    // Retired links have no section to resolve; nothing may open.
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('flushes the last rich edit before switching and saving, with section answers retained', async () => {
    const ref = React.createRef<RichTextEsheetHandle>();
    const onSubmit = vi.fn();
    render(
      <RichTextEsheet ref={ref} definition={definition} onSubmit={onSubmit} />
    );
    const summary = await screen.findByRole('textbox', { name: /Summary/ });
    fireEvent.input(summary, { target: { innerHTML: 'Login fails' } });
    selectMode('RichEdit');
    const editor = await screen.findByRole('textbox', {
      name: 'Document narrative',
    });
    const body = `${(editor as HTMLTextAreaElement).value}\n\n### Discussion\n\nFree text stays in the document.`;
    fireEvent.change(editor, { target: { value: body } });
    selectMode('View');
    await waitFor(() =>
      expect(
        screen.getByRole('region', { name: 'Document preview' })
      ).toHaveTextContent('Free text stays in the document.')
    );
    const snapshot = ref.current!.getSnapshot();
    expect(
      snapshot.responses[getRichTextEsheetFieldId('summary')]
    ).toBeDefined();
    expect(parseRichTextEsheetMdy(snapshot.mdy).body).toContain(
      '### Discussion'
    );
    selectMode('RichEdit');
    await waitFor(() => expect(modeSwitch()).toHaveTextContent('RichEdit'));
    fireEvent.change(editor, {
      target: { value: `${body}\n\nLast keystroke.` },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save document' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    expect(onSubmit.mock.calls[0][0].mdy).toContain('Last keystroke.');
  });

  it('shows the raw portable document with a download button in Export', async () => {
    const ref = React.createRef<RichTextEsheetHandle>();
    render(<RichTextEsheet ref={ref} definition={definition} />);
    const summary = await screen.findByRole('textbox', { name: /Summary/ });
    fireEvent.input(summary, { target: { innerHTML: 'Login fails' } });
    selectMode('Export');
    const exportRegion = await screen.findByRole('region', {
      name: 'Document export',
    });
    await waitFor(() => expect(exportRegion).toHaveTextContent('Login fails'));
    expect(exportRegion.querySelector('pre')?.textContent).toBe(
      ref.current!.getSnapshot().mdy
    );
    expect(
      screen.getByRole('button', { name: 'Download document' })
    ).toBeEnabled();
    selectMode('eSheet');
    expect(
      await screen.findByRole('textbox', { name: /Summary/ })
    ).toBeVisible();
  });

  it('flushes rich prose and focuses the requested section after the eSheet is visible', async () => {
    const ref = React.createRef<RichTextEsheetHandle>();
    const { container } = render(
      <RichTextEsheet ref={ref} definition={definition} defaultMode="rich" />
    );
    const editor = await screen.findByRole('textbox', {
      name: 'Document narrative',
    });
    const body = `${(editor as HTMLTextAreaElement).value}\n\nFinal unreported keystroke.`;
    fireEvent.change(editor, { target: { value: body } });
    const section = container.querySelector<HTMLElement>(
      `[data-field-id="${getRichTextEsheetSectionFieldId('details')}"]`
    )!;
    const focus = vi.spyOn(section, 'focus');
    focus.mockImplementation(() => {
      expect(section.closest('[hidden]')).toBeNull();
    });
    const scroll = vi.fn();
    section.scrollIntoView = scroll;
    act(() => {
      ref.current!.focusSection('details');
    });
    await waitFor(() => expect(focus).toHaveBeenCalledOnce());
    expect(scroll).toHaveBeenCalledWith({ block: 'start', behavior: 'auto' });
    expect(modeSwitch()).toHaveTextContent('eSheet');
    expect(ref.current!.getSnapshot().mdy).toContain(
      'Final unreported keystroke.'
    );
  });

  it('opens linked sections from the rich editor in a resolver dialog', async () => {
    const ref = React.createRef<RichTextEsheetHandle>();
    render(<RichTextEsheet ref={ref} definition={definition} />);
    await screen.findByRole('textbox', { name: /Summary/ });
    selectMode('RichEdit');
    fireEvent.click(
      await screen.findByRole('button', { name: 'Edit linked section' })
    );
    const dialog = await screen.findByRole('dialog', { name: 'Details' });
    const details = await screen.findByRole('textbox', { name: /Details/ });
    expect(dialog.contains(details)).toBe(true);
    fireEvent.input(details, {
      target: { innerHTML: 'Edited from the resolver.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(modeSwitch()).toHaveTextContent('RichEdit');
    expect(ref.current!.getSnapshot().mdy).toContain(
      'Edited from the resolver.'
    );
  });

  it('restores a portable document and allows read-only mode switching without changing answers', async () => {
    const original = createRichTextEsheetSnapshot(definition, {
      [getRichTextEsheetFieldId('summary')]: { answer: 'Login fails' },
      [RICHTEXT_ESHEET_DOCUMENT_FIELD_ID]: {
        answer: '# Final ticket\n\n### Follow-up\n\nFree report text.',
      },
    });
    const ref = React.createRef<RichTextEsheetHandle>();
    render(
      <RichTextEsheet
        ref={ref}
        initialMdy={original.mdy}
        defaultMode="view"
        readOnly
      />
    );
    await waitFor(() =>
      expect(
        screen.getByRole('region', { name: 'Document preview' })
      ).toHaveTextContent('Free report text.')
    );
    expect(modeSwitch()).toHaveTextContent('View');
    expect(screen.getByText('Read-only document')).toBeInTheDocument();
    selectMode('RichEdit');
    expect(
      await screen.findByRole('textbox', { name: 'Document narrative' })
    ).toHaveAttribute('readonly');
    selectMode('eSheet');
    await waitFor(() =>
      expect(
        screen.getByRole('textbox', { name: /Summary/ })
      ).toHaveTextContent('Login fails')
    );
    expect(
      ref.current!.getSnapshot().responses[getRichTextEsheetFieldId('summary')]
        .answer
    ).toBe('Login fails');
  });
});
