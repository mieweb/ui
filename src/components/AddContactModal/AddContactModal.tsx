'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalBody,
  ModalFooter,
} from '../Modal/Modal';
import { Button } from '../Button/Button';
import { Input } from '../Input/Input';
import { Select } from '../Select/Select';
import { cn } from '../../utils/cn';

// ============================================================================
// Constants
// ============================================================================

const SEX_OPTIONS = [
  { value: 'F', label: 'Female' },
  { value: 'M', label: 'Male' },
  { value: 'N/D', label: 'Not Disclosed' },
];

// ============================================================================
// Types
// ============================================================================

export interface ContactAddress {
  street1?: string;
  street2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface CustomField {
  id?: string;
  name: string;
  value: string;
}

export interface ContactFormData {
  id?: string;
  firstName: string;
  lastName: string;
  sex?: 'M' | 'F' | 'N/D' | '';
  positionTitle?: string;
  degree?: string;
  email: string;
  phone?: string;
  address?: ContactAddress;
  customFields?: CustomField[];
}

export interface AddContactModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Callback when modal open state changes */
  onOpenChange: (open: boolean) => void;
  /** Callback when contact is saved */
  onSave: (contact: ContactFormData) => void;
  /** Existing contact data for editing (optional) */
  contact?: ContactFormData | null;
  /** Whether save is in progress */
  isSaving?: boolean;
  /** Modal title */
  title?: string;
  /** Additional CSS classes */
  className?: string;
  /** Whether to show address fields */
  showAddress?: boolean;
  /** Whether to show custom fields */
  showCustomFields?: boolean;
  /** Whether to show phone field */
  showPhone?: boolean;
}

// ============================================================================
// Default Values
// ============================================================================

const defaultContact: ContactFormData = {
  firstName: '',
  lastName: '',
  sex: '',
  positionTitle: '',
  degree: '',
  email: '',
  phone: '',
  address: {
    street1: '',
    street2: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
  },
  customFields: [],
};

// ============================================================================
// Component
// ============================================================================

/**
 * AddContactModal provides a form for adding or editing provider/employer contacts.
 * Supports fields for name, sex, position, degree, email, address, and custom fields.
 */
