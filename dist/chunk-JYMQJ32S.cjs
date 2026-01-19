'use strict';

var chunkOR5DRJCW_cjs = require('./chunk-OR5DRJCW.cjs');
var classVarianceAuthority = require('class-variance-authority');
var jsxRuntime = require('react/jsx-runtime');

var spinnerVariants = classVarianceAuthority.cva(
  ["animate-spin rounded-full border-2 border-current border-t-transparent"],
  {
    variants: {
      size: {
        xs: "h-3 w-3",
        sm: "h-4 w-4",
        md: "h-6 w-6",
        lg: "h-8 w-8",
        xl: "h-12 w-12"
      },
      variant: {
        default: "text-primary-500",
        muted: "text-muted-foreground",
        white: "text-white"
      }
    },
    defaultVariants: {
      size: "md",
      variant: "default"
    }
  }
);
function Spinner({
  className,
  size,
  variant,
  label = "Loading",
  ...props
}) {
  return /* @__PURE__ */ jsxRuntime.jsx(
    "div",
    {
      role: "status",
      "aria-label": label,
      className: chunkOR5DRJCW_cjs.cn(spinnerVariants({ size, variant }), className),
      ...props,
      children: /* @__PURE__ */ jsxRuntime.jsx("span", { className: "sr-only", children: label })
    }
  );
}
Spinner.displayName = "Spinner";
function SpinnerWithLabel({
  label,
  labelPosition = "bottom",
  size,
  variant,
  className,
  ...props
}) {
  const positionClasses = {
    top: "flex-col-reverse",
    bottom: "flex-col",
    left: "flex-row-reverse",
    right: "flex-row"
  };
  return /* @__PURE__ */ jsxRuntime.jsxs(
    "div",
    {
      role: "status",
      "aria-label": label,
      className: chunkOR5DRJCW_cjs.cn(
        "inline-flex items-center justify-center gap-2",
        positionClasses[labelPosition],
        className
      ),
      ...props,
      children: [
        /* @__PURE__ */ jsxRuntime.jsx(
          "div",
          {
            className: chunkOR5DRJCW_cjs.cn(spinnerVariants({ size, variant })),
            "aria-hidden": "true"
          }
        ),
        /* @__PURE__ */ jsxRuntime.jsx("span", { className: "text-muted-foreground text-sm", children: label })
      ]
    }
  );
}
SpinnerWithLabel.displayName = "SpinnerWithLabel";
function FullPageSpinner({
  backdrop = true,
  text,
  size = "xl",
  ...props
}) {
  return /* @__PURE__ */ jsxRuntime.jsxs(
    "div",
    {
      className: chunkOR5DRJCW_cjs.cn(
        "fixed inset-0 z-50 flex flex-col items-center justify-center gap-4",
        backdrop && "bg-background/80 backdrop-blur-sm"
      ),
      children: [
        /* @__PURE__ */ jsxRuntime.jsx(Spinner, { size, ...props }),
        text && /* @__PURE__ */ jsxRuntime.jsx("p", { className: "text-muted-foreground text-sm", children: text })
      ]
    }
  );
}
FullPageSpinner.displayName = "FullPageSpinner";

exports.FullPageSpinner = FullPageSpinner;
exports.Spinner = Spinner;
exports.SpinnerWithLabel = SpinnerWithLabel;
exports.spinnerVariants = spinnerVariants;
//# sourceMappingURL=chunk-JYMQJ32S.cjs.map
//# sourceMappingURL=chunk-JYMQJ32S.cjs.map