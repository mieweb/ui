import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  SliderCalculator,
  AnimatedNumber,
  type CalculatorInput,
  type CalculatorResult,
} from './SliderCalculator';
import { Button } from '../Button';
import { skillUrl, type ComponentMeta } from '../../docs/component-meta';

const componentMeta: ComponentMeta = {
  usedIn: [
    {
      repo: 'mieweb/enterprise-health-frontdoor',
      live: 'https://concept.enterprise.health/industry/aviation/#roi-calculator',
      note: 'The "Your ROI" section on every industry hub, driven by a per-vertical preset.',
    },
  ],
  skills: [
    {
      name: 'industry-page',
      repo: 'mieweb/enterprise-health-frontdoor',
      url: skillUrl('mieweb/enterprise-health-frontdoor', 'industry-page'),
      summary:
        'Scaffolds a vertical hub including its `RoiPreset` defaults and cost drivers.',
    },
  ],
  origin: {
    repo: 'mieweb/enterprise-health-frontdoor',
    note: 'Ported from components/sections/RoiCalculator.tsx; the calculation engine stays in the consumer (`compute`).',
  },
};

// Faithful port of lib/roi/calculations.ts defaults — illustrative only.
const A = {
  duplicateReduction: 0.85,
  unifiedHoursPerRecord: 0.25,
  complianceFailureProbability: 0.18,
  complianceFailureCost: 145_000,
  complianceRiskReduction: 0.8,
  perSiteOverhead: 0.04,
  staffHourlyCost: 48,
};

const roiInputs: CalculatorInput[] = [
  {
    id: 'population',
    label: 'People covered by the program',
    min: 500,
    max: 60000,
    step: 500,
    defaultValue: 12000,
  },
  {
    id: 'sites',
    label: 'Decentralized sites / departments',
    min: 1,
    max: 30,
    step: 1,
    defaultValue: 6,
  },
  {
    id: 'surveillancePercent',
    label: 'Share in a surveillance or clearance program',
    min: 5,
    max: 100,
    step: 1,
    defaultValue: 45,
    format: 'percent',
  },
  {
    id: 'duplicatePercent',
    label: 'Screenings duplicated across sites & vendors',
    min: 0,
    max: 60,
    step: 1,
    defaultValue: 18,
    format: 'percent',
  },
  {
    id: 'hoursPerRecord',
    label: 'Manual admin hours per record',
    min: 0.25,
    max: 6,
    step: 0.25,
    defaultValue: 1.5,
    format: 'hours',
  },
  {
    id: 'avgScreenCost',
    label: 'Average cost per screening / exam',
    min: 20,
    max: 400,
    step: 5,
    defaultValue: 140,
    format: 'currency',
  },
];

const usd = (v: number) =>
  v.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });

function computeRoi(v: Record<string, number>): CalculatorResult {
  const records = v.population * (v.surveillancePercent / 100);
  const dupes = records * (v.duplicatePercent / 100);
  const siteOverhead = 1 + A.perSiteOverhead * Math.max(v.sites - 1, 0);

  const curDuplicate = dupes * v.avgScreenCost;
  const curAdminHours = records * v.hoursPerRecord * siteOverhead;
  const curAdmin = curAdminHours * A.staffHourlyCost;
  const curCompliance =
    A.complianceFailureProbability * A.complianceFailureCost * v.sites;
  const current = curDuplicate + curAdmin + curCompliance;

  const uniDuplicate = curDuplicate * (1 - A.duplicateReduction);
  const uniAdminHours = records * A.unifiedHoursPerRecord;
  const uniAdmin = uniAdminHours * A.staffHourlyCost;
  const uniCompliance = curCompliance * (1 - A.complianceRiskReduction);
  const unified = uniDuplicate + uniAdmin + uniCompliance;

  const total = Math.max(current - unified, 0);
  return {
    total,
    summary: `${Math.round((current > 0 ? total / current : 0) * 100)}% of today's fragmented spend · ${Math.round(curAdminHours - uniAdminHours).toLocaleString()} admin hours returned`,
    breakdown: [
      {
        label: 'Duplicate screening recovered',
        value: curDuplicate - uniDuplicate,
      },
      { label: 'Admin labor recovered', value: curAdmin - uniAdmin },
      {
        label: 'Compliance risk reduced',
        value: curCompliance - uniCompliance,
      },
    ],
    math: [
      { label: 'Fragmented status quo', value: `${usd(current)}/yr` },
      { label: 'On one governed record', value: `${usd(unified)}/yr` },
      {
        label: 'Surveillance records / yr',
        value: Math.round(records).toLocaleString(),
      },
      {
        label: 'Duplicate screens / yr',
        value: Math.round(dupes).toLocaleString(),
      },
    ],
    assumptions: [
      'Duplicate screening falls 85% once one record is the source of truth.',
      'Admin effort falls to 0.25 hr per record with automated scheduling and results ingestion.',
      'Compliance failure exposure modelled at 18% probability × $145K per site.',
    ],
  };
}

