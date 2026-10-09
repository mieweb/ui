// Illustrative deck for the Deck stories — one slide of every built-in type. Figures are made up.
import type { DeckMeta, Slide } from './types';

export const sampleDeckMeta: DeckMeta = {
  title: 'Quarterly Growth Review',
  period: 'Q2 2026',
};

export const sampleDeck: Slide[] = [
  {
    type: 'cover',
    eyebrow: 'Quarterly review',
    title: 'Growth Review',
    subtitle: 'What moved this quarter, and why.',
    dateline: 'Q2 2026',
    preparedBy: 'Growth team',
    highlights: [
      { value: '48%', label: 'More sessions' },
      { value: '1,240', label: 'New accounts' },
      { value: '3.2x', label: 'Organic reach' },
    ],
  },
  { type: 'table-of-contents', title: 'In this review' },
  {
    type: 'metrics',
    section: 'Results',
    eyebrow: 'Headline results',
    title: 'The quarter in four numbers',
    metrics: [
      {
        icon: 'trending-up',
        value: '48%',
        label: 'Sessions',
        description: 'Quarter over quarter',
      },
      {
        icon: 'users',
        value: '1,240',
        label: 'New accounts',
        accent: 'primary',
      },
      { icon: 'target', value: '6.1%', label: 'Conversion', accent: 'success' },
      { icon: 'globe', value: '32', label: 'New markets', accent: 'secondary' },
    ],
  },
  {
    type: 'chart',
    section: 'Results',
    title: 'Monthly sessions',
    subtitle: 'The relaunch shipped in March.',
    graphic: {
      type: 'bar',
      yAxisLabel: 'Sessions (thousands)',
      marker: { atIndex: 2, label: 'Launch' },
      bars: [
        { label: 'Jan', value: 41 },
        { label: 'Feb', value: 44 },
        { label: 'Mar', value: 58, highlight: true },
        { label: 'Apr', value: 66, highlight: true },
        { label: 'May', value: 71, highlight: true },
        { label: 'Jun', value: 79, highlight: true },
      ],
    },
  },
  {
    type: 'feature-highlight',
    section: 'Results',
    eyebrow: 'Search',
    title: 'Search found us',
    body: 'Rewritten service pages now rank for the terms buyers use.',
    stat: { value: '3.2x', label: 'Organic impressions' },
    bullets: [
      '214 pages rewritten',
      'Structured data on every service',
      'Core Web Vitals green',
    ],
    graphic: {
      type: 'multi-line',
      xLabels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      series: [
        {
          label: 'Impressions',
          values: [120000, 130000, 210000, 280000, 330000, 390000],
          summary: '120K → 390K',
        },
        {
          label: 'Clicks',
          values: [3100, 3300, 5200, 7100, 8200, 9600],
          summary: '3.1K → 9.6K',
        },
        {
          label: 'Orders',
          values: [140, 150, 190, 240, 260, 300],
          summary: '140 → 300',
        },
      ],
      caption: 'Log scale: each series keeps its raw values.',
    },
  },
  {
    type: 'comparison-table',
    section: 'Results',
    title: 'Before and after',
    rows: [
      {
        label: 'Monthly sessions',
        before: '41K',
        after: '79K',
        change: '+93%',
      },
      { label: 'Bounce rate', before: '61%', after: '44%', change: '−17 pts' },
      {
        label: 'Avg. time on page',
        before: '0:48',
        after: '1:32',
        change: '+92%',
      },
    ],
  },
  {
    type: 'ranked-list',
    section: 'Results',
    title: 'Top pages',
    entries: [
      {
        label: 'DOT physicals',
        sublabel: '/services/dot',
        value: 18400,
        secondary: '11.2K users',
        highlighted: true,
      },
      {
        label: 'Drug testing',
        sublabel: '/services/drug-testing',
        value: 14100,
        secondary: '9.1K users',
      },
      {
        label: 'Locations',
        sublabel: '/locations',
        value: 9800,
        secondary: '7.4K users',
        change: 3,
      },
      {
        label: 'Pricing',
        sublabel: '/pricing',
        value: 6100,
        secondary: '4.8K users',
        change: -1,
      },
    ],
  },
  {
    type: 'breakdown',
    section: 'Pipeline',
    title: 'Employer signups',
    body: 'Self-serve signups tripled after the new onboarding flow.',
    callout: { value: '312', label: 'signups this quarter' },
    series: {
      type: 'bar',
      bars: [
        { label: 'Apr', value: 84, highlight: true },
        { label: 'May', value: 102, highlight: true },
        { label: 'Jun', value: 126, highlight: true },
      ],
    },
    breakdown: [
      { label: 'Construction', count: 88 },
      { label: 'Transportation', count: 71 },
      { label: 'Manufacturing', count: 64 },
      { label: 'Other', count: 89 },
    ],
    entries: [
      {
        title: 'Acme Freight',
        meta: 'Transportation · 250 employees',
        date: 'Jun 28',
      },
      {
        title: 'Northwind Builders',
        meta: 'Construction · 80 employees',
        date: 'Jun 26',
      },
    ],
  },
  {
    type: 'cycle',
    section: 'Pipeline',
    title: 'The flywheel',
    body: 'More providers bring more employers, whose orders bring more providers.',
    talkingPoint: 'Every turn of the wheel lowers the cost of the next.',
    nodes: [
      { label: 'Providers', metric: '4.2K', icon: 'stethoscope' },
      { label: 'Coverage', metric: '50 states', icon: 'map-pin' },
      { label: 'Employers', metric: '1,240', icon: 'building' },
      { label: 'Orders', metric: '18K', icon: 'clipboard-check' },
    ],
  },
  {
    type: 'cards',
    section: 'Pipeline',
    title: 'Three bets for next quarter',
    cards: [
      {
        title: 'Self-serve pricing',
        body: 'Publish prices for the top ten services.',
        stat: '+20%',
        statLabel: 'Expected conversion',
      },
      {
        title: 'Partner API',
        body: 'Let HR platforms order directly.',
        stat: '6',
        statLabel: 'Partners in pilot',
      },
      {
        title: 'Rural coverage',
        body: 'Recruit mobile providers in underserved states.',
        stat: '18',
        statLabel: 'Target states',
      },
    ],
  },
  {
    type: 'impact-table',
    section: 'Pipeline',
    title: 'Where the budget went',
    rows: [
      {
        item: 'Content rewrite',
        detail: '214 pages',
        impact: '3.2x organic impressions',
      },
      { item: 'Onboarding flow', detail: '6 weeks', impact: 'Signups tripled' },
    ],
  },
  {
    type: 'tabs',
    section: 'By month',
    title: 'Month by month',
    tabs: [
      {
        label: 'April',
        slide: {
          type: 'metrics',
          title: 'April',
          metrics: [
            { value: '66K', label: 'Sessions' },
            { value: '84', label: 'Signups' },
          ],
        },
      },
      {
        label: 'May',
        slide: {
          type: 'metrics',
          title: 'May',
          metrics: [
            { value: '71K', label: 'Sessions' },
            { value: '102', label: 'Signups' },
          ],
        },
      },
      {
        label: 'June',
        slide: {
          type: 'metrics',
          title: 'June',
          metrics: [
            { value: '79K', label: 'Sessions' },
            { value: '126', label: 'Signups' },
          ],
        },
      },
    ],
  },
  {
    type: 'section-divider',
    section: 'Strategy',
    eyebrow: 'Part two',
    statement: '10 minutes',
    title: 'From order to appointment',
    description: 'The next goal: every worker booked in under ten minutes.',
  },
  {
    type: 'bullet-list',
    section: 'Strategy',
    title: 'What we learned',
    items: [
      { lead: 'Clarity wins —', text: 'plain prices beat clever copy.' },
      {
        lead: 'Speed matters —',
        text: 'every second of load time cost signups.',
        children: [{ text: 'LCP fell from 3.4s to 1.6s' }],
      },
      'Buyers read the FAQ before they call.',
    ],
  },
  {
    type: 'quote',
    section: 'Strategy',
    quote: 'We booked forty drivers in one afternoon.',
    attribution: 'Safety director',
    role: 'Regional carrier (sample)',
  },
  {
    type: 'definition-list',
    section: 'Strategy',
    title: 'How we judge AI features',
    terms: [
      { term: 'Fair', definition: 'Outcomes don’t differ by group.' },
      {
        term: 'Appropriate',
        definition: 'Used only where it helps the decision.',
      },
      { term: 'Valid', definition: 'Accurate on our own data.' },
    ],
  },
  {
    type: 'roadmap',
    section: 'Strategy',
    title: 'Roadmap',
    items: [
      {
        title: 'Self-serve pricing',
        status: 'now',
        icon: 'dollar-sign',
        children: ['Top ten services', 'State ranges'],
      },
      { title: 'Partner API', status: 'next', icon: 'workflow' },
      { title: 'Rural coverage', status: 'later', icon: 'map-pin' },
    ],
  },
  {
    type: 'adoption-curve',
    section: 'Strategy',
    title: 'Where the market is',
    segments: [
      { label: 'Innovators', pct: '3%' },
      { label: 'Early adopters', pct: '13%' },
      { label: 'Early majority', pct: '34%' },
      { label: 'Late majority', pct: '34%' },
      { label: 'Laggards', pct: '16%' },
    ],
    marker: { label: 'We are here', atPct: 22 },
    annotations: [{ text: 'The chasm', atPct: 16, emphasis: true }],
  },
  {
    type: 'diagram',
    section: 'Platform',
    title: 'How an order flows',
    nodes: [
      { id: 'employer', label: 'Employer', x: 12, y: 50, icon: 'building' },
      {
        id: 'platform',
        label: 'Platform',
        x: 50,
        y: 50,
        icon: 'layers',
        accent: 'accent',
      },
      { id: 'clinic', label: 'Clinic', x: 88, y: 25, icon: 'stethoscope' },
      { id: 'lab', label: 'Lab', x: 88, y: 75, icon: 'flask' },
    ],
    edges: [
      { from: 'employer', to: 'platform', label: 'Order', flow: true },
      { from: 'platform', to: 'clinic', flow: true },
      { from: 'platform', to: 'lab', dashed: true, label: 'Results' },
    ],
    boundaries: [{ label: 'Provider network', nodes: ['clinic', 'lab'] }],
    callouts: [
      {
        side: 'right',
        lead: 'Encrypted',
        text: 'Results travel over an encrypted channel.',
      },
    ],
  },
  {
    type: 'certification-grid',
    section: 'Platform',
    title: 'Certified and audited',
    certifications: [
      { name: 'SOC 2 Type II', issuer: 'AICPA', badge: 'SOC' },
      { name: 'HIPAA', issuer: 'HHS', badge: 'HIP' },
      { name: 'ONC Health IT', issuer: 'ONC', badge: 'ONC' },
      { name: 'ISO 27001', issuer: 'ISO', badge: 'ISO' },
    ],
  },
  {
    type: 'showcase',
    section: 'Platform',
    title: 'What shipped',
    total: { value: '120', label: 'improvements' },
    categories: [
      {
        title: 'Search',
        icon: 'search',
        items: [
          'Schema on every page',
          'Faster sitemap',
          'Canonical cleanup',
          'Hreflang',
        ],
      },
      {
        title: 'Content',
        icon: 'file-text',
        items: ['214 pages rewritten', 'New FAQ', 'Pricing guides'],
      },
      {
        title: 'Speed',
        icon: 'zap',
        items: [
          'Image pipeline',
          'Font subsetting',
          'Edge caching',
          'Lazy maps',
          'Fewer scripts',
        ],
      },
    ],
    video: {
      href: '#video',
      title: 'Walkthrough of the new site',
      duration: '4:12',
      speaker: 'Growth team',
    },
  },
  {
    type: 'image',
    section: 'Platform',
    title: 'The new dashboard',
    image: {
      src: '/dashboard-preview.png',
      alt: 'Dashboard showing clearance status by site',
      width: 1280,
      height: 800,
    },
    caption: 'Employers see every worker’s status on one screen.',
  },
  {
    type: 'conclusion',
    title: 'Thank you',
    body: 'Questions and follow-ups welcome.',
    highlights: [
      { value: '48%', label: 'More sessions' },
      { value: '312', label: 'Signups' },
    ],
    takeaways: ['Publish prices', 'Open the API', 'Recruit rural providers'],
    share: {
      url: 'https://example.com/reports/q2-review',
      instructions: 'Share this review with your team:',
    },
    cta: { label: 'Book a follow-up', href: '#follow-up' },
    confidentiality: 'Confidential — internal use only',
  },
];
