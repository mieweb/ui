import * as React from 'react';
import { cn } from '../../utils/cn';
import { Input } from '../Input';
import type { AddressData } from './Address';

// =============================================================================
// Google Maps Types (minimal for autocomplete)
// Full types available via @types/google.maps if needed
// =============================================================================

declare global {
  interface Window {
    google?: typeof google;
  }
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace google.maps {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace places {
      class Autocomplete {
        constructor(input: HTMLInputElement, options?: AutocompleteOptions);
        getPlace(): PlaceResult;
        addListener(event: string, handler: () => void): void;
      }
      interface AutocompleteOptions {
        types?: string[];
        fields?: string[];
        componentRestrictions?: { country: string | string[] };
      }
      interface PlaceResult {
        address_components?: AddressComponent[];
        geometry?: {
          location: {
            lat(): number;
            lng(): number;
          };
        };
        formatted_address?: string;
      }
      interface AddressComponent {
        long_name: string;
        short_name: string;
        types: string[];
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace event {
      function clearInstanceListeners(instance: object): void;
    }
  }
}

// =============================================================================
// Extended Address Data with Geocoding
// =============================================================================

/**
 * Address data with optional geocoding coordinates and county.
 */
export interface AddressFormData extends AddressData {
  /** County name (optional) */
  county?: string;
  /** Latitude from geocoding */
  lat?: number;
  /** Longitude from geocoding */
  lng?: number;
}

// =============================================================================
// AddressForm Props
// =============================================================================

export interface AddressFormProps {
  /** Current address values */
  value: Partial<AddressFormData>;
  /** Callback when address values change */
  onChange: (address: Partial<AddressFormData>) => void;
  /** Whether the form is disabled */
  disabled?: boolean;
  /** Whether fields are required */
  required?: boolean;
  /** Field errors keyed by field name */
  errors?: Partial<Record<keyof AddressFormData, string>>;
  /** ID prefix for form fields */
  id?: string;
  /** Whether to show country field (default: true) */
  showCountry?: boolean;
  /** Whether to show county field (default: false) */
  showCounty?: boolean;
  /** Default country value (default: 'US') */
  defaultCountry?: string;
  /** Labels for i18n */
  labels?: {
    street1?: string;
    street2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    county?: string;
    country?: string;
  };
  /** Placeholder texts */
  placeholders?: {
    street1?: string;
    street2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    county?: string;
    country?: string;
  };
  /** Custom className for the container */
  className?: string;
  /** Google Places autocomplete options (requires Google Maps API) */
  googlePlaces?: {
    /** Whether to enable autocomplete on street1 field */
    enabled: boolean;
    /** Callback when place is selected */
    onPlaceSelect?: (place: google.maps.places.PlaceResult) => void;
    /** Country restrictions for autocomplete */
    componentRestrictions?: { country: string | string[] };
    /** Types of places to return */
    types?: string[];
  };
}

/**
 * Default labels for address form fields.
 */
const DEFAULT_LABELS = {
  street1: 'Address Line 1',
  street2: 'Address Line 2',
  city: 'City',
  state: 'State',
  postalCode: 'ZIP Code',
  county: 'County',
  country: 'Country',
};

/**
 * Default placeholders for address form fields.
 */
const DEFAULT_PLACEHOLDERS = {
  street1: 'Street address',
  street2: 'Apt, suite, building (optional)',
  city: 'City',
  state: 'ST',
  postalCode: '12345',
  county: 'County',
  country: 'United States',
};

// =============================================================================
// AddressForm Component
// =============================================================================

/**
 * A complete address form with support for Google Places autocomplete.
 *
 * Features:
 * - Standard US address fields (street, city, state, zip)
 * - Optional county and country fields
 * - Google Places autocomplete integration
 * - Responsive grid layout
 * - Form validation support
 * - Internationalization support via labels/placeholders props
 *
 * @example
 * ```tsx
 * const [address, setAddress] = useState<Partial<AddressFormData>>({});
 *
 * <AddressForm
 *   value={address}
 *   onChange={setAddress}
 *   required
 *   showCounty
 * />
 * ```
 *
 * @example With Google Places
 * ```tsx
 * <AddressForm
 *   value={address}
 *   onChange={setAddress}
 *   googlePlaces={{
 *     enabled: true,
 *     componentRestrictions: { country: 'us' },
 *     onPlaceSelect: (place) => console.log('Selected:', place),
 *   }}
 * />
 * ```
 */
export function AddressForm({
  value,
  onChange,
  disabled = false,
  required = false,
  errors = {},
  id,
  showCountry = true,
  showCounty = false,
  defaultCountry = 'US',
  labels = {},
  placeholders = {},
  className,
  googlePlaces,
}: AddressFormProps) {
  const generatedId = React.useId();
  const idPrefix = id || generatedId;
  const autocompleteRef = React.useRef<google.maps.places.Autocomplete | null>(
    null
  );
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Merge labels and placeholders with defaults
  const mergedLabels = { ...DEFAULT_LABELS, ...labels };
  const mergedPlaceholders = { ...DEFAULT_PLACEHOLDERS, ...placeholders };

  // Handle field change
  const handleChange = (field: keyof AddressFormData, fieldValue: string) => {
    onChange({
      ...value,
      [field]: fieldValue,
    });
  };

  // Initialize Google Places Autocomplete
  React.useEffect(() => {
    if (!googlePlaces?.enabled || !inputRef.current) return;

    // Check if Google Maps is loaded
    if (typeof google === 'undefined' || !google.maps?.places) {
      console.warn(
        'Google Maps Places API is not loaded. Autocomplete will not work.'
      );
      return;
    }

    const options: google.maps.places.AutocompleteOptions = {
      types: googlePlaces.types || ['address'],
      fields: ['address_components', 'geometry', 'formatted_address'],
    };

    if (googlePlaces.componentRestrictions) {
      options.componentRestrictions = googlePlaces.componentRestrictions;
    }

    autocompleteRef.current = new google.maps.places.Autocomplete(
      inputRef.current,
      options
    );

    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current?.getPlace();
      if (!place?.address_components) return;

      // Parse address components
      const addressData: Partial<AddressFormData> = {};
      let streetNumber = '';
      let route = '';

      for (const component of place.address_components) {
        const type = component.types[0];
        switch (type) {
          case 'street_number':
            streetNumber = component.long_name;
            break;
          case 'route':
            route = component.long_name;
            break;
          case 'locality':
            addressData.city = component.long_name;
            break;
          case 'administrative_area_level_1':
            addressData.state = component.short_name;
            break;
          case 'administrative_area_level_2':
            addressData.county = component.long_name.replace(' County', '');
            break;
          case 'postal_code':
            addressData.postalCode = component.long_name;
            break;
          case 'country':
            addressData.country = component.short_name;
            break;
        }
      }

      // Combine street number and route
      addressData.street1 = streetNumber ? `${streetNumber} ${route}` : route;

      // Get geocoding data
      if (place.geometry?.location) {
        addressData.lat = place.geometry.location.lat();
        addressData.lng = place.geometry.location.lng();
      }

      // Update form with parsed address
      onChange({
        ...value,
        ...addressData,
      });

      // Call custom handler
      googlePlaces.onPlaceSelect?.(place);
    });

    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Only re-init when enabled flag changes; other deps are stable refs
  }, [googlePlaces?.enabled]);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Street Address Line 1 */}
      <Input
        ref={inputRef}
        id={`${idPrefix}-street1`}
        label={mergedLabels.street1}
        placeholder={mergedPlaceholders.street1}
        value={value.street1 || ''}
        onChange={(e) => handleChange('street1', e.target.value)}
        disabled={disabled}
        required={required}
        hasError={!!errors.street1}
        error={errors.street1}
        autoComplete="address-line1"
        data-cy="input-address-line-1"
      />

      {/* Street Address Line 2 */}
      <Input
        id={`${idPrefix}-street2`}
        label={mergedLabels.street2}
        placeholder={mergedPlaceholders.street2}
        value={value.street2 || ''}
        onChange={(e) => handleChange('street2', e.target.value)}
        disabled={disabled}
        hasError={!!errors.street2}
        error={errors.street2}
        autoComplete="address-line2"
        data-cy="input-address-line-2"
      />

      {/* City, State, ZIP Row */}
      <div className="grid grid-cols-12 gap-4">
        {/* City - takes more space */}
        <div className="col-span-12 md:col-span-6">
          <Input
            id={`${idPrefix}-city`}
            label={mergedLabels.city}
            placeholder={mergedPlaceholders.city}
            value={value.city || ''}
            onChange={(e) => handleChange('city', e.target.value)}
            disabled={disabled}
            required={required}
            hasError={!!errors.city}
            error={errors.city}
            autoComplete="address-level2"
            data-cy="input-city"
          />
        </div>

        {/* State - smaller */}
        <div className="col-span-4 md:col-span-3">
          <Input
            id={`${idPrefix}-state`}
            label={mergedLabels.state}
            placeholder={mergedPlaceholders.state}
            value={value.state || ''}
            onChange={(e) =>
              handleChange('state', e.target.value.toUpperCase())
            }
            disabled={disabled}
            required={required}
            maxLength={2}
            hasError={!!errors.state}
            error={errors.state}
            autoComplete="address-level1"
            data-cy="input-state"
          />
        </div>

        {/* ZIP Code - smaller */}
        <div className="col-span-8 md:col-span-3">
          <Input
            id={`${idPrefix}-postalCode`}
            label={mergedLabels.postalCode}
            placeholder={mergedPlaceholders.postalCode}
            value={value.postalCode || ''}
            onChange={(e) => handleChange('postalCode', e.target.value)}
            disabled={disabled}
            required={required}
            hasError={!!errors.postalCode}
            error={errors.postalCode}
            autoComplete="postal-code"
            data-cy="input-postal-code"
          />
        </div>
      </div>

      {/* County and Country Row */}
      {(showCounty || showCountry) && (
        <div className="grid grid-cols-12 gap-4">
          {showCounty && (
            <div className={cn(showCountry ? 'col-span-6' : 'col-span-12')}>
              <Input
                id={`${idPrefix}-county`}
                label={mergedLabels.county}
                placeholder={mergedPlaceholders.county}
                value={value.county || ''}
                onChange={(e) => handleChange('county', e.target.value)}
                disabled={disabled}
                required={required}
                hasError={!!errors.county}
                error={errors.county}
                data-cy="input-county"
              />
            </div>
          )}

          {showCountry && (
            <div className={cn(showCounty ? 'col-span-6' : 'col-span-12')}>
              <Input
                id={`${idPrefix}-country`}
                label={mergedLabels.country}
                placeholder={mergedPlaceholders.country}
                value={value.country || defaultCountry}
                onChange={(e) => handleChange('country', e.target.value)}
                disabled={disabled}
                required
                hasError={!!errors.country}
                error={errors.country}
                autoComplete="country"
                data-cy="input-country"
              />
            </div>
          )}
        </div>
      )}

      {/* Hidden lat/lng fields for form submission */}
      {value.lat !== undefined && (
        <input type="hidden" name="lat" value={value.lat} />
      )}
      {value.lng !== undefined && (
        <input type="hidden" name="lng" value={value.lng} />
      )}
    </div>
  );
}

AddressForm.displayName = 'AddressForm';
