import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import {
  PaymentMethodCard,
  PaymentMethodBank,
  PaymentMethodList,
  type CreditCardData,
  type BankAccountData,
  type PaymentMethod,
} from './PaymentMethod';

// =============================================================================
// PaymentMethodCard Stories
// =============================================================================

const cardMeta: Meta<typeof PaymentMethodCard> = {
  title: 'Commerce & Payments/PaymentMethod/Card',
  component: PaymentMethodCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Displays a credit card with brand icon, masked number, and expiration date.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-[300px]">
        <Story />
      </div>
    ),
  ],
};

export default cardMeta;
type CardStory = StoryObj<typeof PaymentMethodCard>;

const sampleCard: CreditCardData = {
  id: 'card_123',
  brand: 'visa',
  last4: '4242',
  expMonth: 12,
  expYear: 2025,
  isDefault: false,
};

export const Default: CardStory = {
  args: {
    card: sampleCard,
  },
};

export const DefaultCard: CardStory = {
  args: {
    card: { ...sampleCard, isDefault: true },
  },
  parameters: {
    docs: {
      description: { story: 'A card marked as the default payment method.' },
    },
  },
};

export const Mastercard: CardStory = {
  args: {
    card: { ...sampleCard, brand: 'mastercard', last4: '5678' },
  },
};

export const Amex: CardStory = {
  args: {
    card: { ...sampleCard, brand: 'amex', last4: '0005' },
  },
};

export const Selectable: CardStory = {
  render: function SelectableCard() {
    const [selected, setSelected] = useState(false);
    return (
      <PaymentMethodCard
        card={sampleCard}
        selectable
        selected={selected}
        onSelect={() => setSelected(!selected)}
        showDelete
        onDelete={(id) => console.log('Delete:', id)}
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive card that can be selected as default.',
      },
    },
  },
};

export const Disabled: CardStory = {
  args: {
    card: sampleCard,
    disabled: true,
    selectable: true,
    showDelete: true,
  },
};

// =============================================================================
// PaymentMethodBank Stories
// =============================================================================

export const BankAccount: StoryObj<typeof PaymentMethodBank> = {
  render: () => {
    const account: BankAccountData = {
      id: 'ba_123',
      bankName: 'Chase',
      last4: '6789',
      holderName: 'John Doe',
      accountType: 'checking',
      holderType: 'individual',
      status: 'verified',
      isDefault: false,
    };
    return (
      <PaymentMethodBank
        account={account}
        showDelete
        onDelete={(id) => console.log('Delete:', id)}
      />
    );
  },
  parameters: {
    docs: {
      description: { story: 'A verified bank account.' },
    },
  },
};

export const BankAccountDefault: StoryObj<typeof PaymentMethodBank> = {
  render: () => {
    const account: BankAccountData = {
      id: 'ba_123',
      bankName: 'Chase',
      last4: '6789',
      status: 'verified',
      isDefault: true,
    };
    return <PaymentMethodBank account={account} />;
  },
  parameters: {
    docs: {
      description: { story: 'A bank account marked as default.' },
    },
  },
};

export const BankAccountPending: StoryObj<typeof PaymentMethodBank> = {
  render: () => {
    const account: BankAccountData = {
      id: 'ba_123',
      bankName: 'Bank of America',
      last4: '1234',
      status: 'new',
    };
    return <PaymentMethodBank account={account} />;
  },
  parameters: {
    docs: {
      description: { story: 'A bank account pending verification.' },
    },
  },
};

export const BankAccountError: StoryObj<typeof PaymentMethodBank> = {
  render: () => {
    const account: BankAccountData = {
      id: 'ba_123',
      bankName: 'Wells Fargo',
      last4: '9999',
      status: 'verification_failed',
    };
    return <PaymentMethodBank account={account} />;
  },
  parameters: {
    docs: {
      description: { story: 'A bank account with failed verification.' },
    },
  },
};

// =============================================================================
// PaymentMethodList Stories
// =============================================================================

export const MethodList: StoryObj<typeof PaymentMethodList> = {
  render: function MethodListStory() {
    const [selectedId, setSelectedId] = useState<string | undefined>('card_1');

    const methods: PaymentMethod[] = [
      {
        type: 'card',
        data: {
          id: 'card_1',
          brand: 'visa',
          last4: '4242',
          expMonth: 12,
          expYear: 2025,
          isDefault: true,
        },
      },
      {
        type: 'card',
        data: {
          id: 'card_2',
          brand: 'mastercard',
          last4: '5678',
          expMonth: 6,
          expYear: 2024,
        },
      },
      {
        type: 'bank',
        data: {
          id: 'bank_1',
          bankName: 'Chase',
          last4: '6789',
          accountType: 'checking',
          status: 'verified',
        },
      },
      {
        type: 'bank',
        data: {
          id: 'bank_2',
          bankName: 'Bank of America',
          last4: '1234',
          status: 'new',
        },
      },
    ];

    return (
      <div className="w-[600px]">
        <PaymentMethodList
          methods={methods}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onDelete={(id) => console.log('Delete:', id)}
          showDelete
        />
      </div>
    );
  },
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        story: 'A list of mixed payment methods (cards and bank accounts).',
      },
    },
  },
};

export const EmptyList: StoryObj<typeof PaymentMethodList> = {
  render: () => (
    <div className="w-[600px]">
      <PaymentMethodList methods={[]} />
    </div>
  ),
  parameters: {
    layout: 'centered',
    docs: {
      description: { story: 'Empty state when no payment methods exist.' },
    },
  },
};

export const CardsOnly: StoryObj<typeof PaymentMethodList> = {
  render: () => {
    const methods: PaymentMethod[] = [
      {
        type: 'card',
        data: {
          id: '1',
          brand: 'visa',
          last4: '4242',
          expMonth: 12,
          expYear: 2025,
          isDefault: true,
        },
      },
      {
        type: 'card',
        data: {
          id: '2',
          brand: 'amex',
          last4: '0005',
          expMonth: 3,
          expYear: 2026,
        },
      },
    ];
    return (
      <div className="w-[600px]">
        <PaymentMethodList
          methods={methods}
          showDelete
          onDelete={(id) => console.log('Delete:', id)}
        />
      </div>
    );
  },
  parameters: {
    layout: 'centered',
    docs: {
      description: { story: 'List showing only credit cards.' },
    },
  },
};

// Mobile viewport
export const Mobile: StoryObj<typeof PaymentMethodList> = {
  render: function MobileStory() {
    const methods: PaymentMethod[] = [
      {
        type: 'card',
        data: {
          id: '1',
          brand: 'visa',
          last4: '4242',
          expMonth: 12,
          expYear: 2025,
          isDefault: true,
        },
      },
      {
        type: 'bank',
        data: { id: '2', bankName: 'Chase', last4: '6789', status: 'verified' },
      },
    ];
    return <PaymentMethodList methods={methods} showDelete />;
  },
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    docs: {
      description: { story: 'Payment method list on mobile viewport.' },
    },
  },
};
