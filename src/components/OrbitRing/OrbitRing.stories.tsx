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
  id: 'showcase-orbitring',
  title: 'Components/Showcase/OrbitRing',
  component: OrbitRing,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:experimental'],
  parameters: {
    layout: 'centered',
    meta: componentMeta,
    docs: {
      description: {
        component: `### What it's for

Concentric rings of satellite chips orbiting a centre mark at different speeds and directions. Chips counter-rotate so their logos stay upright; hovering or focusing any chip pauses the whole system and reveals its name. Sizes are container-relative (\`cqmin\`), so everything scales together with \`size\`.

### Use it when

- A hero or "integrations" section shows an **ecosystem** — partners, connectors, modules — orbiting your product mark.
- You want a self-running decorative visual whose items still carry accessible names (each chip has an \`aria-label\`; plain chips render \`role="img"\`).

### Don't use it when

- Users must read, compare or browse the items as content — use a logo wall or a \`Card\` grid instead; orbital position is decorative.
- The items carry data (counts, ordering, status) — reach for the Data display family.

### Example

\`\`\`tsx
<OrbitRing
  center={<Logo />}
  rings={[
    { radius: 0.26, satellites: inner },
    { radius: 0.4, satellites: outer, offsetDeg: 15 },
  ]}
  size="min(72vw, 560px)"
/>
\`\`\`

### Limitations

- A satellite renders as an \`<a>\` with \`href\`, a \`<button>\` with \`onClick\`, or a \`role="img"\` span otherwise — only the first two are keyboard-focusable, and focus pauses the rings and shows the name tooltip, mirroring hover.
- All spin is \`motion-safe\` — under \`prefers-reduced-motion\` the rings hold still.
- Sizing uses container query units (\`cqmin\`), so the component must be allowed to establish its own CSS container.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
    },
  },
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
