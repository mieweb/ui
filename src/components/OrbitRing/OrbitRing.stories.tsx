import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Activity,
  Building2,
  Cloud,
  Database,
  FileText,
  HeartPulse,
  Lock,
  Mail,
  Microscope,
  Stethoscope,
  Sun,
  Syringe,
  Truck,
} from 'lucide-react';
import { OrbitRing, type OrbitSatellite } from './OrbitRing';
import type { ComponentMeta } from '../../docs/component-meta';

const componentMeta: ComponentMeta = {
  usedIn: [
    {
      repo: 'mieweb/enterprise-health-frontdoor',
      live: 'https://concept.enterprise.health/integrations/',
      note: 'The integrations "solar system" — partner logos orbiting the EH sunburst.',
    },
  ],
  origin: {
    repo: 'mieweb/enterprise-health-frontdoor',
    note: 'Ported from components/sections/Integrations.tsx and the `.ehorb-*` CSS.',
  },
};

const sat = (
  id: string,
  name: string,
  Icon: React.ComponentType<{ strokeWidth?: number }>
): OrbitSatellite => ({
  id,
  name,
  href: `#${id}`,
  children: <Icon strokeWidth={1.75} />,
});

const inner: OrbitSatellite[] = [
  sat('hris', 'HRIS', Building2),
  sat('lab', 'Lab interfaces', Microscope),
  sat('imm', 'Immunization registries', Syringe),
  sat('dot', 'DOT clearinghouse', Truck),
  sat('sso', 'SSO / SCIM', Lock),
];

const outer: OrbitSatellite[] = [
  sat('ehr', 'Hospital EHRs', HeartPulse),
  sat('fhir', 'FHIR / HL7', Database),
  sat('wear', 'Wearables', Activity),
  sat('cloud', 'Cloud storage', Cloud),
  sat('mail', 'Email & SMS', Mail),
  sat('docs', 'e-Signature', FileText),
  sat('tele', 'Telehealth', Stethoscope),
];

const meta: Meta<typeof OrbitRing> = {
  title: 'Components/Images & Media/OrbitRing',
  component: OrbitRing,
  parameters: {
    layout: 'centered',
    meta: componentMeta,
    docs: {
      description: {
        component:
          'Concentric rings of satellite chips orbiting a centre mark at different speeds and ' +
          'directions. Chips counter-rotate so logos stay upright; hovering or focusing any chip ' +
          'pauses the whole system and reveals its name. Sizes are container-relative (`cqmin`), so ' +
          'it scales with `size`. Respects `prefers-reduced-motion` (rings hold still).',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    rings: { control: false },
    center: { control: false },
    glow: { control: 'boolean' },
    pauseOnHover: { control: 'boolean' },
    size: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    center: <Sun strokeWidth={1.5} />,
    rings: [
      { radius: 0.26, satellites: inner },
      { radius: 0.4, satellites: outer, offsetDeg: 15 },
    ],
  },
};

/** Faster, three rings, lettermarks instead of icons. */
export const ThreeRings: Story = {
  args: {
    size: '520px',
    centerSize: 0.16,
    chipSize: 0.1,
    center: <span className="text-primary-800 text-2xl font-bold">MIE</span>,
    rings: [
      {
        radius: 0.2,
        durationSec: 40,
        satellites: inner
          .slice(0, 3)
          .map((s) => ({ ...s, children: undefined })),
      },
      {
        radius: 0.32,
        durationSec: 60,
        satellites: inner
          .slice(3)
          .concat(outer.slice(0, 3))
          .map((s) => ({ ...s, children: undefined })),
      },
      {
        radius: 0.44,
        durationSec: 90,
        satellites: outer.slice(3).map((s) => ({ ...s, children: undefined })),
        dashed: true,
      },
    ],
  },
};
