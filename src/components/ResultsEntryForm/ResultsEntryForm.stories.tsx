import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import {
  ResultsEntryForm,
  ResultsEntryModal,
  ProviderContact,
} from './ResultsEntryForm';
import { Card } from '../Card';
import { Button } from '../Button';

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
};

export default meta;
type Story = StoryObj<typeof ResultsEntryForm>;

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

// Interactive demo
function InteractiveDemo() {
  const [submitted, setSubmitted] = React.useState<object | null>(null);

  return (
    <div className="space-y-6">
      <Card className="max-w-2xl p-6">
        <h3 className="mb-4 text-lg font-semibold">Drug Screen - 5 Panel</h3>
        <p className="text-muted-foreground mb-6 text-sm">John Doe</p>

        <ResultsEntryForm
          serviceName="Drug Screen - 5 Panel"
          employeeFirstName="John"
          employeeLastName="Doe"
          providerContacts={sampleContacts}
          showFileUpload
          onSubmit={(data) => setSubmitted(data)}
        />

        <div className="mt-6 flex justify-end gap-3 border-t pt-4">
          <Button variant="outline">Close</Button>
          <Button>Submit</Button>
        </div>
      </Card>

      {submitted && (
        <Card className="bg-success/10 max-w-2xl p-4">
          <h4 className="mb-2 font-medium">Submitted Data:</h4>
          <pre className="overflow-auto text-xs">
            {JSON.stringify(submitted, null, 2)}
          </pre>
        </Card>
      )}
    </div>
  );
}

export const Interactive: Story = {
  render: () => <InteractiveDemo />,
};

// Basic form
export const Default: Story = {
  render: () => (
    <Card className="max-w-2xl p-6">
      <ResultsEntryForm
        serviceName="Physical Exam"
        employeeFirstName="Jane"
        employeeLastName="Smith"
        onSubmit={(data) => console.log('Submitted:', data)}
      />
    </Card>
  ),
};

// With provider contacts
export const WithProviderContacts: Story = {
  render: () => (
    <Card className="max-w-2xl p-6">
      <ResultsEntryForm
        serviceName="Drug Screen - 10 Panel"
        employeeFirstName="Robert"
        employeeLastName="Johnson"
        providerContacts={sampleContacts}
        onSubmit={(data) => console.log('Submitted:', data)}
      />
    </Card>
  ),
};

// With file upload
export const WithFileUpload: Story = {
  render: () => (
    <Card className="max-w-2xl p-6">
      <ResultsEntryForm
        serviceName="Lab Results"
        employeeFirstName="Alice"
        employeeLastName="Brown"
        showFileUpload
        onSubmit={(data) => console.log('Submitted:', data)}
      />
    </Card>
  ),
};

// Full featured
export const FullFeatured: Story = {
  render: () => (
    <Card className="max-w-2xl p-6">
      <ResultsEntryForm
        serviceName="Comprehensive Health Screen"
        employeeFirstName="David"
        employeeLastName="Wilson"
        providerContacts={sampleContacts}
        showFileUpload
        showApplyToAll
        onSubmit={(data) => console.log('Submitted:', data)}
      />
    </Card>
  ),
};

// With initial data
export const WithInitialData: Story = {
  render: () => (
    <Card className="max-w-2xl p-6">
      <ResultsEntryForm
        serviceName="Drug Screen - 5 Panel"
        employeeFirstName="Mark"
        employeeLastName="Taylor"
        initialData={{
          result: 'passed',
          dateDrawn: '2024-01-15',
          dateCompleted: '2024-01-16',
          recommendations:
            'All results within normal range. No follow-up required.',
        }}
        providerContacts={sampleContacts}
        onSubmit={(data) => console.log('Submitted:', data)}
      />
    </Card>
  ),
};

// No provider contacts (warning state)
export const NoProviderContacts: Story = {
  render: () => (
    <Card className="max-w-2xl p-6">
      <ResultsEntryForm
        serviceName="Hearing Test"
        employeeFirstName="Susan"
        employeeLastName="Davis"
        providerContacts={[]}
        showFileUpload
        onSubmit={(data) => console.log('Submitted:', data)}
      />
    </Card>
  ),
};

// Modal variant
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
};

// Custom labels (i18n)
export const CustomLabels: Story = {
  render: () => (
    <Card className="max-w-2xl p-6">
      <ResultsEntryForm
        serviceName="Examen de Drogas"
        employeeFirstName="Carlos"
        employeeLastName="García"
        providerContacts={sampleContacts}
        showFileUpload
        onSubmit={(data) => console.log('Submitted:', data)}
        labels={{
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
        }}
      />
    </Card>
  ),
};

// Mobile viewport
export const Mobile: Story = {
  render: () => (
    <Card className="p-4">
      <ResultsEntryForm
        serviceName="Drug Screen"
        employeeFirstName="John"
        employeeLastName="Doe"
        providerContacts={sampleContacts.slice(0, 2)}
        onSubmit={(data) => console.log('Submitted:', data)}
      />
    </Card>
  ),
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};
