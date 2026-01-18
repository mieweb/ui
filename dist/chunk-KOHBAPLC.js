import { cn } from './chunk-F3SOEIN2.js';
import * as React from 'react';
import { cva } from 'class-variance-authority';
import { jsxs, jsx } from 'react/jsx-runtime';

var alertVariants = cva(
  [
    "relative w-full rounded-lg border p-4",
    "[&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-current",
    "[&>svg+div]:translate-y-[-3px]",
    "[&:has(svg)]:pl-11"
  ],
  {
    variants: {
      variant: {
        default: "bg-background text-foreground border-border",
        info: "bg-primary-50 text-primary-900 border-primary-200 dark:bg-primary-950 dark:text-primary-100 dark:border-primary-800",
        success: "bg-green-50 text-green-900 border-green-200 dark:bg-green-950 dark:text-green-100 dark:border-green-800",
        warning: "bg-yellow-50 text-yellow-900 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-100 dark:border-yellow-800",
        danger: "bg-red-50 text-red-900 border-red-200 dark:bg-red-950 dark:text-red-100 dark:border-red-800"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);
var Alert = React.forwardRef(
  ({ className, variant, icon, children, ...props }, ref) => {
    return /* @__PURE__ */ jsxs(
      "div",
      {
        ref,
        role: "alert",
        className: cn(alertVariants({ variant }), className),
        ...props,
        children: [
          icon,
          /* @__PURE__ */ jsx("div", { children })
        ]
      }
    );
  }
);
Alert.displayName = "Alert";
var AlertTitle = React.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsx(
  "h5",
  {
    ref,
    className: cn("mb-1 leading-none font-semibold tracking-tight", className),
    ...props,
    children
  }
));
AlertTitle.displayName = "AlertTitle";
var AlertDescription = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  "p",
  {
    ref,
    className: cn("text-sm [&_p]:leading-relaxed", className),
    ...props
  }
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertDescription, AlertTitle, alertVariants };
//# sourceMappingURL=chunk-KOHBAPLC.js.map
//# sourceMappingURL=chunk-KOHBAPLC.js.map