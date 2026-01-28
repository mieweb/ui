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
};

export default meta;
type Story = StoryObj<typeof DateRangePicker>;

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
        onPrint={() => alert('Print clicked!')}
        onExport={() => alert('Export clicked!')}
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
