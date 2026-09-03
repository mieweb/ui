import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithTheme } from '../../test/test-utils';
import { Select, type SelectOption } from './Select';

const LOCATION_TYPES: SelectOption[] = [
  { value: 'cardiology', label: 'Cardiology' },
  { value: 'chiropractic', label: 'Chiropractic' },
  { value: 'clinic', label: 'Clinic' },
  { value: 'collection-site', label: 'Collection Site' },
  { value: 'corporate', label: 'Corporate Location' },
  { value: 'dermatology', label: 'Dermatology' },
  { value: 'family-care', label: 'Family Care Clinic' },
];

describe('Select typeahead', () => {
  it('jumps to and selects the option matching the typed characters', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    renderWithTheme(
      <Select
        aria-label="Location Type"
        options={LOCATION_TYPES}
        onValueChange={onValueChange}
      />
    );

    await user.tab();
    expect(screen.getByRole('combobox')).toHaveFocus();

    // Typing "der" should highlight "Dermatology"; Enter selects it.
    await user.keyboard('der');
    await user.keyboard('{Enter}');

    expect(onValueChange).toHaveBeenCalledWith('dermatology');
  });

  it('lands on the first match then cycles when the same key repeats', async () => {
    const user = userEvent.setup();

    renderWithTheme(
      <Select aria-label="Location Type" options={LOCATION_TYPES} />
    );

    await user.click(screen.getByRole('combobox'));

    // Fresh keystroke lands on the first "c" match.
    await user.keyboard('c');
    expect(screen.getByRole('option', { name: 'Cardiology' })).toHaveAttribute(
      'data-highlighted',
      'true'
    );

    // Repeating the same key (continuous) cycles to the next matches.
    await user.keyboard('c');
    expect(
      screen.getByRole('option', { name: 'Chiropractic' })
    ).toHaveAttribute('data-highlighted', 'true');

    await user.keyboard('c');
    expect(screen.getByRole('option', { name: 'Clinic' })).toHaveAttribute(
      'data-highlighted',
      'true'
    );
  });

  it('clears the typeahead buffer after a pause (~600ms)', () => {
    vi.useFakeTimers();

    try {
      renderWithTheme(
        <Select aria-label="Location Type" options={LOCATION_TYPES} />
      );

      fireEvent.click(screen.getByRole('combobox'));

      fireEvent.keyDown(screen.getByRole('combobox'), { key: 'c' });
      expect(
        screen.getByRole('option', { name: 'Cardiology' })
      ).toHaveAttribute('data-highlighted', 'true');

      // After the buffer clears, "d" starts a fresh query and matches
      // "Dermatology"; a stale "cd" buffer would match nothing.
      vi.advanceTimersByTime(700);
      fireEvent.keyDown(screen.getByRole('combobox'), { key: 'd' });
      expect(
        screen.getByRole('option', { name: 'Dermatology' })
      ).toHaveAttribute('data-highlighted', 'true');
    } finally {
      vi.useRealTimers();
    }
  });

  it('clears the typeahead buffer when the dropdown closes', async () => {
    const user = userEvent.setup();

    renderWithTheme(
      <Select aria-label="Location Type" options={LOCATION_TYPES} />
    );

    await user.click(screen.getByRole('combobox'));
    await user.keyboard('c');
    expect(screen.getByRole('option', { name: 'Cardiology' })).toHaveAttribute(
      'data-highlighted',
      'true'
    );

    // Close and quickly reopen: the buffer must reset, so "c" is a fresh
    // query landing on the first match instead of cycling to the next one.
    await user.keyboard('{Escape}');
    await user.click(screen.getByRole('combobox'));
    await user.keyboard('c');
    expect(screen.getByRole('option', { name: 'Cardiology' })).toHaveAttribute(
      'data-highlighted',
      'true'
    );
  });

  it('does not hijack typing when searchable (search input handles it)', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    renderWithTheme(
      <Select
        aria-label="Location Type"
        searchable
        options={LOCATION_TYPES}
        onValueChange={onValueChange}
      />
    );

    await user.click(screen.getByRole('combobox'));
    const search = screen.getByRole('textbox', { name: 'Search options' });
    await user.type(search, 'family');

    // The list should be filtered to the single matching option.
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent('Family Care Clinic');
  });

  it('allows typing spaces in the search input (multi-word queries)', async () => {
    const user = userEvent.setup();

    renderWithTheme(
      <Select aria-label="Location Type" searchable options={LOCATION_TYPES} />
    );

    await user.click(screen.getByRole('combobox'));
    const search = screen.getByRole('textbox', { name: 'Search options' });
    await user.type(search, 'collection site');

    expect(search).toHaveValue('collection site');
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent('Collection Site');
  });

  it('never calls native scrollIntoView (which would scroll the whole page)', async () => {
    const user = userEvent.setup();
    // The dropdown is portaled to <body> with position: fixed, so calling
    // Element.scrollIntoView would scroll the window. Guard against it.
    const proto = Element.prototype as unknown as {
      scrollIntoView?: () => void;
    };
    const original = proto.scrollIntoView;
    const spy = vi.fn();
    proto.scrollIntoView = spy;

    try {
      renderWithTheme(
        <Select aria-label="Location Type" options={LOCATION_TYPES} />
      );

      await user.click(screen.getByRole('combobox'));
      await user.keyboard('{ArrowDown}{ArrowDown}{End}');
      await user.keyboard('der');

      expect(spy).not.toHaveBeenCalled();
    } finally {
      proto.scrollIntoView = original;
    }
  });
});

