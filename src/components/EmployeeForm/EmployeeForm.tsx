import * as React from 'react';
import { cn } from '../../utils/cn';
import { Input } from '../Input';
import { Textarea } from '../Textarea';
import { Switch } from '../Switch';
import { Select } from '../Select';

// ============================================================================
// Types
// ============================================================================

export interface Department {
  /** Department ID */
  id: string;
  /** Department name */
  name: string;
}

export interface EmployeePhone {
  /** Phone number */
  number: string;
  /** Phone type */
  type: 'cell' | 'landline' | 'home' | 'work' | 'fax';
}

export interface EmployeeAddress {
  /** Street address line 1 */
  street1?: string;
  /** Street address line 2 */
  street2?: string;
  /** City */
  city?: string;
  /** State/Province */
  state?: string;
  /** Postal/ZIP code */
  postalCode?: string;
  /** Country */
  country?: string;
}

export interface EmployeeFormData {
  /** First name */
  firstName: string;
  /** Last name */
  lastName: string;
  /** Email address */
  email: string;
  /** Date of birth (ISO format) */
  dob: string;
  /** Selected department IDs */
  departments?: string[];
  /** Job title */
  title?: string;
  /** Address */
  address?: EmployeeAddress;
  /** Phone numbers */
  phones?: EmployeePhone[];
  /** Account active status */
  isActive?: boolean;
  /** Additional information */
  additionalInfo?: string;
  /** Whether to send invite email */
  sendInvite?: boolean;
}

export interface EmployeeFormProps {
  /** Initial form data for editing */
  initialData?: Partial<EmployeeFormData>;
  /** Available departments */
  departments?: Department[];
  /** Whether this is a new employee (show invite option) */
  isNew?: boolean;
  /** Whether user is already linked to an account */
  isUserLinked?: boolean;
  /** Mode: create employee or start order */
  mode?: 'create' | 'order';
  /** Callback when form is submitted */
  onSubmit: (data: EmployeeFormData) => void;
  /** Callback when cancelled */
  onCancel?: () => void;
  /** Custom fields component */
  customFields?: React.ReactNode;
  /** Labels for i18n */
  labels?: {
    required?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    dob?: string;
    department?: string;
    selectDepartments?: string;
    title?: string;
    address?: string;
    phone?: string;
    accountStatus?: string;
    active?: string;
    inactive?: string;
    additionalInformation?: string;
    inviteEmployee?: string;
    save?: string;
    startOrder?: string;
    cancel?: string;
    firstNameRequired?: string;
    lastNameRequired?: string;
    emailRequired?: string;
    dobRequired?: string;
  };
  /** Custom className */
  className?: string;
}

// ============================================================================
// Phone type options
// ============================================================================

const phoneTypeOptions = [
  { value: 'cell', label: 'Cell' },
  { value: 'landline', label: 'Landline' },
  { value: 'home', label: 'Home' },
  { value: 'work', label: 'Work' },
  { value: 'fax', label: 'Fax' },
];

// ============================================================================
// EmployeeForm Component
// ============================================================================

/**
 * A comprehensive employee form with personal details, departments,
 * address, and phone number fields.
 *
 * @example
 * ```tsx
 * <EmployeeForm
 *   departments={departmentList}
 *   isNew
 *   onSubmit={(data) => createEmployee(data)}
 *   onCancel={() => closeModal()}
 * />
 * ```
 */
