import { cn } from './chunk-F3SOEIN2.js';
import * as React from 'react';
import { cva } from 'class-variance-authority';
import { jsxs, jsx } from 'react/jsx-runtime';

var badgeVariants = cva(
  [
    "inline-flex items-center justify-center",
    "font-medium",
    "rounded-full",
    "transition-colors duration-150"
  ],
  {
    variants: {
      variant: {
        default: "bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200",
        secondary: "bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200",
        success: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
        warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
        danger: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
        outline: "border border-current bg-transparent"
      },
      size: {
        sm: "px-2 py-0.5 text-xs",
        md: "px-2.5 py-0.5 text-sm",
        lg: "px-3 py-1 text-base"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "md"
    }
  }
);
var Badge = React.forwardRef(
  ({ className, variant, size, icon, children, ...props }, ref) => {
    return /* @__PURE__ */ jsxs(
      "span",
      {
        ref,
        className: cn(badgeVariants({ variant, size }), className),
        ...props,
        children: [
          icon && /* @__PURE__ */ jsx("span", { className: "mr-1 shrink-0", children: icon }),
          children
        ]
      }
    );
  }
);
Badge.displayName = "Badge";

export { Badge, badgeVariants };
//# sourceMappingURL=chunk-H7OGAIAK.js.map
//# sourceMappingURL=chunk-H7OGAIAK.js.map