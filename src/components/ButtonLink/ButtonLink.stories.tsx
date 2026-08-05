import type { Meta, StoryObj } from '@storybook/react-vite';
import * as React from 'react';
import { Plus, ExternalLink, ArrowLeft, Pencil } from 'lucide-react';
import { ButtonLink } from './ButtonLink';

const meta: Meta<typeof ButtonLink> = {
  title: 'Components/Forms & Inputs/ButtonLink',
  component: ButtonLink,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: [
          'A navigation link styled exactly like `Button`, sharing its `buttonVariants`.',
          '',
          'Use it wherever a click **navigates**: it renders a real link element, so users keep',
          'middle-click / Ctrl+click to open in a new tab, "copy link address", URL preview on',
          'hover, and assistive technology announces it as a link. Wrapping a `<Button>` in an',
          'anchor is invalid HTML (interactive inside interactive) and creates a double tab stop —',
          'this component replaces that pattern.',
          '',
          "By default it renders `<a href>`. In single-page apps pass your router's link",
          'component via `as` to keep client-side navigation, e.g.',
          '`<ButtonLink as={Link} to="/users/new">…</ButtonLink>` (react-router) or',
          '`<ButtonLink as={Link} href="/users/new">…</ButtonLink>` (Next.js).',
          '',
          'Buttons that *act* (submit, toggle, delete) should remain `Button`; loading and',
          'disabled semantics intentionally do not exist on links.',
        ].join('\n'),
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost', 'outline', 'danger', 'link'],
      description: 'Visual style, identical to Button variants',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'icon'],
      description: 'Size, identical to Button sizes',
    },
    fullWidth: {
      control: 'boolean',
      description: 'Stretch to the full width of the container',
    },
    as: {
      control: false,
      description:
        "Element or component to render — defaults to 'a'; pass a router link component for SPA navigation",
    },
    leftIcon: {
      control: false,
      description: 'Icon to display before the link text',
    },
    rightIcon: {
      control: false,
      description: 'Icon to display after the link text',
    },
    href: {
      control: 'text',
      description: 'Destination URL (when rendering the default anchor)',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ButtonLink>;

export const Primary: Story = {
  args: {
    href: '#',
    variant: 'primary',
    children: 'New user',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <ButtonLink href="#" variant="primary">
        Primary
      </ButtonLink>
      <ButtonLink href="#" variant="secondary">
        Secondary
      </ButtonLink>
      <ButtonLink href="#" variant="ghost">
        Ghost
      </ButtonLink>
      <ButtonLink href="#" variant="outline">
        Outline
      </ButtonLink>
      <ButtonLink href="#" variant="danger">
        Danger
      </ButtonLink>
      <ButtonLink href="#" variant="link">
        Link
      </ButtonLink>
    </div>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <ButtonLink href="#" variant="primary" leftIcon={<Plus size={16} />}>
        New container
      </ButtonLink>
      <ButtonLink
        href="#"
        variant="ghost"
        size="sm"
        leftIcon={<Pencil size={16} />}
      >
        Edit
      </ButtonLink>
      <ButtonLink href="#" variant="ghost" leftIcon={<ArrowLeft size={16} />}>
        Back
      </ButtonLink>
      <ButtonLink
        href="https://ui.mieweb.org"
        target="_blank"
        rel="noreferrer"
        variant="outline"
        rightIcon={<ExternalLink size={16} />}
      >
        Storybook
      </ButtonLink>
    </div>
  ),
};

/**
 * `as` accepts any component — pass your router's link to keep client-side
 * navigation. This story stubs one to stay router-agnostic.
 */
export const WithRouterLink: Story = {
  render: () => {
    // Stand-in for react-router's <Link> / Next.js <Link>
    const RouterLink = React.forwardRef<
      HTMLAnchorElement,
      React.AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }
    >(function RouterLink({ to, children, ...props }, ref) {
      return (
        <a ref={ref} href={to} {...props}>
          {children}
        </a>
      );
    });
    return (
      <ButtonLink
        as={RouterLink}
        to="/users/new"
        variant="primary"
        leftIcon={<Plus size={16} />}
      >
        New user (router link)
      </ButtonLink>
    );
  },
};
