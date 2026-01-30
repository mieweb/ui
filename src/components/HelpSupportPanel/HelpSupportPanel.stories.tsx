import type { Meta, StoryObj } from '@storybook/react';
import {
  HelpSupportPanel,
  type FAQItem,
  type SupportContact,
} from './HelpSupportPanel';

const meta: Meta<typeof HelpSupportPanel> = {
  title: 'Provider/HelpSupportPanel',
  component: HelpSupportPanel,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    onSubmitRequest: { action: 'submit request' },
    onStartChat: { action: 'start chat' },
  },
};

export default meta;
type Story = StoryObj<typeof HelpSupportPanel>;

const mockFaqs: FAQItem[] = [
  {
    id: '1',
    question: 'How do I add a new employer to my network?',
    answer:
      'To add a new employer, navigate to the Employers section and click "Add Employer". You can search for existing employers or create a new one by entering their business information. Once added, you can configure pricing and services.',
    category: 'Employers',
  },
  {
    id: '2',
    question: 'How do I process an order?',
    answer:
      "When a new order comes in, you'll receive a notification. Go to the Orders section, find the order, and click to open it. Review the patient information and services requested, then schedule the appointment or mark as walk-in. After completing services, enter the results and submit.",
    category: 'Orders',
  },
  {
    id: '3',
    question: 'How do I create and send an invoice?',
    answer:
      'Navigate to Invoices and click "Create Invoice". Select the employer, add line items for completed services, and review the total. You can then save as draft or send immediately via email.',
    category: 'Billing',
  },
  {
    id: '4',
    question: 'Can I customize my service pricing?',
    answer:
      'Yes! Go to Settings > Service Pricing to view and edit your service prices. You can set different prices for different employers or use your default rates. Bulk price adjustments are also available.',
    category: 'Settings',
  },
  {
    id: '5',
    question: 'How do I add users to my provider account?',
    answer:
      'Go to Settings > Team Management and click "Invite User". Enter their email address and select their role (Admin, Staff, or Read-only). They\'ll receive an email invitation to join your organization.',
    category: 'Settings',
  },
  {
    id: '6',
    question: 'What happens if I need to cancel an order?',
    answer:
      'To cancel an order, open the order details and click "Cancel Order". You\'ll be asked to provide a reason. The employer will be notified and no charges will be applied for cancelled orders.',
    category: 'Orders',
  },
];

const mockContacts: SupportContact[] = [
  {
    type: 'email',
    label: 'Email Support',
    value: 'support@bluehive.com',
    availability: 'Response within 24 hours',
  },
  {
    type: 'phone',
    label: 'Phone Support',
    value: '1-800-555-0123',
    availability: 'Mon-Fri 8am-6pm EST',
  },
  {
    type: 'chat',
    label: 'Live Chat',
    value: 'Available now',
    availability: 'Mon-Fri 9am-5pm EST',
  },
];

export const Default: Story = {
  args: {
    faqs: mockFaqs,
    contacts: mockContacts,
    chatAvailable: true,
    docsUrl: 'https://docs.bluehive.com',
  },
};

export const WithSuccessMessage: Story = {
  args: {
    faqs: mockFaqs,
    contacts: mockContacts,
    successMessage:
      "Your message has been sent. We'll respond within 24 hours.",
  },
};

export const Submitting: Story = {
  args: {
    faqs: mockFaqs,
    contacts: mockContacts,
    isSubmitting: true,
  },
};

export const NoChatAvailable: Story = {
  args: {
    faqs: mockFaqs,
    contacts: mockContacts.filter((c) => c.type !== 'chat'),
    chatAvailable: false,
  },
};

export const FAQsOnly: Story = {
  args: {
    faqs: mockFaqs,
    onSubmitRequest: undefined,
  },
};

export const ContactFormOnly: Story = {
  args: {
    contacts: mockContacts,
  },
};

export const NoFAQs: Story = {
  args: {
    contacts: mockContacts,
  },
};

export const MinimalContacts: Story = {
  args: {
    faqs: mockFaqs,
    contacts: [mockContacts[0]],
  },
};

export const NoDocsLink: Story = {
  args: {
    faqs: mockFaqs,
    contacts: mockContacts,
    docsUrl: undefined,
  },
};

export const Mobile: Story = {
  args: {
    faqs: mockFaqs.slice(0, 4),
    contacts: mockContacts,
    chatAvailable: true,
  },
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};
