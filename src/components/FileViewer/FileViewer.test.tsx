import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import { FileViewer } from './FileViewer';

describe('FileViewer', () => {
  it('renders Markdown as a document in a labelled, focusable region', () => {
    renderWithTheme(
      <FileViewer
        path="notes/plan.md"
        text={
          '# Release plan\n\n| Step | Owner |\n| --- | --- |\n| Ship | Doug |'
        }
      />
    );
    const region = screen.getByRole('region', {
      name: 'Preview of notes/plan.md',
    });
    expect(region).toHaveAttribute('tabindex', '0');
    expect(region).toHaveAttribute('dir', 'auto');
    expect(
      screen.getByRole('heading', { name: 'Release plan' })
    ).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('renders other text files as one highlighted, left-to-right code block', () => {
    const { container } = renderWithTheme(
      <FileViewer path="src/app.ts" text="const ok: boolean = true;\n" />
    );
    expect(screen.getByRole('region')).toHaveAttribute('dir', 'ltr');
    const code = container.querySelector('code');
    expect(code).toHaveClass('language-typescript');
    expect(code?.querySelector('[class*="hljs-"]')).not.toBeNull();
  });

  it('keeps fenced code left to right inside automatic-direction Markdown', () => {
    renderWithTheme(
      <FileViewer
        path="notes/ar.md"
        text={'# ملاحظات\n\n```ts\nlet a = 1;\n```'}
      />
    );
    expect(screen.getByRole('region')).toHaveClass('[&_pre]:[direction:ltr]');
  });

  it('shows text over the highlight limit as plain text', () => {
    const { container } = renderWithTheme(
      <FileViewer path="data.json" text={'{"a": 1}'} highlightLimit={4} />
    );
    const plain = container.querySelector('[data-slot="file-viewer-plain"]');
    expect(plain).toHaveTextContent('{"a": 1}');
    expect(container.querySelector('code')).toBeNull();
  });

  it('lets plain-text Markdown follow its own direction', () => {
    renderWithTheme(
      <FileViewer path="notes/ar.md" text="# ملاحظات" highlightLimit={4} />
    );
    expect(screen.getByRole('region')).not.toHaveClass(
      '[&_pre]:[direction:ltr]'
    );
  });

  it('shows the empty message for an empty file', () => {
    renderWithTheme(
      <FileViewer path="empty.md" text="" labels={{ empty: 'Nothing here' }} />
    );
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
    expect(screen.queryByRole('region')).toBeNull();
  });

  it('uses a host Markdown renderer for Markdown and code alike', () => {
    renderWithTheme(
      <FileViewer
        path="src/app.ts"
        text="let a = 1;"
        renderMarkdown={(markdown, key) => (
          <pre data-testid="host">{`${key}|${markdown}`}</pre>
        )}
      />
    );
    expect(screen.getByTestId('host')).toHaveTextContent(
      'src/app.ts|```typescript let a = 1; ```'
    );
  });
});
