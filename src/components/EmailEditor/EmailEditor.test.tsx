import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen } from '@testing-library/react';

import { renderWithTheme } from '../../test/test-utils';
import { EmailEditor } from './EmailEditor';
import {
  createEmailBlock,
  type EmailContentTree,
  type EmailDesignSettings,
} from './types';

const heading = { ...createEmailBlock('heading'), text: 'Welcome' };
const text = createEmailBlock('text');
const initial: EmailContentTree = { version: '1.0', blocks: [heading, text] };

function Harness({
  onDesign,
  initialDesign,
  doc = initial,
}: {
  onDesign?: (d: EmailDesignSettings) => void;
  initialDesign?: EmailDesignSettings;
  doc?: EmailContentTree;
}) {
  const [value, setValue] = useState(doc);
  const [design, setDesign] = useState<EmailDesignSettings | undefined>(
    initialDesign
  );
  return (
    <>
      <EmailEditor
        value={value}
        onChange={setValue}
        design={design}
        onDesignChange={
          onDesign &&
          ((d) => {
            setDesign(d);
            onDesign(d);
          })
        }
      />
      <output data-testid="types">
        {value.blocks.map((b) => b.type).join(',')}
      </output>
    </>
  );
}

const types = () => screen.getByTestId('types').textContent;

