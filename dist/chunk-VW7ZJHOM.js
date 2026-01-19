import { cn } from './chunk-F3SOEIN2.js';
import * as React from 'react';
import { cva } from 'class-variance-authority';
import { jsxs, jsx } from 'react/jsx-runtime';

var checkboxVariants = cva(
  [
    "shrink-0 appearance-none",
    "border-2 border-input rounded",
    "bg-background",
    "transition-all duration-150",
    "cursor-pointer",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:cursor-not-allowed disabled:opacity-50",
    "checked:bg-primary-500 checked:border-primary-500",
    "indeterminate:bg-primary-500 indeterminate:border-primary-500"
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
var Checkbox = React.forwardRef(
  ({
    className,
    size,
    label,
    description,
    indeterminate = false,
    error,
    labelPosition = "right",
    id,
    disabled,
    ...props
  }, ref) => {
    const internalRef = React.useRef(null);
    const generatedId = React.useId();
    const checkboxId = id || generatedId;
    const descriptionId = `${checkboxId}-description`;
    const errorId = `${checkboxId}-error`;
    React.useEffect(() => {
      const checkbox = internalRef.current;
      if (checkbox) {
        checkbox.indeterminate = indeterminate;
      }
    }, [indeterminate]);
    React.useImperativeHandle(ref, () => internalRef.current);
    const checkboxElement = /* @__PURE__ */ jsxs("span", { className: "relative inline-flex items-center justify-center", children: [
      /* @__PURE__ */ jsx(
        "input",
        {
          ref: internalRef,
          id: checkboxId,
          type: "checkbox",
          disabled,
          "aria-describedby": [description ? descriptionId : null, error ? errorId : null].filter(Boolean).join(" ") || void 0,
          "aria-invalid": !!error,
          className: cn(checkboxVariants({ size }), className),
          ...props
        }
      ),
      /* @__PURE__ */ jsx(
        CheckIcon,
        {
          size,
          className: "pointer-events-none absolute text-white opacity-0 peer-checked:opacity-100"
        }
      )
    ] });
    const labelElement = label && /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-0.5", children: [
      /* @__PURE__ */ jsx(
        "label",
        {
          htmlFor: checkboxId,
          className: cn(
            "text-foreground cursor-pointer text-sm font-medium select-none",
            disabled && "cursor-not-allowed opacity-50"
          ),
          children: label
        }
      ),
      description && /* @__PURE__ */ jsx("p", { id: descriptionId, className: "text-muted-foreground text-xs", children: description })
    ] });
    return /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-1", children: [
      /* @__PURE__ */ jsxs(
        "div",
        {
          className: cn(
            "flex items-start gap-3",
            labelPosition === "left" && "flex-row-reverse"
          ),
          children: [
            checkboxElement,
            labelElement
          ]
        }
      ),
      error && /* @__PURE__ */ jsx("p", { id: errorId, className: "text-destructive text-sm", role: "alert", children: error })
    ] });
  }
);
Checkbox.displayName = "Checkbox";
function CheckboxGroup({
  label,
  description,
  error,
  orientation = "vertical",
  children,
  className
}) {
  const groupId = React.useId();
  const descriptionId = `${groupId}-description`;
  const errorId = `${groupId}-error`;
  return /* @__PURE__ */ jsxs(
    "fieldset",
    {
      className: cn("flex flex-col gap-2", className),
      "aria-describedby": [description ? descriptionId : null, error ? errorId : null].filter(Boolean).join(" ") || void 0,
      children: [
        label && /* @__PURE__ */ jsx("legend", { className: "text-foreground text-sm font-medium", children: label }),
        description && /* @__PURE__ */ jsx("p", { id: descriptionId, className: "text-muted-foreground text-xs", children: description }),
        /* @__PURE__ */ jsx(
          "div",
          {
            role: "group",
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
  );
}
CheckboxGroup.displayName = "CheckboxGroup";
function CheckIcon({ size, className }) {
  const sizeMap = {
    sm: 10,
    md: 12,
    lg: 14
  };
  const iconSize = sizeMap[size || "md"];
  return /* @__PURE__ */ jsx(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      width: iconSize,
      height: iconSize,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "3",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      className,
      "aria-hidden": "true",
      children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" })
    }
  );
}

export { Checkbox, CheckboxGroup, checkboxVariants };
//# sourceMappingURL=chunk-VW7ZJHOM.js.map
//# sourceMappingURL=chunk-VW7ZJHOM.js.map