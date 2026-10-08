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
  initialDesign = {},
}: {
  onDesign?: (d: EmailDesignSettings) => void;
  initialDesign?: EmailDesignSettings;
}) {
  const [value, setValue] = useState(initial);
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

  it('sanitises stored HTML before it reaches the text editor', () => {
    const unsafe = {
      ...createEmailBlock('text'),
      content:
        '<img src="x" onerror="alert(1)"><style>*{}</style><div style="position:fixed;inset:0">x</div><p>ok</p>',
    };
    renderWithTheme(
      <EmailEditor
        value={{ version: '1.0', blocks: [unsafe] }}
        onChange={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Select Text' }));
    const editor = screen.getByRole('textbox', { name: 'Content' });
    expect(editor.innerHTML).toContain('<p>ok</p>');
    expect(editor.innerHTML).not.toMatch(/onerror|<style|position/);
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
