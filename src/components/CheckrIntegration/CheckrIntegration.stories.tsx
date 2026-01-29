import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import {
  CheckrIntegration,
  type BackgroundCheckReport,
} from './CheckrIntegration';

const meta: Meta<typeof CheckrIntegration> = {
  title: 'Components/CheckrIntegration',
  component: CheckrIntegration,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof CheckrIntegration>;

const samplePackages = [
  { id: 'basic', name: 'Basic Package', description: 'Criminal background check' },
  { id: 'standard', name: 'Standard Package', description: 'Criminal + Employment verification' },
  { id: 'professional', name: 'Professional Package', description: 'Criminal + Employment + Education verification' },
  { id: 'dot', name: 'DOT Compliant', description: 'Full DOT-compliant background check' },
];

const sampleReports: BackgroundCheckReport[] = [
  {
    id: '1',
    candidate: { id: 'c1', name: 'John Doe', email: 'john.doe@example.com', phone: '555-1234' },
    status: 'complete',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    packageName: 'Standard Package',
    result: 'clear',
    reportUrl: 'https://checkr.com/reports/123',
  },
  {
    id: '2',
    candidate: { id: 'c2', name: 'Jane Smith', email: 'jane.smith@example.com' },
    status: 'running',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    packageName: 'DOT Compliant',
  },
  {
    id: '3',
    candidate: { id: 'c3', name: 'Bob Wilson', email: 'bob.wilson@example.com' },
    status: 'complete',
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    completedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    packageName: 'Professional Package',
    result: 'consider',
    reportUrl: 'https://checkr.com/reports/456',
  },
  {
    id: '4',
    candidate: { id: 'c4', name: 'Alice Johnson', email: 'alice.j@example.com' },
    status: 'pending',
    createdAt: new Date(),
    packageName: 'Basic Package',
  },
];

export const Default: Story = {
  render: () => {
    const [connected, setConnected] = useState(true);
    const [reports, setReports] = useState(sampleReports);

    return (
      <CheckrIntegration
        connected={connected}
        account={{ name: 'BlueHive Inc.', plan: 'Enterprise' }}
        reports={reports}
        packages={samplePackages}
        onConnect={() => setConnected(true)}
        onDisconnect={() => setConnected(false)}
        onInviteCandidate={(candidate, packageId) => {
          console.log('Invite:', candidate, packageId);
          setReports([
            ...reports,
            {
              id: String(Date.now()),
              candidate: { id: String(Date.now()), ...candidate },
              status: 'pending',
              createdAt: new Date(),
              packageName: samplePackages.find((p) => p.id === packageId)?.name,
            },
          ]);
        }}
        onViewReport={(report) => window.open(report.reportUrl, '_blank')}
        onRefresh={() => console.log('Refresh')}
      />
    );
  },
};

export const NotConnected: Story = {
  args: {
    connected: false,
    packages: samplePackages,
  },
};

export const WithError: Story = {
  args: {
    connected: true,
    account: { name: 'BlueHive Inc.' },
    reports: [],
    packages: samplePackages,
    error: 'Failed to fetch reports from Checkr. Please try again.',
  },
};

export const Loading: Story = {
  args: {
    connected: true,
    account: { name: 'BlueHive Inc.' },
    loading: true,
    packages: samplePackages,
  },
};

export const NoReports: Story = {
  args: {
    connected: true,
    account: { name: 'BlueHive Inc.', plan: 'Basic' },
    reports: [],
    packages: samplePackages,
  },
};

export const WithAdverseAction: Story = {
  args: {
    connected: true,
    account: { name: 'BlueHive Inc.' },
    reports: [
      {
        id: '1',
        candidate: { id: 'c1', name: 'Problem Candidate', email: 'problem@example.com' },
        status: 'complete',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        packageName: 'Standard Package',
        result: 'adverse_action',
        reportUrl: 'https://checkr.com/reports/789',
      },
    ],
    packages: samplePackages,
  },
};

export const MixedStatuses: Story = {
  args: {
    connected: true,
    account: { name: 'BlueHive Inc.' },
    reports: [
      { id: '1', candidate: { id: 'c1', name: 'Pending Person', email: 'pending@example.com' }, status: 'pending', createdAt: new Date() },
      { id: '2', candidate: { id: 'c2', name: 'Running Person', email: 'running@example.com' }, status: 'running', createdAt: new Date() },
      { id: '3', candidate: { id: 'c3', name: 'Complete Person', email: 'complete@example.com' }, status: 'complete', result: 'clear', createdAt: new Date() },
      { id: '4', candidate: { id: 'c4', name: 'Failed Person', email: 'failed@example.com' }, status: 'failed', createdAt: new Date() },
      { id: '5', candidate: { id: 'c5', name: 'Expired Person', email: 'expired@example.com' }, status: 'expired', createdAt: new Date() },
    ],
    packages: samplePackages,
  },
};

export const Mobile: Story = {
  args: {
    connected: true,
    account: { name: 'BlueHive Inc.' },
    reports: sampleReports.slice(0, 2),
    packages: samplePackages,
  },
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};
