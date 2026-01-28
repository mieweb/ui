import * as React from 'react';
import { cn } from '../../utils/cn';

// =============================================================================
// Types
// =============================================================================

/**
 * Credit card data for display (masked)
 */
export interface CreditCardData {
  /** Payment method ID */
  id: string;
  /** Card brand (visa, mastercard, amex, discover, etc.) */
  brand: string;
  /** Last 4 digits of card number */
  last4: string;
  /** Expiration month (1-12) */
  expMonth: number;
  /** Expiration year (4 digits) */
  expYear: number;
  /** Whether this is the default payment method */
  isDefault?: boolean;
}

/**
 * Bank account data for display (masked)
 */
export interface BankAccountData {
  /** Payment method ID */
  id: string;
  /** Bank name */
  bankName?: string;
  /** Last 4 digits of account number */
  last4: string;
  /** Account holder name */
  holderName?: string;
  /** Account type (checking, savings) */
  accountType?: 'checking' | 'savings';
  /** Account holder type */
  holderType?: 'individual' | 'company';
  /** Account status (new, verified, etc.) */
  status?: 'new' | 'verified' | 'errored' | 'verification_failed';
  /** Whether this is the default payment method */
  isDefault?: boolean;
}

// =============================================================================
// Card Brand Icons
// =============================================================================

const CARD_BRAND_ICONS: Record<string, string> = {
  visa: 'cc-visa',
  mastercard: 'cc-mastercard',
  amex: 'cc-amex',
  discover: 'cc-discover',
  diners: 'cc-diners-club',
  jcb: 'cc-jcb',
  unionpay: 'credit-card',
  default: 'credit-card',
};

function getCardBrandIcon(brand: string): string {
  return CARD_BRAND_ICONS[brand.toLowerCase()] || CARD_BRAND_ICONS.default;
}

// =============================================================================
// PaymentMethodCard - Credit Card Display
// =============================================================================

export interface PaymentMethodCardProps {
  /** Credit card data */
  card: CreditCardData;
  /** Whether the card is selectable */
  selectable?: boolean;
  /** Whether this card is currently selected */
  selected?: boolean;
  /** Callback when card is selected */
  onSelect?: (id: string) => void;
  /** Callback when delete is clicked */
  onDelete?: (id: string) => void;
  /** Whether to show delete button */
  showDelete?: boolean;
  /** Whether the card is disabled */
  disabled?: boolean;
  /** Custom className */
  className?: string;
}

/**
 * Displays a credit card with brand icon, masked number, and expiration.
 *
 * @example
 * ```tsx
 * <PaymentMethodCard
 *   card={{
 *     id: 'pm_123',
 *     brand: 'visa',
 *     last4: '4242',
 *     expMonth: 12,
 *     expYear: 2025,
 *     isDefault: true,
 *   }}
 *   onSelect={(id) => console.log('Selected:', id)}
 *   onDelete={(id) => console.log('Delete:', id)}
 *   showDelete
 * />
 * ```
 */
