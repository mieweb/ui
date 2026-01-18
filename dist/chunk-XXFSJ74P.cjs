'use strict';

var chunkJ4XHETCY_cjs = require('./chunk-J4XHETCY.cjs');
var chunkOR5DRJCW_cjs = require('./chunk-OR5DRJCW.cjs');
var React = require('react');
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
  const [uncontrolledOpen, setUncontrolledOpen] = React__namespace.useState(false);
  const containerRef = React__namespace.useRef(null);
  const menuId = React__namespace.useId();
  const isControlled = controlledOpen !== void 0;
  const isOpen = isControlled ? controlledOpen : uncontrolledOpen;
  const setOpen = React__namespace.useCallback(
    (value) => {
      if (!isControlled) {
        setUncontrolledOpen(value);
      }
      onOpenChange?.(value);
    },
    [isControlled, onOpenChange]
  );
  const handleToggle = React__namespace.useCallback(() => {
    if (!disabled) {
      setOpen(!isOpen);
    }
  }, [disabled, isOpen, setOpen]);
  const handleClose = React__namespace.useCallback(() => {
    setOpen(false);
  }, [setOpen]);
  chunkJ4XHETCY_cjs.useClickOutside(containerRef, handleClose);
  chunkJ4XHETCY_cjs.useEscapeKey(handleClose, isOpen);
  const triggerElement = React__namespace.cloneElement(trigger, {
    onClick: handleToggle,
    "aria-haspopup": "menu",
    "aria-expanded": isOpen,
    "aria-controls": isOpen ? menuId : void 0,
    disabled: disabled || trigger.props.disabled
  });
  return /* @__PURE__ */ jsxRuntime.jsxs("div", { ref: containerRef, className: "relative inline-flex", children: [
    triggerElement,
    isOpen && /* @__PURE__ */ jsxRuntime.jsx(
      "div",
      {
        id: menuId,
        role: "menu",
        className: chunkOR5DRJCW_cjs.cn(
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
var DropdownItem = React__namespace.forwardRef(
  ({ className, icon, variant = "default", children, ...props }, ref) => {
    return /* @__PURE__ */ jsxRuntime.jsxs(
      "button",
      {
        ref,
        role: "menuitem",
        className: chunkOR5DRJCW_cjs.cn(
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
          icon && /* @__PURE__ */ jsxRuntime.jsx("span", { className: "h-4 w-4 shrink-0", children: icon }),
          children
        ]
      }
    );
  }
);
DropdownItem.displayName = "DropdownItem";
function DropdownSeparator({ className }) {
  return /* @__PURE__ */ jsxRuntime.jsx("hr", { className: chunkOR5DRJCW_cjs.cn("border-border my-1 border-t", className) });
}
DropdownSeparator.displayName = "DropdownSeparator";
function DropdownLabel({
  className,
  children
}) {
  return /* @__PURE__ */ jsxRuntime.jsx(
    "div",
    {
      className: chunkOR5DRJCW_cjs.cn(
        "text-muted-foreground px-3 py-1.5 text-xs font-semibold tracking-wider uppercase",
        className
      ),
      children
    }
  );
}
DropdownLabel.displayName = "DropdownLabel";

exports.Dropdown = Dropdown;
exports.DropdownItem = DropdownItem;
exports.DropdownLabel = DropdownLabel;
exports.DropdownSeparator = DropdownSeparator;
//# sourceMappingURL=chunk-XXFSJ74P.cjs.map
//# sourceMappingURL=chunk-XXFSJ74P.cjs.map