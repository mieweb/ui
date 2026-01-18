import { useClickOutside, useEscapeKey } from './chunk-XMYVC7TT.js';
import { cn } from './chunk-F3SOEIN2.js';
import * as React from 'react';
import { jsxs, jsx } from 'react/jsx-runtime';

var placementStyles = {
  "bottom-start": "top-full left-0 mt-1",
  "bottom-end": "top-full right-0 mt-1",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-1"
};
function Dropdown({
  trigger,
  children,
  open: controlledOpen,
  onOpenChange,
  placement = "bottom-start",
  className,
  disabled = false
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const containerRef = React.useRef(null);
  const menuId = React.useId();
  const isControlled = controlledOpen !== void 0;
  const isOpen = isControlled ? controlledOpen : uncontrolledOpen;
  const setOpen = React.useCallback(
    (value) => {
      if (!isControlled) {
        setUncontrolledOpen(value);
      }
      onOpenChange?.(value);
    },
    [isControlled, onOpenChange]
  );
  const handleToggle = React.useCallback(() => {
    if (!disabled) {
      setOpen(!isOpen);
    }
  }, [disabled, isOpen, setOpen]);
  const handleClose = React.useCallback(() => {
    setOpen(false);
  }, [setOpen]);
  useClickOutside(containerRef, handleClose);
  useEscapeKey(handleClose, isOpen);
  const triggerElement = React.cloneElement(trigger, {
    onClick: handleToggle,
    "aria-haspopup": "menu",
    "aria-expanded": isOpen,
    "aria-controls": isOpen ? menuId : void 0,
    disabled: disabled || trigger.props.disabled
  });
  return /* @__PURE__ */ jsxs("div", { ref: containerRef, className: "relative inline-flex", children: [
    triggerElement,
    isOpen && /* @__PURE__ */ jsx(
      "div",
      {
        id: menuId,
        role: "menu",
        className: cn(
          "absolute z-50 min-w-[8rem] py-1",
          "bg-card border-border rounded-lg border shadow-lg",
          "animate-scale-in",
          placementStyles[placement],
          className
        ),
        children
      }
    )
  ] });
}
Dropdown.displayName = "Dropdown";
var DropdownItem = React.forwardRef(
  ({ className, icon, variant = "default", children, ...props }, ref) => {
    return /* @__PURE__ */ jsxs(
      "button",
      {
        ref,
        role: "menuitem",
        className: cn(
          "flex w-full items-center gap-2 px-3 py-2 text-left text-sm",
          "transition-colors duration-150",
          "focus:bg-muted focus:outline-none",
          variant === "default" && ["text-foreground", "hover:bg-muted"],
          variant === "danger" && [
            "text-destructive",
            "hover:bg-destructive/10"
          ],
          className
        ),
        ...props,
        children: [
          icon && /* @__PURE__ */ jsx("span", { className: "h-4 w-4 shrink-0", children: icon }),
          children
        ]
      }
    );
  }
);
DropdownItem.displayName = "DropdownItem";
function DropdownSeparator({ className }) {
  return /* @__PURE__ */ jsx("hr", { className: cn("border-border my-1 border-t", className) });
}
DropdownSeparator.displayName = "DropdownSeparator";
function DropdownLabel({
  className,
  children
}) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: cn(
        "text-muted-foreground px-3 py-1.5 text-xs font-semibold tracking-wider uppercase",
        className
      ),
      children
    }
  );
}
DropdownLabel.displayName = "DropdownLabel";

export { Dropdown, DropdownItem, DropdownLabel, DropdownSeparator };
//# sourceMappingURL=chunk-4VQ56QHO.js.map
//# sourceMappingURL=chunk-4VQ56QHO.js.map