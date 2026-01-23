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
        default: "bg-primary-100 text-primary-900 dark:bg-primary-900 dark:text-primary-100",
        secondary: "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100",
        success: "bg-green-100 text-green-900 dark:bg-green-900 dark:text-green-100",
        warning: "bg-yellow-100 text-yellow-900 dark:bg-yellow-900 dark:text-yellow-100",
        danger: "bg-red-100 text-red-900 dark:bg-red-900 dark:text-red-100",
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
//# sourceMappingURL=chunk-3NJ72QU6.js.map
//# sourceMappingURL=chunk-3NJ72QU6.js.map