export function AddContactModal({
  open,
  onOpenChange,
  onSave,
  contact,
  isSaving = false,
  title = 'Add Contact',
  className,
  showAddress = true,
  showCustomFields = true,
  showPhone = true,
}: AddContactModalProps) {
  const [formData, setFormData] = useState<ContactFormData>(defaultContact);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when contact changes or modal opens
  useEffect(() => {
    if (open) {
      setFormData(contact ? { ...defaultContact, ...contact } : defaultContact);
      setErrors({});
    }
  }, [open, contact]);

  const handleChange = (field: keyof ContactFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleAddressChange = (field: keyof ContactAddress, value: string) => {
    setFormData((prev) => ({
      ...prev,
      address: { ...prev.address, [field]: value },
    }));
  };

  const handleCustomFieldChange = (index: number, field: 'name' | 'value', value: string) => {
    setFormData((prev) => {
      const customFields = [...(prev.customFields || [])];
      customFields[index] = { ...customFields[index], [field]: value };
      return { ...prev, customFields };
    });
  };

  const handleAddCustomField = () => {
    setFormData((prev) => ({
      ...prev,
      customFields: [...(prev.customFields || []), { name: '', value: '' }],
    }));
  };

  const handleRemoveCustomField = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      customFields: (prev.customFields || []).filter((_, i) => i !== index),
    }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSave(formData);
    }
  };

  const isEditing = !!contact?.id;

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalHeader>
        <ModalTitle>{isEditing ? 'Edit Contact' : title}</ModalTitle>
      </ModalHeader>

      <form onSubmit={handleSubmit}>
        <ModalBody className={cn('space-y-4', className)}>
          {/* Name Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="contact-firstName"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                First Name <span className="text-red-500">*</span>
              </label>
              <Input
                id="contact-firstName"
                value={formData.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                placeholder="First name"
                className={errors.firstName ? 'border-red-500' : ''}
              />
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-500">{errors.firstName}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="contact-lastName"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Last Name <span className="text-red-500">*</span>
              </label>
              <Input
                id="contact-lastName"
                value={formData.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                placeholder="Last name"
                className={errors.lastName ? 'border-red-500' : ''}
              />
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-500">{errors.lastName}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="contact-sex"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Sex
              </label>
              <Select
                id="contact-sex"
                options={SEX_OPTIONS}
                value={formData.sex || ''}
                onValueChange={(value: string) => {
                  handleChange('sex', value);
                }}
                placeholder="Select..."
              />
            </div>
          </div>

          {/* Position and Degree Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="contact-positionTitle"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Position Title
              </label>
              <Input
                id="contact-positionTitle"
                value={formData.positionTitle || ''}
                onChange={(e) => handleChange('positionTitle', e.target.value)}
                placeholder="e.g., Office Manager"
              />
            </div>

            <div>
              <label
                htmlFor="contact-degree"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Degree
              </label>
              <Input
                id="contact-degree"
                value={formData.degree || ''}
                onChange={(e) => handleChange('degree', e.target.value)}
                placeholder="e.g., MD, RN, PA"
              />
            </div>
          </div>

          {/* Email Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="contact-email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Email <span className="text-red-500">*</span>
              </label>
              <Input
                id="contact-email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="email@example.com"
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            {showPhone && (
              <div>
                <label
                  htmlFor="contact-phone"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Phone
                </label>
                <Input
                  id="contact-phone"
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="(555) 555-5555"
                />
              </div>
            )}
          </div>

          {/* Address Section */}
          {showAddress && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Address
              </h4>
              
              <div>
                <Input
                  id="contact-street1"
                  value={formData.address?.street1 || ''}
                  onChange={(e) => handleAddressChange('street1', e.target.value)}
                  placeholder="Street Address"
                />
              </div>

              <div>
                <Input
                  id="contact-street2"
                  value={formData.address?.street2 || ''}
                  onChange={(e) => handleAddressChange('street2', e.target.value)}
                  placeholder="Apt, Suite, etc. (optional)"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <Input
                    id="contact-city"
                    value={formData.address?.city || ''}
                    onChange={(e) => handleAddressChange('city', e.target.value)}
                    placeholder="City"
                  />
                </div>

                <div>
                  <Input
                    id="contact-state"
                    value={formData.address?.state || ''}
                    onChange={(e) => handleAddressChange('state', e.target.value)}
                    placeholder="State"
                  />
                </div>

                <div>
                  <Input
                    id="contact-postalCode"
                    value={formData.address?.postalCode || ''}
                    onChange={(e) => handleAddressChange('postalCode', e.target.value)}
                    placeholder="ZIP"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Custom Fields Section */}
          {showCustomFields && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Custom Fields
                </h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleAddCustomField}
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Add Field
                </Button>
              </div>

              {(formData.customFields || []).map((field, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={field.name}
                    onChange={(e) =>
                      handleCustomFieldChange(index, 'name', e.target.value)
                    }
                    placeholder="Field name"
                    className="flex-1"
                  />
                  <Input
                    value={field.value}
                    onChange={(e) =>
                      handleCustomFieldChange(index, 'value', e.target.value)
                    }
                    placeholder="Value"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveCustomField(index)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              {(!formData.customFields || formData.customFields.length === 0) && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No custom fields added. Click &quot;Add Field&quot; to add custom information.
                </p>
              )}
            </div>
          )}
        </ModalBody>

        <ModalFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <>
                <SpinnerIcon className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Contact'
            )}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

// ============================================================================
// Icons
// ============================================================================

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
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
  );
}

export default AddContactModal;
