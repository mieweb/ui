import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';

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
}: {
  onDesign?: (d: EmailDesignSettings) => void;
}) {
  const [value, setValue] = useState(initial);
  const [design, setDesign] = useState<EmailDesignSettings>({});
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
