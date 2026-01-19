import { cn } from './chunk-F3SOEIN2.js';
import * as React from 'react';
import { cva } from 'class-variance-authority';
import { jsxs, jsx } from 'react/jsx-runtime';

var textareaVariants = cva(
  [
    "w-full px-3 py-2",
    "border border-input rounded-lg",
    "bg-background text-foreground",
    "placeholder:text-muted-foreground",
    "transition-colors duration-200",
    "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
    "disabled:cursor-not-allowed disabled:opacity-50",
    "resize-y"
  ],
  {
    variants: {
      size: {
        sm: "text-sm min-h-[60px]",
        md: "text-base min-h-[80px]",
        lg: "text-lg min-h-[100px]"
      },
      hasError: {
        true: "border-destructive focus:ring-destructive",
        false: ""
      },
      resize: {
        none: "resize-none",
        vertical: "resize-y",
        horizontal: "resize-x",
        both: "resize"
      }
    },
    defaultVariants: {
      size: "md",
      hasError: false,
      resize: "vertical"
    }
  }
);
var Textarea = React.forwardRef(
  ({
    className,
    size,
    hasError,
    resize,
    label,
    hideLabel,
    error,
    helperText,
    maxLength,
    showCount = false,
    autoResize = false,
    id,
    value,
    defaultValue,
    onChange,
    "aria-describedby": ariaDescribedBy,
    ...props
  }, ref) => {
    const internalRef = React.useRef(null);
    const [internalValue, setInternalValue] = React.useState(
      defaultValue || ""
    );
    const generatedId = React.useId();
    const textareaId = id || generatedId;
    const errorId = `${textareaId}-error`;
    const helperId = `${textareaId}-helper`;
    const countId = `${textareaId}-count`;
    React.useImperativeHandle(ref, () => internalRef.current);
    const currentValue = value !== void 0 ? String(value) : internalValue;
    const characterCount = currentValue.length;
    const adjustHeight = React.useCallback(() => {
      const textarea = internalRef.current;
      if (textarea && autoResize) {
        textarea.style.height = "auto";
        textarea.style.height = `${textarea.scrollHeight}px`;
      }
    }, [autoResize]);
    React.useEffect(() => {
      adjustHeight();
    }, [currentValue, adjustHeight]);
    const handleChange = React.useCallback(
      (e) => {
        if (value === void 0) {
          setInternalValue(e.target.value);
        }
        onChange?.(e);
        adjustHeight();
      },
      [value, onChange, adjustHeight]
    );
    const describedByIds = [
      error ? errorId : null,
      helperText ? helperId : null,
      showCount ? countId : null,
      ariaDescribedBy
    ].filter(Boolean).join(" ");
    return /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-1.5", children: [
      label && /* @__PURE__ */ jsx(
        "label",
        {
          htmlFor: textareaId,
          className: cn(
            "text-foreground text-sm font-medium",
            hideLabel && "sr-only"
          ),
          children: label
        }
      ),
      /* @__PURE__ */ jsx(
        "textarea",
        {
          ref: internalRef,
          id: textareaId,
          value,
          defaultValue: value === void 0 ? defaultValue : void 0,
          onChange: handleChange,
          maxLength,
          "aria-invalid": hasError || !!error,
          "aria-describedby": describedByIds || void 0,
          className: cn(
            textareaVariants({
              size,
              hasError: hasError || !!error,
              resize: autoResize ? "none" : resize
            }),
            className
          ),
          ...props
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
          error && /* @__PURE__ */ jsx("p", { id: errorId, className: "text-destructive text-sm", role: "alert", children: error }),
          helperText && !error && /* @__PURE__ */ jsx("p", { id: helperId, className: "text-muted-foreground text-sm", children: helperText })
        ] }),
        showCount && /* @__PURE__ */ jsxs(
          "p",
          {
            id: countId,
            className: cn(
              "text-muted-foreground shrink-0 text-xs",
              maxLength && characterCount >= maxLength && "text-destructive"
            ),
            children: [
              characterCount,
              maxLength && `/${maxLength}`
            ]
          }
        )
      ] })
    ] });
  }
);
Textarea.displayName = "Textarea";

export { Textarea, textareaVariants };
//# sourceMappingURL=chunk-4AWW5WPF.js.map
//# sourceMappingURL=chunk-4AWW5WPF.js.map