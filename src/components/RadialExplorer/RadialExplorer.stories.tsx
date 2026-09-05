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
  title: 'Components/Navigation/RadialExplorer',
  component: RadialExplorer,
  parameters: {
    layout: 'padded',
    meta: componentMeta,
    docs: {
      description: {
        component:
          'A radial product explorer: a centre mark with icon tiles orbiting it, a glowing tracer ray ' +
          "from the core to the active tile, tab dots, and a detail panel showing the active spoke's " +
          'media, copy and CTAs (with a welcome state before any pick). Auto-advances gently until the ' +
          'visitor hovers, focuses or taps; skipped under `prefers-reduced-motion`. Below `lg` the ring ' +
          'becomes a chip grid above the panel. Pair `media` with `VideoCard variant="plate"`.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    spokes: { control: false },
    center: { control: false },
    welcome: { control: false },
    attractMs: { control: { type: 'number', min: 0, step: 100 } },
    eyebrow: { control: 'text' },
    hint: { control: 'text' },
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
