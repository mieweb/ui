import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import {
  EmployeeProfileCard,
  OrderSidebarTabs,
  OrderDetailSidebar,
  EmployeeData,
} from './EmployeeProfile';

// ============================================================================
// Sample Data
// ============================================================================

const sampleEmployee: EmployeeData = {
  id: '1',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@acmecorp.com',
  phone: [
    { number: '5551234567', type: 'cell' },
    { number: '5559876543', type: 'work' },
  ],
  title: 'Senior Software Engineer',
  companyName: 'Acme Corporation',
  department: ['Engineering', 'Product'],
  address: {
    street1: '123 Main Street',
    street2: 'Suite 100',
    city: 'Indianapolis',
    state: 'IN',
    postalCode: '46220',
  },
  photoUrl: 'https://i.pravatar.cc/256?u=john',
  dateOfBirth: '1990-05-15',
  isActive: true,
  isPaid: true,
  blurb: 'Experienced developer with 10+ years in healthcare tech.',
  extendedFields: [
    { name: 'Employee ID', value: 'EMP-001234' },
    { name: 'Start Date', value: '01/15/2020' },
  ],
};

const minimalEmployee: EmployeeData = {
  id: '2',
  firstName: 'Jane',
  lastName: 'Smith',
  companyName: 'Healthcare Inc',
  isActive: true,
};

const inactiveEmployee: EmployeeData = {
  ...sampleEmployee,
  id: '3',
  firstName: 'Mike',
  lastName: 'Johnson',
  isActive: false,
  isPaid: false,
  photoUrl: undefined,
};

// ============================================================================
// EmployeeProfileCard Stories
// ============================================================================

const meta: Meta<typeof EmployeeProfileCard> = {
  title: 'Feature Modules/EmployeeProfile/Card',
  component: EmployeeProfileCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    showPhotoEdit: { control: 'boolean' },
    defaultExpanded: { control: 'boolean' },
    showPaymentStatus: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof EmployeeProfileCard>;

export const Default: Story = {
  args: {
    employee: sampleEmployee,
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};

export const Expanded: Story = {
  args: {
    employee: sampleEmployee,
    defaultExpanded: true,
    showPaymentStatus: true,
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};

export const Minimal: Story = {
  args: {
    employee: minimalEmployee,
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Employee profile with minimal information.',
      },
    },
  },
};

export const Inactive: Story = {
  args: {
    employee: inactiveEmployee,
    defaultExpanded: true,
    showPaymentStatus: true,
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Inactive employee with unpaid status and no photo.',
      },
    },
  },
};

export const WithPhotoEdit: Story = {
  args: {
    employee: sampleEmployee,
    showPhotoEdit: true,
    onPhotoEdit: (file) => console.log('Photo uploaded:', file.name),
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Profile card with photo edit button for managers.',
      },
    },
  },
};

// ============================================================================
// OrderSidebarTabs Stories
// ============================================================================

export const TabsHorizontal: StoryObj<typeof OrderSidebarTabs> = {
  render: function Render() {
    const [activeTab, setActiveTab] = useState('timeline');
    return (
      <OrderSidebarTabs
        tabs={[
          { id: 'timeline', label: 'Timeline' },
          { id: 'services', label: 'Services' },
          { id: 'attachments', label: 'Attachments' },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        orientation="horizontal"
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Horizontal tab navigation for order sections.',
      },
    },
  },
};

export const TabsVertical: StoryObj<typeof OrderSidebarTabs> = {
  render: function Render() {
    const [activeTab, setActiveTab] = useState('timeline');
    return (
      <OrderSidebarTabs
        tabs={[
          { id: 'timeline', label: 'Timeline' },
          { id: 'services', label: 'Services' },
          { id: 'attachments', label: 'Attachments' },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        orientation="vertical"
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Vertical tab navigation for desktop sidebars.',
      },
    },
  },
};

// ============================================================================
// OrderDetailSidebar Stories
// ============================================================================

export const OrderSidebar: StoryObj<typeof OrderDetailSidebar> = {
  render: function Render() {
    const [activeTab, setActiveTab] = useState('timeline');
    return (
      <div className="h-[600px] w-80 overflow-hidden rounded-lg border">
        <OrderDetailSidebar
          employee={sampleEmployee}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          showPaymentStatus
        >
          <div className="text-muted-foreground p-4 text-center">
            {activeTab === 'timeline' && 'Timeline content goes here...'}
            {activeTab === 'services' && 'Services list goes here...'}
            {activeTab === 'attachments' && 'Attachments list goes here...'}
          </div>
        </OrderDetailSidebar>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Complete order sidebar with employee profile and tab navigation.',
      },
    },
  },
};

export const Mobile: StoryObj<typeof OrderDetailSidebar> = {
  render: function Render() {
    const [activeTab, setActiveTab] = useState('timeline');
    return (
      <div className="h-[500px] w-full max-w-md overflow-hidden rounded-lg border">
        <OrderDetailSidebar
          employee={sampleEmployee}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          showPaymentStatus
          showPhotoEdit
        >
          <div className="text-muted-foreground p-4 text-center">
            {activeTab === 'timeline' && 'Timeline content goes here...'}
            {activeTab === 'services' && 'Services list goes here...'}
            {activeTab === 'attachments' && 'Attachments list goes here...'}
          </div>
        </OrderDetailSidebar>
      </div>
    );
  },
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    docs: {
      description: {
        story: 'Order sidebar on mobile viewport.',
      },
    },
  },
};

export const CustomLabels: StoryObj<typeof EmployeeProfileCard> = {
  args: {
    employee: sampleEmployee,
    defaultExpanded: true,
    showPaymentStatus: true,
    labels: {
      moreDetails: 'mostrar más',
      lessDetails: 'mostrar menos',
      paid: 'Pagado',
      paymentPending: 'Pago Pendiente',
      yearsOld: 'años',
    },
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'Employee profile with custom labels for internationalization (Spanish example).',
      },
    },
  },
};
