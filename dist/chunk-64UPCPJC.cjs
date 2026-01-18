'use strict';

var chunkKMN7JX2X_cjs = require('./chunk-KMN7JX2X.cjs');
var chunkDQTQ4AQQ_cjs = require('./chunk-DQTQ4AQQ.cjs');
var chunkOR5DRJCW_cjs = require('./chunk-OR5DRJCW.cjs');
var React = require('react');
var jsxRuntime = require('react/jsx-runtime');

function _interopNamespace(e) {
  if (e && e.__esModule) return e;
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n.default = e;
  return Object.freeze(n);
}

var React__namespace = /*#__PURE__*/_interopNamespace(React);

function getValidationError(value, mode, minAge, maxAge) {
  if (!value || value.replace(/\D/g, "").length === 0) {
    return void 0;
  }
  if (!chunkKMN7JX2X_cjs.isValidDate(value)) {
    return "Please enter a valid date (MM/DD/YYYY)";
  }
  switch (mode) {
    case "dob": {
      if (!chunkKMN7JX2X_cjs.isDateInPast(value)) {
        return "Date of birth must be in the past";
      }
      const age = chunkKMN7JX2X_cjs.calculateAge(value);
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
      if (!chunkKMN7JX2X_cjs.isDateInFuture(value)) {
        return "Expiration date must be in the future";
      }
      break;
    case "past":
      if (!chunkKMN7JX2X_cjs.isDateInPast(value)) {
        return "Date must be in the past";
      }
      break;
    case "future":
      if (!chunkKMN7JX2X_cjs.isDateInFuture(value)) {
        return "Date must be in the future";
      }
      break;
  }
  return void 0;
}
var DateInput = React__namespace.forwardRef(
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
    const [displayValue, setDisplayValue] = React__namespace.useState(
      () => chunkKMN7JX2X_cjs.formatDateValue(value)
    );
    const [localError, setLocalError] = React__namespace.useState();
    React__namespace.useEffect(() => {
      setDisplayValue(chunkKMN7JX2X_cjs.formatDateValue(value));
    }, [value]);
    const handleChange = (e) => {
      const formatted = chunkKMN7JX2X_cjs.formatDateValue(e.target.value);
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
    return /* @__PURE__ */ jsxRuntime.jsx(
      chunkDQTQ4AQQ_cjs.Input,
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
        className: chunkOR5DRJCW_cjs.cn(className),
        ...props
      }
    );
  }
);
DateInput.displayName = "DateInput";

exports.DateInput = DateInput;
//# sourceMappingURL=chunk-64UPCPJC.cjs.map
//# sourceMappingURL=chunk-64UPCPJC.cjs.map