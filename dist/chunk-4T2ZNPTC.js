import { cn } from './chunk-F3SOEIN2.js';
import * as React from 'react';
import { cva } from 'class-variance-authority';
import { jsxs, jsx } from 'react/jsx-runtime';

var sliderTrackVariants = cva(
  [
    "relative w-full overflow-hidden rounded-full",
    "bg-neutral-200 dark:bg-neutral-700",
    "cursor-pointer",
    "group-data-[disabled=true]:cursor-not-allowed group-data-[disabled=true]:opacity-50"
  ],
  {
    variants: {
      size: {
        sm: "h-1",
        md: "h-2",
        lg: "h-3"
      }
    },
    defaultVariants: {
      size: "md"
    }
  }
);
var sliderRangeVariants = cva(
  ["absolute h-full rounded-full transition-all duration-75 ease-out"],
  {
    variants: {
      variant: {
        default: "bg-primary-500",
        success: "bg-green-500",
        warning: "bg-yellow-500",
        danger: "bg-red-500",
        neutral: "bg-neutral-500"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);
var sliderThumbVariants = cva(
  [
    "absolute top-1/2 -translate-y-1/2 -translate-x-1/2",
    "rounded-full border-2 bg-white",
    "shadow-md transition-shadow duration-150",
    "peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2",
    "peer-hover:shadow-lg",
    "peer-active:shadow-xl peer-active:scale-110",
    "group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50"
  ],
  {
    variants: {
      size: {
        sm: "h-3.5 w-3.5",
        md: "h-5 w-5",
        lg: "h-6 w-6"
      },
      variant: {
        default: "border-primary-500",
        success: "border-green-500",
        warning: "border-yellow-500",
        danger: "border-red-500",
        neutral: "border-neutral-500"
      }
    },
    defaultVariants: {
      size: "md",
      variant: "default"
    }
  }
);
var Slider = React.forwardRef(
  ({
    value: controlledValue,
    defaultValue = 0,
    min = 0,
    max = 100,
    step = 1,
    onValueChange,
    onValueCommit,
    disabled = false,
    label,
    showValue = false,
    formatValue,
    description,
    minLabel,
    maxLabel,
    variant,
    size,
    className,
    trackClassName,
    id,
    name,
    "aria-label": ariaLabelProp,
    "aria-labelledby": ariaLabelledByProp
  }, ref) => {
    const hasExplicitLabel = !!label;
    const ariaLabelledBy = ariaLabelledByProp;
    const ariaLabel = ariaLabelProp ?? (!hasExplicitLabel && !ariaLabelledByProp ? "Slider" : void 0);
    const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue);
    const isControlled = controlledValue !== void 0;
    const currentValue = isControlled ? controlledValue : uncontrolledValue;
    const clampedValue = Math.min(Math.max(currentValue, min), max);
    const percentage = max !== min ? (clampedValue - min) / (max - min) * 100 : 0;
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const handleChange = (e) => {
      const newValue = parseFloat(e.target.value);
      if (!isControlled) {
        setUncontrolledValue(newValue);
      }
      onValueChange?.(newValue);
    };
    const handleCommit = () => {
      onValueCommit?.(clampedValue);
    };
    const displayValue = formatValue ? formatValue(clampedValue) : String(clampedValue);
    return /* @__PURE__ */ jsxs(
      "div",
      {
        className: cn("w-full", className),
        "data-disabled": disabled || void 0,
        children: [
          (label || showValue) && /* @__PURE__ */ jsxs("div", { className: "mb-1.5 flex items-baseline justify-between", children: [
            label && /* @__PURE__ */ jsxs(
              "label",
              {
                htmlFor: inputId,
                className: cn(
                  "text-foreground text-sm font-medium",
                  disabled && "opacity-50"
                ),
                children: [
                  label,
                  showValue && /* @__PURE__ */ jsx("span", { className: "text-muted-foreground ml-1", children: displayValue })
                ]
              }
            ),
            !label && showValue && /* @__PURE__ */ jsx("span", { className: "text-muted-foreground text-sm", children: displayValue })
          ] }),
          description && /* @__PURE__ */ jsx(
            "p",
            {
              className: cn(
                "text-muted-foreground mb-2 text-xs",
                disabled && "opacity-50"
              ),
              children: description
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "group relative", "data-disabled": disabled || void 0, children: [
            /* @__PURE__ */ jsx("div", { className: cn(sliderTrackVariants({ size }), trackClassName), children: /* @__PURE__ */ jsx(
              "div",
              {
                className: sliderRangeVariants({ variant }),
                style: { width: `${percentage}%` }
              }
            ) }),
            /* @__PURE__ */ jsx(
              "input",
              {
                ref,
                type: "range",
                className: cn(
                  "peer absolute inset-0 h-full w-full cursor-pointer opacity-0",
                  disabled && "cursor-not-allowed"
                ),
                id: inputId,
                name,
                min,
                max,
                step,
                value: clampedValue,
                onChange: handleChange,
                onMouseUp: handleCommit,
                onTouchEnd: handleCommit,
                onKeyUp: handleCommit,
                onBlur: handleCommit,
                disabled,
                "aria-label": ariaLabel,
                "aria-labelledby": ariaLabelledBy,
                "aria-valuemin": min,
                "aria-valuemax": max,
                "aria-valuenow": clampedValue
              }
            ),
            /* @__PURE__ */ jsx(
              "div",
              {
                className: sliderThumbVariants({ size, variant }),
                style: { left: `${percentage}%` },
                "aria-hidden": "true"
              }
            )
          ] }),
          (minLabel || maxLabel) && /* @__PURE__ */ jsxs(
            "div",
            {
              className: cn(
                "text-muted-foreground mt-1 flex justify-between text-xs",
                disabled && "opacity-50"
              ),
              children: [
                /* @__PURE__ */ jsx("span", { children: minLabel }),
                /* @__PURE__ */ jsx("span", { children: maxLabel })
              ]
            }
          )
        ]
      }
    );
  }
);
Slider.displayName = "Slider";

export { Slider, sliderRangeVariants, sliderThumbVariants, sliderTrackVariants };
//# sourceMappingURL=chunk-4T2ZNPTC.js.map
//# sourceMappingURL=chunk-4T2ZNPTC.js.map