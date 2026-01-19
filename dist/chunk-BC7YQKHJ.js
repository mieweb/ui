import { cn } from './chunk-F3SOEIN2.js';
import * as React from 'react';
import { cva } from 'class-variance-authority';
import { jsxs, jsx } from 'react/jsx-runtime';

var RadioGroupContext = React.createContext(void 0);
function useRadioGroupContext() {
  const context = React.useContext(RadioGroupContext);
  if (!context) {
    throw new Error("Radio must be used within a RadioGroup");
  }
  return context;
}
var radioVariants = cva(
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
  const generatedName = React.useId();
  const groupName = name || generatedName;
  const groupId = React.useId();
  const descriptionId = `${groupId}-description`;
  const errorId = `${groupId}-error`;
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue);
  const isControlled = controlledValue !== void 0;
  const value = isControlled ? controlledValue : uncontrolledValue;
  const handleChange = React.useCallback(
    (newValue) => {
      if (!isControlled) {
        setUncontrolledValue(newValue);
      }
      onValueChange?.(newValue);
    },
    [isControlled, onValueChange]
  );
  return /* @__PURE__ */ jsx(
    RadioGroupContext.Provider,
    {
      value: { name: groupName, value, onChange: handleChange, disabled, size },
      children: /* @__PURE__ */ jsxs(
        "fieldset",
        {
          role: "radiogroup",
          className: cn("flex flex-col gap-2", className),
          "aria-describedby": [description ? descriptionId : null, error ? errorId : null].filter(Boolean).join(" ") || void 0,
          children: [
            label && /* @__PURE__ */ jsx("legend", { className: "text-foreground text-sm font-medium", children: label }),
            description && /* @__PURE__ */ jsx("p", { id: descriptionId, className: "text-muted-foreground text-xs", children: description }),
            /* @__PURE__ */ jsx(
              "div",
              {
                className: cn(
                  "flex gap-4",
                  orientation === "vertical" && "flex-col gap-3"
                ),
                children
              }
            ),
            error && /* @__PURE__ */ jsx("p", { id: errorId, className: "text-destructive text-sm", role: "alert", children: error })
          ]
        }
      )
    }
  );
}
RadioGroup.displayName = "RadioGroup";
var Radio = React.forwardRef(
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
    const generatedId = React.useId();
    const radioId = id || generatedId;
    const descriptionId = `${radioId}-description`;
    const isChecked = context.value === value;
    const isDisabled = propDisabled || context.disabled;
    const size = propSize || context.size;
    const handleChange = React.useCallback(() => {
      if (!isDisabled) {
        context.onChange(value);
      }
    }, [isDisabled, context, value]);
    const radioElement = /* @__PURE__ */ jsxs("span", { className: "relative inline-flex items-center justify-center", children: [
      /* @__PURE__ */ jsx(
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
          className: cn(radioVariants({ size }), className),
          ...props
        }
      ),
      /* @__PURE__ */ jsx(
        "span",
        {
          className: cn(
            "bg-primary-500 pointer-events-none absolute rounded-full transition-transform",
            size === "sm" && "h-2 w-2",
            size === "md" && "h-2.5 w-2.5",
            size === "lg" && "h-3 w-3",
            isChecked ? "scale-100" : "scale-0"
          )
        }
      )
    ] });
    const labelElement = label && /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-0.5", children: [
      /* @__PURE__ */ jsx(
        "label",
        {
          htmlFor: radioId,
          className: cn(
            "text-foreground cursor-pointer text-sm font-medium select-none",
            isDisabled && "cursor-not-allowed opacity-50"
          ),
          children: label
        }
      ),
      description && /* @__PURE__ */ jsx("p", { id: descriptionId, className: "text-muted-foreground text-xs", children: description })
    ] });
    return /* @__PURE__ */ jsxs(
      "div",
      {
        className: cn(
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

export { Radio, RadioGroup, radioVariants };
//# sourceMappingURL=chunk-BC7YQKHJ.js.map
//# sourceMappingURL=chunk-BC7YQKHJ.js.map