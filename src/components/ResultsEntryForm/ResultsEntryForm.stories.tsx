import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import {
  ResultsEntryForm,
  ResultsEntryModal,
  ProviderContact,
} from './ResultsEntryForm';
import { Card } from '../Card';
import { Button } from '../Button';

// Sample provider contacts
const sampleContacts: ProviderContact[] = [
  {
    id: '1',
    firstName: 'Dr. Sarah',
    lastName: 'Johnson',
    degree: 'MD',
    positionTitle: 'Medical Director',
  },
  {
    id: '2',
    firstName: 'Dr. Michael',
    lastName: 'Chen',
    degree: 'DO',
    positionTitle: 'Physician',
  },
  {
    id: '3',
    firstName: 'Emily',
    lastName: 'Williams',
    degree: 'NP',
    positionTitle: 'Nurse Practitioner',
  },
];

const meta: Meta<typeof ResultsEntryForm> = {
  title: 'Components/ResultsEntryForm',
  component: ResultsEntryForm,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A form for entering test/service results including pass/fail status, dates, recommendations, file uploads, and provider selection.',
      },
    },
  },
  argTypes: {
    serviceName: {
      control: 'text',
      description: 'Service name displayed in the form header',
    },
    employeeFirstName: {
      control: 'text',
      description: 'Employee first name',
    },
    employeeLastName: {
      control: 'text',
      description: 'Employee last name',
    },
    showFileUpload: {
      control: 'boolean',
      description: 'Whether to show the file upload section',
    },
    showApplyToAll: {
      control: 'boolean',
      description: 'Whether to show "apply to all services" checkbox',
    },
    providerContacts: {
      control: 'object',
      description: 'Array of provider contacts to display',
    },
    initialData: {
      control: 'object',
      description: 'Initial form data',
    },
    onSubmit: {
      action: 'submitted',
      description: 'Called when form is submitted',
    },
    onCancel: {
      action: 'cancelled',
      description: 'Called when form is cancelled',
    },
  },
  args: {
    serviceName: 'Drug Screen - 5 Panel',
    employeeFirstName: 'John',
    employeeLastName: 'Doe',
    showFileUpload: true,
    showApplyToAll: true,
    providerContacts: sampleContacts,
  },
};

export default meta;
type Story = StoryObj<typeof ResultsEntryForm>;

// Interactive with controls
export const Interactive: Story = {
  decorators: [
    (Story) => (
      <Card className="max-w-2xl p-6">
        <Story />
      </Card>
    ),
  ],
};

// Basic form without file upload
export const Default: Story = {
  args: {
    serviceName: 'Physical Exam',
    employeeFirstName: 'Jane',
    employeeLastName: 'Smith',
    showFileUpload: false,
    providerContacts: [],
  },
  decorators: [
    (Story) => (
      <Card className="max-w-2xl p-6">
        <Story />
      </Card>
    ),
  ],
};

// With provider contacts
export const WithProviderContacts: Story = {
  args: {
    serviceName: 'Drug Screen - 10 Panel',
    employeeFirstName: 'Robert',
    employeeLastName: 'Johnson',
    showFileUpload: false,
  },
  decorators: [
    (Story) => (
      <Card className="max-w-2xl p-6">
        <Story />
      </Card>
    ),
  ],
};

// With file upload
export const WithFileUpload: Story = {
  args: {
    serviceName: 'Lab Results',
    employeeFirstName: 'Alice',
    employeeLastName: 'Brown',
    showFileUpload: true,
    providerContacts: [],
  },
  decorators: [
    (Story) => (
      <Card className="max-w-2xl p-6">
        <Story />
      </Card>
    ),
  ],
};

// Full featured
export const FullFeatured: Story = {
  args: {
    serviceName: 'Comprehensive Health Screen',
    employeeFirstName: 'David',
    employeeLastName: 'Wilson',
    showFileUpload: true,
    showApplyToAll: true,
  },
  decorators: [
    (Story) => (
      <Card className="max-w-2xl p-6">
        <Story />
      </Card>
    ),
  ],
};

// With initial data
export const WithInitialData: Story = {
  args: {
    serviceName: 'Drug Screen - 5 Panel',
    employeeFirstName: 'Mark',
    employeeLastName: 'Taylor',
    initialData: {
      result: 'passed',
      dateDrawn: '2024-01-15',
      dateCompleted: '2024-01-16',
      recommendations:
        'All results within normal range. No follow-up required.',
    },
    showFileUpload: false,
  },
  decorators: [
    (Story) => (
      <Card className="max-w-2xl p-6">
        <Story />
      </Card>
    ),
  ],
};

// No provider contacts (warning state)
export const NoProviderContacts: Story = {
  args: {
    serviceName: 'Hearing Test',
    employeeFirstName: 'Susan',
    employeeLastName: 'Davis',
    providerContacts: [],
    showFileUpload: true,
  },
  decorators: [
    (Story) => (
      <Card className="max-w-2xl p-6">
        <Story />
      </Card>
    ),
  ],
};

// Modal variant - needs custom render for modal state management
function ModalVariantStory() {
  const [open, setOpen] = React.useState(true);

  return (
    <div className="p-4">
      {!open && (
        <Button onClick={() => setOpen(true)}>Open Results Entry</Button>
      )}

      <ResultsEntryModal
        open={open}
        onOpenChange={setOpen}
        serviceName="Vision Screening"
        employeeFirstName="Thomas"
        employeeLastName="Anderson"
        providerContacts={sampleContacts}
        showFileUpload
        onSubmit={(data) => {
          console.log('Submitted:', data);
          setOpen(false);
        }}
      />
    </div>
  );
}

export const ModalVariant: Story = {
  render: () => <ModalVariantStory />,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story: 'The ResultsEntryModal wraps the form in a Modal dialog.',
      },
    },
  },
};

// Custom labels (i18n)
export const CustomLabels: Story = {
  args: {
    serviceName: 'Examen de Drogas',
    employeeFirstName: 'Carlos',
    employeeLastName: 'García',
    showFileUpload: true,
    labels: {
      testResults: 'Resultados de la Prueba',
      passed: 'Aprobado',
      failed: 'Fallido',
      alternateResultsText: 'Texto de Resultado Alternativo',
      dateDrawn: 'Fecha de Extracción',
      dateCompleted: 'Fecha de Finalización',
      useResultsForAllServices: 'Usar resultados para todos los servicios',
      providerRecommendations: 'Recomendaciones del Proveedor',
      results: 'Resultados',
      browseFiles: 'Examinar',
      provider: 'Proveedor',
      selectProvider: 'Por favor seleccione proveedor',
      submit: 'Enviar',
      close: 'Cerrar',
      pleaseSelectResult: 'Por favor seleccione un resultado',
    },
  },
  decorators: [
    (Story) => (
      <Card className="max-w-2xl p-6">
        <Story />
      </Card>
    ),
  ],
};

// Mobile viewport
export const Mobile: Story = {
  args: {
    serviceName: 'Drug Screen',
    employeeFirstName: 'John',
    employeeLastName: 'Doe',
    showFileUpload: false,
    providerContacts: sampleContacts.slice(0, 2),
  },
  decorators: [
    (Story) => (
      <Card className="p-4">
        <Story />
      </Card>
    ),
  ],
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};
