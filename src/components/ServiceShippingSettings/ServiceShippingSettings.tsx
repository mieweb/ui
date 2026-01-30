'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../Card/Card';
import { Input } from '../Input/Input';
import { Select } from '../Select/Select';
import { Switch } from '../Switch/Switch';
import { Button } from '../Button/Button';

export interface ShippingAddress {
  name?: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zipCode: string;
  country?: string;
}

export interface ServiceShippingSettingsProps {
  /** Whether shipping is enabled */
  shippingEnabled?: boolean;
  /** Handler for toggling shipping */
  onShippingEnabledChange?: (enabled: boolean) => void;
  /** Default shipping address */
  defaultAddress?: ShippingAddress;
  /** Handler for address changes */
  onAddressChange?: (address: ShippingAddress) => void;
  /** Available shipping methods */
  shippingMethods?: Array<{ id: string; name: string; price: number }>;
  /** Selected shipping method ID */
  selectedMethodId?: string;
  /** Handler for method change */
  onMethodChange?: (methodId: string) => void;
  /** Carrier account number */
  carrierAccountNumber?: string;
  /** Handler for carrier account change */
  onCarrierAccountChange?: (value: string) => void;
  /** Special instructions */
  instructions?: string;
  /** Handler for instructions change */
  onInstructionsChange?: (value: string) => void;
  /** Whether to use kit shipping */
  useKitShipping?: boolean;
  /** Handler for kit shipping toggle */
  onUseKitShippingChange?: (enabled: boolean) => void;
  /** Handler for saving settings */
  onSave?: () => void;
  /** Whether save is in progress */
  isSaving?: boolean;
  /** Additional CSS classes */
  className?: string;
}

const US_STATES = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
];

/**
 * ServiceShippingSettings manages shipping configuration for a service.
 */
export function ServiceShippingSettings({
  shippingEnabled = false,
  onShippingEnabledChange,
  defaultAddress,
  onAddressChange,
  shippingMethods = [],
  selectedMethodId,
  onMethodChange,
  carrierAccountNumber,
  onCarrierAccountChange,
  instructions,
  onInstructionsChange,
  useKitShipping = false,
  onUseKitShippingChange,
  onSave,
  isSaving = false,
  className = '',
}: ServiceShippingSettingsProps) {
  const [address, setAddress] = React.useState<ShippingAddress>(
    defaultAddress || {
      name: '',
      street1: '',
      street2: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'US',
    }
  );

  const handleAddressFieldChange = (
    field: keyof ShippingAddress,
    value: string
  ) => {
    const newAddress = { ...address, [field]: value };
    setAddress(newAddress);
    onAddressChange?.(newAddress);
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Shipping Settings</CardTitle>
          <Switch
            checked={shippingEnabled}
            onCheckedChange={onShippingEnabledChange}
          />
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Configure how kits and materials are shipped
        </p>
      </CardHeader>

      {shippingEnabled && (
        <CardContent className="space-y-6">
          {/* Shipping method */}
          {shippingMethods.length > 0 && (
            <Select
              label="Shipping Method"
              value={selectedMethodId || ''}
              onValueChange={(value) => onMethodChange?.(value)}
              placeholder="Select shipping method..."
              options={shippingMethods.map((m) => ({
                value: m.id,
                label: `${m.name} ($${m.price.toFixed(2)})`,
              }))}
            />
          )}

          {/* Kit shipping toggle */}
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Use Kit Shipping
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Send collection kits to patients
              </p>
            </div>
            <Switch
              checked={useKitShipping}
              onCheckedChange={onUseKitShippingChange}
            />
          </div>

          {/* Default address */}
          <div className="space-y-4">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Default Return Address
            </p>

            <Input
              label="Recipient Name"
              value={address.name || ''}
              onChange={(e) => handleAddressFieldChange('name', e.target.value)}
              placeholder="Lab Name or Attention"
            />

            <Input
              label="Street Address"
              value={address.street1}
              onChange={(e) =>
                handleAddressFieldChange('street1', e.target.value)
              }
              placeholder="123 Main St"
              required
            />

            <Input
              label="Street Address 2"
              value={address.street2 || ''}
              onChange={(e) =>
                handleAddressFieldChange('street2', e.target.value)
              }
              placeholder="Suite, Apt, etc."
            />

            <div className="grid grid-cols-6 gap-3">
              <div className="col-span-3">
                <Input
                  label="City"
                  value={address.city}
                  onChange={(e) =>
                    handleAddressFieldChange('city', e.target.value)
                  }
                  placeholder="City"
                  required
                />
              </div>
              <div className="col-span-1">
                <Select
                  label="State"
                  value={address.state}
                  onValueChange={(value) =>
                    handleAddressFieldChange('state', value)
                  }
                  placeholder="ST"
                  options={US_STATES}
                />
              </div>
              <div className="col-span-2">
                <Input
                  label="ZIP Code"
                  value={address.zipCode}
                  onChange={(e) =>
                    handleAddressFieldChange('zipCode', e.target.value)
                  }
                  placeholder="12345"
                  required
                />
              </div>
            </div>
          </div>

          {/* Carrier account */}
          <Input
            label="Carrier Account Number (Optional)"
            value={carrierAccountNumber || ''}
            onChange={(e) => onCarrierAccountChange?.(e.target.value)}
            placeholder="For billing shipping to your account"
          />

          {/* Special instructions */}
          <div>
            <label
              htmlFor="shipping-instructions"
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Special Instructions
            </label>
            <textarea
              id="shipping-instructions"
              className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              rows={3}
              value={instructions || ''}
              onChange={(e) => onInstructionsChange?.(e.target.value)}
              placeholder="Any special shipping instructions..."
            />
          </div>

          {/* Save button */}
          {onSave && (
            <div className="flex justify-end pt-2">
              <Button onClick={onSave} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Shipping Settings'}
              </Button>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export default ServiceShippingSettings;
