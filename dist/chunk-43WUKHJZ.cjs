'use strict';

var chunkVV4N4WY6_cjs = require('./chunk-VV4N4WY6.cjs');
var chunkBTJHYGPI_cjs = require('./chunk-BTJHYGPI.cjs');
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

var PhoneInput = React__namespace.forwardRef(
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
    const [displayValue, setDisplayValue] = React__namespace.useState(
      () => chunkBTJHYGPI_cjs.formatPhoneNumber(value)
    );
    const [localError, setLocalError] = React__namespace.useState();
    React__namespace.useEffect(() => {
      setDisplayValue(chunkBTJHYGPI_cjs.formatPhoneNumber(value));
    }, [value]);
    const handleChange = (e) => {
      const formatted = chunkBTJHYGPI_cjs.formatPhoneNumber(e.target.value);
      setDisplayValue(formatted);
      const unformatted = chunkBTJHYGPI_cjs.unformatPhoneNumber(formatted);
      onChange?.(unformatted);
      onFormattedChange?.(formatted);
      if (localError) {
        setLocalError(void 0);
      }
    };
    const handleBlur = (e) => {
      onBlur?.(e);
      if (validateOnBlur) {
        const unformatted = chunkBTJHYGPI_cjs.unformatPhoneNumber(displayValue);
        if (unformatted.length > 0 && !chunkBTJHYGPI_cjs.isValidPhoneNumber(displayValue)) {
          setLocalError("Please enter a valid 10-digit phone number");
        } else {
          setLocalError(void 0);
        }
      }
    };
    return /* @__PURE__ */ jsxRuntime.jsx(
      chunkVV4N4WY6_cjs.Input,
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
        className: chunkOR5DRJCW_cjs.cn(className),
        ...props
      }
    );
  }
);
PhoneInput.displayName = "PhoneInput";

exports.PhoneInput = PhoneInput;
//# sourceMappingURL=chunk-43WUKHJZ.cjs.map
//# sourceMappingURL=chunk-43WUKHJZ.cjs.map