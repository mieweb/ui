'use client';

import * as React from 'react';
import { Button } from '../Button/Button';
import { Input } from '../Input/Input';
import { Badge } from '../Badge/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../Card/Card';

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface InvoicePaymentDetails {
  invoiceNumber: string;
  status: 'unpaid' | 'paid' | 'overdue' | 'processing';
  issuedDate: Date | string;
  dueDate: Date | string;
  providerName: string;
  providerLogoUrl?: string;
  employerName: string;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  tax?: number;
  total: number;
}

export interface InvoicePaymentPageProps {
  /** Invoice details */
  invoice?: InvoicePaymentDetails;
  /** Whether the invoice is loading */
  isLoading?: boolean;
  /** Handler for submitting payment */
  onSubmitPayment?: (paymentDetails: PaymentFormData) => void;
  /** Whether payment is processing */
  isProcessing?: boolean;
  /** Error message */
  errorMessage?: string;
  /** Success message (after payment) */
  successMessage?: string;
  /** Currency symbol */
  currency?: string;
  /** Accepted payment methods */
  acceptedMethods?: ('card' | 'ach')[];
  /** Whether to show Stripe branding */
  showStripeBranding?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export interface PaymentFormData {
  method: 'card' | 'ach';
  cardNumber?: string;
  expiry?: string;
  cvc?: string;
  name: string;
  email: string;
  routingNumber?: string;
  accountNumber?: string;
}

/**
 * InvoicePaymentPage provides a public-facing invoice payment interface.
 */
export function InvoicePaymentPage({
  invoice,
  isLoading = false,
  onSubmitPayment,
  isProcessing = false,
  errorMessage,
  successMessage,
  currency = '$',
  acceptedMethods = ['card'],
  showStripeBranding = true,
  className = '',
}: InvoicePaymentPageProps) {
  const [paymentMethod, setPaymentMethod] = React.useState<'card' | 'ach'>(
    acceptedMethods[0] || 'card'
  );
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [cardNumber, setCardNumber] = React.useState('');
  const [expiry, setExpiry] = React.useState('');
  const [cvc, setCvc] = React.useState('');
  const [routingNumber, setRoutingNumber] = React.useState('');
  const [accountNumber, setAccountNumber] = React.useState('');

  const formatCurrency = (amount: number) => {
    return `${currency}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString();
  };

  const getStatusVariant = (status: InvoicePaymentDetails['status']) => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'overdue':
        return 'danger';
      case 'processing':
        return 'warning';
      default:
        return 'default';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSubmitPayment) return;

    onSubmitPayment({
      method: paymentMethod,
      name,
      email,
      ...(paymentMethod === 'card'
        ? { cardNumber, expiry, cvc }
        : { routingNumber, accountNumber }),
    });
  };

  const isValid =
    name &&
    email &&
    (paymentMethod === 'card'
      ? cardNumber && expiry && cvc
      : routingNumber && accountNumber);

  if (isLoading) {
    return (
      <div
        className={`min-h-screen bg-gray-50 p-4 sm:p-8 dark:bg-gray-900 ${className}`}
      >
        <div className="mx-auto max-w-4xl">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="h-64 rounded-lg bg-gray-200 dark:bg-gray-700" />
              <div className="h-96 rounded-lg bg-gray-200 dark:bg-gray-700" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div
        className={`flex min-h-screen items-center justify-center bg-gray-50 p-4 dark:bg-gray-900 ${className}`}
      >
        <Card className="w-full max-w-md text-center">
          <CardContent className="py-12">
            <svg
              className="mx-auto mb-4 h-16 w-16 text-gray-400 dark:text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
              Invoice Not Found
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              The invoice you&apos;re looking for doesn&apos;t exist or has
              expired.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (successMessage || invoice.status === 'paid') {
    return (
      <div
        className={`flex min-h-screen items-center justify-center bg-gray-50 p-4 dark:bg-gray-900 ${className}`}
      >
        <Card className="w-full max-w-md text-center">
          <CardContent className="py-12">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <svg
                className="h-8 w-8 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
              Payment Successful
            </h2>
            <p className="mb-4 text-gray-500 dark:text-gray-400">
              {successMessage ||
                'Thank you! Your payment has been processed successfully.'}
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Invoice {invoice.invoiceNumber}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen bg-gray-50 p-4 sm:p-8 dark:bg-gray-900 ${className}`}
    >
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          {invoice.providerLogoUrl ? (
            <img
              src={invoice.providerLogoUrl}
              alt={invoice.providerName}
              className="h-10 object-contain"
            />
          ) : (
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              {invoice.providerName}
            </span>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Invoice Summary */}
          <div>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Invoice {invoice.invoiceNumber}</CardTitle>
                  <Badge variant={getStatusVariant(invoice.status)}>
                    {invoice.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <p>Issued: {formatDate(invoice.issuedDate)}</p>
                  <p
                    className={
                      invoice.status === 'overdue'
                        ? 'font-medium text-red-600 dark:text-red-400'
                        : ''
                    }
                  >
                    Due: {formatDate(invoice.dueDate)}
                  </p>
                  <p>Bill to: {invoice.employerName}</p>
                </div>

                <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-500 dark:text-gray-400">
                        <th className="pb-2 text-left font-medium">Item</th>
                        <th className="pb-2 text-right font-medium">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-700 dark:text-gray-300">
                      {invoice.lineItems.map((item) => (
                        <tr key={item.id}>
                          <td className="py-1">{item.description}</td>
                          <td className="py-1 text-right">
                            {formatCurrency(item.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="space-y-2 border-t border-gray-200 pt-4 dark:border-gray-700">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">
                      Subtotal
                    </span>
                    <span>{formatCurrency(invoice.subtotal)}</span>
                  </div>
                  {invoice.tax !== undefined && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">
                        Tax
                      </span>
                      <span>{formatCurrency(invoice.tax)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>{formatCurrency(invoice.total)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Form */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Payment Details</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {errorMessage && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
                      <p className="text-sm text-red-600 dark:text-red-400">
                        {errorMessage}
                      </p>
                    </div>
                  )}

                  {/* Payment method toggle */}
                  {acceptedMethods.length > 1 && (
                    <div className="flex overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                      {acceptedMethods.includes('card') && (
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('card')}
                          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                            paymentMethod === 'card'
                              ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                              : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800'
                          } `}
                        >
                          Credit Card
                        </button>
                      )}
                      {acceptedMethods.includes('ach') && (
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('ach')}
                          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                            paymentMethod === 'ach'
                              ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                              : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800'
                          } `}
                        >
                          Bank Transfer
                        </button>
                      )}
                    </div>
                  )}

                  <Input
                    label="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Smith"
                    required
                  />

                  <Input
                    type="email"
                    label="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                    required
                  />

                  {paymentMethod === 'card' ? (
                    <>
                      <Input
                        label="Card Number"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        placeholder="4242 4242 4242 4242"
                        required
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          label="Expiry"
                          value={expiry}
                          onChange={(e) => setExpiry(e.target.value)}
                          placeholder="MM/YY"
                          required
                        />
                        <Input
                          label="CVC"
                          value={cvc}
                          onChange={(e) => setCvc(e.target.value)}
                          placeholder="123"
                          required
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <Input
                        label="Routing Number"
                        value={routingNumber}
                        onChange={(e) => setRoutingNumber(e.target.value)}
                        placeholder="110000000"
                        required
                      />
                      <Input
                        label="Account Number"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        placeholder="000123456789"
                        required
                      />
                    </>
                  )}

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={!isValid || isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <svg
                          className="mr-2 -ml-1 h-4 w-4 animate-spin"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Processing...
                      </>
                    ) : (
                      `Pay ${formatCurrency(invoice.total)}`
                    )}
                  </Button>

                  {showStripeBranding && (
                    <p className="text-center text-xs text-gray-400 dark:text-gray-500">
                      Secured by Stripe
                    </p>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InvoicePaymentPage;