export function EmployeeForm({
  initialData = {},
  departments = [],
  isNew = true,
  isUserLinked = false,
  mode = 'create',
  onSubmit,
  onCancel,
  customFields,
  labels = {},
  className,
}: EmployeeFormProps) {
  const {
    required = 'Required',
    firstName: firstNameLabel = 'First Name',
    lastName: lastNameLabel = 'Last Name',
    email: emailLabel = 'Email',
    dob: dobLabel = 'Date of Birth',
    department: departmentLabel = 'Department',
    selectDepartments = 'Please select departments',
    title: titleLabel = 'Title',
    address: addressLabel = 'Address',
    phone: phoneLabel = 'Phone',
    accountStatus = 'Account Status',
    active = 'Active',
    inactive = 'Inactive',
    additionalInformation = 'Additional Information',
    inviteEmployee = 'Invite Employee',
    save = 'Save',
    startOrder = 'Start Order',
    cancel = 'Cancel',
    firstNameRequired = 'First name is required',
    lastNameRequired = 'Last name is required',
    emailRequired = 'Email is required',
    dobRequired = 'Date of birth is required',
  } = labels;

  // Form state
  const [firstName, setFirstName] = React.useState(initialData.firstName ?? '');
  const [lastName, setLastName] = React.useState(initialData.lastName ?? '');
  const [email, setEmail] = React.useState(initialData.email ?? '');
  const [dob, setDob] = React.useState(initialData.dob ?? '');
  const [selectedDepartments, setSelectedDepartments] = React.useState<
    string[]
  >(initialData.departments ?? []);
  const [title, setTitle] = React.useState(initialData.title ?? '');
  const [address, setAddress] = React.useState<EmployeeAddress>(
    initialData.address ?? {}
  );
  const [phones, setPhones] = React.useState<EmployeePhone[]>(
    initialData.phones ?? [{ number: '', type: 'cell' }]
  );
  const [isActive, setIsActive] = React.useState(initialData.isActive ?? true);
  const [additionalInfo, setAdditionalInfo] = React.useState(
    initialData.additionalInfo ?? ''
  );
  const [sendInvite, setSendInvite] = React.useState(false);

  // Validation errors
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!firstName.trim()) newErrors.firstName = firstNameRequired;
    if (!lastName.trim()) newErrors.lastName = lastNameRequired;
    if (!email.trim()) newErrors.email = emailRequired;
    if (!dob) newErrors.dob = dobRequired;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    onSubmit({
      firstName,
      lastName,
      email,
      dob,
      departments:
        selectedDepartments.length > 0 ? selectedDepartments : undefined,
      title: title || undefined,
      address: Object.values(address).some(Boolean) ? address : undefined,
      phones:
        phones.filter((p) => p.number).length > 0
          ? phones.filter((p) => p.number)
          : undefined,
      isActive,
      additionalInfo: additionalInfo || undefined,
      sendInvite: isNew && !isUserLinked ? sendInvite : undefined,
    });
  };

  const updatePhone = (
    index: number,
    field: keyof EmployeePhone,
    value: string
  ) => {
    setPhones((prev) =>
      prev.map((phone, i) =>
        i === index ? { ...phone, [field]: value } : phone
      )
    );
  };

  const addPhone = () => {
    setPhones((prev) => [...prev, { number: '', type: 'cell' }]);
  };

  const removePhone = (index: number) => {
    setPhones((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-6', className)}>
      {/* Required Section */}
      <div>
        <h3 className="mb-4 text-lg font-semibold">{required}</h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label={firstNameLabel}
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            error={errors.firstName}
            required
          />
          <Input
            label={lastNameLabel}
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            error={errors.lastName}
            required
          />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            type="email"
            label={emailLabel}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            required
          />
          <Input
            type="date"
            label={dobLabel}
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            error={errors.dob}
            required
          />
        </div>
      </div>

      {/* Department Section */}
      {departments.length > 0 && (
        <div>
          <h3 className="mb-4 text-lg font-semibold">{departmentLabel}</h3>
          <Select
            label={selectDepartments}
            value={selectedDepartments[0] ?? ''}
            onValueChange={(value) =>
              setSelectedDepartments(value ? [value] : [])
            }
            options={[
              { value: '', label: selectDepartments },
              ...departments.map((d) => ({ value: d.id, label: d.name })),
            ]}
          />
        </div>
      )}

      {/* Title */}
      <Input
        label={titleLabel}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      {/* Address Section */}
      <div>
        <h3 className="mb-4 text-lg font-semibold">{addressLabel}</h3>

        <div className="space-y-4">
          <Input
            label="Address Line 1"
            value={address.street1 ?? ''}
            onChange={(e) =>
              setAddress((prev) => ({ ...prev, street1: e.target.value }))
            }
          />
          <Input
            label="Address Line 2"
            value={address.street2 ?? ''}
            onChange={(e) =>
              setAddress((prev) => ({ ...prev, street2: e.target.value }))
            }
          />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Input
              label="City"
              value={address.city ?? ''}
              onChange={(e) =>
                setAddress((prev) => ({ ...prev, city: e.target.value }))
              }
            />
            <Input
              label="State"
              value={address.state ?? ''}
              onChange={(e) =>
                setAddress((prev) => ({ ...prev, state: e.target.value }))
              }
            />
            <Input
              label="Postal Code"
              value={address.postalCode ?? ''}
              onChange={(e) =>
                setAddress((prev) => ({ ...prev, postalCode: e.target.value }))
              }
            />
            <Input
              label="Country"
              value={address.country ?? ''}
              onChange={(e) =>
                setAddress((prev) => ({ ...prev, country: e.target.value }))
              }
            />
          </div>
        </div>
      </div>

      {/* Phone Section */}
      <div>
        <h3 className="mb-4 text-lg font-semibold">{phoneLabel}</h3>

        <div className="space-y-3">
          {phones.map((phone, index) => (
            <div key={index} className="flex items-end gap-3">
              <div className="flex-1">
                <Input
                  label={index === 0 ? 'Phone Number' : undefined}
                  value={phone.number}
                  onChange={(e) => updatePhone(index, 'number', e.target.value)}
                  placeholder="(555) 555-5555"
                />
              </div>
              <div className="w-32">
                <Select
                  label={index === 0 ? 'Type' : undefined}
                  value={phone.type}
                  onValueChange={(value) =>
                    updatePhone(index, 'type', value as EmployeePhone['type'])
                  }
                  options={phoneTypeOptions}
                />
              </div>
              {phones.length > 1 && (
                <button
                  type="button"
                  onClick={() => removePhone(index)}
                  className="text-destructive hover:text-destructive/80 p-2"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addPhone}
            className="text-primary-800 hover:text-primary-900 dark:text-primary-300 dark:hover:text-primary-200 text-sm hover:underline"
          >
            + Add another phone
          </button>
        </div>
      </div>

      {/* Account Status */}
      <div className="flex items-center gap-3">
        <Switch
          checked={isActive}
          onCheckedChange={setIsActive}
          id="account-status"
        />
        <label htmlFor="account-status" className="text-sm">
          {accountStatus}: <strong>{isActive ? active : inactive}</strong>
        </label>
      </div>

      {/* Additional Information */}
      <Textarea
        label={additionalInformation}
        value={additionalInfo}
        onChange={(e) => setAdditionalInfo(e.target.value)}
        rows={4}
      />

      {/* Custom Fields */}
      {customFields}

      {/* Footer Actions */}
      <div className="flex flex-col justify-between gap-4 border-t pt-4 sm:flex-row">
        {/* Invite Option */}
        <div>
          {isNew && !isUserLinked && (
            <div className="flex items-center gap-3">
              <Switch
                checked={sendInvite}
                onCheckedChange={setSendInvite}
                id="invite-employee"
              />
              <label htmlFor="invite-employee" className="text-sm">
                {inviteEmployee}
              </label>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="border-input hover:bg-muted rounded-md border px-4 py-2 text-sm"
            >
              {cancel}
            </button>
          )}
          <button
            type="submit"
            className="bg-primary-800 hover:bg-primary-900 rounded-md px-4 py-2 text-sm text-white"
          >
            {mode === 'order' ? startOrder : save}
          </button>
        </div>
      </div>
    </form>
  );
}

export default EmployeeForm;
