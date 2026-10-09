import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LogoUploader } from './LogoUploader';

const png = (bytes = 10) =>
  new File(['x'.repeat(bytes)], 'logo.png', { type: 'image/png' });

describe('LogoUploader', () => {
  it('only renders safe image URLs', () => {
    const { rerender } = render(
      <LogoUploader value="javascript:alert(1)" onUpload={vi.fn()} />
    );
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    rerender(
      <LogoUploader value="data:image/png;base64,AAAA" onUpload={vi.fn()} />
    );
    expect(screen.getByRole('img')).toBeInTheDocument();
    rerender(<LogoUploader value="/logos/acme.png" onUpload={vi.fn()} />);
    expect(screen.getByRole('img')).toHaveAttribute('src', '/logos/acme.png');
  });

  it('uploads a chosen file, shows pending, then previews the returned URL', async () => {
    let resolve!: (url: string) => void;
    const onUpload = vi.fn(() => new Promise<string>((r) => (resolve = r)));
    render(<LogoUploader onUpload={onUpload} />);
    const input = screen.getByLabelText('Upload logo');
    await userEvent.upload(input, png());
    expect(onUpload).toHaveBeenCalledWith(expect.any(File));
    expect(screen.getByRole('status')).toHaveTextContent('Uploading…');
    expect(input).toBeDisabled();
    // The picked file is previewed on a canvas, never as an <img src>.
    expect(screen.getByRole('img').tagName).toBe('CANVAS');
    resolve('https://cdn.test/logo.png');
    await waitFor(() =>
      expect(screen.getByRole('img')).toHaveAttribute(
        'src',
        'https://cdn.test/logo.png'
      )
    );
  });

  it('ignores an upload result once a newer value arrives', async () => {
    let resolve!: (url: string) => void;
    const onUpload = vi.fn(() => new Promise<string>((r) => (resolve = r)));
    const { rerender } = render(<LogoUploader onUpload={onUpload} />);
    await userEvent.upload(screen.getByLabelText('Upload logo'), png());
    rerender(<LogoUploader value="/logos/newer.png" onUpload={onUpload} />);
    resolve('https://cdn.test/stale.png');
    await waitFor(() =>
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    );
    expect(screen.getByRole('img')).toHaveAttribute('src', '/logos/newer.png');
  });

  it('rejects files over maxSizeBytes and of the wrong type', async () => {
    const onUpload = vi.fn();
    render(<LogoUploader onUpload={onUpload} maxSizeBytes={1024 * 1024} />);
    const input = screen.getByLabelText('Upload logo');
    fireEvent.change(input, { target: { files: [png(2 * 1024 * 1024)] } });
    expect(screen.getByRole('alert')).toHaveTextContent('1 MB or smaller');
    fireEvent.change(input, {
      target: {
        files: [new File(['x'], 'a.pdf', { type: 'application/pdf' })],
      },
    });
    expect(screen.getByRole('alert')).toHaveTextContent('not supported');
    expect(onUpload).not.toHaveBeenCalled();
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('accepts extension tokens in accept', () => {
    const onUpload = vi.fn().mockResolvedValue(undefined);
    render(<LogoUploader onUpload={onUpload} accept=".svg, image/png" />);
    fireEvent.change(screen.getByLabelText('Upload logo'), {
      target: {
        files: [new File(['<svg/>'], 'mark.SVG', { type: '' })],
      },
    });
    expect(onUpload).toHaveBeenCalled();
  });

  it('restores the previous logo and shows an error when upload fails', async () => {
    const onUpload = vi.fn().mockRejectedValue(new Error('boom'));
    render(
      <LogoUploader value="https://cdn.test/old.png" onUpload={onUpload} />
    );
    await userEvent.upload(screen.getByLabelText('Replace logo'), png());
    expect(await screen.findByRole('alert')).toHaveTextContent('Upload failed');
    expect(screen.getByRole('img')).toHaveAttribute(
      'src',
      'https://cdn.test/old.png'
    );
  });

  it('accepts a dropped file', async () => {
    const onUpload = vi.fn().mockResolvedValue(undefined);
    const { container } = render(<LogoUploader onUpload={onUpload} />);
    const target = container.querySelector(
      '[data-slot="logo-uploader-target"]'
    )!;
    fireEvent.dragOver(target);
    expect(target.className).toContain('border-primary-500');
    fireEvent.drop(target, { dataTransfer: { files: [png()] } });
    await waitFor(() => expect(onUpload).toHaveBeenCalled());
  });

  it('removes the logo and reports a failed removal', async () => {
    const onRemove = vi
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('nope'));
    const { rerender } = render(
      <LogoUploader
        value="https://cdn.test/a.png"
        onUpload={vi.fn()}
        onRemove={onRemove}
        shape="circle"
      />
    );
    await userEvent.click(screen.getByRole('button', { name: 'Remove logo' }));
    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText('Replace logo')).toHaveFocus();

    rerender(
      <LogoUploader
        value="https://cdn.test/b.png"
        onUpload={vi.fn()}
        onRemove={onRemove}
      />
    );
    await userEvent.click(screen.getByRole('button', { name: 'Remove logo' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not remove'
    );
  });

  it('hides the remove button without onRemove and respects disabled', () => {
    render(
      <LogoUploader
        value="https://cdn.test/a.png"
        onUpload={vi.fn()}
        disabled
      />
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Replace logo')).toBeDisabled();
  });
});
