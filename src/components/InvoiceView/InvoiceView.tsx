'use client';

import * as React from 'react';
import { Badge } from '../Badge/Badge';
import { Button } from '../Button/Button';
import { Card, CardContent } from '../Card/Card';

export interface InvoiceLineItem {
  id: string;
  description: string;
  employeeName?: string;
  serviceName?: string;
  date?: Date | string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface InvoiceDetails {
  id: string;
  invoiceNumber: string;
  status: 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled';
  issuedDate: Date | string;
  dueDate: Date | string;
  paidDate?: Date | string;
  // Provider info
  providerName: string;
  providerAddress?: string;
  providerPhone?: string;
  providerEmail?: string;
  // Employer info
  employerName: string;
  employerAddress?: string;
  employerEmail?: string;
  // Line items
  lineItems: InvoiceLineItem[];
  // Totals
  subtotal: number;
  tax?: number;
  taxRate?: number;
  total: number;
  // Notes
  notes?: string;
  paymentTerms?: string;
}

export interface InvoiceViewProps {
  /** Invoice details */
  invoice: InvoiceDetails;
  /** Handler for back button */
  onBack?: () => void;
  /** Handler for editing the invoice */
  onEdit?: () => void;
  /** Handler for sending the invoice */
  onSend?: () => void;
  /** Handler for marking as paid */
  onMarkPaid?: () => void;
  /** Handler for downloading PDF */
  onDownload?: () => void;
  /** Handler for voiding the invoice */
  onVoid?: () => void;
  /** Currency symbol */
  currency?: string;
  /** Provider logo URL */
  providerLogoUrl?: string;
  /** Whether actions are disabled */
  actionsDisabled?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * InvoiceView displays a detailed view of an invoice with actions.
 */
export function InvoiceView({
  invoice,
  onBack,
  onEdit,
  onSend,
  onMarkPaid,
  onDownload,
  onVoid,
  currency = '$',
  providerLogoUrl,
  actionsDisabled = false,
  className = '',
}: InvoiceViewProps) {
  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return `${currency}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getStatusVariant = (status: InvoiceDetails['status']) => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'overdue':
        return 'danger';
      case 'sent':
      case 'viewed':
        return 'warning';
      case 'cancelled':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const canEdit = invoice.status === 'draft';
  const canSend = invoice.status === 'draft';
  const canMarkPaid = ['sent', 'viewed', 'overdue'].includes(invoice.status);
  const canVoid = invoice.status !== 'paid' && invoice.status !== 'cancelled';

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack}>
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back
            </Button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {invoice.invoiceNumber}
              </h1>
              <Badge variant={getStatusVariant(invoice.status)}>
                {invoice.status}
              </Badge>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Issued {formatDate(invoice.issuedDate)}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          {onDownload && (
            <Button
              variant="outline"
              size="sm"
              onClick={onDownload}
              disabled={actionsDisabled}
            >
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Download
            </Button>
          )}
          {onEdit && canEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              disabled={actionsDisabled}
            >
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Edit
            </Button>
          )}
          {onVoid && canVoid && (
            <Button
              variant="outline"
              size="sm"
              onClick={onVoid}
              disabled={actionsDisabled}
            >
              Void
            </Button>
          )}
          {onMarkPaid && canMarkPaid && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onMarkPaid}
              disabled={actionsDisabled}
            >
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Mark Paid
            </Button>
          )}
          {onSend && canSend && (
            <Button size="sm" onClick={onSend} disabled={actionsDisabled}>
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
              Send Invoice
            </Button>
          )}
        </div>
      </div>

      {/* Invoice document */}
      <Card className="print:shadow-none print:border-0">
        <CardContent className="p-6 sm:p-8">
          {/* Provider and Invoice Info */}
          <div className="flex flex-col sm:flex-row justify-between gap-6 mb-8">
            <div>
              {providerLogoUrl ? (
                <img
                  src={providerLogoUrl}
                  alt={invoice.providerName}
                  className="h-12 mb-2 object-contain"
                />
              ) : (
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {invoice.providerName}
                </h2>
              )}
              {invoice.providerAddress && (
                <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">
                  {invoice.providerAddress}
                </p>
              )}
              {invoice.providerPhone && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {invoice.providerPhone}
                </p>
              )}
              {invoice.providerEmail && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {invoice.providerEmail}
                </p>
              )}
            </div>
            <div className="text-left sm:text-right">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                INVOICE
              </h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {invoice.invoiceNumber}
              </p>
              <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <p>
                  <span className="font-medium">Issue Date:</span>{' '}
                  {formatDate(invoice.issuedDate)}
                </p>
                <p>
                  <span className="font-medium">Due Date:</span>{' '}
                  {formatDate(invoice.dueDate)}
                </p>
                {invoice.paidDate && (
                  <p>
                    <span className="font-medium">Paid Date:</span>{' '}
                    {formatDate(invoice.paidDate)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Bill To */}
          <div className="mb-8">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
              Bill To
            </p>
            <p className="font-medium text-gray-900 dark:text-white">
              {invoice.employerName}
            </p>
            {invoice.employerAddress && (
              <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">
                {invoice.employerAddress}
              </p>
            )}
            {invoice.employerEmail && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {invoice.employerEmail}
              </p>
            )}
          </div>

          {/* Line Items */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden mb-6">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Description
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase hidden sm:table-cell">
                    Qty
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase hidden sm:table-cell">
                    Unit Price
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {invoice.lineItems.map((item) => (
                  <tr key={item.id} className="bg-white dark:bg-gray-900">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {item.description}
                      </p>
                      {item.employeeName && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {item.employeeName}
                          {item.date && ` • ${formatDate(item.date)}`}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300 hidden sm:table-cell">
                      {item.quantity}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300 hidden sm:table-cell">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">
                      {formatCurrency(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-full sm:w-64 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  Subtotal
                </span>
                <span className="text-gray-900 dark:text-white">
                  {formatCurrency(invoice.subtotal)}
                </span>
              </div>
              {invoice.tax !== undefined && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Tax {invoice.taxRate && `(${invoice.taxRate}%)`}
                  </span>
                  <span className="text-gray-900 dark:text-white">
                    {formatCurrency(invoice.tax)}
                  </span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                <span className="font-semibold text-gray-900 dark:text-white">
                  Total
                </span>
                <span className="text-xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(invoice.total)}
                </span>
              </div>
            </div>
          </div>

          {/* Notes / Payment Terms */}
          {(invoice.notes || invoice.paymentTerms) && (
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 space-y-4">
              {invoice.paymentTerms && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                    Payment Terms
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {invoice.paymentTerms}
                  </p>
                </div>
              )}
              {invoice.notes && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                    Notes
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                    {invoice.notes}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default InvoiceView;
