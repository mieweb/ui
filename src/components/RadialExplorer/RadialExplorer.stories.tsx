import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  BarChart3,
  FileText,
  ShieldCheck,
  Sparkles,
  Sun,
  Syringe,
  Users,
} from 'lucide-react';
import { RadialExplorer, type RadialSpoke } from './RadialExplorer';
import { VideoCard } from '../VideoCard';
import type { ComponentMeta } from '../../docs/component-meta';

const componentMeta: ComponentMeta = {
  usedIn: [
    {
      repo: 'mieweb/enterprise-health-frontdoor',
      live: 'https://concept.enterprise.health/',
      note: 'The hero "Explore the platform" HUD — opened from the beacon on the hero photo.',
    },
  ],
  origin: {
    repo: 'mieweb/enterprise-health-frontdoor',
    note: 'Ported from components/sections/HeroHud.tsx (ring, ray, dots, detail panel, attract loop). The beacon opener and frosted scrim stay page-level.',
  },
};

const plate = (title: string, duration: string) => (
  <VideoCard
    title={title}
    href="#video"
    youtubeId="aqz-KE-bpKQ"
    duration={duration}
    variant="plate"
    preview={false}
  />
);

const spokes: RadialSpoke[] = [
  {
    id: 'ehr',
    label: 'Certified EHR',
    icon: <FileText />,
    tag: 'Certified EHR',
    title: 'One ONC-certified record for the workforce',
    description:
      'Occupational health, employee health, compliance and surveillance on a single governed chart.',
    media: plate('Certified EHR tour', '3:10'),
    caption: 'Platform tour · 3:10',
    cta: { label: 'Request a demo', href: '#demo' },
    href: '#ehr',
  },
  {
    id: 'ai',
    label: 'Ozwell AI',
    icon: <Sparkles />,
    title: 'Ozwell AI',
    description:
      'Automates documentation and surveillance to expand clinician capacity — native to the platform, not bolted on.',
    media: plate('Ozwell AI in the exam room', '2:44'),
    caption: 'AI Medical Assistant, powered by Ozwell.ai',
    cta: { label: 'Request a demo', href: '#demo' },
    href: '#ai',
  },
  {
    id: 'compliance',
    label: 'Compliance',
    icon: <ShieldCheck />,
    description:
      'OSHA, DOT, ISO 45001 and state mandates tracked to the individual, with audit-ready evidence.',
    media: plate('Compliance walkthrough', '4:02'),
    cta: { label: 'Request a demo', href: '#demo' },
    href: '#compliance',
  },
  {
    id: 'immunization',
    label: 'Immunization',
    icon: <Syringe />,
    description:
      'Clinics, consent, lot tracking and registry submission across every site.',
    media: plate('Immunization module', '2:15'),
    cta: { label: 'Request a demo', href: '#demo' },
    href: '#immunization',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: <BarChart3 />,
    description:
      'Population dashboards and benchmark reports on top of the governed record.',
    media: plate('Analytics overview', '1:58'),
    cta: { label: 'Request a demo', href: '#demo' },
    href: '#analytics',
  },
  {
    id: 'portal',
    label: 'Portal',
    icon: <Users />,
    description:
      'Self-service scheduling, forms and results for every employee.',
    media: plate('Employee portal', '1:40'),
    cta: { label: 'Request a demo', href: '#demo' },
    href: '#portal',
  },
];

const meta: Meta<typeof RadialExplorer> = {
  id: 'showcase-radialexplorer',
  title: 'Components/Showcase/RadialExplorer',
  component: RadialExplorer,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:experimental'],
  parameters: {
    layout: 'padded',
    meta: componentMeta,
    docs: {
      description: {
        component: `### What it's for

A radial product explorer for hero sections: a centre mark with icon tiles orbiting it, a glowing tracer ray from the core to the active tile, selector dots, and a detail panel showing the active spoke's media, copy and CTAs (with a \`welcome\` state before any pick). Auto-advances gently (\`attractMs\`, default 2200ms) until the visitor hovers, focuses or taps. Below \`lg\` the ring becomes a chip grid above the panel.

### Use it when

- A front door's hero should let visitors **preview each module/product area** in place — one tile per spoke, media and CTA per pick.
- You want an attract loop that quietly cycles the content until someone engages.

### Don't use it when

- Users navigate to the sections rather than preview them — \`MegaMenu\` or plain links; orbital position carries no meaning.
- The content is comparative or dense — \`Tabs\` or a \`Card\` grid reads better than a ring.
- Purely decorative orbiting logos with no detail panel — \`OrbitRing\`.

### Example

\`\`\`tsx
<RadialExplorer
  eyebrow="Explore the platform"
  center={<img src="/mark.svg" alt="" />}
  spokes={[{
    id: 'ehr', label: 'Certified EHR', icon: <FileText />, description: '…',
    media: <VideoCard variant="plate" title="EHR tour" youtubeId="…" duration="2:44" />,
    cta: { label: 'Request a demo', href: '/demo/' }, href: '/platform/ehr/',
  }]}
  onActiveChange={(id) => track('spoke', id)} // uncontrolled by default; pass activeId to control
/>
\`\`\`

### Limitations

- Accessibility: spoke tiles, mobile chips and the selector dots are ordinary buttons with \`aria-pressed\` + \`aria-label\` inside labelled \`role="group"\`s (\`groupLabel\`, default "Modules"); the detail panel announces picks via \`aria-live="polite"\` once the visitor engages.
- The attract loop is skipped under \`prefers-reduced-motion\` and stops permanently on first interaction; pass \`attractMs={0}\` to disable it.
- Spoke placement is trigonometric (physical transforms, rotationally symmetric) — exempt from RTL mirroring by design.
- i18n: the default \`hint\` ("Hover a module to preview") and \`groupLabel\` ("Modules") are English — both are props.
- Theming: the tracer ray and active dot use \`--mieweb-accent\`, falling back to primary tokens for brands without an accent.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'composes with',
          target: 'media-videocard',
          why: 'The detail panel\'s `media` slot pairs with `VideoCard variant="plate"` for a video preview per spoke.',
        },
      ],
    },
  },
  argTypes: {
    spokes: {
      control: false,
      description:
        'One tile per spoke: id, label, icon, description, media, cta, href.',
    },
    center: {
      control: false,
      description: 'Centre node — a brand mark or product tile.',
    },
    welcome: {
      control: false,
      description: 'Detail-panel content before any spoke is chosen.',
    },
    attractMs: {
      control: { type: 'number', min: 0, step: 100 },
      description:
        'Auto-advance interval until the visitor engages; 0 disables.',
    },
    eyebrow: {
      control: 'text',
      description: 'Small caps label over the explorer.',
    },
    hint: {
      control: 'text',
      description: 'Hint under the ring while unengaged.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    eyebrow: 'Explore the platform',
    center: <Sun strokeWidth={1.5} />,
    spokes,
    welcome: {
      tag: 'The platform',
      title: 'The certified center of gravity for workforce health',
      description:
        'Hover a module to preview it, or request a walkthrough mapped to your programs.',
      cta: { label: 'Request a demo', href: '#demo' },
    },
  },
};

/** No attract loop; starts on a chosen spoke. */
export const Static: Story = {
  args: {
    ...Default.args,
    attractMs: 0,
    defaultActiveId: 'ai',
    hint: undefined,
  },
};
