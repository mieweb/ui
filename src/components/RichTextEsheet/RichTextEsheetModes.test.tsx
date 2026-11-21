import * as React from 'react';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Document } from 'yaml';
import { Modal } from '../Modal/Modal';
import { RichTextEsheet, type RichTextEsheetHandle } from './RichTextEsheet';
import type { FormDefinition } from '@esheet/core';
import {
  getRichTextEsheetFieldId,
  getRichTextEsheetSectionFieldId,
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
        mediaUpload,
      }: {
        body: string;
        fieldIds: string[];
        onChange: (body: string) => void;
        onFieldActivate: (id: string) => void;
        disabled: boolean;
        mediaUpload?: { uploadHandler?: unknown };
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
          <span data-testid="editor-media-upload">
            {typeof mediaUpload?.uploadHandler === 'function'
              ? 'host'
              : 'default'}
          </span>
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

const form = {
  id: 'mode-doc',
  title: 'Support ticket',
  pages: [
    {
      id: 'mode-doc:document',
      title: 'Support ticket',
      fields: [
        {
          id: 'richtext:summary:section',
          fieldType: 'section',
          title: 'Summary',
          sectionCollapse: 'expanded',
          width: 'full',
          fields: [
            {
              id: 'richtext:summary:value',
              fieldType: 'esheetNarrative',
              question: 'Summary',
              width: 'full',
              _sourceData: {
                narrativeHideLabel: true,
                narrativeFindings: [],
              },
            },
          ],
        },
        {
          id: 'richtext:details:section',
          fieldType: 'section',
          title: 'Details',
          sectionCollapse: 'expanded',
          width: 'full',
          fields: [
            {
              id: 'richtext:details:value',
              fieldType: 'esheetNarrative',
              question: 'Details',
              width: 'full',
              _sourceData: {
                narrativeHideLabel: true,
                narrativeFindings: [],
              },
            },
          ],
        },
      ],
    },
  ],
} as unknown as FormDefinition;

const addendumForm = {
  id: 'mode-doc',
  title: 'Support ticket',
  pages: [
    {
      id: 'mode-doc:document',
      title: 'Support ticket',
      fields: [
        {
          id: 'richtext:summary:section',
          fieldType: 'section',
          title: 'Summary',
          sectionCollapse: 'expanded',
          width: 'full',
          fields: [
            {
              id: 'richtext:summary:value',
              fieldType: 'esheetNarrative',
              question: 'Summary',
              width: 'full',
              _sourceData: {
                narrativeHideLabel: true,
                narrativeFindings: [],
              },
            },
          ],
        },
        {
          id: 'richtext:details:section',
          fieldType: 'section',
          title: 'Details',
          sectionCollapse: 'expanded',
          width: 'full',
          fields: [
            {
              id: 'richtext:details:value',
              fieldType: 'esheetNarrative',
              question: 'Details',
              width: 'full',
              _sourceData: {
                narrativeHideLabel: true,
                narrativeFindings: [],
              },
            },
          ],
        },
        {
          id: 'richtext:addendum:section',
          fieldType: 'section',
          title: 'Addendum',
          sectionCollapse: 'expanded',
          width: 'full',
          fields: [
            {
              id: 'richtext:addendum:value',
              fieldType: 'esheetNarrative',
              question: 'Addendum',
              width: 'full',
              _sourceData: {
                narrativeHideLabel: true,
                narrativeFindings: [],
              },
            },
          ],
        },
      ],
    },
  ],
} as unknown as FormDefinition;

const modeSwitch = () =>
  screen.getByRole('combobox', { name: 'Document mode' });
const selectMode = (label: 'eSheet' | 'RichEdit' | 'View' | 'Export') => {
  fireEvent.click(modeSwitch());
  fireEvent.click(screen.getByRole('option', { name: label }));
};

describe('RichTextEsheet mode synchronization', () => {
  // Page-level dialogs tests mount outside the component tree. Removed in
  // afterEach so even a timed-out test cannot leak one into later tests'
  // dialog queries.
  const pageDialogs: HTMLElement[] = [];
  afterEach(() => {
    for (const dialog of pageDialogs.splice(0)) dialog.remove();
  });

  it('opens a native eSheet MDY from its own form and validates a supplied form', () => {
    const original = parseRichTextEsheetMdy(
      createRichTextEsheetSnapshot(form, {}).mdy
    );
    const yaml = new Document(original.frontMatter);
    const source = `---\n${yaml.toString()}---\n${original.body}`;
    expect(() => render(<RichTextEsheet initialMdy={source} />)).not.toThrow();
    const formless = new Document(original.frontMatter);
    formless.delete('form');
    expect(() =>
      render(
        <RichTextEsheet
          initialMdy={`---\n${formless.toString()}---\n${original.body}`}
        />
      )
    ).toThrow('Unable to load document MDY');
    // A native eSheet MDY names its form; foreign responses must not seed a
    // session under another document's form.
    expect(() =>
      render(
        <RichTextEsheet
          initialMdy={source}
          form={{ ...form, id: 'another-doc' }}
        />
      )
    ).toThrow('The MDY form id does not match');
  });

  it('regenerates the RichEdit fallback body after a configuration change', async () => {
    const ref = React.createRef<RichTextEsheetHandle>();
    const { rerender } = render(<RichTextEsheet ref={ref} form={form} />);
    const summary = await screen.findByRole('textbox', { name: /Summary/ });
    fireEvent.input(summary, { target: { innerHTML: 'Login fails' } });
    rerender(<RichTextEsheet ref={ref} form={addendumForm} />);
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

  it('forwards the host upload pipeline to the rich editor', async () => {
    render(
      <RichTextEsheet
        form={form}
        mediaCapture={{ uploadHandler: async () => 'https://cdn/img.png' }}
      />
    );
    await screen.findByRole('textbox', { name: /Summary/ });
    selectMode('RichEdit');
    // Pasted or dropped media must flow through the host's uploadHandler and
    // limits, never RichEditor's base64/object-URL defaults.
    await waitFor(() =>
      expect(screen.getByTestId('editor-media-upload')).toHaveTextContent(
        'host'
      )
    );
  });

  it('keeps the draft editable after a rejected save', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('Storage offline'));
    render(<RichTextEsheet form={form} onSubmit={onSubmit} />);
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
    render(<RichTextEsheet form={form} />);
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
    pageDialogs.push(modal);
    document.body.appendChild(modal);
    act(() => confirm.focus());
    expect(document.activeElement).toBe(confirm);
  });

  it('ignores Escape in the resolver while a capture confirmation is open', async () => {
    const { container } = render(<RichTextEsheet form={form} />);
    await screen.findByRole('textbox', { name: /Summary/ });
    selectMode('RichEdit');
    fireEvent.click(
      await screen.findByRole('button', { name: 'Edit linked section' })
    );
    await screen.findByRole('dialog', { name: 'Details' });
    // AlertDialog ignores Escape by design, so the key falls through to the
    // resolver's document listener. Closing the resolver underneath would
    // desync Modal's scroll lock and leave the page unscrollable. The
    // confirmation renders inline inside the component root.
    const modal = document.createElement('div');
    modal.setAttribute('role', 'alertdialog');
    container.firstElementChild!.appendChild(modal);
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
    const { container } = render(<RichTextEsheet form={form} />);
    await screen.findByRole('textbox', { name: /Summary/ });
    selectMode('RichEdit');
    fireEvent.click(
      await screen.findByRole('button', { name: 'Edit linked section' })
    );
    await screen.findByRole('dialog', { name: 'Details' });
    // The annotate-image Modal is a plain role="dialog" rendered inline
    // inside the component root but outside the trap, refusing dismissal
    // while its upload is saving — Escape falls through to the resolver's
    // document listener, and the trap's focusin listener sees focus outside
    // the resolver.
    const modal = document.createElement('div');
    modal.setAttribute('role', 'dialog');
    const save = document.createElement('button');
    save.textContent = 'Save annotation';
    modal.appendChild(save);
    container.firstElementChild!.appendChild(modal);
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

  it('ignores Escape from an annotation dialog nested inside the resolver', async () => {
    render(<RichTextEsheet form={form} />);
    await screen.findByRole('textbox', { name: /Summary/ });
    selectMode('RichEdit');
    fireEvent.click(
      await screen.findByRole('button', { name: 'Edit linked section' })
    );
    const resolver = await screen.findByRole('dialog', { name: 'Details' });
    // Modal renders inline (no portal): annotating a capture taken inside
    // the resolver mounts its dialog as a descendant of the trap.
    const modal = document.createElement('div');
    modal.setAttribute('role', 'dialog');
    resolver.appendChild(modal);
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

  it('closes the resolver with Escape despite an unrelated page dialog', async () => {
    render(<RichTextEsheet form={form} />);
    await screen.findByRole('textbox', { name: /Summary/ });
    selectMode('RichEdit');
    fireEvent.click(
      await screen.findByRole('button', { name: 'Edit linked section' })
    );
    await screen.findByRole('dialog', { name: 'Details' });
    // A non-modal page-level dialog (e.g. a cookie-consent banner) is not
    // nested in this component and must not swallow the resolver's Escape.
    // Cleanup lives in an afterEach: a runner timeout abandons this test
    // body mid-await, so inline cleanup (even in a finally) is not
    // guaranteed to run before later tests query dialogs (CI cascade on
    // the v0.12.0 release PR).
    const banner = document.createElement('div');
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Cookie consent');
    pageDialogs.push(banner);
    document.body.appendChild(banner);
    fireEvent.keyDown(document, { key: 'Escape' });
    // Generous timeout: this close has timed out at waitFor's default on
    // slow CI runners. The test timeout budgets for the setup above plus
    // this wait — vitest's 5s default could expire before the wait does.
    await waitFor(
      () =>
        expect(
          screen.queryByRole('dialog', { name: 'Details' })
        ).not.toBeInTheDocument(),
      { timeout: 5000 }
    );
  }, 15000);

  it('closes the resolver with Escape inside an enclosing host dialog', async () => {
    // Hosts may embed the whole component in their own modal; an ancestor
    // dialog is not a nested one and must not swallow the resolver's Escape.
    render(
      <div role="dialog" aria-label="Host modal">
        <RichTextEsheet form={form} />
      </div>
    );
    await screen.findByRole('textbox', { name: /Summary/ });
    selectMode('RichEdit');
    fireEvent.click(
      await screen.findByRole('button', { name: 'Edit linked section' })
    );
    await screen.findByRole('dialog', { name: 'Details' });
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: 'Details' })
      ).not.toBeInTheDocument()
    );
  });

  it('dismisses one overlay layer per Escape inside a library Modal host', async () => {
    // Modal and the resolver both listen for Escape on document; exclusive
    // ownership makes only the topmost layer act per keypress — the host
    // must not close together with the resolver.
    const onOpenChange = vi.fn();
    render(
      <Modal open onOpenChange={onOpenChange} aria-label="Host modal">
        <RichTextEsheet form={form} />
      </Modal>
    );
    await screen.findByRole('textbox', { name: /Summary/ });
    selectMode('RichEdit');
    fireEvent.click(
      await screen.findByRole('button', { name: 'Edit linked section' })
    );
    await screen.findByRole('dialog', { name: 'Details' });
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: 'Details' })
      ).not.toBeInTheDocument()
    );
    expect(onOpenChange).not.toHaveBeenCalled();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('does not reload the rich editor for answer-only eSheet edits', async () => {
    render(<RichTextEsheet form={form} />);
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
    const authored = createRichTextEsheetSnapshot(form, {
      [getRichTextEsheetFieldId('details')]: { answer: 'Old details answer' },
    }).mdy;
    render(
      <RichTextEsheet
        initialMdy={authored}
        form={{
          ...form,
          pages: [
            { ...form.pages[0], fields: form.pages[0].fields!.slice(0, 1) },
          ],
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
    render(<RichTextEsheet ref={ref} form={form} onSubmit={onSubmit} />);
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
    render(<RichTextEsheet ref={ref} form={form} />);
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
      <RichTextEsheet ref={ref} form={form} defaultMode="rich" />
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
    render(<RichTextEsheet ref={ref} form={form} />);
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
    const original = createRichTextEsheetSnapshot(form, {
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