export function PaymentMethodCard({
  card,
  selectable = false,
  selected = false,
  onSelect,
  onDelete,
  showDelete = false,
  disabled = false,
  className,
}: PaymentMethodCardProps) {
  const handleSelect = () => {
    if (!disabled && selectable && onSelect) {
      onSelect(card.id);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!disabled && onDelete) {
      onDelete(card.id);
    }
  };

  // Format expiration as MM/YY
  const expMonth = String(card.expMonth).padStart(2, '0');
  const expYear = String(card.expYear).slice(-2);

  return (
    <div
      className={cn(
        'relative flex h-full flex-col justify-between rounded-xl border p-4',
        card.isDefault || selected
          ? 'border-brand-500 bg-brand-50 dark:border-brand-400 dark:bg-brand-900/20'
          : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800',
        selectable && !disabled && 'hover:border-brand-400 cursor-pointer',
        disabled && 'cursor-not-allowed opacity-50',
        className
      )}
      onClick={handleSelect}
      role={selectable ? 'button' : undefined}
      tabIndex={selectable ? 0 : undefined}
      onKeyDown={
        selectable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') handleSelect();
            }
          : undefined
      }
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-2 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <i
            className={cn(
              'fab',
              `fa-${getCardBrandIcon(card.brand)}`,
              'text-lg'
            )}
            aria-hidden="true"
          />
          <span className="text-xs font-medium text-gray-600 uppercase dark:text-gray-400">
            Credit Card
          </span>
        </div>
        {(card.isDefault || selected) && (
          <span className="text-brand-600 dark:text-brand-400 text-xs font-medium">
            Default
          </span>
        )}
      </div>

      {/* Card Details */}
      <div className="mt-3 flex items-center justify-between">
        <div className="font-mono text-sm text-gray-900 dark:text-gray-100">
          <span className="hidden lg:inline">•••• •••• </span>•••• {card.last4}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {expMonth}/{expYear}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between border-t border-gray-200 pt-2 dark:border-gray-700">
        {selectable && !card.isDefault && !selected ? (
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="default_payment"
              value={card.id}
              checked={selected}
              onChange={handleSelect}
              disabled={disabled}
              className="text-brand-600 focus:ring-brand-500"
            />
            <span className="text-xs text-gray-600 dark:text-gray-400">
              Set as default
            </span>
          </label>
        ) : (
          <div />
        )}
        {showDelete && onDelete && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={disabled}
            className={cn(
              'rounded p-1 text-red-500 transition-colors hover:bg-red-50 hover:text-red-600',
              'dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300',
              'disabled:cursor-not-allowed disabled:opacity-50'
            )}
            aria-label={`Delete card ending in ${card.last4}`}
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

PaymentMethodCard.displayName = 'PaymentMethodCard';

// =============================================================================
// PaymentMethodBank - Bank Account Display
// =============================================================================

export interface PaymentMethodBankProps {
  /** Bank account data */
  account: BankAccountData;
  /** Whether the account is selectable */
  selectable?: boolean;
  /** Whether this account is currently selected */
  selected?: boolean;
  /** Callback when account is selected */
  onSelect?: (id: string) => void;
  /** Callback when delete is clicked */
  onDelete?: (id: string) => void;
  /** Whether to show delete button */
  showDelete?: boolean;
  /** Whether the account is disabled */
  disabled?: boolean;
  /** Custom className */
  className?: string;
}

/**
 * Displays a bank account with masked number and account details.
 *
 * @example
 * ```tsx
 * <PaymentMethodBank
 *   account={{
 *     id: 'ba_123',
 *     bankName: 'Chase',
 *     last4: '6789',
 *     holderName: 'John Doe',
 *     accountType: 'checking',
 *     status: 'verified',
 *     isDefault: true,
 *   }}
 *   onSelect={(id) => console.log('Selected:', id)}
 *   onDelete={(id) => console.log('Delete:', id)}
 *   showDelete
 * />
 * ```
 */
export function PaymentMethodBank({
  account,
  selectable = false,
  selected = false,
  onSelect,
  onDelete,
  showDelete = false,
  disabled = false,
  className,
}: PaymentMethodBankProps) {
  const handleSelect = () => {
    if (!disabled && selectable && onSelect) {
      onSelect(account.id);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!disabled && onDelete) {
      onDelete(account.id);
    }
  };

  const isNew = account.status === 'new';
  const isError =
    account.status === 'errored' || account.status === 'verification_failed';

  return (
    <div
      className={cn(
        'relative flex h-full flex-col justify-between rounded-xl border p-4',
        isNew &&
          'border-yellow-400 bg-yellow-50 dark:border-yellow-600 dark:bg-yellow-900/20',
        isError &&
          'border-red-400 bg-red-50 dark:border-red-600 dark:bg-red-900/20',
        !isNew &&
          !isError &&
          (account.isDefault || selected
            ? 'border-brand-500 bg-brand-50 dark:border-brand-400 dark:bg-brand-900/20'
            : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800'),
        selectable && !disabled && 'hover:border-brand-400 cursor-pointer',
        disabled && 'cursor-not-allowed opacity-50',
        className
      )}
      onClick={handleSelect}
      role={selectable ? 'button' : undefined}
      tabIndex={selectable ? 0 : undefined}
      onKeyDown={
        selectable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') handleSelect();
            }
          : undefined
      }
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-2 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <BankIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          <span className="text-xs font-medium text-gray-600 uppercase dark:text-gray-400">
            ACH
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isNew && (
            <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400">
              Pending Verification
            </span>
          )}
          {isError && (
            <span className="text-xs font-medium text-red-600 dark:text-red-400">
              Verification Failed
            </span>
          )}
          {!isNew && !isError && (account.isDefault || selected) && (
            <span className="text-brand-600 dark:text-brand-400 text-xs font-medium">
              Default
            </span>
          )}
        </div>
      </div>

      {/* Account Details */}
      <div className="mt-3 space-y-1">
        {account.bankName && (
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {account.bankName}
          </div>
        )}
        <div className="font-mono text-sm text-gray-600 dark:text-gray-400">
          <span className="hidden lg:inline">•••• •••• </span>••••{' '}
          {account.last4}
        </div>
        {account.accountType && (
          <div className="text-xs text-gray-500 capitalize dark:text-gray-500">
            {account.accountType}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between border-t border-gray-200 pt-2 dark:border-gray-700">
        {selectable && !account.isDefault && !selected ? (
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="default_payment"
              value={account.id}
              checked={selected}
              onChange={handleSelect}
              disabled={disabled}
              className="text-brand-600 focus:ring-brand-500"
            />
            <span className="text-xs text-gray-600 dark:text-gray-400">
              Set as default
            </span>
          </label>
        ) : (
          <div />
        )}
        {showDelete && onDelete && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={disabled}
            className={cn(
              'rounded p-1 text-red-500 transition-colors hover:bg-red-50 hover:text-red-600',
              'dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300',
              'disabled:cursor-not-allowed disabled:opacity-50'
            )}
            aria-label={`Delete account ending in ${account.last4}`}
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

PaymentMethodBank.displayName = 'PaymentMethodBank';

// =============================================================================
// PaymentMethodList - Collection of Payment Methods
// =============================================================================

export type PaymentMethod =
  | { type: 'card'; data: CreditCardData }
  | { type: 'bank'; data: BankAccountData };

export interface PaymentMethodListProps {
  /** Array of payment methods */
  methods: PaymentMethod[];
  /** Currently selected method ID */
  selectedId?: string;
  /** Callback when a method is selected */
  onSelect?: (id: string) => void;
  /** Callback when a method is deleted */
  onDelete?: (id: string) => void;
  /** Whether to show delete buttons */
  showDelete?: boolean;
  /** Whether the list is disabled */
  disabled?: boolean;
  /** Empty state message */
  emptyMessage?: string;
  /** Custom className */
  className?: string;
}

/**
 * Displays a grid of payment methods (cards and bank accounts).
 *
 * @example
 * ```tsx
 * <PaymentMethodList
 *   methods={[
 *     { type: 'card', data: { id: '1', brand: 'visa', last4: '4242', expMonth: 12, expYear: 2025 } },
 *     { type: 'bank', data: { id: '2', bankName: 'Chase', last4: '6789' } },
 *   ]}
 *   selectedId="1"
 *   onSelect={(id) => console.log('Selected:', id)}
 *   onDelete={(id) => console.log('Delete:', id)}
 *   showDelete
 * />
 * ```
 */
export function PaymentMethodList({
  methods,
  selectedId,
  onSelect,
  onDelete,
  showDelete = false,
  disabled = false,
  emptyMessage = 'No payment methods found. Add a credit card or bank account to get started.',
  className,
}: PaymentMethodListProps) {
  if (methods.length === 0) {
    return (
      <div
        className={cn(
          'rounded-lg border border-yellow-300 bg-yellow-50 p-4',
          'dark:border-yellow-700 dark:bg-yellow-900/20',
          className
        )}
      >
        <div className="flex items-start gap-3">
          <WarningIcon className="h-5 w-5 flex-shrink-0 text-yellow-600 dark:text-yellow-400" />
          <div>
            <h4 className="font-medium text-yellow-800 dark:text-yellow-200">
              No Payment Methods
            </h4>
            <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
              {emptyMessage}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('grid gap-4 md:grid-cols-2', className)}>
      {methods.map((method) =>
        method.type === 'card' ? (
          <PaymentMethodCard
            key={method.data.id}
            card={method.data}
            selectable={!!onSelect}
            selected={selectedId === method.data.id}
            onSelect={onSelect}
            onDelete={onDelete}
            showDelete={showDelete}
            disabled={disabled}
          />
        ) : (
          <PaymentMethodBank
            key={method.data.id}
            account={method.data}
            selectable={!!onSelect}
            selected={selectedId === method.data.id}
            onSelect={onSelect}
            onDelete={onDelete}
            showDelete={showDelete}
            disabled={disabled}
          />
        )
      )}
    </div>
  );
}

PaymentMethodList.displayName = 'PaymentMethodList';

// =============================================================================
// Icons
// =============================================================================

function BankIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z"
      />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
      />
    </svg>
  );
}

function WarningIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
      />
    </svg>
  );
}
