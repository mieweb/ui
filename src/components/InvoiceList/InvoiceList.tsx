'use client';

import * as React from 'react';
import { Badge } from '../Badge/Badge';
import { Button } from '../Button/Button';
import { Input } from '../Input/Input';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  employerName: string;
  employerId?: string;
  amount: number;
  status: 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled';
  issuedDate: Date | string;
  dueDate: Date | string;
  paidDate?: Date | string;
  lineItemCount?: number;
}

export interface InvoiceListProps {
  /** List of invoices */
  invoices: Invoice[];
  /** Handler for clicking an invoice */
  onInvoiceClick?: (invoice: Invoice) => void;
  /** Handler for creating a new invoice */
  onCreateInvoice?: () => void;
  /** Handler for searching */
  onSearch?: (query: string) => void;
  /** Handler for filtering by status */
  onFilterStatus?: (status: Invoice['status'] | 'all') => void;
  /** Active status filter */
  statusFilter?: Invoice['status'] | 'all';
  /** Whether the list is loading */
  isLoading?: boolean;
  /** Currency symbol */
  currency?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * InvoiceList displays a filterable list of invoices.
 */
export function InvoiceList({
  invoices,
  onInvoiceClick,
  onCreateInvoice,
  onSearch,
  onFilterStatus,
  statusFilter = 'all',
  isLoading = false,
  currency = '$',
  className = '',
}: InvoiceListProps) {
  const [searchQuery, setSearchQuery] = React.useState('');

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch?.(query);
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return `${currency}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getStatusVariant = (status: Invoice['status']) => {
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

  const statusOptions: { value: Invoice['status'] | 'all'; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'draft', label: 'Draft' },
    { value: 'sent', label: 'Sent' },
    { value: 'viewed', label: 'Viewed' },
    { value: 'paid', label: 'Paid' },
    { value: 'overdue', label: 'Overdue' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  const filteredInvoices = React.useMemo(() => {
    let result = invoices;

    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter((inv) => inv.status === statusFilter);
    }

    // Apply search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (inv) =>
          inv.invoiceNumber.toLowerCase().includes(q) ||
          inv.employerName.toLowerCase().includes(q)
      );
    }

    return result;
  }, [invoices, statusFilter, searchQuery]);

  const totals = React.useMemo(() => {
    return {
      total: filteredInvoices.reduce((sum, inv) => sum + inv.amount, 0),
      paid: filteredInvoices
        .filter((inv) => inv.status === 'paid')
        .reduce((sum, inv) => sum + inv.amount, 0),
      outstanding: filteredInvoices
        .filter((inv) => ['sent', 'viewed', 'overdue'].includes(inv.status))
        .reduce((sum, inv) => sum + inv.amount, 0),
    };
  }, [filteredInvoices]);

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex animate-pulse gap-3">
          <div className="h-10 flex-1 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-10 w-24 rounded bg-gray-200 dark:bg-gray-700" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <svg
            className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <Input
            type="text"
            placeholder="Search invoices..."
            value={searchQuery}
            onChange={handleSearch}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          {/* Status filter tabs */}
          <div className="flex overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
            {statusOptions.slice(0, 4).map((option) => (
              <button
                key={option.value}
                onClick={() => onFilterStatus?.(option.value)}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  statusFilter === option.value
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800'
                } `}
              >
                {option.label}
              </button>
            ))}
          </div>
          {onCreateInvoice && (
            <Button onClick={onCreateInvoice} size="sm">
              <svg
                className="mr-1 h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Create
            </Button>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {formatCurrency(totals.total)}
          </p>
        </div>
        <div className="rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
          <p className="text-xs text-green-600 dark:text-green-400">Paid</p>
          <p className="text-lg font-bold text-green-600 dark:text-green-400">
            {formatCurrency(totals.paid)}
          </p>
        </div>
        <div className="rounded-lg bg-orange-50 p-3 dark:bg-orange-900/20">
          <p className="text-xs text-orange-600 dark:text-orange-400">
            Outstanding
          </p>
          <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
            {formatCurrency(totals.outstanding)}
          </p>
        </div>
      </div>

      {/* List */}
      {filteredInvoices.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 py-12 text-center dark:border-gray-700">
          <svg
            className="mx-auto mb-3 h-12 w-12 text-gray-400 dark:text-gray-600"
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
          <p className="mb-3 text-gray-500 dark:text-gray-400">
            {searchQuery || statusFilter !== 'all'
              ? 'No invoices match your filters'
              : 'No invoices yet'}
          </p>
          {onCreateInvoice && !searchQuery && statusFilter === 'all' && (
            <Button variant="outline" onClick={onCreateInvoice}>
              Create Invoice
            </Button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                  Invoice
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase sm:table-cell dark:text-gray-400">
                  Employer
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase md:table-cell dark:text-gray-400">
                  Issued
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase md:table-cell dark:text-gray-400">
                  Due
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                  Amount
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredInvoices.map((invoice) => (
                <tr
                  key={invoice.id}
                  onClick={() => onInvoiceClick?.(invoice)}
                  className={`bg-white dark:bg-gray-900 ${onInvoiceClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800' : ''} `}
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {invoice.invoiceNumber}
                    </p>
                    <p className="text-xs text-gray-500 sm:hidden dark:text-gray-400">
                      {invoice.employerName}
                    </p>
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {invoice.employerName}
                    </p>
                  </td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(invoice.issuedDate)}
                    </p>
                  </td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    <p
                      className={`text-sm ${invoice.status === 'overdue' ? 'font-medium text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}
                    >
                      {formatDate(invoice.dueDate)}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatCurrency(invoice.amount)}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={getStatusVariant(invoice.status)}>
                      {invoice.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default InvoiceList;
