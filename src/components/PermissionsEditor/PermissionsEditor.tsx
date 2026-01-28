import * as React from 'react';
import { cn } from '../../utils/cn';
import { Checkbox } from '../Checkbox';
import { ChevronDown, ChevronRight, Shield, Building2 } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

export interface Permission {
  /** Unique permission ID */
  id: string;
  /** Display name */
  name: string;
  /** Optional description */
  description?: string;
  /** Parent permission ID (for hierarchy) */
  parentId?: string | null;
  /** Child permissions */
  children?: Permission[];
  /** Whether this permission is currently assigned */
  isAssigned?: boolean;
  /** Project/scope identifier */
  project?: string;
}

export interface PermissionGroup {
  /** Group ID */
  id: string;
  /** Group name (e.g., "Admin", "Provider", "Employer") */
  name: string;
  /** Permissions in this group */
  permissions: Permission[];
  /** Whether group is expanded */
  defaultExpanded?: boolean;
}

export interface EmployerAccess {
  /** Employer ID */
  id: string;
  /** Employer name */
  name: string;
  /** Address info */
  address?: {
    street1?: string;
    city?: string;
    state?: string;
  };
}

export interface PermissionsEditorProps {
  /** User name being edited */
  userName?: string;
  /** Permission groups to display */
  groups: PermissionGroup[];
  /** Currently assigned permission IDs */
  assignedPermissions: string[];
  /** Callback when permissions change */
  onPermissionsChange: (permissionIds: string[]) => void;
  /** Whether to show employer access section */
  showEmployerAccess?: boolean;
  /** Available employers for access selection */
  employers?: EmployerAccess[];
  /** Currently selected employer IDs */
  selectedEmployers?: string[];
  /** Callback when employer selection changes */
  onEmployersChange?: (employerIds: string[]) => void;
  /** Labels for i18n */
  labels?: {
    userRole?: string;
    employerAccess?: string;
    selectEmployer?: string;
    summary?: string;
    all?: string;
    save?: string;
    cancel?: string;
  };
  /** Custom className */
  className?: string;
}

// ============================================================================
// PermissionItem Component
// ============================================================================

interface PermissionItemProps {
  permission: Permission;
  level: number;
  isAssigned: boolean;
  onToggle: (id: string, checked: boolean) => void;
  parentChecked?: boolean;
}

