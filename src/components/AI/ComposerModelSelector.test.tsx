import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import {
  ComposerModelSelector,
  type ComposerEffortOption,
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

  it('highlights the selected model when opened', () => {
    renderSelector({ value: models[1] });

    fireEvent.click(screen.getByRole('button', { name: /gpt-5/i }));

    expect(screen.getByRole('listbox', { name: /model/i })).toHaveAttribute(
      'aria-activedescendant',
      expect.stringContaining('option-1')
    );
  });

  it('allows caller-controlled labels', () => {
    renderWithTheme(
      <ComposerModelSelector
        models={[]}
        value={null}
        onChange={vi.fn()}
        placeholder="Choose model"
        anyLabel="All providers"
        emptyLabel="No available models"
        ariaLabel="Model picker"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /choose model/i }));

    expect(
      screen.getByRole('listbox', { name: /model picker/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /all providers/i })
    ).toBeInTheDocument();
    expect(screen.getByText('No available models')).toBeInTheDocument();
  });

  describe('reasoning effort', () => {
    const efforts = [
      { value: 'low', label: 'Low' },
      { value: 'medium', label: 'Medium' },
      { value: 'high', label: 'High' },
    ];

    // Spelled out rather than spreading ComponentProps: the component's props
    // are a discriminated union on the provider-filter pair, and a partial
    // spread collapses it to a shape TypeScript cannot assign.
    type EffortOverrides = {
      effortOptions?: ComposerEffortOption[];
      effort?: string | null;
      defaultEffort?: string;
      onEffortChange?: (value: string) => void;
      effortHint?: string;
    };

    function renderWithEfforts(overrides: EffortOverrides = {}) {
      return renderWithTheme(
        <ComposerModelSelector
          models={models}
          value={models[0]}
          onChange={vi.fn()}
          effortOptions={efforts}
          effort="medium"
          defaultEffort="medium"
          onEffortChange={vi.fn()}
          {...overrides}
        />
      );
    }

    it('shows the current effort on the trigger', () => {
      renderWithEfforts();

      expect(
        screen.getByRole('button', { name: /gpt-5 mini medium/i })
      ).toBeInTheDocument();
    });

    it('hides the effort row when no levels are offered', () => {
      renderWithEfforts({ effortOptions: [] });

      fireEvent.click(screen.getByRole('button', { name: /gpt-5 mini/i }));

      expect(screen.queryByRole('button', { name: /^effort/i })).toBeNull();
    });

    it('drills into the effort list and back', () => {
      renderWithEfforts();

      fireEvent.click(screen.getByRole('button', { name: /gpt-5 mini/i }));
      fireEvent.click(screen.getByRole('button', { name: /effort medium/i }));

      expect(
        screen.getByRole('listbox', { name: /effort/i })
      ).toBeInTheDocument();
      // The model list is replaced, not stacked on top of.
      expect(screen.queryByRole('listbox', { name: /^model$/i })).toBeNull();

      fireEvent.click(screen.getByRole('button', { name: /back/i }));
      expect(
        screen.getByRole('listbox', { name: /^model$/i })
      ).toBeInTheDocument();
    });

    it('marks the default level and the selected level', () => {
      renderWithEfforts({ effort: 'high' });

      fireEvent.click(screen.getByRole('button', { name: /gpt-5 mini/i }));
      fireEvent.click(screen.getByRole('button', { name: /effort high/i }));

      expect(screen.getByRole('option', { name: /^high/i })).toHaveAttribute(
        'aria-selected',
        'true'
      );
      expect(
        screen.getByRole('option', { name: /medium default/i })
      ).toBeInTheDocument();
    });

    it('reports the picked effort and closes', () => {
      const onEffortChange = vi.fn();
      renderWithEfforts({ onEffortChange });

      fireEvent.click(screen.getByRole('button', { name: /gpt-5 mini/i }));
      fireEvent.click(screen.getByRole('button', { name: /effort medium/i }));
      fireEvent.click(screen.getByRole('option', { name: /^low/i }));

      expect(onEffortChange).toHaveBeenCalledWith('low');
      expect(screen.queryByRole('listbox', { name: /effort/i })).toBeNull();
    });

    it('selects an effort with arrow keys and Enter', () => {
      const onEffortChange = vi.fn();
      renderWithEfforts({ onEffortChange });

      fireEvent.click(screen.getByRole('button', { name: /gpt-5 mini/i }));
      fireEvent.click(screen.getByRole('button', { name: /effort medium/i }));

      const list = screen.getByRole('listbox', { name: /effort/i });
      // Highlight starts on the current value ('medium'), so one step down is 'high'.
      fireEvent.keyDown(list, { key: 'ArrowDown' });
      fireEvent.keyDown(list, { key: 'Enter' });

      expect(onEffortChange).toHaveBeenCalledWith('high');
    });

    it('returns to the model list on ArrowLeft', () => {
      renderWithEfforts();

      fireEvent.click(screen.getByRole('button', { name: /gpt-5 mini/i }));
      fireEvent.click(screen.getByRole('button', { name: /effort medium/i }));
      fireEvent.keyDown(screen.getByRole('listbox', { name: /effort/i }), {
        key: 'ArrowLeft',
      });

      expect(
        screen.getByRole('listbox', { name: /^model$/i })
      ).toBeInTheDocument();
    });

    it('stays in the effort list when the caller passes a new options array', () => {
      // A composer parent re-renders on every keystroke, and callers derive
      // the levels from the selected model, so `effortOptions` arrives as a
      // fresh array each render. That must not count as "the menu reopened".
      const element = () => (
        <ComposerModelSelector
          models={models}
          value={models[0]}
          onChange={vi.fn()}
          effortOptions={efforts.map((option) => ({ ...option }))}
          effort="medium"
          onEffortChange={vi.fn()}
        />
      );

      const { rerender } = renderWithTheme(element());

      fireEvent.click(screen.getByRole('button', { name: /gpt-5 mini/i }));
      fireEvent.click(screen.getByRole('button', { name: /effort medium/i }));
      expect(
        screen.getByRole('listbox', { name: /effort/i })
      ).toBeInTheDocument();

      rerender(element());

      expect(
        screen.getByRole('listbox', { name: /effort/i })
      ).toBeInTheDocument();
    });

    it('keeps the trigger aria-controls pointing at the visible listbox', () => {
      renderWithEfforts();

      const trigger = screen.getByRole('button', { name: /gpt-5 mini/i });
      fireEvent.click(trigger);

      const controls = trigger.getAttribute('aria-controls');
      expect(controls).toBeTruthy();
      expect(document.getElementById(controls!)).toBe(
        screen.getByRole('listbox', { name: /^model$/i })
      );

      fireEvent.click(screen.getByRole('button', { name: /effort medium/i }));

      // Same id, now resolving to the effort list — otherwise aria-controls
      // would dangle for the whole time the drill-down is open.
      expect(trigger.getAttribute('aria-controls')).toBe(controls);
      expect(document.getElementById(controls!)).toBe(
        screen.getByRole('listbox', { name: /effort/i })
      );
    });

    it('announces the highlighted effort via aria-activedescendant', () => {
      renderWithEfforts();

      fireEvent.click(screen.getByRole('button', { name: /gpt-5 mini/i }));
      fireEvent.click(screen.getByRole('button', { name: /effort medium/i }));

      const list = screen.getByRole('listbox', { name: /effort/i });
      const activeId = list.getAttribute('aria-activedescendant');
      expect(activeId).toBeTruthy();
      expect(document.getElementById(activeId!)).toBe(
        screen.getByRole('option', { name: /^medium/i })
      );

      fireEvent.keyDown(list, { key: 'ArrowDown' });

      expect(
        document.getElementById(list.getAttribute('aria-activedescendant')!)
      ).toBe(screen.getByRole('option', { name: /^high/i }));
    });
  });
});
