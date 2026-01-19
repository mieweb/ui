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

var progressBarTrackVariants = classVarianceAuthority.cva(
  ["w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700"],
  {
    variants: {
      size: {
        sm: "h-1",
        md: "h-2",
        lg: "h-3",
        xl: "h-4"
      }
    },
    defaultVariants: {
      size: "md"
    }
  }
);
var progressBarFillVariants = classVarianceAuthority.cva(
  ["h-full rounded-full transition-all duration-300 ease-out"],
  {
    variants: {
      variant: {
        default: "bg-primary-500",
        success: "bg-green-500",
        warning: "bg-yellow-500",
        danger: "bg-red-500"
      },
      animated: {
        true: "animate-pulse",
        false: ""
      },
      striped: {
        true: [
          "bg-gradient-to-r",
          "from-transparent via-white/20 to-transparent",
          "bg-[length:1rem_100%]",
          "animate-[progress-stripes_1s_linear_infinite]"
        ],
        false: ""
      }
    },
    defaultVariants: {
      variant: "default",
      animated: false,
      striped: false
    }
  }
);
function Progress({
  value,
  max = 100,
  label,
  showValue = false,
  formatValue,
  size,
  variant,
  animated,
  striped,
  className,
  indeterminate = false
}) {
  const percentage = Math.min(Math.max(value / max * 100, 0), 100);
  const progressId = React__namespace.useId();
  const displayValue = formatValue ? formatValue(value, max) : `${Math.round(percentage)}%`;
  return /* @__PURE__ */ jsxRuntime.jsxs("div", { className: chunkOR5DRJCW_cjs.cn("w-full", className), children: [
    (label || showValue) && /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "mb-1.5 flex items-center justify-between", children: [
      label && /* @__PURE__ */ jsxRuntime.jsx(
        "label",
        {
          id: `${progressId}-label`,
          className: "text-foreground text-sm font-medium",
          children: label
        }
      ),
      showValue && !indeterminate && /* @__PURE__ */ jsxRuntime.jsx("span", { className: "text-muted-foreground text-sm", children: displayValue })
    ] }),
    /* @__PURE__ */ jsxRuntime.jsx(
      "div",
      {
        role: "progressbar",
        "aria-valuenow": indeterminate ? void 0 : value,
        "aria-valuemin": 0,
        "aria-valuemax": max,
        "aria-labelledby": label ? `${progressId}-label` : void 0,
        "aria-label": !label ? "Progress" : void 0,
        className: chunkOR5DRJCW_cjs.cn(progressBarTrackVariants({ size })),
        children: /* @__PURE__ */ jsxRuntime.jsx(
          "div",
          {
            className: chunkOR5DRJCW_cjs.cn(
              progressBarFillVariants({ variant, animated, striped }),
              indeterminate && "w-1/3 animate-[indeterminate_1.5s_ease-in-out_infinite]",
              !striped && variant === "default" && "bg-primary-500",
              !striped && variant === "success" && "bg-green-500",
              !striped && variant === "warning" && "bg-yellow-500",
              !striped && variant === "danger" && "bg-red-500"
            ),
            style: indeterminate ? void 0 : { width: `${percentage}%` }
          }
        )
      }
    )
  ] });
}
Progress.displayName = "Progress";
var circularProgressVariants = classVarianceAuthority.cva(["relative inline-flex"], {
  variants: {
    size: {
      sm: "h-8 w-8",
      md: "h-12 w-12",
      lg: "h-16 w-16",
      xl: "h-24 w-24"
    }
  },
  defaultVariants: {
    size: "md"
  }
});
function CircularProgress({
  value,
  max = 100,
  variant = "default",
  size,
  strokeWidth = 4,
  showValue = false,
  indeterminate = false,
  className
}) {
  const percentage = Math.min(Math.max(value / max * 100, 0), 100);
  const sizeMap = { sm: 32, md: 48, lg: 64, xl: 96 };
  const svgSize = sizeMap[size || "md"];
  const radius = (svgSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - percentage / 100 * circumference;
  const variantColors = {
    default: "stroke-primary-500",
    success: "stroke-green-500",
    warning: "stroke-yellow-500",
    danger: "stroke-red-500"
  };
  return /* @__PURE__ */ jsxRuntime.jsxs(
    "div",
    {
      role: "progressbar",
      "aria-valuenow": indeterminate ? void 0 : value,
      "aria-valuemin": 0,
      "aria-valuemax": max,
      "aria-label": "Progress",
      className: chunkOR5DRJCW_cjs.cn(circularProgressVariants({ size }), className),
      children: [
        /* @__PURE__ */ jsxRuntime.jsxs(
          "svg",
          {
            className: chunkOR5DRJCW_cjs.cn("-rotate-90 transform", indeterminate && "animate-spin"),
            width: svgSize,
            height: svgSize,
            children: [
              /* @__PURE__ */ jsxRuntime.jsx(
                "circle",
                {
                  className: "stroke-neutral-200 dark:stroke-neutral-700",
                  fill: "none",
                  strokeWidth,
                  cx: svgSize / 2,
                  cy: svgSize / 2,
                  r: radius
                }
              ),
              /* @__PURE__ */ jsxRuntime.jsx(
                "circle",
                {
                  className: chunkOR5DRJCW_cjs.cn(
                    variantColors[variant],
                    "transition-all duration-300 ease-out"
                  ),
                  fill: "none",
                  strokeWidth,
                  strokeLinecap: "round",
                  cx: svgSize / 2,
                  cy: svgSize / 2,
                  r: radius,
                  strokeDasharray: circumference,
                  strokeDashoffset: indeterminate ? circumference * 0.75 : offset
                }
              )
            ]
          }
        ),
        showValue && !indeterminate && /* @__PURE__ */ jsxRuntime.jsxs("span", { className: "text-foreground absolute inset-0 flex items-center justify-center text-xs font-medium", children: [
          Math.round(percentage),
          "%"
        ] })
      ]
    }
  );
}
CircularProgress.displayName = "CircularProgress";

exports.CircularProgress = CircularProgress;
exports.Progress = Progress;
exports.circularProgressVariants = circularProgressVariants;
exports.progressBarFillVariants = progressBarFillVariants;
exports.progressBarTrackVariants = progressBarTrackVariants;
//# sourceMappingURL=chunk-NAATBUHR.cjs.map
//# sourceMappingURL=chunk-NAATBUHR.cjs.map