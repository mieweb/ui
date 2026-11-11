import * as React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithTheme } from '../../test/test-utils';
import {
  useEncounterMediaCapture,
  type EncounterMediaCaptureOptions,
} from './mediaCapture';

const uploadHandler = async () => 'https://cdn.example/uploaded.png';

function Harness({
  options,
  onConfirmed,
}: {
  options?: EncounterMediaCaptureOptions;
  onConfirmed: (confirmed: boolean) => void;
}) {
  const { value, dialog } = useEncounterMediaCapture(options);
  return (
    <>
      <button
        type="button"
        onClick={() => {
          void Promise.resolve(value!.capture.confirmScreenCapture!()).then(
            onConfirmed
          );
        }}
      >
        Start capture
      </button>
      {dialog}
    </>
  );
}

describe('useEncounterMediaCapture (mieweb/ui#736)', () => {
  it('returns no config without the opt-in', () => {
    const results: unknown[] = [];
    function Probe() {
      results.push(useEncounterMediaCapture(undefined).value);
      return null;
    }
    renderWithTheme(<Probe />);
    expect(results).toEqual([null]);
  });

  it('wires the mandatory uploadHandler into the upload options', () => {
    let value: ReturnType<typeof useEncounterMediaCapture>['value'] = null;
    function Probe() {
      value = useEncounterMediaCapture({
        uploadHandler,
        mediaUpload: { maxFileSize: 1024 },
      }).value;
      return null;
    }
    renderWithTheme(<Probe />);
    expect(value!.mediaUpload.uploadHandler).toBe(uploadHandler);
    expect(value!.mediaUpload.maxFileSize).toBe(1024);
  });

  it('shows the PHI notice and resolves true on Capture screen', async () => {
    const onConfirmed = vi.fn();
    renderWithTheme(
      <Harness options={{ uploadHandler }} onConfirmed={onConfirmed} />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Start capture' }));
    expect(
      await screen.findByText(/can include other patients/)
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Capture screen' }));
    await waitFor(() => expect(onConfirmed).toHaveBeenCalledWith(true));
  });

  it('resolves false when the PHI notice is cancelled', async () => {
    const onConfirmed = vi.fn();
    renderWithTheme(
      <Harness options={{ uploadHandler }} onConfirmed={onConfirmed} />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Start capture' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(onConfirmed).toHaveBeenCalledWith(false));
  });

  it('lets a host-supplied confirmScreenCapture replace the built-in notice', () => {
    const confirmScreenCapture = vi.fn(async () => true);
    let value: ReturnType<typeof useEncounterMediaCapture>['value'] = null;
    function Probe() {
      value = useEncounterMediaCapture({
        uploadHandler,
        confirmScreenCapture,
      }).value;
      return null;
    }
    renderWithTheme(<Probe />);
    expect(value!.capture.confirmScreenCapture).toBe(confirmScreenCapture);
  });
});
