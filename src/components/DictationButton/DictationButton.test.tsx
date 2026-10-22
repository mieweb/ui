import { act, fireEvent, render, screen } from '@testing-library/react';
import * as React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useDictation, type UseDictationResult } from './useDictation';
import { DictationButton, type DictationButtonHandle } from './DictationButton';

const hook: UseDictationResult = {
  status: 'idle',
  error: null,
  elapsedMs: 0,
  start: vi.fn(async () => {}),
  stop: vi.fn(),
  cancel: vi.fn(),
};

vi.mock('./useDictation', () => ({ useDictation: vi.fn(() => hook) }));

function setStatus(
  status: UseDictationResult['status'],
  extra: Partial<UseDictationResult> = {}
) {
  Object.assign(hook, { status, error: null, elapsedMs: 0, ...extra });
}

beforeEach(() => {
  setStatus('idle');
  vi.mocked(hook.start).mockClear();
  vi.mocked(hook.stop).mockClear();
  vi.mocked(hook.cancel).mockClear();
});

describe('DictationButton', () => {
  it('passes getStream to the hook, not to the <button>', () => {
    const getStream = () => null;
    render(<DictationButton onText={vi.fn()} getStream={getStream} />);
    expect(vi.mocked(useDictation)).toHaveBeenLastCalledWith(
      expect.objectContaining({ getStream })
    );
    expect(screen.getByRole('button')).not.toHaveAttribute('getstream');
  });

  it('keeps its state-driven accessible name over a passed aria-label', () => {
    render(<DictationButton onText={vi.fn()} aria-label="Ignored" />);
    expect(
      screen.getByRole('button', { name: 'Start dictation' })
    ).toBeInTheDocument();
  });

  it('starts on click when idle and stops on click when recording', () => {
    const { rerender } = render(<DictationButton onText={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Start dictation' }));
    expect(hook.start).toHaveBeenCalledTimes(1);

    setStatus('recording');
    rerender(<DictationButton onText={vi.fn()} />);
    const button = screen.getByRole('button', { name: 'Stop dictation' });
    expect(button).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(button);
    expect(hook.stop).toHaveBeenCalledTimes(1);
  });

  it('cancels on Escape while recording', () => {
    setStatus('recording');
    render(<DictationButton onText={vi.fn()} />);
    fireEvent.keyDown(screen.getByRole('button'), { key: 'Escape' });
    expect(hook.cancel).toHaveBeenCalledTimes(1);
  });

  it('cancels on Escape while focus is in another element', () => {
    setStatus('recording');
    render(
      <>
        <textarea aria-label="Message" />
        <DictationButton onText={vi.fn()} />
      </>
    );
    const input = screen.getByRole('textbox');
    input.focus();
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(hook.cancel).toHaveBeenCalledTimes(1);
  });

  it('skips Escape that another handler already prevented', () => {
    setStatus('recording');
    render(
      <>
        <textarea aria-label="Message" onKeyDown={(e) => e.preventDefault()} />
        <DictationButton onText={vi.fn()} />
      </>
    );
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Escape' });
    expect(hook.cancel).not.toHaveBeenCalled();
  });

  it('stops listening for Escape once recording ends or it unmounts', () => {
    setStatus('recording');
    const { rerender, unmount } = render(<DictationButton onText={vi.fn()} />);
    setStatus('transcribing');
    rerender(<DictationButton onText={vi.fn()} />);
    fireEvent.keyDown(document, { key: 'Escape' });

    setStatus('recording');
    rerender(<DictationButton onText={vi.fn()} />);
    unmount();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(hook.cancel).not.toHaveBeenCalled();
  });

  it('ignores Escape when idle', () => {
    render(<DictationButton onText={vi.fn()} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(hook.cancel).not.toHaveBeenCalled();
  });

  it('is busy and not clickable while transcribing', () => {
    setStatus('transcribing');
    render(<DictationButton onText={vi.fn()} />);
    const button = screen.getByRole('button', { name: 'Transcribing…' });
    expect(button).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent('Transcribing…');
  });

  it('announces a generic error and retries on click', () => {
    setStatus('error', { error: new Error('server said 500 with details') });
    render(<DictationButton onText={vi.fn()} />);
    expect(screen.getByRole('status')).toHaveTextContent(
      'Dictation failed. Try again.'
    );
    expect(screen.queryByText(/server said/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button'));
    expect(hook.start).toHaveBeenCalledTimes(1);
  });

  it('tells the user when the mic permission is blocked', () => {
    const denied = new Error('denied');
    denied.name = 'NotAllowedError';
    setStatus('error', { error: denied });
    render(<DictationButton onText={vi.fn()} />);
    expect(screen.getByRole('status')).toHaveTextContent(
      'Microphone access is blocked.'
    );
  });

  it('uses localized labels', () => {
    render(
      <DictationButton onText={vi.fn()} labels={{ start: 'Iniciar dictado' }} />
    );
    expect(
      screen.getByRole('button', { name: 'Iniciar dictado' })
    ).toBeInTheDocument();
  });

  it('is disabled when disabled, and cancels a take in progress', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    setStatus('recording');
    render(<DictationButton onText={vi.fn()} disabled />);
    expect(screen.getByRole('button')).toBeDisabled();
    expect(hook.cancel).toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it.each([
    ['the permission prompt is pending', 'idle'],
    ['transcribing', 'transcribing'],
  ] as const)('cancels when disabled while %s', (_, status) => {
    setStatus(status);
    const { rerender } = render(<DictationButton onText={vi.fn()} />);
    expect(hook.cancel).not.toHaveBeenCalled();
    rerender(<DictationButton onText={vi.fn()} disabled />);
    expect(hook.cancel).toHaveBeenCalledTimes(1);
  });

  it('forwards button attributes and runs the caller onKeyDown first', () => {
    setStatus('recording');
    const onKeyDown = vi.fn((e: { preventDefault: () => void }) =>
      e.preventDefault()
    );
    render(
      <DictationButton
        onText={vi.fn()}
        id="dictate"
        aria-describedby="hint"
        data-testid="dictation"
        onKeyDown={onKeyDown}
      />
    );
    const button = screen.getByTestId('dictation');
    expect(button).toHaveAttribute('id', 'dictate');
    expect(button).toHaveAttribute('aria-describedby', 'hint');
    fireEvent.keyDown(button, { key: 'Escape' });
    expect(onKeyDown).toHaveBeenCalledTimes(1);
    expect(hook.cancel).not.toHaveBeenCalled();
  });

  it('shows the elapsed time while recording when showDuration is set', () => {
    setStatus('recording', { elapsedMs: 65_000 });
    render(<DictationButton onText={vi.fn()} showDuration />);
    expect(screen.getByText('1:05')).toBeInTheDocument();
  });

  it('keeps the status caption screen-reader-only unless showStatus is set', () => {
    setStatus('recording');
    const { rerender } = render(<DictationButton onText={vi.fn()} />);
    expect(screen.getByRole('status')).toHaveClass('sr-only');
    rerender(<DictationButton onText={vi.fn()} showStatus />);
    expect(screen.getByRole('status')).not.toHaveClass('sr-only');
  });

  it('starts, stops and cancels from handleRef while ref stays the <button>', () => {
    const handle = React.createRef<DictationButtonHandle>();
    const button = React.createRef<HTMLButtonElement>();
    render(
      <DictationButton onText={vi.fn()} ref={button} handleRef={handle} />
    );
    expect(button.current).toBe(screen.getByRole('button'));

    act(() => handle.current!.start());
    act(() => handle.current!.stop());
    act(() => handle.current!.cancel());
    expect(hook.start).toHaveBeenCalledTimes(1);
    expect(hook.stop).toHaveBeenCalledTimes(1);
    expect(hook.cancel).toHaveBeenCalledTimes(1);
  });

  it('ignores handleRef start while disabled', () => {
    const handle = React.createRef<DictationButtonHandle>();
    render(<DictationButton onText={vi.fn()} handleRef={handle} disabled />);
    act(() => handle.current!.start());
    expect(hook.start).not.toHaveBeenCalled();
  });
});