describe('EmailEditor', () => {
  it('renders the document on the canvas', () => {
    renderWithTheme(<EmailEditor value={initial} onChange={vi.fn()} />);
    expect(
      screen.getByRole('heading', { name: 'Welcome' })
    ).toBeInTheDocument();
    expect(screen.getByText('Write your message here.')).toBeInTheDocument();
  });

  it('adds a block from the palette after the selection and selects it', () => {
    renderWithTheme(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'Select Heading' }));
    fireEvent.click(screen.getByRole('button', { name: 'Divider' }));
    expect(types()).toBe('heading,divider,text');
    expect(
      screen.getByRole('button', { name: 'Select Divider' })
    ).toHaveAttribute('aria-pressed', 'true');
  });

  it('inserts after the containing columns when the selection is nested', () => {
    const columns = createEmailBlock('columns');
    columns.columns[0].blocks.push({
      ...createEmailBlock('heading'),
      text: 'Nested',
    });
    const doc: EmailContentTree = {
      version: '1.0',
      blocks: [columns, createEmailBlock('text')],
    };
    renderWithTheme(<Harness doc={doc} />);
    fireEvent.click(screen.getByRole('button', { name: 'Select Heading' }));
    fireEvent.click(screen.getByRole('button', { name: 'Divider' }));
    expect(types()).toBe('columns,divider,text');
  });

  it('shows a placeholder for host-owned block types and keeps them deletable', () => {
    const signature = {
      id: 'sig1',
      type: 'signature',
      name: 'Dr. Example',
    } as unknown as EmailContentTree['blocks'][number];
    const doc: EmailContentTree = {
      version: '1.0',
      blocks: [signature, createEmailBlock('text')],
    };
    renderWithTheme(<Harness doc={doc} />);
    expect(
      screen.getByText(
        'Unsupported block (signature). It will not be included in the sent email.'
      )
    ).toBeInTheDocument();
    expect(types()).toBe('signature,text'); // preserved in the document
    fireEvent.click(screen.getByRole('button', { name: 'Select signature' }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Delete' })[0]);
    expect(types()).toBe('text');
  });

  it('edits the selected block from the settings panel', () => {
    renderWithTheme(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'Select Heading' }));
    fireEvent.change(screen.getByLabelText('Text'), {
      target: { value: 'Hello' },
    });
    expect(screen.getByRole('heading', { name: 'Hello' })).toBeInTheDocument();
  });

  it('moves, duplicates and deletes blocks, and undoes the last change', () => {
    renderWithTheme(<Harness />);
    const [firstDown] = screen.getAllByRole('button', { name: 'Move down' });
    fireEvent.click(firstDown);
    expect(types()).toBe('text,heading');
    fireEvent.click(screen.getAllByRole('button', { name: 'Duplicate' })[0]);
    expect(types()).toBe('text,text,heading');
    fireEvent.click(screen.getAllByRole('button', { name: 'Delete' })[2]);
    expect(types()).toBe('text,text');
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(types()).toBe('text,text,heading');
    fireEvent.click(screen.getByRole('button', { name: 'Redo' }));
    expect(types()).toBe('text,text');
  });

  it('announces moves to screen readers', async () => {
    renderWithTheme(<Harness />);
    fireEvent.click(screen.getAllByRole('button', { name: 'Move down' })[0]);
    expect(
      await screen.findByText('Heading moved to position 2.')
    ).toBeInTheDocument();
  });

  it('only offers the Design tab when design changes are handled', () => {
    const { unmount } = renderWithTheme(<Harness />);
    expect(
      screen.queryByRole('tab', { name: 'Design' })
    ).not.toBeInTheDocument();
    unmount();
    renderWithTheme(<Harness onDesign={vi.fn()} />);
    expect(screen.getByRole('tab', { name: 'Design' })).toBeInTheDocument();
  });

  it('undoes the first design edit when design was omitted', () => {
    const onDesign = vi.fn();
    renderWithTheme(<Harness onDesign={onDesign} initialDesign={undefined} />);
    fireEvent.click(screen.getByRole('tab', { name: 'Design' }));
    fireEvent.change(screen.getByLabelText('Content width (px)'), {
      target: { value: '700' },
    });
    expect(onDesign).toHaveBeenLastCalledWith({ contentWidth: 700 });
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(onDesign).toHaveBeenLastCalledWith({});
    expect(screen.getByLabelText('Content width (px)')).toHaveValue(600);
  });

  it('does not replay the document when undoing a design-only edit', () => {
    const onChange = vi.fn();
    function DesignHarness() {
      const [design, setDesign] = useState<EmailDesignSettings>({});
      return (
        <EmailEditor
          value={initial}
          onChange={onChange}
          design={design}
          onDesignChange={setDesign}
        />
      );
    }
    renderWithTheme(<DesignHarness />);
    fireEvent.click(screen.getByRole('tab', { name: 'Design' }));
    const width = () => screen.getByLabelText('Content width (px)');
    fireEvent.change(width(), { target: { value: '700' } });
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(width()).toHaveValue(600);
    fireEvent.click(screen.getByRole('button', { name: 'Redo' }));
    expect(width()).toHaveValue(700);
    // Replaying the document snapshot would fire a spurious onChange and could
    // overwrite document updates the host made after the design edit.
    expect(onChange).not.toHaveBeenCalled();
  });

  it('does not replay the design when undoing a document edit', () => {
    const onDesign = vi.fn();
    renderWithTheme(<Harness onDesign={onDesign} />);
    fireEvent.click(screen.getAllByRole('button', { name: 'Move down' })[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(types()).toBe('heading,text');
    expect(onDesign).not.toHaveBeenCalled();
  });

  it('applies a finished upload to the latest document', async () => {
    const image = { ...createEmailBlock('image'), alt: '' };
    let finish: (url: string) => void = () => {};
    const onUploadImage = () =>
      new Promise<string>((resolve) => {
        finish = resolve;
      });
    let latest: EmailContentTree = { version: '1.0', blocks: [image] };
    function UploadHarness() {
      const [value, setValue] = useState(latest);
      latest = value;
      return (
        <EmailEditor
          value={value}
          onChange={setValue}
          onUploadImage={onUploadImage}
        />
      );
    }
    const { container } = renderWithTheme(<UploadHarness />);
    fireEvent.click(screen.getByRole('button', { name: 'Select Image' }));
    const file = new File(['x'], 'a.png', { type: 'image/png' });
    fireEvent.change(container.querySelector('input[type=file]')!, {
      target: { files: [file] },
    });
    fireEvent.change(screen.getByLabelText('Alt text'), {
      target: { value: 'Logo' },
    });
    await act(async () => finish('https://cdn/a.png'));
    expect(latest.blocks[0]).toMatchObject({
      alt: 'Logo',
      src: 'https://cdn/a.png',
    });
  });

  it('reports a failed upload and keeps the existing image', async () => {
    const image = { ...createEmailBlock('image'), src: 'https://cdn/old.png' };
    const onChange = vi.fn();
    const { container } = renderWithTheme(
      <EmailEditor
        value={{ version: '1.0', blocks: [image] }}
        onChange={onChange}
        onUploadImage={() => Promise.reject(new Error('offline'))}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Select Image' }));
    await act(async () => {
      fireEvent.change(container.querySelector('input[type=file]')!, {
        target: { files: [new File(['x'], 'a.png', { type: 'image/png' })] },
      });
    });
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The image could not be uploaded'
    );
    expect(onChange).not.toHaveBeenCalled();
  });

  it('sanitises stored HTML before it reaches the text editor', () => {
    const unsafe = {
      ...createEmailBlock('text'),
      content:
        '<img src="x" onerror="alert(1)"><style>*{}</style><div style="position:fixed;inset:0">x</div><div class="fixed inset-0 z-50" id="app">y</div><p>ok</p>',
    };
    const { container } = renderWithTheme(
      <EmailEditor
        value={{ version: '1.0', blocks: [unsafe] }}
        onChange={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Select Text' }));
    const editor = screen.getByRole('textbox', { name: 'Content' });
    expect(editor.innerHTML).toContain('<p>ok</p>');
    expect(editor.innerHTML).not.toMatch(/onerror|<style|position|class=|id=/);
    // Canvas preview and editing surface alike.
    expect(container.querySelector('.fixed, #app')).toBeNull();
  });

  it('sanitises pasted HTML with the same policy as stored content', () => {
    const exec = vi.fn().mockReturnValue(true);
    document.execCommand = exec; // jsdom has no execCommand
    renderWithTheme(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'Select Text' }));
    fireEvent.paste(screen.getByRole('textbox', { name: 'Content' }), {
      clipboardData: {
        getData: (type: string) =>
          type === 'text/html'
            ? '<div class="x" style="position:fixed;inset:0"><p>hi</p></div>'
            : '',
      },
    });
    const inserted = exec.mock.calls[0];
    expect(inserted[0]).toBe('insertHTML');
    expect(inserted[2]).toContain('<p>hi</p>');
    expect(inserted[2]).not.toMatch(/position|class=/);
  });

  it('does not rewrite the editing surface for its own normalised output', () => {
    const aligned = {
      ...createEmailBlock('text'),
      content: '<p style="text-align: center;">x</p>',
    };
    renderWithTheme(
      <EmailEditor
        value={{ version: '1.0', blocks: [aligned] }}
        onChange={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Select Text' }));
    const editor = screen.getByRole('textbox', { name: 'Content' });
    editor.innerHTML = '<p style="text-align: center;">xy</p>';
    const paragraph = editor.firstChild;
    fireEvent.input(editor);
    expect(editor.firstChild).toBe(paragraph);
  });

  it('validates design colours before painting the canvas', () => {
    const { container } = renderWithTheme(
      <EmailEditor
        value={initial}
        onChange={vi.fn()}
        design={{ bodyBackgroundColor: 'url(https://x/y.png)' }}
      />
    );
    expect(container.querySelector('[style*="url("]')).toBeNull();
  });

  it('never submits a surrounding form', () => {
    const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
    renderWithTheme(
      <form onSubmit={onSubmit}>
        <Harness onDesign={vi.fn()} />
      </form>
    );
    fireEvent.click(screen.getAllByRole('button', { name: 'Move down' })[0]);
    fireEvent.click(screen.getAllByRole('button', { name: 'Duplicate' })[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Mobile' }));
    fireEvent.click(screen.getByRole('button', { name: 'Table' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add row' }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Delete' })[0]);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('treats undefined design fields as defaults', () => {
    renderWithTheme(
      <Harness onDesign={vi.fn()} initialDesign={{ fontFamily: undefined }} />
    );
    fireEvent.click(screen.getByRole('tab', { name: 'Design' }));
    expect(screen.getByRole('combobox', { name: 'Font' })).toHaveTextContent(
      'Arial'
    );
  });

  it('keeps an in-progress design colour while it is typed', () => {
    renderWithTheme(<Harness onDesign={vi.fn()} />);
    fireEvent.click(screen.getByRole('tab', { name: 'Design' }));
    const [input] = screen.getAllByLabelText('Page background');
    let next = '';
    for (const char of '#123456') {
      next += char;
      fireEvent.change(input, { target: { value: next } });
      expect(input).toHaveValue(next);
    }
  });

  it('hides the hero CTA when its URL is missing, matching the renderer', () => {
    const hero = { ...createEmailBlock('hero'), ctaText: 'Go', ctaUrl: '' };
    renderWithTheme(
      <EmailEditor
        value={{ version: '1.0', blocks: [hero] }}
        onChange={vi.fn()}
      />
    );
    expect(screen.queryByText('Go')).not.toBeInTheDocument();
  });

  it('selects instead of navigating when a preview link is activated', async () => {
    const linked = {
      ...createEmailBlock('text'),
      content: '<p><a href="https://example.com">Visit</a></p>',
    };
    renderWithTheme(
      <EmailEditor
        value={{ version: '1.0', blocks: [linked] }}
        onChange={vi.fn()}
      />
    );
    const anchor = await screen.findByText('Visit');
    // fireEvent.click returns false when the default action was cancelled.
    expect(fireEvent.click(anchor)).toBe(false);
    expect(screen.getByRole('button', { name: 'Select Text' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });

  it('names each social link group and localises platform options', () => {
    const social = createEmailBlock('social');
    renderWithTheme(
      <EmailEditor
        value={{ version: '1.0', blocks: [social] }}
        onChange={vi.fn()}
        labels={{ platforms: { linkedin: 'LinkedIn (es)' } }}
      />
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Select Social links' })
    );
    expect(screen.getByRole('group', { name: 'Link 1' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Link 2' })).toBeInTheDocument();
    expect(
      screen.getAllByRole('combobox', { name: 'Platform' })[0]
    ).toHaveTextContent('LinkedIn (es)');
    // The canvas icons carry the same localised names.
    expect(screen.getByRole('img', { name: 'LinkedIn (es)' })).toBeVisible();
    expect(screen.getByRole('img', { name: 'Website' })).toBeVisible();
  });

  it('accepts label overrides', () => {
    renderWithTheme(
      <EmailEditor
        value={initial}
        onChange={vi.fn()}
        labels={{ blocks: 'Bloques', blockTypes: { divider: 'Separador' } }}
      />
    );
    expect(screen.getByRole('tab', { name: 'Bloques' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Separador' })
    ).toBeInTheDocument();
  });
});
