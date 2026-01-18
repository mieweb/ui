import { formatPhoneNumber, unformatPhoneNumber, isValidPhoneNumber } from './chunk-CEHWXAAI.js';
import { Input } from './chunk-LIYX5CYL.js';
import { cn } from './chunk-F3SOEIN2.js';
import * as React from 'react';
import { jsx } from 'react/jsx-runtime';

var PhoneInput = React.forwardRef(
  ({
    value = "",
    onChange,
    onFormattedChange,
    validateOnBlur,
    className,
    onBlur,
    hasError,
    error,
    ...props
  }, ref) => {
    const [displayValue, setDisplayValue] = React.useState(
      () => formatPhoneNumber(value)
    );
    const [localError, setLocalError] = React.useState();
    React.useEffect(() => {
      setDisplayValue(formatPhoneNumber(value));
    }, [value]);
    const handleChange = (e) => {
      const formatted = formatPhoneNumber(e.target.value);
      setDisplayValue(formatted);
      const unformatted = unformatPhoneNumber(formatted);
      onChange?.(unformatted);
      onFormattedChange?.(formatted);
      if (localError) {
        setLocalError(void 0);
      }
    };
    const handleBlur = (e) => {
      onBlur?.(e);
      if (validateOnBlur) {
        const unformatted = unformatPhoneNumber(displayValue);
        if (unformatted.length > 0 && !isValidPhoneNumber(displayValue)) {
          setLocalError("Please enter a valid 10-digit phone number");
        } else {
          setLocalError(void 0);
        }
      }
    };
    return /* @__PURE__ */ jsx(
      Input,
      {
        ref,
        type: "tel",
        inputMode: "numeric",
        autoComplete: "tel-national",
        placeholder: "(555) 555-5555",
        value: displayValue,
        onChange: handleChange,
        onBlur: handleBlur,
        hasError: hasError || !!localError,
        error: error || localError,
        className: cn(className),
        ...props
      }
    );
  }
);
PhoneInput.displayName = "PhoneInput";

export { PhoneInput };
//# sourceMappingURL=chunk-4M33VUCY.js.map
//# sourceMappingURL=chunk-4M33VUCY.js.map