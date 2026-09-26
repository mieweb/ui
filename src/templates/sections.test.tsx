import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { HeroSection } from '../components/HeroSection';
import { CtaSection } from '../components/CtaSection';
import { FaqSection } from '../components/FaqSection';
import { ComparisonSection } from '../components/ComparisonSection';
import { LeadFormSection } from '../components/LeadFormSection';
import { LogoCloudSection } from '../components/LogoCloudSection';
import { StatsSection } from '../components/StatsSection';
import { TestimonialSection } from '../components/TestimonialSection';
import { ResourceCardsSection } from '../components/ResourceCardsSection';
import { SplitContentSection } from '../components/SplitContentSection';
import { FeatureGridSection } from '../components/FeatureGridSection';
import { PricingSection } from '../components/PricingSection';
import { VideoSection } from '../components/VideoSection';
import { SectionHeading, SectionShell } from './Section';
import { TemplateIcon } from './icons';
import { dashboardImage } from './storyData';

describe('HeroSection', () => {
  it('renders an h1, CTA anchors and a breadcrumb trail ending in the current page', () => {
    render(
      <HeroSection
        title="Cleared to work"
        primaryCta={{ label: 'Book a demo', href: '/demo/' }}
        secondaryCta={{ label: 'Pricing', href: '/pricing/' }}
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Construction', href: '/industries/construction/' },
        ]}
        labels={{ breadcrumb: 'Fil d’Ariane' }}
      />
    );
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Cleared to work'
    );
    expect(screen.getByRole('link', { name: 'Book a demo' })).toHaveAttribute(
      'href',
      '/demo/'
    );
    const trail = screen.getByRole('navigation', { name: 'Fil d’Ariane' });
    expect(within(trail).getByText('Construction')).toHaveAttribute(
      'aria-current',
      'page'
    );
    expect(within(trail).getAllByRole('link')).toHaveLength(1);
  });

  it('uses the split layout only when there is an image', () => {
    const { container, rerender } = render(
      <HeroSection title="T" variant="split" />
    );
    expect(container.querySelector('.lg\\:grid-cols-2')).toBeNull();
    rerender(
      <HeroSection
        title="T"
        variant="split"
        image={dashboardImage}
        headingLevel="h2"
      />
    );
    expect(container.querySelector('.lg\\:grid-cols-2')).not.toBeNull();
    expect(screen.getByRole('img')).toHaveAttribute('alt', dashboardImage.alt);
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
  });
});

describe('CtaSection', () => {
  it('renders the panel layout on the page background', () => {
    const { container } = render(
      <CtaSection title="Go" layout="panel" tone="muted" note="Small print" />
    );
    expect(container.querySelector('section')).toHaveClass('bg-background');
    expect(container.querySelector('.rounded-3xl')).toHaveClass('bg-muted');
    expect(screen.getByText('Small print')).toBeInTheDocument();
  });
});

describe('FaqSection', () => {
  it('renders each item as a linkable <details>', () => {
    const { container } = render(
      <FaqSection
        title="FAQ"
        items={[{ id: 'q1', question: 'Why?', answer: 'Because.' }]}
      />
    );
    const details = container.querySelector('details#q1');
    expect(details).not.toBeNull();
    expect(details?.querySelector('summary')).toHaveTextContent('Why?');
  });
});

describe('ComparisonSection', () => {
  it('labels boolean cells for screen readers and highlights a column', () => {
    render(
      <ComparisonSection
        title="Compare"
        columns={['Before', 'After']}
        rows={[
          { feature: 'Sync', values: [false, true] },
          { feature: 'Time', values: ['Days', 'Minutes'] },
        ]}
        highlightColumn={1}
        labels={{ included: 'Yes', notIncluded: 'No', feature: 'Capability' }}
      />
    );
    const table = screen.getByRole('table', { name: 'Compare' });
    expect(
      within(table).getByRole('columnheader', { name: 'After' })
    ).toHaveClass('bg-primary-800');
    expect(
      within(table).getByRole('columnheader', { name: 'Capability' })
    ).toBeInTheDocument();
    expect(within(table).getByText('Yes')).toHaveClass('sr-only');
    expect(within(table).getByText('No')).toHaveClass('sr-only');
    expect(
      within(table).getByRole('rowheader', { name: 'Time' })
    ).toBeInTheDocument();
  });
});

