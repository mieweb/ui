import { cn } from './chunk-F3SOEIN2.js';
import * as React from 'react';
import { cva } from 'class-variance-authority';
import { jsxs, jsx } from 'react/jsx-runtime';

var progressBarTrackVariants = cva(
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
var progressBarFillVariants = cva(
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
  const progressId = React.useId();
  const displayValue = formatValue ? formatValue(value, max) : `${Math.round(percentage)}%`;
  return /* @__PURE__ */ jsxs("div", { className: cn("w-full", className), children: [
    (label || showValue) && /* @__PURE__ */ jsxs("div", { className: "mb-1.5 flex items-center justify-between", children: [
      label && /* @__PURE__ */ jsx(
        "label",
        {
          id: `${progressId}-label`,
          className: "text-foreground text-sm font-medium",
          children: label
        }
      ),
      showValue && !indeterminate && /* @__PURE__ */ jsx("span", { className: "text-muted-foreground text-sm", children: displayValue })
    ] }),
    /* @__PURE__ */ jsx(
      "div",
      {
        role: "progressbar",
        "aria-valuenow": indeterminate ? void 0 : value,
        "aria-valuemin": 0,
        "aria-valuemax": max,
        "aria-labelledby": label ? `${progressId}-label` : void 0,
        "aria-label": !label ? "Progress" : void 0,
        className: cn(progressBarTrackVariants({ size })),
        children: /* @__PURE__ */ jsx(
          "div",
          {
            className: cn(
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
var circularProgressVariants = cva(["relative inline-flex"], {
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
  return /* @__PURE__ */ jsxs(
    "div",
    {
      role: "progressbar",
      "aria-valuenow": indeterminate ? void 0 : value,
      "aria-valuemin": 0,
      "aria-valuemax": max,
      "aria-label": "Progress",
      className: cn(circularProgressVariants({ size }), className),
      children: [
        /* @__PURE__ */ jsxs(
          "svg",
          {
            className: cn("-rotate-90 transform", indeterminate && "animate-spin"),
            width: svgSize,
            height: svgSize,
            children: [
              /* @__PURE__ */ jsx(
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
              /* @__PURE__ */ jsx(
                "circle",
                {
                  className: cn(
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
        showValue && !indeterminate && /* @__PURE__ */ jsxs("span", { className: "text-foreground absolute inset-0 flex items-center justify-center text-xs font-medium", children: [
          Math.round(percentage),
          "%"
        ] })
      ]
    }
  );
}
CircularProgress.displayName = "CircularProgress";

export { CircularProgress, Progress, circularProgressVariants, progressBarFillVariants, progressBarTrackVariants };
//# sourceMappingURL=chunk-4MHTSFPX.js.map
//# sourceMappingURL=chunk-4MHTSFPX.js.map