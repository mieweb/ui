import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { BenchmarkTableSection } from '../components/BenchmarkTableSection';
import { LandingPage, validateLandingPage } from '../components/LandingPage';
import { LeadFormSection } from '../components/LeadFormSection';
import { MetricListSection } from '../components/MetricListSection';
import { MetricStatusBadge } from '../components/MetricStatusBadge';
import { PdfEmbedSection } from '../components/PdfEmbedSection';
import { RankedListSection } from '../components/RankedListSection';
import { ReportByline } from '../components/ReportByline';
import { ReportMethodology } from '../components/ReportMethodology';
import {
  TileCartogramSection,
  quartileBuckets,
  usStateTiles,
} from '../components/TileCartogramSection';
import { StatsSection } from '../components/StatsSection';
import {
  benchmarkColumns,
  benchmarkReportBlocks,
  benchmarkRows,
  maturingMetrics,
  measuredMetrics,
  methodologySources,
  reportAuthors,
  tileLegend,
  tileValues,
} from './reportStoryData';

describe('MetricStatusBadge', () => {
  it('labels each status and accepts a translated label', () => {
    const { rerender } = render(<MetricStatusBadge status="maturing" />);
    expect(screen.getByText('Data maturing')).toBeInTheDocument();
    rerender(<MetricStatusBadge status="live" label="Données réelles" />);
    expect(screen.getByText('Données réelles')).toBeInTheDocument();
  });
});

describe('BenchmarkTableSection', () => {
  it('renders row headers, formatted numbers and a dash for missing values', () => {
    render(
      <BenchmarkTableSection
        title="What services cost"
        status="live"
        rowHeader="Service"
        columns={benchmarkColumns}
        rows={benchmarkRows}
        locale="en-US"
      />
    );
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      'What services cost'
    );
    expect(screen.getByText('Live data')).toBeInTheDocument();
    const row = screen.getByRole('row', { name: /Respirator fit test/ });
    expect(within(row).getByText('$55')).toBeInTheDocument();
    expect(within(row).getByText('\u2014')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'DOT physical' })).toHaveAttribute(
      'href',
      '#dot'
    );
  });
});

describe('RankedListSection', () => {
  it('keeps the value readable when a note replaces it', () => {
    render(
      <RankedListSection
        title="Demand"
        numbered
        lists={[
          {
            items: [
              { label: 'DOT physical', value: 94, note: '14 industries' },
            ],
          },
        ]}
      />
    );
    const item = screen.getByRole('listitem');
    expect(item).toHaveTextContent('01');
    expect(item).toHaveTextContent('14 industries');
    expect(item).toHaveTextContent(': 94');
  });
});

describe('TileCartogramSection', () => {
  it('lays out every US state and DC, reading full names and details', () => {
    expect(usStateTiles).toHaveLength(51);
    render(
      <TileCartogramSection
        title="Density"
        values={tileValues}
        legend={tileLegend}
      />
    );
    expect(
      screen.getByText('North Dakota: 14.2 per 100k workers')
    ).toBeInTheDocument();
    expect(screen.getByText('Alaska: no workforce data')).toBeInTheDocument();
  });

  it('buckets values into quartiles and missing values into 0', () => {
    const b = quartileBuckets({ a: 1, b: 2, c: 3, d: 4, e: null });
    expect(b).toEqual({ a: 1, b: 2, c: 3, d: 4, e: 0 });
  });
});

describe('MetricListSection', () => {
  it('reads as maturing until any metric has a value', () => {
    const { rerender } = render(
      <MetricListSection title="Ops" metrics={maturingMetrics} />
    );
    expect(screen.getByText('Data maturing')).toBeInTheDocument();
    expect(screen.getByText('Roadmap preview')).toBeInTheDocument();
    rerender(<MetricListSection title="Ops" metrics={measuredMetrics} />);
    expect(screen.getByText('Live data')).toBeInTheDocument();
    expect(screen.getByText('2.4 days')).toBeInTheDocument();
  });

  it('translates the section badge through statusLabels', () => {
    render(
      <MetricListSection
        title="Ops"
        metrics={maturingMetrics}
        statusLabels={{ maturing: 'Données en cours' }}
      />
    );
    expect(screen.getByText('Données en cours')).toBeInTheDocument();
  });
});