function PermissionItem({
  permission,
  level,
  isAssigned,
  onToggle,
  parentChecked,
}: PermissionItemProps) {
  const hasChildren = permission.children && permission.children.length > 0;
  const [isExpanded, setIsExpanded] = React.useState(true);

  const handleChange = (checked: boolean) => {
    onToggle(permission.id, checked);

    // If unchecking parent, uncheck all children
    if (!checked && hasChildren) {
      permission.children?.forEach((child) => {
        onToggle(child.id, false);
        child.children?.forEach((grandchild) => {
          onToggle(grandchild.id, false);
        });
      });
    }
  };

  return (
    <div className={cn('py-1', level > 0 && 'ml-4')}>
      <div className="flex items-center gap-2">
        {hasChildren && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="hover:bg-muted rounded p-0.5"
          >
            {isExpanded ? (
              <ChevronDown className="text-muted-foreground h-4 w-4" />
            ) : (
              <ChevronRight className="text-muted-foreground h-4 w-4" />
            )}
          </button>
        )}
        {!hasChildren && <span className="w-5" />}

        <Checkbox
          id={`permission-${permission.id}`}
          checked={isAssigned}
          onChange={(e) => handleChange(e.target.checked)}
          disabled={parentChecked === false}
        />

        <label
          htmlFor={`permission-${permission.id}`}
          className={cn(
            'cursor-pointer text-sm select-none',
            level === 0 && 'font-semibold',
            level === 1 && 'font-medium',
            parentChecked === false && 'text-muted-foreground'
          )}
        >
          {permission.name}
        </label>
      </div>

      {hasChildren && isExpanded && (
        <div className="mt-1">
          {permission.children?.map((child) => (
            <PermissionItem
              key={child.id}
              permission={child}
              level={level + 1}
              isAssigned={child.isAssigned ?? false}
              onToggle={onToggle}
              parentChecked={isAssigned}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// PermissionsEditor Component
// ============================================================================

/**
 * A hierarchical permission editor with support for nested permissions,
 * employer access control, and summary display.
 *
 * @example
 * ```tsx
 * const [permissions, setPermissions] = useState(['admin', 'view-orders']);
 * const [employers, setEmployers] = useState([]);
 *
 * <PermissionsEditor
 *   userName="John Doe"
 *   groups={permissionGroups}
 *   assignedPermissions={permissions}
 *   onPermissionsChange={setPermissions}
 *   showEmployerAccess
 *   employers={employerList}
 *   selectedEmployers={employers}
 *   onEmployersChange={setEmployers}
 * />
 * ```
 */
export function PermissionsEditor({
  userName,
  groups,
  assignedPermissions,
  onPermissionsChange,
  showEmployerAccess = false,
  employers = [],
  selectedEmployers = [],
  onEmployersChange,
  labels = {},
  className,
}: PermissionsEditorProps) {
  const {
    userRole = 'User Role',
    employerAccess = 'Employer Access',
    summary = 'Summary',
    all = 'All',
  } = labels;

  // Track expanded groups
  const [expandedGroups, setExpandedGroups] = React.useState<Set<string>>(
    () =>
      new Set(
        groups.filter((g) => g.defaultExpanded !== false).map((g) => g.id)
      )
  );

  // Create a map of all permissions with their assigned status
  const permissionMap = React.useMemo(() => {
    const map = new Map<string, Permission>();

    const processPermissions = (permissions: Permission[]) => {
      permissions.forEach((perm) => {
        map.set(perm.id, {
          ...perm,
          isAssigned: assignedPermissions.includes(perm.id),
        });
        if (perm.children) {
          processPermissions(perm.children);
        }
      });
    };

    groups.forEach((group) => processPermissions(group.permissions));
    return map;
  }, [groups, assignedPermissions]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const handlePermissionToggle = (permissionId: string, checked: boolean) => {
    if (checked) {
      onPermissionsChange([...assignedPermissions, permissionId]);
    } else {
      onPermissionsChange(
        assignedPermissions.filter((id) => id !== permissionId)
      );
    }
  };

  const handleEmployerToggle = (employerId: string) => {
    if (!onEmployersChange) return;

    if (selectedEmployers.includes(employerId)) {
      onEmployersChange(selectedEmployers.filter((id) => id !== employerId));
    } else {
      onEmployersChange([...selectedEmployers, employerId]);
    }
  };

  // Get assigned permission names for summary
  const assignedPermissionNames = React.useMemo(() => {
    return assignedPermissions
      .map((id) => permissionMap.get(id)?.name)
      .filter(Boolean) as string[];
  }, [assignedPermissions, permissionMap]);

  return (
    <div className={cn('space-y-6', className)}>
      {/* User Role Section */}
      <div>
        <div className="mb-4 flex items-center gap-2 border-b pb-3">
          <Shield className="text-primary h-5 w-5" />
          <h3 className="text-lg font-semibold">{userRole}</h3>
          {userName && (
            <span className="text-muted-foreground">— {userName}</span>
          )}
        </div>

        <div className="space-y-4 pl-2">
          {groups.map((group, groupIndex) => (
            <div key={group.id}>
              {/* Group Header */}
              <button
                type="button"
                onClick={() => toggleGroup(group.id)}
                className="hover:bg-muted/50 -ml-2 flex w-full items-center gap-2 rounded py-2 pl-2 text-left"
              >
                {expandedGroups.has(group.id) ? (
                  <ChevronDown className="text-muted-foreground h-4 w-4" />
                ) : (
                  <ChevronRight className="text-muted-foreground h-4 w-4" />
                )}
                <span className="font-semibold">{group.name}</span>
              </button>

              {/* Group Permissions */}
              {expandedGroups.has(group.id) && (
                <div className="mt-2 ml-6 border-l pl-4">
                  {group.permissions.map((permission) => (
                    <PermissionItem
                      key={permission.id}
                      permission={{
                        ...permission,
                        isAssigned: assignedPermissions.includes(permission.id),
                        children: permission.children?.map((child) => ({
                          ...child,
                          isAssigned: assignedPermissions.includes(child.id),
                          children: child.children?.map((grandchild) => ({
                            ...grandchild,
                            isAssigned: assignedPermissions.includes(
                              grandchild.id
                            ),
                          })),
                        })),
                      }}
                      level={0}
                      isAssigned={assignedPermissions.includes(permission.id)}
                      onToggle={handlePermissionToggle}
                    />
                  ))}
                </div>
              )}

              {/* Separator between groups */}
              {groupIndex < groups.length - 1 && (
                <hr className="border-border my-4" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Employer Access Section */}
      {showEmployerAccess && employers.length > 0 && (
        <div>
          <div className="mb-4 flex items-center gap-2 border-b pb-3">
            <Building2 className="text-primary h-5 w-5" />
            <h3 className="text-lg font-semibold">{employerAccess}</h3>
          </div>

          <div className="max-h-60 space-y-2 overflow-y-auto pl-2">
            {employers.map((employer) => (
              <div
                key={employer.id}
                className="hover:bg-muted/50 flex items-center gap-3 rounded px-3 py-2"
              >
                <Checkbox
                  id={`employer-${employer.id}`}
                  checked={selectedEmployers.includes(employer.id)}
                  onChange={() => handleEmployerToggle(employer.id)}
                />
                <label
                  htmlFor={`employer-${employer.id}`}
                  className="flex-1 cursor-pointer text-sm"
                >
                  <span className="font-medium">{employer.name}</span>
                  {employer.address && (
                    <span className="text-muted-foreground ml-2">
                      | {employer.address.street1} - {employer.address.city},{' '}
                      {employer.address.state}
                    </span>
                  )}
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Section */}
      {(assignedPermissionNames.length > 0 || showEmployerAccess) && (
        <div className="bg-info/10 border-info/30 rounded-lg border p-4">
          <h4 className="mb-2 font-semibold">{summary}:</h4>

          {assignedPermissionNames.length > 0 && (
            <ul className="mb-3 space-y-1 text-sm">
              {assignedPermissionNames.map((name, i) => (
                <li key={i}>— {name}</li>
              ))}
            </ul>
          )}

          {showEmployerAccess && (
            <>
              <h5 className="mt-3 text-sm font-medium">{employerAccess}:</h5>
              <div className="text-muted-foreground text-sm italic">
                {selectedEmployers.length === 0 ? (
                  <span>{all}</span>
                ) : (
                  <ul className="mt-1 space-y-0.5">
                    {selectedEmployers.map((id) => {
                      const employer = employers.find((e) => e.id === id);
                      return <li key={id}>{employer?.name}</li>;
                    })}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default PermissionsEditor;
