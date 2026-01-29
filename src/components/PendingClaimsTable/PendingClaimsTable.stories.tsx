import type { Meta, StoryObj } from '@storybook/react';
import {
  PendingClaimsTable,
  type PendingClaim,
} from './PendingClaimsTable';

const meta: Meta<typeof PendingClaimsTable> = {
  title: 'Provider/PendingClaimsTable',
  component: PendingClaimsTable,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    onApprove: { action: 'approved' },
    onReject: { action: 'rejected' },
    onViewDetails: { action: 'view details' },
  },
};

export default meta;
type Story = StoryObj<typeof PendingClaimsTable>;

const mockClaims: PendingClaim[] = [
  {
    id: '1',
    claimantName: 'Dr. Sarah Johnson',
    claimantEmail: 'sarah.johnson@clinic.com',
    claimantRole: 'Administrator',
    submittedDate: new Date('2024-01-15'),
    status: 'pending',
    message:
      'I am the office manager and need access to manage staff and billing.',
  },
  {
    id: '2',
    claimantName: 'James Wilson',
    claimantEmail: 'j.wilson@healthgroup.org',
    claimantRole: 'Billing Coordinator',
    submittedDate: new Date('2024-01-14'),
    status: 'pending',
    message: 'Requesting access for billing purposes.',
  },
  {
    id: '3',
    claimantName: 'Emily Chen',
    claimantEmail: 'e.chen@medcenter.net',
    claimantRole: 'Front Desk',
    submittedDate: new Date('2024-01-12'),
    status: 'approved',
  },
  {
    id: '4',
    claimantName: 'Michael Brown',
    claimantEmail: 'mbrown@unknown.com',
    submittedDate: new Date('2024-01-10'),
    status: 'rejected',
  },
];

export const Default: Story = {
  args: {
    claims: mockClaims,
  },
};

export const PendingOnly: Story = {
  args: {
    claims: mockClaims.filter((c) => c.status === 'pending'),
  },
};

export const AllApproved: Story = {
  args: {
    claims: mockClaims.map((c) => ({ ...c, status: 'approved' as const })),
  },
};

export const AllRejected: Story = {
  args: {
    claims: mockClaims.map((c) => ({ ...c, status: 'rejected' as const })),
  },
};

export const Empty: Story = {
  args: {
    claims: [],
    emptyMessage: 'No pending claims to review',
  },
};

export const Loading: Story = {
  args: {
    claims: [],
    isLoading: true,
  },
};

export const ActionsDisabled: Story = {
  args: {
    claims: mockClaims.filter((c) => c.status === 'pending'),
    actionsDisabled: true,
  },
};

export const NoViewAction: Story = {
  args: {
    claims: mockClaims.filter((c) => c.status === 'pending'),
    onViewDetails: undefined,
  },
};

export const SingleClaim: Story = {
  args: {
    claims: [mockClaims[0]],
  },
};

export const ManyClaims: Story = {
  args: {
    claims: [
      ...mockClaims,
      {
        id: '5',
        claimantName: 'Lisa Anderson',
        claimantEmail: 'l.anderson@provider.org',
        claimantRole: 'Nurse Practitioner',
        submittedDate: new Date('2024-01-16'),
        status: 'pending' as const,
      },
      {
        id: '6',
        claimantName: 'Robert Taylor',
        claimantEmail: 'r.taylor@clinic.com',
        claimantRole: 'Medical Assistant',
        submittedDate: new Date('2024-01-17'),
        status: 'pending' as const,
      },
      {
        id: '7',
        claimantName: 'Amanda White',
        claimantEmail: 'a.white@healthsys.org',
        claimantRole: 'Office Manager',
        submittedDate: new Date('2024-01-18'),
        status: 'pending' as const,
      },
    ],
  },
};

export const Mobile: Story = {
  args: {
    claims: mockClaims.filter((c) => c.status === 'pending'),
  },
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};
