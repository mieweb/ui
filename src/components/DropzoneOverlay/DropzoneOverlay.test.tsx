import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { useDropzone } from './DropzoneOverlay';

function Zone({ onDrop }: { onDrop: (files: File[]) => void }) {
  const { isDragging, getRootProps } = useDropzone({ onDrop, multiple: true });
  return (
    <div data-testid="zone" {...getRootProps()}>
      {isDragging ? 'dragging' : 'idle'}
    </div>
  );
}

const withFiles = (files: File[]) => ({
  dataTransfer: { types: ['Files'], files },
});

describe('useDropzone', () => {
  it('takes a drag that carries files, and drops all of them', () => {
    const onDrop = vi.fn();
    render(<Zone onDrop={onDrop} />);
    const zone = screen.getByTestId('zone');
    const files = [new File(['a'], 'a.png'), new File(['b'], 'b.png')];
    fireEvent.dragEnter(zone, withFiles(files));
    expect(zone.textContent).toBe('dragging');
    fireEvent.drop(zone, withFiles(files));
    expect(onDrop).toHaveBeenCalledWith(files);
    expect(zone.textContent).toBe('idle');
  });

  it('leaves a drag of text alone', () => {
    const onDrop = vi.fn();
    render(<Zone onDrop={onDrop} />);
    const zone = screen.getByTestId('zone');
    fireEvent.dragEnter(zone, {
      dataTransfer: { types: ['text/plain'], files: [] },
    });
    expect(zone.textContent).toBe('idle');
  });

  it('ends a drag that a child dropped itself', () => {
    render(<Zone onDrop={vi.fn()} />);
    const zone = screen.getByTestId('zone');
    fireEvent.dragEnter(zone, withFiles([new File(['a'], 'a.png')]));
    expect(zone.textContent).toBe('dragging');
    fireEvent.drop(window);
    expect(zone.textContent).toBe('idle');
  });
});
