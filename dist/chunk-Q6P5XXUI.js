import { Input } from './chunk-NXRLGHEC.js';
import { formatDateValue, isValidDate, isDateInFuture, isDateInPast, calculateAge } from './chunk-SN52QMRT.js';
import { cn } from './chunk-F3SOEIN2.js';
import * as React from 'react';
import { jsx } from 'react/jsx-runtime';

function getValidationError(value, mode, minAge, maxAge) {
  if (!value || value.replace(/\D/g, "").length === 0) {
    return void 0;
  }
  if (!isValidDate(value)) {
    return "Please enter a valid date (MM/DD/YYYY)";
  }
  switch (mode) {
    case "dob": {
      if (!isDateInPast(value)) {
        return "Date of birth must be in the past";
      }
      const age = calculateAge(value);
      if (age !== null) {
        if (minAge !== void 0 && age < minAge) {
          return `Must be at least ${minAge} years old`;
        }
        if (maxAge !== void 0 && age > maxAge) {
          return `Must be no more than ${maxAge} years old`;
        }
      }
      break;
    }
    case "expiration":
      if (!isDateInFuture(value)) {
        return "Expiration date must be in the future";
      }
      break;
    case "past":
      if (!isDateInPast(value)) {
        return "Date must be in the past";
      }
      break;
    case "future":
      if (!isDateInFuture(value)) {
        return "Date must be in the future";
      }
      break;
  }
  return void 0;
}
var DateInput = React.forwardRef(
  ({
    value = "",
    onChange,
    mode = "default",
    minAge,
    maxAge,
    validateOnBlur,
    className,
    onBlur,
    hasError,
    error,
    ...props
  }, ref) => {
    const [displayValue, setDisplayValue] = React.useState(
      () => formatDateValue(value)
    );
    const [localError, setLocalError] = React.useState();
    React.useEffect(() => {
      setDisplayValue(formatDateValue(value));
    }, [value]);
    const handleChange = (e) => {
      const formatted = formatDateValue(e.target.value);
      setDisplayValue(formatted);
      onChange?.(formatted);
      if (localError) {
        setLocalError(void 0);
      }
    };
    const handleBlur = (e) => {
      onBlur?.(e);
      if (validateOnBlur) {
        const validationError = getValidationError(
          displayValue,
          mode,
          minAge,
          maxAge
        );
        setLocalError(validationError);
      }
    };
    const placeholder = mode === "expiration" ? "MM/DD/YYYY" : "MM/DD/YYYY";
    const autoComplete = mode === "dob" ? "bday" : mode === "expiration" ? "cc-exp" : void 0;
    return /* @__PURE__ */ jsx(
      Input,
      {
        ref,
        type: "text",
        inputMode: "numeric",
        autoComplete,
        placeholder,
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
DateInput.displayName = "DateInput";

export { DateInput };
//# sourceMappingURL=chunk-Q6P5XXUI.js.map
//# sourceMappingURL=chunk-Q6P5XXUI.js.map