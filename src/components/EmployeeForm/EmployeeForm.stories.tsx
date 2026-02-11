import type { Meta, StoryObj } from '@storybook/react';
import { EmployeeForm } from './EmployeeForm';

const meta: Meta<typeof EmployeeForm> = {
  component: EmployeeForm,
  title: 'Forms/EmployeeForm',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    onSubmit: { action: 'submitted' },
    onCancel: { action: 'cancelled' },
    customFields: { control: false },
    labels: { control: 'object' },
    className: { table: { disable: true } },
  },
};

export default meta;
type Story = StoryObj<typeof EmployeeForm>;

// Sample departments
const sampleDepartments = [
  { id: 'dept-1', name: 'Engineering' },
  { id: 'dept-2', name: 'Marketing' },
  { id: 'dept-3', name: 'Sales' },
  { id: 'dept-4', name: 'Human Resources' },
  { id: 'dept-5', name: 'Finance' },
];

/**
 * Interactive playground for the EmployeeForm component.
 */
export const Interactive: Story = {
  args: {
    departments: sampleDepartments,
    isNew: true,
    mode: 'create',
  },
};

/**
 * Default new employee form.
 */
export const Default: Story = {
  args: {
    departments: sampleDepartments,
    isNew: true,
    mode: 'create',
  },
};

/**
 * Order mode - changes the submit button text.
 */
export const OrderMode: Story = {
  args: {
    departments: sampleDepartments,
    isNew: true,
    mode: 'order',
  },
};

/**
 * Editing an existing employee with pre-filled data.
 */
export const EditExisting: Story = {
  args: {
    departments: sampleDepartments,
    isNew: false,
    initialData: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      dob: '1990-05-15',
      departments: ['dept-1'],
      title: 'Senior Engineer',
      address: {
        street1: '123 Main St',
        street2: 'Apt 4B',
        city: 'Fort Wayne',
        state: 'IN',
        postalCode: '46802',
        country: 'USA',
      },
      phones: [
        { number: '(555) 123-4567', type: 'cell' },
        { number: '(555) 987-6543', type: 'work' },
      ],
      isActive: true,
      additionalInfo: 'Team lead for the frontend development team.',
    },
  },
};

/**
 * Form without departments.
 */
export const NoDepartments: Story = {
  args: {
    departments: [],
    isNew: true,
    mode: 'create',
  },
};

/**
 * Form for a user that's already linked to an account (no invite option).
 */
export const UserLinked: Story = {
  args: {
    departments: sampleDepartments,
    isNew: true,
    isUserLinked: true,
    mode: 'create',
  },
};

/**
 * Form with an inactive employee.
 */
export const InactiveEmployee: Story = {
  args: {
    departments: sampleDepartments,
    isNew: false,
    initialData: {
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      dob: '1985-10-20',
      isActive: false,
    },
  },
};

/**
 * Form with custom field injection.
 */
export const WithCustomFields: Story = {
  args: {
    departments: sampleDepartments,
    isNew: true,
    mode: 'create',
    customFields: (
      <div className="bg-muted border-border rounded-lg border p-4">
        <h4 className="mb-2 font-medium">Custom Fields Section</h4>
        <p className="text-muted-foreground text-sm">
          Additional custom fields can be injected here.
        </p>
      </div>
    ),
  },
};

/**
 * Form with custom labels for internationalization.
 */
export const CustomLabels: Story = {
  args: {
    departments: sampleDepartments,
    isNew: true,
    mode: 'create',
    labels: {
      required: 'Campos Requeridos',
      firstName: 'Nombre',
      lastName: 'Apellido',
      email: 'Correo Electrónico',
      dob: 'Fecha de Nacimiento',
      department: 'Departamento',
      selectDepartments: 'Seleccionar departamentos',
      title: 'Título',
      address: 'Dirección',
      phone: 'Teléfono',
      accountStatus: 'Estado de la Cuenta',
      active: 'Activa',
      inactive: 'Inactiva',
      additionalInformation: 'Información Adicional',
      inviteEmployee: 'Invitar Empleado',
      save: 'Guardar',
      cancel: 'Cancelar',
    },
  },
};

/**
 * Mobile viewport.
 */
export const Mobile: Story = {
  args: {
    departments: sampleDepartments,
    isNew: true,
    mode: 'create',
  },
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};

/**
 * Tablet viewport.
 */
export const Tablet: Story = {
  args: {
    departments: sampleDepartments,
    isNew: true,
    mode: 'create',
    initialData: {
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah.johnson@example.com',
      dob: '1992-03-22',
    },
  },
  parameters: {
    viewport: { defaultViewport: 'tablet' },
  },
};

/**
 * Full form with all features enabled.
 */
export const FullFeatured: Story = {
  args: {
    departments: sampleDepartments,
    isNew: true,
    mode: 'create',
    customFields: (
      <div className="grid grid-cols-2 gap-4">
        <div className="border-border rounded border border-dashed p-3">
          <span className="text-muted-foreground text-xs">Badge ID</span>
        </div>
        <div className="border-border rounded border border-dashed p-3">
          <span className="text-muted-foreground text-xs">Start Date</span>
        </div>
      </div>
    ),
    initialData: {
      firstName: 'Alex',
      lastName: 'Thompson',
      email: 'alex.thompson@example.com',
      dob: '1988-07-14',
      title: 'Product Manager',
      phones: [{ number: '', type: 'cell' }],
    },
  },
};
