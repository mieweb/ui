'use client';

import * as React from 'react';
import { Badge } from '../Badge/Badge';
import { Button } from '../Button/Button';
import { Avatar } from '../Avatar/Avatar';

export interface PendingClaim {
  id: string;
  claimantName: string;
  claimantEmail: string;
  claimantRole?: string;
  submittedDate: Date | string;
  message?: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface PendingClaimsTableProps {
  /** List of pending claims */
  claims: PendingClaim[];
  /** Handler for approving a claim */
  onApprove?: (claim: PendingClaim) => void;
  /** Handler for rejecting a claim */
  onReject?: (claim: PendingClaim) => void;
  /** Handler for viewing claim details */
  onViewDetails?: (claim: PendingClaim) => void;
  /** Whether actions are disabled */
  actionsDisabled?: boolean;
  /** Whether the table is loading */
  isLoading?: boolean;
  /** Empty state message */
  emptyMessage?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * PendingClaimsTable displays a table of pending provider claims.
 */
export function PendingClaimsTable({
  claims,
  onApprove,
  onReject,
  onViewDetails,
  actionsDisabled = false,
  isLoading = false,
  emptyMessage = 'No pending claims',
  className = '',
}: PendingClaimsTableProps) {
  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString();
  };

  const getStatusVariant = (status: PendingClaim['status']) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'danger';
      default:
        return 'warning';
    }
  };

  if (isLoading) {
    return (
      <div className={`space-y-2 ${className}`}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (claims.length === 0) {
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
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
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
      {/* Desktop table */}
      <div className="hidden md:block">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Claimant
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Role
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Submitted
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {claims.map((claim) => (
              <tr key={claim.id} className="bg-white dark:bg-gray-900">
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={claim.claimantName} size="sm" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {claim.claimantName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {claim.claimantEmail}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {claim.claimantRole || 'Not specified'}
                  </p>
                </td>
                <td className="px-4 py-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(claim.submittedDate)}
                  </p>
                </td>
                <td className="px-4 py-4 text-center">
                  <Badge variant={getStatusVariant(claim.status)}>
                    {claim.status}
                  </Badge>
                </td>
                <td className="px-4 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {onViewDetails && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewDetails(claim)}
                      >
                        View
                      </Button>
                    )}
                    {claim.status === 'pending' && (
                      <>
                        {onReject && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onReject(claim)}
                            disabled={actionsDisabled}
                          >
                            Reject
                          </Button>
                        )}
                        {onApprove && (
                          <Button
                            size="sm"
                            onClick={() => onApprove(claim)}
                            disabled={actionsDisabled}
                          >
                            Approve
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-700">
        {claims.map((claim) => (
          <div key={claim.id} className="p-4 bg-white dark:bg-gray-900">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <Avatar name={claim.claimantName} size="sm" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {claim.claimantName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {claim.claimantEmail}
                  </p>
                </div>
              </div>
              <Badge variant={getStatusVariant(claim.status)}>
                {claim.status}
              </Badge>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                <span>{claim.claimantRole || 'No role'}</span>
                <span className="mx-2">•</span>
                <span>{formatDate(claim.submittedDate)}</span>
              </div>
            </div>
            {claim.status === 'pending' && (onApprove || onReject) && (
              <div className="mt-3 flex gap-2">
                {onViewDetails && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewDetails(claim)}
                    className="flex-1"
                  >
                    View
                  </Button>
                )}
                {onReject && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onReject(claim)}
                    disabled={actionsDisabled}
                    className="flex-1"
                  >
                    Reject
                  </Button>
                )}
                {onApprove && (
                  <Button
                    size="sm"
                    onClick={() => onApprove(claim)}
                    disabled={actionsDisabled}
                    className="flex-1"
                  >
                    Approve
                  </Button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default PendingClaimsTable;