describe('LeadFormSection', () => {
  it('labels every field, posts hidden attribution and supports select/textarea', () => {
    const { container } = render(
      <LeadFormSection
        title="Get the plan"
        action="/api/lead"
        hiddenFields={{ source: 'test' }}
        submitLabel="Send"
        note="Privacy"
        layout="stacked"
        fields={[
          { name: 'email', label: 'Email', type: 'email', required: true },
          {
            name: 'size',
            label: 'Size',
            type: 'select',
            options: ['S', 'L'],
            placeholder: 'Pick',
          },
          { name: 'msg', label: 'Message', type: 'textarea' },
        ]}
      />
    );
    const form = screen.getByRole('form', { name: 'Get the plan' });
    expect(form).toHaveAttribute('action', '/api/lead');
    expect(form).toHaveAttribute('method', 'post');
    expect(screen.getByLabelText(/Email/)).toBeRequired();
    expect(screen.getByLabelText('Size').tagName).toBe('SELECT');
    expect(screen.getByLabelText('Message').tagName).toBe('TEXTAREA');
    expect(
      container.querySelector('input[type="hidden"][name="source"]')
    ).toHaveValue('test');
    expect(screen.getByRole('button', { name: 'Send' })).toHaveAttribute(
      'type',
      'submit'
    );
  });

  it('defaults to name, email and company fields', () => {
    render(<LeadFormSection title="Talk to us" action="/lead" />);
    expect(screen.getAllByRole('textbox')).toHaveLength(4);
  });
});

describe('LogoCloudSection', () => {
  it('hides the marquee copy from assistive tech and the tab order', () => {
    const { container } = render(
      <LogoCloudSection
        variant="marquee"
        speed="fast"
        tone="brand"
        logos={[
          { name: 'Acme', src: '/acme.svg', href: '/acme' },
          { name: 'Globex' },
        ]}
      />
    );
    const copies = container.querySelectorAll('[data-duplicate]');
    expect(copies).toHaveLength(2);
    copies.forEach((li) => expect(li).toHaveAttribute('aria-hidden', 'true'));
    expect(copies[0].querySelector('a')).toHaveAttribute('tabindex', '-1');
    expect(screen.getAllByRole('img', { name: 'Acme' })).toHaveLength(1);
  });

  it('renders a wrapping grid by default', () => {
    render(<LogoCloudSection logos={[{ name: 'Acme' }]} />);
    expect(screen.getByText('Acme')).toBeInTheDocument();
  });
});

describe('StatsSection', () => {
  it('formats numbers for the locale and keeps strings as written', () => {
    render(
      <StatsSection
        locale="de-DE"
        variant="cards"
        stats={[
          {
            value: 4200,
            suffix: '+',
            label: 'Clinics',
            trend: 'up',
            description: 'Vetted',
          },
          { value: '24/7', label: 'Access', trend: 'down' },
        ]}
      />
    );
    expect(screen.getByText('4.200+', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('24/7')).toBeInTheDocument();
  });
});

describe('TestimonialSection', () => {
  it('announces ratings from labels and features only the first quote', () => {
    render(
      <TestimonialSection
        variant="featured"
        labels={{ rating: '{rating} sur 5' }}
        testimonials={[
          {
            quote: 'Great',
            author: 'Ana',
            role: 'Lead',
            company: 'Acme',
            rating: 4,
            avatar: '/a.png',
          },
          { quote: 'Also great', author: 'Ben' },
        ]}
      />
    );
    expect(screen.getByText('4 sur 5')).toHaveClass('sr-only');
    expect(screen.getByText('Lead, Acme')).toBeInTheDocument();
    expect(screen.queryByText('Ben')).toBeNull();
  });
});

describe('ResourceCardsSection', () => {
  it('stretches one link over each card and renders the view-all link', () => {
    render(
      <ResourceCardsSection
        align="center"
        columns={2}
        items={[
          {
            title: 'Guide',
            href: '/g',
            excerpt: 'E',
            kind: 'Guide',
            meta: '5 min',
            image: dashboardImage,
          },
        ]}
        viewAll={{ label: 'All', href: '/all' }}
      />
    );
    expect(screen.getByRole('link', { name: 'Guide' })).toHaveAttribute(
      'href',
      '/g'
    );
    expect(screen.getByRole('link', { name: 'All' })).toHaveAttribute(
      'href',
      '/all'
    );
  });
});

describe('SplitContentSection', () => {
  it('captions the image and places it first when asked', () => {
    const { container } = render(
      <SplitContentSection
        title="One record"
        image={dashboardImage}
        caption="Caption"
        bullets={['A']}
        mediaPosition="start"
        tone="brand"
      />
    );
    expect(container.querySelector('figure')).toHaveClass('lg:order-first');
    expect(screen.getByText('Caption').tagName).toBe('FIGCAPTION');
  });
});

describe('FeatureGridSection', () => {
  it('renders tags, links and plain items', () => {
    render(
      <FeatureGridSection
        variant="plain"
        columns={4}
        tone="brand"
        features={[
          {
            title: 'A',
            description: 'a',
            tag: 'Tag',
            link: { label: 'More', href: '/m' },
          },
        ]}
      />
    );
    expect(
      screen.getByRole('heading', { level: 3, name: 'A' })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'More' })).toHaveAttribute(
      'href',
      '/m'
    );
  });
});

