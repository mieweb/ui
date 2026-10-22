import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { HeyOzwellSelector } from './HeyOzwellSelector';

function openMenu() {
  fireEvent.click(screen.getByRole('button', { name: /^Hey Ozwell:/ }));
}

describe('HeyOzwellSelector', () => {
  it.each([
    ['off', 'Disable', 'Hey Ozwell is off'],
    ['loading', 'Activate', 'Hey Ozwell is starting'],
    ['listening', 'Activate', 'Listening for "Hey Ozwell"'],
    ['error', 'Activate', 'Hey Ozwell could not start'],
  ] as const)(
    'maps phase %s to the %s choice and announces it',
    (phase, choice, status) => {
      render(<HeyOzwellSelector phase={phase} onChange={() => {}} />);
      const trigger = screen.getByRole('button', {
        name: `Hey Ozwell: ${choice}`,
      });
      expect(trigger).toHaveTextContent('Hey Ozwell');
      expect(screen.getByRole('status')).toHaveTextContent(status);
    }
  );

  it('spins the trigger icon while loading', () => {
    render(<HeyOzwellSelector phase="loading" onChange={() => {}} />);
    expect(
      screen.getByRole('button').querySelector('.animate-spin')
    ).not.toBeNull();
  });

  it('reports a changed choice and ignores the current one', () => {
    const onChange = vi.fn();
    render(<HeyOzwellSelector phase="listening" onChange={onChange} />);

    openMenu();
    fireEvent.click(screen.getByText('Activate'));
    expect(onChange).not.toHaveBeenCalled();

    openMenu();
    fireEvent.click(screen.getByText('Disable'));
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it('shows the error under Activate and retries on Activate', () => {
    const onChange = vi.fn();
    render(
      <HeyOzwellSelector
        phase="error"
        error="Microphone permission denied"
        onChange={onChange}
      />
    );

    openMenu();
    expect(
      screen.getByText('Microphone permission denied')
    ).toBeInTheDocument();
    fireEvent.click(screen.getByText('Activate'));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('offers Voice settings only when onOpenSettings is set', () => {
    const onOpenSettings = vi.fn();
    const { rerender } = render(
      <HeyOzwellSelector phase="off" onChange={() => {}} />
    );
    openMenu();
    expect(
      screen.queryByRole('menuitem', { name: 'Voice settings…' })
    ).not.toBeInTheDocument();

    rerender(
      <HeyOzwellSelector
        phase="off"
        onChange={() => {}}
        onOpenSettings={onOpenSettings}
      />
    );
    fireEvent.click(screen.getByRole('menuitem', { name: 'Voice settings…' }));
    expect(onOpenSettings).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menuitem')).not.toBeInTheDocument();
  });

  it('uses translated labels', () => {
    render(
      <HeyOzwellSelector
        phase="listening"
        onChange={() => {}}
        labels={{
          name: 'Hola Ozwell',
          activate: 'Activar',
          listening: 'Escuchando',
        }}
      />
    );
    expect(
      screen.getByRole('button', { name: 'Hola Ozwell: Activar' })
    ).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Escuchando');
  });

  it('disables the trigger', () => {
    render(<HeyOzwellSelector phase="off" onChange={() => {}} disabled />);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
