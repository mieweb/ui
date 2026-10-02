import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Building2, Mail, MapPin, Pencil, Trash2 } from 'lucide-react';
import { RecordHeader, type RecordHeaderAction } from './RecordHeader';

const actions: RecordHeaderAction[] = [
  { id: 'email', label: 'Email', icon: Mail, onClick: vi.fn() },
  { id: 'edit', label: 'Edit', icon: Pencil, onClick: vi.fn() },
  { id: 'profile', label: 'Open profile', href: '/profile' },
  {
    id: 'delete',
    label: 'Delete',
    icon: Trash2,
    variant: 'danger',
    onClick: vi.fn(),
  },
];

describe('RecordHeader', () => {
  it('renders the title as h1 with badges, subtitle and meta', () => {
    render(
      <RecordHeader
        title="Dana Ruiz"
        subtitle="Director of Occupational Health"
        avatar={{ name: 'Dana Ruiz' }}
        badges={[{ id: 'stage', label: 'Customer', variant: 'success' }]}
        meta={[
          { id: 'co', label: 'Acme', icon: Building2, href: '/companies/1' },
          { id: 'loc', label: 'Columbus, OH', icon: MapPin },
        ]}
      />
    );
    expect(
      screen.getByRole('heading', { level: 1, name: 'Dana Ruiz' })
    ).toBeInTheDocument();
    expect(screen.getByText('Customer')).toBeInTheDocument();
    expect(
      screen.getByText('Director of Occupational Health')
    ).toBeInTheDocument();
    const meta = screen.getByRole('list', { name: 'Details' });
    expect(meta.querySelectorAll('li')).toHaveLength(2);
    expect(screen.getByRole('link', { name: 'Acme' })).toHaveAttribute(
      'href',
      '/companies/1'
    );
  });

  it('honours headingLevel, media precedence, sticky and labels', () => {
    const { container } = render(
      <RecordHeader
        title="Acme"
        headingLevel="h2"
        icon={Building2}
        media={<img alt="Acme logo" src="logo.png" />}
        sticky
        onBack={() => {}}
        labels={{ back: 'Back to companies' }}
      />
    );
    expect(
      screen.getByRole('heading', { level: 2, name: 'Acme' })
    ).toBeInTheDocument();
    expect(screen.getByAltText('Acme logo')).toBeInTheDocument();
    expect(container.querySelector('header')).toHaveClass('sticky');
    expect(
      screen.getByRole('button', { name: 'Back to companies' })
    ).toBeInTheDocument();
  });

  it('renders an icon tile when there is no avatar or media', () => {
    const { container } = render(
      <RecordHeader title="Acme" icon={Building2} />
    );
    expect(
      container.querySelector('[data-slot="record-header-media"] svg')
    ).not.toBeNull();
  });

  it('calls onBack from the back button and supports backHref', async () => {
    const onBack = vi.fn();
    const { rerender } = render(<RecordHeader title="X" onBack={onBack} />);
    await userEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(onBack).toHaveBeenCalledTimes(1);

    rerender(<RecordHeader title="X" backHref="/contacts" />);
    expect(screen.getByRole('link', { name: 'Back' })).toHaveAttribute(
      'href',
      '/contacts'
    );
  });

  it('shows the first actions as buttons and the rest in an overflow menu', async () => {
    render(<RecordHeader title="X" actions={actions} />);
    expect(screen.getByRole('button', { name: 'Email' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Delete' })
    ).not.toBeInTheDocument();

    const trigger = screen.getByRole('button', { name: 'More actions' });
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    await userEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    expect(
      screen.getByRole('menuitem', { name: 'Open profile' })
    ).toHaveAttribute('href', '/profile');
    // Visible actions are repeated in the menu for narrow screens.
    expect(screen.getByRole('menuitem', { name: 'Email' })).toHaveClass(
      'sm:hidden'
    );

    await userEvent.click(screen.getByRole('menuitem', { name: 'Delete' }));
    expect(actions[3].onClick).toHaveBeenCalledTimes(1);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('hides the overflow trigger from sm up when everything fits', () => {
    render(
      <RecordHeader
        title="X"
        actions={[
          { id: 'a', label: 'Call', href: '/call' },
          { id: 'b', label: 'Archive', disabled: true },
        ]}
      />
    );
    expect(screen.getByRole('button', { name: 'More actions' })).toHaveClass(
      'sm:hidden'
    );
    expect(screen.getByRole('link', { name: 'Call' })).toHaveAttribute(
      'href',
      '/call'
    );
    expect(screen.getByRole('button', { name: 'Archive' })).toBeDisabled();
  });

  it('renders presence, breadcrumbs and children slots', () => {
    render(
      <RecordHeader
        title="X"
        presence={<span>3 viewing</span>}
        breadcrumbs={<nav aria-label="Breadcrumb">Contacts</nav>}
      >
        <p>Extra row</p>
      </RecordHeader>
    );
    expect(screen.getByText('3 viewing')).toBeInTheDocument();
    expect(
      screen.getByRole('navigation', { name: 'Breadcrumb' })
    ).toBeInTheDocument();
    expect(screen.getByText('Extra row')).toBeInTheDocument();
  });
});
