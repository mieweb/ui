import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { DateRangePicker, DateRangeFilter, DateRange } from './DateRangePicker';

// ============================================================================
// DateRangePicker Stories
// ============================================================================

const meta: Meta<typeof DateRangePicker> = {
  title: 'Components/DateRangePicker',
  component: DateRangePicker,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    showPrint: {
      control: 'boolean',
      description: 'Whether to show print button',
    },
    showExport: {
      control: 'boolean',
      description: 'Whether to show export button',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text for the date input',
    },
    dateFormat: {
      control: 'text',
      description: 'Date format for display',
    },
    className: {
      control: 'text',
      description: 'Custom className',
    },
    value: {
      control: false,
      description: 'Current date range value',
    },
    activePreset: {
      control: false,
      description: 'Currently active preset key',
    },
    presets: {
      control: false,
      description: 'Custom presets (uses default if not provided)',
    },
    labels: {
      control: false,
      description: 'Labels for i18n',
    },
    onChange: { action: 'onChange' },
    onPrint: { action: 'onPrint' },
    onExport: { action: 'onExport' },
  },
  args: {
    showPrint: false,
    showExport: false,
    placeholder: 'Select date range',
  },
};

export default meta;
type Story = StoryObj<typeof DateRangePicker>;

// ============================================================================
// Playground Story (for Controls)
// ============================================================================

interface PlaygroundProps {
  showPrint?: boolean;
  showExport?: boolean;
  placeholder?: string;
  dateFormat?: string;
  className?: string;
  onPrint?: () => void;
  onExport?: () => void;
}

function PlaygroundDemo({
  showPrint,
  showExport,
  placeholder,
  dateFormat,
  className,
  onPrint,
  onExport,
}: PlaygroundProps) {
  const [range, setRange] = useState<DateRange>({ start: null, end: null });
  const [preset, setPreset] = useState<string>();

  return (
    <DateRangePicker
      value={range}
      onChange={(newRange, presetKey) => {
        setRange(newRange);
        setPreset(presetKey);
      }}
      activePreset={preset}
      showPrint={showPrint}
      showExport={showExport}
      placeholder={placeholder}
      dateFormat={dateFormat}
      className={className}
      onPrint={onPrint}
      onExport={onExport}
    />
  );
}

/**
 * Interactive playground with all controls available.
 * Use the Controls panel to toggle showPrint, showExport, and other props.
 */
export const Playground: Story = {
  render: (args) => <PlaygroundDemo {...args} />,
  args: {
    showPrint: true,
    showExport: true,
  },
};

// ============================================================================
// Demo Stories
// ============================================================================

export const Default: Story = {
  render: function Render() {
    const [range, setRange] = useState<DateRange>({ start: null, end: null });
    const [preset, setPreset] = useState<string>();

    return (
      <DateRangePicker
        value={range}
        onChange={(newRange, presetKey) => {
          setRange(newRange);
          setPreset(presetKey);
        }}
        activePreset={preset}
      />
    );
  },
};

export const WithPrintExport: Story = {
  render: function Render() {
    const [range, setRange] = useState<DateRange>({ start: null, end: null });
    const [preset, setPreset] = useState<string>();

    return (
      <DateRangePicker
        value={range}
        onChange={(newRange, presetKey) => {
          setRange(newRange);
          setPreset(presetKey);
        }}
        activePreset={preset}
        showPrint
        showExport
        onPrint={() => window.alert('Print clicked!')}
        onExport={() => window.alert('Export clicked!')}
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Date range picker with print and export buttons for report filtering.',
      },
    },
  },
};

export const Preselected: Story = {
  render: function Render() {
    const [range, setRange] = useState<DateRange>({
      start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      end: new Date(),
    });
    const [preset, setPreset] = useState<string | undefined>('this-month');

    return (
      <DateRangePicker
        value={range}
        onChange={(newRange, presetKey) => {
          setRange(newRange);
          setPreset(presetKey);
        }}
        activePreset={preset}
        showPrint
        showExport
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Date range picker with "This Month" preset already selected.',
      },
    },
  },
};

export const CustomLabels: Story = {
  render: function Render() {
    const [range, setRange] = useState<DateRange>({ start: null, end: null });
    const [preset, setPreset] = useState<string>();

    return (
      <DateRangePicker
        value={range}
        onChange={(newRange, presetKey) => {
          setRange(newRange);
          setPreset(presetKey);
        }}
        activePreset={preset}
        placeholder="Seleccionar período"
        showPrint
        showExport
        labels={{
          today: 'Hoy',
          thisWeek: 'Esta Semana',
          thisMonth: 'Este Mes',
          lastMonth: 'Mes Pasado',
          last7Days: 'Últimos 7 Días',
          last30Days: 'Últimos 30 Días',
          thisYear: 'Este Año',
          lastYear: 'Año Pasado',
          print: 'Imprimir',
          export: 'Exportar',
        }}
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Date range picker with Spanish labels for internationalization.',
      },
    },
  },
};

// ============================================================================
// DateRangeFilter Stories
// ============================================================================

export const FilterDropdown: StoryObj<typeof DateRangeFilter> = {
  render: function Render() {
    const [range, setRange] = useState<DateRange>({ start: null, end: null });
    const [preset, setPreset] = useState<string>();

    return (
      <div className="space-y-4">
        <DateRangeFilter
          value={range}
          onChange={(newRange, presetKey) => {
            setRange(newRange);
            setPreset(presetKey);
          }}
          activePreset={preset}
        />
        {preset && (
          <p className="text-muted-foreground text-sm">
            Selected: {preset}
            {range.start &&
              ` (${range.start.toLocaleDateString()} - ${range.end?.toLocaleDateString()})`}
          </p>
        )}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Standalone filter dropdown for simpler date filtering.',
      },
    },
  },
};

export const FilterVariants: StoryObj<typeof DateRangeFilter> = {
  render: function Render() {
    const [range, setRange] = useState<DateRange>({ start: null, end: null });
    const [preset, setPreset] = useState<string>();

    return (
      <div className="flex gap-4">
        <DateRangeFilter
          value={range}
          onChange={(newRange, presetKey) => {
            setRange(newRange);
            setPreset(presetKey);
          }}
          activePreset={preset}
          variant="primary"
        />
        <DateRangeFilter
          value={range}
          onChange={(newRange, presetKey) => {
            setRange(newRange);
            setPreset(presetKey);
          }}
          activePreset={preset}
          variant="outline"
        />
        <DateRangeFilter
          value={range}
          onChange={(newRange, presetKey) => {
            setRange(newRange);
            setPreset(presetKey);
          }}
          activePreset={preset}
          variant="ghost"
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Filter dropdown in different button variants.',
      },
    },
  },
};

export const Mobile: Story = {
  render: function Render() {
    const [range, setRange] = useState<DateRange>({ start: null, end: null });
    const [preset, setPreset] = useState<string>();

    return (
      <div className="w-full">
        <DateRangePicker
          value={range}
          onChange={(newRange, presetKey) => {
            setRange(newRange);
            setPreset(presetKey);
          }}
          activePreset={preset}
          showPrint
          showExport
        />
      </div>
    );
  },
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    docs: {
      description: {
        story: 'Date range picker on mobile viewport.',
      },
    },
  },
};
