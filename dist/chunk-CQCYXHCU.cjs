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
var PHONE_TYPES = [
  { value: "cell", label: "Cell" },
  { value: "landline", label: "Landline" },
  { value: "home", label: "Home" },
  { value: "work", label: "Work" },
  { value: "fax", label: "Fax" }
];
function PhoneInputGroup({
  value,
  onChange,
  minEntries = 1,
  maxEntries = 5,
  required = false,
  disabled = false,
  validateOnBlur = false,
  label,
  typeLabels,
  className
}) {
  const phones = React__namespace.useMemo(() => {
    if (value.length >= minEntries) return value;
    const padding = Array(minEntries - value.length).fill(null).map(() => ({ number: "", type: "cell" }));
    return [...value, ...padding];
  }, [value, minEntries]);
  const handlePhoneChange = (index, number) => {
    const updated = [...phones];
    updated[index] = { ...updated[index], number };
    onChange(updated);
  };
  const handleTypeChange = (index, type) => {
    const updated = [...phones];
    updated[index] = { ...updated[index], type };
    onChange(updated);
  };
  const handleAdd = () => {
    if (phones.length < maxEntries) {
      onChange([...phones, { number: "", type: "cell" }]);
    }
  };
  const handleRemove = (index) => {
    if (phones.length > minEntries) {
      onChange(phones.filter((_, i) => i !== index));
    }
  };
  const getTypeLabel = (type) => {
    if (typeLabels?.[type]) return typeLabels[type];
    return PHONE_TYPES.find((t) => t.value === type)?.label || type;
  };
  const canAdd = phones.length < maxEntries;
  const canRemove = phones.length > minEntries;
  return /* @__PURE__ */ jsxRuntime.jsx("div", { className: chunkOR5DRJCW_cjs.cn("space-y-3", className), children: phones.map((phone, index) => /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex items-start gap-2", children: [
    /* @__PURE__ */ jsxRuntime.jsx("div", { className: "flex-1", children: /* @__PURE__ */ jsxRuntime.jsx(
      PhoneInput,
      {
        label: index === 0 ? label : void 0,
        value: phone.number,
        onChange: (num) => handlePhoneChange(index, num),
        disabled,
        validateOnBlur,
        required: required && index === 0
      }
    ) }),
    /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "w-32 shrink-0", children: [
      /* @__PURE__ */ jsxRuntime.jsx("label", { htmlFor: `phone-type-${index}`, className: "sr-only", children: "Phone type" }),
      /* @__PURE__ */ jsxRuntime.jsx(
        "select",
        {
          id: `phone-type-${index}`,
          value: phone.type,
          onChange: (e) => handleTypeChange(index, e.target.value),
          disabled,
          className: chunkOR5DRJCW_cjs.cn(
            "w-full rounded-md border px-3 py-2 text-sm",
            "border-gray-300 bg-white text-gray-900",
            "focus:border-brand-500 focus:ring-brand-500/20 focus:ring-2 focus:outline-none",
            "disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500",
            "dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100",
            "dark:focus:border-brand-400 dark:focus:ring-brand-400/20",
            index === 0 && label ? "mt-6" : ""
          ),
          children: PHONE_TYPES.map((type) => /* @__PURE__ */ jsxRuntime.jsx("option", { value: type.value, children: getTypeLabel(type.value) }, type.value))
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntime.jsx(
      "div",
      {
        className: chunkOR5DRJCW_cjs.cn(
          "flex shrink-0 items-center",
          index === 0 && label ? "mt-6" : ""
        ),
        children: index === 0 ? /* @__PURE__ */ jsxRuntime.jsx(
          "button",
          {
            type: "button",
            onClick: handleAdd,
            disabled: disabled || !canAdd,
            className: chunkOR5DRJCW_cjs.cn(
              "rounded-full p-2 transition-colors",
              "text-brand-600 hover:bg-brand-50",
              "disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent",
              "dark:text-brand-400 dark:hover:bg-brand-900/20",
              "dark:disabled:text-gray-600"
            ),
            "aria-label": "Add phone number",
            children: /* @__PURE__ */ jsxRuntime.jsx(
              "svg",
              {
                className: "h-5 w-5",
                fill: "none",
                viewBox: "0 0 24 24",
                stroke: "currentColor",
                children: /* @__PURE__ */ jsxRuntime.jsx(
                  "path",
                  {
                    strokeLinecap: "round",
                    strokeLinejoin: "round",
                    strokeWidth: 2,
                    d: "M12 4v16m8-8H4"
                  }
                )
              }
            )
          }
        ) : /* @__PURE__ */ jsxRuntime.jsx(
          "button",
          {
            type: "button",
            onClick: () => handleRemove(index),
            disabled: disabled || !canRemove,
            className: chunkOR5DRJCW_cjs.cn(
              "rounded-full p-2 transition-colors",
              "text-red-600 hover:bg-red-50",
              "disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent",
              "dark:text-red-400 dark:hover:bg-red-900/20",
              "dark:disabled:text-gray-600"
            ),
            "aria-label": "Remove phone number",
            children: /* @__PURE__ */ jsxRuntime.jsx(
              "svg",
              {
                className: "h-5 w-5",
                fill: "none",
                viewBox: "0 0 24 24",
                stroke: "currentColor",
                children: /* @__PURE__ */ jsxRuntime.jsx(
                  "path",
                  {
                    strokeLinecap: "round",
                    strokeLinejoin: "round",
                    strokeWidth: 2,
                    d: "M20 12H4"
                  }
                )
              }
            )
          }
        )
      }
    )
  ] }, index)) });
}
PhoneInputGroup.displayName = "PhoneInputGroup";

exports.PhoneInput = PhoneInput;
exports.PhoneInputGroup = PhoneInputGroup;
//# sourceMappingURL=chunk-CQCYXHCU.cjs.map
//# sourceMappingURL=chunk-CQCYXHCU.cjs.map