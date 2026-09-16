import {
  CountryDropdownBase,
  type CountryCodeDropdownProps,
} from '../CountryCodeDropdown/CountryCodeDropdown';

export type CountryDropdownProps = CountryCodeDropdownProps;

/**
 * A searchable country selector — {@link CountryCodeDropdown} without the
 * dial codes. The trigger shows the flag and country name; the dropdown
 * lists flag + name only.
 *
 * Unlike `CountryCodeDropdown`, nothing is selected by default: the trigger
 * shows `placeholder` until the user picks a country. Pass `defaultValue`
 * (uncontrolled) or `value` (controlled) to start with a country selected;
 * pass `value=""` for a controlled empty state.
 *
 * @example
 * ```tsx
 * const [country, setCountry] = useState<CountryData>();
 *
 * <CountryDropdown value={country?.code ?? ''} onChange={setCountry} />
 * ```
 */
function CountryDropdown({
  'aria-label': ariaLabel = 'Select country',
  defaultValue = '',
  ...props
}: CountryDropdownProps) {
  return (
    <CountryDropdownBase
      {...props}
      aria-label={ariaLabel}
      defaultValue={defaultValue}
      showDialCode={false}
    />
  );
}

CountryDropdown.displayName = 'CountryDropdown';

export { CountryDropdown };
