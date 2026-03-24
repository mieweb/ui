'use client';

import * as React from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../Table/Table';
import { Badge } from '../Badge/Badge';
import { Button } from '../Button/Button';
import { Avatar } from '../Avatar/Avatar';
import { MoreVerticalIcon, SendIcon, PencilIcon, TrashIcon } from '../Icons';
import { cn } from '../../utils/cn';
import { useClickOutside } from '../../hooks/useClickOutside';
import { useEscapeKey } from '../../hooks/useEscapeKey';

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

/** Row-level overflow menu for user actions */
function RowActionsMenu({
  user,
  isCurrentUser,
  isPending,
  onEditRole,
  onRemove,
  onResendInvite,
}: {
  user: ProviderUser;
  isCurrentUser: boolean;
  isPending: boolean;
  onEditRole?: (user: ProviderUser) => void;
  onRemove?: (user: ProviderUser) => void;
  onResendInvite?: (user: ProviderUser) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  useClickOutside(
    menuRef,
    React.useCallback(() => setOpen(false), [])
  );
  useEscapeKey(
    React.useCallback(() => setOpen(false), []),
    open
  );

  const hasActions =
    (isPending && !!onResendInvite) ||
    !!onEditRole ||
    (!!onRemove && !isCurrentUser);
  if (!hasActions) return null;

  return (
    <div className="relative inline-flex" ref={menuRef}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen((v) => !v)}
        aria-label="Row actions"
        aria-haspopup="menu"
        aria-expanded={open}
        className="h-7 w-7"
      >
        <MoreVerticalIcon size={16} />
      </Button>
      {open && (
        <div
          role="menu"
          className={cn(
            'absolute top-full right-0 z-50 mt-1',
            'min-w-[10rem] rounded-lg border border-neutral-200 bg-white py-1 shadow-lg',
            'dark:border-neutral-700 dark:bg-neutral-800'
          )}
        >
          {isPending && onResendInvite && (
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700"
              onClick={() => {
                onResendInvite(user);
                setOpen(false);
              }}
            >
              <SendIcon size={14} />
              Resend Invite
            </button>
          )}
          {onEditRole && (
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700"
              onClick={() => {
                onEditRole(user);
                setOpen(false);
              }}
            >
              <PencilIcon size={14} />
              Edit Role
            </button>
          )}
          {onRemove && !isCurrentUser && (
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
              onClick={() => {
                onRemove(user);
                setOpen(false);
              }}
            >
              <TrashIcon size={14} />
              Remove
            </button>
          )}
        </div>
      )}
    </div>
  );
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
            className="h-16 animate-pulse rounded bg-gray-100 dark:bg-gray-800"
          />
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div
        className={`py-12 text-center text-gray-500 dark:text-gray-400 ${className}`}
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
    <div data-slot="provider-users-table" className={`overflow-x-auto ${className}`}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Active</TableHead>
            {showActions && (
              <TableHead className="w-10">
                <span className="sr-only">Actions</span>
              </TableHead>
            )}
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
                    <Avatar src={user.avatarUrl} name={user.name} size="sm" />
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
                    <RowActionsMenu
                      user={user}
                      isCurrentUser={isCurrentUser}
                      isPending={isPending}
                      onEditRole={onEditRole}
                      onRemove={onRemove}
                      onResendInvite={onResendInvite}
                    />
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
