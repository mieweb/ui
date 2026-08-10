import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import {
  ComposerModelSelector,
  type ProviderModelOption,
  type ProviderModelValue,
} from './ComposerModelSelector';

const models: ProviderModelOption[] = [
  {
    provider: 'openai',
    providerLabel: 'OpenAI',
    model: 'gpt-5-mini',
    label: 'GPT-5 mini',
  },
  {
    provider: 'openai',
    providerLabel: 'OpenAI',
    model: 'gpt-5',
    label: 'GPT-5',
  },
  {
    provider: 'anthropic',
    providerLabel: 'Anthropic',
    model: 'claude-sonnet-4-5',
    label: 'Claude Sonnet 4.5',
  },
];

function renderSelector(
  props: Partial<{
    value: ProviderModelValue | null;
    onChange: (value: ProviderModelValue) => void;
    providerFilter: string | null;
    onProviderFilterChange: (provider: string | null) => void;
  }> = {}
) {
  const baseProps = {
    models,
    value: props.value ?? models[0],
    onChange: props.onChange ?? vi.fn(),
  };

  if (props.providerFilter !== undefined) {
    return renderWithTheme(
      <ComposerModelSelector
        {...baseProps}
        providerFilter={props.providerFilter}
        onProviderFilterChange={props.onProviderFilterChange ?? vi.fn()}
      />
    );
  }

  return renderWithTheme(
    <ComposerModelSelector
      {...baseProps}
      onProviderFilterChange={props.onProviderFilterChange}
    />
  );
}

describe('ComposerModelSelector', () => {
  it('opens and closes via click', () => {
    renderSelector();

    fireEvent.click(screen.getByRole('button', { name: /gpt-5 mini/i }));
    expect(screen.getByRole('listbox', { name: /model/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /gpt-5 mini/i }));
    expect(screen.queryByRole('listbox', { name: /model/i })).toBeNull();
  });

  it('closes on Escape', () => {
    renderSelector();

    fireEvent.click(screen.getByRole('button', { name: /gpt-5 mini/i }));
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.queryByRole('listbox', { name: /model/i })).toBeNull();
  });

  it('closes on outside click', () => {
    renderSelector();

    fireEvent.click(screen.getByRole('button', { name: /gpt-5 mini/i }));
    fireEvent.mouseDown(document.body);

    expect(screen.queryByRole('listbox', { name: /model/i })).toBeNull();
  });

  it('filters visible models by provider', () => {
    renderSelector();

    fireEvent.click(screen.getByRole('button', { name: /gpt-5 mini/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Anthropic' }));

    expect(
      screen.getByRole('option', { name: /claude sonnet/i })
    ).toBeVisible();
    expect(screen.queryByRole('option', { name: /^gpt-5$/i })).toBeNull();
  });

  it('selects the highlighted model with arrow keys and Enter', () => {
    const onChange = vi.fn();
    renderSelector({ onChange });

    fireEvent.click(screen.getByRole('button', { name: /gpt-5 mini/i }));
    const listbox = screen.getByRole('listbox', { name: /model/i });
    fireEvent.keyDown(listbox, { key: 'ArrowDown' });
    fireEvent.keyDown(listbox, { key: 'Enter' });

    expect(onChange).toHaveBeenCalledWith({
      provider: 'openai',
      model: 'gpt-5',
    });
  });
});
