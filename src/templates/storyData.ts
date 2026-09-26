// Shared fixtures for the Templates stories. Figures are illustrative, not claims.
import type { LandingBlock } from '../components/LandingPage';
import type { FaqItem } from '../components/FaqSection';
import type { FeatureItem } from '../components/FeatureGridSection';
import type { LogoItem } from '../components/LogoCloudSection';
import type { ProcessStep } from '../components/ProcessStepsSection';
import type { ResourceItem } from '../components/ResourceCardsSection';
import type { StatItem } from '../components/StatsSection';
import type { TestimonialItem } from '../components/TestimonialSection';
import type { ComparisonRow } from '../components/ComparisonSection';
import type { PricingPlan } from '../components/PricingSection';
import type { VideoSource } from '../components/VideoSection';
import type { ComponentMeta } from '../docs/component-meta';
import type { TemplateImage } from './types';

const siteRepos = {
  bluehive: 'bluehive-health/bluehive-marketing',
  eh: 'mieweb/enterprise-health-frontdoor',
} as const;

/** "In production" provenance: the site whose version this section mainly follows. */
export const templateOrigin = (
  site: keyof typeof siteRepos,
  note: string
): ComponentMeta => ({ origin: { repo: siteRepos[site], note } });

export const dashboardImage: TemplateImage = {
  src: '/dashboard-preview.png',
  alt: 'Workforce health dashboard showing clearance status by site',
  width: 1280,
  height: 800,
};

export const features: FeatureItem[] = [
  {
    icon: 'shield-check',
    title: 'Clearance in one place',
    description:
      'Exams, drug screens and immunizations roll up to a single fit-for-duty status per worker.',
  },
  {
    icon: 'calendar-check',
    title: 'Deadlines that surface themselves',
    description:
      'Recertifications and surveillance exams are scheduled before they lapse, not after.',
  },
  {
    icon: 'map-pin',
    title: 'A clinic network that fits',
    description:
      'Send workers to vetted clinics near each job site and track every visit to results.',
  },
  {
    icon: 'chart-column',
    title: 'Audit-ready reporting',
    description:
      'Export the records an inspector asks for in minutes instead of rebuilding them by hand.',
  },
  {
    icon: 'plug',
    title: 'Connects to your HRIS',
    description:
      'New hires and terminations sync automatically, so the roster is never stale.',
  },
  {
    icon: 'EHR',
    title: 'A real medical record',
    description:
      'Clinicians chart in a full occupational EHR, not a form bolted onto a spreadsheet.',
  },
];

export const steps: ProcessStep[] = [
  {
    title: 'Connect your roster',
    description: 'Import workers or sync them from your HRIS in minutes.',
  },
  {
    title: 'Order services',
    description:
      'Pick exams and screens per role; workers get directions by text.',
  },
  {
    title: 'Track results',
    description:
      'Watch each order move from scheduled to cleared in real time.',
  },
  {
    title: 'Stay compliant',
    description: 'Renewals are queued automatically before anything expires.',
  },
];

export const stats: StatItem[] = [
  { value: 4200, suffix: '+', label: 'Clinics in network' },
  { value: 48, suffix: 'h', label: 'Typical time to clearance' },
  { value: 30, suffix: '%', label: 'Less admin time', trend: 'down' },
  { value: '24/7', label: 'Results access' },
];

export const logos: LogoItem[] = [
  'adp',
  'bamboohr',
  'gusto',
  'paychex',
  'paylocity',
  'rippling',
  'workday',
  'ukg',
].map((id) => ({
  name: id === 'ukg' ? 'UKG' : id.charAt(0).toUpperCase() + id.slice(1),
  src: `/hris-logos/${id}.svg`,
}));

export const testimonials: TestimonialItem[] = [
  {
    quote:
      'We used to chase clinics by phone for every result. Now the status is just there when a supervisor asks.',
    author: 'Dana Whitfield',
    role: 'Safety Director',
    company: 'Regional construction firm',
    rating: 5,
  },
  {
    quote:
      'Our DOT physicals and drug screens finally live in one record, and the renewal reminders go out on their own.',
    author: 'Marcus Lee',
    role: 'Fleet Compliance Manager',
    company: 'Logistics carrier',
    rating: 5,
  },
  {
    quote:
      'Onboarding a new site took an afternoon. The clinic network already covered it.',
    author: 'Priya Raman',
    role: 'HR Operations Lead',
    company: 'Manufacturer',
    rating: 4,
  },
];

export const faqs: FaqItem[] = [
  {
    id: 'faq-setup',
    question: 'How long does setup take?',
    answer:
      'Most teams place their first order the same day. Connecting an HRIS adds about an hour.',
  },
  {
    id: 'faq-clinics',
    question: 'Can we keep the clinics we already use?',
    answer:
      'Yes. Add your existing clinics alongside the network and route workers to either.',
  },
  {
    id: 'faq-records',
    question: 'Who can see medical results?',
    answer:
      'Employers see fit-for-duty status only.\nClinical detail stays with authorised clinicians.',
  },
];

export const comparisonColumns = [
  'Spreadsheets & phone calls',
  'With the platform',
];

