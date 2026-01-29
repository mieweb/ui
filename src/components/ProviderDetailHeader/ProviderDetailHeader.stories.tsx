import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  ProviderDetailHeader,
  ProviderLogo,
  SocialMediaLinks,
  VerifiedBadge,
  BookAppointmentButton,
  CompactProviderHeader,
  ProviderDetailHeaderSkeleton,
  type ProviderDetailData,
  type BreadcrumbItem,
} from './ProviderDetailHeader';

// Sample Data
const mockProvider: ProviderDetailData = {
  id: '1',
  name: 'BlueHive Medical Center',
  slug: 'bluehive-medical-center',
  logoUrl: 'https://placehold.co/128x128/0066cc/ffffff?text=BM',
  address: {
    street1: '123 Healthcare Way',
    street2: 'Suite 500',
    city: 'Indianapolis',
    state: 'Indiana',
    postalCode: '46220',
  },
  phoneNumber: '(317) 555-0123',
  urls: {
    website: 'https://example.com',
    linkedin: 'https://linkedin.com/company/example',
    facebook: 'https://facebook.com/example',
    instagram: 'https://instagram.com/example',
  },
  isVerified: true,
  lastUpdated: new Date('2024-01-15'),
};

const mockBreadcrumbs: BreadcrumbItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Indiana', href: '/state/indiana' },
  { label: 'Indianapolis (46220)', href: '/search/46220' },
  {
    label: 'BlueHive Medical Center',
    href: '/provider/bluehive-medical-center',
  },
];

const meta: Meta<typeof ProviderDetailHeader> = {
  title: 'Provider/ProviderDetailHeader',
  component: ProviderDetailHeader,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'flat', 'elevated'],
    },
    showActionButtons: { control: 'boolean' },
    showBreadcrumb: { control: 'boolean' },
    showSocialLinks: { control: 'boolean' },
    showVerifiedBadge: { control: 'boolean' },
    showClaimButton: { control: 'boolean' },
    showBookButton: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof ProviderDetailHeader>;

// Default full header with all features
export const Default: Story = {
  args: {
    provider: mockProvider,
    breadcrumbs: mockBreadcrumbs,
    onShare: () => window.alert('Share'),
    onCall: () => window.alert('Call'),
    onBook: () => window.alert('Book'),
  },
};

// Provider without logo (fallback initials)
export const WithoutLogo: Story = {
  args: {
    provider: {
      ...mockProvider,
      id: '2',
      name: 'ABC Testing Services',
      logoUrl: undefined,
    },
    breadcrumbs: mockBreadcrumbs,
  },
};

// Unverified provider with claim button
export const UnverifiedWithClaimButton: Story = {
  args: {
    provider: {
      ...mockProvider,
      isVerified: false,
      isClaimed: false,
    },
    showClaimButton: true,
  },
};

// Minimal provider (few details)
export const MinimalProvider: Story = {
  args: {
    provider: {
      id: '3',
      name: 'Quick Drug Test',
      slug: 'quick-drug-test',
      address: {
        street1: '456 Main Street',
        city: 'Chicago',
        state: 'Illinois',
        postalCode: '60601',
      },
    },
    showSocialLinks: false,
    showBookButton: false,
  },
};

// Sub-components demos
export const LogoSizes: StoryObj<typeof ProviderLogo> = {
  render: () => (
    <div className="flex items-end gap-4 p-4">
      <ProviderLogo name="SM" size="sm" />
      <ProviderLogo name="MD" size="md" />
      <ProviderLogo name="LG" size="lg" />
      <ProviderLogo
        name="With Image"
        src="https://placehold.co/128x128/0066cc/ffffff?text=BM"
        size="lg"
      />
    </div>
  ),
};

export const SocialLinks: StoryObj<typeof SocialMediaLinks> = {
  render: () => (
    <div className="space-y-4 p-4">
      <SocialMediaLinks
        urls={{
          linkedin: 'https://linkedin.com',
          facebook: 'https://facebook.com',
          instagram: 'https://instagram.com',
          twitter: 'https://twitter.com',
        }}
        providerName="Test Provider"
        size="md"
      />
    </div>
  ),
};

export const VerifiedBadges: StoryObj<typeof VerifiedBadge> = {
  render: () => (
    <div className="space-y-4 p-4">
      <VerifiedBadge isVerified={true} lastUpdated={new Date()} />
      <VerifiedBadge isClaimed={true} lastUpdated="January 15, 2024" />
      <VerifiedBadge isVerified={false} />
    </div>
  ),
};

export const BookButtons: StoryObj<typeof BookAppointmentButton> = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4 p-4">
      <BookAppointmentButton size="sm">Small</BookAppointmentButton>
      <BookAppointmentButton size="md">Medium</BookAppointmentButton>
      <BookAppointmentButton size="lg">Large</BookAppointmentButton>
      <BookAppointmentButton variant="outline">Outline</BookAppointmentButton>
    </div>
  ),
};

export const CompactHeader: StoryObj<typeof CompactProviderHeader> = {
  render: () => (
    <CompactProviderHeader
      provider={mockProvider}
      onBook={() => window.alert('Book clicked')}
    />
  ),
};

export const Skeleton: StoryObj<typeof ProviderDetailHeaderSkeleton> = {
  render: () => <ProviderDetailHeaderSkeleton />,
};

// Full page context demo
export const FullPageDemo: Story = {
  render: () => (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <ProviderDetailHeader
        provider={mockProvider}
        breadcrumbs={mockBreadcrumbs}
        onShare={() => window.alert('Share')}
        onCall={() => window.alert('Call')}
        onBook={() => window.alert('Book')}
      />
      <div className="container mx-auto px-4 py-6">
        <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
          <h2 className="mb-4 text-xl font-semibold">Services</h2>
          <div className="flex flex-wrap gap-2">
            {['Drug Testing', 'DOT Physical', 'Breath Alcohol'].map((s) => (
              <span
                key={s}
                className="bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300 rounded-full px-3 py-1.5 text-sm"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  ),
};
