'use client';

import * as React from 'react';
import { Badge } from '../Badge/Badge';
import { Button } from '../Button/Button';

export interface Payment {
  id: string;
  invoiceNumber: string;
  invoiceId?: string;
  employerName: string;
  amount: number;
  method: 'credit_card' | 'ach' | 'check' | 'cash' | 'other';
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  date: Date | string;
  reference?: string;
  cardLast4?: string;
}

export interface PaymentHistoryTableProps {
  /** List of payments */
  payments: Payment[];
  /** Handler for clicking a payment */
  onPaymentClick?: (payment: Payment) => void;
  /** Handler for clicking an invoice link */
  onInvoiceClick?: (invoiceId: string) => void;
  /** Handler for issuing a refund */
  onRefund?: (payment: Payment) => void;
  /** Whether the table is loading */
  isLoading?: boolean;
  /** Currency symbol */
  currency?: string;
  /** Empty state message */
  emptyMessage?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * PaymentHistoryTable displays a table of payment transactions.
 */
export function PaymentHistoryTable({
  payments,
  onPaymentClick,
  onInvoiceClick,
  onRefund,
  isLoading = false,
  currency = '$',
  emptyMessage = 'No payment history',
  className = '',
}: PaymentHistoryTableProps) {
  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return `${currency}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getStatusVariant = (status: Payment['status']) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'danger';
      case 'refunded':
        return 'secondary';
    }
  };

  const getMethodLabel = (method: Payment['method']) => {
    switch (method) {
      case 'credit_card':
        return 'Credit Card';
      case 'ach':
        return 'ACH Transfer';
      case 'check':
        return 'Check';
      case 'cash':
        return 'Cash';
      default:
        return 'Other';
    }
  };

  const getMethodIcon = (method: Payment['method']) => {
    switch (method) {
      case 'credit_card':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        );
      case 'ach':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
          </svg>
        );
      case 'check':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  if (isLoading) {
    return (
      <div className={`space-y-2 ${className}`}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div
        className={`text-center py-12 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg ${className}`}
      >
        <svg
          className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-600 mb-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
        <p className="text-gray-500 dark:text-gray-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div
      className={`border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden ${className}`}
    >
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Date
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">
              Invoice
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">
              Employer
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">
              Method
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Amount
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Status
            </th>
            {onRefund && (
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Action
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {payments.map((payment) => (
            <tr
              key={payment.id}
              onClick={() => onPaymentClick?.(payment)}
              className={`
                bg-white dark:bg-gray-900
                ${onPaymentClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800' : ''}
              `}
            >
              <td className="px-4 py-3">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatDate(payment.date)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 sm:hidden">
                  {payment.invoiceNumber}
                </p>
              </td>
              <td className="px-4 py-3 hidden sm:table-cell">
                {payment.invoiceId && onInvoiceClick ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onInvoiceClick(payment.invoiceId!);
                    }}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {payment.invoiceNumber}
                  </button>
                ) : (
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {payment.invoiceNumber}
                  </p>
                )}
              </td>
              <td className="px-4 py-3 hidden md:table-cell">
                <p className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[150px]">
                  {payment.employerName}
                </p>
              </td>
              <td className="px-4 py-3 hidden lg:table-cell">
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                  {getMethodIcon(payment.method)}
                  <span className="text-sm">
                    {getMethodLabel(payment.method)}
                    {payment.cardLast4 && ` •••• ${payment.cardLast4}`}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3 text-right">
                <p
                  className={`font-medium ${payment.status === 'refunded' ? 'text-gray-500 dark:text-gray-400 line-through' : 'text-gray-900 dark:text-white'}`}
                >
                  {formatCurrency(payment.amount)}
                </p>
              </td>
              <td className="px-4 py-3 text-center">
                <Badge variant={getStatusVariant(payment.status)}>
                  {payment.status}
                </Badge>
              </td>
              {onRefund && (
                <td className="px-4 py-3 text-right">
                  {payment.status === 'completed' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRefund(payment);
                      }}
                    >
                      Refund
                    </Button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default PaymentHistoryTable;