export const comparisonRows: ComparisonRow[] = [
  { feature: 'Order an exam', values: ['Call the clinic', 'Two clicks'] },
  { feature: 'Real-time result status', values: [false, true] },
  { feature: 'Automatic renewal reminders', values: [false, true] },
  { feature: 'Audit export', values: ['Days of rework', 'Minutes'] },
  { feature: 'HRIS roster sync', values: [false, true] },
];

export const resources: ResourceItem[] = [
  {
    kind: 'Guide',
    title: 'Building a fit-for-duty program from scratch',
    href: '#guide',
    excerpt:
      'The roles, services and renewal cadences most programs start with — and what to add later.',
    meta: '12 min read',
    image: dashboardImage,
  },
  {
    kind: 'Checklist',
    title: 'Preparing for an OSHA recordkeeping audit',
    href: '#checklist',
    excerpt:
      'Everything an inspector is likely to ask for, in the order they ask.',
    meta: 'Printable PDF',
  },
  {
    kind: 'Case study',
    title: 'How a 40-site carrier cut clearance time in half',
    href: '#case-study',
    excerpt: 'Moving DOT physicals and drug screens onto one record.',
    meta: '6 min read',
  },
];

// Nothing loads until play (`preload="none"`), so stories and visual tests stay offline.
export const productTour: VideoSource = {
  title: 'Product tour (2 min)',
  src: '/templates/product-tour.mp4',
  poster: '/dashboard-preview.png',
  captions: {
    src: '/templates/product-tour.vtt',
    srcLang: 'en',
    label: 'English',
  },
};

export const plans: PricingPlan[] = [
  {
    name: 'Starter',
    price: '$0',
    period: 'platform fee',
    description: 'Pay per service for small teams getting started.',
    features: [
      'Order exams and screens',
      'Nationwide clinic network',
      'Email support',
    ],
    cta: { label: 'Start free', href: '#start', trackingId: 'pricing-starter' },
  },
  {
    name: 'Growth',
    price: '$6',
    period: 'per employee / month',
    description: 'Automated renewals and HRIS sync for growing programs.',
    features: [
      'Everything in Starter',
      'HRIS roster sync',
      'Automatic renewal reminders',
      'Audit-ready exports',
    ],
    cta: { label: 'Book a demo', href: '#demo', trackingId: 'pricing-growth' },
    highlighted: true,
    badge: 'Most popular',
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'Multi-site programs with an embedded occupational EHR.',
    features: [
      'Everything in Growth',
      'Occupational EHR',
      'SSO / SCIM',
      'Dedicated success manager',
    ],
    cta: {
      label: 'Talk to sales',
      href: '#sales',
      trackingId: 'pricing-enterprise',
    },
  },
];

const hero = {
  type: 'hero',
  eyebrow: 'Construction',
  title: 'Keep every crew cleared to work',
  description:
    'Exams, drug screens and certifications for every job site — ordered, tracked and renewed in one place.',
  primaryCta: { label: 'Book a demo', href: '#demo' },
  secondaryCta: { label: 'See pricing', href: '#pricing' },
  highlights: [
    'No setup fees',
    'Nationwide clinic network',
    'Results in real time',
  ],
  breadcrumbs: [
    { label: 'Home', href: '#home' },
    { label: 'Industries', href: '#industries' },
    { label: 'Construction', href: '#construction' },
  ],
} satisfies LandingBlock;

const cta = {
  type: 'cta',
  title: 'See it with your own roster',
  description: 'A 20-minute walkthrough using your roles and sites.',
  primaryCta: { label: 'Book a demo', href: '#demo' },
  secondaryCta: { label: 'Talk to sales', href: '#sales' },
} satisfies LandingBlock;

export const verticalHubBlocks: LandingBlock[] = [
  { ...hero, variant: 'split', image: dashboardImage },
  {
    type: 'logos',
    eyebrow: 'Connects to the HR systems you already run',
    logos,
    variant: 'marquee',
  },
  {
    type: 'features',
    id: 'capabilities',
    eyebrow: 'Capabilities',
    title: 'Built for crews that move between sites',
    description:
      'Everything a safety team needs to prove every worker is cleared.',
    features,
  },
  {
    type: 'split',
    eyebrow: 'System of record',
    title: 'One record per worker, across every site',
    description:
      'Stop reconciling clinic faxes with a spreadsheet. Results land on the worker record the moment they are final.',
    bullets: [
      'Fit-for-duty status per role and site',
      'Full audit trail on every change',
      'Role-based access for supervisors and clinicians',
    ],
    image: dashboardImage,
    primaryCta: { label: 'Explore the platform', href: '#platform' },
    tone: 'muted',
  },
  { type: 'stats', title: 'What teams see in the first year', stats },
  { type: 'process', title: 'Live in four steps', steps, tone: 'muted' },
  { type: 'testimonials', title: 'Safety teams on the switch', testimonials },
  {
    type: 'resources',
    title: 'Resources for construction safety teams',
    items: resources,
    viewAll: { label: 'All resources', href: '#resources' },
    tone: 'muted',
  },
  { type: 'faq', id: 'faq', title: 'Frequently asked questions', items: faqs },
  cta,
];

