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

var inputVariants = classVarianceAuthority.cva(
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
var Input = React__namespace.forwardRef(
  ({
    className,
    size,
    hasError,
    error,
    helperText,
    label,
    hideLabel,
    id,
    "aria-describedby": ariaDescribedBy,
    ...props
  }, ref) => {
    const generatedId = React__namespace.useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;
    const describedByIds = [
      error ? errorId : null,
      helperText ? helperId : null,
      ariaDescribedBy
    ].filter(Boolean).join(" ");
    return /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex flex-col gap-1.5", children: [
      label && /* @__PURE__ */ jsxRuntime.jsx(
        "label",
        {
          htmlFor: inputId,
          className: chunkOR5DRJCW_cjs.cn(
            "text-foreground text-sm font-medium",
            hideLabel && "sr-only"
          ),
          children: label
        }
      ),
      /* @__PURE__ */ jsxRuntime.jsx(
        "input",
        {
          id: inputId,
          ref,
          className: chunkOR5DRJCW_cjs.cn(
            inputVariants({ size, hasError: hasError || !!error }),
            className
          ),
          "aria-invalid": hasError || !!error,
          "aria-describedby": describedByIds || void 0,
          ...props
        }
      ),
      error && /* @__PURE__ */ jsxRuntime.jsx("p", { id: errorId, className: "text-destructive text-sm", role: "alert", children: error }),
      helperText && !error && /* @__PURE__ */ jsxRuntime.jsx("p", { id: helperId, className: "text-muted-foreground text-sm", children: helperText })
    ] });
  }
);
Input.displayName = "Input";

exports.Input = Input;
exports.inputVariants = inputVariants;
//# sourceMappingURL=chunk-DQTQ4AQQ.cjs.map
//# sourceMappingURL=chunk-DQTQ4AQQ.cjs.map