describe('ReportMethodology and ReportByline', () => {
  it('links sources and shows the citation', () => {
    render(
      <ReportMethodology
        title="How this report was built"
        sources={methodologySources}
        citation="Example Health, 2026."
      />
    );
    expect(
      screen.getByRole('link', { name: /Source.*BLS OEWS/ })
    ).toHaveAttribute('href', 'https://www.bls.gov/oes/');
    expect(screen.getByText('Example Health, 2026.')).toBeInTheDocument();
  });

  it('renders a hidden heading, linked author and dates', () => {
    render(<ReportByline authors={reportAuthors} published="June 13, 2026" />);
    expect(
      screen.getByRole('heading', { level: 2, name: 'About the author' })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Jordan Rivera' })).toHaveAttribute(
      'href',
      '#author'
    );
    expect(screen.getByText('Published June 13, 2026')).toBeInTheDocument();
  });
});

describe('PdfEmbedSection', () => {
  it('embeds the PDF with a fallback and download link', () => {
    const { container } = render(
      <PdfEmbedSection title="Full report" src="/r.pdf" downloadAs="r.pdf" />
    );
    expect(container.querySelector('object')).toHaveAttribute(
      'data',
      '/r.pdf#view=FitH'
    );
    expect(screen.getByRole('link', { name: 'Download PDF' })).toHaveAttribute(
      'download',
      'r.pdf'
    );
  });
});

describe('extended sections', () => {
  it('StatsSection ruled variant draws an accent rule per figure', () => {
    const { container } = render(
      <StatsSection
        variant="ruled"
        stats={[{ value: '$1.2M', label: 'Saved' }]}
      />
    );
    expect(container.querySelector('.border-s-2')).toBeInTheDocument();
  });

  it('LeadFormSection lists highlights beside the form', () => {
    render(
      <LeadFormSection
        title="Get the report"
        action="/lead"
        highlights={['Key findings']}
      />
    );
    expect(screen.getByRole('list')).toHaveTextContent('Key findings');
  });
});

describe('benchmark-report preset', () => {
  it('the sample report renders one h1 and validates clean', () => {
    render(<LandingPage blocks={benchmarkReportBlocks} />);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(
      validateLandingPage(benchmarkReportBlocks, 'benchmark-report')
    ).toEqual([]);
  });

  it('warns when report figures come after the methodology', () => {
    const [hero, , , , table] = benchmarkReportBlocks;
    const methodology = benchmarkReportBlocks.find(
      (b) => b.type === 'methodology'
    )!;
    const issues = validateLandingPage(
      [hero, methodology, table],
      'benchmark-report'
    );
    expect(issues.map((i) => i.message)).toContain(
      '"benchmark-table" is out of the Benchmark report preset\'s recommended order.'
    );
  });

  it('warns when report blocks render h3s without a section title', () => {
    const issues = validateLandingPage([
      { type: 'ranked-list', lists: [{ title: 'Top', items: [] }] },
      { type: 'ranked-list', lists: [{ items: [] }] },
      { type: 'tile-cartogram', mapTitle: 'Density', values: {}, legend: [] },
      { type: 'methodology', sources: [], citation: 'Cite me' },
    ]);
    expect(
      issues
        .filter((i) => i.message.includes('skip the h2'))
        .map((i) => i.index)
    ).toEqual([0, 2, 3]);
  });

  it('warns about benchmark values for unknown columns', () => {
    const issues = validateLandingPage([
      {
        type: 'benchmark-table',
        title: 'T',
        rowHeader: 'R',
        columns: [{ key: 'a', label: 'A' }],
        rows: [{ label: 'x', values: { a: 1, b: 2 } }],
      },
    ]);
    expect(issues.some((i) => i.message.includes('unknown columns: b'))).toBe(
      true
    );
  });
});
