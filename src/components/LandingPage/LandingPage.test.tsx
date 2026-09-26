import type * as React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { LandingPage, type LandingBlock } from './LandingPage';
import { landingPresets, validateLandingPage } from './presets';
import {
  campaignBlocks,
  comparisonBlocks,
  pricingBlocks,
  resourceBlocks,
  serviceDetailBlocks,
  verticalHubBlocks,
} from '../../templates/storyData';

const pages = {
  'vertical-hub': verticalHubBlocks,
  'service-detail': serviceDetailBlocks,
  campaign: campaignBlocks,
  comparison: comparisonBlocks,
  resource: resourceBlocks,
  pricing: pricingBlocks,
} as const;

describe('LandingPage', () => {
  it.each(Object.entries(pages))(
    'renders the %s story page with one h1 and no preset issues',
    (preset, blocks) => {
      const { container } = render(<LandingPage blocks={[...blocks]} />);
      expect(container.querySelectorAll('h1')).toHaveLength(1);
      expect(container.querySelectorAll('section')).toHaveLength(blocks.length);
      expect(
        validateLandingPage([...blocks], preset as keyof typeof pages)
      ).toEqual([]);
    }
  );

  it('passes site image and link components to every section', () => {
    const Link = ({ children, ...props }: React.ComponentProps<'a'>) => (
      <a data-client-nav="" {...props}>
        {children}
      </a>
    );
    const Image = ({
      priority,
      alt,
      ...props
    }: React.ComponentProps<'img'> & { priority?: boolean }) => (
      <img data-priority={priority ? 'yes' : 'no'} alt={alt} {...props} />
    );
    const { container } = render(
      <LandingPage blocks={verticalHubBlocks} components={{ Image, Link }} />
    );
    const anchors = container.querySelectorAll('a');
    expect(anchors.length).toBeGreaterThan(10);
    anchors.forEach((a) => expect(a).toHaveAttribute('data-client-nav'));
    const optimized = container.querySelectorAll('img[data-priority]');
    expect(optimized[0]).toHaveAttribute('data-priority', 'yes');
    expect(
      [...optimized]
        .slice(1)
        .every((img) => img.getAttribute('data-priority') === 'no')
    ).toBe(true);
    expect(container.querySelector('[components]')).toBeNull();
  });

  it('names every titled section by its heading', () => {
    render(<LandingPage blocks={verticalHubBlocks} />);
    expect(
      screen.getByRole('region', { name: 'Frequently asked questions' })
    ).toBeInTheDocument();
  });

  it('renders custom blocks from the map and skips unknown ones', () => {
    const blocks: LandingBlock[] = [
      { type: 'custom', component: 'roi', id: 'roi', props: { label: 'ROI' } },
      { type: 'custom', component: 'missing' },
    ];
    const Roi = ({ id, label }: { id?: string; label: string }) => (
      <aside id={id}>{label}</aside>
    );
    const { container } = render(
      <LandingPage blocks={blocks} custom={{ roi: Roi }} />
    );
    expect(container.querySelector('#roi')).toHaveTextContent('ROI');
    expect(
      container.querySelector('[data-slot="landing-page"]')?.children
    ).toHaveLength(1);
  });

  it('passes site icons to every icon section', () => {
    const Crew = () => <svg data-testid="crew-icon" />;
    render(
      <LandingPage
        icons={{ crew: Crew }}
        blocks={[
          {
            type: 'features',
            features: [{ title: 'A', description: 'a', icon: 'crew' }],
          },
          {
            type: 'process',
            steps: [{ title: 'B', description: 'b', icon: 'crew' }],
          },
        ]}
      />
    );
    expect(screen.getAllByTestId('crew-icon')).toHaveLength(2);
  });
});

describe('validateLandingPage', () => {
  it('keeps block data serializable at the type level', () => {
    const block: LandingBlock = {
      type: 'cta',
      title: 'Go',
      // @ts-expect-error -- handlers belong to the app, not page data
      onClick: () => undefined,
    };
    expect(block.type).toBe('cta');
  });
  const hero: LandingBlock = { type: 'hero', title: 'Hi' };
  const faq: LandingBlock = { type: 'faq', id: 'faq', items: [] };

  it('flags a second h1 hero, a late hero and duplicate ids', () => {
    const issues = validateLandingPage([faq, hero, hero, { ...faq }]);
    expect(issues.map((i) => [i.severity, i.index])).toEqual([
      ['error', 2],
      ['warning', 1],
      ['error', 3],
    ]);
  });

  it('accepts an h2 hero after the page h1 but warns when there is no h1 hero', () => {
    const issues = validateLandingPage([{ ...hero, headingLevel: 'h2' }]);
    expect(issues).toEqual([
      expect.objectContaining({
        severity: 'warning',
        message: expect.stringContaining('No h1'),
      }),
    ]);
  });

  it('reports missing required blocks and out-of-order blocks for a preset', () => {
    const issues = validateLandingPage(
      [hero, faq, { type: 'features', features: [] }],
      'vertical-hub'
    );
    expect(
      issues.filter((i) => i.severity === 'error').map((i) => i.message)
    ).toEqual([expect.stringContaining('"cta"')]);
    expect(issues.find((i) => i.severity === 'warning')?.index).toBe(2);
  });

  it('accepts a custom preset object', () => {
    const issues = validateLandingPage([hero], {
      ...landingPresets.campaign,
      required: ['hero'],
    });
    expect(issues).toEqual([]);
  });

  it('ignores block types a preset does not order', () => {
    const blocks: LandingBlock[] = [
      hero,
      { type: 'custom', component: 'x' },
      { type: 'lead-form', title: 'Go', action: '/lead' },
    ];
    expect(validateLandingPage(blocks, 'campaign')).toEqual([]);
    expect(
      within(render(<LandingPage blocks={blocks} />).container).getByRole(
        'button',
        {
          name: 'Submit',
        }
      )
    ).toBeInTheDocument();
  });
});
