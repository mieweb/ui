'use client';

import * as React from 'react';
import { Button } from '../Button/Button';
import { Badge } from '../Badge/Badge';

export interface OrderSidebarProps {
  /** Order ID */
  orderId?: string;
  /** Current order status */
  status?: string;
  /** Patient/Employee name */
  patientName?: string;
  /** Employer name */
  employerName?: string;
  /** Service name */
  serviceName?: string;
  /** Order creation date */
  createdAt?: Date | string;
  /** Scheduled date */
  scheduledDate?: Date | string;
  /** Priority level */
  priority?: 'normal' | 'urgent' | 'stat';
  /** Notes about the order */
  notes?: string;
  /** Whether the sidebar is open */
  open?: boolean;
  /** Handler for closing the sidebar */
  onClose?: () => void;
  /** Actions available for this order */
  actions?: Array<{
    id: string;
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    disabled?: boolean;
  }>;
  /** Additional content to render */
  children?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

/**
 * OrderSidebar displays order details in a slide-out panel.
 */
export function OrderSidebar({
  orderId,
  status,
  patientName,
  employerName,
  serviceName,
  createdAt,
  scheduledDate,
  priority = 'normal',
  notes,
  open = false,
  onClose,
  actions = [],
  children,
  className = '',
}: OrderSidebarProps) {
  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'Not set';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusVariant = (
    s?: string
  ): 'default' | 'secondary' | 'success' | 'warning' | 'danger' => {
    switch (s?.toLowerCase()) {
      case 'completed':
        return 'success';
      case 'pending':
      case 'in progress':
        return 'warning';
      case 'cancelled':
      case 'rejected':
        return 'danger';
      default:
        return 'default';
    }
  };

  const getPriorityColor = () => {
    switch (priority) {
      case 'stat':
        return 'text-red-600 dark:text-red-400';
      case 'urgent':
        return 'text-orange-600 dark:text-orange-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-md translate-x-0 transform bg-white shadow-xl transition-transform duration-300 dark:bg-gray-900 ${className} `}
        role="dialog"
        aria-modal="true"
        aria-label="Order details"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Order Details
            </h2>
            {orderId && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                #{orderId}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Close sidebar"
          >
            <svg
              className="h-5 w-5 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="h-[calc(100%-8rem)] overflow-y-auto p-4">
          {/* Status & Priority */}
          <div className="mb-4 flex items-center gap-2">
            {status && (
              <Badge variant={getStatusVariant(status)}>{status}</Badge>
            )}
            {priority !== 'normal' && (
              <span
                className={`text-xs font-medium uppercase ${getPriorityColor()}`}
              >
                {priority}
              </span>
            )}
          </div>

          {/* Details */}
          <div className="space-y-4">
            {patientName && (
              <dl>
                <dt className="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">
                  Patient
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {patientName}
                </dd>
              </dl>
            )}

            {employerName && (
              <dl>
                <dt className="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">
                  Employer
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {employerName}
                </dd>
              </dl>
            )}

            {serviceName && (
              <dl>
                <dt className="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">
                  Service
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {serviceName}
                </dd>
              </dl>
            )}

            <div className="grid grid-cols-2 gap-4">
              <dl>
                <dt className="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">
                  Created
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {formatDate(createdAt)}
                </dd>
              </dl>
              <dl>
                <dt className="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">
                  Scheduled
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {formatDate(scheduledDate)}
                </dd>
              </dl>
            </div>

            {notes && (
              <dl>
                <dt className="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">
                  Notes
                </dt>
                <dd className="mt-1 rounded-lg bg-gray-50 p-3 text-sm text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                  {notes}
                </dd>
              </dl>
            )}
          </div>

          {/* Additional content */}
          {children && <div className="mt-6">{children}</div>}
        </div>

        {/* Actions */}
        {actions.length > 0 && (
          <div className="absolute right-0 bottom-0 left-0 border-t border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
            <div className="flex flex-wrap gap-2">
              {actions.map((action) => (
                <Button
                  key={action.id}
                  variant={action.variant || 'primary'}
                  onClick={action.onClick}
                  disabled={action.disabled}
                  className="flex-1"
                >
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

export default OrderSidebar;
