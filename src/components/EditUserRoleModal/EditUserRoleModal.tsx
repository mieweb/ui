'use client';

import * as React from 'react';
import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalBody,
  ModalFooter,
} from '../Modal/Modal';
import { Button } from '../Button/Button';
import { Select } from '../Select/Select';

export interface UserRole {
  id: string;
  name: string;
  description?: string;
  permissions?: string[];
}

export interface EditUserRoleModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Handler for closing the modal */
  onOpenChange: (open: boolean) => void;
  /** Handler for saving the role change */
  onSave?: (data: { userId: string; roleId: string }) => void;
  /** User being edited */
  user?: {
    id: string;
    name: string;
    email: string;
    currentRoleId?: string;
  };
  /** Available roles */
  roles: UserRole[];
  /** Whether submission is in progress */
  isSubmitting?: boolean;
  /** Error message to display */
  errorMessage?: string;
}

/**
 * EditUserRoleModal provides a form to change a user's role.
 */
export function EditUserRoleModal({
  open,
  onOpenChange,
  onSave,
  user,
  roles,
  isSubmitting = false,
  errorMessage,
}: EditUserRoleModalProps) {
  const [selectedRoleId, setSelectedRoleId] = React.useState(
    user?.currentRoleId || ''
  );

  // Update selected role when user changes
  React.useEffect(() => {
    if (user?.currentRoleId) {
      setSelectedRoleId(user.currentRoleId);
    }
  }, [user?.currentRoleId]);

  // Reset when modal closes
  React.useEffect(() => {
    if (!open && user?.currentRoleId) {
      setSelectedRoleId(user.currentRoleId);
    }
  }, [open, user?.currentRoleId]);

  const selectedRole = roles.find((r) => r.id === selectedRoleId);
  const hasChanged = selectedRoleId !== user?.currentRoleId;

  const handleSave = () => {
    if (!user || !selectedRoleId || !onSave) return;
    onSave({ userId: user.id, roleId: selectedRoleId });
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} size="md">
      <ModalHeader>
        <ModalTitle>Edit User Role</ModalTitle>
      </ModalHeader>

      <ModalBody className="space-y-4">
        {/* User info */}
        {user && (
          <div className="bg-muted rounded-lg p-3">
            <p className="text-foreground font-medium">{user.name}</p>
            <p className="text-muted-foreground text-sm">{user.email}</p>
          </div>
        )}

        {/* Error message */}
        {errorMessage && (
          <div className="border-destructive/30 bg-destructive/10 rounded-lg border p-3">
            <div className="flex items-center gap-2">
              <svg
                className="text-destructive h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-destructive text-sm">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Role selection */}
        <Select
          label="Role"
          value={selectedRoleId}
          onValueChange={setSelectedRoleId}
          placeholder="Select a role..."
          options={roles.map((role) => ({
            value: role.id,
            label: role.name,
          }))}
        />

        {/* Role description */}
        {selectedRole?.description && (
          <div className="bg-primary/10 rounded-lg p-3">
            <p className="text-primary text-sm">{selectedRole.description}</p>
          </div>
        )}

        {/* Role permissions preview */}
        {selectedRole?.permissions && selectedRole.permissions.length > 0 && (
          <div>
            <span className="text-foreground mb-2 block text-sm font-medium">
              Permissions
            </span>
            <div className="flex flex-wrap gap-2">
              {selectedRole.permissions.map((permission) => (
                <span
                  key={permission}
                  className="bg-muted text-muted-foreground rounded-full px-2 py-1 text-xs font-medium"
                >
                  {permission}
                </span>
              ))}
            </div>
          </div>
        )}
      </ModalBody>

      <ModalFooter>
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleSave}
          disabled={!hasChanged || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <svg
                className="mr-2 -ml-1 h-4 w-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

export default EditUserRoleModal;
