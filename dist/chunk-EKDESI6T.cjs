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

var switchTrackVariants = classVarianceAuthority.cva(
  [
    "relative inline-flex shrink-0",
    "cursor-pointer rounded-full",
    "transition-colors duration-200 ease-in-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:cursor-not-allowed disabled:opacity-50",
    "bg-neutral-200 dark:bg-neutral-700",
    "data-[state=checked]:bg-primary-500"
  ],
  {
    variants: {
      size: {
        sm: "h-5 w-9",
        md: "h-6 w-11",
        lg: "h-7 w-14"
      }
    },
    defaultVariants: {
      size: "md"
    }
  }
);
var switchThumbVariants = classVarianceAuthority.cva(
  [
    "pointer-events-none inline-block rounded-full",
    "bg-white shadow-lg",
    "ring-0 transition-transform duration-200 ease-in-out"
  ],
  {
    variants: {
      size: {
        sm: "h-4 w-4 data-[state=checked]:translate-x-4 translate-x-0.5",
        md: "h-5 w-5 data-[state=checked]:translate-x-5 translate-x-0.5",
        lg: "h-6 w-6 data-[state=checked]:translate-x-7 translate-x-0.5"
      }
    },
    defaultVariants: {
      size: "md"
    }
  }
);
var Switch = React__namespace.forwardRef(
  ({
    className,
    size,
    checked: controlledChecked,
    defaultChecked = false,
    onCheckedChange,
    label,
    description,
    labelPosition = "right",
    disabled,
    id,
    ...props
  }, ref) => {
    const [uncontrolledChecked, setUncontrolledChecked] = React__namespace.useState(defaultChecked);
    const generatedId = React__namespace.useId();
    const switchId = id || generatedId;
    const descriptionId = `${switchId}-description`;
    const isControlled = controlledChecked !== void 0;
    const isChecked = isControlled ? controlledChecked : uncontrolledChecked;
    const handleToggle = React__namespace.useCallback(() => {
      if (disabled) return;
      const newValue = !isChecked;
      if (!isControlled) {
        setUncontrolledChecked(newValue);
      }
      onCheckedChange?.(newValue);
    }, [disabled, isChecked, isControlled, onCheckedChange]);
    const handleKeyDown = React__namespace.useCallback(
      (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleToggle();
        }
      },
      [handleToggle]
    );
    const switchElement = /* @__PURE__ */ jsxRuntime.jsx(
      "button",
      {
        ref,
        id: switchId,
        type: "button",
        role: "switch",
        "aria-checked": isChecked,
        "aria-describedby": description ? descriptionId : void 0,
        "data-state": isChecked ? "checked" : "unchecked",
        disabled,
        onClick: handleToggle,
        onKeyDown: handleKeyDown,
        className: chunkOR5DRJCW_cjs.cn(switchTrackVariants({ size }), "items-center", className),
        ...props,
        children: /* @__PURE__ */ jsxRuntime.jsx(
          "span",
          {
            "data-state": isChecked ? "checked" : "unchecked",
            className: switchThumbVariants({ size })
          }
        )
      }
    );
    const labelSizeClasses = {
      sm: "text-xs",
      md: "text-sm",
      lg: "text-base"
    };
    const descriptionSizeClasses = {
      sm: "text-[10px]",
      md: "text-xs",
      lg: "text-sm"
    };
    const labelElement = label && /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex flex-col gap-0.5", children: [
      /* @__PURE__ */ jsxRuntime.jsx(
        "label",
        {
          htmlFor: switchId,
          className: chunkOR5DRJCW_cjs.cn(
            "text-foreground cursor-pointer font-medium select-none",
            labelSizeClasses[size || "md"],
            disabled && "cursor-not-allowed opacity-50"
          ),
          children: label
        }
      ),
      description && /* @__PURE__ */ jsxRuntime.jsx("p", { id: descriptionId, className: chunkOR5DRJCW_cjs.cn("text-muted-foreground", descriptionSizeClasses[size || "md"]), children: description })
    ] });
    return /* @__PURE__ */ jsxRuntime.jsxs(
      "div",
      {
        className: chunkOR5DRJCW_cjs.cn(
          "flex items-center gap-3",
          labelPosition === "left" && "flex-row-reverse"
        ),
        children: [
          switchElement,
          labelElement
        ]
      }
    );
  }
);
Switch.displayName = "Switch";

exports.Switch = Switch;
exports.switchThumbVariants = switchThumbVariants;
exports.switchTrackVariants = switchTrackVariants;
//# sourceMappingURL=chunk-EKDESI6T.cjs.map
//# sourceMappingURL=chunk-EKDESI6T.cjs.map