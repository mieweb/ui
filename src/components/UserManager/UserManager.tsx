import { useState } from 'react';
import { Check, Edit2, Plus, Trash2, X } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Badge, type BadgeProps } from '../Badge';
import { Button } from '../Button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../Card';
import { Checkbox } from '../Checkbox';
import { Input } from '../Input';
import { Label } from '../Label';
import { Select, type SelectOption } from '../Select';

/** A user/employee with optional system-access role. */
export interface ManagedUser {
  id: string;
  name: string;
  number: string;
  email?: string;
  location: string;
  role?: string;
  active: boolean;
}

/** Values used to create a new user (no id yet). */
export type NewManagedUser = Omit<ManagedUser, 'id'>;

export interface UserManagerProps {
  /** The current list of users. */
  users: ManagedUser[];
  /** Called to create a new user. */
  onAdd: (user: NewManagedUser) => void;
  /** Called to update a user. */
  onUpdate: (id: string, changes: Partial<NewManagedUser>) => void;
  /** Called to delete a user. */
  onDelete: (id: string) => void;
  /** Security role options. A "No system access" option is always prepended. */
  roleOptions?: SelectOption[];
  /** Maps a role value to a Badge variant. */
  roleBadgeVariant?: (role: string) => BadgeProps['variant'];
  className?: string;
}

const DEFAULT_ROLE_OPTIONS: SelectOption[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'case-manager-leader', label: 'Case Manager Leader' },
  { value: 'case-manager', label: 'Case Manager' },
  { value: 'viewer', label: 'Viewer' },
];

const NONE = 'none';

function defaultRoleBadgeVariant(role: string): BadgeProps['variant'] {
  switch (role) {
    case 'admin':
    case 'case-manager-leader':
      return 'default';
    case 'case-manager':
      return 'secondary';
    default:
      return 'outline';
  }
}

/**
 * A presentational manager for users and their system-access security roles.
 * All persistence is delegated to the `onAdd`, `onUpdate`, and `onDelete`
 * callbacks.
 */
export function UserManager({
  users,
  onAdd,
  onUpdate,
  onDelete,
  roleOptions = DEFAULT_ROLE_OPTIONS,
  roleBadgeVariant = defaultRoleBadgeVariant,
  className,
}: UserManagerProps) {
  const [newName, setNewName] = useState('');
  const [newNumber, setNewNumber] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newRole, setNewRole] = useState(NONE);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editNumber, setEditNumber] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editRole, setEditRole] = useState(NONE);
  const [editActive, setEditActive] = useState(true);

  const selectOptions: SelectOption[] = [
    { value: NONE, label: 'No system access' },
    ...roleOptions,
  ];

  const roleLabel = (role: string): string =>
    roleOptions.find((o) => o.value === role)?.label ?? role;

  const canAdd =
    Boolean(newName.trim()) &&
    Boolean(newNumber.trim()) &&
    Boolean(newLocation.trim());

  const handleAdd = () => {
    if (!canAdd) return;
    onAdd({
      name: newName.trim(),
      number: newNumber.trim(),
      email: newEmail.trim() || undefined,
      location: newLocation.trim(),
      role: newRole === NONE ? undefined : newRole,
      active: true,
    });
    setNewName('');
    setNewNumber('');
    setNewEmail('');
    setNewLocation('');
    setNewRole(NONE);
  };

  const handleStartEdit = (user: ManagedUser) => {
    setEditingId(user.id);
    setEditName(user.name);
    setEditNumber(user.number);
    setEditEmail(user.email ?? '');
    setEditLocation(user.location);
    setEditRole(user.role ?? NONE);
    setEditActive(user.active);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditNumber('');
    setEditEmail('');
    setEditLocation('');
    setEditRole(NONE);
    setEditActive(true);
  };

  const handleSaveEdit = () => {
    if (!editingId || !editName.trim() || !editNumber.trim() || !editLocation.trim())
      return;
    onUpdate(editingId, {
      name: editName.trim(),
      number: editNumber.trim(),
      email: editEmail.trim() || undefined,
      location: editLocation.trim(),
      role: editRole === NONE ? undefined : editRole,
      active: editActive,
    });
    handleCancelEdit();
  };

  return (
    <div className={cn('space-y-6', className)} data-slot="user-manager">
      <Card>
        <CardHeader>
          <CardTitle>Add New User</CardTitle>
          <CardDescription>
            Assign security roles to employees for system access
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="new-user-name">Name *</Label>
              <Input
                id="new-user-name"
                placeholder="Full name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-user-number">Employee # *</Label>
              <Input
                id="new-user-number"
                placeholder="EMP-12345"
                value={newNumber}
                onChange={(e) => setNewNumber(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-user-email">Email</Label>
              <Input
                id="new-user-email"
                type="email"
                placeholder="user@company.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-user-location">Location *</Label>
              <Input
                id="new-user-location"
                placeholder="Toledo, OH"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Security Role</Label>
            <Select
              value={newRole}
              onValueChange={setNewRole}
              options={selectOptions}
              aria-label="Security Role"
            />
          </div>
          <Button onClick={handleAdd} disabled={!canAdd}>
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Add Employee
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Employee System Access</CardTitle>
          <CardDescription>
            Manage employee security roles and system access
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {users.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">
                No employees defined yet.
              </p>
            ) : (
              users.map((user) => (
                <div
                  key={user.id}
                  className="rounded-lg border border-border p-3"
                >
                  {editingId === user.id ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
                        <div className="space-y-2">
                          <Label>Name</Label>
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Employee #</Label>
                          <Input
                            value={editNumber}
                            onChange={(e) => setEditNumber(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Email</Label>
                          <Input
                            type="email"
                            value={editEmail}
                            onChange={(e) => setEditEmail(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Location</Label>
                          <Input
                            value={editLocation}
                            onChange={(e) => setEditLocation(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Security Role</Label>
                        <Select
                          value={editRole}
                          onValueChange={setEditRole}
                          options={selectOptions}
                          aria-label="Security Role"
                        />
                      </div>
                      <Checkbox
                        label="Active"
                        checked={editActive}
                        onChange={(e) => setEditActive(e.target.checked)}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleSaveEdit}>
                          <Check className="mr-2 h-4 w-4" aria-hidden="true" />
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancelEdit}
                        >
                          <X className="mr-2 h-4 w-4" aria-hidden="true" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{user.name}</span>
                          <span className="text-sm text-muted-foreground">
                            ({user.number})
                          </span>
                          {user.role ? (
                            <Badge variant={roleBadgeVariant(user.role)}>
                              {roleLabel(user.role)}
                            </Badge>
                          ) : (
                            <Badge variant="outline">No Access</Badge>
                          )}
                          {!user.active && (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                          {user.email && <span>{user.email}</span>}
                          {user.email && <span>•</span>}
                          <span>{user.location}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0"
                          aria-label={`Edit ${user.name}`}
                          onClick={() => handleStartEdit(user)}
                        >
                          <Edit2 className="h-4 w-4" aria-hidden="true" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            onUpdate(user.id, { active: !user.active })
                          }
                        >
                          {user.active ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0"
                          aria-label={`Delete ${user.name}`}
                          onClick={() => onDelete(user.id)}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