const meta: Meta<typeof SliderCalculator> = {
  title: 'Components/Forms & Inputs/SliderCalculator',
  component: SliderCalculator,
  parameters: {
    layout: 'padded',
    meta: componentMeta,
    docs: {
      description: {
        component:
          'A two-column interactive calculator: labelled sliders on the left (composed from `Slider`), ' +
          'a live result panel on the right with an animated headline number, one-line summary, ' +
          'proportional breakdown bars, a "Show the math" disclosure and an actions slot. The ' +
          'component owns only the interaction — pass a pure `compute(values) → result` and it ' +
          'renders whatever the result carries. `AnimatedNumber` is exported for reuse.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    inputs: { control: false },
    compute: { control: false },
    actions: { control: false },
    onChange: { control: false },
    headingLevel: { control: 'select', options: ['h2', 'h3'] },
    resultFormat: {
      control: 'select',
      options: ['compactCurrency', 'currency', 'number', 'percent'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Roi: Story = {
  args: {
    eyebrow: 'Your ROI',
    heading: 'What is one governed record worth to you?',
    description: 'Move the sliders to your numbers. The estimate updates live.',
    inputs: roiInputs,
    compute: computeRoi,
    resultLabel: 'Estimated annual recovery',
    actions: (
      <>
        <Button effect="sheen">Request a demo</Button>
        <Button
          variant="ghost"
          className="text-white hover:bg-white/10 hover:text-white"
        >
          Get this modeled for your organization
        </Button>
      </>
    ),
    footnote:
      'Illustrative estimate — directional, not a quote. Assumptions are listed under "Show the math".',
  },
};

/** A minimal three-slider calculator with a non-currency headline. */
export const Simple: Story = {
  args: {
    heading: 'Hours saved per week',
    inputs: [
      {
        id: 'staff',
        label: 'Clinical staff',
        min: 1,
        max: 50,
        defaultValue: 8,
      },
      {
        id: 'notes',
        label: 'Notes per clinician per day',
        min: 5,
        max: 60,
        defaultValue: 22,
      },
      {
        id: 'minutes',
        label: 'Minutes saved per note',
        min: 1,
        max: 15,
        defaultValue: 4,
      },
    ],
    compute: ({ staff, notes, minutes }) => {
      const hours = (staff * notes * minutes * 5) / 60;
      return {
        total: hours,
        summary: `${Math.round(hours / staff)} hours back per clinician, every week`,
      };
    },
    resultLabel: 'Hours returned each week',
    resultFormat: (v) => `${Math.round(v).toLocaleString()} hr`,
  },
};

export const AnimatedNumberOnly: Story = {
  render: () => (
    <p className="text-4xl font-semibold">
      <AnimatedNumber value={1_284_000} format={(v) => usd(v)} />
    </p>
  ),
};
