'use client';

import * as React from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../Table/Table';
import { Badge } from '../Badge/Badge';
import { Button } from '../Button/Button';
import { Avatar } from '../Avatar/Avatar';

export interface ProviderUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status?: 'active' | 'pending' | 'inactive';
  avatarUrl?: string;
  lastActive?: Date | string;
  invitedAt?: Date | string;
}

export interface ProviderUsersTableProps {
  /** List of users to display */
  users: ProviderUser[];
  /** Handler for editing a user's role */
  onEditRole?: (user: ProviderUser) => void;
  /** Handler for removing a user */
  onRemove?: (user: ProviderUser) => void;
  /** Handler for resending invitation */
  onResendInvite?: (user: ProviderUser) => void;
  /** Current user ID (to disable self-removal) */
  currentUserId?: string;
  /** Whether to show the actions column */
  showActions?: boolean;
  /** Whether the table is loading */
  isLoading?: boolean;
  /** Empty state message */
  emptyMessage?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * ProviderUsersTable displays a table of users associated with a provider.
 */
export function ProviderUsersTable({
  users,
  onEditRole,
  onRemove,
  onResendInvite,
  currentUserId,
  showActions = true,
  isLoading = false,
  emptyMessage = 'No users found',
  className = '',
}: ProviderUsersTableProps) {
  const formatDate = (date: Date | string | undefined) => {
    if (!date) return '—';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusVariant = (
    status?: string
  ): 'default' | 'success' | 'warning' | 'secondary' => {
    switch (status) {
      case 'active':
        return 'success';
      case 'pending':
        return 'warning';
      case 'inactive':
        return 'secondary';
      default:
        return 'default';
    }
  };

  if (isLoading) {
    return (
      <div className={`space-y-3 ${className}`}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-16 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div
        className={`text-center py-12 text-gray-500 dark:text-gray-400 ${className}`}
      >
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
        <p className="mt-2">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto ${className}`}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Active</TableHead>
            {showActions && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => {
            const isCurrentUser = currentUserId === user.id;
            const isPending = user.status === 'pending';

            return (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={user.avatarUrl}
                      name={user.name}
                      size="sm"
                    />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {user.name}
                        {isCurrentUser && (
                          <span className="ml-1.5 text-xs text-gray-500">
                            (you)
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {user.email}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {user.role}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(user.status)}>
                    {user.status || 'active'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {isPending
                      ? `Invited ${formatDate(user.invitedAt)}`
                      : formatDate(user.lastActive)}
                  </span>
                </TableCell>
                {showActions && (
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {isPending && onResendInvite && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onResendInvite(user)}
                          title="Resend invitation"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            />
                          </svg>
                        </Button>
                      )}
                      {onEditRole && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditRole(user)}
                          title="Edit role"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                            />
                          </svg>
                        </Button>
                      )}
                      {onRemove && !isCurrentUser && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemove(user)}
                          title="Remove user"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

export default ProviderUsersTable;
