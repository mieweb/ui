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
 * @example
 * ```tsx
 * const [country, setCountry] = useState<CountryData>();
 *
 * <CountryDropdown value={country?.code} onChange={setCountry} />
 * ```
 */
function CountryDropdown({
  'aria-label': ariaLabel = 'Select country',
  ...props
}: CountryDropdownProps) {
  return (
    <CountryDropdownBase
      {...props}
      aria-label={ariaLabel}
      showDialCode={false}
    />
  );
}

CountryDropdown.displayName = 'CountryDropdown';

export { CountryDropdown };
