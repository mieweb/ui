import { cn } from './chunk-F3SOEIN2.js';
import * as React from 'react';
import { cva } from 'class-variance-authority';
import { jsx } from 'react/jsx-runtime';

var textVariants = cva("", {
  variants: {
    variant: {
      default: "text-foreground",
      muted: "text-muted-foreground",
      primary: "text-primary-600 dark:text-primary-400",
      destructive: "text-destructive",
      success: "text-success",
      warning: "text-warning"
    },
    size: {
      xs: "text-xs",
      sm: "text-sm",
      base: "text-base",
      lg: "text-lg",
      xl: "text-xl",
      "2xl": "text-2xl",
      "3xl": "text-3xl"
    },
    weight: {
      normal: "font-normal",
      medium: "font-medium",
      semibold: "font-semibold",
      bold: "font-bold"
    },
    align: {
      left: "text-left",
      center: "text-center",
      right: "text-right"
    }
  },
  defaultVariants: {
    variant: "default",
    size: "base",
    weight: "normal",
    align: "left"
  }
});
var Text = React.forwardRef(
  ({
    className,
    variant,
    size,
    weight,
    align,
    as: Component = "p",
    truncate,
    ...props
  }, ref) => {
    return /* @__PURE__ */ jsx(
      Component,
      {
        ref,
        className: cn(
          textVariants({ variant, size, weight, align }),
          truncate && "truncate",
          className
        ),
        ...props
      }
    );
  }
);
Text.displayName = "Text";
var SmallMuted = React.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsx(Text, { ref, variant: "muted", size: "sm", className, ...props })
);
SmallMuted.displayName = "SmallMuted";

export { SmallMuted, Text, textVariants };
//# sourceMappingURL=chunk-4DZBLEOX.js.map
//# sourceMappingURL=chunk-4DZBLEOX.js.map