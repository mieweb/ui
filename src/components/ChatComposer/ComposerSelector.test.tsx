import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ComposerSelector } from './ComposerSelector';

const options = [
  { id: 'on', label: 'Activate', description: 'Listen for "Hey Ozwell"' },
  { id: 'off', label: 'Disable', description: 'Wake word off' },
];

describe('ComposerSelector', () => {
  it('shows the label and fallback icon while nothing is selected', () => {
    render(
      <ComposerSelector
        options={options}
        value={null}
        label="Hey Ozwell"
        icon={<svg data-testid="fallback" />}
      />
    );

    const trigger = screen.getByRole('button', { name: 'Hey Ozwell' });
    expect(trigger).toHaveTextContent('Hey Ozwell');
    expect(trigger).toHaveAttribute('data-slot', 'composer-selector-trigger');
    expect(screen.getByTestId('fallback')).toBeInTheDocument();
  });

  it('marks the selected option and reports a new choice', () => {
    const onChange = vi.fn();
    render(
      <ComposerSelector
        options={options}
        value="on"
        onChange={onChange}
        label="Hey Ozwell"
        triggerSlot="voice-trigger"
      />
    );

    const trigger = screen.getByRole('button', {
      name: 'Hey Ozwell: Activate',
    });
    expect(trigger).toHaveAttribute('data-slot', 'voice-trigger');

    fireEvent.click(trigger);
    expect(
      screen.getByRole('menuitemradio', { name: /activate/i })
    ).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByText('Wake word off')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Disable'));
    expect(onChange).toHaveBeenCalledWith('off');
    expect(screen.queryByText('Wake word off')).not.toBeInTheDocument();
  });

  it('keeps a fixed trigger label while the accessible name carries the choice', () => {
    render(
      <ComposerSelector
        options={options}
        value="off"
        label="Hey Ozwell"
        triggerLabel="Hey Ozwell"
      />
    );

    const trigger = screen.getByRole('button', { name: 'Hey Ozwell: Disable' });
    expect(trigger).toHaveTextContent('Hey Ozwell');
    expect(trigger).not.toHaveTextContent('Disable');
  });

  it('disables the trigger', () => {
    render(
      <ComposerSelector options={options} value="on" label="Voice" disabled />
    );
    expect(
      screen.getByRole('button', { name: 'Voice: Activate' })
    ).toBeDisabled();
  });
});