export const serviceDetailBlocks: LandingBlock[] = [
  {
    type: 'hero',
    eyebrow: 'Services',
    title: 'DOT physicals without the phone tag',
    description:
      'Schedule, track and file DOT physicals for every driver from one screen.',
    primaryCta: { label: 'Order a physical', href: '#order' },
    secondaryCta: { label: 'Talk to sales', href: '#sales' },
    ctaNote: 'Pay per exam. No contract.',
  },
  {
    type: 'features',
    title: 'What is included',
    features: features.slice(0, 3),
    columns: 3,
  },
  {
    type: 'video',
    title: 'See an order from start to clearance',
    video: productTour,
    caption: 'Two-minute walkthrough.',
  },
  { type: 'process', title: 'How it works', steps, tone: 'muted' },
  {
    type: 'comparison',
    title: 'Before and after',
    columns: comparisonColumns,
    rows: comparisonRows,
    highlightColumn: 1,
  },
  {
    type: 'faq',
    title: 'Questions about DOT physicals',
    items: faqs,
    tone: 'muted',
  },
  cta,
];

export const campaignBlocks: LandingBlock[] = [
  {
    type: 'hero',
    eyebrow: 'For Acme Logistics',
    title: 'A clearance program built around your 40 terminals',
    description:
      'We mapped our clinic network to your terminal list. Here is what the first 90 days look like.',
    primaryCta: { label: 'Get your rollout plan', href: '#plan' },
    tone: 'brand',
  },
  { type: 'logos', eyebrow: 'Works with your HRIS', logos },
  {
    type: 'features',
    title: 'Why it fits your operation',
    features: features.slice(0, 4),
    columns: 2,
  },
  { type: 'stats', stats, variant: 'cards', tone: 'muted' },
  {
    type: 'testimonials',
    testimonials: testimonials.slice(1, 2),
    variant: 'featured',
  },
  {
    type: 'lead-form',
    id: 'plan',
    eyebrow: 'Next step',
    title: 'Get your terminal-by-terminal rollout plan',
    description:
      'A specialist builds it from your terminal list within one business day.',
    action: '#submitted',
    hiddenFields: { source: 'abm-acme-logistics' },
    submitLabel: 'Send my plan',
    note: 'We use your details only to prepare the plan. No mailing list.',
  },
  { type: 'faq', title: 'Common questions', items: faqs },
];

export const comparisonBlocks: LandingBlock[] = [
  {
    type: 'hero',
    eyebrow: 'Compare',
    title: 'The platform vs. spreadsheets and phone calls',
    description:
      'What changes when orders, results and renewals share one record.',
    primaryCta: { label: 'Book a demo', href: '#demo' },
  },
  {
    type: 'comparison',
    columns: comparisonColumns,
    rows: comparisonRows,
    highlightColumn: 1,
  },
  {
    type: 'features',
    title: 'What you gain',
    features: features.slice(3),
    tone: 'muted',
  },
  { type: 'testimonials', title: 'Teams that switched', testimonials },
  { type: 'faq', title: 'Switching questions', items: faqs, tone: 'muted' },
  cta,
];

export const resourceBlocks: LandingBlock[] = [
  {
    type: 'hero',
    eyebrow: 'Free guide',
    title: 'The fit-for-duty program playbook',
    description:
      'The roles, services and renewal cadences to start with, and how to scale past the first site.',
    primaryCta: { label: 'Get the guide', href: '#download' },
  },
  {
    type: 'split',
    title: 'What is inside',
    bullets: [
      'A role-by-role service matrix you can copy',
      'Renewal cadences for common certifications',
      'A 30-60-90 day rollout plan',
    ],
    image: dashboardImage,
    mediaPosition: 'start',
  },
  {
    type: 'lead-form',
    id: 'download',
    title: 'Send me the playbook',
    action: '#submitted',
    layout: 'stacked',
    submitLabel: 'Email me the guide',
    tone: 'muted',
  },
  {
    type: 'resources',
    title: 'Keep reading',
    items: resources.slice(1),
    columns: 2,
  },
  { type: 'faq', title: 'About the guide', items: faqs.slice(0, 2) },
];

export const pricingBlocks: LandingBlock[] = [
  {
    type: 'hero',
    eyebrow: 'Pricing',
    title: 'Pay for the program you run',
    description: 'Start free and add automation as your roster grows.',
  },
  {
    type: 'pricing',
    plans,
    note: 'Service fees (exams, screens) are billed at clinic rates.',
  },
  {
    type: 'comparison',
    title: 'Compare plans',
    columns: ['Starter', 'Growth', 'Enterprise'],
    highlightColumn: 1,
    rows: [
      { feature: 'Clinic network', values: [true, true, true] },
      { feature: 'HRIS roster sync', values: [false, true, true] },
      { feature: 'Occupational EHR', values: [false, false, true] },
      { feature: 'Support', values: ['Email', 'Email + chat', 'Dedicated'] },
    ],
    tone: 'muted',
  },
  { type: 'faq', title: 'Pricing questions', items: faqs },
  cta,
];
