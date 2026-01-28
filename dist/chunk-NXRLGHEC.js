import { cn } from './chunk-F3SOEIN2.js';
import * as React from 'react';
import { cva } from 'class-variance-authority';
import { jsxs, jsx } from 'react/jsx-runtime';

var inputVariants = cva(
  [
    "w-full px-3 py-2",
    "border border-input rounded-lg",
    "bg-background text-foreground",
    "placeholder:text-muted-foreground",
    "transition-colors duration-200",
    "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
    "disabled:cursor-not-allowed disabled:opacity-50"
  ],
  {
    variants: {
      size: {
        sm: "h-8 text-sm",
        md: "h-10 text-base",
        lg: "h-12 text-lg"
      },
      hasError: {
        true: "border-destructive focus:ring-destructive",
        false: ""
      }
    },
    defaultVariants: {
      size: "md",
      hasError: false
    }
  }
);
var Input = React.forwardRef(
  ({
    className,
    size,
    hasError,
    error,
    helperText,
    label,
    hideLabel,
    required,
    disabled,
    id,
    "aria-describedby": ariaDescribedBy,
    ...props
  }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;
    const describedByIds = [
      error ? errorId : null,
      helperText ? helperId : null,
      ariaDescribedBy
    ].filter(Boolean).join(" ");
    return /* @__PURE__ */ jsxs("div", { className: cn("flex flex-col gap-1.5", disabled && "opacity-50"), children: [
      label && /* @__PURE__ */ jsxs(
        "label",
        {
          htmlFor: inputId,
          className: cn(
            "text-foreground text-sm font-medium",
            hideLabel && "sr-only"
          ),
          children: [
            label,
            required && /* @__PURE__ */ jsx("span", { className: "text-destructive ml-1", "aria-hidden": "true", children: "*" })
          ]
        }
      ),
      /* @__PURE__ */ jsx(
        "input",
        {
          id: inputId,
          ref,
          className: cn(
            inputVariants({ size, hasError: hasError || !!error }),
            className
          ),
          "aria-invalid": hasError || !!error,
          "aria-describedby": describedByIds || void 0,
          required,
          disabled,
          ...props
        }
      ),
      error && /* @__PURE__ */ jsx("p", { id: errorId, className: "text-destructive text-sm", role: "alert", children: error }),
      helperText && !error && /* @__PURE__ */ jsx("p", { id: helperId, className: "text-muted-foreground text-sm", children: helperText })
    ] });
  }
);
Input.displayName = "Input";

export { Input, inputVariants };
//# sourceMappingURL=chunk-NXRLGHEC.js.map
//# sourceMappingURL=chunk-NXRLGHEC.js.map