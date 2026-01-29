'use strict';

var chunkOR5DRJCW_cjs = require('./chunk-OR5DRJCW.cjs');
var React = require('react');
var classVarianceAuthority = require('class-variance-authority');
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

var RadioGroupContext = React__namespace.createContext(void 0);
function useRadioGroupContext() {
  const context = React__namespace.useContext(RadioGroupContext);
  if (!context) {
    throw new Error("Radio must be used within a RadioGroup");
  }
  return context;
}
var radioVariants = classVarianceAuthority.cva(
  [
    "shrink-0 appearance-none",
    "border-2 border-input rounded-full",
    "bg-background",
    "transition-all duration-150",
    "cursor-pointer",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:cursor-not-allowed disabled:opacity-50",
    "checked:border-primary-500"
  ],
  {
    variants: {
      size: {
        sm: "h-4 w-4",
        md: "h-5 w-5",
        lg: "h-6 w-6"
      }
    },
    defaultVariants: {
      size: "md"
    }
  }
);
function RadioGroup({
  name,
  value: controlledValue,
  defaultValue = "",
  onValueChange,
  label,
  description,
  error,
  disabled = false,
  size = "md",
  orientation = "vertical",
  children,
  className
}) {
  const generatedName = React__namespace.useId();
  const groupName = name || generatedName;
  const groupId = React__namespace.useId();
  const descriptionId = `${groupId}-description`;
  const errorId = `${groupId}-error`;
  const [uncontrolledValue, setUncontrolledValue] = React__namespace.useState(defaultValue);
  const isControlled = controlledValue !== void 0;
  const value = isControlled ? controlledValue : uncontrolledValue;
  const handleChange = React__namespace.useCallback(
    (newValue) => {
      if (!isControlled) {
        setUncontrolledValue(newValue);
      }
      onValueChange?.(newValue);
    },
    [isControlled, onValueChange]
  );
  return /* @__PURE__ */ jsxRuntime.jsx(
    RadioGroupContext.Provider,
    {
      value: { name: groupName, value, onChange: handleChange, disabled, size },
      children: /* @__PURE__ */ jsxRuntime.jsxs(
        "fieldset",
        {
          role: "radiogroup",
          className: chunkOR5DRJCW_cjs.cn("flex flex-col gap-2", className),
          "aria-describedby": [description ? descriptionId : null, error ? errorId : null].filter(Boolean).join(" ") || void 0,
          children: [
            label && /* @__PURE__ */ jsxRuntime.jsx(
              "legend",
              {
                className: chunkOR5DRJCW_cjs.cn(
                  "text-foreground font-medium",
                  size === "sm" && "text-xs",
                  size === "md" && "text-sm",
                  size === "lg" && "text-base"
                ),
                children: label
              }
            ),
            description && /* @__PURE__ */ jsxRuntime.jsx(
              "p",
              {
                id: descriptionId,
                className: chunkOR5DRJCW_cjs.cn(
                  "text-muted-foreground",
                  size === "sm" && "text-[10px]",
                  size === "md" && "text-xs",
                  size === "lg" && "text-sm"
                ),
                children: description
              }
            ),
            /* @__PURE__ */ jsxRuntime.jsx(
              "div",
              {
                className: chunkOR5DRJCW_cjs.cn(
                  "flex gap-4",
                  orientation === "vertical" && "flex-col gap-3"
                ),
                children
              }
            ),
            error && /* @__PURE__ */ jsxRuntime.jsx(
              "p",
              {
                id: errorId,
                className: chunkOR5DRJCW_cjs.cn(
                  "text-destructive",
                  size === "sm" && "text-xs",
                  size === "md" && "text-sm",
                  size === "lg" && "text-base"
                ),
                role: "alert",
                children: error
              }
            )
          ]
        }
      )
    }
  );
}
RadioGroup.displayName = "RadioGroup";
var Radio = React__namespace.forwardRef(
  ({
    className,
    size: propSize,
    value,
    label,
    description,
    labelPosition = "right",
    disabled: propDisabled,
    id,
    ...props
  }, ref) => {
    const context = useRadioGroupContext();
    const generatedId = React__namespace.useId();
    const radioId = id || generatedId;
    const descriptionId = `${radioId}-description`;
    const isChecked = context.value === value;
    const isDisabled = propDisabled || context.disabled;
    const size = propSize || context.size;
    const handleChange = React__namespace.useCallback(() => {
      if (!isDisabled) {
        context.onChange(value);
      }
    }, [isDisabled, context, value]);
    const radioElement = /* @__PURE__ */ jsxRuntime.jsxs("span", { className: "relative inline-flex items-center justify-center", children: [
      /* @__PURE__ */ jsxRuntime.jsx(
        "input",
        {
          ref,
          id: radioId,
          type: "radio",
          name: context.name,
          value,
          checked: isChecked,
          disabled: isDisabled,
          onChange: handleChange,
          "aria-describedby": description ? descriptionId : void 0,
          className: chunkOR5DRJCW_cjs.cn(radioVariants({ size }), className),
          ...props
        }
      ),
      /* @__PURE__ */ jsxRuntime.jsx(
        "span",
        {
          className: chunkOR5DRJCW_cjs.cn(
            "bg-primary-500 pointer-events-none absolute rounded-full transition-transform",
            size === "sm" && "h-2 w-2",
            size === "md" && "h-2.5 w-2.5",
            size === "lg" && "h-3 w-3",
            isChecked ? "scale-100" : "scale-0"
          )
        }
      )
    ] });
    const labelElement = label && /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex flex-col gap-0.5", children: [
      /* @__PURE__ */ jsxRuntime.jsx(
        "label",
        {
          htmlFor: radioId,
          className: chunkOR5DRJCW_cjs.cn(
            "text-foreground cursor-pointer font-medium select-none",
            size === "sm" && "text-xs",
            size === "md" && "text-sm",
            size === "lg" && "text-base",
            isDisabled && "cursor-not-allowed opacity-50"
          ),
          children: label
        }
      ),
      description && /* @__PURE__ */ jsxRuntime.jsx(
        "p",
        {
          id: descriptionId,
          className: chunkOR5DRJCW_cjs.cn(
            "text-muted-foreground",
            size === "sm" && "text-[10px]",
            size === "md" && "text-xs",
            size === "lg" && "text-sm"
          ),
          children: description
        }
      )
    ] });
    return /* @__PURE__ */ jsxRuntime.jsxs(
      "div",
      {
        className: chunkOR5DRJCW_cjs.cn(
          "flex items-start gap-3",
          labelPosition === "left" && "flex-row-reverse"
        ),
        children: [
          radioElement,
          labelElement
        ]
      }
    );
  }
);
Radio.displayName = "Radio";

exports.Radio = Radio;
exports.RadioGroup = RadioGroup;
exports.radioVariants = radioVariants;
//# sourceMappingURL=chunk-XHJGYBYG.cjs.map
//# sourceMappingURL=chunk-XHJGYBYG.cjs.map