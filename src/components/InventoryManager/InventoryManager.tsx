'use client';

import * as React from 'react';

import { Button } from '../Button/Button';
import { Input } from '../Input/Input';
import {
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from '../Modal/Modal';
import { Textarea } from '../Textarea/Textarea';

export interface InventoryLogEntry {
  id: string;
  createdAt: Date;
  createdBy: {
    id: string;
    name: string;
  };
  type: 'credit' | 'debit';
  amount: number;
  memo?: string;
  balanceAfter?: number;
}

export interface InventoryManagerProps {
  /** Service name */
  serviceName: string;
  /** Current inventory count */
  currentInventory: number;
  /** Inventory log entries */
  logEntries?: InventoryLogEntry[];
  /** Whether to show the update modal */
  showUpdateModal?: boolean;
  /** Handler for opening update modal */
  onUpdateClick?: () => void;
  /** Handler for closing update modal */
  onUpdateModalClose?: () => void;
  /** Handler for submitting inventory update */
  onUpdateSubmit?: (data: {
    type: 'credit' | 'debit';
    amount: number;
    memo: string;
  }) => void;
  /** Whether the component is loading */
  isLoading?: boolean;
  /** Additional CSS classes */
  className?: string;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return formatDate(date);
}

/**
 * InventoryManager displays inventory status and log with ability to update.
 */
export function InventoryManager({
  serviceName,
  currentInventory,
  logEntries = [],
  showUpdateModal = false,
  onUpdateClick,
  onUpdateModalClose,
  onUpdateSubmit,
  isLoading = false,
  className = '',
}: InventoryManagerProps) {
  const [updateType, setUpdateType] = React.useState<'credit' | 'debit'>(
    'credit'
  );
  const [updateAmount, setUpdateAmount] = React.useState('');
  const [updateMemo, setUpdateMemo] = React.useState('');

  const handleSubmit = () => {
    if (!updateAmount || !onUpdateSubmit) return;

    const amount = parseInt(updateAmount, 10);
    if (isNaN(amount) || amount <= 0) return;

    onUpdateSubmit({
      type: updateType,
      amount,
      memo: updateMemo,
    });

    // Reset form
    setUpdateAmount('');
    setUpdateMemo('');
    setUpdateType('credit');
  };

  const previewChange = updateAmount
    ? updateType === 'credit'
      ? currentInventory + parseInt(updateAmount, 10)
      : currentInventory - parseInt(updateAmount, 10)
    : null;

  return (
    <div className={className}>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Remaining Inventory
          </h3>
        </div>
        <div className="text-2xl font-bold text-foreground">
          {currentInventory}{' '}
          <span className="text-sm font-normal text-muted-foreground">
            units
          </span>
        </div>
      </div>

      <hr className="mb-4 border-border" />

      {/* Log Section Header */}
      <div className="mb-4 flex items-center justify-between">
        <h4 className="text-base font-semibold text-foreground">
          Inventory Log
        </h4>
        {onUpdateClick && (
          <button
            type="button"
            onClick={onUpdateClick}
            className="text-primary hover:text-primary/80 flex items-center gap-1 text-sm font-medium"
          >
            Update Inventory
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
        )}
      </div>

      <hr className="mb-4 border-border" />

      {/* Log Table */}
      {logEntries.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="py-2 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Date
                </th>
                <th className="py-2 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  User
                </th>
                <th className="py-2 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Change
                </th>
                <th className="py-2 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Quantity
                </th>
              </tr>
            </thead>
            <tbody className="divide-border/50 divide-y">
              {logEntries.map((entry) => (
                <React.Fragment key={entry.id}>
                  <tr>
                    <td
                      className="py-2 text-sm text-muted-foreground"
                      title={formatDate(entry.createdAt)}
                    >
                      {formatRelativeTime(entry.createdAt)}
                    </td>
                    <td className="py-2 text-sm text-muted-foreground">
                      {entry.createdBy.name}
                    </td>
                    <td className="py-2 text-sm text-muted-foreground">
                      {entry.type === 'credit' ? 'Added' : 'Removed'}
                    </td>
                    <td className="py-2 text-right text-sm">
                      <span
                        className={`inline-flex items-center gap-1 ${
                          entry.type === 'credit'
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {entry.type === 'credit' ? (
                          <svg
                            className="h-3.5 w-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 4v16m8-8H4"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="h-3.5 w-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M20 12H4"
                            />
                          </svg>
                        )}
                        {entry.amount}
                      </span>
                    </td>
                  </tr>
                  {entry.memo && (
                    <tr className="bg-muted/50">
                      <td colSpan={4} className="px-2 py-1 text-right">
                        <span className="text-xs italic text-muted-foreground">
                          Memo: {entry.memo}
                        </span>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="py-8 text-center text-muted-foreground">
          <svg
            className="text-muted-foreground/50 mx-auto mb-3 h-12 w-12"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <p className="text-sm">No inventory changes recorded yet.</p>
        </div>
      )}

      {/* Update Modal */}
      <Modal
        open={showUpdateModal}
        onOpenChange={(open) => {
          if (!open && onUpdateModalClose) {
            onUpdateModalClose();
          }
        }}
        size="lg"
      >
        <ModalHeader>
          <ModalTitle>Inventory Manager</ModalTitle>
        </ModalHeader>
        <ModalBody className="space-y-4">
          <div>
            <h4 className="text-lg font-semibold text-foreground">
              {serviceName}
            </h4>
          </div>

          <div>
            <h5 className="mb-2 text-sm font-medium text-muted-foreground">
              Update Inventory
            </h5>
          </div>

          {/* Add/Remove Toggle */}
          <div className="flex gap-0">
            <button
              type="button"
              onClick={() => setUpdateType('debit')}
              className={`rounded-l-md border px-4 py-2 text-sm font-medium transition-colors ${
                updateType === 'debit'
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-input bg-card text-foreground hover:bg-muted'
              } `}
            >
              <svg
                className="mr-1 inline-block h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 12H4"
                />
              </svg>
              Remove
            </button>
            <button
              type="button"
              onClick={() => setUpdateType('credit')}
              className={`rounded-r-md border-b border-r border-t px-4 py-2 text-sm font-medium transition-colors ${
                updateType === 'credit'
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-input bg-card text-foreground hover:bg-muted'
              } `}
            >
              <svg
                className="mr-1 inline-block h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add
            </button>
          </div>

          {/* Amount Input */}
          <Input
            label="Amount"
            type="number"
            min="1"
            value={updateAmount}
            onChange={(e) => setUpdateAmount(e.target.value)}
            placeholder="0"
          />

          {/* Memo Input */}
          <Textarea
            label="Memo"
            value={updateMemo}
            onChange={(e) => setUpdateMemo(e.target.value)}
            placeholder="Reason for inventory change..."
            rows={2}
          />

          {/* Preview */}
          {previewChange !== null && updateAmount && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-700 dark:bg-amber-900/20">
              <h5 className="mb-2 text-sm font-medium text-amber-800 dark:text-amber-200">
                Description
              </h5>
              <ul className="list-inside list-disc text-sm text-amber-700 dark:text-amber-300">
                <li>
                  This will{' '}
                  {updateType === 'credit' ? (
                    <span className="font-medium">
                      add {updateAmount} units to
                    </span>
                  ) : (
                    <span className="font-medium">
                      remove {updateAmount} units from
                    </span>
                  )}{' '}
                  the provider inventory.
                </li>
                <li>
                  New inventory will be:{' '}
                  <span className="font-medium">{previewChange} units</span>
                </li>
              </ul>
            </div>
          )}
        </ModalBody>

        <ModalFooter>
          <Button variant="outline" onClick={onUpdateModalClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!updateAmount || isLoading}>
            {isLoading ? 'Saving...' : 'Save'}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}

export default InventoryManager;