describe('PricingSection', () => {
  it('highlights one plan with its badge and links each CTA', () => {
    render(
      <PricingSection
        title="Plans"
        tone="brand"
        note="Small print"
        plans={[
          {
            name: 'Starter',
            price: '$0',
            features: ['A'],
            cta: { label: 'Start', href: '/start' },
          },
          {
            name: 'Growth',
            price: '$6',
            period: 'per seat',
            description: 'D',
            features: ['A', 'B'],
            cta: { label: 'Demo', href: '/demo' },
            highlighted: true,
            badge: 'Popular',
          },
        ]}
      />
    );
    expect(screen.getByText('Popular')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 3, name: 'Growth' })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Demo' })).toHaveClass('bg-white');
    expect(screen.getByRole('link', { name: 'Start' })).toHaveClass(
      'text-white'
    );
    expect(screen.getByText('Small print')).toBeInTheDocument();
  });

  it('centres a single plan', () => {
    const { container } = render(
      <PricingSection plans={[{ name: 'Only', price: '$1', features: [] }]} />
    );
    expect(container.querySelector('ul')).toHaveClass('max-w-md');
  });
});

describe('VideoSection', () => {
  it('embeds YouTube without cookies and titles the frame', () => {
    render(
      <VideoSection
        video={{ title: 'Tour', youtubeId: 'abc 123' }}
        caption="Cap"
      />
    );
    const frame = screen.getByTitle('Tour');
    expect(frame.tagName).toBe('IFRAME');
    expect(frame).toHaveAttribute(
      'src',
      'https://www.youtube-nocookie.com/embed/abc%20123'
    );
    expect(screen.getByText('Cap').tagName).toBe('FIGCAPTION');
  });

  it('plays self-hosted files natively with captions', () => {
    const { container } = render(
      <VideoSection
        video={{
          title: 'Tour',
          src: '/tour.mp4',
          poster: '/p.png',
          captions: { src: '/tour.vtt', srcLang: 'en', label: 'English' },
        }}
      />
    );
    expect(container.querySelector('video')).toHaveAttribute('preload', 'none');
    expect(container.querySelector('track')).toHaveAttribute(
      'kind',
      'captions'
    );
  });
});

describe('shared pieces', () => {
  it('renders trackingId as data-track on CTAs, cards and the submit button', () => {
    const { container } = render(
      <>
        <CtaSection
          title="Go"
          primaryCta={{ label: 'Demo', href: '/demo', trackingId: 'cta-demo' }}
        />
        <ResourceCardsSection
          items={[{ title: 'Guide', href: '/g', trackingId: 'res-guide' }]}
        />
        <LeadFormSection
          title="Lead"
          action="/lead"
          submitTrackingId="lead-submit"
        />
      </>
    );
    expect(screen.getByRole('link', { name: 'Demo' })).toHaveAttribute(
      'data-track',
      'cta-demo'
    );
    expect(screen.getByRole('link', { name: 'Guide' })).toHaveAttribute(
      'data-track',
      'res-guide'
    );
    expect(screen.getByRole('button', { name: 'Submit' })).toHaveAttribute(
      'data-track',
      'lead-submit'
    );
    expect(container.querySelector('[components]')).toBeNull();
  });
  it('SectionHeading renders nothing without content', () => {
    const { container } = render(<SectionHeading />);
    expect(container).toBeEmptyDOMElement();
  });

  it('SectionShell labels the section only when it has a title', () => {
    const { rerender } = render(
      <SectionShell spacing="compact" width="narrow">
        x
      </SectionShell>
    );
    expect(screen.queryByRole('region')).toBeNull();
    rerender(<SectionShell title="Named">x</SectionShell>);
    expect(screen.getByRole('region', { name: 'Named' })).toBeInTheDocument();
  });

  it('TemplateIcon resolves tokens, lettermarks and unknown names', () => {
    const { container, rerender } = render(<TemplateIcon name="shield" />);
    expect(container.querySelector('svg')).not.toBeNull();
    rerender(<TemplateIcon name="EHR" />);
    expect(container).toHaveTextContent('EHR');
    rerender(<TemplateIcon name="not-a-token" />);
    expect(container).toBeEmptyDOMElement();
  });
});
