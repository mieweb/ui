'use client';

import * as React from 'react';
import { Badge } from '../Badge/Badge';
import { Button } from '../Button/Button';
import { Input } from '../Input/Input';

export interface Employer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  activeEmployees?: number;
  pendingOrders?: number;
  status: 'active' | 'pending' | 'inactive';
  linkedDate?: Date | string;
  logoUrl?: string;
}

export interface EmployerListProps {
  /** List of employers */
  employers: Employer[];
  /** Handler for clicking an employer */
  onEmployerClick?: (employer: Employer) => void;
  /** Handler for creating a new employer link */
  onAddEmployer?: () => void;
  /** Handler for searching */
  onSearch?: (query: string) => void;
  /** Whether the list is loading */
  isLoading?: boolean;
  /** Whether to show the search input */
  showSearch?: boolean;
  /** Empty state message */
  emptyMessage?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * EmployerList displays a searchable list of linked employers.
 */
export function EmployerList({
  employers,
  onEmployerClick,
  onAddEmployer,
  onSearch,
  isLoading = false,
  showSearch = true,
  emptyMessage = 'No employers linked yet',
  className = '',
}: EmployerListProps) {
  const [searchQuery, setSearchQuery] = React.useState('');

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch?.(query);
  };

  const filteredEmployers = React.useMemo(() => {
    if (!searchQuery.trim()) return employers;
    const q = searchQuery.toLowerCase();
    return employers.filter(
      (emp) =>
        emp.name.toLowerCase().includes(q) ||
        emp.email?.toLowerCase().includes(q)
    );
  }, [employers, searchQuery]);

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString();
  };

  const getStatusVariant = (status: Employer['status']) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'pending':
        return 'warning';
      case 'inactive':
        return 'secondary';
    }
  };

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {showSearch && (
          <div className="h-10 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        )}
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with search and add button */}
      <div className="flex items-center gap-3">
        {showSearch && (
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
              placeholder="Search employers..."
              value={searchQuery}
              onChange={handleSearch}
              className="pl-9"
            />
          </div>
        )}
        {onAddEmployer && (
          <Button onClick={onAddEmployer} size="sm">
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
            Add
          </Button>
        )}
      </div>

      {/* List */}
      {filteredEmployers.length === 0 ? (
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
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
          <p className="mb-3 text-gray-500 dark:text-gray-400">
            {emptyMessage}
          </p>
          {onAddEmployer && !searchQuery && (
            <Button variant="outline" onClick={onAddEmployer}>
              Link Employer
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredEmployers.map((employer) => (
            <div
              key={employer.id}
              role={onEmployerClick ? 'button' : undefined}
              tabIndex={onEmployerClick ? 0 : undefined}
              onClick={() => onEmployerClick?.(employer)}
              onKeyDown={(e) =>
                e.key === 'Enter' && onEmployerClick?.(employer)
              }
              className={`rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900 ${onEmployerClick ? 'cursor-pointer transition-all hover:border-gray-300 hover:shadow-sm dark:hover:border-gray-600' : ''} `}
            >
              <div className="flex items-center gap-4">
                {/* Logo */}
                {employer.logoUrl ? (
                  <img
                    src={employer.logoUrl}
                    alt={employer.name}
                    className="h-10 w-10 rounded bg-gray-50 object-contain dark:bg-gray-800"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded bg-blue-100 dark:bg-blue-900/30">
                    <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {employer.name.charAt(0)}
                    </span>
                  </div>
                )}

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-medium text-gray-900 dark:text-white">
                      {employer.name}
                    </h3>
                    <Badge variant={getStatusVariant(employer.status)}>
                      {employer.status}
                    </Badge>
                  </div>
                  <div className="mt-0.5 flex items-center gap-4">
                    {employer.email && (
                      <span className="truncate text-sm text-gray-500 dark:text-gray-400">
                        {employer.email}
                      </span>
                    )}
                    {employer.linkedDate && (
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        Linked {formatDate(employer.linkedDate)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="hidden items-center gap-4 text-center sm:flex">
                  {employer.activeEmployees !== undefined && (
                    <div>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {employer.activeEmployees}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Employees
                      </p>
                    </div>
                  )}
                  {employer.pendingOrders !== undefined && (
                    <div>
                      <p
                        className={`text-lg font-bold ${employer.pendingOrders > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-gray-900 dark:text-white'}`}
                      >
                        {employer.pendingOrders}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Pending
                      </p>
                    </div>
                  )}
                </div>

                {/* Arrow */}
                {onEmployerClick && (
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default EmployerList;