describe('Select floating label', () => {
  it('renders the label inside the trigger and associates it', () => {
    renderWithTheme(
      <Select
        label="Location Type"
        labelVariant="floating"
        options={LOCATION_TYPES}
      />
    );

    const trigger = screen.getByRole('combobox', { name: 'Location Type' });
    expect(trigger).toHaveClass('peer');
    expect(trigger).toHaveClass('h-14');
    // No stacked label; the floating label lives next to the trigger.
    const label = screen.getByText('Location Type');
    expect(label).toHaveAttribute('data-slot', 'select-label');
    expect(label).toHaveClass('top-1/2');
  });

  it('floats the label when a value is selected', () => {
    renderWithTheme(
      <Select
        label="Location Type"
        labelVariant="floating"
        defaultValue="clinic"
        options={LOCATION_TYPES}
      />
    );

    expect(screen.getByText('Location Type')).not.toHaveClass('top-1/2');
    expect(screen.getByText('Clinic')).toBeInTheDocument();
  });

  it('floats the label while the dropdown is open', async () => {
    const user = userEvent.setup();
    renderWithTheme(
      <Select
        label="Location Type"
        labelVariant="floating"
        options={LOCATION_TYPES}
      />
    );

    expect(screen.getByText('Location Type')).toHaveClass('top-1/2');
    await user.click(screen.getByRole('combobox'));
    expect(screen.getByText('Location Type')).not.toHaveClass('top-1/2');
  });

  it('ignores the placeholder in floating mode', () => {
    renderWithTheme(
      <Select
        label="Location Type"
        labelVariant="floating"
        placeholder="Pick one"
        options={LOCATION_TYPES}
      />
    );

    expect(screen.queryByText('Pick one')).not.toBeInTheDocument();
  });

  it('tints the label when there is an error', () => {
    renderWithTheme(
      <Select
        label="Location Type"
        labelVariant="floating"
        error="Required"
        options={LOCATION_TYPES}
      />
    );

    expect(screen.getByText('Location Type')).toHaveClass('text-destructive');
    expect(screen.getByText('Required')).toBeInTheDocument();
  });

  it('falls back to the stacked label when hideLabel is set', () => {
    renderWithTheme(
      <Select
        label="Location Type"
        labelVariant="floating"
        hideLabel
        options={LOCATION_TYPES}
      />
    );

    expect(screen.getByText('Location Type')).toHaveClass('sr-only');
    expect(screen.getByRole('combobox')).not.toHaveClass('peer');
  });
});

