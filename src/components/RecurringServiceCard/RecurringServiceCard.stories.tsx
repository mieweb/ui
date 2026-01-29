import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import {
  RecurringServiceCard,
  RecurringServiceAddCard,
  RecurringServiceSetupModal,
  RecurringServiceGrid,
  type RecurringService,
  type RecurringServiceFormData,
} from './RecurringServiceCard';

const meta: Meta<typeof RecurringServiceCard> = {
  title: 'Components/RecurringServiceCard',
  component: RecurringServiceCard,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof RecurringServiceCard>;

const sampleService: RecurringService = {
  id: '1',
  serviceName: 'DOT Physical Examination',
  serviceId: 'srv-001',
  providerName: 'MedExpress Urgent Care',
  providerId: 'prv-001',
  occurrence: 'annually',
  nextOrder: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
  overrideConsent: false,
};

const sampleServices: RecurringService[] = [
  sampleService,
  {
    id: '2',
    serviceName: 'Drug Screen - 5 Panel',
    serviceId: 'srv-002',
    providerName: 'Quest Diagnostics',
    providerId: 'prv-002',
    occurrence: 'quarterly',
    nextOrder: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    overrideConsent: true,
  },
  {
    id: '3',
    serviceName: 'Hearing Test',
    serviceId: 'srv-003',
    providerName: 'AudioHealth Center',
    providerId: 'prv-003',
    occurrence: 'semi-annually',
    nextOrder: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    overrideConsent: false,
  },
];

export const Default: Story = {
  args: {
    service: sampleService,
    showProvider: true,
  },
};

export const WithConsentOverride: Story = {
  args: {
    service: {
      ...sampleService,
      overrideConsent: true,
    },
  },
};

export const NoProvider: Story = {
  args: {
    service: sampleService,
    showProvider: false,
  },
};

export const PastDueOrder: Story = {
  args: {
    service: {
      ...sampleService,
      nextOrder: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    },
  },
};

export const AddCard: StoryObj<typeof RecurringServiceAddCard> = {
  render: () => (
    <div className="max-w-sm">
      <RecurringServiceAddCard onClick={() => alert('Add clicked')} />
    </div>
  ),
};

export const SetupModal: StoryObj<typeof RecurringServiceSetupModal> = {
  render: () => {
    const [open, setOpen] = useState(true);

    return (
      <>
        <button
          onClick={() => setOpen(true)}
          className="rounded-lg bg-primary px-4 py-2 text-white"
        >
          Open Modal
        </button>
        <RecurringServiceSetupModal
          open={open}
          onClose={() => setOpen(false)}
          onSave={(data) => {
            console.log('Save:', data);
            setOpen(false);
          }}
          providers={[
            { id: '1', name: 'MedExpress Urgent Care' },
            { id: '2', name: 'Quest Diagnostics' },
            { id: '3', name: 'AudioHealth Center' },
          ]}
          services={[
            { id: '1', name: 'DOT Physical Examination' },
            { id: '2', name: 'Drug Screen - 5 Panel' },
            { id: '3', name: 'Hearing Test' },
            { id: '4', name: 'Vision Test' },
          ]}
        />
      </>
    );
  },
};

export const SetupModalBrandedPortal: StoryObj<typeof RecurringServiceSetupModal> = {
  render: () => {
    const [open, setOpen] = useState(true);

    return (
      <>
        <button
          onClick={() => setOpen(true)}
          className="rounded-lg bg-primary px-4 py-2 text-white"
        >
          Open Modal
        </button>
        <RecurringServiceSetupModal
          open={open}
          onClose={() => setOpen(false)}
          onSave={(data) => {
            console.log('Save:', data);
            setOpen(false);
          }}
          showProviderSelector={false}
          services={[
            { id: '1', name: 'DOT Physical Examination' },
            { id: '2', name: 'Drug Screen - 5 Panel' },
            { id: '3', name: 'Hearing Test' },
          ]}
        />
      </>
    );
  },
};

export const Grid: StoryObj<typeof RecurringServiceGrid> = {
  render: () => {
    const [services, setServices] = useState(sampleServices);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingService, setEditingService] = useState<RecurringService | null>(null);

    const handleDelete = (service: RecurringService) => {
      if (confirm(`Delete ${service.serviceName}?`)) {
        setServices(services.filter((s) => s.id !== service.id));
      }
    };

    const handleEdit = (service: RecurringService) => {
      setEditingService(service);
      setModalOpen(true);
    };

    const handleAdd = () => {
      setEditingService(null);
      setModalOpen(true);
    };

    const handleSave = (data: RecurringServiceFormData) => {
      console.log('Save:', data);
      setModalOpen(false);
    };

    return (
      <>
        <RecurringServiceGrid
          services={services}
          onDelete={handleDelete}
          onEdit={handleEdit}
          onAdd={handleAdd}
        />
        <RecurringServiceSetupModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
          initialData={
            editingService
              ? {
                  providerId: editingService.providerId,
                  serviceId: editingService.serviceId,
                  occurrence: editingService.occurrence,
                  overrideConsent: editingService.overrideConsent || false,
                }
              : undefined
          }
          providers={[
            { id: 'prv-001', name: 'MedExpress Urgent Care' },
            { id: 'prv-002', name: 'Quest Diagnostics' },
            { id: 'prv-003', name: 'AudioHealth Center' },
          ]}
          services={[
            { id: 'srv-001', name: 'DOT Physical Examination' },
            { id: 'srv-002', name: 'Drug Screen - 5 Panel' },
            { id: 'srv-003', name: 'Hearing Test' },
            { id: 'srv-004', name: 'Vision Test' },
          ]}
        />
      </>
    );
  },
};

export const GridBrandedPortal: StoryObj<typeof RecurringServiceGrid> = {
  args: {
    services: sampleServices,
    showProvider: false,
  },
};

export const EmptyGrid: StoryObj<typeof RecurringServiceGrid> = {
  args: {
    services: [],
    showProvider: true,
  },
};

export const Mobile: Story = {
  args: {
    service: sampleService,
  },
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};
