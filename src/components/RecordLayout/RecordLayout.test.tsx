import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RecordLayout, type RecordLayoutTab } from './RecordLayout';

const tabs: RecordLayoutTab[] = [
  { id: 'activity', label: 'Activity', count: 12, content: <p>Feed</p> },
  { id: 'notes', label: 'Notes', content: <p>Notes body</p> },
];

afterEach(() => {
  window.localStorage.clear();
  window.history.replaceState(null, '', '/');
});

describe('RecordLayout', () => {
  it('renders labelled landmarks in reading order', () => {
    render(
      <RecordLayout
        header={<header>Header</header>}
        sidebar={<p>Fields</p>}
        aside={<p>Related</p>}
      >
        <p>Body</p>
      </RecordLayout>
    );
    const sidebar = screen.getByRole('complementary', {
      name: 'Record details',
    });
    const main = screen.getByRole('region', { name: 'Record content' });
    const aside = screen.getByRole('complementary', {
      name: 'Related records',
    });
    expect(main).toHaveTextContent('Body');
    expect(
      sidebar.compareDocumentPosition(main) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(
      main.compareDocumentPosition(aside) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it('omits the aside landmark when no aside is given', () => {
    render(<RecordLayout sidebar={<p>Fields</p>}>Body</RecordLayout>);
    expect(screen.getAllByRole('complementary')).toHaveLength(1);
  });

  it('renders tabs with counts and reports changes', async () => {
    const onTabChange = vi.fn();
    render(<RecordLayout tabs={tabs} onTabChange={onTabChange} />);
    expect(
      screen.getByRole('tablist', { name: 'Record sections' })
    ).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Activity 12' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    expect(screen.getByText('Feed')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: 'Notes' }));
    expect(onTabChange).toHaveBeenCalledWith('notes');
    expect(screen.getByText('Notes body')).toBeInTheDocument();
  });

  it('respects a controlled activeTab', () => {
    render(<RecordLayout tabs={tabs} activeTab="notes" />);
    expect(screen.getByRole('tab', { name: 'Notes' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
  });

  it('mirrors the tab in the URL with tabsUrlParam', async () => {
    render(<RecordLayout tabs={tabs} tabsUrlParam="tab" />);
    await userEvent.click(screen.getByRole('tab', { name: 'Notes' }));
    expect(window.location.search).toBe('?tab=notes');
  });

  it('collapses the sidebar behind a labelled toggle', async () => {
    render(<RecordLayout sidebar={<p>Fields</p>}>Body</RecordLayout>);
    const toggle = screen.getByRole('button', { name: 'Details' });
    const panel = document.getElementById(
      toggle.getAttribute('aria-controls')!
    )!;
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(panel).toHaveClass('hidden', 'md:block');

    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(panel).not.toHaveClass('hidden');
  });

  it('persists the sidebar state under sidebarStorageKey', async () => {
    window.localStorage.setItem('rl', 'true');
    render(
      <RecordLayout sidebar={<p>Fields</p>} sidebarStorageKey="rl">
        Body
      </RecordLayout>
    );
    const toggle = screen.getByRole('button', { name: 'Details' });
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await userEvent.click(toggle);
    expect(window.localStorage.getItem('rl')).toBe('false');
  });

  it('renders the sidebar inline when not collapsible', () => {
    render(
      <RecordLayout sidebar={<p>Fields</p>} sidebarCollapsible={false}>
        Body
      </RecordLayout>
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByText('Fields')).toBeVisible();
  });
});