describe('Select required', () => {
  it('shows required indicator next to the stacked label', () => {
    renderWithTheme(
      <Select label="Location Type" required options={LOCATION_TYPES} />
    );

    expect(screen.getByText('*')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toHaveAttribute(
      'aria-required',
      'true'
    );
  });

  it('uses the warning color for soft requirements', () => {
    renderWithTheme(
      <Select
        label="Location Type"
        required
        requiredVariant="warning"
        options={LOCATION_TYPES}
      />
    );

    expect(screen.getByText('*')).toHaveClass('text-warning');
  });

  it('shows required indicator inside the floating label', () => {
    renderWithTheme(
      <Select
        label="Location Type"
        labelVariant="floating"
        required
        options={LOCATION_TYPES}
      />
    );

    expect(screen.getByText('*')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toHaveAttribute(
      'aria-required',
      'true'
    );
  });
});

describe('Select multiple', () => {
  it('toggles options and keeps the dropdown open', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    renderWithTheme(
      <Select
        multiple
        aria-label="Location Type"
        options={LOCATION_TYPES}
        onValueChange={onValueChange}
      />
    );

    await user.click(screen.getByRole('combobox'));
    expect(screen.getByRole('listbox')).toHaveAttribute(
      'aria-multiselectable',
      'true'
    );

    await user.click(screen.getByRole('option', { name: 'Clinic' }));
    expect(onValueChange).toHaveBeenLastCalledWith(['clinic']);
    // Dropdown stays open for further selections
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    await user.click(screen.getByRole('option', { name: 'Cardiology' }));
    expect(onValueChange).toHaveBeenLastCalledWith(['clinic', 'cardiology']);

    // Clicking a selected option deselects it
    await user.click(screen.getByRole('option', { name: 'Clinic' }));
    expect(onValueChange).toHaveBeenLastCalledWith(['cardiology']);
  });

  it('shows selected labels comma-separated in the trigger', async () => {
    const user = userEvent.setup();

    renderWithTheme(
      <Select
        multiple
        aria-label="Location Type"
        defaultValue={['clinic', 'dermatology']}
        options={LOCATION_TYPES}
      />
    );

    expect(
      screen.getByRole('combobox', { name: 'Location Type' })
    ).toHaveTextContent('Clinic, Dermatology');

    await user.click(screen.getByRole('combobox'));
    expect(
      screen.getByRole('option', { name: /Clinic/, selected: true })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: /Dermatology/, selected: true })
    ).toBeInTheDocument();
  });

  it('supports controlled string[] values', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    renderWithTheme(
      <Select
        multiple
        aria-label="Location Type"
        value={['corporate']}
        options={LOCATION_TYPES}
        onValueChange={onValueChange}
      />
    );

    expect(screen.getByRole('combobox')).toHaveTextContent(
      'Corporate Location'
    );

    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'Clinic' }));
    expect(onValueChange).toHaveBeenCalledWith(['corporate', 'clinic']);
    // Controlled: display unchanged until parent updates value
    expect(screen.getByRole('combobox')).toHaveTextContent(
      'Corporate Location'
    );
  });

  it('floats the floating label when selections exist', () => {
    renderWithTheme(
      <Select
        multiple
        label="Location Type"
        labelVariant="floating"
        defaultValue={['clinic']}
        options={LOCATION_TYPES}
      />
    );

    expect(screen.getByText('Location Type')).not.toHaveClass('top-1/2');
  });

  it('toggles via keyboard without closing', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    renderWithTheme(
      <Select
        multiple
        aria-label="Location Type"
        options={LOCATION_TYPES}
        onValueChange={onValueChange}
      />
    );

    await user.tab();
    await user.keyboard('{ArrowDown}'); // open
    await user.keyboard('{Enter}'); // toggle highlighted (Cardiology)
    expect(onValueChange).toHaveBeenLastCalledWith(['cardiology']);
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');
    expect(onValueChange).toHaveBeenLastCalledWith([
      'cardiology',
      'chiropractic',
    ]);
  });

  it('restores focus after a mouse toggle so keyboard nav keeps working', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    renderWithTheme(
      <Select
        multiple
        aria-label="Location Type"
        options={LOCATION_TYPES}
        onValueChange={onValueChange}
      />
    );

    const trigger = screen.getByRole('combobox');
    await user.click(trigger);
    await user.click(screen.getByRole('option', { name: 'Clinic' }));

    // Focus returns to the trigger (not stranded on the option <li>) so
    // arrow keys and typeahead still work while the dropdown stays open.
    expect(trigger).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');
    expect(onValueChange).toHaveBeenLastCalledWith([
      'clinic',
      'collection-site',
    ]);
  });

  it('restores focus to the search input after a mouse toggle when searchable', async () => {
    const user = userEvent.setup();

    renderWithTheme(
      <Select
        multiple
        searchable
        aria-label="Location Type"
        options={LOCATION_TYPES}
      />
    );

    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'Clinic' }));

    expect(
      screen.getByRole('textbox', { name: 'Search options' })
    ).toHaveFocus();
  });
});
