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

var checkboxVariants = classVarianceAuthority.cva(
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
var Checkbox = React__namespace.forwardRef(
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
    const internalRef = React__namespace.useRef(null);
    const generatedId = React__namespace.useId();
    const checkboxId = id || generatedId;
    const descriptionId = `${checkboxId}-description`;
    const errorId = `${checkboxId}-error`;
    React__namespace.useEffect(() => {
      const checkbox = internalRef.current;
      if (checkbox) {
        checkbox.indeterminate = indeterminate;
      }
    }, [indeterminate]);
    React__namespace.useImperativeHandle(ref, () => internalRef.current);
    const checkboxElement = /* @__PURE__ */ jsxRuntime.jsxs("span", { className: "relative inline-flex items-center justify-center", children: [
      /* @__PURE__ */ jsxRuntime.jsx(
        "input",
        {
          ref: internalRef,
          id: checkboxId,
          type: "checkbox",
          disabled,
          "aria-describedby": [description ? descriptionId : null, error ? errorId : null].filter(Boolean).join(" ") || void 0,
          "aria-invalid": !!error,
          className: chunkOR5DRJCW_cjs.cn(checkboxVariants({ size }), className),
          ...props
        }
      ),
      /* @__PURE__ */ jsxRuntime.jsx(
        CheckIcon,
        {
          size,
          className: "pointer-events-none absolute text-white opacity-0 peer-checked:opacity-100"
        }
      )
    ] });
    const labelElement = label && /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex flex-col gap-0.5", children: [
      /* @__PURE__ */ jsxRuntime.jsx(
        "label",
        {
          htmlFor: checkboxId,
          className: chunkOR5DRJCW_cjs.cn(
            "text-foreground cursor-pointer text-sm font-medium select-none",
            disabled && "cursor-not-allowed opacity-50"
          ),
          children: label
        }
      ),
      description && /* @__PURE__ */ jsxRuntime.jsx("p", { id: descriptionId, className: "text-muted-foreground text-xs", children: description })
    ] });
    return /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex flex-col gap-1", children: [
      /* @__PURE__ */ jsxRuntime.jsxs(
        "div",
        {
          className: chunkOR5DRJCW_cjs.cn(
            "flex items-start gap-3",
            labelPosition === "left" && "flex-row-reverse"
          ),
          children: [
            checkboxElement,
            labelElement
          ]
        }
      ),
      error && /* @__PURE__ */ jsxRuntime.jsx("p", { id: errorId, className: "text-destructive text-sm", role: "alert", children: error })
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
  const groupId = React__namespace.useId();
  const descriptionId = `${groupId}-description`;
  const errorId = `${groupId}-error`;
  return /* @__PURE__ */ jsxRuntime.jsxs(
    "fieldset",
    {
      className: chunkOR5DRJCW_cjs.cn("flex flex-col gap-2", className),
      "aria-describedby": [description ? descriptionId : null, error ? errorId : null].filter(Boolean).join(" ") || void 0,
      children: [
        label && /* @__PURE__ */ jsxRuntime.jsx("legend", { className: "text-foreground text-sm font-medium", children: label }),
        description && /* @__PURE__ */ jsxRuntime.jsx("p", { id: descriptionId, className: "text-muted-foreground text-xs", children: description }),
        /* @__PURE__ */ jsxRuntime.jsx(
          "div",
          {
            role: "group",
            className: chunkOR5DRJCW_cjs.cn(
              "flex gap-4",
              orientation === "vertical" && "flex-col gap-3"
            ),
            children
          }
        ),
        error && /* @__PURE__ */ jsxRuntime.jsx("p", { id: errorId, className: "text-destructive text-sm", role: "alert", children: error })
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
  return /* @__PURE__ */ jsxRuntime.jsx(
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
      children: /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M20 6 9 17l-5-5" })
    }
  );
}

exports.Checkbox = Checkbox;
exports.CheckboxGroup = CheckboxGroup;
exports.checkboxVariants = checkboxVariants;
//# sourceMappingURL=chunk-L7TTMKLJ.cjs.map
//# sourceMappingURL=chunk-L7TTMKLJ.cjs.map