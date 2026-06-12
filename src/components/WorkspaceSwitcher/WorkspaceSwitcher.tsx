'use client';

import * as React from 'react';

import { cn } from '../../utils/cn';
import { Dropdown, DropdownContent, DropdownItem } from '../Dropdown/Dropdown';

// =============================================================================
// Types
// =============================================================================

export interface Workspace {
  id: string;
  name: string;
  /** Optional subtitle, e.g. role or status. */
  subtitle?: string;
  /** Optional logo URL. */
  logoUrl?: string;
}

export interface WorkspaceSwitcherProps {
  /** Workspaces available to the current user. */
  workspaces: Workspace[];
  /** Currently selected workspace id. */
  currentId?: string;
  /** Called when the user selects a different workspace. */
  onSelect?: (workspace: Workspace) => void;
  /** Optional secondary action rendered at the bottom (e.g. "Add employer"). */
  onCreate?: () => void;
  /** Label for the create action. */
  createLabel?: string;
  /** Additional CSS classes. */
  className?: string;
  /** Always render the trigger even when there is only one workspace
   * (useful in dense layouts). When false and there is <=1 workspace the
   * component renders nothing. */
  alwaysRender?: boolean;
}

// =============================================================================
// Subcomponents
// =============================================================================

function WorkspaceAvatar({
  name,
  logoUrl,
  className,
}: {
  name: string;
  logoUrl?: string;
  className?: string;
}) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0]!)
    .join('')
    .toUpperCase()
    .slice(0, 2);

  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt=""
        className={cn('h-6 w-6 rounded object-cover', className)}
      />
    );
  }

  return (
    <span
      className={cn(
        'flex h-6 w-6 items-center justify-center rounded',
        'bg-primary-100 text-[10px] font-semibold uppercase text-primary-800',
        'dark:bg-primary-900 dark:text-primary-100',
        className
      )}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}

const ChevronDownIcon = () => (
  <svg
    className="h-4 w-4 text-muted-foreground"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);

const CheckIcon = () => (
  <svg
    className="h-4 w-4 text-primary-600 dark:text-primary-300"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2.5}
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

// =============================================================================
// Component
// =============================================================================

/**
 * WorkspaceSwitcher — dropdown for switching between employer/provider workspaces.
 *
 * When the user has only one workspace, it renders a static label (no dropdown
 * affordance) unless `alwaysRender` is true.
 */
export function WorkspaceSwitcher({
  workspaces,
  currentId,
  onSelect,
  onCreate,
  createLabel = 'Add workspace',
  className,
  alwaysRender = false,
}: WorkspaceSwitcherProps): React.JSX.Element | null {
  const current =
    workspaces.find((w) => w.id === currentId) ?? workspaces[0] ?? null;
  if (!current) return null;

  const hasMultiple = workspaces.length > 1;

  if (!hasMultiple && !onCreate && !alwaysRender) {
    return (
      <div
        className={cn('flex min-w-0 items-center gap-2 px-2 py-1', className)}
      >
        <WorkspaceAvatar name={current.name} logoUrl={current.logoUrl} />
        <span className="truncate text-sm font-medium text-foreground">
          {current.name}
        </span>
      </div>
    );
  }

  const trigger = (
    <button
      type="button"
      className={cn(
        'flex min-w-0 items-center gap-2 rounded-lg px-2 py-1.5',
        'text-left transition-colors hover:bg-muted',
        'focus:outline-none focus:ring-2 focus:ring-primary-500',
        className
      )}
      aria-label="Switch workspace"
    >
      <WorkspaceAvatar name={current.name} logoUrl={current.logoUrl} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-foreground">
          {current.name}
        </span>
        {current.subtitle && (
          <span className="block truncate text-[11px] text-muted-foreground">
            {current.subtitle}
          </span>
        )}
      </span>
      <ChevronDownIcon />
    </button>
  );

  return (
    <Dropdown trigger={trigger} placement="bottom-start" width={260}>
      <DropdownContent>
        <div className="border-b border-border px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Workspaces
        </div>
        {workspaces.map((ws) => {
          const selected = ws.id === current.id;
          return (
            <DropdownItem
              key={ws.id}
              onClick={() => {
                if (!selected) onSelect?.(ws);
              }}
            >
              <div className="flex w-full items-center gap-2">
                <WorkspaceAvatar name={ws.name} logoUrl={ws.logoUrl} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-foreground">
                    {ws.name}
                  </div>
                  {ws.subtitle && (
                    <div className="truncate text-[11px] text-muted-foreground">
                      {ws.subtitle}
                    </div>
                  )}
                </div>
                {selected && <CheckIcon />}
              </div>
            </DropdownItem>
          );
        })}
        {onCreate && (
          <>
            <div className="my-1 h-px bg-border" role="separator" />
            <DropdownItem onClick={onCreate}>
              <span className="flex w-full items-center gap-2 text-sm text-primary-700 dark:text-primary-300">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                {createLabel}
              </span>
            </DropdownItem>
          </>
        )}
      </DropdownContent>
    </Dropdown>
  );
}
